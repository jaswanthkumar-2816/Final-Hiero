const express = require('express');
const axios = require('axios');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Groq } = require('groq-sdk');
const authObj = require('./auth'); // For personalization
const { normalizeResponse } = require('../utils/normalizeResponse');

dotenv.config();

const router = express.Router();

// Env vars
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'llama-3.3-70b-versatile';

// Initialize Groq
const groq = new Groq({ apiKey: GROQ_API_KEY });

// Load Curriculum
let CURRICULUM = {};
try {
    const curPath = path.join(__dirname, '..', 'data', 'curriculum.json');
    if (fs.existsSync(curPath)) {
        CURRICULUM = JSON.parse(fs.readFileSync(curPath, 'utf8'));
    }
} catch (e) { console.error("Curriculum Load Error:", e); }

// Problems DB
const problems = {
    "Data Mining and Pattern Recognition": {
        easy: [
            { id: 1, title: "Basic Data Filtering", description: "Filter a large dataset based on specific temporal and categorical criteria.", hint: "Use pandas `.query()` or SQL `WHERE` clauses." },
            { id: 2, title: "Pattern Identification", description: "Implement a script to identify recurring character patterns in log files.", hint: "Regular expressions (regex) are your best friend here." },
            { id: 3, title: "Interactive Dashboards", description: "Create a simple dashboard showing categorical distributions.", hint: "Use plotly or seaborn for quick interactive charts." }
        ],
        medium: [
            { id: 4, title: "Unsupervised Clustering", description: "Apply K-Means clustering to segment customers based on purchasing behavior.", hint: "Normalize your data before fitting the model." },
            { id: 5, title: "Apriori Association", description: "Find frequent itemsets in transaction data to discover buying rules.", hint: "Look into the 'mlxtend' library for Python." },
            { id: 6, title: "Neural Logic Implementation", description: "Design a decision tree to predict loan eligibility from user profiles.", hint: "Visualize the tree to understand feature importance." }
        ],
        hard: [
            { id: 7, title: "Deep Pattern Recognition", description: "Build an Image Recognition model to detect patterns in medical scans.", hint: "Convolutional Neural Networks (CNN) are suited for spatial pattern detection." },
            { id: 8, title: "Anomaly Detection System", description: "Implement a real-time anomaly detector for network traffic.", hint: "Isolation Forest or One-Class SVM can be very effective." },
            { id: 9, title: "Time-Series Forecasting", description: "Develop a model to predict stock market trends using historical patterns.", hint: "Combine ARIMA with LSTM for better temporal capture." }
        ]
    },
    "Deep Learning": {
        easy: [
            { id: 1, title: "The Neural Atom", description: "Create a mathematical model of a single neuron (Perceptron).", hint: "Recall the sigmoid activation function." },
            { id: 2, title: "MNIST Benchmarking", description: "Achieve 95%+ accuracy on the MNIST digits dataset.", hint: "Start with a simple Feed-Forward Neural Network." },
            { id: 3, title: "Data Augmentation", description: "Programmatically generate 10x more training data using rotations and flips.", hint: "Use Keras' ImageDataGenerator." }
        ],
        medium: [
            { id: 4, title: "Vision Transformers Intro", description: "Implement a simplified Vision Transformer (ViT) for object classification.", hint: "Focus on the self-attention mechanism for image patches." },
            { id: 5, title: "Sentiment Analysis with RNNs", description: "Process 50,000 movie reviews to classify sentiment (Positive/Negative).", hint: "Use Word Embeddings like Word2Vec or GloVe." },
            { id: 6, title: "Object Detection Pipeline", description: "Set up a YOLO-based object detection system on a custom dataset.", hint: "Use the ultralytics library for a fast start." }
        ],
        hard: [
            { id: 7, title: "Generative Adversarial Design", description: "Train a GAN to generate realistic human faces from random noise.", hint: "Balance the loss between the Generator and Discriminator carefully." },
            { id: 8, title: "Transformer from Scratch", description: "Write a multi-head attention layer without using external ML APIs.", hint: "Softmax on (QK^T / sqrt(dk)) * V is the core." },
            { id: 9, title: "RL for Robotics", description: "Train an agent to solve a virtual physics environment using PPO.", hint: "Use the OpenAI Gym environment for simulation." }
        ]
    },
    "Machine Learning": {
        easy: [
            { id: 1, title: "Predictive Analytics 101", description: "Predict house prices using multi-variable linear regression.", hint: "Check for colinearity between features." },
            { id: 2, title: "Iris Species Classification", description: "Correctly label Iris species using K-Nearest Neighbors.", hint: "Experiment with different values of K." },
            { id: 3, title: "Feature Scaling Lab", description: "Compare model performance before and after Min-Max scaling.", hint: "Notice the convergence speed of gradient descent." }
        ],
        medium: [
            { id: 4, title: "Random Forest Ensemble", description: "Combat overfitting in a high-dimensional dataset using Bagging.", hint: "Tune the number of trees and max depth." },
            { id: 5, title: "Kernel SVM Implementation", description: "Classify non-linearly separable data using the RBF kernel.", hint: "Use GridSearch to find the optimal gamma and C." },
            { id: 6, title: "Principal Component Analysis", description: "Reduce 100 features down to 5 components while keeping 90% variance.", hint: "Look at the explained_variance_ratio_." }
        ],
        hard: [
            { id: 7, title: "Gradient Boosting Mastery", description: "Implement an XGBoost model for a Kaggle-level competition.", hint: "Focus on early stopping and learning rate decay." },
            { id: 8, title: "Stacking Models", description: "Create a meta-classifier that learns from the predictions of 5 sub-models.", hint: "Use cross-validation to generate training data for the meta-learner." },
            { id: 9, title: "Reinforcement Learning Gridworld", description: "Build a Q-Learning agent to find the shortest path in a maze.", hint: "Initialize your Q-table with zeros or small random values." }
        ]
    },
    "Python": {
        easy: [
            { id: 1, title: "Logic & Loops", description: "Create a script that calculates primes within a range.", hint: "Use a simple loop with a primality check." },
            { id: 2, title: "File Structuring", description: "Organize directory contents based on file extensions.", hint: "The 'os' and 'shutil' modules are helpful." },
            { id: 3, title: "List Comprehensions", description: "Filter and transform complex lists in a single line.", hint: "[item for item in list if condition]." }
        ],
        medium: [
            { id: 4, title: "OOP Architecture", description: "Design a Library Management System with Inheritance and Polymorphism.", hint: "Think about base classes like 'Item' and subclasses like 'Book'." },
            { id: 5, title: "Multithreaded Scraper", description: "Extract data from 50 pages simultaneously.", hint: "Compare 'threading' vs 'concurrent.futures'." },
            { id: 6, title: "REST API Client", description: "Build a robust interface for a third-party weather API.", hint: "Handle HTTP errors and retry logic with 'requests'." }
        ],
        hard: [
            { id: 7, title: "Meta-Programming", description: "Write a custom decorator that logs execution time and memory usage.", hint: "Use 'functools.wraps' and the 'resource' module." },
            { id: 8, title: "Asyncio Mastery", description: "Build a high-performance chat server using asynchronous sockets.", hint: "Use 'await asyncio.start_server()'." },
            { id: 9, title: "Custom C-Extension", description: "Rewrite a bottleneck Python function in C/C++ to boost performance.", hint: "Look into 'Cython' or 'ctypes' for integration." }
        ]
    },
    "JavaScript": {
        easy: [
            { id: 1, title: "DOM Dynamics", description: "Build a dynamic to-do list that persists in localStorage.", hint: "JSON.stringify() and JSON.parse() are needed." },
            { id: 2, title: "Asynchronous Flow", description: "Fetch user data from JSONPlaceholder and display it in cards.", hint: "Use the modern 'fetch' API with '.then' or 'async/await'." },
            { id: 3, title: "Scope Puzzle", description: "Resolve a common 'this' context issue in a set of nested functions.", hint: "Arrow functions inherit 'this' from their parent scope." }
        ],
        medium: [
            { id: 4, title: "Infinite Scroll Logic", description: "Implement efficient pagination that loads more items as you scroll.", hint: "Use IntersectionObserver for performance." },
            { id: 5, title: "Functional JS", description: "Process a complex data tree using Recursion and Map/Reduce.", hint: "Avoid side effects and mutation." },
            { id: 6, title: "State Machine", description: "Build a visual workflow editor using a finite state machine logic.", hint: "Define states and transitions explicitly." }
        ],
        hard: [
            { id: 7, title: "Custom VDOM Core", description: "Implement a minimal Virtual DOM diffing engine from scratch.", hint: "Contrast the previous and current trees to find the minimal patch." },
            { id: 8, title: "Web Workers", description: "Offload heavy prime calculations to a background thread to keep UI smooth.", hint: "Use 'postMessage' to communicate between threads." },
            { id: 9, title: "Micro-Frontend Shell", description: "Design a shell that dynamically loads different JS modules as iframes or containers.", hint: "SystemJS can help with dynamic imports." }
        ]
    },
    "React": {
        easy: [
            { id: 1, title: "Component Basics", description: "Create a reusable 'User Card' component with customized props.", hint: "Destructure your props for cleaner code." },
            { id: 2, title: "State Hooks", description: "Build an interactive counter with 'undo' functionality.", hint: "Keep a history array in your state." },
            { id: 3, title: "Form Synchronization", description: "Handle a multi-input form using a single change handler.", hint: "Use the 'name' attribute on inputs." }
        ],
        medium: [
            { id: 4, title: "Effect Lifecycle", description: "Sync a component with a WebSocket stream for real-time updates.", hint: "Remember to clean up effects to avoid memory leaks." },
            { id: 5, title: "Custom Hook Design", description: "Create a 'useLocalStorage' hook for seamless data persistence.", hint: "Ensure it behaves like standard useState." },
            { id: 6, title: "Compound Components", description: "Implement a flexible Accordion using the Compound Component pattern.", hint: "Use React.Children.map to inject props." }
        ],
        hard: [
            { id: 7, title: "Advanced Performance", description: "Optimizing 1,000+ items list using virtualization and memoization.", hint: "React.memo and react-window are essential." },
            { id: 8, title: "Global State Architecture", description: "Set up a Redux Toolkit slice with Thunks for complex async data.", hint: "Use createAsyncThunk for standardized loading states." },
            { id: 9, title: "Hydration & SSR", description: "Implement Server Side Rendering with hydration for a Next.js-like feel.", hint: "ReactDOM.hydrate is used on the client." }
        ]
    },
    "Cloud Computing": {
        easy: [
            { id: 1, title: "Cloud Storage Hosting", description: "Host a static website using an S3 bucket or GCP Storage.", hint: "Enable public access and set index.html as the entry point." },
            { id: 2, title: "Serverless Function", description: "Deploy a basic HTTP Lambda/Cloud Function that returns a greeting.", hint: "Test it using the built-in console tester." },
            { id: 3, title: "IAM Management", description: "Create a user with 'Least Privilege' permissions to access only one folder.", hint: "Use JSON-based IAM policies." }
        ],
        medium: [
            { id: 4, title: "Auto-Scaling Setup", description: "Configure an Auto-Scaling Group that reacts to CPU utilization spikes.", hint: "Set up a Load Balancer to distribute the traffic." },
            { id: 5, title: "Serverless Pipeline", description: "Connect an S3 trigger to a Lambda function to resize images automatically.", hint: "The trigger is an 'Object Created' event." },
            { id: 6, title: "VPC Networking", description: "Design a private subnet for your database and a public one for your web server.", hint: "Use NAT Gateways for private subnet internet access." }
        ],
        hard: [
            { id: 7, title: "Multi-Region Hub", description: "Architect a global application with latency-based routing across 3 regions.", hint: "Use Route53 or Global Server Load Balancing." },
            { id: 8, title: "Infrastructure as Code", description: "Deploy a full 3-tier architecture using Terraform or CloudFormation.", hint: "Modularize your code for reuse." },
            { id: 9, title: "Hybrid Cloud Bridge", description: "Set up a Site-to-Site VPN or Direct Connect between an on-prem server and AWS.", hint: "Configure BGP for dynamic routing." }
        ]
    },
    "Cybersecurity": {
        easy: [
            { id: 1, title: "Honeypot 101", description: "Setup a basic honeypot to log unauthorized SSH attempts.", hint: "Tools like 'Cowrie' can simulate an SSH server." },
            { id: 2, title: "Password Hashing Lab", description: "Compare security of MD5, SHA-1, and Argon2 for user passwords.", hint: "Observe why salting is mandatory." },
            { id: 3, title: "XSS Defense", description: "Fix a vulnerable comment section that executes injected scripts.", hint: "Sanitize all user-generated HTML content." }
        ],
        medium: [
            { id: 4, title: "SQL Injection Probe", description: "Demonstrate a blind SQL injection attack on a test environment.", hint: "Try using '1=1' in the parameter string." },
            { id: 5, title: "JWT Security Audit", description: "Crack a weakly signed JWT and modify its payload to become Admin.", hint: "The 'none' algorithm is a classic vulnerability." },
            { id: 6, title: "Network Intrusion Analysis", description: "Identify a port scan attack from a Wireshark PCAP file.", hint: "Look for frequent SYN packets without ACK responses." }
        ],
        hard: [
            { id: 7, title: "Zero Trust Architecture", description: "Implement per-request authentication and continuous verification in a network.", hint: "Use mTLS for all service-to-service communication." },
            { id: 8, title: "Buffer Overflow Exploit", description: "Write a stack-based buffer overflow exploit to gain shell access.", hint: "Find the offset using patterns and overwrite the EIP." },
            { id: 9, title: "SOC Dashboard Build", description: "Integrate ELK Stack with Suricata to monitor real-time network threats.", hint: "Create Kibana visualizations for high-risk alerts." }
        ]
    },
    "DevOps and CI/CD": {
        easy: [
            { id: 1, title: "Docker Containerization", description: "Containerize a simple Node/Python app and run it locally.", hint: "Write a clean Dockerfile starting 'FROM' a base image." },
            { id: 2, title: "GitHub Actions Lab", description: "Automate 'npm test' to run every time you push code.", hint: "The '.github/workflows/main.yml' file controls this." },
            { id: 3, title: "Standard Logs", description: "Centralize application logs using a basic stdout/stderr capture.", hint: "Use 'docker logs' to verify." }
        ],
        medium: [
            { id: 4, title: "Kubernetes Deployment", description: "Deploy a high-availability app with 3 replicas on a K8s cluster.", hint: "Use a 'Deployment' and 'Service' resource. Minikube works for local tests." },
            { id: 5, title: "Jenkins Pipeline", description: "Build a multibranch pipeline with Build, Test, and Stage steps.", hint: "Use a Jenkinsfile for 'Pipeline-as-Code'." },
            { id: 6, title: "Ansible Configuration", description: "Automate the setup of 5 Nginx servers using a single playbook.", hint: "Use inventories and SSH keys for communication." }
        ],
        hard: [
            { id: 7, title: "GitOps Workflow", description: "Implement FluxCD or ArgoCD to sync K8s state with a Git repo.", hint: "Declare your desired state in Git, not via CLI." },
            { id: 8, title: "Blue-Green Deployment", description: "Architect a zero-downtime deployment strategy switching between two environments.", hint: "Modify your Load Balancer target groups." },
            { id: 9, title: "Service Mesh Intro", description: "Deploy Istio to manage traffic, security, and observability between microservices.", hint: "Look into the 'sidecar' pattern." }
        ]
    },
    "Mobile Development": {
        easy: [
            { id: 1, title: "First Layout", description: "Create a simple screen with a centered image and a button.", hint: "Use Flexbox in React Native or Column/Row in Flutter." },
            { id: 2, title: "Native Navigation", description: "Build a 2-screen app using Stack Navigation.", hint: "Understand how to pass parameters between screens." },
            { id: 3, title: "Asset Management", description: "Correctly add and display localized images and custom fonts.", hint: "Add fonts to assets and update the config file." }
        ],
        medium: [
            { id: 4, title: "API Synchronizer", description: "Fetch 1,000 JSON items and display them in a performant List view.", hint: "FlatList or ListView is crucial for memory efficiency." },
            { id: 5, title: "Mobile Persistence", description: "Save user settings (Dark Mode, Language) using SQLite or Hive.", hint: "Ensure data persists even after force-closing the app." },
            { id: 6, title: "Hardware Integration", description: "Access the phone's Camera or GPS to record a user's location/photo.", hint: "Handle permissions gracefully for both iOS and Android." }
        ],
        hard: [
            { id: 7, title: "Offline-First Sync", description: "Implement background sync where data is saved locally and pushed when online.", hint: "Use a sync-queue with background tasks." },
            { id: 8, title: "Custom Native Module", description: "Write a Java/Swift bridge for a feature not available in the cross-platform framework.", hint: "Use MethodChannels in Flutter or Native Modules in React Native." },
            { id: 9, title: "App Store Deployment", description: "Generate production builds (APK/IPA) and configure CI/CD for stores.", hint: "Automate using Fastlane." }
        ]
    },
    "UI/UX Design": {
        easy: [
            { id: 1, title: "Visual Hierarchy", description: "Redesign an 'About Us' page using the F-Pattern layout.", hint: "Prioritize the most important info in the top-left." },
            { id: 2, title: "Accessibility Audit", description: "Fix a color-blind unfriendly dashboard using high-contrast patterns.", hint: "Check your contrast ratios with WCAG standards (4.5:1 min)." },
            { id: 3, title: "Typography Lab", description: "Pair Serif and Sans-Serif fonts effectively for a blog interface.", hint: "Use one for headings and the other for body text." }
        ],
        medium: [
            { id: 4, title: "Interactive Prototyping", description: "Create a high-fidelity prototype with complex conditional transitions in Figma.", hint: "Use 'Variables' and 'Advanced Prototyping' features." },
            { id: 5, title: "Design System Build", description: "Develop a library of 10 reusable components focusing on Atomic Design.", hint: "Start with Atoms (buttons, inputs) work up to Organisms." },
            { id: 6, title: "Information Architecture", description: "Sitemap and wireframe a complex E-commerce app with 20+ pages.", hint: "Focus on user flow and minimizing clicks to purchase." }
        ],
        hard: [
            { id: 7, title: "Micro-Interaction Design", description: "Design a unique 'Success' animation for a checkout process using Lottie/Rive.", hint: "Subtle feedback makes the UX feel premium." },
            { id: 8, title: "A/B Test Design", description: "Propose two distinct Landing Page designs to test a hypothesis on conversion.", hint: "Change only one variable (e.g., CTA button color or headline)." },
            { id: 9, title: "Design System Ops", description: "Set up a shared variable library between Figma and a React codebase using tokens.", hint: "Use 'Design Tokens' to sync CSS and Figma styles." }
        ]
    },
    "Project Management": {
        easy: [
            { id: 1, title: "Scrum Basics", description: "Create a task board (To Do, Doing, Done) for a 2-week sprint.", hint: "Keep tasks atomic so they can be finished in a few days." },
            { id: 2, title: "Gantt Chart 101", description: "Plot a project timeline identifying the Critical Path.", hint: "Focus on task dependencies." },
            { id: 3, title: "Meeting Excellence", description: "Draft a concise agenda and minutes for a stakeholder update.", hint: "Include Actions, Decisons, and Owners." }
        ],
        medium: [
            { id: 4, title: "Risk Mitigation", description: "Identify 5 risks for a software launch and create a mitigation plan.", hint: "Classify by Probability and Impact." },
            { id: 5, title: "Agile Estimation", description: "Conduct a Planning Poker session to estimate a backlog of 20 items.", hint: "Use the Fibonacci sequence (1, 2, 3, 5, 8...)." },
            { id: 6, title: "Stakeholder Mapping", description: "Create a matrix to manage expectations of internal vs external stakeholders.", hint: "Map by Influence vs Interest." }
        ],
        hard: [
            { id: 7, title: "Change Management", description: "Design a rollout plan for a major internal tool shift for 500+ employees.", hint: "Focus on communication, training, and 24/7 support phase." },
            { id: 8, title: "Budget Optimization", description: "Analyze a $100k project budget to identify 15% cost savings without scope cut.", hint: "Look for redundant licenses or resource overallocation." },
            { id: 9, title: "Project Recovery", description: "Take a 'Red' status project and draft a 4-week stabilization plan.", hint: "Re-baseline the scope and increase transparency." }
        ]
    }
};

