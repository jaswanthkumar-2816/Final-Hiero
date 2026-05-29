function normalizeWordData(data) {
    const {
        personalInfo = {},
        summary = '',
    } = data;

    let experience = data.experience || [];
    let education = data.education || [];
    let projects = data.projects || [];
    if (typeof projects === 'string') {
        projects = projects.split('\n').map(p => ({ name: p.trim(), title: p.trim(), description: '' })).filter(p => p.name);
    } else if (!Array.isArray(projects)) {
        projects = [];
    }
    let technicalSkills = data.skills || data.technicalSkills || '';
    let softSkills = data.softSkills || '';
    let achievements = data.achievements || '';
    let certifications = data.certifications || '';
    let languages = data.languages || '';
    let hobbies = data.hobbies || data.interests || '';

    // Slice all arrays to guarantee strict single-page parity
    if (Array.isArray(experience)) experience = experience.slice(0, 3);
    if (Array.isArray(education)) education = education.slice(0, 2);
    if (Array.isArray(projects)) projects = projects.slice(0, 2);

    if (Array.isArray(technicalSkills)) {
        technicalSkills = technicalSkills.slice(0, 12).map(s => typeof s === 'object' ? (s.name || s.skill || '') : s).join(', ');
    } else if (typeof technicalSkills === 'string') {
        technicalSkills = technicalSkills.split(/[\n,;]/).map(s => s.trim()).filter(Boolean).slice(0, 12).join(', ');
    }

    if (Array.isArray(softSkills)) {
        softSkills = softSkills.slice(0, 5).join(', ');
    } else if (typeof softSkills === 'string') {
        softSkills = softSkills.split(/[\n,;]/).map(s => s.trim()).filter(Boolean).slice(0, 5).join(', ');
    }

    if (Array.isArray(achievements)) {
        achievements = achievements.slice(0, 3).join('; ');
    } else if (typeof achievements === 'string') {
        achievements = achievements.split(/[\n;]/).map(s => s.trim()).filter(Boolean).slice(0, 3).join('; ');
    }

    if (Array.isArray(certifications)) {
        certifications = certifications.slice(0, 3).map(c => typeof c === 'object' ? (c.name || c.title || '') : c).join(', ');
    } else if (typeof certifications === 'string') {
        certifications = certifications.split(/[\n,;]/).map(s => s.trim()).filter(Boolean).slice(0, 3).join(', ');
    }

    if (Array.isArray(languages)) {
        languages = languages.slice(0, 4).join(', ');
    } else if (typeof languages === 'string') {
        languages = languages.split(/[\n,;]/).map(s => s.trim()).filter(Boolean).slice(0, 4).join(', ');
    }

    if (Array.isArray(hobbies)) {
        hobbies = hobbies.slice(0, 4).join(', ');
    } else if (typeof hobbies === 'string') {
        hobbies = hobbies.split(/[\n,;]/).map(s => s.trim()).filter(Boolean).slice(0, 4).join(', ');
    }

    return {
        personalInfo,
        summary,
        experience,
        education,
        projects,
        technicalSkills,
        softSkills,
        achievements,
        certifications,
        languages,
        hobbies
    };
}

function normalizePhotoSrc(photo) {
    if (!photo) return '';
    const s = String(photo).trim();
    if (!s) return '';
    if (s.startsWith('data:')) return s;
    if (/^https?:\/\//i.test(s)) return s;
    // Assume raw base64; most uploads will be jpeg/png
    const b64 = s.replace(/\s+/g, '');
    return `data:image/jpeg;base64,${b64}`;
}

function generateTopDownWordHTML(data, config) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const c = config.colors;
    
    return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Resume</title><style>
        @page { size: A4; margin: 14mm 14mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: '${config.font || 'Arial'}', sans-serif; 
            line-height: 1.25; 
            color: ${c.text || '#333333'}; 
            background: #f0f0f0; 
        }
        .page {
            width: 210mm;
            height: 297mm;
            margin: 0 auto;
            padding: 14mm 14mm;
            background: ${c.background || '#ffffff'};
            box-shadow: 0 2px 16px rgba(0,0,0,0.13);
        }
        .header { text-align: ${config.headerAlign || 'left'}; margin-bottom: 10pt; border-bottom: ${config.headerBorder ? '2.5pt solid ' + (c.accent || c.primary) : 'none'}; padding-bottom: 5pt; }
        .name { font-size: 24pt; font-weight: bold; margin: 0; color: ${c.primary}; text-transform: uppercase; letter-spacing: 1px; }
        .role { font-size: 11pt; color: ${c.secondary || c.primary}; margin-top: 3pt; font-weight: bold; text-transform: uppercase; }
        .contact { font-size: 9.5pt; color: ${c.text || '#333333'}; margin-top: 3pt; }
        .section-title { font-size: 11.5pt; font-weight: bold; color: ${c.primary}; margin-top: 12pt; margin-bottom: 5pt; text-transform: uppercase; border-bottom: 1.5pt solid ${c.accent || c.secondary || c.primary}; padding-bottom: 2pt; }
        .item-title { font-size: 10pt; font-weight: bold; color: ${c.text || '#222222'}; margin-top: 6pt; text-transform: uppercase; }
        .item-meta { font-size: 9pt; color: ${c.secondary || '#666666'}; font-style: italic; margin-bottom: 2pt; }
        .content { font-size: 9.5pt; margin-bottom: 4pt; text-align: justify; color: ${c.text || '#222222'}; }
        ul { margin-top: 2pt; margin-bottom: 3pt; padding-left: 15pt; }
        li { margin-bottom: 2pt; font-size: 9.5pt; color: ${c.text || '#333333'}; }
    </style></head>
    <body>
        <div class="page">
            <div class='header'>
                <div class='name'>${p.fullName || 'RESUME'}</div>
                ${p.roleTitle ? `<div class='role'>${p.roleTitle}</div>` : ''}
                <div class='contact'>${[p.address, p.phone, p.email, p.linkedin, p.github, p.website].filter(Boolean).join('  |  ')}</div>
            </div>
            
            ${d.summary ? `
                <div class='section-title'>PROFESSIONAL SUMMARY</div>
                <div class='content'>${d.summary}</div>
            ` : ''}

            ${d.experience.length > 0 ? `
                <div class='section-title'>WORK EXPERIENCE</div>
                ${d.experience.map(exp => `
                    <div class='item-title'>${(exp.jobTitle || '').toUpperCase()}</div>
                    <div class='item-meta'>${exp.company || ''} | ${exp.startDate || ''} - ${exp.endDate || 'Present'} ${exp.location ? '| ' + exp.location : ''}</div>
                    <div class='content'>${exp.description ? `<ul>${exp.description.split('\n').filter(l => l.trim()).map(l => `<li>${l.replace(/^[\*-•]\s*/, '')}</li>`).join('')}</ul>` : ''}</div>
                `).join('')}
            ` : ''}

            ${d.education.length > 0 ? `
                <div class='section-title'>EDUCATION</div>
                ${d.education.map(edu => `
                    <div class='item-title'>${edu.degree || ''}</div>
                    <div class='item-meta'>${edu.school || ''} | ${edu.gradYear || ''} ${edu.gpa ? '| GPA: ' + edu.gpa : ''}</div>
                `).join('')}
            ` : ''}

            ${d.projects.length > 0 ? `
                <div class='section-title'>PROJECTS</div>
                ${d.projects.map(proj => `
                    <div class='item-title'>${(proj.name || proj.title || '').toUpperCase()}</div>
                    ${proj.tech || proj.technologies ? `<div class='item-meta'>Technologies: ${proj.tech || proj.technologies}</div>` : ''}
                    <div class='content'>${proj.description ? `<ul>${proj.description.split('\n').filter(l => l.trim()).map(l => `<li>${l.replace(/^[\*-•]\s*/, '')}</li>`).join('')}</ul>` : ''}</div>
                `).join('')}
            ` : ''}

            ${d.technicalSkills ? `
                <div class='section-title'>TECHNICAL SKILLS</div>
                <div class='content'>${d.technicalSkills}</div>
            ` : ''}

            ${d.certifications ? `
                <div class='section-title'>CERTIFICATIONS</div>
                <div class='content'>${d.certifications}</div>
            ` : ''}
            
            ${d.achievements ? `
                <div class='section-title'>ACHIEVEMENTS</div>
                <div class='content'><ul>${d.achievements.split(';').map(a => `<li>${a.trim()}</li>`).join('')}</ul></div>
            ` : ''}
        </div>
    </body>
    </html>`;
}

function generateSidebarWordHTML(data, config) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const c = config.colors;
    
    // Construct Sidebar
    let sidebarHTML = `
        <div style="background-color: ${c.sidebarBg || '#111827'}; color: ${c.sidebarText || '#ffffff'}; padding: 15pt 12pt; min-height: 100%;">
            ${config.sidebarPosition === 'left' ? `
            <h1 style="color: ${c.sidebarText || '#ffffff'}; font-size: 20pt; font-weight: bold; margin: 0 0 4pt 0; text-transform: uppercase; letter-spacing: 0.5px;">${p.fullName || 'RESUME'}</h1>
            ${p.roleTitle ? `<h2 style="color: ${config.roleBg ? '#ffffff' : (c.sidebarAccent || '#ffffff')}; background-color: ${config.roleBg ? config.roleBg : 'transparent'}; padding: ${config.roleBg ? '2pt 6pt' : '0'}; display: inline-block; font-size: 10.5pt; font-weight: bold; margin: 0 0 10pt 0; text-transform: uppercase;">${p.roleTitle}</h2>` : ''}
            ` : ''}
            
            <h3 style="color: ${c.sidebarAccent || '#ffffff'}; font-size: 11pt; font-weight: bold; border-bottom: 1.5pt solid ${c.sidebarAccent || '#ffffff'}; padding-bottom: 2pt; margin-top: 10pt; margin-bottom: 6pt; text-transform: uppercase;">CONTACT</h3>
            <div style="font-size: 9pt; line-height: 1.4; margin-bottom: 12pt;">
                ${[p.phone, p.email, p.address, p.linkedin, p.github, p.website].filter(Boolean).map(item => `<div>• ${item}</div>`).join('')}
            </div>

            ${d.technicalSkills ? `
            <h3 style="color: ${c.sidebarAccent || '#ffffff'}; font-size: 11pt; font-weight: bold; border-bottom: 1.5pt solid ${c.sidebarAccent || '#ffffff'}; padding-bottom: 2pt; margin-top: 10pt; margin-bottom: 6pt; text-transform: uppercase;">SKILLS</h3>
            <div style="font-size: 9pt; line-height: 1.4; margin-bottom: 12pt;">
                ${d.technicalSkills.split(',').slice(0, 10).map(s => `<div>• ${s.trim()}</div>`).join('')}
            </div>
            ` : ''}

            ${d.education.length > 0 ? `
            <h3 style="color: ${c.sidebarAccent || '#ffffff'}; font-size: 11pt; font-weight: bold; border-bottom: 1.5pt solid ${c.sidebarAccent || '#ffffff'}; padding-bottom: 2pt; margin-top: 10pt; margin-bottom: 6pt; text-transform: uppercase;">EDUCATION</h3>
            <div style="font-size: 9pt; line-height: 1.3; margin-bottom: 12pt;">
                ${d.education.map(edu => `
                    <div style="font-weight: bold; margin-bottom: 1pt; color: ${c.sidebarText || '#ffffff'};">${edu.degree || ''}</div>
                    <div style="margin-bottom: 4pt; opacity: 0.85;">${edu.school || ''}<br/>${edu.gradYear || ''}</div>
                `).join('')}
            </div>
            ` : ''}

            ${d.languages ? `
            <h3 style="color: ${c.sidebarAccent || '#ffffff'}; font-size: 11pt; font-weight: bold; border-bottom: 1.5pt solid ${c.sidebarAccent || '#ffffff'}; padding-bottom: 2pt; margin-top: 10pt; margin-bottom: 6pt; text-transform: uppercase;">LANGUAGES</h3>
            <div style="font-size: 9pt; line-height: 1.4; margin-bottom: 12pt;">
                ${d.languages.split(',').map(s => `<div>• ${s.trim()}</div>`).join('')}
            </div>
            ` : ''}
            
            ${d.certifications ? `
            <h3 style="color: ${c.sidebarAccent || '#ffffff'}; font-size: 11pt; font-weight: bold; border-bottom: 1.5pt solid ${c.sidebarAccent || '#ffffff'}; padding-bottom: 2pt; margin-top: 10pt; margin-bottom: 6pt; text-transform: uppercase;">CERTIFICATIONS</h3>
            <div style="font-size: 9pt; line-height: 1.4; margin-bottom: 12pt;">
                ${d.certifications.split(',').slice(0, 3).map(s => `<div>• ${s.trim()}</div>`).join('')}
            </div>
            ` : ''}
        </div>
    `;

    // Construct Main Content
    let mainHTML = `
        <div style="padding: 15pt 20pt; min-height: 100%;">
            ${config.sidebarPosition === 'right' ? `
            <h1 style="color: ${c.primary || '#111827'}; font-size: 22pt; font-weight: bold; margin: 0 0 4pt 0; text-transform: uppercase; letter-spacing: 0.5px;">${p.fullName || 'RESUME'}</h1>
            ${p.roleTitle ? `<h2 style="color: ${config.roleBg ? '#ffffff' : (c.secondary || '#555555')}; background-color: ${config.roleBg ? config.roleBg : 'transparent'}; padding: ${config.roleBg ? '2pt 6pt' : '0'}; display: inline-block; font-size: 10.5pt; font-weight: bold; margin: 0 0 10pt 0; text-transform: uppercase;">${p.roleTitle}</h2>` : ''}
            ` : ''}

            ${d.summary ? `
            <h3 style="color: ${c.primary || '#111827'}; font-size: 11.5pt; font-weight: bold; border-bottom: 1.5pt solid ${c.secondary || '#cccccc'}; padding-bottom: 2pt; margin-top: 0; margin-bottom: 8pt; text-transform: uppercase;">PROFILE</h3>
            <div style="font-size: 9.5pt; line-height: 1.4; margin-bottom: 12pt; text-align: justify; color: ${c.text || '#222222'};">${d.summary}</div>
            ` : ''}

            ${d.experience.length > 0 ? `
            <h3 style="color: ${c.primary || '#111827'}; font-size: 11.5pt; font-weight: bold; border-bottom: 1.5pt solid ${c.secondary || '#cccccc'}; padding-bottom: 2pt; margin-top: 0; margin-bottom: 8pt; text-transform: uppercase;">EXPERIENCE</h3>
            ${d.experience.map(exp => `
                <div style="margin-bottom: 10pt;">
                  <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 2pt;">
                    <tr>
                      <td style="font-size: 10pt; font-weight: bold; color: ${c.text || '#111827'}; text-align: left; text-transform: uppercase; padding: 0;">${exp.jobTitle || ''}</td>
                      <td style="font-size: 9pt; color: ${c.secondary || '#555555'}; text-align: right; padding: 0; font-weight: bold;">${exp.startDate || ''} - ${exp.endDate || 'Present'}</td>
                    </tr>
                  </table>
                  <div style="font-size: 9pt; color: ${c.secondary || '#555555'}; font-style: italic; margin-bottom: 3pt;">${exp.company || ''}${exp.location ? ' / ' + exp.location : ''}</div>
                  ${exp.description ? `<ul style="margin-top: 0; padding-left: 12pt; color: ${c.text || '#222222'}; font-size: 9pt; margin-bottom: 0;">${exp.description.split('\n').filter(l => l.trim()).map(l => `<li style="margin-bottom: 2pt;">${l.replace(/^[\*-•]\s*/, '')}</li>`).join('')}</ul>` : ''}
                </div>
            `).join('')}
            ` : ''}

            ${d.projects.length > 0 ? `
            <h3 style="color: ${c.primary || '#111827'}; font-size: 11.5pt; font-weight: bold; border-bottom: 1.5pt solid ${c.secondary || '#cccccc'}; padding-bottom: 2pt; margin-top: 0; margin-bottom: 8pt; text-transform: uppercase;">PROJECTS</h3>
            ${d.projects.map(proj => `
                <div style="margin-bottom: 10pt;">
                  <div style="font-size: 10pt; font-weight: bold; color: ${c.text || '#111827'}; text-transform: uppercase;">${proj.name || proj.title || ''}</div>
                  ${proj.tech || proj.technologies ? `<div style="font-size: 8.5pt; color: ${c.secondary || '#555555'}; font-weight: bold; margin-bottom: 2pt;">Technologies: ${proj.tech || proj.technologies}</div>` : ''}
                  ${proj.description ? `<ul style="margin-top: 0; padding-left: 12pt; color: ${c.text || '#222222'}; font-size: 9pt; margin-bottom: 0;">${proj.description.split('\n').filter(l => l.trim()).map(l => `<li style="margin-bottom: 2pt;">${l.replace(/^[\*-•]\s*/, '')}</li>`).join('')}</ul>` : ''}
                </div>
            `).join('')}
            ` : ''}

            ${d.achievements ? `
            <h3 style="color: ${c.primary || '#111827'}; font-size: 11.5pt; font-weight: bold; border-bottom: 1.5pt solid ${c.secondary || '#cccccc'}; padding-bottom: 2pt; margin-top: 0; margin-bottom: 8pt; text-transform: uppercase;">ACHIEVEMENTS</h3>
            <ul style="margin-top: 0; padding-left: 12pt; color: ${c.text || '#222222'}; font-size: 9pt;">
                ${d.achievements.split(';').map(a => `<li style="margin-bottom: 2pt;">${a.trim()}</li>`).join('')}
            </ul>
            ` : ''}
        </div>
    `;

    return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Resume</title><style>
        @page { size: A4; margin: 14mm 14mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: '${config.font || 'Arial'}', sans-serif; 
            margin: 0; 
            padding: 0; 
            background: #f0f0f0; 
            color: ${c.text || '#333333'}; 
        }
        .page {
            width: 210mm;
            height: 297mm;
            margin: 0 auto;
            background: ${c.background || '#ffffff'};
            box-shadow: 0 2px 16px rgba(0,0,0,0.13);
            overflow: hidden;
        }
        table { width: 100%; border-collapse: collapse; }
        td { vertical-align: top; }
    </style></head>
    <body>
        <div class="page">
            <table style="width: 100%; height: 297mm; background-color: ${c.background || '#ffffff'};">
                <tr>
                    ${config.sidebarPosition === 'left' ? `
                        <td style="width: 32%; background-color: ${c.sidebarBg || '#1f2a44'}; vertical-align: top; padding: 0;">${sidebarHTML}</td>
                        <td style="width: 68%; background-color: ${c.background || '#ffffff'}; vertical-align: top; padding: 0;">${mainHTML}</td>
                    ` : `
                        <td style="width: 68%; background-color: ${c.background || '#ffffff'}; vertical-align: top; padding: 0;">${mainHTML}</td>
                        <td style="width: 32%; background-color: ${c.sidebarBg || '#1f2a44'}; vertical-align: top; padding: 0;">${sidebarHTML}</td>
                    `}
                </tr>
            </table>
        </div>
    </body>
    </html>`;
}

const TEMPLATE_CONFIGS = {
    // Top-Down Templates
    'classic': { type: 'top-down', font: 'Times New Roman', headerAlign: 'center', headerBorder: true, colors: { primary: '#000000', secondary: '#333333', text: '#222222', background: '#FFFFFF', accent: '#000000' } },
    'minimal': { type: 'top-down', font: 'Georgia', headerAlign: 'center', headerBorder: false, colors: { primary: '#000000', secondary: '#333333', text: '#333333', background: '#FFFFFF', accent: '#666666' } },
    'modern-pro': { type: 'top-down', font: 'Arial', headerAlign: 'left', headerBorder: true, colors: { primary: '#2ae023', secondary: '#1a8b17', text: '#2d3748', background: '#FFFFFF', accent: '#2ae023' } },
    'hiero-tech': { type: 'top-down', font: 'Courier New', headerAlign: 'left', headerBorder: true, colors: { primary: '#4ade80', secondary: '#60a5fa', text: '#a3a3a3', background: '#1e1e1e', accent: '#4ade80' } },
    'tech-focus': { type: 'top-down', font: 'Courier New', headerAlign: 'left', headerBorder: true, colors: { primary: '#4ade80', secondary: '#60a5fa', text: '#a3a3a3', background: '#1e1e1e', accent: '#4ade80' } },
    'ats-optimized': { type: 'top-down', font: 'Times New Roman', headerAlign: 'left', headerBorder: false, colors: { primary: '#000000', secondary: '#000000', text: '#222222', background: '#FFFFFF', accent: '#000000' } },
    'creative-bold': { type: 'top-down', font: 'Helvetica', headerAlign: 'center', headerBorder: false, colors: { primary: '#667eea', secondary: '#764ba2', text: '#34495e', background: '#FFFFFF', accent: '#667eea' } },
    'portfolio-style': { type: 'top-down', font: 'Arial', headerAlign: 'left', headerBorder: true, colors: { primary: '#2ae023', secondary: '#1f2937', text: '#4b5563', background: '#FFFFFF', accent: '#2ae023' } },
    'corporate-ats': { type: 'top-down', font: 'Times New Roman', headerAlign: 'left', headerBorder: true, colors: { primary: '#2ae023', secondary: '#333333', text: '#333333', background: '#FFFFFF', accent: '#2ae023' } },
    'elegant-gradient': { type: 'top-down', font: 'Helvetica', headerAlign: 'center', headerBorder: true, colors: { primary: '#667eea', secondary: '#2c3e50', text: '#34495e', background: '#FFFFFF', accent: '#667eea' } },
    'rishi': { type: 'top-down', font: 'Arial', headerAlign: 'left', headerBorder: true, colors: { primary: '#111827', secondary: '#4b5563', text: '#374151', background: '#FFFFFF', accent: '#2ae023' } },
    'hiero-modern': { type: 'top-down', font: 'Arial', headerAlign: 'left', headerBorder: true, colors: { primary: '#111827', secondary: '#4b5563', text: '#374151', background: '#FFFFFF', accent: '#2ae023' } },
    'priya-analytics': { type: 'top-down', font: 'Georgia', headerAlign: 'center', headerBorder: true, colors: { primary: '#111827', secondary: '#374151', text: '#374151', background: '#FFFFFF', accent: '#4b5563' } },
    'hiero-executive': { type: 'top-down', font: 'Arial', headerAlign: 'left', headerBorder: true, colors: { primary: '#000000', secondary: '#333333', text: '#222222', background: '#FFFFFF', accent: '#000000' } },
    'hiero-onyx': { type: 'top-down', font: 'Arial', headerAlign: 'center', headerBorder: true, colors: { primary: '#000000', secondary: '#111827', text: '#374151', background: '#FFFFFF', accent: '#374151' } },
    'quantum-blue': { type: 'top-down', font: 'Arial', headerAlign: 'left', headerBorder: true, colors: { primary: '#1e40af', secondary: '#3b82f6', text: '#1e293b', background: '#FFFFFF', accent: '#60a5fa' } },
    'emerald-elite': { type: 'top-down', font: 'Georgia', headerAlign: 'center', headerBorder: true, colors: { primary: '#065f46', secondary: '#059669', text: '#1f2937', background: '#FFFFFF', accent: '#10b981' } },
    'crimson-professional': { type: 'top-down', font: 'Arial', headerAlign: 'left', headerBorder: true, colors: { primary: '#991b1b', secondary: '#dc2626', text: '#1f2937', background: '#FFFFFF', accent: '#ef4444' } },
    'sapphire-tech': { type: 'top-down', font: 'Arial', headerAlign: 'left', headerBorder: true, colors: { primary: '#1e3a8a', secondary: '#2563eb', text: '#1f2937', background: '#FFFFFF', accent: '#3b82f6' } },
    'golden-executive': { type: 'top-down', font: 'Georgia', headerAlign: 'center', headerBorder: true, colors: { primary: '#92400e', secondary: '#b45309', text: '#1f2937', background: '#FFFFFF', accent: '#f59e0b' } },
    'violet-creative': { type: 'top-down', font: 'Arial', headerAlign: 'center', headerBorder: true, colors: { primary: '#5b21b6', secondary: '#7c3aed', text: '#1f2937', background: '#FFFFFF', accent: '#a78bfa' } },
    'ocean-minimal': { type: 'top-down', font: 'Arial', headerAlign: 'left', headerBorder: false, colors: { primary: '#0c4a6e', secondary: '#0369a1', text: '#1f2937', background: '#FFFFFF', accent: '#0ea5e9' } },
    'slate-modern': { type: 'top-down', font: 'Arial', headerAlign: 'left', headerBorder: true, colors: { primary: '#1e293b', secondary: '#475569', text: '#1e293b', background: '#FFFFFF', accent: '#64748b' } },
    'ruby-bold': { type: 'top-down', font: 'Georgia', headerAlign: 'center', headerBorder: true, colors: { primary: '#881337', secondary: '#be123c', text: '#1f2937', background: '#FFFFFF', accent: '#e11d48' } },
    'azure-corporate': { type: 'top-down', font: 'Arial', headerAlign: 'left', headerBorder: true, colors: { primary: '#164e63', secondary: '#0891b2', text: '#1f2937', background: '#FFFFFF', accent: '#06b6d4' } },
    'hiero-premium': { type: 'top-down', font: 'Georgia', headerAlign: 'center', headerBorder: true, colors: { primary: '#1F3A5F', secondary: '#4A6572', text: '#333333', background: '#F4F6F8', accent: '#E2E6EA' } },
    'hiero-legion': { type: 'top-down', font: 'Times New Roman', headerAlign: 'center', headerBorder: true, colors: { primary: '#000000', secondary: '#1a1a1a', text: '#222222', background: '#FFFFFF' } },
    'hiero-vertex': { type: 'top-down', font: 'Arial', headerAlign: 'center', headerBorder: false, colors: { primary: '#333333', secondary: '#666666', text: '#333333', background: '#E0E2E5' } },

    // Left Sidebar Templates
    'hiero-monethon': { type: 'sidebar', sidebarPosition: 'left', font: 'Georgia', colors: { sidebarBg: '#1F2A36', sidebarText: '#ffffff', sidebarAccent: '#F2B66D', primary: '#1F2A36', secondary: '#F2B66D', text: '#222222', background: '#ffffff' } },
    'hiero-essence': { type: 'sidebar', sidebarPosition: 'left', font: 'Arial', colors: { sidebarBg: '#1e1e1e', sidebarText: '#ffffff', sidebarAccent: '#f5a623', primary: '#ffffff', secondary: '#aaaaaa', text: '#ffffff', background: '#121212' } },
    'hiero-timeline': { type: 'sidebar', sidebarPosition: 'left', font: 'Arial', colors: { sidebarBg: '#f3f4f6', sidebarText: '#222222', sidebarAccent: '#777777', primary: '#222222', secondary: '#777777', text: '#333333', background: '#ffffff' } },
    'hiero-prestige': { type: 'sidebar', sidebarPosition: 'left', font: 'Arial', colors: { sidebarBg: '#0f172a', sidebarText: '#ffffff', sidebarAccent: '#c8a74e', primary: '#0f172a', secondary: '#475569', text: '#0f172a', background: '#f8fafc' } },
    'hiero-royal': { type: 'sidebar', sidebarPosition: 'left', font: 'Georgia', colors: { sidebarBg: '#BFAF9A', sidebarText: '#1a1a1a', sidebarAccent: '#1a1a1a', primary: '#1a1a1a', secondary: '#3a3a3a', text: '#3a3a3a', background: '#EDE8D9' } },
    'hiero-cool': { type: 'top-down', font: 'Arial', colors: { primary: '#1e3a8a', secondary: '#374151', text: '#374151', background: '#FFFFFF' } },
    'hiero-nova': { type: 'sidebar', sidebarPosition: 'left', font: 'Times New Roman', colors: { sidebarBg: '#1a1a1a', sidebarText: '#ffffff', sidebarAccent: '#f4b400', primary: '#1a1a1a', secondary: '#777777', text: '#1a1a1a', background: '#ffffff' } },
    'hiero-retail': { type: 'sidebar', sidebarPosition: 'left', font: 'Helvetica', colors: { sidebarBg: '#ffffff', sidebarText: '#1e3a8a', sidebarAccent: '#3b82f6', primary: '#1e3a8a', secondary: '#3b82f6', text: '#1f2937', background: '#ffffff' } },
    'hiero-elite': { type: 'sidebar', sidebarPosition: 'left', font: 'Times New Roman', colors: { sidebarBg: '#1a202c', sidebarText: '#ffffff', sidebarAccent: '#d69e2e', primary: '#1a202c', secondary: '#d69e2e', text: '#2d3748', background: '#ffffff' } },

    // Right Sidebar Templates
    'template4': { type: 'top-down', font: 'Times New Roman', headerAlign: 'center', headerBorder: true, colors: { primary: '#000000', secondary: '#333333', text: '#222222', background: '#FFFFFF', accent: '#000000' } },
    'hiero-academic': { type: 'top-down', font: 'Times New Roman', headerAlign: 'center', headerBorder: true, colors: { primary: '#000000', secondary: '#333333', text: '#222222', background: '#FFFFFF', accent: '#000000' } },
    'hiero-studio': { type: 'sidebar', sidebarPosition: 'right', font: 'Arial', colors: { sidebarBg: '#993333', sidebarText: '#ffffff', sidebarAccent: '#ffffff', primary: '#993333', secondary: '#4b5563', text: '#1f2937', background: '#ffffff' } },
    'hiero-signature': { type: 'sidebar', sidebarPosition: 'right', font: 'Times New Roman', colors: { sidebarBg: '#f7f7f7', sidebarText: '#000000', sidebarAccent: '#f37021', primary: '#000000', secondary: '#555555', text: '#333333', background: '#ffffff' } },

    // Fully Custom Handcoded Templates
    'hiero-urban': { type: 'sidebar', sidebarPosition: 'left', colors: { sidebarBg: '#1E293B', sidebarText: '#ffffff', sidebarAccent: '#0284C7', primary: '#0284C7', secondary: '#475569', text: '#0F172A', background: '#F8FAFC' } },
    'hiero-vision': { type: 'sidebar', sidebarPosition: 'left', colors: { sidebarBg: '#c96f5a', sidebarText: '#ffffff', sidebarAccent: '#fed7aa', primary: '#5a2d24', secondary: '#c96f5a', text: '#222222', background: '#ffffff' } }
};

