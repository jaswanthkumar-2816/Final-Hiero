// templates/classic.js
export function generateClassicTemplate(data = {}) {
  const p = data.personalInfo || {};
  const experiences = data.experience || [];
  const education = data.education || [];
  const name = (p.fullName || p.name || 'Full Name').toUpperCase();

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${name} — Resume</title>
<style>
  @page { size: A4; margin: 30pt; }
  body { 
    font-family: "Times New Roman", serif; 
    color:#000; 
    line-height:1.2; 
    font-size:10pt; 
    width: 210mm; 
    min-height: 297mm; 
    margin: 0 auto; 
    box-sizing: border-box;
    padding: 15mm;
    overflow: hidden;
  }
  .header { text-align:center; margin-bottom:8px; }
  .name { font-size:18pt; font-weight:700; }
  .contact { font-size:9pt; color:#333; margin-top:4px; }
  .section { margin-top:10px; }
  .section-title { font-weight:700; font-size: 11pt; border-bottom:1px solid #000; padding-bottom:2px; margin-bottom:6px; }
  .item { margin-bottom:6px; }
  .job-title { font-weight:700; font-size: 9.5pt; }
  .muted { color:#444; font-size:9pt; }
</style>
</head>
<body>
  <div class="header">
    <div class="name">${name}</div>
    <div class="contact">${p.email || ''} ${p.phone ? ' | ' + p.phone : ''} ${p.location || data.address || ''}</div>
  </div>

  <div class="section">
    <div class="section-title">Professional Summary</div>
    <div>${p.summary || data.summary || 'A motivated professional seeking a position to contribute and grow.'}</div>
  </div>

  <div class="section">
    <div class="section-title">Work Experience</div>
    ${experiences.map(exp => `
      <div class="item">
        <div class="job-title">${exp.title || exp.jobTitle || 'Job Title'} — <span class="muted">${exp.company || ''} ${exp.start || exp.startDate ? '(' + (exp.start || exp.startDate) + (exp.end || exp.endDate ? ' – ' + (exp.end || exp.endDate) : '') + ')' : ''}</span></div>
        <div>${exp.description || exp.responsibilities || ''}</div>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <div class="section-title">Education</div>
    ${education.map(ed => `
      <div class="item">
        <div class="job-title">${ed.degree || ed.course || ''} — <span class="muted">${ed.institution || ed.school || ''} ${ed.year || ed.graduationDate ? '(' + (ed.year || ed.graduationDate) + ')' : ''}</span></div>
        <div>${ed.details || ''}</div>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <div class="section-title">Skills</div>
    <div>${Array.isArray(p.skills || data.skills) ? (p.skills || data.skills).join(', ') : (p.skills || data.skills || data.technicalSkills || '')}</div>
  </div>
</body>
</html>`;
}
