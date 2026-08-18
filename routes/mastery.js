const express = require('express');
const router = express.Router();
const axios = require('axios');
const SkillTree = require('../models/SkillTree');
const StudentProgress = require('../models/StudentProgress');
const DiagnosticResult = require('../models/DiagnosticResult');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'llama-3.3-70b-versatile';
const MASTERY_THRESHOLD = 75;

// ─────────────────────────────────────────────────────
// TIER 1 — Hardcoded rich trees for major skills
// ─────────────────────────────────────────────────────
const HARDCODED_TREES = {
    'react': {
        source: 'hardcoded',
        topics: [
            { id: 'react-basics', name: 'Components & JSX', order: 1, prerequisites: [], problemIds: [1, 2, 3], passThreshold: 70,
              diagnosticQuestions: [
                { question: 'What is JSX?', options: ['A CSS preprocessor', 'A syntax extension for JavaScript', 'A testing library', 'A state manager'], correctIndex: 1, subConcept: 'jsx' },
                { question: 'Which hook manages local component state?', options: ['useEffect', 'useContext', 'useState', 'useRef'], correctIndex: 2, subConcept: 'hooks' },
                { question: 'What does props stand for?', options: ['Properties', 'Protocols', 'Processes', 'Procedures'], correctIndex: 0, subConcept: 'props' },
                { question: 'How do you pass data from parent to child?', options: ['State', 'Props', 'Context', 'Redux'], correctIndex: 1, subConcept: 'data-flow' },
                { question: 'A React component must return?', options: ['A string', 'A number', 'JSX or null', 'An array only'], correctIndex: 2, subConcept: 'rendering' }
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/embed/SqcY0GlETPk', title: 'React for Beginners – Mosh', duration: '1h', level: 'beginner' },
                alternates: [{ type: 'article', url: 'https://react.dev/learn', title: 'Official React Docs', level: 'beginner' }, { type: 'video', url: 'https://www.youtube.com/embed/hQAHSlTtcmY', title: 'React Full Course – freeCodeCamp', duration: '4h', level: 'beginner' }] }
            },
            { id: 'react-hooks', name: 'Hooks & State', order: 2, prerequisites: ['react-basics'], problemIds: [4, 5], passThreshold: 75,
              diagnosticQuestions: [
                { question: 'What does useEffect cleanup function do?', options: ['Initializes state', 'Runs before unmount', 'Fetches data', 'Renders UI'], correctIndex: 1, subConcept: 'cleanup-functions' },
                { question: 'Empty dependency array in useEffect means?', options: ['Runs every render', 'Runs once on mount', 'Never runs', 'Runs on prop change'], correctIndex: 1, subConcept: 'dependency-array' },
                { question: 'Which hook subscribes to context?', options: ['useRef', 'useState', 'useContext', 'useReducer'], correctIndex: 2, subConcept: 'context' },
                { question: 'useMemo is used for?', options: ['Side effects', 'Memoizing computed values', 'Refs', 'State updates'], correctIndex: 1, subConcept: 'memoization' },
                { question: 'Custom hooks must start with?', options: ['$', 'use', 'fn', 'hook'], correctIndex: 1, subConcept: 'custom-hooks' }
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
                { question: 'React.lazy is for?', options: ['State laziness', 'Dynamic imports', 'API calls', 'Styling'], correctIndex: 1, subConcept: 'performance' }
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/embed/zM_ZiSl2n2E', title: 'Advanced React – Jack Herrington', duration: '3h', level: 'advanced' },
                alternates: [{ type: 'article', url: 'https://react.dev/learn/managing-state', title: 'Advanced State Patterns', level: 'advanced' }] }
            }
        ]
    },
    'python': {
        source: 'hardcoded',
        topics: [
            { id: 'py-syntax', name: 'Core Syntax & Control Flow', order: 1, prerequisites: [], problemIds: [1, 2], passThreshold: 70,
              diagnosticQuestions: [
                { question: 'What is the output of: print(bool([]) or "Python")?', options: ['False', 'True', '"Python"', '[]'], correctIndex: 2, subConcept: 'booleans-truthy' },
                { question: 'What is the key difference between the "is" operator and "==" in Python?', options: ['"is" checks value equality, "==" checks memory identity', '"is" checks memory identity, "==" checks value equality', 'They are identical', '"is" only works on integers'], correctIndex: 1, subConcept: 'identity-vs-equality' }
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/watch?v=kqtD5dpn9C8', title: 'Python Syntax & Logic – Mosh', duration: '1h 30m', level: 'beginner' },
                alternates: [{ type: 'article', url: 'https://docs.python.org/3/tutorial/controlflow.html', title: 'Python Control Flow', level: 'beginner' }] }
            },
            { id: 'py-collections', name: 'Data Structures & Collections', order: 2, prerequisites: ['py-syntax'], problemIds: [3, 4], passThreshold: 70,
              diagnosticQuestions: [
                { question: 'What is printed by: numbers = [1, 2, 3]; res = numbers.append(4); print(res)?', options: ['[1, 2, 3, 4]', 'None', '4', 'Error'], correctIndex: 1, subConcept: 'list-mutation' },
                { question: 'Which collection is immutable and hashable (usable as a dict key)?', options: ['List', 'Dictionary', 'Set', 'Tuple'], correctIndex: 3, subConcept: 'immutability' }
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/watch?v=W8KRzm-HUcc', title: 'Python Data Structures – Corey Schafer', duration: '1h', level: 'beginner' },
                alternates: [{ type: 'article', url: 'https://realpython.com/python-data-structures/', title: 'Python Collections Overview', level: 'beginner' }] }
            },
            { id: 'py-functions', name: 'Functions & Scope', order: 3, prerequisites: ['py-collections'], problemIds: [5, 6], passThreshold: 75,
              diagnosticQuestions: [
                { question: 'def func(a, b=[]): b.append(a); return b\nWhat does calling func(1) followed by func(2) return?', options: ['[2]', '[1, 2]', '[1], [2]', 'Error'], correctIndex: 1, subConcept: 'mutable-defaults' },
                { question: 'What is the data type of *args inside a Python function?', options: ['List', 'Tuple', 'Dictionary', 'Set'], correctIndex: 1, subConcept: 'args-kwargs' }
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/watch?v=9Os0o3wzS_I', title: 'Python Functions & Scope – Tech with Tim', duration: '1h', level: 'intermediate' },
                alternates: [{ type: 'article', url: 'https://realpython.com/defining-your-own-python-function/', title: 'Python Functions Deep Dive', level: 'intermediate' }] }
            },
            { id: 'py-oop', name: 'Object-Oriented Programming (OOP)', order: 4, prerequisites: ['py-functions'], problemIds: [7, 8], passThreshold: 75,
              diagnosticQuestions: [
                { question: 'Which method actually constructs a new object instance before __init__ is called?', options: ['__new__', '__init__', '__create__', '__setup__'], correctIndex: 0, subConcept: 'dunder-new' },
                { question: 'How do you invoke a method from the parent class inside a child class?', options: ['parent.method()', 'super().method()', 'self.parent.method()', 'base.method()'], correctIndex: 1, subConcept: 'super-inheritance' }
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/watch?v=JeznW_7DlB0', title: 'Python OOP Course – Corey Schafer', duration: '2h', level: 'intermediate' },
                alternates: [{ type: 'article', url: 'https://realpython.com/python3-object-oriented-programming/', title: 'OOP in Python 3', level: 'intermediate' }] }
            },
            { id: 'py-practical', name: 'Exceptions, File I/O & Practical Python', order: 5, prerequisites: ['py-oop'], problemIds: [9, 10], passThreshold: 75,
              diagnosticQuestions: [
                { question: 'What happens when accessing d["missing_key"] on d = {"a": 1} vs d.get("missing_key")?', options: ['Both return None', 'd["missing_key"] raises KeyError; d.get() returns None', 'Both raise KeyError', 'd.get() raises KeyError'], correctIndex: 1, subConcept: 'dict-exception-handling' },
                { question: 'What is the primary benefit of using a "with open(...) as f:" context manager?', options: ['It speeds up file reading', 'It guarantees the file closes automatically even if an exception occurs', 'It locks the file from other processes', 'It converts file data to JSON'], correctIndex: 1, subConcept: 'context-managers' }
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/watch?v=NIWwJbo-9_8', title: 'Python Exception & Context Managers', duration: '1h 15m', level: 'advanced' },
                alternates: [{ type: 'article', url: 'https://docs.python.org/3/tutorial/errors.html', title: 'Python Errors and Exceptions', level: 'advanced' }] }
            }
        ]
    },
    'deep learning': {
        source: 'hardcoded',
        topics: [
            { id: 'dl-fundamentals', name: 'Neural Network Fundamentals & Activations', order: 1, prerequisites: [], problemIds: [1, 2], passThreshold: 70,
              diagnosticQuestions: [
                { question: 'Which activation function helps solve the vanishing gradient problem in deep feedforward networks?', options: ['Sigmoid', 'Tanh', 'ReLU (Rectified Linear Unit)', 'Step Function'], correctIndex: 2, subConcept: 'activations' },
                { question: 'What is the primary purpose of Backpropagation in neural network training?', options: ['Forward pass computation', 'Computing gradients of the loss function via chain rule to update weights', 'Data normalization', 'Shuffling training batches'], correctIndex: 1, subConcept: 'backpropagation' }
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/watch?v=aircAruvnKk', title: 'Neural Networks Deep Learning – 3Blue1Brown', duration: '1h', level: 'beginner' },
                alternates: [{ type: 'article', url: 'https://www.deeplearning.ai/', title: 'DeepLearning.AI Neural Networks', level: 'beginner' }] }
            },
            { id: 'dl-optimization', name: 'Loss Functions & Optimization', order: 2, prerequisites: ['dl-fundamentals'], problemIds: [3, 4], passThreshold: 75,
              diagnosticQuestions: [
                { question: 'Which loss function is standard for multi-class classification with one-hot targets?', options: ['Mean Squared Error (MSE)', 'Categorical Cross-Entropy', 'Binary Cross-Entropy', 'Huber Loss'], correctIndex: 1, subConcept: 'loss-functions' },
                { question: 'What primary advantage does the Adam optimizer offer over standard SGD?', options: ['Guarantees global minimum', 'Adapts learning rates for each parameter using momentum & squared gradients', 'Eliminates need for GPUs', 'Prevents overfitting without data'], correctIndex: 1, subConcept: 'optimizers' }
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/watch?v=IHZwWFHWa-w', title: 'Gradient Descent & Optimizers – StatQuest', duration: '45m', level: 'intermediate' },
                alternates: [{ type: 'article', url: 'https://pytorch.org/docs/stable/optim.html', title: 'PyTorch Optimizers Guide', level: 'intermediate' }] }
            },
            { id: 'dl-cnn', name: 'Convolutional Neural Networks (CNNs)', order: 3, prerequisites: ['dl-optimization'], problemIds: [5, 6], passThreshold: 75,
              diagnosticQuestions: [
                { question: 'In a CNN architecture, what is the main purpose of Max Pooling layers?', options: ['Increase spatial resolution', 'Downsample spatial dimensions and provide translation invariance', 'Multiply matrix weights', 'Apply non-linear activation'], correctIndex: 1, subConcept: 'pooling' },
                { question: 'Which layer flattens 2D spatial feature maps into a 1D vector before fully connected dense layers?', options: ['Convolutional layer', 'Flatten layer', 'Dropout layer', 'Batch Normalization'], correctIndex: 1, subConcept: 'flatten-layer' }
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/watch?v=YRhxdVk_sIs', title: 'CNN Architectures Explained', duration: '1h 15m', level: 'intermediate' },
                alternates: [{ type: 'article', url: 'https://cs231n.github.io/convolutional-networks/', title: 'Stanford CS231n CNN Guide', level: 'intermediate' }] }
            },
            { id: 'dl-rnn-transformers', name: 'RNNs, LSTMs & Transformers', order: 4, prerequisites: ['dl-cnn'], problemIds: [7, 8], passThreshold: 75,
              diagnosticQuestions: [
                { question: 'What mechanism allows Transformer architectures to process entire sequence tokens in parallel?', options: ['Recurrent loops', 'Self-Attention mechanism', 'Stochastic pooling', 'Max-margin loss'], correctIndex: 1, subConcept: 'self-attention' },
                { question: 'Why are LSTM networks preferred over standard vanilla RNNs for long sequence tasks?', options: ['They have zero parameters', 'Forget and input gates prevent vanishing/exploding gradients over long time steps', 'They only process images', 'They do not require backpropagation'], correctIndex: 1, subConcept: 'lstm-gating' }
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/watch?v=asioU_x_Y7o', title: 'Transformers & Attention – Jay Alammar', duration: '1h 30m', level: 'advanced' },
                alternates: [{ type: 'article', url: 'https://jalammar.github.io/illustrated-transformer/', title: 'The Illustrated Transformer', level: 'advanced' }] }
            },
            { id: 'dl-regularization', name: 'Regularization & Overfitting Prevention', order: 5, prerequisites: ['dl-rnn-transformers'], problemIds: [9, 10], passThreshold: 75,
              diagnosticQuestions: [
                { question: 'How does Dropout regularize a deep neural network during training?', options: ['Permanently deletes weights', 'Randomly sets a fraction of neuron outputs to 0 at each training step', 'Scales learning rate by 10x', 'Doubles training batch size'], correctIndex: 1, subConcept: 'dropout' },
                { question: 'Which behavior indicates that a Deep Learning model is experiencing Overfitting?', options: ['Training loss decreases while Validation loss increases/stagnates', 'Both training and validation loss decrease together', 'Validation loss is lower than training loss', 'Gradients become zero on step 1'], correctIndex: 0, subConcept: 'overfitting-detection' }
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/watch?v=QzzYCeD76g0', title: 'Deep Learning Regularization & Batch Norm', duration: '1h', level: 'advanced' },
                alternates: [{ type: 'article', url: 'https://www.deeplearningbook.org/contents/regularization.html', title: 'Deep Learning Book – Regularization', level: 'advanced' }] }
            }
        ]
    },
    'javascript': {
        source: 'hardcoded',
        topics: [
            { id: 'js-core', name: 'Core JS & DOM', order: 1, prerequisites: [], problemIds: [1, 2, 3], passThreshold: 70,
              diagnosticQuestions: [
                { question: 'typeof null returns?', options: ['"null"', '"object"', '"undefined"', '"boolean"'], correctIndex: 1, subConcept: 'types' },
                { question: 'let is block-scoped: true or false?', options: ['False', 'True', 'Depends', 'Never'], correctIndex: 1, subConcept: 'scoping' },
                { question: 'Arrow functions do not have their own?', options: ['Arguments', 'this', 'Both', 'Neither'], correctIndex: 2, subConcept: 'arrow-functions' },
                { question: 'Promises represent?', options: ['Sync values', 'Async operations', 'Arrays', 'Objects'], correctIndex: 1, subConcept: 'promises' },
                { question: 'JSON.parse converts?', options: ['Object to string', 'String to object', 'Array to map', 'Number to string'], correctIndex: 1, subConcept: 'json' }
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/embed/W6NZfCO5SIk', title: 'JavaScript for Beginners – Mosh', duration: '1h', level: 'beginner' },
                alternates: [{ type: 'article', url: 'https://javascript.info', title: 'The Modern JavaScript Tutorial', level: 'beginner' }] }
            },
            { id: 'js-async', name: 'Async JS & APIs', order: 2, prerequisites: ['js-core'], problemIds: [4, 5, 6], passThreshold: 75,
              diagnosticQuestions: [
                { question: 'async/await is built on?', options: ['Callbacks', 'Generators', 'Promises', 'Events'], correctIndex: 2, subConcept: 'async-await' },
                { question: 'fetch() returns a?', options: ['String', 'Promise', 'Object', 'Array'], correctIndex: 1, subConcept: 'fetch' },
                { question: 'Event loop handles?', options: ['Sync code', 'Async callbacks from queue', 'CSS', 'Storage'], correctIndex: 1, subConcept: 'event-loop' },
                { question: 'Promise.all rejects when?', options: ['All resolve', 'Any single rejects', 'All reject', 'None resolve'], correctIndex: 1, subConcept: 'promise-combinators' },
                { question: 'CORS restricts?', options: ['Same-domain requests', 'Cross-origin requests', 'Cookies', 'Cache'], correctIndex: 1, subConcept: 'cors' }
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/embed/H3XIJYEPdus', title: 'Async JS Full Course', duration: '7h', level: 'intermediate' },
                alternates: [{ type: 'article', url: 'https://javascript.info/async', title: 'Async/Await Deep Dive', level: 'intermediate' }] }
            },
            { id: 'js-advanced', name: 'Patterns & Architecture', order: 3, prerequisites: ['js-async'], problemIds: [7, 8, 9], passThreshold: 75,
              diagnosticQuestions: [
                { question: 'Closures capture?', options: ['Global vars only', 'Outer scope variables', 'DOM elements', 'Class properties'], correctIndex: 1, subConcept: 'closures' },
                { question: 'Prototype chain is used for?', options: ['Styling', 'Inheritance', 'Async', 'Events'], correctIndex: 1, subConcept: 'prototypes' },
                { question: 'Debounce delays execution until?', options: ['First call', 'After inactivity period', 'Every call', 'Timeout'], correctIndex: 1, subConcept: 'debounce' },
                { question: 'Module pattern uses?', options: ['IIFE', 'Arrow functions', 'Classes', 'Promises'], correctIndex: 0, subConcept: 'modules' },
                { question: 'Web Workers run in?', options: ['Main thread', 'Separate thread', 'Same scope', 'Server'], correctIndex: 1, subConcept: 'web-workers' }
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/embed/vEROU2XtPR8', title: 'Advanced JavaScript Concepts', duration: '2h', level: 'advanced' },
                alternates: [{ type: 'article', url: 'https://javascript.info/advanced-functions', title: 'JS Advanced Functions', level: 'advanced' }] }
            }
        ]
    },
    'sql': {
        source: 'hardcoded',
        topics: [
            { id: 'sql-basics', name: 'SELECT, WHERE & Filtering', order: 1, prerequisites: [], problemIds: [1, 2, 3], passThreshold: 70,
              diagnosticQuestions: [
                { question: 'SELECT * FROM table returns?', options: ['First row', 'All columns all rows', 'Column names', 'Row count'], correctIndex: 1, subConcept: 'select' },
                { question: 'WHERE clause filters?', options: ['Columns', 'Rows', 'Tables', 'Indexes'], correctIndex: 1, subConcept: 'where' },
                { question: 'ORDER BY default sort is?', options: ['DESC', 'ASC', 'Random', 'Insertion order'], correctIndex: 1, subConcept: 'ordering' },
                { question: 'DISTINCT removes?', options: ['Nulls', 'Duplicates', 'Indexes', 'Joins'], correctIndex: 1, subConcept: 'distinct' },
                { question: 'LIMIT clause restricts?', options: ['Columns returned', 'Number of rows', 'Join depth', 'Subqueries'], correctIndex: 1, subConcept: 'limit' }
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/embed/HXV3zeQKqGY', title: 'SQL Full Course – freeCodeCamp', duration: '4h', level: 'beginner' },
                alternates: [{ type: 'article', url: 'https://sqlzoo.net', title: 'SQLZoo Interactive', level: 'beginner' }, { type: 'interactive', url: 'https://www.w3schools.com/sql/', title: 'W3Schools SQL Try-It', level: 'beginner' }] }
            },
            { id: 'sql-joins', name: 'JOINs & Aggregations', order: 2, prerequisites: ['sql-basics'], problemIds: [4, 5, 6], passThreshold: 75,
              diagnosticQuestions: [
                { question: 'INNER JOIN returns?', options: ['All rows left', 'Matching rows both tables', 'All rows right', 'Unmatched rows'], correctIndex: 1, subConcept: 'inner-join' },
                { question: 'LEFT JOIN returns?', options: ['Only matched', 'All left + matched right', 'Only right', 'Cross product'], correctIndex: 1, subConcept: 'left-join' },
                { question: 'GROUP BY is used with?', options: ['WHERE', 'Aggregate functions', 'ORDER BY only', 'LIMIT'], correctIndex: 1, subConcept: 'group-by' },
                { question: 'HAVING filters?', options: ['Rows before grouping', 'Groups after GROUP BY', 'Columns', 'Joins'], correctIndex: 1, subConcept: 'having' },
                { question: 'COUNT(*) returns?', options: ['Sum of column', 'Number of rows', 'Average', 'Max value'], correctIndex: 1, subConcept: 'aggregates' }
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/embed/9URM1_2S0ho', title: 'SQL JOINs Explained', duration: '1h', level: 'intermediate' },
                alternates: [{ type: 'interactive', url: 'https://pgexercises.com', title: 'PostgreSQL Exercises', level: 'intermediate' }] }
            },
            { id: 'sql-advanced', name: 'Subqueries, CTEs & Indexes', order: 3, prerequisites: ['sql-joins'], problemIds: [7, 8, 9], passThreshold: 75,
              diagnosticQuestions: [
                { question: 'CTE stands for?', options: ['Column Table Entity', 'Common Table Expression', 'Create Table Exec', 'Cross Table Entry'], correctIndex: 1, subConcept: 'cte' },
                { question: 'Window functions operate over?', options: ['Entire table', 'A partition/window of rows', 'Joined tables', 'Groups only'], correctIndex: 1, subConcept: 'window-functions' },
                { question: 'Index speeds up?', options: ['INSERT operations', 'SELECT queries on indexed column', 'DELETE operations', 'Schema changes'], correctIndex: 1, subConcept: 'indexes' },
                { question: 'EXPLAIN shows?', options: ['Query result', 'Execution plan', 'Schema', 'Index list'], correctIndex: 1, subConcept: 'query-optimization' },
                { question: 'Correlated subquery references?', options: ['Static values', 'Outer query row', 'Another table', 'CTE'], correctIndex: 1, subConcept: 'subqueries' }
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/embed/JxmIAVFkeMU', title: 'Advanced SQL – Socratica', duration: '1h 30m', level: 'advanced' },
                alternates: [{ type: 'article', url: 'https://mode.com/sql-tutorial/', title: 'Mode Analytics SQL Tutorial', level: 'advanced' }] }
            }
        ]
    },
    'docker': {
        source: 'hardcoded',
        topics: [
            { id: 'docker-basics', name: 'Containers & Images', order: 1, prerequisites: [], problemIds: [1, 2, 3], passThreshold: 70,
              diagnosticQuestions: [
                { question: 'A Docker image is?', options: ['Running process', 'Read-only template', 'Storage volume', 'Network config'], correctIndex: 1, subConcept: 'images' },
                { question: 'docker run creates?', options: ['An image', 'A container from an image', 'A volume', 'A network'], correctIndex: 1, subConcept: 'containers' },
                { question: 'Dockerfile FROM specifies?', options: ['Output file', 'Base image', 'Entry point', 'Port'], correctIndex: 1, subConcept: 'dockerfile' },
                { question: 'docker ps shows?', options: ['Images', 'Running containers', 'Volumes', 'Networks'], correctIndex: 1, subConcept: 'cli' },
                { question: 'EXPOSE in Dockerfile?', options: ['Opens firewall', 'Documents port (does not publish)', 'Binds host port', 'Creates volume'], correctIndex: 1, subConcept: 'networking' }
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/embed/fqMOX6JJhGo', title: 'Docker Crash Course – freeCodeCamp', duration: '2h', level: 'beginner' },
                alternates: [{ type: 'article', url: 'https://docs.docker.com/get-started/', title: 'Official Docker Get Started', level: 'beginner' }] }
            },
            { id: 'docker-compose', name: 'Docker Compose & Networking', order: 2, prerequisites: ['docker-basics'], problemIds: [4, 5, 6], passThreshold: 75,
              diagnosticQuestions: [
                { question: 'docker-compose up does?', options: ['Builds image only', 'Starts all defined services', 'Stops containers', 'Removes volumes'], correctIndex: 1, subConcept: 'compose' },
                { question: 'Services in compose communicate via?', options: ['Host networking only', 'Service name as hostname', 'IP addresses', 'Env vars'], correctIndex: 1, subConcept: 'networking' },
                { question: 'volumes: in compose is for?', options: ['Memory limits', 'Persistent storage', 'CPU limits', 'Port mapping'], correctIndex: 1, subConcept: 'volumes' },
                { question: 'depends_on ensures?', options: ['Readiness checks', 'Start order', 'Health checks', 'Resource limits'], correctIndex: 1, subConcept: 'dependencies' },
                { question: '.env file in compose is used for?', options: ['Dockerfile commands', 'Environment variables', 'Build args only', 'Labels'], correctIndex: 1, subConcept: 'env-vars' }
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/embed/HG6yIjqMVyE', title: 'Docker Compose – TechWorld with Nana', duration: '1h', level: 'intermediate' },
                alternates: [{ type: 'article', url: 'https://docs.docker.com/compose/', title: 'Docker Compose Docs', level: 'intermediate' }] }
            }
        ]
    },
    'machine learning': {
        source: 'hardcoded',
        topics: [
            { id: 'ml-fundamentals', name: 'Fundamentals & Data Prep', order: 1, prerequisites: [], problemIds: [1, 2, 3], passThreshold: 70,
              diagnosticQuestions: [
                { question: 'Supervised learning uses?', options: ['Unlabeled data', 'Labeled data', 'Reward signals', 'Clustering'], correctIndex: 1, subConcept: 'supervised-learning' },
                { question: 'Overfitting means?', options: ['Model too simple', 'Model memorizes training data', 'Missing features', 'Wrong metric'], correctIndex: 1, subConcept: 'overfitting' },
                { question: 'Train/test split purpose?', options: ['Speed up training', 'Evaluate on unseen data', 'Reduce features', 'Normalize data'], correctIndex: 1, subConcept: 'evaluation' },
                { question: 'Feature scaling is important for?', options: ['Decision trees', 'Distance-based algorithms', 'All algorithms equally', 'None'], correctIndex: 1, subConcept: 'preprocessing' },
                { question: 'Cross-validation reduces?', options: ['Training time', 'Evaluation bias', 'Model complexity', 'Feature count'], correctIndex: 1, subConcept: 'cross-validation' }
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/embed/i_LwzRVP7bg', title: 'ML for Beginners – freeCodeCamp', duration: '2h', level: 'beginner' },
                alternates: [{ type: 'article', url: 'https://scikit-learn.org/stable/tutorial/', title: 'Scikit-learn Tutorial', level: 'beginner' }] }
            },
            { id: 'ml-algorithms', name: 'Core Algorithms', order: 2, prerequisites: ['ml-fundamentals'], problemIds: [4, 5, 6], passThreshold: 75,
              diagnosticQuestions: [
                { question: 'k-NN classifies based on?', options: ['Hyperplanes', 'Nearest neighbors', 'Decision rules', 'Probability'], correctIndex: 1, subConcept: 'knn' },
                { question: 'Random Forest is an ensemble of?', options: ['SVMs', 'Decision Trees', 'Neural Networks', 'k-NN'], correctIndex: 1, subConcept: 'ensemble' },
                { question: 'Gradient descent minimizes?', options: ['Accuracy', 'Loss function', 'Feature count', 'Depth'], correctIndex: 1, subConcept: 'gradient-descent' },
                { question: 'SVM finds?', options: ['Cluster centers', 'Optimal decision boundary', 'Nearest neighbor', 'Probability distribution'], correctIndex: 1, subConcept: 'svm' },
                { question: 'L1 regularization causes?', options: ['Weight decay', 'Sparse weights (some = 0)', 'Larger weights', 'No effect'], correctIndex: 1, subConcept: 'regularization' }
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/embed/7eh4d6sabA0', title: 'ML with Python – Tech With Tim', duration: '3h', level: 'intermediate' },
                alternates: [{ type: 'article', url: 'https://scikit-learn.org/stable/user_guide.html', title: 'Scikit-learn User Guide', level: 'intermediate' }] }
            },
            { id: 'ml-advanced', name: 'Advanced Models & Deployment', order: 3, prerequisites: ['ml-algorithms'], problemIds: [7, 8, 9], passThreshold: 75,
              diagnosticQuestions: [
                { question: 'XGBoost is based on?', options: ['Bagging', 'Gradient boosting', 'Bayesian inference', 'K-means'], correctIndex: 1, subConcept: 'boosting' },
                { question: 'SHAP values explain?', options: ['Model architecture', 'Feature importance per prediction', 'Training speed', 'Loss'], correctIndex: 1, subConcept: 'explainability' },
                { question: 'Pickle is used for?', options: ['Visualizing models', 'Serializing/saving models', 'Feature engineering', 'Training'], correctIndex: 1, subConcept: 'deployment' },
                { question: 'Hyperparameter tuning uses?', options: ['Training data', 'Validation set', 'Test set', 'Production data'], correctIndex: 1, subConcept: 'hyperparameter-tuning' },
                { question: 'MLflow is a tool for?', options: ['Data cleaning', 'Experiment tracking', 'Feature scaling', 'Visualization only'], correctIndex: 1, subConcept: 'mlops' }
              ],
              resources: { primary: { type: 'video', url: 'https://www.youtube.com/embed/pqNCD_5r0IU', title: 'ML Model Deployment – Krish Naik', duration: '2h', level: 'advanced' },
                alternates: [{ type: 'article', url: 'https://mlflow.org/docs/latest/index.html', title: 'MLflow Documentation', level: 'advanced' }] }
            }
        ]
    }
};

