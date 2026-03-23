const fs = require('fs');
const file = 'routes/unifiedTemplates.js';
let content = fs.readFileSync(file, 'utf8');

// Check if case 'hiero-classic' already exists
if (!content.includes("case 'hiero-classic':")) {
    const switchTarget = "case 'hiero-studio':";
    const replaceStr = `case 'hiero-classic':
                    await renderTemplate_HieroClassic(doc, data);
                    doc.end();
                    if (outStream && outStream.on) {
                        outStream.on('finish', () => resolve(true));
                        outStream.on('error', reject);
                    } else {
                        resolve(doc);
                    }
                    return;
                case 'hiero-studio':`;

    content = content.replace(switchTarget, replaceStr);
}

// Add renderTemplate_HieroClassic at the end
const endTarget = 'module.exports = { generateUnifiedResume };';
if (!content.includes('async function renderTemplate_HieroClassic')) {
    const templateCode = `
// ==================== HIERO CLASSIC (Specific Layout) ====================
async function renderTemplate_HieroClassic(doc, rawData) {
    const data = normalizeData(rawData);
    doc.addPage = function () { return doc; };  // strict single page

    const PW = 595.28;
    const PH = 841.89;

    const DARK = '#333333';
    const LIGHT = '#EAEAEA';
    const WHITE = '#FFFFFF';
    const GRAY_TEXT = '#666666';
    const BLACK = '#222222';

    const LEFT_W = 205;
    const RIGHT_X = 230;
    const RIGHT_W = PW - RIGHT_X - 30;
    const HDR_H = 160;

    // 1. Base background (Light Gray)
    doc.rect(0, 0, PW, PH).fill(LIGHT);
    
    // 2. Header Left Dark Box
    doc.rect(0, 0, LEFT_W, HDR_H).fill(DARK);

    const PI = data.personalInfo || {};

    // ---------------- HEADER ELEMENTS ----------------
    // Profile Picture
    const PR = 50;
    const PCX = LEFT_W / 2;
    const PCY = HDR_H / 2;
    
    doc.save();
    doc.circle(PCX, PCY, PR).clip();
    let photoDrawn = false;
    if (PI.profilePhoto) {
        try {
            const buf = base64ToBuffer(PI.profilePhoto);
            if (buf) {
                doc.image(buf, PCX - PR, PCY - PR, { width: PR * 2, height: PR * 2, cover: [PR * 2, PR * 2] });
                photoDrawn = true;
            }
        } catch (e) { }
    }
    if (!photoDrawn) {
        doc.rect(PCX - PR, PCY - PR, PR * 2, PR * 2).fill('#555555');
    }
    doc.restore();

    // Name and Title
    let ry = 40;
    const fullName = (PI.fullName || 'YOUR NAME').trim();
    doc.font('Helvetica-Bold').fontSize(34).fillColor(DARK).text(fullName.toUpperCase(), RIGHT_X, ry);
    ry += 40;

    // Title Box
    const title = PI.jobTitle || 'Professional';
    doc.rect(RIGHT_X, ry, PW - RIGHT_X - 30, 20).fill(DARK);
    doc.font('Helvetica').fontSize(10).fillColor(WHITE).text(title, RIGHT_X + 10, ry + 6);

    // ---------------- LEFT COLUMN ELEMENTS ----------------
    let ly = HDR_H + 20;

    // Contact Info
    const contacts = [
        { icon: 'p', txt: PI.phone || '' },
        { icon: 'e', txt: PI.email || '' },
        { icon: 'w', txt: PI.website || PI.linkedin || '' },
        { icon: 'a', txt: PI.address || '' }
    ];

    doc.lineWidth(1);
    contacts.forEach(c => {
        if (!c.txt) return;
        doc.moveTo(25, ly).lineTo(LEFT_W - 25, ly).strokeColor('#CCCCCC').stroke();
        ly += 10;
        
        // Use a generic rectangle/polygon as "Icon placeholder" 
        doc.circle(35, ly + 5, 6).fill(DARK);
        doc.font('Helvetica-Bold').fontSize(8).fillColor(WHITE).text(c.icon.toUpperCase(), 32.5, ly + 1.5, { lineBreak: false });
        
        doc.font('Helvetica').fontSize(9).fillColor(DARK).text(c.txt, 55, ly + 0.5, { width: 120, lineBreak: false });
        ly += 15;
    });
    // Final contact line
    doc.moveTo(25, ly).lineTo(LEFT_W - 25, ly).strokeColor('#CCCCCC').stroke();
    ly += 20;

    // Dark Bottom Box
    doc.rect(0, ly, LEFT_W, PH - ly).fill(DARK);

    // Education
    ly += 25;
    if (data.education && data.education.length > 0) {
        doc.font('Helvetica-Bold').fontSize(12).fillColor(WHITE).text('EDUCATION', 25, ly, { characterSpacing: 1.5 });
        doc.moveTo(25, ly + 16).lineTo(100, ly + 16).strokeColor(WHITE).stroke();
        ly += 30;

        data.education.forEach(edu => {
            if (ly > PH - 40) return;
            doc.font('Helvetica-Bold').fontSize(9).fillColor(WHITE).text(edu.degree || '', 25, ly);
            ly += 12;
            doc.font('Helvetica').fontSize(8).fillColor('#CCCCCC').text(edu.school || '', 25, ly);
            ly += 11;
            const dates = edu.gradYear || '';
            if (dates) {
                doc.font('Helvetica').fontSize(8).fillColor('#CCCCCC').text(dates, 25, ly);
                ly += 11;
            }
            ly += 8;
        });
    }

    // Skills
    const techSkills = typeof data.technicalSkills === 'string' ? data.technicalSkills.split(',').map(s=>s.trim()).filter(Boolean) : (data.technicalSkills||[]);
    const extSkills = data.skills ? data.skills : techSkills;

    if (extSkills.length > 0) {
        ly += 10;
        doc.font('Helvetica-Bold').fontSize(12).fillColor(WHITE).text('SKILLS', 25, ly, { characterSpacing: 1.5 });
        doc.moveTo(25, ly + 16).lineTo(80, ly + 16).strokeColor(WHITE).stroke();
        ly += 30;

        extSkills.slice(0, 5).forEach((sk, i) => {
            if (ly > PH - 40) return;
            doc.font('Helvetica').fontSize(8.5).fillColor(WHITE).text(sk, 25, ly);
            const percentages = [0.95, 0.85, 0.75, 0.65, 0.55];
            const pct = percentages[i] || 0.6;
            
            // Outer rectangle
            doc.rect(95, ly + 2, 75, 5).strokeColor(WHITE).stroke();
            // Inner filled
            doc.rect(95, ly + 2, 75 * pct, 5).fill(WHITE);
            
            ly += 16;
        });
    }

    // Interests
    const hobbies = typeof data.hobbies === 'string' ? data.hobbies.split(',').map(s=>s.trim()).filter(Boolean) : (data.hobbies||[]);
    if (hobbies.length > 0) {
        ly += 15;
        doc.font('Helvetica-Bold').fontSize(12).fillColor(WHITE).text('INTERESTS', 25, ly, { characterSpacing: 1.5 });
        doc.moveTo(25, ly + 16).lineTo(100, ly + 16).strokeColor(WHITE).stroke();
        ly += 30;

        let col1 = [], col2 = [];
        hobbies.slice(0, 6).forEach((h, i) => { i % 2 === 0 ? col1.push(h) : col2.push(h); });

        let tempy = ly;
        col1.forEach(h => {
            if (tempy > PH - 20) return;
            doc.font('Helvetica').fontSize(8.5).fillColor('#CCCCCC').text(h, 25, tempy);
            tempy += 14;
        });
        tempy = ly;
        col2.forEach(h => {
            if (tempy > PH - 20) return;
            doc.font('Helvetica').fontSize(8.5).fillColor('#CCCCCC').text(h, 95, tempy);
            tempy += 14;
        });
    }

    // ---------------- RIGHT COLUMN ELEMENTS ----------------
    ry = HDR_H + 20;

    function renderSectionTitleR(title, y) {
        doc.font('Helvetica-Bold').fontSize(12).fillColor(DARK).text(title.toUpperCase(), RIGHT_X, y, { characterSpacing: 1 });
        doc.moveTo(RIGHT_X, y + 16).lineTo(PW - 30, y + 16).strokeColor(DARK).stroke();
        return y + 30;
    }

    // Statement
    if (data.summary) {
        ry = renderSectionTitleR('STATEMENT', ry);
        doc.font('Helvetica').fontSize(9).fillColor(GRAY_TEXT);
        const sh = doc.heightOfString(data.summary, { width: RIGHT_W, lineGap: 2 });
        doc.text(data.summary, RIGHT_X, ry, { width: RIGHT_W, lineGap: 2 });
        ry += sh + 25;
    }

    // Experience
    const exps = data.experience || [];
    if (exps.length > 0) {
        ry = renderSectionTitleR('EXPERIENCE', ry);

        exps.forEach(exp => {
            if (ry > PH - 80) return;
            const startD = exp.startDate || '';
            const endD = exp.endDate || 'Present';
            const dateStr = \`\${startD}-\${endD}\`;

            // Date Box (Right aligned box like in image)
            const dateW = 55;
            doc.rect(PW - 30 - dateW, ry, dateW, 14).fill('#DDDDDD');
            doc.font('Helvetica').fontSize(7.5).fillColor(DARK).text(dateStr.toUpperCase(), PW - 30 - dateW, ry + 3, { width: dateW, align: 'center' });

            // Job Title
            doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK).text(exp.jobTitle ? exp.jobTitle.toUpperCase() : '', RIGHT_X, ry);
            ry += 15;

            // Company/Location
            const loc = exp.location ? \`/\${exp.location}\` : '';
            doc.font('Helvetica').fontSize(8.5).fillColor(GRAY_TEXT).text(\`\${exp.company || ''}\${loc}\`, RIGHT_X, ry);
            ry += 15;

            // Description
            if (exp.description) {
                const lines = exp.description.split('\\n').filter(l => l.trim());
                doc.font('Helvetica').fontSize(8.5).fillColor(GRAY_TEXT);
                lines.forEach(line => {
                    if (ry > PH - 30) return;
                    const clean = line.replace(/^[\\*\\-•]\\s*/, '');
                    const txt = '• ' + clean;
                    const h = doc.heightOfString(txt, { width: RIGHT_W, lineGap: 2 });
                    doc.text(txt, RIGHT_X, ry, { width: RIGHT_W, lineGap: 2 });
                    ry += h + 2;
                });
            }
            ry += 15;
        });
    }

    // References
    const refs = data.references || [];
    if (refs.length > 0 && ry < PH - 80) {
        ry = renderSectionTitleR('REFERENCE', ry);

        // Calculate available width for boxes
        const spaceW = PW - RIGHT_X - 30; // approx 335
        const refW = (spaceW - 15) / 2;
        let rx = RIGHT_X;

        refs.slice(0, 2).forEach((ref, index) => {
            // Draw Box
            doc.rect(rx, ry, refW, 60).fillAndStroke('#DEDEDE', '#666666');
            
            let tryy = ry + 8;
            doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK).text(ref.name || 'Reference Name', rx + 10, tryy);
            tryy += 12;
            doc.font('Helvetica').fontSize(8).fillColor(GRAY_TEXT).text(ref.title || 'Role', rx + 10, tryy);
            tryy += 12;
            if (ref.phone) {
                doc.font('Helvetica').fontSize(8).fillColor(DARK).text(\`T : \${ref.phone}\`, rx + 10, tryy);
                tryy += 10;
            }
            if (ref.email) {
                doc.font('Helvetica').fontSize(8).fillColor(DARK).text(\`E : \${ref.email}\`, rx + 10, tryy);
            }
            rx += refW + 15; // Move X over for next reference
        });
    }
}
` + '\n' + endTarget;
    content = content.replace(endTarget, templateCode);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed HieroClassic successfully.');
