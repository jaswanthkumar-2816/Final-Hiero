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
            min-height: 297mm;
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
            min-height: 297mm;
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
            <table style="width: 100%; min-height: 297mm; background-color: ${c.background || '#ffffff'};">
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
    'hiero-prestige': { type: 'sidebar', sidebarPosition: 'left', font: 'Arial', colors: { sidebarBg: '#2e2e2e', sidebarText: '#ffffff', sidebarAccent: '#ffffff', primary: '#2e2e2e', secondary: '#333333', text: '#333333', background: '#f4f4f4' } },
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
    const rawSkillsList = data.skills && data.skills.length > 0 ? data.skills : (typeof data.technicalSkills === 'string' ? data.technicalSkills.split(',').map(s => s.trim()).filter(Boolean) : (data.technicalSkills || []));
    const skills = rawSkillsList.slice(0, 6);

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
                            <img src="${pInfo.profilePhoto}" style="width: 100pt; height: 100pt; object-fit: cover;" />
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

function generateWordHTML(data, templateId) {
    let id = (templateId || 'classic').toLowerCase().trim();
    id = WORD_TEMPLATE_MAP[id] || id;

    if (id === 'template4') {
        return generateHieroAcademicWordHTML(data);
    }
    if (id === 'hiero-urban') {
        return generateHieroUrbanWordHTML(data, TEMPLATE_CONFIGS[id]);
    }
    if (id === 'hiero-vision') {
        return generateHieroVisionWordHTML(data, TEMPLATE_CONFIGS[id]);
    }
    if (id === 'hiero-studio') {
        return generateHieroStudioWordHTML(data, TEMPLATE_CONFIGS[id]);
    }
    if (id === 'hiero-signature') {
        return generateHieroSignatureWordHTML(data, TEMPLATE_CONFIGS[id]);
    }
    if (id === 'hiero-tech') {
        return generateHieroTechWordHTML(data, TEMPLATE_CONFIGS[id]);
    }
    if (id === 'hiero-cool') {
        return generateHieroCoolWordHTML(data, TEMPLATE_CONFIGS[id]);
    }
    if (id === 'hiero-nova') {
        return generateHieroNovaWordHTML(data, TEMPLATE_CONFIGS['hiero-nova']);
    }
    if (id === 'rishi') {
        return generateRishiWordHTML(data);
    }

    const config = TEMPLATE_CONFIGS[id] || TEMPLATE_CONFIGS['classic'];
    
    if (config.type === 'sidebar') {
        return generateSidebarWordHTML(data, config);
    } else {
        return generateTopDownWordHTML(data, config);
    }
}

