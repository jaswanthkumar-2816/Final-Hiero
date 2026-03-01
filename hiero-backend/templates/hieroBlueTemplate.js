export function generateHieroBlueTemplate(data) {
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
        hobbies = ''
    } = data;

    const name = personalInfo.fullName || 'RAHUL MEHTA';
    const role = personalInfo.title || 'Data Scientist';
    const email = personalInfo.email || 'rahulmehta.ds@example.com';
    const phone = personalInfo.phone || '+91 9876543210';
    const website = personalInfo.website || personalInfo.linkedin || 'https://github.com/rahulmehta-ds/churn-prediction';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const skillsList = Array.isArray(skills) && skills.length > 0 ? skills :
        (technicalSkills ? technicalSkills.split(/[,|\n]/).map(s => s.trim()).filter(Boolean) :
            ['AB Testing', 'Matplotlib', 'Seaborn', 'Tableau', 'Python', 'SQL', 'Random Forest', 'XGBoost', 'TensorFlow', 'PyTorch', 'Scikit-Learn', 'Pandas', 'Numpy', 'Data Mining', 'EDA', 'GitHub', 'IBM', 'Microservices']);

    const certsList = Array.isArray(certifications) && certifications.length > 0 ? certifications :
        ['IBM Data Science Professional Certificate', 'Google Data Analytics Professional Certificate', 'TensorFlow Developer Certificate'];

    const langList = Array.isArray(languages) && languages.length > 0 ? languages :
        [{ name: 'English', level: 'Native', dots: 5 }, { name: 'Hindi', level: 'Proficient', dots: 4 }, { name: 'Telugu', level: 'Advanced', dots: 3 }];

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name} - Resume</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        :root {
            --primary-blue: #0080ff;
            --text-dark: #000000;
            --text-gray: #444444;
            --line-color: #000000;
            --dot-empty: #e0e0e0;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Outfit', sans-serif;
            color: var(--text-dark);
            line-height: 1.4;
            background: white;
            padding: 40px;
        }

        .resume-container {
            max-width: 850px;
            margin: 0 auto;
            position: relative;
        }

        /* Header Section */
        header {
            margin-bottom: 40px;
        }

        h1 {
            font-size: 36px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }

        .title {
            color: var(--primary-blue);
            font-weight: 700;
            font-size: 18px;
            margin-bottom: 12px;
        }

        .contact-row {
            display: flex;
            gap: 15px;
            font-size: 13px;
            font-weight: 500;
        }

        .contact-item {
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--text-dark);
            text-decoration: none;
        }

        .contact-item i {
            color: var(--primary-blue);
            font-size: 14px;
        }

        .rm-circle {
            position: absolute;
            top: 0;
            right: 0;
            width: 110px;
            height: 110px;
            background: var(--primary-blue);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 42px;
            font-weight: 700;
            box-shadow: 0 4px 15px rgba(0, 128, 255, 0.2);
        }

        /* Grid Layout */
        .main-grid {
            display: grid;
            grid-template-columns: 1.6fr 1fr;
            gap: 40px;
        }

        section {
            margin-bottom: 30px;
        }

        .section-title {
            font-size: 17px;
            font-weight: 800;
            text-transform: uppercase;
            border-bottom: 2px solid var(--line-color);
            padding-bottom: 5px;
            margin-bottom: 15px;
            display: block;
        }

        /* Left Side */
        .summary-content {
            font-size: 13px;
            color: var(--text-gray);
            text-align: justify;
        }

        .experience-item, .education-item {
            margin-bottom: 20px;
        }

        .item-header {
            margin-bottom: 5px;
        }

        .job-title {
            font-size: 15px;
            font-weight: 700;
            display: block;
        }

        .company-name {
            color: var(--primary-blue);
            font-weight: 700;
            font-size: 14px;
            display: block;
        }

        .meta-info {
            font-size: 12px;
            color: var(--text-gray);
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 3px;
        }

        .meta-info i { margin-right: 4px; }

        .job-bullets {
            margin-top: 8px;
            padding-left: 18px;
            font-size: 12.5px;
            color: var(--text-gray);
        }

        .job-bullets li {
            margin-bottom: 4px;
        }

        .cert-list {
            list-style: none;
        }

        .cert-item {
            font-size: 14px;
            font-weight: 700;
            padding: 10px 0;
            border-bottom: 1px dotted #ccc;
        }

        .lang-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }

        .lang-name {
            font-weight: 800;
            font-size: 14px;
            display: block;
        }

        .lang-level {
            font-size: 12px;
            color: var(--text-gray);
        }

        .lang-dots {
            display: flex;
            gap: 5px;
            margin-top: 10px;
        }

        .dot {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: var(--dot-empty);
        }

        .dot.filled {
            background: var(--primary-blue);
        }

        /* Right Side Side Sections */
        .sidebar {
            display: flex;
            flex-direction: column;
        }

        .strength-item, .achievement-item {
            display: flex;
            gap: 15px;
            padding: 15px 0;
            border-bottom: 1px dotted #ccc;
        }

        .strength-item:last-child, .achievement-item:last-child {
            border-bottom: none;
        }

        .icon-box {
            color: var(--primary-blue);
            font-size: 18px;
            width: 25px;
            text-align: center;
        }

        .sidebar-content h4 {
            font-size: 14.5px;
            font-weight: 800;
            margin-bottom: 3px;
        }

        .sidebar-content p {
            font-size: 12px;
            color: var(--text-gray);
        }

        .skills-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            text-align: center;
            gap: 15px 5px;
        }

        .skill-item {
            font-size: 12.5px;
            font-weight: 700;
            text-decoration: underline;
            text-underline-offset: 4px;
            text-decoration-thickness: 1px;
        }

        @media print {
            body { padding: 0px; }
            .resume-container { padding: 30px; }
        }
    </style>
