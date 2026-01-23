export function generateRishiTemplate(data) {
  const {
    personalInfo = {},
    experience = [],
    education = [],
    skills = [],
    projects = [],
    certifications = [],
    achievements = [],
    summary = '',
    technicalSkills = '',
    hobbies = []
  } = data;
  
  // Extract personal info
  const name = personalInfo?.fullName || personalInfo?.name || 'Your Name';
  const email = personalInfo?.email || 'email@example.com';
  const phone = personalInfo?.phone || '+00 0000000000';
  const address = personalInfo?.address || personalInfo?.location || 'Your Address';
  
  // Process skills - combine technical and general skills
  let technicalStrengthsList = [];
  if (Array.isArray(skills) && skills.length > 0) {
    technicalStrengthsList = skills;
  }
  if (technicalSkills && typeof technicalSkills === 'string') {
    const techSkillsArray = technicalSkills.split(/[\n,]/).map(s => s.trim()).filter(s => s);
    technicalStrengthsList = [...technicalStrengthsList, ...techSkillsArray];
  }
  if (technicalStrengthsList.length === 0) {
    technicalStrengthsList = ['AutoCAD', 'Revit', 'StaadPro', 'MS Office'];
  }
  
  // Process education
  const educationList = Array.isArray(education) && education.length > 0
    ? education.map(edu => ({
        degree: edu.degree || '',
        institution: edu.school || '',
        startDate: edu.startDate || '',
        endDate: edu.gradYear || edu.endDate || '',
        details: edu.gpa || ''
      }))
    : [{
        degree: 'Master of Technology - Structural Engineering',
        institution: 'Your University',
        startDate: '2018',
        endDate: 'Present',
        details: ''
      }];
  
  // Process career objective/summary
  const careerObjective = summary || 'To work for an organization which provides me the opportunity to improve my skills and knowledge to grow along with the organization\'s objectives.';
  
  // Process projects
  const projectsList = Array.isArray(projects) && projects.length > 0
    ? projects.map(proj => ({
        name: proj.name || proj.title || '',
        points: (proj.description || '').split('\n').filter(p => p.trim()).map(p => p.replace(/^[•\-]\s*/, ''))
      }))
    : [{
        name: 'Sample Project',
        points: ['Project description point 1', 'Project description point 2']
      }];
  
  // Process experience
  const experienceList = Array.isArray(experience) && experience.length > 0
    ? experience.map(exp => ({
        role: exp.jobTitle || exp.title || '',
        company: exp.company || '',
        date: `${exp.startDate || ''} - ${exp.endDate || ''}`,
        points: (exp.description || '').split('\n').filter(p => p.trim()).map(p => p.replace(/^[•\-]\s*/, ''))
      }))
    : [{
        role: 'Site Engineer (Intern)',
        company: 'Company Name',
        date: 'June 2016 - June 2016',
        points: ['Work experience point 1', 'Work experience point 2']
      }];
  
  // Process achievements
  const achievementsList = Array.isArray(achievements) && achievements.length > 0
    ? (typeof achievements[0] === 'string' ? achievements : achievements.map(a => a.description || a))
    : ['Academic achievement 1', 'Academic achievement 2'];
  
  // Process hobbies/extracurricular
  const extracurricularList = Array.isArray(hobbies) && hobbies.length > 0
    ? (typeof hobbies[0] === 'string' ? hobbies : hobbies.map(h => h.description || h))
    : ['Reading', 'Sports'];
  
  // Personal traits
  const traitsList = ['Quick learner', 'Team player', 'Problem solver'];

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name}</title>
<style>
    body {
        font-family: 'Inter', sans-serif;
        font-size: 12pt;
        line-height: 1.5;
        color: #000;
        margin: 40px;
    }

    h1 {
        font-size: 22pt;
        font-weight: 700;
        text-transform: uppercase;
        margin-bottom: 5px;
    }

    h2 {
        font-size: 13pt;
        font-weight: 700;
        text-transform: uppercase;
        border-bottom: 1px solid #000;
        padding-bottom: 4px;
        margin-top: 22px;
        margin-bottom: 12px;
    }

    .section {
        margin-bottom: 15px;
    }

    ul {
        margin-left: 20px;
        margin-top: 4px;
    }

    li {
        margin-bottom: 4px;
    }

    .subheading {
        font-weight: 600;
        font-size: 11.5pt;
        margin-bottom: 2px;
    }

    .date {
        font-style: italic;
        font-size: 11pt;
        margin-bottom: 6px;
    }

    .small {
        font-size: 11pt;
    }
</style>
</head>
<body>

<h1>${name}</h1>
<div class="small">${address}</div>
<div class="small">${phone} | ${email}</div>

<!-- EDUCATION -->
<h2>EDUCATION</h2>
<div class="section">
    ${educationList.map(edu => `
        <div class="subheading">${edu.degree}</div>
        <div class="small">${edu.institution}</div>
        <div class="date">${edu.startDate} - ${edu.endDate}</div>
        ${edu.details ? `<div class="small">${edu.details}</div>` : ''}
        <br>
    `).join('')}
</div>

<!-- CAREER OBJECTIVE -->
<h2>CAREER OBJECTIVE</h2>
<div class="section">
    <div class="small">${careerObjective}</div>
</div>

<!-- PROJECTS -->
<h2>PROJECTS</h2>
<div class="section">
    ${projectsList.map(project => `
        <div class="subheading">${project.name}</div>
        <ul>
            ${project.points.map(point => `<li>${point}</li>`).join('\n            ')}
        </ul>
        <br>
    `).join('')}
</div>

<!-- TECHNICAL STRENGTHS -->
<h2>TECHNICAL STRENGTHS</h2>
<div class="section">
    <ul>
        ${technicalStrengthsList.map(skill => `<li>${skill}</li>`).join('\n        ')}
    </ul>
</div>

<!-- WORK EXPERIENCE -->
<h2>WORK EXPERIENCE</h2>
<div class="section">
    ${experienceList.map(exp => `
        <div class="subheading">${exp.role}</div>
        <div class="small">${exp.company}</div>
        <div class="date">${exp.date}</div>
        <ul>
            ${exp.points.map(point => `<li>${point}</li>`).join('\n            ')}
        </ul>
        <br>
    `).join('')}
</div>

<!-- ACHIEVEMENTS -->
<h2>ACADEMIC ACHIEVEMENTS</h2>
<div class="section">
    <ul>
        ${achievementsList.map(achievement => `<li>${achievement}</li>`).join('\n        ')}
    </ul>
</div>

<!-- EXTRA-CURRICULAR -->
<h2>EXTRA-CURRICULAR</h2>
<div class="section">
    <ul>
        ${extracurricularList.map(activity => `<li>${activity}</li>`).join('\n        ')}
    </ul>
</div>

<!-- PERSONAL TRAITS -->
<h2>PERSONAL TRAITS</h2>
<div class="section">
    <ul>
        ${traitsList.map(trait => `<li>${trait}</li>`).join('\n        ')}
    </ul>
</div>

</body>
</html>
  `;
}
