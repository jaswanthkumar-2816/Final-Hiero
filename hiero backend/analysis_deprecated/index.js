require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const bodyParser = require('body-parser');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const AI_MODEL = process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct';

const app = express();

// Explicit CORS configuration for frontend at localhost:8082
const corsOptions = {
  origin: [
    'http://localhost:8082',
    'http://127.0.0.1:8082'
  ],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Origin','X-Requested-With','Content-Type','Accept','Authorization'],
  exposedHeaders: [
    'X-Analysis-Score',
    'X-Analysis-Matched',
    'X-Analysis-BaseScore',
    'X-Analysis-Used-AI',
    'X-Analysis-AI-Raw-Len',
    'X-Analysis-AI-Model',
    'X-Analysis-Strategy'
  ]
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files (result.html, learn.html)

// --- Ensure uploads directory exists ---
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`Created upload directory: ${UPLOAD_DIR}`);
}

// Basic env validation (warn/exit for critical keys)
const missing = [];
if (!OPENROUTER_API_KEY) missing.push('OPENROUTER_API_KEY');
if (!YOUTUBE_API_KEY) console.warn('Warning: YOUTUBE_API_KEY missing — video fetches will use fallback defaults.');
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  // process.exit(1); // Uncomment to enforce mandatory AI key
}

// Early request logging (before routes)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.get('origin') || req.ip}`);
  if (req.body && Object.keys(req.body).length > 0) {
    try { console.log(`[REQUEST_BODY] ${JSON.stringify(req.body).substring(0, 200)}`); } catch {}
  }
  if (req.files && Object.keys(req.files).length > 0) {
    console.log(`[REQUEST_FILES] ${Object.keys(req.files).map(key => `${key}: ${req.files[key].length} files`).join(', ')}`);
  }
  next();
});

// Configure multer storage for uploads (preserve extension)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,9)}${ext}`);
  }
});
const upload = multer({ storage });

// (CORS handled above)

// --- Health Check (needed by frontend upload page) ---
app.get('/health', (req,res)=>{
  res.json({ status:'ok', timestamp:new Date().toISOString(), service:'analysis' });
});

// Problems database for different skills
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

// Language codes for YouTube API
const langCodes = {
  english: 'en',
  hindi: 'hi',
  telugu: 'te',
  tamil: 'ta',
  kannada: 'kn'
};

// Function to fetch YouTube videos
async function fetchVideos(query) {
  const languages = ["english", "hindi", "telugu", "tamil", "kannada"];
  const results = {};
  const queryClean = query.replace(/ \(.+\)/g, '').trim();
  const isAdvanced = query.match(/\(\s*Advanced\s*\)/i);

  const defaultVideos = {
    english: [{ title: "General Tutorial", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "PT3M", videoId: "dQw4w9WgXcQ" }],
    hindi: [{ title: "General Tutorial in Hindi", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "PT3M", videoId: "dQw4w9WgXcQ" }],
    telugu: [{ title: "General Tutorial in Telugu", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "PT3M", videoId: "dQw4w9WgXcQ" }],
    tamil: [{ title: "General Tutorial in Tamil", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "PT3M", videoId: "dQw4w9WgXcQ" }],
    kannada: [{ title: "General Tutorial in Kannada", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", duration: "PT3M", videoId: "dQw4w9WgXcQ" }]
  };

  for (const lang of languages) {
    try {
      let searchQuery = `best ${queryClean} tutorial in ${lang}`;
      if (isAdvanced) {
        searchQuery = `best advanced ${queryClean} tutorial in ${lang}`;
      } else {
        searchQuery = `best ${queryClean} tutorial for beginners in ${lang}`;
      }
      const langCode = langCodes[lang] || 'en';
      const ytRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=3&q=${encodeURIComponent(searchQuery)}&key=${YOUTUBE_API_KEY}&order=viewCount&relevanceLanguage=${langCode}`
      );
      const ytData = await ytRes.json();
      const items = ytData.items || [];
      const videoIds = items.map(item => item.id.videoId).join(',');

      let durations = {};
      if (videoIds) {
        const detailsRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
        );
        const detailsData = await detailsRes.json();
        detailsData.items?.forEach(item => {
          durations[item.id] = item.contentDetails.duration || "PT15M";
        });
      }

      results[lang] = items.map(item => ({
        title: item.snippet.title || "Untitled Video",
        videoId: item.id.videoId,
        url: `https://www.youtube.com/embed/${item.id.videoId}`,
        duration: durations[item.id.videoId] || "PT15M"
      }));

      if (results[lang].length === 0) {
        results[lang] = defaultVideos[lang];
      }
    } catch (error) {
      console.error(`❌ Error fetching videos for ${lang}:`, error);
      results[lang] = defaultVideos[lang];
    }
  }
  return results;
}

