/**
 * HIERO — Skill Tree Service
 * 3-tier fallback: Hardcoded → Pattern-matched → AI-generated
 * Replaces duplicate logic from mastery.js HARDCODED_TREES and adaptive-mastery.js CURATED_SKILL_GRAPHS
 */

const SkillTree = require('../../models/SkillTree');
const { normalizeSkill, generateGenericQuiz } = require('../../utils/helpers');
const ai = require('../../utils/ai');

// ─── TIER 1: HARDCODED TREES (Always take precedence) ──
const HARDCODED_TREES = {
    'react': {
        source: 'hardcoded',
        topics: [
            { id: 'react-basics', name: 'Components & JSX', order: 1, prerequisites: [], problemIds: [1, 2, 3], passThreshold: 70,
              diagnosticQuestions: [
                { question: 'What is JSX?', options: ['A CSS preprocessor', 'A syntax extension for JavaScript', 'A testing library', 'A state manager'], correctIndex: 1, subConcept: 'jsx' },
                { question: 'Which hook manages local component state?', options: ['useEffect', 'useContext', 'useState', 'useRef'], correctIndex: 2, subConcept: 'hooks' },
                { question: 'What does props stands for?', options: ['Properties', 'Protocols', 'Processes', 'Procedures'], correctIndex: 0, subConcept: 'props' },
                { question: 'How do you pass data from parent to child?', options: ['State', 'Props', 'Context', 'Redux'], correctIndex: 1, subConcept: 'data-flow' },
                { question: 'A React component must return?', options: ['A string', 'A number', 'JSX or null', 'An array only'], correctIndex: 2, subConcept: 'rendering' },
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/embed/SqcY0GlETPk', title: 'React for Beginners – Mosh', duration: '1h', level: 'beginner' },
                alternates: [{ type: 'article', url: 'https://react.dev/learn', title: 'Official React Docs', level: 'beginner' }] }
            },
            { id: 'react-hooks', name: 'Hooks & State', order: 2, prerequisites: ['react-basics'], problemIds: [4, 5], passThreshold: 75,
              diagnosticQuestions: [
                { question: 'What does useEffect cleanup function do?', options: ['Initializes state', 'Runs before unmount', 'Fetches data', 'Renders UI'], correctIndex: 1, subConcept: 'cleanup-functions' },
                { question: 'Empty dependency array in useEffect means?', options: ['Runs every render', 'Runs once on mount', 'Never runs', 'Runs on prop change'], correctIndex: 1, subConcept: 'dependency-array' },
                { question: 'Which hook subscribes to context?', options: ['useRef', 'useState', 'useContext', 'useReducer'], correctIndex: 2, subConcept: 'context' },
                { question: 'useMemo is used for?', options: ['Side effects', 'Memoizing computed values', 'Refs', 'State updates'], correctIndex: 1, subConcept: 'memoization' },
                { question: 'Custom hooks must start with?', options: ['$', 'use', 'fn', 'hook'], correctIndex: 1, subConcept: 'custom-hooks' },
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/embed/O6P86uwfdR0', title: 'React Hooks – Web Dev Simplified', duration: '1h 45m', level: 'intermediate' },
                alternates: [{ type: 'article', url: 'https://react.dev/reference/react', title: 'React Hook Reference', level: 'intermediate' }] }
            },
            { id: 'react-advanced', name: 'Performance & Architecture', order: 3, prerequisites: ['react-hooks'], problemIds: [7, 8, 9], passThreshold: 75,
              diagnosticQuestions: [
                { question: 'React.memo prevents re-render when?', options: ['State changes', 'Props unchanged', 'Context updates', 'Parent re-renders'], correctIndex: 1, subConcept: 'memoization' },
                { question: 'What is code splitting?', options: ['Splitting CSS', 'Lazy loading JS bundles', 'Breaking state', 'Dividing DB'], correctIndex: 1, subConcept: 'performance' },
                { question: 'Redux Toolkit uses?', options: ['Thunks & Slices', 'Observables', 'Proxies', 'Generators'], correctIndex: 0, subConcept: 'state-management' },
                { question: 'Which API renders on server?', options: ['ReactDOM.render', 'renderToString', 'createRoot', 'hydrateRoot'], correctIndex: 1, subConcept: 'ssr' },
                { question: 'React.lazy is for?', options: ['State laziness', 'Dynamic imports', 'API calls', 'Styling'], correctIndex: 1, subConcept: 'performance' },
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/embed/zM_ZiSl2n2E', title: 'Advanced React – Jack Herrington', duration: '3h', level: 'advanced' },
                alternates: [{ type: 'article', url: 'https://react.dev/learn/managing-state', title: 'Advanced State Patterns', level: 'advanced' }] }
            },
        ],
    },
    'python': {
        source: 'hardcoded',
        topics: [
            { id: 'py-syntax', name: 'Core Syntax & Control Flow', order: 1, prerequisites: [], problemIds: [1, 2], passThreshold: 70,
              diagnosticQuestions: [
                { question: 'What is the output of: print(bool([]) or "Python")?', options: ['False', 'True', '"Python"', '[]'], correctIndex: 2, subConcept: 'booleans-truthy' },
                { question: 'What is the key difference between "is" and "==" in Python?', options: ['"is" checks value, "==" checks identity', '"is" checks identity, "==" checks value', 'They are identical', '"is" only works on integers'], correctIndex: 1, subConcept: 'identity-vs-equality' },
                { question: 'What does len() return for an empty dict?', options: ['0', 'None', 'Error', 'Empty string'], correctIndex: 0, subConcept: 'builtins' },
                { question: 'Which keyword defines a function?', options: ['func', 'def', 'function', 'fn'], correctIndex: 1, subConcept: 'functions' },
                { question: 'Python is which type of language?', options: ['Compiled', 'Interpreted', 'Assembly', 'Machine code'], correctIndex: 1, subConcept: 'fundamentals' },
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/watch?v=kqtD5dpn9C8', title: 'Python Syntax & Logic – Mosh', duration: '1h 30m', level: 'beginner' },
                alternates: [{ type: 'article', url: 'https://docs.python.org/3/tutorial/controlflow.html', title: 'Python Control Flow', level: 'beginner' }] }
            },
            { id: 'py-collections', name: 'Data Structures & Collections', order: 2, prerequisites: ['py-syntax'], problemIds: [3, 4], passThreshold: 70,
              diagnosticQuestions: [
                { question: 'What is printed by: numbers = [1, 2, 3]; res = numbers.append(4); print(res)?', options: ['[1, 2, 3, 4]', 'None', '4', 'Error'], correctIndex: 1, subConcept: 'list-mutation' },
                { question: 'Which collection is immutable and hashable?', options: ['List', 'Dictionary', 'Set', 'Tuple'], correctIndex: 3, subConcept: 'immutability' },
                { question: 'dict.get(key) returns what if key is missing?', options: ['Error', 'None', 'False', '0'], correctIndex: 1, subConcept: 'dict-methods' },
                { question: 'Which method adds to the end of a list?', options: ['append()', 'add()', 'push()', 'insert()'], correctIndex: 0, subConcept: 'list-methods' },
                { question: 'Set removes duplicates:', options: ['True', 'False', 'Only in Python 3', 'Only with strings'], correctIndex: 0, subConcept: 'sets' },
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/watch?v=W8KRzm-HUcc', title: 'Python Data Structures – Corey Schafer', duration: '1h', level: 'beginner' },
                alternates: [{ type: 'article', url: 'https://realpython.com/python-data-structures/', title: 'Python Collections Overview', level: 'beginner' }] }
            },
            { id: 'py-functions', name: 'Functions & Scope', order: 3, prerequisites: ['py-collections'], problemIds: [5, 6], passThreshold: 75,
              diagnosticQuestions: [
                { question: 'def func(a, b=[]): b.append(a); return b. Calling func(1) then func(2) returns?', options: ['[2]', '[1, 2]', '[1], [2]', 'Error'], correctIndex: 1, subConcept: 'mutable-defaults' },
                { question: 'What is the data type of *args inside a function?', options: ['List', 'Tuple', 'Dictionary', 'Set'], correctIndex: 1, subConcept: 'args-kwargs' },
                { question: 'lambda functions are:', options: ['Named', 'Anonymous', 'Recursive', 'Classed'], correctIndex: 1, subConcept: 'lambdas' },
                { question: 'scope of a variable inside a function is:', options: ['Global', 'Local', 'Module', 'Universal'], correctIndex: 1, subConcept: 'scope' },
                { question: 'What does return do?', options: ['Prints', 'Exits and sends value', 'Loops', 'Imports'], correctIndex: 1, subConcept: 'return-values' },
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/watch?v=9Os0o3wzS_I', title: 'Python Functions & Scope – Tech with Tim', duration: '1h', level: 'intermediate' },
                alternates: [{ type: 'article', url: 'https://realpython.com/defining-your-own-python-function/', title: 'Functions Deep Dive', level: 'intermediate' }] }
            },
            { id: 'py-oop', name: 'Object-Oriented Programming (OOP)', order: 4, prerequisites: ['py-functions'], problemIds: [7, 8], passThreshold: 75,
              diagnosticQuestions: [
                { question: 'Which method constructs a new object before __init__?', options: ['__new__', '__init__', '__create__', '__setup__'], correctIndex: 0, subConcept: 'dunder-new' },
                { question: 'How do you invoke a parent class method?', options: ['parent.method()', 'super().method()', 'self.parent.method()', 'base.method()'], correctIndex: 1, subConcept: 'super-inheritance' },
                { question: 'Encapsulation means:', options: ['Open access', 'Hiding internal state', 'Deleting methods', 'Global variables'], correctIndex: 1, subConcept: 'encapsulation' },
                { question: '@property decorator is used for:', options: ['Classes', 'Getter/setter methods', 'Imports', 'Loops'], correctIndex: 1, subConcept: 'decorators' },
                { question: 'Multiple inheritance means a class has:', options: ['One parent', 'Two or more parents', 'No parent', 'One child'], correctIndex: 1, subConcept: 'inheritance' },
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/watch?v=JeznW_7DlB0', title: 'Python OOP Course – Corey Schafer', duration: '2h', level: 'intermediate' },
                alternates: [{ type: 'article', url: 'https://realpython.com/python3-object-oriented-programming/', title: 'OOP in Python 3', level: 'intermediate' }] }
            },
            { id: 'py-practical', name: 'Exceptions, File I/O & Practical Python', order: 5, prerequisites: ['py-oop'], problemIds: [9, 10], passThreshold: 75,
              diagnosticQuestions: [
                { question: 'What does "with open() as f:" guarantee?', options: ['Faster reading', 'Auto-close even on exception', 'File locking', 'JSON conversion'], correctIndex: 1, subConcept: 'context-managers' },
                { question: 'try/except/finally: finally runs:', options: ['Only on error', 'Only on success', 'Always', 'Never'], correctIndex: 2, subConcept: 'exception-flow' },
                { question: 'raise keyword is used to:', options: ['Catch errors', 'Create exceptions', 'Import modules', 'Define classes'], correctIndex: 1, subConcept: 'raising-exceptions' },
                { question: 'json.load() reads from:', options: ['String', 'File object', 'URL', 'Database'], correctIndex: 1, subConcept: 'json-io' },
                { question: 'os.path.exists() checks:', options: ['URL reachability', 'File/directory existence', 'Python version', 'Module import'], correctIndex: 1, subConcept: 'file-system' },
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/watch?v=NIWwJbo-9_8', title: 'Python Exception & Context Managers', duration: '1h 15m', level: 'advanced' },
                alternates: [{ type: 'article', url: 'https://docs.python.org/3/tutorial/errors.html', title: 'Python Errors and Exceptions', level: 'advanced' }] }
            },
        ],
    },
};

