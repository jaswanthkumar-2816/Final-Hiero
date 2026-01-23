import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Standard template IDs mapped to actual filenames
const TEMPLATE_FILE_MAP = {
  'hiero-standard': 'hiero-standard.tex',
  professionalcv: 'professionalcv.tex',
  modernsimple: 'modernsimple.tex',
  awesomecv: 'awesomecv.tex',
  altacv: 'altacv.tex',
  deedycv: 'deedycv.tex',
  elegant: 'elegant.tex',
  functional: 'functional.tex'
};

// Backward compatibility for previously inconsistent file names / ids
const TEMPLATE_ID_ALIASES = { awesomece: 'awesomecv', moddernsimple: 'modernsimple', alatacv: 'altacv' };

const sanitizeLatex = (input) => {
  if (Array.isArray(input)) {
    input = input.join(', ');
  }
  if (typeof input === 'object' && input !== null) {
    input = JSON.stringify(input);
  }
  if (typeof input !== 'string') {
    input = input == null ? '' : String(input);
  }
  return input
    .replace(/([#$%&^_{}~\\])/g, '\\$1')
    .replace(/\n/g, '\\\\')
    .replace(/</g, '\\textless{}')
    .replace(/>/g, '\\textgreater{}');
};

// URL sanitizer: keep protocol chars, escape only braces/backslashes
function sanitizeUrl(url){
  if(!url) return '';
  return String(url).replace(/[{}\\]/g, r=>`\\${r}`);
}

function formatPersonalDetails(pd) {
  if (!pd) return '';
  const details = [];
  if (pd.dob) details.push(`Date of Birth: ${pd.dob}`);
  if (pd.gender) details.push(`Gender: ${pd.gender}`);
  if (pd.nationality) details.push(`Nationality: ${pd.nationality}`);
  if (pd.marital_status) details.push(`Marital Status: ${pd.marital_status}`);
  if (pd.address) details.push(`Address: ${pd.address}`);
  if (pd.languages) {
    const langs = Array.isArray(pd.languages) ? pd.languages.join(', ') : pd.languages;
    details.push(`Languages: ${langs}`);
  }
  
  if (details.length === 0) return '';
  
  const itemsList = details.map(detail => `\\item ${sanitizeLatex(detail)}`).join('\n');
  return `\\textbf{Personal Details}\\\\
\\begin{itemize}
${itemsList}
\\end{itemize}`;
}

function formatContactInfo(ci) {
  if (!ci) return '';
  if (typeof ci === 'string') return sanitizeLatex(ci);
  const email = ci.email ? `${ci.email}` : '';
  const phone = ci.phone ? `${ci.phone}` : '';
  const parts = [email, phone].filter(Boolean).join(' | ');
  return sanitizeLatex(parts);
}

function formatEducation(edu) {
  if (!edu) return '';
  if (Array.isArray(edu)) {
    return edu.map(e => sanitizeLatex(typeof e === 'string' ? e : `${e.degree || ''} ${e.institution || ''} ${e.year || ''}`)).join(' \\ ');
  }
  return sanitizeLatex(edu);
}

function formatProjects(projects) {
  if (!projects) return '';
  if (Array.isArray(projects)) {
    return projects
      .map(p => {
        if (typeof p === 'string') return sanitizeLatex(p);
        const t = p.title || p.name ? `${p.title || p.name}` : '';
        const d = p.date || p.year ? ` (${p.date || p.year})` : '';
        const desc = p.description ? `: ${p.description}` : '';
        return sanitizeLatex(`${t}${d}${desc}`);
      })
      .join(' \\ ');
  }
  return sanitizeLatex(projects);
}

function formatSkills(sk) {
  if (!sk) return { tech: '', mgmt: '', combined: '' };
  // Accept either object with arrays or simple array of strings
  if (Array.isArray(sk)) {
    const skillItems = sk.map(skill => `\\item ${sanitizeLatex(skill)}`).join('\n');
    const combined = `\\textbf{Skills}\\\\
\\begin{itemize}
${skillItems}
\\end{itemize}`;
    return { tech: '', mgmt: '', combined: combined };
  }
  
  const techArr = Array.isArray(sk.technical) ? sk.technical : (sk.technical ? String(sk.technical).split(/[,;]\s*/) : []);
  const mgmtArr = Array.isArray(sk.management) ? sk.management : (sk.management ? String(sk.management).split(/[,;]\s*/) : []);
  
  const allSkills = [...techArr, ...mgmtArr];
  if (allSkills.length === 0) return { tech: '', mgmt: '', combined: '' };
  
  const skillItems = allSkills.map(skill => `\\item ${sanitizeLatex(skill)}`).join('\n');
  const combined = `\\textbf{Skills}\\\\
\\begin{itemize}
${skillItems}
\\end{itemize}`;
  
  const tech = techArr.join(', ');
  const mgmt = mgmtArr.join(', ');
  
  return { tech: sanitizeLatex(tech), mgmt: sanitizeLatex(mgmt), combined: combined };
}

function formatListOrText(val) {
  if (!val) return '';
  if (Array.isArray(val)) return val.map(v => sanitizeLatex(v.name || v)).join(' \\ ');
  return sanitizeLatex(val);
}

function formatBulletList(items) {
  if (!items || !Array.isArray(items) || items.length === 0) return '';
  return items.map(it => `\\item ${sanitizeLatex(it.name || it.degree || it.institution || it.title || it.description || it.issuer || it)}`).join('\n');
}

function normalizeToArray(val){
  if (!val) return [];
  if (Array.isArray(val)) return val;
  // if it's an object or primitive, wrap
  return [val];
}

function blockList(label, items, withLabel = true) {
  items = normalizeToArray(items);
  if (!items || !Array.isArray(items) || items.length === 0) return '';
  const lines = items.map(raw => {
    if (typeof raw === 'string') return `\\item ${sanitizeLatex(raw)}`;
    const o = raw || {};
    switch(label){
      case 'Education': {
        let degree = o.degree || o.title || '';
        let inst = o.institution || o.school || '';
        const year = o.year || o.date || '';
        const gpa = o.gpa ? ` GPA: ${o.gpa}` : '';
        // Fallback: if both degree & institution empty, build from any string fields
        if(!degree && !inst){
          const strFields = Object.values(o).filter(v => typeof v === 'string' && v.trim());
            if(strFields.length){
              degree = strFields[0];
              inst = strFields[1] || '';
            }
        }
        const main = [degree, inst].filter(Boolean).join(' - ');
        if(!main) return ''; // skip completely empty object
        return `\\item ${sanitizeLatex(main)}${year?` (${sanitizeLatex(year)})`:''}${gpa}`;
      }
      case 'Projects': {
        const name = o.name || o.title || '';
        const year = o.year || o.date || '';
        const duration = o.duration ? ` ${o.duration}` : '';
        const desc = o.description ? `: ${o.description}` : '';
        return `\\item ${sanitizeLatex(name)}${year?` (${sanitizeLatex(year)})`:''}${duration}${desc?sanitizeLatex(desc):''}`;
      }
      case 'Certifications': {
        const name = o.name || o.title || '';
        const issuer = o.issuer || o.provider || '';
        const year = o.year || o.date || '';
        return `\\item ${sanitizeLatex(name)}${issuer?` - ${sanitizeLatex(issuer)}`:''}${year?` (${sanitizeLatex(year)})`:''}`;
      }
      case 'Achievements': {
        const name = o.name || o.title || '';
        const desc = o.description ? `: ${o.description}` : '';
        const year = o.year || o.date || '';
        return `\\item ${sanitizeLatex(name)}${year?` (${sanitizeLatex(year)})`:''}${desc?sanitizeLatex(desc):''}`;
      }
      case 'Hobbies': {
        const name = o.name || o.title || o.hobby || '';
        return `\\item ${sanitizeLatex(name || '')}`;
      }
      case 'References': {
        const name = o.name || '';
        const rel = o.relationship ? ` (${o.relationship})` : '';
        const contact = o.contact || o.phone || o.email ? ` - ${[o.contact, o.phone, o.email].filter(Boolean)[0]}` : '';
        return `\\item ${sanitizeLatex(name + rel + contact)}`;
      }
      default: {
        const generic = o.name || o.title || o.description || o.degree || o.institution || o.issuer || JSON.stringify(o);
        return `\\item ${sanitizeLatex(generic)}`;
      }
    }
  }).filter(Boolean).join('\n');
  if(!lines.trim()) return '';
  return `${withLabel ? `\\textbf{${sanitizeLatex(label)}}\\\n` : ''}\\begin{itemize}\n${lines}\n\\end{itemize}`;
}

export function loadLatexTemplate(template, data) {
  const chosenRaw = (template || 'hiero-standard').toLowerCase();
  const chosen = TEMPLATE_ID_ALIASES[chosenRaw] || chosenRaw;
  const fileName = TEMPLATE_FILE_MAP[chosen] || TEMPLATE_FILE_MAP['hiero-standard'];
  const templatePath = path.join(__dirname, '../templates', fileName);
  if (!fs.existsSync(templatePath)) throw new Error(`Invalid template: ${chosen}`);
  let latexTemplate = fs.readFileSync(templatePath, 'utf8');

  // Use special processing for hiero-standard template
  if (chosen === 'hiero-standard') {
    return processHieroStandardTemplate(latexTemplate, data);
  }

  // Legacy processing for old templates
  // Helper: detect if template already has manual heading for a label
  function hasManualHeading(label){
    const patterns = [
      new RegExp(`\\\\textbf\\{${label}\\}`),
      new RegExp(`\\\\section\*\\{${label}\\}`)
    ];
    return patterns.some(rx => rx.test(latexTemplate));
  }

  // Normalize known array sections so single objects still render
  const normalized = { ...data,
    education: normalizeToArray(data.education),
    projects: normalizeToArray(data.projects),
    certifications: normalizeToArray(data.certifications),
    achievements: normalizeToArray(data.achievements),
    hobbies: normalizeToArray(data.hobbies),
    references: normalizeToArray(data.references)
  };

  const skills = formatSkills(normalized.skills || {});
  const pd = normalized.personal_details || {};

  // Canonical ordered replacements
  latexTemplate = latexTemplate
    // Identity / header
    .replace(/{{full_name}}/g, sanitizeLatex(data.basic?.full_name || ''))
    .replace(/{{contact_info}}/g, formatContactInfo(data.basic?.contact_info))
    .replace(/{{website}}/g, data.basic?.website ? `\\href{${sanitizeUrl(data.basic.website)}}{${sanitizeLatex(data.basic.website)}}` : '')
    .replace(/{{career_summary}}/g, data.basic?.career_summary ? `\\textbf{Summary}\\\\${sanitizeLatex(data.basic.career_summary)}` : '')
    // Education
    .replace(/{{education}}/g, blockList('Education', normalized.education, !hasManualHeading('Education')))
    // Projects
    .replace(/{{projects}}/g, blockList('Projects', normalized.projects, !hasManualHeading('Projects')))
    // Skills - create proper skills section
    .replace(/{{skills}}/g, skills.combined || '')
    .replace(/{{technical_skills}}/g, skills.tech)
    .replace(/{{management_skills}}/g, skills.mgmt)
    // Certifications (unified)
    .replace(/{{certifications}}/g, blockList('Certifications', normalized.certifications, !hasManualHeading('Certifications')))
    // Achievements
    .replace(/{{achievements}}/g, blockList('Achievements', normalized.achievements, !hasManualHeading('Achievements')))
    // Hobbies
    .replace(/{{hobbies}}/g, blockList('Hobbies', normalized.hobbies, !hasManualHeading('Hobbies')))
    // References
    .replace(/{{references}}/g, blockList('References', normalized.references, !hasManualHeading('References')))
    // Personal details as structured section
    .replace(/{{personal_details}}/g, formatPersonalDetails(pd))
    // Personal details atomic fields (only if template still contains them)
    .replace(/{{dob}}/g, sanitizeLatex(pd.dob || ''))
    .replace(/{{gender}}/g, sanitizeLatex(pd.gender || ''))
    .replace(/{{nationality}}/g, sanitizeLatex(pd.nationality || ''))
    .replace(/{{marital_status}}/g, sanitizeLatex(pd.marital_status || ''))
    .replace(/{{languages}}/g, sanitizeLatex(Array.isArray(pd.languages) ? pd.languages.join(', ') : (pd.languages || '')))
    .replace(/{{address}}/g, sanitizeLatex(pd.address || ''));

  // Remove any deprecated placeholders if still present
  latexTemplate = latexTemplate
    .replace(/{{summary}}/g, '')
    .replace(/{{professional_certifications}}/g, '')
    .replace(/{{personal_certifications}}/g, '');

  // Collapse excessive blank lines produced by empty sections
  latexTemplate = latexTemplate.replace(/(\n\s*){3,}/g, '\n\n');

  // Cleanup: remove stray manual headings left without following itemize (empty data)
  latexTemplate = latexTemplate.replace(/(\\textbf\{(Education|Projects|Certifications|Achievements|Hobbies|References)\}\\\s*)(?=(\\textbf|\\section|$))/g, '');

  return latexTemplate;
};

// Process hiero-standard template with mustache-style placeholders
function processHieroStandardTemplate(template, data) {
  let content = template;
  
  // Basic information
  const basic = data.basic || {};
  const contact = basic.contact_info || {};
  
  content = content.replace(/\{\{\{FULL_NAME\}\}\}/g, sanitizeLatex(basic.full_name || ''));
  content = content.replace(/\{\{EMAIL\}\}/g, sanitizeLatex(contact.email || ''));
  content = content.replace(/\{\{PHONE\}\}/g, sanitizeLatex(contact.phone || ''));
  
  // Optional contact fields with conditional rendering
  content = content.replace(/\{\{#LINKEDIN\}\}.*?\{\{\/LINKEDIN\}\}/gs, (match) => {
    if (contact.linkedin) {
      return match.replace(/\{\{\{LINKEDIN\}\}\}/g, sanitizeUrl(contact.linkedin));
    }
    return '';
  });
  
  content = content.replace(/\{\{#WEBSITE\}\}.*?\{\{\/WEBSITE\}\}/gs, (match) => {
    if (basic.website) {
      return match.replace(/\{\{\{WEBSITE\}\}\}/g, sanitizeUrl(basic.website));
    }
    return '';
  });
  
  content = content.replace(/\{\{#ADDRESS\}\}.*?\{\{\/ADDRESS\}\}/gs, (match) => {
    if (contact.address) {
      return match.replace(/\{\{ADDRESS\}\}/g, sanitizeLatex(contact.address));
    }
    return '';
  });
  
  // Career objective
  content = content.replace(/\{\{#CAREER_OBJECTIVE\}\}.*?\{\{\/CAREER_OBJECTIVE\}\}/gs, (match) => {
    if (basic.career_objective || basic.career_summary) {
      const objective = basic.career_objective || basic.career_summary;
      return match.replace(/\{\{CAREER_OBJECTIVE\}\}/g, sanitizeLatex(objective));
    }
    return '';
  });
  
  // Education section
  content = content.replace(/\{\{#EDUCATION\}\}.*?\{\{\/EDUCATION\}\}/gs, (match) => {
    const education = normalizeToArray(data.education);
    if (education && education.length > 0) {
      const eduList = education.map(edu => 
        `\\item ${sanitizeLatex(edu.degree || '')} - ${sanitizeLatex(edu.institution || '')} (${sanitizeLatex(edu.graduation_year || '')})${edu.gpa ? ` GPA: ${sanitizeLatex(edu.gpa)}` : ''}${edu.details ? ` - ${sanitizeLatex(edu.details)}` : ''}`
      ).join('\n');
      return match.replace(/\{\{#EDUCATION_LIST\}\}.*?\{\{\/EDUCATION_LIST\}\}/gs, eduList);
    }
    return '';
  });
  
  // Experience section
  content = content.replace(/\{\{#EXPERIENCE\}\}.*?\{\{\/EXPERIENCE\}\}/gs, (match) => {
    const experience = normalizeToArray(data.experience);
    if (experience && experience.length > 0) {
      const expList = experience.map(exp => {
        let expItem = `\\item \\textbf{${sanitizeLatex(exp.position || '')}} at ${sanitizeLatex(exp.company || '')} (${sanitizeLatex(exp.duration || '')})${exp.location ? ` - ${sanitizeLatex(exp.location)}` : ''}`;
        if (exp.responsibilities && exp.responsibilities.length > 0) {
          const respList = exp.responsibilities.map(resp => `\\item ${sanitizeLatex(resp)}`).join('\n');
          expItem += `\n\\begin{itemize}\n${respList}\n\\end{itemize}`;
        }
        return expItem;
      }).join('\n');
      return match.replace(/\{\{#EXPERIENCE_LIST\}\}.*?\{\{\/EXPERIENCE_LIST\}\}/gs, expList);
    }
    return '';
  });
  
  // Projects section
  content = content.replace(/\{\{#PROJECTS\}\}.*?\{\{\/PROJECTS\}\}/gs, (match) => {
    const projects = normalizeToArray(data.projects);
    if (projects && projects.length > 0) {
      const projList = projects.map(proj => 
        `\\item \\textbf{${sanitizeLatex(proj.name || '')}} (${sanitizeLatex(proj.year || '')}${proj.duration ? `, ${sanitizeLatex(proj.duration)}` : ''}): ${sanitizeLatex(proj.description || '')}${proj.technologies ? ` - Technologies: ${sanitizeLatex(proj.technologies)}` : ''}${proj.link ? ` - \\href{${sanitizeUrl(proj.link)}}{Project Link}` : ''}`
      ).join('\n');
      return match.replace(/\{\{#PROJECT_LIST\}\}.*?\{\{\/PROJECT_LIST\}\}/gs, projList);
    }
    return '';
  });
  
  // Skills section
  content = content.replace(/\{\{#SKILLS\}\}.*?\{\{\/SKILLS\}\}/gs, (match) => {
    const skills = data.skills || {};
    if (Object.keys(skills).length > 0) {
      const technical = Array.isArray(skills.technical) ? skills.technical.join(', ') : (skills.technical || '');
      const management = Array.isArray(skills.management) ? skills.management.join(', ') : (skills.management || '');
      const soft = Array.isArray(skills.soft) ? skills.soft.join(', ') : (skills.soft || '');
      
      let skillsContent = match;
      skillsContent = skillsContent.replace(/\{\{#TECHNICAL_SKILLS\}\}.*?\{\{\/TECHNICAL_SKILLS\}\}/gs, technical ? `Technical: ${sanitizeLatex(technical)}` : '');
      skillsContent = skillsContent.replace(/\{\{#MANAGEMENT_SKILLS\}\}.*?\{\{\/MANAGEMENT_SKILLS\}\}/gs, management ? `\\\\Management: ${sanitizeLatex(management)}` : '');
      skillsContent = skillsContent.replace(/\{\{#SOFT_SKILLS\}\}.*?\{\{\/SOFT_SKILLS\}\}/gs, soft ? `\\\\Soft Skills: ${sanitizeLatex(soft)}` : '');
      skillsContent = skillsContent.replace(/\{\{TECHNICAL_SKILLS\}\}/g, sanitizeLatex(technical));
      skillsContent = skillsContent.replace(/\{\{MANAGEMENT_SKILLS\}\}/g, sanitizeLatex(management));
      skillsContent = skillsContent.replace(/\{\{SOFT_SKILLS\}\}/g, sanitizeLatex(soft));
      return skillsContent;
    }
    return '';
  });
  
  // Certifications section
  content = content.replace(/\{\{#CERTIFICATIONS\}\}.*?\{\{\/CERTIFICATIONS\}\}/gs, (match) => {
    const certifications = normalizeToArray(data.certifications);
    if (certifications && certifications.length > 0) {
      const certList = certifications.map(cert => 
        `\\item ${sanitizeLatex(cert.name || '')} - ${sanitizeLatex(cert.issuer || '')} (${sanitizeLatex(cert.year || cert.date || '')})${cert.details ? ` - ${sanitizeLatex(cert.details)}` : ''}`
      ).join('\n');
      return match.replace(/\{\{#CERT_LIST\}\}.*?\{\{\/CERT_LIST\}\}/gs, certList);
    }
    return '';
  });
  
  // Achievements section
  content = content.replace(/\{\{#ACHIEVEMENTS\}\}.*?\{\{\/ACHIEVEMENTS\}\}/gs, (match) => {
    const achievements = normalizeToArray(data.achievements);
    if (achievements && achievements.length > 0) {
      const achList = achievements.map(ach => 
        `\\item \\textbf{${sanitizeLatex(ach.title || '')}} (${sanitizeLatex(ach.year || ach.date || '')}): ${sanitizeLatex(ach.description || '')}${ach.organization ? ` - ${sanitizeLatex(ach.organization)}` : ''}`
      ).join('\n');
      return match.replace(/\{\{#ACHIEVEMENT_LIST\}\}.*?\{\{\/ACHIEVEMENT_LIST\}\}/gs, achList);
    }
    return '';
  });
  
  // Languages
  content = content.replace(/\{\{#LANGUAGES\}\}.*?\{\{\/LANGUAGES\}\}/gs, (match) => {
    const languages = normalizeToArray(data.languages);
    if (languages && languages.length > 0) {
      const langText = languages.map(lang => 
        typeof lang === 'object' ? `${lang.name} (${lang.proficiency})` : lang
      ).join(', ');
      return match.replace(/\{\{LANGUAGES_TEXT\}\}/g, sanitizeLatex(langText));
    }
    return '';
  });
  
  // Hobbies
  content = content.replace(/\{\{#HOBBIES\}\}.*?\{\{\/HOBBIES\}\}/gs, (match) => {
    const hobbies = data.hobbies;
    if (hobbies) {
      const hobbiesText = Array.isArray(hobbies) ? hobbies.join(', ') : hobbies;
      return match.replace(/\{\{HOBBIES_TEXT\}\}/g, sanitizeLatex(hobbiesText));
    }
    return '';
  });
  
  // Personal details
  content = content.replace(/\{\{#PERSONAL_DETAILS\}\}.*?\{\{\/PERSONAL_DETAILS\}\}/gs, (match) => {
    const pd = data.personal_details || {};
    if (Object.keys(pd).length > 0) {
      let pdContent = match;
      const dob = pd.date_of_birth || pd.dateOfBirth;
      const gender = pd.gender;
      const nationality = pd.nationality;
      const address = pd.address;
      
      pdContent = pdContent.replace(/\{\{#DOB\}\}.*?\{\{\/DOB\}\}/gs, dob ? `Date of Birth: ${sanitizeLatex(dob)}\\\\` : '');
      pdContent = pdContent.replace(/\{\{#GENDER\}\}.*?\{\{\/GENDER\}\}/gs, gender ? `Gender: ${sanitizeLatex(gender)}\\\\` : '');
      pdContent = pdContent.replace(/\{\{#NATIONALITY\}\}.*?\{\{\/NATIONALITY\}\}/gs, nationality ? `Nationality: ${sanitizeLatex(nationality)}\\\\` : '');
      pdContent = pdContent.replace(/\{\{#ADDRESS\}\}.*?\{\{\/ADDRESS\}\}/gs, address ? `Address: ${sanitizeLatex(address)}\\\\` : '');
      pdContent = pdContent.replace(/\{\{DOB\}\}/g, sanitizeLatex(dob || ''));
      pdContent = pdContent.replace(/\{\{GENDER\}\}/g, sanitizeLatex(gender || ''));
      pdContent = pdContent.replace(/\{\{NATIONALITY\}\}/g, sanitizeLatex(nationality || ''));
      pdContent = pdContent.replace(/\{\{ADDRESS\}\}/g, sanitizeLatex(address || ''));
      return pdContent;
    }
    return '';
  });
  
  // References
  content = content.replace(/\{\{#REFERENCES\}\}.*?\{\{\/REFERENCES\}\}/gs, (match) => {
    const references = normalizeToArray(data.references);
    if (references && references.length > 0) {
      const refList = references.map(ref => 
        `\\item ${sanitizeLatex(ref.name || '')} (${sanitizeLatex(ref.relationship || '')}) - ${sanitizeLatex(ref.contact || '')}${ref.organization ? ` - ${sanitizeLatex(ref.organization)}` : ''}`
      ).join('\n');
      return match.replace(/\{\{#REF_LIST\}\}.*?\{\{\/REF_LIST\}\}/gs, refList);
    }
    return '';
  });
  
  return content;
}

export { sanitizeLatex };