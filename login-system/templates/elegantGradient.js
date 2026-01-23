function generateElegantGradientTemplate(data) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { 
        font-family: 'Playfair Display', 'Georgia', serif; 
        margin: 0; 
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); 
        color: #2c3e50; 
        line-height: 1.6; 
      }
      .container { 
        max-width: 800px; 
        margin: 0 auto; 
        background: white; 
        box-shadow: 0 10px 30px rgba(0,0,0,0.2); 
        border-radius: 12px; 
        overflow: hidden; 
      }
      .header { 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
        color: white; 
        padding: 40px 40px; 
        text-align: center; 
      }
      .name { 
        font-size: 36px; 
        font-weight: 700; 
        margin: 0 0 15px 0; 
        letter-spacing: 1px; 
        text-shadow: 2px 2px 4px rgba(0,0,0,0.2); 
      }
      .contact { 
        opacity: 0.95; 
        margin: 8px 0; 
        font-size: 15px; 
        font-family: 'Inter', sans-serif; 
      }
      .content { padding: 40px; }
      .section { margin-bottom: 35px; }
      .section-title { 
        font-size: 24px; 
        color: #667eea; 
        margin-bottom: 20px; 
        font-weight: 700; 
        border-bottom: 3px solid #667eea; 
        padding-bottom: 10px; 
      }
      .experience-item, .education-item { 
        margin-bottom: 25px; 
        padding: 20px; 
        background: linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.05) 100%); 
        border-radius: 8px; 
        border-left: 4px solid #667eea; 
      }
      .job-title { 
        font-weight: 700; 
        font-size: 18px; 
        color: #2c3e50; 
        margin-bottom: 5px; 
      }
      .company { 
        color: #5a6c7d; 
        font-size: 15px; 
        font-style: italic; 
        margin-bottom: 5px; 
      }
      .period { 
        color: #8492a6; 
        font-size: 13px; 
        margin-bottom: 12px; 
      }
      .description { 
        color: #3c4858; 
        line-height: 1.7; 
      }
      .skills-grid { 
        display: grid; 
        grid-template-columns: 1fr 1fr; 
        gap: 15px; 
      }
      .skill-item { 
        background: linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%); 
        padding: 15px; 
        border-radius: 8px; 
        border-left: 3px solid #667eea; 
      }
      .skill-title { font-weight: 700; color: #667eea; margin-bottom: 8px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 class="name">${data.personalInfo?.fullName || 'Your Name'}</h1>
        <div class="contact">${data.personalInfo?.email || ''} • ${data.personalInfo?.phone || ''}</div>
        ${data.address ? `<div class="contact">${data.address}</div>` : ''}
        ${data.linkedin ? `<div class="contact">${data.linkedin}</div>` : ''}
        ${data.website ? `<div class="contact">${data.website}</div>` : ''}
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
          <div class="skills-grid">
            ${data.technicalSkills ? `
            <div class="skill-item">
              <div class="skill-title">Technical Skills</div>
              <div>${data.technicalSkills}</div>
            </div>
            ` : ''}
            ${data.softSkills ? `
            <div class="skill-item">
              <div class="skill-title">Soft Skills</div>
              <div>${data.softSkills}</div>
            </div>
            ` : ''}
          </div>
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
      </div>
    </div>
  </body>
  </html>
  `;
}

module.exports = { generateElegantGradientTemplate };
