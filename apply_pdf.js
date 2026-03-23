const fs = require('fs');
let file = 'routes/unifiedTemplates.js';
let content = fs.readFileSync(file, 'utf8');

const pdfFunc = `
async function renderTemplate_HieroPremium(doc, rawData, colors, spacing) {
    const data = normalizeData(rawData);
    
    // Prevent accidental pagination that causes infinite loops and scattered text
    doc.addPage = function() { return doc; }; 
    
    // Page Settings
    const MARGIN = 30;
    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    
    // Grid settings
    const COL_GAP = 15;
    const TOTAL_W = PAGE_W - (MARGIN * 2);
    const LEFT_W = TOTAL_W * 0.35;
    const RIGHT_W = TOTAL_W * 0.65 - COL_GAP;
    const LEFT_X = MARGIN;
    const RIGHT_X = MARGIN + LEFT_W + COL_GAP;
    
    // Colors matching the STEVEN TERRY image reference strictly
    const BG_COLOR = '#F4F5F7';      // Light grey layout
    const CARD_BG = '#FFFFFF';       // White Cards
    const PEACH_ACCENT = '#F2B66D';  // The peach/orange color used in headers
    const SHAPE_ACCENT1 = '#EFD6C8'; // Background triangle color
    const SHAPE_ACCENT2 = '#E6C6B3'; // Background triangle color
    const TEXT_PRI = '#333333';      // Main text dark
    const TEXT_SEC = '#555555';      // Secondary text lighter
    const TEXT_HEADER = '#000000';   // Header text inside peach box
    
    // 1. Draw Background Shapes
    doc.rect(0, 0, PAGE_W, PAGE_H).fill(BG_COLOR);
    
    // Render the abstract background triangles as seen in the template
    doc.path(\`M0,0 L\${PAGE_W * 0.5},0 L0,\${PAGE_H * 0.25} Z\`).fill(SHAPE_ACCENT1);
    doc.path(\`M0,\${PAGE_H * 0.3} L\${LEFT_X + LEFT_W + 10},\${PAGE_H * 0.8} L0,\${PAGE_H * 0.9} Z\`).fill(SHAPE_ACCENT2);
    doc.path(\`M\${PAGE_W * 0.7},\${PAGE_H} L\${PAGE_W},\${PAGE_H - PAGE_H * 0.2} L\${PAGE_W},\${PAGE_H} Z\`).fill(SHAPE_ACCENT2);

    let leftY = MARGIN;
    let rightY = MARGIN;
    
    // --- DRAW HEADER AREA ---
    // Profile Image
    const IMG_SIZE = 110;
    if (data.personalInfo.profilePhoto) {
        doc.save();
        doc.circle(LEFT_X + IMG_SIZE/2, leftY + IMG_SIZE/2, IMG_SIZE/2).clip();
        try {
            const imgBuffer = base64ToBuffer(data.personalInfo.profilePhoto);
            doc.image(imgBuffer, LEFT_X, leftY, { width: IMG_SIZE, height: IMG_SIZE, cover: [IMG_SIZE, IMG_SIZE] });
        } catch(e) {}
        doc.restore();
    } else {
        doc.circle(LEFT_X + IMG_SIZE/2, leftY + IMG_SIZE/2, IMG_SIZE/2).fill('#CCCCCC');
    }
    
    // Name & Title
    doc.font('Helvetica-Bold').fontSize(26).fillColor(TEXT_PRI);
    const nameText = (data.personalInfo.fullName || 'STEVEN TERRY').toUpperCase();
    const textStartY = leftY + 25;
    
    doc.text(nameText, RIGHT_X, textStartY, { width: RIGHT_W, align: 'center' });
    
    doc.moveTo(RIGHT_X + 20, textStartY + 35).lineTo(RIGHT_X + RIGHT_W - 20, textStartY + 35).lineWidth(1).strokeColor('#CCCCCC').stroke();
    
    doc.font('Helvetica').fontSize(12).fillColor(TEXT_SEC);
    doc.text(data.personalInfo.jobTitle || data.experience?.[0]?.jobTitle || 'Sales Staff', RIGHT_X, textStartY + 45, { width: RIGHT_W, align: 'center' });
    
    leftY += IMG_SIZE + 20;
    rightY = leftY;
    
    // --- Card Render Function ---
    // This absolutely isolates text measuring from rendering to prevent boundary issues
    function drawCard(x, y, width, renderContentFn, hasHeader = true, title = '') {
        const CARD_PAD = 12;
        const HEADER_H = 22;
        const CONTENT_START_Y = y + (hasHeader ? HEADER_H + CARD_PAD + 10 : CARD_PAD);
        
        let contentH = renderContentFn(x + CARD_PAD, CONTENT_START_Y, width - CARD_PAD*2, true) || 0;
        const totalH = contentH + (hasHeader ? HEADER_H + 10 : 0) + CARD_PAD*2;
        
        // Stop rendering if it physically won't fit to prevent page wrap blowups
        if (y + totalH > PAGE_H + 50) return Math.max(0, PAGE_H - y);
        
        // Draw shadow layer (mock drop shadow)
        doc.roundedRect(x+3, y+3, width, totalH, 6).fillOpacity(0.05).fill('#000000');
        doc.fillOpacity(1); // Reset opacity
        
        // Draw Card Background
        doc.roundedRect(x, y, width, totalH, 6).fill(CARD_BG);
        
        // Draw Header Box
        if (hasHeader && title) {
            doc.rect(x + CARD_PAD, y + CARD_PAD, width - CARD_PAD*2, HEADER_H).fill(PEACH_ACCENT);
            doc.font('Helvetica-Bold').fontSize(10).fillColor(TEXT_HEADER);
            doc.text(title.toUpperCase(), x + CARD_PAD + 10, y + CARD_PAD + 6);
        }
        
        // Lock clipping region so overflowing content doesn't break everything
        doc.save();
        doc.roundedRect(x, y, width, totalH, 6).clip();
        
        // Render Actual Content
        renderContentFn(x + CARD_PAD, CONTENT_START_Y, width - CARD_PAD*2, false);
        
        doc.restore();
        
        return totalH + 12; // Return card height + margin bottom
    }

    // --- LEFT COLUMN ---
    // 1. Personal Info 
    leftY += drawCard(LEFT_X, leftY, LEFT_W, (cx, cy, cw, dry) => {
        let cyy = cy;
        const items = [
            data.personalInfo.gender,
            data.personalInfo.dob,
            data.personalInfo.phone,
            data.personalInfo.email,
            data.personalInfo.linkedin,
            data.personalInfo.github,
            data.personalInfo.website,
            data.personalInfo.address
        ].filter(Boolean);
        
        items.forEach(itm => {
            if (!dry) {
                // simple bullet
                doc.fontSize(10).font('Helvetica').fillColor(PEACH_ACCENT).text('•', cx, cyy);
                doc.fillColor(TEXT_SEC).text(itm, cx + 12, cyy, { width: cw - 12 });
            }
            cyy += 18;
        });
        return cyy - cy;
    }, false);

    // 2. Objective
    if (data.summary) {
        leftY += drawCard(LEFT_X, leftY, LEFT_W, (cx, cy, cw, dry) => {
            doc.fontSize(9.5).font('Helvetica');
            const lines = data.summary.split('\\n').filter(Boolean);
            let hTotal = 0;
            lines.forEach(line => {
                const lh = doc.heightOfString(line, { width: cw, lineGap: 2 });
                if (!dry) doc.fillColor(TEXT_SEC).text(line, cx, cy + hTotal, { width: cw, lineGap: 2 });
                hTotal += lh + 4;
            });
            return hTotal;
        }, true, 'Objective');
    }

    // 3. Skills
    const skills = [...(data.technicalSkills ? [data.technicalSkills] : []), ...(data.softSkills ? [data.softSkills] : []), ...(data.skills || [])];
    if (skills.length > 0) {
        leftY += drawCard(LEFT_X, leftY, LEFT_W, (cx, cy, cw, dry) => {
            let cyy = cy;
            skills.forEach(skillBlock => {
                const blockStr = typeof skillBlock === 'string' ? skillBlock : String(skillBlock);
                const descParts = blockStr.split(',').map(s => s.trim()).filter(Boolean);
                if (descParts.length > 0) {
                    if (!dry) doc.fontSize(10).font('Helvetica-Bold').fillColor(TEXT_PRI).text('Skills:', cx, cyy);
                    cyy += 14;
                    descParts.forEach(p => {
                        const txt = '- ' + p;
                        doc.fontSize(9.5).font('Helvetica');
                        const h = doc.heightOfString(txt, { width: cw });
                        if (!dry) doc.fillColor(TEXT_SEC).text(txt, cx + 5, cyy, { width: cw });
                        cyy += h + 2;
                    });
                    cyy += 6;
                }
            });
            return cyy - cy;
        }, true, 'Skills');
    }

    // 4. Languages
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

    // 5. Interests (Mapped from Hobbies)
    const hobbies = data.hobbies || data.interests || [];
    if (hobbies.length > 0) {
        leftY += drawCard(LEFT_X, leftY, LEFT_W, (cx, cy, cw, dry) => {
            doc.fontSize(9.5).font('Helvetica');
            const hs = hobbies.join(', ');
            const h = doc.heightOfString(hs, { width: cw });
            if (!dry) doc.fillColor(TEXT_SEC).text(hs, cx, cy, { width: cw });
            return h;
        }, true, 'Interests');
    }

    // --- RIGHT COLUMN ---
    // 1. Education
    const edus = data.education || [];
    if (edus.length > 0) {
        rightY += drawCard(RIGHT_X, rightY, RIGHT_W, (cx, cy, cw, dry) => {
            let cyy = cy;
            edus.forEach(edu => {
                if (!dry) {
                    doc.fontSize(11).font('Helvetica-Bold').fillColor(TEXT_PRI).text(edu.school || '', cx, cyy);
                    doc.fontSize(10).font('Helvetica').fillColor(TEXT_SEC).text(edu.degree || '', cx, cyy + 14);
                    doc.fontSize(9.5).fillColor(TEXT_SEC).text(\`\${edu.startDate || ''} - \${edu.endDate || ''}\`, cx, cyy + 26);
                    if (edu.gpa) doc.fontSize(9.5).text(\`GPA: \${edu.gpa}\`, cx, cyy + 38);
                }
                cyy += (edu.gpa ? 52 : 40);
            });
            return cyy - cy;
        }, true, 'Education');
    }

    // 2. Work Experience
    const exps = data.experience || [];
    if (exps.length > 0) {
        rightY += drawCard(RIGHT_X, rightY, RIGHT_W, (cx, cy, cw, dry) => {
            let cyy = cy;
            exps.forEach(exp => {
                if (!dry) {
                    doc.fontSize(10.5).font('Helvetica-Bold').fillColor(TEXT_PRI)
                        .text(\`\${exp.company ? exp.company + ', ' : ''}\${exp.jobTitle || ''}\`, cx, cyy);
                    doc.fontSize(9.5).font('Helvetica').fillColor(TEXT_SEC)
                        .text(\`\${exp.startDate || ''} - \${exp.endDate || 'Present'}\`, cx, cyy + 14);
                }
                cyy += 26;
                
                if (exp.description) {
                    if (!dry && !exp.description.includes('Main responsibilities:')) {
                        doc.fontSize(9.5).font('Helvetica').fillColor(TEXT_SEC).text('Main responsibilities:', cx, cyy);
                    }
                    if (!exp.description.includes('Main responsibilities:')) cyy += 12;

                    const descLines = exp.description.split('\\n').filter(Boolean);
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
        }, true, 'Work Experience');
    }
    
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

    // 5. Activities
    const acts = data.activities || data.extraCurricular || [];
    if (acts.length > 0) {
        rightY += drawCard(RIGHT_X, rightY, RIGHT_W, (cx, cy, cw, dry) => {
            let cyy = cy;
            acts.forEach(act => {
                const t = typeof act === 'string' ? act : (act.title || act.name || '');
                const d = typeof act === 'string' ? '' : (act.date || '');
                const r = typeof act === 'string' ? '' : (act.role || act.description || '');
                
                if (!dry) {
                    doc.fontSize(10.5).font('Helvetica-Bold').fillColor(TEXT_PRI).text(t, cx, cyy);
                    let my = cyy + 14;
                    if (d) { doc.fontSize(9.5).font('Helvetica').fillColor(TEXT_SEC).text(d, cx, my); my += 12; }
                    
                    if (r) {
                        const rParts = r.split('\\n').filter(Boolean);
                        rParts.forEach(l => {
                            const cl = '- ' + l.replace(/^[-•]\\s*/, '');
                            const h = doc.heightOfString(cl, { width: cw });
                            doc.text(cl, cx, my, { width: cw });
                            my += h + 2;
                        });
                        cyy = my;
                    } else cyy = my;
                } else {
                    cyy += 14;
                    if (d) cyy += 12;
                    if (r) {
                        const rParts = r.split('\\n').filter(Boolean);
                        rParts.forEach(l => {
                            doc.fontSize(9.5).font('Helvetica');
                            cyy += doc.heightOfString('- ' + l, { width: cw }) + 2;
                        });
                    }
                }
                cyy += 6;
            });
            return cyy - cy;
        }, true, 'Activities');
    }
}
`;

// Insert the exact code overriding the old one or adding if missing
if (content.includes("async function renderTemplate_HieroPremium")) {
    content = content.replace(/async function renderTemplate_HieroPremium.*?^}/ms, pdfFunc.trim());
} else {
    content = content.replace("module.exports = {", pdfFunc + "\nmodule.exports = {");
}

if (!content.includes("'hiero-premium': 'hiero-premium'")) {
    if (content.includes("const TEMPLATE_MAP = {")) {
        content = content.replace("const TEMPLATE_MAP = {", "const TEMPLATE_MAP = {\n    'hiero-premium': 'hiero-premium',\n    'premium': 'hiero-premium',");
    }
}

if (!content.includes("case 'hiero-premium':")) {
    content = content.replace("case 'hiero-prestige':", "case 'hiero-premium':\n            await renderTemplate_HieroPremium(doc, data, colors, spacing);\n            doc.end();\n            if (outStream && outStream.on) {\n                outStream.on('finish', () => resolve(true));\n                outStream.on('error', reject);\n            } else { resolve(doc); }\n            return;\n        case 'hiero-prestige':");
}

fs.writeFileSync(file, content, 'utf8');
console.log('PDF logic written!');