function generateHieroUrbanWordHTML(data, config) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    
    const DARK = '#1E293B';
    const LIGHT = '#F8FAFC';
    const WHITE = '#FFFFFF';
    const GRAY_TEXT = '#475569';
    const BLACK = '#0F172A';
    const ACCENT = '#0284C7';

    // Get Initials
    const initials = (p.fullName || 'RESUME').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Technical Skills array processing
    const techSkills = typeof data.technicalSkills === 'string' ? data.technicalSkills.split(',').map(s => s.trim()).filter(Boolean) : (data.technicalSkills || []);

    // Hobbies / Interests array processing
    const hobbiesList = typeof data.hobbies === 'string' ? data.hobbies.split(',').map(s => s.trim()).filter(Boolean) : (data.hobbies || []);

    return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Resume</title><style>
        body { font-family: Helvetica, sans-serif; margin: 0; padding: 0; background-color: ${LIGHT}; }
        table { width: 100%; border-collapse: collapse; }
        td { vertical-align: top; padding: 0; }
    </style></head>
    <body>
        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; min-height: 800pt; background-color: ${LIGHT};">
          <tr>
            <!-- Left Column (Sidebar) -->
            <td style="width: 32%; vertical-align: top; background-color: ${DARK}; text-align: left; padding: 0;">
              <!-- Row 1: Profile initials block -->
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; background-color: ${DARK};">
                <tr>
                  <td style="padding: 20pt 10pt; text-align: center; vertical-align: middle;">
                    <div style="width: 60pt; height: 60pt; border-radius: 30pt; background-color: ${ACCENT}; color: ${WHITE}; margin: 0 auto; line-height: 60pt; font-size: 20pt; font-weight: bold; text-align: center;">
                      ${initials}
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Row 2: Contact block -->
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; background-color: ${WHITE}; border-top: 1px solid #CCCCCC; border-bottom: 1px solid #CCCCCC;">
                <tr>
                  <td style="padding: 10pt 15pt;">
                    ${[p.phone, p.email, p.linkedin, p.website, p.address].filter(Boolean).map(item => `
                      <div style="padding: 5pt 0; border-bottom: 1px solid #E2E8F0; font-size: 8.5pt; color: ${DARK}; word-break: break-all;">
                        <span style="display: inline-block; width: 14pt; height: 14pt; border-radius: 7pt; background-color: ${ACCENT}; color: ${WHITE}; text-align: center; line-height: 14pt; font-size: 7pt; font-weight: bold; margin-right: 5pt;">•</span>
                        ${item}
                      </div>
                    `).join('')}
                  </td>
                </tr>
              </table>
              
              <!-- Row 3: Education, Skills, Interests -->
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; background-color: ${DARK};">
                <tr>
                  <td style="padding: 15pt 15pt; color: ${WHITE};">
                    ${d.education.length > 0 ? `
                      <div style="color: ${ACCENT}; font-size: 10.5pt; font-weight: bold; letter-spacing: 1.5px; margin-bottom: 5pt; border-bottom: 2px solid ${ACCENT}; padding-bottom: 2pt; text-transform: uppercase;">EDUCATION</div>
                      <div style="font-size: 8.5pt; line-height: 1.35; margin-bottom: 15pt;">
                        ${d.education.map(edu => `
                          <div style="font-weight: bold; color: ${WHITE}; margin-bottom: 1pt;">${edu.degree || ''}</div>
                          <div style="color: #CCCCCC; margin-bottom: 4pt;">${edu.school || ''}<br/>${edu.gradYear || ''}</div>
                        `).join('')}
                      </div>
                    ` : ''}

                    ${techSkills.length > 0 ? `
                      <div style="color: ${ACCENT}; font-size: 10.5pt; font-weight: bold; letter-spacing: 1.5px; margin-bottom: 5pt; border-bottom: 2px solid ${ACCENT}; padding-bottom: 2pt; text-transform: uppercase;">SKILLS</div>
                      <div style="font-size: 8.5pt; line-height: 1.4; margin-bottom: 15pt;">
                        ${techSkills.slice(0, 5).map((sk, i) => {
                          const pct = [95, 85, 75, 65, 55][i] || 60;
                          return `
                            <div style="margin-bottom: 6pt;">
                              <div style="color: ${WHITE}; margin-bottom: 2pt; font-size: 8.5pt;">${sk}</div>
                              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border: 1px solid ${ACCENT}; height: 5px;">
                                <tr>
                                  <td style="width: ${pct}%; background-color: ${ACCENT}; height: 5px; font-size: 0px;">&nbsp;</td>
                                  <td style="width: ${100 - pct}%; background-color: transparent; height: 5px; font-size: 0px;">&nbsp;</td>
                                </tr>
                              </table>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    ` : ''}

                    ${hobbiesList.length > 0 ? `
                      <div style="color: ${ACCENT}; font-size: 10.5pt; font-weight: bold; letter-spacing: 1.5px; margin-bottom: 5pt; border-bottom: 2px solid ${ACCENT}; padding-bottom: 2pt; text-transform: uppercase;">INTERESTS</div>
                      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; font-size: 8.5pt; color: #CCCCCC;">
                        <tr>
                          <td style="width: 50%; vertical-align: top; padding-right: 5pt;">
                            ${hobbiesList.slice(0, 3).map(h => `<div style="margin-bottom: 3pt;">• ${h}</div>`).join('')}
                          </td>
                          <td style="width: 50%; vertical-align: top;">
                            ${hobbiesList.slice(3, 6).map(h => `<div style="margin-bottom: 3pt;">• ${h}</div>`).join('')}
                          </td>
                        </tr>
                      </table>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
            
            <!-- Right Column (Main Content) -->
            <td style="width: 68%; vertical-align: top; background-color: ${LIGHT}; padding: 20pt 25pt;">
              <!-- Header Area -->
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 20pt;">
                <tr>
                  <td>
                    <h1 style="color: ${BLACK}; font-size: 26pt; font-weight: bold; margin: 0; text-transform: uppercase; line-height: 1.1;">
                      ${p.fullName || 'RESUME'}
                    </h1>
                    <div style="margin-top: 5pt;">
                      <span style="background-color: ${ACCENT}; color: ${WHITE}; font-size: 9.5pt; padding: 3pt 10pt; display: inline-block; font-weight: bold; text-transform: uppercase; border-radius: 2px;">
                        ${p.roleTitle || 'Professional'}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Content Sections -->
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                ${d.summary ? `
                  <tr>
                    <td style="padding-bottom: 15pt;">
                      <div style="color: ${BLACK}; font-size: 11pt; font-weight: bold; margin-bottom: 5pt; border-bottom: 1.5px solid ${ACCENT}; padding-bottom: 2pt; letter-spacing: 1px; text-transform: uppercase;">STATEMENT</div>
                      <div style="font-size: 9pt; line-height: 1.4; color: ${GRAY_TEXT}; text-align: justify;">${d.summary}</div>
                    </td>
                  </tr>
                ` : ''}

                ${d.experience.length > 0 ? `
                  <tr>
                    <td style="padding-bottom: 15pt;">
                      <div style="color: ${BLACK}; font-size: 11pt; font-weight: bold; margin-bottom: 8pt; border-bottom: 1.5px solid ${ACCENT}; padding-bottom: 2pt; letter-spacing: 1px; text-transform: uppercase;">EXPERIENCE</div>
                      ${d.experience.map(exp => `
                        <div style="margin-bottom: 12pt;">
                          <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 3pt;">
                            <tr>
                              <td style="vertical-align: top; font-weight: bold; font-size: 9.5pt; color: ${BLACK}; text-transform: uppercase; text-align: left;">
                                ${exp.jobTitle || ''}
                              </td>
                              <td style="vertical-align: top; text-align: right; width: 100pt;">
                                <table cellpadding="0" cellspacing="0" border="0" align="right" style="background-color: #E0F2FE; border-radius: 2px;">
                                  <tr>
                                    <td style="padding: 2pt 6pt; font-size: 7.5pt; color: ${ACCENT}; font-weight: bold; text-align: center; text-transform: uppercase; white-space: nowrap;">
                                      ${exp.startDate || ''} - ${exp.endDate || 'Present'}
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          <div style="font-size: 8.5pt; color: ${GRAY_TEXT}; font-style: italic; margin-bottom: 4pt;">${exp.company || ''}${exp.location ? ' / ' + exp.location : ''}</div>
                          ${exp.description ? `
                            <ul style="margin: 0; padding-left: 12pt; font-size: 8.5pt; color: ${GRAY_TEXT}; line-height: 1.35;">
                              ${exp.description.split('\n').filter(l => l.trim()).map(l => `<li style="margin-bottom: 2pt;">${l.replace(/^[\*-•]\s*/, '')}</li>`).join('')}
                            </ul>
                          ` : ''}
                        </div>
                      `).join('')}
                    </td>
                  </tr>
                ` : ''}

                ${d.projects.length > 0 ? `
                  <tr>
                    <td style="padding-bottom: 15pt;">
                      <div style="color: ${BLACK}; font-size: 11pt; font-weight: bold; margin-bottom: 8pt; border-bottom: 1.5px solid ${ACCENT}; padding-bottom: 2pt; letter-spacing: 1px; text-transform: uppercase;">PROJECTS</div>
                      ${d.projects.map(proj => `
                        <div style="margin-bottom: 10pt;">
                          <div style="font-weight: bold; font-size: 9.5pt; color: ${BLACK}; text-transform: uppercase; margin-bottom: 1pt;">${proj.name || proj.title || ''}</div>
                          ${proj.tech ? `<div style="font-size: 8.5pt; color: ${ACCENT}; font-weight: bold; margin-bottom: 3pt;">TECH: ${proj.tech.toUpperCase()}</div>` : ''}
                          ${proj.description ? `
                            <ul style="margin: 0; padding-left: 12pt; font-size: 8.5pt; color: ${GRAY_TEXT}; line-height: 1.35;">
                              ${proj.description.split('\n').filter(l => l.trim()).map(l => `<li style="margin-bottom: 2pt;">${l.replace(/^[\*-•]\s*/, '')}</li>`).join('')}
                            </ul>
                          ` : ''}
                        </div>
                      `).join('')}
                    </td>
                  </tr>
                ` : ''}

                ${d.achievements ? `
                  <tr>
                    <td style="padding-bottom: 10pt;">
                      <div style="color: ${BLACK}; font-size: 11pt; font-weight: bold; margin-bottom: 8pt; border-bottom: 1.5px solid ${ACCENT}; padding-bottom: 2pt; letter-spacing: 1px; text-transform: uppercase;">ACHIEVEMENTS</div>
                      <ul style="margin: 0; padding-left: 12pt; font-size: 8.5pt; color: ${GRAY_TEXT}; line-height: 1.35;">
                        ${d.achievements.split(';').map(a => `<li style="margin-bottom: 2pt;">${a.trim()}</li>`).join('')}
                      </ul>
                    </td>
                  </tr>
                ` : ''}

                ${d.certifications ? `
                  <tr>
                    <td style="padding-bottom: 10pt;">
                      <div style="color: ${BLACK}; font-size: 11pt; font-weight: bold; margin-bottom: 8pt; border-bottom: 1.5px solid ${ACCENT}; padding-bottom: 2pt; letter-spacing: 1px; text-transform: uppercase;">CERTIFICATIONS</div>
                      <ul style="margin: 0; padding-left: 12pt; font-size: 8.5pt; color: ${GRAY_TEXT}; line-height: 1.35;">
                        ${d.certifications.split(',').map(c => `<li style="margin-bottom: 2pt;">${c.trim()}</li>`).join('')}
                      </ul>
                    </td>
                  </tr>
                ` : ''}
              </table>
            </td>
          </tr>
        </table>
    </body>
    </html>`;
}

function generateHieroVisionWordHTML(data, config) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    
    const TERRA = '#c96f5a';
    const TERRA_DARK = '#8a4b3c';
    const TERRA_DEEP = '#5a2d24';
    const WHITE = '#FFFFFF';
    const TEXT_DARK = '#222222';
    const TEXT_MED = '#444444';

    // Get Initials
    const initials = (p.fullName || 'RESUME').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Contact items
    const contactLines = [p.phone, p.email, p.linkedin, p.github, p.website, p.address].filter(Boolean);

    // Skills processing
    const skills = [
        ...(d.technicalSkills ? [d.technicalSkills] : []),
        ...(d.softSkills ? [d.softSkills] : [])
    ];
    const skillLines = [];
    skills.forEach(s => {
        s.split(',').map(p => p.trim()).filter(Boolean).forEach(p => skillLines.push(p));
    });

    // Languages processing
    const languages = p.languagesKnown || d.languages;

    // Hobbies processing
    const hobbiesList = typeof d.hobbies === 'string' ? d.hobbies.split(',').map(s => s.trim()).filter(Boolean) : (d.hobbies || []);

    const jobTitle = p.roleTitle || d.experience?.[0]?.jobTitle || 'Professional';

    return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Resume</title><style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        table { width: 100%; border-collapse: collapse; }
        td { vertical-align: top; padding: 0; }
    </style></head>
    <body>
        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; min-height: 800pt; background-color: #FFFFFF;">
          <tr>
            <!-- Left Column (Sidebar) -->
            <td style="width: 35%; vertical-align: top; background-color: ${TERRA}; padding: 0;">
              <!-- Profile circular initials avatar -->
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                <tr>
                  <td style="padding: 20pt 10pt; text-align: center; vertical-align: middle;">
                    <div style="width: 70pt; height: 70pt; border-radius: 35pt; border: 3px solid ${WHITE}; background-color: ${TERRA_DARK}; color: ${WHITE}; margin: 0 auto; line-height: 70pt; font-size: 22pt; font-weight: bold; text-align: center;">
                      ${initials}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Sidebar sections -->
              ${contactLines.length > 0 ? `
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 12pt;">
                  <tr>
                    <td style="background-color: ${TERRA_DARK}; padding: 5pt 15pt; color: ${WHITE}; font-weight: bold; font-size: 9.5pt; letter-spacing: 1px; text-transform: uppercase;">
                      CONTACT
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8pt 15pt; color: ${WHITE}; font-size: 8.5pt; line-height: 1.45;">
                      ${contactLines.map(line => `<div style="margin-bottom: 4pt;">• ${line}</div>`).join('')}
                    </td>
                  </tr>
                </table>
              ` : ''}

              ${skillLines.length > 0 ? `
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 12pt;">
                  <tr>
                    <td style="background-color: ${TERRA_DARK}; padding: 5pt 15pt; color: ${WHITE}; font-weight: bold; font-size: 9.5pt; letter-spacing: 1px; text-transform: uppercase;">
                      SKILLS
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8pt 15pt; color: ${WHITE}; font-size: 8.5pt; line-height: 1.45;">
                      ${skillLines.slice(0, 10).map(line => `<div style="margin-bottom: 4pt;">• ${line}</div>`).join('')}
                    </td>
                  </tr>
                </table>
              ` : ''}

              ${d.education.length > 0 ? `
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 12pt;">
                  <tr>
                    <td style="background-color: ${TERRA_DARK}; padding: 5pt 15pt; color: ${WHITE}; font-weight: bold; font-size: 9.5pt; letter-spacing: 1px; text-transform: uppercase;">
                      EDUCATION
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8pt 15pt; color: ${WHITE}; font-size: 8.5pt; line-height: 1.45;">
                      ${d.education.map(edu => `
                        <div style="margin-bottom: 6pt;">
                          <div style="font-weight: bold;">${edu.degree || ''}</div>
                          <div style="opacity: 0.85;">${edu.school || ''}</div>
                          <div style="opacity: 0.85;">${edu.gradYear || ''}</div>
                        </div>
                      `).join('')}
                    </td>
                  </tr>
                </table>
              ` : ''}

              ${languages ? `
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 12pt;">
                  <tr>
                    <td style="background-color: ${TERRA_DARK}; padding: 5pt 15pt; color: ${WHITE}; font-weight: bold; font-size: 9.5pt; letter-spacing: 1px; text-transform: uppercase;">
                      LANGUAGES
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8pt 15pt; color: ${WHITE}; font-size: 8.5pt; line-height: 1.45;">
                      ${languages.split(',').map(lang => `<div style="margin-bottom: 3pt;">• ${lang.trim()}</div>`).join('')}
                    </td>
                  </tr>
                </table>
              ` : ''}

              ${hobbiesList.length > 0 ? `
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 12pt;">
                  <tr>
                    <td style="background-color: ${TERRA_DARK}; padding: 5pt 15pt; color: ${WHITE}; font-weight: bold; font-size: 9.5pt; letter-spacing: 1px; text-transform: uppercase;">
                      INTERESTS
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8pt 15pt; color: ${WHITE}; font-size: 8.5pt; line-height: 1.45;">
                      ${hobbiesList.map(h => `<div style="margin-bottom: 3pt;">• ${h}</div>`).join('')}
                    </td>
                  </tr>
                </table>
              ` : ''}
            </td>

            <!-- Right Column (Main Content) -->
            <td style="width: 65%; vertical-align: top; background-color: #FFFFFF; padding: 25pt 30pt; position: relative;">
              
              <!-- Top header table to handle name and decorative ribbon side by side -->
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 15pt;">
                <tr>
                  <td style="vertical-align: top;">
                    <h1 style="color: ${TERRA_DEEP}; font-size: 26pt; font-weight: bold; margin: 0; text-transform: uppercase; line-height: 1.1;">
                      ${p.fullName || 'RESUME'}
                    </h1>
                    <div style="margin-top: 6pt;">
                      <span style="background-color: ${TERRA_DARK}; color: ${WHITE}; font-size: 9.5pt; padding: 3pt 10pt; display: inline-block; font-weight: bold; text-transform: uppercase; border-radius: 2px;">
                        ${jobTitle}
                      </span>
                    </div>
                  </td>
                  <!-- Decorative Ribbon -->
                  <td style="width: 50pt; text-align: right; vertical-align: top; padding-top: 0;">
                    <div style="width: 30pt; height: 40pt; background-color: ${TERRA}; display: inline-block;"></div>
                  </td>
                </tr>
              </table>

              <!-- Right Column sections -->
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                ${d.summary ? `
                  <tr>
                    <td style="padding-bottom: 12pt;">
                      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 6pt;">
                        <tr>
                          <td style="background-color: ${TERRA_DARK}; padding: 4pt 10pt; color: ${WHITE}; font-weight: bold; font-size: 9.5pt; text-transform: uppercase;">
                            OBJECTIVE
                          </td>
                        </tr>
                      </table>
                      <div style="font-size: 9pt; line-height: 1.4; color: ${TEXT_MED}; text-align: justify;">
                        ${d.summary}
                      </div>
                    </td>
                  </tr>
                ` : ''}

                ${d.experience.length > 0 ? `
                  <tr>
                    <td style="padding-bottom: 12pt;">
                      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 6pt;">
                        <tr>
                          <td style="background-color: ${TERRA_DARK}; padding: 4pt 10pt; color: ${WHITE}; font-weight: bold; font-size: 9.5pt; text-transform: uppercase;">
                            WORK EXPERIENCE
                          </td>
                        </tr>
                      </table>
                      
                      ${d.experience.map(exp => `
                        <div style="margin-bottom: 10pt;">
                          <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 2pt;">
                            <tr>
                              <td style="vertical-align: top; font-weight: bold; font-size: 9.5pt; color: ${TEXT_DARK}; text-transform: uppercase; text-align: left;">
                                ${exp.jobTitle || ''}
                              </td>
                              <td style="vertical-align: top; text-align: right; font-size: 8.5pt; color: ${TERRA}; font-weight: bold; text-transform: uppercase;">
                                ${exp.startDate || ''} - ${exp.endDate || 'Present'}
                              </td>
                            </tr>
                          </table>
                          <div style="font-size: 8.5pt; color: ${TEXT_MED}; font-style: italic; margin-bottom: 4pt;">${exp.company || ''}${exp.location ? ' / ' + exp.location : ''}</div>
                          ${exp.description ? `
                            <ul style="margin: 0; padding-left: 12pt; font-size: 8.5pt; color: ${TEXT_MED}; line-height: 1.35;">
                              ${exp.description.split('\n').filter(l => l.trim()).map(l => `<li style="margin-bottom: 2pt;">${l.replace(/^[\*-•]\s*/, '')}</li>`).join('')}
                            </ul>
                          ` : ''}
                        </div>
                      `).join('')}
                    </td>
                  </tr>
                ` : ''}

                ${d.projects.length > 0 ? `
                  <tr>
                    <td style="padding-bottom: 12pt;">
                      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 6pt;">
                        <tr>
                          <td style="background-color: ${TERRA_DARK}; padding: 4pt 10pt; color: ${WHITE}; font-weight: bold; font-size: 9.5pt; text-transform: uppercase;">
                            PROJECTS
                          </td>
                        </tr>
                      </table>
                      
                      ${d.projects.map(proj => `
                        <div style="margin-bottom: 10pt;">
                          <div style="font-weight: bold; font-size: 9.5pt; color: ${TEXT_DARK}; text-transform: uppercase; margin-bottom: 2pt;">${proj.name || proj.title || ''}</div>
                          ${proj.tech ? `<div style="font-size: 8.5pt; color: ${TERRA}; font-weight: bold; margin-bottom: 3pt;">TECH: ${proj.tech.toUpperCase()}</div>` : ''}
                          ${proj.description ? `
                            <ul style="margin: 0; padding-left: 12pt; font-size: 8.5pt; color: ${TEXT_MED}; line-height: 1.35;">
                              ${proj.description.split('\n').filter(l => l.trim()).map(l => `<li style="margin-bottom: 2pt;">${l.replace(/^[\*-•]\s*/, '')}</li>`).join('')}
                            </ul>
                          ` : ''}
                        </div>
                      `).join('')}
                    </td>
                  </tr>
                ` : ''}
              </table>
            </td>
          </tr>
        </table>
    </body>
    </html>`;
}

const WORD_TEMPLATE_MAP = {
    'template-4': 'template4',
    'template4': 'template4',
    'hiero-academic': 'template4',
    'hiero-studio': 'hiero-studio',
    'hiero-monethon': 'hiero-monethon',
    'monethon': 'hiero-monethon',
    'hiero monethon': 'hiero-monethon',
    'hiero-nova': 'hiero-nova',
    'nova': 'hiero-nova',
    'hiero-legion': 'hiero-legion',
    'legion': 'hiero-legion',
    'hiero-essence': 'hiero-essence',
    'essence': 'hiero-essence',
    'hiero-timeline': 'hiero-timeline',
    'timeline': 'hiero-timeline',
    'hiero-minimal': 'hiero-timeline',
    'hiero-signature': 'hiero-signature',
    'signature': 'hiero-signature',
    'hiero-vision': 'hiero-vision',
    'vision': 'hiero-vision',
    'hiero-premium': 'hiero-premium',
    'premium': 'hiero-premium',
    'hiero-prestige': 'hiero-prestige',
    'prestige': 'hiero-prestige',
    'hiero-royal': 'hiero-royal',
    'royal': 'hiero-royal',
    'hiero-cool': 'hiero-cool',
    'cool': 'hiero-cool',
    'hiero-vertex': 'hiero-vertex',
    'vertex': 'hiero-vertex',
    'hiero-urban': 'hiero-urban',
    'urban': 'hiero-urban',
    'hiero-tech': 'hiero-tech',
    'tech': 'hiero-tech',
    'priya-analytics': 'priya-analytics',
    'priya': 'priya-analytics',
    'hiero-velocity': 'hiero-velocity',
    'velocity': 'hiero-velocity',
    'hiero-elite': 'hiero-elite',
    'elite': 'hiero-elite',
    'hiero-retail': 'hiero-retail',
    'retail': 'hiero-retail',
    'rishi': 'rishi'
};