// Normalize skill name for lookup
function normalizeSkill(s) {
    return (s || '').toLowerCase().trim()
        .replace(/data structures.*/i, 'dsa')
        .replace(/\balgorithm.*\b/gi, 'dsa')
        .replace(/\bjs\b/, 'javascript')
        .replace(/\bml\b/, 'machine learning')
        .replace(/\bnode(\.?js)?\b/i, 'nodejs');
}

// ─────────────────────────────────────────────────────
// buildSkillTree — 3-tier fallback
// ─────────────────────────────────────────────────────
async function buildSkillTree(rawSkill) {
    const skillName = normalizeSkill(rawSkill);

    // Tier 1: Hardcoded trees ALWAYS take precedence over stale DB cache
    const hardcoded = HARDCODED_TREES[skillName];
    if (hardcoded) {
        const treeData = { skillName, source: 'hardcoded', topics: hardcoded.topics };
        try { await SkillTree.findOneAndUpdate({ skillName }, treeData, { upsert: true, new: true }); } catch(e) {}
        return treeData;
    }

    // Check MongoDB cache for non-hardcoded skills
    try {
        const cached = await SkillTree.findOne({ skillName });
        if (cached && cached.cachedUntil > new Date()) {
            return cached.toObject();
        }
    } catch (e) { /* DB might not be ready */ }

    // Tier 2: Pattern-matched (build thin 3-topic tree from existing problems)
    const TIER2_SKILLS = {
        'deep learning': ['Neural Networks Basics', 'CNNs & RNNs', 'Transformers & Deployment'],
        'data science': ['Data Wrangling & EDA', 'Statistical Analysis', 'Data Storytelling & Pipelines'],
        'devops': ['CI/CD & Docker', 'Kubernetes & Orchestration', 'Monitoring & SRE'],
        'cloud computing': ['Cloud Basics & Storage', 'Serverless & IAM', 'Multi-Region & IaC'],
        'cybersecurity': ['Security Basics & OWASP', 'Penetration Testing', 'Zero Trust & SOC'],
        'typescript': ['Types & Interfaces', 'Generics & Decorators', 'Advanced Patterns'],
        'nodejs': ['Node.js Core & Events', 'Express APIs & Middleware', 'Streams, Workers & Scaling'],
        'data mining': ['Data Collection & Cleaning', 'Pattern Recognition', 'Association Rules & Clustering'],
        'mobile development': ['UI Layout & Navigation', 'State & Storage', 'Native Bridges & Deployment']
    };

    const tier2Topics = TIER2_SKILLS[skillName];
    if (tier2Topics) {
        const topics = tier2Topics.map((name, i) => ({
            id: `${skillName.replace(/\s/g, '-')}-t${i+1}`,
            name,
            order: i + 1,
            prerequisites: i > 0 ? [`${skillName.replace(/\s/g, '-')}-t${i}`] : [],
            problemIds: i === 0 ? [1,2,3] : i === 1 ? [4,5,6] : [7,8,9],
            passThreshold: i === 0 ? 70 : 75,
            diagnosticQuestions: generateGenericQuiz(name, skillName),
            resources: { primary: { type: 'video', title: `${name} Tutorial`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' tutorial')}`, duration: '1-2h', level: i === 0 ? 'beginner' : i === 1 ? 'intermediate' : 'advanced' }, alternates: [] },
            roleRelevance: { 'SDE': 0.8, 'Data Analyst': 0.6 }
        }));
        const treeData = { skillName, source: 'pattern_matched', topics };
        try { await SkillTree.findOneAndUpdate({ skillName }, treeData, { upsert: true, new: true }); } catch(e) {}
        return treeData;
    }

    // Tier 3: AI-generated via Groq
    if (GROQ_API_KEY) {
        try {
            const prompt = `You are a curriculum designer. Generate a structured learning path for the skill "${rawSkill}".

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "topics": [
    {
      "id": "skill-t1",
      "name": "Topic Name",
      "order": 1,
      "prerequisites": [],
      "diagnosticQuestions": [
        { "question": "...", "options": ["A","B","C","D"], "correctIndex": 0, "subConcept": "concept-name" }
      ],
      "resources": {
        "primary": { "type": "video", "title": "Title", "url": "https://youtube.com", "duration": "1h", "level": "beginner" }
      },
      "problemIds": [1,2,3],
      "passThreshold": 70
    }
  ]
}

Rules:
- Generate 3-5 topics in logical learning order
- Each topic needs exactly 5 diagnostic questions with 4 options each
- correctIndex is 0-3 (the right answer's position)
- Keep topics practical and job-relevant
- First topic should be beginner, last should be advanced`;

            const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: AI_MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 3000
            }, { headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' } });

            const raw = res.data.choices?.[0]?.message?.content || '';
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                const treeData = { skillName, source: 'ai_generated', topics: parsed.topics || [] };
                try { await SkillTree.findOneAndUpdate({ skillName }, treeData, { upsert: true, new: true }); } catch(e) {}
                return treeData;
            }
        } catch (e) {
            console.error(`[Mastery] AI tree generation failed for ${skillName}:`, e.message);
        }
    }

    // Ultimate fallback — 3 generic topics
    return {
        skillName,
        source: 'ai_generated',
        topics: [
            { id: `${skillName.replace(/\s/g,'-')}-t1`, name: `${rawSkill} Fundamentals`, order: 1, prerequisites: [], problemIds: [1,2,3], passThreshold: 70, diagnosticQuestions: generateGenericQuiz(rawSkill, rawSkill), resources: { primary: { type: 'video', title: `${rawSkill} Beginner Tutorial`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(rawSkill + ' tutorial beginner')}`, duration: '1h', level: 'beginner' }, alternates: [] } },
            { id: `${skillName.replace(/\s/g,'-')}-t2`, name: `Intermediate ${rawSkill}`, order: 2, prerequisites: [`${skillName.replace(/\s/g,'-')}-t1`], problemIds: [4,5,6], passThreshold: 75, diagnosticQuestions: generateGenericQuiz(rawSkill + ' intermediate', rawSkill), resources: { primary: { type: 'video', title: `${rawSkill} Intermediate`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(rawSkill + ' intermediate')}`, duration: '2h', level: 'intermediate' }, alternates: [] } },
            { id: `${skillName.replace(/\s/g,'-')}-t3`, name: `Advanced ${rawSkill} Mastery`, order: 3, prerequisites: [`${skillName.replace(/\s/g,'-')}-t2`], problemIds: [7,8,9], passThreshold: 75, diagnosticQuestions: generateGenericQuiz(rawSkill + ' advanced', rawSkill), resources: { primary: { type: 'video', title: `Advanced ${rawSkill}`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent('advanced ' + rawSkill)}`, duration: '2h', level: 'advanced' }, alternates: [] } }
        ]
    };
}

