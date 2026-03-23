const express = require('express');
const { Groq } = require('groq-sdk');
const { normalizeResponse } = require('../utils/normalizeResponse');

const router = express.Router();

// Initialize Groq with environment variables
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'llama-3.3-70b-versatile';
const MAX_RESPONSE_TOKENS = 512;

const groq = new Groq({ apiKey: GROQ_API_KEY });

/**
 * Rate Limit Protection & Fallback Model Execution
 */
async function callGroqWithFallback(params, res = null) {
    const PRIMARY_MODEL = AI_MODEL;
    const FALLBACK_MODEL = 'llama-3.1-8b-instant';
    
    try {
        return await groq.chat.completions.create({
            ...params,
            model: PRIMARY_MODEL
        });
    } catch (error) {
        if (error.status === 429) {
            console.warn(`[Orbit AI] Rate limit (429) hit on ${PRIMARY_MODEL}. Falling back to ${FALLBACK_MODEL} silently.`);
            
            return await groq.chat.completions.create({
                ...params,
                model: FALLBACK_MODEL
            });
        }
        throw error;
    }
}

const INTENT_RULES = {
    DEBUG_INTENT: ["debug", "error", "failing", "not working", "why is this line failing", "fix", "issue", "broken", "bug"],
    EXPLAIN_OUTPUT_INTENT: ["execution result", "terminal output", "stack trace", "why did this error happen", "log", "terminal", "breakdown", "test failure"],
    DATASET_INTENT: ["dataset", "columns", "schema", "dataframe", "features", "csv", "data structure", "fields"],
    GREETING_INTENT: ["hi", "hello", "hey", "good morning", "good evening", "hi orbit", "greetings", "who are you"],
    TUTORIAL_INTENT: ["video", "tutorial", "watch", "show me", "start learning", "which lesson", "which video"]
};

function detectIntent(message, context = {}) {
    const msg = (message || "").trim().toLowerCase();
    if (!msg) return 'GENERAL_REASONING';

    // 1. GREETING CHECK (Use word boundaries for short keywords to avoid false positives like "which")
    if (INTENT_RULES.GREETING_INTENT.some(kw => {
        if (kw.length <= 3) {
            const regex = new RegExp(`\\b${kw}\\b`, 'i');
            return regex.test(msg);
        }
        return msg.includes(kw);
    })) return 'greeting';

    // 2. EXPLAIN_OUTPUT_INTENT (Check specific error terms first to prevent incorrect debug_code trigger)
    const explainKeywords = ["execution error", "execution output", "stack trace", "explain this error", "what happened in terminal", "why did it fail"];
    if (explainKeywords.some(kw => msg.includes(kw))) {
        return 'explain_output';
    }

    // 3. DEBUG_INTENT
    const debugKeywords = ["debug", "fix this", "why is this failing", "error in code", "fix syntax", "broken code"];
    if (debugKeywords.some(kw => msg.includes(kw))) {
        return 'debug_code';
    }

    // 4. DATASET_INTENT
    const datasetKeywords = ["dataset", "columns", "schema", "features", "dataframe", "csv", "fields", "what columns"];
    if (datasetKeywords.some(kw => msg.includes(kw))) {
        return 'inspect_dataset';
    }

    // 5. TUTORIAL_INTENT
    if (INTENT_RULES.TUTORIAL_INTENT.some(kw => msg.includes(kw))) {
        return 'tutorial_request';
    }

    return 'GENERAL_REASONING';
}

