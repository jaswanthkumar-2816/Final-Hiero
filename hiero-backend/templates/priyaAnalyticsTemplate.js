// Priya Analytics single-column resume template
// Matches Priya Sharma sample: grey top bar, bold section headings with rules

export function renderPriyaAnalyticsTemplate(data) {
  const p = data.personalInfo || {};

  // Normalize list-like fields so .map() is always safe
  const toArray = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') {
      return v
        .split(/\n|,/) // split on newlines or commas
        .map(s => s.trim())
        .filter(Boolean);
    }
    return [];
  };

  const edus = Array.isArray(data.education) ? data.education : [];
  const exps = Array.isArray(data.experience) ? data.experience : [];
  const projects = toArray(data.projects);
  const skills = toArray(data.skills || data.technicalSkills);
  const mgmtArr = toArray(data.softSkills || data.managementSkills);
  const certs = toArray(data.certifications || data.personalCertifications);
  const achievements = toArray(data.achievements);
  const hobbies = toArray(data.hobbies);

  const esc = (s = '') => String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const joinList = (arr) => toArray(arr).map(esc).join(' \u00b7 ');

  const fullName = esc(p.fullName || p.name || '');
  const contactLine = [p.email, p.phone, p.address]
    .filter(Boolean)
    .map(esc)
    .join(' | ');

  const links = [
    p.linkedin ? `LinkedIn: ${esc(p.linkedin)}` : '',
    p.github ? `GitHub: ${esc(p.github)}` : '',
    p.website ? `Website: ${esc(p.website)}` : ''
  ].filter(Boolean).join('<br />');

  const section = (title, bodyHtml) => {
    if (!bodyHtml || !bodyHtml.toString().trim()) return '';
    return `
      <section class="section">
        <h2>${esc(title)}</h2>
        <div class="rule"></div>
        ${bodyHtml}
      </section>
    `;
  };

  const educationHtml = edus.map(e => `
    <p class="edu-degree">${esc(e.degree || '')}</p>
    <p class="edu-inst">${esc(e.institution || '')}${e.endDate ? `, ${esc(e.endDate)}` : ''}${e.grade ? ` | CGPA: ${esc(e.grade)}` : ''}</p>
  `).join('');

  const projectsHtml = projects.map(pr => {
    if (typeof pr === 'string') {
      return `<p class="proj-title">${esc(pr)}</p>`;
    }
    return `
      <p class="proj-title">${esc(pr.title || '')}</p>
      ${pr.description ? `<p class="proj-meta">${esc(pr.description)}</p>` : ''}
    `;
  }).join('');

  const techSkillsHtml = skills.length ? `
    <ul class="bullet-list">
      ${skills.map(s => `<li>${esc(s)}</li>`).join('')}
    </ul>
  ` : '';

  const mgmtSkillsHtml = mgmtArr.length ? `
    <ul class="bullet-list">
      ${mgmtArr.map(s => `<li>${esc(s)}</li>`).join('')}
    </ul>
  ` : '';

  const certsHtml = certs.map(c => `<p>${esc(c)}</p>`).join('');
  const achievementsHtml = achievements.map(a => `<p>${esc(a)}</p>`).join('');
  const hobbiesHtml = hobbies.map(h => `<p>${esc(h)}</p>`).join('');

  const personalDetailsLines = [];
  if (p.dateOfBirth) personalDetailsLines.push(`Date of Birth: ${esc(p.dateOfBirth)}`);
  if (p.gender) personalDetailsLines.push(`Gender: ${esc(p.gender)}`);
  if (p.nationality) personalDetailsLines.push(`Nationality: ${esc(p.nationality)}`);
  if (p.maritalStatus) personalDetailsLines.push(`Marital Status: ${esc(p.maritalStatus)}`);
  const langs = joinList(data.languages || p.languagesKnown);
  if (langs) personalDetailsLines.push(`Languages Known: ${langs}`);

  const personalDetailsHtml = personalDetailsLines.map(l => `<p>${l}</p>`).join('');

  const recruiterSummaryLines = [];
  if (data.totalExperienceYears) recruiterSummaryLines.push(`Total Years of Experience: ${esc(data.totalExperienceYears)}`);
  if (data.mostRelevantSkills) recruiterSummaryLines.push(`Most Relevant Skills: ${esc(data.mostRelevantSkills)}`);
  if (data.bestSuitedForRole) recruiterSummaryLines.push(`Best Suited For: ${esc(data.bestSuitedForRole)}`);
  if (data.recruiterSummary) recruiterSummaryLines.push(esc(data.recruiterSummary));

  const recruiterSummaryHtml = recruiterSummaryLines.map(l => `<p>${l}</p>`).join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <style>
      @page { margin: 1in; }
      body { font-family: "Helvetica", Arial, sans-serif; font-size: 11pt; color: #000; }
      .page { width: 100%; max-width: 800px; margin: 0 auto; }
      .top-bar { background: #f2f2f2; padding: 12px 18px; margin-bottom: 10px; }
      .name { font-size: 18pt; font-weight: 700; }
      .contact { font-size: 10pt; margin-top: 4px; }
      .links { font-size: 10pt; margin-top: 8px; }
      .section { margin-top: 14px; }
      .section h2 { font-size: 11.5pt; font-weight: 700; margin: 0; }
      .rule { border-top: 1px solid #000; margin-top: 3px; margin-bottom: 6px; }
      .edu-degree { font-weight: 700; margin: 2px 0; }
      .edu-inst { margin: 0 0 6px 0; }
      .proj-title { font-weight: 700; margin: 4px 0 0 0; }
      .proj-meta { margin: 0 0 6px 0; }
      .bullet-list { margin: 0 0 4px 15px; padding: 0; }
      .bullet-list li { margin: 0 0 2px 0; }
      p { margin: 0 0 4px 0; }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="top-bar">
        <div class="name">${fullName}</div>
        ${contactLine ? `<div class="contact">${contactLine}</div>` : ''}
        ${links ? `<div class="links">${links}</div>` : ''}
      </div>

      ${section('Career Objective', esc(data.objective || data.summary || ''))}
      ${section('Education', educationHtml)}
      ${section('Projects', projectsHtml)}
      ${section('Technical Skills', techSkillsHtml)}
      ${section('Management Skills', mgmtSkillsHtml)}
      ${section('Professional Certifications', certsHtml)}
      ${section('Personal Certifications', esc(data.personalCertifications || ''))}
      ${section('Achievements', achievementsHtml)}
      ${section('Hobbies', hobbiesHtml)}
      ${section('Personal Details', personalDetailsHtml)}
      ${section('References', esc(data.referencesText || 'Available upon request'))}
      ${section('Summary For Recruiter', recruiterSummaryHtml)}
    </div>
  </body>
  </html>
  `;
}
