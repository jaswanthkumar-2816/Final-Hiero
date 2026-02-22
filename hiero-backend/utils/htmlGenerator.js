// Fast HTML Resume Generator
// This generates instant HTML previews without LaTeX compilation

import { generateHieroSignatureTemplate } from '../templates/hieroSignatureTemplate.js';
import fs from 'fs';
import path from 'path';

export function generateHTMLPreview(templateId, resumeData) {
  const templates = {
    professionalcv: generateProfessionalHTML,
    modernsimple: generateModernHTML,
    awesomecv: generateCreativeHTML,
    altacv: generateATSHTML,
    deedycv: generateStudentHTML,
    elegant: generateExecutiveHTML,
    functional: generateFunctionalHTML,
    rishi: generateModernHTML,
    'priya-analytics': generateProfessionalHTML,
    'hiero-signature': (data) => generateHieroSignatureTemplate(convertToModernSchema(data))
  };

  const generator = templates[templateId] || templates.professionalcv;
  return generator(resumeData);
}

function convertToModernSchema(data) {
  if (data.personalInfo) return data; // Already in modern schema

  return {
    personalInfo: {
      fullName: data.basic?.full_name,
      email: data.basic?.contact_info?.email,
      phone: data.basic?.contact_info?.phone,
      address: data.basic?.contact_info?.address,
      website: data.basic?.website,
      summary: data.basic?.career_summary
    },
    experience: data.experience || [],
    education: data.education || [],
    skills: Array.isArray(data.skills) ? data.skills :
      (data.skills && typeof data.skills === 'object' ?
        [...(data.skills.technical || []), ...(data.skills.management || [])] :
        data.skills || [])
  };
}