// ─── TIER 2: PATTERN-MATCHED (Thin 3-topic trees) ──────
const TIER2_SKILLS = {
    'deep learning': ['Neural Networks Basics', 'CNNs & RNNs', 'Transformers & Deployment'],
    'data science': ['Data Wrangling & EDA', 'Statistical Analysis', 'Data Storytelling & Pipelines'],
    'devops': ['CI/CD & Docker', 'Kubernetes & Orchestration', 'Monitoring & SRE'],
    'cloud computing': ['Cloud Basics & Storage', 'Serverless & IAM', 'Multi-Region & IaC'],
    'typescript': ['Types & Interfaces', 'Generics & Decorators', 'Advanced Patterns'],
    'nodejs': ['Node.js Core & Events', 'Express APIs & Middleware', 'Streams, Workers & Scaling'],
    'sql': ['SELECT, WHERE & Filtering', 'JOINs & Aggregations', 'Subqueries, CTEs & Indexes'],
    'docker': ['Containers & Images', 'Docker Compose & Networking', 'Kubernetes Basics'],
    'machine learning': ['Fundamentals & Data Prep', 'Core Algorithms', 'Advanced Models & Deployment'],
    'javascript': ['Core JS & DOM', 'Async JS & APIs', 'Patterns & Architecture'],
};

