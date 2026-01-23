#!/usr/bin/env node

// Test script to verify the complete resume generation flow
const BASE_URL = 'http://localhost:5003';

async function testResumeFlow() {
  console.log('🚀 Testing complete resume generation flow...');
  
  try {
    // Step 1: Get authentication token
    console.log('1. Getting authentication token...');
    const authResponse = await fetch(`${BASE_URL}/api/auth/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    
    const authData = await authResponse.json();
    if (!authData.success) {
      throw new Error('Failed to get auth token');
    }
    
    const token = authData.token;
    console.log('✅ Authentication token obtained');
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    // Step 2: Submit basic information
    console.log('2. Submitting basic information...');
    const basicData = {
      full_name: 'John Doe',
      contact_info: {
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567',
        website: 'https://linkedin.com/in/johndoe'
      },
      career_summary: 'Experienced software engineer with 5+ years in full-stack development'
    };
    
    const basicResponse = await fetch(`${BASE_URL}/api/resume/basic`, {
      method: 'POST',
      headers,
      body: JSON.stringify(basicData)
    });
    
    const basicResult = await basicResponse.json();
    if (!basicResult.success) {
      throw new Error('Failed to submit basic info: ' + basicResult.error);
    }
    console.log('✅ Basic information submitted');
    
    // Step 3: Submit education
    console.log('3. Submitting education...');
    const educationData = {
      education: [{
        institution: 'University of Technology',
        degree: 'Bachelor of Science in Computer Science',
        year: '2019',
        gpa: '3.8/4.0'
      }]
    };
    
    const eduResponse = await fetch(`${BASE_URL}/api/resume/education`, {
      method: 'POST',
      headers,
      body: JSON.stringify(educationData)
    });
    
    const eduResult = await eduResponse.json();
    if (!eduResult.success) {
      throw new Error('Failed to submit education: ' + eduResult.error);
    }
    console.log('✅ Education submitted');
    
    // Step 4: Submit projects
    console.log('4. Submitting projects...');
    const projectsData = {
      projects: [{
        title: 'E-commerce Platform',
        description: 'Built a full-stack e-commerce platform using React, Node.js, and MongoDB',
        duration: '6 months',
        year: '2023'
      }]
    };
    
    const projectsResponse = await fetch(`${BASE_URL}/api/resume/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify(projectsData)
    });
    
    const projectsResult = await projectsResponse.json();
    if (!projectsResult.success) {
      throw new Error('Failed to submit projects: ' + projectsResult.error);
    }
    console.log('✅ Projects submitted');
    
    // Step 5: Submit skills
    console.log('5. Submitting skills...');
    const skillsData = {
      skills: {
        technical: ['JavaScript', 'Python', 'React', 'Node.js', 'MongoDB'],
        management: ['Team Leadership', 'Project Management', 'Agile Methodology']
      }
    };
    
    const skillsResponse = await fetch(`${BASE_URL}/api/resume/skills`, {
      method: 'POST',
      headers,
      body: JSON.stringify(skillsData)
    });
    
    const skillsResult = await skillsResponse.json();
    if (!skillsResult.success) {
      throw new Error('Failed to submit skills: ' + skillsResult.error);
    }
    console.log('✅ Skills submitted');
    
    // Step 6: Generate resume
    console.log('6. Generating resume PDF...');
    const generateResponse = await fetch(`${BASE_URL}/api/resume/generate-fast`, {
      method: 'POST',
      headers
    });
    
    const generateResult = await generateResponse.json();
    if (!generateResult.success) {
      throw new Error('Failed to generate resume: ' + generateResult.error);
    }
    
    console.log('✅ Resume generated successfully!');
    console.log(`📄 File: ${generateResult.file}`);
    console.log(`🔗 Download URL: ${BASE_URL}/api/resume/download?file=${generateResult.file}`);
    
    // Test download
    console.log('7. Testing download...');
    const downloadResponse = await fetch(`${BASE_URL}/api/resume/download?file=${generateResult.file}`);
    
    if (downloadResponse.ok) {
      const contentLength = downloadResponse.headers.get('content-length');
      console.log(`✅ Download successful! PDF size: ${contentLength} bytes`);
    } else {
      console.log('❌ Download failed');
    }
    
    console.log('\n🎉 Complete resume generation flow test PASSED!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testResumeFlow();
