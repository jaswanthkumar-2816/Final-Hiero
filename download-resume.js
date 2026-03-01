#!/usr/bin/env node

/**
 * Resume Download Script
 * This script downloads a generated resume from the Hiero backend and saves it locally
 */

const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

// Configuration
const BACKEND_URL = 'http://localhost:5003';
const OUTPUT_DIR = './downloaded-resumes';

// Sample data for resume generation
const SAMPLE_RESUME_DATA = {
  token: '',
  basicInfo: {
    full_name: "John Doe",
    contact_info: {
      email: "john.doe@email.com",
      phone: "+1-555-0123",
      location: "San Francisco, CA",
      linkedin: "linkedin.com/in/johndoe",
      github: "github.com/johndoe"
    },
    career_summary: "Experienced software developer with 5+ years in full-stack development",
    website: "johndoe.dev"
  },
  education: [{
    institution: "University of California, Berkeley",
    degree: "Bachelor of Science in Computer Science",
    year: "2018-2022",
    gpa: "3.8/4.0"
  }],
  projects: [{
    name: "E-commerce Platform",
    description: "Built a full-stack e-commerce application using React, Node.js, and MongoDB",
    technologies: "React, Node.js, MongoDB, Express",
    link: "github.com/johndoe/ecommerce"
  }],
  skills: {
    technical: ["JavaScript", "Python", "React", "Node.js", "MongoDB", "Git"],
    soft: ["Leadership", "Problem Solving", "Communication", "Team Collaboration"]
  },
  certifications: [{
    name: "AWS Certified Developer",
    issuer: "Amazon Web Services",
    date: "2023"
  }],
  achievements: [{
    title: "Dean's List",
    description: "Achieved Dean's List for 3 consecutive semesters"
  }],
  hobbies: ["Photography", "Hiking", "Chess"],
  personalDetails: {
    dateOfBirth: "1995-05-15",
    nationality: "American",
    languages: ["English (Native)", "Spanish (Conversational)"]
  },
  references: [{
    name: "Jane Smith",
    position: "Senior Software Engineer",
    company: "Tech Corp",
    relationship: "Former Supervisor",
    contact: "jane.smith@techcorp.com"
  }]
};

// Utility function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.hostname === 'localhost' ? http : https;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: res.headers['content-type']?.includes('application/json') ? JSON.parse(body) : body
          };
          resolve(result);
        } catch (error) {
          resolve({ statusCode: res.statusCode, headers: res.headers, body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

// Download file to local system
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    const file = fs.createWriteStream(filePath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(filePath);
        });
        file.on('error', reject);
      } else {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }
    }).on('error', reject);
  });
}

async function generateAndDownloadResume() {
  try {
    console.log('🚀 Starting resume generation and download process...\n');

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log(`📁 Created output directory: ${OUTPUT_DIR}`);
    }

    // Step 1: Get authentication token
    console.log('1. 🔐 Getting authentication token...');
    const authResponse = await makeRequest({
      hostname: 'localhost',
      port: 5003,
      path: '/api/auth/demo',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {});

    if (authResponse.statusCode !== 200) {
      throw new Error(`Auth failed: ${authResponse.statusCode}`);
    }

    const token = authResponse.body.token;
    console.log(`   ✅ Token received: ${token.substring(0, 20)}...`);

    // Step 2: Submit all resume data
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    const steps = [
      { name: 'Basic Info', path: '/api/resume/basic', data: SAMPLE_RESUME_DATA.basicInfo },
      { name: 'Education', path: '/api/resume/education', data: { education: SAMPLE_RESUME_DATA.education } },
      { name: 'Projects', path: '/api/resume/projects', data: { projects: SAMPLE_RESUME_DATA.projects } },
      { name: 'Skills', path: '/api/resume/skills', data: SAMPLE_RESUME_DATA.skills },
      { name: 'Certifications', path: '/api/resume/certifications', data: { certifications: SAMPLE_RESUME_DATA.certifications } },
      { name: 'Achievements', path: '/api/resume/achievements', data: { achievements: SAMPLE_RESUME_DATA.achievements } },
      { name: 'Hobbies', path: '/api/resume/hobbies', data: { hobbies: SAMPLE_RESUME_DATA.hobbies } },
      { name: 'Personal Details', path: '/api/resume/personal_details', data: SAMPLE_RESUME_DATA.personalDetails },
      { name: 'References', path: '/api/resume/references', data: { references: SAMPLE_RESUME_DATA.references } }
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      console.log(`${i + 2}. 📝 Submitting ${step.name}...`);
      
      const response = await makeRequest({
        hostname: 'localhost',
        port: 5003,
        path: step.path,
        method: 'POST',
        headers
      }, step.data);

      if (response.statusCode !== 200) {
        throw new Error(`${step.name} submission failed: ${response.statusCode}`);
      }
      console.log(`   ✅ ${step.name} submitted successfully`);
    }

    // Step 3: Generate resume PDF
    console.log(`${steps.length + 2}. 🔨 Generating resume PDF...`);
    const generateResponse = await makeRequest({
      hostname: 'localhost',
      port: 5003,
      path: '/api/resume/generate-fast',
      method: 'POST',
      headers
    }, {});

    if (generateResponse.statusCode !== 200) {
      throw new Error(`Resume generation failed: ${generateResponse.statusCode}`);
    }

    const fileName = generateResponse.body.file;
    console.log(`   ✅ Resume generated: ${fileName}`);

    // Step 4: Download the PDF file
    console.log(`${steps.length + 3}. 📥 Downloading resume PDF...`);
    const downloadUrl = `${BACKEND_URL}/api/resume/download?file=${fileName}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const localFileName = `resume_${timestamp}.pdf`;
    const localFilePath = path.join(OUTPUT_DIR, localFileName);

    await downloadFile(downloadUrl, localFilePath);
    console.log(`   ✅ Resume downloaded: ${localFilePath}`);

    // Step 5: Verify file exists and get size
    const stats = fs.statSync(localFilePath);
    console.log(`   📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);

    console.log('\n🎉 Resume generation and download completed successfully!');
    console.log(`📄 Your resume is saved at: ${path.resolve(localFilePath)}`);
    console.log('\n💡 You can now open the PDF file with any PDF viewer.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  generateAndDownloadResume();
}
