const express = require('express');
const router = express.Router();
const axios = require('axios');
const SkillTree = require('../models/SkillTree');
const StudentProgress = require('../models/StudentProgress');
const DiagnosticResult = require('../models/DiagnosticResult');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'llama-3.3-70b-versatile';
const MASTERY_THRESHOLD = 70;

// =========================================================
// STAGE 1 & 2: SKILL GENERATOR & SKILL GRAPH KNOWLEDGE BASE
// =========================================================
const CURATED_SKILL_GRAPHS = {
  'python': {
    skillName: 'Python',
    nodes: [
      {
        id: 'py-basics',
        name: 'Python Basics & Variables',
        order: 1,
        subConcepts: ['variables', 'data-types', 'truthiness', 'identity'],
        questions: [
          { id: 'q1', question: 'What is the output of: print(bool([]) or "Python")?', options: ['False', 'True', '"Python"', '[]'], correctIndex: 2, subConcept: 'truthiness' },
          { id: 'q2', question: 'What is the difference between "is" and "==" in Python?', options: ['"is" checks value equality, "==" checks identity', '"is" checks memory identity, "==" checks value equality', 'They are identical', '"is" works only on integers'], correctIndex: 1, subConcept: 'identity' }
        ],
        resources: {
          videos: [{ title: 'Python Syntax & Logic – Mosh', url: 'https://www.youtube.com/watch?v=kqtD5dpn9C8', duration: '1h 30m' }],
          courses: [{ title: 'Python Official Tutorial', url: 'https://docs.python.org/3/tutorial/index.html' }],
          exercises: [{ title: 'Truthy & Identity Challenge', problemId: 'py-1' }]
        }
      },
      {
        id: 'py-loops',
        name: 'Control Flow & Loops',
        order: 2,
        subConcepts: ['if-else', 'for-loops', 'while-loops', 'comprehensions'],
        questions: [
          { id: 'q3', question: 'What is the result of [x**2 for x in range(3)]?', options: ['[1, 4, 9]', '[0, 1, 4]', '[0, 1, 2]', '[1, 2, 3]'], correctIndex: 1, subConcept: 'comprehensions' },
          { id: 'q4', question: 'Which loop statement terminates the loop execution immediately?', options: ['continue', 'pass', 'break', 'exit'], correctIndex: 2, subConcept: 'while-loops' }
        ],
        resources: {
          videos: [{ title: 'Python Control Flow & Loops – Corey Schafer', url: 'https://www.youtube.com/watch?v=6iF8Xb7Z3wQ', duration: '45m' }],
          courses: [{ title: 'Python Control Flow Guide', url: 'https://docs.python.org/3/tutorial/controlflow.html' }],
          exercises: [{ title: 'Loop & Filter Challenge', problemId: 'py-2' }]
        }
      },
      {
        id: 'py-functions',
        name: 'Functions & Scope',
        order: 3,
        subConcepts: ['def', 'mutable-defaults', 'args-kwargs', 'lambdas'],
        questions: [
          { id: 'q5', question: 'def fn(a, b=[]): b.append(a); return b. What does calling fn(1) then fn(2) return?', options: ['[2]', '[1, 2]', '[1], [2]', 'Error'], correctIndex: 1, subConcept: 'mutable-defaults' },
          { id: 'q6', question: 'What is the data type of *args inside a function?', options: ['List', 'Tuple', 'Dictionary', 'Set'], correctIndex: 1, subConcept: 'args-kwargs' }
        ],
        resources: {
          videos: [{ title: 'Python Functions & Scope Deep Dive', url: 'https://www.youtube.com/watch?v=9Os0o3wzS_I', duration: '1h' }],
          courses: [{ title: 'Defining Functions in Python', url: 'https://realpython.com/defining-your-own-python-function/' }],
          exercises: [{ title: 'Function Refactoring Lab', problemId: 'py-3' }]
        }
      },
      {
        id: 'py-data-struct',
        name: 'Data Structures & Collections',
        order: 4,
        subConcepts: ['lists', 'dicts', 'sets', 'tuples', 'immutability'],
        questions: [
          { id: 'q7', question: 'What is printed by: nums = [1, 2]; res = nums.append(3); print(res)?', options: ['[1, 2, 3]', 'None', '3', 'Error'], correctIndex: 1, subConcept: 'lists' },
          { id: 'q8', question: 'Which collection is immutable and hashable as a dict key?', options: ['List', 'Dict', 'Set', 'Tuple'], correctIndex: 3, subConcept: 'immutability' }
        ],
        resources: {
          videos: [{ title: 'Python Data Structures Masterclass', url: 'https://www.youtube.com/watch?v=W8KRzm-HUcc', duration: '1h 15m' }],
          courses: [{ title: 'Python Data Structures Overview', url: 'https://realpython.com/python-data-structures/' }],
          exercises: [{ title: 'Immutable Key Cleaner', problemId: 'py-4' }]
        }
      },
      {
        id: 'py-oop',
        name: 'Object-Oriented Programming (OOP)',
        order: 5,
        subConcepts: ['classes', 'dunder-new', 'super-inheritance', 'polymorphism'],
        questions: [
          { id: 'q9', question: 'Which method constructs a new instance before __init__ is called?', options: ['__new__', '__init__', '__create__', '__setup__'], correctIndex: 0, subConcept: 'dunder-new' },
          { id: 'q10', question: 'How do you call a method from the parent class in Python?', options: ['parent.method()', 'super().method()', 'self.parent.method()', 'base.method()'], correctIndex: 1, subConcept: 'super-inheritance' }
        ],
        resources: {
          videos: [{ title: 'Python OOP Course – Corey Schafer', url: 'https://www.youtube.com/watch?v=JeznW_7DlB0', duration: '2h' }],
          courses: [{ title: 'OOP in Python 3 Guide', url: 'https://realpython.com/python3-object-oriented-programming/' }],
          exercises: [{ title: 'Class Inheritance Challenge', problemId: 'py-5' }]
        }
      }
    ]
  },

  'deep learning': {
    skillName: 'Deep Learning',
    nodes: [
      {
        id: 'dl-fundamentals',
        name: 'Neural Network Fundamentals',
        order: 1,
        subConcepts: ['perceptrons', 'activation-functions', 'forward-pass', 'weights-biases'],
        questions: [
          { id: 'q1', question: 'Which activation function suffers most from vanishing gradients in deep networks?', options: ['ReLU', 'Sigmoid', 'Leaky ReLU', 'ELU'], correctIndex: 1, subConcept: 'activation-functions' },
          { id: 'q2', question: 'What is the role of bias in a neural network layer?', options: ['Scales input', 'Shifts activation function left/right', 'Normalizes batch', 'Calculates loss'], correctIndex: 1, subConcept: 'weights-biases' }
        ],
        resources: {
          videos: [{ title: 'Neural Networks 3Blue1Brown', url: 'https://www.youtube.com/watch?v=aircAruvnKk', duration: '20m' }],
          courses: [{ title: 'Deep Learning Book - Ch 6', url: 'https://www.deeplearningbook.org/' }],
          exercises: [{ title: 'Dense Layer Output Calculator', problemId: 'dl-1' }]
        }
      },
      {
        id: 'dl-loss-opt',
        name: 'Loss Functions & Optimization',
        order: 2,
        subConcepts: ['backpropagation', 'gradient-descent', 'adam', 'cross-entropy'],
        questions: [
          { id: 'q3', question: 'Which optimizer uses both momentum and adaptive learning rates?', options: ['SGD', 'AdaGrad', 'RMSprop', 'Adam'], correctIndex: 3, subConcept: 'adam' },
          { id: 'q4', question: 'For multi-class single-label classification, which loss function is standard?', options: ['MSE', 'Categorical Cross-Entropy', 'Binary Cross-Entropy', 'Huber Loss'], correctIndex: 1, subConcept: 'cross-entropy' }
        ],
        resources: {
          videos: [{ title: 'Backpropagation Calculus – 3Blue1Brown', url: 'https://www.youtube.com/watch?v=tIeHLnjs5U8', duration: '15m' }],
          courses: [{ title: 'PyTorch Loss & Optimizers', url: 'https://pytorch.org/docs/stable/optim.html' }],
          exercises: [{ title: 'Adam Optimizer Implementation', problemId: 'dl-2' }]
        }
      },
      {
        id: 'dl-cnns',
        name: 'Convolutional Networks (CNNs)',
        order: 3,
        subConcepts: ['conv2d', 'max-pooling', 'strides', 'padding'],
        questions: [
          { id: 'q5', question: 'With W=32, Kernel K=3, Padding P=1, Stride S=1, what is output width W_out?', options: ['30', '32', '34', '16'], correctIndex: 1, subConcept: 'conv2d' },
          { id: 'q6', question: 'What is the primary function of Max Pooling?', options: ['Increase channels', 'Reduce spatial dimensions and extract dominant features', 'Add non-linearity', 'Normalize weights'], correctIndex: 1, subConcept: 'max-pooling' }
        ],
        resources: {
          videos: [{ title: 'Convolutional Neural Networks – Stanford CS231n', url: 'https://www.youtube.com/watch?v=bXuxr84ZWHs', duration: '1h' }],
          courses: [{ title: 'CS231n Convolutional Networks', url: 'https://cs231n.github.io/convolutional-networks/' }],
          exercises: [{ title: 'Conv2D Feature Map Dimension Calculator', problemId: 'dl-3' }]
        }
      },
      {
        id: 'dl-transformers',
        name: 'RNNs & Transformers',
        order: 4,
        subConcepts: ['attention', 'self-attention', 'positional-encoding', 'lstm'],
        questions: [
          { id: 'q7', question: 'What formula computes scaled dot-product self-attention?', options: ['Softmax(Q K^T / sqrt(d_k)) V', 'Sigmoid(W X + b)', 'ReLU(Q V / K)', 'Tanh(W_f [h_{t-1}, x_t] + b_f)'], correctIndex: 0, subConcept: 'self-attention' },
          { id: 'q8', question: 'Why do Transformers require positional encodings?', options: ['They process tokens in parallel without inherent order awareness', 'To reduce memory', 'To calculate loss', 'To speed up training'], correctIndex: 0, subConcept: 'positional-encoding' }
        ],
        resources: {
          videos: [{ title: 'Attention is All You Need – Jay Alammar', url: 'https://www.youtube.com/watch?v=gJ9kaJsE78k', duration: '40m' }],
          courses: [{ title: 'Illustrated Transformer Guide', url: 'https://jalammar.github.io/illustrated-transformer/' }],
          exercises: [{ title: 'Self-Attention Matrix Computation', problemId: 'dl-4' }]
        }
      },
      {
        id: 'dl-regularization',
        name: 'Regularization & Architecture',
        order: 5,
        subConcepts: ['dropout', 'batch-norm', 'early-stopping', 'l2-regularization'],
        questions: [
          { id: 'q9', question: 'What does Dropout do during neural network training?', options: ['Zeroes weights permanently', 'Randomly drops activations with probability p per step', 'Removes layers', 'Halves learning rate'], correctIndex: 1, subConcept: 'dropout' },
          { id: 'q10', question: 'Batch Normalization normalizes activations across which dimension?', options: ['Sequence length', 'Batch dimension', 'Layer weights', 'Channel outputs'], correctIndex: 1, subConcept: 'batch-norm' }
        ],
        resources: {
          videos: [{ title: 'Batch Normalization & Dropout – Andrew Ng', url: 'https://www.youtube.com/watch?v=tNIpEZLv_eg', duration: '25m' }],
          courses: [{ title: 'DeepLearning.AI Regularization Guide', url: 'https://www.deeplearning.ai/' }],
          exercises: [{ title: 'Regularization Tuning Challenge', problemId: 'dl-5' }]
        }
      }
    ]
  }
};

