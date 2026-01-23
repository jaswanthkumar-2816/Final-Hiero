// simple-analysis-server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enforce JSON responses
app.use((req, res, next) => {
  res.header('Content-Type', 'application/json');
  next();
});

// === CONFIG ===
const {
  PORT = 5001,
  YOUTUBE_API_KEY,
  OPENROUTER_API_KEY
} = process.env;

// ✅ Do NOT crash the whole server if API keys are missing.
// These keys are only required for /api/get-videos and /api/ask.
// The core /api/analyze endpoint (resume analysis) should work without them.
if (!YOUTUBE_API_KEY) {
  console.warn('YOUTUBE_API_KEY missing in .env — /api/get-videos will be disabled.');
}
if (!OPENROUTER_API_KEY) {
  console.warn('OPENROUTER_API_KEY missing in .env — /api/ask chatbot will be disabled.');
}

// === MULTER ===
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// === SKILL BANKS ===
const skillBanks = {
  it: [
    // Programming Languages
    "python", "javascript", "java", "c++", "c#", "golang", "rust", "kotlin", "swift", "typescript",
    "ruby", "php", "scala", "groovy", "clojure", "elixir", "haskell", "r programming",

    // Web Development
    "react", "angular", "vue", "node", "express", "django", "flask", "fastapi",
    "html", "css", "responsive design", "bootstrap", "tailwind", "material ui",
    "rest api", "graphql", "websocket", "jwt", "oauth", "session management",

    // Data & Analytics
    "pandas", "numpy", "scipy", "scikit-learn", "statsmodels",
    "machine learning", "deep learning", "neural networks", "cnn", "rnn", "lstm", "transformer",
    "tensorflow", "pytorch", "keras", "torch", "jax",
    "data analysis", "statistical analysis", "hypothesis testing", "ab testing",
    "data science", "data engineering", "etl", "data pipeline", "data warehouse",
    "excel", "power bi", "tableau", "looker", "metabase",
    "sql", "sql optimization", "database design", "query optimization",

    // Cloud & DevOps
    "aws", "azure", "gcp", "cloud computing",
    "ec2", "s3", "lambda", "rds", "dynamodb", "elasticache",
    "docker", "kubernetes", "docker compose", "containerization",
    "ci/cd", "jenkins", "github actions", "gitlab ci", "circleci",
    "terraform", "cloudformation", "infrastructure as code", "iac",
    "monitoring", "logging", "splunk", "datadog", "newrelic",

    // Databases
    "sql", "mysql", "postgresql", "oracle", "sql server", "mongodb", "cassandra", "redis",
    "dynamodb", "firestore", "elasticsearch", "influxdb", "timescaledb",
    "database administration", "backup", "replication", "sharding",

    // Tools & Platforms
    "git", "github", "gitlab", "bitbucket", "version control",
    "jira", "confluence", "asana", "trello", "monday.com",
    "linux", "unix", "shell scripting", "bash", "zsh",
    "apache", "nginx", "server administration",
    "testing", "unit testing", "integration testing", "e2e testing",
    "jest", "pytest", "mocha", "selenium", "cypress", "testng",
    "seo", "web scraping", "apis", "postman", "insomnia",

    // Big Data
    "spark", "hadoop", "hive", "pig", "spark streaming", "kafka",
    "mapreduce", "hdfs", "yarn", "zookeeper",

    // Mobile Development
    "mobile development", "ios", "android", "flutter", "react native",
    "xcode", "android studio", "swift", "objective-c",

    // Other
    "agile", "scrum", "kanban", "waterfall",
    "microservices", "monolithic", "architecture", "design patterns",
    "security", "encryption", "ssl/tls", "penetration testing",
    "api development", "backend development", "frontend development", "fullstack"
  ],
  hr: ["recruitment", "onboarding", "payroll", "hrms", "employee engagement", "performance management", "talent acquisition"],
  finance: ["tally", "gst", "auditing", "sap fico", "budgeting", "mis reporting", "invoice processing", "reconciliation"],
  marketing: ["seo", "sem", "content writing", "google ads", "digital marketing", "branding"],
  sales: ["lead generation", "crm", "negotiation", "cold calling", "sales closing"],
  civil: ["autocad", "boq", "site supervision", "quantity estimation", "structural drawing"],
  healthcare: ["patient care", "medical records", "diagnosis", "nursing", "medication"],
  mechanical: ["solidworks", "creo", "quality control", "maintenance"],
  bpo: ["customer support", "ticket handling", "communication"]
};

// === PRACTICE PROBLEMS DATABASE ===
/**
 * Curated practice problems from HackerRank, LeetCode, and Kaggle
 * Organized by skill and difficulty level (easy, medium, hard)
 */
