export function generateHemanthTemplate(data) {
  const {
    personalInfo = {},
    experience = [],
    education = [],
    skills = [],
    projects = [],
    certifications = []
  } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${personalInfo.name || 'Resume'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: A4;
      margin: 0;
    }
    
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      background: #1a1a1a;
      color: #e0e0e0;
      font-size: 11pt;
    }
    
    .container {
      display: flex;
      min-height: 100vh;
      max-width: 210mm;
      margin: 0 auto;
      background: #1a1a1a;
    }
    
    .sidebar {
      width: 30%;
      background: #0d0d0d;
      padding: 40px 25px;
      border-right: 3px solid #00ff88;
    }
    
    .main-content {
      width: 70%;
      padding: 40px 35px;
      background: #1a1a1a;
    }
    
    .header {
      margin-bottom: 30px;
      border-bottom: 2px solid #00ff88;
      padding-bottom: 20px;
    }
    
    .name {
      font-size: 32pt;
      font-weight: 700;
      color: #00ff88;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .title {
      font-size: 14pt;
      color: #b0b0b0;
      font-weight: 300;
      margin-bottom: 15px;
    }
    
    .summary {
      color: #d0d0d0;
      font-size: 10pt;
      line-height: 1.7;
    }
    
    .section {
      margin-bottom: 28px;
    }
    
    .section-title {
      font-size: 13pt;
      font-weight: 700;
      margin-bottom: 15px;
      color: #00ff88;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      position: relative;
      padding-bottom: 8px;
    }
    
    .section-title::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 50px;
      height: 2px;
      background: #00ff88;
    }
    
    .contact-item {
      margin-bottom: 10px;
      font-size: 9.5pt;
      color: #b0b0b0;
      display: flex;
      align-items: center;
      word-break: break-word;
    }
    
    .contact-item::before {
      content: '▸';
      color: #00ff88;
      margin-right: 8px;
      font-weight: bold;
    }
    
    .skill-category {
      margin-bottom: 15px;
    }
    
    .skill-item {
      background: #2a2a2a;
      border: 1px solid #00ff88;
      padding: 5px 10px;
      margin: 5px 3px;
      border-radius: 4px;
      display: inline-block;
      font-size: 9pt;
      color: #00ff88;
      font-weight: 500;
    }
    
    .experience-item, .education-item, .project-item {
      margin-bottom: 22px;
      page-break-inside: avoid;
      border-left: 2px solid #2a2a2a;
      padding-left: 15px;
      position: relative;
    }
    
    .experience-item::before, .education-item::before, .project-item::before {
      content: '';
      position: absolute;
      left: -6px;
      top: 5px;
      width: 10px;
      height: 10px;
      background: #00ff88;
      border-radius: 50%;
      border: 2px solid #1a1a1a;
    }
    
    .job-title {
      font-size: 12pt;
      font-weight: 700;
      color: #00ff88;
      margin-bottom: 4px;
    }
    
    .company {
      font-size: 11pt;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 3px;
    }
    
    .date {
      font-size: 9pt;
      color: #808080;
      font-style: italic;
      margin-bottom: 8px;
    }
    
    .description {
      color: #c0c0c0;
      font-size: 10pt;
      line-height: 1.7;
    }
    
    .description ul {
      margin-left: 18px;
      margin-top: 6px;
    }
    
    .description li {
      margin-bottom: 5px;
    }
    
    .cert-item {
      background: #2a2a2a;
      padding: 12px;
      margin-bottom: 10px;
      border-radius: 6px;
      border-left: 3px solid #00ff88;
    }
    
    .cert-name {
      font-weight: 600;
      color: #ffffff;
      font-size: 10pt;
    }
    
    .cert-issuer {
      font-size: 9pt;
      color: #b0b0b0;
      margin-top: 3px;
    }
    
    .tech-tags {
      margin-top: 8px;
    }
    
    .tech-tag {
      background: #2a2a2a;
      color: #00ff88;
      padding: 3px 8px;
      margin-right: 5px;
      border-radius: 3px;
      font-size: 8.5pt;
      display: inline-block;
      margin-top: 3px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Sidebar -->
    <div class="sidebar">
      <!-- Contact Information -->
      <div class="section">
        <div class="section-title">Contact</div>
        ${personalInfo.email ? `<div class="contact-item">${personalInfo.email}</div>` : ''}
        ${personalInfo.phone ? `<div class="contact-item">${personalInfo.phone}</div>` : ''}
        ${personalInfo.location ? `<div class="contact-item">${personalInfo.location}</div>` : ''}
        ${personalInfo.linkedin ? `<div class="contact-item">${personalInfo.linkedin}</div>` : ''}
        ${personalInfo.github ? `<div class="contact-item">${personalInfo.github}</div>` : ''}
        ${personalInfo.website ? `<div class="contact-item">${personalInfo.website}</div>` : ''}
      </div>
      
      <!-- Skills -->
      ${skills.length > 0 ? `
      <div class="section">
        <div class="section-title">Skills</div>
        <div class="skill-category">
          ${skills.map(skill => `<span class="skill-item">${skill}</span>`).join('')}
        </div>
      </div>
      ` : ''}
      
      <!-- Certifications -->
      ${certifications.length > 0 ? `
      <div class="section">
        <div class="section-title">Certs</div>
        ${certifications.map(cert => `
          <div class="cert-item">
            <div class="cert-name">${cert.name || cert}</div>
            ${cert.issuer ? `<div class="cert-issuer">${cert.issuer}</div>` : ''}
            ${cert.date ? `<div class="cert-issuer">${cert.date}</div>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}
    </div>
    
    <!-- Main Content -->
    <div class="main-content">
      <!-- Header -->
      <div class="header">
        <div class="name">${personalInfo.name || 'Your Name'}</div>
        <div class="title">${personalInfo.title || 'Professional Title'}</div>
        ${personalInfo.summary ? `<div class="summary">${personalInfo.summary}</div>` : ''}
      </div>
      
      <!-- Experience -->
      ${experience.length > 0 ? `
      <div class="section">
        <div class="section-title">Experience</div>
        ${experience.map(job => `
          <div class="experience-item">
            <div class="job-title">${job.position || job.title || 'Position'}</div>
            <div class="company">${job.company || 'Company'}</div>
            <div class="date">${job.startDate || ''} - ${job.endDate || 'Present'}</div>
            ${job.description ? `
              <div class="description">
                ${Array.isArray(job.description) 
                  ? `<ul>${job.description.map(item => `<li>${item}</li>`).join('')}</ul>`
                  : job.description
                }
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}
      
      <!-- Projects -->
      ${projects.length > 0 ? `
      <div class="section">
        <div class="section-title">Projects</div>
        ${projects.map(project => `
          <div class="project-item">
            <div class="job-title">${project.name || 'Project Name'}</div>
            ${project.date ? `<div class="date">${project.date}</div>` : ''}
            ${project.description ? `
              <div class="description">
                ${Array.isArray(project.description) 
                  ? `<ul>${project.description.map(item => `<li>${item}</li>`).join('')}</ul>`
                  : project.description
                }
              </div>
            ` : ''}
            ${project.technologies ? `
              <div class="tech-tags">
                ${project.technologies.split(',').map(tech => `<span class="tech-tag">${tech.trim()}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}
      
      <!-- Education -->
      ${education.length > 0 ? `
      <div class="section">
        <div class="section-title">Education</div>
        ${education.map(edu => `
          <div class="education-item">
            <div class="job-title">${edu.degree || 'Degree'}</div>
            <div class="company">${edu.institution || edu.school || 'Institution'}</div>
            <div class="date">${edu.startDate || ''} - ${edu.endDate || edu.graduationDate || 'Present'}</div>
            ${edu.gpa ? `<div class="description">GPA: ${edu.gpa}</div>` : ''}
            ${edu.description ? `<div class="description">${edu.description}</div>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
  `;
}