const langCodes = {
    english: 'en',
    hindi: 'hi',
    telugu: 'te',
    tamil: 'ta',
    kannada: 'kn'
};

// Helper: Normalize any code-like data into markdown blocks (Wrapper for utility)
function normalizeCodeBlock(data) {
    return normalizeResponse(data);
}

// Skill extraction utils
const TECH_SKILL_SET = new Set(['python', 'java', 'javascript', 'js', 'node', 'nodejs', 'react', 'angular', 'vue', 'html', 'css', 'docker', 'kubernetes', 'k8s', 'aws', 'gcp', 'azure', 'git', 'github', 'graphql', 'rest', 'api', 'mongodb', 'mysql', 'postgres', 'sql', 'redis', 'kafka', 'spark', 'pandas', 'numpy', 'tensorflow', 'keras', 'pytorch', 'machine learning', 'deep learning', 'nlp', 'flask', 'django', 'fastapi', 'express', 'typescript', 'c++', 'cpp', 'go', 'golang', 'rust', 'php', 'laravel', 'swift', 'kotlin', 'android', 'ios', 'flutter', 'selenium', 'jest', 'mocha', 'cypress', 'devops', 'microservices', 'oauth', 'jwt', 'security', 'etl', 'tableau', 'powerbi', 'salesforce', 'sap', 'oracle', 'c#', 'dotnet', 'asp.net', 'unity', 'unreal', 'figma', 'adobe', 'photoshop', 'illustrator', 'linux', 'bash', 'shell', 'terraform', 'ansible', 'jenkins', 'circleci', 'travis', 'graphql', 'apollo', 'redux', 'mobx', 'tailwind', 'bootstrap']);
const SOFT_SKILL_SET = new Set(['communication', 'leadership', 'teamwork', 'management', 'strategic', 'planning', 'negotiation', 'presentation', 'stakeholder', 'coordination', 'problem solving', 'critical thinking', 'adaptability', 'collaboration', 'time management', 'organization', 'customer service', 'sales', 'marketing', 'budgeting', 'reporting', 'finance', 'recruitment', 'training', 'mentoring', 'analysis', 'operations', 'project management', 'agile', 'scrum', 'public speaking', 'emotional intelligence', 'conflict resolution', 'decision making', 'creativity', 'innovation', 'customer experience', 'cx', 'user experience', 'ux']);
const MULTI_WORD = ['machine learning', 'deep learning', 'data science', 'problem solving', 'critical thinking', 'time management', 'project management', 'artificial intelligence', 'software engineering', 'full stack', 'front end', 'back end', 'cloud computing'];