// Helper: Get or Generate Skill Graph (Strict Cache-Miss Strategy)
async function getOrGenerateSkillGraph(skillName) {
  const normalizedKey = skillName.toLowerCase().trim();

  // STEP 1: Check MongoDB Cache First (Cache-Miss Only Strategy)
  try {
    const cachedTree = await SkillTree.findOne({ skillName: normalizedKey });
    if (cachedTree && cachedTree.topics && cachedTree.topics.length > 0) {
      console.log(`[Skill Graph Cache HIT] Serving '${skillName}' from MongoDB cache.`);
      return {
        skillName: cachedTree.skillName,
        source: cachedTree.source || 'mongodb_cache',
        nodes: cachedTree.topics.map((t, idx) => ({
          id: t.id || `node-${idx + 1}`,
          name: t.name,
          order: t.order || idx + 1,
          subConcepts: t.subConcepts || [t.name.toLowerCase()],
          questions: (t.diagnosticQuestions || []).map((q, qIdx) => ({
            id: `q-${idx+1}-${qIdx+1}`,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            subConcept: q.subConcept || 'general'
          })),
          resources: {
            videos: t.resources?.primary ? [{ title: t.resources.primary.title, url: t.resources.primary.url, duration: t.resources.primary.duration || '1h' }] : [],
            courses: t.resources?.alternates ? t.resources.alternates.map(a => ({ title: a.title, url: a.url })) : [],
            exercises: [{ title: `${t.name} Hands-on Challenge`, problemId: t.problemIds?.[0] || idx + 1 }]
          }
        }))
      };
    }
  } catch (dbErr) {
    console.warn('[Skill Graph Cache Read Warning]:', dbErr.message);
  }

  // STEP 2: Check Curated Static Dict Fallback
  if (CURATED_SKILL_GRAPHS[normalizedKey]) {
    console.log(`[Skill Graph Curated HIT] Serving '${skillName}' from static blueprint.`);
    const graph = CURATED_SKILL_GRAPHS[normalizedKey];
    // Cache curated tree in MongoDB for consistency
    try {
      await SkillTree.create({
        skillName: normalizedKey,
        source: 'hardcoded',
        topics: graph.nodes.map((n, i) => ({
          id: n.id,
          name: n.name,
          order: n.order,
          diagnosticQuestions: n.questions,
          resources: {
            primary: n.resources.videos[0] ? { type: 'video', url: n.resources.videos[0].url, title: n.resources.videos[0].title } : null,
            alternates: (n.resources.courses || []).map(c => ({ type: 'article', url: c.url, title: c.title }))
          }
        }))
      });
    } catch(e) {}
    return graph;
  }

  // STEP 3: Cache MISS -> Trigger Groq LLM Generation ONCE per skill
  if (!GROQ_API_KEY) {
    throw new Error('Groq API Key missing for dynamic skill generation.');
  }

  console.log(`[Skill Graph Cache MISS] Generating brand new Skill Graph for '${skillName}' via Groq LLM...`);

  const prompt = `Create a structured 5-node Skill Graph for the skill "${skillName}".
Return ONLY valid JSON matching this schema:
{
  "skillName": "${skillName}",
  "nodes": [
    {
      "id": "node-1",
      "name": "Node Title",
      "order": 1,
      "subConcepts": ["concept1", "concept2"],
      "questions": [
        { "id": "q1", "question": "Practical concept/code question text?", "options": ["A", "B", "C", "D"], "correctIndex": 0, "subConcept": "concept1" },
        { "id": "q2", "question": "Second diagnostic question?", "options": ["A", "B", "C", "D"], "correctIndex": 1, "subConcept": "concept2" }
      ],
      "resources": {
        "videos": [{ "title": "Recommended Video Search Query", "url": "https://www.youtube.com/watch?v=kqtD5dpn9C8", "duration": "45m" }],
        "courses": [{ "title": "Official Docs / Guide", "url": "https://docs.google.com" }],
        "exercises": [{ "title": "Practice Challenge", "problemId": "p-1" }]
      }
    }
  ]
}`;

  const res = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    },
    { headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
  );

  const cleanJson = res.data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
  const generatedGraph = JSON.parse(cleanJson);

  // STEP 4: LLM Self-Validation Guardrail
  generatedGraph.nodes.forEach(node => {
    node.questions = (node.questions || []).filter(q => {
      return q.question && Array.isArray(q.options) && q.options.length >= 2 && typeof q.correctIndex === 'number' && q.correctIndex < q.options.length;
    });
  });

  // STEP 5: Persist Generated Graph into MongoDB Cache (Cache-Miss Only Guardrail)
  try {
    await SkillTree.create({
      skillName: normalizedKey,
      source: 'ai_generated',
      topics: generatedGraph.nodes.map(n => ({
        id: n.id,
        name: n.name,
        order: n.order,
        diagnosticQuestions: n.questions,
        resources: {
          primary: n.resources?.videos?.[0] ? { type: 'video', url: n.resources.videos[0].url, title: n.resources.videos[0].title } : null,
          alternates: (n.resources?.courses || []).map(c => ({ type: 'article', url: c.url, title: c.title }))
        }
      }))
    });
    console.log(`[Skill Graph Cached] '${skillName}' successfully saved to MongoDB cache for all future students.`);
  } catch (cacheSaveErr) {
    console.warn('[Skill Graph Cache Save Warning]:', cacheSaveErr.message);
  }

  return generatedGraph;
}