const ORBIT_TOOLS = [
    {
        type: "function",
        function: {
            name: "debug_code",
            description: "Analyze code for errors and suggest fixes.",
            parameters: {
                type: "object",
                properties: {
                    user_code: { type: "string" },
                    execution_output: { type: "string" }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "generate_solution",
            description: "Provide a implementation for the current problem.",
            parameters: {
                type: "object",
                properties: {
                    problem_context: { type: "string" }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "inspect_dataset",
            description: "Analyze dataset schema.",
            parameters: {
                type: "object",
                properties: {
                    dataset_schema: { type: "string" }
                }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "explain_output",
            description: "Provide a detailed breakdown of terminal logs.",
            parameters: {
                type: "object",
                properties: {
                    execution_output: { type: "string" }
                }
            }
        }
    }
];

/**
 * Standardized Tool Executor
 */
async function runOrbitTool(toolName, context, args = {}) {
    console.log(`[Orbit AI] Logic Engine: Executing ${toolName}`);
    const { safeLesson, safeExec, dataset_schema, user_code } = context;
    
    // Use backend-constructed arguments for tool logic
    const code = args.user_code || user_code || "";
    const activeExec = args.execution_output || safeExec;
    const activeSchema = args.dataset_schema || (Array.isArray(dataset_schema) ? dataset_schema.join(', ') : dataset_schema);

    let result = {
        tool: toolName,
        explanation: `Orbit logic engine analyzed ${safeLesson}. Tool: ${toolName}.`,
        suggested_fix: "Check your recent code changes for potential syntax or logical errors.",
        next_step: "Review the problem description and execution output for clues."
    };
    

    if (toolName === 'debug_code') {
        // Robust Pattern Detection for Tuple-based column selection
        // Supports whitespace variations and multi-line strings
        const tupleRegex = /(.*?)\b(\w+)\[\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\]/m;
        const tupleMatch = code.match(tupleRegex);
        
        if (tupleMatch) {
            const prefix = tupleMatch[1].trim(); 
            const dfName = tupleMatch[2];
            const col1 = tupleMatch[3];
            const col2 = tupleMatch[4];
            
            result.explanation = `The syntax is incorrect because pandas expects a list when selecting multiple columns. Using a comma inside single brackets (e.g., ${dfName}['${col1}', '${col2}']) creates a tuple, which is not a valid way to index multiple columns in a DataFrame.`;
            result.suggested_fix = `${prefix ? prefix + ' ' : ''}${dfName}[['${col1}', '${col2}']]`;
            result.next_step = "Update your code to use double brackets (a list) for column selection and re-run your model.";

            // Schema Validation
            if (Array.isArray(activeSchema) && activeSchema.length > 0) {
                const missing = [col1, col2].filter(c => !activeSchema.includes(c));
                if (missing.length > 0) {
                    result.explanation += ` Note: One or more columns ([${missing.join(', ')}]) are not detected in the dataset schema.`;
                    result.next_step = `Verify your column names match the detected schema: ${activeSchema.join(', ')}.`;
                }
            }
        } else {
            result.explanation = "Detected logical or syntax issues in your data processing block. Focus on object types and pandas indexing rules.";
            result.suggested_fix = "Use double brackets for multi-column indexing: df[['col1', 'col2']].";
            result.next_step = "Apply the fix and check if the KeyError or TypeError is resolved in the terminal.";
        }
    } else if (toolName === 'inspect_dataset') {
        const columns = Array.isArray(activeSchema) ? activeSchema.join(', ') : (typeof activeSchema === 'string' ? activeSchema : 'No columns detected');
        result.explanation = `Dataset analysis complete for ${safeLesson}. Schema columns identified: ${columns}.`;
        result.suggested_fix = "Reference the list of columns above to ensure your feature selection (X) and target (y) match the available data.";
        result.next_step = "Update your feature list in the editor to use valid column names from the detected schema.";
    } else if (toolName === 'explain_output') {
        result.explanation = `Detailed breakdown of terminal output. Recent state: ${activeExec.substring(0, 150)}...`;
        result.suggested_fix = "Identify specific 'Error' lines in the terminal (like KeyError, NameError) and trace them back to the relevant code line.";
        result.next_step = "Apply targeted fixes for each error listed in the logs sequentially.";
    }

    return result;
}

const ORBIT_SYSTEM_PROMPT = `You are Orbit, an AI programming tutor and debugging assistant.

RESPONSE MODES:
1. Quick Mode (Default): For short questions or debugging (e.g., "why is this failing"), respond in 2-4 sentences maximum. Be extremely concise and direct.
2. Tutor Mode: Only activate if the user explicitly asks to "teach me", "explain step by step", or "walk me through this". Provide detailed explanations in this mode.

DATASET AWARENESS:
- Trust the provided 'DATASET SCHEMA' as absolute ground truth. If columns are listed, they exist.
- DO NOT suggest running code like 'print(df.columns)' if the schema is already visible in context.
- If the user asks what columns exist, list them directly from the schema.

ERROR INTERPRETATION RULES:
- If 'EXECUTION OUTPUT' shows "KeyError: ('col1', 'col2')", explain that pandas is interpreting the tuple as a single key. This means the user forgot to use double brackets (a list), NOT that the columns are missing.
- Always analyze the Editor Code alongside the Execution Output to identify the exact line of failure.

REASONING GUIDELINES:
- If a TOOL RESULT is provided, use it as a reference for your explanation.
- Never recommend external platforms (Coursera, YouTube, etc).
- Use Markdown formatting for code snippets and emphasis.`;

const BLACKLIST = ['Coursera', 'DataCamp', 'edX', 'Kaggle', 'Udemy', 'Udacity', 'YouTube', 'official website', 'install', 'download', 'python.org'];

function applySafetyFilter(text, tutorials, userMessage) {
    const intent = detectIntent(userMessage);
    const hasCodeBlock = text.includes('```');
    const hasBlacklisted = BLACKLIST.some(platform => text.toLowerCase().includes(platform.toLowerCase()));

    // Rule: greeting, tutorial_request -> NO CODE.
    const forbiddenCodeIntents = ['greeting', 'tutorial_request'];
    
    if ((forbiddenCodeIntents.includes(intent) && hasCodeBlock) || hasBlacklisted) {
        console.log(`[Orbit] Safety filter triggered. Intent: ${intent}. Found: ${hasCodeBlock ? 'Code Block' : 'External Link'}`);
        
        let tutorialList = [];
        if (Array.isArray(tutorials)) {
            tutorialList = tutorials;
        } else if (typeof tutorials === 'object' && Array.isArray(tutorials.tutorials)) {
            tutorialList = tutorials.tutorials;
        }
        
        if (tutorialList.length === 0) tutorialList = ["Python in 4 hours", "Advanced data science Concepts"];
        
        return `You should start with **${tutorialList[0]}** because it introduces the foundational concepts.\n\nThen continue with **${tutorialList[1] || tutorialList[0]}** to explore more advanced topics.\n\nWould you like a quick overview before watching?`;
    }
    return text;
}

router.post('/chat', async (req, res) => {
    try {
        const { message, context, intent: frontendIntent, skill, lesson, problem_title, problem_description, lesson_description, user_code, editor_code, cursor_line, terminal_output, execution_output, test_results, dataset_schema, conversationHistory, recommended_tutorials, practical_challenges, tutor_state, mode } = req.body;
        if (!message) return res.status(400).json({ error: 'Message required' });

        // Step 3: Learning Context Prompt Builder
        let learningPrompt = "";
        if (context && context.page_type === "learning") {
            const skillName = context.skill || skill || "this topic";
            learningPrompt = `\n\n[LEARNING CONTEXT]\nThe user is currently on the learning dashboard for ${skillName}. Recommend tutorials and guide the learning path based on available tutorials and challenges.
- Available Tutorials: ${Array.isArray(context.tutorials) ? context.tutorials.join(', ') : 'None'}
- Available Challenges: ${Array.isArray(context.challenges) ? context.challenges.join(', ') : 'None'}
- Language: ${context.language || 'english'}

BEHAVIOR RULES:
If the user asks "which video should I start" or similar:
1. Check available tutorials.
2. Recommend the beginner tutorial first (usually the first in the list).
3. Suggest the next challenge after the tutorial.
Example: "For ${skillName} beginners, start with **${context.tutorials?.[0] || 'the first tutorial'}**. After completing it, try the **${context.challenges?.[0] || 'first challenge'}** challenge to practice."`;
        }

        const rawExec = terminal_output || execution_output;
        const currentIntent = frontendIntent || detectIntent(message, { editorCode: editor_code, history: conversationHistory, terminalOutput: rawExec });
        const intent = currentIntent;
        console.log(`[Orbit Router] Message: "${message}" | Intent: ${intent}`);

        // INTENT ROUTER: Intercept greetings before calling AI
        if (intent === 'greeting') {
            return res.json({ 
                success: true, 
                answer: "Hello! I'm Orbit, your AI learning guide.\nHow can I help you today?" 
            });
        }

        const safeSkill = skill || 'General Coding';
        const safeLesson = problem_title || lesson || 'Neural Workspace';
        const safeDesc = problem_description || lesson_description || 'Personal coding practice session.';
        const actualCode = editor_code || user_code || req.body.code || '// Empty editor';
        const safeCode = actualCode.replace(/\[object Object\]/g, '// Filtered');
        const safeExec = (rawExec && String(rawExec).trim()) ? String(rawExec).replace(/\[object Object\]/g, '') : "No execution output detected.";
        const safeTests = Array.isArray(test_results) ? JSON.stringify(test_results) : 'None';
        const safeTutorials = Array.isArray(recommended_tutorials) ? recommended_tutorials.join(', ') : 'None provided';
        const safeChallenges = Array.isArray(practical_challenges) ? practical_challenges.join(', ') : 'None provided';
        const safeTutorState = tutor_state || { challenge: null, current_step: 0, steps_completed: [] };

        const safeHistory = Array.isArray(conversationHistory) ? conversationHistory.slice(-12).map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: String(m.content || '').replace(/\[object Object\]/g, '').split('\n').filter(line => !line.trim().startsWith('>')).join('\n').trim()
        })) : [];

        // DETERMINISTIC TOOL EXECUTION: Run tools based on intent BEFORE AI call
        let toolContext = "";
        let reasoningLog = "";

        if (intent === 'debug_code' || intent === 'explain_output' || intent === 'inspect_dataset') {
            const toolName = intent;
            reasoningLog = `> Detected ${toolName.replace('_', ' ')} request → running ${toolName} tool.\n\n`;
            
            try {
                let toolArguments = {};
                if (toolName === 'debug_code') {
                    toolArguments = { user_code: safeCode, execution_output: safeExec };
                } else if (toolName === 'explain_output') {
                    toolArguments = { execution_output: safeExec };
                } else if (toolName === 'inspect_dataset') {
                    toolArguments = { dataset_schema: Array.isArray(dataset_schema) ? dataset_schema.join(', ') : 'Not loaded' };
                }

                const toolResult = await runOrbitTool(toolName, { safeLesson, safeExec, dataset_schema, user_code: safeCode }, toolArguments);
                toolContext = `\n\nTOOL RESULT (Reference Only):\n${JSON.stringify(toolResult, null, 2)}`;
            } catch (err) {
                console.error(`[Orbit] Deterministic tool failed: ${intent}`, err);
            }
        }

        const workspaceContext = `\n\n[WORKSPACE CONTEXT]\n- Editor Code: ${safeCode}\n- Cursor Line: ${cursor_line || 'Unknown'}`;
        const schemaContext = `\n\n[DATASET SCHEMA]\nColumns: ${Array.isArray(dataset_schema) ? dataset_schema.join(', ') : 'Not loaded'}`;
        const executionContext = `\n\n[EXECUTION OUTPUT]\n${safeExec}`;
        const contextPrompt = workspaceContext + schemaContext + executionContext + toolContext;

        let completion = await callGroqWithFallback({
            messages: [
                { role: 'system', content: ORBIT_SYSTEM_PROMPT + learningPrompt },
                ...safeHistory,
                { role: 'user', content: message + contextPrompt }
            ],
            temperature: 0.1,
            max_tokens: MAX_RESPONSE_TOKENS
        });

        const finalContent = completion.choices[0].message.content || "";
        res.json({ success: true, answer: applySafetyFilter(normalizeResponse(finalContent), context || recommended_tutorials, message) });

    } catch (error) {
        console.error('Orbit Chat Error:', error.message);
        res.status(500).json({ error: 'Failed' });
    }
});


/**
 * @route POST /api/chat/stream
 */
router.post('/chat/stream', async (req, res) => {
    const { message, context, intent: frontendIntent, skill, lesson, problem_title, problem_description, lesson_description, user_code, editor_code, cursor_line, terminal_output, execution_output, test_results, dataset_schema, conversationHistory, recommended_tutorials, practical_challenges, tutor_state, mode } = req.body;
    if (!message) return res.status(400).write('data: Error: Message required\n\n');

    // Step 3: Learning Context Prompt Builder
    let learningPrompt = "";
    if (context && context.page_type === "learning") {
        const skillName = context.skill || skill || "this topic";
        learningPrompt = `\n\n[LEARNING CONTEXT]\nThe user is currently on the learning dashboard for ${skillName}. Recommend tutorials and guide the learning path based on available tutorials and challenges.
- Available Tutorials: ${Array.isArray(context.tutorials) ? context.tutorials.join(', ') : 'None'}
- Available Challenges: ${Array.isArray(context.challenges) ? context.challenges.join(', ') : 'None'}
- Language: ${context.language || 'english'}

BEHAVIOR RULES:
If the user asks "which video should I start" or similar:
1. Check available tutorials.
2. Recommend the beginner tutorial first (usually the first in the list).
3. Suggest the next challenge after the tutorial.
Example: "For ${skillName} beginners, start with **${context.tutorials?.[0] || 'the first tutorial'}**. After completing it, try the **${context.challenges?.[0] || 'first challenge'}** challenge to practice."`;
    }

    const rawExec = terminal_output || execution_output;
    const currentIntent = frontendIntent || detectIntent(message, { editorCode: editor_code, history: conversationHistory, terminalOutput: rawExec });
    const intent = currentIntent;
    console.log(`[Orbit Stream] Message: "${message}" | Intent: ${intent}`);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // INTENT ROUTER: Intercept greetings before calling AI
    if (intent === 'greeting') {
        const token = "Hello! I'm Orbit, your AI learning guide.\nHow can I help you today?";
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
    }

    const safeSkill = skill || 'General Coding';
    const safeLesson = problem_title || lesson || 'Neural Workspace';
    const safeDesc = problem_description || lesson_description || 'Personal coding practice session.';
    const actualCode = editor_code || user_code || req.body.code || '// Empty editor';
    const safeCode = actualCode.replace(/\[object Object\]/g, '// Filtered');
    const safeExec = (rawExec && String(rawExec).trim()) ? String(rawExec).replace(/\[object Object\]/g, '') : "No execution output detected.";
    const safeTests = Array.isArray(test_results) ? JSON.stringify(test_results) : 'None';
    const safeTutorials = Array.isArray(recommended_tutorials) ? recommended_tutorials.join(', ') : 'None provided';
    const safeChallenges = Array.isArray(practical_challenges) ? practical_challenges.join(', ') : 'None provided';
    const safeTutorState = tutor_state || { challenge: null, current_step: 0, steps_completed: [] };

    const safeHistory = Array.isArray(conversationHistory) ? conversationHistory.slice(-12).map(m => {
        let content = String(m.content || '').replace(/\[object Object\]/g, '');
        if (m.role === 'assistant') {
            // Remove previous tool activation logs from history to keep it clean
            content = content.split('\n').filter(line => !line.trim().startsWith('>')).join('\n').trim();
        }
        return {
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: content
        };
    }) : [];

    // DETERMINISTIC TOOL EXECUTION: Run tools based on intent BEFORE AI call
    let toolContext = "";
    if (intent === 'debug_code' || intent === 'explain_output' || intent === 'inspect_dataset') {
        const toolName = intent;
        console.log(`[Orbit Router] Detected ${toolName} request → executing diagnostic tool.`);
        
        try {
            let toolArguments = {};
            if (toolName === 'debug_code') {
                toolArguments = { user_code: safeCode, execution_output: safeExec };
            } else if (toolName === 'explain_output') {
                toolArguments = { execution_output: safeExec };
            } else if (toolName === 'inspect_dataset') {
                toolArguments = { dataset_schema: Array.isArray(dataset_schema) ? dataset_schema.join(', ') : 'Not loaded' };
            }

            const toolResult = await runOrbitTool(toolName, { safeLesson, safeExec, dataset_schema, user_code: safeCode }, toolArguments);
            toolContext = `\n\nTOOL RESULT (Reference Only):\n${JSON.stringify(toolResult, null, 2)}`;
        } catch (err) {
            console.error(`[Orbit Stream] Deterministic tool failed: ${intent}`, err);
        }
    }

    const workspaceContext = `\n\n[WORKSPACE CONTEXT]\n- Editor Code: ${safeCode}\n- Cursor Line: ${cursor_line || 'Unknown'}`;
    const schemaContext = `\n\n[DATASET SCHEMA]\nColumns: ${Array.isArray(dataset_schema) ? dataset_schema.join(', ') : 'Not loaded'}`;
    const executionContext = `\n\n[EXECUTION OUTPUT]\n${safeExec}`;
    const contextPrompt = workspaceContext + schemaContext + executionContext + toolContext;

    try {
        console.log(`[Orbit AI] Deterministic inference for: "${message.substring(0, 50)}..."`);
        
        const messages = [
            { role: 'system', content: ORBIT_SYSTEM_PROMPT + learningPrompt },
            ...safeHistory,
            { role: 'user', content: message + contextPrompt }
        ];

        const stream = await callGroqWithFallback({
            messages,
            temperature: 0.4,
            max_tokens: MAX_RESPONSE_TOKENS,
            stream: true,
        }, res);

        for await (const chunk of stream) {
            let token = chunk.choices[0]?.delta?.content || "";
            if (!token) continue;
            token = token.replace(/Coursera|DataCamp|edX|Kaggle|Udemy|YouTube/gi, "Orbit Studio");
            res.write(`data: ${JSON.stringify({ token })}\n\n`);
            if (res.flush) res.flush();
        }

        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error('Orbit Stream Error:', error.message);
        const errorMsg = "Orbit is experiencing high congestion. Please re-run your code and try again.";
        res.write(`data: ${JSON.stringify({ token: errorMsg })}\n\n`);
        res.end();
    }
});

module.exports = router;
