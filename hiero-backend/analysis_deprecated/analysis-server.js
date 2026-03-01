const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'temp/' });

// Enhanced hardcoded video database for immediate quality results + category fallbacks
function getHardcodedVideosForSkill(skill) {
  const skillLower = (skill || '').toLowerCase();
  const videoDb = {
    'python': [
      { title: 'Python Full Course for Beginners', url: 'https://youtu.be/rfscVS0vtbw', duration: '4:26:52', channel: 'freeCodeCamp.org' },
      { title: 'Python Tutorial - Python for Beginners', url: 'https://youtu.be/_uQrJ0TkZlc', duration: '6:14:07', channel: 'Programming with Mosh' },
      { title: 'Learn Python - Full Course', url: 'https://youtu.be/HBxCHonP6Ro', duration: '11:16:43', channel: 'freeCodeCamp.org' }
    ],
    'javascript': [
      { title: 'JavaScript Full Course', url: 'https://youtu.be/PkZNo7MFNFg', duration: '3:26:42', channel: 'freeCodeCamp.org' },
      { title: 'JavaScript Tutorial for Beginners', url: 'https://youtu.be/W6NZfCO5SIk', duration: '3:48:46', channel: 'Programming with Mosh' },
      { title: 'Modern JavaScript Course', url: 'https://youtu.be/iWOYAxlnaww', duration: '2:32:29', channel: 'Traversy Media' }
    ],
    'react': [
      { title: 'React Course - Beginner\'s Tutorial', url: 'https://youtu.be/bMknfKXIFA8', duration: '11:55:27', channel: 'freeCodeCamp.org' },
      { title: 'React JS Crash Course', url: 'https://youtu.be/w7ejDZ8SWv8', duration: '1:48:39', channel: 'Traversy Media' },
      { title: 'React Tutorial for Beginners', url: 'https://youtu.be/Ke90Tje7VS0', duration: '2:25:24', channel: 'Programming with Mosh' }
    ],
    'machine learning': [
      { title: 'Machine Learning Course', url: 'https://youtu.be/NWONeJKn6kc', duration: '3:26:00', channel: 'freeCodeCamp.org' },
      { title: 'Python Machine Learning Tutorial', url: 'https://youtu.be/7eh4d6sabA0', duration: '2:45:56', channel: 'Programming with Mosh' },
      { title: 'Machine Learning Explained', url: 'https://youtu.be/ukzFI9rgwfU', duration: '1:41:30', channel: 'Zach Star' }
    ],
    'data analysis': [
      { title: 'Data Analysis with Python', url: 'https://youtu.be/r-uOLxNrNk8', duration: '4:20:19', channel: 'freeCodeCamp.org' },
      { title: 'Pandas Tutorial', url: 'https://youtu.be/vmEHCJofslg', duration: '1:09:18', channel: 'Programming with Mosh' },
      { title: 'Data Science Course', url: 'https://youtu.be/ua-CiDNNj30', duration: '8:20:23', channel: 'freeCodeCamp.org' }
    ],
    'sql': [
      { title: 'SQL Tutorial - Full Database Course', url: 'https://youtu.be/HXV3zeQKqGY', duration: '4:20:00', channel: 'freeCodeCamp.org' },
      { title: 'MySQL Tutorial for Beginners', url: 'https://youtu.be/7S_tz1z_5bA', duration: '3:10:44', channel: 'Programming with Mosh' },
      { title: 'Learn SQL in 60 Minutes', url: 'https://youtu.be/p3qvj9hO_Bo', duration: '1:03:14', channel: 'Web Dev Simplified' }
    ],
    'customer service': [
      { title: 'Customer Service Excellence', url: 'https://youtu.be/b0K4R-8aIjw', duration: '45:23', channel: 'Customer Service Training' },
      { title: 'How to Handle Difficult Customers', url: 'https://youtu.be/d8C4pP6nqaE', duration: '12:45', channel: 'Business Training' },
      { title: 'Customer Service Skills', url: 'https://youtu.be/sKgwbrPO0hc', duration: '28:34', channel: 'Professional Development' }
    ],
    'inventory management': [
      { title: 'Inventory Management Basics', url: 'https://youtu.be/Yj3hKsEo-6Q', duration: '35:22', channel: 'Supply Chain Management' },
      { title: 'Excel for Inventory Tracking', url: 'https://youtu.be/WOUMHrtAQPY', duration: '42:15', channel: 'Excel Training' },
      { title: 'Retail Inventory Systems', url: 'https://youtu.be/7FDuVdJ2xBo', duration: '25:43', channel: 'Retail Education' }
    ],
    'visual merchandising': [
      { title: 'Visual Merchandising Fundamentals', url: 'https://youtu.be/gqLT2bePZ7k', duration: '38:12', channel: 'Retail Training' },
      { title: 'Store Display Techniques', url: 'https://youtu.be/wEH9Lz4JzFo', duration: '22:45', channel: 'Fashion Retail' },
      { title: 'Window Display Design', url: 'https://youtu.be/PmQq3xRZ-88', duration: '31:18', channel: 'Design Academy' }
    ],
    'excel': [
      { title: 'Excel Tutorial for Beginners', url: 'https://youtu.be/nvYqfNcabwM', duration: '2:17:00', channel: 'ExcelIsFun' },
      { title: 'Excel Formulas and Functions', url: 'https://youtu.be/AX5SJVBYwlU', duration: '1:45:32', channel: 'Leila Gharani' },
      { title: 'Advanced Excel Course', url: 'https://youtu.be/9L6f1wMZCGM', duration: '3:42:15', channel: 'freeCodeCamp.org' }
    ],
    'communication': [
      { title: 'Effective Communication Skills', url: 'https://youtu.be/F0eO-ZGLrT4', duration: '52:33', channel: 'Improvement Pill' },
      { title: 'Business Communication', url: 'https://youtu.be/xkWJbKOzVAA', duration: '38:45', channel: 'Professional Skills' },
      { title: 'Public Speaking Course', url: 'https://youtu.be/60bv8nc5XXM', duration: '1:25:17', channel: 'TED-Ed' }
    ],
    'teamwork': [
      { title: 'Team Building Skills', url: 'https://youtu.be/dYk1RriuFb8', duration: '34:22', channel: 'Leadership Training' },
      { title: 'Collaboration Techniques', url: 'https://youtu.be/2BT-SaO8siM', duration: '28:15', channel: 'Business Skills' },
      { title: 'Working in Teams', url: 'https://youtu.be/8jua09qKEPs', duration: '41:37', channel: 'Professional Development' }
    ],
    'sales': [
      { title: 'Sales Training Fundamentals', url: 'https://youtu.be/d-kOuEuTSl8', duration: '1:12:45', channel: 'Sales Training' },
      { title: 'Retail Sales Techniques', url: 'https://youtu.be/JmQm_7rP7pM', duration: '48:23', channel: 'Retail Academy' },
      { title: 'Customer Sales Psychology', url: 'https://youtu.be/YNi62T8xSQY', duration: '55:12', channel: 'Sales Expert' }
    ]
  };

  // Category-based curated fallbacks (improved over generic placeholders)
  const categoryMap = [
    { keys: ['python','django','flask'], cat: 'python' },
    { keys: ['javascript','frontend','js','web'], cat: 'javascript' },
    { keys: ['react'], cat: 'react' },
    { keys: ['machine','ml','ai','deep'], cat: 'machine learning' },
    { keys: ['data','analysis','analytics','pandas','numpy'], cat: 'data analysis' },
    { keys: ['sql','database','mysql','postgres','db'], cat: 'sql' },
    { keys: ['customer','service','support'], cat: 'customer service' },
    { keys: ['inventory','stock'], cat: 'inventory management' },
    { keys: ['merchandising','display','retail layout'], cat: 'visual merchandising' },
    { keys: ['excel','spreadsheet'], cat: 'excel' },
    { keys: ['communication','public speaking','presentation'], cat: 'communication' },
    { keys: ['team','collaboration'], cat: 'teamwork' },
    { keys: ['sell','sales','negotiation'], cat: 'sales' }
  ];

  const genericFallback = [
    { title: 'How to Learn Anything Fast', url: 'https://youtu.be/IlU-zDU6aQ0', duration: '13:13', channel: 'Thomas Frank' },
    { title: 'Effective Note Taking for Skill Mastery', url: 'https://youtu.be/1xeHh5DnCIw', duration: '16:45', channel: 'Ali Abdaal' },
    { title: 'Critical Thinking & Problem Solving', url: 'https://youtu.be/dItUGF8GdTw', duration: '1:28:17', channel: 'freeCodeCamp.org' }
  ];

  if (videoDb[skillLower]) return videoDb[skillLower];

  for (const [key, videos] of Object.entries(videoDb)) {
    if (skillLower.includes(key) || key.includes(skillLower)) return videos;
  }

  // Try category mapping
  for (const entry of categoryMap) {
    if (entry.keys.some(k => skillLower.includes(k))) {
      const cat = entry.cat;
      if (videoDb[cat]) return videoDb[cat];
    }
  }

  // Final curated generic fallback (no '#')
  return genericFallback.map(v => ({ ...v }));
}

