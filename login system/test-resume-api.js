// Test script for resume builder API endpoints
const { default: fetch } = require('node-fetch');

const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsIm5hbWUiOiJUZXN0IFVzZXIiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJwaWN0dXJlIjpudWxsLCJpYXQiOjE3NTg2MDU5MjAsImV4cCI6MTc1OTIxMDcyMH0.VMJpox_dBsRovzHk8dnQ0woJk0wIq_rvBUQ0iKpzDfk';
const BASE_URL = 'http://localhost:5003';

const headers = {
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'Content-Type': 'application/json'
};

async function testEndpoint(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers,
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await response.json();
        
        console.log(`\n=== ${method} ${endpoint} ===`);
        console.log(`Status: ${response.status}`);
        console.log('Response:', JSON.stringify(data, null, 2));
        
        return { status: response.status, data };
    } catch (error) {
        console.log(`\n=== ${method} ${endpoint} ===`);
        console.log('Error:', error.message);
        return { error: error.message };
    }
}

async function runTests() {
    console.log('🧪 Testing Resume Builder API Endpoints');
    console.log('========================================');
    
    // Test 1: Get resume templates
    await testEndpoint('/api/resume/templates');
    
    // Test 2: Create/Update basic info
    const basicInfo = {
        full_name: 'John Doe',
        contact_info: {
            email: 'john.doe@example.com',
            phone: '+1-555-0123',
            location: 'San Francisco, CA',
            linkedin: 'https://linkedin.com/in/johndoe',
            github: 'https://github.com/johndoe'
        },
        career_summary: 'Experienced software developer with expertise in full-stack development',
        website: 'https://johndoe.dev'
    };
    await testEndpoint('/api/resume/basic', 'POST', basicInfo);
    
    // Test 3: Add education
    const education = {
        education: [{
            institution: 'University of Technology',
            degree: 'Bachelor of Science in Computer Science',
            duration: '2018-2022',
            details: 'Graduated Magna Cum Laude with a focus on Software Engineering'
        }]
    };
    await testEndpoint('/api/resume/education', 'POST', education);
    
    // Test 4: Add projects
    const projects = {
        projects: [{
            title: 'E-commerce Platform',
            description: 'Full-stack web application built with React and Node.js',
            technologies: ['React', 'Node.js', 'MongoDB', 'Express.js'],
            github: 'https://github.com/johndoe/ecommerce',
            demo: 'https://ecommerce-demo.com'
        }]
    };
    await testEndpoint('/api/resume/projects', 'POST', projects);
    
    // Test 5: Add achievements (instead of experience)
    const achievements = {
        achievements: [
            'Developed responsive web applications using React and TypeScript',
            'Collaborated with cross-functional teams to deliver high-quality software',
            'Optimized application performance resulting in 30% faster load times',
            'Led a team of 3 developers on a major project redesign'
        ]
    };
    await testEndpoint('/api/resume/achievements', 'POST', achievements);
    
    // Test 6: Add skills
    const skills = {
        skills: {
            'Programming Languages': ['JavaScript', 'TypeScript', 'Python', 'Java'],
            'Frontend': ['React', 'Vue.js', 'HTML5', 'CSS3', 'Tailwind CSS'],
            'Backend': ['Node.js', 'Express.js', 'Django', 'Spring Boot'],
            'Databases': ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis'],
            'Tools & Technologies': ['Git', 'Docker', 'AWS', 'Jenkins']
        }
    };
    await testEndpoint('/api/resume/skills', 'POST', skills);
    
    // Test 7: Get complete resume
    await testEndpoint('/api/resume/preview', 'POST');
    
    // Test 8: Generate PDF
    await testEndpoint('/api/resume/download');
    
    console.log('\n🎉 Testing Complete!');
}

runTests().catch(console.error);
