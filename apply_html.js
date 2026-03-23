const fs = require('fs');
let file = 'routes/resume.js';
let content = fs.readFileSync(file, 'utf8');

const htmlBlock = `    if (template === 'hiero-premium' || template === 'premium') {
        const BG_COLOR = '#F4F5F7';
        const CARD_BG = '#FFFFFF';
        const PEACH_ACCENT = '#F2B66D';
        const TEXT_PRI = '#333333';
        const TEXT_SEC = '#555555';
        const TEXT_HEADER = '#000000';

        const activitiesArr = data.extraCurricular || data.activities || [];
        const skillsArr = Array.isArray(data.skills) ? data.skills : (data.technicalSkills || '').split(/[,|]/).filter(Boolean);
        const nameText = (personalInfo.fullName || 'STEVEN TERRY').toUpperCase();

        return \\\`
        <html xmlns:v='urn:schemas-microsoft-com:vml' xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Resume</title>
        <style>
            @page {
                size: 8.27in 11.69in;
                margin: 0in;
            }
            body { 
                font-family: 'Helvetica', 'Open Sans', Arial, sans-serif; 
                margin: 0; 
                padding: 0; 
                background-color: \${BG_COLOR};
            }
            table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: none; }
            td { padding: 0; vertical-align: top; border: none; }
            
            .card-outer {
                background-color: \${CARD_BG};
                margin-bottom: 12pt;
                border: 1pt solid #E2E6EA;
                border-radius: 6pt;
                overflow: hidden;
                box-shadow: 2px 2px 5px rgba(0,0,0,0.05);
            }
            .card-inner-table {
                padding: 12pt;
            }
            .card-header {
                background-color: \${PEACH_ACCENT};
                color: \${TEXT_HEADER};
                font-size: 10pt;
                font-weight: bold;
                padding: 5pt 10pt;
                margin-bottom: 10pt;
            }
        </style>
        </head>
        <body>
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="table-layout: fixed;">
                <tr><td height="30" style="height: 30px; line-height: 30px;"></td></tr>
                <tr>
                    <td width="30" style="width: 30px;"></td>
                    <td>
                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                            <tr>
                                <!-- LEFT COLUMN: 35% -->
                                <td width="35%" valign="top">
                                    <div style="text-align: center; margin-bottom: 20pt;">
                                        \${personalInfo.profilePhoto ? 
                                            \\\`<!--[if gte vml 1]><v:oval style="position:relative;width:110px;height:110px;" strokecolor="\${BG_COLOR}" strokeweight="1pt"><v:fill type="frame" src="\${personalInfo.profilePhoto}" /></v:oval><![endif]--><![if !vml]><img src="\${personalInfo.profilePhoto}" width="110" height="110" style="border-radius: 55px;"><![endif]>\\\` : 
                                            \\\`<div style="width: 110px; height: 110px; border-radius: 55px; background-color: #d0d0d0; margin: 0 auto;"></div>\\\`
                                        }
                                    </div>
                                    
                                    <table class="card-outer" width="100%"><tr><td class="card-inner-table">
                                        <div style="font-size:10pt; color:\${TEXT_SEC}; line-height:1.6;">
                                            \${[data.personalInfo.gender, data.personalInfo.dob, data.personalInfo.phone, data.personalInfo.email, data.personalInfo.linkedin, data.personalInfo.github, data.personalInfo.website, data.personalInfo.address].filter(Boolean).map(i => \\\`<div><span style="color:\${PEACH_ACCENT}">•</span> \${i}</div>\\\`).join('')}
                                        </div>
                                    </td></tr></table>

                                    \${data.summary ? \\\`
                                    <table class="card-outer" width="100%"><tr><td class="card-inner-table">
                                        <div class="card-header">OBJECTIVE</div>
                                        <div style="font-size:9.5pt; color:\${TEXT_SEC}; line-height:1.4;">\${data.summary}</div>
                                    </td></tr></table>
                                    \\\` : ''}

                                    \${skillsArr.length > 0 ? \\\`
                                    <table class="card-outer" width="100%"><tr><td class="card-inner-table">
                                        <div class="card-header">SKILLS</div>
                                        <div style="font-size:9.5pt; color:\${TEXT_SEC}; line-height:1.6;">
                                            \${skillsArr.map(s => \\\`<div>- \${s.toString().trim()}</div>\\\`).join('')}
                                        </div>
                                    </td></tr></table>
                                    \\\` : ''}

                                    \${data.personalInfo.languagesKnown || data.languages ? \\\`
                                    <table class="card-outer" width="100%"><tr><td class="card-inner-table">
                                        <div class="card-header">LANGUAGES</div>
                                        <div style="font-size:9.5pt; color:\${TEXT_SEC}; line-height:1.4;">\${data.personalInfo.languagesKnown || data.languages}</div>
                                    </td></tr></table>
                                    \\\` : ''}

                                </td>
                                <td width="5%" style="width:20px;"></td>

                                <!-- RIGHT COLUMN: 60% -->
                                <td width="60%" valign="top">
                                    <div style="padding-top: 25pt; padding-bottom: 20pt;">
                                        <div style="font-size: 26pt; font-family: 'Helvetica', Arial, sans-serif; font-weight: bold; color: \${TEXT_PRI};">\${nameText}</div>
                                        <div style="height: 1px; background-color: #CCCCCC; line-height: 1px; margin: 10pt 0;"></div>
                                        <div style="font-size: 12pt; color: \${TEXT_SEC};">\${data.personalInfo.jobTitle || data.experience?.[0]?.jobTitle || 'Sales Staff'}</div>
                                    </div>
                                    
                                    \${(data.education && data.education.length > 0) ? \\\`
                                    <table class="card-outer" width="100%"><tr><td class="card-inner-table">
                                        <div class="card-header">EDUCATION</div>
                                        \${data.education.map(edu => \\\`
                                            <div style="margin-bottom:12pt;">
                                                <div style="font-size:11pt; font-weight:bold; color:\${TEXT_PRI};">\${edu.school||''}</div>
                                                <div style="font-size:10pt; color:\${TEXT_SEC}; margin-top:2pt;">\${edu.degree||''}</div>
                                                <div style="font-size:9.5pt; color:\${TEXT_SEC}; margin-top:2pt;">\${edu.startDate||''} - \${edu.endDate||''}</div>
                                                \${edu.gpa ? \\\`<div style="font-size:9.5pt; color:\${TEXT_SEC};">GPA: \${edu.gpa}</div>\\\` : ''}
                                            </div>
                                        \\\`).join('')}
                                    </td></tr></table>
                                    \\\` : ''}

                                    \${(data.experience && data.experience.length > 0) ? \\\`
                                    <table class="card-outer" width="100%"><tr><td class="card-inner-table">
                                        <div class="card-header">WORK EXPERIENCE</div>
                                        \${data.experience.map(exp => \\\`
                                            <div style="margin-bottom:15pt;">
                                                <div style="font-size:10.5pt; font-weight:bold; color:\${TEXT_PRI};">\${exp.company ? exp.company+', ' : ''}\${exp.jobTitle||''}</div>
                                                <div style="font-size:9.5pt; color:\${TEXT_SEC}; margin-top:2pt; margin-bottom:5pt;">\${exp.startDate||''} - \${exp.endDate||'Present'}</div>
                                                \${exp.description ? \\\`
                                                    <div style="font-size:9.5pt; color:\${TEXT_SEC}; line-height:1.4;">
                                                        \${!exp.description.includes('Main responsibilities:') ? 'Main responsibilities:<br>' : ''}
                                                        \${exp.description.split('\\n').filter(Boolean).map(l => \\\`<div>- \${l.replace(/^[-•]\\s*/,'')}</div>\\\`).join('')}
                                                    </div>
                                                \\\` : ''}
                                            </div>
                                        \\\`).join('')}
                                    </td></tr></table>
                                    \\\` : ''}

                                    \${(data.projects && data.projects.length > 0) ? \\\`
                                    <table class="card-outer" width="100%"><tr><td class="card-inner-table">
                                        <div class="card-header">PROJECTS</div>
                                        \${data.projects.map(proj => \\\`
                                            <div style="margin-bottom:15pt;">
                                                <div style="font-size:10.5pt; font-weight:bold; color:\${TEXT_PRI};">\${proj.title||''}</div>
                                                \${proj.tech ? \\\`<div style="font-size:9.5pt; color:\${PEACH_ACCENT}; margin-top:2pt;">\${proj.tech}</div>\\\` : ''}
                                                \${proj.description ? \\\`
                                                    <div style="font-size:9.5pt; color:\${TEXT_SEC}; line-height:1.4; margin-top:5pt;">
                                                        \${proj.description.split('\\n').filter(Boolean).map(l => \\\`<div>- \${l.replace(/^[-•]\\s*/,'')}</div>\\\`).join('')}
                                                    </div>
                                                \\\` : ''}
                                            </div>
                                        \\\`).join('')}
                                    </td></tr></table>
                                    \\\` : ''}

                                    \${(data.certifications && data.certifications.length > 0) ? \\\`
                                    <table class="card-outer" width="100%"><tr><td class="card-inner-table">
                                        <div class="card-header">CERTIFICATIONS</div>
                                        \${data.certifications.map(cert => {
                                            const name = typeof cert === 'string' ? cert : (cert.name || cert.title || '');
                                            return \\\`
                                            <div style="margin-bottom:8pt;">
                                                <div style="font-size:10.5pt; font-weight:bold; color:\${TEXT_PRI};">• \${name}</div>
                                            </div>
                                            \\\`;
                                        }).join('')}
                                    </td></tr></table>
                                    \\\` : ''}
                                    
                                    \${(activitiesArr.length > 0) ? \\\`
                                    <table class="card-outer" width="100%"><tr><td class="card-inner-table">
                                        <div class="card-header">ACTIVITIES</div>
                                        \${activitiesArr.map(act => {
                                            const t = typeof act === 'string' ? act : (act.title || act.name || '');
                                            const r = typeof act === 'string' ? '' : (act.role || act.description || '');
                                            return \\\`
                                            <div style="margin-bottom:10pt;">
                                                <div style="font-size:10.5pt; font-weight:bold; color:\${TEXT_PRI};">\${t}</div>
                                                \${r ? \\\`<div style="font-size:9.5pt; color:\${TEXT_SEC}; margin-top:2pt;">\${r}</div>\\\` : ''}
                                            </div>
                                            \\\`;
                                        }).join('')}
                                    </td></tr></table>
                                    \\\` : ''}

                                </td>
                            </tr>
                        </table>
                    </td>
                    <td width="30" style="width: 30px;"></td>
                </tr>
            </table>
        </body></html>\\\`;
    }`;

// Replace the existing hiero-premium check or add it
if (content.includes("if (template === 'hiero-premium' || template === 'premium')")) {
    const regex = /if \(template === 'hiero-premium' \|\| template === 'premium'\).*?(?=\/\/ DEFAULT FALLBACK)/s;
    content = content.replace(regex, htmlBlock + "\n\n    ");
} else {
    // Add it just before the fallback
    content = content.replace("// DEFAULT FALLBACK", htmlBlock + "\n\n    // DEFAULT FALLBACK");
}

fs.writeFileSync(file, content, 'utf8');
console.log('HTML logic written!');
