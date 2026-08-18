const express = require('express');
const router = express.Router();

// ==========================================
// CURATED PROBLEM DATABASE
// ==========================================
const CURATED_PROBLEMS = [
  // ── PYTHON PROBLEMS ──
  {
    id: 'py-1',
    skill: 'Python',
    subTopic: 'Core Syntax & Control Flow',
    title: 'Truthy Evaluator & Memory Identity',
    difficulty: 'easy',
    description: `### Problem: Truthy Evaluator & Identity Check

Write a Python function \`evaluate_truthy(val_list)\` that iterates through a list of values and returns a dictionary with two keys:
1. \`"truthy_count"\`: Total number of truthy values in the list.
2. \`"falsy_count"\`: Total number of falsy values in the list.

#### Example:
\`\`\`python
evaluate_truthy([0, "Python", [], {}, 42, True])
# Output: {"truthy_count": 3, "falsy_count": 3}
\`\`\``,
    starterCode: `def evaluate_truthy(val_list):
    # Write your solution here
    truthy = sum(1 for x in val_list if bool(x))
    falsy = len(val_list) - truthy
    return {"truthy_count": truthy, "falsy_count": falsy}

if __name__ == "__main__":
    print(evaluate_truthy([0, "Python", [], {}, 42, True]))`,
    testCases: [
      { case: 1, name: "Mixed Values Test", input: "[0, 'Python', [], {}, 42, True]", expectedOutput: "{'truthy_count': 3, 'falsy_count': 3}" },
      { case: 2, name: "All Falsy Test", input: "[False, None, 0, '', []]", expectedOutput: "{'truthy_count': 0, 'falsy_count': 5}" }
    ],
    hint: "Use bool(x) to evaluate truthiness in Python. Falsy values include 0, None, empty strings, empty lists, and empty dicts."
  },
  {
    id: 'py-2',
    skill: 'Python',
    subTopic: 'Data Structures & Collections',
    title: 'Immutable Dict Key Cleaner',
    difficulty: 'medium',
    description: `### Problem: Immutable Dict Key Cleaner

Write a Python function \`clean_dict_keys(data_dict)\` that accepts a dictionary and returns a new dictionary containing ONLY keys that are immutable and hashable (e.g. strings, ints, tuples), excluding mutable keys like lists or dictionaries.

#### Example:
\`\`\`python
clean_dict_keys({"name": "Alice", (1, 2): "TupleKey", 100: "IntKey"})
# Output: {"name": "Alice", (1, 2): "TupleKey", 100: "IntKey"}
\`\`\``,
    starterCode: `def clean_dict_keys(data_dict):
    clean = {}
    for k, v in data_dict.items():
        try:
            hash(k)
            clean[k] = v
        except TypeError:
            pass
    return clean

if __name__ == "__main__":
    print(clean_dict_keys({"a": 1, (1, 2): 2}))`,
    testCases: [
      { case: 1, name: "Valid Hashable Keys", input: "{'a': 1, (1, 2): 2}", expectedOutput: "{'a': 1, (1, 2): 2}" }
    ],
    hint: "Use Python's hash() function inside a try/except TypeError block to check key hashability."
  },

  // ── DEEP LEARNING PROBLEMS ──
  {
    id: 'dl-1',
    skill: 'Deep Learning',
    subTopic: 'Neural Network Fundamentals',
    title: 'Dense Layer Output Dimension & Activation Calculator',
    difficulty: 'easy',
    description: `### Problem: Dense Layer Output Dimension Calculator

Write a Python function \`calculate_dense_output(input_dim, units, batch_size=32)\` that returns the output matrix shape tuple \`(batch_size, units)\` and total trainable parameters \`weights + biases\`.

#### Formula:
- Output Shape: \`(batch_size, units)\`
- Total Parameters: \`(input_dim * units) + units\`

#### Example:
\`\`\`python
calculate_dense_output(input_dim=128, units=64, batch_size=32)
# Output: {"output_shape": (32, 64), "total_params": 8256}
\`\`\``,
    starterCode: `def calculate_dense_output(input_dim, units, batch_size=32):
    output_shape = (batch_size, units)
    total_params = (input_dim * units) + units
    return {"output_shape": output_shape, "total_params": total_params}

if __name__ == "__main__":
    print(calculate_dense_output(128, 64, 32))`,
    testCases: [
      { case: 1, name: "128 to 64 Dense Layer", input: "128, 64, 32", expectedOutput: "{'output_shape': (32, 64), 'total_params': 8256}" }
    ],
    hint: "Dense layer weights have shape (input_dim, units), and biases have shape (units,)."
  },
  {
    id: 'dl-2',
    skill: 'Deep Learning',
    subTopic: 'CNNs',
    title: 'Conv2D Feature Map Dimension Calculator',
    difficulty: 'medium',
    description: `### Problem: Conv2D Feature Map Dimension Calculator

Write a Python function \`conv2d_output_shape(W, H, K, P, S)\` that computes the spatial dimensions \`(W_out, H_out)\` of a Convolutional Layer output.

#### Formula:
- \`W_out = floor((W - K + 2*P) / S) + 1\`
- \`H_out = floor((H - K + 2*P) / S) + 1\`

#### Example:
\`\`\`python
conv2d_output_shape(W=32, H=32, K=3, P=1, S=1)
# Output: (32, 32)
\`\`\``,
    starterCode: `import math

def conv2d_output_shape(W, H, K, P, S):
    w_out = math.floor((W - K + 2 * P) / S) + 1
    h_out = math.floor((H - K + 2 * P) / S) + 1
    return (w_out, h_out)

if __name__ == "__main__":
    print(conv2d_output_shape(32, 32, 3, 1, 1))`,
    testCases: [
      { case: 1, name: "Same Padding Conv2D Test", input: "32, 32, 3, 1, 1", expectedOutput: "(32, 32)" },
      { case: 2, name: "Valid Padding Stride 2 Test", input: "224, 224, 7, 3, 2", expectedOutput: "(112, 112)" }
    ],
    hint: "Use integer division or math.floor for stride steps."
  },

  // ── REACT PROBLEMS ──
  {
    id: 'react-1',
    skill: 'React',
    subTopic: 'Hooks & State',
    title: 'Custom State Synchronizer Hook',
    difficulty: 'medium',
    description: `### Problem: Custom State Synchronizer Hook Logic

Write a JavaScript function \`createSynchronizedState(initialValue)\` that simulates React state updater logic with batched state updates and subscriber callbacks.

#### Requirement:
- Returns an object with \`getState()\`, \`setState(newValue)\`, and \`subscribe(listener)\`.`,
    starterCode: `function createSynchronizedState(initialValue) {
    let state = initialValue;
    const listeners = new Set();

    return {
        getState: () => state,
        setState: (newValue) => {
            state = typeof newValue === 'function' ? newValue(state) : newValue;
            listeners.forEach(fn => fn(state));
        },
        subscribe: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        }
    };
}

const store = createSynchronizedState(0);
store.setState(prev => prev + 1);
console.log(store.getState());`,
    testCases: [
      { case: 1, name: "Functional State Update Test", input: "store.setState(prev => prev + 1)", expectedOutput: "1" }
    ],
    hint: "Handle both functional updates (prev => prev + 1) and static value assignments in setState."
  }
];

