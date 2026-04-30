export function generateHieroAxisTemplate(data) {
    const {
        personalInfo = {},
        summary = '',
        education = [],
        experience = [],
        skills = [],
        technicalSkills = '',
        softSkills = '',
        certifications = [],
        languages = [],
        references = [],
        projects = [],
        profileImage = ''
    } = data;

    // Helper functions
    const getArr = (v) => {
        if (!v) return [];
        if (Array.isArray(v)) return v;
        if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
        return [];
    };

    const name = personalInfo.fullName || 'SALMA MATTHEWS';
    const role = personalInfo.roleTitle || data.jobTitle || 'PROJECT MANAGER';
    const email = personalInfo.email || data.email || '';
    const phone = personalInfo.phone || data.phone || '';
    const website = personalInfo.website || personalInfo.linkedin || data.website || '';
    const location = personalInfo.address || data.address || '';
    
    // Parse skills or technicalSkills into an array of strings
    const skillList = getArr(skills.length ? skills : technicalSkills);
    const softSkillList = getArr(softSkills);
    const langList = getArr(languages.length ? languages : (data.languagesKnown || ''));
    
    // Convert software list (assuming first half of skills or a specific field)
    // If there's no specific software list, we'll just split technical skills
    const softwareList = Array.isArray(data.software_list) ? data.software_list : 
                         (skillList.length > 5 ? skillList.slice(0, 5) : skillList);
    
    const actualSkills = skillList.length > 5 ? skillList.slice(5) : skillList;

    // Default shapes or images if missing
    const photo = personalInfo.profilePhoto || profileImage || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80';

    // Decorative SVGs
    const shapeTopRight = `<svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 -50 C 50 -50 100 0 100 50 C 100 100 150 150 200 150 L 200 -50 Z" fill="#E8DDD3" opacity="0.7"/>
    </svg>`;
    
    const shapeBottomLeft = `<svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M-50 200 C -50 150 0 100 50 100 C 100 100 150 50 150 0 L -50 0 Z" fill="#E8DDD3" opacity="0.7"/>
    </svg>`;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hiero Axis Resume</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap');

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
                background-color: #F4F1EC;
                color: #2E2E2E;
                width: 210mm;
                height: 297mm;
                position: relative;
                overflow: hidden;
            }

            .resume-wrapper {
                width: 100%;
                height: 100%;
                padding: 40px;
                position: relative;
                z-index: 10;
            }

            /* Decorative Background Shapes */
            .bg-shape {
                position: absolute;
                z-index: 1;
            }
            .bg-shape.tr { top: 0; right: 0; transform: scale(1.5) translate(10%, -10%); }
            .bg-shape.bl { bottom: 0; left: 0; transform: scale(1.5) translate(-10%, 10%); }
            .bg-shape.br { bottom: -20px; right: -20px; width: 150px; height: 150px; background: #e8dbd1; border-radius: 50% 0 0 0; opacity: 0.6; z-index: 1;}

            .resume-grid {
                display: flex;
                width: 100%;
                height: 100%;
                gap: 20px;
                position: relative;
                z-index: 10;
            }

            /* LEFT COLUMN - 30% */
            .col-left {
                width: 32%;
                background-color: #EDE6DD;
                padding: 24px;
                display: flex;
                flex-direction: column;
                border-radius: 4px;
            }

            /* CENTER COLUMN - 25% */
            .col-center {
                width: 26%;
                background-color: transparent;
                display: flex;
                flex-direction: column;
            }

            .center-bg {
                background-color: #8D6E63;
                flex-grow: 1;
                padding: 24px;
                color: #FFFFFF;
                border-radius: 0 0 4px 4px;
            }

            .profile-img-container {
                width: 100%;
                height: 260px;
                background-color: #8D6E63;
                border-radius: 120px 120px 0 0;
                overflow: hidden;
                margin-bottom: 0px; 
            }

            .profile-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                object-position: center;
            }

            /* RIGHT COLUMN - 45% */
            .col-right {
                width: 42%;
                background-color: transparent;
                padding: 24px 0 24px 10px;
                display: flex;
                flex-direction: column;
            }

            /* TYPOGRAPHY */
            .section-title {
                font-family: 'Poppins', sans-serif;
                font-size: 13px;
                font-weight: 600;
                letter-spacing: 1px;
                text-transform: uppercase;
                margin-bottom: 12px;
                margin-top: 28px;
                display: flex;
                align-items: center;
            }
            .section-title:first-child { margin-top: 0; }
            
            .col-left .section-title, .col-right .section-title { color: #8D6E63; }
            .col-center .section-title { color: #FFFFFF; }

            .name-title {
                font-family: 'Poppins', sans-serif;
                font-size: 28px;
                font-weight: 400;
                line-height: 1.1;
                color: #8D6E63;
                text-transform: uppercase;
                margin-bottom: 30px;
                margin-top: 20px;
                letter-spacing: 1px;
            }

            .job-title {
                font-family: 'Poppins', sans-serif;
                font-size: 24px;
                font-weight: 400;
                line-height: 1.1;
                color: #8D6E63;
                text-transform: uppercase;
                margin-bottom: 25px;
                margin-top: 20px;
                letter-spacing: 1px;
            }

            .text-body {
                font-size: 10pt;
                line-height: 1.5;
                margin-bottom: 8px;
            }

            .col-left .text-body { color: #2E2E2E; font-size: 9.5pt; }
            .col-right .text-body { color: #2E2E2E; font-size: 9.5pt; }
            .col-center .text-body { color: #EFEFEF; font-size: 9pt; }

            /* LISTS */
            ul.custom-list {
                list-style: none;
                padding-left: 0;
            }
            ul.custom-list li {
                position: relative;
                padding-left: 12px;
                margin-bottom: 4px;
                font-size: 9.5pt;
                line-height: 1.4;
            }
            ul.custom-list li::before {
                content: "•";
                position: absolute;
                left: 0;
                top: 0;
                color: #8D6E63;
                font-size: 14px;
            }

            /* SKILLS BAR */
            .skill-item {
                margin-bottom: 8px;
                display: flex;
                align-items: center;
            }
            .skill-label {
                background-color: #8D6E63;
                color: #FFFFFF;
                font-size: 8pt;
                padding: 4px 8px;
                width: 120px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .skill-bar-container {
                flex-grow: 1;
                background-color: #FFFFFF;
                height: 18px;
                margin-left: 4px;
            }
            .skill-bar-fill {
                display: none;
            }

            /* WORK EXP */
            .exp-item {
                margin-bottom: 16px;
            }
            .exp-meta {
                font-size: 8.5pt;
                color: #8D6E63;
                font-weight: 600;
                margin-bottom: 2px;
            }
            .exp-role {
                font-size: 10pt;
                font-weight: 600;
                color: #2E2E2E;
                margin-bottom: 4px;
                font-family: 'Poppins', sans-serif;
            }
            .exp-desc ul {
                padding-left: 14px;
                margin-top: 4px;
            }
            .exp-desc li {
                font-size: 9.5pt;
                line-height: 1.4;
                margin-bottom: 3px;
                color: #444;
            }

            /* CONTACT */
            .contact-item {
                margin-bottom: 6px;
            }
            .contact-item a {
                color: #EFEFEF;
                text-decoration: none;
            }

        </style>
    </head>
    <body>
        <div class="bg-shape tr">${shapeTopRight}</div>
        <div class="bg-shape bl">${shapeBottomLeft}</div>
        <div class="bg-shape br"></div>

        <div class="resume-wrapper">
            <div class="resume-grid">
                
                <!-- LEFT COLUMN -->
                <div class="col-left">
                    <div class="section-title" style="margin-bottom: 0;">/ RESUME</div>
                    <div class="name-title">${name.replace(' ', '<br>')}</div>
                    
                    ${summary ? `
                    <div class="section-title">/ PROFILE</div>
                    <div class="text-body" style="text-align: justify;">${summary}</div>
                    ` : ''}

                    ${softwareList.length > 0 ? `
                    <div class="section-title">/ SOFTWARE</div>
                    <ul class="custom-list">
                        ${softwareList.map(item => `<li>${item.name || item}</li>`).join('')}
                    </ul>
                    ` : ''}

                    ${actualSkills.length > 0 ? `
                    <div class="section-title">/ SKILLS</div>
                    ${actualSkills.slice(0, 6).map((skill, index) => {
                        const level = typeof skill === 'object' ? (skill.level || 80) : (90 - (index * 5));
                        const skillName = typeof skill === 'object' ? (skill.name || skill.skill) : skill;
                        return `
                        <div class="skill-item">
                            <div class="skill-label">${skillName}</div>
                            <div class="skill-bar-container">
                            </div>
                        </div>
                        `;
                    }).join('')}
                    ` : ''}
                </div>

                <!-- CENTER COLUMN -->
                <div class="col-center">
                    <div class="profile-img-container">
                        <img src="${photo}" alt="Profile" class="profile-img">
                    </div>
                    <div class="center-bg">
                        ${langList.length > 0 ? `
                        <div class="section-title">/ LANGUAGES</div>
                        <div class="text-body">${langList.join(' / ')}</div>
                        ` : ''}

                        <div class="section-title">/ CONTACT</div>
                        ${phone ? `<div class="contact-item">${phone}</div>` : ''}
                        ${email ? `<div class="contact-item">${email}</div>` : ''}
                        ${website ? `<div class="contact-item">${website}</div>` : ''}
                        ${location ? `<div class="contact-item">${location}</div>` : ''}

                        ${references.length > 0 ? `
                        <div class="section-title">/ REFERENCES</div>
                        ${references.slice(0, 2).map(ref => `
                            <div style="margin-bottom: 12px;">
                                <div style="font-weight: 600; font-size: 10pt;">${ref.name}</div>
                                <div style="font-size: 8.5pt; opacity: 0.9;">${ref.position || ref.role || ''}</div>
                                <div style="font-size: 8.5pt; opacity: 0.9;">${ref.company || ''}</div>
                                ${ref.phone ? `<div style="font-size: 8.5pt; margin-top:2px;">Tel: ${ref.phone}</div>` : ''}
                                ${ref.email ? `<div style="font-size: 8.5pt;">Email: ${ref.email}</div>` : ''}
                            </div>
                        `).join('')}
                        ` : ''}
                    </div>
                </div>

                <!-- RIGHT COLUMN -->
                <div class="col-right">
                    <div class="job-title">${role.replace(' ', '<br>')}</div>
                    
                    ${experience.length > 0 ? `
                    <div class="section-title">/ WORK EXPERIENCE</div>
                    ${experience.map(exp => `
                        <div class="exp-item">
                            <div class="exp-meta">${exp.startDate || ''} - ${exp.endDate || 'Present'}</div>
                            <div class="text-body" style="color: #666; font-size: 8.5pt; margin-bottom: 2px;">${exp.company || ''}${exp.location ? `, ${exp.location}` : ''}</div>
                            <div class="exp-role">${exp.jobTitle || ''}</div>
                            <div class="exp-desc">
                                ${exp.description ? `
                                    <ul>
                                        ${exp.description.split('\n').filter(l => l.trim()).map(line => `
                                            <li>${line.replace(/^[\*\-•]\s*/, '')}</li>
                                        `).join('')}
                                    </ul>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                    ` : ''}

                    ${education.length > 0 ? `
                    <div class="section-title">/ EDUCATION</div>
                    ${education.map(edu => `
                        <div class="exp-item" style="margin-bottom: 12px;">
                            <div class="exp-meta">${edu.gradYear || edu.dates || ''}</div>
                            <div class="exp-role" style="margin-bottom: 2px;">${edu.degree || ''}</div>
                            <div class="text-body" style="color: #666; font-size: 9pt;">${edu.school || ''}</div>
                            ${edu.gpa ? `<div class="text-body" style="color: #666; font-size: 8.5pt;">GPA: ${edu.gpa}</div>` : ''}
                        </div>
                    `).join('')}
                    ` : ''}
                </div>

            </div>
        </div>
    </body>
    </html>
    `;
}
