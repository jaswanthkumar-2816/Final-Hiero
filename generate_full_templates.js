// Comprehensive template viewer with full sample data
const jwt = require('jsonwebtoken');

// Create a test JWT token with the correct secret
const testPayload = {
  userId: 'testUser123',
  username: 'test@example.com'
};

const testToken = jwt.sign(testPayload, 'X7k9P!mQ2aL5vR8', { expiresIn: '1h' });

// Comprehensive sample data
const fullResumeData = {
  basic: {
    full_name: 'Alexandra Johnson',
    contact_info: {
      email: 'alexandra.johnson@email.com',
      phone: '+1 (555) 123-4567',
      linkedin: 'https://linkedin.com/in/alexandra-johnson',
      website: 'https://alexandra-portfolio.com',
      address: 'San Francisco, CA, USA'
    },
    career_objective: 'Experienced Full-Stack Developer with 5+ years of expertise in React, Node.js, and cloud technologies. Passionate about building scalable web applications and leading cross-functional teams to deliver innovative solutions that drive business growth.'
  },
  education: [
    {
      institution: 'Stanford University',
      degree: 'Master of Science in Computer Science',
      graduation_year: '2019',
      gpa: '3.9/4.0',
      details: 'Specialization in Machine Learning and Distributed Systems'
    },
    {
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science in Computer Engineering',
      graduation_year: '2017',
      gpa: '3.7/4.0',
      details: 'Magna Cum Laude, Dean\'s List (6 semesters)'
    }
  ],
  experience: [
    {
      company: 'TechCorp Inc.',
      position: 'Senior Full-Stack Developer',
      duration: '2021 - Present',
      location: 'San Francisco, CA',
      responsibilities: [
        'Led development of microservices architecture serving 10M+ users daily',
        'Reduced application load time by 40% through React optimization and CDN implementation',
        'Mentored 8 junior developers and established code review best practices',
        'Architected real-time notification system using WebSockets and Redis'
      ]
    },
    {
      company: 'StartupXYZ',
      position: 'Full-Stack Developer',
      duration: '2019 - 2021',
      location: 'Palo Alto, CA',
      responsibilities: [
        'Built responsive web applications using React, TypeScript, and Node.js',
        'Implemented RESTful APIs and GraphQL endpoints for mobile and web clients',
        'Deployed applications on AWS with CI/CD pipelines using Docker and Kubernetes',
        'Collaborated with product managers and designers in agile development cycles'
      ]
    },
    {
      company: 'Innovation Labs',
      position: 'Software Engineering Intern',
      duration: 'Summer 2018',
      location: 'Mountain View, CA',
      responsibilities: [
        'Developed machine learning models for predictive analytics using Python and TensorFlow',
        'Created data visualization dashboards with D3.js and React',
        'Optimized database queries resulting in 25% performance improvement'
      ]
    }
  ],
  projects: [
    {
      name: 'E-Commerce Platform',
      description: 'Full-stack e-commerce solution with payment integration, inventory management, and real-time analytics',
      duration: '6 months',
      year: '2023',
      technologies: 'React, Node.js, PostgreSQL, Stripe API, Docker',
      link: 'https://github.com/alexandra/ecommerce-platform'
    },
    {
      name: 'Task Management SaaS',
      description: 'Multi-tenant task management application with team collaboration features and advanced reporting',
      duration: '4 months',
      year: '2022',
      technologies: 'Vue.js, Express.js, MongoDB, Socket.io, AWS',
      link: 'https://github.com/alexandra/task-manager'
    },
    {
      name: 'AI-Powered Code Review Tool',
      description: 'Machine learning tool that automatically reviews code quality and suggests improvements',
      duration: '8 months',
      year: '2021',
      technologies: 'Python, TensorFlow, Flask, Redis, Docker',
      link: 'https://github.com/alexandra/ai-code-review'
    }
  ],
  skills: {
    technical: [
      'JavaScript/TypeScript', 'React', 'Node.js', 'Python', 'Java', 'Go',
      'PostgreSQL', 'MongoDB', 'Redis', 'AWS', 'Docker', 'Kubernetes',
      'Git', 'CI/CD', 'GraphQL', 'REST APIs', 'TensorFlow', 'Machine Learning'
    ],
    management: [
      'Team Leadership', 'Project Management', 'Agile/Scrum', 'Code Review',
      'Technical Mentoring', 'Cross-functional Collaboration', 'Product Strategy'
    ],
    soft: [
      'Problem Solving', 'Communication', 'Critical Thinking', 'Adaptability',
      'Time Management', 'Public Speaking', 'Stakeholder Management'
    ]
  },
  certifications: [
    {
      name: 'AWS Solutions Architect Professional',
      issuer: 'Amazon Web Services',
      year: '2023',
      details: 'Advanced certification in cloud architecture and best practices'
    },
    {
      name: 'Certified Kubernetes Administrator (CKA)',
      issuer: 'Cloud Native Computing Foundation',
      year: '2022',
      details: 'Expertise in Kubernetes cluster administration and orchestration'
    },
    {
      name: 'Google Cloud Professional Developer',
      issuer: 'Google Cloud',
      year: '2021',
      details: 'Proficiency in developing scalable applications on Google Cloud Platform'
    }
  ],
  achievements: [
    {
      title: 'Employee of the Year',
      description: 'Recognized for outstanding contribution to product development and team leadership',
      year: '2023',
      organization: 'TechCorp Inc.'
    },
    {
      title: 'Best Innovation Award',
      description: 'Led development of AI-powered feature that increased user engagement by 60%',
      year: '2022',
      organization: 'TechCorp Inc.'
    },
    {
      title: 'Hackathon Winner',
      description: 'First place in Stanford AI Hackathon for developing real-time language translation app',
      year: '2019',
      organization: 'Stanford University'
    }
  ],
  languages: [
    { name: 'English', proficiency: 'Native' },
    { name: 'Spanish', proficiency: 'Fluent' },
    { name: 'French', proficiency: 'Intermediate' },
    { name: 'Mandarin', proficiency: 'Basic' }
  ],
  hobbies: [
    'Open Source Contributing', 'Photography', 'Rock Climbing', 'Chess',
    'Cooking', 'Traveling', 'Reading Tech Blogs', 'Playing Guitar'
  ],
  personal_details: {
    date_of_birth: '1995-03-15',
    gender: 'Female',
    nationality: 'American',
    address: '1234 Market Street, Apt 567, San Francisco, CA 94102'
  },
  references: [
    {
      name: 'Dr. Sarah Chen',
      contact: 'sarah.chen@stanford.edu',
      relationship: 'Graduate Advisor',
      organization: 'Stanford University'
    },
    {
      name: 'Michael Rodriguez',
      contact: 'michael.r@techcorp.com',
      relationship: 'Direct Manager',
      organization: 'TechCorp Inc.'
    },
    {
      name: 'Jennifer Kim',
      contact: 'jen.kim@startupxyz.com',
      relationship: 'Former Team Lead',
      organization: 'StartupXYZ'
    }
  ]
};

