const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'temp/' });

// Enhanced hardcoded video database for immediate quality results
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

  // Try exact match first
  if (videoDb[skillLower]) {
    return videoDb[skillLower];
  }

  // Try partial matches
  for (const [key, videos] of Object.entries(videoDb)) {
    if (skillLower.includes(key) || key.includes(skillLower)) {
      return videos;
    }
  }

  // Fallback generic videos
  return [
    { title: `Learn ${skill} - Beginner Tutorial`, url: '#', duration: '1:00:00', channel: 'Learning Hub' },
    { title: `${skill} Fundamentals`, url: '#', duration: '45:00', channel: 'Skill Academy' },
    { title: `Master ${skill} in Practice`, url: '#', duration: '1:30:00', channel: 'Expert Training' }
  ];
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
  
  // Find missing skills
  const missingSkills = jdRequiredSkills.filter(skill => !resumeLower.includes(skill.toLowerCase()));
  
  // Calculate score
  const score = jdRequiredSkills.length > 0 ? Math.round((presentSkills.length / jdRequiredSkills.length) * 100) : 0;
  
  // Generate project suggestions
  const projectSuggestions = isTech ? [
    'Build a CRUD web application with authentication',
    'Create a data analysis dashboard',
    'Develop a machine learning model',
    'Design a responsive website'
  ] : [
    'Create an Excel inventory tracking system',
    'Design a customer service improvement plan',
    'Develop a visual merchandising layout',
    'Build a sales performance dashboard'
  ];
  
  // Get learning videos for missing skills
  const learningVideos = {};
  missingSkills.slice(0, 5).forEach(skill => {
    learningVideos[skill] = getHardcodedVideosForSkill(skill);
  });
  
  return {
    domainType: isTech ? 'tech' : 'non-tech',
    domainBadge: isTech ? 'Tech' : 'Non-Tech',
    score,
    presentSkills,
    missingSkills,
    projectSuggestions,
    suggestedProjects: projectSuggestions,
    skillToLearnFirst: missingSkills[0] || presentSkills[0] || '',
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

    // Extract text from PDF files if provided
    if (resumeFile && !resumeText) {
      try { 
        const buf = fs.readFileSync(resumeFile.path); 
        resumeText = (await pdfParse(buf)).text || ''; 
        fs.unlinkSync(resumeFile.path); 
      } catch (e) {
        console.error('Resume PDF parse error:', e);
      }
    }
    if (jdFile && !jdText) {
      try { 
        const buf = fs.readFileSync(jdFile.path); 
        jdText = (await pdfParse(buf)).text || ''; 
        fs.unlinkSync(jdFile.path); 
      } catch (e) {
        console.error('JD PDF parse error:', e);
      }
    }

    if (!resumeText || !jdText) {
      return res.status(400).json({ error: 'Both resume and job description required.' });
    }

    const analysis = analyzeResume(resumeText, jdText);

    console.log('✅ Analysis complete:', {
      domain: analysis.domainType,
      score: analysis.score,
      present: analysis.presentSkills.length,
      missing: analysis.missingSkills.length,
      videos: Object.keys(analysis.learningVideos).length
    });

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
