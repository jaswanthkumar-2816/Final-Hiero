function generateTechFocusTemplate(data) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: 'Courier New', monospace; margin: 40px; background: #1e1e1e; color: #e6e6e6; }
      .header { border-bottom: 1px solid #333; padding-bottom: 15px; margin-bottom: 25px; }
      .name { font-size: 22px; color: #4ade80; margin: 0 0 8px 0; }
      .contact { color: #a3a3a3; font-size: 13px; margin: 2px 0; }
      .section { margin-bottom: 25px; }
      .section-title { color: #4ade80; font-size: 18px; margin-bottom: 12px; font-weight: 600; }
      .experience-item, .education-item { margin-bottom: 18px; background: #2a2a2a; padding: 15px; border-radius: 6px; }
      .job-title { color: #60a5fa; font-weight: 600; }
      .company { color: #a3a3a3; margin: 3px 0; }
      .period { color: #737373; font-size: 12px; margin-bottom: 8px; }
      .description { color: #d4d4d4; margin-top: 5px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1 class="name">$ whoami: ${data.personalInfo?.fullName || 'user'}</h1>
      <div class="contact"># ${data.personalInfo?.email || ''} | ${data.personalInfo?.phone || ''}</div>
      ${data.address ? `<div class="contact"># ${data.address}</div>` : ''}
      ${data.linkedin ? `<div class="contact"># ${data.linkedin}</div>` : ''}
    </div>
    
    ${data.summary ? `
    <div class="section">
      <h2 class="section-title">## About</h2>
      <p>${data.summary}</p>
    </div>
    ` : ''}
    
    ${data.experience && data.experience.length > 0 ? `
    <div class="section">
      <h2 class="section-title">## Experience</h2>
      ${data.experience.map(exp => `
        <div class="experience-item">
          <div class="job-title">${exp.jobTitle}</div>
          <div class="company">${exp.company}</div>
          <div class="period">${exp.startDate} to ${exp.endDate}</div>
          <div class="description">${exp.description}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${data.education && data.education.length > 0 ? `
    <div class="section">
      <h2 class="section-title">## Education</h2>
      ${data.education.map(edu => `
        <div class="education-item">
          <div class="job-title">${edu.degree}</div>
          <div class="company">${edu.school}</div>
          <div class="period">${edu.gradYear}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${data.technicalSkills ? `
    <div class="section">
      <h2 class="section-title">## Tech Stack</h2>
      <p>${data.technicalSkills}</p>
    </div>
    ` : ''}
    
    ${data.references && data.references.length > 0 ? `
    <div class="section">
      <h2 class="section-title">## References</h2>
      ${data.references.map(ref => `
        <div class="experience-item">
          <div class="job-title">${ref.name}</div>
          <div class="company">${ref.title}${ref.company ? ` @ ${ref.company}` : ''}</div>
          <div class="company">${ref.phone ? ref.phone : ''}${ref.email ? ` | ${ref.email}` : ''}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${data.customDetails && data.customDetails.length > 0 ? 
      data.customDetails.map(custom => `
        <div class="section">
          <h2 class="section-title">## ${custom.heading}</h2>
          <p>${custom.content}</p>
        </div>
      `).join('') : ''}
  </body>
  </html>
  `;
}

module.exports = { generateTechFocusTemplate };
