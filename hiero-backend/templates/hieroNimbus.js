export function generateHieroNimbusTemplate(data) {
    const {
        personalInfo = {},
        summary = '',
        education = [],
        experience = [],
        skills = [],
        technicalSkills = '',
        interests = ''
    } = data;

    // Helper functions
    const getArr = (v) => {
        if (!v) return [];
        if (Array.isArray(v)) return v;
        if (typeof v === 'string') return v.split(/[,|\n]/).map(s => s.trim()).filter(Boolean);
        return [];
    };

    const firstName = personalInfo.firstName || (data.full_name ? data.full_name.split(' ')[0] : 'Chanchal');
    const lastName = personalInfo.lastName || (data.full_name ? data.full_name.split(' ').slice(1).join(' ') : 'Sharma');
    
    // In case no first/last was provided but a fullName was, handle it.
    let fName = firstName;
    let lName = lastName;
    if (!personalInfo.firstName && !personalInfo.lastName && personalInfo.fullName) {
        const parts = personalInfo.fullName.split(' ');
        fName = parts[0];
        lName = parts.slice(1).join(' ');
    }

    const role = (personalInfo.roleTitle || data.jobTitle || data.job_title || 'OFFICE MANAGER').toUpperCase();
    const email = personalInfo.email || data.email || 'sharma@example.com';
    const phone = personalInfo.phone || data.phone || '(718) 555-0100';
    const linkedin = personalInfo.linkedin || data.linkedin || 'LinkedIn profile';
    
    let skillList = getArr(skills);
    if (!skillList.length) skillList = getArr(data.skills_list);
    if (!skillList.length) skillList = getArr(technicalSkills);
    if (!skillList.length) skillList = ['Data analysis', 'Project management', 'Communication', 'Organization', 'Problem solving'];

    const defaultEdu = [
        { degree: 'A.S. H.R. Management', school: 'Bellows College', gradYear: 'Sep 20XX - May 20XX', startDate: 'Sep 20XX', endDate: 'May 20XX' }
    ];
    const eduList = education.length > 0 ? education : defaultEdu;

    const defaultExp = [
        { jobTitle: 'Office manager', company: 'The Phone Company', startDate: 'Jan 20XX', endDate: 'Current', description: 'Summarize your key responsibilities and accomplishments. Where appropriate, use the language and words you find in the specific job description. Be concise, targeting 3-5 key areas.' },
        { jobTitle: 'Office manager', company: 'Nod Publishing', startDate: 'Mar 20XX', endDate: 'Dec 20XX', description: 'Summarize your key responsibilities and accomplishments. Here again, take any opportunity to use words you find in the job description. Be brief.' },
        { jobTitle: 'Office manager', company: 'Southridge Video', startDate: 'Aug 20XX', endDate: 'Mar 20XX', description: 'Summarize your key responsibilities and accomplishments. Where appropriate, use the language and words you find in the specific job description. Be concise, targeting 3-5 key areas.' }
    ];
    const expBase = data.work_experience && data.work_experience.length > 0 ? data.work_experience : experience;
    const expList = expBase.length > 0 ? expBase : defaultExp;

    const profSummary = summary || data.summary || 'State your career goals and show how they align with the job description you\'re targeting. Be brief and keep it from sounding generic. Be yourself.';
    
    const interestsText = interests || data.interests || 'This section is optional but can showcase the unique, intriguing, even fun side of who you are.';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hiero Nimbus Resume</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
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
            font-family: 'Inter', sans-serif;
            background-color: #FFFFFF; /* Fallback */
            width: 794px;
            height: 1123px;
            margin: 0 auto;
            position: relative;
            padding: 32px;
        }

        /* Container with Gradient and Radius */
        .resume-container {
            width: 100%;
            height: 100%;
            border-radius: 16px;
            background: radial-gradient(circle at top left, #e0f2ff 0%, #ffffff 30%), 
                        radial-gradient(circle at bottom right, #e0f7fa 0%, #ffffff 30%);
            background-color: #ffffff;
            padding: 28px 40px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        /* TYPOGRAPHY */
        p, li, span, div {
            font-size: 13px;
            line-height: 1.5;
            color: #222222;
        }

        .section-title {
            font-size: 13px;
            font-weight: 500;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 16px;
            color: #333333;
        }

        .h-line {
            width: 100%;
            height: 1px;
            background-color: #CFCFCF;
            margin: 20px 0;
        }

        /* HEADER GRID */
        .header-grid {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 24px;
        }

        .header-left {
            flex: 0 0 35%;
        }

        .name {
            font-family: 'Playfair Display', serif;
            font-size: 42px;
            font-weight: 700;
            line-height: 1.1;
            color: #111111;
        }

        .header-right {
            flex: 0 0 60%;
            padding-top: 8px;
        }

        .role {
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 12px;
            color: #444444;
        }

        .summary-text {
            font-size: 13px;
            line-height: 1.6;
        }

        /* CONTACT LINE */
        .contact-line {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            padding: 0 10px;
        }

        /* EXPERIENCE */
        .experience-section {
            margin-top: 28px;
            flex-grow: 1;
        }

        .exp-item {
            display: flex;
            margin-bottom: 18px;
        }

        .exp-duration {
            flex: 0 0 140px;
            font-size: 12.5px;
            padding-top: 2px;
        }

        .exp-content {
            flex: 1;
        }

        .exp-header-line {
            margin-bottom: 6px;
        }

        .exp-role {
            font-weight: 600;
            font-size: 13.5px;
        }

        .exp-company {
            font-style: italic;
            font-size: 13.5px;
            color: #444444;
        }

        .exp-desc {
            font-size: 13px;
            line-height: 1.5;
            color: #333333;
        }

        .exp-desc ul {
            padding-left: 16px;
        }
        
        .exp-desc li {
            margin-bottom: 6px;
        }

        /* BOTTOM 3 COLUMNS */
        .bottom-grid {
            display: flex;
            gap: 20px;
            margin-top: 24px;
        }

        .bottom-col {
            flex: 1;
        }

        /* Education */
        .edu-item {
            margin-bottom: 12px;
        }
        .edu-duration {
            font-size: 12px;
            margin-bottom: 4px;
            color: #555555;
        }
        .edu-degree {
            font-weight: 600;
            font-size: 13px;
        }
        .edu-school {
            font-size: 13px;
            font-style: italic;
        }

        /* Skills */
        .skills-list {
            list-style: none;
        }
        .skills-list li {
            margin-bottom: 8px;
        }

    </style>
</head>
<body>
    <div class="resume-container">
        
        <!-- HEADER -->
        <div class="header-grid">
            <div class="header-left">
                <div class="name">${fName}<br>${lName}</div>
            </div>
            <div class="header-right">
                <div class="role">${role}</div>
                <div class="summary-text">${profSummary}</div>
            </div>
        </div>

        <div class="h-line" style="margin-top: 0; margin-bottom: 16px;"></div>

        <!-- CONTACT LINE -->
        <div class="contact-line">
            <span>${email}</span>
            <span>${phone}</span>
            <span>${linkedin.replace(/^https?:\/\/(www\.)?/, '')}</span>
        </div>

        <div class="h-line" style="margin-top: 16px; margin-bottom: 28px;"></div>

        <!-- EXPERIENCE -->
        <div class="experience-section">
            <div class="section-title" style="text-align: center; margin-bottom: 24px;">EXPERIENCE</div>
            
            ${expList.map(exp => {
                const duration = exp.duration || (exp.startDate ? `${exp.startDate} - ${exp.endDate || 'Current'}` : '');
                return `
                <div class="exp-item">
                    <div class="exp-duration">${duration}</div>
                    <div class="exp-content">
                        <div class="exp-header-line">
                            <span class="exp-role">${exp.jobTitle || exp.role || ''}</span>,
                            <span class="exp-company">${exp.company || ''}</span>
                        </div>
                        <div class="exp-desc">
                            ${exp.points && Array.isArray(exp.points) ? `
                                <ul>${exp.points.map(p => `<li>${p}</li>`).join('')}</ul>
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
                </div>
                `;
            }).join('')}
        </div>

        <div class="h-line"></div>

        <!-- BOTTOM GRID -->
        <div class="bottom-grid">
            <!-- EDUCATION -->
            <div class="bottom-col">
                <div class="section-title">EDUCATION</div>
                ${eduList.map(edu => {
                    const duration = edu.duration || (edu.startDate ? `${edu.startDate} - ${edu.endDate || ''}` : '') || edu.gradYear || edu.year || '';
                    return `
                    <div class="edu-item">
                        <div class="edu-duration">${duration}</div>
                        <div class="edu-degree">${edu.degree || ''}</div>
                        <div class="edu-school">${edu.school || edu.institution || ''}</div>
                    </div>
                    `;
                }).join('')}
            </div>

            <!-- SKILLS -->
            <div class="bottom-col">
                <div class="section-title">SKILLS</div>
                <ul class="skills-list">
                    ${skillList.slice(0, 7).map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>

            <!-- INTERESTS -->
            <div class="bottom-col">
                <div class="section-title">INTERESTS</div>
                <div class="summary-text" style="font-size: 13px;">${interestsText}</div>
            </div>
        </div>

    </div>
</body>
</html>
    `;
}
