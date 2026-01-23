export function generateRishiTemplate(data) {
  const {
    personalInfo = {},
    education = [],
    experience = [],
    projects = [],
    achievements = [],
    extracurricular = [],
    traits = [],
    careerObjective = '',
    modelingSkills = '',
    softwareSkills = ''
  } = data;

  // === PERSONAL INFO ===
  const name = personalInfo?.fullName || personalInfo?.name || 'RISHI SHAH';
  const address = personalInfo?.address || personalInfo?.location || '156 Kasturi, Balajinagar, Sangli 416416';
  const phone = personalInfo?.phone || '9975808780';
  const email = personalInfo?.email || 'rishishah105@gmail.com';

  // === CAREER OBJECTIVE ===
  const objective = careerObjective || 
    `To work for an organization which provides me the opportunity to improve my skills and knowledge to grow along with the organization objective.`;

  // === EDUCATION ===
  const educationList = Array.isArray(education) && education.length > 0
    ? education.map(edu => ({
        institute: edu.institute || edu.school || '',
        dates: edu.dates || `${edu.startDate || ''} - ${edu.endDate || ''}`.trim(),
        degree: edu.degree || '',
        details: edu.details || edu.gpa || ''
      }))
    : [
        { institute: 'Veermata Jijabai Technological Institute, Mumbai', dates: 'August 2018 - Present', degree: 'Master in Technology', details: 'Department of Structural Engineering' },
        { institute: 'Maharashtra Institute of Technology, Pune', dates: 'July 2013 - June 2017', degree: 'Bachelor of Engineering, Civil.', details: 'Overall Percentage: 68.14' }
      ];

  // === PROJECTS ===
  const projectsList = Array.isArray(projects) && projects.length > 0
    ? projects.map(p => ({ title: p.title || p.name || '', description: p.description || '' }))
    : [
        { title: 'Dynamic Analysis of Buckling Restrained Braces', description: 'The project aims at designing and fabrication of two Buckling Restrained Braces which were analyzed under dynamic loading. As alternative for conventional braces, these BRBs are also beneficial for seismic retro-fitting in RCC and steel structures.' },
        { title: 'Indirect Model Analysis of Structures', description: 'Presented a Seminar on Indirect Model Analysis, explaining the method to compute response of Prototype from the Influence lines obtained from Model. Use of Muller Breslau Principle in Indirect Model Analysis and the Similitude between prototype and model.' },
        { title: 'Microtunneling', description: 'Presented a seminar on Micro Tunneling, explaining its advantages over conventional method of drainage laying systems. Analysis considering direct and indirect cost of micro tunneling was also discussed.' }
      ];

  // === TECHNICAL STRENGTHS ===
  const modeling = modelingSkills || 'AutoCad, Revit, StaadPro';
  const software = softwareSkills || 'MS Office, Latex';

  // === WORK EXPERIENCE ===
  const experienceList = Array.isArray(experience) && experience.length > 0
    ? experience.map(exp => ({
        company: exp.company || '',
        date: exp.date || exp.dates || '',
        role: exp.role || exp.title || '',
        points: Array.isArray(exp.points) ? exp.points : (exp.description || '').split('\n').map(s => s.trim()).filter(Boolean)
      }))
    : [
        { company: 'SJ Contracts, Pune', date: 'June 2016', role: 'Site Engineer', points: ['On-site internship under this leading construction company. Learned and implemented various aspects such as quantity estimation, labour management and safety precautions.'] }
      ];

  // === ACADEMIC ACHIEVEMENTS ===
  const achievementsList = Array.isArray(achievements) && achievements.length > 0
    ? (typeof achievements[0] === 'string' ? achievements : achievements.map(a => a.text || a.description || a))
    : [
        'Runners up in B.G.Shirke Vidyarthi Competition for Innovative Project organized by Pune Construction Engineering Research Foundation in January 2018',
        'Won First Prize in Model Making Competition Organized by Symbiosis Institute of Technology, Pune.'
      ];

  // === EXTRA-CURRICULAR & TRAITS ===
  const extraList = Array.isArray(extracurricular) && extracurricular.length > 0
    ? (typeof extracurricular[0] === 'string' ? extracurricular : extracurricular.map(e => e.text || e.activity || e))
    : [
        'Co-Organized Nirmitee 2017 - a National Symposium of Civil Department of MIT, Pune',
        'Attended a workshop on Autodesk Revit at IIT Bombay in 2014.',
        'Winner of Inter Departmental Football Competition 2015.',
        'Member of the Rotaract Club Of Pune Pride from 2014 to 2017.',
        'Worked for a start-up company Named OUST as a Regional Marketing Manager'
      ];

  const traitsList = Array.isArray(traits) && traits.length > 0
    ? (typeof traits[0] === 'string' ? traits : traits.map(t => t.text || t.trait || t))
    : [
        'Highly motivated and eager to learn new things.',
        'Strong motivational and leadership skills.',
        'Ability to work as an individual as well as in group.'
      ];

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} - Resume</title>
  <style>
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.4;
      color: #000;
      background: #fff;
    }
    .a4-page {
      width: 21cm;
      height: 29.7cm;
      padding: 1.5cm 1.8cm;
      page-break-after: always;
      position: relative;
    }
    h1 {
      font-size: 20pt;
      text-align: center;
      margin-bottom: 8pt;
      font-weight: bold;
    }
    .contact {
      text-align: center;
      font-size: 10pt;
      margin-bottom: 20pt;
    }
    .contact a { color: #000; text-decoration: none; }
    h2 {
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 1px solid #000;
      padding-bottom: 3pt;
      margin: 18pt 0 10pt 0;
    }
    .section { margin-bottom: 16pt; }
    .entry { margin-bottom: 12pt; }
    .entry h3 {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 2pt;
    }
    .date {
      font-size: 10pt;
      float: right;
      font-style: normal;
    }
    .clear { clear: both; }
    ul { margin: 6pt 0 0 20pt; }
    ul li { margin-bottom: 3pt; font-size: 11pt; }
    .skills-table {
      width: 100%;
      margin-top: 6pt;
      font-size: 11pt;
    }
    .skills-table td {
      vertical-align: top;
      padding: 0;
    }
    .skills-table .label {
      font-weight: bold;
      width: 35%;
      padding-right: 10pt;
    }
    .extra li { list-style-type: disc; }

    @media print {
      .a4-page { page-break-after: always; }
      body { margin: 0; }
    }
  </style>
</head>
<body>
  <!-- PAGE 1 -->
  <div class="a4-page">
    <h1>${name}</h1>
    <div class="contact">
      ${address}<br>
      (+91)${phone} <a href="mailto:${email}">${email}</a>
    </div>

    <h2>EDUCATION</h2>
    <div class="section">
      ${educationList.map(edu => `
        <div class="entry">
          <h3>${edu.institute}</h3>
          <div class="date">${edu.dates}</div>
          <div class="clear"></div>
          ${edu.degree}<br>
          ${edu.details}
        </div>
      `).join('')}
    </div>

    <h2>CARRIER OBJECTIVE</h2>
    <div class="section">
      ${objective}
    </div>

    <h2>PROJECTS</h2>
    <div class="section">
      ${projectsList.map(proj => `
        <div class="entry">
          <h3>${proj.title}</h3>
          ${proj.description.replace(/\n/g, '<br>')}
        </div>
      `).join('')}
    </div>

    <h2>TECHNICAL STRENGTHS</h2>
    <div class="section">
      <table class="skills-table">
        <tr><td class="label">Modeling and Analysis</td><td>${modeling}</td></tr>
        <tr><td class="label">Software &amp; Tools</td><td>${software}</td></tr>
      </table>
    </div>
  </div>

  <!-- PAGE 2 -->
  <div class="a4-page">
    <h2>WORK EXPERIENCE</h2>
    <div class="section">
      ${experienceList.map(exp => `
        <div class="entry">
          <h3>${exp.company}</h3>
          <div class="date">${exp.date}</div>
          <div class="clear"></div>
          <em>${exp.role}</em>
          <ul>
            ${exp.points.map(point => `<li>${point}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>

    <h2>ACADEMIC ACHIEVEMENTS</h2>
    <div class="section">
      <ul>
        ${achievementsList.map(ach => `<li>${ach}</li>`).join('')}
      </ul>
    </div>

    <h2>EXTRA-CURRICULAR</h2>
    <div class="section">
      <ul class="extra">
        ${extraList.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>

    <h2>PERSONAL TRAITS</h2>
    <div class="section">
      <ul>
        ${traitsList.map(trait => `<li>${trait}</li>`).join('')}
      </ul>
    </div>
  </div>
</body>
</html>
  `;
}
