function generateClassicTemplate(data) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: 'Times New Roman', serif; margin: 40px; line-height: 1.4; color: #000; }
      .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 25px; }
      .name { font-size: 24px; font-weight: bold; margin: 0; }
      .contact { font-size: 14px; margin: 5px 0; }
      .section { margin-bottom: 25px; }
      .section-title { font-size: 16px; text-transform: uppercase; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #333; }
      .experience-item, .education-item { margin-bottom: 15px; }
      .job-title { font-weight: bold; }
      .company { font-style: italic; }
      .period { font-size: 12px; color: #666; }
      .description { margin-top: 5px; }
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
          <div class="company">${exp.company}</div>
          <div class="period">${exp.startDate} to ${exp.endDate}</div>
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
          <div class="company">${edu.school}</div>
          <div class="period">${edu.gradYear}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}</div>
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
    
    ${data.projects ? `
    <div class="section">
      <h2 class="section-title">Projects</h2>
      <p>${data.projects}</p>
    </div>
    ` : ''}
    
    ${data.certifications ? `
    <div class="section">
      <h2 class="section-title">Certifications</h2>
      <p>${data.certifications}</p>
    </div>
    ` : ''}
    
    ${data.references && data.references.length > 0 ? `
    <div class="section">
      <h2 class="section-title">References</h2>
      ${data.references.map(ref => `
        <div class="experience-item">
          <div class="job-title">${ref.name}</div>
          <div class="company">${ref.title}${ref.company ? ` at ${ref.company}` : ''}</div>
          <div class="contact">${ref.phone ? ref.phone : ''}${ref.email ? ` | ${ref.email}` : ''}</div>
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

module.exports = { generateClassicTemplate };
