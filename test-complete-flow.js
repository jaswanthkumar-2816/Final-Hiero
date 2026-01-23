#!/usr/bin/env node

// Complete Resume Builder Flow Test
// Tests every single step and shows detailed results

const fetch = require('node-fetch');
const fs = require('fs');

const BASE_URL = 'http://localhost:5003';
let authToken = '';

// Test data for each step
const testData = {
  basic: {
    full_name: "Complete Test User",
    contact_info: {
      email: "complete.test@example.com",
      phone: "+1-555-0123",
      website: "https://linkedin.com/in/completetest"
    },
    career_summary: "Experienced software developer with 5+ years of expertise"
  },
  education: {
    education: [
      {
        institution: "Stanford University",
        degree: "Master of Science in Computer Science",
        year: "2023",
        gpa: "3.9"
      },
      {
        institution: "University of California",
        degree: "Bachelor of Science in Software Engineering",
        year: "2021",
        gpa: "3.7"
      }
    ]
  },
  projects: {
    projects: [
      {
        title: "AI-Powered Resume Builder",
        description: "Built a full-stack application using React, Node.js, and machine learning algorithms to create personalized resumes",
        duration: "6 months",
        year: "2023"
      },
      {
        title: "E-commerce Platform",
        description: "Developed a scalable e-commerce solution with microservices architecture",
        duration: "8 months",
        year: "2022"
      }
    ]
  },
  skills: {
    skills: {
      technical: ["JavaScript", "Python", "React", "Node.js", "AWS", "Docker", "MongoDB", "PostgreSQL"],
      management: ["Team Leadership", "Project Management", "Agile Methodology", "Cross-functional Collaboration"]
    }
  },
  certifications: {
    certifications: [
      {
        name: "AWS Solutions Architect",
        issuer: "Amazon Web Services",
        year: "2023"
      },
      {
        name: "Certified ScrumMaster",
        issuer: "Scrum Alliance",
        year: "2022"
      }
    ]
  },
  achievements: {
    achievements: [
      {
        title: "Best Innovation Award",
        description: "Recognized for developing cutting-edge AI solutions",
        year: "2023"
      },
      {
        title: "Team Excellence Award",
        description: "Led a team of 8 developers to deliver project 2 months ahead of schedule",
        year: "2022"
      }
    ]
  },
  hobbies: {
    hobbies: ["Coding", "Photography", "Hiking", "Chess", "Reading Technology Blogs"]
  },
  personal_details: {
    personal_details: {
      dob: "1995-05-15",
      gender: "Male",
      address: "123 Tech Street, Silicon Valley, CA 94000"
    }
  },
  references: {
    references: [
      {
        name: "Dr. Sarah Johnson",
        contact: "sarah.johnson@stanford.edu",
        relationship: "Professor and Thesis Advisor"
      },
      {
        name: "Michael Chen",
        contact: "m.chen@techcorp.com",
        relationship: "Former Manager at TechCorp"
      }
    ]
  }
};

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function logStep(stepNumber, title, status = 'info') {
  const statusIcon = status === 'success' ? '✅' : status === 'error' ? '❌' : status === 'loading' ? '⏳' : 'ℹ️';
  log(`${stepNumber}. ${statusIcon} ${title}`, status === 'success' ? 'green' : status === 'error' ? 'red' : 'cyan');
}

function logDetail(message, indent = 2) {
  console.log(' '.repeat(indent) + '• ' + message);
}

async function makeRequest(endpoint, method = 'GET', data = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (authToken) {
    options.headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return { response, result };
  } catch (error) {
    return { error: error.message };
  }
}

async function testAuthentication() {
  logStep(1, 'Testing Authentication', 'loading');
  
  const { response, result, error } = await makeRequest('/api/auth/demo', 'POST', {});
  
  if (error) {
    logStep(1, 'Authentication Failed', 'error');
    logDetail(`Error: ${error}`, 4);
    return false;
  }

  if (response.ok && result.success) {
    authToken = result.token;
    logStep(1, 'Authentication Successful', 'success');
    logDetail(`Token: ${authToken.substring(0, 30)}...`, 4);
    logDetail(`User: ${result.user.name} (${result.user.email})`, 4);
    return true;
  } else {
    logStep(1, 'Authentication Failed', 'error');
    logDetail(`Status: ${response.status}`, 4);
    logDetail(`Error: ${result.error || 'Unknown error'}`, 4);
    return false;
  }
}