function generateHieroStudioWordHTML(data, config) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    
    const ACCENT = '#993333';
    const DARK_ACCENT = '#5e1b1b';
    const WHITE = '#FFFFFF';
    const GRAY_TEXT = '#374151';
    const GRAY_LIGHT = '#6b7280';
    const BLACK = '#000000';
    const BORDER_LIGHT = '#e5e7eb';

    // Get Initials
    const initials = (p.fullName || 'RESUME').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Contact Details
    const contactItems = [
        { label: 'Address', val: p.address },
        { label: 'Phone', val: p.phone },
        { label: 'E-mail', val: p.email },
        { label: 'LinkedIn', val: p.linkedin },
        { label: 'Github', val: p.github },
        { label: 'Website', val: p.website }
    ].filter(i => i.val);

    // Skills
    const skillsVal = data.technicalSkills || data.skills || '';
    const skillsList = Array.isArray(skillsVal)
        ? skillsVal
        : (typeof skillsVal === 'string' ? skillsVal.split(/[\n,;]/).map(s => s.trim()).filter(Boolean) : []);

    // Other lists
    const languages = d.languages ? d.languages.split(',').map(s => s.trim()).filter(Boolean) : [];
    const hobbies = d.hobbies ? d.hobbies.split(',').map(s => s.trim()).filter(Boolean) : [];
    const certifications = d.certifications ? d.certifications.split(',').map(s => s.trim()).filter(Boolean) : [];
    const achievements = d.achievements ? d.achievements.split(';').map(s => s.trim()).filter(Boolean) : [];

    const roleTitle = p.roleTitle || p.title || d.experience?.[0]?.jobTitle || 'Professional Title';

    return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Resume</title><style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #FFFFFF; }
        table { width: 100%; border-collapse: collapse; }
        td { vertical-align: top; padding: 0; }
    </style></head>
    <body>
        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; min-height: 800pt; background-color: #FFFFFF;">
          <tr>
            <!-- Left Column (Main Content) -->
            <td style="width: 65%; vertical-align: top; background-color: #FFFFFF; padding: 25pt 30pt;">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; font-family: Arial, sans-serif;">
                
                <!-- Summary Section -->
                ${d.summary ? `
                  <tr>
                    <td style="padding-bottom: 20pt;">
                      <div style="color: ${ACCENT}; font-size: 14pt; font-weight: bold; margin-bottom: 4pt; font-family: Arial, sans-serif;">Summary</div>
                      <div style="border-bottom: 1px solid ${BORDER_LIGHT}; margin-bottom: 10pt; font-size: 0px;">&nbsp;</div>
                      <div style="font-size: 9.5pt; line-height: 1.4; color: ${GRAY_TEXT}; text-align: justify;">${d.summary}</div>
                    </td>
                  </tr>
                ` : ''}

                <!-- Education Section -->
                ${d.education.length > 0 ? `
                  <tr>
                    <td style="padding-bottom: 20pt;">
                      <div style="color: ${ACCENT}; font-size: 14pt; font-weight: bold; margin-bottom: 4pt; font-family: Arial, sans-serif;">Education</div>
                      <div style="border-bottom: 1px solid ${BORDER_LIGHT}; margin-bottom: 10pt; font-size: 0px;">&nbsp;</div>
                      
                      ${d.education.map(edu => `
                        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 10pt;">
                          <tr>
                            <td style="width: 70pt; font-size: 9.5pt; color: ${GRAY_LIGHT}; line-height: 1.3;">
                              ${edu.gradYear || 'Year'}
                            </td>
                            <td style="padding-left: 10pt;">
                              <div style="font-size: 11.5pt; font-weight: bold; color: ${BLACK};">${edu.degree || 'Degree'}</div>
                              <div style="font-size: 9.5pt; color: ${GRAY_TEXT}; font-style: italic; margin-top: 2pt;">${edu.school || ''}</div>
                            </td>
                          </tr>
                        </table>
                      `).join('')}
                    </td>
                  </tr>
                ` : ''}

                <!-- Work Experience Section -->
                ${d.experience.length > 0 ? `
                  <tr>
                    <td style="padding-bottom: 20pt;">
                      <div style="color: ${ACCENT}; font-size: 14pt; font-weight: bold; margin-bottom: 4pt; font-family: Arial, sans-serif;">Work History</div>
                      <div style="border-bottom: 1px solid ${BORDER_LIGHT}; margin-bottom: 10pt; font-size: 0px;">&nbsp;</div>
                      
                      ${d.experience.map(exp => `
                        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 12pt;">
                          <tr>
                            <td style="width: 70pt; font-size: 9.5pt; color: ${GRAY_LIGHT}; line-height: 1.3;">
                              ${exp.startDate || ''}<br/>- ${exp.endDate || 'Present'}
                            </td>
                            <td style="padding-left: 10pt;">
                              <div style="font-size: 11.5pt; font-weight: bold; color: ${BLACK};">${exp.jobTitle || ''}</div>
                              <div style="font-size: 9.5pt; color: ${GRAY_TEXT}; font-style: italic; margin-top: 2pt; margin-bottom: 4pt;">${exp.company || ''}${exp.location ? ' / ' + exp.location : ''}</div>
                              ${exp.description ? `
                                <ul style="margin: 0; padding-left: 12pt; font-size: 9pt; color: ${GRAY_TEXT}; line-height: 1.35;">
                                  ${exp.description.split('\n').filter(l => l.trim()).map(l => `<li style="margin-bottom: 2pt;">${l.replace(/^[\*-•]\s*/, '')}</li>`).join('')}
                                </ul>
                              ` : ''}
                            </td>
                          </tr>
                        </table>
                      `).join('')}
                    </td>
                  </tr>
                ` : ''}

                <!-- Projects Section -->
                ${d.projects.length > 0 ? `
                  <tr>
                    <td style="padding-bottom: 20pt;">
                      <div style="color: ${ACCENT}; font-size: 14pt; font-weight: bold; margin-bottom: 4pt; font-family: Arial, sans-serif;">Projects</div>
                      <div style="border-bottom: 1px solid ${BORDER_LIGHT}; margin-bottom: 10pt; font-size: 0px;">&nbsp;</div>
                      
                      ${d.projects.map(proj => `
                        <div style="margin-bottom: 12pt;">
                          <div style="font-size: 11.5pt; font-weight: bold; color: ${BLACK};">${proj.name || proj.title || ''}</div>
                          ${proj.tech ? `<div style="font-size: 9pt; color: ${ACCENT}; font-weight: bold; margin-top: 2pt; margin-bottom: 4pt;">Tech: ${proj.tech}</div>` : ''}
                          ${proj.description ? `
                            <ul style="margin: 0; padding-left: 12pt; font-size: 9pt; color: ${GRAY_TEXT}; line-height: 1.35;">
                              ${proj.description.split('\n').filter(l => l.trim()).map(l => `<li style="margin-bottom: 2pt;">${l.replace(/^[\*-•]\s*/, '')}</li>`).join('')}
                            </ul>
                          ` : ''}
                        </div>
                      `).join('')}
                    </td>
                  </tr>
                ` : ''}
              </table>
            </td>

            <!-- Right Column (Sidebar) -->
            <td style="width: 35%; vertical-align: top; background-color: ${ACCENT}; padding: 0;">
              
              <!-- Circular Initials Photo -->
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                <tr>
                  <td style="padding: 25pt 10pt 15pt 10pt; text-align: center; vertical-align: middle;">
                    <div style="width: 70pt; height: 70pt; border-radius: 35pt; background-color: ${DARK_ACCENT}; color: ${WHITE}; margin: 0 auto; line-height: 70pt; font-size: 22pt; font-weight: bold; text-align: center; border: 3px solid ${WHITE};">
                      ${initials}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Name & Job Title -->
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 20pt; font-family: Arial, sans-serif;">
                <tr>
                  <td style="padding: 0 15pt; color: ${WHITE};">
                    <div style="font-size: 18pt; font-weight: bold; line-height: 1.2; text-transform: uppercase;">
                      ${p.fullName || 'YOUR NAME'}
                    </div>
                    <div style="font-size: 9.5pt; margin-top: 4pt; opacity: 0.9; letter-spacing: 1px; text-transform: uppercase; font-weight: bold;">
                      ${roleTitle}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Sidebar Sections -->
              ${contactItems.length > 0 ? `
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 12pt; font-family: Arial, sans-serif;">
                  <tr>
                    <td style="background-color: ${DARK_ACCENT}; padding: 5pt 15pt; color: ${WHITE}; font-weight: bold; font-size: 9.5pt; text-transform: uppercase;">
                      Contact
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8pt 15pt; color: ${WHITE}; font-size: 8.5pt; line-height: 1.4;">
                      ${contactItems.map(item => `
                        <div style="margin-bottom: 8pt;">
                          <div style="font-weight: bold; font-size: 8pt; opacity: 0.9; text-transform: uppercase;">${item.label}</div>
                          <div style="margin-top: 1pt; word-break: break-all;">${item.val}</div>
                        </div>
                      `).join('')}
                    </td>
                  </tr>
                </table>
              ` : ''}

              ${skillsList.length > 0 ? `
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 12pt; font-family: Arial, sans-serif;">
                  <tr>
                    <td style="background-color: ${DARK_ACCENT}; padding: 5pt 15pt; color: ${WHITE}; font-weight: bold; font-size: 9.5pt; text-transform: uppercase;">
                      Skills
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8pt 15pt; color: ${WHITE}; font-size: 8.5pt; line-height: 1.45;">
                      ${skillsList.slice(0, 15).map(skill => `<div style="margin-bottom: 4pt;">• ${skill}</div>`).join('')}
                    </td>
                  </tr>
                </table>
              ` : ''}

              ${languages.length > 0 ? `
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 12pt; font-family: Arial, sans-serif;">
                  <tr>
                    <td style="background-color: ${DARK_ACCENT}; padding: 5pt 15pt; color: ${WHITE}; font-weight: bold; font-size: 9.5pt; text-transform: uppercase;">
                      Languages
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8pt 15pt; color: ${WHITE}; font-size: 8.5pt; line-height: 1.45;">
                      ${languages.map(lang => `<div style="margin-bottom: 3pt;">• ${lang}</div>`).join('')}
                    </td>
                  </tr>
                </table>
              ` : ''}

              ${hobbies.length > 0 ? `
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 12pt; font-family: Arial, sans-serif;">
                  <tr>
                    <td style="background-color: ${DARK_ACCENT}; padding: 5pt 15pt; color: ${WHITE}; font-weight: bold; font-size: 9.5pt; text-transform: uppercase;">
                      Hobbies
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8pt 15pt; color: ${WHITE}; font-size: 8.5pt; line-height: 1.45;">
                      ${hobbies.map(h => `<div style="margin-bottom: 3pt;">• ${h}</div>`).join('')}
                    </td>
                  </tr>
                </table>
              ` : ''}

              ${certifications.length > 0 ? `
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 12pt; font-family: Arial, sans-serif;">
                  <tr>
                    <td style="background-color: ${DARK_ACCENT}; padding: 5pt 15pt; color: ${WHITE}; font-weight: bold; font-size: 9.5pt; text-transform: uppercase;">
                      Certifications
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8pt 15pt; color: ${WHITE}; font-size: 8.5pt; line-height: 1.45;">
                      ${certifications.map(c => `<div style="margin-bottom: 3pt;">• ${c}</div>`).join('')}
                    </td>
                  </tr>
                </table>
              ` : ''}
              
              ${achievements.length > 0 ? `
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 12pt; font-family: Arial, sans-serif;">
                  <tr>
                    <td style="background-color: ${DARK_ACCENT}; padding: 5pt 15pt; color: ${WHITE}; font-weight: bold; font-size: 9.5pt; text-transform: uppercase;">
                      Achievements
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8pt 15pt; color: ${WHITE}; font-size: 8.5pt; line-height: 1.45;">
                      ${achievements.map(a => `<div style="margin-bottom: 3pt;">• ${a}</div>`).join('')}
                    </td>
                  </tr>
                </table>
              ` : ''}
            </td>
          </tr>
        </table>
    </body>
    </html>`;
}

function generateHieroSignatureWordHTML(data, config) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    
    const ACCENT = '#f37021'; // Orange
    const BLACK = '#000000';
    const WHITE = '#FFFFFF';
    const BG_LIGHT = '#f7f7f7';
    const GRAY_TEXT = '#555555';
    const BORDER_COLOR = '#f0f0f0';

    // Get Initials
    const initials = (p.fullName || 'RESUME').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Split Name
    const fullName = (p.fullName || 'John Doe').toUpperCase();
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || 'USER';
    const lastName = nameParts.slice(1).join(' ') || 'NAME';

    // Expertise (Skills)
    // `data.skills` can be either an array or a string in different flows.
    // Normalize to a simple string[] to avoid runtime errors.
    const rawSkillsVal = (data && data.skills != null && String(data.skills).length > 0)
        ? data.skills
        : (data && data.technicalSkills != null ? data.technicalSkills : d.technicalSkills);
    const rawSkillsList = Array.isArray(rawSkillsVal)
        ? rawSkillsVal
        : (typeof rawSkillsVal === 'string' ? rawSkillsVal.split(/[\n,;]/).map(s => s.trim()).filter(Boolean) : []);
    const skills = rawSkillsList
        .map(s => (typeof s === 'object' && s !== null) ? (s.name || s.skill || s.title || '') : String(s))
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 6);

    // Contact Details
    const contactItems = [
        { label: 'LOCATION', val: p.address || 'India' },
        { label: 'EMAIL', val: p.email },
        { label: 'PHONE', val: p.phone },
        { label: 'LINKEDIN', val: p.linkedin }
    ].filter(i => i.val);

    // Achievements
    const achievements = d.achievements ? d.achievements.split(';').map(s => s.trim()).filter(Boolean) : [];

    // Sidebar Name Font Size
    let nameSize = '20pt';
    if (fullName.length > 20) nameSize = '17pt';
    if (fullName.length > 28) nameSize = '14pt';

    const roleTitle = p.roleTitle || p.headline || 'IoT Engineer';

    return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Resume</title><style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #FFFFFF; }
        table { width: 100%; border-collapse: collapse; }
        td { vertical-align: top; padding: 0; }
        .rotate-text {
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            font-family: Arial, sans-serif;
            font-weight: bold;
            font-size: 11pt;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            white-space: nowrap;
        }
    </style></head>
    <body>
        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; min-height: 800pt; background-color: #FFFFFF;">
          <tr>
            <!-- Left Column (Main Content) -->
            <td style="width: 65%; vertical-align: top; background-color: #FFFFFF; border-right: 1px solid ${BORDER_COLOR};">
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                
                <!-- About Me Block -->
                ${d.summary ? `
                  <tr style="border-bottom: 1px solid ${BORDER_COLOR};">
                    <td style="background-color: ${BG_LIGHT}; width: 60pt; text-align: center; vertical-align: middle; padding: 15pt 0;">
                      <div class="rotate-text" style="color: ${BLACK};">ABOUT ME</div>
                    </td>
                    <td style="background-color: ${BG_LIGHT}; padding: 20pt 25pt; vertical-align: top;">
                      <div style="color: ${BLACK}; font-size: 11pt; font-weight: bold; margin-bottom: 8pt; letter-spacing: 1px;">PROFESSIONAL PROFILE</div>
                      <div style="font-size: 9.5pt; line-height: 1.45; color: ${GRAY_TEXT}; text-align: justify;">${d.summary}</div>
                    </td>
                  </tr>
                ` : ''}

                <!-- Experience Block -->
                ${d.experience.length > 0 ? `
                  <tr style="border-bottom: 1px solid ${BORDER_COLOR};">
                    <td style="background-color: ${ACCENT}; width: 60pt; text-align: center; vertical-align: middle; padding: 15pt 0;">
                      <div class="rotate-text" style="color: ${WHITE};">EXPERIENCE</div>
                    </td>
                    <td style="background-color: ${WHITE}; padding: 20pt 25pt; vertical-align: top;">
                      ${d.experience.map(exp => `
                        <div style="margin-bottom: 12pt;">
                          <div style="color: ${ACCENT}; font-size: 9pt; font-weight: bold; margin-bottom: 3pt;">${exp.startDate || ''} - ${exp.endDate || 'Present'}</div>
                          <div style="font-size: 11pt; font-weight: bold; color: ${BLACK}; text-transform: uppercase;">${exp.jobTitle || ''}</div>
                          <div style="font-size: 9.5pt; font-weight: bold; color: #333333; text-transform: uppercase; margin-bottom: 4pt;">${exp.company || ''}</div>
                          ${exp.description ? `
                            <ul style="margin: 0; padding-left: 12pt; font-size: 9pt; color: ${GRAY_TEXT}; line-height: 1.35;">
                              ${exp.description.split('\n').filter(l => l.trim()).map(l => `<li style="margin-bottom: 2pt;">${l.replace(/^[\*-•]\s*/, '')}</li>`).join('')}
                            </ul>
                          ` : ''}
                        </div>
                      `).join('')}
                    </td>
                  </tr>
                ` : ''}

                <!-- Education Block -->
                ${d.education.length > 0 ? `
                  <tr style="border-bottom: 1px solid ${BORDER_COLOR};">
                    <td style="background-color: ${WHITE}; width: 60pt; text-align: center; vertical-align: middle; padding: 15pt 0;">
                      <div class="rotate-text" style="color: ${BLACK};">EDUCATION</div>
                    </td>
                    <td style="background-color: ${WHITE}; padding: 20pt 25pt; vertical-align: top;">
                      ${d.education.map(edu => `
                        <div style="margin-bottom: 12pt;">
                          <div style="color: ${ACCENT}; font-size: 9pt; font-weight: bold; margin-bottom: 3pt;">${edu.gradYear || ''}</div>
                          <div style="font-size: 11pt; font-weight: bold; color: ${BLACK}; text-transform: uppercase;">${edu.school || ''}</div>
                          <div style="font-size: 9.5pt; color: ${GRAY_TEXT}; margin-top: 2pt;">${edu.degree || ''}</div>
                        </div>
                      `).join('')}
                    </td>
                  </tr>
                ` : ''}

                <!-- Projects Block -->
                ${d.projects.length > 0 ? `
                  <tr style="border-bottom: 1px solid ${BORDER_COLOR};">
                    <td style="background-color: ${WHITE}; width: 60pt; text-align: center; vertical-align: middle; padding: 15pt 0;">
                      <div class="rotate-text" style="color: ${BLACK};">PROJECTS</div>
                    </td>
                    <td style="background-color: ${WHITE}; padding: 20pt 25pt; vertical-align: top;">
                      ${d.projects.map(proj => `
                        <div style="margin-bottom: 12pt;">
                          <div style="color: ${ACCENT}; font-size: 9pt; font-weight: bold; margin-bottom: 3pt;">${proj.duration || ''}</div>
                          <div style="font-size: 11pt; font-weight: bold; color: ${BLACK}; text-transform: uppercase;">${proj.name || proj.title || ''}</div>
                          <div style="font-size: 9.5pt; color: ${GRAY_TEXT}; margin-top: 4pt; text-align: justify;">${proj.description || ''}</div>
                        </div>
                      `).join('')}
                    </td>
                  </tr>
                ` : ''}

                <!-- Achievements Block -->
                ${achievements.length > 0 ? `
                  <tr style="border-bottom: 1px solid ${BORDER_COLOR};">
                    <td style="background-color: ${BG_LIGHT}; width: 60pt; text-align: center; vertical-align: middle; padding: 15pt 0;">
                      <div class="rotate-text" style="color: ${BLACK};">ACHIEVEMENTS</div>
                    </td>
                    <td style="background-color: ${BG_LIGHT}; padding: 20pt 25pt; vertical-align: top;">
                      <ul style="margin: 0; padding-left: 12pt; font-size: 9.5pt; color: ${BLACK}; line-height: 1.4;">
                        ${achievements.map(line => `<li style="margin-bottom: 4pt;">${line}</li>`).join('')}
                      </ul>
                    </td>
                  </tr>
                ` : ''}
              </table>
            </td>

            <!-- Right Column (Sidebar) -->
            <td style="width: 35%; vertical-align: top; background-color: ${BLACK}; padding: 25pt 15pt;">
              
              <!-- Dark Initials Rectangle Frame -->
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 20pt;">
                <tr>
                  <td>
                    <div style="background-color: #1a1a1a; padding: 40pt 10pt; text-align: center; border-radius: 2px;">
                      <div style="font-size: 26pt; font-weight: bold; color: ${WHITE}; font-family: Helvetica, sans-serif;">
                        ${initials}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Name & Job Title -->
              <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 20pt; font-family: Arial, sans-serif;">
                <tr>
                  <td style="color: ${WHITE};">
                    <div style="font-size: ${nameSize}; font-weight: 300; line-height: 1.2;">
                      ${firstName}
                    </div>
                    <div style="font-size: ${nameSize}; font-weight: bold; line-height: 1.2;">
                      ${lastName}
                    </div>
                    <div style="font-size: 8pt; color: #888888; font-weight: bold; margin-top: 10pt; letter-spacing: 2px; text-transform: uppercase;">
                      ${roleTitle.toUpperCase()}
                    </div>
                  </td>
                </tr>
              </table>

              <div style="border-bottom: 1px solid #333333; margin-bottom: 20pt; font-size: 0px;">&nbsp;</div>

              <!-- Expertise (Skills with horizontal orange bars) -->
              ${skills.length > 0 ? `
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 25pt; font-family: Arial, sans-serif;">
                  <tr>
                    <td style="color: ${WHITE}; font-weight: bold; font-size: 11pt; padding-bottom: 12pt; letter-spacing: 1px; text-transform: uppercase;">
                      EXPERTISE
                    </td>
                  </tr>
                  <tr>
                    <td>
                      ${skills.map(skill => `
                        <div style="margin-bottom: 12pt;">
                          <div style="color: #AAAAAA; font-size: 8pt; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4pt;">
                            ${skill}
                          </div>
                          <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; background-color: #222222; height: 4px;">
                            <tr>
                              <td style="width: 85%; background-color: ${ACCENT}; height: 4px; font-size: 0px;">&nbsp;</td>
                              <td style="width: 15%; background-color: transparent; height: 4px; font-size: 0px;">&nbsp;</td>
                            </tr>
                          </table>
                        </div>
                      `).join('')}
                    </td>
                  </tr>
                </table>
              ` : ''}

              <!-- Contact -->
              ${contactItems.length > 0 ? `
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; font-family: Arial, sans-serif;">
                  <tr>
                    <td style="color: ${WHITE}; font-weight: bold; font-size: 11pt; padding-bottom: 12pt; letter-spacing: 1px; text-transform: uppercase;">
                      CONTACT
                    </td>
                  </tr>
                  <tr>
                    <td>
                      ${contactItems.map(item => `
                        <div style="margin-bottom: 12pt;">
                          <div style="color: ${WHITE}; font-weight: bold; font-size: 8pt; letter-spacing: 1px; text-transform: uppercase;">
                            ${item.label}
                          </div>
                          <div style="color: #888888; font-size: 9pt; margin-top: 2pt; word-break: break-all;">
                            ${item.val}
                          </div>
                        </div>
                      `).join('')}
                    </td>
                  </tr>
                </table>
              ` : ''}

            </td>
          </tr>
        </table>
    </body>
    </html>`;
}

function generateHieroTechWordHTML(data, config) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    
    const BLACK = '#000000';
    const MED = '#222222';
    const GRAY_TEXT = '#555555';

    // Get Initials
    const initials = (p.fullName || 'RESUME').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Contact Details center list
    const contactItems = [];
    if (p.phone) contactItems.push(p.phone);
    if (p.email) contactItems.push(p.email);
    if (p.address) contactItems.push(p.address);
    const contactStr = contactItems.join('      ');

    // Links list
    const linkItems = [];
    if (p.linkedin) linkItems.push(p.linkedin);
    if (p.github) linkItems.push(p.github);
    if (p.website) linkItems.push(p.website);
    const linkStr = linkItems.join('      ');

    const roleTitle = p.roleTitle || 'Professional Title';

    return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Resume</title><style>
        body { font-family: 'Times New Roman', Times, serif; line-height: 1.25; color: ${BLACK}; background-color: #FFFFFF; margin: 30pt; }
        .section-title { font-size: 12pt; font-weight: bold; color: ${BLACK}; margin-top: 15pt; margin-bottom: 2pt; text-transform: uppercase; }
        .section-line { border-bottom: 1px solid ${BLACK}; margin-bottom: 6pt; font-size: 0px; }
        .item-title { font-size: 10.5pt; font-weight: bold; color: ${BLACK}; text-transform: uppercase; }
        .item-date { font-size: 9.5pt; font-weight: bold; color: ${BLACK}; text-align: right; }
        .item-company { font-size: 9.5pt; color: ${GRAY_TEXT}; font-style: italic; margin-bottom: 3pt; }
        .content { font-size: 9.5pt; margin-bottom: 4pt; text-align: justify; color: ${BLACK}; }
        ul { margin-top: 2pt; margin-bottom: 3pt; padding-left: 15pt; }
        li { margin-bottom: 2pt; font-size: 9.5pt; }
    </style></head>
    <body>
        
        <!-- Centered Header Table with prefix black vertical block -->
        <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto; margin-bottom: 5pt; font-family: 'Times New Roman', Times, serif;">
          <tr>
            <td style="width: 4.5pt; background-color: ${BLACK}; font-size: 0px;">&nbsp;</td>
            <td style="padding-left: 10pt; font-size: 22pt; font-weight: bold; color: ${BLACK}; text-transform: uppercase; white-space: nowrap; letter-spacing: 0.8px;">
              ${(p.fullName || 'YOUR NAME').toUpperCase()}
            </td>
          </tr>
        </table>

        <!-- Centered Subtitle -->
        <div style="text-align: center; font-size: 11pt; color: ${MED}; font-weight: normal; margin-bottom: 6pt; text-transform: uppercase; font-family: 'Times New Roman', Times, serif;">
          ${roleTitle}
        </div>

        <!-- Centered Contact -->
        <div style="text-align: center; font-size: 9.5pt; color: ${MED}; margin-bottom: 4pt; font-family: 'Times New Roman', Times, serif;">
          ${contactStr}
        </div>

        <!-- Centered Links -->
        ${linkStr ? `
          <div style="text-align: center; font-size: 9.5pt; color: ${MED}; margin-bottom: 12pt; font-family: 'Times New Roman', Times, serif;">
            ${linkStr}
          </div>
        ` : ''}
        
        ${d.summary ? `
            <div class='section-title'>Professional Profile</div>
            <div class='section-line'>&nbsp;</div>
            <div class='content' style="font-family: 'Times New Roman', Times, serif;">${d.summary}</div>
        ` : ''}

        ${d.experience.length > 0 ? `
            <div class='section-title'>Work History</div>
            <div class='section-line'>&nbsp;</div>
            ${d.experience.map(exp => `
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 2pt; font-family: 'Times New Roman', Times, serif;">
                  <tr>
                    <td class="item-title" style="text-align: left;">${(exp.jobTitle || '').toUpperCase()}</td>
                    <td class="item-date" style="text-align: right;">${exp.startDate || ''} - ${exp.endDate || 'Present'}</td>
                  </tr>
                </table>
                <div class="item-company" style="font-family: 'Times New Roman', Times, serif;">${(exp.company || '').toUpperCase()}${exp.location ? ' / ' + exp.location : ''}</div>
                <div class='content' style="font-family: 'Times New Roman', Times, serif;">
                  ${exp.description ? `<ul>${exp.description.split('\n').filter(l => l.trim()).map(l => `<li>${l.replace(/^[\*-•]\s*/, '')}</li>`).join('')}</ul>` : ''}
                </div>
            `).join('')}
        ` : ''}

        ${d.education.length > 0 ? `
            <div class='section-title'>Education</div>
            <div class='section-line'>&nbsp;</div>
            ${d.education.map(edu => `
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 2pt; font-family: 'Times New Roman', Times, serif;">
                  <tr>
                    <td class="item-title" style="text-align: left;">${(edu.school || '').toUpperCase()}</td>
                    <td class="item-date" style="text-align: right;">${edu.gradYear || ''}</td>
                  </tr>
                </table>
                <div class="item-company" style="font-family: 'Times New Roman', Times, serif;">${edu.degree || ''} ${edu.gpa ? '| GPA: ' + edu.gpa : ''}</div>
            `).join('')}
        ` : ''}

        ${d.projects.length > 0 ? `
            <div class='section-title'>Projects</div>
            <div class='section-line'>&nbsp;</div>
            ${d.projects.map(proj => `
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 2pt; font-family: 'Times New Roman', Times, serif;">
                  <tr>
                    <td class="item-title" style="text-align: left;">${(proj.name || proj.title || '').toUpperCase()}</td>
                    <td class="item-date" style="text-align: right;">${proj.duration || ''}</td>
                  </tr>
                </table>
                ${proj.tech || proj.technologies ? `<div class="item-company" style="font-family: 'Times New Roman', Times, serif;">Technologies: ${proj.tech || proj.technologies}</div>` : ''}
                <div class='content' style="font-family: 'Times New Roman', Times, serif;">
                  ${proj.description ? `<ul>${proj.description.split('\n').filter(l => l.trim()).map(l => `<li>${l.replace(/^[\*-•]\s*/, '')}</li>`).join('')}</ul>` : ''}
                </div>
            `).join('')}
        ` : ''}

        ${d.technicalSkills ? `
            <div class='section-title'>Technical Skills</div>
            <div class='section-line'>&nbsp;</div>
            <div class='content' style="font-family: 'Times New Roman', Times, serif;">${d.technicalSkills}</div>
        ` : ''}

        ${d.certifications ? `
            <div class='section-title'>Certifications</div>
            <div class='section-line'>&nbsp;</div>
            <div class='content' style="font-family: 'Times New Roman', Times, serif;">${d.certifications}</div>
        ` : ''}
        
        ${d.achievements ? `
            <div class='section-title'>Achievements</div>
            <div class='section-line'>&nbsp;</div>
            <div class='content' style="font-family: 'Times New Roman', Times, serif;">
              <ul>${d.achievements.split(';').map(a => `<li>${a.trim()}</li>`).join('')}</ul>
            </div>
        ` : ''}
    </body>
    </html>`;
}
function generateHieroCoolWordHTML(data, config) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    
    const PRIMARY = '#1e3a8a';   // Deep Navy Blue for ATS accents
    const BLACK = '#0f172a';     // Rich corporate dark text
    const GRAY_TEXT = '#475569'; // Slate 700 for descriptions

    // Contact Details center list
    const contactItems = [];
    if (p.phone) contactItems.push(p.phone);
    if (p.email) contactItems.push(p.email);
    if (p.address) contactItems.push(p.address);
    if (p.linkedin) contactItems.push(p.linkedin);
    if (p.github) contactItems.push(p.github);
    if (p.website) contactItems.push(p.website);
    const contactStr = contactItems.join('   |   ');

    const roleTitle = p.roleTitle || 'Professional Candidate';

    // Build experience HTML sequentially
    let experienceHTML = '';
    if (d.experience.length > 0) {
        experienceHTML = `
            <div class='section-title'>Work Experience</div>
            <div class='section-line'>&nbsp;</div>
        `;
        d.experience.forEach(exp => {
            const descLines = exp.description ? exp.description.split('\n').filter(l => l.trim()) : [];
            let descHTML = '';
            if (descLines.length > 0) {
                descHTML = `<ul>${descLines.map(l => `<li>${l.replace(/^[\*-•]\s*/, '').trim()}</li>`).join('')}</ul>`;
            }
            experienceHTML += `
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 2pt; font-family: Arial, sans-serif;">
                  <tr>
                    <td class="item-title" style="text-align: left; padding: 0;">${exp.jobTitle || ''}</td>
                    <td class="item-date" style="text-align: right; width: 150pt; padding: 0;">${exp.startDate || ''} – ${exp.endDate || 'Present'}</td>
                  </tr>
                </table>
                <div class="item-company">${exp.company || ''}${exp.location ? ' | ' + exp.location : ''}</div>
                <div class='content'>
                  ${descHTML}
                </div>
            `;
        });
    }

    // Build education HTML sequentially
    let educationHTML = '';
    if (d.education.length > 0) {
        educationHTML = `
            <div class='section-title'>Education</div>
            <div class='section-line'>&nbsp;</div>
        `;
        d.education.forEach(edu => {
            educationHTML += `
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 2pt; font-family: Arial, sans-serif;">
                  <tr>
                    <td class="item-title" style="text-align: left; padding: 0;">${edu.school || ''}</td>
                    <td class="item-date" style="text-align: right; width: 150pt; padding: 0;">${edu.gradYear || ''}</td>
                  </tr>
                </table>
                <div class="item-company" style="font-weight: normal; font-size: 9.5pt;">${edu.degree || ''} ${edu.gpa ? ' | GPA: ' + edu.gpa : ''}</div>
            `;
        });
    }

    // Build key projects HTML sequentially
    let projectsHTML = '';
    if (d.projects.length > 0) {
        projectsHTML = `
            <div class='section-title'>Key Projects</div>
            <div class='section-line'>&nbsp;</div>
        `;
        d.projects.forEach(proj => {
            const descLines = proj.description ? proj.description.split('\n').filter(l => l.trim()) : [];
            let descHTML = '';
            if (descLines.length > 0) {
                descHTML = `<ul>${descLines.map(l => `<li>${l.replace(/^[\*-•]\s*/, '').trim()}</li>`).join('')}</ul>`;
            }
            projectsHTML += `
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 2pt; font-family: Arial, sans-serif;">
                  <tr>
                    <td class="item-title" style="text-align: left; padding: 0;">${proj.name || proj.title || ''}</td>
                    <td class="item-date" style="text-align: right; width: 150pt; padding: 0;">${proj.duration || ''}</td>
                  </tr>
                </table>
                ${proj.tech || proj.technologies ? `<div class="item-company" style="font-weight: bold; font-size: 9pt;">Technologies: ${proj.tech || proj.technologies}</div>` : ''}
                <div class='content'>
                  ${descHTML}
                </div>
            `;
        });
    }

    // Build achievements HTML sequentially
    let achievementsHTML = '';
    if (d.achievements) {
        achievementsHTML = `
            <div class='section-title'>Honors & Achievements</div>
            <div class='section-line'>&nbsp;</div>
            <div class='content'>
              <ul>${d.achievements.split(';').map(a => `<li>${a.trim()}</li>`).join('')}</ul>
            </div>
        `;
    }

    return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Resume</title><style>
        body { font-family: 'Arial', 'Helvetica', sans-serif; line-height: 1.4; color: ${BLACK}; background-color: #FFFFFF; margin: 36pt; }
        .section-title { font-size: 11pt; font-weight: bold; color: ${PRIMARY}; margin-top: 14pt; margin-bottom: 2pt; text-transform: uppercase; letter-spacing: 0.5px; }
        .section-line { border-bottom: 1.5px solid ${PRIMARY}; margin-bottom: 8pt; font-size: 0px; height: 0; overflow: hidden; }
        .item-title { font-size: 10pt; font-weight: bold; color: ${BLACK}; text-align: left; }
        .item-date { font-size: 9.5pt; font-weight: normal; color: ${GRAY_TEXT}; text-align: right; }
        .item-company { font-size: 9.5pt; color: ${GRAY_TEXT}; font-weight: bold; font-style: italic; margin-bottom: 3pt; }
        .content { font-size: 9.5pt; margin-bottom: 4pt; text-align: justify; color: ${GRAY_TEXT}; }
        ul { margin-top: 2pt; margin-bottom: 3pt; padding-left: 15pt; }
        li { margin-bottom: 2.5pt; font-size: 9.5pt; color: ${GRAY_TEXT}; }
    </style></head>
    <body>
        
        <!-- Centered Header -->
        <div style="text-align: center; margin-bottom: 18pt;">
          <h1 style="font-size: 22pt; font-weight: bold; color: ${BLACK}; text-transform: uppercase; margin: 0 0 3pt 0; letter-spacing: 0.5px; font-family: Arial, sans-serif;">
            ${p.fullName || 'RESUME'}
          </h1>
          <div style="font-size: 11pt; color: ${PRIMARY}; font-weight: bold; text-transform: uppercase; margin-bottom: 8pt; letter-spacing: 1px;">
            ${roleTitle}
          </div>
          <div style="font-size: 9.5pt; color: ${GRAY_TEXT}; font-family: Arial, sans-serif; line-height: 1.4;">
            ${contactStr}
          </div>
        </div>

        ${d.summary ? `
            <div class='section-title'>Professional Summary</div>
            <div class='section-line'>&nbsp;</div>
            <div class='content'>${d.summary}</div>
        ` : ''}

        ${experienceHTML}
        ${educationHTML}
        ${projectsHTML}

        ${d.technicalSkills ? `
            <div class='section-title'>Skills & Expertise</div>
            <div class='section-line'>&nbsp;</div>
            <div class='content' style="line-height: 1.55; color: ${GRAY_TEXT}; font-family: Arial, sans-serif;">
              <strong>Technical Skills:</strong> ${d.technicalSkills}
              ${d.softSkills ? `<br/><strong>Soft Skills:</strong> ${d.softSkills}` : ''}
            </div>
        ` : ''}

        ${d.certifications ? `
            <div class='section-title'>Certifications</div>
            <div class='section-line'>&nbsp;</div>
            <div class='content'>${d.certifications}</div>
        ` : ''}

        ${achievementsHTML}
    </body>
    </html>`;
}

