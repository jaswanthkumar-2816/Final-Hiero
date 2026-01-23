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
  @page { margin: 50pt; }
  body { font-family: "Times New Roman", serif; color:#000; line-height:1.35; font-size:12pt; }
  .header { text-align:center; margin-bottom:10px; }
  .name { font-size:24pt; font-weight:700; }
  .contact { font-size:10pt; color:#333; margin-top:6px; }
  .section { margin-top:14px; }
  .section-title { font-weight:700; border-bottom:1px solid #000; padding-bottom:4px; margin-bottom:8px; }
  .item { margin-bottom:8px; }
  .job-title { font-weight:700; }
  .muted { color:#444; font-size:10pt; }
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