async function testStep(stepName, stepNumber, stepData) {
  logStep(stepNumber, `Testing ${stepName.charAt(0).toUpperCase() + stepName.slice(1)} Step`, 'loading');
  
  const { response, result, error } = await makeRequest(`/api/resume/${stepName}`, 'POST', stepData);
  
  if (error) {
    logStep(stepNumber, `${stepName.charAt(0).toUpperCase() + stepName.slice(1)} Step Failed`, 'error');
    logDetail(`Error: ${error}`, 4);
    return false;
  }

  if (response.ok && result.success) {
    logStep(stepNumber, `${stepName.charAt(0).toUpperCase() + stepName.slice(1)} Step Successful`, 'success');
    logDetail(`Message: ${result.message}`, 4);
    if (result.nextStep) {
      logDetail(`Next Step: ${result.nextStep}`, 4);
    }
    
    // Show what data was submitted
    logDetail(`Data submitted:`, 4);
    if (stepName === 'basic') {
      logDetail(`  Name: ${stepData.full_name}`, 6);
      logDetail(`  Email: ${stepData.contact_info.email}`, 6);
      logDetail(`  Phone: ${stepData.contact_info.phone}`, 6);
    } else if (stepName === 'education') {
      logDetail(`  ${stepData.education.length} education entries`, 6);
      stepData.education.forEach((edu, i) => {
        logDetail(`    ${i+1}. ${edu.degree} from ${edu.institution} (${edu.year})`, 8);
      });
    } else if (stepName === 'projects') {
      logDetail(`  ${stepData.projects.length} project entries`, 6);
      stepData.projects.forEach((proj, i) => {
        logDetail(`    ${i+1}. ${proj.title} (${proj.year})`, 8);
      });
    } else if (stepName === 'skills') {
      logDetail(`  Technical: ${stepData.skills.technical.join(', ')}`, 6);
      logDetail(`  Management: ${stepData.skills.management.join(', ')}`, 6);
    } else if (stepName === 'certifications') {
      logDetail(`  ${stepData.certifications.length} certifications`, 6);
      stepData.certifications.forEach((cert, i) => {
        logDetail(`    ${i+1}. ${cert.name} from ${cert.issuer} (${cert.year})`, 8);
      });
    } else if (stepName === 'achievements') {
      logDetail(`  ${stepData.achievements.length} achievements`, 6);
      stepData.achievements.forEach((ach, i) => {
        logDetail(`    ${i+1}. ${ach.title} (${ach.year})`, 8);
      });
    } else if (stepName === 'hobbies') {
      logDetail(`  Hobbies: ${stepData.hobbies.join(', ')}`, 6);
    } else if (stepName === 'personal_details') {
      logDetail(`  DOB: ${stepData.personal_details.dob}`, 6);
      logDetail(`  Gender: ${stepData.personal_details.gender}`, 6);
      logDetail(`  Address: ${stepData.personal_details.address}`, 6);
    } else if (stepName === 'references') {
      logDetail(`  ${stepData.references.length} references`, 6);
      stepData.references.forEach((ref, i) => {
        logDetail(`    ${i+1}. ${ref.name} (${ref.relationship})`, 8);
      });
    }
    
    return true;
  } else {
    logStep(stepNumber, `${stepName.charAt(0).toUpperCase() + stepName.slice(1)} Step Failed`, 'error');
    logDetail(`Status: ${response.status}`, 4);
    logDetail(`Error: ${result.error || 'Unknown error'}`, 4);
    return false;
  }
}

async function testResumeGeneration() {
  logStep(11, 'Testing Resume Generation', 'loading');
  
  const { response, result, error } = await makeRequest('/api/resume/generate-fast', 'POST');
  
  if (error) {
    logStep(11, 'Resume Generation Failed', 'error');
    logDetail(`Error: ${error}`, 4);
    return null;
  }

  if (response.ok && result.success) {
    logStep(11, 'Resume Generation Successful', 'success');
    logDetail(`Message: ${result.message}`, 4);
    logDetail(`File: ${result.file}`, 4);
    logDetail(`Download URL: ${result.downloadUrl}`, 4);
    return result.file;
  } else {
    logStep(11, 'Resume Generation Failed', 'error');
    logDetail(`Status: ${response.status}`, 4);
    logDetail(`Error: ${result.error || 'Unknown error'}`, 4);
    return null;
  }
}

