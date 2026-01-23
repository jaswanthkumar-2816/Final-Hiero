// templates/modernPro.js
export function generateModernProTemplate(data = {}) {
  const p = data.personalInfo || {};
  const experiences = data.experience || [];
  const education = data.education || [];
  const name = p.fullName || 'Full Name';

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${name} — Resume</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;600;800&display=swap" rel="stylesheet">
<style>
  @page { margin:36pt; }
  body { font-family: "Inter", Arial, sans-serif; color:#111; font-size:11pt; margin:0; padding:0; }
  .wrap { max-width:800px; margin:0 auto; border-radius:8px; overflow:hidden; box-shadow:0 6px 24px rgba(0,0,0,0.06); }
  .left { background:#0fa85a; color:#fff; width:28%; float:left; padding:24px; box-sizing:border-box; min-height:100vh; }
  .right { width:72%; float:right; padding:24px; box-sizing:border-box; }
  .name { font-weight:800; font-size:20pt; }
  .title { margin-top:6px; opacity:0.95; }
  .section { margin-bottom:14px; clear:both; }
  .section h4 { margin:0 0 8px 0; font-size:11pt; color:#222; }
  .muted { color:#666; font-size:10pt; }
  .skill-pill { display:inline-block; background:#f1f7f3; color:#0f7a46; padding:6px 8px; border-radius:6px; margin:4px; font-size:9pt; }
  .clearfix::after { content:""; display:table; clear:both; }
</style>
</head>
<body>
  <div class="wrap clearfix">
    <div class="left">
      <div class="name">${name}</div>
      <div class="title">${p.headline || p.role || ''}</div>
      <hr style="border:0;border-top:1px solid rgba(255,255,255,0.15);margin:12px 0;">
      <div><strong>Contact</strong><div style="margin-top:6px;font-size:10pt;">${p.email || ''}<br/>${p.phone || ''}<br/>${p.location || data.address || ''}</div></div>
      <div style="margin-top:12px;"><strong>Skills</strong>
        <div style="margin-top:8px;">
          ${(Array.isArray(p.skills || data.skills) ? (p.skills || data.skills) : (p.skills || data.skills || data.technicalSkills || '').split(',').map(s => s.trim())).map(s=>`<span class="skill-pill">${s}</span>`).join('')}
        </div>
      </div>
    </div>

    <div class="right">
      <div class="section">
        <h4>Summary</h4>
        <div class="muted">${p.summary || data.summary || ''}</div>
      </div>

      <div class="section">
        <h4>Experience</h4>
        ${experiences.map(exp=>`
          <div style="margin-bottom:10px;">
            <div style="font-weight:700">${exp.title || exp.jobTitle || ''} <span style="color:#0fa85a;font-weight:600">${exp.company? ' — ' + exp.company : ''}</span></div>
            <div class="muted">${exp.start || exp.startDate || ''}${exp.end || exp.endDate ? ' – ' + (exp.end || exp.endDate): ''}</div>
            <div style="margin-top:6px;">${exp.description || ''}</div>
          </div>
        `).join('')}
      </div>

      <div class="section">
        <h4>Education</h4>
        ${education.map(ed=>`<div style="margin-bottom:8px;"><strong>${ed.degree||''}</strong><div class="muted">${ed.institution || ed.school ||''} ${ed.year || ed.graduationDate || ''}</div></div>`).join('')}
      </div>
    </div>
  </div>
</body>
</html>`;
}
