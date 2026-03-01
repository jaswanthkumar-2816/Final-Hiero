const fs = require('fs');
const path = require('path');

// Mocking the parseResumeText function from import-service.js
// I'll copy the logic here or just require it if possible.
// Since import-service.js uses require, I can just require it if I mock express.

const importService = require('./routes/import-service.js');

// We need to access parseResumeText. It's not exported. 
// I'll have to read the file and eval it or just copy the function.
// For a quick test, I'll copy the function logic.

function normalizeText(text) {
    if (!text) return '';
    return text.replace(/[•►▪■●·–—*]/g, '-').replace(/\u00A0/g, ' ').replace(/\r\n/g, '\n').replace(/\n{2,}/g, '\n').replace(/[ ]{2,}/g, ' ').trim();
}

function parseResumeText(rawText) {
    const text = normalizeText(rawText);
    const data = {
        personalInfo: { fullName: '', email: '', phone: '', address: '', linkedin: '', website: '' },
        summary: '',
        experience: [],
        education: [],
        projects: [],
        technicalSkills: '',
        softSkills: '',
        certifications: [],
        achievements: '',
        languages: [],
        hobbies: '',
        customSectionContent: '' // FALLBACK BUCKET
    };

    if (!text) return data;

    const cleanLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // --- 1. Contact Info ---
    const emailMatch = text.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/);
    if (emailMatch) data.personalInfo.email = emailMatch[0];
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) data.personalInfo.phone = phoneMatch[0];
    const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+/i);
    if (linkedinMatch) data.personalInfo.linkedin = linkedinMatch[0];

    // --- 2. Name Extraction (Improved Logic) ---
    for (let i = 0; i < Math.min(6, cleanLines.length); i++) {
        let line = cleanLines[i];
        if (line.includes('@') || line.match(/\d{4}/) || line.length < 3) continue;
        let clean = line.replace(/^[\s\$#>\*\u2022\-\+]+|whoami:?|name:?|resume:?/i, '').trim();
        if (clean.length > 3 && clean.length < 45 && !clean.match(/\d/)) {
            data.personalInfo.fullName = clean;
            break;
        }
    }

    // --- 3. Sectioning with Strict Boundaries ---
    const sections = { experience: [], education: [], skills: [], projects: [], summary: [], certifications: [], achievements: [], languages: [], fallback: [] };
    let currentSection = null;
    const hMap = {
        experience: /^(experience|employment|work history|professional background|career history|employment history|work experience)$/i,
        education: /^(education|academic|qualifications|academic background|studies)$/i,
        skills: /^(skills|technologies|technical stack|competencies|expertise|tools|tech stack|technical skills)$/i,
        projects: /^(projects|portfolio|personal projects|key projects)$/i,
        summary: /^(summary|profile|objective|about me|professional summary|professional profile|carrier objective)$/i,
        certifications: /^(certifications|credentials|licenses|courses|certificates)$/i,
        achievements: /^(achievements|awards|honors|extracurricular|academic achievements)$/i,
        languages: /^(languages)$/i
    };

    cleanLines.forEach(line => {
        const norm = line.replace(/[^a-zA-Z\s]/g, '').trim();
        let isHeader = false;
        for (const [key, pattern] of Object.entries(hMap)) {
            if (pattern.test(norm) && norm.length < 35 && norm.length > 3) {
                currentSection = key; isHeader = true; break;
            }
        }
        if (!isHeader) {
            if (currentSection) sections[currentSection].push(line);
            else sections.fallback.push(line);
        }
    });

    data.summary = sections.summary.join(' ').slice(0, 800).trim();
    if (sections.skills.length > 0) data.technicalSkills = sections.skills.join(', ');
    data.customSectionContent = sections.fallback.join('\n').trim();

    const jobTitleKeywords = /engineer|developer|manager|lead|intern|analyst|specialist|consultant|architect|designer|programmer|coordinator|officer/i;
    const degreeKeywords = /bachelor|master|phd|diploma|degree|B\.S\.|M\.S\.|B\.Tech|M\.Tech|M\.B\.A\./i;
    const schoolKeywords = /university|college|school|institute|polytechnic|academy/i;
    const dateRegexStr = '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?[\\s\\/]?\\d{2,4}|\\d{1,2}\\/\\d{2,4}|\\d{4}(?:-\\d{2,4})?|Present|Current';
    const dateRangeRegex = new RegExp(`(${dateRegexStr})\\s*(?:-|to|–|—|through)\\s*(${dateRegexStr})`, 'i');

    // --- 4. Experience (Enhanced State Machine) ---
    let expItem = null;
    sections.experience.forEach(line => {
        const clean = line.replace(/^[\s•\-\+\*#>]+\s*/, '').trim();
        const dateMatch = clean.match(dateRangeRegex);
        const hasTitle = jobTitleKeywords.test(clean) && !clean.match(/team of|of \d+/i);
        const isBullet = /^[\s•\-\+\*]/.test(line);

        if (!expItem || (hasTitle && expItem.jobTitle && expItem.jobTitle !== 'Professional Role')) {
            if (expItem) data.experience.push(expItem);
            expItem = { jobTitle: hasTitle ? clean.replace(dateRangeRegex, '').replace(/[|•-]/g, '').trim() : 'Professional Role', company: '', startDate: dateMatch ? dateMatch[1] : '', endDate: dateMatch ? dateMatch[2] : '', description: '' };
        } else {
            if (dateMatch && !expItem.startDate) { expItem.startDate = dateMatch[1]; expItem.endDate = dateMatch[2]; }
            else if (hasTitle && expItem.jobTitle === 'Professional Role') { expItem.jobTitle = clean.replace(dateRangeRegex, '').replace(/[|•-]/g, '').trim(); }
            else if (!expItem.company && clean.length < 50 && !isBullet && !dateMatch && !clean.match(/[.,]/)) { expItem.company = clean; }
            else { expItem.description += clean + ' '; }
        }
    });
    if (expItem) data.experience.push(expItem);

    // --- 5. Education ---
    let eduItem = null;
    sections.education.forEach(line => {
        const clean = line.replace(/^[\s•\-\+\*#>]+\s*/, '').trim();
        const hasDegree = degreeKeywords.test(clean);
        const hasSchool = schoolKeywords.test(clean);
        const hasYear = clean.match(/\d{4}/);

        const shouldStartNew = !eduItem || (hasDegree && eduItem.degree && eduItem.school !== 'Educational Institution');

        if (shouldStartNew) {
            if (eduItem) data.education.push(eduItem);
            eduItem = { school: hasSchool ? clean.replace(/\d{4}.*/g, '').trim() : 'Educational Institution', degree: hasDegree ? clean : '', gradYear: hasYear ? hasYear[0] : '', gpa: clean.match(/GPA:\s*(\d\.\d+)/i)?.[1] || '' };
        } else {
            if (hasDegree && !eduItem.degree) eduItem.degree = clean;
            if (hasSchool && (eduItem.school === 'Educational Institution' || eduItem.school.length < clean.length)) eduItem.school = clean;
            if (hasYear && !eduItem.gradYear) eduItem.gradYear = hasYear[0];
            const gpaMatch = clean.match(/GPA:\s*(\d\.\d+)/i);
            if (gpaMatch) eduItem.gpa = gpaMatch[1];
        }
    });
    if (eduItem) data.education.push(eduItem);

    data.experience = data.experience.filter(item => item.jobTitle !== 'Professional Role' || item.company || item.startDate);
    if (!data.personalInfo.fullName && cleanLines.length > 0) data.personalInfo.fullName = cleanLines[0].replace(/^\W+/, '').trim();

    return data;
}

// TEST CASES
const testResumes = [
    {
        name: "Standard Resume",
        text: `John Doe
john.doe@email.com | (555) 123-4567
San Francisco, CA

PROFESSIONAL SUMMARY
Dynamic software engineer with experience in cloud computing.

WORK EXPERIENCE
Senior Software Engineer
Google
Jan 2020 - Present
- Led the cloud team
- Optimized API performance by 30%

Software Intern
Microsoft
Jun 2018 - Dec 2018
- Developed internal tools

EDUCATION
Bachelor of Science in Computer Science
Stanford University
2014 - 2018
GPA: 3.9

TECHNICAL SKILLS
JavaScript, Node.js, React, AWS, Docker

PROJECTS
Hiero Resume Builder
React, Node.js
- Built a smart resume parser

CERTIFICATIONS
AWS Certified Solutions Architect
`
    },
    {
        name: "Complex Dates & No Header",
        text: `Jane Smith
jane.smith@example.com
555-987-6543
linkedin.com/in/janesmith

Summary:
Marketing professional with 10 years of experience.

Employment History:
Marketing Manager | 05/2015 to 08/2021 | Acme Corp
Managed a team of 5.

Education:
MBA - Harvard University (2014)
`
    }
];

testResumes.forEach(test => {
    console.log(`\n--- Testing: ${test.name} ---`);
    const result = parseResumeText(test.text);
    console.log(JSON.stringify(result, null, 2));
});
