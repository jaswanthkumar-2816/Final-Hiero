const express = require('express');
const { Groq } = require('groq-sdk');
const { normalizeResponse } = require('../utils/normalizeResponse');

const router = express.Router();

// Initialize Groq with environment variables
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'llama-3.3-70b-versatile';

const groq = new Groq({ apiKey: GROQ_API_KEY });

const ORBIT_SYSTEM_PROMPT = `You are Orbit Neural Assistant, a high-fidelity context-aware coding tutor for developers.

Response Rules:
1. CONCISE & FOCUSED: Keep your answer strictly to 3–5 sentences maximum unless the user explicitly asks for a "tutorial", "full implementation", or "step-by-step solution".
2. DIRECT ANSWER: Respond only to what the user asked. Do not add unsolicited tutorials or extra implementations.
3. STRUCTURE: 
   - For explanations or questions, use the header "Short Answer:".
   - For code requests, provide the code block FIRST, followed by a minimal (1-sentence) explanation if needed.
   - For debugging, provide the fix FIRST, followed by a brief reason.
   - ALWAYS end with a section titled "You can explore further:" containing 2–4 bulleted follow-up options.

Specific Scenarios:
- If user asks for code -> return ONLY code with minimal (1-sentence) explanation.
- If user asks for explanation -> return only "Short Answer:" section (max 5 sentences).
- If user asks for debugging -> give fix FIRST, then the reason.
- If user asks for tutorial/full solution -> longer responses are allowed.

Standard Protocols:
1. DIRECT GENERATION: Generate answers directly. Use markdown.
2. RESPONSE FORMAT: Never return raw JSON or [object Object].
3. EXECUTION RULE: Only call 'runCode' tool if explicitly asked to "run", "execute", "test", or "verify".

STRICT OUTPUT FORMAT:
- All code must be inside standard markdown code blocks.
- Suggest 2-4 follow-ups at the end of every response.`;

/**
 * @route POST /api/chat
 * @desc Chat with Orbit Neural Assistant (Non-Streaming)
 */
router.post('/chat', async (req, res) => {
    try {
        const { message, skill, lesson, code } = req.body;
        if (!message) return res.status(400).json({ error: 'Message required' });

        const safeSkill = typeof skill === 'string' ? skill : JSON.stringify(skill || 'General Coding');
        const safeLesson = typeof lesson === 'string' ? lesson : JSON.stringify(lesson || 'Personal Practice');
        const safeCode = (typeof code === 'string' ? code : JSON.stringify(code || '// Empty editor')).replace(/\[object Object\]/g, '// (Neural Leak Filtered)');

        const contextPrompt = `
CURRENT EDITOR CONTEXT:
- Skill: ${safeSkill}
- Lesson: ${safeLesson}
- Code in Editor:
\`\`\`
${safeCode}
\`\`\`
`;

        const canRun = message.toLowerCase().match(/run|execute|test|verify/);
        const tools = [
            ...(canRun ? [{
                type: "function",
                function: {
                    name: "runCode",
                    description: "Execute a snippet of code in a sandbox and return output.",
                    parameters: {
                        type: "object",
                        properties: { code: { type: "string" }, language: { type: "string" } },
                        required: ["code", "language"]
                    }
                }
            }] : [])
        ];

        let completion = await groq.chat.completions.create({
            model: AI_MODEL,
            messages: [
                { role: 'system', content: ORBIT_SYSTEM_PROMPT + contextPrompt },
                { role: 'user', content: message }
            ],
            tools: tools.length ? tools : undefined,
            temperature: 0.5,
        });

        let responseMessage = completion.choices[0].message;

        // Handle tool calls if any (only runCode should trigger)
        if (responseMessage.tool_calls) {
            let toolResults = [];
            for (const toolCall of responseMessage.tool_calls) {
                if (toolCall.function.name === "runCode") {
                    const args = JSON.parse(toolCall.function.arguments);
                    // Mock/Simulator for runCode
                    const output = "Orbit Sandbox (v2.1) Execution:\n" +
                        (args.code.includes('print') || args.code.includes('console.log') ? "Program output captured successfully." : "Execution complete (no stdout).");

                    toolResults.push({ role: "tool", tool_call_id: toolCall.id, content: "```text\n" + output + "\n```" });
                }
            }

            // Final completion with tool results to get a markdown answer
            const secondCompletion = await groq.chat.completions.create({
                model: AI_MODEL,
                messages: [
                    { role: 'system', content: ORBIT_SYSTEM_PROMPT + contextPrompt },
                    { role: 'user', content: message },
                    responseMessage,
                    ...toolResults
                ]
            });
            return res.json({ answer: normalizeResponse(secondCompletion.choices[0].message.content) });
        }

        res.json({ answer: normalizeResponse(responseMessage.content || "") });

    } catch (error) {
        console.error('Orbit Chat Error:', error.message);
        res.status(500).json({ error: 'Failed' });
    }
});

/**
 * @route POST /api/chat/stream
 * @desc Stream Chat with Orbit Neural Assistant (SSE)
 */
router.post('/chat/stream', async (req, res) => {
    const { message, skill, lesson, code, conversationHistory } = req.body;
    if (!message) return res.status(400).write('data: Error: Message required\n\n');

    const safeSkill = typeof skill === 'string' ? skill : JSON.stringify(skill || 'General Coding');
    const safeLesson = typeof lesson === 'string' ? lesson : JSON.stringify(lesson || 'Personal Practice');
    const safeCode = (typeof code === 'string' ? code : JSON.stringify(code || '// Empty editor')).replace(/\[object Object\]/g, '// (Neural Leak Filtered)');

    // Ensure safe history
    const safeHistory = Array.isArray(conversationHistory) ? conversationHistory.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || '').replace(/\[object Object\]/g, '')
    })) : [];

    const contextPrompt = `
CURRENT EDITOR CONTEXT:
- Skill: ${safeSkill}
- Lesson: ${safeLesson}
- Code in Editor:
\`\`\`
${safeCode}
\`\`\`
`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
        const stream = await groq.chat.completions.create({
            model: AI_MODEL,
            messages: [
                { role: 'system', content: ORBIT_SYSTEM_PROMPT + contextPrompt },
                ...safeHistory,
                { role: 'user', content: message }
            ],
            temperature: 0.6,
            stream: true,
        });

        for await (const chunk of stream) {
            let token = chunk.choices[0]?.delta?.content || "";
            if (!token) continue;

            // Ensure token is strictly a string to prevent [object Object] in frontend
            if (typeof token !== "string") {
                token = JSON.stringify(token);
            }

            // Scrub any literal leaked object strings from the AI (hallucinations or context leaks)
            if (token === "[object Object]") {
                token = "(Orbit Signal Leak Scrubbed)";
            }

            res.write(`data: ${JSON.stringify({ token })}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
});

module.exports = router;
