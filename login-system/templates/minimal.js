function generateMinimalTemplate(data) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 50px; line-height: 1.6; color: #333; }
      .header { margin-bottom: 40px; }
      .name { font-size: 32px; font-weight: 300; margin: 0 0 10px 0; }
      .contact { color: #666; font-size: 14px; margin: 3px 0; }
      .section { margin-bottom: 30px; }
      .section-title { font-size: 20px; font-weight: 400; margin-bottom: 15px; color: #333; }
      .experience-item, .education-item { margin-bottom: 20px; }
      .job-title { font-weight: 500; font-size: 16px; margin-bottom: 3px; }
      .company { color: #666; font-size: 14px; margin-bottom: 2px; }
      .period { color: #999; font-size: 13px; margin-bottom: 8px; }
      .description { color: #555; margin-top: 5px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1 class="name">${data.personalInfo?.fullName || 'Your Name'}</h1>
      <div class="contact">${data.personalInfo?.email || ''} | ${data.personalInfo?.phone || ''}</div>
      ${data.address ? `<div class="contact">${data.address}</div>` : ''}
      ${data.linkedin ? `<div class="contact">${data.linkedin}</div>` : ''}
    </div>
    
    ${data.summary ? `
    <div class="section">
      <h2 class="section-title">Professional Summary</h2>
      <p>${data.summary}</p>
    </div>
    ` : ''}
    
    ${data.experience && data.experience.length > 0 ? `
    <div class="section">
      <h2 class="section-title">Experience</h2>
      ${data.experience.map(exp => `
        <div class="experience-item">
          <div class="job-title">${exp.jobTitle}</div>
          <div class="company">${exp.company} • ${exp.startDate} to ${exp.endDate}</div>
          <div class="description">${exp.description}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${data.education && data.education.length > 0 ? `
    <div class="section">
      <h2 class="section-title">Education</h2>
      ${data.education.map(edu => `
        <div class="education-item">
          <div class="job-title">${edu.degree}</div>
          <div class="company">${edu.school} • ${edu.gradYear}${edu.gpa ? ` • GPA: ${edu.gpa}` : ''}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${data.technicalSkills || data.softSkills ? `
    <div class="section">
      <h2 class="section-title">Skills</h2>
      ${data.technicalSkills ? `<p><strong>Technical:</strong> ${data.technicalSkills}</p>` : ''}
      ${data.softSkills ? `<p><strong>Soft Skills:</strong> ${data.softSkills}</p>` : ''}
    </div>
    ` : ''}
    
    ${data.references && data.references.length > 0 ? `
    <div class="section">
      <h2 class="section-title">References</h2>
      ${data.references.map(ref => `
        <div class="education-item">
          <div class="job-title">${ref.name}</div>
          <div class="company">${ref.title}${ref.company ? ` • ${ref.company}` : ''}</div>
          <div class="company">${ref.phone ? ref.phone : ''}${ref.email ? ` • ${ref.email}` : ''}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${data.customDetails && data.customDetails.length > 0 ? 
      data.customDetails.map(custom => `
        <div class="section">
          <h2 class="section-title">${custom.heading}</h2>
          <p>${custom.content}</p>
        </div>
      `).join('') : ''}
  </body>
  </html>
  `;
}

module.exports = { generateMinimalTemplate };
