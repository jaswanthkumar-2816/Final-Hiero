
const fs = require('fs');
const path = require('path');
const { generateUnifiedResume } = require('./routes/unifiedTemplates');

const testData = {
    name: "RAHUL MEHTA",
    role: "Data Scientist",
    summary: "Data Scientist with 2+ years of experience in predictive modeling, machine learning, and data analytics. Skilled in analyzing complex datasets, building end-to-end ML models, and communicating insights to business teams. Strong expertise in Python, statistics, A/B testing, and data visualization. Passionate about solving business problems using data-driven approaches.",
    personalInfo: {
        fullName: "RAHUL MEHTA",
        roleTitle: "Data Scientist",
        summary: "Data Scientist with 2+ years of experience in predictive modeling, machine learning, and data analytics. Skilled in analyzing complex datasets, building end-to-end ML models, and c",
        phone: "+1 555-0199",
        email: "john.doe@hiero.com",
        address: "San Francisco, CA"
    },
    contact: {
        phone: "+1 555-0199",
        email: "john.doe@hiero.com",
        location: "San Francisco, CA"
    },
    experience: [
        {
            jobTitle: "Senior Developer",
            company: "Tech Solutions Inc.",
            startDate: "2020",
            endDate: "Present",
            description: "Lead development of core banking platform.\nManaged a team of 15 engineers.\nImplemented CI/CD pipelines."
        },
        {
            jobTitle: "Full Stack Engineer",
            company: "StartUp Hub",
            startDate: "2018",
            endDate: "2020",
            description: "Built the initial MVP using React and Node.js.\nScaled user base from 0 to 100k."
        }
    ],
    education: [
        {
            degree: "B.S. Computer Science",
            school: "Stanford University",
            gradYear: "2018"
        }
    ],
    skills: [
        { name: "JavaScript", level: 95 },
        { name: "Node.js", level: 90 },
        { name: "React", level: 92 },
        { name: "Cloud Architecture", level: 85 }
    ],
    technicalSkills: "Python, AWS, Docker, MongoDB",
    softSkills: "Leadership, Communication, Teamwork",
    awards: [
        "Employee of the Year 2022",
        "Open Source Contributor Award"
    ]
};

async function runVerification() {
    const templates = ['hiero-design', 'hiero-modern-brown', 'hiero-premium'];

    for (const template of templates) {
        console.log(`Generating ${template}...`);
        const outPath = path.join(__dirname, `verify_${template}.pdf`);
        const stream = fs.createWriteStream(outPath);

        try {
            await generateUnifiedResume(testData, template, stream);
            console.log(`Successfully generated ${outPath}`);

            // Check file size and estimate pages (crude check)
            const stats = fs.statSync(outPath);
            console.log(`Size: ${stats.size} bytes`);
        } catch (err) {
            console.error(`Error generating ${template}:`, err);
        }
    }
}

runVerification();