</head>
<body>
    <div class="resume-container">
        <div class="rm-circle">${initials}</div>

        <header>
            <h1>${name}</h1>
            <div class="title">${role}</div>
            <div class="contact-row">
                <a href="tel:${phone}" class="contact-item"><i class="fas fa-phone"></i> ${phone}</a>
                <a href="mailto:${email}" class="contact-item"><i class="fas fa-envelope"></i> ${email}</a>
                <a href="${website}" class="contact-item"><i class="fas fa-link"></i> Portfolio</a>
            </div>
        </header>

        <div class="main-grid">
            <div class="left-col">
                <section>
                    <div class="section-title">Summary</div>
                    <div class="summary-content">
                        ${summary || 'I am a Data Scientist with over 2 years of hands-on experience in predictive modeling, machine learning, and data analytics. My proficiency lies in analyzing complex datasets and building end-to-end ML models that provide actionable insights to business teams. I excel in communicating technical findings to non-technical stakeholders, ensuring data-driven decision-making across the organization.'}
                    </div>
                </section>

                <section>
                    <div class="section-title">Experience</div>
                    ${experience.map(exp => `
                        <div class="experience-item">
                            <span class="job-title">${exp.jobTitle || exp.role}</span>
                            <span class="company-name">${exp.company}</span>
                            <div class="meta-info">
                                <span><i class="far fa-calendar-alt"></i> ${exp.startDate} - ${exp.endDate}</span>
                            </div>
                            <ul class="job-bullets">
                                ${(exp.description || '').split('\n').filter(Boolean).map(line => `<li>${line.replace(/^[•\-]\s*/, '')}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('') || `
                        <div class="experience-item">
                            <span class="job-title">Data Scientist</span>
                            <span class="company-name">TechNova Analytics</span>
                            <div class="meta-info">
                                <span><i class="far fa-calendar-alt"></i> 01/2023 - Present</span>
                            </div>
                            <ul class="job-bullets">
                                <li>Analyzed large datasets (50M+ rows) to identify trends and build predictive dashboards.</li>
                                <li>Developed machine learning models improving customer churn prediction by 18%.</li>
                                <li>Implemented A/B testing frameworks to measure product improvements.</li>
                            </ul>
                        </div>
                    `}
                </section>

                <section>
                    <div class="section-title">Education</div>
                    ${education.map(edu => `
                        <div class="education-item">
                            <span class="job-title">${edu.degree}</span>
                            <span class="company-name">${edu.school || edu.institute}</span>
                            <div class="meta-info">
                                <span><i class="far fa-calendar-alt"></i> ${edu.gradYear || edu.dates}</span>
                                ${edu.location ? `<span><i class="fas fa-map-marker-alt"></i> ${edu.location}</span>` : ''}
                            </div>
                        </div>
                    `).join('') || `
                        <div class="education-item">
                            <span class="job-title">M.Sc. in Data Science</span>
                            <span class="company-name">Christ University</span>
                            <div class="meta-info">
                                <span><i class="far fa-calendar-alt"></i> 08/2021 - 05/2023</span>
                                <span><i class="fas fa-map-marker-alt"></i> Bengaluru</span>
                            </div>
                        </div>
                    `}
                </section>

                <section>
                    <div class="section-title">Certifications</div>
                    <div class="cert-list">
                        ${certsList.map(cert => `<div class="cert-item">${cert}</div>`).join('')}
                    </div>
                </section>

                <section>
                    <div class="section-title">Languages</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 40px;">
                        ${langList.map(lang => `
                            <div>
                                <div class="lang-row">
                                    <div>
                                        <span class="lang-name">${lang.name}</span>
                                        <span class="lang-level">${lang.level || ''}</span>
                                    </div>
                                </div>
                                <div class="lang-dots">
                                    ${[1, 2, 3, 4, 5].map(i => `<div class="dot ${i <= (lang.dots || 3) ? 'filled' : ''}"></div>`).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
            </div>

            <div class="right-col">
                <section>
                    <div class="section-title">Strengths</div>
                    <div class="strength-item">
                        <div class="icon-box"><i class="fas fa-check"></i></div>
                        <div class="sidebar-content">
                            <h4>Soft Skill</h4>
                            <p>Problem-solving</p>
                        </div>
                    </div>
                    <div class="strength-item">
                        <div class="icon-box"><i class="far fa-flag"></i></div>
                        <div class="sidebar-content">
                            <h4>Soft Skill</h4>
                            <p>Communication</p>
                        </div>
                    </div>
                    <div class="strength-item">
                        <div class="icon-box"><i class="fas fa-heart"></i></div>
                        <div class="sidebar-content">
                            <h4>Soft Skill</h4>
                            <p>Analytical Thinking</p>
                        </div>
                    </div>
                     <div class="strength-item">
                        <div class="icon-box"><i class="fas fa-award"></i></div>
                        <div class="sidebar-content">
                            <h4>Soft Skill</h4>
                            <p>Business Acumen</p>
                        </div>
                    </div>
                    <div class="strength-item">
                        <div class="icon-box"><i class="fas fa-bolt"></i></div>
                        <div class="sidebar-content">
                            <h4>Soft Skill</h4>
                            <p>Data-driven Decision Making</p>
                        </div>
                    </div>
                </section>

                <section>
                    <div class="section-title">Key Achievements</div>
                    <div class="achievement-item">
                        <div class="icon-box"><i class="fas fa-bolt"></i></div>
                        <div class="sidebar-content">
                            <h4>Customer Churn Prediction</h4>
                            <p>Improved customer churn prediction by 18% through ML models</p>
                        </div>
                    </div>
                    <div class="achievement-item">
                        <div class="icon-box"><i class="fas fa-heart"></i></div>
                        <div class="sidebar-content">
                            <h4>A/B Testing Frameworks</h4>
                            <p>Increased conversion rate by 6.5% through A/B testing frameworks</p>
                        </div>
                    </div>
                    <div class="achievement-item">
                        <div class="icon-box"><i class="far fa-star"></i></div>
                        <div class="sidebar-content">
                            <h4>Predictive Dashboards</h4>
                            <p>Built predictive dashboards analyzing 50M+ rows of data</p>
                        </div>
                    </div>
                </section>

                <section>
                    <div class="section-title">Skills</div>
                    <div class="skills-grid">
                        ${skillsList.map(skill => `<div class="skill-item">${skill}</div>`).join('')}
                    </div>
                </section>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}