function normalizeSkill(s) { return s.toLowerCase().trim(); }
function extractSkillsDeterministic(text = '') {
    if (!text) return [];
    const lower = text.toLowerCase();
    const found = new Set();

    // Check multi-word phrases first
    for (const phrase of MULTI_WORD) {
        if (lower.includes(phrase)) found.add(phrase);
    }

    // Check individual tokens
    const tokens = lower.split(/[^a-z0-9+#.]+/).filter(t => t.length > 1);
    for (let t of tokens) {
        if (t === 'js') t = 'javascript';
        if (t === 'ml') t = 'machine learning';
        if (t === 'dl') t = 'deep learning';
        if (TECH_SKILL_SET.has(t) || SOFT_SKILL_SET.has(t)) found.add(t);
    }
    return Array.from(found).sort();
}
function classifyDomain(resumeSkills, jdSkills) {
    const techCount = (resumeSkills || []).filter(s => TECH_SKILL_SET.has(s)).length + (jdSkills || []).filter(s => TECH_SKILL_SET.has(s)).length;
    const softCount = (resumeSkills || []).filter(s => SOFT_SKILL_SET.has(s)).length + (jdSkills || []).filter(s => SOFT_SKILL_SET.has(s)).length;
    return techCount >= softCount ? 'tech' : 'non-tech';
}

// PDF Helper using pdf-parse
async function safeExtractPdf(buffer, fileName = 'unknown') {
    console.log(`Attempting to parse PDF: ${fileName}, size: ${buffer.length} bytes`);

    let bestResult = '';
    let bestLength = 0;

    // Method 1: Standard pdf-parse
    try {
        const result = await pdfParse(buffer);
        if (result.text && result.text.trim().length > 0) {
            const text = result.text.trim();
            if (text.length > bestLength) {
                bestResult = text;
                bestLength = text.length;
            }
        }
    } catch (error) {
        console.warn(`Method 1 failed for ${fileName}:`, error.message);
    }

    // Method 2: pdf-parse with lenient options
    try {
        const result = await pdfParse(buffer, {
            max: 0,
            version: 'v1.10.100',
            normalizeWhitespace: false,
            disableCombineTextItems: false
        });
        if (result.text && result.text.trim().length > 0) {
            const text = result.text.trim();
            if (text.length > bestLength) {
                bestResult = text;
                bestLength = text.length;
            }
        }
    } catch (error) {
        console.warn(`Method 2 failed for ${fileName}:`, error.message);
    }

    if (bestLength > 0) return bestResult;
    console.error(`❌ PDF extraction failed for ${fileName}`);
    return '';
}

// AI Problem fallback generator
async function generateAIProblems(skill) {
    if (!GROQ_API_KEY) return genericProblemSet(skill);
    try {
        const prompt = `Generate 9 unique practice problems for the skill "${skill}". 
        Organize them into 3 difficulty tiers: easy, medium, and hard (3 each).
        For each, provide: 
        - title (catchy)
        - description (clear, 1-2 sentences)
        - hint (helpful technical clue)
        Return ONLY a JSON object with keys "easy", "medium", "hard", each containing an array of {title, description, hint}. No extra text.`;

        const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: AI_MODEL,
            messages: [
                { role: 'system', content: 'You are a technical curriculum designer. Return strict JSON only.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.6
        }, {
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' }
        });

        const raw = res.data.choices?.[0]?.message?.content || '';
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            // Add IDs
            ['easy', 'medium', 'hard'].forEach(tier => {
                if (parsed[tier]) {
                    parsed[tier] = parsed[tier].map((p, idx) => ({ id: idx + 1, ...p }));
                }
            });
            return parsed;
        }
    } catch (e) {
        console.warn(`AI Problem generation failed for ${skill}:`, e.message);
    }
    return genericProblemSet(skill);
}

function genericProblemSet(skill) {
    return {
        easy: [
            { id: 1, title: `Intro to ${skill}`, description: `Explore the fundamental building blocks and use cases of ${skill}.`, hint: 'Start with the most basic definitions and setup.' },
            { id: 2, title: `Core Syntax & ${skill} Patterns`, description: `Master the essential syntax and common architectural patterns in ${skill}.`, hint: 'Focus on readability and standard conventions.' },
            { id: 3, title: `Your First ${skill} Task`, description: `Apply what you've learned to solve a small, well-defined problem in ${skill}.`, hint: 'Keep it simple and focus on a single core feature.' }
        ],
        medium: [
            { id: 4, title: `Intermediate ${skill} Project`, description: `Build a small application or module that utilizes multiple ${skill} concepts.`, hint: 'Think about how different parts of the skill interact.' },
            { id: 5, title: `Debugging ${skill} Scenarios`, description: 'Identify and resolve logical errors in a pre-written piece of code.', hint: 'Use systematic testing and logging.' },
            { id: 6, title: `Optimization Lab (${skill})`, description: 'Refactor an existing implementation to improve performance and maintainability.', hint: 'Look for bottlenecks and redundant operations.' }
        ],
        hard: [
            { id: 7, title: `Advanced ${skill} Architecture`, description: `Design and implement a complex, scalable solution focusing on ${skill} best practices.`, hint: 'Focus on modularity and long-term maintenance.' },
            { id: 8, title: `Distributed ${skill} Systems`, description: 'Scale your solution to handle large data volumes or high-concurrency environments.', hint: 'Consider asynchronous processing and resource management.' },
            { id: 9, title: `Expert Level ${skill} Mastery`, description: 'Push the limits of the skill by solving an edge-case heavy and theoretically deep challenge.', hint: 'Deep dive into the underlying engine or theory.' }
        ]
    };
}

function suggestFallbackProjects(missing) {
    if (!missing.length) return ['Refactor an existing project adding measurable outcomes', 'Create documentation & tests for a past project'];
    return missing.slice(0, 2).map(s => `Build a project showcasing practical ${s}`);
}

// Score Tier Info Helper
function getScoreTierInfo(score) {
    const numScore = typeof score !== 'undefined' && score !== null ? Number(score) : 20;
    if (numScore <= 40) {
        return {
            tier: 'beginner',
            label: 'Beginner (Foundational)',
            searchSuffix: 'complete beginner course tutorial step by step',
            moduleTitles: [
                'Module 1: Foundations & Core Concepts',
                'Module 2: Essential Building Blocks',
                'Module 3: Beginner Guided Practice'
            ]
        };
    } else if (numScore <= 60) {
        return {
            tier: 'intermediate',
            label: 'Intermediate (Core Focus)',
            searchSuffix: 'intermediate tutorial core concepts practical guide',
            moduleTitles: [
                'Module 1: Core Functionality & Workflows',
                'Module 2: Practical Data & State Patterns',
                'Module 3: Hands-on Intermediate Problem Solving'
            ]
        };
    } else if (numScore < 100) {
        return {
            tier: 'advanced',
            label: 'Advanced (Project & Practice)',
            searchSuffix: 'advanced concepts real world project production',
            moduleTitles: [
                'Module 1: Advanced Architecture & Deep Dive',
                'Module 2: Production Real-World Application',
                'Module 3: Performance & Optimization Mastery'
            ]
        };
    } else {
        return {
            tier: 'expert',
            label: 'Expert Masterclass (100% Score)',
            searchSuffix: 'masterclass production system design architecture expert',
            moduleTitles: [
                'Module 1: Production System Architecture & Design',
                'Module 2: High-Performance Enterprise Patterns',
                'Module 3: Expert Masterclass Capstone'
            ]
        };
    }
}

// Fallback Video Engine for 6 languages across 4 score tiers
function get3FallbackVideos(skill, score, lang) {
    const tierInfo = getScoreTierInfo(score);
    const s = (skill || 'Python').trim();
    const l = (lang || 'english').toLowerCase();

    const videoIdPool = {
        react: ['hQAHSlTtcmY', 'SqcY0GlETPk', 'w7ejDZ8SWv8', 'TNhaISOUy6Q', '35lXWvCuM8o', 'O6P86uwfdR0', '7kAW7Qx2yD0', 'd56mG7DezGs', 'cVw6-F648D4', 'ZCuYvjZfFA0', '00pxxT_4gLw', '4UZrsTqkcW4'],
        python: ['_uQrJ0TkZlc', 'rfscVS0vtbw', 'kqtD5dpn9C8', 'JeznW_7DlB0', 'HGOBQPFzWKo', '8ext9G7xfeg', 'cKPlPJyQrtE', 'qUebd2NmbHU', '7k2v4kU_z9g', 'XGF3Qu4dUqk', '0vT9FwzB2pg', 'eWRfhZUzrAc'],
        javascript: ['W6NZfCO5SIk', 'H3XIJYEPdus', 'pkDg23nL2vE', 'hdI2bqOjy3c', 'sbMstS2Q5uA', 'po5e6yC3t24', 'R9I85RhV7Cg', 'Bv_5Zv5c-Ts', '3PHXvlpOkfU', 'ZvbzSrg0afE', 'musPosdXqGg', 'nZ1DMMsyVyI'],
        tensorflow: ['tPYj3fFJGjk', 'tpCFfeUEGs8', 'KNAWp2S3w94', 'Gv9_4yMHFhI', 'yWwOa7p4n8U', 'iaSUY6e788M', '6g4O5U6cYcE', 'R9OHn5ZFg8E', 'QPd2uu86M24', '7k2v4kU_z9g', '00pxxT_4gLw', 'eWRfhZUzrAc'],
        machinelearning: ['i_LwzRVP7bg', '7eh4d6sabA0', 'Gv9_4yMHFhI', 'yN7ypxC7838', 'JcXaUv066zI', 'f_C5y5bO6j0', 'aircAruvnKk', 'qFJeN9V1zsI', 'GwIo3gVZCVg', 'bQhPllk77sU', 'R9OHn5ZFg8E', '0vT9FwzB2pg']
    };

    const cleanSkillKey = s.toLowerCase().replace(/[^a-z]/g, '');
    const pool = videoIdPool[cleanSkillKey] || videoIdPool['python'];
    const startIndex = tierInfo.tier === 'beginner' ? 0 : tierInfo.tier === 'intermediate' ? 3 : tierInfo.tier === 'advanced' ? 6 : 9;

    const langLabel = l === 'telugu' ? 'Telugu (తెలుగు)' : l === 'hindi' ? 'Hindi (हिंदी)' : l === 'tamil' ? 'Tamil (தமிழ்)' : l === 'kannada' ? 'Kannada (ಕನ್ನಡ)' : l === 'malayalam' ? 'Malayalam (മലയാളം)' : 'English';

    return [0, 1, 2].map(idx => {
        const vId = pool[(startIndex + idx) % pool.length];
        return {
            title: `${s} ${tierInfo.tier.toUpperCase()} — ${tierInfo.moduleTitles[idx]} (${langLabel})`,
            videoId: vId,
            url: `https://www.youtube.com/embed/${vId}`,
            duration: idx === 0 ? "PT45M" : idx === 1 ? "PT1H15M" : "PT2H",
            thumbnail: `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
            moduleNumber: idx + 1,
            moduleTitle: tierInfo.moduleTitles[idx],
            level: tierInfo.label,
            language: langLabel,
            scoreTier: tierInfo.tier
        };
    });
}

// YouTube video fetcher supporting score tier and language
async function fetchVideos(query, score = 20, lang = 'english') {
    const tierInfo = getScoreTierInfo(score);
    const languages = ["english", "hindi", "telugu", "tamil", "kannada", "malayalam"];
    const results = {};
    const queryClean = (query || "Python").replace(/ \(.+\)/g, '').trim();

    if (!YOUTUBE_API_KEY) {
        console.warn('YOUTUBE_API_KEY missing. Using score-tiered fallback engine.');
        languages.forEach(l => {
            results[l] = get3FallbackVideos(queryClean, score, l);
        });
        return results;
    }

    const langCodes = { english: 'en', hindi: 'hi', telugu: 'te', tamil: 'ta', kannada: 'kn', malayalam: 'ml' };

    for (const l of languages) {
        try {
            const langCode = langCodes[l] || 'en';
            let searchQuery = `${queryClean} ${tierInfo.searchSuffix} in ${l}`;
            if (l === 'english') {
                searchQuery = `${queryClean} ${tierInfo.searchSuffix}`;
            }

            console.log(`[YT Search] Query for ${l} (${tierInfo.label}): ${searchQuery}`);

            const ytRes = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
                params: {
                    part: 'snippet',
                    type: 'video',
                    maxResults: 5,
                    q: searchQuery,
                    key: YOUTUBE_API_KEY,
                    order: 'relevance',
                    videoDefinition: 'high',
                    relevanceLanguage: langCode,
                    safeSearch: 'moderate'
                }
            });

            const items = ytRes.data.items || [];
            if (items.length === 0) {
                results[l] = get3FallbackVideos(queryClean, score, l);
                continue;
            }

            const videoIds = items.map(item => item.id.videoId).join(',');
            let durations = {};
            if (videoIds) {
                const detailsRes = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
                    params: {
                        part: 'contentDetails',
                        id: videoIds,
                        key: YOUTUBE_API_KEY
                    }
                });

                detailsRes.data.items?.forEach(item => {
                    durations[item.id] = item.contentDetails.duration || "PT25M";
                });
            }

            const top3 = items.slice(0, 3);
            const langLabel = l === 'telugu' ? 'Telugu (తెలుగు)' : l === 'hindi' ? 'Hindi (हिंदी)' : l === 'tamil' ? 'Tamil (தமிழ்)' : l === 'kannada' ? 'Kannada (ಕನ್ನಡ)' : l === 'malayalam' ? 'Malayalam (മലയാളം)' : 'English';

            results[l] = top3.map((item, index) => ({
                title: item.snippet.title || `${queryClean} ${tierInfo.moduleTitles[index]}`,
                videoId: item.id.videoId,
                url: `https://www.youtube.com/embed/${item.id.videoId}`,
                duration: durations[item.id.videoId] || "PT30M",
                thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
                moduleNumber: index + 1,
                moduleTitle: tierInfo.moduleTitles[index] || `Module ${index + 1}`,
                level: tierInfo.label,
                language: langLabel,
                scoreTier: tierInfo.tier
            }));

        } catch (error) {
            console.error(`❌ Error fetching videos for ${l}:`, error.message);
            results[l] = get3FallbackVideos(queryClean, score, l);
        }
    }
    return results;
}

