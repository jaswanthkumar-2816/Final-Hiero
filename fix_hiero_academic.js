const fs = require('fs');
const file = 'routes/unifiedTemplates.js';
let content = fs.readFileSync(file, 'utf8');

const targetStr = 'async function renderTemplate_HieroAcademic(doc, rawData) {';
const startIndex = content.indexOf(targetStr);
if (startIndex === -1) {
    console.error('Target function not found');
    process.exit(1);
}

const moduleExpr = 'module.exports = { generateUnifiedResume };';
const endIndex = content.indexOf(moduleExpr);

const replacement = `async function renderTemplate_HieroAcademic(doc, rawData) {
    const data = normalizeData(rawData);
    doc.addPage = function () { return doc; };  // strict single page

    const PW = 595.28;
    const PH = 841.89;

    const DARK = '#222222';
    const YEL = '#F0D03D';
    const WHITE = '#FFFFFF';
    const LGRAY = '#D0D0D0';
    const BLACK = '#111111';

    const LEFT_W = 230;
    const RIGHT_X = 230;
    const RIGHT_W = PW - RIGHT_X;

    // 1. Base dark background
    doc.rect(0, 0, PW, PH).fill(DARK);
    
    // 2. Top yellow polygon on right side
    doc.moveTo(RIGHT_X, 0)
       .lineTo(PW, 0)
       .lineTo(PW, 140)
       .lineTo(RIGHT_X, 200)
       .closePath()
       .fill(YEL);
       
    // 3. Bottom yellow polygon on right side
    doc.moveTo(RIGHT_X, PH - 60)
       .lineTo(PW, PH - 120)
       .lineTo(PW, PH)
       .lineTo(RIGHT_X, PH)
       .closePath()
       .fill(YEL);

    const PI = data.personalInfo || {};

    // ---------------- RIGHT HEADER ELEMENTS ----------------
    // Profile Picture
    const PR = 45;
    const PCX = 310;
    const PCY = 85;
    
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
        doc.rect(PCX - PR, PCY - PR, PR * 2, PR * 2).fill('#444444');
    }
    doc.restore();

    // Contact Info (Top Right - black text on yellow)
    let detY = 40;
    const detX = 390;
    doc.font('Helvetica').fontSize(9).fillColor(BLACK);
    const detailItems = [
        PI.dob ? PI.dob : null,
        PI.nationality ? PI.nationality : null,
        PI.phone ? PI.phone : null,
        PI.email ? PI.email : null,
        PI.linkedin ? PI.linkedin : null
    ].filter(Boolean);
    
    detailItems.forEach(txt => {
        doc.circle(detX + 4, detY + 4, 3).stroke(BLACK).lineWidth(1);
        doc.circle(detX + 4, detY + 4, 1.5).fill(BLACK);
        doc.text(txt, detX + 12, detY, { width: PW - detX - 20, lineBreak: false });
        detY += 15;
    });

    // Footer Text (Bottom Right - black text on yellow)
    const fX = PW - 180;
    const fY = PH - 40;
    doc.font('Helvetica').fontSize(9).fillColor(BLACK);
    if (PI.address) { 
        doc.circle(fX - 8, fY + 4, 3).stroke(BLACK).lineWidth(1);
        doc.circle(fX - 8, fY + 4, 1.5).fill(BLACK);
        doc.text(PI.address, fX, fY, { width: 160 }); 
    }
    if (PI.website) { 
        doc.circle(fX - 8, fY + 19, 3).stroke(BLACK).lineWidth(1);
        doc.circle(fX - 8, fY + 19, 1.5).fill(BLACK);
        doc.text(PI.website, fX, fY + 15, { width: 160 }); 
    }

    // ---------------- LEFT COLUMN ELEMENTS ----------------
    let ly = 40;
    
    // Name
    const fullName = (PI.fullName || 'YOUR NAME').trim();
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    doc.font('Helvetica-Bold').fontSize(34).fillColor(WHITE).text(firstName.toUpperCase(), 30, ly);
    ly += 34;
    doc.font('Helvetica-Bold').fontSize(34).fillColor(LGRAY).text(lastName.toUpperCase(), 30, ly);
    ly += 50;

    // Objective
    if (data.summary) {
        doc.rect(30, ly + 2, 8, 8).stroke(YEL).lineWidth(1.5);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(YEL).text('RESUME OBJECTIVE', 45, ly);
        ly += 22;
        doc.font('Helvetica').fontSize(8.5).fillColor(LGRAY);
        const summH = doc.heightOfString(data.summary, { width: 170, lineGap: 2 });
        doc.text(data.summary, 30, ly, { width: 170, lineGap: 2 });
        ly += summH + 20;
    }

    // Experience
    const exps = data.experience || [];
    if (exps.length > 0) {
        doc.rect(30, ly + 2, 8, 8).stroke(YEL).lineWidth(1.5);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(YEL).text('WORK EXPERIENCE', 45, ly);
        ly += 25;

        exps.forEach(exp => {
            if (ly > PH - 40) return;
            const startD = exp.startDate || '';
            const endD = exp.endDate || 'Present';
            const loc = exp.location || '';
            let dateLoc = \`\${startD} - \${endD}\`;
            if (loc) dateLoc += \`    \${loc}\`;
            doc.font('Helvetica').fontSize(7.5).fillColor(YEL).text(dateLoc.toUpperCase(), 30, ly);
            ly += 12;

            doc.font('Helvetica-Bold').fontSize(10).fillColor(WHITE).text(exp.jobTitle || '', 30, ly);
            ly += 13;
            
            if (exp.company) {
                doc.font('Helvetica-Bold').fontSize(9).fillColor(LGRAY).text(exp.company, 30, ly);
                ly += 12;
            }

            if (exp.description) {
                const lines = exp.description.split('\\n').filter(l => l.trim());
                doc.font('Helvetica').fontSize(8).fillColor(LGRAY);
                lines.forEach(line => {
                    if (ly > PH - 30) return;
                    const clean = line.replace(/^[\\*\\-•]\\s*/, '');
                    const txt = '•  ' + clean;
                    const h = doc.heightOfString(txt, { width: 170, lineGap: 1.5 });
                    doc.text(txt, 30, ly, { width: 170, lineGap: 1.5 });
                    ly += h + 2;
                });
            }
            ly += 15;
        });
    }

    // ---------------- RIGHT COLUMN ELEMENTS ----------------
    let ry = 230; // Starts below the top yellow polygon

    // Education
    const edus = data.education || [];
    if (edus.length > 0) {
        doc.rect(RIGHT_X + 20, ry + 2, 8, 8).stroke(YEL).lineWidth(1.5);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(YEL).text('EDUCATION', RIGHT_X + 35, ry);
        ry += 25;

        edus.forEach(edu => {
            if (ry > PH - 100) return;
            const d = edu.gradYear || '';
            const loc = edu.location || '';
            let dateLoc = d;
            if (loc) dateLoc += (d ? '    ' : '') + loc;
            if (dateLoc) {
                doc.font('Helvetica').fontSize(7.5).fillColor(YEL).text(dateLoc.toUpperCase(), RIGHT_X + 20, ry);
                ry += 12;
            }

            doc.font('Helvetica-Bold').fontSize(10).fillColor(WHITE).text(edu.degree || '', RIGHT_X + 20, ry);
            ry += 13;

            if (edu.school) {
                doc.font('Helvetica-Bold').fontSize(9).fillColor(LGRAY).text(edu.school, RIGHT_X + 20, ry);
                ry += 12;
            }
            if (edu.gpa) {
                doc.font('Helvetica').fontSize(8.5).fillColor(LGRAY).text(edu.gpa, RIGHT_X + 20, ry);
                ry += 12;
            }
            ry += 15;
        });
    }

    // Skills
    const techSkills = typeof data.technicalSkills === 'string' ? data.technicalSkills.split(',').map(s=>s.trim()).filter(Boolean) : (data.technicalSkills||[]);
    const extSkills = data.skills ? data.skills : techSkills;

    if (extSkills.length > 0) {
        doc.rect(RIGHT_X + 20, ry + 2, 8, 8).stroke(YEL).lineWidth(1.5);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(YEL).text('SKILLS', RIGHT_X + 35, ry);
        ry += 20;

        doc.font('Helvetica-Bold').fontSize(8).fillColor(WHITE).text('SOFTWARE', RIGHT_X + 20, ry);
        ry += 15;

        extSkills.slice(0, 5).forEach((sk, i) => {
            if (ry > PH - 90) return;
            doc.font('Helvetica').fontSize(8.5).fillColor(LGRAY).text(sk, RIGHT_X + 20, ry);
            const barX = RIGHT_X + 110;
            const percentages = [0.95, 0.85, 0.75, 0.65, 0.55];
            const pct = percentages[i] || 0.6;
            doc.rect(barX, ry + 3, RIGHT_W - 140, 4).fill('#444444');
            doc.rect(barX, ry + 3, (RIGHT_W - 140) * pct, 4).fill(YEL);
            ry += 14;
        });
        ry += 10;
    }

    // Languages
    const langs = typeof data.languages === 'string' ? data.languages.split(',').map(s=>s.trim()).filter(Boolean) : (data.languages||[]);
    if (langs.length > 0 && ry < PH - 140) {
        doc.font('Helvetica-Bold').fontSize(8).fillColor(WHITE).text('LANGUAGES', RIGHT_X + 20, ry);
        ry += 15;
        langs.slice(0, 3).forEach((lang, i) => {
            if (ry > PH - 100) return;
            doc.font('Helvetica').fontSize(8.5).fillColor(LGRAY).text(lang, RIGHT_X + 20, ry);
            const profs = ['Native', 'Professional', 'Limited'];
            const lvl = profs[i] || 'Limited';
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor(YEL).text(lvl, RIGHT_X + 110, ry);
            ry += 14;
        });
        ry += 10;
    }

    // Special Skills
    const soft = typeof data.softSkills === 'string' ? data.softSkills.split(',').map(s=>s.trim()).filter(Boolean) : (data.softSkills||[]);
    if (soft.length > 0 && ry < PH - 140) {
        doc.rect(RIGHT_X + 20, ry + 2, 8, 8).stroke(YEL).lineWidth(1.5);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(YEL).text('SPECIAL SKILLS', RIGHT_X + 35, ry);
        ry += 20;

        soft.slice(0, 5).forEach(sk => {
            if (ry > PH - 100) return;
            const txt = '•  ' + sk;
            doc.font('Helvetica').fontSize(8.5).fillColor(LGRAY);
            const h = doc.heightOfString(txt, { width: RIGHT_W - 50 });
            doc.text(txt, RIGHT_X + 20, ry, { width: RIGHT_W - 50 });
            ry += h + 3;
        });
    }
}

`;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync(file, newContent, 'utf8');
console.log('Fixed HieroAcademic successfully.');