const practiceProblems = {
  python: {
    easy: [
      { title: "Simple Calculator", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/simple-calculator/problem", description: "Build a basic calculator" },
      { title: "Say Hello World with Python", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/say-hello-world-with-python/problem", description: "Print Hello World" },
      { title: "Python If-Else", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/py-if-else/problem", description: "Conditional statements" }
    ],
    medium: [
      { title: "List Comprehension", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/list-comprehensions/problem", description: "Master list comprehensions" },
      { title: "Nested Lists", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/nested-lists/problem", description: "Work with nested data structures" },
      { title: "String Validators", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/string-validators/problem", description: "Validate string properties" }
    ],
    hard: [
      { title: "Decorators", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/decorators/problem", description: "Advanced Python decorators" },
      { title: "Regex Parsing", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/regex-parsing/problem", description: "Regular expression parsing" },
      { title: "No Idea", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/no-idea/problem", description: "Set operations optimization" }
    ]
  },
  javascript: {
    easy: [
      { title: "Simple Array Sum", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/simple-array-sum/problem", description: "Sum array elements" },
      { title: "Solve Me First", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/solve-me-first/problem", description: "Add two numbers" },
      { title: "Two Sum", platform: "LeetCode", url: "https://leetcode.com/problems/two-sum/", description: "Find two numbers that add up to target" }
    ],
    medium: [
      { title: "3Sum", platform: "LeetCode", url: "https://leetcode.com/problems/3sum/", description: "Find all unique triplets" },
      { title: "Longest Substring Without Repeating Characters", platform: "LeetCode", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", description: "Sliding window problem" },
      { title: "Add Two Numbers", platform: "LeetCode", url: "https://leetcode.com/problems/add-two-numbers/", description: "Linked list arithmetic" }
    ],
    hard: [
      { title: "Median of Two Sorted Arrays", platform: "LeetCode", url: "https://leetcode.com/problems/median-of-two-sorted-arrays/", description: "Binary search optimization" },
      { title: "Regular Expression Matching", platform: "LeetCode", url: "https://leetcode.com/problems/regular-expression-matching/", description: "Dynamic programming with regex" },
      { title: "Trapping Rain Water", platform: "LeetCode", url: "https://leetcode.com/problems/trapping-rain-water/", description: "Stack-based array processing" }
    ]
  },
  java: {
    easy: [
      { title: "Hello World", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/hello-world-n-times/problem", description: "Print Hello World N times" },
      { title: "Data Types", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/java-datatypes/problem", description: "Java data type handling" },
      { title: "Loops I", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/java-loops-i/problem", description: "For loop basics" }
    ],
    medium: [
      { title: "String Introduction", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/java-strings-introduction/problem", description: "String operations" },
      { title: "ArrayList", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/java-arraylist/problem", description: "Dynamic arrays in Java" },
      { title: "Inheritance", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/java-inheritance/problem", description: "Object-oriented programming" }
    ],
    hard: [
      { title: "Reflection", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/java-reflection-attributes/problem", description: "Java reflection API" },
      { title: "BigInteger", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/java-big-integers/problem", description: "Work with large numbers" },
      { title: "Pattern Syntax Checker", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/pattern-syntax-checker/problem", description: "Regex pattern validation" }
    ]
  },
  "machine learning": {
    easy: [
      { title: "Iris Classification", platform: "Kaggle", url: "https://www.kaggle.com/datasets/uciml/iris", description: "Classic ML classification task" },
      { title: "Linear Regression Basics", platform: "Kaggle", url: "https://www.kaggle.com/code/rtatman/getting-started-with-nlp-for-absolute-beginners", description: "Understand regression" },
      { title: "Decision Trees", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/decision-tree/problem", description: "Decision tree algorithms" }
    ],
    medium: [
      { title: "Titanic Survival Prediction", platform: "Kaggle", url: "https://www.kaggle.com/c/titanic", description: "Binary classification with real data" },
      { title: "House Prices Prediction", platform: "Kaggle", url: "https://www.kaggle.com/c/house-prices-advanced-regression-techniques", description: "Regression with multiple features" },
      { title: "MNIST Digit Recognition", platform: "Kaggle", url: "https://www.kaggle.com/c/digit-recognizer", description: "Image classification" }
    ],
    hard: [
      { title: "Time Series Forecasting", platform: "Kaggle", url: "https://www.kaggle.com/c/m5-forecasting-accuracy", description: "Predict future values" },
      { title: "NLP Sentiment Analysis", platform: "Kaggle", url: "https://www.kaggle.com/c/sentiment-analysis-on-movie-reviews", description: "Text analysis and NLP" },
      { title: "Image Segmentation", platform: "Kaggle", url: "https://www.kaggle.com/c/carvana-image-masking-challenge", description: "Advanced computer vision" }
    ]
  },
  "data analysis": {
    easy: [
      { title: "Pandas Basics", platform: "Kaggle", url: "https://www.kaggle.com/learn/pandas", description: "Learn pandas for data manipulation" },
      { title: "CSV Data Exploration", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/np-mean-var-std/problem", description: "Basic data exploration" },
      { title: "Data Cleaning", platform: "Kaggle", url: "https://www.kaggle.com/learn/data-cleaning", description: "Handle missing and dirty data" }
    ],
    medium: [
      { title: "Data Aggregation", platform: "Kaggle", url: "https://www.kaggle.com/datasets?search=aggregation", description: "Group and aggregate data" },
      { title: "SQL Queries", platform: "HackerRank", url: "https://www.hackerrank.com/domains/sql/select", description: "Database querying" },
      { title: "Exploratory Data Analysis", platform: "Kaggle", url: "https://www.kaggle.com/learn/data-visualization", description: "Visualize and understand data" }
    ],
    hard: [
      { title: "Advanced SQL", platform: "HackerRank", url: "https://www.hackerrank.com/domains/sql/advanced-join", description: "Complex joins and queries" },
      { title: "Time Series Analysis", platform: "Kaggle", url: "https://www.kaggle.com/learn/time-series", description: "Analyze temporal data" },
      { title: "Statistical Analysis", platform: "Kaggle", url: "https://www.kaggle.com/learn/statistics", description: "Advanced statistical methods" }
    ]
  },
  react: {
    easy: [
      { title: "JSX Basics", platform: "Scrimba", url: "https://scrimba.com/learn/learnreact", description: "Learn JSX syntax" },
      { title: "Components", platform: "React Docs", url: "https://react.dev/learn/your-first-component", description: "Create React components" },
      { title: "Props", platform: "React Docs", url: "https://react.dev/learn/passing-props-to-a-component", description: "Pass data with props" }
    ],
    medium: [
      { title: "State and Events", platform: "React Docs", url: "https://react.dev/learn/state-a-components-memory", description: "Manage component state" },
      { title: "Forms", platform: "React Docs", url: "https://react.dev/learn/reacting-to-input-with-state", description: "Handle form inputs" },
      { title: "Hooks", platform: "React Docs", url: "https://react.dev/reference/react/hooks", description: "Use React Hooks" }
    ],
    hard: [
      { title: "Context API", platform: "React Docs", url: "https://react.dev/learn/passing-data-deeply-with-context", description: "Global state management" },
      { title: "Performance Optimization", platform: "React Docs", url: "https://react.dev/learn/render-and-commit", description: "Optimize render performance" },
      { title: "Advanced Patterns", platform: "Scrimba", url: "https://scrimba.com/learn/advancedreact", description: "Advanced React patterns" }
    ]
  },
  sql: {
    easy: [
      { title: "SELECT Statement", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/select-all/problem", description: "Basic SELECT queries" },
      { title: "WHERE Clause", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/select-by-id/problem", description: "Filter with WHERE" },
      { title: "ORDER BY", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/weather-observation-station-1/problem", description: "Sort results" }
    ],
    medium: [
      { title: "JOINS", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/african-cities/problem", description: "Combine tables" },
      { title: "GROUP BY", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/weather-observation-station-5/problem", description: "Aggregate data" },
      { title: "SUBQUERIES", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/the-report/problem", description: "Nested queries" }
    ],
    hard: [
      { title: "Window Functions", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/sql-window-functions/problem", description: "Advanced analytics" },
      { title: "Complex JOINs", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/placements/problem", description: "Multiple table joins" },
      { title: "Optimization", platform: "HackerRank", url: "https://www.hackerrank.com/challenges/occupations/problem", description: "Query optimization" }
    ]
  },
  aws: {
    easy: [
      { title: "EC2 Basics", platform: "AWS", url: "https://aws.amazon.com/ec2/", description: "Launch EC2 instances" },
      { title: "S3 Buckets", platform: "AWS", url: "https://aws.amazon.com/s3/", description: "Create and manage S3 buckets" },
      { title: "IAM Users", platform: "AWS", url: "https://aws.amazon.com/iam/", description: "Manage user access" }
    ],
    medium: [
      { title: "VPC Setup", platform: "AWS", url: "https://docs.aws.amazon.com/vpc/", description: "Configure Virtual Private Cloud" },
      { title: "RDS Database", platform: "AWS", url: "https://aws.amazon.com/rds/", description: "Managed database services" },
      { title: "Lambda Functions", platform: "AWS", url: "https://aws.amazon.com/lambda/", description: "Serverless computing" }
    ],
    hard: [
      { title: "CloudFormation", platform: "AWS", url: "https://aws.amazon.com/cloudformation/", description: "Infrastructure as code" },
      { title: "Auto Scaling", platform: "AWS", url: "https://docs.aws.amazon.com/autoscaling/", description: "Scale applications" },
      { title: "Security Best Practices", platform: "AWS", url: "https://aws.amazon.com/security/", description: "Secure AWS infrastructure" }
    ]
  },
  docker: {
    easy: [
      { title: "Docker Basics", platform: "Docker", url: "https://docs.docker.com/get-started/", description: "Learn Docker fundamentals" },
      { title: "Create Image", platform: "Docker", url: "https://docs.docker.com/engine/reference/builder/", description: "Write Dockerfile" },
      { title: "Run Container", platform: "Docker", url: "https://docs.docker.com/engine/reference/run/", description: "Run containers" }
    ],
    medium: [
      { title: "Docker Compose", platform: "Docker", url: "https://docs.docker.com/compose/", description: "Multi-container applications" },
      { title: "Volumes", platform: "Docker", url: "https://docs.docker.com/storage/volumes/", description: "Persistent storage" },
      { title: "Networking", platform: "Docker", url: "https://docs.docker.com/engine/network/", description: "Container networking" }
    ],
    hard: [
      { title: "Registry Setup", platform: "Docker", url: "https://docs.docker.com/registry/", description: "Docker image registry" },
      { title: "Production Deployment", platform: "Docker", url: "https://docs.docker.com/compose/production/", description: "Deploy to production" },
      { title: "Security Hardening", platform: "Docker", url: "https://docs.docker.com/engine/security/", description: "Secure Docker setup" }
    ]
  }
};

// Extend domain keywords for universal domain detection
const universalDomainKeywords = {
  'data science': ['data science', 'machine learning', 'ml', 'ai', 'deep learning', 'pandas', 'numpy', 'scikit', 'regression', 'classification'],
  'software development': ['software development', 'software engineer', 'coding', 'programming', 'oop', 'design patterns'],
  'full stack development': ['full stack', 'mern', 'mean', 'frontend', 'backend', 'api', 'database', 'server'],
  'frontend development': ['frontend', 'react', 'angular', 'vue', 'css', 'html', 'javascript', 'ui'],
  'backend development': ['backend', 'node', 'express', 'django', 'flask', 'api', 'microservices'],
  'mobile development': ['android', 'ios', 'flutter', 'react native', 'mobile app'],
  'cloud devops': ['devops', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ci/cd', 'cloud'],
  'cybersecurity': ['cybersecurity', 'security', 'penetration', 'vulnerability', 'nmap', 'wireshark', 'ethical hacking'],
  'blockchain': ['blockchain', 'smart contract', 'solidity', 'web3', 'nft', 'ethereum'],
  'ui ux design': ['ui/ux', 'user experience', 'wireframe', 'prototype', 'figma', 'adobe xd'],
  'software testing': ['software testing', 'qa', 'test automation', 'selenium', 'cypress', 'test cases'],
  'digital marketing': ['digital marketing', 'seo', 'sem', 'google ads', 'social media', 'content marketing'],
  'business analyst': ['business analyst', 'requirements gathering', 'process improvement', 'stakeholder', 'analysis'],
  'hr': ['human resources', 'recruitment', 'onboarding', 'payroll', 'employee engagement'],
  'finance': ['finance', 'financial analysis', 'accounting', 'budget', 'auditing', 'tax', 'tally'],
  'operations': ['operations', 'supply chain', 'process optimization', 'logistics'],
  'general management': ['management', 'leadership', 'strategic planning', 'decision making'],
  'mba': ['mba', 'management', 'business strategy'],
  'bba': ['bba', 'business administration'],
  'bcom': ['bcom', 'commerce', 'accounting', 'finance'],
  'bsc physics': ['physics', 'quantum', 'thermodynamics', 'mechanics'],
  'bsc chemistry': ['chemistry', 'organic', 'inorganic', 'analytical', 'polymer', 'synthesis'],
  'bsc maths': ['mathematics', 'algebra', 'calculus', 'statistics', 'number theory'],
  'biotechnology': ['biotech', 'dna', 'cell culture', 'genetics', 'bioinformatics'],
  'psychology': ['psychology', 'behavior', 'cognition', 'mental health', 'counseling'],
  'political science': ['political science', 'policy', 'government', 'international relations'],
  'english literature': ['literature', 'poetry', 'novel', 'prose', 'critical analysis'],
  'mechanical engineering': ['mechanical', 'solidworks', 'cad', 'thermodynamics', 'manufacturing', 'machine design'],
  'electrical engineering': ['electrical', 'circuit', 'power systems', 'control systems', 'embedded'],
  'civil engineering': ['civil', 'autocad', 'structural', 'construction', 'surveying', 'boq'],
  'ece': ['electronics', 'communication', 'embedded', 'vlsi', 'signal processing'],
  'chemical engineering': ['chemical engineering', 'process design', 'reaction', 'distillation', 'thermodynamics'],
  'aeronautical engineering': ['aeronautical', 'aerospace', 'flight', 'aero', 'propulsion', 'aircraft'],
  'agriculture': ['agriculture', 'crop', 'soil', 'irrigation', 'agronomy'],
  'hotel management': ['hotel management', 'hospitality', 'food service', 'housekeeping', 'front office'],
  'pharmacy': ['pharmacy', 'drug', 'pharmacology', 'dispensing', 'pharmaceutical'],
  'nursing': ['nursing', 'patient care', 'clinical', 'medical records'],
  'fashion design': ['fashion design', 'garment', 'textile', 'pattern', 'fashion portfolio'],
  'interior design': ['interior design', 'space planning', '3d model', 'cad', 'furnishing'],
  'graphic design': ['graphic design', 'branding', 'logo', 'adobe photoshop', 'illustrator'],
  'general degree': []
};

// Universal domain list constant for validation
const UNIVERSAL_DOMAINS = Object.keys(universalDomainKeywords);


// Mega prompt template for universal analysis
const MEGA_PROMPT_TEMPLATE = `You are an expert Universal Career AI Model designed to analyze ANY resume for ANY degree or field.
You must detect the correct domain, extract skills, compare with the job description, and generate PERFECT
domain-specific learning plans, project ideas, and problems.

Return ONLY valid JSON using the EXACT schema provided.

==========================
RESUME:
{{resumeText}}

==========================
JOB DESCRIPTION:
{{jdText}}
==========================

Return ONLY this JSON (NO MARKDOWN, NO TEXT OUTSIDE JSON):

{
  "domain": "",
  "jdSkills": [],
  "resumeSkills": [],
  "matchedSkills": [],
  "missingSkills": [],
  "extraSkills": [],
  "score": 0,

  "learningPlan": [
    {
      "skill": "",
      "videoSearchQueries": {
        "english": "",
        "hindi": "",
        "telugu": "",
        "tamil": "",
        "kannada": ""
      },
      "miniProjects": [],
      "problems": {
        "easy": [],
        "medium": [],
        "hard": []
      }
    }
  ]
}

==========================
DOMAIN DETECTION (IMPORTANT)
==========================

Detect domain strictly from resume + JD.
Choose ONE domain only:

"data science", 
"software development", 
"full stack development",
"frontend development",
"backend development",
"mobile development",
"cloud devops",
"cybersecurity",
"blockchain",
"ui ux design",
"software testing",
"digital marketing",
"business analyst",
"hr",
"finance",
"operations",
"general management",
"mba",
"bba",
"bcom",
"bsc physics",
"bsc chemistry",
"bsc maths",
"biotechnology",
"psychology",
"political science",
"english literature",
"mechanical engineering",
"electrical engineering",
"civil engineering",
"ece",
"chemical engineering",
"aeronautical engineering",
"agriculture",
"hotel management",
"pharmacy",
"nursing",
"fashion design",
"interior design",
"graphic design",
"general degree"

If no clear domain → "general degree".

==========================
SKILL EXTRACTION LOGIC
==========================

Extract ONLY real skills found in text. DO NOT GUESS.

==========================
SCORE LOGIC
==========================

score = (matchedSkills.length / jdSkills.length) * 100  
Round to nearest whole number.

==========================
LEARNING PLAN GENERATION
==========================

For EACH missing skill:
- create 1 learningPlan object
- must contain:
  • 5 YouTube search queries  
  • EXACTLY 3 mini projects  
  • Problems: 2 easy, 2 medium, 1 hard

==========================
YOUTUBE SEARCH QUERY RULES
==========================
For each missing skill:
english: "<skill> full course for beginners"
hindi: "<skill> tutorial in hindi"
telugu: "<skill> telugu course"
tamil: "<skill> tamil full course"
kannada: "<skill> kannada tutorial"

==========================
GENERATE FINAL OUTPUT NOW AS JSON ONLY
==========================`;

// === SAFE JSON PARSING FROM LLM ===
/**
 * Safely parse JSON from LLM response which may contain markdown or extra text
 * Attempts multiple strategies to extract valid JSON
 */
function safeParseLLMJson(content) {
  try {
    let txt = content.trim();

    // Remove markdown fences if present
    txt = txt.replace(/```json/gi, '').replace(/```/g, '').trim();

    // If there is extra text around JSON, try to extract from first { to last }
    const firstBrace = txt.indexOf('{');
    const lastBrace = txt.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      txt = txt.slice(firstBrace, lastBrace + 1);
    }

    return JSON.parse(txt);
  } catch (err) {
    console.error('❌ safeParseLLMJson failed:', err.message);
    console.error('   Raw content preview:', content.substring(0, 400) + (content.length > 400 ? '...' : ''));

    // Try secondary parsing strategy: fix common JSON errors
    try {
      console.log('ℹ️ Attempting secondary JSON repair...');
      let txt = content.trim();

      // Remove markdown
      txt = txt.replace(/```json/gi, '').replace(/```/g, '').trim();

      // Extract from braces
      const firstBrace = txt.indexOf('{');
      const lastBrace = txt.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        txt = txt.slice(firstBrace, lastBrace + 1);
      }

      // Fix common JSON issues:
      // 1. Remove trailing commas
      txt = txt.replace(/,(\s*[}\]])/g, '$1');

      // 2. Fix single quotes to double quotes (for simple cases)
      txt = txt.replace(/'([^']*)':/g, '"$1":');

      // 3. Remove line breaks inside values
      txt = txt.replace(/:\s*"([^"]*)\n([^"]*)"/, (match, p1, p2) => {
        return ': "' + p1 + ' ' + p2 + '"';
      });

      const result = JSON.parse(txt);
      console.log('✅ Secondary parsing succeeded');
      return result;
    } catch (repairErr) {
      console.error('❌ Secondary repair also failed:', repairErr.message);
      throw repairErr;
    }
  }
}

/**
 * Generate mini projects for a skill using LLM
 * Returns a simple array of 3 project strings
 */
async function generateMiniProjects(skill, domain = 'it') {
  if (!OPENROUTER_API_KEY) {
    console.warn(`⚠️ Cannot generate mini projects for ${skill} - OpenRouter not configured`);
    return [];
  }

  try {
    console.log(`🚀 Generating mini projects for: ${skill}`);

    const prompt = `You are a project design expert. For the skill "${skill}" in the ${domain} domain, suggest 3 mini project ideas.

Return ONLY a JSON array of 3 strings. No explanations, no extra text.

Example format:
["Project 1: Brief description", "Project 2: Brief description", "Project 3: Brief description"]

Now generate 3 mini projects for ${skill}:`;

    const { data } = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'mistralai/mistral-7b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 500
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const content = data.choices[0]?.message?.content?.trim() || '';
    if (!content) {
      throw new Error('Empty response from LLM');
    }

    // Try to parse as JSON array
    let projects = [];
    try {
      let txt = content.trim();
      txt = txt.replace(/```json/gi, '').replace(/```/g, '').trim();

      // Extract array if wrapped in extra text
      const firstBracket = txt.indexOf('[');
      const lastBracket = txt.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        txt = txt.slice(firstBracket, lastBracket + 1);
      }

      projects = JSON.parse(txt);
      if (!Array.isArray(projects)) {
        projects = [];
      }
      projects = projects.slice(0, 3); // Ensure max 3 projects
      console.log(`✅ Generated ${projects.length} mini projects for ${skill}`);
    } catch (parseErr) {
      console.warn(`⚠️ Failed to parse mini projects JSON for ${skill}, using fallback`);
      projects = [];
    }

    return projects;
  } catch (err) {
    console.error(`❌ Error generating mini projects for ${skill}:`, err.message);
    return [];
  }
}

/**
 * Generate mini-projects from a curated list (no API needed)
 * Used as fallback when OpenRouter is not configured
 */
function getFallbackMiniProjects(skill, domain = 'it') {
  const skillLower = skill.toLowerCase();

  const fallbackProjects = {
    // Programming Languages
    python: [
      'Build a web scraper to extract data from e-commerce websites',
      'Create a personal expense tracker with data visualization',
      'Develop a command-line password manager with encryption'
    ],
    javascript: [
      'Build a real-time weather dashboard using OpenWeather API',
      'Create an interactive quiz application with score tracking',
      'Develop a task management app with local storage'
    ],
    java: [
      'Build a banking system with account management features',
      'Create a student management system with database',
      'Develop an inventory tracking application for retail'
    ],
    'c++': [
      'Build a file compression utility using Huffman coding',
      'Create a student grade management system',
      'Develop a simple game engine with graphics'
    ],
    'c#': [
      'Build a desktop inventory management application',
      'Create a simple CRM system with database integration',
      'Develop a file organizer tool for Windows'
    ],

    // Web Development
    react: [
      'Build a social media dashboard with real-time updates',
      'Create an e-commerce product catalog with cart functionality',
      'Develop a personal blog platform with markdown support'
    ],
    angular: [
      'Build a task management application with drag-and-drop',
      'Create a recipe finder app with API integration',
      'Develop a fitness tracker with charts and analytics'
    ],
    vue: [
      'Build a kanban board for project management',
      'Create a movie search app with TMDB API',
      'Develop a personal finance dashboard'
    ],
    'node': [
      'Build a RESTful API for a blog platform',
      'Create a real-time chat application with socket.io',
      'Develop a file upload service with cloud storage'
    ],
    express: [
      'Build an authentication system with JWT',
      'Create a URL shortener service',
      'Develop a RESTful API for task management'
    ],
    django: [
      'Build a blog platform with user authentication',
      'Create an online polling system',
      'Develop a job board with search functionality'
    ],
    flask: [
      'Build a URL shortening service with analytics',
      'Create a REST API for todo management',
      'Develop a simple CMS for blogs'
    ],

    // Data Science & Machine Learning
    'machine learning': [
      'Build a customer churn prediction model',
      'Create a sentiment analysis system for product reviews',
      'Develop a recommendation engine for movies'
    ],
    'deep learning': [
      'Build an image classification model for medical diagnosis',
      'Create a text generation system using RNN',
      'Develop a facial recognition system'
    ],
    'data analysis': [
      'Analyze sales data and create interactive dashboards',
      'Build a customer segmentation analysis tool',
      'Create an automated reporting system for business metrics'
    ],
    'data science': [
      'Build a predictive model for house prices',
      'Create a customer lifetime value calculator',
      'Develop a fraud detection system'
    ],
    pandas: [
      'Build a data cleaning and transformation pipeline',
      'Create an automated report generator from CSV files',
      'Develop a data analysis dashboard for sales data'
    ],
    numpy: [
      'Build a statistical analysis toolkit',
      'Create a matrix operations library',
      'Develop a numerical computing application'
    ],
    tensorflow: [
      'Build an image classifier for plant diseases',
      'Create a stock price prediction model',
      'Develop a chatbot using neural networks'
    ],
    pytorch: [
      'Build a custom object detection model',
      'Create a neural style transfer application',
      'Develop a text classification system'
    ],

    // Databases
    sql: [
      'Design a complete database schema for an e-commerce platform',
      'Create complex analytical queries for business intelligence',
      'Build a database optimization and indexing project'
    ],
    mysql: [
      'Build a normalized database for a library management system',
      'Create stored procedures for automated data processing',
      'Develop a backup and recovery system'
    ],
    postgresql: [
      'Build a multi-tenant database architecture',
      'Create advanced queries with window functions',
      'Develop a data warehousing solution'
    ],
    mongodb: [
      'Build a document-based content management system',
      'Create a real-time analytics dashboard',
      'Develop a scalable logging system'
    ],

    // Cloud & DevOps
    aws: [
      'Deploy a scalable web application on EC2 with load balancing',
      'Build a serverless API using Lambda and API Gateway',
      'Create an automated backup system using S3 and Lambda'
    ],
    azure: [
      'Build a cloud-based web application with Azure App Service',
      'Create a serverless function for data processing',
      'Develop a CI/CD pipeline with Azure DevOps'
    ],
    docker: [
      'Containerize a full-stack application with Docker Compose',
      'Build a microservices architecture with Docker',
      'Create a Docker-based development environment'
    ],
    kubernetes: [
      'Deploy a microservices application on Kubernetes cluster',
      'Build an auto-scaling web service',
      'Create a monitoring and logging system for containers'
    ],
    terraform: [
      'Build infrastructure as code for a multi-tier application',
      'Create reusable modules for cloud resources',
      'Develop an automated deployment pipeline'
    ],

    // Mobile Development
    'react native': [
      'Build a cross-platform fitness tracking app',
      'Create a recipe finder mobile application',
      'Develop a personal budget manager'
    ],
    flutter: [
      'Build a todo app with local database',
      'Create a weather application with beautiful UI',
      'Develop a note-taking app with cloud sync'
    ],
    android: [
      'Build a location-based reminder app',
      'Create a habit tracking application',
      'Develop a news aggregator app'
    ],
    ios: [
      'Build a personal journal app with iCloud sync',
      'Create a calorie counter application',
      'Develop a meditation and mindfulness app'
    ],

    // Testing
    selenium: [
      'Build an automated testing suite for e-commerce website',
      'Create end-to-end test scenarios for login flows',
      'Develop a web scraping tool with automated testing'
    ],
    jest: [
      'Build a comprehensive unit test suite for React components',
      'Create integration tests for API endpoints',
      'Develop a test coverage reporting system'
    ],
    pytest: [
      'Build automated tests for Python web application',
      'Create API testing framework',
      'Develop a test data generation tool'
    ],

    // Others
    git: [
      'Set up a git workflow for team collaboration',
      'Create automated git hooks for code quality',
      'Build a branching strategy for production releases'
    ],
    'rest api': [
      'Build a comprehensive REST API for a booking system',
      'Create API documentation with Swagger',
      'Develop rate limiting and authentication system'
    ],
    graphql: [
      'Build a GraphQL API for a social media platform',
      'Create a real-time subscription system',
      'Develop a GraphQL federation architecture'
    ]
  };

  // Return projects for the skill, or intelligent generic fallback
  if (fallbackProjects[skillLower]) {
    console.log(`✅ Using curated fallback projects for ${skill}`);
    return fallbackProjects[skillLower];
  }

  // Check for partial skill matches (e.g., "machine learning" contains "learning")
  for (const [key, projects] of Object.entries(fallbackProjects)) {
    if (skillLower.includes(key) || key.includes(skillLower)) {
      console.log(`✅ Using partial match fallback projects for ${skill} (matched: ${key})`);
      return projects;
    }
  }

  // Domain-specific generic fallback
  const domainSpecificProjects = {
    'data science': [
      `Build a ${skill} data analysis project with visualizations`,
      `Create a predictive model using ${skill}`,
      `Develop a data processing pipeline with ${skill}`
    ],
    'web development': [
      `Build a web application using ${skill}`,
      `Create a REST API with ${skill}`,
      `Develop a full-stack project with ${skill}`
    ],
    'mobile development': [
      `Build a mobile app using ${skill}`,
      `Create a cross-platform application with ${skill}`,
      `Develop a feature-rich mobile app with ${skill}`
    ],
    'devops': [
      `Build an automation tool using ${skill}`,
      `Create a CI/CD pipeline with ${skill}`,
      `Develop infrastructure as code using ${skill}`
    ]
  };

  // Try domain-specific fallback
  const domainLower = domain.toLowerCase();
  for (const [domainKey, projects] of Object.entries(domainSpecificProjects)) {
    if (domainLower.includes(domainKey) || domainKey.includes(domainLower)) {
      console.log(`✅ Using domain-specific fallback projects for ${skill}`);
      return projects;
    }
  }

  // Final generic fallback
  console.log(`✅ Using generic fallback projects for ${skill}`);
  return [
    `Build a beginner-friendly ${skill} project with basic features`,
    `Create an intermediate ${skill} application with real-world use case`,
    `Develop an advanced ${skill} system with scalability and best practices`
  ];
}

/**
 * Extract text from PDF file (Render-safe: no OCR). Returns empty string if parse fails.
 */
async function extractPdf(path) {
  try {
    const data = await fs.promises.readFile(path);
    const pdf = await pdfParse(data);
    let text = pdf.text || '';
    text = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
    return text;
  } catch (err) {
    console.error('PDF parse error:', err.message);
    return '';
  }
}

/**
 * Detect domain (IT, HR, Finance, etc) from text
 */
function detectDomain(txt) {
  const low = (txt || '').toLowerCase();
  // First try universal domain keywords
  for (const [domain, keywords] of Object.entries(universalDomainKeywords)) {
    if (keywords.length && keywords.some(kw => low.includes(kw))) {
      console.log(`🎯 Detected universal domain: ${domain}`);
      return domain;
    }
  }

  console.log('🎯 Detected domain: general degree (fallback)');
  return 'general degree';
}

/**
 * Extract skills from text using skill bank
 */
function extractSkillsFromText(text, skillBank) {
  // Robust skill extraction with safe regex escaping
  if (!text || !Array.isArray(skillBank) || skillBank.length === 0) return [];
  const low = text.toLowerCase();
  const found = [];

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape all special chars
  }

  for (const skill of skillBank) {
    const raw = String(skill || '').trim();
    if (!raw) continue;
    const escaped = escapeRegex(raw.toLowerCase());

    // Default pattern with word boundaries
    let pattern = `\\b${escaped}\\b`;

    // If skill starts or ends with a non-word character (e.g., C++, C#, R Programming has space handled ok)
    // adjust boundaries using lookarounds to avoid failing matches.
    const startsNonWord = /^[^A-Za-z0-9]/.test(raw);
    const endsNonWord = /[^A-Za-z0-9]$/.test(raw);
    if (startsNonWord) pattern = `${escaped}\\b`; // starting boundary less strict
    if (endsNonWord) pattern = pattern.replace(/\\b$/, ''); // remove trailing \b if last char is non-word

    try {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(low)) {
        found.push(raw);
      }
    } catch (err) {
      console.warn(`⚠️ Regex build failed for skill "${raw}" pattern="${pattern}" -> ${err.message}`);
      continue; // skip invalid pattern without crashing
    }
  }
  return [...new Set(found)];
}

/**
 * Analyze resume vs JD using OpenRouter LLM
 * Optionally enhance rule-based analysis with AI insights
 * Returns null if LLM is not configured or fails
 */
async function analyzeWithLLM(jdText, resumeText) {
  // FORCE FAST MODE: Skip LLM to ensure speed and perfect projects from our curated list
  console.log('⚡ FAST MODE: Using enhanced rule-based engine for instant results');
  return null;

  /* LLM Temporarily Disabled for Speed Optimization
  if (!OPENROUTER_API_KEY) {
    console.log('ℹ️ OpenRouter API key not configured, skipping LLM enhancement');
    return null;
  }
  */
  try {
    console.log('🤖 Calling OpenRouter LLM with UNIVERSAL MEGA PROMPT...');
    const prompt = MEGA_PROMPT_TEMPLATE
      .replace('{{resumeText}}', resumeText || '')
      .replace('{{jdText}}', jdText || '');

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'mistralai/mistral-7b-instruct', // Faster model than auto
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1000 // Reduced tokens for speed
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:5001',
          'X-Title': 'Hiero Universal Analyzer'
        },
        timeout: 25000 // Strict 25s timeout to ensure <30s total
      }
    );

    const content = response.data?.choices?.[0]?.message?.content || '';
    if (!content) throw new Error('Empty LLM response');
    console.log('✅ LLM response received, parsing...');

    const json = safeParseLLMJson(content);

    // Basic schema validation & normalization
    if (json && typeof json === 'object') {
      json.domain = (json.domain || '').toLowerCase();
      if (!UNIVERSAL_DOMAINS.includes(json.domain)) {
        console.warn(`⚠️ Unknown domain from LLM: ${json.domain}, falling back to detectDomain()`);
        json.domain = detectDomain(jdText + ' ' + resumeText);
      }
      json.jdSkills = Array.isArray(json.jdSkills) ? json.jdSkills : [];
      json.resumeSkills = Array.isArray(json.resumeSkills) ? json.resumeSkills : [];
      json.matchedSkills = Array.isArray(json.matchedSkills) ? json.matchedSkills : [];
      json.missingSkills = Array.isArray(json.missingSkills) ? json.missingSkills : [];
      json.extraSkills = Array.isArray(json.extraSkills) ? json.extraSkills : [];
      json.score = typeof json.score === 'number' ? Math.min(100, Math.max(0, Math.round(json.score))) : 0;
      json.learningPlan = Array.isArray(json.learningPlan) ? json.learningPlan : [];
      // Ensure learning plan items have required sub-structure
      json.learningPlan = json.learningPlan.map(item => ({
        skill: item.skill || '',
        videoSearchQueries: item.videoSearchQueries || {
          english: '', hindi: '', telugu: '', tamil: '', kannada: ''
        },
        miniProjects: Array.isArray(item.miniProjects) ? item.miniProjects.slice(0, 3) : [],
        problems: item.problems && typeof item.problems === 'object' ? {
          easy: Array.isArray(item.problems.easy) ? item.problems.easy.slice(0, 2) : [],
          medium: Array.isArray(item.problems.medium) ? item.problems.medium.slice(0, 2) : [],
          hard: Array.isArray(item.problems.hard) ? item.problems.hard.slice(0, 1) : []
        } : { easy: [], medium: [], hard: [] }
      }));
    }

    console.log('✅ Universal JSON parsed & normalized');
    return json;
  } catch (err) {
    console.error('❌ Universal LLM analysis failed:', err.message);
    return null;
  }
}

/**
 * Get real YouTube videos for a skill + language using the LLM's search query
 */
async function getVideosForSkillAndLanguage(skill, language, searchQuery) {
  if (!YOUTUBE_API_KEY) {
    console.warn(`⚠️ YouTube API key missing, skipping videos for ${skill} in ${language}`);
    return [];
  }

  try {
    console.log(`📺 Fetching videos: ${skill} (${language}) - query: "${searchQuery}"`);
    const { data } = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          part: 'snippet',
          q: searchQuery,
          type: 'video',
          maxResults: 5,
          key: YOUTUBE_API_KEY,
          relevanceLanguage: language === 'english' ? 'en' : language.substring(0, 2)
        },
        timeout: 10000
      }
    );

    const videos = (data.items || []).slice(0, 3).map(item => ({
      title: item.snippet.title,
      videoId: item.id.videoId,
      thumbnail: item.snippet.thumbnails?.high?.url || '',
      url: `https://www.youtube.com/embed/${item.id.videoId}`,
      watchUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      duration: '~10 min'
    }));

    console.log(`✅ Retrieved ${videos.length} videos for ${skill} (${language})`);
    return videos;
  } catch (err) {
    console.error(`❌ YouTube API error for ${skill} (${language}):`, err.message);
    return [];
  }
}

/**
 * Get curated practice problems for a skill from our mapping
 * Falls back to LLM problem descriptions if not in mapping
 */
function getProblemsForSkill(skill, llmProblems = {}) {
  const skillKey = skill.toLowerCase();

  // Try to find in our curated mapping first
  if (practiceProblems[skillKey]) {
    console.log(`✅ Found curated problems for ${skill}`);
    return practiceProblems[skillKey];
  }

  // Fall back to LLM-generated problem descriptions
  if (llmProblems && (llmProblems.easy || llmProblems.medium || llmProblems.hard)) {
    console.log(`✅ Using LLM-generated problems for ${skill}`);
    return {
      easy: (llmProblems.easy || []).map((title, idx) => ({
        title,
        platform: 'Custom',
        url: null,
        description: title
      })),
      medium: (llmProblems.medium || []).map((title, idx) => ({
        title,
        platform: 'Custom',
        url: null,
        description: title
      })),
      hard: (llmProblems.hard || []).map((title, idx) => ({
        title,
        platform: 'Custom',
        url: null,
        description: title
      }))
    };
  }

  // If neither exists, return empty structure
  console.warn(`⚠️ No problems found for ${skill}, returning empty structure`);
  return {
    easy: [],
    medium: [],
    hard: []
  };
}

/**
 * Build complete learning plan for a single missing skill
 * Uses LLM's mini projects and search queries, real YouTube API, curated problem links
 */
async function buildLearningPlanForSkill(skill, domain, llmPlanItem) {
  try {
    console.log(`🎯 Building learning plan for: ${skill}`);

    // Get videos for each language using LLM's search queries
    const videosByLang = {};
    const languages = ['telugu', 'hindi', 'tamil', 'english', 'kannada'];

    if (llmPlanItem && llmPlanItem.videoSearchQueries) {
      for (const lang of languages) {
        const searchQuery = llmPlanItem.videoSearchQueries[lang] || `${skill} tutorial ${lang}`;
        videosByLang[lang] = await getVideosForSkillAndLanguage(skill, lang, searchQuery);
      }
    } else {
      // Fallback: generate generic search query if LLM didn't provide
      for (const lang of languages) {
        const searchQuery = `${skill} tutorial ${lang} for beginners`;
        videosByLang[lang] = await getVideosForSkillAndLanguage(skill, lang, searchQuery);
      }
    }

    // Get curated or LLM-generated problems
    const problems = getProblemsForSkill(skill, llmPlanItem?.problems);

    // Get mini projects - use LLM result if available, otherwise generate or use fallback
    let miniProjects = llmPlanItem?.miniProjects || [];
    if (!miniProjects || miniProjects.length === 0) {
      console.log(`   No mini projects from LLM, generating for ${skill}...`);
      if (OPENROUTER_API_KEY) {
        // Try LLM generation if API key available
        miniProjects = await generateMiniProjects(skill, domain);
      }

      // If still empty, use fallback curated projects
      if (!miniProjects || miniProjects.length === 0) {
        console.log(`   Using fallback projects for ${skill}...`);
        miniProjects = getFallbackMiniProjects(skill, domain);
      }
    } else {
      console.log(`   Using LLM mini projects: ${miniProjects.length} projects`);
    }

    const learningItem = {
      skill,
      miniProjects,
      videos: videosByLang,
      problems,
      llmProblems: llmPlanItem?.problems || {}
    };

    console.log(`✅ Learning plan built for ${skill}: ${videosByLang.telugu.length} Telugu videos, ${miniProjects.length} projects, ${problems.easy.length} easy problems`);
    return learningItem;
  } catch (err) {
    console.error(`❌ Error building plan for ${skill}:`, err.message);
    return {
      skill,
      miniProjects: [],
      videos: { telugu: [], hindi: [], tamil: [], english: [], kannada: [] },
      problems: { easy: [], medium: [], hard: [] },
      error: err.message
    };
  }
}

// === ENDPOINTS ===

// HEALTH CHECK (REQUIRED)
app.get('/api/analysis/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

// Additional universal health endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', message: 'PONG' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is healthy!' });
});

// ANALYZE (LLM-powered version)
app.post('/api/analyze', upload.fields([{ name: 'jd' }, { name: 'resume' }]), async (req, res) => {
  console.log('📥 /api/analyze request received');
  console.log('   Files:', req.files ? Object.keys(req.files) : 'none');
  console.log('   Body keys:', req.body ? Object.keys(req.body) : 'none');

  try {
    let jd = req.body.jdText?.trim();
    let cv = req.body.resumeText?.trim();

    if (req.files?.jd?.[0]?.path) {
      console.log('📄 Extracting JD from file:', req.files.jd[0].path);
      jd = await extractPdf(req.files.jd[0].path);
      console.log('✅ JD extracted, length:', jd?.length);
    }
    if (req.files?.resume?.[0]?.path) {
      console.log('📄 Extracting Resume from file:', req.files.resume[0].path);
      cv = await extractPdf(req.files.resume[0].path);
      console.log('✅ Resume extracted, length:', cv?.length);
    }

    if (!jd || !cv) {
      console.error('❌ Missing JD or Resume');
      return res.status(400).json({ error: 'JD & Resume required' });
    }

    // === NEW VALIDATION LAYER ===
    const jdTextLower = jd.toLowerCase();
    const resumeTextLower = cv.toLowerCase();

    // Validate JD contains required structural keywords
    const jdKeywords = ["job description", "roles", "responsibilities", "requirements", "jd", "position", "candidate", "skills", "experience"];
    const jdHasKeyword = jdKeywords.some(kw => jdTextLower.includes(kw));

    if (!jdHasKeyword) {
      console.warn('⚠️ JD validation failed: missing structural keywords');
      return res.status(422).json({
        success: false,
        type: 'invalid_jd',
        message: 'Please upload a valid Job Description PDF that contains sections like Roles, Responsibilities, or Requirements.',
        detectedLength: jd.length
      });
    }

    // Validate resume has minimum length and typical resume indicators
    const resumeIndicators = ["education", "experience", "skills", "projects", "objective", "summary", "certification", "bachelor", "internship"];
    const resumeHasIndicator = resumeIndicators.some(ind => resumeTextLower.includes(ind));

    if (cv.length < 80 || !resumeHasIndicator) {
      console.warn('⚠️ Resume validation failed: too short or missing indicators');
      return res.status(422).json({
        success: false,
        type: 'invalid_resume',
        message: 'Please upload a valid Resume PDF containing sections like Education, Experience, Skills, or Projects.',
        detectedLength: cv.length
      });
    }

    console.log('✅ Validation passed: JD & Resume appear structurally valid');

    // === STEP 1: COMPUTE RULE-BASED ANALYSIS FIRST ===
    console.log('\n📋 === COMPUTING RULE-BASED ANALYSIS ===');
    const dom = detectDomain(jd + ' ' + cv);
    const bank = skillBanks[dom] || skillBanks.it;

    const jdSkillsRaw = extractSkillsFromText(jd, bank);
    const cvSkillsRaw = extractSkillsFromText(cv, bank);

    const uniqueJdSkills = [...new Set(jdSkillsRaw)];
    const uniqueCvSkills = [...new Set(cvSkillsRaw)];
    const ruleBasedMatched = uniqueJdSkills.filter(s => uniqueCvSkills.includes(s));
    const ruleBasedMissing = uniqueJdSkills.filter(s => !uniqueCvSkills.includes(s));
    const ruleBasedExtra = uniqueCvSkills.filter(s => !uniqueJdSkills.includes(s));

    let ruleBasedScore = 0;
    if (uniqueJdSkills.length > 0) {
      ruleBasedScore = Math.round((ruleBasedMatched.length / uniqueJdSkills.length) * 100);
      if (ruleBasedScore < 0) ruleBasedScore = 0;
      if (ruleBasedScore > 100) ruleBasedScore = 100;
    }

    console.log('✅ Rule-based analysis complete');
    console.log('   Domain:', dom);
    console.log('   JD Skills:', uniqueJdSkills.length, uniqueJdSkills);
    console.log('   CV Skills:', uniqueCvSkills.length, uniqueCvSkills);
    console.log('   Matched:', ruleBasedMatched.length, ruleBasedMatched);
    console.log('   Missing:', ruleBasedMissing.length, ruleBasedMissing);
    console.log('   Score:', ruleBasedScore + '%');

    // === STEP 2: Try LLM enhancement (optional) ===
    let finalDomain = dom;
    let finalJdSkills = uniqueJdSkills;
    let finalResumeSkills = uniqueCvSkills;
    let finalMatched = ruleBasedMatched;
    let finalMissing = ruleBasedMissing;
    let finalExtra = ruleBasedExtra;
    let finalScore = ruleBasedScore;
    let llmLearningPlan = [];

    if (OPENROUTER_API_KEY) {
      console.log('\n🤖 === USING LLM-POWERED ENHANCEMENT ===');
      try {
        const llmAnalysis = await analyzeWithLLM(jd, cv);
        console.log('✅ LLM analysis complete');
        console.log('   Domain:', llmAnalysis.domain);
        console.log('   JD Skills:', llmAnalysis.jdSkills?.length || 0, llmAnalysis.jdSkills);
        console.log('   Resume Skills:', llmAnalysis.resumeSkills?.length || 0, llmAnalysis.resumeSkills);
        console.log('   Matched:', llmAnalysis.matchedSkills?.length || 0, llmAnalysis.matchedSkills);
        console.log('   Missing:', llmAnalysis.missingSkills?.length || 0, llmAnalysis.missingSkills);
        console.log('   Score:', llmAnalysis.score);

        // Override with LLM results only if they are valid
        if (llmAnalysis.domain && typeof llmAnalysis.domain === 'string') {
          finalDomain = llmAnalysis.domain;
        }
        if (Array.isArray(llmAnalysis.jdSkills) && llmAnalysis.jdSkills.length > 0) {
          finalJdSkills = llmAnalysis.jdSkills;
        }
        if (Array.isArray(llmAnalysis.resumeSkills) && llmAnalysis.resumeSkills.length > 0) {
          finalResumeSkills = llmAnalysis.resumeSkills;
        }
        if (Array.isArray(llmAnalysis.matchedSkills) && llmAnalysis.matchedSkills.length >= 0) {
          finalMatched = llmAnalysis.matchedSkills;
        }
        if (Array.isArray(llmAnalysis.missingSkills) && llmAnalysis.missingSkills.length >= 0) {
          finalMissing = llmAnalysis.missingSkills;
        }
        if (typeof llmAnalysis.score === 'number' && llmAnalysis.score >= 0 && llmAnalysis.score <= 100) {
          finalScore = llmAnalysis.score;
        }

        // Store LLM learning plan for later use
        if (Array.isArray(llmAnalysis.learningPlan)) {
          llmLearningPlan = llmAnalysis.learningPlan;
        }

        console.log('✅ LLM values accepted and merged');
      } catch (llmErr) {
        console.error('❌ LLM enhancement failed:', llmErr.message);
        console.log('ℹ️ Continuing with rule-based analysis only');
        // Keep the rule-based values
      }
    } else {
      console.log('⚠️ OpenRouter not configured, skipping LLM enhancement');
    }

    console.log('\n🧠 DEBUG final skills:', {
      domain: finalDomain,
      jdSkillsCount: finalJdSkills.length,
      resumeSkillsCount: finalResumeSkills.length,
      matchedCount: finalMatched.length,
      missingCount: finalMissing.length,
      extraCount: finalExtra.length,
      score: finalScore
    });

    // === STEP 3: Build real-world learning plan using LLM's mini projects + YouTube + problem links ===
    console.log('\n📚 === BUILDING LEARNING PLAN ===');
    let learningPlan = [];

    // Determine which skills to build learning plans for
    let skillsForLearningPlan = finalMissing;

    // If no missing skills but we have resume skills, use top resume skills for learning content
    if (finalMissing.length === 0 && finalResumeSkills.length > 0) {
      console.log('✅ No missing skills detected');
      console.log('📚 Building learning plans for top resume skills for practice & mastery...');
      skillsForLearningPlan = finalResumeSkills.slice(0, 3); // Top 3 resume skills
    }

    // ALWAYS build learning plans if we have skills to learn (don't require OPENROUTER_API_KEY)
    if (skillsForLearningPlan.length > 0) {
      try {
        console.log(`📚 === BUILDING LEARNING PLAN ===`);
        console.log(`Building plans for ${skillsForLearningPlan.length} skills...`);

        // Map LLM's learningPlan items to our skill names (if available)
        const llmPlanMap = {};
        if (llmLearningPlan && Array.isArray(llmLearningPlan)) {
          llmLearningPlan.forEach(item => {
            if (item && item.skill) {
              llmPlanMap[item.skill?.toLowerCase()] = item;
            }
          });
        }

        learningPlan = await Promise.all(
          skillsForLearningPlan.map(skill => {
            const llmItem = llmPlanMap[skill.toLowerCase()];
            return buildLearningPlanForSkill(skill, finalDomain, llmItem);
          })
        );
        console.log(`✅ Learning plans built: ${learningPlan.length} skills`);
        learningPlan.forEach((item, idx) => {
          console.log(`   [${idx + 1}] ${item.skill}: ${item.miniProjects?.length || 0} projects, ${item.videos?.telugu?.length || 0} videos, ${item.problems?.easy?.length || 0} easy problems`);
        });
      } catch (planErr) {
        console.error('⚠️ Learning plan generation failed:', planErr.message);
        console.log('Continuing with basic learning plans...');
        learningPlan = skillsForLearningPlan.map(skill => ({
          skill,
          miniProjects: [],
          videos: { telugu: [], hindi: [], tamil: [], english: [], kannada: [] },
          problems: { easy: [], medium: [], hard: [] },
          error: planErr.message
        }));
      }
    } else {
      console.log('✅ No skills to build learning plans for');
    }

    // Clean temp files
    [req.files?.jd?.[0]?.path, req.files?.resume?.[0]?.path]
      .filter(Boolean)
      .forEach(p => fs.unlink(p, () => { }));

    // Extract all projects from learning plan for easy frontend access
    const allProjects = [];
    learningPlan.forEach(item => {
      if (item.miniProjects && Array.isArray(item.miniProjects)) {
        item.miniProjects.forEach(p => allProjects.push(p));
      }
    });

    const responseData = {
      domain: finalDomain,
      jdSkills: finalJdSkills,
      resumeSkills: finalResumeSkills,
      matched: finalMatched,
      missing: finalMissing,
      extraSkills: finalExtra,
      score: finalScore,
      learningPlan,
      projectSuggestions: allProjects.slice(0, 6) // Send top 6 projects
    };

    console.log('\n✅ === ANALYSIS COMPLETE ===');
    console.log('Response summary:', {
      score: responseData.score,
      matched: responseData.matched.length,
      missing: responseData.missing.length,
      learningPlanCount: learningPlan.length
    });

    res.json(responseData);
  } catch (e) {
    console.error('❌ analyze error:', e.message);
    console.error('Stack:', e.stack);
    res.status(500).json({ error: 'Analysis failed', details: e.message });
  }
});

// GET VIDEOS
app.post('/api/get-videos', async (req, res) => {
  try {
    if (!YOUTUBE_API_KEY) {
      return res.status(503).json({ error: 'Video service not configured (missing YOUTUBE_API_KEY)' });
    }
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'query required' });
    const { data } = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: { part: 'snippet', q: query, type: 'video', maxResults: 5, key: YOUTUBE_API_KEY }
    });
    const videos = data.items.map(i => ({
      title: i.snippet.title,
      videoId: i.id.videoId,
      thumbnail: i.snippet.thumbnails.high.url,
      url: `https://www.youtube.com/embed/${i.id.videoId}`,
      watchUrl: `https://www.youtube.com/watch?v=${i.id.videoId}`,
      duration: '~10 min'
    }));
    res.json({ videos });
  } catch (e) {
    console.error('youtube error:', e.message);
    res.status(500).json({ error: 'Videos failed' });
  }
});

// ASK CHATBOT
app.post('/api/ask', async (req, res) => {
  try {
    if (!OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'Chatbot service not configured (missing OPENROUTER_API_KEY)' });
    }

    const { message, analysisContext } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    console.log('💬 Chatbot request:', message);

    // Build context-aware prompt
    let systemPrompt = `You are an expert career and resume coach helping users improve their resume match and learn new skills.
You are knowledgeable about:
- Resume optimization
- Skill gap analysis
- Learning path recommendations
- Interview preparation
- Career development`;

    // Add analysis context if provided
    if (analysisContext) {
      systemPrompt += `\n\nCurrent Analysis Context:
- Missing Skills: ${analysisContext.missingSkills?.join(', ') || 'None'}
- Matched Skills: ${analysisContext.matchedSkills?.join(', ') || 'None'}
- Current Match Score: ${analysisContext.score || 0}%
- Job Domain: ${analysisContext.domain || 'IT'}`;
    }

    console.log('🤖 Using model: gpt-3.5-turbo via OpenRouter');

    const { data } = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5001',
          'X-Title': 'Hiero Resume Analyzer'
        },
        timeout: 15000
      }
    );

    const reply = data?.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    console.log('✅ Chatbot response generated');
    res.json({
      reply,
      model: 'gpt-3.5-turbo',
      timestamp: new Date().toISOString()
    });

  } catch (e) {
    console.error('❌ Chatbot error:', e.response?.data || e.message);
    res.status(500).json({ error: 'Chatbot failed: ' + (e.message || 'Unknown error') });
  }
});

// GLOBAL ERROR
app.use((err, _, res, next) => {
  console.error('global error:', err.message);
  res.status(500).json({ error: 'Server error' });
});

// === START SERVER ===
const port = PORT;
app.listen(port, '0.0.0.0', () => {
  console.log(`Analysis server running on port ${port}`);
  console.log(`/api/get-videos endpoint ready`);
  console.log(`/api/ask chatbot endpoint ready`);
  console.log(`OpenRouter API configured (model: mistralai/mistral-7b-instruct)`);
});