async function testResumeDownload(filename) {
  logStep(12, 'Testing Resume Download', 'loading');
  
  try {
    const downloadUrl = `${BASE_URL}/api/resume/download?file=${filename}`;
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      logStep(12, 'Resume Download Failed', 'error');
      logDetail(`Status: ${response.status}`, 4);
      return false;
    }

    const buffer = await response.buffer();
    const localFilename = `downloaded_${filename}`;
    fs.writeFileSync(localFilename, buffer);
    
    const stats = fs.statSync(localFilename);
    
    logStep(12, 'Resume Download Successful', 'success');
    logDetail(`Downloaded file: ${localFilename}`, 4);
    logDetail(`File size: ${stats.size} bytes`, 4);
    logDetail(`Content-Type: ${response.headers.get('content-type')}`, 4);
    logDetail(`Content-Disposition: ${response.headers.get('content-disposition')}`, 4);
    
    // Verify it's a valid PDF
    const pdfHeader = buffer.slice(0, 4).toString();
    if (pdfHeader === '%PDF') {
      logDetail(`✓ Valid PDF file confirmed`, 4);
    } else {
      logDetail(`⚠ File may not be a valid PDF`, 4);
    }
    
    return true;
  } catch (error) {
    logStep(12, 'Resume Download Failed', 'error');
    logDetail(`Error: ${error.message}`, 4);
    return false;
  }
}

async function testTemplates() {
  logStep(13, 'Testing Template System', 'loading');
  
  const { response, result, error } = await makeRequest('/api/resume/templates');
  
  if (error) {
    logStep(13, 'Template System Failed', 'error');
    logDetail(`Error: ${error}`, 4);
    return false;
  }

  if (response.ok && result.success) {
    logStep(13, 'Template System Working', 'success');
    logDetail(`Template: ${result.template.name}`, 4);
    logDetail(`Category: ${result.template.category}`, 4);
    logDetail(`Description: ${result.template.description}`, 4);
    return true;
  } else {
    logStep(13, 'Template System Failed', 'error');
    logDetail(`Status: ${response.status}`, 4);
    logDetail(`Error: ${result.error || 'Unknown error'}`, 4);
    return false;
  }
}

async function runCompleteTest() {
  log('\n' + '='.repeat(80), 'bold');
  log('🚀 COMPLETE RESUME BUILDER FLOW TEST', 'bold');
  log('Testing every single step from authentication to download', 'cyan');
  log('='.repeat(80), 'bold');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Authentication
  if (await testAuthentication()) {
    passed++;
  } else {
    failed++;
    log('\n❌ Cannot continue without authentication. Exiting.', 'red');
    return;
  }
  
  console.log();
  
  // Test all data submission steps
  const steps = [
    { name: 'basic', number: 2 },
    { name: 'education', number: 3 },
    { name: 'projects', number: 4 },
    { name: 'skills', number: 5 },
    { name: 'certifications', number: 6 },
    { name: 'achievements', number: 7 },
    { name: 'hobbies', number: 8 },
    { name: 'personal_details', number: 9 },
    { name: 'references', number: 10 }
  ];
  
  for (const step of steps) {
    if (await testStep(step.name, step.number, testData[step.name])) {
      passed++;
    } else {
      failed++;
    }
    console.log();
  }
  
  // Test resume generation
  const generatedFile = await testResumeGeneration();
  if (generatedFile) {
    passed++;
    console.log();
    
    // Test download
    if (await testResumeDownload(generatedFile)) {
      passed++;
    } else {
      failed++;
    }
  } else {
    failed++;
  }
  
  console.log();
  
  // Test template system
  if (await testTemplates()) {
    passed++;
  } else {
    failed++;
  }
  
  // Final summary
  console.log('\n' + '='.repeat(80));
  log('📊 TEST SUMMARY', 'bold');
  log('='.repeat(80), 'bold');
  log(`✅ Passed: ${passed} tests`, 'green');
  log(`❌ Failed: ${failed} tests`, failed > 0 ? 'red' : 'green');
  log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`, failed === 0 ? 'green' : 'yellow');
  
  if (failed === 0) {
    log('\n🎉 ALL TESTS PASSED! Resume Builder is working perfectly!', 'green');
  } else {
    log(`\n⚠️  ${failed} test(s) failed. Please check the issues above.`, 'yellow');
  }
  
  log('='.repeat(80), 'bold');
}

// Run the test
runCompleteTest().catch(console.error);