// Function to extract skills from job description for fallback
function extractSkillsFromJD(jdText) {
  const availableSkills = Object.keys(problems);
  const foundSkills = availableSkills.filter(skill => jdText.toLowerCase().includes(skill.toLowerCase()));
  return foundSkills.length > 0 ? foundSkills : ['Python', 'Machine Learning'];
}

// Insert deterministic skill extraction utilities
const TECH_SKILL_SET = new Set(['python','java','javascript','js','node','nodejs','react','angular','vue','html','css','docker','kubernetes','k8s','aws','gcp','azure','git','github','graphql','rest','api','mongodb','mysql','postgres','sql','redis','kafka','spark','pandas','numpy','tensorflow','keras','pytorch','machine learning','deep learning','nlp','flask','django','fastapi','express','typescript','c++','cpp','go','golang','rust','php','laravel','swift','kotlin','android','ios','flutter','selenium','jest','mocha','cypress','devops','microservices','oauth','jwt','security','etl','tableau','powerbi']);
const SOFT_SKILL_SET = new Set(['communication','leadership','teamwork','management','strategic','planning','negotiation','presentation','stakeholder','coordination','problem solving','critical thinking','adaptability','collaboration','time management','organization','customer service','sales','marketing','budgeting','reporting','finance','recruitment','training','mentoring','analysis','operations','project management','agile','scrum']);
const MULTI_WORD = ['machine learning','deep learning','data science','problem solving','critical thinking','time management','project management'];
function normalizeSkill(s){return s.toLowerCase().trim();}
function extractSkillsDeterministic(text=''){ const lower=text.toLowerCase(); const found=new Set(); for(const phrase of MULTI_WORD){ if(lower.includes(phrase)) found.add(phrase); } const tokens=lower.split(/[^a-z0-9+#.]+/).filter(t=>t.length>1); for(let t of tokens){ if(t==='js') t='javascript'; if(t==='ml') t='machine learning'; if(t==='dl') t='deep learning'; if(TECH_SKILL_SET.has(t) || SOFT_SKILL_SET.has(t)) found.add(t); } return Array.from(found).sort(); }
function classifyDomain(resumeSkills,jdSkills){ const tech=resumeSkills.filter(s=>TECH_SKILL_SET.has(s)).length + jdSkills.filter(s=>TECH_SKILL_SET.has(s)).length; const soft=resumeSkills.filter(s=>SOFT_SKILL_SET.has(s)).length + jdSkills.filter(s=>SOFT_SKILL_SET.has(s)).length; return tech>=soft? 'tech':'non-tech'; }

// Analyze resume and job description
app.post('/api/analyze', upload.fields([{ name: 'resume' }, { name: 'jd' }]), async (req, res) => {
  let resumeFilePath, jdFilePath;
  try {
    const resumeFile = req.files?.resume?.[0];
    const jdFile = req.files?.jd?.[0];
    const jdTextField = req.body.jd_text; // allow plain text JD
    if (!resumeFile) {
      return res.status(400).json({ success: false, error: 'Missing resume file' });
    }
    if (!jdFile && !jdTextField) {
      return res.status(400).json({ success: false, error: 'Provide JD file or jd_text' });
    }
    resumeFilePath = resumeFile.path;
    if (jdFile) jdFilePath = jdFile.path;

    const resumeBuffer = fs.readFileSync(resumeFilePath);
    console.log(`Processing resume PDF: ${resumeFilePath}, size: ${resumeBuffer.length} bytes`);
    
    const resumeText = (await safeExtractPdf(resumeBuffer, resumeFile.originalname || 'resume.pdf')) || '';
    console.log(`Resume text extracted: ${resumeText.length} characters`);
    
    // Check if resume extraction was successful
    if (resumeText.length < 10) {
      console.warn('Resume text extraction yielded very little content');
      return res.status(400).json({ 
        success: false, 
        error: 'Unable to extract text from resume PDF. The file may be corrupted, password-protected, or in an unsupported format.',
        suggestion: 'Please try uploading a different PDF file or convert it to a standard PDF format.',
        extractedLength: resumeText.length
      });
    }
    
    let jdText = '';
    if (jdFile) {
      const jdBuffer = fs.readFileSync(jdFilePath);
      console.log(`Processing JD PDF: ${jdFilePath}, size: ${jdBuffer.length} bytes`);
      jdText = (await safeExtractPdf(jdBuffer, jdFile.originalname || 'jd.pdf')) || '';
      console.log(`JD text extracted: ${jdText.length} characters`);
      
      // Check if JD extraction was successful
      if (jdText.length < 10) {
        console.warn('JD text extraction yielded very little content');
        return res.status(400).json({ 
          success: false, 
          error: 'Unable to extract text from job description PDF. The file may be corrupted, password-protected, or in an unsupported format.',
          suggestion: 'Please try uploading a different PDF file, convert it to a standard PDF format, or use the text input option.',
          extractedLength: jdText.length
        });
      }
    } else if (jdTextField) {
      jdText = jdTextField;
      console.log(`Using JD text field: ${jdText.length} characters`);
    }

    // Strategy: ai | deterministic | hybrid (default)
    const strategy = (req.query.strategy || process.env.ANALYSIS_STRATEGY || 'hybrid').toLowerCase();

    // Deterministic skill extraction first
    const resumeSkills = extractSkillsDeterministic(resumeText);
    const jdSkills = extractSkillsDeterministic(jdText);
    const jdSet = new Set(jdSkills);
    const resumeSet = new Set(resumeSkills);
    const matchedSkills = Array.from(jdSet).filter(s=>resumeSet.has(s));
    const missingSkillsPre = Array.from(jdSet).filter(s=>!resumeSet.has(s));
    const baseScore = jdSet.size? Math.round((matchedSkills.length / jdSet.size)*100):0;
    const domain = classifyDomain(resumeSkills,jdSkills);

    // Build AI prompt (trim to avoid token bloat)
    const ctxLimit = parseInt(process.env.ANALYSIS_TEXT_LIMIT || '4000', 10);
    const resumeTextShort = resumeText.slice(0, ctxLimit);
    const jdTextShort = jdText.slice(0, ctxLimit);
    const prompt = `Compare this resume: ${resumeTextShort}\n\nwith this job description: ${jdTextShort}\n\nReturn ONLY JSON with keys missingSkills (array), score (0-100), skillToLearnFirst (string), projectSuggestions (array).`;

    let aiResult; let aiRaw;
    if (strategy !== 'deterministic') {
      try {
        const routerRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: AI_MODEL, messages: [ { role:'system', content:'Return strict JSON only.' }, { role:'user', content: prompt } ] })
        });
        const result = await routerRes.json();
        aiRaw = result?.choices?.[0]?.message?.content || '';
        const jsonMatch = aiRaw.match(/\{[\s\S]*\}/);
        if (jsonMatch) aiResult = JSON.parse(jsonMatch[0]);
      } catch(e) {
        // ignore, fallback later
      }
    }
    if (!aiResult) {
      aiResult = { score: baseScore, missingSkills: missingSkillsPre, skillToLearnFirst: missingSkillsPre[0] || '', projectSuggestions: suggestFallbackProjects(missingSkillsPre) };
    }
    // Clean AI fields
    aiResult.missingSkills = Array.isArray(aiResult.missingSkills)? aiResult.missingSkills.map(s=>s.toString().trim()).filter(Boolean): missingSkillsPre;
    if (aiResult.score == null || isNaN(aiResult.score)) aiResult.score = baseScore;
    aiResult.skillToLearnFirst = aiResult.skillToLearnFirst || aiResult.missingSkills[0] || '';
    aiResult.projectSuggestions = Array.isArray(aiResult.projectSuggestions) && aiResult.projectSuggestions.length? aiResult.projectSuggestions : suggestFallbackProjects(aiResult.missingSkills);

    // Optionally filter soft skills from scoring/missing
    const filterSoft = (process.env.FILTER_SOFT_SKILLS || '1') === '1';
    const filterFn = s => !filterSoft || !SOFT_SKILL_SET.has(s.toLowerCase());

    // Merge deterministic and AI (ensure deterministic jd/matched preserved)
    let missingUnion = [...new Set([ ...missingSkillsPre, ...aiResult.missingSkills ])].filter(filterFn);

    // If strategy is 'ai', prefer only AI missing skills
    if (strategy === 'ai') {
      missingUnion = Array.from(new Set(aiResult.missingSkills)).filter(filterFn);
    }

    // Enrichment (videos/problems) for missing skills (limit 6)
    const allVideos = {}; const allProblems = {};
    for (const skill of missingUnion.slice(0,6)) {
      try { allVideos[skill] = await fetchVideos(skill); } catch { allVideos[skill] = {}; }
      allProblems[skill] = problems[skill] || genericProblemSet(skill);
    }

    // Build response payload (top-level + nested for frontend compatibility)
    const usedAi = !!aiRaw && !!aiResult;
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
        score: aiResult.score,
        domain,
        jdSkills,
        resumeSkills,
        matchedSkills,
        presentSkills: matchedSkills,
        missingSkills: missingUnion,
        projectSuggestions: aiResult.projectSuggestions,
        skillToLearnFirst: aiResult.skillToLearnFirst,
        videos: allVideos,
        problems: allProblems,
        warnings: [],
        debug: {
          resumeTextLength: resumeText.length,
          jdTextLength: jdText.length,
          resumeFile: resumeFile?.originalname || null,
          jdFile: jdFile?.originalname || null,
          resumeSkillsCount: resumeSkills.length,
          jdSkillsCount: jdSkills.length,
          matchedCount: matchedSkills.length,
          missingCount: missingUnion.length,
          baseScore,
          usedAi,
          aiModel: AI_MODEL,
          aiRawLength: aiRaw ? aiRaw.length : 0,
          aiRawSample: aiRaw ? aiRaw.slice(0, 200) : ''
        }
      }
    };

    // Terminal trace before sending
    console.log(`[ANALYZE_COMPLETE] resume=${payload.data.debug.resumeFile} jd=${payload.data.debug.jdFile} score=${payload.score} matched=${matchedSkills.length}/${jdSkills.length} missing=${missingUnion.length} resumeChars=${payload.data.debug.resumeTextLength} jdChars=${payload.data.debug.jdTextLength}`);
    console.log(`[RESPONSE_STRUCTURE] top-level score=${payload.score} data.score=${payload.data.score} success=${payload.success}`);
    console.log(`[FULL_RESPONSE] ${JSON.stringify(payload).substring(0, 200)}...`);

    res.setHeader('X-Analysis-Score', String(payload.score));
    res.setHeader('X-Analysis-Matched', `${matchedSkills.length}/${jdSkills.length}`);
    res.setHeader('X-Analysis-BaseScore', String(baseScore));
    res.setHeader('X-Analysis-Used-AI', usedAi ? '1' : '0');
    res.setHeader('X-Analysis-AI-Raw-Len', String(aiRaw ? aiRaw.length : 0));
    res.setHeader('X-Analysis-AI-Model', AI_MODEL);
    res.setHeader('X-Analysis-Strategy', strategy);
    return res.json(payload);
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ success:false, error:'Analysis failed', details:error.message });
  } finally {
    if (resumeFilePath && fs.existsSync(resumeFilePath)) fs.unlinkSync(resumeFilePath);
    if (jdFilePath && fs.existsSync(jdFilePath)) fs.unlinkSync(jdFilePath);
  }
});

