// Generate resume for Chaitanya Reddy N
const jwt = require('jsonwebtoken');

// Create a test JWT token with the correct secret
const testPayload = {
  userId: 'chaitanyaUser123',
  username: 'chaitanya.reddy@email.com'
};

const testToken = jwt.sign(testPayload, 'X7k9P!mQ2aL5vR8', { expiresIn: '1h' });

// Resume data for Chaitanya Reddy N
const chaitanyaResumeData = {
  basic: {
    full_name: 'Chaitanya Reddy N',
    contact_info: {
      email: 'chaitanya.reddy@email.com',
      phone: '+91 9876543210',
      linkedin: 'https://linkedin.com/in/chaitanya-reddy-n',
      website: 'https://chaitanya-portfolio.com',
      address: 'Hyderabad, Telangana, India'
    },
    career_objective: 'Dynamic software engineer with expertise in full-stack development and cloud technologies. Passionate about building scalable applications and contributing to innovative software solutions that drive business growth and user satisfaction.'
  },
  education: [
    {
      institution: 'Indian Institute of Technology (IIT) Hyderabad',
      degree: 'Bachelor of Technology in Computer Science',
      graduation_year: '2022',
      gpa: '8.7/10.0',
      details: 'Specialized in Software Engineering and Data Structures'
    },
    {
      institution: 'Narayana Junior College',
      degree: 'Intermediate (MPC)',
      graduation_year: '2018',
      gpa: '95%',
      details: 'Mathematics, Physics, Chemistry'
    }
  ],
  experience: [
    {
      company: 'Tech Mahindra',
      position: 'Software Engineer',
      duration: '2022 - Present',
      location: 'Hyderabad, India',
      responsibilities: [
        'Developed and maintained web applications using React.js and Node.js',
        'Implemented RESTful APIs and integrated third-party services',
        'Collaborated with cross-functional teams in agile development environment',
        'Optimized application performance resulting in 30% faster load times'
      ]
    },
    {
      company: 'Infosys',
      position: 'Software Engineering Intern',
      duration: 'Summer 2021',
      location: 'Bangalore, India',
      responsibilities: [
        'Built responsive web interfaces using HTML, CSS, and JavaScript',
        'Participated in code reviews and followed best practices',
        'Assisted in database design and query optimization',
        'Contributed to documentation and testing procedures'
      ]
    }
  ],
  projects: [
    {
      name: 'E-Learning Platform',
      description: 'Full-stack web application for online learning with video streaming and progress tracking',
      duration: '4 months',
      year: '2023',
      technologies: 'React, Node.js, MongoDB, AWS S3, Socket.io',
      link: 'https://github.com/chaitanya/elearning-platform'
    },
    {
      name: 'Smart Attendance System',
      description: 'AI-powered attendance tracking system using facial recognition and real-time analytics',
      duration: '3 months',
      year: '2022',
      technologies: 'Python, OpenCV, Flask, PostgreSQL, Docker',
      link: 'https://github.com/chaitanya/smart-attendance'
    },
    {
      name: 'Weather Monitoring IoT',
      description: 'IoT-based weather monitoring system with real-time data visualization dashboard',
      duration: '2 months',
      year: '2021',
      technologies: 'Arduino, Python, React, Firebase, Chart.js',
      link: 'https://github.com/chaitanya/weather-iot'
    }
  ],
  skills: {
    technical: [
      'JavaScript', 'Python', 'Java', 'React.js', 'Node.js', 'Express.js',
      'MongoDB', 'PostgreSQL', 'MySQL', 'AWS', 'Docker', 'Git',
      'HTML/CSS', 'Bootstrap', 'REST APIs', 'GraphQL', 'Redis', 'Linux'
    ],
    management: [
      'Team Collaboration', 'Project Management', 'Agile/Scrum', 
      'Problem Solving', 'Code Review', 'Technical Documentation'
    ],
    soft: [
      'Communication', 'Leadership', 'Critical Thinking', 'Adaptability',
      'Time Management', 'Continuous Learning', 'Attention to Detail'
    ]
  },
  certifications: [
    {
      name: 'AWS Certified Developer Associate',
      issuer: 'Amazon Web Services',
      year: '2023',
      details: 'Expertise in developing and maintaining applications on AWS platform'
    },
    {
      name: 'MongoDB Certified Developer',
      issuer: 'MongoDB Inc.',
      year: '2022',
      details: 'Proficiency in MongoDB database design and development'
    }
  ],
  achievements: [
    {
      title: 'Best Project Award',
      description: 'Recognized for outstanding final year project on Smart Attendance System',
      year: '2022',
      organization: 'IIT Hyderabad'
    },
    {
      title: 'Hackathon Winner',
      description: 'First place in Tech Mahindra Internal Hackathon for innovative web solution',
      year: '2023',
      organization: 'Tech Mahindra'
    }
  ],
  languages: [
    { name: 'English', proficiency: 'Fluent' },
    { name: 'Telugu', proficiency: 'Native' },
    { name: 'Hindi', proficiency: 'Intermediate' }
  ],
  hobbies: [
    'Coding', 'Reading Tech Blogs', 'Playing Cricket', 'Traveling',
    'Photography', 'Learning New Technologies', 'Open Source Contributing'
  ],
  personal_details: {
    date_of_birth: '2000-05-15',
    gender: 'Male',
    nationality: 'Indian',
    address: 'H.No 123, Madhapur, Hyderabad, Telangana - 500081'
  },
  references: [
    {
      name: 'Dr. Rajesh Kumar',
      contact: 'rajesh.kumar@iith.ac.in',
      relationship: 'Academic Supervisor',
      organization: 'IIT Hyderabad'
    },
    {
      name: 'Priya Sharma',
      contact: 'priya.sharma@techmahindra.com',
      relationship: 'Team Lead',
      organization: 'Tech Mahindra'
    }
  ]
};

async function generateChaitanyaResume() {
  try {
    console.log('🎯 Generating resume for Chaitanya Reddy N...');
    console.log('👤 Profile: Software Engineer at Tech Mahindra');
    console.log('🎓 Education: B.Tech CSE from IIT Hyderabad');
    
    // Using the Modern Corporate template as it's good for tech professionals
    const response = await fetch('http://localhost:5003/api/resume/generate-fast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify({
        template: 'modernsimple', // Modern Corporate template
        ...chaitanyaResumeData
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Resume generated successfully!');
      console.log(`📁 File: ${result.file}`);
      console.log(`🔗 Download URL: http://localhost:5003/api/resume/download?file=${result.file}`);
      
      return result.file;
    } else {
      console.log(`❌ Generation failed: ${result.error}`);
      return null;
    }
    
  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
    return null;
  }
}

// Generate the resume and copy to easy access location
generateChaitanyaResume().then(async (filename) => {
  if (filename) {
    console.log('\n📋 Resume Details for Chaitanya Reddy N:');
    console.log('• Name: Chaitanya Reddy N');
    console.log('• Position: Software Engineer at Tech Mahindra');
    console.log('• Education: B.Tech CSE from IIT Hyderabad (8.7 CGPA)');
    console.log('• Experience: 2+ years in full-stack development');
    console.log('• Skills: React.js, Node.js, Python, AWS, MongoDB');
    console.log('• Location: Hyderabad, Telangana, India');
    console.log('\n🎉 Resume ready for download!');
  }
});
