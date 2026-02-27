const fs = require('fs');

// --- 1. Fix unifiedTemplates.js ---
let utFile = 'routes/unifiedTemplates.js';
let utContent = fs.readFileSync(utFile, 'utf8');

utContent = utContent.replace(
    /data\.personalInfo\.gender,\s*data\.personalInfo\.dob,\s*data\.personalInfo\.email,\s*data\.personalInfo\.phone,\s*data\.personalInfo\.website,\s*data\.personalInfo\.address/,
    "data.personalInfo.phone,\n            data.personalInfo.email,\n            data.personalInfo.linkedin,\n            data.personalInfo.github,\n            data.personalInfo.website,\n            data.personalInfo.address"
);

// Add Languages before Interests (Line ~4962ish)
const langBlock = `
    // 5. Languages
    const languages = data.personalInfo.languagesKnown || data.languages || '';
    if (languages) {
        leftY += drawCard(LEFT_X, leftY, LEFT_W, (cx, cy, cw, dry) => {
            doc.fontSize(9.5).font('Helvetica');
            const lines = (typeof languages === 'string' ? languages.split(',') : Array.isArray(languages) ? languages : []).map(s=>s.trim?s.trim():'').filter(Boolean).join(', ');
            if (!lines) return 0;
            const h = doc.heightOfString(lines, { width: cw });
            if (!dry) doc.fillColor(TEXT_SEC).text(lines, cx, cy, { width: cw });
            return h;
        }, true, 'Languages');
    }
`;
if (!utContent.includes('// 5. Languages')) {
    utContent = utContent.replace("// 4. Interests (Mapped from Hobbies)", langBlock + "\n    // 4. Interests (Mapped from Hobbies)");
}

// Add Projects and Certs before Activities
const projBlock = `
    // 3. Projects
    const projects = data.projects || [];
    if (projects.length > 0) {
        rightY += drawCard(RIGHT_X, rightY, RIGHT_W, (cx, cy, cw, dry) => {
            let cyy = cy;
            projects.forEach(proj => {
                if (!dry) {
                    doc.fontSize(10.5).font('Helvetica-Bold').fillColor(TEXT_PRI)
                        .text(proj.title || '', cx, cyy);
                    if (proj.tech) {
                        doc.fontSize(9.5).font('Helvetica').fillColor(PEACH_ACCENT)
                            .text(proj.tech, cx, cyy + 14);
                    }
                }
                cyy += (proj.tech ? 28 : 14);
                
                if (proj.description) {
                    const descLines = proj.description.split('\\n').filter(Boolean);
                    descLines.forEach(l => {
                        const cl = '- ' + l.replace(/^[-•]\\s*/, '');
                        doc.fontSize(9.5).font('Helvetica');
                        const h = doc.heightOfString(cl, { width: cw });
                        if (!dry) doc.fillColor(TEXT_SEC).text(cl, cx, cyy, { width: cw });
                        cyy += h + 2;
                    });
                }
                cyy += 12;
            });
            return cyy - cy;
        }, true, 'Projects');
    }

    // 4. Certifications
    const certs = data.certifications || [];
    if (certs.length > 0) {
        rightY += drawCard(RIGHT_X, rightY, RIGHT_W, (cx, cy, cw, dry) => {
            let cyy = cy;
            certs.forEach(cert => {
                const name = typeof cert === 'string' ? cert : (cert.name || cert.title || '');
                if (!dry) {
                    doc.fontSize(10.5).font('Helvetica-Bold').fillColor(TEXT_PRI)
                        .text('• ' + name, cx, cyy);
                }
                cyy += 18;
            });
            return cyy - cy;
        }, true, 'Certifications');
    }
`;
if (!utContent.includes('// 4. Certifications')) {
    utContent = utContent.replace("// 3. Activities", projBlock + "\n    // 5. Activities");
}

fs.writeFileSync(utFile, utContent, 'utf8');

// --- 2. Fix resume.js HTML ---
let rsFile = 'routes/resume.js';
let rsContent = fs.readFileSync(rsFile, 'utf8');

rsContent = rsContent.replace(
    /personalInfo\.gender,\s*personalInfo\.dob,\s*personalInfo\.email,\s*personalInfo\.phone,\s*personalInfo\.website,\s*personalInfo\.address/,
    "personalInfo.phone, personalInfo.email, personalInfo.linkedin, personalInfo.github, personalInfo.website, personalInfo.address"
);

// Add languages
const htmlLangBlock = `
                                    \${data.personalInfo.languagesKnown ? \`
                                    <table class="card-outer" width="100%"><tr><td class="card-inner-table">
                                        <div class="card-header">LANGUAGES</div>
                                        <div style="font-size:9.5pt; color:\${TEXT_SEC}; line-height:1.4;">\${data.personalInfo.languagesKnown}</div>
                                    </td></tr></table>
                                    \` : ''}`;

if (!rsContent.includes('LANGUAGES</div>')) {
    rsContent = rsContent.replace(
        "                                </td>\n                                <td width=\"5%\" style=\"width:20px;\"></td>",
        htmlLangBlock + "\n\n                                </td>\n                                <td width=\"5%\" style=\"width:20px;\"></td>"
    );
}

// Add projects and certs
const htmlProjBlock = `
                                    \${(data.projects && data.projects.length > 0) ? \`
                                    <table class="card-outer" width="100%"><tr><td class="card-inner-table">
                                        <div class="card-header">PROJECTS</div>
                                        \${data.projects.map(proj => \`
                                            <div style="margin-bottom:15pt;">
                                                <div style="font-size:10.5pt; font-weight:bold; color:\${TEXT_PRI};">\${proj.title||''}</div>
                                                \${proj.tech ? \`<div style="font-size:9.5pt; color:\${PEACH_ACCENT}; margin-top:2pt;">\${proj.tech}</div>\` : ''}
                                                \${proj.description ? \`
                                                    <div style="font-size:9.5pt; color:\${TEXT_SEC}; line-height:1.4; margin-top:5pt;">
                                                        \${proj.description.split('\\n').filter(Boolean).map(l => \`<div>- \${l.replace(/^[-•]\\s*/,'')}</div>\`).join('')}
                                                    </div>
                                                \` : ''}
                                            </div>
                                        \`).join('')}
                                    </td></tr></table>
                                    \` : ''}

                                    \${(data.certifications && data.certifications.length > 0) ? \`
                                    <table class="card-outer" width="100%"><tr><td class="card-inner-table">
                                        <div class="card-header">CERTIFICATIONS</div>
                                        \${data.certifications.map(cert => {
                                            const name = typeof cert === 'string' ? cert : (cert.name || cert.title || '');
                                            return \`
                                            <div style="margin-bottom:8pt;">
                                                <div style="font-size:10.5pt; font-weight:bold; color:\${TEXT_PRI};">• \${name}</div>
                                            </div>
                                            \`;
                                        }).join('')}
                                    </td></tr></table>
                                    \` : ''}
`;

if (!rsContent.includes('PROJECTS</div>')) {
    rsContent = rsContent.replace(
        "                                    ${(activitiesArr.length > 0) ? `",
        htmlProjBlock + "\n\n                                    ${(activitiesArr.length > 0) ? `"
    );
}

fs.writeFileSync(rsFile, rsContent, 'utf8');

console.log("Success");
