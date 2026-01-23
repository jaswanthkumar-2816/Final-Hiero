function generateMinimalistMonoTemplate(data) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { 
        font-family: 'IBM Plex Mono', 'Courier New', monospace; 
        margin: 50px; 
        background: #ffffff; 
        color: #000000; 
        line-height: 1.8; 
        border: 1px solid #000000; 
        padding: 40px; 
      }
      .header { 
        border-bottom: 2px solid #000000; 
        padding-bottom: 25px; 
        margin-bottom: 30px; 
      }
      .name { 
        font-size: 28px; 
        font-weight: 700; 
        margin: 0 0 15px 0; 
        letter-spacing: -0.5px; 
        text-transform: uppercase; 
      }
      .contact { 
        font-size: 12px; 
        margin: 3px 0; 
        letter-spacing: 0.5px; 
      }
      .section { margin-bottom: 30px; }
      .section-title { 
        font-size: 14px; 
        text-transform: uppercase; 
        font-weight: 700; 
        margin-bottom: 15px; 
        letter-spacing: 2px; 
        border-bottom: 1px solid #000000; 
        padding-bottom: 8px; 
      }
      .experience-item, .education-item { 
        margin-bottom: 20px; 
        padding-left: 15px; 
        border-left: 2px solid #000000; 
      }
      .job-title { 
        font-weight: 700; 
        font-size: 14px; 
        text-transform: uppercase; 
        margin-bottom: 5px; 
      }
      .company { 
        font-size: 13px; 
        margin-bottom: 3px; 
      }
      .period { 
        color: #555555; 
        font-size: 12px; 
        font-style: italic; 
        margin-bottom: 10px; 
      }
      .description { 
        font-size: 13px; 
        color: #222222; 
        line-height: 1.7; 
      }
      .divider { 
        border-top: 1px solid #000000; 
        margin: 25px 0; 
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1 class="name">${data.personalInfo?.fullName || 'YOUR NAME'}</h1>
      <div class="contact">${data.personalInfo?.email || ''} | ${data.personalInfo?.phone || ''}</div>
      ${data.address ? `<div class="contact">${data.address}</div>` : ''}
      ${data.linkedin ? `<div class="contact">${data.linkedin}</div>` : ''}
      ${data.website ? `<div class="contact">${data.website}</div>` : ''}
    </div>
    
    ${data.summary ? `
    <div class="section">
      <h2 class="section-title">Summary</h2>
      <p>${data.summary}</p>
    </div>
    <div class="divider"></div>
    ` : ''}
    
    ${data.experience && data.experience.length > 0 ? `
    <div class="section">
      <h2 class="section-title">Experience</h2>
      ${data.experience.map(exp => `
        <div class="experience-item">
          <div class="job-title">${exp.jobTitle}</div>
          <div class="company">${exp.company}</div>
          <div class="period">${exp.startDate} — ${exp.endDate}</div>
          <div class="description">${exp.description}</div>
        </div>
      `).join('')}
    </div>
    <div class="divider"></div>
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
    <div class="divider"></div>
    ` : ''}
    
    ${data.technicalSkills || data.softSkills ? `
    <div class="section">
      <h2 class="section-title">Skills</h2>
      ${data.technicalSkills ? `<p><strong>TECHNICAL:</strong> ${data.technicalSkills}</p>` : ''}
      ${data.softSkills ? `<p><strong>SOFT SKILLS:</strong> ${data.softSkills}</p>` : ''}
    </div>
    <div class="divider"></div>
    ` : ''}
    
    ${data.projects ? `
    <div class="section">
      <h2 class="section-title">Projects</h2>
      <p>${data.projects}</p>
    </div>
    <div class="divider"></div>
    ` : ''}
    
    ${data.certifications ? `
    <div class="section">
      <h2 class="section-title">Certifications</h2>
      <p>${data.certifications}</p>
    </div>
    <div class="divider"></div>
    ` : ''}
    
    ${data.references && data.references.length > 0 ? `
    <div class="section">
      <h2 class="section-title">References</h2>
      ${data.references.map(ref => `
        <div class="experience-item">
          <div class="job-title">${ref.name}</div>
          <div class="company">${ref.title}${ref.company ? ` / ${ref.company}` : ''}</div>
          <div class="company">${ref.phone ? ref.phone : ''}${ref.email ? ` / ${ref.email}` : ''}</div>
        </div>
      `).join('')}
    </div>
    <div class="divider"></div>
    ` : ''}
    
    ${data.customDetails && data.customDetails.length > 0 ? 
      data.customDetails.map(custom => `
        <div class="section">
          <h2 class="section-title">${custom.heading}</h2>
          <p>${custom.content}</p>
        </div>
        <div class="divider"></div>
      `).join('') : ''}
  </body>
  </html>
  `;
}

module.exports = { generateMinimalistMonoTemplate };
