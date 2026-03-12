const express = require('express');
const { Groq } = require('groq-sdk');
const { normalizeResponse } = require('../utils/normalizeResponse');

const router = express.Router();

// Initialize Groq with environment variables
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'llama-3.3-70b-versatile';

const groq = new Groq({ apiKey: GROQ_API_KEY });

const ORBIT_SYSTEM_PROMPT = `You are Orbit, the AI tutor inside Orbit Studio.

Response Rules:
1. Short answers only. Maximum 4 sentences per response. No exceptions.
2. PREVENT CODE: If the user mentions "video", "tutorial", "learning", "where to start", or "watch", you MUST NOT generate any code blocks or snippets.
3. PLATFORM CURATOR: You MUST ONLY recommend tutorials from the "Recommended Tutorials from Page" list provided in the context. 
   - DO NOT invent tutorial names.
   - DO NOT suggest external platforms like Coursera, edX, Kaggle, DataCamp, Udemy, YouTube, or Udacity.
   - Response structure for videos/tutoring:
     1. Recommend the best tutorial to start with from the provided list + 1-sentence explanation of why (e.g., "it introduces the programming fundamentals required...").
     2. Suggest the logical next tutorial from the same list.
     3. End with the exact question: "Would you like a quick summary before watching?"
   - LENGTH: 2–4 sentences total.

Standard Protocols:
- DIRECT GENERATION: Generate answers directly. Use markdown.
- NO HALLUCINATIONS: If the tutorial list is empty, explain that you are specialized for this page's content and can't recommend external courses.
- NO CODE: Never generate code blocks if the query is about learning resources.

STRICT OUTPUT FORMAT:
- Markdown only.
- 4 sentences max.`;

const BLACKLIST = ['Coursera', 'DataCamp', 'edX', 'Kaggle', 'Udemy', 'Udacity'];

function applySafetyFilter(text, tutorials) {
    const hasBlacklisted = BLACKLIST.some(platform => text.toLowerCase().includes(platform.toLowerCase()));
    if (hasBlacklisted) {
        console.log("[Orbit] Safety filter triggered. Scrubbing external platforms.");
        const tutorialList = Array.isArray(tutorials) && tutorials.length > 0 ? tutorials : ["Python in 4 hours", "Advanced Data Science Concepts"];
        const start = tutorialList[0];
        const next = tutorialList[1] || tutorialList[0];
        return `You should start with **${start}** because it introduces the programming fundamentals required for data science. After that, move to **${next}** to see how those skills are used in real data analysis. Would you like a quick summary before watching?`;
    }
    return text;
}

/**
 * @route POST /api/chat
 * @desc Chat with Orbit Neural Assistant (Non-Streaming)
 */
router.post('/chat', async (req, res) => {
    try {
        const { message, skill, lesson, code, recommended_tutorials } = req.body;
        if (!message) return res.status(400).json({ error: 'Message required' });

        const safeSkill = typeof skill === 'string' ? skill : JSON.stringify(skill || 'General Coding');
        const safeLesson = typeof lesson === 'string' ? lesson : JSON.stringify(lesson || 'Personal Practice');
        const safeCode = (typeof code === 'string' ? code : JSON.stringify(code || '// Empty editor')).replace(/\[object Object\]/g, '// (Neural Leak Filtered)');
        const safeTutorials = Array.isArray(recommended_tutorials) ? recommended_tutorials.join(', ') : 'None provided';

        const contextPrompt = `
CURRENT EDITOR CONTEXT:
- Skill: ${safeSkill}
- Lesson: ${safeLesson}
- Recommended Tutorials from Page: ${safeTutorials}
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
            const result = normalizeResponse(secondCompletion.choices[0].message.content);
            return res.json({ success: true, answer: applySafetyFilter(result, recommended_tutorials) });
        }

        const finalAnswer = applySafetyFilter(normalizeResponse(responseMessage.content || ""), recommended_tutorials);
        res.json({ success: true, answer: finalAnswer });

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
    const { message, skill, lesson, code, conversationHistory, recommended_tutorials } = req.body;
    if (!message) return res.status(400).write('data: Error: Message required\n\n');

    const safeSkill = typeof skill === 'string' ? skill : JSON.stringify(skill || 'General Coding');
    const safeLesson = typeof lesson === 'string' ? lesson : JSON.stringify(lesson || 'Personal Practice');
    const safeCode = (typeof code === 'string' ? code : JSON.stringify(code || '// Empty editor')).replace(/\[object Object\]/g, '// (Neural Leak Filtered)');
    const safeTutorials = Array.isArray(recommended_tutorials) ? recommended_tutorials.join(', ') : 'None provided';

    // Ensure safe history
    const safeHistory = Array.isArray(conversationHistory) ? conversationHistory.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || '').replace(/\[object Object\]/g, '')
    })) : [];

    const contextPrompt = `
CURRENT EDITOR CONTEXT:
- Skill: ${safeSkill}
- Lesson: ${safeLesson}
- Recommended Tutorials from Page: ${safeTutorials}
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

            // Scrub any literal leaked object strings or blacklisted platforms from the AI
            // This is a basic safety mechanism for streaming
            token = token.replace(/Coursera|DataCamp|edX|Kaggle|Udemy|Udacity/gi, "Orbit Tutorials");

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