// Simple skill extraction and analysis
function analyzeResume(resumeText, jdText) {
  const techSkills = ['Python', 'JavaScript', 'React', 'Node.js', 'SQL', 'Machine Learning', 'Data Analysis'];
  const nonTechSkills = ['Customer Service', 'Inventory Management', 'Visual Merchandising', 'Excel', 'Communication', 'Teamwork', 'Sales'];
  
  const allSkills = [...techSkills, ...nonTechSkills];
  const resumeLower = resumeText.toLowerCase();
  const jdLower = jdText.toLowerCase();
  
  // Check if it's tech or non-tech based on JD content
  const isTech = techSkills.some(skill => jdLower.includes(skill.toLowerCase()));
  const relevantSkills = isTech ? techSkills : nonTechSkills;
  
  // Find skills mentioned in JD
  const jdRequiredSkills = relevantSkills.filter(skill => jdLower.includes(skill.toLowerCase()));
  
  // Find skills present in resume
  const presentSkills = jdRequiredSkills.filter(skill => resumeLower.includes(skill.toLowerCase()));
  
  // Find skills present in resume
  const missingSkills = jdRequiredSkills.filter(skill => !resumeLower.includes(skill.toLowerCase()));
  
  // Calculate score (guard against 100% if missing skills exist)
  let score = jdRequiredSkills.length > 0 ? Math.round((presentSkills.length / jdRequiredSkills.length) * 100) : 0;
  if (missingSkills.length > 0 && score === 100) score = 99; // safety guard
  
  // --- Dynamic Project Suggestions Engine ---
  const projectIdeaBank = {
    // Tech
    'python': [
      'Build a CLI task manager in Python',
      'Create a Flask REST API with JWT auth',
      'Automate a daily workflow with a Python script'
    ],
    'javascript': [
      'Interactive to-do app using localStorage',
      'Browser extension for productivity',
      'Single Page App with vanilla JS modules'
    ],
    'react': [
      'Responsive dashboard with charts (Recharts / Chart.js)',
      'Kanban board with drag & drop',
      'Theme-switching portfolio with dynamic routing'
    ],
    'node.js': [
      'REST API with Express and proper logging',
      'File upload & processing microservice',
      'Background job queue with Bull / Redis'
    ],
    'machine learning': [
      'Train and evaluate a classification model on a custom dataset',
      'Build a recommendation system (content-based or collaborative)',
      'Model explainability demo using SHAP/LIME'
    ],
    'data analysis': [
      'Sales trend analysis notebook (seasonality + forecasting)',
      'Data cleaning and EDA on a messy public dataset',
      'Build a lightweight KPI dashboard'
    ],
    'sql': [
      'Design a normalized database schema for an app idea',
      'Write analytical queries over a sample dataset',
      'Create SQL views for a reporting layer'
    ],
    // Non-Tech
    'customer service': [
      'Design a structured complaint resolution workflow',
      'Build a customer feedback analysis report',
      'Create a quick-start training handbook'
    ],
    'inventory management': [
      'Excel/Sheets inventory tracker with re-order alerts',
      'ABC classification analysis for stock items',
      'Cycle count & variance reporting template'
    ],
    'visual merchandising': [
      'Plan a seasonal window display mockup',
      'Layout optimization for product flow',
      'Create a brand consistency audit checklist'
    ],
    'excel': [
      'KPI dashboard with pivot tables & charts',
      'Automated sales report with formulas',
      'Data cleaning macro toolkit'
    ],
    'communication': [
      'Create a structured meeting facilitation guide',
      'Write a stakeholder update template pack',
      'Design a mini workshop on active listening'
    ],
    'teamwork': [
      'Retrospective framework & facilitation guide',
      'Collaborative task board process write-up',
      'Peer feedback workflow template'
    ],
    'sales': [
      'Sales funnel metrics tracker (spreadsheet)',
      'Competitive analysis & positioning brief',
      'Email outreach performance A/B log'
    ]
  };

  const genericTech = [
    'Refactor an old project for performance & readability',
    'Add automated tests & CI pipeline to an existing repo',
    'Deploy a full-stack app with observability (logs/metrics)'
  ];
  const genericNonTech = [
    'Design a process improvement SOP for a routine task',
    'Create a KPI dashboard template (Excel/Sheets)',
    'Document a customer journey with pain points & fixes'
  ];

  function generateProjectSuggestions() {
    const suggestions = new Set();
    if (missingSkills.length > 0) {
      // Focus on missing skills first
      missingSkills.forEach(skill => {
        const key = skill.toLowerCase();
        const bank = projectIdeaBank[key];
        if (bank) bank.slice(0, 2).forEach(p => suggestions.add(p));
        else suggestions.add(`Build a mini case study applying ${skill} in a real scenario`);
      });
      // Add 1–2 domain generic fillers if needed
      const needed = 5 - suggestions.size;
      if (needed > 0) {
        const fillers = isTech ? genericTech : genericNonTech;
        fillers.slice(0, needed).forEach(p => suggestions.add(p));
      }
    } else {
      // No missing skills – push advanced/ breadth projects based on present skills
      presentSkills.slice(0, 3).forEach(skill => {
        const key = skill.toLowerCase();
        const bank = projectIdeaBank[key];
        if (bank) bank.forEach(p => suggestions.add(p));
      });
      (isTech ? genericTech : genericNonTech).forEach(p => suggestions.add(p));
      if (suggestions.size === 0) {
        (isTech ? genericTech : genericNonTech).forEach(p => suggestions.add(p));
      }
    }
    return Array.from(suggestions).slice(0, 8);
  }

  const projectSuggestions = generateProjectSuggestions();

  const learningVideos = {};
  // Always ensure at least one generic learning area appears even if no missing skills
  const targetSkills = missingSkills.length ? missingSkills.slice(0, 5) : (presentSkills.slice(0,2));
  targetSkills.forEach(skill => {
    learningVideos[skill] = getHardcodedVideosForSkill(skill);
  });
  if (Object.keys(learningVideos).length === 0) {
    learningVideos['Learning Strategy'] = getHardcodedVideosForSkill('learning strategy');
  }

  return {
    domainType: isTech ? 'tech' : 'non-tech',
    domainBadge: isTech ? 'Tech' : 'Non-Tech',
    score,
    presentSkills,
    missingSkills,
    projectSuggestions,
    suggestedProjects: projectSuggestions,
    skillToLearnFirst: missingSkills[0] || presentSkills[0] || 'Learning Strategy',
    learningVideos,
    videos: learningVideos,
    meta: {
      jdSkillCount: jdRequiredSkills.length,
      resumeSkillCount: presentSkills.length,
      confidence: score
    }
  };
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Analysis server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Hiero Analysis API v1.0' });
});