// =========================================================
// STAGE 1: SKILL GENERATOR ENDPOINT
// =========================================================
router.post('/skill-graph', async (req, res) => {
  const { skillName } = req.body;
  if (!skillName) return res.status(400).json({ success: false, message: 'skillName required.' });

  try {
    const graph = await getOrGenerateSkillGraph(skillName);
    res.json({ success: true, skillGraph: graph });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================
// STAGE 3: DIAGNOSTIC ENGINE (Generate 10 Qs across Skill Graph)
// =========================================================
router.post('/generate-diagnostic', async (req, res) => {
  const { userId, skillName } = req.body;
  if (!skillName) return res.status(400).json({ success: false, message: 'skillName required.' });

  try {
    const graph = await getOrGenerateSkillGraph(skillName);
    const diagnosticQuestions = [];

    graph.nodes.forEach(node => {
      node.questions.forEach(q => {
        diagnosticQuestions.push({
          ...q,
          nodeId: node.id,
          nodeName: node.name
        });
      });
    });

    res.json({
      success: true,
      skillName: graph.skillName,
      totalQuestions: diagnosticQuestions.length,
      questions: diagnosticQuestions
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================
// STAGE 4 & 5: EVALUATE DIAGNOSTIC -> STUDENT KNOWLEDGE -> WEAK CONCEPTS -> RECOMMENDATIONS
// =========================================================
router.post('/evaluate-diagnostic', async (req, res) => {
  const { userId = 'guest-user', skillName, answers = [] } = req.body;
  if (!skillName) return res.status(400).json({ success: false, message: 'skillName required.' });

  try {
    const graph = await getOrGenerateSkillGraph(skillName);
    const nodeScores = {};
    const nodeTotal = {};
    const detailedReview = [];

    // Initialize node score counters
    graph.nodes.forEach(n => {
      nodeScores[n.id] = 0;
      nodeTotal[n.id] = 0;
    });

    let totalCorrect = 0;
    let totalQuestions = 0;

    graph.nodes.forEach(node => {
      node.questions.forEach((q, idx) => {
        totalQuestions++;
        nodeTotal[node.id]++;

        const userAns = answers.find(a => a.questionId === q.id || a.questionIndex === totalQuestions - 1);
        const selected = userAns ? userAns.selectedIndex : -1;
        const isCorrect = selected === q.correctIndex;

        if (isCorrect) {
          totalCorrect++;
          nodeScores[node.id]++;
        }

        detailedReview.push({
          questionId: q.id,
          nodeId: node.id,
          nodeName: node.name,
          subConcept: q.subConcept,
          question: q.question,
          options: q.options,
          selectedIndex: selected,
          correctIndex: q.correctIndex,
          isCorrect
        });
      });
    });

    const overallMasteryPct = Math.round((totalCorrect / Math.max(1, totalQuestions)) * 100);

    // Build Student Knowledge Profile
    const studentKnowledge = {
      userId,
      skillName: graph.skillName,
      overallMasteryPct,
      tierMode: overallMasteryPct >= 80 ? 'ADVANCED_PLACEMENT' : overallMasteryPct >= 50 ? 'FAST_TRACK' : 'FOUNDATION',
      nodeStatuses: []
    };

    const weakConcepts = [];
    const recommendations = [];

    graph.nodes.forEach(node => {
      const correct = nodeScores[node.id] || 0;
      const total = nodeTotal[node.id] || 1;
      const pct = Math.round((correct / total) * 100);
      const isWeak = pct < MASTERY_THRESHOLD;

      studentKnowledge.nodeStatuses.push({
        nodeId: node.id,
        nodeName: node.name,
        scorePct: pct,
        status: isWeak ? 'WEAK' : 'STRONG',
        skipped: !isWeak && studentKnowledge.tierMode === 'FAST_TRACK'
      });

      if (isWeak) {
        weakConcepts.push({
          nodeId: node.id,
          nodeName: node.name,
          scorePct: pct,
          subConcepts: node.subConcepts
        });

        recommendations.push({
          nodeId: node.id,
          nodeName: node.name,
          reason: `Scored ${pct}% in ${node.name} (< 70% threshold)`,
          resources: node.resources
        });
      }
    });

    // Save to MongoDB if available
    try {
      await StudentProgress.findOneAndUpdate(
        { userId, skillName: graph.skillName.toLowerCase() },
        {
          overallMastery: overallMasteryPct,
          currentState: studentKnowledge.tierMode === 'FAST_TRACK' ? 'LEARNING' : 'NOT_STARTED',
          weakSubConcepts: weakConcepts.map(w => w.nodeName),
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
    } catch (dbErr) {
      console.warn('MongoDB StudentProgress save skipped:', dbErr.message);
    }

    res.json({
      success: true,
      studentKnowledge,
      weakConcepts,
      recommendations,
      detailedReview
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// =========================================================
// STAGE 6: RE-TEST & UPDATE KNOWLEDGE PIPELINE
// =========================================================
router.post('/retest', async (req, res) => {
  const { userId = 'guest-user', skillName, nodeId, answers = [] } = req.body;
  if (!skillName || !nodeId) return res.status(400).json({ success: false, message: 'skillName & nodeId required.' });

  try {
    const graph = await getOrGenerateSkillGraph(skillName);
    const node = graph.nodes.find(n => n.id === nodeId);

    if (!node) return res.status(404).json({ success: false, message: 'Node not found in Skill Graph.' });

    let correctCount = 0;
    answers.forEach(a => {
      const q = node.questions.find(q => q.id === a.questionId);
      if (q && a.selectedIndex === q.correctIndex) correctCount++;
    });

    const scorePct = Math.round((correctCount / Math.max(1, node.questions.length)) * 100);
    const isPassed = scorePct >= MASTERY_THRESHOLD;

    res.json({
      success: true,
      nodeId,
      nodeName: node.name,
      scorePct,
      isPassed,
      message: isPassed ? `Congratulations! You passed ${node.name} with ${scorePct}%. Node Mastered!` : `Scored ${scorePct}%. Review the 3-resource pack and re-test.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/adaptive/update-knowledge (Update Node & Unlock Next Graph Node)
router.post('/update-knowledge', async (req, res) => {
  const { userId = 'guest-user', skillName, nodeId, scorePct = 100 } = req.body;
  if (!skillName || !nodeId) return res.status(400).json({ success: false, message: 'skillName & nodeId required.' });

  try {
    const graph = await getOrGenerateSkillGraph(skillName);
    const nodeIndex = graph.nodes.findIndex(n => n.id === nodeId);
    const nextNode = graph.nodes[nodeIndex + 1];

    res.json({
      success: true,
      skillName: graph.skillName,
      updatedNodeId: nodeId,
      nodeMasteryPct: scorePct,
      nodeState: scorePct >= MASTERY_THRESHOLD ? 'MASTERED' : 'LEARNING',
      nextUnlockedNode: nextNode ? { id: nextNode.id, name: nextNode.name } : null,
      message: nextNode ? `Node mastered! Next node '${nextNode.name}' unlocked.` : `All Skill Graph nodes mastered!`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