// ==========================================
// ROUTES
// ==========================================

// GET /api/problems - List all problems or filter by skill / subTopic
router.get('/', (req, res) => {
  const { skill, subTopic, difficulty } = req.query;
  let results = CURATED_PROBLEMS;

  if (skill) {
    results = results.filter(p => p.skill.toLowerCase() === skill.toLowerCase().trim());
  }

  if (subTopic) {
    results = results.filter(p => p.subTopic.toLowerCase() === subTopic.toLowerCase().trim());
  }

  if (difficulty) {
    results = results.filter(p => p.difficulty.toLowerCase() === difficulty.toLowerCase().trim());
  }

  res.json({
    success: true,
    count: results.length,
    problems: results
  });
});

// GET /api/problems/:id - Get detailed problem by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const problem = CURATED_PROBLEMS.find(p => p.id === id || p.id.toLowerCase() === id.toLowerCase());

  if (!problem) {
    return res.status(404).json({
      success: false,
      message: `Problem with ID '${id}' not found.`
    });
  }

  res.json({
    success: true,
    problem
  });
});

// POST /api/problems/generate - Groq AI Fallback to generate new intermediate coding problem
router.post('/generate', async (req, res) => {
  const { skill, subTopic, difficulty } = req.body;

  if (!skill) {
    return res.status(400).json({ success: false, message: 'skill parameter is required.' });
  }

  try {
    const Groq = require('groq-sdk');
    const groqKey = process.env.GROQ_API_KEY || 'gsk_x';
    const groq = new Groq({ apiKey: groqKey });

    const prompt = `Generate a high-quality intermediate coding problem for the skill "${skill}" and subtopic "${subTopic || 'Core Concepts'}".
Difficulty: ${difficulty || 'medium'}.

Return ONLY valid JSON with no markdown block wrappers matching this schema:
{
  "id": "${skill.toLowerCase().replace(/\\s+/g, '-')}-ai-${Date.now()}",
  "skill": "${skill}",
  "subTopic": "${subTopic || 'Core Concepts'}",
  "title": "Clear Problem Title",
  "difficulty": "${difficulty || 'medium'}",
  "description": "Detailed markdown description with problem requirements and example inputs/outputs.",
  "starterCode": "Complete python/js starter code template with function signature.",
  "testCases": [
    { "case": 1, "name": "Test Case Name", "input": "sample input", "expectedOutput": "expected return string" }
  ],
  "hint": "Useful surgical hint for solving."
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const problemData = JSON.parse(cleanJson);

    res.json({
      success: true,
      source: 'ai_generated',
      problem: problemData
    });
  } catch (err) {
    console.error('Groq AI Problem Generation Failed:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate problem via AI.',
      error: err.message
    });
  }
});

module.exports = router;