function generateRishiWordHTML(data) {
  const d = normalizeWordData(data);
  const p = d.personalInfo;

  const PRIMARY   = '#111827'; // Deep Navy/Black
  const SECONDARY = '#4b5563'; // Slate Grey
  const ACCENT    = '#2ae023'; // Hiero Green
  const BG_LIGHT  = '#f3f4f6'; // Light grey for tag pills
  const WHITE     = '#FFFFFF';

  const name        = (p.fullName || 'YOUR NAME').toUpperCase();
  const roleTitle   = p.roleTitle || '';
  const contactLine = [p.address, p.phone, p.email].filter(Boolean).map(s => s.toUpperCase()).join('  •  ');
  const linksLine   = [p.linkedin, p.github, p.website].filter(Boolean).join('  |  ');

  const skillsArr = d.technicalSkills
      ? d.technicalSkills.split(',').map(s => s.trim()).filter(Boolean)
      : [];

  // ── Section bar with Hiero Accent Line underneath ──
  function sectionBar(title) {
      return `
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; margin-top:10pt; margin-bottom:5pt;">
        <tr>
          <td style="font-family:Arial,sans-serif; font-size:11.5pt; font-weight:bold; color:${PRIMARY}; text-transform:uppercase; padding-bottom:2pt;">
            ${title.toUpperCase()}
          </td>
        </tr>
        <tr>
          <td bgcolor="${ACCENT}" style="background-color:${ACCENT}; height:1.5pt; line-height:1px; font-size:1px;">&nbsp;</td>
        </tr>
      </table>`;
  }

  // ── Entry header row: title left + date right ──
  function entryHeader(titleText, dateText) {
      return `
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; margin-top:4pt;">
        <tr>
          <td style="font-family:Arial,sans-serif; font-size:10pt; font-weight:bold; color:${PRIMARY}; vertical-align:top; text-transform:uppercase;">${titleText}</td>
          <td style="font-family:Arial,sans-serif; font-size:8.5pt; color:${SECONDARY}; text-align:right; white-space:nowrap; vertical-align:top;">${dateText || ''}</td>
        </tr>
      </table>`;
  }

  // ── Bullet point styled with Hiero Green bullet ──
  function bullet(text) {
      if (!text || !text.trim()) return '';
      const clean = String(text).replace(/^[•\-\*]\s*/, '').trim();
      if (!clean) return '';
      return `
      <table cellpadding="0" cellspacing="0" border="0" style="margin-left:10pt; margin-bottom:2pt; border-collapse:collapse;">
        <tr>
          <td style="width:10pt; font-family:Arial,sans-serif; font-size:10pt; color:${ACCENT}; vertical-align:top; line-height:1.2;">&#x2022;</td>
          <td style="font-family:Arial,sans-serif; font-size:8.5pt; color:${SECONDARY}; vertical-align:top; line-height:1.25;">${clean}</td>
        </tr>
      </table>`;
  }

  // ── Summary ──
  const summaryHTML = d.summary ? `
      ${sectionBar('Professional Summary')}
      <div style="font-family:Arial,sans-serif; font-size:8.5pt; color:${SECONDARY}; text-align:justify; margin-bottom:4pt; margin-top:2pt; line-height:1.25;">${d.summary}</div>
  ` : '';

  // ── Experience ──
  const expHTML = d.experience.length > 0 ? `
      ${sectionBar('Work Experience')}
      ${d.experience.map(exp => `
      <div style="margin-bottom:7pt;">
          ${entryHeader(exp.jobTitle || exp.role || '', [exp.startDate, exp.endDate || 'Present'].filter(Boolean).join(' – '))}
          ${exp.company ? `<div style="font-family:Arial,sans-serif; font-size:9pt; color:${SECONDARY}; margin-top:1pt; margin-bottom:2pt; font-style:italic;">${exp.company}</div>` : ''}
          ${exp.description ? exp.description.split('\n').filter(Boolean).map(b => bullet(b)).join('') : ''}
      </div>`).join('')}
  ` : '';

  // ── Projects ──
  const projHTML = d.projects.length > 0 ? `
      ${sectionBar('Projects')}
      ${d.projects.map(proj => `
      <div style="margin-bottom:7pt;">
          ${entryHeader(proj.name || proj.title || '', proj.dates || proj.date || '')}
          ${proj.tech || proj.technologies ? `<div style="font-family:Arial,sans-serif; font-size:8.5pt; color:${SECONDARY}; font-style:italic; margin-top:1pt; margin-bottom:1pt;">Tech: ${proj.tech || proj.technologies}</div>` : ''}
          ${proj.link ? `<div style="font-family:Arial,sans-serif; font-size:8.5pt; color:${SECONDARY}; margin-bottom:1pt;">${proj.link}</div>` : ''}
          ${proj.description ? proj.description.split('\n').filter(Boolean).map(b => bullet(b)).join('') : ''}
      </div>`).join('')}
  ` : '';

  // ── Skills: inline pills with BG_LIGHT ──
  const skillsHTML = skillsArr.length > 0 ? `
      ${sectionBar('Skills & Technologies')}
      <div style="margin-top:4pt; line-height:1.8;">
        ${skillsArr.map(s => `
          <span style="display:inline-block; font-family:Arial,sans-serif; font-size:7.5pt; font-weight:bold; background-color:${BG_LIGHT}; color:${PRIMARY}; padding:3px 8px; margin-right:4pt; margin-bottom:4pt; border-radius:4px;">
            ${s}
          </span>
        `).join('')}
      </div>
  ` : '';

  // ── Education ──
  const eduHTML = d.education.length > 0 ? `
      ${sectionBar('Education')}
      ${d.education.map(edu => `
      <div style="margin-bottom:6pt;">
          ${entryHeader(edu.degree || '', edu.gradYear || edu.year || '')}
          ${edu.school ? `<div style="font-family:Arial,sans-serif; font-size:9pt; color:${SECONDARY}; margin-top:1pt;">${edu.school}</div>` : ''}
          ${edu.gpa ? `<div style="font-family:Arial,sans-serif; font-size:8.5pt; color:${SECONDARY};">GPA: ${edu.gpa}</div>` : ''}
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
    color: ${PRIMARY};
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
  <table cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; margin-bottom:12pt;">
    <tr>
      <!-- Left green stripe accent -->
      <td bgcolor="${ACCENT}" style="background-color:${ACCENT}; width:3.5pt; font-size:1px; line-height:1px;">&nbsp;</td>
      <!-- Header text content -->
      <td style="padding-left:10pt; vertical-align:middle;">
        <div style="font-family:Arial,Helvetica,sans-serif; font-size:28pt; font-weight:bold; color:${PRIMARY}; letter-spacing:1.5px;">${name}</div>
        ${roleTitle   ? `<div style="font-family:Arial,sans-serif; font-size:11pt; font-weight:bold; color:${SECONDARY}; text-transform:uppercase; margin-top:2pt; margin-bottom:4pt;">${roleTitle}</div>` : ''}
        ${contactLine ? `<div style="font-family:Arial,sans-serif; font-size:9.5pt; color:${SECONDARY};">${contactLine}</div>` : ''}
        ${linksLine   ? `<div style="font-family:Arial,sans-serif; font-size:9.5pt; color:${ACCENT}; font-weight:bold; margin-top:2pt;">${linksLine}</div>` : ''}
      </td>
    </tr>
  </table>

  ${summaryHTML}
  ${expHTML}
  ${skillsHTML}
  ${projHTML}
  ${eduHTML}
  ${certHTML}
  ${achHTML}

</div>
</body>
</html>`;
}

module.exports = {
    generateWordHTML
};
