export function generateHieroApexTemplate(data) {
    const {
        personalInfo = {},
        summary = '',
        education = [],
        experience = [],
        skills = [],
        technicalSkills = '',
        profileImage = ''
    } = data;

    // Helper functions
    const getArr = (v) => {
        if (!v) return [];
        if (Array.isArray(v)) return v;
        if (typeof v === 'string') return v.split(/[,|\n]/).map(s => s.trim()).filter(Boolean);
        return [];
    };

    const name = (personalInfo.fullName || data.full_name || 'THEO CLARKSON').toUpperCase();
    const role = (personalInfo.roleTitle || data.jobTitle || data.job_title || 'PROFESSIONAL TITLE').toUpperCase();
    const email = personalInfo.email || data.email || 'theo@gmail.com';
    const phone = personalInfo.phone || data.phone || '033-444-5555';
    const location = personalInfo.address || data.address || data.location || 'Your City, State';
    const linkedin = personalInfo.linkedin || data.linkedin || 'linkedin.com/in/theoclarkson';
    
    // Parse skills or technicalSkills into an array of strings
    let skillList = getArr(skills);
    if (!skillList.length) skillList = getArr(data.skills_list);
    if (!skillList.length) skillList = getArr(technicalSkills);
    if (!skillList.length) skillList = ['Process Improvement', 'Problem Solving', 'Decision Making', 'CRM Software', 'Asana', 'Bitrix24'];

    const photo = personalInfo.profilePhoto || profileImage || data.profile_image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80';

    const defaultEdu = [
        { degree: 'MASTER OF BUSINESS ADMINISTRATION', school: 'University, Location', gradYear: 'Graduation Year', institution: 'University', year: '2020' },
        { degree: 'BACHELOR OF SCIENCE IN BUSINESS MANAGEMENT', school: 'University, Location', gradYear: 'Graduation Year', institution: 'University', year: '2018' }
    ];
    const eduList = education.length > 0 ? education : defaultEdu;

    const defaultExp = [
        { jobTitle: 'POSITION TITLE HERE', company: 'Company, Location', startDate: 'Date', endDate: 'Date', description: 'Tailor your resume for each job, even within the same field, to emphasize the most relevant qualifications and experience for that specific role.\n• This customization shows employers that you\'re engaged, detail-oriented, and genuinely interested in their position.\n• Use keywords and phrases from the job posting to increase your chances of passing Applicant Tracking Systems (ATS).\n• Keep bullet points concise—ideally no longer than two to three lines—to improve clarity and readability' },
        { jobTitle: 'POSITION TITLE HERE', company: 'Company, Location', startDate: 'Date', endDate: 'Date', description: '• Start each bullet point with a strong action verb like "led," "managed," "increased," or "implemented" to convey impact.\n• Include only the most recent and relevant experience; avoid listing every job you\'ve had unless it supports your current goal.\n• Use present tense for your current role and past tense for previous positions to clearly show your career progression' },
        { jobTitle: 'POSITION TITLE HERE', company: 'Company, Location', startDate: 'Date', endDate: 'Date', description: '• Organize your work history in reverse chronological order to help employers quickly see your most experience.\n• Highlight 3-4 key roles or experiences that best match the job you\'re applying for, focusing on achievements and responsibilities that directly align with the employer\'s requirements.' }
    ];
    const expBase = data.work_experience && data.work_experience.length > 0 ? data.work_experience : experience;
    const expList = expBase.length > 0 ? expBase : defaultExp;

    const profSummary = summary || 'A strong professional summary should emphasize your key achievements and the value they bring to the company. Create a focused personal branding statement that showcases your unique strengths, skills and experience.';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hiero Apex Resume</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        @page {
            size: A4;
            margin: 0;
        }

        body {
            font-family: 'Inter', Helvetica, Arial, sans-serif;
            background-color: #FFFFFF;
            color: #222222;
            width: 794px;
            height: 1123px;
            margin: 0 auto;
            position: relative;
            overflow: hidden;
            padding: 40px;
        }

        /* HEADER */
        .header {
            width: 100%;
            margin-bottom: 24px;
        }

        .name {
            font-size: 34px;
            font-weight: 700;
            letter-spacing: 3px;
            text-transform: uppercase;
            margin-bottom: 16px;
        }

        .h-line {
            width: 100%;
            height: 1px;
            background-color: #DADADA;
            margin-bottom: 16px;
        }

        .role {
            font-size: 16px;
            font-weight: 500;
            letter-spacing: 4px;
            text-transform: uppercase;
            margin-bottom: 16px;
        }

        /* MAIN CONTENT */
        .main-content {
            display: flex;
            width: 100%;
            height: calc(100% - 130px);
        }

        /* DIVIDER */
        .v-line {
            width: 1px;
            height: 100%;
            background-color: #DADADA;
        }

        /* LEFT COLUMN */
        .col-left {
            width: 30%;
            padding-right: 20px;
            display: flex;
            flex-direction: column;
        }

        /* RIGHT COLUMN */
        .col-right {
            width: 70%;
            padding-left: 20px;
            display: flex;
            flex-direction: column;
        }

        /* TYPOGRAPHY & SPACING */
        .section-title {
            font-size: 13px;
            font-weight: 500;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 10px;
            color: #222222;
        }

        .section {
            margin-bottom: 24px;
        }

        .divider {
            width: 100%;
            height: 1px;
            background-color: #DADADA;
            margin: 16px 0 24px 0;
        }

        p, li, .text-body {
            font-size: 13px;
            line-height: 1.5;
            color: #222222;
            margin-bottom: 8px;
        }

        /* PROFILE IMAGE */
        .profile-img-container {
            width: 140px;
            height: 140px;
            margin-bottom: 24px;
            background-color: #f0f0f0;
        }
        
        .profile-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
        }

        /* CONTACT */
        .contact-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            font-size: 12px;
            line-height: 1.5;
        }
        .contact-icon {
            width: 14px;
            height: 14px;
            margin-right: 8px;
            flex-shrink: 0;
        }
        .contact-icon svg {
            width: 100%;
            height: 100%;
            fill: #222222;
        }

        /* SKILLS */
        .skills-list {
            list-style: none;
        }
        .skills-list li {
            margin-bottom: 6px;
        }

        /* EDUCATION */
        .edu-item {
            margin-bottom: 16px;
        }
        .edu-degree {
            font-weight: 700;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .edu-school {
            font-size: 13px;
            margin-bottom: 2px;
        }
        .edu-year {
            font-size: 13px;
            color: #555555;
        }

        /* EXPERIENCE */
        .exp-item {
            margin-bottom: 24px;
        }
        .exp-role {
            font-weight: 700;
            font-size: 13px;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .exp-meta {
            font-style: italic;
            font-size: 13px;
            color: #555555;
            margin-bottom: 8px;
        }
        .exp-desc {
            font-size: 13px;
            line-height: 1.5;
        }
        .exp-desc p {
            margin-bottom: 4px;
        }
        .exp-desc ul {
            padding-left: 16px;
            margin-top: 4px;
        }
        .exp-desc ul li {
            list-style-type: disc;
            margin-bottom: 4px;
        }

    </style>
</head>
<body>
    <div class="header">
        <div class="name">${name}</div>
        <div class="h-line"></div>
        <div class="role">${role}</div>
        <div class="h-line"></div>
    </div>

    <div class="main-content">
        <!-- LEFT COLUMN -->
        <div class="col-left">
            <div class="profile-img-container">
                <img src="${photo}" alt="Profile" class="profile-img">
            </div>

            <div class="section">
                <div class="section-title">CONTACT</div>
                ${phone ? `
                <div class="contact-item">
                    <div class="contact-icon">
                        <svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                    </div>
                    <span>${phone}</span>
                </div>
                ` : ''}
                ${email ? `
                <div class="contact-item">
                    <div class="contact-icon">
                        <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                    </div>
                    <span>${email}</span>
                </div>
                ` : ''}
                ${location ? `
                <div class="contact-item">
                    <div class="contact-icon">
                        <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    </div>
                    <span>${location}</span>
                </div>
                ` : ''}
                ${linkedin ? `
                <div class="contact-item">
                    <div class="contact-icon">
                        <svg viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-1.85 0-2.59 1.05-3 1.63v-1.39h-2.92v8.32h2.92v-4.5c0-1.16.23-2.28 1.66-2.28 1.41 0 1.41 1.32 1.41 2.36v4.42h2.92zM6.8 8.6c.92 0 1.6-.68 1.6-1.6 0-.89-.68-1.57-1.6-1.57-.92 0-1.6.68-1.6 1.57 0 .92.68 1.6 1.6 1.6zm-1.46 9.9h2.92v-8.32H5.34v8.32z"/></svg>
                    </div>
                    <span>${linkedin.replace(/^https?:\/\/(www\.)?/, '')}</span>
                </div>
                ` : ''}
            </div>

            <div class="divider"></div>

            <div class="section">
                <div class="section-title">SKILLS</div>
                <ul class="skills-list">
                    ${skillList.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>

            <div class="divider"></div>

            <div class="section">
                <div class="section-title">EDUCATION</div>
                ${eduList.map(edu => `
                <div class="edu-item">
                    <div class="edu-degree">| ${edu.degree || ''}</div>
                    <div class="edu-school">${edu.school || edu.institution || ''}</div>
                    <div class="edu-year">${edu.gradYear || edu.year || ''}</div>
                </div>
                `).join('')}
            </div>
        </div>
        
        <div class="v-line"></div>

        <!-- RIGHT COLUMN -->
        <div class="col-right">
            <div class="section">
                <div class="section-title">PROFESSIONAL SUMMARY</div>
                <div class="text-body">${profSummary}</div>
            </div>

            <div class="divider"></div>

            <div class="section">
                <div class="section-title">WORK EXPERIENCE</div>
                ${expList.map(exp => `
                <div class="exp-item">
                    <div class="exp-role">${exp.jobTitle || exp.role || ''}</div>
                    <div class="exp-meta">${exp.company || ''} | ${exp.duration || (exp.startDate + ' - ' + (exp.endDate || 'Present')) || ''}</div>
                    <div class="exp-desc">
                        ${exp.points && Array.isArray(exp.points) ? `
                            <ul>
                                ${exp.points.map(p => `<li>${p}</li>`).join('')}
                            </ul>
                        ` : exp.description ? `
                            ${exp.description.includes('•') || exp.description.includes('- ') ? 
                                '<ul>' + exp.description.split('\n').filter(l => l.trim()).map(line => {
                                    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                                        return `<li>${line.replace(/^[\*\-•]\s*/, '')}</li>`;
                                    }
                                    return `<li>${line}</li>`;
                                }).join('') + '</ul>'
                            : `<p>${exp.description}</p>`}
                        ` : ''}
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
    </div>
</body>
</html>
    `;
}