function generateGenericQuiz(topicName, skillName) {
    return [
        { question: `What is the primary purpose of ${topicName}?`, options: ['Data storage', 'Core functionality of the skill', 'UI rendering', 'Network communication'], correctIndex: 1, subConcept: 'fundamentals' },
        { question: `Which is a best practice in ${skillName}?`, options: ['Ignore errors', 'Write clean, documented code', 'Avoid testing', 'Use global variables'], correctIndex: 1, subConcept: 'best-practices' },
        { question: `A common use case for ${topicName} is?`, options: ['Printing documents', 'Solving real-world technical problems', 'Designing logos', 'Writing emails'], correctIndex: 1, subConcept: 'use-cases' },
        { question: `The first step when learning ${topicName} is?`, options: ['Advanced projects', 'Understanding core concepts', 'Deploying to production', 'Writing tests first'], correctIndex: 1, subConcept: 'learning-path' },
        { question: `${topicName} is most relevant for which role?`, options: ['Graphic Designer', 'Software/Tech roles', 'HR Manager', 'Sales Executive'], correctIndex: 1, subConcept: 'career-relevance' }
    ];
}

// ─────────────────────────────────────────────────────
// Mastery score calculator
// ─────────────────────────────────────────────────────
function calcMasteryPct(progress) {
    const practiceAttempts = progress.practiceAttempts || [];
    const assessmentAttempts = progress.assessmentAttempts || [];

    const practiceScore = practiceAttempts.length > 0
        ? practiceAttempts.reduce((sum, a) => sum + (a.passedTests / Math.max(a.totalTests, 1) * 100), 0) / practiceAttempts.length
        : 0;

    const assessmentScore = assessmentAttempts.length > 0
        ? assessmentAttempts[assessmentAttempts.length - 1].score
        : 0;

    const daysSinceLastAssess = progress.lastAssessedAt
        ? (Date.now() - new Date(progress.lastAssessedAt).getTime()) / (1000 * 60 * 60 * 24)
        : 999;
    const recencyDecay = Math.max(0, 100 - (daysSinceLastAssess * 2));

    return Math.min(100, Math.round(
        (practiceScore * 0.3) + (assessmentScore * 0.6) + (recencyDecay * 0.1)
    ));
}

