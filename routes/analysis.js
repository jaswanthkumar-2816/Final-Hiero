const express = require('express');
const axios = require('axios');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

// Env vars
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const AI_MODEL = process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct';

// Problems DB
const problems = {
    "Data Mining and Pattern Recognition": {
        easy: [
            { id: 1, title: "Basic Data Filtering", description: "Filter a dataset based on specific criteria.", hint: "Use pandas or SQL queries." },
            { id: 2, title: "Simple Pattern Matching", description: "Identify patterns in text data.", hint: "Try regular expressions." },
            { id: 3, title: "Data Visualization", description: "Create a simple chart from data.", hint: "Use matplotlib or seaborn." }
        ],
        medium: [
            { id: 4, title: "K-Means Clustering", description: "Implement K-Means clustering on a dataset.", hint: "Use scikit-learn's KMeans." },
            { id: 5, title: "Association Rules Mining", description: "Find association rules in transaction data.", hint: "Use the Apriori algorithm." },
            { id: 6, title: "Decision Tree Implementation", description: "Build a decision tree classifier.", hint: "Use scikit-learn's DecisionTreeClassifier." }
        ],
        hard: [
            { id: 7, title: "Neural Network Pattern Recognition", description: "Build a neural network for pattern recognition.", hint: "Use TensorFlow or PyTorch." },
            { id: 8, title: "Advanced Clustering Algorithms", description: "Implement DBSCAN or hierarchical clustering.", hint: "Compare with K-Means results." },
            { id: 9, title: "Time Series Pattern Analysis", description: "Analyze patterns in time series data.", hint: "Use ARIMA or LSTM models." }
        ]
    },
    "Deep Learning": {
        easy: [
            { id: 1, title: "Build a Perceptron", description: "Create a simple perceptron model.", hint: "Use numpy for calculations." },
            { id: 2, title: "MNIST Digit Classification", description: "Classify handwritten digits using a neural network.", hint: "Use Keras or TensorFlow." },
            { id: 3, title: "Image Augmentation", description: "Apply data augmentation to images.", hint: "Use ImageDataGenerator in Keras." }
        ],
        medium: [
            { id: 4, title: "CNN for CIFAR-10", description: "Build a convolutional neural network for CIFAR-10.", hint: "Use multiple convolutional layers." },
            { id: 5, title: "Transfer Learning on ResNet", description: "Fine-tune ResNet for a custom dataset.", hint: "Use pre-trained weights." },
            { id: 6, title: "Sentiment Analysis with RNN", description: "Build an RNN for sentiment analysis.", hint: "Use LSTM or GRU layers." }
        ],
        hard: [
            { id: 7, title: "GAN for Image Generation", description: "Implement a Generative Adversarial Network.", hint: "Start with a simple DCGAN." },
            { id: 8, title: "Attention Mechanism from Scratch", description: "Build an attention layer for NLP tasks.", hint: "Understand scaled dot-product attention." },
            { id: 9, title: "Custom Transformer", description: "Implement a transformer model.", hint: "Use multi-head attention." }
        ]
    },
    "Machine Learning": {
        easy: [
            { id: 1, title: "Linear Regression", description: "Implement basic linear regression.", hint: "Use scikit-learn's LinearRegression." },
            { id: 2, title: "Basic Classification", description: "Create a simple classifier.", hint: "Try logistic regression on the iris dataset." },
            { id: 3, title: "Data Preprocessing", description: "Clean and prepare data.", hint: "Handle missing values and normalize." }
        ],
        medium: [
            { id: 4, title: "Random Forest", description: "Build a random forest classifier.", hint: "Use scikit-learn's RandomForestClassifier." },
            { id: 5, title: "SVM Implementation", description: "Implement Support Vector Machine.", hint: "Try different kernels." },
            { id: 6, title: "Cross Validation", description: "Implement k-fold cross validation.", hint: "Use scikit-learn's cross_val_score." }
        ],
        hard: [
            { id: 7, title: "Ensemble Methods", description: "Combine multiple models.", hint: "Use voting or stacking." },
            { id: 8, title: "Feature Engineering", description: "Create new features.", hint: "Try polynomial features." },
            { id: 9, title: "Model Optimization", description: "Optimize model performance.", hint: "Use hyperparameter tuning." }
        ]
    },
    "Python": {
        easy: [
            { id: 1, title: "Variables and Data Types", description: "Learn about different data types in Python.", hint: "Start with integers, strings, and booleans." },
            { id: 2, title: "Loops and Conditions", description: "Practice using for loops and if statements.", hint: "Try printing numbers from 1 to 10." },
            { id: 3, title: "Functions", description: "Create your first function in Python.", hint: "Use the 'def' keyword." }
        ],
        medium: [
            { id: 4, title: "Object-Oriented Programming", description: "Create classes and objects.", hint: "Start with a simple class." },
            { id: 5, title: "File Handling", description: "Read and write files.", hint: "Use 'open()' function." },
            { id: 6, title: "Exception Handling", description: "Handle errors gracefully.", hint: "Use 'try' and 'except' blocks." }
        ],
        hard: [
            { id: 7, title: "Decorators and Generators", description: "Advanced Python concepts.", hint: "Study function decorators first." },
            { id: 8, title: "Multithreading", description: "Run multiple tasks simultaneously.", hint: "Use the 'threading' module." },
            { id: 9, title: "Web Scraping", description: "Extract data from websites.", hint: "Use 'requests' and 'BeautifulSoup'." }
        ]
    },
    "JavaScript": {
        easy: [
            { id: 1, title: "DOM Manipulation", description: "Interact with HTML elements.", hint: "Use 'document.getElementById()'." },
            { id: 2, title: "Event Handling", description: "Handle user interactions.", hint: "Use 'addEventListener()'." },
            { id: 3, title: "Array Methods", description: "Practice array operations.", hint: "Try 'map()' and 'filter()'." }
        ],
        medium: [
            { id: 4, title: "Promises and Async/Await", description: "Handle asynchronous operations.", hint: "Start with basic promises." },
            { id: 5, title: "ES6 Features", description: "Use modern JavaScript features.", hint: "Try arrow functions." },
            { id: 6, title: "API Integration", description: "Fetch data from APIs.", hint: "Use 'fetch()' API." }
        ],
        hard: [
            { id: 7, title: "Design Patterns", description: "Implement common design patterns.", hint: "Start with Singleton pattern." },
            { id: 8, title: "Performance Optimization", description: "Optimize JavaScript code.", hint: "Use performance profiling." },
            { id: 9, title: "Node.js Backend", description: "Build a backend server.", hint: "Use Express.js." }
        ]
    },
    "React": {
        easy: [
            { id: 1, title: "Components and JSX", description: "Create a simple React component.", hint: "Use functional components." },
            { id: 2, title: "Props and State", description: "Manage component state.", hint: "Use useState hook." },
            { id: 3, title: "Event Handling", description: "Handle user events.", hint: "Use onClick handlers." }
        ],
        medium: [
            { id: 4, title: "Hooks", description: "Use React hooks.", hint: "Start with useEffect." },
            { id: 5, title: "Context API", description: "Manage global state.", hint: "Use createContext." },
            { id: 6, title: "Routing", description: "Implement client-side routing.", hint: "Use react-router-dom." }
        ],
        hard: [
            { id: 7, title: "Performance Optimization", description: "Optimize React apps.", hint: "Use memo and useCallback." },
            { id: 8, title: "Custom Hooks", description: "Create custom hooks.", hint: "Encapsulate reusable logic." },
            { id: 9, title: "State Management", description: "Use Redux or Zustand.", hint: "Start with Redux Toolkit." }
        ]
    },
    "Data Analysis": {
        easy: [
            { id: 1, title: "Basic Statistics", description: "Calculate mean, median, and mode.", hint: "Use pandas." },
            { id: 2, title: "Data Cleaning", description: "Clean a dataset.", hint: "Handle missing values." },
            { id: 3, title: "Simple Plots", description: "Create basic visualizations.", hint: "Use matplotlib." }
        ],
        medium: [
            { id: 4, title: "Pivot Tables", description: "Create pivot tables.", hint: "Use pandas pivot_table." },
            { id: 5, title: "Correlation Analysis", description: "Analyze correlations.", hint: "Use pandas corr()." },
            { id: 6, title: "Time Series", description: "Analyze time series data.", hint: "Use pandas for time indexing." }
        ],
        hard: [
            { id: 7, title: "Advanced Modeling", description: "Build predictive models.", hint: "Use scikit-learn." },
            { id: 8, title: "Machine Learning", description: "Apply ML to data analysis.", hint: "Try regression models." },
            { id: 9, title: "Big Data Processing", description: "Handle large datasets.", hint: "Use Dask or Spark." }
        ]
    },
    "Web Development": {
        easy: [
            { id: 1, title: "HTML Structure", description: "Create a basic HTML page.", hint: "Use semantic tags." },
            { id: 2, title: "CSS Styling", description: "Style a webpage.", hint: "Use Flexbox or Grid." },
            { id: 3, title: "Basic JavaScript", description: "Add interactivity.", hint: "Use event listeners." }
        ],
        medium: [
            { id: 4, title: "Responsive Design", description: "Make a responsive webpage.", hint: "Use media queries." },
            { id: 5, title: "Form Validation", description: "Validate form inputs.", hint: "Use JavaScript or HTML5." },
            { id: 6, title: "AJAX Requests", description: "Fetch data asynchronously.", hint: "Use fetch API." }
        ],
        hard: [
            { id: 7, title: "Full Stack Application", description: "Build a full-stack app.", hint: "Use MERN stack." },
            { id: 8, title: "Database Integration", description: "Connect to a database.", hint: "Use MongoDB." },
            { id: 9, title: "Deployment", description: "Deploy a web app.", hint: "Use Vercel or Heroku." }
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

// Skill extraction utils
const TECH_SKILL_SET = new Set(['python', 'java', 'javascript', 'js', 'node', 'nodejs', 'react', 'angular', 'vue', 'html', 'css', 'docker', 'kubernetes', 'k8s', 'aws', 'gcp', 'azure', 'git', 'github', 'graphql', 'rest', 'api', 'mongodb', 'mysql', 'postgres', 'sql', 'redis', 'kafka', 'spark', 'pandas', 'numpy', 'tensorflow', 'keras', 'pytorch', 'machine learning', 'deep learning', 'nlp', 'flask', 'django', 'fastapi', 'express', 'typescript', 'c++', 'cpp', 'go', 'golang', 'rust', 'php', 'laravel', 'swift', 'kotlin', 'android', 'ios', 'flutter', 'selenium', 'jest', 'mocha', 'cypress', 'devops', 'microservices', 'oauth', 'jwt', 'security', 'etl', 'tableau', 'powerbi']);
const SOFT_SKILL_SET = new Set(['communication', 'leadership', 'teamwork', 'management', 'strategic', 'planning', 'negotiation', 'presentation', 'stakeholder', 'coordination', 'problem solving', 'critical thinking', 'adaptability', 'collaboration', 'time management', 'organization', 'customer service', 'sales', 'marketing', 'budgeting', 'reporting', 'finance', 'recruitment', 'training', 'mentoring', 'analysis', 'operations', 'project management', 'agile', 'scrum']);
const MULTI_WORD = ['machine learning', 'deep learning', 'data science', 'problem solving', 'critical thinking', 'time management', 'project management'];

function normalizeSkill(s) { return s.toLowerCase().trim(); }
function extractSkillsDeterministic(text = '') { const lower = text.toLowerCase(); const found = new Set(); for (const phrase of MULTI_WORD) { if (lower.includes(phrase)) found.add(phrase); } const tokens = lower.split(/[^a-z0-9+#.]+/).filter(t => t.length > 1); for (let t of tokens) { if (t === 'js') t = 'javascript'; if (t === 'ml') t = 'machine learning'; if (t === 'dl') t = 'deep learning'; if (TECH_SKILL_SET.has(t) || SOFT_SKILL_SET.has(t)) found.add(t); } return Array.from(found).sort(); }
function classifyDomain(resumeSkills, jdSkills) { const tech = resumeSkills.filter(s => TECH_SKILL_SET.has(s)).length + jdSkills.filter(s => TECH_SKILL_SET.has(s)).length; const soft = resumeSkills.filter(s => SOFT_SKILL_SET.has(s)).length + jdSkills.filter(s => SOFT_SKILL_SET.has(s)).length; return tech >= soft ? 'tech' : 'non-tech'; }

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

function genericProblemSet(skill) {
    return {
        easy: [{ id: 1, title: `Intro to ${skill}`, description: `Learn basics of ${skill}`, hint: 'Start with fundamentals.' }, { id: 2, title: `Syntax / Concepts`, description: `Core concepts of ${skill}`, hint: 'Cover terminology.' }, { id: 3, title: `Simple Task`, description: `Small exercise in ${skill}`, hint: 'Apply basics.' }],
        medium: [{ id: 4, title: `Mini Project (${skill})`, description: `Build a small project using ${skill}`, hint: 'Combine concepts.' }, { id: 5, title: `Debug ${skill} Code`, description: 'Find & fix issues', hint: 'Systematic approach.' }, { id: 6, title: `Optimize ${skill} Use`, description: 'Improve performance/style', hint: 'Refactor.' }],
        hard: [{ id: 7, title: `Advanced Project (${skill})`, description: `End-to-end solution with ${skill}`, hint: 'Architect first.' }, { id: 8, title: `Scale ${skill} Project`, description: 'Handle complexity & scaling', hint: 'Measure bottlenecks.' }, { id: 9, title: `Teach ${skill}`, description: 'Create tutorial / doc', hint: 'Deep understanding.' }]
    };
}

function suggestFallbackProjects(missing) {
    if (!missing.length) return ['Refactor an existing project adding measurable outcomes', 'Create documentation & tests for a past project'];
    return missing.slice(0, 2).map(s => `Build a project showcasing practical ${s}`);
}

// YouTube video fetcher
// YouTube video fetcher
async function fetchVideos(query) {
    if (!YOUTUBE_API_KEY) {
        console.warn('YOUTUBE_API_KEY missing. Returning placeholders.');
        return {};
    }

    const languages = ["english", "hindi", "telugu", "tamil", "kannada"];
    const results = {};
    const queryClean = query.replace(/ \(.+\)/g, '').trim();
    const isAdvanced = query.toLowerCase().includes('advanced');

    for (const lang of languages) {
        try {
            const langCode = langCodes[lang] || 'en';

            // Relaxed queries for better match rates
            let searchQuery = `${queryClean} ${isAdvanced ? 'advanced tutorial' : 'beginner tutorial'} in ${lang}`;

            if (lang === 'english') {
                searchQuery = `${queryClean} ${isAdvanced ? 'advanced expert tutorial' : 'complete course tutorial'}`;
            }

            console.log(`[YT Search] Query for ${lang}: ${searchQuery}`);

            const ytRes = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
                params: {
                    part: 'snippet',
                    type: 'video',
                    maxResults: 6,
                    q: searchQuery,
                    key: YOUTUBE_API_KEY,
                    order: 'relevance',
                    videoDefinition: 'high',
                    relevanceLanguage: langCode,
                    safeSearch: 'moderate'
                }
            });

            const items = ytRes.data.items || [];

            if (items.length === 0 && lang !== 'english') {
                console.log(`No results for ${lang}, skipping.`);
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
                    durations[item.id] = item.contentDetails.duration || "PT15M";
                });
            }

            // Filter out short videos (< 1 min)
            const filteredItems = items.filter(item => {
                const dur = durations[item.id.videoId] || "PT0M";
                return !dur.match(/PT[0]M/);
            }).slice(0, 4);

            results[lang] = filteredItems.map(item => ({
                title: item.snippet.title || "Untitled Tutorial",
                videoId: item.id.videoId,
                url: `https://www.youtube.com/embed/${item.id.videoId}`,
                duration: durations[item.id.videoId] || "PT15M",
                thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url
            }));

        } catch (error) {
            console.error(`❌ Error fetching videos for ${lang}:`, error.message);
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
    let resumeFilePath, jdFilePath;
    try {
        const resumeFile = req.files?.resume?.[0];
        const jdFile = req.files?.jd?.[0];
        const jdTextField = req.body.jd_text;

        if (!resumeFile) return res.status(400).json({ success: false, error: 'Missing resume file' });
        if (!jdFile && !jdTextField) return res.status(400).json({ success: false, error: 'Provide JD file or jd_text' });

        resumeFilePath = resumeFile.path;
        if (jdFile) jdFilePath = jdFile.path;

        const resumeBuffer = fs.readFileSync(resumeFilePath);
        const resumeText = await safeExtractPdf(resumeBuffer, resumeFile.originalname);

        if (resumeText.length < 10) {
            return res.status(400).json({ success: false, error: 'Unable to extract text from resume PDF.' });
        }

        let jdText = '';
        if (jdFile) {
            const jdBuffer = fs.readFileSync(jdFilePath);
            jdText = await safeExtractPdf(jdBuffer, jdFile.originalname);
            if (jdText.length < 10) return res.status(400).json({ success: false, error: 'Unable to extract text from JD PDF.' });
        } else if (jdTextField) {
            jdText = jdTextField;
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
        const prompt = `Compare this resume: ${resumeText.slice(0, ctxLimit)}\n\nwith this job description: ${jdText.slice(0, ctxLimit)}\n\nReturn ONLY JSON with keys missingSkills (array), score (0-100), skillToLearnFirst (string), projectSuggestions (array).`;

        let aiResult, aiRaw;

        if (strategy !== 'deterministic' && OPENROUTER_API_KEY) {
            try {
                const aiRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                    model: AI_MODEL,
                    messages: [
                        { role: 'system', content: 'Return strict JSON only.' },
                        { role: 'user', content: prompt }
                    ]
                }, {
                    headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}` }
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
            allProblems[skill] = problems[skill] || genericProblemSet(skill);
        }

        const payload = {
            success: true,
            score: aiResult.score,
            domain,
            jdSkills,
            resumeSkills,
            matchedSkills,
            missingSkills: missingUnion,
            projectSuggestions: aiResult.projectSuggestions,
            skillToLearnFirst: aiResult.skillToLearnFirst,
            videos: allVideos,
            problems: allProblems,
            warnings: [],
            data: {
                // Duplicate data for frontend compatibility if needed
                score: aiResult.score,
                domain,
                jdSkills,
                resumeSkills,
                matchedSkills,
                missingSkills: missingUnion,
                projectSuggestions: aiResult.projectSuggestions,
                skillToLearnFirst: aiResult.skillToLearnFirst,
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
    const { skill } = req.body;
    if (!skill) return res.status(400).json({ success: false, error: 'Missing skill parameter' });

    try {
        const videos = await fetchVideos(skill);
        const skillProblems = problems[skill] || genericProblemSet(skill);
        res.json({ success: true, data: { videos, problems: skillProblems } });
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch videos' });
    }
});

router.post('/ask', async (req, res) => {
    const { question, skill } = req.body;
    if (!question || !skill) return res.status(400).json({ success: false, error: 'Missing question or skill' });

    if (!OPENROUTER_API_KEY) {
        return res.json({ success: true, answer: "AI Chat is not configured (missing API Key)." });
    }

    try {
        const systemPrompt = `You are Hiero Tutor, a professional career coach and technical expert for ${skill}.
        Keep your tone encouraging, professional, and highly structured.
        Use bullet points for steps and bold text for key concepts.
        If the user is solving a problem, provide hints before the full solution.
        Always link concepts back to real-world career growth and professional excellence.`;

        const aiRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: AI_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Student Question: ${question}` }
            ]
        }, { headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}` } });

        res.json({ success: true, answer: aiRes.data.choices?.[0]?.message?.content || "No response." });
    } catch (error) {
        console.error('Chatbot error:', error);
        res.json({ success: true, answer: "Sorry, I couldn't process your question." });
    }
});

module.exports = router;