// Multer setup
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = path.join(__dirname, '..', 'uploads');
            if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname) || '';
            cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`);
        }
    })
});

// Routes
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'analysis-integrated' });
});

// Analyze endpoint (supports both /analyze and legacy /analyze-full)
router.post(['/analyze', '/analyze-full'], upload.fields([{ name: 'resume' }, { name: 'jd' }]), async (req, res) => {
    console.log('[ANALYSIS] Request received');
    console.log('[ANALYSIS] Files:', Object.keys(req.files || {}));
    console.log('[ANALYSIS] Body keys:', Object.keys(req.body || {}));

    let resumeFilePath, jdFilePath;
    try {
        const resumeFile = req.files?.resume?.[0];
        const jdFile = req.files?.jd?.[0];
        // Check multiple possible keys for jd_text
        const jdTextField = req.body.jd_text || req.body.jd || req.body.description;

        console.log('[ANALYSIS] JD source detected:', jdFile ? 'file' : (jdTextField ? 'text' : 'none'));

        if (!resumeFile) {
            console.error('[ANALYSIS] Missing resume file');
            return res.status(400).json({ success: false, error: 'Missing resume file' });
        }
        if (!jdFile && !jdTextField) {
            console.error('[ANALYSIS] Missing JD file and jd_text');
            return res.status(400).json({ success: false, error: 'Provide JD file or jd_text' });
        }

        resumeFilePath = resumeFile.path;
        if (jdFile) jdFilePath = jdFile.path;

        const resumeBuffer = fs.readFileSync(resumeFilePath);
        const resumeText = await safeExtractPdf(resumeBuffer, resumeFile.originalname);

        if (!resumeText || resumeText.length < 10) {
            return res.status(400).json({ success: false, error: 'Unable to extract text from resume PDF.' });
        }

        let jdText = '';
        if (jdFile) {
            const jdBuffer = fs.readFileSync(jdFilePath);
            jdText = await safeExtractPdf(jdBuffer, jdFile.originalname);
            if (!jdText || jdText.length < 10) {
                return res.status(400).json({ success: false, error: 'Unable to extract text from JD PDF.' });
            }
        } else if (jdTextField) {
            jdText = jdTextField;
            console.log(`[ANALYSIS] Received JD Text from body: ${jdText.substring(0, 50)}...`);
        }

        const strategy = (req.query.strategy || process.env.ANALYSIS_STRATEGY || 'hybrid').toLowerCase();

        // Deterministic Extraction
        // Deterministic Extraction
        const resumeSkills = extractSkillsDeterministic(resumeText);
        const jdSkills = extractSkillsDeterministic(jdText);

        console.log(`[DEBUG] Resume Text Length: ${resumeText.length}`);
        console.log(`[DEBUG] JD Text Length: ${jdText.length}`);
        console.log(`[DEBUG] Extracted Resume Skills:`, resumeSkills);
        console.log(`[DEBUG] Extracted JD Skills:`, jdSkills);

        const jdSet = new Set(jdSkills);
        const resumeSet = new Set(resumeSkills);
        const matchedSkills = Array.from(jdSet).filter(s => resumeSet.has(s));
        const missingSkillsPre = Array.from(jdSet).filter(s => !resumeSet.has(s));
        const baseScore = jdSet.size ? Math.round((matchedSkills.length / jdSet.size) * 100) : 0;
        const domain = classifyDomain(resumeSkills, jdSkills);

        console.log(`[ANALYSIS] Base Score: ${baseScore}, Missing (Pre): ${missingSkillsPre.length}`);

        // AI Extraction
        const ctxLimit = parseInt(process.env.ANALYSIS_TEXT_LIMIT || '4000', 10);
        const prompt = `Task: Professional Resume vs Job Description Comparison.
        
        Resume Content:
        ${resumeText.slice(0, ctxLimit)}
        
        Job Description Content:
        ${jdText.slice(0, ctxLimit)}
        
        Instructions:
        1. Identify missing skills (tech and soft).
        2. Calculate a match score (0-100) based on requirements.
        3. Identify the most critical skill to learn first.
        4. Suggest 3 concrete projects to bridge the gap.
        
        Return ONLY a strict JSON object with these keys:
        {
          "missingSkills": ["skill1", "skill2"],
          "score": 85,
          "skillToLearnFirst": "Primary Missing Skill",
          "projectSuggestions": ["Project 1 Description", "Project 2 Description", "Project 3 Description"]
        }`;

        let aiResult, aiRaw;

        if (strategy !== 'deterministic' && GROQ_API_KEY) {
            try {
                const aiRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                    model: AI_MODEL,
                    messages: [
                        { role: 'system', content: 'Return strict JSON only.' },
                        { role: 'user', content: prompt }
                    ]
                }, {
                    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` }
                });

                aiRaw = aiRes.data.choices?.[0]?.message?.content || '';
                const jsonMatch = aiRaw.match(/\{[\s\S]*\}/);
                if (jsonMatch) aiResult = JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.warn('AI Analysis failed:', e.message);
            }
        }

        if (!aiResult) {
            aiResult = { score: baseScore, missingSkills: missingSkillsPre, skillToLearnFirst: missingSkillsPre[0] || '', projectSuggestions: suggestFallbackProjects(missingSkillsPre) };
        }

        // Clean & Merge
        aiResult.missingSkills = Array.isArray(aiResult.missingSkills) ? aiResult.missingSkills.map(s => s.toString().trim()).filter(Boolean) : missingSkillsPre;
        if (aiResult.score == null || isNaN(aiResult.score)) aiResult.score = baseScore;
        aiResult.skillToLearnFirst = aiResult.skillToLearnFirst || aiResult.missingSkills[0] || '';
        aiResult.projectSuggestions = Array.isArray(aiResult.projectSuggestions) && aiResult.projectSuggestions.length ? aiResult.projectSuggestions : suggestFallbackProjects(aiResult.missingSkills);

        const filterSoft = (process.env.FILTER_SOFT_SKILLS || '1') === '1';
        const filterFn = s => !filterSoft || !SOFT_SKILL_SET.has(s.toLowerCase());

        let missingUnion = [...new Set([...missingSkillsPre, ...aiResult.missingSkills])].filter(filterFn);
        if (strategy === 'ai') {
            missingUnion = Array.from(new Set(aiResult.missingSkills)).filter(filterFn);
        }

        // Enrichment
        const allVideos = {};
        const allProblems = {};
        for (const skill of missingUnion.slice(0, 6)) {
            try { allVideos[skill] = await fetchVideos(skill); } catch { allVideos[skill] = {}; }
            allProblems[skill] = problems[skill] || await generateAIProblems(skill);
        }

        // 🎯 AUTO-BOOT MASTERY ENGINE: For every missing skill, create a StudentProgress
        // record in NOT_STARTED state. This is what makes the analysis result automatically
        // trigger the full Identify → Learn → Practice → Prove loop in learn.html.
        try {
            const userId = req.headers['x-user-id'] || req.body?.userId;
            if (userId && missingUnion.length > 0) {
                const StudentProgress = require('../models/StudentProgress');
                await Promise.allSettled(
                    missingUnion.slice(0, 8).map(skill =>
                        StudentProgress.updateOne(
                            { userId, skillName: skill.toLowerCase().trim() },
                            { $setOnInsert: { state: 'NOT_STARTED', masteryPct: 0, createdAt: new Date(), updatedAt: new Date() } },
                            { upsert: true }
                        )
                    )
                );
                console.log(`[Mastery] Auto-created progress records for ${missingUnion.slice(0, 8).length} skills for user ${userId}`);
            }
        } catch (masteryErr) {
            console.warn('[Mastery] Auto-boot silently failed:', masteryErr.message);
        }


        // === Compute Advanced Analysis Metrics ===
        const ACTION_VERBS = [
            'built', 'developed', 'designed', 'implemented', 'deployed', 'optimized', 'improved',
            'created', 'led', 'managed', 'architected', 'reduced', 'increased', 'automated',
            'engineered', 'launched', 'delivered', 'integrated', 'maintained', 'collaborated',
            'analyzed', 'achieved', 'established', 'streamlined', 'accelerated'
        ];

        const METRIC_PATTERNS = [
            /\d+\s*%/gi,
            /\$\s*\d+/gi,
            /\d+\s*(users|clients|customers|projects|months|years|hours|days|requests|ms|seconds)/gi,
            /\d+x\s*(faster|improvement|increase|decrease|growth)/gi,
            /(increased|decreased|improved|reduced|grew|boosted)\s+by\s+\d+/gi
        ];

        // 1. Compute ATS Score
        const tResume = resumeText.toLowerCase();
        const requiredSections = ['experience', 'education', 'skills', 'projects', 'summary', 'objective', 'achievements'];
        const foundSections = requiredSections.filter(s => tResume.includes(s));
        const structureScore = Math.round((foundSections.length / requiredSections.length) * 100);

        const verbsFound = ACTION_VERBS.filter(v => new RegExp(`\\b${v}\\w*\\b`, 'i').test(resumeText));
        const actionVerbsScore = Math.min(100, Math.round((verbsFound.length / 10) * 100));

        const metricMatches = METRIC_PATTERNS.reduce((c, p) => c + (resumeText.match(p) || []).length, 0);
        const achievementsScore = Math.min(100, metricMatches * 15);

        const wordCount = resumeText.split(/\s+/).filter(Boolean).length;
        const formattingScore = wordCount < 150 ? 50 : wordCount < 300 ? 70 : wordCount < 800 ? 95 : 85;

        const avgWordsPerLine = wordCount / Math.max(resumeText.split('\n').length, 1);
        const readabilityScore = avgWordsPerLine > 20 ? 75 : avgWordsPerLine > 8 ? 92 : 80;

        const keywordsScore = Math.min(100, Math.round(structureScore * 0.5 + actionVerbsScore * 0.3 + Math.min(achievementsScore, 30)));

        const finalATS = Math.round(
            keywordsScore * 0.30 +
            formattingScore * 0.20 +
            readabilityScore * 0.20 +
            structureScore * 0.20 +
            actionVerbsScore * 0.10
        );

        const atsScore = Math.max(50, Math.min(100, finalATS));

        // 2. Extra Skills (Bonus Skills)
        const jdSetLower = new Set(jdSkills.map(s => s.toLowerCase().trim()));
        const extraSkills = resumeSkills.filter(s => s && !jdSetLower.has(s.toLowerCase().trim()));

        // 3. Score Breakdown & Weighted Final Score
        const matchPct = (matchedSkills.length / Math.max(jdSkills.length, 1)) * 100;
        const skillsPts = Math.round((matchPct / 100) * 40);

        const hasProjects = /project|built|developed|created|implemented|github|deployed/i.test(resumeText);
        const projectKeywords = jdSkills.filter(s => resumeText.toLowerCase().includes(s.toLowerCase()));
        const projPts = hasProjects
            ? Math.min(25, Math.round(15 + (projectKeywords.length / Math.max(jdSkills.length, 1)) * 10))
            : 8;

        const hasExp = /experience|internship|worked at|employed|company|organization|role|position|junior|senior/i.test(resumeText);
        const yearsMatch = resumeText.match(/(\d+)\s*\+?\s*years?\s+(of\s+)?experience/i);
        const years = yearsMatch ? parseInt(yearsMatch[1]) : 0;
        const expPts = hasExp ? Math.min(15, 9 + Math.min(years * 2, 6)) : 5;

        const hasEdu = /education|university|college|degree|bachelor|master|b\.tech|m\.tech|b\.e|m\.e|bsc|msc|phd/i.test(resumeText);
        const eduPts = hasEdu ? 9 : 5;
        const bonusPts = Math.min(10, Math.round(extraSkills.length * 1.5));

        const finalScore = Math.min(100, skillsPts + projPts + expPts + eduPts + bonusPts);

        // 4. Job Description Skills with Importance Tiers
        const tJD = jdText.toLowerCase();
        const scoredJdSkills = jdSkills.map(skill => {
            const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escaped, 'gi');
            const freq = (tJD.match(regex) || []).length;
            const pos = tJD.indexOf(skill.toLowerCase());
            const posScore = pos === -1 ? 0 : Math.max(0, 100 - Math.round((pos / tJD.length) * 100));
            return { skill, score: freq * 10 + posScore };
        }).sort((a, b) => b.score - a.score);

        const nSkills = scoredJdSkills.length;
        const critBound = Math.max(1, Math.round(nSkills * 0.35));
        const impBound = Math.max(critBound + 1, Math.round(nSkills * 0.70));

        const jdSkillsWithImportance = scoredJdSkills.map((item, idx) => ({
            skill: item.skill,
            importance: idx < critBound ? 'Critical' : idx < impBound ? 'Important' : 'Optional'
        }));

        // 5. Recruiter Insights
        const strengths = [];
        const concerns = [];
        if (matchedSkills.length >= 5) strengths.push('Strong technical skill alignment with JD');
        if (/internship|intern/i.test(resumeText)) strengths.push('Relevant internship experience');
        if (/project|github|portfolio/i.test(resumeText)) strengths.push('Has project portfolio / GitHub');
        if (extraSkills.length >= 3) strengths.push(`Brings ${extraSkills.length} extra bonus skills beyond requirements`);
        if (/machine learning|ai|deep learning|llm|nlp/i.test(resumeText)) strengths.push('Strong AI/ML background');
        if (/full.?stack|backend.*frontend|frontend.*backend/i.test(resumeText)) strengths.push('Full stack development capabilities');
        if (strengths.length === 0) strengths.push('Good educational background');

        if (metricMatches < 2) concerns.push('Projects lack measurable metrics — add numbers (e.g. 500+ users, 40% faster)');
        const sqlMissing = missingUnion.find(s => /sql|database|db/i.test(s));
        if (sqlMissing) concerns.push(`No ${sqlMissing} mentioned in resume`);
        const cloudMissing = missingUnion.find(s => /cloud|aws|azure|gcp/i.test(s));
        if (cloudMissing) concerns.push('No cloud deployment experience mentioned');
        if (!/agile|scrum/i.test(resumeText)) concerns.push('No Agile/Scrum methodology mentioned');
        if (concerns.length === 0 && missingUnion.length > 0) concerns.push(`Missing ${missingUnion.slice(0, 2).join(' and ')}`);

        const proTip = missingUnion.length > 0
            ? `Add ${missingUnion.slice(0, 3).join(', ')} to your skills and quantify project results to reach the top 10% of candidates.`
            : 'Excellent profile! Add measurable numbers to your bullet points to stand out even more.';

        // 6. Project Suggestions (Personalized with Reason and Tags)
        const PROJECT_MAP = {
            'AWS': { title: 'Deploy ML Model on AWS', tags: ['AWS', 'EC2', 'S3', 'SageMaker'], reason: 'missing Cloud Computing (AWS)' },
            'Cloud Computing': { title: 'Cloud-Based Web App on AWS/GCP', tags: ['AWS', 'Firebase', 'Serverless'], reason: 'missing Cloud Computing' },
            'Docker': { title: 'Containerized App with Docker Compose', tags: ['Docker', 'Docker Compose', 'CI/CD'], reason: 'missing Docker' },
            'Kubernetes': { title: 'Kubernetes Cluster Deployment', tags: ['K8s', 'Helm', 'Docker', 'GKE'], reason: 'missing Kubernetes' },
            'Machine Learning': { title: 'End-to-End ML Pipeline', tags: ['Scikit-learn', 'Pandas', 'MLflow'], reason: 'missing Machine Learning' },
            'SQL': { title: 'Analytics Dashboard with SQL + Python', tags: ['MySQL', 'PostgreSQL', 'Pandas'], reason: 'missing SQL' },
            'React': { title: 'React SPA with REST API Integration', tags: ['React', 'Redux', 'Axios', 'Tailwind'], reason: 'missing React.js' },
            'React.js': { title: 'React SPA with REST API Integration', tags: ['React', 'Redux', 'Axios', 'Tailwind'], reason: 'missing React.js' },
            'Node.js': { title: 'Node.js REST API with Auth & Tests', tags: ['Node.js', 'Express', 'JWT', 'MongoDB'], reason: 'missing Node.js' },
            'Agile': { title: 'Agile Sprint Board App', tags: ['Scrum', 'Jira', 'Kanban'], reason: 'missing Agile/Scrum' },
            'Agile / Scrum': { title: 'Agile Sprint Board App', tags: ['Scrum', 'Jira', 'Kanban'], reason: 'missing Agile/Scrum' },
            'TypeScript': { title: 'TypeScript Full-Stack App', tags: ['TypeScript', 'Next.js', 'Prisma'], reason: 'missing TypeScript' },
            'GraphQL': { title: 'GraphQL API with Apollo', tags: ['GraphQL', 'Apollo', 'React'], reason: 'missing GraphQL' },
            'Python': { title: 'Python Automation & Data Pipeline', tags: ['Python', 'Pandas', 'FastAPI'], reason: 'missing Python' },
            'Pandas': { title: 'Data Analysis Project with Pandas', tags: ['Pandas', 'NumPy', 'Matplotlib'], reason: 'missing Pandas' },
            'TensorFlow': { title: 'Image Classifier with TensorFlow', tags: ['TensorFlow', 'Keras', 'CNN'], reason: 'missing TensorFlow' }
        };

        const projectSuggestions = [];
        const seenProj = new Set();
        for (const skill of missingUnion) {
            if (projectSuggestions.length >= 3) break;
            const proj = PROJECT_MAP[skill];
            if (proj && !seenProj.has(proj.title)) {
                seenProj.add(proj.title);
                projectSuggestions.push({ ...proj, skillGap: skill, impact: projectSuggestions.length === 0 ? 'High Impact' : 'Recommended' });
            }
        }
        const defaultProjects = domain === 'tech'
            ? [
                { title: 'Personal Portfolio Website', tags: ['React', 'CSS', 'GitHub Pages'], reason: 'showcase your projects', skillGap: 'Portfolio', impact: 'Recommended' },
                { title: 'Full-Stack CRUD App with Auth', tags: ['Node.js', 'React', 'MongoDB'], reason: 'demonstrate full-stack skills', skillGap: 'Full Stack', impact: 'Recommended' },
                { title: 'Data Dashboard with Charts', tags: ['Python', 'Pandas', 'Streamlit'], reason: 'show data analysis skills', skillGap: 'Data', impact: 'Medium Impact' }
            ]
            : [
                { title: 'Excel KPI Tracking Dashboard', tags: ['Excel', 'Pivot Tables'], reason: 'demonstrate data skills', skillGap: 'Data', impact: 'Recommended' },
                { title: 'Process Improvement Case Study', tags: ['Flowchart', 'Analysis'], reason: 'show analytical thinking', skillGap: 'Operations', impact: 'Recommended' }
            ];
        for (const d of defaultProjects) {
            if (projectSuggestions.length >= 3) break;
            if (!seenProj.has(d.title)) { seenProj.add(d.title); projectSuggestions.push(d); }
        }

        // 7. Learning Track
        const learningTrack = [
            ...matchedSkills.slice(0, 2).map(skill => {
                const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const mentions = (tResume.match(new RegExp(escaped, 'gi')) || []).length;
                return { skill, progress: Math.min(95, 50 + mentions * 15), priority: 'High', status: 'In Progress' };
            }),
            ...missingUnion.slice(0, 3).map((skill, i) => ({
                skill, progress: 0, priority: i === 0 ? 'High' : 'Medium', status: 'Not Started'
            }))
        ];

        // 8. Career Readiness Metrics
        const missingCriticalCount = jdSkillsWithImportance.filter(j => j.importance === 'Critical' && missingUnion.includes(j.skill)).length;
        const interviewChance = Math.min(98, Math.max(30, Math.round(finalScore * 0.5 + atsScore * 0.3 + 20 - missingCriticalCount * 5)));
        const ppoReadiness = Math.round(interviewChance * 0.97);
        const profileStrength = Math.round((finalScore + atsScore) / 2);

        const payload = {
            success: true,
            score: finalScore,
            domain,
            jdSkills,
            resumeSkills,
            matchedSkills,
            missingSkills: missingUnion,
            extraSkills,
            jdSkillsWithImportance,
            atsScore,
            atsKeywords: Math.max(50, Math.min(100, keywordsScore)),
            atsFormatting: Math.max(60, Math.min(100, formattingScore)),
            atsReadability: Math.max(55, Math.min(100, readabilityScore)),
            atsStructure: Math.max(50, Math.min(100, structureScore)),
            atsActionVerbs: Math.max(40, Math.min(100, actionVerbsScore)),
            scoreBreakdown: {
                skillsMatch: { pts: skillsPts, max: 40, pct: Math.round((skillsPts / 40) * 100) },
                projectRelevance: { pts: projPts, max: 25, pct: Math.round((projPts / 25) * 100) },
                experience: { pts: expPts, max: 15, pct: Math.round((expPts / 15) * 100) },
                education: { pts: eduPts, max: 10, pct: Math.round((eduPts / 10) * 100) },
                bonusSkills: { pts: bonusPts, max: 10, pct: Math.round((bonusPts / 10) * 100) }
            },
            recruiterInsights: { strengths: strengths.slice(0, 5), concerns: concerns.slice(0, 4), proTip },
            learningTrack,
            projectSuggestions,
            skillToLearnFirst: aiResult.skillToLearnFirst || missingUnion[0] || 'JavaScript',
            interviewChance,
            ppoReadiness,
            profileStrength,
            videos: allVideos,
            problems: allProblems,
            warnings: [],
            data: {
                score: finalScore,
                domain,
                jdSkills,
                resumeSkills,
                matchedSkills,
                missingSkills: missingUnion,
                extraSkills,
                jdSkillsWithImportance,
                atsScore,
                atsKeywords: Math.max(50, Math.min(100, keywordsScore)),
                atsFormatting: Math.max(60, Math.min(100, formattingScore)),
                atsReadability: Math.max(55, Math.min(100, readabilityScore)),
                atsStructure: Math.max(50, Math.min(100, structureScore)),
                atsActionVerbs: Math.max(40, Math.min(100, actionVerbsScore)),
                scoreBreakdown: {
                    skillsMatch: { pts: skillsPts, max: 40, pct: Math.round((skillsPts / 40) * 100) },
                    projectRelevance: { pts: projPts, max: 25, pct: Math.round((projPts / 25) * 100) },
                    experience: { pts: expPts, max: 15, pct: Math.round((expPts / 15) * 100) },
                    education: { pts: eduPts, max: 10, pct: Math.round((eduPts / 10) * 100) },
                    bonusSkills: { pts: bonusPts, max: 10, pct: Math.round((bonusPts / 10) * 100) }
                },
                recruiterInsights: { strengths: strengths.slice(0, 5), concerns: concerns.slice(0, 4), proTip },
                learningTrack,
                projectSuggestions,
                skillToLearnFirst: aiResult.skillToLearnFirst || missingUnion[0] || 'JavaScript',
                interviewChance,
                ppoReadiness,
                profileStrength,
                videos: allVideos,
                problems: allProblems,
                warnings: []
            }
        };

        // Headers
        res.setHeader('X-Analysis-Score', String(payload.score));
        res.setHeader('X-Analysis-Matched', `${matchedSkills.length}/${jdSkills.length}`);

        res.json(payload);

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ success: false, error: 'Analysis failed', details: error.message });
    } finally {
        if (resumeFilePath && fs.existsSync(resumeFilePath)) fs.unlinkSync(resumeFilePath);
        if (jdFilePath && fs.existsSync(jdFilePath)) fs.unlinkSync(jdFilePath);
    }
});

