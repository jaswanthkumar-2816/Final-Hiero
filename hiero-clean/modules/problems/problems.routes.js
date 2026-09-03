/**
 * HIERO — Problems Routes
 * Curated coding problem bank + AI problem generation.
 */

const express = require('express');
const router = express.Router();
const ai = require('../../utils/ai');

// ─── CURATED PROBLEMS ──────────────────────────────────
const CURATED_PROBLEMS = [
    { id: 'py-1', skill: 'Python', subTopic: 'Core Syntax & Control Flow', title: 'Truthy Evaluator', difficulty: 'easy', description: 'Write a function that counts truthy/falsy values.', starterCode: 'def evaluate_truthy(val_list):\n    pass', testCases: [{ case: 1, name: 'Mixed Values', input: '[0, "Python", [], {}, 42, True]', expectedOutput: "{'truthy_count': 3, 'falsy_count': 3}" }], hint: 'Use bool(x) to evaluate truthiness.' },
    { id: 'py-2', skill: 'Python', subTopic: 'Data Structures & Collections', title: 'Immutable Dict Key Cleaner', difficulty: 'medium', description: 'Return only hashable keys from a dict.', starterCode: 'def clean_dict_keys(data_dict):\n    pass', testCases: [{ case: 1, name: 'Valid Keys', input: "{'a': 1, (1,2): 2}", expectedOutput: "{'a': 1, (1,2): 2}" }], hint: 'Use hash() inside try/except TypeError.' },
    { id: 'dl-1', skill: 'Deep Learning', subTopic: 'Neural Network Fundamentals', title: 'Dense Layer Calculator', difficulty: 'easy', description: 'Calculate output shape and parameters of a dense layer.', starterCode: 'def calculate_dense_output(input_dim, units, batch_size=32):\n    pass', testCases: [{ case: 1, name: '128 to 64', input: '128, 64, 32', expectedOutput: "{'output_shape': (32, 64), 'total_params': 8256}" }], hint: 'Parameters = (input_dim * units) + units.' },
    { id: 'react-1', skill: 'React', subTopic: 'Hooks & State', title: 'Custom State Hook', difficulty: 'medium', description: 'Implement a synchronized state manager.', starterCode: 'function createSynchronizedState(initialValue) {\n    // Your code here\n}', testCases: [{ case: 1, name: 'Functional Update', input: 'setState(prev => prev + 1)', expectedOutput: '1' }], hint: 'Handle both functional and static updates.' },
];

// ─── GET /api/problems ─────────────────────────────────
router.get('/', (req, res) => {
    const { skill, subTopic, difficulty } = req.query;
    let results = CURATED_PROBLEMS;
    if (skill) results = results.filter(p => p.skill.toLowerCase() === skill.toLowerCase().trim());
    if (subTopic) results = results.filter(p => p.subTopic.toLowerCase() === subTopic.toLowerCase().trim());
    if (difficulty) results = results.filter(p => p.difficulty.toLowerCase() === difficulty.toLowerCase().trim());
    res.json({ success: true, count: results.length, problems: results });
});

// ─── GET /api/problems/:id ─────────────────────────────
router.get('/:id', (req, res) => {
    const problem = CURATED_PROBLEMS.find(p => p.id === req.params.id || p.id.toLowerCase() === req.params.id.toLowerCase());
    if (!problem) return res.status(404).json({ success: false, message: `Problem '${req.params.id}' not found.` });
    res.json({ success: true, problem });
});

// ─── POST /api/problems/generate ───────────────────────
router.post('/generate', async (req, res) => {
    const { skill, subTopic, difficulty } = req.body;
    if (!skill) return res.status(400).json({ success: false, message: 'skill is required.' });

    try {
        const prompt = `Generate a coding problem for "${skill}" subtopic "${subTopic || 'Core Concepts'}" difficulty "${difficulty || 'medium'}".
Return ONLY JSON: { "id": "...", "skill": "...", "title": "...", "description": "...", "starterCode": "...", "testCases": [...], "hint": "..." }`;

        const problemData = await ai.generateJSON(prompt);
        res.json({ success: true, source: 'ai_generated', problem: problemData });
    } catch (err) {
        console.error('AI Problem Generation Failed:', err.message);
        res.status(500).json({ success: false, message: 'Failed to generate problem.' });
    }
});

module.exports = router;
