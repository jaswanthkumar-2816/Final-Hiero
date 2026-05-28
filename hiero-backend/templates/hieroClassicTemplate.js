// g:\pro\Final-Hiero\hiero-backend\templates\hieroClassicTemplate.js
export function generateHieroClassicTemplate(data = {}) {
  const p = data.personalInfo || {};
  const experiences = data.experience || [];
  const education = data.education || [];
  const skillsRaw = data.skills || "";
  const references = data.references || [];
  const summary = data.summary || p.summary || p.career_summary || "";

  // Process skills
  let skills = [];
  if (typeof skillsRaw === 'string') {
    skills = skillsRaw.split(',').map(s => s.trim()).filter(Boolean);
  } else if (Array.isArray(skillsRaw)) {
    skills = skillsRaw;
  }

  // Fallback data for empty sections
  const name = p.fullName || 'Daniel Jones';
  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts[0] || 'Daniel';
  const lastName = nameParts.slice(1).join(' ') || 'Jones';
  const role = p.roleTitle || 'Photographer';
  const userPhoto = p.profilePhoto || 'https://via.placeholder.com/400x500';

  const displaySummary = summary || "Experienced and innovative professional bringing forth a true passion for capturing life's moments through a lens. Committed to the ultimate satisfaction of a client, and adept in using the most up-to-date photographic hardware and software. Bringing forth over five years of experience working as a Freelance Photographer on over 200 projects. Leveraging a background in Commercial Photography and Fine art Photography, and a dedication to world class customer service.";

  const displayExperiences = experiences.length > 0 ? experiences : [
    {
      jobTitle: 'Photographer',
      company: 'Worldly Pictures',
      location: 'Vancouver',
      startDate: 'JUNE 2019',
      endDate: 'OCTOBER 2019',
      description: 'Consulted with clients regarding photo needs and desires.\nPresented options based on the style, needs, desires, and budgets of clients.\nOffered fresh ideas and concepts, in addition to classic styles.\nDeveloped and printed exposed film.\nEnhanced, edited, and retouched images using a variety of programs.\nCreated slide shows and thematic videos for special events.'
    },
    {
      jobTitle: 'Photographer Assistant',
      company: 'John Rey Photography',
      location: 'Vancouver',
      startDate: 'MARCH 2011',
      endDate: 'MAY 2019',
      description: 'Assisted Photographer with set-up and lighting prior to a shoot.\nHeld lightweight reflectors during some shoots.\nCommunicated with clients and addressed questions and concerns.\nHandled paperwork, billing, and scheduling.\nBrought forth a positive attitude and problem-solving abilities.'
    }
  ];

  const displayEducation = education.length > 0 ? education : [
    {
      degree: 'Bachelor of Marketing',
      institution: 'McGill University',
      location: 'Montreal',
      gradYear: 'MAY 2019',
      startDate: 'AUGUST 2007'
    },
    {
      degree: 'High School Diploma',
      institution: 'Lakeside Academy',
      location: 'Montreal',
      gradYear: 'JUNE 2019',
      startDate: 'SEPTEMBER 2003'
    }
  ];

  const displaySkills = skills.length > 0 ? skills : [
    'Outstanding Technical Skills',
    'Digital and Non-digital Cameras',
    'Marketing Strategy',
    'Project Management',
    'Creativity'
  ];

  const displayReferences = references.length > 0 ? references : [
    {
      name: 'Christine Faulkner',
      organization: 'McGill University',
      email: 'cfaulkner@mcgill.edu',
      phone: '514-229-2938'
    },
    {
      name: 'John Rey',
      organization: 'John Rey Photography',
      email: 'rey.john@gmail.com',
      phone: '604-887-4382'
    }
  ];

  const esc = (s = '') => String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #e7e1d5;
      --primary-green: #2f4f46;
      --secondary-charcoal: #2b2b2b;
      --accent-green: #355e4a;
      --accent-mustard: #d4b24c;
      --text-muted: #666666;
      --sidebar-width: 35%;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A4 portrait; margin: 0; }
    
    body { 
      font-family: 'Poppins', sans-serif; 
      margin: 0; 
      padding: 0; 
      background: #f0f0f0; 
      color: var(--secondary-charcoal);
      -webkit-print-color-adjust: exact;
    }
    
    .page { 
      width: 210mm; 
      height: 297mm; 
      max-height: 297mm;
      background: var(--bg-color); 
      margin: 0 auto; 
      position: relative; 
      display: flex;
      overflow: hidden;
      box-sizing: border-box;
    }

    @media print {
      body { background: none; }
      .page { margin: 0; box-shadow: none; page-break-after: avoid; }
    }

    /* Decorative Shapes */
    .shape { position: absolute; pointer-events: none; z-index: 0; }
    
    .shape-bottom-left {
      bottom: -30mm;
      left: -15mm;
      width: 100mm;
      height: 80mm;
      background: var(--accent-mustard);
      border-radius: 50% 50% 40% 60% / 60% 40% 60% 40%;
      transform: rotate(15deg);
      opacity: 0.8;
      position: absolute;
    }

    .shape-bottom-center {
      bottom: -35mm;
      left: 20mm;
      width: 120mm;
      height: 90mm;
      background: var(--accent-green);
      border-radius: 60% 40% 50% 50% / 50% 50% 40% 60%;
      transform: rotate(-5deg);
      opacity: 1;
      position: absolute;
    }

    .shape-right-middle {
      right: -20mm;
      top: 50%;
      width: 60mm;
      height: 80mm;
      background: #f1ebd8;
      border-radius: 30% 70% 40% 60% / 60% 30% 70% 40%;
      opacity: 0.7;
    }

    .shape-photo-bg {
      top: -20mm;
      right: -20mm;
      width: 110mm;
      height: 130mm;
      background: var(--accent-green);
      border-radius: 40% 60% 30% 70% / 70% 30% 60% 40%;
      opacity: 0.15;
    }

    .content-wrapper {
      position: relative;
      z-index: 1;
      display: flex;
      width: 100%;
      padding: 15mm;
    }

    .left-col {
      width: 65%;
      padding-right: 15mm;
    }

    .right-col {
      width: 35%;
    }

    /* TYPOGRAPHY */
    .name-container {
      margin-top: 10mm;
      margin-bottom: 5mm;
    }

    h1 {
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      font-size: 44pt;
      line-height: 0.85;
      color: var(--primary-green);
      text-transform: capitalize;
    }

    .summary {
      font-size: 9.3pt;
      line-height: 1.45;
      color: var(--secondary-charcoal);
      text-align: justify;
      margin-bottom: 5mm;
    }

    .section-title {
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 14pt;
      color: var(--secondary-charcoal);
      margin-bottom: 3.5mm;
      margin-top: 3.5mm;
    }

    .entry {
      margin-bottom: 4mm;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .entry-header {
      font-weight: 700;
      font-size: 11pt;
      color: var(--secondary-charcoal);
      display: inline-block;
    }

    .entry-meta {
      font-size: 8pt;
      font-weight: 600;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
      margin-bottom: 4px;
    }

    .entry-list {
      list-style: none;
      padding-left: 0;
    }

    .entry-list li {
      font-size: 9.5pt;
      color: #444;
      position: relative;
      padding-left: 15px;
      margin-bottom: 3px;
    }

    .entry-list li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: var(--accent-mustard);
    }

    /* RIGHT COLUMN STYLES */
    .photo-area {
      margin-bottom: 15mm;
      position: relative;
    }
    
    .profile-photo {
      width: 100%;
      height: 60mm;
      object-fit: cover;
      border-radius: 40px;
      background-color: #f1ebd8;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    .sidebar-section {
      margin-bottom: 8mm;
    }

    .sidebar-title {
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 13pt;
      color: var(--secondary-charcoal);
      margin-bottom: 3mm;
    }

    .contact-item {
      margin-bottom: 4mm;
    }

    .contact-text {
      font-size: 9pt;
      line-height: 1.5;
      color: #555;
    }

    .contact-text b {
      color: var(--secondary-charcoal);
    }

    .skills-section {
      margin-bottom: 8mm;
    }

    .skills-grid {
      display: grid;
      gap: 2mm;
      row-gap: 3mm;
      page-break-inside: avoid;
    }

    .skills-grid-2 {
      grid-template-columns: repeat(2, 1fr);
    }

    .skills-grid-3 {
      grid-template-columns: repeat(3, 1fr);
    }

    .skill-item {
      display: flex;
      align-items: center;
      font-size: 8.5pt;
      color: #444;
      line-height: 1.2;
      border-bottom: 1px solid rgba(0,0,0,0.05);
      padding-bottom: 1.5mm;
    }

    .skill-bullet {
      width: 4px;
      height: 4px;
      background: var(--accent-mustard);
      border-radius: 50%;
      margin-right: 2mm;
      flex-shrink: 0;
    }

    .reference-item {
      margin-bottom: 6mm;
    }

    .ref-name {
      font-weight: 700;
      font-size: 10pt;
      color: var(--secondary-charcoal);
    }

    .ref-detail {
        font-size: 9pt;
        color: #666;
        line-height: 1.4;
    }

  </style>
