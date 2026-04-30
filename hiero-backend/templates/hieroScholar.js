export function generateHieroScholarTemplate(data) {
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
        achievements = '',
        hobbies = '',
        profileImage = ''
    } = data;

    const name = personalInfo.fullName || 'Jonathan Smith';
    const names = name.split(' ');
    const firstInitial = names[0]?.[0] || 'J';
    const lastInitial = names[names.length - 1]?.[0] || 'S';
    const initials = (firstInitial + lastInitial).toUpperCase();
    
    const role = (personalInfo.roleTitle || personalInfo.title || 'ENGLISH TEACHER').toUpperCase();
    const email = personalInfo.email || 'jonathansmith@gmail.com';
    const phone = personalInfo.phone || '+111 222 333 444';
    const location = personalInfo.location || 'New York';
    const linkedin = personalInfo.linkedin || '/JonathanSmith';
    
    const profilePic = profileImage || personalInfo.profilePhoto || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80';

    const getSkillsArr = (v) => {
        if (!v) return [];
        if (Array.isArray(v)) return v;
        if (typeof v === 'string') return v.split(/[,|\n]/).map(s => s.trim()).filter(Boolean);
        return [];
    };
    
    let skillsList = getSkillsArr(skills);
    if (!skillsList.length) {
        skillsList = getSkillsArr(technicalSkills);
    }
    if (!skillsList.length) {
        skillsList = ['GOOGLE CLASSROOM', 'MICROSOFT WORD', 'MICROSOFT PPT'];
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name} - Resume</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Merriweather:wght@700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        :root {
            --teal: #a8c1c5;
            --blue-grey: #b0c4ce;
            --peach: #d7a692;
            --accent-red: #eb7c74;
            --text-dark: #333333;
            --text-gray: #666666;
            --white: #ffffff;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Outfit', sans-serif;
            color: var(--text-dark);
            background: #fff;
            display: flex;
            justify-content: center;
        }

        .resume-container {
            width: 794px; /* A4 width in pixels at 96dpi */
            height: 1123px; /* A4 height in pixels */
            background: var(--white);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }

        /* Background Shapes */
        .header-bg-teal {
            position: absolute;
            top: 0;
            left: 0;
            width: 500px;
            height: 350px;
            background: var(--teal);
            clip-path: polygon(0 0, 100% 0, 0 100%);
            z-index: 1;
        }

        .bottom-bg-left {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 45%;
            height: 700px;
            background: var(--blue-grey);
            clip-path: polygon(0 150px, 100% 0, 100% 100%, 0 100%);
            z-index: 1;
        }

        .bottom-bg-right {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 55%;
            height: 650px;
            background: var(--peach);
            z-index: 0;
        }

        .bottom-white-triangle {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 200px;
            height: 120px;
            background: var(--white);
            clip-path: polygon(0 100%, 0 0, 100% 100%);
            z-index: 5;
        }

        /* Red Ribbon */
        .ribbon {
            position: absolute;
            top: 0;
            left: 260px;
            width: 60px;
            height: 160px;
            background: var(--accent-red);
            display: flex;
            flex-direction: column;
            align-items: center;
            padding-top: 90px;
            color: var(--white);
            font-family: 'Merriweather', serif;
            font-size: 28px;
            z-index: 10;
        }

        .ribbon::after {
            content: '';
            position: absolute;
            bottom: -20px;
            left: 0;
            border-left: 30px solid var(--accent-red);
            border-right: 30px solid var(--accent-red);
            border-bottom: 20px solid transparent;
        }

        /* Profile Photo Container */
        .photo-wrapper {
            position: relative;
            z-index: 20;
            margin-top: 40px;
            display: flex;
            justify-content: center;
            padding-right: 140px;
        }

        .photo-circle {
            width: 190px;
            height: 190px;
            border-radius: 50%;
            border: 6px solid var(--white);
            box-shadow: 0 0 0 4px var(--teal);
            overflow: hidden;
            background: #eee;
        }

        .photo-circle img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        /* Name and Role */
        .header-info {
            position: absolute;
            top: 80px;
            left: 505px;
            z-index: 30;
            width: 250px;
        }

        .header-info h1 {
            font-size: 38px;
            font-weight: 800;
            color: var(--text-dark);
            line-height: 0.9;
            text-transform: uppercase;
        }

        .header-info .role {
            font-size: 16px;
            font-weight: 600;
            color: #444;
            letter-spacing: 1px;
            margin-top: 15px;
            display: block;
        }

        /* Middle Box */
        .middle-container {
            position: relative;
            z-index: 40;
            margin: 0px 40px 0 40px;
            background: var(--white);
            padding: 35px 45px;
            display: flex;
            gap: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }

        .section-box {
            flex: 1.5;
        }

        .contact-box {
            flex: 1;
        }

        .section-title {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 12px;
            color: var(--text-dark);
            display: block;
        }

        .profile-txt {
            font-size: 12px;
            line-height: 1.6;
            color: var(--text-gray);
            text-align: justify;
        }

        .contact-details {
            list-style: none;
            font-size: 11px;
        }

        .contact-details li { margin-bottom: 5px; }
        .contact-details li.location { font-weight: 800; margin-bottom: 10px; }

        .social-icons {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }

        .social-circle {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: #9ab4b9;
            color: var(--white);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
        }

        /* Main Grid */
        .grid-layout {
            display: flex;
            flex: 1;
            z-index: 5;
            position: relative;
        }

        .column-left {
            width: 45%;
            padding: 50px 45px;
        }

        .column-right {
            width: 55%;
            padding: 50px 45px;
        }

        .edu-entry {
            margin-bottom: 30px;
        }

        .school-name {
            font-size: 14px;
            font-weight: 800;
            font-style: italic;
            display: block;
        }

        .edu-period {
            font-size: 11px;
            margin: 3px 0 12px 0;
            display: block;
        }

        .edu-details {
            font-size: 11px;
            line-height: 1.5;
            color: #333;
        }

        /* Skills Circular Nodes */
        .skills-container {
            display: flex;
            gap: 20px;
            margin-top: 20px;
        }

        .skill-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 70px;
            text-align: center;
        }

        .skill-circle {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            border: 4px solid var(--white);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 8px;
            position: relative;
        }

        .skill-circle::before {
            content: '';
            position: absolute;
            top: -4px; right: -4px; bottom: -4px; left: -4px;
            border-radius: 50%;
            border: 4px solid transparent;
            border-top-color: var(--accent-red);
            border-right-color: var(--accent-red);
            transform: rotate(-45deg);
        }

        .skill-item:nth-child(2) .skill-circle::before { border-color: transparent var(--blue-grey) var(--blue-grey) transparent; }
        .skill-item:nth-child(3) .skill-circle::before { border-color: var(--peach) transparent transparent var(--peach); }

        .skill-circle i { font-size: 22px; color: #555; }
        .skill-name { font-size: 8px; font-weight: 800; text-transform: uppercase; }

        /* Timeline */
        .timeline {
            margin-top: 20px;
            margin-left: 50px;
            position: relative;
        }

        .timeline::before {
            content: '';
            position: absolute;
            left: -20px;
            top: 5px;
            bottom: 0;
            width: 2px;
            background: rgba(255,255,255,0.5);
        }

        .timeline-entry {
            position: relative;
            margin-bottom: 35px;
        }

        .entry-year {
            position: absolute;
            left: -65px;
            top: -2px;
            font-size: 13px;
            font-weight: 600;
            color: var(--white);
        }

        .entry-marker {
            position: absolute;
            left: -26px;
            top: 5px;
            width: 14px;
            height: 3px;
            background: var(--white);
        }

        .job-title-txt { font-size: 14px; font-weight: 800; display: block; }
        .company-txt { font-size: 13px; display: block; margin-bottom: 8px; }
        .job-desc-txt { font-size: 11px; line-height: 1.5; color: #333; }

        @media print {
            body { background: white; padding: 0; }
            .resume-container { box-shadow: none; width: 100%; height: auto; }
            .header-bg-teal, .bottom-bg-left, .bottom-bg-right, .bottom-white-triangle, .ribbon {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="resume-container">
        <!-- Decoration Layer -->
        <div class="header-bg-teal"></div>
        <div class="bottom-bg-left"></div>
        <div class="bottom-bg-right"></div>
        <div class="bottom-white-triangle"></div>

        <!-- Identity Layer -->
        <div class="ribbon">
            <span>${initials[0]}</span>
            <span>${initials[1]}</span>
        </div>

        <div class="photo-wrapper">
            <div class="photo-circle">
                <img src="${profilePic}" alt="${name}">
            </div>
            <div class="header-info">
                <h1>${names[0]}<br>${names.slice(1).join(' ')}</h1>
                <span class="role">${role}</span>
            </div>
        </div>

        <!-- Information Layer -->
        <div class="middle-container">
            <div class="section-box">
                <span class="section-title">Profile</span>
                <p class="profile-txt">${summary || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis vel velit purus. Donec turpis tortor, convallis sit amet sem id, varius mollis ex. Pellentesque blandit nisi ut massa molestie efficitur. Suspendisse potenti. Nulla id accumsan dolor. Vestibulum vel velit a erat elementum vehicula eu ut metus.'}</p>
            </div>
            <div class="contact-box">
                <span class="section-title">Contact</span>
                <ul class="contact-details">
                    <li class="location">${location}</li>
                    <li>Lorem ipsum dolor sit met</li>
                    <li>${phone}</li>
                    <li>${email}</li>
                </ul>
                <div class="social-icons">
                    <div class="social-circle"><i class="fab fa-facebook-f"></i></div>
                    <div class="social-circle"><i class="fab fa-twitter"></i></div>
                    <div class="social-circle"><i class="fab fa-linkedin-in"></i></div>
                </div>
                <div style="margin-top: 8px; font-size: 10px;">${linkedin}</div>
            </div>
        </div>

        <div class="grid-layout">
            <!-- Left Column: Education & Skills -->
            <div class="column-left">
                <div class="section">
                    <span class="section-title">Education</span>
                    ${education.length > 0 ? education.map(edu => `
                        <div class="edu-entry">
                            <span class="school-name">${edu.school || edu.institute}</span>
                            <span class="edu-period">( ${edu.gradYear || edu.dates || '2016 > 2019'} )</span>
                            <p class="edu-details">${edu.degree || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.'}</p>
                        </div>
                    `).join('') : `
                        <div class="edu-entry">
                            <span class="school-name">School Name</span>
                            <span class="edu-period">( 2016 > 2019 )</span>
                            <p class="edu-details">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.</p>
                        </div>
                        <div class="edu-entry">
                            <span class="school-name">School Name</span>
                            <span class="edu-period">( 2014 > 2016 )</span>
                            <p class="edu-details">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.</p>
                        </div>
                    `}
                </div>

                <div class="section">
                    <span class="section-title">Skills</span>
                    <div class="skills-container">
                        ${skillsList.slice(0, 3).map((skill, idx) => {
                            let icon = 'fa-google';
                            const upperSkill = skill.toUpperCase();
                            if (upperSkill.includes('WORD')) icon = 'fa-file-word';
                            else if (upperSkill.includes('PPT') || upperSkill.includes('POWERPOINT')) icon = 'fa-file-powerpoint';
                            else if (upperSkill.includes('EXCEL')) icon = 'fa-file-excel';
                            else if (upperSkill.includes('PYTHON')) icon = 'fa-python';
                            else if (upperSkill.includes('JS') || upperSkill.includes('JAVASCRIPT')) icon = 'fa-js';
                            
                            return `
                                <div class="skill-item">
                                    <div class="skill-circle">
                                        <i class="fab ${icon}"></i>
                                    </div>
                                    <span class="skill-name">${skill}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>

            <!-- Right Column: Experience -->
            <div class="column-right">
                <span class="section-title">Work Experience</span>
                <div class="timeline">
                    ${experience.length > 0 ? experience.map(exp => `
                        <div class="timeline-entry">
                            <span class="entry-year">${exp.startDate?.split(' ')[1] || exp.startDate || '2019'}</span>
                            <div class="entry-marker"></div>
                            <span class="job-title-txt">${exp.jobTitle || exp.role}</span>
                            <span class="company-txt">${exp.company}</span>
                            <p class="job-desc-txt">${exp.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.'}</p>
                        </div>
                    `).join('') : `
                        <div class="timeline-entry">
                            <span class="entry-year">2019</span>
                            <div class="entry-marker"></div>
                            <span class="job-title-txt">Position Name</span>
                            <span class="company-txt">Company Name</span>
                            <p class="job-desc-txt">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.</p>
                        </div>
                        <div class="timeline-entry">
                            <span class="entry-year">2015</span>
                            <div class="entry-marker"></div>
                            <span class="job-title-txt">Position Name</span>
                            <span class="company-txt">Company Name</span>
                            <p class="job-desc-txt">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.</p>
                        </div>
                        <div class="timeline-entry">
                            <span class="entry-year">2014</span>
                            <div class="entry-marker"></div>
                            <span class="job-title-txt">Position Name</span>
                            <span class="company-txt">Company Name</span>
                            <p class="job-desc-txt">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.</p>
                        </div>
                    `}
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `;
}
