const esc = (s = '') => String(s || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

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

  const PRIMARY   = '#0f4c81'; // Royal Blue Accent
  const BLACK     = '#000000'; // Black for headers and labels
  const TEXT_DARK = '#111827'; // Off-black for main text
  const ACCENT    = '#d97706'; // Orange accent for tips and guidelines
  const WHITE     = '#FFFFFF';

  const name = personalInfo?.fullName || personalInfo?.name || 'Jason Bourne';
  const roleTitle = personalInfo?.roleTitle || 'Recruiter';

  const phoneVal    = personalInfo?.phone || '+91 9123456780';
  const emailVal    = personalInfo?.email || 'jason.bourne@email.com';
  const linkedinVal = personalInfo?.linkedin || 'linkedin.com/jason-bourne';
  const githubVal   = personalInfo?.github || 'github.com/jason-bourne';
  const websiteVal  = personalInfo?.website || 'Jason-bourne.netlify.com';
  const addressVal  = personalInfo?.address || personalInfo?.location || 'New York, US';

  const summary = careerObjective || data.summary || '';
  const isDefaultSummary = !summary || summary.toLowerCase().includes('results-driven professional') || summary.toLowerCase().includes('aiml undergraduate');
  const summaryHTML = `
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; margin-top:10pt; margin-bottom:5pt;">
      <tr>
        <td style="font-family:Arial,sans-serif; font-size:12pt; font-weight:bold; color:${PRIMARY}; text-transform:uppercase; padding-bottom:2pt;">
          SUMMARY
        </td>
      </tr>
      <tr>
        <td bgcolor="${PRIMARY}" style="background-color:${PRIMARY}; height:1.5pt; line-height:1px; font-size:1px;">&nbsp;</td>
      </tr>
    </table>
    <div style="font-family:Arial,sans-serif; font-size:9.5pt; line-height:1.4; text-align:justify; margin-top:4pt; margin-bottom:8pt;">
      ${isDefaultSummary 
        ? `<span style="color:${ACCENT}; font-weight:bold;">Add Years of Experience, Primary Skill Sets and Stream you are looking for Job into and other relevant Information, 2-3 points</span>`
        : `<span style="color:${TEXT_DARK};">${esc(summary)}</span>`
      }
    </div>
  `;

  // Skills
  const techSkillsList = modelingSkills || (Array.isArray(data.skills) ? data.skills.join(', ') : data.skills) || 'Recruitment Software Proficiency, Online Search and Sourcing, Job Posting and Advertisement, Screening and Filtering';
  const softSkillsList = softwareSkills || (Array.isArray(traits) ? traits.join(', ') : traits) || 'Strategic Hiring Planning, Talent Pipelining and Forecasting, Employee Relations and Management, Compliance and Regulatory Affairs, Client, and Stakeholder Management';

  const skillsetHTML = `
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; margin-top:10pt; margin-bottom:5pt;">
      <tr>
        <td style="font-family:Arial,sans-serif; font-size:12pt; font-weight:bold; color:${PRIMARY}; text-transform:uppercase; padding-bottom:2pt;">
          SKILLSET
        </td>
      </tr>
      <tr>
        <td bgcolor="${PRIMARY}" style="background-color:${PRIMARY}; height:1.5pt; line-height:1px; font-size:1px;">&nbsp;</td>
      </tr>
    </table>
    <div style="font-family:Arial,sans-serif; font-size:9.5pt; line-height:1.4; margin-top:4pt; margin-bottom:8pt; color:${TEXT_DARK};">
      <div style="margin-bottom:3pt;"><strong>Technical Skills:</strong> ${esc(techSkillsList)}</div>
      <div><strong>Business Skills:</strong> ${esc(softSkillsList)}</div>
    </div>
  `;

  function formatBulletText(txt) {
    if (!txt) return '';
    let formatted = esc(String(txt).replace(/^[•\-\*]\s*/, '').trim());
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return formatted;
  }

  // Experience
  let expList = experience;
  if (!expList || expList.length === 0) {
    expList = [
      {
        jobTitle: 'Senior Recruiter',
        company: 'Jobbie',
        startDate: 'June 2015',
        endDate: 'Aug 2024',
        location: 'Mumbai, India',
        description: 'Conducted market research to identify **potential sales partners** for the company through cold calling and other means.'
      },
      {
        jobTitle: 'Junior Recruiter',
        company: 'ApnaBot',
        startDate: 'May 2010',
        endDate: 'Aug 2013',
        location: 'Goa, India',
        description: 'Conducted market research to identify **potential sales partners** for the company through cold calling and other means.\nDelivered presentations to showcase the company\'s **products and services**, effectively communicating **value propositions** and **unique selling points**.'
      }
    ];
  }

  const expHTML = `
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; margin-top:10pt; margin-bottom:5pt;">
      <tr>
        <td style="font-family:Arial,sans-serif; font-size:12pt; font-weight:bold; color:${PRIMARY}; text-transform:uppercase; padding-bottom:2pt;">
          WORK EXPERIENCE
        </td>
      </tr>
      <tr>
        <td bgcolor="${PRIMARY}" style="background-color:${PRIMARY}; height:1.5pt; line-height:1px; font-size:1px;">&nbsp;</td>
      </tr>
    </table>
    ${expList.map((exp, index) => {
      const desc = exp.description || (Array.isArray(exp.points) ? exp.points.join('\n') : '');
      const bulletPoints = desc ? desc.split('\n').filter(Boolean) : [];
      
      let orangeGuide = '';
      if (index === 0) {
        orangeGuide = `<li style="color:${ACCENT}; font-style:italic; margin-bottom:3pt;">[Add up to 5-8 points, emphasize[bold] on phrases and skills, write points starting with a verb, of max 10-15 words]</li>`;
      } else if (index === 1) {
        orangeGuide = `<li style="color:${ACCENT}; font-style:italic; margin-bottom:3pt;">[Add relevant 4-6 point for a prior role, write points starting with a verb, of max 10-15 words]</li>`;
      }

      return `
      <div style="margin-bottom:8pt;">
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
          <tr>
            <td style="font-family:Arial,sans-serif; font-size:10.5pt; font-weight:bold; color:${BLACK};">${esc(exp.company)}</td>
            <td style="font-family:Arial,sans-serif; font-size:9.5pt; color:${BLACK}; text-align:right; white-space:nowrap;">${esc([exp.startDate || exp.date, exp.endDate || 'Present'].filter(Boolean).join(' – '))}</td>
          </tr>
          <tr>
            <td style="font-family:Arial,sans-serif; font-size:9.5pt; font-weight:bold; font-style:italic; color:${BLACK}; padding-top:1pt;">${esc(exp.jobTitle || exp.role)}</td>
            <td style="font-family:Arial,sans-serif; font-size:9.5pt; font-style:italic; color:${BLACK}; text-align:right; padding-top:1pt;">${esc(exp.location || '')}</td>
          </tr>
        </table>
        <ul style="margin:4pt 0 0 14pt; padding:0; font-family:Arial,sans-serif; font-size:9.5pt; color:${TEXT_DARK}; line-height:1.35;">
          ${orangeGuide}
          ${bulletPoints.map(bullet => `<li style="margin-bottom:3pt;">${formatBulletText(bullet)}</li>`).join('')}
        </ul>
      </div>`;
    }).join('')}
  `;

  // Projects
  let projList = projects;
  if (!projList || projList.length === 0) {
    projList = [
      {
        title: 'Market Analysis',
        duration: 'Jan 2009 – March 2009',
        description: 'Developed detailed **SWOT analysis** to assess the strengths, weaknesses, opportunities, and threats in the market, providing insights for strategic decision-making.\nConducted market research to develop a **detailed SWOT analysis**, assessing **market strengths, weaknesses, opportunities, and threats** for strategic decision-making.'
      }
    ];
  }

  const projectsHTML = `
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; margin-top:10pt; margin-bottom:5pt;">
      <tr>
        <td style="font-family:Arial,sans-serif; font-size:12pt; font-weight:bold; color:${PRIMARY}; text-transform:uppercase; padding-bottom:2pt;">
          PROJECT EXPERIENCE
        </td>
      </tr>
      <tr>
        <td bgcolor="${PRIMARY}" style="background-color:${PRIMARY}; height:1.5pt; line-height:1px; font-size:1px;">&nbsp;</td>
      </tr>
    </table>
    ${projList.map((proj, index) => {
      const bulletPoints = proj.description ? proj.description.split('\n').filter(Boolean) : [];
      let orangeGuide = index === 0 ? `<li style="color:${ACCENT}; font-style:italic; margin-bottom:3pt;">[Add up to 3 points in the project section]</li>` : '';

      return `
      <div style="margin-bottom:8pt;">
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
          <tr>
            <td style="font-family:Arial,sans-serif; font-size:10.5pt; font-weight:bold; color:${BLACK};">${esc(proj.title || proj.name)}</td>
            <td style="font-family:Arial,sans-serif; font-size:9.5pt; color:${BLACK}; text-align:right; white-space:nowrap;">${esc(proj.duration || proj.date || '')}</td>
          </tr>
        </table>
        <ul style="margin:4pt 0 0 14pt; padding:0; font-family:Arial,sans-serif; font-size:9.5pt; color:${TEXT_DARK}; line-height:1.35;">
          ${orangeGuide}
          ${bulletPoints.map(bullet => `<li style="margin-bottom:3pt;">${formatBulletText(bullet)}</li>`).join('')}
        </ul>
      </div>`;
    }).join('')}
  `;

  // Certifications / Achievements
  const certItems = achievements?.length ? achievements.map(a => typeof a === 'string' ? a : a.text) : ['Six Sigma Certification from XXXXXXX'];
  const certHTML = `
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; margin-top:10pt; margin-bottom:5pt;">
      <tr>
        <td style="font-family:Arial,sans-serif; font-size:12pt; font-weight:bold; color:${PRIMARY}; text-transform:uppercase; padding-bottom:2pt;">
          CERTIFICATION
        </td>
      </tr>
      <tr>
        <td bgcolor="${PRIMARY}" style="background-color:${PRIMARY}; height:1.5pt; line-height:1px; font-size:1px;">&nbsp;</td>
      </tr>
    </table>
    <div style="font-family:Arial,sans-serif; font-size:9.5pt; font-style:italic; line-height:1.4; color:${TEXT_DARK}; margin-top:4pt; margin-bottom:8pt;">
      ${certItems.map(c => esc(c)).join('<br>')}
    </div>
  `;

  // Education
  let eduList = education;
  if (!eduList || eduList.length === 0) {
    eduList = [
      {
        degree: 'Business Administration',
        school: 'NYU',
        gradYear: '2007 – 2010',
        gpa: 'Cumulative GPA: 3.75/4.00'
      }
    ];
  }

  const educationHTML = `
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; margin-top:10pt; margin-bottom:5pt;">
      <tr>
        <td style="font-family:Arial,sans-serif; font-size:12pt; font-weight:bold; color:${PRIMARY}; text-transform:uppercase; padding-bottom:2pt;">
          EDUCATION
        </td>
      </tr>
      <tr>
        <td bgcolor="${PRIMARY}" style="background-color:${PRIMARY}; height:1.5pt; line-height:1px; font-size:1px;">&nbsp;</td>
      </tr>
    </table>
    ${eduList.map(edu => `
      <div style="margin-bottom:6pt;">
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
          <tr>
            <td style="font-family:Arial,sans-serif; font-size:10.5pt; font-weight:bold; color:${BLACK};">${esc(edu.degree)}</td>
            <td style="font-family:Arial,sans-serif; font-size:9.5pt; color:${BLACK}; text-align:right; white-space:nowrap;">${esc(edu.gradYear || edu.dates || '')}</td>
          </tr>
          <tr>
            <td colspan="2" style="font-family:Arial,sans-serif; font-size:9.5pt; font-style:italic; color:${TEXT_DARK}; padding-top:1pt;">
              ${esc(edu.school || edu.institute)}${edu.gpa || edu.details ? `, ${esc(edu.gpa || edu.details)}` : ''}
            </td>
          </tr>
        </table>
      </div>`).join('')}
  `;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(name)} - Resume</title>
  <style>
    @page { size: A4; margin: 15mm 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      background: #ffffff;
      color: ${TEXT_DARK};
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 15mm 15mm;
      background: ${WHITE};
    }
    a {
      color: ${PRIMARY};
      text-decoration: underline;
    }
  </style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <table cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; margin-bottom:15pt;">
    <tr>
      <!-- Left side: Name & Subtitle -->
      <td style="vertical-align:top; width:60%;">
        <div style="font-family:Arial,Helvetica,sans-serif; font-size:26pt; font-weight:bold; color:${PRIMARY}; letter-spacing:-0.5px; line-height:1.1;">${esc(name)}</div>
        <div style="font-family:Arial,sans-serif; font-size:12pt; font-weight:bold; color:${BLACK}; margin-top:4pt;">${esc(roleTitle)}</div>
      </td>
      <!-- Right side: Contact Block -->
      <td style="vertical-align:top; width:40%; padding-left:15pt;">
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%; border-collapse:collapse; font-family:Arial,sans-serif; font-size:9.5pt; color:${TEXT_DARK}; line-height:1.35;">
          <tr>
            <td style="font-weight:bold; width:70px; padding-bottom:2px; color:${BLACK};">Contact:</td>
            <td style="padding-bottom:2px; text-align:right;">${esc(phoneVal)}</td>
          </tr>
          <tr>
            <td style="font-weight:bold; padding-bottom:2px; color:${BLACK};">Email:</td>
            <td style="padding-bottom:2px; text-align:right;"><a href="mailto:${esc(emailVal)}">${esc(emailVal)}</a></td>
          </tr>
          ${linkedinVal ? `<tr>
            <td style="font-weight:bold; padding-bottom:2px; color:${BLACK};">LinkedIn:</td>
            <td style="padding-bottom:2px; text-align:right;"><a href="https://${esc(linkedinVal.replace(/https?:\/\//, ''))}" target="_blank">${esc(linkedinVal)}</a></td>
          </tr>` : ''}
          ${githubVal ? `<tr>
            <td style="font-weight:bold; padding-bottom:2px; color:${BLACK};">GitHub:</td>
            <td style="padding-bottom:2px; text-align:right;"><a href="https://${esc(githubVal.replace(/https?:\/\//, ''))}" target="_blank">${esc(githubVal)}</a></td>
          </tr>` : ''}
          ${websiteVal ? `<tr>
            <td style="font-weight:bold; padding-bottom:2px; color:${BLACK};">Portfolio:</td>
            <td style="padding-bottom:2px; text-align:right;"><a href="https://${esc(websiteVal.replace(/https?:\/\//, ''))}" target="_blank">${esc(websiteVal)}</a></td>
          </tr>` : ''}
          <tr>
            <td style="font-weight:bold; padding-bottom:2px; color:${BLACK};">Location:</td>
            <td style="padding-bottom:2px; text-align:right;">${esc(addressVal)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- BODY CONTENT -->
  ${summaryHTML}
  ${skillsetHTML}
  ${expHTML}
  ${projectsHTML}
  ${certHTML}
  ${educationHTML}

  <!-- FOOTER -->
  <div style="text-align:center; margin-top:35pt; font-family:Arial,sans-serif; font-size:9pt; line-height:1.6; border-top:0.5pt solid #eeeeee; padding-top:10pt;">
    <div style="color:${ACCENT}; font-style:italic; margin-bottom:5pt;">(Try adding Achievements if you have any)</div>
    <div style="font-weight:bold; font-size:11.5pt; margin-bottom:4pt;">Score Your Resume at <a href="http://jobbie.io" style="color:${PRIMARY}; text-decoration:underline;">Jobbie</a></div>
    <div style="font-size:10.5pt; margin-bottom:4pt;">Need our support to make a perfect one check the follow link <a href="http://jobbie.io/mentorship" style="color:${PRIMARY}; text-decoration:underline;">Jobbie.io/mentorship</a></div>
    <div style="font-size:10.5pt;">Please kindly give us a review of the template here: <a href="http://jobbie.io/review" style="color:${PRIMARY}; text-decoration:underline;">Review</a> (Won't take more than 30 seconds)</div>
  </div>

</div>
</body>
</html>
  `;
}
