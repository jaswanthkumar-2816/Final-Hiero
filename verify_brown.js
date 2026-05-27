const fs = require('fs');
const path = require('path');
const { generateUnifiedResume } = require('./routes/unifiedTemplates.js');

const mockData = {
    name: "Jaswanth Kumar",
    role: "Full Stack Developer",
    summary: "Creative and efficient developer with 3+ years of experience in building modern web applications. Specialized in high-performance backend systems and elegant frontend interfaces.",
    contact: {
        phone: "+91 9876543210",
        email: "jaswanth@example.com",
        location: "Hyderabad, India"
    },
    personalInfo: {
        fullName: "Jaswanth Kumar",
        roleTitle: "Full Stack Developer",
        phone: "+91 9876543210",
        email: "jaswanth@example.com",
        address: "Hyderabad, India",
        linkedin: "linkedin.com/in/jaswanth",
        website: "jaswanth.dev"
    },
    experience: [
        {
            jobTitle: "Senior Developer",
            company: "Tech Solutions",
            startDate: "Jan 2021",
            endDate: "Present",
            description: "Led the development of a high-traffic e-commerce platform.\nOptimized backend performance by 40%.\nMentored junior developers and implemented best practices."
        },
        {
            jobTitle: "Frontend Engineer",
            company: "Web Craft",
            startDate: "June 2019",
            endDate: "Dec 2020",
            description: "Built responsive user interfaces using React and Tailwind CSS.\nImproved page load speed by 30% through code splitting."
        }
    ],
    education: [
        {
            degree: "B.Tech in Computer Science",
            school: "ABC University",
            gradYear: "2019"
        }
    ],
    skills: [
        { name: "JavaScript", level: 90 },
        { name: "Node.js", level: 85 },
        { name: "React", level: 80 },
        { name: "PDFKit", level: 95 },
        { name: "Python", level: 75 }
    ]
};

async function test() {
    console.log("Testing Hiero Modern Brown...");
    const stream1 = fs.createWriteStream('hiero-modern-brown-test.pdf');
    try {
        await generateUnifiedResume(mockData, 'hiero-modern-brown', stream1);
        console.log("✅ Hiero Modern Brown PDF generated successfully.");
    } catch (err) {
        console.error("❌ Failed to generate Hiero Modern Brown:", err);
    }

    console.log("Testing Hiero Creative Brown...");
    const stream2 = fs.createWriteStream('hiero-creative-brown-test.pdf');
    try {
        await generateUnifiedResume(mockData, 'hiero-creative-brown', stream2);
        console.log("✅ Hiero Creative Brown PDF generated successfully.");
    } catch (err) {
        console.error("❌ Failed to generate Hiero Creative Brown:", err);
    }

    console.log("\nDone. Please check the following files:");
    console.log("- hiero-modern-brown-test.pdf");
    console.log("- hiero-creative-brown-test.pdf");
}

test().catch(console.error);