const templates = [
  { id: 'professionalcv', name: 'Classic Professional' },
  { id: 'modernsimple', name: 'Modern Corporate' },
  { id: 'awesomecv', name: 'Creative Design' },
  { id: 'altacv', name: 'ATS-Friendly' },
  { id: 'deedycv', name: 'Student/Fresher' },
  { id: 'elegant', name: 'Executive/Managerial' },
  { id: 'functional', name: 'Functional (Skills-Based)' }
];

async function generateTemplateWithFullData(templateId, templateName, token) {
  try {
    console.log(`\n🎨 Generating ${templateName} (${templateId}) with full data...`);
    
    const response = await fetch('http://localhost:5003/api/resume/generate-fast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        template: templateId,
        ...fullResumeData
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ ${templateName}: PDF generated successfully`);
      console.log(`   📁 File: ${result.file}`);
      console.log(`   🔗 Download: http://localhost:5003/api/resume/download?file=${result.file}`);
      console.log(`   📄 Size: ${result.size || 'Unknown'}`);
      return { success: true, file: result.file, template: templateName };
    } else {
      console.log(`❌ ${templateName}: Failed - ${result.error}`);
      return { success: false, error: result.error, template: templateName };
    }
    
  } catch (error) {
    console.log(`💥 ${templateName}: Error - ${error.message}`);
    return { success: false, error: error.message, template: templateName };
  }
}

async function generateAllTemplatesWithFullData() {
  console.log('🎯 Generating all templates with comprehensive sample data...');
  console.log('👤 Using profile: Alexandra Johnson - Senior Full-Stack Developer');
  console.log('📊 Data includes: Education, Experience, Projects, Skills, Certifications, Achievements, Languages, etc.\n');
  
  const results = [];
  
  for (const template of templates) {
    const result = await generateTemplateWithFullData(template.id, template.name, testToken);
    results.push(result);
    
    // Wait a bit between generations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Generation Summary:');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successfully generated: ${successful.length}/${templates.length} templates`);
  
  if (successful.length > 0) {
    console.log('\n📄 Generated Files:');
    successful.forEach(result => {
      console.log(`   • ${result.template}: ${result.file}`);
    });
    
    console.log('\n🌐 To view/download files, visit:');
    successful.forEach(result => {
      console.log(`   • ${result.template}: http://localhost:5003/api/resume/download?file=${result.file}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed templates:');
    failed.forEach(result => {
      console.log(`   • ${result.template}: ${result.error}`);
    });
  }
  
  console.log('\n🎉 All templates generated with full professional data!');
  console.log('📁 Files are saved in the backend/temp directory');
  console.log('💡 You can now download and view each PDF to see the different template styles');
}

generateAllTemplatesWithFullData();
