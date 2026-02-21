// routes/templates.js
// High-fidelity resume templates (CommonJS version for Integrated Gateway)

const esc = (s = '') => String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const toArray = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') return v.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
    return [];
};

function normalizeData(data = {}) {
    if (!data || typeof data !== 'object') data = {};
    const p = data.personalInfo || {};

    const getArr = (v, aliases = []) => {
        if (Array.isArray(v) && v.length > 0) return v;
        for (let alias of aliases) {
            if (data[alias] && Array.isArray(data[alias]) && data[alias].length > 0) return data[alias];
            if (p[alias] && Array.isArray(p[alias]) && p[alias].length > 0) return p[alias];
        }
        if (typeof v === 'string') return toArray(v);
        return [];
    };

    const getStr = (v, aliases = []) => {
        if (v && typeof v === 'string' && v.trim().length > 0) return v;
        for (let alias of aliases) {
            if (data[alias] && typeof data[alias] === 'string' && data[alias].trim().length > 0) return data[alias];
            if (p[alias] && typeof p[alias] === 'string' && p[alias].trim().length > 0) return p[alias];
        }
        return '';
    };

    try {
        return {
            ...data,
            personalInfo: {
                fullName: p.fullName || p.name || data.fullName || data.name || '',
                email: p.email || data.email || '',
                phone: p.phone || data.phone || '',
                address: p.address || data.address || p.location || data.location || '',
                linkedin: p.linkedin || data.linkedin || '',
                github: p.github || data.github || '',
                website: p.website || data.website || '',
                roleTitle: p.roleTitle || p.headline || p.role || data.roleTitle || data.headline || data.role || '',
                dateOfBirth: p.dateOfBirth || data.dateOfBirth || '',
                gender: p.gender || data.gender || '',
                nationality: p.nationality || data.nationality || '',
                maritalStatus: p.maritalStatus || data.maritalStatus || '',
                languagesKnown: p.languagesKnown || data.languages || '',
                profilePhoto: p.profilePhoto || p.picture || data.profilePhoto || data.picture || data.photoUrl || ''
            },
            summary: getStr(data.summary, ['aboutMe', 'personalSummary', 'about', 'objective', 'professionalSummary']),
            experience: getArr(data.experience, ['workHistory', 'workExperience', 'experienceList', 'work', 'employmentHistory']).map(exp => {
                if (!exp) return {};
                const dates = String(exp.dates || '');
                return {
                    jobTitle: exp.jobTitle || exp.title || exp.position || exp.role || '',
                    company: exp.company || exp.organization || '',
                    startDate: exp.startDate || exp.start || (dates ? dates.split('-')[0]?.trim() : ''),
                    endDate: exp.endDate || exp.end || (dates ? dates.split('-')[1]?.trim() : 'Present'),
                    description: exp.description || exp.responsibilities || (Array.isArray(exp.points) ? exp.points.join('\n') : ''),
                    location: exp.location || ''
                };
            }),
            education: getArr(data.education, ['academicDetails', 'educationList', 'academics', 'academicHistory']).map(edu => {
                if (!edu) return {};
                const dates = String(edu.dates || '');
                return {
                    degree: edu.degree || edu.course || '',
                    school: edu.school || edu.institution || edu.institute || '',
                    gradYear: edu.gradYear || edu.year || edu.graduationDate || (dates ? dates.split('-')[1]?.trim() || dates : ''),
                    gpa: edu.gpa || edu.grade || edu.details || '',
                    location: edu.location || ''
                };
            }),
            skills: getArr(data.skills, ['technicalSkills', 'professionalSkills', 'skillsList', 'coreCompetencies', 'expertise']),
            softSkills: getArr(data.softSkills, ['managementSkills', 'interpersonalSkills', 'softSkillsList']),
            certifications: getArr(data.certifications, ['certificates', 'personalCertifications', 'awards']).map(c => typeof c === 'string' ? { name: c } : c),
            projects: getArr(data.projects, ['projectList', 'customDetails', 'personalProjects']).filter(p => !p.heading || p.heading.toLowerCase().includes('project')).map(proj => {
                if (!proj) return {};
                return {
                    title: proj.title || proj.projectName || proj.name || proj.heading || '',
                    description: proj.description || proj.details || proj.content || '',
                    tech: proj.tech || proj.technologies || proj.techStack || '',
                    duration: proj.duration || proj.date || ''
                };
            }),
            achievements: getArr(data.achievements, ['awards', 'honors', 'achievementsList']),
            hobbies: getArr(data.hobbies, ['interests', 'hobbiesList', 'activities']),
            extraCurricular: getArr(data.extraCurricular, ['activities', 'volunteerWork']),
            socialLinks: getArr(data.socialLinks, ['socials', 'links', 'onlinePortfolios']),
            languages: getArr(data.languages, ['languagesKnown', 'languagesList']),
            referencesText: data.referencesText || (Array.isArray(data.references) && data.references.length > 0 ? '' : 'Available upon request'),
            references: Array.isArray(data.references) ? data.references : []
        };
    } catch (err) {
        console.error('CRITICAL: normalizeData failed:', err);
        return data;
    }
}

