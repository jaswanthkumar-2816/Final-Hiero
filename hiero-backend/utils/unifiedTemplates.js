/**
 * 🎨 UNIFIED RESUME TEMPLATE SYSTEM
 * 
 * This module provides a standardized, fast PDF generation system for all 10 resume templates.
 * 
 * Key Features:
 * ✅ Uniform structure across all templates
 * ✅ Consistent fonts, spacing, and alignment
 * ✅ Fast PDF generation (no LaTeX compilation needed)
 * ✅ Responsive and professional design
 * ✅ Clean, maintainable code
 * 
 * Template IDs:
 * 1. classic - Classic Professional
 * 2. minimal - Minimal Clean
 * 3. modern-pro - Modern Professional  
 * 4. tech-focus - Tech Focus
 * 5. ats-optimized - ATS Optimized
 * 6. creative-bold - Creative Bold
 * 7. portfolio-style - Portfolio Style
 * 8. corporate-ats - Corporate ATS
 * 9. elegant-gradient - Elegant Gradient
 * 10. minimalist-mono - Minimalist Mono
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';

// ==================== STANDARDIZED CONFIGURATION ====================

// Unified page settings for all templates
const PAGE_CONFIG = {
  size: 'A4',
  margin: 50,
  width: 595.28,  // A4 width in points
  height: 841.89, // A4 height in points
  contentWidth: 495.28  // width minus margins
};

// Standardized colors for each template
const TEMPLATE_COLORS = {
  'classic': {
    primary: '#000000',
    secondary: '#333333',
    accent: '#000000',
    background: '#FFFFFF',
    light: '#666666'
  },
  'minimal': {
    primary: '#000000',
    secondary: '#333333',
    accent: '#666666',
    background: '#FFFFFF',
    light: '#999999'
  },
  'modern-pro': {
    primary: '#2ae023',
    secondary: '#1a8b17',
    accent: '#2ae023',
    background: '#FFFFFF',
    light: '#666666'
  },
  'tech-focus': {
    primary: '#4ade80',
    secondary: '#60a5fa',
    accent: '#4ade80',
    background: '#1e1e1e',
    light: '#a3a3a3'
  },
  'ats-optimized': {
    primary: '#000000',
    secondary: '#000000',
    accent: '#000000',
    background: '#FFFFFF',
    light: '#666666'
  },
  'creative-bold': {
    primary: '#667eea',
    secondary: '#764ba2',
    accent: '#667eea',
    background: '#FFFFFF',
    light: '#FFFFFF'
  },
  'portfolio-style': {
    primary: '#2ae023',
    secondary: '#1f2937',
    accent: '#2ae023',
    background: '#FFFFFF',
    light: '#6b7280'
  },
  'corporate-ats': {
    primary: '#2ae023',
    secondary: '#333333',
    accent: '#2ae023',
    background: '#FFFFFF',
    light: '#666666'
  },
  'elegant-gradient': {
    primary: '#667eea',
    secondary: '#2c3e50',
    accent: '#667eea',
    background: '#FFFFFF',
    light: '#5a6c7d'
  },
  'minimalist-mono': {
    primary: '#000000',
    secondary: '#000000',
    accent: '#000000',
    background: '#FFFFFF',
    light: '#555555'
  },
  // Priya Analytics single-column template (grey top bar)
  'priya-analytics': {
    primary: '#000000',
    secondary: '#333333',
    accent: '#000000',
    background: '#FFFFFF',
    light: '#666666'
  }
};

// Standardized font sizes (consistent across all templates)
const FONT_SIZES = {
  name: 24,
  sectionTitle: 14,
  jobTitle: 12,
  body: 10,
  contact: 9,
  small: 8
};

// Standardized spacing (consistent across all templates)
const SPACING = {
  lineHeight: 1.5,
  sectionGap: 15,
  itemGap: 10,
  paragraphGap: 8,
  bulletIndent: 20
};

// Helper to get per-template spacing overrides
function getTemplateSpacing(template) {
  if (template === 'priya-analytics') {
    return {
      lineHeight: 1.35,
      sectionGap: 10,
      itemGap: 6,
      paragraphGap: 6,
      bulletIndent: 18
    };
  }
  return SPACING;
}

// ==================== SECTION ORDER (STANDARDIZED) ====================

const SECTION_ORDER = [
  'summary',
  'experience',
  'education',
  'technicalSkills',
  'softSkills',
  'projects',
  'certifications',
  'achievements',
  'languages',
  'hobbies',
  'references',
  'customDetails'
];

// ==================== HELPER FUNCTIONS ====================

function sanitizeText(text) {
  if (!text) return '';
  if (Array.isArray(text)) return text.join(', ');
  if (typeof text === 'object') return JSON.stringify(text);
  return String(text).trim();
}

function wrapText(doc, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const testWidth = doc.widthOfString(testLine);

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines;
}

function addBulletPoint(doc, text, x, y, maxWidth, colors, template = 'classic') {
  const spacing = getTemplateSpacing(template);

  doc.fillColor(colors.accent).circle(x - 10, y + 3, 1.5).fill();
  doc.fillColor(colors.secondary);
  const lineHeightPx = FONT_SIZES.body * spacing.lineHeight;

  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const testWidth = doc.widthOfString(testLine, { width: maxWidth - 20 });
    if (testWidth > maxWidth - 20 && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine) lines.push(currentLine);

  lines.forEach((line, index) => {
    doc.text(line, x, y + (index * lineHeightPx), {
      width: maxWidth - 20,
      align: 'left'
    });
  });

  return lineHeightPx * lines.length;
}

// ==================== TEMPLATE HEADER RENDERERS ====================

function renderHeader_Classic(doc, data, colors) {
  const { personalInfo } = data;

  // Centered header
  doc.fontSize(FONT_SIZES.name)
    .fillColor(colors.primary)
    .text(personalInfo.fullName || '', PAGE_CONFIG.margin, PAGE_CONFIG.margin, {
      align: 'center',
      width: PAGE_CONFIG.contentWidth
    });

  doc.moveDown(0.3);

  // Contact info - centered
  const contact = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.address,
    personalInfo.linkedin,
    personalInfo.website
  ].filter(Boolean).join(' | ');

  doc.fontSize(FONT_SIZES.contact)
    .fillColor(colors.secondary)
    .text(contact, {
      align: 'center',
      width: PAGE_CONFIG.contentWidth
    });

  // Line separator
  doc.moveDown(0.5);
  doc.moveTo(PAGE_CONFIG.margin, doc.y)
    .lineTo(PAGE_CONFIG.margin + PAGE_CONFIG.contentWidth, doc.y)
    .strokeColor(colors.primary)
    .lineWidth(2)
    .stroke();

  doc.moveDown(1);
}

function renderHeader_Minimal(doc, data, colors) {
  const { personalInfo } = data;

  // Left-aligned header
  doc.fontSize(FONT_SIZES.name)
    .fillColor(colors.primary)
    .font('Helvetica-Light')
    .text(personalInfo.fullName || '', PAGE_CONFIG.margin, PAGE_CONFIG.margin);

  doc.moveDown(0.5);

  // Contact info - stacked
  doc.fontSize(FONT_SIZES.contact)
    .fillColor(colors.light)
    .font('Helvetica');

  if (personalInfo.email) doc.text(personalInfo.email);
  if (personalInfo.phone) doc.text(personalInfo.phone);
  if (personalInfo.address) doc.text(personalInfo.address);
  if (personalInfo.linkedin) doc.text(personalInfo.linkedin);

  doc.moveDown(1.5);
}

function renderHeader_Modern(doc, data, colors) {
  const { personalInfo } = data;
  const headerHeight = 80;

  // Colored header background
  doc.rect(0, 0, PAGE_CONFIG.width, headerHeight)
    .fillAndStroke(colors.primary, colors.primary);

  // Name in white
  doc.fontSize(FONT_SIZES.name)
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .text(personalInfo.fullName || '', PAGE_CONFIG.margin, 25, {
      width: PAGE_CONFIG.contentWidth
    });

  // Contact in white
  const contact = [
    personalInfo.email,
    personalInfo.phone
  ].filter(Boolean).join(' | ');

  doc.fontSize(FONT_SIZES.contact)
    .fillColor('#FFFFFF')
    .font('Helvetica')
    .text(contact, PAGE_CONFIG.margin, 50);

  doc.y = headerHeight + 20;
}

function renderHeader_Tech(doc, data, colors) {
  // Dark theme header
  const { personalInfo } = data;

  doc.fontSize(FONT_SIZES.name - 2)
    .fillColor(colors.primary)
    .font('Courier-Bold')
    .text('> ' + (personalInfo.fullName || ''), PAGE_CONFIG.margin, PAGE_CONFIG.margin);

  doc.moveDown(0.3);

  doc.fontSize(FONT_SIZES.contact)
    .fillColor(colors.light)
    .font('Courier');

  if (personalInfo.email) doc.text('  email: ' + personalInfo.email);
  if (personalInfo.phone) doc.text('  phone: ' + personalInfo.phone);
  if (personalInfo.linkedin) doc.text('  linkedin: ' + personalInfo.linkedin);

  doc.moveDown(1.5);
}

function renderHeader_ATS(doc, data, colors) {
  // Simple ATS-friendly header
  const { personalInfo } = data;

  doc.fontSize(FONT_SIZES.name - 4)
    .fillColor(colors.primary)
    .font('Times-Bold')
    .text((personalInfo.fullName || '').toUpperCase(), {
      align: 'center',
      width: PAGE_CONFIG.contentWidth
    });

  doc.moveDown(0.3);

  const contact = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.address
  ].filter(Boolean).join(' | ');

  doc.fontSize(FONT_SIZES.contact)
    .fillColor(colors.secondary)
    .font('Times-Roman')
    .text(contact, {
      align: 'center',
      width: PAGE_CONFIG.contentWidth
    });

  doc.moveDown(1);
}

function renderHeader_PriyaAnalytics(doc, data, colors) {
  const { personalInfo = {} } = data;
  const headerHeight = 60;

  // Light grey bar across the top
  doc.rect(0, 0, PAGE_CONFIG.width, headerHeight)
    .fill('#f2f2f2');

  // Name
  doc.fillColor(colors.primary)
    .font('Helvetica-Bold')
    .fontSize(FONT_SIZES.name - 2)
    .text(personalInfo.fullName || '', PAGE_CONFIG.margin, 15, {
      width: PAGE_CONFIG.contentWidth
    });

  // Contact line
  const contact = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.address
  ].filter(Boolean).join(' | ');

  if (contact) {
    doc.font('Helvetica')
      .fontSize(FONT_SIZES.contact)
      .fillColor(colors.secondary)
      .text(contact, PAGE_CONFIG.margin, 33, {
        width: PAGE_CONFIG.contentWidth
      });
  }

  // Links (LinkedIn, GitHub, Website)
  const links = [
    personalInfo.linkedin ? `LinkedIn: ${personalInfo.linkedin}` : '',
    personalInfo.github ? `GitHub: ${personalInfo.github}` : '',
    personalInfo.website ? `Website: ${personalInfo.website}` : ''
  ].filter(Boolean).join('   ');

  if (links) {
    doc.fontSize(FONT_SIZES.contact)
      .fillColor(colors.secondary)
      .text(links, PAGE_CONFIG.margin, 45, {
        width: PAGE_CONFIG.contentWidth
      });
  }

  doc.y = headerHeight + 20;
}

// ==================== SECTION TITLE RENDERER ====================

function renderSectionTitle(doc, title, colors, template) {
  const spacing = getTemplateSpacing(template);
  doc.moveDown(0.3);
  switch (template) {
    case 'modern-pro':
    case 'corporate-ats':
    case 'elegant-gradient':
      doc.fontSize(FONT_SIZES.sectionTitle)
        .fillColor(colors.accent)
        .font('Helvetica-Bold')
        .text(title);
      doc.moveTo(PAGE_CONFIG.margin, doc.y + 3)
        .lineTo(PAGE_CONFIG.margin + 50, doc.y + 3)
        .strokeColor(colors.accent)
        .lineWidth(2)
        .stroke();
      break;

    case 'tech-focus':
      doc.fontSize(FONT_SIZES.sectionTitle)
        .fillColor(colors.primary)
        .font('Courier-Bold')
        .text('# ' + title);
      break;

    case 'ats-optimized':
    case 'priya-analytics':
      doc.fontSize(FONT_SIZES.sectionTitle)
        .fillColor(colors.primary)
        .font('Helvetica-Bold')
        .text(title, PAGE_CONFIG.margin, doc.y);
      // Full-width thin rule just below heading
      doc.moveTo(PAGE_CONFIG.margin, doc.y + 2)
        .lineTo(PAGE_CONFIG.margin + PAGE_CONFIG.contentWidth, doc.y + 2)
        .strokeColor(colors.primary)
        .lineWidth(0.8)
        .stroke();
      break;

    default:
      doc.fontSize(FONT_SIZES.sectionTitle)
        .fillColor(colors.primary)
        .font('Helvetica-Bold')
        .text(title);
  }
  doc.moveDown(spacing.paragraphGap / 10);
}

// ==================== MAIN TEMPLATE GENERATOR ====================

export async function generateUnifiedResume(data, templateId, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const template = templateId || 'classic';
      const colors = TEMPLATE_COLORS[template] || TEMPLATE_COLORS['classic'];
      const spacing = getTemplateSpacing(template);

      // Create PDF document
      const doc = new PDFDocument(PAGE_CONFIG);
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      // Set default font
      doc.font('Helvetica');

      // Render header based on template
      switch (template) {
        case 'minimal':
          renderHeader_Minimal(doc, data, colors);
          break;
        case 'modern-pro':
        case 'portfolio-style':
        case 'creative-bold':
          renderHeader_Modern(doc, data, colors);
          break;
        case 'tech-focus':
          renderHeader_Tech(doc, data, colors);
          break;
        case 'ats-optimized':
        case 'corporate-ats':
          renderHeader_ATS(doc, data, colors);
          break;
        case 'priya-analytics':
          renderHeader_PriyaAnalytics(doc, data, colors);
          break;
        default:
          renderHeader_Classic(doc, data, colors);
      }

      // Render sections in standardized order
      SECTION_ORDER.forEach(sectionKey => {
        renderSection(doc, sectionKey, data, colors, template, spacing);
      });

      // Finalize PDF
      doc.end();

      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
}

// ==================== SECTION RENDERERS ====================

// Helper to check page break
function checkPageBreak(doc, heightNeeded = 60) {
  if (doc.y + heightNeeded > PAGE_CONFIG.height - PAGE_CONFIG.margin) {
    doc.addPage();
    return true;
  }
  return false;
}

function renderSection(doc, sectionKey, data, colors, template, spacing = SPACING) {
  const maxWidth = PAGE_CONFIG.contentWidth;

  switch (sectionKey) {
    case 'summary':
      if (data.summary) {
        checkPageBreak(doc, 100);
        renderSectionTitle(doc, 'Professional Summary', colors, template);
        doc.fontSize(FONT_SIZES.body)
          .fillColor(colors.secondary)
          .font('Helvetica')
          .text(data.summary, {
            width: maxWidth,
            align: 'justify'
          });
        doc.moveDown(SPACING.sectionGap / 10);
      }
      break;

    case 'experience':
      if (data.experience && data.experience.length > 0) {
        checkPageBreak(doc, 100);
        renderSectionTitle(doc, 'Work Experience', colors, template);
        data.experience.forEach((exp, index) => {
          checkPageBreak(doc, 80); // Check before each item
          // Job title
          doc.fontSize(FONT_SIZES.jobTitle)
            .fillColor(colors.primary)
            .font('Helvetica-Bold')
            .text(exp.jobTitle || '', PAGE_CONFIG.margin, doc.y);

          // Company and dates
          doc.fontSize(FONT_SIZES.body)
            .fillColor(colors.secondary)
            .font('Helvetica');

          const companyLine = [exp.company, exp.startDate + (exp.endDate ? ' - ' + exp.endDate : ' - Present')].filter(Boolean).join(' | ');
          doc.text(companyLine);

          // Description with bullets
          if (exp.description) {
            doc.moveDown(0.2);
            const bullets = exp.description.split('\n').filter(b => b.trim());
            bullets.forEach(bullet => {
              checkPageBreak(doc, 20); // Check before each bullet
              const cleanBullet = bullet.replace(/^[•\-\*]\s*/, '');
              const height = addBulletPoint(doc, cleanBullet, PAGE_CONFIG.margin + spacing.bulletIndent, doc.y, maxWidth, colors, template);
              doc.y += height + 2;
            });
          }

          if (index < data.experience.length - 1) doc.moveDown(spacing.itemGap / 10);
        });
        doc.moveDown(spacing.sectionGap / 10);
      }
      break;

    case 'education':
      if (data.education && data.education.length > 0) {
        checkPageBreak(doc, 100);
        renderSectionTitle(doc, 'Education', colors, template);
        data.education.forEach((edu, index) => {
          checkPageBreak(doc, 50);
          doc.fontSize(FONT_SIZES.jobTitle)
            .fillColor(colors.primary)
            .font('Helvetica-Bold')
            .text(edu.degree || '', PAGE_CONFIG.margin, doc.y);

          doc.fontSize(FONT_SIZES.body)
            .fillColor(colors.secondary)
            .font('Helvetica');

          const eduLine = [edu.school, edu.gradYear, edu.gpa ? 'GPA: ' + edu.gpa : ''].filter(Boolean).join(' | ');
          doc.text(eduLine);

          if (index < data.education.length - 1) doc.moveDown(spacing.itemGap / 10);
        });
        doc.moveDown(spacing.sectionGap / 10);
      }
      break;

    case 'technicalSkills':
      if (data.technicalSkills) {
        checkPageBreak(doc, 100);
        renderSectionTitle(doc, 'Technical Skills', colors, template);
        doc.fontSize(FONT_SIZES.body)
          .fillColor(colors.secondary)
          .font('Helvetica')
          .text(data.technicalSkills, {
            width: maxWidth,
            align: 'justify'
          });
        doc.moveDown(spacing.sectionGap / 10);
      }
      break;

    case 'softSkills':
      if (data.softSkills) {
        checkPageBreak(doc, 100);
        renderSectionTitle(doc, 'Soft Skills', colors, template);
        doc.fontSize(FONT_SIZES.body)
          .fillColor(colors.secondary)
          .font('Helvetica')
          .text(data.softSkills, {
            width: maxWidth,
            align: 'justify'
          });
        doc.moveDown(spacing.sectionGap / 10);
      }
      break;

    case 'projects':
      if (data.projects && (Array.isArray(data.projects) || typeof data.projects === 'string')) {
        checkPageBreak(doc, 100);
        renderSectionTitle(doc, 'Projects', colors, template);

        if (Array.isArray(data.projects)) {
          // Newer schema: array of project objects
          data.projects.forEach((proj, index) => {
            checkPageBreak(doc, 80); // Increased safety for project items
            const title = proj.name || proj.title || '';
            const tech = proj.technologies || proj.techStack || '';
            const duration = proj.duration || '';
            const desc = proj.description || '';
            const link = proj.link || proj.url || '';
            const achievement = proj.achievement || proj.result || '';

            if (title) {
              doc.fontSize(FONT_SIZES.jobTitle)
                .fillColor(colors.primary)
                .font('Helvetica-Bold')
                .text(title);
            }

            doc.fontSize(FONT_SIZES.body)
              .fillColor(colors.secondary)
              .font('Helvetica');

            const metaParts = [tech, duration].filter(Boolean);
            if (metaParts.length) {
              doc.text(metaParts.join(' '));
            }

            if (desc) {
              doc.text(desc, { width: maxWidth });
            }

            if (achievement) {
              doc.text('Achievement: ' + achievement, { width: maxWidth });
            }

            if (link) {
              doc.fillColor(colors.accent)
                .text(link, { width: maxWidth });
              doc.fillColor(colors.secondary);
            }

            if (index < data.projects.length - 1) {
              doc.moveDown(spacing.itemGap / 10);
            }
          });
        } else if (typeof data.projects === 'string') {
          // Legacy schema: big string with blank-line separated projects
          const projectLines = data.projects.split('\n\n');
          projectLines.forEach((project, index) => {
            checkPageBreak(doc, 40);
            const lines = project.split('\n');
            if (lines[0]) {
              doc.fontSize(FONT_SIZES.jobTitle)
                .fillColor(colors.primary)
                .font('Helvetica-Bold')
                .text(lines[0]);

              if (lines.length > 1) {
                doc.fontSize(FONT_SIZES.body)
                  .fillColor(colors.secondary)
                  .font('Helvetica')
                  .text(lines.slice(1).join(' '), {
                    width: maxWidth
                  });
              }
            }
            if (index < projectLines.length - 1) doc.moveDown(spacing.itemGap / 10);
          });
        }

        doc.moveDown(spacing.sectionGap / 10);
      }
      break;

    case 'certifications':
      let certifications = [];

      // Handle undefined/null
      if (!data.certifications) {
        certifications = [];
      }
      // If already an array
      else if (Array.isArray(data.certifications)) {
        certifications = data.certifications;
      }
      // If it's an object
      else if (typeof data.certifications === 'object') {
        certifications = Object.values(data.certifications).map(item => sanitizeText(item)).filter(Boolean);
      }
      // If it's a string
      else if (typeof data.certifications === 'string') {
        certifications = data.certifications.split(/[\n,]/).map(c => c.trim()).filter(Boolean);
      }

      if (certifications.length > 0) {
        checkPageBreak(doc, 100);
        renderSectionTitle(doc, 'Certifications', colors, template);

        certifications.forEach(cert => {
          checkPageBreak(doc, 20);
          const text =
            typeof cert === 'string'
              ? cert
              : cert?.name || cert?.title || sanitizeText(cert);

          if (!text) return;

          const height = addBulletPoint(
            doc,
            text,
            PAGE_CONFIG.margin + SPACING.bulletIndent,
            doc.y,
            maxWidth,
            colors
          );
          doc.y += height + 2;
          doc.moveDown(0.3);
        });

        doc.moveDown(spacing.sectionGap / 10);
      }
      break;

    case 'achievements':
      if (data.achievements) {
        // Prepare content first
        const achievements = Array.isArray(data.achievements)
          ? data.achievements
          : typeof data.achievements === 'string'
            ? data.achievements.split(/[\n,]/).map(a => a.trim()).filter(Boolean)
            : [];

        if (achievements.length > 0) {
          checkPageBreak(doc, 100);
          renderSectionTitle(doc, 'Achievements', colors, template);

          achievements.forEach(achievement => {
            checkPageBreak(doc, 20);
            const text = typeof achievement === 'string'
              ? achievement
              : achievement?.title || achievement?.name || sanitizeText(achievement);

            if (!text) return;

            const height = addBulletPoint(doc, text, PAGE_CONFIG.margin + SPACING.bulletIndent, doc.y, maxWidth, colors);
            doc.y += height + 2;
            doc.moveDown(0.3);
          });

          doc.moveDown(spacing.sectionGap / 10);
        }
      }
      break;

    case 'languages':
      if (data.languages) {
        checkPageBreak(doc, 100);
        renderSectionTitle(doc, 'Languages', colors, template);
        doc.fontSize(FONT_SIZES.body)
          .fillColor(colors.secondary)
          .font('Helvetica')
          .text(data.languages, {
            width: maxWidth
          });
        doc.moveDown(spacing.sectionGap / 10);
      }
      break;

    case 'hobbies':
      if (data.hobbies) {
        checkPageBreak(doc, 100);
        renderSectionTitle(doc, 'Hobbies & Interests', colors, template);
        doc.fontSize(FONT_SIZES.body)
          .fillColor(colors.secondary)
          .font('Helvetica')
          .text(data.hobbies, {
            width: maxWidth
          });
        doc.moveDown(spacing.sectionGap / 10);
      }
      break;

    case 'references':
      if (data.references && data.references.length > 0) {
        checkPageBreak(doc, 100);
        renderSectionTitle(doc, 'References', colors, template);
        data.references.forEach((ref, index) => {
          checkPageBreak(doc, 60); // Ensure reference doesn't split awkwardly
          doc.fontSize(FONT_SIZES.jobTitle)
            .fillColor(colors.primary)
            .font('Helvetica-Bold')
            .text(ref.name || '');

          doc.fontSize(FONT_SIZES.body)
            .fillColor(colors.secondary)
            .font('Helvetica');

          if (ref.title) doc.text(ref.title + (ref.company ? ' - ' + ref.company : ''));
          if (ref.phone) doc.text('Phone: ' + ref.phone);
          if (ref.email) doc.text('Email: ' + ref.email);

          if (index < data.references.length - 1) doc.moveDown(spacing.itemGap / 10);
        });
        doc.moveDown(spacing.sectionGap / 10);
      }
      break;

    case 'customDetails':
      if (data.customDetails && data.customDetails.length > 0) {
        data.customDetails.forEach(custom => {
          if (custom.heading && custom.content) {
            checkPageBreak(doc, 100);
            renderSectionTitle(doc, custom.heading, colors, template);
            doc.fontSize(FONT_SIZES.body)
              .fillColor(colors.secondary)
              .font('Helvetica')
              .text(custom.content, {
                width: maxWidth,
                align: 'justify'
              });
            doc.moveDown(spacing.sectionGap / 10);
          }
        });
      }
      break;
  }
}

export { TEMPLATE_COLORS, FONT_SIZES, SPACING, PAGE_CONFIG };