</head>
<body>
  <div class="page">
    <div class="shape shape-bottom-left"></div>
    <div class="shape shape-bottom-center"></div>
    <div class="shape shape-right-middle"></div>
    <div class="shape shape-photo-bg"></div>

    <div class="content-wrapper">
      <div class="left-col">
        <div class="name-container">
          <h1>${esc(firstName)}<br>${esc(lastName)}</h1>
        </div>
        
        <div class="summary">
          ${esc(displaySummary)}
        </div>

        <div class="section-title">Employment History</div>
        ${displayExperiences.map(exp => `
          <div class="entry">
            <div class="entry-header">${esc(exp.jobTitle)} at ${esc(exp.company)}${exp.location ? `, ${esc(exp.location)}` : ''}</div>
            <div class="entry-meta">${esc(exp.startDate)} — ${esc(exp.endDate || 'PRESENT')}</div>
            <ul class="entry-list">
              ${(exp.description || "").split('\n').filter(Boolean).map(line => `<li>${esc(line.replace(/^[•\-\*]\s*/, ''))}</li>`).join('')}
            </ul>
          </div>
        `).join('')}

        <div class="section-title">Education</div>
        ${displayEducation.map(edu => `
          <div class="entry">
            <div class="entry-header">${esc(edu.degree)} at ${esc(edu.institution)}${edu.location ? `, ${esc(edu.location)}` : ''}</div>
            <div class="entry-meta">${esc(edu.startDate || '')}${edu.startDate ? ' — ' : ''}${esc(edu.gradYear || '')}</div>
          </div>
        `).join('')}
      </div>

      <div class="right-col">
        <div class="photo-area">
          <img src="${userPhoto}" alt="Profile" class="profile-photo">
        </div>

        <div class="sidebar-section">
          <div class="sidebar-title">Details</div>
          <div class="contact-item">
            <div class="contact-text">${esc(p.address || '1977 Coleman Blvd, Vancouver, B.C. V6J 2H5, United States')}</div>
            <div class="contact-text">${esc(p.phone || '(607) 898-8493')}</div>
            <div class="contact-text" style="color: var(--primary-green); font-weight: 500;">${esc(p.email || 'jone_esda43x@gmail.com')}</div>
          </div>
        </div>

        <div class="sidebar-section skills-section">
          <div class="sidebar-title">Expertise</div>
          <div class="skills-grid ${displaySkills.length > 10 ? 'skills-grid-3' : 'skills-grid-2'}">
            ${displaySkills.map((skill) => `
              <div class="skill-item">
                <div class="skill-bullet"></div>
                ${esc(skill)}
              </div>
            `).join('')}
          </div>
        </div>

        <div class="sidebar-section">
          <div class="sidebar-title">References</div>
          ${displayReferences.map(ref => `
            <div class="reference-item">
              <div class="ref-name">${esc(ref.name)} from ${esc(ref.organization)}</div>
              <div class="ref-detail">${esc(ref.email)}</div>
              <div class="ref-detail">${esc(ref.phone)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