const TEMPLATES = {
    classic: (data) => {
        const d = normalizeData(data);
        const p = d.personalInfo;
        return `<!doctype html><html><head><style>@page { margin: 50pt; } body { font-family: "Times New Roman", serif; line-height: 1.4; color: #000; margin: 40px; } .header { text-align: center; margin-bottom: 20px; } .name { font-size: 24pt; font-weight: bold; } .section { margin-top: 15px; border-bottom: 1px solid #000; font-weight: bold; padding-bottom: 3px; text-transform: uppercase; } .item { margin-top: 10px; } .job-title { font-weight: bold; display: flex; justify-content: space-between; }</style></head><body><div class="header"><div class="name">${esc(p.fullName)}</div><div>${esc(p.email)} | ${esc(p.phone)} | ${esc(p.address)}</div></div>${d.summary ? `<div class="section">Summary</div><p>${esc(d.summary)}</p>` : ''}<div class="section">Work Experience</div>${d.experience.map(e => `<div class="item"><div class="job-title"><span>${esc(e.jobTitle)}</span><span>${esc(e.startDate)} - ${esc(e.endDate)}</span></div><i>${esc(e.company)}</i><p>${esc(e.description).replace(/\n/g, '<br>')}</p></div>`).join('')}<div class="section">Education</div>${d.education.map(e => `<div class="item"><div class="job-title"><span>${esc(e.degree)}</span><span>${esc(e.gradYear)}</span></div><i>${esc(e.school)}</i></div>`).join('')}<div class="section">Skills</div><p>${d.skills.join(' • ')}</p></body></html>`;
    },
    'minimal': (data) => {
        const d = normalizeData(data);
        const p = d.personalInfo;
        return `<!doctype html><html><head><style>@page{margin:40pt}body{font-family:Helvetica,Arial,sans-serif;color:#111;font-size:11pt;line-height:1.5;margin:40px}.header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;padding-bottom:10px;margin-bottom:15px}.name{font-size:20pt;font-weight:700}.meta{text-align:right;font-size:9pt;color:#666}section{margin-top:14px}h3{font-size:11pt;color:#000;text-transform:uppercase;margin:0 0 8px;border-bottom:1px solid #f0f0f0}ul{margin:5px 0 10px 18px;padding:0}li{margin-bottom:3px}</style></head><body><div class="header"><div class="name">${esc(p.fullName)}</div><div class="meta">${esc(p.email)}<br/>${esc(p.phone)}</div></div><section><h3>Profile</h3><p>${esc(d.summary)}</p></section><section><h3>Experience</h3>${d.experience.map(e => `<div style="margin-bottom:10px"><b>${esc(e.jobTitle)}</b> — ${esc(e.company)} (${esc(e.startDate)} - ${esc(e.endDate)})<div style="font-size:10pt;color:#444;margin-top:3px">${esc(e.description).replace(/\n/g, '<br>')}</div></div>`).join('')}</section><section><h3>Education</h3>${d.education.map(e => `<div><b>${esc(e.degree)}</b> — ${esc(e.school)} (${esc(e.gradYear)})</div>`).join('')}</section>${d.certifications.length ? `<section><h3>Certifications</h3><ul>${d.certifications.map(c => `<li>${esc(c.name)}</li>`).join('')}</ul></section>` : ''}${d.achievements.length ? `<section><h3>Achievements</h3><ul>${d.achievements.map(a => `<li>${esc(a)}</li>`).join('')}</ul></section>` : ''}<section><h3>Skills</h3><p>${d.skills.join(' • ')}</p></section></body></html>`;
    },
    'modern-pro': (data) => {
        const d = normalizeData(data);
        const p = d.personalInfo;
        return `<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;800&display=swap" rel="stylesheet"><style>@page{margin:0}body{font-family:'Inter',sans-serif;margin:0;display:flex;min-height:100vh;background:#fff}.left{width:30%;background:#0fa85a;color:#fff;padding:40px;box-sizing:border-box}.right{width:70%;padding:40px;box-sizing:border-box}.name{font-size:22pt;font-weight:800;margin-bottom:5px;line-height:1.1}.role{font-size:11pt;text-transform:uppercase;letter-spacing:1px;opacity:0.9;margin-bottom:25px}.sidebar-sec{margin-bottom:30px}.sidebar-sec h3{font-size:11pt;text-transform:uppercase;margin-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.2);padding-bottom:5px}.right h2{font-size:13pt;text-transform:uppercase;color:#0fa85a;margin-top:25px;border-bottom:2px solid #eee;padding-bottom:5px;margin-bottom:15px}.exp-item{margin-bottom:20px}.exp-title{font-weight:700;font-size:11.5pt;display:flex;justify-content:space-between}.company{color:#0fa85a;font-weight:600}.skill-tag{display:inline-block;background:rgba(255,255,255,0.15);padding:5px 10px;border-radius:4px;margin:2px;font-size:9pt}.bullet-list{margin:5px 0;padding-left:18px}.bullet-list li{margin-bottom:4px;font-size:10.5pt}</style></head><body><div class="left"><div class="name">${esc(p.fullName)}</div><div class="role">${esc(p.roleTitle)}</div><div class="sidebar-sec"><h3>Contact</h3>${esc(p.email)}<br/>${esc(p.phone)}<br/>${esc(p.address)}</div><div class="sidebar-sec"><h3>Skills</h3>${d.skills.map(s => `<div class="skill-tag">${esc(s)}</div>`).join('')}</div></div><div class="right">${d.summary ? `<h2>Profile</h2><p>${esc(d.summary)}</p>` : ''}<h2>Experience</h2>${d.experience.map(e => `<div class="exp-item"><div class="exp-title"><span>${esc(e.jobTitle)}</span><span style="font-weight:400;font-size:10pt;color:#666">${esc(e.startDate)} - ${esc(e.endDate)}</span></div><div class="company">${esc(e.company)}</div><p style="margin-top:5px;font-size:10.5pt">${esc(e.description).replace(/\n/g, '<br>')}</p></div>`).join('')}<h2>Education</h2>${d.education.map(e => `<div class="exp-item"><div class="exp-title"><span>${esc(e.degree)}</span><span style="font-weight:400;font-size:10pt;color:#666">${esc(e.gradYear)}</span></div><div class="muted">${esc(e.school)}</div></div>`).join('')}${d.certifications.length ? `<h2>Certifications</h2><ul class="bullet-list">${d.certifications.map(c => `<li>${esc(c.name)}</li>`).join('')}</ul>` : ''}${d.achievements.length ? `<h2>Achievements</h2><ul class="bullet-list">${d.achievements.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}</div></body></html>`;
    },
    'priya-analytics': (data) => {
        const d = normalizeData(data);
        const p = d.personalInfo;
        const section = (title, body) => body ? `<section style="margin-top:16px"><h2 style="font-size:11.5pt;font-weight:700;margin:0;text-transform:uppercase">${esc(title)}</h2><div style="border-top:1px solid #000;margin:2px 0 8px"></div>${body}</section>` : '';
        const educationHtml = d.education.map(e => `<p style="font-weight:700;margin:2px 0">${esc(e.degree)}</p><p style="margin:0 0 6px 0">${esc(e.school)}${e.gradYear ? `, ${esc(e.gradYear)}` : ''}${e.gpa ? ` | GPA: ${e.gpa}` : ''}</p>`).join('');
        const projectsHtml = d.projects.map(pr => `<p style="font-weight:700;margin:4px 0 0 0">${esc(pr.title)}</p>${pr.description ? `<p style="margin:0 0 6px 0">${esc(pr.description)}</p>` : ''}`).join('');
        const techSkillsHtml = d.skills.length ? `<ul style="margin:0 0 4px 15px;padding:0">${d.skills.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : '';
        const mgmtSkillsHtml = d.softSkills.length ? `<ul style="margin:0 0 4px 15px;padding:0">${d.softSkills.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : '';
        const personalDetailsHtml = [
            p.dateOfBirth ? `<p>Date of Birth: ${esc(p.dateOfBirth)}</p>` : '',
            p.gender ? `<p>Gender: ${esc(p.gender)}</p>` : '',
            p.nationality ? `<p>Nationality: ${esc(p.nationality)}</p>` : '',
            p.maritalStatus ? `<p>Marital Status: ${esc(p.maritalStatus)}</p>` : '',
            p.languagesKnown ? `<p>Languages Known: ${esc(p.languagesKnown)}</p>` : ''
        ].join('');
        return `<!doctype html><html><head><style>@page{margin:1in}body{font-family:Helvetica,Arial,sans-serif;font-size:10.5pt;color:#000;line-height:1.4;margin:0}header{background:#f2f2f2;padding:15px 25px;margin-bottom:10px}.name{font-size:18pt;font-weight:700}p{margin:0 0 4px}</style></head><body><header><div class="name">${esc(p.fullName)}</div><div style="font-size:10pt;margin-top:4px">${esc(p.email)} | ${esc(p.phone)} | ${esc(p.address)}</div>${p.linkedin || p.github ? `<div style="font-size:10pt;margin-top:8px">${p.linkedin ? `LinkedIn: ${esc(p.linkedin)} ` : ''}${p.github ? `GitHub: ${esc(p.github)}` : ''}</div>` : ''}</header><div style="padding:0 25px">${section('Career Objective', `<p>${esc(data.objective || d.summary)}</p>`)}${section('Education', educationHtml)}${section('Projects', projectsHtml)}${section('Technical Skills', techSkillsHtml)}${section('Management Skills', mgmtSkillsHtml)}${section('Professional Certifications', d.certifications.map(c => `<p>• ${esc(c.name)}</p>`).join(''))}${section('Achievements', d.achievements.map(a => `<p>${esc(a)}</p>`).join(''))}${section('Personal Details', personalDetailsHtml)}${section('References', `<p>${esc(d.referencesText)}</p>`)}</div></body></html>`;
    },
    'hemanth': (data) => {
        const d = normalizeData(data);
        const p = d.personalInfo;
        return `<!doctype html><html><head><style>@page{margin:0}body{background:#1a1a1a;color:#eee;font-family:'Helvetica Neue',Arial,sans-serif;margin:0;display:flex;min-height:100vh}.sidebar{width:30%;background:#0d0d0d;padding:40px 25px;border-right:3px solid #00ff88;box-sizing:border-box}.main{width:70%;padding:40px 35px;box-sizing:border-box}.name{font-size:32pt;color:#00ff88;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px}.section-title{color:#00ff88;text-transform:uppercase;border-bottom:2px solid #00ff88;padding-bottom:5px;margin:25px 0 15px;font-weight:700;letter-spacing:1.5px;position:relative}.item{margin-bottom:22px;border-left:2px solid #2a2a2a;padding-left:15px;position:relative}.item::before{content:'';position:absolute;left:-6px;top:5px;width:10px;height:10px;background:#00ff88;border-radius:50%;border:2px solid #1a1a1a}.skill-item{background:#2a2a2a;border:1px solid #00ff88;padding:5px 10px;margin:5px 3px;border-radius:4px;display:inline-block;font-size:9pt;color:#00ff88}.contact-item{margin-bottom:10px;font-size:9.5pt;color:#b0b0b0}</style></head><body><div class="sidebar"><div class="section-title">Contact</div><div class="contact-item">${esc(p.email)}</div><div class="contact-item">${esc(p.phone)}</div><div class="contact-item">${esc(p.address)}</div>${p.linkedin ? `<div class="contact-item">${esc(p.linkedin)}</div>` : ''}<div class="section-title">Skills</div>${d.skills.map(s => `<span class="skill-item">${esc(s)}</span>`).join('')}<div class="section-title">Certs</div>${d.certifications.map(c => `<div style="background:#2a2a2a;padding:10px;margin-bottom:10px;border-radius:6px;border-left:3px solid #00ff88;font-size:9pt">${esc(c.name)}</div>`).join('')}</div><div class="main"><div style="border-bottom:2px solid #00ff88;padding-bottom:20px;margin-bottom:30px"><div class="name">${esc(p.fullName)}</div><div style="font-size:14pt;color:#b0b0b0;margin-bottom:15px">${esc(p.roleTitle)}</div><div style="font-size:10pt;color:#d0d0d0">${esc(d.summary)}</div></div><div class="section-title">Experience</div>${d.experience.map(e => `<div class="item"><div style="color:#00ff88;font-weight:700;font-size:12pt">${esc(e.jobTitle)}</div><div style="font-weight:600;font-size:11pt">${esc(e.company)}</div><div style="font-size:9pt;color:#808080;font-style:italic;margin-bottom:8px">${esc(e.startDate)} - ${esc(e.endDate)}</div><div style="color:#c0c0c0;font-size:10pt">${esc(e.description).replace(/\n/g, '<br>')}</div></div>`).join('')}<div class="section-title">Projects</div>${d.projects.map(pr => `<div class="item"><div style="color:#00ff88;font-weight:700;font-size:12pt">${esc(pr.title)}</div><div style="color:#c0c0c0;font-size:10pt">${esc(pr.description)}</div></div>`).join('')}<div class="section-title">Education</div>${d.education.map(e => `<div class="item"><div style="color:#00ff88;font-weight:700;font-size:12pt">${esc(e.degree)}</div><div style="font-weight:600;font-size:11pt">${esc(e.school)}</div><div style="font-size:9pt;color:#808080;font-style:italic;margin-bottom:8px">${esc(e.gradYear)}</div></div>`).join('')}</div></body></html>`;
    },
    'rishi': (data) => {
        const d = normalizeData(data);
        const p = d.personalInfo;

        const skillsContent = d.skills.length > 0
            ? `<h2>Technical Skills</h2><p style="font-size:11pt;">${d.skills.join(' • ')}</p>`
            : '';

        return `<!doctype html><html><head><style>
            @page{size:A4;margin:1.5cm 1.8cm}
            body{font-family:'Times New Roman',serif;font-size:12pt;color:#000;line-height:1.4;margin:0}
            h1{font-size:22pt;text-align:center;margin-bottom:5pt;font-weight:700;text-transform:uppercase}
            .contact{text-align:center;font-size:10.5pt;margin-bottom:15pt;border-bottom:1px solid #000;padding-bottom:10pt}
            h2{font-size:13pt;font-weight:700;text-transform:uppercase;border-bottom:2.5px solid #000;padding-bottom:2pt;margin:15pt 0 8pt}
            .entry{margin-bottom:12pt}
            h3{font-size:12pt;font-weight:700;margin:0;display:inline-block}
            .date{float:right;font-size:11pt;font-weight:700}
            ul{margin:4pt 0 0 18pt}
            li{margin-bottom:3pt;font-size:11pt}
            .company-line{font-size:12pt;font-weight:700;margin-bottom:2pt}
            .role-line{font-style:italic;margin-bottom:4pt;display:block}
            .project-tech{font-size:10pt;font-weight:700;margin-top:2pt;display:block}
        </style></head><body>
            <h1>${esc(p.fullName)}</h1>
            <div class="contact">
                ${esc(p.address)} | ${esc(p.phone)}<br/>
                ${esc(p.email)} ${p.linkedin ? `| LinkedIn: ${esc(p.linkedin.replace(/https?:\/\//, ''))}` : ''} ${p.github ? `| GitHub: ${esc(p.github.replace(/https?:\/\//, ''))}` : ''}
            </div>
            
            ${(d.summary || data.objective) ? `<h2>Professional Summary</h2><p style="font-size:11pt;text-align:justify;">${esc(d.summary || data.objective)}</p>` : ''}
            
            <h2>Education</h2>
            ${d.education.map(e => `
                <div class="entry">
                    <div class="date">${esc(e.gradYear)}</div>
                    <div class="company-line">${esc(e.school)}</div>
                    <div>${esc(e.degree)} ${e.gpa ? `| GPA: ${esc(e.gpa)}` : ''}</div>
                </div>`).join('')}
            
            ${skillsContent}
            
            <h2>Experience</h2>
            ${d.experience.map(e => `
                <div class="entry">
                    <div class="date">${esc(e.startDate)} - ${esc(e.endDate)}</div>
                    <div class="company-line">${esc(e.company)}</div>
                    <span class="role-line">${esc(e.jobTitle)}</span>
                    <ul>${esc(e.description).split('\n').filter(Boolean).map(l => `<li>${esc(l.replace(/^[•\-\*]\s*/, ''))}</li>`).join('')}</ul>
                </div>`).join('')}
            
            <h2>Projects</h2>
            ${d.projects.map(pr => `
                <div class="entry">
                    <div class="company-line">${esc(pr.title)} ${pr.duration ? `<span class="date" style="font-weight:400">${esc(pr.duration)}</span>` : ''}</div>
                    ${pr.tech ? `<span class="project-tech">Technologies: ${esc(pr.tech)}</span>` : ''}
                    <div style="font-size:11pt;margin-top:2pt">${esc(pr.description).replace(/\n/g, '<br>')}</div>
                    ${pr.link ? `<div style="font-size:10pt;margin-top:2pt;color:#444">Link: ${esc(pr.link)}</div>` : ''}
                </div>`).join('')}
            
            ${d.softSkills.length > 0 ? `<h2>Personal Traits & Skills</h2><ul>${d.softSkills.map(s => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
        </body></html>`;
    },
    'template-4': (data) => {
        const d = normalizeData(data);
        const p = d.personalInfo;

        // Group skills into "categories" for the Technical Strengths section
        // If not already grouped, we'll split by colon or just put all under "Software & Tools"
        const skillsLines = d.skills.length > 0 ? d.skills : [];
        const technicalStrengthsHtml = skillsLines.length > 0 ? `
            <table style="width:100%; border-collapse:collapse; margin-top:5px;">
                ${skillsLines.map(s => {
            const parts = s.split(':');
            const label = parts.length > 1 ? parts[0].trim() : 'Software & Tools';
            const value = parts.length > 1 ? parts[1].trim() : parts[0].trim();
            return `<tr>
                        <td style="width:40%; font-weight:700; font-size:11pt; vertical-align:top; border:none; padding:4pt 0;">${esc(label)}</td>
                        <td style="width:60%; font-size:11pt; vertical-align:top; border:none; padding:4pt 0;">${esc(value)}</td>
                    </tr>`;
        }).slice(0, 4).join('')}
            </table>` : '';

        return `<!doctype html><html><head><style>
            @page { size: A4; margin: 1cm 1.5cm; }
            body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #000; line-height: 1.3; margin: 0; }
            .header { text-align: center; margin-bottom: 20px; }
            .name { font-size: 24pt; font-weight: 700; margin-bottom: 5pt; }
            .contact-info { font-size: 10.5pt; }
            h2 { font-size: 12pt; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2pt; margin: 15pt 0 8pt; }
            .section-content { margin-left: 2pt; }
            ul { margin: 5pt 0 10pt 20pt; padding: 0; }
            li { margin-bottom: 4pt; }
            .bold { font-weight: 700; }
            .italic { font-style: italic; }
            .split-container { display: flex; justify-content: space-between; gap: 40px; }
            .split-column { width: 48%; }
        </style></head><body>
            <div class="header">
                <div class="name">${esc(p.fullName)}</div>
                <div class="contact-info">
                    ${esc(p.address)}<br/>
                    (+91) ${esc(p.phone)} ${esc(p.email)}
                </div>
            </div>

            <section>
                <h2>EDUCATION</h2>
                <div class="section-content">
                    <div class="bold">${esc(d.education[0]?.school || '')}</div>
                    <div style="font-size:10.5pt; margin-top:2pt;">
                        ${esc(d.education[0]?.degree || '')}<br/>
                        ${d.education[0]?.gpa ? `${esc(d.education[0].gpa)}` : ''}
                    </div>
                </div>
            </section>

            <section>
                <h2>CARRIER OBJECTIVE</h2>
                <p class="section-content" style="text-align:justify;">${esc(d.summary || data.objective || '')}</p>
            </section>

            <section>
                <h2>PROJECTS</h2>
                <div class="section-content">
                    ${d.projects.map(pr => `
                        <div style="margin-bottom:10pt;">
                            <div class="bold">${esc(pr.title)}</div>
                            <div style="text-align:justify; margin-top:2pt;">${esc(pr.description)}</div>
                        </div>
                    `).join('')}
                </div>
            </section>

            <section>
                <h2>TECHNICAL STRENGTHS</h2>
                <div class="section-content">
                    ${technicalStrengthsHtml}
                </div>
            </section>

            <section>
                <h2>WORK EXPERIENCE</h2>
                <div class="section-content">
                    ${d.experience.map(e => `
                        <div style="margin-bottom:12pt;">
                            <div class="bold">${esc(e.company)}</div>
                            <ul style="margin-top:4pt;">
                                ${esc(e.description).split('\n').filter(Boolean).map(line => `<li>${esc(line.replace(/^[•\-\*]\s*/, ''))}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </section>

            <div class="split-container">
                <div class="split-column">
                    <section>
                        <h2>ACADEMIC ACHIEVEMENTS</h2>
                        <ul class="section-content">
                            ${d.achievements.map(a => `<li>${esc(a)}</li>`).join('')}
                        </ul>
                    </section>
                </div>
                <div class="split-column">
                    <section>
                        <h2>EXTRA-CURRICULAR</h2>
                        <ul class="section-content">
                            ${toArray(data.extraCurricular || []).map(item => `<li>${esc(item)}</li>`).join('')}
                        </ul>
                    </section>
                    <section>
                        <h2>PERSONAL TRAITS</h2>
                        <ul class="section-content">
                            ${d.softSkills.map(s => `<li>${esc(s)}</li>`).join('')}
                        </ul>
                    </section>
                </div>
            </div>
        </body></html>`;
    },
    'hiero-elite': (data) => {
        const d = normalizeData(data);
        const p = d.personalInfo;
        return `<!doctype html><html><head><style>@page{margin:30pt}body{font-family:'Inter',system-ui,sans-serif;color:#111827;line-height:1.5;margin:30px}.header{display:flex;justify-content:space-between;border-bottom:2px solid #0ea5e9;padding-bottom:10px;margin-bottom:20px}.name{font-size:24px;font-weight:700;letter-spacing:-0.02em}.role{font-size:13px;color:#0ea5e9;text-transform:uppercase;font-weight:700;letter-spacing:0.1em}.contact{font-size:10px;color:#4b5563;text-align:right}.sec-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;margin:15px 0 5px;border-bottom:1px solid #e5e7eb;padding-bottom:3px}p{font-size:10px;margin:0 0 5px}.chip{font-size:9px;padding:2px 8px;background:#f0f9ff;color:#0369a1;border:1px solid #bae6fd;border-radius:12px;margin:2px;display:inline-block}</style></head><body><div class="header"><div><div class="name">${esc(p.fullName)}</div><div class="role">${esc(p.roleTitle)}</div></div><div class="contact">${esc(p.email)}<br/>${esc(p.phone)}<br/>${esc(p.address)}</div></div><section><div class="sec-title">Profile</div><p>${esc(d.summary)}</p></section><section><div class="sec-title">Experience</div>${d.experience.map(e => `<div><b>${esc(e.jobTitle)}</b>, ${esc(e.company)} <span style="float:right;font-weight:400;color:#6b7280">${esc(e.startDate)} - ${esc(e.endDate)}</span><p style="margin-top:2px">${esc(e.description).replace(/\n/g, '<br>')}</p></div>`).join('')}</section><section><div class="sec-title">Education</div>${d.education.map(e => `<div><b>${esc(e.degree)}</b>, ${esc(e.school)} <span style="float:right;font-weight:400;color:#6b7280">${esc(e.gradYear)}</span></div>`).join('')}</section><section><div class="sec-title">Skills</div>${d.skills.map(s => `<span class="chip">${esc(s)}</span>`).join('')}</section></body></html>`;
    },
    'hiero-essence': (data) => {
        const d = normalizeData(data);
        const p = d.personalInfo || {};
        const orange = "#f5a623";
        const darkOrange = "#b37a1a";

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root { --orange: ${orange}; --dark-orange: ${darkOrange}; --bg: #000000; --sidebar-bg: #333333; }
        * { box-sizing: border-box; }
        body { font-family: 'Poppins', sans-serif; margin: 0; padding: 0; background: var(--bg); color: #ffffff; display: flex; min-height: 100vh; font-size: 8pt; line-height: 1.3; }
        
        .sidebar { width: 33%; background: var(--sidebar-bg); min-height: 100vh; position: relative; }
        .main { width: 67%; padding: 25px 20px; background: var(--bg); }

        .banner-photo { position: relative; width: 100%; height: 160px; background: #111; overflow: hidden; padding: 10px 10px; }
        .banner-photo img { width: 100%; height: 120px; object-fit: cover; border: none; }
        .banner-photo .initials { width: 100%; height: 120px; background: #222; display: flex; align-items: center; justify-content: center; font-size: 32pt; font-weight: 700; color: var(--orange); }

        .name-area { margin-top: -25px; text-align: center; color: white; padding: 0 5px; }
        .name { font-size: 15pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; line-height: 1.1; }
        .title { font-size: 8pt; color: var(--orange); text-transform: uppercase; letter-spacing: 1.2px; margin-top: 5px; font-weight: 400; }

        .ribbon-container { position: relative; margin: 15px 0 10px 0; z-index: 10; width: 100%; }
        .ribbon { background: var(--orange); color: #fff; padding: 5px 15px; font-weight: 700; text-transform: uppercase; font-size: 8.5pt; position: relative; width: calc(100% - 10px); }
        
        .sidebar .ribbon::after { content: ''; position: absolute; right: -8px; top: 0; border-left: 8px solid var(--orange); border-bottom: 10px solid transparent; }
        .sidebar .fold { position: absolute; right: -8px; top: 10px; border-left: 8px solid var(--dark-orange); border-bottom: 6px solid transparent; }

        .main .ribbon-container { text-align: center; margin-left: -20px; margin-right: -20px; width: calc(100% + 40px); }
        .main .ribbon { width: calc(100% - 12px); display: inline-block; margin-left: 12px; }
        .main .ribbon::before { content: ''; position: absolute; left: -12px; top: 0; border-right: 12px solid var(--orange); border-bottom: 12px solid transparent; }
        .main .fold { position: absolute; left: 0; top: 12px; border-right: 12px solid var(--dark-orange); border-bottom: 8px solid transparent; }

        .side-content { padding: 20px 15px; }
        .contact-item { display: flex; margin-bottom: 8px; font-size: 7.5pt; align-items: flex-start; }
        .bullet { color: var(--orange); margin-right: 10px; font-size: 9pt; line-height: 1; margin-top: 1px; }

        .progress-container { margin-bottom: 10px; }
        .progress-label { font-size: 7.5pt; margin-bottom: 4px; text-transform: uppercase; color: #fff; font-weight: 600; }
        .progress-bar { height: 4px; background: #111111; border-radius: 2px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--orange); border-radius: 2px; }

        .hobbies-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 7.5pt; color: #fff; }

        .about-text { text-align: justify; color: #eeeeee; margin-bottom: 15px; white-space: pre-line; padding: 0 5px; font-size: 8pt; line-height: 1.25; }

        .item { margin-bottom: 12px; position: relative; padding-left: 20px; }
        .item-dot { position: absolute; left: 0; top: 5px; width: 7px; height: 7px; background: var(--orange); border-radius: 50%; }
        .item-header { display: flex; justify-content: space-between; margin-bottom: 2px; align-items: flex-start; }
        .item-name { font-weight: 700; font-size: 9.5pt; color: #fff; text-transform: uppercase; }
        .item-date { color: var(--orange); font-size: 8pt; font-weight: 600; min-width: 80px; text-align: right; }
        .item-sub { color: var(--orange); font-size: 8.5pt; font-weight: 600; margin-bottom: 3px; }
        .item-desc { color: #dddddd; font-size: 8pt; line-height: 1.3; }

        .skills-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px 15px; }

        @media print {
            body { -webkit-print-color-adjust: exact; }
            .sidebar { background: var(--sidebar-bg) !important; }
            .main { background: var(--bg) !important; }
            .ribbon { background: var(--orange) !important; }
        }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="banner-photo">
            ${p.profilePhoto ? `<img src="${p.profilePhoto}" alt="Profile">` : `<div class="initials">${p.fullName?.charAt(0) || 'U'}</div>`}
        </div>
        <div class="name-area">
            <h1 class="name">${esc(p.fullName)}</h1>
            <div class="title">${esc(p.roleTitle || 'Professional')}</div>
        </div>

        <div class="side-content">
            <div class="ribbon-container">
                <div class="ribbon">Contact</div>
                <div class="fold"></div>
            </div>
            ${p.address ? `<div class="contact-item"><span class="bullet">●</span> <span>${esc(p.address)}</span></div>` : ''}
            ${p.phone ? `<div class="contact-item"><span class="bullet">●</span> <span>${esc(p.phone)}</span></div>` : ''}
            ${p.email ? `<div class="contact-item"><span class="bullet">●</span> <span>${esc(p.email)}</span></div>` : ''}
            ${p.website ? `<div class="contact-item"><span class="bullet">●</span> <span>${esc(p.website)}</span></div>` : ''}

            ${d.socialLinks?.length ? `
                <div class="ribbon-container">
                    <div class="ribbon">Portfolio</div>
                    <div class="fold"></div>
                </div>
                ${d.socialLinks.map(s => `
                    <div class="contact-item"><span class="bullet">●</span> <span>${esc(s)}</span></div>
                `).join('')}
            ` : ''}

            ${d.languages?.length ? `
                <div class="ribbon-container">
                    <div class="ribbon">Language</div>
                    <div class="fold"></div>
                </div>
                ${d.languages.map((lang, i) => `
                    <div class="progress-container">
                        <div class="progress-label">${esc(lang.name || lang)}</div>
                        <div class="progress-bar"><div class="progress-fill" style="width: ${85 - (i % 3 * 10)}%;"></div></div>
                    </div>
                `).join('')}
            ` : ''}

            ${d.hobbies?.length ? `
                <div class="ribbon-container">
                    <div class="ribbon">Hobbies</div>
                    <div class="fold"></div>
                </div>
                <div class="hobbies-grid">
                    ${d.hobbies.map(h => `<div>${esc(h)}</div>`).join('')}
                </div>
            ` : ''}
        </div>
    </div>

    <div class="main">
        ${d.summary ? `
            <div class="ribbon-container">
                <div class="ribbon">About Me</div>
                <div class="fold"></div>
            </div>
            <div class="about-text">${esc(d.summary)}</div>
        ` : ''}

        ${d.education?.length ? `
            <div class="ribbon-container">
                <div class="ribbon">Education</div>
                <div class="fold"></div>
            </div>
            ${d.education.map(e => `
                <div class="item">
                    <div class="item-dot"></div>
                    <div class="item-header">
                        <div class="item-name">${esc(e.school)}</div>
                        <div class="item-date">${esc(e.gradYear)}</div>
                    </div>
                    <div class="item-sub">${esc(e.degree)}</div>
                    ${e.gpa ? `<div class="item-desc">Result: CGPA ${esc(e.gpa)}</div>` : ''}
                </div>
            `).join('')}
        ` : ''}

        ${d.experience?.length ? `
            <div class="ribbon-container">
                <div class="ribbon">Experience</div>
                <div class="fold"></div>
            </div>
            ${d.experience.map(e => `
                <div class="item">
                    <div class="item-dot"></div>
                    <div class="item-header">
                        <div class="item-name">${esc(e.jobTitle)}</div>
                        <div class="item-date">${esc(e.startDate)} - ${esc(e.endDate)}</div>
                    </div>
                    <div class="item-sub">${esc(e.company)}</div>
                    <div class="item-desc">${esc(e.description).replace(/\n/g, '<br>')}</div>
                </div>
            `).join('')}
        ` : ''}

        ${d.projects?.length ? `
            <div class="ribbon-container">
                <div class="ribbon">Projects</div>
                <div class="fold"></div>
            </div>
            ${d.projects.map(proj => `
                <div class="item">
                    <div class="item-dot"></div>
                    <div class="item-header">
                        <div class="item-name">${esc(proj.title)}</div>
                        <div class="item-date">${esc(proj.duration || '')}</div>
                    </div>
                    ${proj.tech ? `<div class="item-sub">${esc(proj.tech)}</div>` : ''}
                    <div class="item-desc">${esc(proj.description)}</div>
                </div>
            `).join('')}
        ` : ''}

        ${d.certifications?.length ? `
            <div class="ribbon-container">
                <div class="ribbon">Certifications</div>
                <div class="fold"></div>
            </div>
            ${d.certifications.map(c => `
                <div class="contact-item" style="margin-left: 20px;">
                    <span class="bullet" style="font-size: 8pt;">●</span>
                    <span class="item-desc" style="color: #fff; font-weight: 600;">${esc(c.name || c)}</span>
                </div>
            `).join('')}
        ` : ''}

        ${d.skills?.length ? `
            <div class="ribbon-container">
                <div class="ribbon">Professional Skills</div>
                <div class="fold"></div>
            </div>
            <div class="skills-grid">
                ${d.skills.map((s, i) => `
                    <div class="progress-container">
                        <div class="progress-label" style="font-size: 7pt;">${esc(s.name || s)}</div>
                        <div class="progress-bar"><div class="progress-fill" style="width: ${80 + (i % 15)}%;"></div></div>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    </div>
</body>
</html>`;
    }
};

module.exports = {
    generateTemplateHTML: (templateId, data) => {
        const id = (templateId || 'classic').toLowerCase();

        // Template Aliases
        const aliasMap = {
            'priya': 'priya-analytics',
            'priya-elegant': 'priya-analytics',
            'rishi': 'modern-pro',
            'minimal': 'minimal',
            'elite': 'hiero-elite',
            'hiero-elite': 'hiero-elite',
            'modern-pro': 'modern-pro',
            'template4': 'template-4',
            'template-4': 'template-4',
            'hiero-essence': 'hiero-essence',
            'essence': 'hiero-essence'
        };

        const finalId = aliasMap[id] || id;
        const generator = TEMPLATES[finalId] || TEMPLATES.classic;
        return generator(data);
    }
};