function generateHieroNovaWordHTML(data, config) {
    const d = normalizeWordData(data);
    const pInfo = d.personalInfo || {};
    
    // Theme Colors
    const yellow = '#f4b400';
    const dark = '#1a1a1a';
    const textBlack = '#1a1a1a';
    const greyText = '#777777';
    const white = '#ffffff';

    // Parse Initials
    const initials = (pInfo.fullName || 'RESUME').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Parse Names
    const fullName = (pInfo.fullName || data.name || "John Doe").toUpperCase();
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(' ') || "";

    const role = (pInfo.roleTitle || data.title || "PROFESSIONAL TITLE").toUpperCase();

    // Parse Section Orders
    const sectionsOrder = data.sectionOrder || ['experience', 'projects', 'education', 'certifications', 'achievements'];

    // Build main content sections step by step
    let sectionsHTML = '';
    sectionsOrder.forEach(section => {
        if (section === 'experience' && d.experience.length > 0) {
            sectionsHTML += `
                <!-- EXPERIENCE -->
                <div style="font-family: 'Times New Roman', serif; font-size: 14pt; font-weight: bold; color: ${textBlack}; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 10pt; margin-bottom: 2pt;">
                    EXPERIENCE
                </div>
                <div style="border-bottom: 1.5px solid #cccccc; margin-bottom: 12pt; height: 0; overflow: hidden;"></div>
            `;
            d.experience.slice(0, 3).forEach(exp => {
                const descLines = exp.description ? exp.description.split('\n').filter(l => l.trim()) : [];
                let descHTML = '';
                if (descLines.length > 0) {
                    descHTML = `
                        <ul style="margin: 0; padding-left: 12pt; font-size: 9.5pt; color: #444444; line-height: 1.45;">
                            ${descLines.map(l => `<li style="margin-bottom: 2pt;">${l.replace(/^[\*-•]\s*/, '').trim()}</li>`).join('')}
                        </ul>
                    `;
                }
                sectionsHTML += `
                    <div style="margin-bottom: 14pt;">
                        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                            <tr>
                                <!-- Gold bullet timeline cell -->
                                <td style="width: 15pt; vertical-align: top; padding-top: 4.5pt; padding-left: 0;">
                                    <div style="width: 6.5pt; height: 6.5pt; background-color: ${yellow}; border-radius: 3.5pt;"></div>
                                </td>
                                <td style="vertical-align: top; font-family: 'Helvetica', 'Arial', sans-serif; padding: 0;">
                                    <div style="font-size: 11pt; font-weight: bold; color: ${textBlack}; text-transform: uppercase; line-height: 1.2;">
                                        ${exp.jobTitle || ''}
                                        <span style="font-size: 9.5pt; font-weight: normal; color: ${greyText}; text-transform: none;">
                                            (${exp.startDate || ''} – ${exp.endDate || 'Present'})
                                        </span>
                                    </div>
                                    <div style="font-size: 9.5pt; color: ${greyText}; font-weight: bold; font-style: italic; margin-top: 2pt; margin-bottom: 4pt;">
                                        ${exp.company || ''}${exp.location ? ' | ' + exp.location : ''}
                                    </div>
                                    ${descHTML}
                                </td>
                            </tr>
                        </table>
                    </div>
                `;
            });
        }

        if (section === 'projects' && d.projects.length > 0) {
            sectionsHTML += `
                <!-- PROJECTS -->
                <div style="font-family: 'Times New Roman', serif; font-size: 14pt; font-weight: bold; color: ${textBlack}; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 16pt; margin-bottom: 2pt;">
                    PROJECTS
                </div>
                <div style="border-bottom: 1.5px solid #cccccc; margin-bottom: 12pt; height: 0; overflow: hidden;"></div>
            `;
            d.projects.slice(0, 2).forEach(proj => {
                const descLines = proj.description ? proj.description.split('\n').filter(l => l.trim()) : [];
                let descHTML = '';
                if (descLines.length > 0) {
                    descHTML = `
                        <ul style="margin: 0; padding-left: 12pt; font-size: 9.5pt; color: #444444; line-height: 1.45;">
                            ${descLines.map(l => `<li style="margin-bottom: 2pt;">${l.replace(/^[\*-•]\s*/, '').trim()}</li>`).join('')}
                        </ul>
                    `;
                }
                let techHTML = '';
                if (proj.tech || proj.technologies) {
                    techHTML = `
                        <div style="font-size: 8.5pt; color: ${yellow}; font-weight: bold; margin-top: 2pt; margin-bottom: 4pt; text-transform: uppercase;">
                            TECH: ${proj.tech || proj.technologies}
                        </div>
                    `;
                }
                sectionsHTML += `
                    <div style="margin-bottom: 14pt;">
                        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                            <tr>
                                <td style="width: 15pt; vertical-align: top; padding-top: 4.5pt; padding-left: 0;">
                                    <div style="width: 6.5pt; height: 6.5pt; background-color: ${yellow}; border-radius: 3.5pt;"></div>
                                </td>
                                <td style="vertical-align: top; font-family: 'Helvetica', 'Arial', sans-serif; padding: 0;">
                                    <div style="font-size: 11pt; font-weight: bold; color: #333333; text-transform: uppercase; line-height: 1.2;">
                                        ${proj.name || proj.title || ''}
                                        ${proj.duration ? `<span style="font-size: 9.5pt; font-weight: normal; color: ${greyText}; text-transform: none;"> (${proj.duration})</span>` : ''}
                                    </div>
                                    ${techHTML}
                                    ${descHTML}
                                </td>
                            </tr>
                        </table>
                    </div>
                `;
            });
        }

        if (section === 'education' && d.education.length > 0) {
            sectionsHTML += `
                <!-- EDUCATION -->
                <div style="font-family: 'Times New Roman', serif; font-size: 14pt; font-weight: bold; color: ${textBlack}; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 16pt; margin-bottom: 2pt;">
                    EDUCATION
                </div>
                <div style="border-bottom: 1.5px solid #cccccc; margin-bottom: 12pt; height: 0; overflow: hidden;"></div>
            `;
            d.education.slice(0, 2).forEach(edu => {
                sectionsHTML += `
                    <div style="margin-bottom: 10pt;">
                        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                            <tr>
                                <td style="width: 15pt; vertical-align: top; padding-top: 4.5pt; padding-left: 0;">
                                    <div style="width: 6.5pt; height: 6.5pt; background-color: ${yellow}; border-radius: 3.5pt;"></div>
                                </td>
                                <td style="vertical-align: top; font-family: 'Helvetica', 'Arial', sans-serif; padding: 0;">
                                    <div style="font-size: 11pt; font-weight: bold; color: ${textBlack}; text-transform: uppercase; line-height: 1.2;">
                                        ${edu.degree || ''}
                                    </div>
                                    <div style="font-size: 9.5pt; color: #444444; margin-top: 2pt;">
                                        ${edu.school || ''} (${edu.gradYear || ''}) ${edu.gpa ? ' | GPA: ' + edu.gpa : ''}
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </div>
                `;
            });
        }

        if (section === 'certifications' && d.certifications) {
            const certList = d.certifications.split(',').map(s => s.trim()).filter(Boolean);
            sectionsHTML += `
                <!-- CERTIFICATIONS -->
                <div style="font-family: 'Times New Roman', serif; font-size: 14pt; font-weight: bold; color: ${textBlack}; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 16pt; margin-bottom: 2pt;">
                    CERTIFICATIONS
                </div>
                <div style="border-bottom: 1.5px solid #cccccc; margin-bottom: 12pt; height: 0; overflow: hidden;"></div>
                
                <ul style="margin: 0; padding-left: 15pt; font-size: 9.5pt; color: #444444; line-height: 1.45; font-family: 'Helvetica', 'Arial', sans-serif;">
                    ${certList.map(c => `<li style="margin-bottom: 3pt;">${c}</li>`).join('')}
                </ul>
            `;
        }

        if (section === 'achievements' && d.achievements) {
            const achList = d.achievements.split(';').map(s => s.trim()).filter(Boolean);
            sectionsHTML += `
                <!-- ACHIEVEMENTS -->
                <div style="font-family: 'Times New Roman', serif; font-size: 14pt; font-weight: bold; color: ${textBlack}; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 16pt; margin-bottom: 2pt;">
                    ACHIEVEMENTS
                </div>
                <div style="border-bottom: 1.5px solid #cccccc; margin-bottom: 12pt; height: 0; overflow: hidden;"></div>
                
                <ul style="margin: 0; padding-left: 15pt; font-size: 9.5pt; color: #444444; line-height: 1.45; font-family: 'Helvetica', 'Arial', sans-serif;">
                    ${achList.map(a => `<li style="margin-bottom: 3pt;">${a}</li>`).join('')}
                </ul>
            `;
        }
    });

    // Parse Skills into rating bars
    let rawSkills = data.skills;
    if (!rawSkills || (Array.isArray(rawSkills) && rawSkills.length === 0)) rawSkills = data.technicalSkills;
    let parsedSkills = [];
    if (typeof rawSkills === 'string') {
        parsedSkills = rawSkills.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(rawSkills)) {
        parsedSkills = rawSkills.map(s => typeof s === 'string' ? s : (s.name || '')).filter(Boolean);
    }

    let skillsHTML = '';
    if (parsedSkills.length > 0) {
        let skillsTableRows = '';
        const slicedSkills = parsedSkills.slice(0, 8);
        for (let i = 0; i < slicedSkills.length; i += 2) {
            const s1 = slicedSkills[i];
            const s2 = slicedSkills[i + 1];
            skillsTableRows += `
                <tr>
                    <!-- Skill 1 -->
                    <td style="width: 50%; padding-bottom: 8pt; padding-right: 15pt; vertical-align: middle; padding-left: 0;">
                        ${s1 ? `
                            <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                                <tr>
                                    <td style="font-size: 9.5pt; font-weight: bold; color: ${textBlack}; text-transform: uppercase; vertical-align: middle; padding: 0;">
                                        ${s1}
                                    </td>
                                    <td style="width: 45pt; text-align: right; vertical-align: middle; padding: 0;">
                                        <!-- Progress bar container -->
                                        <div style="display: inline-block; width: 40pt; height: 4.5pt; background-color: #f0f0f0; border-radius: 2pt; overflow: hidden; vertical-align: middle; position: relative;">
                                            <div style="position: absolute; left: 0; top: 0; height: 4.5pt; width: 30pt; background-color: ${yellow}; border-radius: 2pt;"></div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        ` : ''}
                    </td>
                    <!-- Skill 2 -->
                    <td style="width: 50%; padding-bottom: 8pt; vertical-align: middle; padding-left: 0;">
                        ${s2 ? `
                            <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                                <tr>
                                    <td style="font-size: 9.5pt; font-weight: bold; color: ${textBlack}; text-transform: uppercase; vertical-align: middle; padding: 0;">
                                        ${s2}
                                    </td>
                                    <td style="width: 45pt; text-align: right; vertical-align: middle; padding: 0;">
                                        <!-- Progress bar container -->
                                        <div style="display: inline-block; width: 40pt; height: 4.5pt; background-color: #f0f0f0; border-radius: 2pt; overflow: hidden; vertical-align: middle; position: relative;">
                                            <div style="position: absolute; left: 0; top: 0; height: 4.5pt; width: 30pt; background-color: ${yellow}; border-radius: 2pt;"></div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        ` : ''}
                    </td>
                </tr>
            `;
        }

        skillsHTML = `
            <!-- SKILLS -->
            <div style="font-family: 'Times New Roman', serif; font-size: 14pt; font-weight: bold; color: ${textBlack}; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 18pt; margin-bottom: 2pt;">
                SKILLS
            </div>
            <div style="border-bottom: 1.5px solid #cccccc; margin-bottom: 12pt; height: 0; overflow: hidden;"></div>
            
            <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; font-family: 'Helvetica', 'Arial', sans-serif;">
                ${skillsTableRows}
            </table>
        `;
    }

    return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Resume</title><style>
        body { font-family: 'Times New Roman', 'Georgia', serif; margin: 0; padding: 0; background-color: #ffffff; color: ${textBlack}; }
        table { width: 100%; border-collapse: collapse; }
        td { vertical-align: top; }
        ul { margin-top: 2pt; margin-bottom: 3pt; padding-left: 12pt; }
        li { margin-bottom: 2pt; font-size: 9.5pt; color: #444444; }
    </style></head>
    <body>
        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
            <!-- Row 1: Header Row -->
            <tr>
                <!-- Left Gold Header Cell (Profile Circle) -->
                <td style="width: 38%; background-color: ${yellow}; vertical-align: middle; text-align: center; padding: 25pt 15pt; height: 130pt;">
                    <div style="display: inline-block; width: 100pt; height: 100pt; border-radius: 50pt; border: 3pt solid ${white}; overflow: hidden; background-color: ${dark}; vertical-align: middle;">
                        ${pInfo.profilePhoto ? `
                            <img src="${normalizePhotoSrc(pInfo.profilePhoto)}" style="width: 100pt; height: 100pt; object-fit: cover;" />
                        ` : `
                            <div style="width: 100pt; height: 100pt; line-height: 100pt; text-align: center; color: ${white}; font-family: 'Times New Roman', serif; font-size: 32pt; font-weight: bold; text-transform: uppercase;">
                                ${initials}
                            </div>
                        `}
                    </div>
                </td>
                <!-- Right White Header Cell (Name & Role) -->
                <td style="width: 62%; background-color: ${white}; vertical-align: middle; padding: 25pt 30pt; height: 130pt;">
                    <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                        <tr>
                            <td style="vertical-align: middle; padding: 0;">
                                <div style="font-family: 'Times New Roman', serif; font-size: 26pt; color: ${textBlack}; margin: 0; line-height: 1.1;">${firstName}</div>
                                <div style="font-family: 'Times New Roman', serif; font-size: 34pt; font-weight: bold; color: ${textBlack}; margin: 0; line-height: 1.1;">${lastName}</div>
                                <div style="font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11pt; color: ${greyText}; letter-spacing: 3px; font-weight: bold; margin-top: 8pt; text-transform: uppercase;">
                                    ${role}
                                </div>
                            </td>
                        </tr>
                    </table>
                    <!-- Accent Bar -->
                    <div style="height: 4.5pt; background-color: ${yellow}; margin-top: 10pt; width: 70%;"></div>
                </td>
            </tr>
            <!-- Row 2: Main Body Row -->
            <tr>
                <!-- Left Sidebar Content Cell (Dark Background) -->
                <td style="width: 38%; background-color: ${dark}; color: ${white}; vertical-align: top; padding: 25pt 20pt; font-family: 'Helvetica', 'Arial', sans-serif;">
                    
                    <!-- ABOUT ME Section -->
                    <div style="font-family: 'Times New Roman', serif; font-size: 14pt; font-weight: bold; color: ${white}; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12pt;">
                        ABOUT ME
                    </div>
                    <div style="font-size: 9.5pt; line-height: 1.45; color: ${white}; margin-bottom: 25pt; text-align: justify; opacity: 0.9;">
                        ${d.summary || 'Professional candidate summary.'}
                    </div>

                    <!-- CONTACT Section -->
                    <div style="font-family: 'Times New Roman', serif; font-size: 14pt; font-weight: bold; color: ${white}; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12pt;">
                        CONTACT
                    </div>
                    <div style="font-size: 9.5pt; line-height: 1.6; color: ${white}; margin-bottom: 25pt;">
                        ${pInfo.address ? `
                            <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 10pt; color: ${white};">
                                <tr>
                                    <td style="width: 20pt; vertical-align: top; padding: 0;">
                                        <span style="display: inline-block; width: 14pt; height: 14pt; line-height: 14pt; background-color: ${white}; color: ${dark}; font-weight: bold; border-radius: 7pt; text-align: center; font-size: 7.5pt;">L</span>
                                    </td>
                                    <td style="font-size: 9pt; vertical-align: top; padding: 0;">
                                        <strong style="color: ${white};">Address:</strong><br/>${pInfo.address}
                                    </td>
                                </tr>
                            </table>
                        ` : ''}
                        ${pInfo.phone ? `
                            <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 10pt; color: ${white};">
                                <tr>
                                    <td style="width: 20pt; vertical-align: top; padding: 0;">
                                        <span style="display: inline-block; width: 14pt; height: 14pt; line-height: 14pt; background-color: ${white}; color: ${dark}; font-weight: bold; border-radius: 7pt; text-align: center; font-size: 7.5pt;">P</span>
                                    </td>
                                    <td style="font-size: 9pt; vertical-align: top; padding: 0;">
                                        <strong style="color: ${white};">Tel:</strong><br/>${pInfo.phone}
                                    </td>
                                </tr>
                            </table>
                        ` : ''}
                        ${pInfo.email ? `
                            <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 10pt; color: ${white};">
                                <tr>
                                    <td style="width: 20pt; vertical-align: top; padding: 0;">
                                        <span style="display: inline-block; width: 14pt; height: 14pt; line-height: 14pt; background-color: ${white}; color: ${dark}; font-weight: bold; border-radius: 7pt; text-align: center; font-size: 7.5pt;">E</span>
                                    </td>
                                    <td style="font-size: 9pt; vertical-align: top; padding: 0;">
                                        <strong style="color: ${white};">Email:</strong><br/>${pInfo.email}
                                    </td>
                                </tr>
                            </table>
                        ` : ''}
                        ${pInfo.linkedin ? `
                            <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin-bottom: 10pt; color: ${white};">
                                <tr>
                                    <td style="width: 20pt; vertical-align: top; padding: 0;">
                                        <span style="display: inline-block; width: 14pt; height: 14pt; line-height: 14pt; background-color: ${white}; color: ${dark}; font-weight: bold; border-radius: 7pt; text-align: center; font-size: 7.5pt;">IN</span>
                                    </td>
                                    <td style="font-size: 9pt; vertical-align: top; padding: 0;">
                                        <strong style="color: ${white};">LinkedIn:</strong><br/>${pInfo.linkedin}
                                    </td>
                                </tr>
                            </table>
                        ` : ''}
                    </div>

                    <!-- LANGUAGES Section -->
                    ${pInfo.languagesKnown || d.languages ? `
                        <div style="font-family: 'Times New Roman', serif; font-size: 14pt; font-weight: bold; color: ${white}; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12pt;">
                            LANGUAGES
                        </div>
                        <div style="font-size: 9.5pt; line-height: 1.4; color: ${white}; opacity: 0.9;">
                            ${(pInfo.languagesKnown || d.languages).split(',').map(lang => `<div style="margin-bottom: 3pt;">• ${lang.trim()}</div>`).join('')}
                        </div>
                    ` : ''}
                </td>

                <!-- Right Main Content Cell -->
                <td style="width: 62%; background-color: ${white}; color: ${textBlack}; vertical-align: top; padding: 25pt 30pt; font-family: 'Helvetica', 'Arial', sans-serif;">
                    
                    ${sectionsHTML}
                    ${skillsHTML}

                </td>
            </tr>
        </table>
    </body>
    </html>`;
}

// ==================== HIERO ACADEMIC WORD HTML ====================
function generateHieroAcademicWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;

    const NAVY      = '#1B2A6B';
    const NAVY_MID  = '#2A3F8F';
    const WHITE     = '#FFFFFF';
    const BLACK     = '#111111';
    const MED_GRAY  = '#666666';
    const LITE_GRAY = '#888888';
    const DARK_GRAY = '#333333';

    const name        = (p.fullName || 'YOUR NAME').toUpperCase();
    const roleTitle   = p.roleTitle || '';
    const contactLine = [p.email, p.phone, p.address].filter(Boolean).join('   |   ');
    const linksLine   = [p.github, p.linkedin, p.website].filter(Boolean).join('   |   ');

    const skillsList  = d.technicalSkills
        ? d.technicalSkills.split(',').map(s => s.trim()).filter(Boolean)
        : [];
    const half        = Math.ceil(skillsList.length / 2);
    const leftSkills  = skillsList.slice(0, half);
    const rightSkills = skillsList.slice(half);

    // ── Section bar: full-width navy bar exactly like PDF ──
    function sectionBar(title) {
        return `
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin-top:6pt;margin-bottom:2pt;">
          <tr>
            <td bgcolor="${NAVY}" style="background-color:${NAVY};padding:3pt 6pt;height:17pt;vertical-align:middle;">
              <span style="font-family:Arial,sans-serif;font-size:9.5pt;font-weight:bold;color:${WHITE};letter-spacing:0.8px;text-transform:uppercase;line-height:1;">${title.toUpperCase()}</span>
            </td>
          </tr>
        </table>`;
    }

    // ── Entry header row: title left + date right (same line) ──
    function entryHeader(titleText, dateText) {
        return `
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin-top:4pt;">
          <tr>
            <td style="font-family:Arial,sans-serif;font-size:9.5pt;font-weight:bold;color:${BLACK};vertical-align:top;">${(titleText || '').toUpperCase()}</td>
            <td style="font-family:Arial,sans-serif;font-size:8.5pt;color:${MED_GRAY};text-align:right;white-space:nowrap;vertical-align:top;">${dateText || ''}</td>
          </tr>
        </table>`;
    }

    // ── Bullet point exactly like PDF ──
    function bullet(text) {
        if (!text || !text.trim()) return '';
        const clean = String(text).replace(/^[•\-\*]\s*/, '').trim();
        if (!clean) return '';
        return `<div style="font-family:Arial,sans-serif;font-size:8.5pt;color:${DARK_GRAY};margin-left:12pt;margin-bottom:2pt;line-height:1.25;">&#x2022;&nbsp;${clean}</div>`;
    }

    // ── Summary ──
    const summaryHTML = d.summary ? `
        ${sectionBar('Professional Summary')}
        <div style="font-family:Arial,sans-serif;font-size:8.5pt;color:${DARK_GRAY};text-align:justify;margin-bottom:4pt;margin-top:2pt;line-height:1.25;">${d.summary}</div>
    ` : '';

    // ── Experience ──
    const expHTML = d.experience.length > 0 ? `
        ${sectionBar('Experience')}
        ${d.experience.map(exp => `
        <div style="margin-bottom:7pt;">
            ${entryHeader(exp.jobTitle || exp.role || '', [exp.startDate, exp.endDate || 'Present'].filter(Boolean).join(' \u2013 '))}
            ${exp.company ? `<div style="font-family:Arial,sans-serif;font-size:9pt;color:${MED_GRAY};margin-top:1pt;margin-bottom:2pt;">${exp.company}</div>` : ''}
            ${exp.description ? exp.description.split('\n').filter(Boolean).map(b => bullet(b)).join('') : ''}
        </div>`).join('')}
    ` : '';

    // ── Projects ──
    const projHTML = d.projects.length > 0 ? `
        ${sectionBar('Projects')}
        ${d.projects.map(proj => `
        <div style="margin-bottom:7pt;">
            ${entryHeader(proj.name || proj.title || '', proj.dates || proj.date || '')}
            ${proj.tech || proj.technologies ? `<div style="font-family:Arial,sans-serif;font-size:8.5pt;color:${LITE_GRAY};font-style:italic;margin-top:1pt;margin-bottom:1pt;">Tech: ${proj.tech || proj.technologies}</div>` : ''}
            ${proj.link ? `<div style="font-family:Arial,sans-serif;font-size:8.5pt;color:${NAVY_MID};margin-bottom:1pt;">${proj.link}</div>` : ''}
            ${proj.description ? proj.description.split('\n').filter(Boolean).map(b => bullet(b)).join('') : ''}
        </div>`).join('')}
    ` : '';

    // ── Skills: two-column table exactly like PDF ──
    const skillsHTML = skillsList.length > 0 ? `
        ${sectionBar('Skills')}
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin-top:3pt;">
          <tr>
            <td style="width:50%;vertical-align:top;padding-right:8pt;">
                ${leftSkills.map(s => bullet(s)).join('')}
            </td>
            <td style="width:50%;vertical-align:top;">
                ${rightSkills.map(s => bullet(s)).join('')}
            </td>
          </tr>
        </table>
    ` : '';

    // ── Education ──
    const eduHTML = d.education.length > 0 ? `
        ${sectionBar('Education')}
        ${d.education.map(edu => `
        <div style="margin-bottom:6pt;">
            ${entryHeader(edu.degree || '', edu.gradYear || edu.year || '')}
            ${edu.school ? `<div style="font-family:Arial,sans-serif;font-size:9pt;color:${MED_GRAY};margin-top:1pt;">${edu.school}</div>` : ''}
            ${edu.gpa ? `<div style="font-family:Arial,sans-serif;font-size:8.5pt;color:${MED_GRAY};">GPA: ${edu.gpa}</div>` : ''}
            ${edu.coursework ? `<div style="font-family:Arial,sans-serif;font-size:8.5pt;color:${LITE_GRAY};font-style:italic;">Coursework: ${edu.coursework}</div>` : ''}
        </div>`).join('')}
    ` : '';

    // ── Certifications ──
    const certItems = d.certifications ? d.certifications.split(',').map(s => s.trim()).filter(Boolean) : [];
    const certHTML  = certItems.length > 0 ? `
        ${sectionBar('Certifications')}
        <div style="margin-top:3pt;">${certItems.map(c => bullet(c)).join('')}</div>
    ` : '';

    // ── Achievements ──
    const achItems = d.achievements ? d.achievements.split(';').map(s => s.trim()).filter(Boolean) : [];
    const achHTML  = achItems.length > 0 ? `
        ${sectionBar('Achievements')}
        <div style="margin-top:3pt;">${achItems.map(a => bullet(a)).join('')}</div>
    ` : '';

    return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${name} - Resume</title>
<style>
  @page { size: A4; margin: 14mm 14mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    background: #f0f0f0;
    color: ${BLACK};
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 14mm 14mm;
    background: ${WHITE};
    box-shadow: 0 2px 16px rgba(0,0,0,0.13);
  }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div style="text-align:center;margin-bottom:8pt;">
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:28pt;font-weight:bold;color:${NAVY};letter-spacing:3px;">${name}</div>
    ${contactLine ? `<div style="font-family:Arial,sans-serif;font-size:9pt;color:${MED_GRAY};margin-top:4pt;">${contactLine}</div>` : ''}
    ${linksLine   ? `<div style="font-family:Arial,sans-serif;font-size:9pt;color:${NAVY_MID};margin-top:2pt;">${linksLine}</div>` : ''}
    ${roleTitle   ? `<div style="font-family:Arial,sans-serif;font-size:12pt;color:${NAVY_MID};margin-top:4pt;">${roleTitle}</div>` : ''}
  </div>

  ${summaryHTML}
  ${expHTML}
  ${projHTML}
  ${skillsHTML}
  ${eduHTML}
  ${certHTML}
  ${achHTML}

</div>
</body>
</html>`;
}

// ── Hiero Monethon Word HTML ─────────────────────────────────────────────────
// ── Helper shared by all generators ─────────────────────────────────────────
function _wBullet(txt, accent) {
    const clean = String(txt).replace(/^[•\-\*]\s*/, '').trim();
    return `<div style="display:flex;gap:5pt;margin-bottom:2pt;"><span style="color:${accent};min-width:8pt;">▸</span><span style="font-size:8.5pt;line-height:1.4;">${clean}</span></div>`;
}
function _wPage(style, content) {
    return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Resume</title><style>
  @page{size:A4;margin:0;}*{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:Arial,sans-serif;background:#e8e8e8;}
  .page{width:210mm;min-height:297mm;margin:0 auto;overflow:hidden;${style}}
  table{border-collapse:collapse;width:100%;}td{vertical-align:top;padding:0;}
</style></head><body><div class="page">${content}</div></body></html>`;
}

// ── Hiero Monethon ─────────────────────────────────────────────────────────
function generateHieroMonethonWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const OG = '#F2B66D', NAVY = '#1F2A36', WHITE = '#FFFFFF', TEXT = '#333333', LIGHT = '#fdf8f0';
    const name = (p.fullName||'YOUR NAME').toUpperCase();
    const role = p.roleTitle||'';
    const contacts = [p.phone,p.email,p.address,p.linkedin,p.github,p.website].filter(Boolean);
    const skills = (d.technicalSkills||'').split(',').map(s=>s.trim()).filter(Boolean);
    const langs = (d.languages||'').split(',').map(s=>s.trim()).filter(Boolean);
    const certs = (d.certifications||'').split(',').map(s=>s.trim()).filter(Boolean);
    const mSec = (t,c) => `<div style="margin-bottom:14pt;"><div style="color:${NAVY};font-size:10.5pt;font-weight:bold;text-transform:uppercase;border-bottom:2pt solid ${OG};padding-bottom:2pt;margin-bottom:7pt;">${t}</div>${c}</div>`;
    const sSec = (t,c) => `<div style="margin-bottom:13pt;"><div style="color:${OG};font-size:9pt;font-weight:bold;text-transform:uppercase;letter-spacing:1px;border-bottom:1pt solid ${OG};padding-bottom:2pt;margin-bottom:5pt;">${t}</div>${c}</div>`;
    const bl = l => _wBullet(l, OG);
    return _wPage(`background:${WHITE};box-shadow:0 2px 20px rgba(0,0,0,0.15);`, `
  <div style="background:${OG};height:5pt;"></div>
  <div style="background:${NAVY};padding:16pt 20pt 12pt;">
    <div style="font-size:25pt;font-weight:bold;color:${WHITE};letter-spacing:1.5px;">${name}</div>
    ${role?`<div style="font-size:9.5pt;color:${OG};font-weight:bold;text-transform:uppercase;margin-top:3pt;">${role}</div>`:''}
    <div style="font-size:8pt;color:rgba(255,255,255,0.7);margin-top:5pt;">${contacts.join('  •  ')}</div>
  </div>
  <table><tr>
    <td style="width:65%;padding:16pt 16pt 16pt 20pt;background:${WHITE};">
      ${d.summary?mSec('Professional Summary',`<div style="font-size:9pt;color:${TEXT};line-height:1.5;text-align:justify;">${d.summary}</div>`):''}
      ${d.experience.length?mSec('Work Experience',d.experience.map(e=>`
        <div style="margin-bottom:10pt;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;">
            <div style="font-size:10pt;font-weight:bold;color:${NAVY};text-transform:uppercase;">${e.jobTitle||''}</div>
            <div style="font-size:8pt;color:${OG};font-weight:bold;white-space:nowrap;">${[e.startDate,e.endDate||'Present'].filter(Boolean).join(' – ')}</div>
          </div>
          <div style="font-size:8.5pt;color:#666;font-style:italic;margin-bottom:3pt;">${e.company||''}</div>
          ${(e.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
        </div>`).join('')):''}
      ${d.projects.length?mSec('Projects',d.projects.map(p=>`
        <div style="margin-bottom:10pt;">
          <div style="font-size:10pt;font-weight:bold;color:${NAVY};text-transform:uppercase;">${p.name||p.title||''}</div>
          ${p.tech?`<div style="font-size:8pt;color:${OG};font-weight:bold;margin-bottom:2pt;">Tech: ${p.tech}</div>`:''}
          ${(p.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
        </div>`).join('')):''}
    </td>
    <td style="width:35%;padding:16pt 15pt;background:${LIGHT};border-left:1pt solid #edd8a8;">
      ${skills.length?sSec('Skills',skills.map(s=>`<div style="font-size:8.5pt;color:${TEXT};margin-bottom:3pt;">• ${s}</div>`).join('')):''}
      ${d.education.length?sSec('Education',d.education.map(e=>`
        <div style="margin-bottom:8pt;">
          <div style="font-size:9pt;font-weight:bold;color:${NAVY};">${e.degree||''}</div>
          <div style="font-size:8pt;color:#555;">${e.school||''}</div>
          <div style="font-size:8pt;color:${OG};">${e.gradYear||''}</div>
        </div>`).join('')):''}
      ${langs.length?sSec('Languages',langs.map(l=>`<div style="font-size:8.5pt;color:${TEXT};margin-bottom:3pt;">• ${l}</div>`).join('')):''}
      ${certs.length?sSec('Certifications',certs.map(c=>`<div style="font-size:8.5pt;color:${TEXT};margin-bottom:3pt;">• ${c}</div>`).join('')):''}
    </td>
  </tr></table>`);
}

// ── Hiero Legion ────────────────────────────────────────────────────────────
function generateHieroLegionWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const DARK = '#1a1a1a', WHITE = '#FFFFFF', TEXT = '#222222';
    const name = (p.fullName||'YOUR NAME').toUpperCase();
    const role = p.roleTitle||'';
    const contacts = [p.phone,p.email,p.address,p.linkedin,p.github,p.website].filter(Boolean);
    const skills = (d.technicalSkills||'').split(',').map(s=>s.trim()).filter(Boolean);
    const langs = (d.languages||'').split(',').map(s=>s.trim()).filter(Boolean);
    const certs = (d.certifications||'').split(',').map(s=>s.trim()).filter(Boolean);
    const initials = (p.fullName||'R').split(' ').map(n=>n[0]||'').join('').substring(0,2).toUpperCase();
    const sSec = (t,c) => `<div style="margin-bottom:13pt;"><div style="font-size:9pt;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:${WHITE};border-bottom:1pt solid rgba(255,255,255,0.25);padding-bottom:2pt;margin-bottom:6pt;">${t}</div>${c}</div>`;
    const mSec = (t,c) => `<div style="margin-bottom:14pt;"><div style="font-size:11pt;font-weight:bold;text-transform:uppercase;color:${DARK};border-bottom:2pt solid ${DARK};padding-bottom:2pt;margin-bottom:7pt;">${t}</div>${c}</div>`;
    const bl = l => _wBullet(l, '#555');
    return _wPage(`background:${WHITE};box-shadow:0 2px 20px rgba(0,0,0,0.15);`, `
  <table style="min-height:297mm;">
    <tr>
      <td style="width:37%;background:${DARK};padding:20pt 14pt;">
        <div style="width:70pt;height:70pt;border-radius:50%;background:#333;border:3pt solid rgba(255,255,255,0.2);margin:0 auto 10pt;display:flex;align-items:center;justify-content:center;font-size:22pt;font-weight:bold;color:${WHITE};text-align:center;line-height:70pt;">${initials}</div>
        <div style="font-size:15pt;font-weight:bold;color:${WHITE};text-align:center;text-transform:uppercase;margin-bottom:2pt;">${name}</div>
        ${role?`<div style="font-size:8.5pt;color:rgba(255,255,255,0.65);text-align:center;text-transform:uppercase;letter-spacing:1px;margin-bottom:14pt;">${role}</div>`:'<div style="margin-bottom:14pt;"></div>'}
        ${contacts.length?sSec('Contact',contacts.map(c=>`<div style="font-size:8pt;color:rgba(255,255,255,0.8);margin-bottom:4pt;word-break:break-all;">• ${c}</div>`).join('')):''}
        ${skills.length?sSec('Skills',skills.map(s=>`<div style="font-size:8pt;color:rgba(255,255,255,0.8);margin-bottom:3pt;">• ${s}</div>`).join('')):''}
        ${d.education.length?sSec('Education',d.education.map(e=>`
          <div style="margin-bottom:8pt;">
            <div style="font-size:9pt;font-weight:bold;color:${WHITE};">${e.degree||''}</div>
            <div style="font-size:8pt;color:rgba(255,255,255,0.65);">${e.school||''}</div>
            <div style="font-size:7.5pt;color:rgba(255,255,255,0.5);">${e.gradYear||''}</div>
          </div>`).join('')):''}
        ${langs.length?sSec('Languages',langs.map(l=>`<div style="font-size:8pt;color:rgba(255,255,255,0.8);margin-bottom:3pt;">• ${l}</div>`).join('')):''}
        ${certs.length?sSec('Certifications',certs.map(c=>`<div style="font-size:8pt;color:rgba(255,255,255,0.8);margin-bottom:3pt;">• ${c}</div>`).join('')):''}
      </td>
      <td style="width:63%;background:${WHITE};padding:20pt 18pt;">
        ${d.summary?mSec('About Me',`<div style="font-size:9pt;color:#444;line-height:1.5;text-align:justify;">${d.summary}</div>`):''}
        ${d.experience.length?mSec('Experience',d.experience.map(e=>`
          <div style="margin-bottom:10pt;">
            <div style="display:flex;justify-content:space-between;">
              <div style="font-size:10pt;font-weight:bold;color:${DARK};text-transform:uppercase;">${e.jobTitle||''}</div>
              <div style="font-size:8pt;color:#666;white-space:nowrap;">${[e.startDate,e.endDate||'Present'].filter(Boolean).join(' – ')}</div>
            </div>
            <div style="font-size:8.5pt;color:#666;font-style:italic;margin-bottom:3pt;">${e.company||''}</div>
            ${(e.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
          </div>`).join('')):''}
        ${d.projects.length?mSec('Projects',d.projects.map(p=>`
          <div style="margin-bottom:10pt;">
            <div style="font-size:10pt;font-weight:bold;color:${DARK};text-transform:uppercase;">${p.name||p.title||''}</div>
            ${p.tech?`<div style="font-size:8pt;color:#666;font-style:italic;margin-bottom:2pt;">${p.tech}</div>`:''}
            ${(p.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
          </div>`).join('')):''}
      </td>
    </tr>
  </table>`);
}

// ── Hiero Essence ───────────────────────────────────────────────────────────
function generateHieroEssenceWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const BG = '#000000', SIDE = '#333333', GOLD = '#D4AF37', WHITE = '#FFFFFF';
    const name = (p.fullName||'YOUR NAME').toUpperCase();
    const role = p.roleTitle||'';
    const contacts = [p.phone,p.email,p.address,p.linkedin,p.github,p.website].filter(Boolean);
    const skills = (d.technicalSkills||'').split(',').map(s=>s.trim()).filter(Boolean);
    const langs = (d.languages||'').split(',').map(s=>s.trim()).filter(Boolean);
    const certs = (d.certifications||'').split(',').map(s=>s.trim()).filter(Boolean);
    const sSec = (t,c) => `<div style="margin-bottom:13pt;"><div style="font-size:9pt;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:${GOLD};border-bottom:1pt solid ${GOLD};padding-bottom:2pt;margin-bottom:6pt;">${t}</div>${c}</div>`;
    const mSec = (t,c) => `<div style="margin-bottom:14pt;"><div style="font-size:10.5pt;font-weight:bold;text-transform:uppercase;color:${GOLD};border-bottom:1.5pt solid ${GOLD};padding-bottom:2pt;margin-bottom:7pt;">${t}</div>${c}</div>`;
    const bl = l => _wBullet(l, GOLD);
    return _wPage(`background:${BG};box-shadow:0 2px 20px rgba(0,0,0,0.3);`, `
  <div style="background:${GOLD};height:4pt;"></div>
  <div style="background:#111;padding:16pt 22pt;">
    <div style="font-size:24pt;font-weight:bold;color:${WHITE};letter-spacing:2px;">${name}</div>
    ${role?`<div style="font-size:9.5pt;color:${GOLD};font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin-top:3pt;">${role}</div>`:''}
    <div style="font-size:8pt;color:rgba(255,255,255,0.65);margin-top:5pt;">${contacts.join('  •  ')}</div>
  </div>
  <table style="min-height:240mm;">
    <tr>
      <td style="width:35%;background:${SIDE};padding:16pt 13pt;border-right:1pt solid #444;">
        ${skills.length?sSec('Skills',skills.map(s=>`<div style="font-size:8pt;color:rgba(255,255,255,0.82);margin-bottom:3pt;">• ${s}</div>`).join('')):''}
        ${d.education.length?sSec('Education',d.education.map(e=>`
          <div style="margin-bottom:8pt;">
            <div style="font-size:9pt;font-weight:bold;color:${WHITE};">${e.degree||''}</div>
            <div style="font-size:8pt;color:rgba(255,255,255,0.6);">${e.school||''}</div>
            <div style="font-size:7.5pt;color:${GOLD};">${e.gradYear||''}</div>
          </div>`).join('')):''}
        ${langs.length?sSec('Languages',langs.map(l=>`<div style="font-size:8pt;color:rgba(255,255,255,0.82);margin-bottom:3pt;">• ${l}</div>`).join('')):''}
        ${certs.length?sSec('Certifications',certs.map(c=>`<div style="font-size:8pt;color:rgba(255,255,255,0.82);margin-bottom:3pt;">• ${c}</div>`).join('')):''}
      </td>
      <td style="width:65%;background:${BG};padding:16pt 18pt;">
        ${d.summary?mSec('Profile',`<div style="font-size:9pt;color:rgba(255,255,255,0.8);line-height:1.5;text-align:justify;">${d.summary}</div>`):''}
        ${d.experience.length?mSec('Experience',d.experience.map(e=>`
          <div style="margin-bottom:10pt;">
            <div style="display:flex;justify-content:space-between;">
              <div style="font-size:10pt;font-weight:bold;color:${WHITE};text-transform:uppercase;">${e.jobTitle||''}</div>
              <div style="font-size:8pt;color:${GOLD};white-space:nowrap;">${[e.startDate,e.endDate||'Present'].filter(Boolean).join(' – ')}</div>
            </div>
            <div style="font-size:8.5pt;color:rgba(255,255,255,0.55);font-style:italic;margin-bottom:3pt;">${e.company||''}</div>
            ${(e.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
          </div>`).join('')):''}
        ${d.projects.length?mSec('Projects',d.projects.map(p=>`
          <div style="margin-bottom:10pt;">
            <div style="font-size:10pt;font-weight:bold;color:${WHITE};text-transform:uppercase;">${p.name||p.title||''}</div>
            ${p.tech?`<div style="font-size:8pt;color:${GOLD};font-weight:bold;margin-bottom:2pt;">${p.tech}</div>`:''}
            ${(p.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
          </div>`).join('')):''}
      </td>
    </tr>
  </table>`);
}

// ── Hiero Timeline ──────────────────────────────────────────────────────────
function generateHieroTimelineWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const BLACK = '#111111', DARK = '#222222', GRAY = '#666666', WHITE = '#FFFFFF', BORDER = '#e0e0e0';
    const name = p.fullName||'YOUR NAME';
    const role = p.roleTitle||'';
    const contacts = [p.email,p.phone,p.address,p.linkedin].filter(Boolean);
    const skills = (d.technicalSkills||'').split(',').map(s=>s.trim()).filter(Boolean);
    const langs = (d.languages||'').split(',').map(s=>s.trim()).filter(Boolean);
    const certs = (d.certifications||'').split(',').map(s=>s.trim()).filter(Boolean);
    const initials = name.split(' ').map(n=>n[0]||'').join('').substring(0,2).toUpperCase();
    const sec = (t,c) => `<div style="margin-bottom:16pt;">
      <div style="font-size:11pt;font-weight:bold;font-family:'Times New Roman',serif;color:${BLACK};border-bottom:1.5pt solid ${BORDER};padding-bottom:3pt;margin-bottom:8pt;">${t}</div>
      ${c}
    </div>`;
    const bl = l => _wBullet(l, DARK);
    return _wPage(`background:${WHITE};box-shadow:0 2px 20px rgba(0,0,0,0.15);`, `
  <div style="border-left:14pt solid ${BLACK};padding:18pt 22pt 18pt 26pt;">
    <!-- Header row: initials circle + name -->
    <div style="display:flex;align-items:center;gap:18pt;border-bottom:1pt solid ${BORDER};padding-bottom:14pt;margin-bottom:16pt;">
      <div style="width:72pt;height:72pt;border-radius:50%;background:#222;color:${WHITE};font-size:22pt;font-weight:bold;text-align:center;line-height:72pt;flex-shrink:0;">${initials}</div>
      <div>
        <div style="font-size:26pt;font-weight:bold;font-family:'Times New Roman',serif;color:${BLACK};">${name}</div>
        ${role?`<div style="font-size:9.5pt;color:${GRAY};text-transform:uppercase;letter-spacing:1.8px;margin-top:2pt;">${role}</div>`:''}
        <div style="font-size:8pt;color:${GRAY};margin-top:5pt;">${contacts.join('  |  ')}</div>
      </div>
    </div>
    ${d.summary?sec('Summary',`<div style="font-size:9pt;color:#444;line-height:1.55;text-align:justify;">${d.summary}</div>`):''}
    ${d.experience.length?sec('Experience',d.experience.map(e=>`
      <div style="margin-bottom:11pt;padding-left:12pt;border-left:2pt solid ${BORDER};">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <div style="font-size:10pt;font-weight:bold;color:${DARK};font-family:'Times New Roman',serif;">${e.jobTitle||''}</div>
          <div style="font-size:8pt;color:${GRAY};white-space:nowrap;">${[e.startDate,e.endDate||'Present'].filter(Boolean).join(' – ')}</div>
        </div>
        <div style="font-size:8.5pt;color:${GRAY};font-style:italic;margin-bottom:3pt;">${e.company||''}</div>
        ${(e.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
      </div>`).join('')):''}
    ${skills.length?sec('Skills',`<div style="font-size:9pt;color:${DARK};line-height:1.8;">${skills.map(s=>`<span style="display:inline-block;border:1pt solid ${BORDER};padding:1pt 8pt;margin:2pt 3pt 2pt 0;border-radius:2pt;">${s}</span>`).join('')}</div>`):''}
    ${d.education.length?sec('Education',d.education.map(e=>`
      <div style="margin-bottom:7pt;padding-left:12pt;border-left:2pt solid ${BORDER};">
        <div style="font-size:10pt;font-weight:bold;color:${DARK};">${e.degree||''}</div>
        <div style="font-size:8.5pt;color:${GRAY};">${e.school||''} ${e.gradYear?'  '+e.gradYear:''}</div>
      </div>`).join('')):''}
    ${d.projects.length?sec('Projects',d.projects.map(p=>`
      <div style="margin-bottom:10pt;padding-left:12pt;border-left:2pt solid ${BORDER};">
        <div style="font-size:10pt;font-weight:bold;color:${DARK};">${p.name||p.title||''}</div>
        ${p.tech?`<div style="font-size:8pt;color:${GRAY};font-style:italic;margin-bottom:2pt;">${p.tech}</div>`:''}
        ${(p.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
      </div>`).join('')):''}
    ${certs.length?sec('Certifications',certs.map(c=>`<div style="font-size:8.5pt;color:${DARK};margin-bottom:3pt;">• ${c}</div>`).join('')):''}
    ${langs.length?sec('Languages',`<div style="font-size:9pt;color:${DARK};">${langs.join('  |  ')}</div>`):''}
  </div>`);
}

// ── Hiero Premium ───────────────────────────────────────────────────────────
function generateHieroPremiumWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const BG = '#F4F5F7', CARD = '#FFFFFF', PEACH = '#F2B66D', TEXT_PRI = '#333333', TEXT_SEC = '#555555';
    const name = (p.fullName||'YOUR NAME').toUpperCase();
    const role = p.roleTitle||d.experience[0]?.jobTitle||'';
    const contacts = [p.phone,p.email,p.address,p.linkedin,p.github,p.website].filter(Boolean);
    const skills = (d.technicalSkills||'').split(',').map(s=>s.trim()).filter(Boolean);
    const langs = (d.languages||'').split(',').map(s=>s.trim()).filter(Boolean);
    const certs = (d.certifications||'').split(',').map(s=>s.trim()).filter(Boolean);
    const initials = (p.fullName||'?').split(' ').map(n=>n[0]||'').join('').substring(0,2).toUpperCase();
    const card = (title, content) => `
      <div style="background:${CARD};border-radius:6pt;margin-bottom:10pt;overflow:hidden;box-shadow:0 1pt 4pt rgba(0,0,0,0.08);">
        ${title?`<div style="background:${PEACH};padding:5pt 12pt;font-size:9.5pt;font-weight:bold;color:#000;text-transform:uppercase;">${title}</div>`:''}
        <div style="padding:10pt 12pt;">${content}</div>
      </div>`;
    const bl = l => `<div style="font-size:9pt;color:${TEXT_SEC};margin-bottom:2pt;">• ${String(l).replace(/^[•\-\*]\s*/,'').trim()}</div>`;
    return _wPage(`background:${BG};box-shadow:0 2px 20px rgba(0,0,0,0.15);`, `
  <div style="padding:14pt 0 10pt;">
    <!-- Avatar + Name centered -->
    <div style="text-align:center;margin-bottom:10pt;">
      <div style="width:80pt;height:80pt;border-radius:50%;background:#ddd;margin:0 auto 8pt;font-size:26pt;font-weight:bold;color:#555;line-height:80pt;">${initials}</div>
      <div style="font-size:22pt;font-weight:bold;color:${TEXT_PRI};">${name}</div>
      <div style="border-top:1pt solid #ccc;margin:8pt 30pt;"></div>
      <div style="font-size:11pt;color:${TEXT_SEC};">${role}</div>
    </div>
  </div>
  <table style="padding:0 14pt 14pt;">
    <tr>
      <td style="width:35%;padding:0 8pt 0 0;vertical-align:top;">
        ${card('',contacts.map(c=>`<div style="font-size:9pt;color:${TEXT_SEC};margin-bottom:5pt;"><span style="color:${PEACH};">•</span> ${c}</div>`).join(''))}
        ${skills.length?card('Skills',skills.map(s=>`<div style="font-size:9pt;color:${TEXT_SEC};margin-bottom:4pt;">- ${s}</div>`).join('')):''}
        ${langs.length?card('Languages',`<div style="font-size:9pt;color:${TEXT_SEC};">${langs.join(', ')}</div>`):''}
      </td>
      <td style="width:65%;padding:0;vertical-align:top;">
        ${d.summary?card('Objective',`<div style="font-size:9pt;color:${TEXT_SEC};line-height:1.5;text-align:justify;">${d.summary}</div>`):''}
        ${d.education.length?card('Education',d.education.map(e=>`
          <div style="margin-bottom:8pt;">
            <div style="font-size:10pt;font-weight:bold;color:${TEXT_PRI};">${e.school||''}</div>
            <div style="font-size:9pt;color:${TEXT_SEC};">${e.degree||''}</div>
            <div style="font-size:8.5pt;color:${TEXT_SEC};">${e.gradYear||''}</div>
          </div>`).join('')):''}
        ${d.experience.length?card('Work Experience',d.experience.map(e=>`
          <div style="margin-bottom:10pt;">
            <div style="font-size:10pt;font-weight:bold;color:${TEXT_PRI};">${e.company?e.company+', ':''} ${e.jobTitle||''}</div>
            <div style="font-size:8.5pt;color:${TEXT_SEC};margin-bottom:4pt;">${[e.startDate,e.endDate||'Present'].filter(Boolean).join(' - ')}</div>
            ${(e.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
          </div>`).join('')):''}
        ${d.projects.length?card('Projects',d.projects.map(p=>`
          <div style="margin-bottom:10pt;">
            <div style="font-size:10pt;font-weight:bold;color:${TEXT_PRI};">${p.name||p.title||''}</div>
            ${p.tech?`<div style="font-size:8.5pt;color:${PEACH};font-weight:bold;">TECH: ${(p.tech||'').toUpperCase()}</div>`:''}
            ${(p.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
          </div>`).join('')):''}
        ${certs.length?card('Certifications',certs.map(c=>`<div style="font-size:9.5pt;font-weight:bold;color:${TEXT_PRI};margin-bottom:3pt;">• ${c}</div>`).join('')):''}
      </td>
    </tr>
  </table>`);
}

// ── Hiero Prestige ──────────────────────────────────────────────────────────
function generateHieroPrestigeWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const SIDE = '#1e293b', ACCENT = '#3b82f6', DARK = '#0f172a', MUTED = '#64748b', WHITE = '#FFFFFF', LIGHT = '#f8fafc';
    const name = (p.fullName||'YOUR NAME').toUpperCase();
    const role = p.roleTitle||'';
    const contacts = [p.address,p.phone,p.email,p.linkedin&&'LinkedIn'].filter(Boolean);
    const skills = (d.technicalSkills||'').split(',').map(s=>s.trim()).filter(Boolean);
    const langs = (d.languages||'').split(',').map(s=>s.trim()).filter(Boolean);
    const certs = (d.certifications||'').split(',').map(s=>s.trim()).filter(Boolean);
    const initials = (p.fullName||'?').split(' ').map(n=>n[0]||'').join('').substring(0,2).toUpperCase();
    const sSec = (t,c) => `<div style="margin-bottom:14pt;"><div style="font-size:8.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:${WHITE};border-bottom:1pt solid rgba(255,255,255,0.15);padding-bottom:2pt;margin-bottom:6pt;">${t}</div>${c}</div>`;
    const mSec = (t,c) => `<div style="margin-bottom:14pt;"><div style="font-size:10.5pt;font-weight:bold;text-transform:uppercase;color:${DARK};border-bottom:1.5pt solid #cbd5e1;padding-bottom:3pt;margin-bottom:8pt;letter-spacing:1.5px;">${t}</div>${c}</div>`;
    const bl = l => _wBullet(l, DARK);
    return _wPage(`background:${WHITE};box-shadow:0 2px 20px rgba(0,0,0,0.15);`, `
  <table style="min-height:297mm;">
    <tr>
      <td style="width:32%;background:${SIDE};padding:22pt 15pt;">
        <!-- Avatar initials circle -->
        <div style="width:70pt;height:70pt;border-radius:50%;background:#334155;border:2pt solid rgba(255,255,255,0.15);margin:0 auto 12pt;font-size:22pt;font-weight:bold;color:${WHITE};text-align:center;line-height:70pt;">${initials}</div>
        <div style="font-size:15pt;font-weight:bold;color:${WHITE};text-transform:uppercase;text-align:center;line-height:1.2;margin-bottom:3pt;">${name}</div>
        ${role?`<div style="font-size:8.5pt;color:${ACCENT};text-transform:uppercase;letter-spacing:1px;text-align:center;margin-bottom:14pt;">${role}</div>`:'<div style="margin-bottom:14pt;"></div>'}
        ${contacts.length?sSec('Information',contacts.map(c=>`<div style="font-size:8pt;color:rgba(255,255,255,0.75);margin-bottom:5pt;word-break:break-all;">${c}</div>`).join('')):''}
        ${skills.length?sSec('Skills & Expertise',skills.map(s=>`<div style="font-size:8pt;color:rgba(255,255,255,0.8);margin-bottom:3pt;">• ${s}</div>`).join('')):''}
        ${d.education.length?sSec('Education',d.education.map(e=>`
          <div style="margin-bottom:8pt;">
            <div style="font-size:9pt;font-weight:bold;color:${WHITE};">${e.school||''}</div>
            <div style="font-size:8pt;color:rgba(255,255,255,0.65);">${e.degree||''}</div>
            <div style="font-size:7.5pt;color:rgba(255,255,255,0.5);">${e.gradYear||''}</div>
          </div>`).join('')):''}
        ${langs.length?sSec('Languages',langs.map(l=>`<div style="font-size:8pt;color:rgba(255,255,255,0.8);margin-bottom:3pt;">• ${l}</div>`).join('')):''}
        ${certs.length?sSec('Certifications',certs.map(c=>`<div style="font-size:8pt;color:rgba(255,255,255,0.8);margin-bottom:3pt;">• ${c}</div>`).join('')):''}
      </td>
      <td style="width:68%;background:${LIGHT};padding:22pt 22pt;">
        ${d.summary?mSec('Profile Summary',`<div style="font-size:9pt;color:#334155;line-height:1.55;text-align:justify;">${d.summary}</div>`):''}
        ${d.experience.length?mSec('Experience',d.experience.map(e=>`
          <div style="margin-bottom:11pt;">
            <div style="font-size:8.5pt;color:${ACCENT};font-weight:bold;margin-bottom:1pt;">${[e.startDate,e.endDate||'Present'].filter(Boolean).join(' - ')}</div>
            <div style="font-size:10.5pt;font-weight:bold;color:${DARK};font-family:'Times New Roman',serif;">${e.company||''}</div>
            <div style="font-size:9pt;color:${MUTED};font-style:italic;margin-bottom:4pt;">${e.jobTitle||''}</div>
            ${(e.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
          </div>`).join('')):''}
        ${d.education.length?mSec('Education',d.education.map(e=>`
          <div style="margin-bottom:8pt;">
            <div style="font-size:8.5pt;color:${ACCENT};font-weight:bold;">${e.gradYear||''}</div>
            <div style="font-size:10pt;font-weight:bold;font-family:'Times New Roman',serif;color:${DARK};">${e.school||''}</div>
            <div style="font-size:9pt;color:${MUTED};">${e.degree||''}</div>
          </div>`).join('')):''}
        ${d.projects.length?mSec('Projects',d.projects.map(p=>`
          <div style="margin-bottom:10pt;">
            <div style="font-size:10.5pt;font-weight:bold;font-family:'Times New Roman',serif;color:${DARK};">${p.name||p.title||''}</div>
            ${p.tech?`<div style="font-size:8.5pt;color:${ACCENT};font-weight:bold;margin-bottom:2pt;">Tech: ${p.tech}</div>`:''}
            ${(p.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
          </div>`).join('')):''}
      </td>
    </tr>
  </table>`);
}

// ── Hiero Royal ─────────────────────────────────────────────────────────────
function generateHieroRoyalWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const BG = '#EDE8D9', TAG_BG = '#D8D2C0', DARK = '#2C2C2C', BLACK = '#1A1A1A', MED = '#4A4A4A', LIGHT = '#6A6A6A', LINE = '#C5BC9E';
    const name = p.fullName||'YOUR NAME';
    const role = p.roleTitle||'';
    const contacts = [p.phone,p.email,p.address,p.linkedin].filter(Boolean);
    const skills = (d.technicalSkills||'').split(',').map(s=>s.trim()).filter(Boolean);
    const langs = (d.languages||'').split(',').map(s=>s.trim()).filter(Boolean);
    const certs = (d.certifications||'').split(',').map(s=>s.trim()).filter(Boolean);
    const initials = name.split(' ').map(n=>n[0]||'').join('').substring(0,2).toUpperCase();
    const sec = (t,c) => `<div style="margin-bottom:14pt;"><div style="font-size:10.5pt;font-weight:bold;color:${DARK};letter-spacing:1px;border-bottom:1pt solid ${LINE};padding-bottom:3pt;margin-bottom:7pt;">${t}</div>${c}</div>`;
    const bl = l => _wBullet(l, DARK);
    return _wPage(`background:${BG};box-shadow:0 2px 20px rgba(0,0,0,0.1);`, `
  <div style="padding:24pt 28pt;">
    <!-- Header: name left, avatar right -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1.5pt solid ${LINE};padding-bottom:12pt;margin-bottom:16pt;">
      <div>
        <div style="font-size:26pt;font-weight:bold;font-family:'Times New Roman',serif;color:${BLACK};">${name}</div>
        ${role?`<div style="font-size:10pt;color:${MED};text-transform:uppercase;letter-spacing:1px;margin-top:3pt;">${role}</div>`:''}
        <div style="font-size:8pt;color:${LIGHT};margin-top:6pt;">${contacts.join('  •  ')}</div>
      </div>
      <div style="width:68pt;height:68pt;border-radius:50%;background:#B8AC98;font-size:22pt;font-weight:bold;color:#fff;text-align:center;line-height:68pt;flex-shrink:0;">${initials}</div>
    </div>
    ${d.summary?sec('Profile',`<div style="font-size:9pt;color:${MED};line-height:1.5;text-align:justify;">${d.summary}</div>`):''}
    ${d.experience.length?sec('Work Experience',d.experience.map(e=>`
      <div style="margin-bottom:11pt;">
        <div style="display:flex;justify-content:space-between;">
          <div style="font-size:10pt;font-weight:bold;color:${DARK};">${e.jobTitle||''}</div>
          <div style="font-size:8pt;color:${LIGHT};white-space:nowrap;">${[e.startDate,e.endDate||'Present'].filter(Boolean).join(' – ')}</div>
        </div>
        <div style="font-size:8.5pt;color:${LIGHT};font-style:italic;margin-bottom:3pt;">${e.company||''}</div>
        ${(e.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
      </div>`).join('')):''}
    ${skills.length?sec('Strengths',`<div style="display:flex;flex-wrap:wrap;gap:5pt;">${skills.map(s=>`<span style="display:inline-block;background:${TAG_BG};color:${DARK};font-size:8.5pt;padding:3pt 10pt;border-radius:2pt;">${s}</span>`).join('')}</div>`):''}
    ${d.education.length?sec('Education',d.education.map(e=>`
      <div style="margin-bottom:7pt;">
        <div style="font-size:10pt;font-weight:bold;color:${DARK};">${e.degree||''}</div>
        <div style="font-size:8.5pt;color:${LIGHT};">${e.school||''} ${e.gradYear?'  '+e.gradYear:''}</div>
      </div>`).join('')):''}
    ${d.projects.length?sec('Projects',d.projects.map(p=>`
      <div style="margin-bottom:10pt;">
        <div style="font-size:10pt;font-weight:bold;color:${DARK};">${p.name||p.title||''}</div>
        ${p.tech?`<div style="font-size:8pt;color:${LIGHT};font-style:italic;margin-bottom:2pt;">${p.tech}</div>`:''}
        ${(p.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
      </div>`).join('')):''}
    ${certs.length?sec('Certifications',certs.map(c=>`<div style="font-size:8.5pt;color:${MED};margin-bottom:3pt;">• ${c}</div>`).join('')):''}
    ${langs.length?sec('Languages',`<div style="font-size:9pt;color:${MED};">${langs.join('  |  ')}</div>`):''}
  </div>`);
}

// ── Hiero Vertex ────────────────────────────────────────────────────────────
function generateHieroVertexWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const TOP = '#F8FAFC', LEFT_BG = '#FFFFFF', RIGHT_BG = '#0F172A', DARK = '#0F172A', LIGHT_TXT = '#F8FAFC', MUTED = '#94A3B8';
    const name = (p.fullName||'YOUR NAME').toUpperCase();
    const role = (p.roleTitle||'').toUpperCase();
    const contacts = [p.email,p.phone,p.address].filter(Boolean);
    const skills = (d.technicalSkills||'').split(',').map(s=>s.trim()).filter(Boolean);
    const langs = (d.languages||'').split(',').map(s=>s.trim()).filter(Boolean);
    const certs = (d.certifications||'').split(',').map(s=>s.trim()).filter(Boolean);
    const mSec = (t,c) => `<div style="margin-bottom:14pt;"><div style="font-size:10pt;font-weight:bold;text-transform:uppercase;color:#1e293b;border-bottom:1.5pt solid #CBD5E1;padding-bottom:3pt;margin-bottom:7pt;letter-spacing:1px;">${t}</div>${c}</div>`;
    const rSec = (t,c) => `<div style="margin-bottom:14pt;"><div style="font-size:9.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:#CBD5E1;border-bottom:1pt solid #334155;padding-bottom:2pt;margin-bottom:6pt;">${t}</div>${c}</div>`;
    const bl = l => _wBullet(l, '#94A3B8');
    return _wPage(`background:${LEFT_BG};box-shadow:0 2px 20px rgba(0,0,0,0.15);`, `
  <!-- Light slate header spanning full width -->
  <div style="background:${TOP};padding:18pt 22pt;border-bottom:1pt solid #CBD5E1;text-align:center;">
    <div style="font-size:28pt;font-weight:bold;color:${DARK};letter-spacing:2.5px;">${name}</div>
    ${role?`<div style="font-size:10pt;color:${DARK};letter-spacing:4px;margin-top:4pt;">${role}</div>`:''}
    <!-- Contact box -->
    <div style="display:flex;justify-content:center;border:1pt solid #94A3B8;margin:10pt 20pt 0;border-radius:2pt;">
      ${contacts.map((c,i)=>`${i>0?'<div style="width:1pt;background:#CBD5E1;margin:6pt 0;"></div>':''}<div style="flex:1;padding:8pt 10pt;font-size:8pt;color:${DARK};text-align:center;">${c}</div>`).join('')}
    </div>
  </div>
  <!-- Two-column body: white left, dark right -->
  <table style="min-height:220mm;">
    <tr>
      <td style="width:60%;background:${LEFT_BG};padding:18pt 18pt;">
        ${d.summary?mSec('Summary',`<div style="font-size:9pt;color:#334155;line-height:1.5;text-align:justify;">${d.summary}</div>`):''}
        ${d.experience.length?mSec('Experience',d.experience.map(e=>`
          <div style="margin-bottom:10pt;">
            <div style="display:flex;justify-content:space-between;">
              <div style="font-size:10pt;font-weight:bold;color:${DARK};">${e.jobTitle||''}</div>
              <div style="background:#E2E8F0;font-size:7.5pt;color:${DARK};padding:2pt 7pt;border-radius:2pt;white-space:nowrap;">${[e.startDate,e.endDate||'Present'].filter(Boolean).join(' – ')}</div>
            </div>
            <div style="font-size:8.5pt;color:#64748b;font-style:italic;margin-bottom:3pt;">${e.company||''}</div>
            ${(e.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
          </div>`).join('')):''}
        ${d.projects.length?mSec('Projects',d.projects.map(p=>`
          <div style="margin-bottom:10pt;">
            <div style="font-size:10pt;font-weight:bold;color:${DARK};">${p.name||p.title||''}</div>
            ${p.tech?`<div style="font-size:8pt;color:#64748b;font-style:italic;margin-bottom:2pt;">${p.tech}</div>`:''}
            ${(p.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
          </div>`).join('')):''}
      </td>
      <td style="width:40%;background:${RIGHT_BG};padding:18pt 15pt;">
        ${skills.length?rSec('Skills',skills.map(s=>`<div style="font-size:8pt;color:${LIGHT_TXT};margin-bottom:3pt;">• ${s}</div>`).join('')):''}
        ${d.education.length?rSec('Education',d.education.map(e=>`
          <div style="margin-bottom:8pt;">
            <div style="font-size:9pt;font-weight:bold;color:${LIGHT_TXT};">${e.degree||''}</div>
            <div style="font-size:8pt;color:${MUTED};">${e.school||''}</div>
            <div style="font-size:7.5pt;color:${MUTED};">${e.gradYear||''}</div>
          </div>`).join('')):''}
        ${langs.length?rSec('Languages',langs.map(l=>`<div style="font-size:8pt;color:${LIGHT_TXT};margin-bottom:3pt;">• ${l}</div>`).join('')):''}
        ${certs.length?rSec('Certifications',certs.map(c=>`<div style="font-size:8pt;color:${LIGHT_TXT};margin-bottom:3pt;">• ${c}</div>`).join('')):''}
      </td>
    </tr>
  </table>`);
}

// ── Priya Analytics ─────────────────────────────────────────────────────────
function generatePriyaAnalyticsWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const DARK = '#111827', MED = '#374151', MUTED = '#6B7280', WHITE = '#FFFFFF', BORDER = '#E5E7EB';
    const name = (p.fullName||'YOUR NAME').toUpperCase();
    const role = p.roleTitle||'';
    const contacts = [p.phone,p.email,p.address,p.linkedin,p.github].filter(Boolean);
    const skills = (d.technicalSkills||'').split(',').map(s=>s.trim()).filter(Boolean);
    const certs = (d.certifications||'').split(',').map(s=>s.trim()).filter(Boolean);
    const sec = (t,c) => `<div style="margin-bottom:14pt;"><div style="font-size:11pt;font-weight:bold;text-transform:uppercase;color:${DARK};border-bottom:2pt solid ${DARK};padding-bottom:2pt;margin-bottom:8pt;letter-spacing:1px;">${t}</div>${c}</div>`;
    const bl = l => _wBullet(l, DARK);
    return _wPage(`background:${WHITE};padding:18mm 18mm;box-shadow:0 2px 20px rgba(0,0,0,0.12);`, `
  <div style="text-align:center;border-bottom:3pt solid ${DARK};padding-bottom:14pt;margin-bottom:16pt;">
    <div style="font-size:28pt;font-weight:bold;font-family:'Times New Roman',serif;color:${DARK};letter-spacing:1.5px;">${name}</div>
    ${role?`<div style="font-size:10pt;color:${MUTED};text-transform:uppercase;letter-spacing:2px;margin-top:4pt;">${role}</div>`:''}
    <div style="font-size:8.5pt;color:${MUTED};margin-top:7pt;">${contacts.join('  |  ')}</div>
  </div>
  ${d.summary?sec('Professional Profile',`<div style="font-size:9pt;color:${MED};line-height:1.55;text-align:justify;">${d.summary}</div>`):''}
  ${d.experience.length?sec('Professional Experience',d.experience.map(e=>`
    <div style="margin-bottom:11pt;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <div style="font-size:10pt;font-weight:bold;color:${DARK};text-transform:uppercase;">${e.jobTitle||''}</div>
        <div style="font-size:8pt;color:${MUTED};white-space:nowrap;">${[e.startDate,e.endDate||'Present'].filter(Boolean).join(' – ')}</div>
      </div>
      <div style="font-size:9pt;color:${MUTED};font-style:italic;margin-bottom:3pt;">${e.company||''}</div>
      ${(e.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
    </div>`).join('')):''}
  ${d.projects.length?sec('Projects',d.projects.map(p=>`
    <div style="margin-bottom:10pt;">
      <div style="font-size:10pt;font-weight:bold;color:${DARK};text-transform:uppercase;">${p.name||p.title||''}</div>
      ${p.tech?`<div style="font-size:8.5pt;color:${MUTED};font-style:italic;margin-bottom:2pt;">${p.tech}</div>`:''}
      ${(p.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
    </div>`).join('')):''}
  ${skills.length?sec('Technical Skills',`<div style="line-height:2;">${skills.map(s=>`<span style="display:inline-block;border:1pt solid ${BORDER};font-size:8pt;color:${DARK};padding:2pt 9pt;margin:2pt 3pt 2pt 0;border-radius:2pt;">${s}</span>`).join('')}</div>`):''}
  ${d.education.length?sec('Education',d.education.map(e=>`
    <div style="margin-bottom:7pt;">
      <div style="display:flex;justify-content:space-between;">
        <div style="font-size:10pt;font-weight:bold;color:${DARK};">${e.degree||''}</div>
        <div style="font-size:8.5pt;color:${MUTED};white-space:nowrap;">${e.gradYear||''}</div>
      </div>
      <div style="font-size:9pt;color:${MUTED};font-style:italic;">${e.school||''}</div>
    </div>`).join('')):''}
  ${certs.length?sec('Certifications',certs.map(c=>`<div style="font-size:8.5pt;color:${MED};margin-bottom:3pt;">• ${c}</div>`).join('')):''}
`);
}

// ── Hiero Executive ─────────────────────────────────────────────────────────
function generateHieroExecutiveWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const BLACK = '#000000', DARK = '#1a1a1a', MED = '#333333', GRAY = '#777777', WHITE = '#FFFFFF';
    const name = (p.fullName||'YOUR NAME').toUpperCase();
    const role = p.roleTitle||'';
    const contacts = [p.phone,p.email,p.address,p.linkedin].filter(Boolean);
    const skills = (d.technicalSkills||'').split(',').map(s=>s.trim()).filter(Boolean);
    const certs = (d.certifications||'').split(',').map(s=>s.trim()).filter(Boolean);
    const sec = (t,c) => `<div style="margin-bottom:14pt;"><div style="font-size:11pt;font-weight:bold;text-transform:uppercase;color:${BLACK};border-bottom:2pt solid ${BLACK};padding-bottom:2pt;margin-bottom:8pt;letter-spacing:1px;">${t}</div>${c}</div>`;
    const bl = l => _wBullet(l, BLACK);
    return _wPage(`background:${WHITE};padding:18mm 18mm;box-shadow:0 2px 20px rgba(0,0,0,0.12);`, `
  <div style="margin-bottom:14pt;">
    <div style="font-size:28pt;font-weight:bold;color:${BLACK};letter-spacing:1.5px;">${name}</div>
    ${role?`<div style="font-size:10pt;color:${GRAY};text-transform:uppercase;letter-spacing:2px;margin-top:3pt;">${role}</div>`:''}
    <div style="font-size:8.5pt;color:${GRAY};margin-top:6pt;">${contacts.join('  |  ')}</div>
  </div>
  <div style="border-top:2pt solid ${BLACK};margin-bottom:14pt;"></div>
  ${d.summary?sec('Executive Summary',`<div style="font-size:9pt;color:${MED};line-height:1.55;text-align:justify;">${d.summary}</div>`):''}
  ${d.experience.length?sec('Professional Experience',d.experience.map(e=>`
    <div style="margin-bottom:11pt;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <div style="font-size:10.5pt;font-weight:bold;color:${BLACK};text-transform:uppercase;">${e.jobTitle||''}</div>
        <div style="font-size:8pt;color:${GRAY};white-space:nowrap;">${[e.startDate,e.endDate||'Present'].filter(Boolean).join(' – ')}</div>
      </div>
      <div style="font-size:9pt;color:${GRAY};font-style:italic;margin-bottom:3pt;">${e.company||''}</div>
      ${(e.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
    </div>`).join('')):''}
  ${d.projects.length?sec('Key Projects',d.projects.map(p=>`
    <div style="margin-bottom:10pt;">
      <div style="font-size:10.5pt;font-weight:bold;color:${BLACK};text-transform:uppercase;">${p.name||p.title||''}</div>
      ${p.tech?`<div style="font-size:8.5pt;color:${GRAY};font-style:italic;margin-bottom:2pt;">${p.tech}</div>`:''}
      ${(p.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
    </div>`).join('')):''}
  ${skills.length?sec('Technical Skills',`<div style="font-size:9pt;color:${MED};">${skills.join('  |  ')}</div>`):''}
  ${d.education.length?sec('Education',d.education.map(e=>`
    <div style="margin-bottom:7pt;">
      <div style="display:flex;justify-content:space-between;">
        <div style="font-size:10pt;font-weight:bold;color:${BLACK};">${e.degree||''}</div>
        <div style="font-size:8.5pt;color:${GRAY};white-space:nowrap;">${e.gradYear||''}</div>
      </div>
      <div style="font-size:9pt;color:${GRAY};font-style:italic;">${e.school||''}</div>
    </div>`).join('')):''}
  ${certs.length?sec('Certifications',certs.map(c=>`<div style="font-size:8.5pt;color:${MED};margin-bottom:3pt;">• ${c}</div>`).join('')):''}
`);
}

// ── Hiero Velocity (mirrors Premium look with blue accent) ──────────────────
function generateHieroVelocityWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const BG = '#F4F5F7', CARD = '#FFFFFF', PEACH = '#F2B66D', BLUE = '#2563eb', TEXT_PRI = '#333333', TEXT_SEC = '#555555';
    const name = (p.fullName||'YOUR NAME').toUpperCase();
    const role = p.roleTitle||d.experience[0]?.jobTitle||'';
    const contacts = [p.phone,p.email,p.address,p.linkedin].filter(Boolean);
    const skills = (d.technicalSkills||'').split(',').map(s=>s.trim()).filter(Boolean);
    const certs = (d.certifications||'').split(',').map(s=>s.trim()).filter(Boolean);
    const card = (title, content, accent=PEACH) => `
      <div style="background:${CARD};border-radius:6pt;margin-bottom:10pt;overflow:hidden;box-shadow:0 1pt 4pt rgba(0,0,0,0.08);">
        ${title?`<div style="background:${accent};padding:5pt 12pt;font-size:9.5pt;font-weight:bold;color:#fff;text-transform:uppercase;">${title}</div>`:''}
        <div style="padding:10pt 12pt;">${content}</div>
      </div>`;
    const bl = l => `<div style="font-size:9pt;color:${TEXT_SEC};margin-bottom:2pt;">• ${String(l).replace(/^[•\-\*]\s*/,'').trim()}</div>`;
    const initials = (p.fullName||'?').split(' ').map(n=>n[0]||'').join('').substring(0,2).toUpperCase();
    return _wPage(`background:${BG};box-shadow:0 2px 20px rgba(0,0,0,0.15);`, `
  <div style="background:${BLUE};padding:16pt 22pt;">
    <div style="display:flex;align-items:center;gap:14pt;">
      <div style="border-left:4pt solid ${PEACH};padding-left:14pt;">
        <div style="font-size:24pt;font-weight:bold;color:#fff;letter-spacing:1.5px;">${name}</div>
        ${role?`<div style="font-size:9.5pt;color:${PEACH};text-transform:uppercase;letter-spacing:2px;margin-top:3pt;">${role}</div>`:''}
      </div>
    </div>
    <div style="font-size:8pt;color:rgba(255,255,255,0.75);margin-top:8pt;padding-left:18pt;">${contacts.join('  •  ')}</div>
  </div>
  <table style="padding:12pt 14pt;">
    <tr>
      <td style="width:35%;padding:0 8pt 0 0;vertical-align:top;">
        <div style="width:70pt;height:70pt;border-radius:50%;background:#ddd;margin:0 auto 10pt;font-size:22pt;font-weight:bold;color:#555;line-height:70pt;text-align:center;">${initials}</div>
        ${skills.length?card('Skills',skills.map(s=>`<div style="font-size:9pt;color:${TEXT_SEC};margin-bottom:4pt;">- ${s}</div>`).join(''),BLUE):''}
        ${d.education.length?card('Education',d.education.map(e=>`
          <div style="margin-bottom:7pt;">
            <div style="font-size:10pt;font-weight:bold;color:${TEXT_PRI};">${e.school||''}</div>
            <div style="font-size:9pt;color:${TEXT_SEC};">${e.degree||''}</div>
            <div style="font-size:8.5pt;color:${TEXT_SEC};">${e.gradYear||''}</div>
          </div>`).join(''),BLUE):''}
      </td>
      <td style="width:65%;padding:0;vertical-align:top;">
        ${d.summary?card('Summary',`<div style="font-size:9pt;color:${TEXT_SEC};line-height:1.5;text-align:justify;">${d.summary}</div>`,BLUE):''}
        ${d.experience.length?card('Work Experience',d.experience.map(e=>`
          <div style="margin-bottom:10pt;">
            <div style="font-size:10pt;font-weight:bold;color:${TEXT_PRI};">${e.company?e.company+', ':''} ${e.jobTitle||''}</div>
            <div style="font-size:8.5pt;color:${BLUE};font-weight:bold;margin-bottom:3pt;">${[e.startDate,e.endDate||'Present'].filter(Boolean).join(' - ')}</div>
            ${(e.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
          </div>`).join(''),BLUE):''}
        ${d.projects.length?card('Projects',d.projects.map(p=>`
          <div style="margin-bottom:10pt;">
            <div style="font-size:10pt;font-weight:bold;color:${TEXT_PRI};">${p.name||p.title||''}</div>
            ${p.tech?`<div style="font-size:8.5pt;color:${BLUE};font-weight:bold;">TECH: ${(p.tech||'').toUpperCase()}</div>`:''}
            ${(p.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
          </div>`).join(''),BLUE):''}
        ${certs.length?card('Certifications',certs.map(c=>`<div style="font-size:9.5pt;color:${TEXT_PRI};margin-bottom:3pt;">• ${c}</div>`).join(''),BLUE):''}
      </td>
    </tr>
  </table>`);
}

// ── Hiero Elite (RIGHT brick-red sidebar) ───────────────────────────────────
function generateHieroEliteWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const SIDE_BG = '#8B3F2B', SIDE_DARK = '#6E2F1F', HEADING = '#8B3F2B', BODY = '#333333', LIGHT_TXT = '#777777', WHITE = '#FFFFFF', ROLE_CLR = '#E5B8AA';
    const name = (p.fullName||'YOUR NAME').toUpperCase();
    const role = p.roleTitle||'';
    const contacts = [p.address,p.phone,p.email].filter(Boolean);
    const skills = (d.technicalSkills||'').split(',').map(s=>s.trim()).filter(Boolean);
    const langs = (d.languages||'').split(',').map(s=>s.trim()).filter(Boolean);
    const certs = (d.certifications||'').split(',').map(s=>s.trim()).filter(Boolean);
    const initials = (p.fullName||'?').split(' ').map(n=>n[0]||'').join('').substring(0,2).toUpperCase();
    const sSec = (t,c) => `<div style="margin-bottom:13pt;"><div style="font-size:8.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:${WHITE};border-bottom:1pt solid rgba(255,255,255,0.25);padding-bottom:2pt;margin-bottom:5pt;">${t}</div>${c}</div>`;
    const mSec = (t,c) => `<div style="margin-bottom:14pt;"><div style="font-size:10.5pt;font-weight:bold;text-transform:uppercase;color:${HEADING};border-bottom:1.5pt solid #CCCCCC;padding-bottom:2pt;margin-bottom:7pt;">${t}</div>${c}</div>`;
    const bl = l => _wBullet(l, HEADING);
    return _wPage(`background:#fff;box-shadow:0 2px 20px rgba(0,0,0,0.15);`, `
  <table style="min-height:297mm;">
    <tr>
      <!-- LEFT: main content (~63%) -->
      <td style="width:63%;padding:22pt 20pt;vertical-align:top;">
        <div style="margin-bottom:16pt;border-bottom:1.5pt solid #CCCCCC;padding-bottom:12pt;">
          <div style="font-size:24pt;font-weight:bold;color:${BODY};letter-spacing:1px;">${name}</div>
          ${role?`<div style="font-size:10pt;color:${HEADING};text-transform:uppercase;letter-spacing:1px;margin-top:3pt;">${role}</div>`:''}
        </div>
        ${d.summary?mSec('Profile',`<div style="font-size:9pt;color:${BODY};line-height:1.5;text-align:justify;">${d.summary}</div>`):''}
        ${d.experience.length?mSec('Work Experience',d.experience.map(e=>`
          <div style="margin-bottom:11pt;">
            <div style="display:flex;justify-content:space-between;align-items:baseline;">
              <div style="font-size:10pt;font-weight:bold;color:${BODY};">${e.jobTitle||''}</div>
              <div style="font-size:8pt;color:${LIGHT_TXT};white-space:nowrap;">${[e.startDate,e.endDate||'Present'].filter(Boolean).join(' – ')}</div>
            </div>
            <div style="font-size:8.5pt;color:${LIGHT_TXT};font-style:italic;margin-bottom:3pt;">${e.company||''}</div>
            ${(e.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
          </div>`).join('')):''}
        ${d.projects.length?mSec('Projects',d.projects.map(p=>`
          <div style="margin-bottom:10pt;">
            <div style="font-size:10pt;font-weight:bold;color:${BODY};">${p.name||p.title||''}</div>
            ${p.tech?`<div style="font-size:8pt;color:${HEADING};font-weight:bold;margin-bottom:2pt;">${p.tech}</div>`:''}
            ${(p.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
          </div>`).join('')):''}
      </td>
      <!-- RIGHT: brick-red sidebar (~37%) -->
      <td style="width:37%;background:${SIDE_BG};padding:22pt 15pt;vertical-align:top;">
        <div style="width:70pt;height:70pt;border-radius:50%;background:${SIDE_DARK};margin:0 auto 10pt;font-size:22pt;font-weight:bold;color:${WHITE};text-align:center;line-height:70pt;">${initials}</div>
        <div style="font-size:14pt;font-weight:bold;color:${WHITE};text-align:center;text-transform:uppercase;margin-bottom:2pt;">${name}</div>
        ${role?`<div style="font-size:8.5pt;color:${ROLE_CLR};text-align:center;text-transform:uppercase;letter-spacing:1px;margin-bottom:14pt;">${role}</div>`:'<div style="margin-bottom:14pt;"></div>'}
        ${contacts.length?sSec('Contact',contacts.map(c=>`<div style="font-size:8pt;color:rgba(255,255,255,0.82);margin-bottom:4pt;word-break:break-all;">${c}</div>`).join('')):''}
        ${skills.length?sSec('Skills',skills.map(s=>`<div style="font-size:8pt;color:rgba(255,255,255,0.82);margin-bottom:3pt;">• ${s}</div>`).join('')):''}
        ${d.education.length?sSec('Education',d.education.map(e=>`
          <div style="margin-bottom:8pt;">
            <div style="font-size:9pt;font-weight:bold;color:${WHITE};">${e.degree||''}</div>
            <div style="font-size:8pt;color:${ROLE_CLR};">${e.school||''}</div>
            <div style="font-size:7.5pt;color:rgba(255,255,255,0.55);">${e.gradYear||''}</div>
          </div>`).join('')):''}
        ${langs.length?sSec('Languages',langs.map(l=>`<div style="font-size:8pt;color:rgba(255,255,255,0.82);margin-bottom:3pt;">• ${l}</div>`).join('')):''}
        ${certs.length?sSec('Certifications',certs.map(c=>`<div style="font-size:8pt;color:rgba(255,255,255,0.82);margin-bottom:3pt;">• ${c}</div>`).join('')):''}
      </td>
    </tr>
  </table>`);
}

// ── Hiero Retail (navy border frame) ────────────────────────────────────────
function generateHieroRetailWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const NAVY = '#1f2a6b', GRAY = '#6c757d', BLACK = '#222', WHITE = '#FFFFFF', BORDER = '#dee2e6';
    const name = p.fullName||'YOUR NAME';
    const role = p.roleTitle||'';
    const contacts = [p.phone,p.email,p.address,p.linkedin].filter(Boolean);
    const skills = (d.technicalSkills||'').split(',').map(s=>s.trim()).filter(Boolean);
    const langs = (d.languages||'').split(',').map(s=>s.trim()).filter(Boolean);
    const certs = (d.certifications||'').split(',').map(s=>s.trim()).filter(Boolean);
    const sec = (t,c) => `<div style="margin-bottom:14pt;"><div style="font-size:11pt;font-weight:bold;color:${NAVY};border-bottom:2pt solid ${NAVY};padding-bottom:2pt;margin-bottom:8pt;text-transform:uppercase;">${t}</div>${c}</div>`;
    const bl = l => _wBullet(l, NAVY);
    return _wPage(`background:${NAVY};box-shadow:0 2px 20px rgba(0,0,0,0.2);`, `
  <!-- Navy border frame -->
  <div style="margin:10pt;background:${WHITE};min-height:calc(297mm - 20pt);padding:20pt 22pt;">
    <!-- Header -->
    <div style="margin-bottom:14pt;">
      <div style="font-size:26pt;font-weight:bold;color:${NAVY};">${name}</div>
      ${role?`<div style="font-size:12pt;color:${GRAY};font-style:italic;text-transform:uppercase;margin-top:3pt;">${role}</div>`:''}
    </div>
    <div style="border-top:2pt solid ${NAVY};margin-bottom:14pt;"></div>
    ${d.summary?sec('Summary',`<div style="font-size:9pt;color:${BLACK};line-height:1.5;text-align:justify;">${d.summary}</div>`):''}
    ${d.experience.length?sec('Work History',d.experience.map(e=>`
      <div style="margin-bottom:11pt;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <div style="font-size:10.5pt;font-weight:bold;color:${NAVY};text-transform:uppercase;">${e.jobTitle||''}</div>
          <div style="font-size:8pt;color:${GRAY};white-space:nowrap;">${[e.startDate,e.endDate||'Present'].filter(Boolean).join(' – ')}</div>
        </div>
        <div style="font-size:8.5pt;color:${GRAY};font-style:italic;margin-bottom:4pt;">${e.company||''}</div>
        ${(e.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
      </div>`).join('')):''}
    ${skills.length?sec('Skills',`<div style="font-size:9pt;color:${BLACK};">${skills.map(s=>`<div style="margin-bottom:3pt;">• ${s}</div>`).join('')}</div>`):''}
    ${d.education.length?sec('Education',d.education.map(e=>`
      <div style="margin-bottom:7pt;">
        <div style="display:flex;justify-content:space-between;">
          <div style="font-size:10pt;font-weight:bold;color:${NAVY};">${e.degree||''}</div>
          <div style="font-size:8.5pt;color:${GRAY};white-space:nowrap;">${e.gradYear||''}</div>
        </div>
        <div style="font-size:9pt;color:${GRAY};font-style:italic;">${e.school||''}</div>
      </div>`).join('')):''}
    ${d.projects.length?sec('Projects',d.projects.map(p=>`
      <div style="margin-bottom:10pt;">
        <div style="font-size:10pt;font-weight:bold;color:${NAVY};">${p.name||p.title||''}</div>
        ${p.tech?`<div style="font-size:8.5pt;color:${GRAY};font-style:italic;margin-bottom:2pt;">${p.tech}</div>`:''}
        ${(p.description||'').split('\n').filter(Boolean).map(l=>bl(l)).join('')}
      </div>`).join('')):''}
    ${certs.length?sec('Certifications',certs.map(c=>`<div style="font-size:8.5pt;color:${BLACK};margin-bottom:3pt;">• ${c}</div>`).join('')):''}
    ${langs.length?sec('Languages',`<div style="font-size:9pt;color:${BLACK};">${langs.join('  |  ')}</div>`):''}
    <div style="margin-top:16pt;border-top:1pt solid ${BORDER};padding-top:8pt;">
      <div style="font-size:8pt;color:${GRAY};">${contacts.join('  •  ')}</div>
    </div>
  </div>`);
}

// ── Hiero Legion Word HTML ───────────────────────────────────────────────────
function generateHieroLegionWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const DARK = '#1a1a1a';
    const WHITE = '#FFFFFF';
    const SOFT_GREY = '#f3f4f6';
    const TEXT = '#222222';
    const name = (p.fullName || 'YOUR NAME').toUpperCase();
    const roleTitle = p.roleTitle || '';
    const contactItems = [p.phone, p.email, p.address, p.linkedin, p.github, p.website].filter(Boolean);
    const skillsArr = d.technicalSkills ? d.technicalSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const certArr = d.certifications ? d.certifications.split(',').map(s => s.trim()).filter(Boolean) : [];
    const langArr = d.languages ? d.languages.split(',').map(s => s.trim()).filter(Boolean) : [];

    function sideSection(title, content) {
        return `<div style="margin-bottom:14pt;">
            <div style="font-size:10pt;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:${WHITE};border-bottom:1.5pt solid rgba(255,255,255,0.3);padding-bottom:3pt;margin-bottom:6pt;">${title}</div>
            ${content}
        </div>`;
    }
    function mainSection(title, content) {
        return `<div style="margin-bottom:14pt;">
            <div style="font-size:11.5pt;font-weight:bold;text-transform:uppercase;color:${DARK};border-bottom:2pt solid ${DARK};padding-bottom:2pt;margin-bottom:8pt;">${title}</div>
            ${content}
        </div>`;
    }
    function bullet(txt) {
        const clean = String(txt).replace(/^[•\-\*]\s*/, '').trim();
        return `<div style="display:flex;gap:5pt;margin-bottom:2pt;font-size:8.5pt;color:#444;"><span>•</span><span>${clean}</span></div>`;
    }

    return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Resume</title><style>
  @page { size: A4; margin: 0; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Times New Roman', serif; background: #f0f0f0; }
  .page { width:210mm; min-height:297mm; margin:0 auto; background:${WHITE}; box-shadow:0 2px 16px rgba(0,0,0,0.13); overflow:hidden; }
  table { border-collapse:collapse; }
  td { vertical-align:top; padding:0; }
</style></head>
<body><div class="page">
  <table style="width:100%;min-height:297mm;">
    <tr>
      <!-- Dark left sidebar -->
      <td style="width:38%;background:${DARK};padding:20pt 15pt;">
        <!-- Initials avatar -->
        <div style="width:70pt;height:70pt;border-radius:35pt;background:#333;border:3pt solid rgba(255,255,255,0.2);margin:0 auto 12pt auto;display:flex;align-items:center;justify-content:center;font-size:22pt;font-weight:bold;color:${WHITE};text-align:center;line-height:70pt;">
          ${(p.fullName||'R').split(' ').map(n=>n[0]||'').join('').substring(0,2).toUpperCase()}
        </div>
        <div style="font-size:16pt;font-weight:bold;color:${WHITE};text-align:center;text-transform:uppercase;margin-bottom:3pt;">${name}</div>
        ${roleTitle ? `<div style="font-size:9pt;color:rgba(255,255,255,0.7);text-align:center;margin-bottom:14pt;text-transform:uppercase;letter-spacing:1px;">${roleTitle}</div>` : ''}
        ${contactItems.length > 0 ? sideSection('Contact', contactItems.map(c => `<div style="font-size:8.5pt;color:rgba(255,255,255,0.8);margin-bottom:4pt;word-break:break-all;">• ${c}</div>`).join('')) : ''}
        ${skillsArr.length > 0 ? sideSection('Skills', skillsArr.map(s => `<div style="font-size:8.5pt;color:rgba(255,255,255,0.8);margin-bottom:3pt;">• ${s}</div>`).join('')) : ''}
        ${d.education.length > 0 ? sideSection('Education', d.education.map(edu => `
          <div style="margin-bottom:8pt;">
            <div style="font-size:9pt;font-weight:bold;color:${WHITE};">${edu.degree||''}</div>
            <div style="font-size:8pt;color:rgba(255,255,255,0.7);">${edu.school||''}</div>
            <div style="font-size:8pt;color:rgba(255,255,255,0.6);">${edu.gradYear||''}</div>
          </div>`).join('')) : ''}
        ${langArr.length > 0 ? sideSection('Languages', langArr.map(l => `<div style="font-size:8.5pt;color:rgba(255,255,255,0.8);margin-bottom:3pt;">• ${l}</div>`).join('')) : ''}
        ${certArr.length > 0 ? sideSection('Certifications', certArr.map(c => `<div style="font-size:8.5pt;color:rgba(255,255,255,0.8);margin-bottom:3pt;">• ${c}</div>`).join('')) : ''}
      </td>
      <!-- Main content -->
      <td style="width:62%;background:${WHITE};padding:20pt 20pt;">
        ${d.summary ? mainSection('About Me', `<div style="font-size:9pt;color:#444;line-height:1.5;text-align:justify;">${d.summary}</div>`) : ''}
        ${d.experience.length > 0 ? mainSection('Experience', d.experience.map(exp => `
          <div style="margin-bottom:10pt;">
            <table style="width:100%;"><tr>
              <td style="font-size:10pt;font-weight:bold;color:${DARK};text-transform:uppercase;">${exp.jobTitle||''}</td>
              <td style="text-align:right;font-size:8.5pt;color:#666;white-space:nowrap;">${[exp.startDate, exp.endDate||'Present'].filter(Boolean).join(' – ')}</td>
            </tr></table>
            <div style="font-size:9pt;color:#666;font-style:italic;margin-bottom:3pt;">${exp.company||''}</div>
            ${exp.description ? exp.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
          </div>`).join('')) : ''}
        ${d.projects.length > 0 ? mainSection('Projects', d.projects.map(proj => `
          <div style="margin-bottom:10pt;">
            <div style="font-size:10pt;font-weight:bold;color:${DARK};text-transform:uppercase;">${proj.name||proj.title||''}</div>
            ${proj.tech ? `<div style="font-size:8.5pt;color:#666;font-style:italic;margin-bottom:2pt;">${proj.tech}</div>` : ''}
            ${proj.description ? proj.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
          </div>`).join('')) : ''}
      </td>
    </tr>
  </table>
</div></body></html>`;
}

// ── Hiero Essence Word HTML ──────────────────────────────────────────────────
function generateHieroEssenceWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const DARK = '#1e1e1e';
    const GOLD = '#f5a623';
    const WHITE = '#FFFFFF';
    const LIGHT_TEXT = 'rgba(255,255,255,0.85)';
    const name = (p.fullName || 'YOUR NAME').toUpperCase();
    const roleTitle = p.roleTitle || '';
    const contactItems = [p.phone, p.email, p.address, p.linkedin, p.github, p.website].filter(Boolean);
    const skillsArr = d.technicalSkills ? d.technicalSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const certArr = d.certifications ? d.certifications.split(',').map(s => s.trim()).filter(Boolean) : [];
    const langArr = d.languages ? d.languages.split(',').map(s => s.trim()).filter(Boolean) : [];

    function sideSection(title, content) {
        return `<div style="margin-bottom:14pt;">
            <div style="font-size:9.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:${GOLD};border-bottom:1pt solid ${GOLD};padding-bottom:2pt;margin-bottom:6pt;">${title}</div>
            ${content}
        </div>`;
    }
    function mainSection(title, content) {
        return `<div style="margin-bottom:14pt;">
            <div style="font-size:10.5pt;font-weight:bold;text-transform:uppercase;color:${GOLD};border-bottom:1.5pt solid ${GOLD};padding-bottom:2pt;margin-bottom:8pt;">${title}</div>
            ${content}
        </div>`;
    }
    function bullet(txt) {
        const clean = String(txt).replace(/^[•\-\*]\s*/, '').trim();
        return `<div style="display:flex;gap:5pt;margin-bottom:2pt;font-size:8.5pt;color:rgba(255,255,255,0.75);"><span style="color:${GOLD};">▸</span><span>${clean}</span></div>`;
    }

    return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Resume</title><style>
  @page { size: A4; margin: 0; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; background: #f0f0f0; }
  .page { width:210mm; min-height:297mm; margin:0 auto; background:${DARK}; box-shadow:0 2px 16px rgba(0,0,0,0.13); }
  table { border-collapse:collapse; }
  td { vertical-align:top; padding:0; }
</style></head>
<body><div class="page">
  <!-- Gold top accent bar -->
  <div style="background:${GOLD};height:4pt;width:100%;"></div>
  <!-- Header -->
  <div style="background:#121212;padding:16pt 22pt;">
    <div style="font-size:26pt;font-weight:bold;color:${WHITE};letter-spacing:2px;">${name}</div>
    ${roleTitle ? `<div style="font-size:10pt;color:${GOLD};font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin-top:3pt;">${roleTitle}</div>` : ''}
    <div style="font-size:8.5pt;color:${LIGHT_TEXT};margin-top:5pt;">${contactItems.join('  •  ')}</div>
  </div>
  <!-- Body -->
  <table style="width:100%;">
    <tr>
      <td style="width:35%;padding:16pt 14pt;background:#1a1a1a;border-right:1pt solid #333;">
        ${skillsArr.length > 0 ? sideSection('Skills', skillsArr.map(s => `<div style="font-size:8.5pt;color:${LIGHT_TEXT};margin-bottom:3pt;">• ${s}</div>`).join('')) : ''}
        ${d.education.length > 0 ? sideSection('Education', d.education.map(edu => `
          <div style="margin-bottom:8pt;">
            <div style="font-size:9.5pt;font-weight:bold;color:${WHITE};">${edu.degree||''}</div>
            <div style="font-size:8.5pt;color:rgba(255,255,255,0.6);">${edu.school||''}</div>
            <div style="font-size:8pt;color:${GOLD};">${edu.gradYear||''}</div>
          </div>`).join('')) : ''}
        ${langArr.length > 0 ? sideSection('Languages', langArr.map(l => `<div style="font-size:8.5pt;color:${LIGHT_TEXT};margin-bottom:3pt;">• ${l}</div>`).join('')) : ''}
        ${certArr.length > 0 ? sideSection('Certifications', certArr.map(c => `<div style="font-size:8.5pt;color:${LIGHT_TEXT};margin-bottom:3pt;">• ${c}</div>`).join('')) : ''}
      </td>
      <td style="width:65%;padding:16pt 20pt;background:${DARK};">
        ${d.summary ? mainSection('Profile', `<div style="font-size:9pt;color:${LIGHT_TEXT};line-height:1.5;text-align:justify;">${d.summary}</div>`) : ''}
        ${d.experience.length > 0 ? mainSection('Experience', d.experience.map(exp => `
          <div style="margin-bottom:10pt;">
            <table style="width:100%;"><tr>
              <td style="font-size:10pt;font-weight:bold;color:${WHITE};text-transform:uppercase;">${exp.jobTitle||''}</td>
              <td style="text-align:right;font-size:8.5pt;color:${GOLD};white-space:nowrap;">${[exp.startDate, exp.endDate||'Present'].filter(Boolean).join(' – ')}</td>
            </tr></table>
            <div style="font-size:9pt;color:rgba(255,255,255,0.6);font-style:italic;margin-bottom:3pt;">${exp.company||''}</div>
            ${exp.description ? exp.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
          </div>`).join('')) : ''}
        ${d.projects.length > 0 ? mainSection('Projects', d.projects.map(proj => `
          <div style="margin-bottom:10pt;">
            <div style="font-size:10pt;font-weight:bold;color:${WHITE};text-transform:uppercase;">${proj.name||proj.title||''}</div>
            ${proj.tech ? `<div style="font-size:8.5pt;color:${GOLD};font-weight:bold;margin-bottom:2pt;">${proj.tech}</div>` : ''}
            ${proj.description ? proj.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
          </div>`).join('')) : ''}
      </td>
    </tr>
  </table>
</div></body></html>`;
}

// ── Hiero Timeline Word HTML ─────────────────────────────────────────────────
function generateHieroTimelineWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const LIGHT_BG = '#f3f4f6';
    const DARK = '#222222';
    const GRAY = '#777777';
    const WHITE = '#FFFFFF';
    const BORDER = '#e0e0e0';
    const name = (p.fullName || 'YOUR NAME').toUpperCase();
    const roleTitle = p.roleTitle || '';
    const contactItems = [p.phone, p.email, p.address, p.linkedin, p.github, p.website].filter(Boolean);
    const skillsArr = d.technicalSkills ? d.technicalSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const certArr = d.certifications ? d.certifications.split(',').map(s => s.trim()).filter(Boolean) : [];
    const langArr = d.languages ? d.languages.split(',').map(s => s.trim()).filter(Boolean) : [];

    function sideSection(title, content) {
        return `<div style="margin-bottom:14pt;">
            <div style="font-size:9.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:${DARK};border-bottom:1.5pt solid ${DARK};padding-bottom:2pt;margin-bottom:6pt;">${title}</div>
            ${content}
        </div>`;
    }
    function mainSection(title, content) {
        return `<div style="margin-bottom:14pt;">
            <div style="font-size:11pt;font-weight:bold;text-transform:uppercase;color:${DARK};border-bottom:1.5pt solid ${BORDER};padding-bottom:2pt;margin-bottom:8pt;">${title}</div>
            ${content}
        </div>`;
    }
    function bullet(txt) {
        const clean = String(txt).replace(/^[•\-\*]\s*/, '').trim();
        return `<div style="display:flex;gap:5pt;margin-bottom:2pt;font-size:8.5pt;color:#555;"><span style="color:${DARK};">•</span><span>${clean}</span></div>`;
    }

    return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Resume</title><style>
  @page { size: A4; margin: 0; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; background: #f0f0f0; }
  .page { width:210mm; min-height:297mm; margin:0 auto; background:${WHITE}; box-shadow:0 2px 16px rgba(0,0,0,0.13); }
  table { border-collapse:collapse; }
  td { vertical-align:top; padding:0; }
</style></head>
<body><div class="page">
  <!-- Header with light bg -->
  <div style="background:${LIGHT_BG};padding:18pt 20pt;border-bottom:2pt solid ${BORDER};">
    <div style="font-size:26pt;font-weight:bold;color:${DARK};letter-spacing:1.5px;">${name}</div>
    ${roleTitle ? `<div style="font-size:10.5pt;color:${GRAY};font-weight:bold;text-transform:uppercase;margin-top:3pt;">${roleTitle}</div>` : ''}
    <div style="font-size:8.5pt;color:${GRAY};margin-top:5pt;">${contactItems.join('  •  ')}</div>
  </div>
  <!-- Body -->
  <table style="width:100%;">
    <tr>
      <td style="width:33%;padding:16pt 14pt;background:${LIGHT_BG};border-right:1pt solid ${BORDER};">
        ${skillsArr.length > 0 ? sideSection('Skills', skillsArr.map(s => `<div style="font-size:8.5pt;color:${DARK};margin-bottom:3pt;">• ${s}</div>`).join('')) : ''}
        ${d.education.length > 0 ? sideSection('Education', d.education.map(edu => `
          <div style="margin-bottom:8pt;">
            <div style="font-size:9.5pt;font-weight:bold;color:${DARK};">${edu.degree||''}</div>
            <div style="font-size:8.5pt;color:${GRAY};">${edu.school||''}</div>
            <div style="font-size:8pt;color:${GRAY};">${edu.gradYear||''}</div>
          </div>`).join('')) : ''}
        ${langArr.length > 0 ? sideSection('Languages', langArr.map(l => `<div style="font-size:8.5pt;color:${DARK};margin-bottom:3pt;">• ${l}</div>`).join('')) : ''}
        ${certArr.length > 0 ? sideSection('Certifications', certArr.map(c => `<div style="font-size:8.5pt;color:${DARK};margin-bottom:3pt;">• ${c}</div>`).join('')) : ''}
      </td>
      <td style="width:67%;padding:16pt 20pt;background:${WHITE};">
        ${d.summary ? mainSection('Profile', `<div style="font-size:9pt;color:#444;line-height:1.5;text-align:justify;">${d.summary}</div>`) : ''}
        ${d.experience.length > 0 ? mainSection('Experience', d.experience.map(exp => `
          <div style="margin-bottom:10pt;padding-left:10pt;border-left:2pt solid ${BORDER};">
            <table style="width:100%;"><tr>
              <td style="font-size:10pt;font-weight:bold;color:${DARK};text-transform:uppercase;">${exp.jobTitle||''}</td>
              <td style="text-align:right;font-size:8.5pt;color:${GRAY};white-space:nowrap;">${[exp.startDate, exp.endDate||'Present'].filter(Boolean).join(' – ')}</td>
            </tr></table>
            <div style="font-size:9pt;color:${GRAY};font-style:italic;margin-bottom:3pt;">${exp.company||''}</div>
            ${exp.description ? exp.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
          </div>`).join('')) : ''}
        ${d.projects.length > 0 ? mainSection('Projects', d.projects.map(proj => `
          <div style="margin-bottom:10pt;padding-left:10pt;border-left:2pt solid ${BORDER};">
            <div style="font-size:10pt;font-weight:bold;color:${DARK};text-transform:uppercase;">${proj.name||proj.title||''}</div>
            ${proj.tech ? `<div style="font-size:8.5pt;color:${GRAY};font-style:italic;margin-bottom:2pt;">${proj.tech}</div>` : ''}
            ${proj.description ? proj.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
          </div>`).join('')) : ''}
      </td>
    </tr>
  </table>
</div></body></html>`;
}

// ── Hiero Premium Word HTML ──────────────────────────────────────────────────
function generateHieroPremiumWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const NAVY = '#1F3A5F';
    const STEEL = '#4A6572';
    const BG = '#F4F6F8';
    const WHITE = '#FFFFFF';
    const TEXT = '#333333';
    const name = (p.fullName || 'YOUR NAME').toUpperCase();
    const roleTitle = p.roleTitle || '';
    const contactItems = [p.phone, p.email, p.address, p.linkedin, p.github, p.website].filter(Boolean);
    const skillsArr = d.technicalSkills ? d.technicalSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const certArr = d.certifications ? d.certifications.split(',').map(s => s.trim()).filter(Boolean) : [];

    function section(title, content) {
        return `<div style="margin-bottom:14pt;">
            <div style="font-size:11pt;font-weight:bold;text-transform:uppercase;color:${NAVY};border-bottom:2pt solid ${NAVY};padding-bottom:2pt;margin-bottom:8pt;letter-spacing:1px;">${title}</div>
            ${content}
        </div>`;
    }
    function bullet(txt) {
        const clean = String(txt).replace(/^[•\-\*]\s*/, '').trim();
        return `<div style="display:flex;gap:6pt;margin-bottom:2pt;font-size:8.5pt;color:${TEXT};"><span style="color:${NAVY};">▸</span><span>${clean}</span></div>`;
    }

    return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Resume</title><style>
  @page { size: A4; margin: 14mm 14mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Georgia, serif; background: #f0f0f0; }
  .page { width:210mm; min-height:297mm; margin:0 auto; padding:14mm 14mm; background:${BG}; box-shadow:0 2px 16px rgba(0,0,0,0.13); }
  table { border-collapse:collapse; width:100%; }
  td { vertical-align:top; padding:0; }
</style></head>
<body><div class="page">
  <!-- Header -->
  <div style="background:${NAVY};margin:-14mm -14mm 14pt -14mm;padding:18pt 22pt;text-align:center;">
    <div style="font-size:28pt;font-weight:bold;color:${WHITE};letter-spacing:2px;">${name}</div>
    ${roleTitle ? `<div style="font-size:10.5pt;color:rgba(255,255,255,0.8);text-transform:uppercase;margin-top:4pt;letter-spacing:2px;">${roleTitle}</div>` : ''}
    <div style="font-size:8.5pt;color:rgba(255,255,255,0.7);margin-top:6pt;">${contactItems.join('  |  ')}</div>
  </div>
  ${d.summary ? section('Executive Summary', `<div style="font-size:9pt;color:${TEXT};line-height:1.5;text-align:justify;">${d.summary}</div>`) : ''}
  ${d.experience.length > 0 ? section('Professional Experience', d.experience.map(exp => `
    <div style="margin-bottom:10pt;">
      <table style="width:100%;"><tr>
        <td style="font-size:10pt;font-weight:bold;color:${NAVY};text-transform:uppercase;">${exp.jobTitle||''}</td>
        <td style="text-align:right;font-size:8.5pt;color:${STEEL};white-space:nowrap;">${[exp.startDate, exp.endDate||'Present'].filter(Boolean).join(' – ')}</td>
      </tr></table>
      <div style="font-size:9pt;color:${STEEL};font-style:italic;margin-bottom:3pt;">${exp.company||''}</div>
      ${exp.description ? exp.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
    </div>`).join('')) : ''}
  ${d.projects.length > 0 ? section('Projects', d.projects.map(proj => `
    <div style="margin-bottom:10pt;">
      <div style="font-size:10pt;font-weight:bold;color:${NAVY};text-transform:uppercase;">${proj.name||proj.title||''}</div>
      ${proj.tech ? `<div style="font-size:8.5pt;color:${STEEL};font-style:italic;margin-bottom:2pt;">${proj.tech}</div>` : ''}
      ${proj.description ? proj.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
    </div>`).join('')) : ''}
  ${skillsArr.length > 0 ? section('Technical Skills', `<div style="line-height:1.8;">${skillsArr.map(s => `<span style="display:inline-block;font-size:8pt;background:${WHITE};color:${NAVY};border:1pt solid ${NAVY};padding:2pt 8pt;margin:2pt 3pt 2pt 0;border-radius:3pt;">${s}</span>`).join('')}</div>`) : ''}
  ${d.education.length > 0 ? section('Education', d.education.map(edu => `
    <div style="margin-bottom:6pt;">
      <table style="width:100%;"><tr>
        <td style="font-size:10pt;font-weight:bold;color:${NAVY};">${edu.degree||''}</td>
        <td style="text-align:right;font-size:8.5pt;color:${STEEL};white-space:nowrap;">${edu.gradYear||''}</td>
      </tr></table>
      <div style="font-size:9pt;color:${STEEL};font-style:italic;">${edu.school||''}</div>
    </div>`).join('')) : ''}
  ${certArr.length > 0 ? section('Certifications', certArr.map(c => `<div style="font-size:8.5pt;color:${TEXT};margin-bottom:3pt;">• ${c}</div>`).join('')) : ''}
</div></body></html>`;
}

// ── Hiero Prestige Word HTML ─────────────────────────────────────────────────
function generateHieroPrestigeWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const DARK_NAVY = '#0f172a';
    const NAVY = '#0f172a';
    const SLATE = '#475569';
    const WHITE = '#FFFFFF';
    const LIGHT = '#f8fafc';
    const GOLD = '#c8a74e';
    const name = (p.fullName || 'YOUR NAME').toUpperCase();
    const roleTitle = p.roleTitle || '';
    const contactItems = [p.phone, p.email, p.address, p.linkedin, p.github, p.website].filter(Boolean);
    const skillsArr = d.technicalSkills ? d.technicalSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const certArr = d.certifications ? d.certifications.split(',').map(s => s.trim()).filter(Boolean) : [];
    const langArr = d.languages ? d.languages.split(',').map(s => s.trim()).filter(Boolean) : [];

    function sideSection(title, content) {
        return `<div style="margin-bottom:14pt;">
            <div style="font-size:9pt;font-weight:bold;text-transform:uppercase;letter-spacing:2px;color:${WHITE};border-bottom:1pt solid rgba(255,255,255,0.3);padding-bottom:2pt;margin-bottom:6pt;">${title}</div>
            ${content}
        </div>`;
    }
    function mainSection(title, content) {
        return `<div style="margin-bottom:14pt;">
            <div style="font-size:11pt;font-weight:bold;text-transform:uppercase;color:${DARK_NAVY};border-bottom:2pt solid ${GOLD};padding-bottom:2pt;margin-bottom:8pt;letter-spacing:1.5px;">${title}</div>
            ${content}
        </div>`;
    }
    function bullet(txt) {
        const clean = String(txt).replace(/^[•\-\*]\s*/, '').trim();
        return `<div style="display:flex;gap:6pt;margin-bottom:2pt;font-size:8.5pt;color:${SLATE};"><span style="color:${GOLD};font-weight:bold;">▸</span><span>${clean}</span></div>`;
    }

    return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Resume</title><style>
  @page { size: A4; margin: 0; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; background: #f0f0f0; }
  .page { width:210mm; min-height:297mm; margin:0 auto; background:${WHITE}; box-shadow:0 2px 16px rgba(0,0,0,0.13); overflow:hidden; }
  table { border-collapse:collapse; }
  td { vertical-align:top; padding:0; }
</style></head>
<body><div class="page">
  <table style="width:100%;min-height:297mm;">
    <tr>
      <!-- Dark navy left sidebar -->
      <td style="width:33%;background:${NAVY};padding:20pt 15pt;">
        <!-- Name block -->
        <div style="margin-bottom:16pt;border-bottom:1pt solid rgba(255,255,255,0.2);padding-bottom:12pt;">
          <div style="font-size:18pt;font-weight:bold;color:${WHITE};text-transform:uppercase;letter-spacing:1px;line-height:1.2;">${name}</div>
          ${roleTitle ? `<div style="font-size:9pt;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:2px;margin-top:4pt;">${roleTitle}</div>` : ''}
        </div>
        ${contactItems.length > 0 ? sideSection('Contact', contactItems.map(c => `<div style="font-size:8pt;color:rgba(255,255,255,0.75);margin-bottom:4pt;word-break:break-all;">${c}</div>`).join('')) : ''}
        ${skillsArr.length > 0 ? sideSection('Core Skills', skillsArr.map(s => `<div style="font-size:8pt;color:rgba(255,255,255,0.8);margin-bottom:3pt;">• ${s}</div>`).join('')) : ''}
        ${d.education.length > 0 ? sideSection('Education', d.education.map(edu => `
          <div style="margin-bottom:8pt;">
            <div style="font-size:9pt;font-weight:bold;color:${WHITE};">${edu.degree||''}</div>
            <div style="font-size:8pt;color:rgba(255,255,255,0.65);">${edu.school||''}</div>
            <div style="font-size:7.5pt;color:rgba(255,255,255,0.5);">${edu.gradYear||''}</div>
          </div>`).join('')) : ''}
        ${langArr.length > 0 ? sideSection('Languages', langArr.map(l => `<div style="font-size:8pt;color:rgba(255,255,255,0.75);margin-bottom:3pt;">• ${l}</div>`).join('')) : ''}
        ${certArr.length > 0 ? sideSection('Certifications', certArr.map(c => `<div style="font-size:8pt;color:rgba(255,255,255,0.75);margin-bottom:3pt;">• ${c}</div>`).join('')) : ''}
      </td>
      <!-- Main content -->
      <td style="width:67%;padding:22pt 22pt;background:${LIGHT};">
        ${d.summary ? mainSection('Professional Summary', `<div style="font-size:9pt;color:${SLATE};line-height:1.5;text-align:justify;">${d.summary}</div>`) : ''}
        ${d.experience.length > 0 ? mainSection('Experience', d.experience.map(exp => `
          <div style="margin-bottom:10pt;">
            <table style="width:100%;"><tr>
              <td style="font-size:10pt;font-weight:bold;color:${DARK_NAVY};text-transform:uppercase;">${exp.jobTitle||''}</td>
              <td style="text-align:right;font-size:8pt;color:${SLATE};white-space:nowrap;">${[exp.startDate, exp.endDate||'Present'].filter(Boolean).join(' – ')}</td>
            </tr></table>
            <div style="font-size:9pt;color:${SLATE};font-style:italic;margin-bottom:3pt;">${exp.company||''}</div>
            ${exp.description ? exp.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
          </div>`).join('')) : ''}
        ${d.projects.length > 0 ? mainSection('Projects', d.projects.map(proj => `
          <div style="margin-bottom:10pt;">
            <div style="font-size:10pt;font-weight:bold;color:${DARK_NAVY};text-transform:uppercase;">${proj.name||proj.title||''}</div>
            ${proj.tech ? `<div style="font-size:8.5pt;color:${SLATE};font-style:italic;margin-bottom:2pt;">${proj.tech}</div>` : ''}
            ${proj.description ? proj.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
          </div>`).join('')) : ''}
      </td>
    </tr>
  </table>
</div></body></html>`;
}

// ── Hiero Royal Word HTML ────────────────────────────────────────────────────
function generateHieroRoyalWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const SAND = '#BFAF9A';
    const PARCHMENT = '#EDE8D9';
    const DARK = '#1a1a1a';
    const DARK_ALT = '#3a3a3a';
    const WHITE = '#FFFFFF';
    const name = (p.fullName || 'YOUR NAME').toUpperCase();
    const roleTitle = p.roleTitle || '';
    const contactItems = [p.phone, p.email, p.address, p.linkedin, p.github, p.website].filter(Boolean);
    const skillsArr = d.technicalSkills ? d.technicalSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const certArr = d.certifications ? d.certifications.split(',').map(s => s.trim()).filter(Boolean) : [];
    const langArr = d.languages ? d.languages.split(',').map(s => s.trim()).filter(Boolean) : [];

    function sideSection(title, content) {
        return `<div style="margin-bottom:14pt;">
            <div style="font-size:9.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:${DARK};border-bottom:1.5pt solid ${DARK};padding-bottom:2pt;margin-bottom:6pt;">${title}</div>
            ${content}
        </div>`;
    }
    function mainSection(title, content) {
        return `<div style="margin-bottom:14pt;">
            <div style="font-size:11pt;font-weight:bold;text-transform:uppercase;color:${DARK};border-bottom:2pt solid ${SAND};padding-bottom:2pt;margin-bottom:8pt;letter-spacing:1px;">${title}</div>
            ${content}
        </div>`;
    }
    function bullet(txt) {
        const clean = String(txt).replace(/^[•\-\*]\s*/, '').trim();
        return `<div style="display:flex;gap:6pt;margin-bottom:2pt;font-size:8.5pt;color:${DARK_ALT};"><span style="color:${DARK};">▸</span><span>${clean}</span></div>`;
    }

    return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Resume</title><style>
  @page { size: A4; margin: 0; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Georgia, serif; background: #f0f0f0; }
  .page { width:210mm; min-height:297mm; margin:0 auto; background:${PARCHMENT}; box-shadow:0 2px 16px rgba(0,0,0,0.13); overflow:hidden; }
  table { border-collapse:collapse; }
  td { vertical-align:top; padding:0; }
</style></head>
<body><div class="page">
  <table style="width:100%;min-height:297mm;">
    <tr>
      <!-- Sand-tone left sidebar -->
      <td style="width:33%;background:${SAND};padding:20pt 15pt;">
        <div style="margin-bottom:14pt;border-bottom:1.5pt solid ${DARK};padding-bottom:10pt;">
          <div style="font-size:16pt;font-weight:bold;color:${DARK};text-transform:uppercase;letter-spacing:1px;line-height:1.2;">${name}</div>
          ${roleTitle ? `<div style="font-size:9pt;color:${DARK_ALT};text-transform:uppercase;letter-spacing:1px;margin-top:4pt;">${roleTitle}</div>` : ''}
        </div>
        ${contactItems.length > 0 ? sideSection('Contact', contactItems.map(c => `<div style="font-size:8.5pt;color:${DARK_ALT};margin-bottom:4pt;word-break:break-all;">• ${c}</div>`).join('')) : ''}
        ${skillsArr.length > 0 ? sideSection('Skills', skillsArr.map(s => `<div style="font-size:8.5pt;color:${DARK_ALT};margin-bottom:3pt;">• ${s}</div>`).join('')) : ''}
        ${d.education.length > 0 ? sideSection('Education', d.education.map(edu => `
          <div style="margin-bottom:8pt;">
            <div style="font-size:9.5pt;font-weight:bold;color:${DARK};">${edu.degree||''}</div>
            <div style="font-size:8.5pt;color:${DARK_ALT};">${edu.school||''}</div>
            <div style="font-size:8pt;color:${DARK_ALT};">${edu.gradYear||''}</div>
          </div>`).join('')) : ''}
        ${langArr.length > 0 ? sideSection('Languages', langArr.map(l => `<div style="font-size:8.5pt;color:${DARK_ALT};margin-bottom:3pt;">• ${l}</div>`).join('')) : ''}
        ${certArr.length > 0 ? sideSection('Certifications', certArr.map(c => `<div style="font-size:8.5pt;color:${DARK_ALT};margin-bottom:3pt;">• ${c}</div>`).join('')) : ''}
      </td>
      <!-- Parchment main content -->
      <td style="width:67%;padding:20pt 20pt;background:${PARCHMENT};">
        ${d.summary ? mainSection('Profile', `<div style="font-size:9pt;color:${DARK_ALT};line-height:1.5;text-align:justify;">${d.summary}</div>`) : ''}
        ${d.experience.length > 0 ? mainSection('Experience', d.experience.map(exp => `
          <div style="margin-bottom:10pt;">
            <table style="width:100%;"><tr>
              <td style="font-size:10pt;font-weight:bold;color:${DARK};text-transform:uppercase;">${exp.jobTitle||''}</td>
              <td style="text-align:right;font-size:8.5pt;color:${DARK_ALT};white-space:nowrap;">${[exp.startDate, exp.endDate||'Present'].filter(Boolean).join(' – ')}</td>
            </tr></table>
            <div style="font-size:9pt;color:${DARK_ALT};font-style:italic;margin-bottom:3pt;">${exp.company||''}</div>
            ${exp.description ? exp.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
          </div>`).join('')) : ''}
        ${d.projects.length > 0 ? mainSection('Projects', d.projects.map(proj => `
          <div style="margin-bottom:10pt;">
            <div style="font-size:10pt;font-weight:bold;color:${DARK};text-transform:uppercase;">${proj.name||proj.title||''}</div>
            ${proj.tech ? `<div style="font-size:8.5pt;color:${DARK_ALT};font-style:italic;margin-bottom:2pt;">${proj.tech}</div>` : ''}
            ${proj.description ? proj.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
          </div>`).join('')) : ''}
      </td>
    </tr>
  </table>
</div></body></html>`;
}

// ── Hiero Vertex Word HTML ───────────────────────────────────────────────────
function generateHieroVertexWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const GREY_BG = '#E0E2E5';
    const DARK = '#333333';
    const MED = '#666666';
    const WHITE = '#FFFFFF';
    const BORDER = '#cccccc';
    const name = (p.fullName || 'YOUR NAME').toUpperCase();
    const roleTitle = p.roleTitle || '';
    const contactItems = [p.phone, p.email, p.address, p.linkedin, p.github, p.website].filter(Boolean);
    const skillsArr = d.technicalSkills ? d.technicalSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const certArr = d.certifications ? d.certifications.split(',').map(s => s.trim()).filter(Boolean) : [];

    function section(title, content) {
        return `<div style="margin-bottom:12pt;">
            <div style="font-size:10.5pt;font-weight:bold;text-transform:uppercase;color:${DARK};border-bottom:1.5pt solid ${DARK};padding-bottom:2pt;margin-bottom:7pt;letter-spacing:1px;">${title}</div>
            ${content}
        </div>`;
    }
    function bullet(txt) {
        const clean = String(txt).replace(/^[•\-\*]\s*/, '').trim();
        return `<div style="display:flex;gap:5pt;margin-bottom:2pt;font-size:8.5pt;color:${MED};"><span style="color:${DARK};">•</span><span>${clean}</span></div>`;
    }

    return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Resume</title><style>
  @page { size: A4; margin: 14mm 14mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; background: #f0f0f0; }
  .page { width:210mm; min-height:297mm; margin:0 auto; padding:14mm 14mm; background:${GREY_BG}; box-shadow:0 2px 16px rgba(0,0,0,0.13); }
  table { border-collapse:collapse; width:100%; }
  td { vertical-align:top; padding:0; }
</style></head>
<body><div class="page">
  <!-- Header: centered name on grey background -->
  <div style="background:${WHITE};padding:14pt 18pt;margin-bottom:14pt;text-align:center;border-radius:4pt;">
    <div style="font-size:28pt;font-weight:bold;color:${DARK};letter-spacing:2px;">${name}</div>
    ${roleTitle ? `<div style="font-size:10pt;color:${MED};text-transform:uppercase;letter-spacing:1.5px;margin-top:3pt;">${roleTitle}</div>` : ''}
    <div style="font-size:8.5pt;color:${MED};margin-top:5pt;">${contactItems.join('  •  ')}</div>
  </div>
  ${d.summary ? section('Summary', `<div style="font-size:9pt;color:${MED};line-height:1.5;text-align:justify;">${d.summary}</div>`) : ''}
  ${d.experience.length > 0 ? section('Experience', d.experience.map(exp => `
    <div style="margin-bottom:10pt;background:${WHITE};padding:8pt 10pt;border-radius:3pt;">
      <table style="width:100%;"><tr>
        <td style="font-size:10pt;font-weight:bold;color:${DARK};text-transform:uppercase;">${exp.jobTitle||''}</td>
        <td style="text-align:right;font-size:8.5pt;color:${MED};white-space:nowrap;">${[exp.startDate, exp.endDate||'Present'].filter(Boolean).join(' – ')}</td>
      </tr></table>
      <div style="font-size:9pt;color:${MED};font-style:italic;margin-bottom:3pt;">${exp.company||''}</div>
      ${exp.description ? exp.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
    </div>`).join('')) : ''}
  ${d.projects.length > 0 ? section('Projects', d.projects.map(proj => `
    <div style="margin-bottom:10pt;background:${WHITE};padding:8pt 10pt;border-radius:3pt;">
      <div style="font-size:10pt;font-weight:bold;color:${DARK};text-transform:uppercase;">${proj.name||proj.title||''}</div>
      ${proj.tech ? `<div style="font-size:8.5pt;color:${MED};font-style:italic;margin-bottom:2pt;">${proj.tech}</div>` : ''}
      ${proj.description ? proj.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
    </div>`).join('')) : ''}
  ${skillsArr.length > 0 ? section('Technical Skills', `<div style="line-height:1.8;">${skillsArr.map(s => `<span style="display:inline-block;font-size:8pt;background:${WHITE};color:${DARK};border:1pt solid ${BORDER};padding:2pt 8pt;margin:2pt 3pt 2pt 0;border-radius:3pt;">${s}</span>`).join('')}</div>`) : ''}
  ${d.education.length > 0 ? section('Education', d.education.map(edu => `
    <div style="margin-bottom:6pt;background:${WHITE};padding:6pt 10pt;border-radius:3pt;">
      <table style="width:100%;"><tr>
        <td style="font-size:10pt;font-weight:bold;color:${DARK};">${edu.degree||''}</td>
        <td style="text-align:right;font-size:8.5pt;color:${MED};white-space:nowrap;">${edu.gradYear||''}</td>
      </tr></table>
      <div style="font-size:9pt;color:${MED};font-style:italic;">${edu.school||''}</div>
    </div>`).join('')) : ''}
  ${certArr.length > 0 ? section('Certifications', certArr.map(c => `<div style="font-size:8.5pt;color:${MED};margin-bottom:3pt;">• ${c}</div>`).join('')) : ''}
</div></body></html>`;
}

// ── Priya Analytics Word HTML ────────────────────────────────────────────────
function generatePriyaAnalyticsWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const DARK = '#111827';
    const MED = '#374151';
    const LIGHT_MED = '#4b5563';
    const WHITE = '#FFFFFF';
    const BORDER = '#e5e7eb';
    const name = (p.fullName || 'YOUR NAME').toUpperCase();
    const roleTitle = p.roleTitle || '';
    const contactItems = [p.phone, p.email, p.address, p.linkedin, p.github, p.website].filter(Boolean);
    const skillsArr = d.technicalSkills ? d.technicalSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const certArr = d.certifications ? d.certifications.split(',').map(s => s.trim()).filter(Boolean) : [];

    function section(title, content) {
        return `<div style="margin-bottom:14pt;">
            <div style="font-size:11pt;font-weight:bold;text-transform:uppercase;color:${DARK};border-bottom:2pt solid ${DARK};padding-bottom:2pt;margin-bottom:8pt;letter-spacing:1px;">${title}</div>
            ${content}
        </div>`;
    }
    function bullet(txt) {
        const clean = String(txt).replace(/^[•\-\*]\s*/, '').trim();
        return `<div style="display:flex;gap:6pt;margin-bottom:2pt;font-size:8.5pt;color:${LIGHT_MED};"><span style="color:${DARK};">•</span><span>${clean}</span></div>`;
    }

    return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Resume</title><style>
  @page { size: A4; margin: 14mm 14mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Georgia, serif; background: #f0f0f0; }
  .page { width:210mm; min-height:297mm; margin:0 auto; padding:14mm 14mm; background:${WHITE}; box-shadow:0 2px 16px rgba(0,0,0,0.13); }
  table { border-collapse:collapse; width:100%; }
  td { vertical-align:top; padding:0; }
</style></head>
<body><div class="page">
  <!-- Centered header -->
  <div style="text-align:center;border-bottom:3pt solid ${DARK};padding-bottom:12pt;margin-bottom:14pt;">
    <div style="font-size:28pt;font-weight:bold;color:${DARK};letter-spacing:1.5px;">${name}</div>
    ${roleTitle ? `<div style="font-size:10.5pt;color:${LIGHT_MED};text-transform:uppercase;letter-spacing:2px;margin-top:4pt;">${roleTitle}</div>` : ''}
    <div style="font-size:8.5pt;color:${LIGHT_MED};margin-top:6pt;">${contactItems.join('  |  ')}</div>
  </div>
  ${d.summary ? section('Professional Profile', `<div style="font-size:9pt;color:${MED};line-height:1.5;text-align:justify;">${d.summary}</div>`) : ''}
  ${d.experience.length > 0 ? section('Professional Experience', d.experience.map(exp => `
    <div style="margin-bottom:10pt;">
      <table style="width:100%;"><tr>
        <td style="font-size:10pt;font-weight:bold;color:${DARK};text-transform:uppercase;">${exp.jobTitle||''}</td>
        <td style="text-align:right;font-size:8.5pt;color:${LIGHT_MED};white-space:nowrap;">${[exp.startDate, exp.endDate||'Present'].filter(Boolean).join(' – ')}</td>
      </tr></table>
      <div style="font-size:9pt;color:${LIGHT_MED};font-style:italic;margin-bottom:3pt;">${exp.company||''}</div>
      ${exp.description ? exp.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
    </div>`).join('')) : ''}
  ${d.projects.length > 0 ? section('Projects', d.projects.map(proj => `
    <div style="margin-bottom:10pt;">
      <div style="font-size:10pt;font-weight:bold;color:${DARK};text-transform:uppercase;">${proj.name||proj.title||''}</div>
      ${proj.tech ? `<div style="font-size:8.5pt;color:${LIGHT_MED};font-style:italic;margin-bottom:2pt;">${proj.tech}</div>` : ''}
      ${proj.description ? proj.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
    </div>`).join('')) : ''}
  ${skillsArr.length > 0 ? section('Technical Skills', `<div style="line-height:1.8;">${skillsArr.map(s => `<span style="display:inline-block;font-size:8pt;background:#f9fafb;color:${DARK};border:1pt solid ${BORDER};padding:2pt 8pt;margin:2pt 3pt 2pt 0;border-radius:3pt;">${s}</span>`).join('')}</div>`) : ''}
  ${d.education.length > 0 ? section('Education', d.education.map(edu => `
    <div style="margin-bottom:6pt;">
      <table style="width:100%;"><tr>
        <td style="font-size:10pt;font-weight:bold;color:${DARK};">${edu.degree||''}</td>
        <td style="text-align:right;font-size:8.5pt;color:${LIGHT_MED};white-space:nowrap;">${edu.gradYear||''}</td>
      </tr></table>
      <div style="font-size:9pt;color:${LIGHT_MED};font-style:italic;">${edu.school||''}</div>
    </div>`).join('')) : ''}
  ${certArr.length > 0 ? section('Certifications', certArr.map(c => `<div style="font-size:8.5pt;color:${MED};margin-bottom:3pt;">• ${c}</div>`).join('')) : ''}
</div></body></html>`;
}

// ── Hiero Executive Word HTML ────────────────────────────────────────────────
function generateHieroExecutiveWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const BLACK = '#000000';
    const DARK = '#1a1a1a';
    const MED = '#333333';
    const WHITE = '#FFFFFF';
    const name = (p.fullName || 'YOUR NAME').toUpperCase();
    const roleTitle = p.roleTitle || '';
    const contactItems = [p.phone, p.email, p.address, p.linkedin, p.github, p.website].filter(Boolean);
    const skillsArr = d.technicalSkills ? d.technicalSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const certArr = d.certifications ? d.certifications.split(',').map(s => s.trim()).filter(Boolean) : [];

    function section(title, content) {
        return `<div style="margin-bottom:14pt;">
            <div style="font-size:11pt;font-weight:bold;text-transform:uppercase;color:${BLACK};border-bottom:2pt solid ${BLACK};padding-bottom:2pt;margin-bottom:8pt;letter-spacing:1px;">${title}</div>
            ${content}
        </div>`;
    }
    function bullet(txt) {
        const clean = String(txt).replace(/^[•\-\*]\s*/, '').trim();
        return `<div style="display:flex;gap:6pt;margin-bottom:2pt;font-size:8.5pt;color:${MED};"><span style="color:${BLACK};">•</span><span>${clean}</span></div>`;
    }

    return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Resume</title><style>
  @page { size: A4; margin: 14mm 14mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; background: #f0f0f0; }
  .page { width:210mm; min-height:297mm; margin:0 auto; padding:14mm 14mm; background:${WHITE}; box-shadow:0 2px 16px rgba(0,0,0,0.13); }
  table { border-collapse:collapse; width:100%; }
  td { vertical-align:top; padding:0; }
</style></head>
<body><div class="page">
  <table style="width:100%;margin-bottom:14pt;">
    <tr>
      <td>
        <div style="font-size:26pt;font-weight:bold;color:${BLACK};letter-spacing:1.5px;">${name}</div>
        ${roleTitle ? `<div style="font-size:10pt;color:${MED};text-transform:uppercase;letter-spacing:2px;margin-top:2pt;">${roleTitle}</div>` : ''}
        <div style="font-size:8.5pt;color:${MED};margin-top:5pt;">${contactItems.join('  |  ')}</div>
      </td>
    </tr>
  </table>
  <div style="border-top:2pt solid ${BLACK};margin-bottom:14pt;"></div>
  ${d.summary ? section('Executive Summary', `<div style="font-size:9pt;color:${MED};line-height:1.5;text-align:justify;">${d.summary}</div>`) : ''}
  ${d.experience.length > 0 ? section('Professional Experience', d.experience.map(exp => `
    <div style="margin-bottom:10pt;">
      <table style="width:100%;"><tr>
        <td style="font-size:10pt;font-weight:bold;color:${BLACK};text-transform:uppercase;">${exp.jobTitle||''}</td>
        <td style="text-align:right;font-size:8.5pt;color:${MED};white-space:nowrap;">${[exp.startDate, exp.endDate||'Present'].filter(Boolean).join(' – ')}</td>
      </tr></table>
      <div style="font-size:9pt;color:${MED};font-style:italic;margin-bottom:3pt;">${exp.company||''}</div>
      ${exp.description ? exp.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
    </div>`).join('')) : ''}
  ${d.projects.length > 0 ? section('Key Projects', d.projects.map(proj => `
    <div style="margin-bottom:10pt;">
      <div style="font-size:10pt;font-weight:bold;color:${BLACK};text-transform:uppercase;">${proj.name||proj.title||''}</div>
      ${proj.tech ? `<div style="font-size:8.5pt;color:${MED};font-style:italic;margin-bottom:2pt;">${proj.tech}</div>` : ''}
      ${proj.description ? proj.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
    </div>`).join('')) : ''}
  ${skillsArr.length > 0 ? section('Technical Skills', `<div style="font-size:9pt;color:${MED};">${skillsArr.join('  |  ')}</div>`) : ''}
  ${d.education.length > 0 ? section('Education', d.education.map(edu => `
    <div style="margin-bottom:6pt;">
      <table style="width:100%;"><tr>
        <td style="font-size:10pt;font-weight:bold;color:${BLACK};">${edu.degree||''}</td>
        <td style="text-align:right;font-size:8.5pt;color:${MED};white-space:nowrap;">${edu.gradYear||''}</td>
      </tr></table>
      <div style="font-size:9pt;color:${MED};font-style:italic;">${edu.school||''}</div>
    </div>`).join('')) : ''}
  ${certArr.length > 0 ? section('Certifications', certArr.map(c => `<div style="font-size:8.5pt;color:${MED};margin-bottom:3pt;">• ${c}</div>`).join('')) : ''}
</div></body></html>`;
}

// ── Hiero Velocity Word HTML (mirrors Hiero Premium look) ───────────────────
function generateHieroVelocityWordHTML(data) {
    // Velocity uses the same PDF renderer as Premium — match that look
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const NAVY = '#1F3A5F';
    const STEEL = '#4A6572';
    const ACCENT = '#2563eb'; // Blue velocity accent
    const BG = '#F4F6F8';
    const WHITE = '#FFFFFF';
    const TEXT = '#333333';
    const name = (p.fullName || 'YOUR NAME').toUpperCase();
    const roleTitle = p.roleTitle || '';
    const contactItems = [p.phone, p.email, p.address, p.linkedin, p.github, p.website].filter(Boolean);
    const skillsArr = d.technicalSkills ? d.technicalSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const certArr = d.certifications ? d.certifications.split(',').map(s => s.trim()).filter(Boolean) : [];

    function section(title, content) {
        return `<div style="margin-bottom:14pt;">
            <div style="font-size:11pt;font-weight:bold;text-transform:uppercase;color:${NAVY};border-bottom:2pt solid ${ACCENT};padding-bottom:2pt;margin-bottom:8pt;letter-spacing:1px;">${title}</div>
            ${content}
        </div>`;
    }
    function bullet(txt) {
        const clean = String(txt).replace(/^[•\-\*]\s*/, '').trim();
        return `<div style="display:flex;gap:6pt;margin-bottom:2pt;font-size:8.5pt;color:${TEXT};"><span style="color:${ACCENT};">▸</span><span>${clean}</span></div>`;
    }

    return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Resume</title><style>
  @page { size: A4; margin: 14mm 14mm; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; background: #f0f0f0; }
  .page { width:210mm; min-height:297mm; margin:0 auto; padding:14mm 14mm; background:${BG}; box-shadow:0 2px 16px rgba(0,0,0,0.13); }
  table { border-collapse:collapse; width:100%; }
  td { vertical-align:top; padding:0; }
</style></head>
<body><div class="page">
  <!-- Header with navy bar + blue accent -->
  <div style="background:${NAVY};margin:-14mm -14mm 14pt -14mm;padding:18pt 22pt;">
    <div style="display:flex;align-items:center;gap:12pt;">
      <div style="border-left:4pt solid ${ACCENT};padding-left:12pt;">
        <div style="font-size:26pt;font-weight:bold;color:${WHITE};letter-spacing:1.5px;">${name}</div>
        ${roleTitle ? `<div style="font-size:10pt;color:${ACCENT};text-transform:uppercase;letter-spacing:2px;margin-top:3pt;">${roleTitle}</div>` : ''}
      </div>
    </div>
    <div style="font-size:8.5pt;color:rgba(255,255,255,0.75);margin-top:8pt;padding-left:16pt;">${contactItems.join('  •  ')}</div>
  </div>
  ${d.summary ? section('Professional Summary', `<div style="font-size:9pt;color:${TEXT};line-height:1.5;text-align:justify;">${d.summary}</div>`) : ''}
  ${d.experience.length > 0 ? section('Experience', d.experience.map(exp => `
    <div style="margin-bottom:10pt;">
      <table style="width:100%;"><tr>
        <td style="font-size:10pt;font-weight:bold;color:${NAVY};text-transform:uppercase;">${exp.jobTitle||''}</td>
        <td style="text-align:right;font-size:8.5pt;color:${ACCENT};white-space:nowrap;">${[exp.startDate, exp.endDate||'Present'].filter(Boolean).join(' – ')}</td>
      </tr></table>
      <div style="font-size:9pt;color:${STEEL};font-style:italic;margin-bottom:3pt;">${exp.company||''}</div>
      ${exp.description ? exp.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
    </div>`).join('')) : ''}
  ${d.projects.length > 0 ? section('Projects', d.projects.map(proj => `
    <div style="margin-bottom:10pt;">
      <div style="font-size:10pt;font-weight:bold;color:${NAVY};text-transform:uppercase;">${proj.name||proj.title||''}</div>
      ${proj.tech ? `<div style="font-size:8.5pt;color:${STEEL};font-style:italic;margin-bottom:2pt;">${proj.tech}</div>` : ''}
      ${proj.description ? proj.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
    </div>`).join('')) : ''}
  ${skillsArr.length > 0 ? section('Technical Skills', `<div style="line-height:1.8;">${skillsArr.map(s => `<span style="display:inline-block;font-size:8pt;background:${WHITE};color:${NAVY};border:1pt solid ${ACCENT};padding:2pt 8pt;margin:2pt 3pt 2pt 0;border-radius:3pt;">${s}</span>`).join('')}</div>`) : ''}
  ${d.education.length > 0 ? section('Education', d.education.map(edu => `
    <div style="margin-bottom:6pt;">
      <table style="width:100%;"><tr>
        <td style="font-size:10pt;font-weight:bold;color:${NAVY};">${edu.degree||''}</td>
        <td style="text-align:right;font-size:8.5pt;color:${STEEL};white-space:nowrap;">${edu.gradYear||''}</td>
      </tr></table>
      <div style="font-size:9pt;color:${STEEL};font-style:italic;">${edu.school||''}</div>
    </div>`).join('')) : ''}
  ${certArr.length > 0 ? section('Certifications', certArr.map(c => `<div style="font-size:8.5pt;color:${TEXT};margin-bottom:3pt;">• ${c}</div>`).join('')) : ''}
</div></body></html>`;
}

// ── Hiero Elite Word HTML ────────────────────────────────────────────────────
function generateHieroEliteWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const DARK = '#1a202c';
    const GOLD = '#d69e2e';
    const WHITE = '#FFFFFF';
    const LIGHT_TEXT = 'rgba(255,255,255,0.85)';
    const CONTENT_BG = '#ffffff';
    const TEXT = '#2d3748';
    const name = (p.fullName || 'YOUR NAME').toUpperCase();
    const roleTitle = p.roleTitle || '';
    const contactItems = [p.phone, p.email, p.address, p.linkedin, p.github, p.website].filter(Boolean);
    const skillsArr = d.technicalSkills ? d.technicalSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const certArr = d.certifications ? d.certifications.split(',').map(s => s.trim()).filter(Boolean) : [];
    const langArr = d.languages ? d.languages.split(',').map(s => s.trim()).filter(Boolean) : [];

    function sideSection(title, content) {
        return `<div style="margin-bottom:14pt;">
            <div style="font-size:9.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:${GOLD};border-bottom:1pt solid ${GOLD};padding-bottom:2pt;margin-bottom:6pt;">${title}</div>
            ${content}
        </div>`;
    }
    function mainSection(title, content) {
        return `<div style="margin-bottom:14pt;">
            <div style="font-size:11pt;font-weight:bold;text-transform:uppercase;color:${DARK};border-bottom:2pt solid ${GOLD};padding-bottom:2pt;margin-bottom:8pt;">${title}</div>
            ${content}
        </div>`;
    }
    function bullet(txt) {
        const clean = String(txt).replace(/^[•\-\*]\s*/, '').trim();
        return `<div style="display:flex;gap:6pt;margin-bottom:2pt;font-size:8.5pt;color:${TEXT};"><span style="color:${GOLD};font-weight:bold;">▸</span><span>${clean}</span></div>`;
    }

    return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Resume</title><style>
  @page { size: A4; margin: 0; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Times New Roman', serif; background: #f0f0f0; }
  .page { width:210mm; min-height:297mm; margin:0 auto; background:${CONTENT_BG}; box-shadow:0 2px 16px rgba(0,0,0,0.13); overflow:hidden; }
  table { border-collapse:collapse; }
  td { vertical-align:top; padding:0; }
</style></head>
<body><div class="page">
  <!-- Gold top accent bar -->
  <div style="background:${GOLD};height:5pt;width:100%;"></div>
  <table style="width:100%;min-height:297mm;">
    <tr>
      <!-- Dark left sidebar -->
      <td style="width:33%;background:${DARK};padding:18pt 14pt;">
        <div style="margin-bottom:14pt;padding-bottom:10pt;border-bottom:1pt solid rgba(255,255,255,0.15);">
          <div style="font-size:18pt;font-weight:bold;color:${WHITE};text-transform:uppercase;letter-spacing:1px;line-height:1.2;">${name}</div>
          ${roleTitle ? `<div style="font-size:9pt;color:${GOLD};text-transform:uppercase;letter-spacing:2px;margin-top:4pt;">${roleTitle}</div>` : ''}
        </div>
        ${contactItems.length > 0 ? sideSection('Contact', contactItems.map(c => `<div style="font-size:8pt;color:${LIGHT_TEXT};margin-bottom:4pt;word-break:break-all;">• ${c}</div>`).join('')) : ''}
        ${skillsArr.length > 0 ? sideSection('Skills', skillsArr.map(s => `<div style="font-size:8pt;color:${LIGHT_TEXT};margin-bottom:3pt;">• ${s}</div>`).join('')) : ''}
        ${d.education.length > 0 ? sideSection('Education', d.education.map(edu => `
          <div style="margin-bottom:8pt;">
            <div style="font-size:9pt;font-weight:bold;color:${WHITE};">${edu.degree||''}</div>
            <div style="font-size:8pt;color:rgba(255,255,255,0.65);">${edu.school||''}</div>
            <div style="font-size:7.5pt;color:${GOLD};">${edu.gradYear||''}</div>
          </div>`).join('')) : ''}
        ${langArr.length > 0 ? sideSection('Languages', langArr.map(l => `<div style="font-size:8pt;color:${LIGHT_TEXT};margin-bottom:3pt;">• ${l}</div>`).join('')) : ''}
        ${certArr.length > 0 ? sideSection('Certifications', certArr.map(c => `<div style="font-size:8pt;color:${LIGHT_TEXT};margin-bottom:3pt;">• ${c}</div>`).join('')) : ''}
      </td>
      <!-- Main content -->
      <td style="width:67%;padding:18pt 20pt;background:${CONTENT_BG};">
        ${d.summary ? mainSection('Profile', `<div style="font-size:9pt;color:${TEXT};line-height:1.5;text-align:justify;">${d.summary}</div>`) : ''}
        ${d.experience.length > 0 ? mainSection('Experience', d.experience.map(exp => `
          <div style="margin-bottom:10pt;">
            <table style="width:100%;"><tr>
              <td style="font-size:10pt;font-weight:bold;color:${DARK};text-transform:uppercase;">${exp.jobTitle||''}</td>
              <td style="text-align:right;font-size:8.5pt;color:${GOLD};white-space:nowrap;">${[exp.startDate, exp.endDate||'Present'].filter(Boolean).join(' – ')}</td>
            </tr></table>
            <div style="font-size:9pt;color:#666;font-style:italic;margin-bottom:3pt;">${exp.company||''}</div>
            ${exp.description ? exp.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
          </div>`).join('')) : ''}
        ${d.projects.length > 0 ? mainSection('Projects', d.projects.map(proj => `
          <div style="margin-bottom:10pt;">
            <div style="font-size:10pt;font-weight:bold;color:${DARK};text-transform:uppercase;">${proj.name||proj.title||''}</div>
            ${proj.tech ? `<div style="font-size:8.5pt;color:${GOLD};font-weight:bold;margin-bottom:2pt;">${proj.tech}</div>` : ''}
            ${proj.description ? proj.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
          </div>`).join('')) : ''}
      </td>
    </tr>
  </table>
</div></body></html>`;
}

// ── Hiero Retail Word HTML ───────────────────────────────────────────────────
function generateHieroRetailWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo;
    const NAVY = '#1e3a8a';
    const BLUE = '#3b82f6';
    const WHITE = '#FFFFFF';
    const TEXT = '#1f2937';
    const LIGHT = '#eff6ff';
    const name = (p.fullName || 'YOUR NAME').toUpperCase();
    const roleTitle = p.roleTitle || '';
    const contactItems = [p.phone, p.email, p.address, p.linkedin, p.github, p.website].filter(Boolean);
    const skillsArr = d.technicalSkills ? d.technicalSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const certArr = d.certifications ? d.certifications.split(',').map(s => s.trim()).filter(Boolean) : [];
    const langArr = d.languages ? d.languages.split(',').map(s => s.trim()).filter(Boolean) : [];

    function sideSection(title, content) {
        return `<div style="margin-bottom:14pt;">
            <div style="font-size:9.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:${BLUE};border-bottom:1.5pt solid ${BLUE};padding-bottom:2pt;margin-bottom:6pt;">${title}</div>
            ${content}
        </div>`;
    }
    function mainSection(title, content) {
        return `<div style="margin-bottom:14pt;">
            <div style="font-size:11pt;font-weight:bold;text-transform:uppercase;color:${NAVY};border-bottom:2pt solid ${BLUE};padding-bottom:2pt;margin-bottom:8pt;">${title}</div>
            ${content}
        </div>`;
    }
    function bullet(txt) {
        const clean = String(txt).replace(/^[•\-\*]\s*/, '').trim();
        return `<div style="display:flex;gap:6pt;margin-bottom:2pt;font-size:8.5pt;color:${TEXT};"><span style="color:${BLUE};">▸</span><span>${clean}</span></div>`;
    }

    return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Resume</title><style>
  @page { size: A4; margin: 0; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; background: #f0f0f0; }
  .page { width:210mm; min-height:297mm; margin:0 auto; background:${WHITE}; box-shadow:0 2px 16px rgba(0,0,0,0.13); overflow:hidden; }
  table { border-collapse:collapse; }
  td { vertical-align:top; padding:0; }
</style></head>
<body><div class="page">
  <!-- Blue top stripe header -->
  <div style="background:${NAVY};padding:16pt 20pt;">
    <div style="font-size:26pt;font-weight:bold;color:${WHITE};letter-spacing:1.5px;">${name}</div>
    ${roleTitle ? `<div style="font-size:10pt;color:${BLUE};font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin-top:3pt;">${roleTitle}</div>` : ''}
    <div style="font-size:8.5pt;color:rgba(255,255,255,0.75);margin-top:5pt;">${contactItems.join('  •  ')}</div>
  </div>
  <!-- White sidebar left + main right -->
  <table style="width:100%;">
    <tr>
      <td style="width:33%;padding:16pt 14pt;background:${LIGHT};border-right:2pt solid ${BLUE};">
        ${skillsArr.length > 0 ? sideSection('Skills', skillsArr.map(s => `<div style="font-size:8.5pt;color:${TEXT};margin-bottom:3pt;">• ${s}</div>`).join('')) : ''}
        ${d.education.length > 0 ? sideSection('Education', d.education.map(edu => `
          <div style="margin-bottom:8pt;">
            <div style="font-size:9.5pt;font-weight:bold;color:${NAVY};">${edu.degree||''}</div>
            <div style="font-size:8.5pt;color:#555;">${edu.school||''}</div>
            <div style="font-size:8pt;color:${BLUE};">${edu.gradYear||''}</div>
          </div>`).join('')) : ''}
        ${langArr.length > 0 ? sideSection('Languages', langArr.map(l => `<div style="font-size:8.5pt;color:${TEXT};margin-bottom:3pt;">• ${l}</div>`).join('')) : ''}
        ${certArr.length > 0 ? sideSection('Certifications', certArr.map(c => `<div style="font-size:8.5pt;color:${TEXT};margin-bottom:3pt;">• ${c}</div>`).join('')) : ''}
      </td>
      <td style="width:67%;padding:16pt 20pt;background:${WHITE};">
        ${d.summary ? mainSection('Profile', `<div style="font-size:9pt;color:${TEXT};line-height:1.5;text-align:justify;">${d.summary}</div>`) : ''}
        ${d.experience.length > 0 ? mainSection('Experience', d.experience.map(exp => `
          <div style="margin-bottom:10pt;">
            <table style="width:100%;"><tr>
              <td style="font-size:10pt;font-weight:bold;color:${NAVY};text-transform:uppercase;">${exp.jobTitle||''}</td>
              <td style="text-align:right;font-size:8.5pt;color:${BLUE};white-space:nowrap;">${[exp.startDate, exp.endDate||'Present'].filter(Boolean).join(' – ')}</td>
            </tr></table>
            <div style="font-size:9pt;color:#555;font-style:italic;margin-bottom:3pt;">${exp.company||''}</div>
            ${exp.description ? exp.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
          </div>`).join('')) : ''}
        ${d.projects.length > 0 ? mainSection('Projects', d.projects.map(proj => `
          <div style="margin-bottom:10pt;">
            <div style="font-size:10pt;font-weight:bold;color:${NAVY};text-transform:uppercase;">${proj.name||proj.title||''}</div>
            ${proj.tech ? `<div style="font-size:8.5pt;color:${BLUE};font-weight:bold;margin-bottom:2pt;">${proj.tech}</div>` : ''}
            ${proj.description ? proj.description.split('\n').filter(Boolean).map(l => bullet(l)).join('') : ''}
          </div>`).join('')) : ''}
      </td>
    </tr>
  </table>
</div></body></html>`;
}

function makeOverflowAdaptive(html) {
    if (!html || typeof html !== 'string') return html;

    let out = html;

    // 1) Allow page containers to expand beyond one page.
    out = out.replace(/overflow\s*:\s*hidden\s*;/gi, 'overflow: visible;');

    // 2) Avoid forcing single-screen table heights that can clip long content.
    out = out.replace(/min-height\s*:\s*297mm\s*;?/gi, 'height:auto; min-height:297mm;');

    // 3) Inject shared overflow/pagination safety rules once.
    const adaptiveCss = `
<style id="hiero-overflow-adaptive">
  @media print {
    .page { height: auto !important; overflow: visible !important; }
    table, tr, td, div, section, article { break-inside: auto !important; page-break-inside: auto !important; }
  }
  .page { height: auto !important; overflow: visible !important; }
  table { page-break-inside: auto !important; }
  tr, td, div, section, article { break-inside: auto !important; page-break-inside: auto !important; }
  * { overflow-wrap: anywhere; word-break: break-word; }
</style>`;

    if (/<\/head>/i.test(out)) {
        out = out.replace(/<\/head>/i, `${adaptiveCss}</head>`);
    } else if (/<body[^>]*>/i.test(out)) {
        out = out.replace(/<body([^>]*)>/i, `<body$1>${adaptiveCss}`);
    } else {
        out = adaptiveCss + out;
    }

    return out;
}

// ── Main dispatch function ───────────────────────────────────────────────────
function generateWordHTML(data, templateId) {
    let id = (templateId || 'classic').toLowerCase().trim();
    id = WORD_TEMPLATE_MAP[id] || id;
    let html = '';

    if (id === 'template4') {
        html = generateHieroAcademicWordHTML(data);
        return makeOverflowAdaptive(html);
    }
    if (id === 'hiero-urban') {
        html = generateHieroUrbanWordHTML(data, TEMPLATE_CONFIGS[id]);
        return makeOverflowAdaptive(html);
    }
    if (id === 'hiero-vision') {
        html = generateHieroVisionWordHTML(data, TEMPLATE_CONFIGS[id]);
        return makeOverflowAdaptive(html);
    }
    if (id === 'hiero-studio') {
        html = generateHieroStudioWordHTML(data, TEMPLATE_CONFIGS[id]);
        return makeOverflowAdaptive(html);
    }
    if (id === 'hiero-signature') {
        html = generateHieroSignatureWordHTML(data, TEMPLATE_CONFIGS[id]);
        return makeOverflowAdaptive(html);
    }
    if (id === 'hiero-tech') {
        html = generateHieroTechWordHTML(data, TEMPLATE_CONFIGS[id]);
        return makeOverflowAdaptive(html);
    }
    if (id === 'hiero-cool') {
        html = generateHieroCoolWordHTML(data, TEMPLATE_CONFIGS[id]);
        return makeOverflowAdaptive(html);
    }
    if (id === 'hiero-nova') {
        html = generateHieroNovaWordHTML(data, TEMPLATE_CONFIGS['hiero-nova']);
        return makeOverflowAdaptive(html);
    }
    if (id === 'rishi') {
        html = generateRishiWordHTML(data);
        return makeOverflowAdaptive(html);
    }
    if (id === 'hiero-monethon') {
        html = generateHieroMonethonWordHTML(data);
        return makeOverflowAdaptive(html);
    }
    if (id === 'hiero-legion') {
        html = generateHieroLegionWordHTML(data);
        return makeOverflowAdaptive(html);
    }
    if (id === 'hiero-essence') {
        html = generateHieroEssenceWordHTML(data);
        return makeOverflowAdaptive(html);
    }
    if (id === 'hiero-timeline') {
        html = generateHieroTimelineWordHTML(data);
        return makeOverflowAdaptive(html);
    }
    if (id === 'hiero-premium') {
        html = generateHieroPremiumWordHTML(data);
        return makeOverflowAdaptive(html);
    }
    if (id === 'hiero-prestige') {
        html = generateHieroPrestigeWordHTML(data);
        return makeOverflowAdaptive(html);
    }
    if (id === 'hiero-royal') {
        html = generateHieroRoyalWordHTML(data);
        return makeOverflowAdaptive(html);
    }
    if (id === 'hiero-vertex') {
        html = generateHieroVertexWordHTML(data);
        return makeOverflowAdaptive(html);
    }
    if (id === 'priya-analytics') {
        html = generatePriyaAnalyticsWordHTML(data);
        return makeOverflowAdaptive(html);
    }
    if (id === 'hiero-executive') {
        html = generateHieroExecutiveWordHTML(data);
        return makeOverflowAdaptive(html);
    }
    if (id === 'hiero-velocity') {
        html = generateHieroVelocityWordHTML(data);
        return makeOverflowAdaptive(html);
    }
    if (id === 'hiero-elite') {
        html = generateHieroEliteWordHTML(data);
        return makeOverflowAdaptive(html);
    }
    if (id === 'hiero-retail') {
        html = generateHieroRetailWordHTML(data);
        return makeOverflowAdaptive(html);
    }

    const config = TEMPLATE_CONFIGS[id] || TEMPLATE_CONFIGS['classic'];
    
    if (config.type === 'sidebar') {
        html = generateSidebarWordHTML(data, config);
        return makeOverflowAdaptive(html);
    } else {
        html = generateTopDownWordHTML(data, config);
        return makeOverflowAdaptive(html);
    }
}

function generateRishiWordHTML(data) {
    const d = normalizeWordData(data);
    const p = d.personalInfo || {};

    const BLUE = '#c1121f';
    const DARK = '#1a1a1a';
    const MUTED = '#2f3b45';
    const BULLET = '#b77a3f';
    const PAPER = '#ffffff';

    const name = p.fullName || 'Jason Bourne';
    const roleTitle = p.roleTitle || 'Professional';
    const rightInfo = [
        p.phone ? ['Contact', p.phone] : null,
        p.email ? ['Email', p.email] : null,
        p.linkedin ? ['LinkedIn', p.linkedin] : null,
        p.github ? ['GitHub', p.github] : null,
        p.website ? ['Portfolio', p.website] : null,
        p.address ? ['Location', p.address] : null
    ].filter(Boolean);

    const techSkills = d.technicalSkills ? d.technicalSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const softSkills = d.softSkills ? d.softSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const certItems = d.certifications ? d.certifications.split(',').map(s => s.trim()).filter(Boolean) : [];
    const achItems = d.achievements ? d.achievements.split(/[;\n]/).map(s => s.trim()).filter(Boolean) : [];

    function section(title) {
        return `
        <div style="margin-top:9pt;">
            <div style="font-family:Garamond, 'Times New Roman', serif;font-size:10.8pt;font-weight:700;color:${BLUE};text-transform:uppercase;letter-spacing:0.2px;">${title}</div>
            <div style="height:0;border-bottom:1.2px solid ${BLUE};margin-top:2pt;"></div>
        </div>`;
    }

    function bullet(line) {
        const txt = String(line || '').replace(/^[•\-\*]\s*/, '').trim();
        if (!txt) return '';
        return `<div style="display:flex;gap:6pt;margin-top:2pt;"><span style="color:${BULLET};font-size:10pt;line-height:1;">•</span><span style="font-size:10pt;color:${DARK};line-height:1.36;">${txt}</span></div>`;
    }

    const expHTML = d.experience.length ? d.experience.map(exp => `
        <div style="margin-top:6pt;">
            <table style="width:100%;border-collapse:collapse;">
                <tr>
                    <td style="font-size:12pt;font-weight:700;color:${DARK};">${exp.company || exp.jobTitle || ''}</td>
                    <td style="text-align:right;font-size:10pt;font-style:italic;color:${MUTED};white-space:nowrap;">${[exp.startDate, exp.endDate || 'Present'].filter(Boolean).join(' – ')}</td>
                </tr>
                <tr>
                    <td style="font-size:10pt;font-style:italic;font-weight:700;color:${DARK};">${exp.jobTitle || ''}</td>
                    <td style="text-align:right;font-size:10pt;font-style:italic;color:${MUTED};white-space:nowrap;">${exp.location || ''}</td>
                </tr>
            </table>
            ${(exp.description || '').split('\n').filter(Boolean).map(bullet).join('')}
        </div>`).join('') : '';

    const projHTML = d.projects.length ? d.projects.map(proj => `
        <div style="margin-top:6pt;">
            <table style="width:100%;border-collapse:collapse;">
                <tr>
                    <td style="font-size:12pt;font-weight:700;color:${DARK};">${proj.name || proj.title || 'Project'}</td>
                    <td style="text-align:right;font-size:10pt;font-style:italic;color:${MUTED};white-space:nowrap;">${proj.date || proj.dates || ''}</td>
                </tr>
            </table>
            ${(proj.description || '').split('\n').filter(Boolean).map(bullet).join('')}
        </div>`).join('') : '';

    const eduHTML = d.education.length ? d.education.map(edu => `
        <div style="margin-top:6pt;">
            <table style="width:100%;border-collapse:collapse;">
                <tr>
                    <td style="font-size:12pt;font-weight:700;color:${DARK};">${edu.degree || ''}</td>
                    <td style="text-align:right;font-size:10pt;color:${MUTED};white-space:nowrap;">${edu.gradYear || edu.year || ''}</td>
                </tr>
            </table>
            <div style="font-size:10pt;color:${DARK};margin-top:2pt;">${edu.school || ''}${edu.gpa ? `, Cumulative GPA: <b>${edu.gpa}</b>` : ''}</div>
        </div>`).join('') : '';

    return `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${name} - Resume</title>
<style>
  @page { size: A4; margin: 10mm 10mm; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: Garamond, 'Times New Roman', serif; background:#f0f0f0; color:${DARK}; }
  .page { width:210mm; min-height:297mm; margin:0 auto; background:${PAPER}; padding:8mm 10mm; box-shadow:0 2px 12px rgba(0,0,0,0.12); }
  a { color:${BLUE}; text-decoration:underline; }
</style>
</head>
<body>
<div class="page">
    <table style="width:100%;border-collapse:collapse;">
        <tr>
            <td style="width:68%;vertical-align:top;">
                <div style="font-family:Garamond, 'Times New Roman', serif;font-size:28pt;line-height:1.05;color:${BLUE};font-weight:700;letter-spacing:0.1px;">${name}</div>
                <div style="font-family:Garamond, 'Times New Roman', serif;font-size:17pt;line-height:1.1;color:${DARK};font-weight:700;margin-top:2pt;">${roleTitle}</div>
            </td>
            <td style="width:32%;vertical-align:top;padding-top:2pt;">
                ${rightInfo.map(item => `<div style="font-family:Garamond, 'Times New Roman', serif;font-size:10pt;line-height:1.28;margin-bottom:2pt;color:${DARK};"><b>${item[0]}:</b> <span style="color:${item[0] === 'LinkedIn' || item[0] === 'GitHub' || item[0] === 'Portfolio' ? BLUE : DARK};text-decoration:${item[0] === 'LinkedIn' || item[0] === 'GitHub' || item[0] === 'Portfolio' ? 'underline' : 'none'};">${item[1]}</span></div>`).join('')}
            </td>
        </tr>
    </table>

    ${section('Summary')}
    <div style="font-family:Garamond, 'Times New Roman', serif;font-size:10pt;line-height:1.35;color:${MUTED};margin-top:4pt;">${d.summary || ''}</div>

    ${(techSkills.length || softSkills.length) ? `
        ${section('Skillset')}
        ${techSkills.length ? `<div style="font-family:Garamond, 'Times New Roman', serif;margin-top:4pt;font-size:10pt;color:${DARK};"><b>Technical Skills:</b> ${techSkills.join(', ')}</div>` : ''}
        ${softSkills.length ? `<div style="font-family:Garamond, 'Times New Roman', serif;margin-top:3pt;font-size:10pt;color:${DARK};"><b>Business Skills:</b> ${softSkills.join(', ')}</div>` : ''}
    ` : ''}

    ${expHTML ? `${section('Work Experience')}${expHTML}` : ''}
    ${projHTML ? `${section('Project Experience')}${projHTML}` : ''}

    ${certItems.length ? `${section('Certification')}<div style="font-family:Garamond, 'Times New Roman', serif;margin-top:5pt;font-size:10pt;font-style:italic;color:${DARK};">${certItems[0]}</div>` : ''}

    ${eduHTML ? `${section('Education')}${eduHTML}` : ''}

    ${achItems.length ? `${section('Achievements')}<div style="margin-top:3pt;">${achItems.map(bullet).join('')}</div>` : ''}
</div>
</body>
</html>`;
}

module.exports = {
    generateWordHTML
};