// Endpoint to get videos and problems for a skill
app.post('/api/get-videos', async (req, res) => {
  const { skill } = req.body;
  if (!skill) {
    return res.status(400).json({ success: false, error: 'Missing skill parameter' });
  }

  try {
    const videos = await fetchVideos(skill);
    const skillProblems = problems[skill] || {
      easy: [
        { id: 1, title: "Basic Problem 1", description: "Generic easy problem.", hint: "Start with basics." },
        { id: 2, title: "Basic Problem 2", description: "Another easy problem.", hint: "Practice fundamentals." },
        { id: 3, title: "Basic Problem 3", description: "Simple practice task.", hint: "Focus on core concepts." }
      ],
      medium: [
        { id: 4, title: "Intermediate Problem 1", description: "Generic medium problem.", hint: "Build on basics." },
        { id: 5, title: "Intermediate Problem 2", description: "Another medium problem.", hint: "Apply concepts." },
        { id: 6, title: "Intermediate Problem 3", description: "Moderate challenge.", hint: "Use intermediate skills." }
      ],
      hard: [
        { id: 7, title: "Advanced Problem 1", description: "Generic hard problem.", hint: "Deep dive into concepts." },
        { id: 8, title: "Advanced Problem 2", description: "Complex challenge.", hint: "Use advanced techniques." },
        { id: 9, title: "Advanced Problem 3", description: "Advanced task.", hint: "Master the skill." }
      ]
    };

    res.json({
      success: true,
      data: {
        videos,
        problems: skillProblems
      }
    });
  } catch (error) {
    console.error('Error fetching videos/problems:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch videos or problems' });
  }
});