// ─── MAIN FUNCTION: Build Skill Tree ──────────────────
async function buildSkillTree(rawSkill) {
    const skillName = normalizeSkill(rawSkill);

    // Tier 1: Hardcoded
    const hardcoded = HARDCODED_TREES[skillName];
    if (hardcoded) {
        const treeData = { skillName, source: 'hardcoded', topics: hardcoded.topics };
        try { await SkillTree.findOneAndUpdate({ skillName }, treeData, { upsert: true, new: true }); } catch (e) {}
        return treeData;
    }

    // Check MongoDB cache
    try {
        const cached = await SkillTree.findOne({ skillName });
        if (cached && cached.cachedUntil > new Date()) return cached.toObject();
    } catch (e) {}

    // Tier 2: Pattern-matched
    const tier2Topics = TIER2_SKILLS[skillName];
    if (tier2Topics) {
        const topics = tier2Topics.map((name, i) => ({
            id: `${skillName.replace(/\s/g, '-')}-t${i + 1}`,
            name,
            order: i + 1,
            prerequisites: i > 0 ? [`${skillName.replace(/\s/g, '-')}-t${i}`] : [],
            problemIds: i === 0 ? [1, 2, 3] : i === 1 ? [4, 5, 6] : [7, 8, 9],
            passThreshold: i === 0 ? 70 : 75,
            diagnosticQuestions: generateGenericQuiz(name, skillName),
            resources: {
                primary: { type: 'video', title: `${name} Tutorial`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' tutorial')}`, duration: '1-2h', level: i === 0 ? 'beginner' : i === 1 ? 'intermediate' : 'advanced' },
                alternates: [],
            },
        }));
        const treeData = { skillName, source: 'pattern_matched', topics };
        try { await SkillTree.findOneAndUpdate({ skillName }, treeData, { upsert: true, new: true }); } catch (e) {}
        return treeData;
    }

    // Tier 3: AI-generated
    if (ai.isAvailable()) {
        try {
            const prompt = `Generate a structured learning path for "${rawSkill}".
Return ONLY valid JSON:
{ "topics": [{ "id": "skill-t1", "name": "Topic Name", "order": 1, "prerequisites": [],
  "diagnosticQuestions": [{ "question": "...", "options": ["A","B","C","D"], "correctIndex": 0, "subConcept": "concept" }],
  "resources": { "primary": { "type": "video", "title": "Title", "url": "https://youtube.com", "duration": "1h", "level": "beginner" }},
  "problemIds": [1,2,3], "passThreshold": 70 }] }
Rules: 3-5 topics, 5 questions each, correctIndex 0-3.`;

            const parsed = await ai.generateJSON(prompt);
            const treeData = { skillName, source: 'ai_generated', topics: parsed.topics || [] };
            try { await SkillTree.findOneAndUpdate({ skillName }, treeData, { upsert: true, new: true }); } catch (e) {}
            return treeData;
        } catch (e) {
            console.error(`[Tree] AI generation failed for ${skillName}:`, e.message);
        }
    }

    // Ultimate fallback
    return {
        skillName,
        source: 'fallback',
        topics: [
            { id: `${skillName.replace(/\s/g, '-')}-t1`, name: `${rawSkill} Fundamentals`, order: 1, prerequisites: [], problemIds: [1, 2, 3], passThreshold: 70, diagnosticQuestions: generateGenericQuiz(rawSkill, rawSkill), resources: { primary: { type: 'video', title: `${rawSkill} Beginner Tutorial`, url: '#', duration: '1h', level: 'beginner' }, alternates: [] } },
            { id: `${skillName.replace(/\s/g, '-')}-t2`, name: `Intermediate ${rawSkill}`, order: 2, prerequisites: [`${skillName.replace(/\s/g, '-')}-t1`], problemIds: [4, 5, 6], passThreshold: 75, diagnosticQuestions: generateGenericQuiz(rawSkill + ' intermediate', rawSkill), resources: { primary: { type: 'video', title: `${rawSkill} Intermediate`, url: '#', duration: '2h', level: 'intermediate' }, alternates: [] } },
            { id: `${skillName.replace(/\s/g, '-')}-t3`, name: `Advanced ${rawSkill} Mastery`, order: 3, prerequisites: [`${skillName.replace(/\s/g, '-')}-t2`], problemIds: [7, 8, 9], passThreshold: 75, diagnosticQuestions: generateGenericQuiz(rawSkill + ' advanced', rawSkill), resources: { primary: { type: 'video', title: `Advanced ${rawSkill}`, url: '#', duration: '2h', level: 'advanced' }, alternates: [] } },
        ],
    };
}

module.exports = { buildSkillTree, HARDCODED_TREES };