// Main analysis endpoint
app.post('/api/analyze-nontech', upload.fields([{ name: 'resume' }, { name: 'jd' }]), async (req, res) => {
  try {
    const resumeFile = req.files && req.files.resume ? req.files.resume[0] : null;
    const jdFile = req.files && req.files.jd ? req.files.jd[0] : null;
    let resumeText = (req.body.resumeText || req.body.resume_text || '').trim();
    let jdText = (req.body.jdText || req.body.jd_text || '').trim();
    if (resumeFile && !resumeText) {
      try {
        const buf = fs.readFileSync(resumeFile.path);
        resumeText = (await pdfParse(buf)).text || '';
        fs.unlinkSync(resumeFile.path);
      } catch (e) { console.error('Resume PDF parse error:', e); }
    }
    if (jdFile && !jdText) {
      try {
        const buf = fs.readFileSync(jdFile.path);
        jdText = (await pdfParse(buf)).text || '';
        fs.unlinkSync(jdFile.path);
      } catch (e) { console.error('JD PDF parse error:', e); }
    }
    if (!resumeText || !jdText) return res.status(400).json({ error: 'Both resume and job description required.' });
    const analysis = analyzeResume(resumeText, jdText);
    console.log('✅ Analysis complete:', { domain: analysis.domainType, score: analysis.score, present: analysis.presentSkills.length, missing: analysis.missingSkills.length, videos: Object.keys(analysis.learningVideos).length });
    return res.json({ success: true, data: analysis });
  } catch (e) {
    console.error('❌ Analysis error:', e);
    return res.status(500).json({ error: 'Analysis failed', details: e.message });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`✅ Analysis server running on port ${PORT}`);
});
