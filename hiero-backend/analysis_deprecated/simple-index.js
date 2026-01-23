require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');

console.log('🚀 Starting Hiero Analysis Server...');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const upload = multer({ dest: 'uploads/' });

// Test endpoint
app.get('/health', (req, res) => {
  console.log('✅ Health check requested');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Simple analysis endpoint for now
app.post('/api/analyze', upload.fields([{ name: 'resume' }, { name: 'jd' }]), async (req, res) => {
  try {
    console.log('🔥 /api/analyze called');
    
    const resumeFile = req.files?.resume?.[0];
    const jdFile = req.files?.jd?.[0];
    
    if (!resumeFile || !jdFile) {
      console.log('❌ Missing files');
      return res.status(400).json({ success: false, error: 'Missing resume or job description files' });
    }
    
    console.log('✅ Files received:', {
      resume: resumeFile.originalname,
      jd: jdFile.originalname
    });

    // Extract text from PDFs
    const resumeBuffer = fs.readFileSync(resumeFile.path);
    const jdBuffer = fs.readFileSync(jdFile.path);
    
    const resumeText = (await pdfParse(resumeBuffer)).text || '';
    const jdText = (await pdfParse(jdBuffer)).text || '';
    
    console.log('✅ PDF text extracted', {
      resumeLength: resumeText.length,
      jdLength: jdText.length
    });

    // Clean up uploaded files
    fs.unlinkSync(resumeFile.path);
    fs.unlinkSync(jdFile.path);

    // For now, return a simple mock response
    const mockResponse = {
      success: true,
      data: {
        score: 75,
        missingSkills: ['Python', 'Machine Learning', 'Data Analysis'],
        skillToLearnFirst: 'Python',
        projectSuggestions: [
          'Build a Python data analysis project',
          'Create a machine learning model for prediction'
        ],
        videos: {
          'Python': {
            english: [
              { 
                title: "Python Tutorial - Python for Beginners [Full Course]", 
                url: "https://www.youtube.com/embed/_uQrJ0TkZlc", 
                duration: "PT6H13M52S" 
              }
            ]
          }
        },
        problems: {
          'Python': {
            easy: ["Variables and Data Types", "Loops and Conditions", "Functions"],
            medium: ["Object-Oriented Programming", "File Handling", "Exception Handling"],
            hard: ["Decorators and Generators", "Multithreading", "Web Scraping"]
          }
        }
      }
    };

    console.log('✅ Sending mock response');
    res.json(mockResponse);

  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({ success: false, error: 'Analysis failed: ' + error.message });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`📡 Analysis server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Analysis endpoint: http://localhost:${PORT}/api/analyze`);
});