function sanitizeHTML(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatContact(contact) {
  if (!contact) return '';
  const parts = [];
  if (contact.email) parts.push(`<a href="mailto:${contact.email}" style="color: #45c604;">${contact.email}</a>`);
  if (contact.phone) parts.push(contact.phone);
  if (contact.address) parts.push(contact.address);
  return parts.join(' | ');
}

function generateProfessionalHTML(data) {
  const basic = data.basic || {};
  const contact = basic.contact_info || {};

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${sanitizeHTML(basic.full_name || 'Resume')}</title>
    <style>
        body { font-family: 'Times New Roman', serif; line-height: 1.4; margin: 0; padding: 40px; background: white; color: #000; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
        .name { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .contact { font-size: 12px; color: #333; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 16px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; margin-bottom: 10px; padding-bottom: 5px; }
        .item { margin-bottom: 12px; }
        .item-title { font-weight: bold; }
        .item-subtitle { font-style: italic; margin-left: 20px; }
        .item-details { margin-left: 20px; font-size: 14px; }
        .skills-list { display: flex; flex-wrap: wrap; gap: 15px; }
        .skill-category { margin-bottom: 10px; }
        ul { margin: 10px 0; padding-left: 20px; }
        li { margin-bottom: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="name">${sanitizeHTML(basic.full_name || 'Your Name')}</div>
        <div class="contact">${formatContact(contact)}</div>
        ${basic.website ? `<div style="margin-top: 5px;"><a href="${basic.website}" style="color: #45c604;">${sanitizeHTML(basic.website)}</a></div>` : ''}
    </div>
    
    ${basic.career_summary ? `
    <div class="section">
        <div class="section-title">Professional Summary</div>
        <p>${sanitizeHTML(basic.career_summary)}</p>
    </div>
    ` : ''}
    
    ${generateEducationHTML(data.education)}
    ${generateProjectsHTML(data.projects)}
    ${generateSkillsHTML(data.skills)}
    ${generateCertificationsHTML(data.certifications)}
    ${generateAchievementsHTML(data.achievements)}
    ${generateHobbiesHTML(data.hobbies)}
    ${generateReferencesHTML(data.references)}
</body>
</html>`;
}

function generateModernHTML(data) {
  const basic = data.basic || {};
  const contact = basic.contact_info || {};

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${sanitizeHTML(basic.full_name || 'Resume')}</title>
    <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.5; margin: 0; padding: 0; background: #f8f9fa; }
        .container { max-width: 900px; margin: 0 auto; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #2c3e50, #34495e); color: white; padding: 40px; text-align: center; }
        .name { font-size: 32px; font-weight: 300; margin-bottom: 10px; }
        .contact { font-size: 14px; opacity: 0.9; }
        .content { display: grid; grid-template-columns: 1fr 2fr; gap: 0; }
        .sidebar { background: #ecf0f1; padding: 30px; }
        .main { padding: 30px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: bold; color: #2c3e50; margin-bottom: 15px; position: relative; }
        .section-title::after { content: ''; position: absolute; bottom: -5px; left: 0; width: 30px; height: 3px; background: #45c604; }
        .item { margin-bottom: 15px; }
        .item-title { font-weight: bold; color: #2c3e50; }
        .item-subtitle { color: #7f8c8d; font-size: 14px; }
        .item-details { margin-top: 5px; }
        .skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .skill-bar { background: #ecf0f1; height: 8px; border-radius: 4px; margin-top: 5px; }
        .skill-progress { background: #45c604; height: 100%; border-radius: 4px; width: 85%; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="name">${sanitizeHTML(basic.full_name || 'Your Name')}</div>
            <div class="contact">${formatContact(contact)}</div>
            ${basic.website ? `<div style="margin-top: 10px;"><a href="${basic.website}" style="color: #45c604;">${sanitizeHTML(basic.website)}</a></div>` : ''}
        </div>
        
        <div class="content">
            <div class="sidebar">
                ${generateSkillsHTML(data.skills, 'sidebar')}
                ${generateCertificationsHTML(data.certifications, 'sidebar')}
                ${generateHobbiesHTML(data.hobbies, 'sidebar')}
            </div>
            
            <div class="main">
                ${basic.career_summary ? `
                <div class="section">
                    <div class="section-title">Professional Summary</div>
                    <p>${sanitizeHTML(basic.career_summary)}</p>
                </div>
                ` : ''}
                
                ${generateEducationHTML(data.education)}
                ${generateProjectsHTML(data.projects)}
                ${generateAchievementsHTML(data.achievements)}
                ${generateReferencesHTML(data.references)}
            </div>
        </div>
    </div>
</body>
</html>`;
}

// Helper functions for sections
function generateEducationHTML(education) {
  if (!education || !Array.isArray(education) || education.length === 0) return '';

  return `
    <div class="section">
        <div class="section-title">Education</div>
        ${education.map(edu => `
            <div class="item">
                <div class="item-title">${sanitizeHTML(edu.degree || edu.title || '')}</div>
                <div class="item-subtitle">${sanitizeHTML(edu.institution || edu.school || '')} ${edu.year ? `(${sanitizeHTML(edu.year)})` : ''}</div>
                ${edu.gpa ? `<div class="item-details">GPA: ${sanitizeHTML(edu.gpa)}</div>` : ''}
                ${edu.description ? `<div class="item-details">${sanitizeHTML(edu.description)}</div>` : ''}
            </div>
        `).join('')}
    </div>
  `;
}

function generateProjectsHTML(projects) {
  if (!projects || !Array.isArray(projects) || projects.length === 0) return '';

  return `
    <div class="section">
        <div class="section-title">Projects</div>
        ${projects.map(project => `
            <div class="item">
                <div class="item-title">${sanitizeHTML(project.name || project.title || '')}</div>
                <div class="item-subtitle">${project.year ? `${sanitizeHTML(project.year)}` : ''} ${project.duration ? `(${sanitizeHTML(project.duration)})` : ''}</div>
                ${project.description ? `<div class="item-details">${sanitizeHTML(project.description)}</div>` : ''}
                ${project.technologies ? `<div class="item-details"><strong>Technologies:</strong> ${sanitizeHTML(project.technologies)}</div>` : ''}
            </div>
        `).join('')}
    </div>
  `;
}

function generateSkillsHTML(skills, layout = 'main') {
  if (!skills) return '';

  const technical = Array.isArray(skills.technical) ? skills.technical : [];
  const management = Array.isArray(skills.management) ? skills.management : [];
  const allSkills = [...technical, ...management];

  if (allSkills.length === 0) return '';

  if (layout === 'sidebar') {
    return `
      <div class="section">
          <div class="section-title">Skills</div>
          ${allSkills.map(skill => `
              <div class="item">
                  <div>${sanitizeHTML(skill)}</div>
                  <div class="skill-bar"><div class="skill-progress"></div></div>
              </div>
          `).join('')}
      </div>
    `;
  }

  return `
    <div class="section">
        <div class="section-title">Skills</div>
        ${technical.length > 0 ? `
            <div class="skill-category">
                <strong>Technical Skills:</strong> ${technical.map(skill => sanitizeHTML(skill)).join(', ')}
            </div>
        ` : ''}
        ${management.length > 0 ? `
            <div class="skill-category">
                <strong>Management Skills:</strong> ${management.map(skill => sanitizeHTML(skill)).join(', ')}
            </div>
        ` : ''}
    </div>
  `;
}

function generateCertificationsHTML(certifications, layout = 'main') {
  if (!certifications || !Array.isArray(certifications) || certifications.length === 0) return '';

  return `
    <div class="section">
        <div class="section-title">Certifications</div>
        ${certifications.map(cert => `
            <div class="item">
                <div class="item-title">${sanitizeHTML(cert.name || cert.title || '')}</div>
                <div class="item-subtitle">${sanitizeHTML(cert.issuer || cert.provider || '')} ${cert.year ? `(${sanitizeHTML(cert.year)})` : ''}</div>
            </div>
        `).join('')}
    </div>
  `;
}

function generateAchievementsHTML(achievements) {
  if (!achievements || !Array.isArray(achievements) || achievements.length === 0) return '';

  return `
    <div class="section">
        <div class="section-title">Achievements</div>
        <ul>
            ${achievements.map(achievement => `
                <li>${sanitizeHTML(achievement.title || achievement.name || achievement)} ${achievement.year ? `(${sanitizeHTML(achievement.year)})` : ''}</li>
            `).join('')}
        </ul>
    </div>
  `;
}

function generateHobbiesHTML(hobbies, layout = 'main') {
  if (!hobbies || (Array.isArray(hobbies) && hobbies.length === 0)) return '';

  const hobbiesList = Array.isArray(hobbies) ? hobbies : [hobbies];

  return `
    <div class="section">
        <div class="section-title">Hobbies & Interests</div>
        <p>${hobbiesList.map(hobby => sanitizeHTML(hobby.name || hobby)).join(', ')}</p>
    </div>
  `;
}

function generateReferencesHTML(references) {
  if (!references || !Array.isArray(references) || references.length === 0) return '';

  return `
    <div class="section">
        <div class="section-title">References</div>
        ${references.map(ref => `
            <div class="item">
                <div class="item-title">${sanitizeHTML(ref.name || '')}</div>
                <div class="item-subtitle">${sanitizeHTML(ref.relationship || '')} ${ref.contact ? `- ${sanitizeHTML(ref.contact)}` : ''}</div>
            </div>
        `).join('')}
    </div>
  `;
}

// Additional templates (simplified for now)
function generateCreativeHTML(data) { return generateModernHTML(data); }
function generateATSHTML(data) { return generateProfessionalHTML(data); }
function generateStudentHTML(data) { return generateModernHTML(data); }
function generateExecutiveHTML(data) { return generateProfessionalHTML(data); }
function generateFunctionalHTML(data) { return generateModernHTML(data); }
