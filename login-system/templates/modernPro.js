function generateModernProTemplate(data) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: 'Inter', Arial, sans-serif; margin: 0; line-height: 1.5; color: #333; }
      .header { background: linear-gradient(135deg, #2ae023, #1a8b17); color: white; padding: 30px 40px; }
      .name { font-size: 28px; font-weight: 700; margin: 0; }
      .contact { opacity: 0.9; margin: 5px 0; }
      .content { padding: 30px 40px; }
      .section { margin-bottom: 30px; }
      .section-title { color: #2ae023; font-size: 20px; margin-bottom: 15px; font-weight: 600; }
      .experience-item, .education-item { margin-bottom: 20px; border-left: 3px solid #2ae023; padding-left: 15px; }
      .job-title { font-weight: 600; font-size: 16px; }
      .company { color: #666; margin: 2px 0; }
      .period { color: #999; font-size: 14px; margin-bottom: 8px; }
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
    
    <div class="content">
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
      
      ${data.references && data.references.length > 0 ? `
      <div class="section">
        <h2 class="section-title">References</h2>
        ${data.references.map(ref => `
          <div class="experience-item">
            <div class="job-title">${ref.name}</div>
            <div class="company">${ref.title}${ref.company ? ` at ${ref.company}` : ''}</div>
            <div class="company">${ref.phone ? ref.phone : ''}${ref.email ? ` | ${ref.email}` : ''}</div>
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
    </div>
  </body>
  </html>
  `;
}

module.exports = { generateModernProTemplate };