router.post('/get-videos', async (req, res) => {
    const { skill, score, lang } = req.body;
    if (!skill) return res.status(400).json({ success: false, error: 'Missing skill parameter' });

    try {
        console.log(`[Analysis] Fetching score-tiered tutorials for: ${skill} (Score: ${score}%, Lang: ${lang || 'english'})`);
        const videos = await fetchVideos(skill, score, lang || 'english');

        // Ensure problems exists and matches structure
        let skillProblems = problems[skill];
        if (!skillProblems || !skillProblems.easy) {
            console.log(`[Analysis] No local problems for ${skill}, generating with AI/Fallback`);
            skillProblems = await generateAIProblems(skill);
        }

        res.json({ success: true, data: { videos, problems: skillProblems } });
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch videos' });
    }
});

router.post('/ask', async (req, res) => {
    const { question, skill, topic, difficulty, code, stream } = req.body;
    if (!question || !skill) return res.status(400).json({ success: false, error: 'Missing question or skill' });

    // Intent routing for greetings (Fail-safe)
    const lowerQ = question.toLowerCase().trim();
    const words = lowerQ.split(/\s+/);
    if (words.some(w => ['hi', 'hello', 'hey', 'greetings'].includes(w))) {
        return res.json({ answer: "Hello! I'm Orbit, your AI learning guide.\n\nHow can I assist you today?" });
    }


    if (!GROQ_API_KEY) {
        return res.json({ answer: "Orbit is currently in Basic Mode. Please set GROQ_API_KEY to enable AI features." });
    }

    // --- Personalized Learning: Fetch User Data ---
    let userContext = "No user history found.";
    try {
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = authObj.users.find(u => u.id === decoded.userId);
            if (user) {
                userContext = `User History: Completed ${user.completedSkills?.length || 0} skills. Weak topics (missing skills from resume): ${user.analysisHistory?.[0]?.missingSkills?.join(', ') || 'None'}.`;
            }
        }
    } catch (e) { /* silent fail for auth */ }

    try {
        // --- Curriculum Injection (Safer Lookup) ---
        let lessonData = "No specific curriculum docs found for this topic.";
        const skillDocs = CURRICULUM[skill];
        if (skillDocs) {
            lessonData = skillDocs[topic] || Object.values(skillDocs)[0] || lessonData;
        }

        // Helper: Process and normalize AI response objects/tools
        function processAIResponse(aiOutput) {
            if (!aiOutput) return "";

            // If AI returns a tool call / structured object
            if (typeof aiOutput === "object") {
                if (aiOutput.tool === "runCode" || aiOutput.name === "runCode") {
                    const args = aiOutput.arguments || aiOutput;
                    const code = args.code || "";
                    const lang = args.language || "python";
                    return "```" + lang + "\n" + code + "\n```";
                }

                if (aiOutput.implementation || aiOutput.content || aiOutput.code) {
                    const lang = aiOutput.language || "python";
                    const code = aiOutput.implementation?.content || aiOutput.content || aiOutput.code || "";
                    return "```" + lang + "\n" + code + "\n```";
                }

                return "```json\n" + JSON.stringify(aiOutput, null, 2) + "\n```";
            }

            return String(aiOutput);
        }


        const systemPrompt = `You are Orbit Neural Assistant, a high-fidelity context-aware coding tutor for developers.

Pedagogical Behavior & Rules:
1. CODE-FIRST LAYOUT (CRITICAL): Developers prioritize implementation. For any technical request, always provide the solution code block FIRST (wrapped in markdown), followed by architectural explanations and key ideas.

2. RESPONSE MODES:
   - EXPLAIN LESSON MODE: Structure: Implementation Code, Concept Breakdown, Next Steps. 
   - EXPLAIN CODE MODE: Structure: 
     * Implementation Code: (Code block)
     * Purpose: (Brief description)
     * How It Works: (Bullet points)
     * Key Idea: (Takeaway)
   - DEBUG MODE: Structure: 
     * Corrected Code: (Markdown code block first)
     * Detected Issues: (Bullet points)
     * Suggested Fix: (Short explanation)

3. TECHNICAL ACCURACY:
   - SHORT EXPLANATIONS: Limit single-step answers to ONE concise sentence.
   - GAN SPECIALIZATION: Generate complete TensorFlow + Python architectures (Generator, Discriminator, Loss, Optimizer, Loop placeholder).
   - DIFFICULTY-AWARE: Do NOT suggest concepts beyond '${difficulty}' level.

4. TOOL ROUTING: Only call 'runCode' for "run", "execute", "test", or "fail". Otherwise, output code directly. 

5. STRICT OUTPUT FORMAT:
   - When the user asks for code (e.g., "give me code", "implement this"), generate the implementation directly using markdown.
   - DO NOT call tools like 'runCode' unless the user specifically asks to "run", "execute", or "test" the code.
   - All code MUST be returned inside standard markdown code blocks (e.g., \`\`\`javascript or \`\`\`python).
   - NEVER, under any circumstances, return a raw JSON object to the user.
   - NEVER output the string '[object Object]'.

6. PERSONALIZATION: ${userContext} (Current Skill: ${skill}, Topic: ${topic})`;

        // Tools definitions (Filtered based on intent to prevent over-routing)
        const canRun = question.toLowerCase().match(/run|execute|test|error|fail|check/);
        const tools = [
            {
                type: "function",
                function: {
                    name: "getLessonDoc",
                    description: "Fetch comprehensive lesson documentation for a topic.",
                    parameters: {
                        type: "object",
                        properties: { topic: { type: "string" } },
                        required: ["topic"]
                    }
                }
            },
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
            }] : []),
            {
                type: "function",
                function: {
                    name: "recommendLesson",
                    description: "Suggest the most logical next lesson based on current progress and topics.",
                    parameters: {
                        type: "object",
                        properties: { currentSkill: { type: "string" } }
                    }
                }
            },
            ...(question.toLowerCase().includes('explain') ? [{
                type: "function",
                function: {
                    name: "explainCode",
                    description: "Provide a detailed walkthrough of a code snippet.",
                    parameters: {
                        type: "object",
                        properties: { code: { type: "string" }, language: { type: "string" } }
                    }
                }
            }] : []),
            ...(question.toLowerCase().includes('debug') || question.toLowerCase().includes('fix') ? [{
                type: "function",
                function: {
                    name: "debugCode",
                    description: "Identify and fix errors in the provided code.",
                    parameters: {
                        type: "object",
                        properties: { code: { type: "string" }, language: { type: "string" } }
                    }
                }
            }] : [])
        ];
        // --- Handle Streaming or Non-Streaming ---
        // --- unified Logic with Tool Support ---
        const safeCode = (typeof code === 'string' ? code : JSON.stringify(code || 'None')).replace(/\[object Object\]/g, '// (Neural Leak Filtered)');

        const completion = await groq.chat.completions.create({
            model: AI_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Code: \n${safeCode} \n\nQuestion: ${question} ` }
            ],
            tools: tools,
            tool_choice: "auto",
            temperature: 0.5
        });

        let responseMessage = completion.choices[0].message;
        console.log("AI RESPONSE RAW:", responseMessage.content ? "String response" : "Tool call response");
        if (typeof responseMessage.content === 'object') {
            console.log("AI RESPONSE OBJECT DETECTED:", responseMessage.content);
        }

        if (responseMessage.tool_calls) {
            let toolResults = [];
            for (const toolCall of responseMessage.tool_calls) {
                const funcName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);
                let content = "";

                // Instruction: Execute tool and return string
                if (funcName === "getLessonDoc") {
                    content = CURRICULUM[skill]?.[args.topic] || `No documentation for ${args.topic}.`;
                } else if (funcName === "runCode") {
                    const output = "Orbit Virtual Sandbox v2.0:\n" + (args.code.includes('print') || args.code.includes('console.log') ? "Execution successful." : "No output detected.");
                    content = "```text\n" + output + "\n```";
                } else if (funcName === "recommendLesson") {
                    content = `I recommend exploring advanced architectural patterns for ** ${skill} ** next.`;
                } else if (funcName === "explainCode" || funcName === "debugCode") {
                    content = "```" + (args.language || "python") + "\n" + (args.code || "") + "\n```\n\nExplanation generated.";
                }

                // Final safety: ensure content is NOT an object before pushing
                const safeContent = typeof content === 'object' ? JSON.stringify(content) : String(content || "No data.");
                toolResults.push({ role: "tool", tool_call_id: toolCall.id, content: safeContent });
            }

            const secondCompletion = await groq.chat.completions.create({
                model: AI_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Code: \n${safeCode} \n\nQuestion: ${question} ` },
                    responseMessage,
                    ...toolResults
                ],
                stream: stream // Match user preference for the final leg
            });

            if (stream) {
                res.setHeader('Content-Type', 'text/event-stream');
                console.log("[GW] Streaming second leg (with tool context)...");
                for await (const chunk of secondCompletion) {
                    let token = chunk.choices[0]?.delta?.content || "";
                    if (!token) continue;

                    // Ensure token is strictly a string to prevent [object Object] in frontend
                    if (typeof token !== "string") {
                        token = JSON.stringify(token);
                    }

                    // Scrub any literal leaked object strings
                    if (token === "[object Object]") {
                        token = "(Orbit Signal Leak Scrubbed)";
                    }

                    res.write(`data: ${JSON.stringify({ token })}\n\n`);
                }
                res.write(`data: [DONE]\n\n`);
                console.log("[GW] Stream complete.");
                return res.end();
            } else {
                const answer = secondCompletion.choices[0].message.content;
                res.json({ answer: normalizeResponse(answer) });
                return;
            }
        }

        // No tools, handle straight stream or JSON
        if (stream) {
            res.setHeader('Content-Type', 'text/event-stream');
            console.log("[GW] Opening direct SSE stream...");
            let token = responseMessage.content || "";
            // Always normalize before sending to prevent [object Object]
            token = normalizeResponse(token);

            if (typeof token !== "string") {
                token = JSON.stringify(token);
            }

            if (token) {
                res.write(`data: ${JSON.stringify({ token })}\n\n`);
            }
            res.write(`data: [DONE]\n\n`);
            res.end();
        } else {
            console.log("[GW] Sending direct JSON response");
            res.json({ answer: normalizeResponse(responseMessage.content || "") });
        }
    } catch (error) {
        console.error('Groq AI Error:', error.message);
        res.status(500).json({ error: 'Failed to get response from AI', details: error.message });
    }
});

module.exports = router;
