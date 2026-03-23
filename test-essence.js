const { generateTemplateHTML } = require('./routes/templates');
const fs = require('fs');

const mockData = {
    personalInfo: {
        fullName: "SOUVIK KHAITAN",
        roleTitle: "Web Designer & Developer",
        email: "souvikkhaitan@gmail.com",
        phone: "+91 1234567890",
        address: "Kolkata, India",
        website: "souvik.dev",
        picture: "https://via.placeholder.com/150"
    },
    summary: "Creative-minded freelance designer with 5+ years of experience in creating beautiful user interfaces and high-performance applications.",
    experience: [
        { jobTitle: "Senior Web Designer", company: "Tech Innovations", startDate: "2021", endDate: "Present", description: "Lead designer for major client projects." },
        { jobTitle: "UI/UX Developer", company: "Creative Agency", startDate: "2018", endDate: "2021", description: "Developed responsive web interfaces." }
    ],
    education: [
        { school: "University of Technology", degree: "B.Tech in Computer Science", gradYear: "2018", gpa: "8.5" }
    ],
    skills: ["Photoshop", "Illustrator", "Figma", "HTML", "CSS", "JavaScript"],
    hobbies: ["Photography", "Gaming", "Music"]
};

try {
    const html = generateTemplateHTML('hiero-essence', mockData);
    fs.writeFileSync('test-essence.html', html);
    console.log("✅ Hiero Essence template generated successfully to test-essence.html");
} catch (err) {
    console.error("❌ Template generation failed:", err);
}