// Chatbot endpoint
app.post('/api/ask', async (req, res) => {
  const { question, skill } = req.body;
  if (!question || !skill) {
    return res.status(400).json({ success: false, error: 'Missing question or skill' });
  }

  try {
    const prompt = `You are an expert tutor for ${skill}. Answer the following question in a concise and helpful way, providing a clear explanation and, if relevant, a code example or hint: ${question}`;
    const routerRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct',
        messages: [
          { role: "system", content: "You are an expert tutor. Provide concise, accurate, and helpful answers with examples or hints when relevant." },
          { role: "user", content: prompt }
        ]
      })
    });
    const result = await routerRes.json();
    if (!result.choices || !result.choices[0]?.message?.content) {
      throw new Error('No response from AI');
    }
    res.json({
      success: true,
      answer: result.choices[0].message.content
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.json({
      success: true,
      answer: `Sorry, I couldn't process your question about ${skill}. Try rephrasing or checking the provided resources.`
    });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

function genericProblemSet(skill){
  return {
    easy:[{id:1,title:`Intro to ${skill}`,description:`Learn basics of ${skill}`,hint:'Start with fundamentals.'},{id:2,title:`Syntax / Concepts`,description:`Core concepts of ${skill}`,hint:'Cover terminology.'},{id:3,title:`Simple Task`,description:`Small exercise in ${skill}`,hint:'Apply basics.'}],
    medium:[{id:4,title:`Mini Project (${skill})`,description:`Build a small project using ${skill}`,hint:'Combine concepts.'},{id:5,title:`Debug ${skill} Code`,description:'Find & fix issues',hint:'Systematic approach.'},{id:6,title:`Optimize ${skill} Use`,description:'Improve performance/style',hint:'Refactor.'}],
    hard:[{id:7,title:`Advanced Project (${skill})`,description:`End-to-end solution with ${skill}`,hint:'Architect first.'},{id:8,title:`Scale ${skill} Project`,description:'Handle complexity & scaling',hint:'Measure bottlenecks.'},{id:9,title:`Teach ${skill}`,description:'Create tutorial / doc',hint:'Deep understanding.'}]
  };
}
function suggestFallbackProjects(missing){ if(!missing.length) return ['Refactor an existing project adding measurable outcomes','Create documentation & tests for a past project']; return missing.slice(0,2).map(s=>`Build a project showcasing practical ${s}`); }
async function safeExtractPdf(buffer, fileName = 'unknown'){
  console.log(`Attempting to parse PDF: ${fileName}, size: ${buffer.length} bytes`);
  
  let bestResult = '';
  let bestLength = 0;
  
  // Method 1: Standard pdf-parse with default options
  try {
    const result = await pdfParse(buffer);
    if (result.text && result.text.trim().length > 0) {
      const text = result.text.trim();
      console.log(`Method 1: Extracted ${text.length} characters using standard pdf-parse`);
      if (text.length > bestLength) {
        bestResult = text;
        bestLength = text.length;
      }
    }
  } catch(error) {
    console.warn(`Method 1 failed for ${fileName}:`, error.message);
  }
  
  // Method 2: pdf-parse with lenient options
  try {
    const result = await pdfParse(buffer, {
      max: 0, // Process all pages
      version: 'v1.10.100',
      normalizeWhitespace: false,
      disableCombineTextItems: false
    });
    if (result.text && result.text.trim().length > 0) {
      const text = result.text.trim();
      console.log(`Method 2: Extracted ${text.length} characters using lenient pdf-parse`);
      if (text.length > bestLength) {
        bestResult = text;
        bestLength = text.length;
      }
    }
  } catch(error) {
    console.warn(`Method 2 failed for ${fileName}:`, error.message);
  }
  
  // Method 3: Try without normalization
  try {
    const result = await pdfParse(buffer, {
      normalizeWhitespace: false,
      disableCombineTextItems: false
    });
    if (result.text && result.text.trim().length > 0) {
      const text = result.text.trim();
      console.log(`Method 3: Extracted ${text.length} characters with custom options`);
      if (text.length > bestLength) {
        bestResult = text;
        bestLength = text.length;
      }
    }
  } catch(error) {
    console.warn(`Method 3 failed for ${fileName}:`, error.message);
  }
  
  // Method 4: Try to extract raw text from PDF binary
  try {
    const bufferString = buffer.toString('binary');
    
    // Look for text streams in PDF
    const textPatterns = [
      /\(([^)]+)\)\s*Tj/g,  // Text showing operators
      /\[([^\]]+)\]\s*TJ/g,  // Text arrays
      /BT\s+(.*?)\s+ET/gs    // Text blocks
    ];
    
    let extractedText = '';
    
    for (const pattern of textPatterns) {
      const matches = [...bufferString.matchAll(pattern)];
      matches.forEach(match => {
        let text = match[1] || match[0];
        // Clean up the extracted text
        text = text.replace(/[()[\]]/g, ' ')
                  .replace(/\\[rnt]/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();
        
        if (text.length > 2 && /[a-zA-Z]/.test(text)) {
          extractedText += text + ' ';
        }
      });
    }
    
    if (extractedText.trim().length > bestLength) {
      bestResult = extractedText.trim();
      bestLength = extractedText.trim().length;
      console.log(`Method 4: Extracted ${bestLength} characters using binary extraction`);
    }
  } catch(error) {
    console.warn(`Method 4 failed for ${fileName}:`, error.message);
  }
  
  // Method 5: Try to find any readable ASCII text in the buffer
  try {
    const bufferString = buffer.toString('ascii');
    const readableText = bufferString.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
                                   .replace(/\s+/g, ' ')
                                   .trim();
    
    // Look for words (sequences of letters)
    const words = readableText.match(/[a-zA-Z]{3,}/g);
    if (words && words.length > 5) {
      const reconstructedText = words.join(' ');
      if (reconstructedText.length > bestLength) {
        bestResult = reconstructedText;
        bestLength = reconstructedText.length;
        console.log(`Method 5: Extracted ${bestLength} characters using ASCII extraction`);
      }
    }
  } catch(error) {
    console.warn(`Method 5 failed for ${fileName}:`, error.message);
  }
  
  if (bestLength > 0) {
    console.log(`✅ Final best extraction: ${bestLength} characters`);
    return bestResult;
  }
  
  console.error(`❌ All PDF extraction methods failed for ${fileName}`);
  return '';
}

// Debug endpoint to test PDF parsing
app.post('/api/debug-pdf', upload.single('pdf'), async (req, res) => {
  let filePath;
  try {
    const pdfFile = req.file;
    if (!pdfFile) {
      return res.status(400).json({ success: false, error: 'No PDF file uploaded' });
    }
    
    filePath = pdfFile.path;
    const buffer = fs.readFileSync(filePath);
    const extractedText = await safeExtractPdf(buffer, pdfFile.originalname);
    
    return res.json({
      success: true,
      data: {
        filename: pdfFile.originalname,
        fileSize: buffer.length,
        extractedLength: extractedText.length,
        preview: extractedText.substring(0, 500),
        fullText: extractedText
      }
    });
  } catch (error) {
    console.error('PDF debug error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'PDF processing failed', 
      details: error.message 
    });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

// Debug endpoint to test response structure
app.get('/api/test-response', (req, res) => {
  const testResponse = {
    success: true,
    score: 85,
    domain: "tech",
    jdSkills: ["python", "javascript", "react"],
    resumeSkills: ["python", "javascript"],
    matchedSkills: ["python", "javascript"],
    missingSkills: ["react"],
    projectSuggestions: ["Build a React project"],
    skillToLearnFirst: "react",
    videos: {},
    problems: {},
    warnings: [],
    data: {
      score: 85,
      domain: "tech",
      jdSkills: ["python", "javascript", "react"],
      resumeSkills: ["python", "javascript"],
      matchedSkills: ["python", "javascript"],
      missingSkills: ["react"],
      projectSuggestions: ["Build a React project"],
      skillToLearnFirst: "react",
      videos: {},
      problems: {},
      warnings: []
    }
  };
  
  console.log(`[TEST_RESPONSE] Sending test response with score=${testResponse.score} and data.score=${testResponse.data.score}`);
  res.setHeader('X-Analysis-Score', String(testResponse.score));
  res.json(testResponse);
});

// Add request logging middleware to see ALL incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.get('origin') || req.ip}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`[REQUEST_BODY] ${JSON.stringify(req.body).substring(0, 200)}`);
  }
  if (req.files && Object.keys(req.files).length > 0) {
    console.log(`[REQUEST_FILES] ${Object.keys(req.files).map(key => `${key}: ${req.files[key].length} files`).join(', ')}`);
  }
  next();
});