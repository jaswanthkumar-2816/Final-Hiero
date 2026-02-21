const { generateUnifiedResume } = require('./routes/unifiedTemplates');
const fs = require('fs');

const mockData = {
    personalInfo: {
        fullName: "SOUVIK KHAITAN",
        email: "souvikkhaitan@gmail.com",
        phone: "+91 1234567890",
        address: "Kolkata, India",
        linkedin: "linkedin.com/in/souvik",
        website: "souvik.dev"
    },
    experience: [
        {
            jobTitle: "Senior Web Designer",
            company: "Tech Innovations",
            startDate: "2021",
            endDate: "Present",
            description: "Lead designer for major client projects using modern technologies.\nBuilt highly performant and scalable web applications."
        },
        {
            jobTitle: "UI/UX Developer",
            company: "Creative Agency",
            startDate: "2018",
            endDate: "2021",
            description: "Developed responsive web interfaces with focus on user experience."
        }
    ],
    education: [
        { school: "University of Technology", degree: "B.Tech in Computer Science", gradYear: "2018", gpa: "8.5" }
    ],
    skills: ["HTML", "CSS", "JavaScript", "React", "Node.js", "Figma", "Photoshop"],
    summary: "Creative-minded freelance designer with 5+ years of experience in creating beautiful user interfaces and high-performance applications."
};

async function testPDF() {
    try {
        const out = fs.createWriteStream('test-essence.pdf');
        await generateUnifiedResume(mockData, 'hiero-essence', out);
        console.log("✅ Hiero Essence PDF generated successfully to test-essence.pdf");
    } catch (err) {
        console.error("❌ PDF generation failed:", err);
    }
}

testPDF();
