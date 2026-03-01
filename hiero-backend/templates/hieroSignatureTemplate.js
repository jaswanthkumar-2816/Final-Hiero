// templates/hieroSignatureTemplate.js
export function generateHieroSignatureTemplate(data = {}) {
  const p = data.personalInfo || {};
  const experiences = data.experience || [];
  const education = data.education || [];
  const skillsString = data.skills || "";

  // Process skills into array if it's a string
  let skills = [];
  if (typeof skillsString === 'string') {
    skills = skillsString.split(',').map(s => ({ name: s.trim(), level: 80 }));
  } else if (Array.isArray(data.skills)) {
    skills = data.skills;
  }

  if (skills.length === 0) {
    skills = [
      { name: 'Graphic Design', level: 90 },
      { name: 'Social Media', level: 85 },
      { name: 'Web Design', level: 95 },
      { name: 'Advertising', level: 75 },
      { name: 'English', level: 80 },
      { name: 'Spanish', level: 70 }
    ];
  }

  const name = p.fullName || 'Williams Smiths';
  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts[0] || 'First';
  const lastName = nameParts.slice(1).join(' ') || 'Last';

  const initials = firstName[0] + (lastName[0] || '');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${name} — Resume</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800;900&family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --orange-accent: #f37021;
      --black-bg: #111111;
      --light-grey: #f3f3f3;
      --text-main: #111111;
      --text-muted: #555555;
      --white: #ffffff;
    }
    
    * { 
      margin: 0;
      padding: 0;
      box-sizing: border-box; 
    }
    
    @page {
      size: A4 portrait;
      margin: 0;
    }
    
    body {
      font-family: 'Poppins', sans-serif;
      margin: 0;
      padding: 0;
      color: var(--text-main);
      background: #e0e0e0; /* UI Background */
      -webkit-print-color-adjust: exact;
    }
    
    .page {
      width: 210mm;
      height: 297mm;
      display: flex;
      overflow: hidden;
      background: white;
      margin: 20px auto;
      position: relative;
    }

    @media print {
      body { background: transparent; }
      .page { margin: 0; box-shadow: none; }
    }
    
    /* Left Column (Main Content) */
    .left-col {
      width: 65%;
      height: 100%;
      background: var(--light-grey);
      padding: 60px 40px 40px 0; /* Left padding moved to sections for layout */
      display: flex;
      flex-direction: column;
      position: relative;
    }
    
    /* Right Column (Sidebar) */
    .right-col {
      width: 35%;
      height: 100%;
      background: var(--black-bg);
      color: var(--white);
      display: flex;
      flex-direction: column;
      position: relative;
    }
    
    /* Sidebar Components */
    .profile-photo {
      width: 100%;
      height: 300px; /* Rectangular grayscale placeholder */
      background: #222;
      overflow: hidden;
    }
    
    .profile-photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: grayscale(100%);
    }

    .sidebar-inner {
      padding: 40px 30px;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .name-section {
      margin-bottom: 30px;
    }

    .name-line {
      font-family: 'Montserrat', sans-serif;
      font-size: 42pt;
      font-weight: 900;
      line-height: 0.9;
      text-transform: capitalize;
      letter-spacing: -1px;
    }
    
    .name-line.last {
      display: block;
    }

    .job-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: #999;
      margin-top: 15px;
      font-weight: 700;
    }
    
    .skills-section {
      margin-top: 50px;
      margin-bottom: 40px;
    }

    .sidebar-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 11pt;
      font-weight: 800;
      margin-bottom: 25px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .skill-item {
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .skill-name {
      font-size: 8pt;
      color: #ccc;
      width: 40%;
    }
    
    .skill-bar-bg {
      height: 3px;
      background: #333;
      flex: 1;
      margin-left: 10px;
      position: relative;
    }
    
    .skill-bar-fill {
      height: 100%;
      background: var(--white);
    }
    
    .address-section {
      margin-top: auto;
      font-size: 8pt;
      color: #888;
      line-height: 1.5;
      margin-bottom: 20px;
    }

    .contact-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .contact-info {
      font-size: 8pt;
      color: #888;
    }

    .qr-box {
      width: 50px;
      height: 50px;
      border: 1px solid #333;
      background: white;
      padding: 3px;
    }
    
    .qr-inner {
      width: 100%;
      height: 100%;
      /* Simulating a QR code pattern */
      background-image: radial-gradient(#000 20%, transparent 20%), radial-gradient(#000 20%, transparent 20%);
      background-position: 0 0, 5px 5px;
      background-size: 10px 10px;
      background-color: white;
    }

    /* Left Column Components */
    .top-left-accent {
      padding-left: 40px;
      margin-bottom: 20px;
    }

    .initials-circle {
      width: 65px;
      height: 65px;
      background: var(--orange-accent);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      font-size: 18pt;
      font-family: 'Montserrat', sans-serif;
      text-transform: uppercase;
    }

    .section-content {
      padding-left: 120px; /* Space for vertical titles */
      padding-right: 40px;
      margin-bottom: 40px;
      position: relative;
    }

    .section-title-vert {
      position: absolute;
      left: 40px;
      top: 0;
      width: 30px;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .rotated-text {
      transform: rotate(-90deg) translateY(-100%);
      transform-origin: top left;
      font-family: 'Montserrat', sans-serif;
      font-size: 16pt;
      font-weight: 900;
      text-transform: uppercase;
      color: #222;
      white-space: nowrap;
      position: absolute;
      top: 100%; /* Start from bottom of the header space */
    }

    .vert-line {
      width: 1px;
      background: #ccc;
      height: 80%;
      margin-top: 20px;
    }

    /* About Section is different */
    .about-section {
      padding-left: 120px;
      padding-right: 40px;
      margin-bottom: 60px;
    }

    .about-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 12pt;
      font-weight: 800;
      margin-bottom: 15px;
      text-transform: uppercase;
    }

    .about-text {
      font-size: 9pt;
      line-height: 1.6;
      color: var(--text-muted);
    }

    /* Experience Specific */
    .experience-section {
      padding-top: 40px;
      padding-bottom: 40px;
      margin-top: 20px;
    }

    .experience-accent-bg {
      position: absolute;
      left: 0;
      top: 50px;
      width: 140px;
      height: 200px;
      background: var(--orange-accent);
      z-index: 0;
    }

    .experience-section .rotated-text {
      color: #111;
      z-index: 1;
    }

    .timeline-entry {
      margin-bottom: 30px;
      position: relative;
      z-index: 1;
    }

    .timeline-entry h4 {
      font-family: 'Montserrat', sans-serif;
      font-size: 11pt;
      font-weight: 800;
      margin-bottom: 4px;
    }

    .timeline-year {
      font-size: 9pt;
      font-weight: 700;
      color: #111;
      margin-bottom: 8px;
    }

    .timeline-desc {
      font-size: 9pt;
      line-height: 1.5;
      color: var(--text-muted);
    }

    .bottom-footer {
      margin-top: auto;
      padding: 0 40px 40px 120px;
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .social-row {
      display: flex;
      gap: 15px;
      font-size: 9pt;
      font-weight: 800;
      text-transform: uppercase;
      font-family: 'Montserrat', sans-serif;
    }
    
    .social-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .social-icon { width: 14px; height: 14px; opacity: 0.7; }

  </style>
</head>
<body>
  <div class="page">
    <div class="left-col">
      <div class="top-left-accent">
        <div class="initials-circle">${initials}</div>
      </div>

      <div class="about-section">
        <h2 class="about-title">About Me</h2>
        <div class="about-text">
          ${p.summary || "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."}
        </div>
      </div>

      <div class="section-content education-section">
        <div class="section-title-vert">
          <div class="rotated-text" style="top: 180px;">Education</div>
          <div class="vert-line" style="margin-top: 190px;"></div>
        </div>
        
        ${education.length > 0 ? education.map(edu => `
          <div class="timeline-entry">
            <h4>${edu.school || "Your School"}</h4>
            <div class="timeline-year">Year of ${edu.gradYear || edu.year || "2009-2012"}</div>
            <div class="timeline-desc">${edu.description || "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}</div>
          </div>
        `).join('') : `
          <div class="timeline-entry">
            <h4>Your School</h4>
            <div class="timeline-year">Year of 2009-2012</div>
            <div class="timeline-desc">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</div>
          </div>
          <div class="timeline-entry">
            <h4>Your School</h4>
            <div class="timeline-year">Year of 2012-2014</div>
            <div class="timeline-desc">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</div>
          </div>
        `}
      </div>

      <div class="section-content experience-section">
        <div class="experience-accent-bg"></div>
        <div class="section-title-vert">
          <div class="rotated-text" style="top: 185px;">Experience</div>
          <div class="vert-line" style="margin-top: 195px;"></div>
        </div>
        
        ${experiences.length > 0 ? experiences.map(exp => `
          <div class="timeline-entry">
            <h4>${exp.jobTitle || exp.title || "Your Experience"}</h4>
            <div class="timeline-year">${exp.startDate || exp.start || "2016-2017"} - ${exp.endDate || exp.end || "Present"}</div>
            <div class="timeline-desc">${exp.description || "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}</div>
          </div>
        `).join('') : `
          <div class="timeline-entry">
            <h4>Your Experience</h4>
            <div class="timeline-year">2016-2017</div>
            <div class="timeline-desc">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</div>
          </div>
          <div class="timeline-entry">
            <h4>Your Experience</h4>
            <div class="timeline-year">2017-2018</div>
            <div class="timeline-desc">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</div>
          </div>
        `}
      </div>

      <footer class="bottom-footer">
        <div style="font-size: 9pt; font-weight: 800; text-transform: uppercase;">Social Media</div>
        <div class="social-row">
          <div class="social-item"><i class="fab fa-instagram"></i> @yourname</div>
          <div class="social-item"><i class="fab fa-facebook-f"></i> Your Name</div>
          <div class="social-item"><i class="fab fa-twitter"></i> @yourname</div>
        </div>
      </footer>
    </div>
    
    <div class="right-col">
      <div class="profile-photo">
        <img src="${p.profilePhoto || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop"}" alt="Profile">
      </div>
      
      <div class="sidebar-inner">
        <div class="name-section">
          <div class="name-line">${firstName}</div>
          <div class="name-line last">${lastName}</div>
          <div class="job-title">${p.role || p.headline || "GRAPHIC DESIGNER"}</div>
        </div>
        
        <div class="skills-section">
          <h3 class="sidebar-title">Skills</h3>
          ${skills.map(skill => `
            <div class="skill-item">
              <span class="skill-name">${skill.name}</span>
              <div class="skill-bar-bg">
                <div class="skill-bar-fill" style="width: ${skill.level}%"></div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="address-section">
          <h3 class="sidebar-title" style="margin-bottom: 10px; font-size: 9pt;">Address</h3>
          <p>${p.address || "123 Street Name, City, Country"}</p>
        </div>
        
        <div class="contact-section">
          <div class="contact-info">
            <h3 class="sidebar-title" style="margin-bottom: 10px; font-size: 9pt;">Contact</h3>
            <p>${p.email || "username@email.com"}</p>
            <p>${p.phone || "+1234567890"}</p>
          </div>
          <div class="qr-box">
            <div class="qr-inner"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</body>
</html>`;
}
