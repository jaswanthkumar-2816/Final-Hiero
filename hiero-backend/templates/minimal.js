// templates/minimal.js
export function generateMinimalTemplate(data = {}) {
  const p = data.personalInfo || {};
  const experiences = data.experience || [];
  const education = data.education || [];
  const name = p.fullName || p.name || 'Full Name';

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${name} — Resume</title>
<style>
  @page { margin:40pt; }
  body { font-family: "Helvetica Neue", Arial, sans-serif; color:#111; font-size:11pt; line-height:1.5; }
  .container { max-width:700px; margin:0 auto; }
  header { display:flex; justify-content:space-between; align-items:center; padding-bottom:10px; border-bottom:1px solid #eee; }
  .name { font-size:20pt; font-weight:700; }
  .meta { text-align:right; font-size:9pt; color:#666; }
  section { margin-top:14px; }
  h3 { margin:0 0 8px 0; font-size:11pt; color:#222; }
  .muted { color:#666; font-size:10pt; }
  ul { margin:6px 0 0 18px; padding:0; }
</style>
</head>
<body>
  <div class="container">
    <header>
      <div class="name">${name}</div>
      <div class="meta">${p.email || ''}<br/>${p.phone || ''}</div>
    </header>

    <section>
      <h3>Profile</h3>
      <div class="muted">${p.summary || data.summary || 'Concise professional summary.'}</div>
    </section>

    <section>
      <h3>Experience</h3>
      ${experiences.map(exp => `
        <div style="margin-bottom:8px;">
          <div style="font-weight:700">${exp.title || exp.jobTitle || ''} <span style="font-weight:400;color:#666"> — ${exp.company || ''} ${exp.start || exp.startDate ? '('+(exp.start || exp.startDate)+(exp.end || exp.endDate ? ' – '+(exp.end || exp.endDate):'')+')':''}</span></div>
          <div class="muted">${exp.description || ''}</div>
        </div>
      `).join('')}
    </section>

    <section>
      <h3>Education</h3>
      ${education.map(ed => `<div style="margin-bottom:6px;"><strong>${ed.degree || ''}</strong> — <span class="muted">${ed.institution || ed.school || ''} ${ed.year || ed.graduationDate || ''}</span></div>`).join('')}
    </section>

    <section>
      <h3>Skills</h3>
      <div>${Array.isArray(p.skills || data.skills) ? (p.skills || data.skills).join(' • ') : (p.skills || data.skills || data.technicalSkills || '')}</div>
    </section>
  </div>
</body>
</html>`;
}