// ─────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────
// 10-QUESTION FULL-TOPIC DIAGNOSTIC & LEVEL SELECTOR
// ─────────────────────────────────────────────────────

// POST /api/mastery/set-beginner-level — Initialize beginner path (no quiz required)
router.post('/set-beginner-level', async (req, res) => {
    const { userId, skillName } = req.body;
    if (!userId || !skillName) return res.status(400).json({ success: false, error: 'userId and skillName required' });

    try {
        const tree = await buildSkillTree(skillName);
        const normalizedSkill = tree.skillName;
        const firstTopicId = tree.topics[0]?.id || 'topic-1';

        await StudentProgress.findOneAndUpdate(
            { userId, skillName: normalizedSkill },
            {
                $set: {
                    topicId: firstTopicId,
                    startingTopicId: firstTopicId,
                    state: 'LEARNING',
                    masteryPct: 0,
                    weakSubConcepts: [],
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        res.json({
            success: true,
            level: 'beginner',
            startingTopicId: firstTopicId,
            message: `Awesome! We've unlocked the complete ${skillName} roadmap from scratch. Let's start with ${tree.topics[0]?.name || 'Module 1'}!`
        });
    } catch (e) {
        console.error('[Mastery] set-beginner-level error:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
});

// POST /api/mastery/diagnostic-10q — Generate 10 dynamic diagnostic questions (Easy -> Medium -> Hard)
router.post('/diagnostic-10q', async (req, res) => {
    const { userId, skillName } = req.body;
    if (!skillName) return res.status(400).json({ success: false, error: 'skillName required' });

    try {
        const normalizedSkill = skillName.trim();
        let questions = [];

        // Attempt to generate 10 fresh, unique questions using Groq AI with progressive difficulty
        if (GROQ_API_KEY) {
            try {
                const seed = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
                const prompt = `Generate a 10-question diagnostic quiz for the skill "${normalizedSkill}".
CRITICAL DISTRIBUTION & PROGRESSIVE DIFFICULTY RULES:
1. PROGRESSIVE DIFFICULTY ORDER (STRICT EASY TO HARD):
   - Questions 1, 2, 3: EASY level (Fundamental definitions, basic syntax, core concepts).
   - Questions 4, 5, 6, 7: MEDIUM level (Code output predictions, real-world usage scenarios, practical methods).
   - Questions 8, 9, 10: HARD level (Complex debugging, performance optimization, edge cases, design patterns).

2. SUBTOPIC DIVERSITY:
   - Divide "${normalizedSkill}" across EXACTLY 5 distinct sub-topics (2 questions per sub-topic = 10 questions total).

3. QUESTION VARIETY & NOVELTY (Seed: ${seed}):
   - Make all 10 questions unique, practical, and highly specific to "${normalizedSkill}".
   - Include 4-5 practical code snippet or output-prediction questions.

Return ONLY strict valid JSON in this exact structure:
{
  "questions": [
    {
      "id": 1,
      "difficulty": "Easy",
      "question": "What is ...?",
      "options": ["Opt A", "Opt B", "Opt C", "Opt D"],
      "correctIndex": 0,
      "subTopic": "Subtopic Name"
    }
  ]
}`;

                const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                    model: AI_MODEL,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.75,
                    max_tokens: 3500
                }, { headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' } });

                const raw = groqRes.data.choices?.[0]?.message?.content || '';
                const jsonMatch = raw.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (Array.isArray(parsed.questions) && parsed.questions.length >= 8) {
                        questions = parsed.questions;
                    }
                }
            } catch (e) {
                console.warn('[Mastery] Groq 10Q fresh generation error:', e.message);
            }
        }

        // Fallback dynamic quiz generator if AI is not available or returned insufficient questions
        if (!questions || questions.length < 10) {
            questions = generateDynamicSkillQuiz(normalizedSkill);
        }

        // Format difficulty labels explicitly for Q1-Q3 (Easy), Q4-Q7 (Medium), Q8-Q10 (Hard)
        questions = questions.slice(0, 10).map((q, idx) => {
            let diff = 'Easy';
            if (idx >= 3 && idx <= 6) diff = 'Medium';
            else if (idx >= 7) diff = 'Hard';

            return {
                id: idx + 1,
                question: q.question,
                options: q.options,
                subTopic: q.subTopic || 'Core Concepts',
                correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
                difficulty: q.difficulty || diff
            };
        });

        res.json({
            success: true,
            skillName: normalizedSkill,
            questionCount: questions.length,
            questions
        });
    } catch (e) {
        console.error('[Mastery] diagnostic-10q error:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
});

function generateDynamicSkillQuiz(skillName) {
    const s = skillName.trim();
    return [
        // Easy Questions (1 - 3)
        {
            id: 1,
            difficulty: 'Easy',
            subTopic: `Introduction to ${s}`,
            question: `What is the primary role of ${s} in modern development?`,
            options: [
                `Provides foundational tools for building and managing ${s} solutions`,
                `It is strictly used for network database routing`,
                `It replaces HTML and CSS styling for web pages`,
                `It is only used for server operating system installation`
            ],
            correctIndex: 0
        },
        {
            id: 2,
            difficulty: 'Easy',
            subTopic: `Introduction to ${s}`,
            question: `Which of the following best describes a core building block of ${s}?`,
            options: [
                `Declarative and component/module-based architecture`,
                `Manual assembly instructions executed line-by-line`,
                `Unstructured text formatting files`,
                `Static binary image compression`
            ],
            correctIndex: 0
        },
        {
            id: 3,
            difficulty: 'Easy',
            subTopic: `${s} Core Syntax & Conventions`,
            question: `Which standard practice should be followed when working with ${s}?`,
            options: [
                `Maintaining clean modular code and following established framework conventions`,
                `Disabling runtime logging and error handlers`,
                `Using global mutable variables everywhere`,
                `Hardcoding configuration values directly in production logic`
            ],
            correctIndex: 0
        },
        // Medium Questions (4 - 7)
        {
            id: 4,
            difficulty: 'Medium',
            subTopic: `${s} Data Flow & State`,
            question: `In ${s}, how should data changes or state updates be managed efficiently?`,
            options: [
                `By utilizing unidirectional data flow and reactive state management handlers`,
                `By directly mutating private DOM/system memory buffers`,
                `By restarting the server on every user interaction`,
                `By storing all dynamic state in unencrypted cookie text`
            ],
            correctIndex: 0
        },
        {
            id: 5,
            difficulty: 'Medium',
            subTopic: `${s} Data Flow & State`,
            question: `What happens when an async operation fails in ${s}?`,
            options: [
                `The error should be caught using try/catch or promise rejections and handled gracefully`,
                `The application automatically deletes the database`,
                `It silently succeeds with empty data`,
                `The operating system forces a kernel panic`
            ],
            correctIndex: 0
        },
        {
            id: 6,
            difficulty: 'Medium',
            subTopic: `${s} Optimization & Performance`,
            question: `Which technique is recommended to optimize performance in ${s}?`,
            options: [
                `Memoization, lazy loading, and minimizing unnecessary re-renders or queries`,
                `Loading all external dependencies in synchronous blocking calls`,
                `Increasing image resolution without compression`,
                `Running all computation loops on the main single-thread UI thread`
            ],
            correctIndex: 0
        },
        {
            id: 7,
            difficulty: 'Medium',
            subTopic: `${s} Optimization & Performance`,
            question: `What is the expected behavior of a properly configured ${s} module when passed invalid parameters?`,
            options: [
                `It throws a descriptive validation error or warning`,
                `It silently returns null without any feedback`,
                `It freezes the user browser session indefinitely`,
                `It overwrites local user files`
            ],
            correctIndex: 0
        },
        // Hard Questions (8 - 10)
        {
            id: 8,
            difficulty: 'Hard',
            subTopic: `Advanced ${s} Architecture`,
            question: `When designing a scalable enterprise application with ${s}, which pattern prevents tight coupling?`,
            options: [
                `Dependency injection, micro-services/modular abstraction, and decoupled event busses`,
                `Monolithic global scope variables shared across all threads`,
                `Copy-pasting duplicate helper logic into every component file`,
                `Bypassing network security layers for direct client queries`
            ],
            correctIndex: 0
        },
        {
            id: 9,
            difficulty: 'Hard',
            subTopic: `Advanced ${s} Architecture`,
            question: `In high-concurrency environments, how does ${s} handle race conditions or state synchronization?`,
            options: [
                `Through atomic operations, optimistic locking, or state immutability patterns`,
                `By delaying execution for a hardcoded sleep timer of 5 seconds`,
                `By ignoring incoming requests until previous requests crash`,
                `By delegating memory garbage collection to client screens`
            ],
            correctIndex: 0
        },
        {
            id: 10,
            difficulty: 'Hard',
            subTopic: `Production Debugging & Security`,
            question: `Which approach is essential for securing a production ${s} deployment against vulnerabilities?`,
            options: [
                `Input sanitization, secure authentication tokens, and strict HTTPS/CORS policies`,
                `Exposing admin secret keys directly in public frontend bundles`,
                `Disabling SSL encryption for faster throughput`,
                `Storing raw user passwords in plain text localStorage`
            ],
            correctIndex: 0
        }
    ];
}

// POST /api/mastery/grade-diagnostic-10q — Granular scoring (Overall + Topic-wise) & Weak Topic Resource Builder
router.post('/grade-diagnostic-10q', async (req, res) => {
    const { userId, skillName, userAnswers, questions } = req.body;
    if (!userId || !skillName || !userAnswers || !questions) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    try {
        const tree = await buildSkillTree(skillName);
        const normalizedSkill = tree.skillName;

        let totalCorrect = 0;
        const topicStats = {}; // { subTopic: { correct: 0, total: 0 } }

        questions.forEach((q, i) => {
            const ans = userAnswers[i];
            const subTopic = q.subTopic || 'Core';
            if (!topicStats[subTopic]) {
                topicStats[subTopic] = { correct: 0, total: 0 };
            }
            topicStats[subTopic].total += 1;

            if (ans === q.correctIndex) {
                totalCorrect += 1;
                topicStats[subTopic].correct += 1;
            }
        });

        const overallScore = Math.round((totalCorrect / Math.max(questions.length, 1)) * 100);

        // Topic-wise scores breakdown
        const topicScores = {};
        const weakTopics = [];
        const strongTopics = [];

        Object.keys(topicStats).forEach(subTopic => {
            const stat = topicStats[subTopic];
            const pct = Math.round((stat.correct / Math.max(stat.total, 1)) * 100);
            const isWeak = pct < 70;

            topicScores[subTopic] = {
                correct: stat.correct,
                total: stat.total,
                scorePct: pct,
                status: isWeak ? 'WEAK' : 'STRONG'
            };

            if (isWeak) weakTopics.push(subTopic);
            else strongTopics.push(subTopic);
        });

        // Build detailed question-by-question review & explanation breakdown
        const detailedReview = questions.map((q, i) => {
            const userChoice = userAnswers[i];
            const isCorrect = userChoice === q.correctIndex;
            const userOptionText = (userChoice >= 0 && q.options && q.options[userChoice]) ? q.options[userChoice] : 'Not Answered';
            const correctOptionText = (q.options && q.options[q.correctIndex]) ? q.options[q.correctIndex] : 'N/A';

            let explanation = `The correct concept is "${correctOptionText}".`;
            if (isCorrect) {
                explanation = `Great job! You chose "${userOptionText}", which correctly demonstrates mastery in ${q.subTopic || 'this concept'}.`;
            } else {
                explanation = `You selected "${userOptionText}". The correct answer is "${correctOptionText}". Focus on ${q.subTopic || 'this area'} during your study session.`;
            }

            return {
                questionNum: i + 1,
                question: q.question,
                subTopic: q.subTopic || 'Core',
                userAnswerIndex: userChoice,
                userAnswerText: userOptionText,
                correctAnswerIndex: q.correctIndex,
                correctAnswerText: correctOptionText,
                isCorrect,
                explanation
            };
        });

        // Map weak topics to resources
        const personalizedResources = weakTopics.map((topicName, idx) => ({
            topicName,
            resources: [
                { type: 'video', title: `Mastering ${topicName}`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(normalizedSkill + ' ' + topicName + ' tutorial')}`, duration: '1h 30m', level: 'targeted' },
                { type: 'article', title: `${topicName} Deep Dive Guide`, url: `https://google.com/search?q=${encodeURIComponent(normalizedSkill + ' ' + topicName + ' documentation')}`, level: 'targeted' },
                { type: 'interactive', title: `${topicName} Interactive Practice`, url: `solve.html?skill=${encodeURIComponent(normalizedSkill)}&problem=${idx+1}`, level: 'practice' }
            ]
        }));

        // Determine starting topic node based on results
        let startingTopicId = tree.topics[0]?.id || 'topic-1';
        let startingState = 'LEARNING';

        if (overallScore >= 80 && tree.topics.length > 1) {
            startingTopicId = tree.topics[tree.topics.length - 1]?.id || tree.topics[1]?.id;
            startingState = 'PRACTICING';
        } else if (overallScore >= 50) {
            startingTopicId = tree.topics[1]?.id || tree.topics[0]?.id;
            startingState = 'PRACTICING';
        }

        // Save diagnostic result
        try {
            await DiagnosticResult.create({
                userId,
                skillName: normalizedSkill,
                score: overallScore,
                startingTopicId,
                answers: userAnswers
            });
        } catch(e) {}

        // Update StudentProgress
        await StudentProgress.findOneAndUpdate(
            { userId, skillName: normalizedSkill },
            {
                $set: {
                    topicId: startingTopicId,
                    startingTopicId,
                    state: startingState,
                    masteryPct: Math.round(overallScore * 0.4),
                    weakSubConcepts: weakTopics,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        const UserSkill = require('../models/UserSkill');
        const sId = normalizedSkill.toLowerCase().replace(/[^a-z0-9]/g,'');
        const tier = overallScore <= 40 ? 'foundational' : overallScore <= 60 ? 'core' : overallScore < 100 ? 'advanced' : 'masterclass';

        await UserSkill.findOneAndUpdate(
            { userId: userId || 'guest-user', skillId: sId },
            {
                $set: {
                    userId: userId || 'guest-user',
                    skillId: sId,
                    skillName: normalizedSkill,
                    score: overallScore,
                    proficiencyLevel: tier,
                    status: tier === 'masterclass' ? 'mastered' : 'learning',
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        ).catch(() => {});

        res.json({
            success: true,
            skillName: normalizedSkill,
            overallScore,
            topicScores,
            weakTopics,
            strongTopics,
            startingTopicId,
            startingState,
            personalizedResources,
            detailedReview
        });
    } catch (e) {
        console.error('[Mastery] grade-diagnostic-10q error:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
});

// 1. GET /api/mastery/diagnostic — fetch diagnostic quiz for a skill
router.post('/diagnostic', async (req, res) => {

    const { userId, skillName } = req.body;
    if (!skillName) return res.status(400).json({ success: false, error: 'skillName required' });

    try {
        const tree = await buildSkillTree(skillName);
        // Gather first-topic questions for placement
        const questions = tree.topics?.[0]?.diagnosticQuestions || [];
        res.json({ success: true, skillName: tree.skillName, topicCount: tree.topics.length, questions });
    } catch (e) {
        console.error('[Mastery] diagnostic error:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
});

// 2. POST /api/mastery/placement — grade quiz, set starting topic
router.post('/placement', async (req, res) => {
    const { userId, skillName, quizAnswers } = req.body;
    if (!userId || !skillName || !quizAnswers) return res.status(400).json({ success: false, error: 'userId, skillName, quizAnswers required' });

    try {
        const tree = await buildSkillTree(skillName);
        const normalizedSkill = tree.skillName;

        const questions = tree.topics?.[0]?.diagnosticQuestions || [];
        const correct = quizAnswers.filter((ans, i) => questions[i] && ans === questions[i].correctIndex).length;
        const score = Math.round((correct / Math.max(questions.length, 1)) * 100);

        // Placement logic: score >= 80 → skip to topic 2, 40–79 → topic 1 at PRACTICING, < 40 → topic 1 at LEARNING
        let startingTopicId, startingState;
        if (score >= 80 && tree.topics.length > 1) {
            startingTopicId = tree.topics[1].id;
            startingState = 'LEARNING';
        } else if (score >= 40) {
            startingTopicId = tree.topics[0].id;
            startingState = 'PRACTICING';
        } else {
            startingTopicId = tree.topics[0].id;
            startingState = 'LEARNING';
        }

        // Save diagnostic result
        try {
            await DiagnosticResult.create({ userId, skillName: normalizedSkill, score, startingTopicId, answers: quizAnswers });
        } catch(e) {}

        // Upsert StudentProgress
        try {
            await StudentProgress.findOneAndUpdate(
                { userId, skillName: normalizedSkill },
                { $set: { topicId: startingTopicId, startingTopicId, state: startingState, updatedAt: new Date() } },
                { upsert: true }
            );
        } catch(e) {}

        res.json({ success: true, score, startingTopicId, startingState, message: score >= 80 ? 'Strong foundation! Starting at Module 2.' : score >= 40 ? 'Some knowledge detected. Starting at Module 1 — Practice mode.' : 'Starting from the beginning. You got this!' });
    } catch (e) {
        console.error('[Mastery] placement error:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
});

// 3. GET /api/mastery/path/:userId/:skillName — full topic sequence + state
router.get('/path/:userId/:skillName', async (req, res) => {
    const { userId, skillName } = req.params;
    try {
        const tree = await buildSkillTree(skillName);
        const normalizedSkill = tree.skillName;

        let progress = null;
        try {
            progress = await StudentProgress.findOne({ userId, skillName: normalizedSkill });
        } catch(e) {}

        const topicsWithState = tree.topics.map(topic => {
            const isActive = progress?.topicId === topic.id;
            const isCompleted = progress?.assessmentAttempts?.some(a => a.topicId === topic.id && a.passed);
            const prereqsMet = topic.prerequisites.every(prereqId =>
                progress?.assessmentAttempts?.some(a => a.topicId === prereqId && a.passed) || !progress
            );

            return {
                ...topic,
                state: isCompleted ? 'MASTERED' : isActive ? (progress?.state || 'NOT_STARTED') : prereqsMet && !isCompleted ? 'NOT_STARTED' : 'LOCKED',
                masteryPct: isActive ? (progress?.masteryPct || 0) : isCompleted ? 100 : 0,
                locked: !prereqsMet && !isCompleted && !isActive
            };
        });

        res.json({
            success: true,
            skillName: normalizedSkill,
            source: tree.source,
            currentTopicId: progress?.topicId || tree.topics[0]?.id,
            currentState: progress?.state || 'NOT_STARTED',
            overallMastery: progress?.masteryPct || 0,
            topics: topicsWithState
        });
    } catch (e) {
        console.error('[Mastery] path error:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
});

// 4. POST /api/mastery/submit-practice — record coding submission
router.post('/submit-practice', async (req, res) => {
    const { userId, skillName, topicId, passedTests, totalTests } = req.body;
    if (!userId || !skillName) return res.status(400).json({ success: false, error: 'userId and skillName required' });

    const score = Math.round((passedTests / Math.max(totalTests, 1)) * 100);
    const tree = await buildSkillTree(skillName);
    const normalizedSkill = tree.skillName;

    try {
        const progress = await StudentProgress.findOneAndUpdate(
            { userId, skillName: normalizedSkill },
            {
                $push: { practiceAttempts: { topicId, passedTests, totalTests, score, at: new Date() } },
                $set: { updatedAt: new Date() }
            },
            { upsert: true, new: true }
        );

        const newMastery = calcMasteryPct(progress);
        const newState = newMastery >= 60 ? 'ASSESSING' : 'PRACTICING';
        await StudentProgress.updateOne({ userId, skillName: normalizedSkill }, { $set: { masteryPct: newMastery, state: newState } });

        res.json({ success: true, score, masteryPct: newMastery, state: newState, readyForAssessment: newMastery >= 60 });
    } catch (e) {
        console.error('[Mastery] submit-practice error:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
});

// 5. POST /api/mastery/submit-assessment — auto-grade MCQ, advance state
router.post('/submit-assessment', async (req, res) => {
    const { userId, skillName, topicId, answers } = req.body;
    if (!userId || !skillName || !answers) return res.status(400).json({ success: false, error: 'Missing required fields' });

    try {
        const tree = await buildSkillTree(skillName);
        const normalizedSkill = tree.skillName;
        const topic = tree.topics.find(t => t.id === topicId) || tree.topics[0];
        const questions = topic?.diagnosticQuestions || [];

        const correct = answers.filter((ans, i) => questions[i] && ans === questions[i].correctIndex).length;
        const score = Math.round((correct / Math.max(questions.length, 1)) * 100);
        const threshold = topic?.passThreshold || MASTERY_THRESHOLD;
        const passed = score >= threshold;

        // Identify weak sub-concepts from wrong answers
        const weakSubConcepts = answers
            .map((ans, i) => ans !== questions[i]?.correctIndex ? questions[i]?.subConcept : null)
            .filter(Boolean)
            .filter((v, i, a) => a.indexOf(v) === i); // unique

        const progress = await StudentProgress.findOneAndUpdate(
            { userId, skillName: normalizedSkill },
            {
                $push: { assessmentAttempts: { topicId: topic.id, answers, score, passed, weakSubConcepts, at: new Date() } },
                $set: { lastAssessedAt: new Date(), weakSubConcepts: passed ? [] : weakSubConcepts, updatedAt: new Date() }
            },
            { upsert: true, new: true }
        );

        const newMastery = calcMasteryPct(progress);
        let newState;
        if (passed) {
            // Advance to next topic or MASTERED if last topic
            const currentIdx = tree.topics.findIndex(t => t.id === topic.id);
            const nextTopic = tree.topics[currentIdx + 1];
            if (nextTopic) {
                newState = 'LEARNING';
                await StudentProgress.updateOne({ userId, skillName: normalizedSkill }, { $set: { state: 'LEARNING', topicId: nextTopic.id, masteryPct: Math.max(newMastery, score), updatedAt: new Date() } });
            } else {
                newState = 'MASTERED';
                await StudentProgress.updateOne({ userId, skillName: normalizedSkill }, { $set: { state: 'MASTERED', masteryPct: Math.max(newMastery, score), updatedAt: new Date() } });
            }
        } else {
            newState = 'PRACTICING';
            await StudentProgress.updateOne({ userId, skillName: normalizedSkill }, { $set: { state: 'PRACTICING', masteryPct: newMastery, updatedAt: new Date() } });
        }

        res.json({ success: true, score, passed, masteryPct: Math.max(newMastery, passed ? score : 0), state: newState, weakSubConcepts });
    } catch (e) {
        console.error('[Mastery] submit-assessment error:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
});

// 6. GET /api/mastery/overview/:userId — all skills mastery summary
router.get('/overview/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        let records = [];
        try { records = await StudentProgress.find({ userId }); } catch(e) {}

        const skills = records.map(r => ({
            skillName: r.skillName,
            state: r.state,
            masteryPct: r.masteryPct || 0,
            topicId: r.topicId,
            lastUpdated: r.updatedAt
        }));

        const overallReadiness = skills.length > 0
            ? Math.round(skills.reduce((sum, s) => sum + s.masteryPct, 0) / skills.length)
            : 0;

        res.json({ success: true, userId, skills, overallReadiness });
    } catch (e) {
        console.error('[Mastery] overview error:', e.message);
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
