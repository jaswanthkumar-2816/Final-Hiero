/**
 * 🎨 UNIFIED RESUME TEMPLATE SYSTEM (CommonJS / Stream-compatible)
 * 
 * This module provides a standardized, fast PDF generation system for all 10 resume templates.
 * Ported to CommonJS for use in Gateway.
 */

const PDFDocument = require('pdfkit');

// ==================== STANDARDIZED CONFIGURATION ====================

// Unified page settings for all templates (Optimized for space)
const PAGE_CONFIG = {
    size: 'A4',
    margin: 40,     // Reduced from 50 to save space
    width: 595.28,
    height: 841.89,
    contentWidth: 515.28  // Adjusted for new margins
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
    // Rishi: Hiero Pro (Modern Tech Black & Green)
    'rishi': {
        primary: '#111827',      // Deep Navy/Black
        secondary: '#4b5563',    // Slate Grey
        accent: '#2ae023',       // Hiero Green
        background: '#FFFFFF',
        light: '#f3f4f6'         // Subdued background for pills
    },
    // Priya: Analytics Professional (Daniel Gallego / Grey Pill Style)
    'priya-analytics': {
        primary: '#111827',      // Darker Grey/Black
        secondary: '#374151',    // Medium Grey
        accent: '#4b5563',       // Accent Grey
        background: '#FFFFFF',
        light: '#e5e7eb'         // Pill Background Color
    },
    'hiero-executive': {
        primary: '#000000',
        secondary: '#333333',
        accent: '#000000',
        background: '#FFFFFF',
        light: '#666666'
    },
    'hiero-studio': {
        primary: '#ffffff',       // Sidebar Text (Name)
        secondary: '#f3f4f6',     // Sidebar Secondary Text
        accent: '#993333',        // Sidebar Background (Project Red/Brown) & Main Headers
        background: '#FFFFFF',    // Main Background
        light: '#1f2937'          // Main Text Color (Dark Grey)
    },
    'hiero-onyx': {
        primary: '#000000',
        secondary: '#111827',
        accent: '#374151',
        background: '#FFFFFF',
        light: '#f3f4f6'
    },
    'template-4': {
        primary: '#000000',
        secondary: '#333333',
        accent: '#000000',
        background: '#FFFFFF',
        light: '#666666'
    },
    // ========== NEW TEMPLATES (10 Additional) ==========
    'quantum-blue': {
        primary: '#1e40af',      // Deep Blue
        secondary: '#3b82f6',    // Bright Blue
        accent: '#60a5fa',       // Light Blue
        background: '#FFFFFF',
        light: '#dbeafe'         // Pale Blue
    },
    'emerald-elite': {
        primary: '#065f46',      // Forest Green
        secondary: '#059669',    // Emerald
        accent: '#10b981',       // Bright Emerald
        background: '#FFFFFF',
        light: '#d1fae5'         // Pale Green
    },
    'crimson-professional': {
        primary: '#991b1b',      // Dark Red
        secondary: '#dc2626',    // Crimson
        accent: '#ef4444',       // Bright Red
        background: '#FFFFFF',
        light: '#fee2e2'         // Pale Red
    },
    'sapphire-tech': {
        primary: '#1e3a8a',      // Navy Blue
        secondary: '#2563eb',    // Royal Blue
        accent: '#3b82f6',       // Sapphire
        background: '#FFFFFF',
        light: '#dbeafe'         // Sky Blue
    },
    'golden-executive': {
        primary: '#92400e',      // Dark Brown
        secondary: '#b45309',    // Bronze
        accent: '#f59e0b',       // Gold
        background: '#FFFFFF',
        light: '#fef3c7'         // Pale Yellow
    },
    'violet-creative': {
        primary: '#5b21b6',      // Deep Violet
        secondary: '#7c3aed',    // Purple
        accent: '#a78bfa',       // Light Purple
        background: '#FFFFFF',
        light: '#ede9fe'         // Pale Violet
    },
    'ocean-minimal': {
        primary: '#0c4a6e',      // Deep Ocean
        secondary: '#0369a1',    // Ocean Blue
        accent: '#0ea5e9',       // Cyan
        background: '#FFFFFF',
        light: '#e0f2fe'         // Pale Cyan
    },
    'slate-modern': {
        primary: '#1e293b',      // Slate Dark
        secondary: '#475569',    // Slate Grey
        accent: '#64748b',       // Light Slate
        background: '#FFFFFF',
        light: '#f1f5f9'         // Pale Slate
    },
    'ruby-bold': {
        primary: '#881337',      // Deep Ruby
        secondary: '#be123c',    // Rose
        accent: '#e11d48',       // Pink Red
        background: '#FFFFFF',
        light: '#ffe4e6'         // Pale Pink
    },
    'azure-corporate': {
        primary: '#164e63',      // Teal Dark
        secondary: '#0891b2',    // Cyan
        accent: '#06b6d4',       // Azure
        background: '#FFFFFF',
        light: '#cffafe'         // Pale Teal
    },
    'hiero-essence': {
        primary: '#ffffff',      // White for main text
        secondary: '#aaaaaa',    // Grey for subtitles
        accent: '#f5a623',       // Orange Accent
        background: '#121212',   // Very Dark Background for main
        sidebarBg: '#1e1e1e',    // Slightly lighter dark for sidebar
        sidebarText: '#ffffff'   // White text for sidebar
    }
};

// Map template IDs to their internal keys
const TEMPLATE_MAP = {
    'template4': 'template-4',
    'template-4': 'template-4',
    'hiero-studio': 'hiero-studio',
    'hiero-essence': 'hiero-essence',
    'essence': 'hiero-essence'
};

// Standardized font sizes (Refined for a 'Perfect' look)
const FONT_SIZES = {
    name: 20,            // Slightly smaller for better fit
    sectionTitle: 12,
    jobTitle: 10.5,
    body: 10,            // Standard compact professional size
    contact: 9.5,
    small: 8.5
};

// Standardized spacing (Ultra-Compact for One-Page perfection)
const SPACING = {
    lineHeight: 1.15,    // Tighter for better content density
    sectionGap: 7,       // Reduced
    itemGap: 3,          // Minimal gaps
    paragraphGap: 2,
    bulletIndent: 12
};

// Helper to get per-template spacing overrides (Now Unified for density)
function getTemplateSpacing(template) {
    if (template === 'priya-analytics' || template === 'rishi' || template === 'template-4') {
        return {
            lineHeight: 1.15,
            sectionGap: 7,
            itemGap: 3,
            paragraphGap: 3,
            bulletIndent: 12
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
    'extraCurricular',
    'references',
    'customDetails',
    'customSectionContent'
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

const toArray = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') return v.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
    return [];
};

function normalizeData(data = {}) {
    if (!data || typeof data !== 'object') data = {};
    const p = data.personalInfo || {};

    const getArr = (v, aliases = []) => {
        if (Array.isArray(v) && v.length > 0) return v;
        for (let alias of aliases) {
            if (data[alias] && Array.isArray(data[alias]) && data[alias].length > 0) return data[alias];
            if (p[alias] && Array.isArray(p[alias]) && p[alias].length > 0) return p[alias];
        }
        if (typeof v === 'string') return toArray(v);
        return [];
    };

    const getStr = (v, aliases = []) => {
        if (v && typeof v === 'string' && v.trim().length > 0) return v;
        for (let alias of aliases) {
            if (data[alias] && typeof data[alias] === 'string' && data[alias].trim().length > 0) return data[alias];
            if (p[alias] && typeof p[alias] === 'string' && p[alias].trim().length > 0) return p[alias];
        }
        return '';
    };

    try {
        return {
            ...data,
            personalInfo: {
                fullName: p.fullName || p.name || data.fullName || data.name || '',
                email: p.email || data.email || '',
                phone: p.phone || data.phone || '',
                address: p.address || data.address || p.location || data.location || '',
                linkedin: p.linkedin || data.linkedin || '',
                github: p.github || data.github || '',
                website: p.website || data.website || '',
                roleTitle: p.roleTitle || p.headline || p.role || data.roleTitle || data.headline || data.role || '',
                dateOfBirth: p.dateOfBirth || data.dateOfBirth || '',
                gender: p.gender || data.gender || '',
                nationality: p.nationality || data.nationality || '',
                maritalStatus: p.maritalStatus || data.maritalStatus || '',
                languagesKnown: p.languagesKnown || data.languages || '',
                profilePhoto: p.profilePhoto || p.picture || data.profilePhoto || data.picture || data.photoUrl || ''
            },
            summary: getStr(data.summary, ['aboutMe', 'personalSummary', 'about', 'objective', 'professionalSummary']),
            experience: getArr(data.experience, ['workHistory', 'workExperience', 'experienceList', 'work', 'employmentHistory']).map(exp => {
                const dates = String(exp.dates || '');
                return {
                    jobTitle: exp.jobTitle || exp.title || exp.position || exp.role || '',
                    company: exp.company || exp.organization || '',
                    startDate: exp.startDate || exp.start || (dates ? dates.split('-')[0]?.trim() : ''),
                    endDate: exp.endDate || exp.end || (dates ? dates.split('-')[1]?.trim() : 'Present'),
                    description: exp.description || exp.responsibilities || (Array.isArray(exp.points) ? exp.points.join('\n') : ''),
                    location: exp.location || ''
                };
            }),
            education: getArr(data.education, ['academicDetails', 'educationList', 'academics', 'academicHistory']).map(edu => {
                const dates = String(edu.dates || '');
                return {
                    degree: edu.degree || edu.course || '',
                    school: edu.school || edu.institution || edu.institute || '',
                    gradYear: edu.gradYear || edu.year || edu.graduationDate || (dates ? dates.split('-')[1]?.trim() || dates : ''),
                    gpa: edu.gpa || edu.grade || edu.details || '',
                    location: edu.location || ''
                };
            }),
            skills: getArr(data.skills, ['technicalSkills', 'professionalSkills', 'skillsList', 'coreCompetencies', 'expertise']),
            softSkills: getArr(data.softSkills, ['managementSkills', 'interpersonalSkills', 'softSkillsList']),
            certifications: getArr(data.certifications, ['certificates', 'personalCertifications', 'awards']).map(c => typeof c === 'string' ? { name: c } : c),
            projects: getArr(data.projects, ['projectList', 'customDetails', 'personalProjects']).filter(proj => !proj.heading || proj.heading.toLowerCase().includes('project')).map(proj => {
                return {
                    title: proj.title || proj.projectName || proj.name || proj.heading || '',
                    description: proj.description || proj.details || proj.content || '',
                    tech: proj.tech || proj.technologies || proj.techStack || '',
                    duration: proj.duration || proj.date || ''
                };
            }),
            achievements: getArr(data.achievements, ['awards', 'honors', 'achievementsList']),
            hobbies: getArr(data.hobbies, ['interests', 'hobbiesList', 'activities']),
            extraCurricular: getArr(data.extraCurricular, ['activities', 'volunteerWork']),
            socialLinks: getArr(data.socialLinks, ['socials', 'links', 'onlinePortfolios']),
            languages: getArr(data.languages, ['languagesKnown', 'languagesList']),
            referencesText: data.referencesText || (Array.isArray(data.references) && data.references.length > 0 ? '' : 'Available upon request'),
            references: Array.isArray(data.references) ? data.references : []
        };
    } catch (err) {
        console.error('CRITICAL: normalizeData failed:', err);
        return data;
    }
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

function renderHeader_Rishi(doc, data, colors) {
    const { personalInfo = {} } = data;

    // LEFT VERTICAL STRIPE FOR LOGO-STYLE ACCENT
    doc.rect(PAGE_CONFIG.margin - 10, PAGE_CONFIG.margin, 3, 40)
        .fill(colors.accent);

    // NAME & SUBTITLE
    doc.fontSize(FONT_SIZES.name + 4)
        .fillColor(colors.primary)
        .font('Helvetica-Bold')
        .text(personalInfo.fullName || '', PAGE_CONFIG.margin + 5, PAGE_CONFIG.margin);

    doc.moveDown(0.1);

    // Modern clean contact line (Pipe separated)
    doc.fontSize(FONT_SIZES.contact)
        .fillColor(colors.secondary)
        .font('Helvetica')
        .text((personalInfo.address || '').toUpperCase(), PAGE_CONFIG.margin + 5);

    doc.moveDown(0.2);

    const contactParts = [personalInfo.email, personalInfo.phone].filter(Boolean);
    const contactStr = contactParts.join('  •  ');

    doc.fillColor(colors.secondary).text(contactStr, PAGE_CONFIG.margin + 5);

    // Links with accent color
    const links = [personalInfo.linkedin, personalInfo.website].filter(Boolean).join('  |  ');
    if (links) {
        doc.moveDown(0.1);
        doc.fillColor(colors.accent).text(links, PAGE_CONFIG.margin + 5);
    }

    doc.moveDown(0.8);
    // Subtle double-tone line
    doc.moveTo(PAGE_CONFIG.margin, doc.y)
        .lineTo(PAGE_CONFIG.margin + PAGE_CONFIG.contentWidth, doc.y)
        .strokeColor(colors.light)
        .lineWidth(0.5)
        .stroke();

    doc.moveDown(0.5);
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

    // Name (Bold & Large)
    doc.fontSize(FONT_SIZES.name + 2)
        .fillColor(colors.primary)
        .font('Helvetica-Bold')
        .text(personalInfo.fullName || '', PAGE_CONFIG.margin, PAGE_CONFIG.margin);

    doc.moveDown(0.1);

    // Job Title - Assuming it's in summary or first exp if not provided
    const jobTitle = data.experience?.[0]?.jobTitle || 'PROFESSIONAL';
    doc.fontSize(FONT_SIZES.jobTitle + 2)
        .fillColor(colors.primary)
        .text(jobTitle.toUpperCase());

    doc.moveDown(0.2);

    // Contact info bar
    const contact = [
        personalInfo.address,
        personalInfo.phone,
        personalInfo.email,
        personalInfo.website
    ].filter(Boolean).join(' | ');

    doc.fontSize(FONT_SIZES.contact)
        .fillColor(colors.secondary)
        .font('Helvetica')
        .text(contact);

    doc.moveDown(1.5);
}

function renderHeader_Executive(doc, data, colors) {
    const { personalInfo = {} } = data;
    const rightMargin = PAGE_CONFIG.margin + PAGE_CONFIG.contentWidth;

    // Left side: Name and Title
    doc.fontSize(FONT_SIZES.name + 2)
        .fillColor(colors.primary)
        .font('Helvetica-Bold')
        .text(personalInfo.fullName || '', PAGE_CONFIG.margin, PAGE_CONFIG.margin);

    doc.moveDown(0.1);

    // MORGAN MAXWELL STYLE: ALL CAPS, SPACED, ITALIC
    const jobTitle = (data.experience?.[0]?.jobTitle || 'PROFESSIONAL').toUpperCase();
    doc.fontSize(FONT_SIZES.jobTitle + 1)
        .font('Helvetica-Oblique')
        .text(jobTitle.split('').join(' '));

    // Right side: Contact
    const contactInfo = [
        personalInfo.phone,
        personalInfo.email,
        personalInfo.linkedin,
        personalInfo.address
    ].filter(Boolean);

    let currentY = PAGE_CONFIG.margin + 5;
    contactInfo.forEach(info => {
        doc.fontSize(FONT_SIZES.contact)
            .fillColor(colors.secondary)
            .font('Helvetica')
            .text(info, PAGE_CONFIG.margin, currentY, { align: 'right', width: PAGE_CONFIG.contentWidth });
        currentY += 14;
    });

    doc.moveDown(0.8);
    doc.moveTo(PAGE_CONFIG.margin, doc.y)
        .lineTo(rightMargin, doc.y)
        .strokeColor(colors.light)
        .lineWidth(0.5)
        .stroke();
    doc.moveDown(1.5);
}

function renderHeader_Studio(doc, data, colors) {
    const { personalInfo = {} } = data;

    doc.fontSize(FONT_SIZES.name + 6)
        .fillColor(colors.primary)
        .font('Helvetica-Bold')
        .text(personalInfo.fullName || '', { align: 'center' });

    doc.moveDown(0.1);
    doc.fontSize(FONT_SIZES.jobTitle + 2)
        .font('Helvetica')
        .text(data.experience?.[0]?.jobTitle || 'WEB DEVELOPMENT', { align: 'center' });

    doc.moveDown(0.2);
    doc.moveTo(PAGE_CONFIG.margin + (PAGE_CONFIG.contentWidth / 2) - 20, doc.y)
        .lineTo(PAGE_CONFIG.margin + (PAGE_CONFIG.contentWidth / 2) + 20, doc.y)
        .strokeColor(colors.primary)
        .lineWidth(2)
        .stroke();

    doc.moveDown(0.5);
    const contact = [personalInfo.address, personalInfo.email, personalInfo.website].filter(Boolean).join(' | ');
    doc.fontSize(FONT_SIZES.contact)
        .font('Helvetica')
        .text(contact, { align: 'center' });

    doc.moveDown(1);
    doc.moveTo(PAGE_CONFIG.margin, doc.y)
        .lineTo(PAGE_CONFIG.margin + PAGE_CONFIG.contentWidth, doc.y)
        .strokeColor(colors.primary)
        .lineWidth(0.8)
        .stroke();
    doc.moveDown(1.2);
}

function renderHeader_Academic(doc, data, colors) {
    const { personalInfo = {} } = data;

    // Centered header (Times New Roman feel)
    doc.fontSize(FONT_SIZES.name + 2)
        .fillColor(colors.primary)
        .font('Times-Bold')
        .text(personalInfo.fullName || '', PAGE_CONFIG.margin, PAGE_CONFIG.margin, {
            align: 'center',
            width: PAGE_CONFIG.contentWidth
        });

    doc.moveDown(0.2);

    doc.fontSize(FONT_SIZES.contact)
        .fillColor(colors.secondary)
        .font('Times-Roman');

    if (personalInfo.address) {
        doc.text(personalInfo.address, { align: 'center' });
    }

    const contact = [
        personalInfo.phone ? `(+91) ${personalInfo.phone}` : null,
        personalInfo.email
    ].filter(Boolean).join('  ');

    if (contact) {
        doc.text(contact, { align: 'center' });
    }

    doc.moveDown(1);
}

// ==================== NEW TEMPLATE HEADERS (10 Additional) ====================

function renderHeader_QuantumBlue(doc, data, colors) {
    const { personalInfo = {} } = data;

    // Modern professional with blue accent bar
    doc.rect(PAGE_CONFIG.margin, PAGE_CONFIG.margin - 10, PAGE_CONFIG.contentWidth, 4)
        .fill(colors.accent);

    doc.moveDown(0.5);
    doc.fontSize(FONT_SIZES.name + 3)
        .fillColor(colors.primary)
        .font('Helvetica-Bold')
        .text(personalInfo.fullName || '', PAGE_CONFIG.margin, doc.y);

    doc.moveDown(0.3);
    const contact = [personalInfo.email, personalInfo.phone, personalInfo.linkedin].filter(Boolean).join('  •  ');
    doc.fontSize(FONT_SIZES.contact)
        .fillColor(colors.secondary)
        .font('Helvetica')
        .text(contact);

    doc.moveDown(1);
}

function renderHeader_EmeraldElite(doc, data, colors) {
    const { personalInfo = {} } = data;

    // Executive style with emerald accent
    doc.fontSize(FONT_SIZES.name + 4)
        .fillColor(colors.primary)
        .font('Helvetica-Bold')
        .text(personalInfo.fullName || '', PAGE_CONFIG.margin, PAGE_CONFIG.margin, {
            align: 'center',
            width: PAGE_CONFIG.contentWidth
        });

    doc.moveDown(0.2);
    doc.moveTo(PAGE_CONFIG.margin + (PAGE_CONFIG.contentWidth / 2) - 30, doc.y)
        .lineTo(PAGE_CONFIG.margin + (PAGE_CONFIG.contentWidth / 2) + 30, doc.y)
        .strokeColor(colors.accent)
        .lineWidth(3)
        .stroke();

    doc.moveDown(0.5);
    const contact = [personalInfo.phone, personalInfo.email, personalInfo.address].filter(Boolean).join(' | ');
    doc.fontSize(FONT_SIZES.contact)
        .fillColor(colors.secondary)
        .text(contact, { align: 'center' });

    doc.moveDown(1.5);
}

function renderHeader_CrimsonProfessional(doc, data, colors) {
    const { personalInfo = {} } = data;

    // Traditional format with crimson accents
    doc.fontSize(FONT_SIZES.name + 2)
        .fillColor(colors.primary)
        .font('Helvetica-Bold')
        .text(personalInfo.fullName || '', PAGE_CONFIG.margin, PAGE_CONFIG.margin);

    doc.moveDown(0.4);
    doc.moveTo(PAGE_CONFIG.margin, doc.y)
        .lineTo(PAGE_CONFIG.margin + PAGE_CONFIG.contentWidth, doc.y)
        .strokeColor(colors.accent)
        .lineWidth(2)
        .stroke();

    doc.moveDown(0.5);
    doc.fontSize(FONT_SIZES.contact)
        .fillColor(colors.secondary)
        .font('Helvetica');

    [personalInfo.email, personalInfo.phone, personalInfo.address].filter(Boolean).forEach(info => {
        doc.text(info);
    });

    doc.moveDown(1);
}

function renderHeader_SapphireTech(doc, data, colors) {
    const { personalInfo = {} } = data;

    // Tech-focused with modern sapphire design
    doc.fontSize(FONT_SIZES.name)
        .fillColor(colors.primary)
        .font('Helvetica-Bold')
        .text('< ' + (personalInfo.fullName || '') + ' />', PAGE_CONFIG.margin, PAGE_CONFIG.margin);

    doc.moveDown(0.5);
    doc.fontSize(FONT_SIZES.contact)
        .fillColor(colors.accent)
        .font('Courier');

    if (personalInfo.email) doc.text('  > email: ' + personalInfo.email);
    if (personalInfo.phone) doc.text('  > phone: ' + personalInfo.phone);
    if (personalInfo.linkedin) doc.text('  > linkedin: ' + personalInfo.linkedin);

    doc.moveDown(1.2);
}

function renderHeader_GoldenExecutive(doc, data, colors) {
    const { personalInfo = {} } = data;

    // Luxury executive style with golden accents
    doc.rect(0, 0, PAGE_CONFIG.width, 100)
        .fillAndStroke(colors.light, colors.light);

    doc.fontSize(FONT_SIZES.name + 5)
        .fillColor(colors.primary)
        .font('Times-Bold')
        .text(personalInfo.fullName || '', PAGE_CONFIG.margin, 25, {
            align: 'center',
            width: PAGE_CONFIG.contentWidth
        });

    doc.moveDown(0.3);
    doc.fontSize(FONT_SIZES.jobTitle)
        .fillColor(colors.secondary)
        .font('Times-Italic')
        .text(data.experience?.[0]?.jobTitle || 'SENIOR EXECUTIVE', {
            align: 'center'
        });

    doc.moveDown(0.4);
    const contact = [personalInfo.email, personalInfo.phone].filter(Boolean).join('  |  ');
    doc.fontSize(FONT_SIZES.contact)
        .fillColor(colors.secondary)
        .font('Times-Roman')
        .text(contact, { align: 'center' });

    doc.y = 115;
}


function renderHeader_VioletCreative(doc, data, colors) {
    const { personalInfo = {} } = data;

    // Creative purple-themed design
    doc.fontSize(FONT_SIZES.name + 6)
        .fillColor(colors.primary)
        .font('Helvetica-Bold')
        .text(personalInfo.fullName || '', PAGE_CONFIG.margin, PAGE_CONFIG.margin, {
            align: 'center',
            width: PAGE_CONFIG.contentWidth
        });

    doc.moveDown(0.3);

    // Creative wave line
    const centerX = PAGE_CONFIG.margin + (PAGE_CONFIG.contentWidth / 2);
    doc.moveTo(centerX - 40, doc.y)
        .lineTo(centerX - 20, doc.y + 3)
        .lineTo(centerX, doc.y)
        .lineTo(centerX + 20, doc.y + 3)
        .lineTo(centerX + 40, doc.y)
        .strokeColor(colors.accent)
        .lineWidth(2)
        .stroke();

    doc.moveDown(0.8);
    const contact = [personalInfo.email, personalInfo.phone, personalInfo.website].filter(Boolean).join(' • ');
    doc.fontSize(FONT_SIZES.contact)
        .fillColor(colors.secondary)
        .text(contact, { align: 'center' });

    doc.moveDown(1.5);
}

function renderHeader_OceanMinimal(doc, data, colors) {
    const { personalInfo = {} } = data;

    // Minimalist ocean theme
    doc.fontSize(FONT_SIZES.name)
        .fillColor(colors.primary)
        .font('Helvetica-Light')
        .text(personalInfo.fullName || '', PAGE_CONFIG.margin, PAGE_CONFIG.margin);

    doc.moveDown(0.4);
    doc.fontSize(FONT_SIZES.contact)
        .fillColor(colors.secondary)
        .font('Helvetica');

    const contactLine = [personalInfo.email, personalInfo.phone, personalInfo.address].filter(Boolean).join('  |  ');
    doc.text(contactLine);

    if (personalInfo.linkedin || personalInfo.website) {
        doc.moveDown(0.1);
        const links = [personalInfo.linkedin, personalInfo.website].filter(Boolean).join('  |  ');
        doc.fillColor(colors.accent).text(links);
    }

    doc.moveDown(1.5);
}

function renderHeader_SlateModern(doc, data, colors) {
    const { personalInfo = {} } = data;

    // Contemporary slate design
    doc.fontSize(FONT_SIZES.name + 3)
        .fillColor(colors.primary)
        .font('Helvetica-Bold')
        .text(personalInfo.fullName || '', PAGE_CONFIG.margin, PAGE_CONFIG.margin);

    doc.moveDown(0.2);
    doc.fontSize(FONT_SIZES.jobTitle)
        .fillColor(colors.accent)
        .font('Helvetica')
        .text(data.experience?.[0]?.jobTitle || 'PROFESSIONAL');

    doc.moveDown(0.5);
    doc.moveTo(PAGE_CONFIG.margin, doc.y)
        .lineTo(PAGE_CONFIG.margin + 100, doc.y)
        .strokeColor(colors.accent)
        .lineWidth(2)
        .stroke();

    doc.moveDown(0.5);
    const contact = [personalInfo.email, personalInfo.phone, personalInfo.address].filter(Boolean).join(' • ');
    doc.fontSize(FONT_SIZES.contact)
        .fillColor(colors.secondary)
        .text(contact);

    doc.moveDown(1);
}

function renderHeader_RubyBold(doc, data, colors) {
    const { personalInfo = {} } = data;

    // Bold ruby design
    doc.rect(0, 0, PAGE_CONFIG.width, 90)
        .fillAndStroke(colors.primary, colors.primary);

    doc.fontSize(FONT_SIZES.name + 4)
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .text(personalInfo.fullName || '', PAGE_CONFIG.margin, 20, {
            width: PAGE_CONFIG.contentWidth
        });

    doc.moveDown(0.3);
    const contact = [personalInfo.email, personalInfo.phone, personalInfo.address].filter(Boolean).join('  |  ');
    doc.fontSize(FONT_SIZES.contact)
        .fillColor('#FFFFFF')
        .font('Helvetica')
        .text(contact);

    if (personalInfo.linkedin) {
        doc.moveDown(0.2);
        doc.text(personalInfo.linkedin);
    }

    doc.y = 100;
}

function renderHeader_AzureCorporate(doc, data, colors) {
    const { personalInfo = {} } = data;

    // Corporate azure layout
    doc.fontSize(FONT_SIZES.name + 2)
        .fillColor(colors.primary)
        .font('Helvetica-Bold')
        .text(personalInfo.fullName || '', PAGE_CONFIG.margin, PAGE_CONFIG.margin, {
            align: 'center',
            width: PAGE_CONFIG.contentWidth
        });

    doc.moveDown(0.3);
    const jobTitle = data.experience?.[0]?.jobTitle || 'PROFESSIONAL';
    doc.fontSize(FONT_SIZES.jobTitle)
        .fillColor(colors.accent)
        .font('Helvetica-Oblique')
        .text(jobTitle, { align: 'center' });

    doc.moveDown(0.5);
    doc.moveTo(PAGE_CONFIG.margin, doc.y)
        .lineTo(PAGE_CONFIG.margin + PAGE_CONFIG.contentWidth, doc.y)
        .strokeColor(colors.accent)
        .lineWidth(1.5)
        .stroke();

    doc.moveDown(0.5);
    const contact = [personalInfo.phone, personalInfo.email, personalInfo.address].filter(Boolean).join(' | ');
    doc.fontSize(FONT_SIZES.contact)
        .fillColor(colors.secondary)
        .font('Helvetica')
        .text(contact, { align: 'center' });

    doc.moveDown(1.5);
}

// ==================== SECTION TITLE RENDERER ====================

function renderSectionTitle(doc, title, colors, template) {
    const spacing = getTemplateSpacing(template);
    doc.moveDown(0.3);
    switch (template) {
        case 'modern-pro':
            doc.fontSize(FONT_SIZES.sectionTitle - 2)
                .fillColor(colors.accent)
                .font('Helvetica-Bold')
                .text(title.toUpperCase());
            doc.moveTo(PAGE_CONFIG.margin, doc.y + 2)
                .lineTo(PAGE_CONFIG.margin + PAGE_CONFIG.contentWidth, doc.y + 2)
                .strokeColor(colors.accent)
                .lineWidth(1)
                .stroke();
            doc.moveDown(0.5);
            break;

        case 'corporate-ats':
        case 'elegant-gradient':
            doc.fontSize(FONT_SIZES.sectionTitle - 1)
                .fillColor(colors.primary)
                .font('Helvetica-Bold')
                .text(title.toUpperCase());
            doc.moveTo(PAGE_CONFIG.margin, doc.y + 2)
                .lineTo(PAGE_CONFIG.margin + PAGE_CONFIG.contentWidth, doc.y + 2)
                .strokeColor(colors.secondary)
                .lineWidth(0.5)
                .stroke();
            doc.moveDown(0.6);
            break;

        case 'tech-focus':
            doc.fontSize(FONT_SIZES.sectionTitle)
                .fillColor(colors.primary)
                .font('Courier-Bold')
                .text('# ' + title);
            break;

        case 'rishi':
            // Sophisticated Header with Pill Accent
            doc.fillColor(colors.light)
                .roundedRect(PAGE_CONFIG.margin, doc.y - 2, 80, 18, 9)
                .fill();
            doc.fontSize(FONT_SIZES.sectionTitle - 3)
                .fillColor(colors.primary)
                .font('Helvetica-Bold')
                .text(title.toUpperCase(), PAGE_CONFIG.margin + 12, doc.y + 1);

            doc.moveTo(PAGE_CONFIG.margin + 85, doc.y - 10)
                .lineTo(PAGE_CONFIG.margin + PAGE_CONFIG.contentWidth, doc.y - 10)
                .strokeColor(colors.light)
                .lineWidth(0.5)
                .stroke();
            doc.moveDown(0.8);
            break;

        case 'priya-analytics':
            // Rounded Pill Background across full content width
            doc.fillColor(colors.light)
                .roundedRect(PAGE_CONFIG.margin, doc.y - 4, PAGE_CONFIG.contentWidth, 22, 11)
                .fill();

            doc.fontSize(FONT_SIZES.sectionTitle - 3)
                .fillColor(colors.primary)
                .font('Helvetica-Bold')
                .text(title.toUpperCase(), PAGE_CONFIG.margin + 15, doc.y + 1);

            doc.moveDown(1.2);
            break;

        case 'hiero-executive':
        case 'hiero-studio':
        case 'hiero-onyx':
            // EXACT POSITION LOCK: Always start labels at the left margin
            let displayTitle = title;
            if (title.toLowerCase().includes('summary')) displayTitle = 'Professional\nSummary';
            if (title.toLowerCase().includes('experience')) displayTitle = 'Internship\nExperience';
            if (title.toLowerCase().includes('technical skills') || title.toLowerCase() === 'skills') displayTitle = 'Skills';

            doc.fontSize(FONT_SIZES.sectionTitle)
                .fillColor(colors.primary)
                .font('Helvetica-Bold')
                .text(displayTitle, PAGE_CONFIG.margin, doc.y, { width: 130 });
            break;

        case 'template-4':
            doc.fontSize(FONT_SIZES.sectionTitle)
                .fillColor(colors.primary)
                .font('Times-Bold')
                .text(title.toUpperCase());
            doc.moveTo(PAGE_CONFIG.margin, doc.y + 2)
                .lineTo(PAGE_CONFIG.margin + PAGE_CONFIG.contentWidth, doc.y + 2)
                .strokeColor(colors.primary)
                .lineWidth(1)
                .stroke();
            doc.moveDown(0.6);
            break;

        default:
            doc.fontSize(FONT_SIZES.sectionTitle)
                .fillColor(colors.primary)
                .font('Helvetica-Bold')
                .text(title);
            doc.moveTo(PAGE_CONFIG.margin, doc.y + 2)
                .lineTo(PAGE_CONFIG.margin + 30, doc.y + 2)
                .strokeColor(colors.primary)
                .lineWidth(1.5)
                .stroke();
            doc.moveDown(0.5);
    }
    doc.moveDown(spacing.paragraphGap / 10);
}

// ==================== MAIN TEMPLATE GENERATOR ====================
async function generateUnifiedResume(data, templateId, outStream, customOptions = {}) {
    return new Promise(async (resolve, reject) => {
        try {
            let template = (templateId || 'classic').toLowerCase().trim();
            template = TEMPLATE_MAP[template] || template;

            const colors = TEMPLATE_COLORS[template] || TEMPLATE_COLORS['classic'];
            const spacing = getTemplateSpacing(template);
            const options = customOptions || {};

            // Create PDF document
            const doc = new PDFDocument(PAGE_CONFIG);

            // Pipe to the provided writable stream
            if (outStream && typeof outStream.pipe === 'function') {
                doc.pipe(outStream);
            }

            // Set default font
            doc.font('Helvetica');

            // Render header based on template
            switch (template) {
                case 'rishi': renderHeader_Rishi(doc, data, colors); break;
                case 'minimal': renderHeader_Minimal(doc, data, colors); break;
                case 'modern-pro':
                case 'portfolio-style':
                case 'creative-bold': renderHeader_Modern(doc, data, colors); break;
                case 'tech-focus': renderHeader_Tech(doc, data, colors); break;
                case 'ats-optimized':
                case 'corporate-ats': renderHeader_ATS(doc, data, colors); break;
                case 'priya-analytics': renderHeader_PriyaAnalytics(doc, data, colors); break;
                case 'hiero-elite':
                    renderTemplate_HieroElite(doc, data);
                    doc.end();
                    if (outStream && outStream.on) {
                        outStream.on('finish', () => resolve(true));
                        outStream.on('error', reject);
                    } else {
                        resolve(doc);
                    }
                    return;
                case 'hiero-studio':
                    // Studio uses a completely custom full-page layout
                    await renderTemplate_StudioRightSidebar(doc, data, colors, spacing);
                    doc.end();
                    if (outStream && outStream.on) {
                        outStream.on('finish', () => resolve(true));
                        outStream.on('error', reject);
                    } else {
                        resolve(doc);
                    }
                    return;
                case 'hiero-onyx':
                case 'hiero-executive': renderHeader_Executive(doc, data, colors); break;
                case 'hiero-essence':
                    await renderTemplate_HieroEssence(doc, data, colors, spacing);
                    doc.end();
                    if (outStream && outStream.on) {
                        outStream.on('finish', () => resolve(true));
                        outStream.on('error', reject);
                    } else {
                        resolve(doc);
                    }
                    return;
                case 'template-4': renderHeader_Academic(doc, data, colors); break;
                default: renderHeader_Classic(doc, data, colors);
            }

            // ==================== SEQUENTIAL RENDERING (WITH SIDE-BY-SIDE SUPPORT) ====================
            SECTION_ORDER.forEach(sectionKey => {
                renderSection(doc, sectionKey, data, colors, template, spacing, options);
            });

            // Finalize PDF
            doc.end();

            // If outStream is a writable stream, we resolve when it finishes
            // Note: for 'res' in Express, 'finish' means response sent
            if (outStream && outStream.on) {
                outStream.on('finish', () => resolve(true));
                outStream.on('error', reject);
            } else {
                // If no stream provided (testing only?), resolve immediately
                resolve(doc);
            }

        } catch (error) {
            reject(error);
        }
    });
}

// ==================== SECTION RENDERERS ====================

// Helper to check page break (Now supports Forcing Single Page)
function checkPageBreak(doc, heightNeeded = 60, forceSinglePage = false) {
    if (doc.y + heightNeeded > PAGE_CONFIG.height - PAGE_CONFIG.margin) {
        if (!forceSinglePage) {
            doc.addPage();
            return true;
        }
    }
    return false;
}

function renderSection(doc, sectionKey, data, colors, template, spacing = SPACING, options = {}) {
    const maxWidth = PAGE_CONFIG.contentWidth;
    const forceSingle = options.forceSinglePage || false;

    // TEMPLATE-SPECIFIC LAYOUT LOGIC (Morgan Maxwell Side-by-Side)
    const normalizedTemplate = template.toLowerCase().trim();
    const isSideLayout = ['hiero-executive', 'hiero-studio', 'hiero-onyx'].includes(normalizedTemplate);
    const isAcademicSplit = normalizedTemplate === 'template-4';

    // For Side Layout (Morgan Maxwell style labels on left)
    const labelWidth = isSideLayout ? 130 : 0;
    const contentGap = 20;
    const contentWidth = (isSideLayout || isAcademicSplit) ? (PAGE_CONFIG.contentWidth - (isSideLayout ? labelWidth : (PAGE_CONFIG.contentWidth / 2)) - contentGap) : PAGE_CONFIG.contentWidth;

    // For Academic Split (Split starts after Technical Strengths)
    const academicLeftWidth = (PAGE_CONFIG.contentWidth * 0.55);
    const academicRightWidth = (PAGE_CONFIG.contentWidth * 0.40);
    const academicGap = 20;

    switch (sectionKey) {
        case 'summary':
            if (data.summary || data.objective) {
                const summaryText = data.summary || data.objective;
                checkPageBreak(doc, 60, forceSingle);
                if (isSideLayout) {
                    const startY = doc.y;
                    renderSectionTitle(doc, 'Professional Summary', colors, normalizedTemplate);
                    const labelEndY = doc.y;
                    doc.y = startY;
                    doc.fontSize(FONT_SIZES.body).fillColor(colors.secondary).font('Helvetica')
                        .text(summaryText, PAGE_CONFIG.margin + labelWidth + contentGap, startY, { width: contentWidth, align: 'justify' });
                    doc.y = Math.max(labelEndY, doc.y);
                } else {
                    renderSectionTitle(doc, isAcademicSplit ? 'Carrier Objective' : 'Professional Summary', colors, normalizedTemplate);
                    doc.fontSize(FONT_SIZES.body).fillColor(colors.secondary).font(isAcademicSplit ? 'Times-Roman' : 'Helvetica')
                        .text(summaryText, PAGE_CONFIG.margin, doc.y, { width: maxWidth, align: 'justify' });
                }
                if (isSideLayout) {
                    doc.moveDown(0.8);
                    const dividerY = doc.y;
                    doc.moveTo(PAGE_CONFIG.margin, dividerY).lineTo(PAGE_CONFIG.margin + PAGE_CONFIG.contentWidth, dividerY).strokeColor(colors.light).lineWidth(0.5).stroke();
                    doc.y = dividerY;
                }
                doc.moveDown(spacing.sectionGap / 10);
            }
            break;

        case 'experience':
            if (data.experience && data.experience.length > 0) {
                checkPageBreak(doc, 100);
                const startSectionY = doc.y;

                if (isAcademicSplit) {
                    renderSectionTitle(doc, 'Work Experience', colors, normalizedTemplate);
                } else if (isSideLayout) {
                    renderSectionTitle(doc, 'Internship Experience', colors, normalizedTemplate);
                    doc.y = startSectionY;
                } else {
                    renderSectionTitle(doc, 'Work Experience', colors, normalizedTemplate);
                }

                const drawX = isSideLayout ? (PAGE_CONFIG.margin + labelWidth + contentGap) : PAGE_CONFIG.margin;
                const drawWidth = isSideLayout ? contentWidth : (isAcademicSplit ? academicLeftWidth : maxWidth);

                data.experience.forEach((exp, index) => {
                    checkPageBreak(doc, 80);
                    doc.fontSize(FONT_SIZES.jobTitle).fillColor(colors.primary).font(isAcademicSplit ? 'Times-Bold' : 'Helvetica-Bold')
                        .text(`${exp.jobTitle || ''} – ${exp.company || ''}`, drawX, doc.y, { width: drawWidth });
                    const dateRange = [exp.startDate, exp.endDate || 'Present'].filter(Boolean).join(' – ');
                    doc.fontSize(FONT_SIZES.body).font(isAcademicSplit ? 'Times-Italic' : 'Helvetica-Oblique').fillColor(colors.secondary)
                        .text(`(${dateRange})`, drawX, doc.y);
                    if (exp.description) {
                        doc.moveDown(0.2);
                        const bullets = exp.description.split('\n').filter(b => b.trim());
                        bullets.forEach(bullet => {
                            checkPageBreak(doc, 20);
                            const cleanBullet = bullet.replace(/^[•\-\*]\s*/, '');
                            const h = addBulletPoint(doc, cleanBullet, drawX + spacing.bulletIndent, doc.y, drawWidth - spacing.bulletIndent, colors, normalizedTemplate);
                            doc.y += h + 2;
                        });
                    }
                    if (index < data.experience.length - 1) doc.moveDown(spacing.itemGap);
                });

                if (isSideLayout) {
                    doc.moveDown(0.8);
                    const dividerY = doc.y;
                    doc.moveTo(PAGE_CONFIG.margin, dividerY).lineTo(PAGE_CONFIG.margin + PAGE_CONFIG.contentWidth, dividerY).strokeColor(colors.light).lineWidth(0.5).stroke();
                    doc.y = dividerY;
                }
                doc.moveDown(spacing.sectionGap / 10);
            }
            break;

        case 'education':
            if (data.education && data.education.length > 0) {
                checkPageBreak(doc, 100);
                const startSectionY = doc.y;
                if (isSideLayout) {
                    renderSectionTitle(doc, 'Education', colors, normalizedTemplate);
                    doc.y = startSectionY;
                } else {
                    renderSectionTitle(doc, 'Education', colors, normalizedTemplate);
                }

                const drawX = isSideLayout ? (PAGE_CONFIG.margin + labelWidth + contentGap) : PAGE_CONFIG.margin;
                const drawWidth = isSideLayout ? contentWidth : maxWidth;

                data.education.forEach((edu, index) => {
                    checkPageBreak(doc, 50);
                    doc.fontSize(FONT_SIZES.jobTitle).fillColor(colors.primary).font(isAcademicSplit ? 'Times-Bold' : 'Helvetica-Bold').text(edu.degree || '', drawX, doc.y);
                    doc.fontSize(FONT_SIZES.body).fillColor(colors.secondary).font(isAcademicSplit ? 'Times-Roman' : 'Helvetica').text(`${edu.school || ''} | ${edu.gradYear || ''}`, drawX, doc.y);
                    if (index < data.education.length - 1) doc.moveDown(spacing.itemGap / 10);
                });

                if (isSideLayout) {
                    doc.moveDown(0.5);
                    const dividerY = doc.y;
                    doc.moveTo(PAGE_CONFIG.margin, dividerY).lineTo(PAGE_CONFIG.margin + PAGE_CONFIG.contentWidth, dividerY).strokeColor(colors.light).lineWidth(0.5).stroke();
                    doc.y = dividerY;
                }
                doc.moveDown(spacing.sectionGap / 10);
            }
            break;

        case 'skills':
            if (data.skills && data.skills.length > 0) {
                checkPageBreak(doc, 100);
                renderSectionTitle(doc, isAcademicSplit ? 'Technical Strengths' : 'Skills & Technologies', colors, normalizedTemplate);

                if (isAcademicSplit) {
                    const skills = Array.isArray(data.skills) ? data.skills : data.skills.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
                    const colWidth = PAGE_CONFIG.contentWidth / 2;
                    let startY = doc.y;

                    skills.slice(0, 6).forEach((skill, i) => {
                        const col = i % 2;
                        const row = Math.floor(i / 2);
                        const parts = skill.split(':');
                        const label = parts.length > 1 ? parts[0].trim() : 'Tools';
                        const value = parts.length > 1 ? parts[1].trim() : parts[0].trim();

                        doc.font('Times-Bold').fontSize(FONT_SIZES.body).fillColor(colors.primary)
                            .text(label + ':', PAGE_CONFIG.margin + (col * colWidth), startY + (row * 15), { width: colWidth * 0.4 });
                        doc.font('Times-Roman').fillColor(colors.secondary)
                            .text(value, PAGE_CONFIG.margin + (col * colWidth) + (colWidth * 0.35), startY + (row * 15), { width: colWidth * 0.65 });
                    });
                    doc.y = startY + (Math.ceil(skills.slice(0, 6).length / 2) * 15) + 5;
                    doc.academicSplitY = doc.y; // Save Y for the bottom split
                } else {
                    const skillsText = Array.isArray(data.skills) ? data.skills.join(' • ') : data.skills;
                    doc.fontSize(FONT_SIZES.body).fillColor(colors.secondary).font('Helvetica')
                        .text(skillsText, PAGE_CONFIG.margin, doc.y, { width: maxWidth });
                }
                doc.moveDown(spacing.sectionGap / 10);
            }
            break;

        case 'projects':
            if (data.projects) {
                const projectsList = Array.isArray(data.projects) ? data.projects : (typeof data.projects === 'string' ? [{ name: 'Projects', description: data.projects }] : []);

                if (projectsList.length > 0) {
                    checkPageBreak(doc, 100);
                    renderSectionTitle(doc, 'Projects', colors, normalizedTemplate);
                    projectsList.forEach((proj, index) => {
                        checkPageBreak(doc, 80);
                        doc.fontSize(FONT_SIZES.jobTitle).fillColor(colors.primary).font(isAcademicSplit ? 'Times-Bold' : 'Helvetica-Bold').text(proj.name || proj.title || '');
                        doc.fontSize(FONT_SIZES.body).fillColor(colors.secondary).font(isAcademicSplit ? 'Times-Roman' : 'Helvetica').text(proj.description || '', { width: maxWidth });
                        if (index < projectsList.length - 1) doc.moveDown(spacing.itemGap / 10);
                    });
                    doc.moveDown(spacing.sectionGap / 10);
                }
            }
            break;

        case 'achievements':
            if (data.achievements) {
                const items = Array.isArray(data.achievements) ? data.achievements : (typeof data.achievements === 'string' ? data.achievements.split(/[\n,]/).map(a => a.trim()).filter(Boolean) : []);
                if (items.length > 0) {
                    if (isAcademicSplit && doc.academicSplitY) {
                        doc.y = doc.academicSplitY;
                        doc.x = PAGE_CONFIG.margin + academicLeftWidth + academicGap;
                    } else {
                        checkPageBreak(doc, 100);
                    }
                    renderSectionTitle(doc, 'Academic Achievements', colors, normalizedTemplate);
                    const drawX = isAcademicSplit ? (PAGE_CONFIG.margin + academicLeftWidth + academicGap) : PAGE_CONFIG.margin;
                    const drawWidth = isAcademicSplit ? academicRightWidth : maxWidth;
                    items.forEach(item => {
                        const text = typeof item === 'string' ? item : item?.title || item?.name || sanitizeText(item);
                        const h = addBulletPoint(doc, text, drawX + SPACING.bulletIndent, doc.y, drawWidth - SPACING.bulletIndent, colors);
                        doc.y += h + 2;
                    });
                    if (isAcademicSplit) doc.academicRightY = doc.y;
                    doc.moveDown(spacing.sectionGap / 10);
                }
            }
            break;

        case 'extraCurricular':
            if (data.extraCurricular) {
                const items = Array.isArray(data.extraCurricular) ? data.extraCurricular : (typeof data.extraCurricular === 'string' ? data.extraCurricular.split(/[\n,]/).map(a => a.trim()).filter(Boolean) : []);
                if (items.length > 0) {
                    if (isAcademicSplit && doc.academicRightY) {
                        doc.y = doc.academicRightY;
                        doc.x = PAGE_CONFIG.margin + academicLeftWidth + academicGap;
                    } else if (isAcademicSplit && doc.academicSplitY) {
                        doc.y = doc.academicSplitY;
                        doc.x = PAGE_CONFIG.margin + academicLeftWidth + academicGap;
                    } else {
                        checkPageBreak(doc, 100);
                    }
                    renderSectionTitle(doc, 'Extra-Curricular', colors, normalizedTemplate);
                    const drawX = isAcademicSplit ? (PAGE_CONFIG.margin + academicLeftWidth + academicGap) : PAGE_CONFIG.margin;
                    const drawWidth = isAcademicSplit ? academicRightWidth : maxWidth;
                    items.forEach(item => {
                        const text = typeof item === 'string' ? item : sanitizeText(item);
                        const h = addBulletPoint(doc, text, drawX + SPACING.bulletIndent, doc.y, drawWidth - SPACING.bulletIndent, colors);
                        doc.y += h + 2;
                    });
                    if (isAcademicSplit) doc.academicRightY = doc.y;
                    doc.moveDown(spacing.sectionGap / 10);
                }
            }
            break;

        case 'softSkills':
            if (data.softSkills) {
                const items = Array.isArray(data.softSkills) ? data.softSkills : (typeof data.softSkills === 'string' ? data.softSkills.split(/[\n,]/).map(s => s.trim()).filter(Boolean) : []);
                if (items.length > 0) {
                    if (isAcademicSplit && doc.academicRightY) {
                        doc.y = doc.academicRightY;
                        doc.x = PAGE_CONFIG.margin + academicLeftWidth + academicGap;
                    } else if (isAcademicSplit && doc.academicSplitY) {
                        doc.y = doc.academicSplitY;
                        doc.x = PAGE_CONFIG.margin + academicLeftWidth + academicGap;
                    } else {
                        checkPageBreak(doc, 100);
                    }
                    renderSectionTitle(doc, 'Personal Traits', colors, normalizedTemplate);
                    const drawX = isAcademicSplit ? (PAGE_CONFIG.margin + academicLeftWidth + academicGap) : PAGE_CONFIG.margin;
                    const drawWidth = isAcademicSplit ? academicRightWidth : maxWidth;
                    items.forEach(item => {
                        const h = addBulletPoint(doc, item, drawX + SPACING.bulletIndent, doc.y, drawWidth - SPACING.bulletIndent, colors);
                        doc.y += h + 2;
                    });
                    if (isAcademicSplit) doc.academicRightY = doc.y;
                    doc.moveDown(spacing.sectionGap / 10);
                }
            }
            break;

        case 'certifications':
            if (data.certifications && data.certifications.length > 0) {
                checkPageBreak(doc, 100);
                renderSectionTitle(doc, 'Certifications', colors, normalizedTemplate);
                const items = Array.isArray(data.certifications) ? data.certifications : data.certifications.split(/[\n,]/).map(c => c.trim()).filter(Boolean);
                items.forEach(cert => {
                    const text = typeof cert === 'string' ? cert : cert?.name || cert?.title || sanitizeText(cert);
                    const h = addBulletPoint(doc, text, PAGE_CONFIG.margin + SPACING.bulletIndent, doc.y, maxWidth - SPACING.bulletIndent, colors);
                    doc.y += h + 2;
                });
                doc.moveDown(spacing.sectionGap / 10);
            }
            break;

        case 'references':
            if (data.references && data.references.length > 0) {
                checkPageBreak(doc, 100);
                renderSectionTitle(doc, 'References', colors, normalizedTemplate);
                data.references.forEach((ref, index) => {
                    doc.fontSize(FONT_SIZES.jobTitle).fillColor(colors.primary).font('Helvetica-Bold').text(ref.name || '');
                    doc.fontSize(FONT_SIZES.body).fillColor(colors.secondary).font('Helvetica');
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
                        renderSectionTitle(doc, custom.heading, colors, normalizedTemplate);
                        doc.fontSize(FONT_SIZES.body).fillColor(colors.secondary).font('Helvetica').text(custom.content, { width: maxWidth, align: 'justify' });
                        doc.moveDown(spacing.sectionGap / 10);
                    }
                });
            }
            break;

        case 'customSectionContent':
            if (data.customSectionContent) {
                checkPageBreak(doc, 100);
                const title = data.customSectionTitle || 'Additional Details';
                renderSectionTitle(doc, title, colors, template);
                doc.fontSize(FONT_SIZES.body)
                    .fillColor(colors.secondary)
                    .font('Helvetica')
                    .text(data.customSectionContent, {
                        width: maxWidth,
                        align: 'justify'
                    });
                doc.moveDown(spacing.sectionGap / 10);
            }
            break;
    }
}

// ==================== NEW STUDIO LAYOUT (TEMPLATE 5) ====================
async function renderTemplate_StudioRightSidebar(doc, data, colors, spacing) {
    const sidebarWidth = PAGE_CONFIG.width * 0.35; // 35% width for sidebar
    const sidebarX = PAGE_CONFIG.width - sidebarWidth;

    // 1. Draw Sidebar Background (Full Height)
    doc.save();
    doc.fillColor(colors.accent).rect(sidebarX, 0, sidebarWidth, PAGE_CONFIG.height).fill();
    doc.restore();

    // ==================== RIGHT SIDEBAR CONTENT ====================
    let sidebarY = 40;
    const sidebarMargin = 20;
    const sidebarContentWidth = sidebarWidth - (sidebarMargin * 2);
    const sidebarTextX = sidebarX + sidebarMargin;

    // -- Photo (Base64 Upload or Initials fall-back) --
    const photoRadius = 50;
    const photoCenterX = sidebarX + (sidebarWidth / 2);
    const photoCenterY = sidebarY + photoRadius;

    doc.save();
    doc.circle(photoCenterX, photoCenterY, photoRadius).clip();

    if (data.personalInfo && data.personalInfo.profilePhoto) {
        try {
            doc.image(data.personalInfo.profilePhoto,
                sidebarX + (sidebarWidth / 2) - photoRadius,
                sidebarY,
                {
                    width: photoRadius * 2,
                    height: photoRadius * 2,
                    fit: 'cover'
                }
            );
        } catch (error) {
            console.error('Studio Template: Photo load failed:', error);
            renderStudioInitials(doc, data.personalInfo?.fullName || "User", photoCenterX, photoCenterY, photoRadius, sidebarWidth, sidebarX);
        }
    } else {
        renderStudioInitials(doc, data.personalInfo?.fullName || "User", photoCenterX, photoCenterY, photoRadius, sidebarWidth, sidebarX);
    }
    doc.restore();

    sidebarY += (photoRadius * 2) + 30;

    // -- Name --
    doc.fontSize(24)
        .fillColor(colors.primary) // White
        .font('Helvetica-Bold')
        .text(data.personalInfo?.fullName || 'Your Name', sidebarTextX, sidebarY, {
            width: sidebarContentWidth,
            align: 'left'
        });
    sidebarY += doc.heightOfString(data.personalInfo?.fullName || 'Your Name', { width: sidebarContentWidth }) + 10;

    // -- Job Title --
    const jobTitle = data.experience?.[0]?.jobTitle || 'Professional Title';
    doc.fontSize(12)
        .fillColor(colors.secondary) // Lighter for subtitle
        .font('Helvetica')
        .text(jobTitle.toUpperCase(), sidebarTextX, sidebarY, {
            width: sidebarContentWidth,
            align: 'left'
        });
    sidebarY += doc.heightOfString(jobTitle.toUpperCase(), { width: sidebarContentWidth }) + 30;

    // -- Contact Section --
    // Header background (Darker shade)
    doc.save();
    doc.fillColor('#5e1b1b').rect(sidebarX, sidebarY, sidebarWidth, 30).fill(); // Darker shade for header bar
    doc.restore();

    doc.fontSize(14)
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .text('Contact', sidebarTextX, sidebarY + 8);

    sidebarY += 45;

    // Contact Details
    doc.fontSize(10)
        .fillColor('#ffffff')
        .font('Helvetica-Bold');

    const contactItems = [
        { label: 'Address', val: data.personalInfo?.address, icon: '📍' },
        { label: 'Phone', val: data.personalInfo?.phone, icon: '📞' },
        { label: 'E-mail', val: data.personalInfo?.email, icon: '✉️' },
        { label: 'LinkedIn', val: data.personalInfo?.linkedin, icon: '🔗' },
        { label: 'Website', val: data.personalInfo?.website, icon: '🌐' }
    ];

    contactItems.filter(i => i.val).forEach(item => {
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff')
            .text(item.label, sidebarTextX, sidebarY);
        sidebarY += 14;

        doc.font('Helvetica').fontSize(9).fillColor(colors.secondary)
            .text(item.val, sidebarTextX, sidebarY, { width: sidebarContentWidth });
        sidebarY += doc.heightOfString(item.val, { width: sidebarContentWidth }) + 10;
    });

    sidebarY += 20;

    // -- Skills Section --
    if (data.skills) {
        doc.save();
        doc.fillColor('#5e1b1b').rect(sidebarX, sidebarY, sidebarWidth, 30).fill();
        doc.restore();

        doc.fontSize(14)
            .fillColor('#ffffff')// White
            .font('Helvetica-Bold')
            .text('Skills', sidebarTextX, sidebarY + 8);

        sidebarY += 45;

        const skillsList = Array.isArray(data.skills)
            ? data.skills
            : (typeof data.skills === 'string' ? data.skills.split(/[\n,]/).map(s => s.trim()) : []);

        doc.fontSize(9).font('Helvetica');
        skillsList.filter(Boolean).slice(0, 15).forEach(skill => {
            doc.circle(sidebarTextX + 4, sidebarY + 4, 2).fill('#ffffff');
            doc.fillColor('#ffffff').text(skill, sidebarTextX + 15, sidebarY, { width: sidebarContentWidth - 15 });
            sidebarY += doc.heightOfString(skill, { width: sidebarContentWidth - 15 }) + 6;
        });
    }

    // ==================== LEFT MAIN CONTENT ====================
    doc.y = 40; // Reset Y for main content
    const mainMargin = 40;
    const mainWidth = sidebarX - (mainMargin * 2);
    const mainX = mainMargin;

    // -- Education --
    if (data.education && data.education.length > 0) {
        doc.fontSize(16)
            .fillColor(colors.accent) // Red/Brown color for headers
            .font('Helvetica-Bold')
            .text('Education', mainX, doc.y);

        doc.moveTo(mainX, doc.y + 5).lineTo(mainX + mainWidth, doc.y + 5)
            .strokeColor('#e5e7eb').lineWidth(1).stroke(); // Light grey line

        doc.moveDown(0.8);
        doc.y += 10;

        data.education.forEach(edu => {
            const date = edu.gradYear || 'Year';
            const title = edu.degree || 'Degree';

            // Two column layout for item: Date (Left), Content (Right)
            const dateWidth = 80;
            const contentW = mainWidth - dateWidth - 10;

            const startY = doc.y;

            // Date
            doc.fontSize(10).fillColor('#6b7280').font('Helvetica')
                .text(date, mainX, startY, { width: dateWidth });

            // Title
            doc.fontSize(12).fillColor('#000000').font('Helvetica-Bold')
                .text(title, mainX + dateWidth + 10, startY, { width: contentW });

            // School
            if (edu.school) {
                const currentY = doc.y;
                doc.fontSize(10).fillColor('#374151').font('Helvetica-Oblique')
                    .text(edu.school + (edu.location ? ', ' + edu.location : ''), mainX + dateWidth + 10, currentY + 4, { width: contentW });
            }

            doc.moveDown(2);
        });

        doc.moveDown(1.5);
    }

    // -- Work History --
    if (data.experience && data.experience.length > 0) {
        doc.fontSize(16)
            .fillColor(colors.accent)
            .font('Helvetica-Bold')
            .text('Work History', mainX, doc.y);

        doc.moveTo(mainX, doc.y + 5).lineTo(mainX + mainWidth, doc.y + 5)
            .strokeColor('#e5e7eb').lineWidth(1).stroke();

        doc.moveDown(0.8);
        doc.y += 10;

        data.experience.forEach(exp => {
            const startDate = exp.startDate || '';
            const endDate = exp.endDate || 'Present';
            const dateStr = `${startDate}\n- ${endDate}`; // Multiline date

            const dateWidth = 80;
            const contentW = mainWidth - dateWidth - 10;

            // Check page break for main content
            if (doc.y > PAGE_CONFIG.height - 80) {
                doc.addPage();
                // Re-draw sidebar background on new page? 
                // Yes, create a background rect for sidebar on every new page
                doc.save();
                doc.fillColor(colors.accent).rect(sidebarX, 0, sidebarWidth, PAGE_CONFIG.height).fill();
                doc.restore();
                doc.y = 40;
            }

            const startY = doc.y;

            // Date
            doc.fontSize(10).fillColor('#6b7280').font('Helvetica')
                .text(dateStr, mainX, startY, { width: dateWidth });

            // Job Title
            doc.fontSize(12).fillColor('#000000').font('Helvetica-Bold')
                .text(exp.jobTitle, mainX + dateWidth + 10, startY, { width: contentW });

            // Company
            doc.fontSize(10).fillColor('#374151').font('Helvetica-Oblique')
                .text(exp.company, mainX + dateWidth + 10, doc.y + 4, { width: contentW });

            doc.moveDown(0.5);

            // Description bullets
            if (exp.description) {
                const bullets = exp.description.split('\n').filter(b => b.trim());
                bullets.forEach(b => {
                    // Check page break
                    if (doc.y > PAGE_CONFIG.height - 40) {
                        doc.addPage();
                        doc.save();
                        doc.fillColor(colors.accent).rect(sidebarX, 0, sidebarWidth, PAGE_CONFIG.height).fill();
                        doc.restore();
                        doc.y = 40;
                    }

                    const bulletY = doc.y;
                    doc.circle(mainX + dateWidth + 15, bulletY + 4, 1.5).fill('#374151');
                    doc.fontSize(10).fillColor('#374151').font('Helvetica')
                        .text(b.replace(/^[•\-\*]\s*/, ''), mainX + dateWidth + 25, bulletY, { width: contentW - 20, align: 'justify' });
                    doc.moveDown(0.3);
                });
            }

            doc.moveDown(1.5);
        });
    }


    // -- Summary / Objective (If not covered) -- 
    if (data.summary) {
        if (doc.y > PAGE_CONFIG.height - 100) {
            doc.addPage();
            doc.save();
            doc.fillColor(colors.accent).rect(sidebarX, 0, sidebarWidth, PAGE_CONFIG.height).fill();
            doc.restore();
            doc.y = 40;
        }

        doc.fontSize(16)
            .fillColor(colors.accent)
            .font('Helvetica-Bold')
            .text('Summary', mainX, doc.y);

        doc.moveTo(mainX, doc.y + 5).lineTo(mainX + mainWidth, doc.y + 5)
            .strokeColor('#e5e7eb').lineWidth(1).stroke();

        doc.moveDown(0.8);
        doc.y += 10;

        doc.fontSize(10).fillColor('#374151').font('Helvetica')
            .text(data.summary, mainX, doc.y, { width: mainWidth, align: 'justify' });

        doc.moveDown(2);
    }
}

// ==================== HELPER: RENDER RECTANGULAR INITIALS ====================
function renderRectangularInitials(doc, fullName, x, y, width, height) {
    let initials = "U";
    if (fullName && typeof fullName === 'string') {
        const nameParts = fullName.trim().split(/\s+/).filter(part => part.length > 0);
        if (nameParts.length === 1) {
            initials = nameParts[0].charAt(0).toUpperCase();
        } else if (nameParts.length >= 2) {
            initials = nameParts[0].charAt(0).toUpperCase() + nameParts[1].charAt(0).toUpperCase();
        }
    }

    // Text for initials
    const fontSize = 50;
    doc.fillColor("#722626") // Deep reddish brown
        .font("Helvetica-Bold")
        .fontSize(fontSize)
        .text(initials, x, y + (height / 2) - (fontSize / 1.5), {
            width: width,
            align: 'center'
        });
}

// ==================== HELPER: RENDER STUDIO INITIALS ====================
function renderStudioInitials(doc, fullName, centerX, centerY, radius, sidebarWidth, sidebarX) {
    let initials = "U";
    if (fullName && typeof fullName === 'string') {
        const nameParts = fullName.trim().split(/\s+/).filter(part => part.length > 0);
        if (nameParts.length === 1) {
            initials = nameParts[0].charAt(0).toUpperCase();
        } else if (nameParts.length >= 2) {
            initials = nameParts[0].charAt(0).toUpperCase() + nameParts[1].charAt(0).toUpperCase();
        }
    }

    // Grey background circle for Studio
    doc.fillColor("#d1d5db").circle(centerX, centerY, radius).fill();

    // Add a subtle border
    doc.strokeColor("#9ca3af").lineWidth(1).circle(centerX, centerY, radius).stroke();

    // Dark grey initials - Better Centering
    const fontSize = radius * 0.7;
    doc.fontSize(fontSize)
        .fillColor("#4b5563")
        .font("Helvetica-Bold")
        .text(initials, sidebarX, centerY - (fontSize / 2.2), {
            width: sidebarWidth,
            align: 'center'
        });
}

// ==================== HELPER: RENDER INITIALS ====================
function renderInitials(doc, fullName, centerX, centerY, radius) {
    let initials = "U";

    if (fullName && typeof fullName === 'string') {
        const nameParts = fullName.trim().split(/\s+/).filter(part => part.length > 0);
        if (nameParts.length === 1) {
            initials = nameParts[0].charAt(0).toUpperCase();
        } else if (nameParts.length >= 2) {
            initials = nameParts[0].charAt(0).toUpperCase() + nameParts[1].charAt(0).toUpperCase();
        }
    }

    // Background circle (Darker shade for contrast)
    doc.fillColor("#722626")
        .circle(centerX, centerY, radius)
        .fill();

    // Premium White Border
    doc.strokeColor("#FFFFFF")
        .lineWidth(2)
        .circle(centerX, centerY, radius)
        .stroke();

    // Draw initials text
    const fontSize = radius * 0.8;
    doc.fillColor("#FFFFFF")
        .font("Helvetica-Bold")
        .fontSize(fontSize)
        .text(initials, centerX - radius, centerY - (fontSize / 2.2), {
            width: radius * 2,
            align: 'center'
        });
}

function getInitials(name) {
    if (!name) return "JD";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

// ==================== HIERO ELITE TEMPLATE (USER PROVIDED) ====================
function renderTemplate_HieroElite(doc, originalData) {
    // Specs
    const PAGE_WIDTH = 595;
    const PAGE_HEIGHT = 842;
    const SIDEBAR_WIDTH = 220;
    const SIDEBAR_X = 375;
    const SIDEBAR_PADDING = 20;

    const COLORS = {
        sidebarBg: "#8B3F2B",
        sidebarDark: "#6E2F1F",
        heading: "#8B3F2B",
        divider: "#CCCCCC",
        bodyText: "#333333",
        roleColor: "#E5B8AA",
        lightText: "#777777"
    };

    // Helper to sanitize and format data
    const toArray = (v) => {
        if (Array.isArray(v)) return v.map(item => (typeof item === 'object' && item !== null) ? (item.name || item.skill || JSON.stringify(item)) : String(item));
        if (typeof v === 'string') return v.split(/[\n,;]/).map(s => s.trim()).filter(Boolean);
        return [];
    };

    const data = {
        name: originalData.name || originalData.personalInfo?.fullName || "Your Name",
        role: originalData.role || originalData.personalInfo?.roleTitle || (originalData.experience && originalData.experience[0] && originalData.experience[0].jobTitle) || "Executive Manager",
        address: originalData.address || originalData.personalInfo?.address || "",
        phone: originalData.phone || originalData.personalInfo?.phone || "",
        email: originalData.email || originalData.personalInfo?.email || "email@example.com",
        skills: toArray(originalData.skills || originalData.personalInfo?.skills || originalData.technicalSkills || []),
        education: (Array.isArray(originalData.education) ? originalData.education : []).map(e => ({
            date: e.date || (e.startDate ? `${e.startDate} - ${e.endDate || 'Present'}` : e.gradYear) || "",
            degree: e.degree || "",
            school: e.school || ""
        })),
        experience: (Array.isArray(originalData.experience) ? originalData.experience : []).map(e => ({
            date: e.date || (e.startDate ? `${e.startDate} - ${e.endDate || 'Present'}` : "") || "",
            title: e.title || e.jobTitle || "",
            company: e.company || "",
            points: Array.isArray(e.points) ? e.points : (e.description ? e.description.split('\n').filter(l => l.trim().length > 0) : [])
        })),
        projects: (Array.isArray(originalData.projects) ? originalData.projects : []).map(p => ({
            title: p.title || p.name || "",
            date: p.date || p.duration || "",
            description: p.description || "",
            tech: p.tech || p.technologies || ""
        })),
        certifications: toArray(originalData.certifications || []),
        achievements: toArray(originalData.achievements || []),
        languages: toArray(originalData.languages || []),
        summary: originalData.summary || originalData.personalInfo?.summary || originalData.objective || "",
        photo: originalData.photo || originalData.personalInfo?.profilePhoto || originalData.personalInfo?.photo || null
    };

    // 1. Sidebar Background
    doc.rect(SIDEBAR_X, 0, SIDEBAR_WIDTH, PAGE_HEIGHT).fill(COLORS.sidebarBg);

    let sidebarX = SIDEBAR_X + SIDEBAR_PADDING;
    let sidebarY = 40; // Top padding

    // 2. Avatar (80x80)
    const circleSize = 80;
    const circleX = SIDEBAR_X + (SIDEBAR_WIDTH / 2) - (circleSize / 2);

    doc.save();
    doc.circle(circleX + circleSize / 2, sidebarY + circleSize / 2, circleSize / 2).clip();

    if (data.photo) {
        try {
            // Fill background white first so transparent images look good
            doc.rect(circleX, sidebarY, circleSize, circleSize).fill("white");

            let imgData = data.photo;
            // Robust check: Strip prefix if it's a data URL string
            if (typeof imgData === 'string' && imgData.includes(';base64,')) {
                const parts = imgData.split(';base64,');
                imgData = Buffer.from(parts[1], 'base64');
            }

            doc.image(imgData, circleX, sidebarY, {
                fit: [circleSize, circleSize],
                align: 'center',
                valign: 'center'
            });
        } catch (e) {
            console.error("Hiero Elite: Photo render failed", e);
            // Fallback to initials
            doc.rect(circleX, sidebarY, circleSize, circleSize).fill("white");
            doc.font("Helvetica-Bold").fontSize(26).fillColor(COLORS.sidebarBg)
                .text(getInitials(data.name), circleX, sidebarY + 25, { width: circleSize, align: "center" });
        }
    } else {
        // Default Circle + Initials
        doc.circle(circleX + circleSize / 2, sidebarY + circleSize / 2, circleSize / 2)
            .fillAndStroke("white", "white");
        doc.font("Helvetica-Bold")
            .fontSize(26)
            .fillColor(COLORS.sidebarBg)
            .text(getInitials(data.name), circleX, sidebarY + 25, {
                width: circleSize,
                align: "center"
            });
    }
    doc.restore();

    // Secondary stroke border around the circle
    doc.circle(circleX + circleSize / 2, sidebarY + circleSize / 2, circleSize / 2)
        .strokeColor("white")
        .lineWidth(2)
        .stroke();

    sidebarY += circleSize + 20;

    // 3. Name Scaling (Auto-adjust for long names)
    let nameFontSize = 22;
    doc.font("Helvetica-Bold").fontSize(nameFontSize);
    const maxSidebarWidth = SIDEBAR_WIDTH - SIDEBAR_PADDING * 2;

    while (doc.widthOfString(data.name) > maxSidebarWidth && nameFontSize > 10) {
        nameFontSize -= 0.5;
        doc.fontSize(nameFontSize);
    }

    doc.fillColor("white").text(data.name, sidebarX, sidebarY, { width: maxSidebarWidth });
    sidebarY = doc.y + 5;

    // 4. Role Scaling
    let roleFontSize = 12;
    doc.font("Helvetica").fontSize(roleFontSize);
    while (doc.widthOfString(data.role) > maxSidebarWidth && roleFontSize > 8) {
        roleFontSize -= 0.5;
        doc.fontSize(roleFontSize);
    }

    doc.fillColor(COLORS.roleColor).text(data.role, sidebarX, sidebarY, { width: maxSidebarWidth });
    sidebarY = doc.y + 25;

    // 5. Contact Section
    const BAR_HEIGHT = 26;
    doc.rect(SIDEBAR_X, sidebarY, SIDEBAR_WIDTH, BAR_HEIGHT).fill(COLORS.sidebarDark);
    doc.fillColor("white").font("Helvetica-Bold").fontSize(12).text("Contact", sidebarX, sidebarY + 7);
    sidebarY += BAR_HEIGHT + 14;

    const renderSidebarItem = (label, value) => {
        if (!value) return;
        doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.roleColor).text(label, sidebarX, sidebarY);
        sidebarY += 12;
        doc.font("Helvetica").fontSize(10).fillColor("white").text(value, sidebarX, sidebarY, {
            width: SIDEBAR_WIDTH - SIDEBAR_PADDING * 2
        });
        sidebarY = doc.y + 12;
    };

    renderSidebarItem("Address", data.address);
    renderSidebarItem("Phone", data.phone);
    renderSidebarItem("E-mail", data.email);

    // 6. Skills Section
    if (data.skills.length > 0) {
        if (sidebarY > PAGE_HEIGHT - 100) { /* Optional: check if skills overflow sidebar */ }
        doc.rect(SIDEBAR_X, sidebarY, SIDEBAR_WIDTH, BAR_HEIGHT).fill(COLORS.sidebarDark);
        doc.fillColor("white").font("Helvetica-Bold").fontSize(12).text("Skills", sidebarX, sidebarY + 7);
        sidebarY += BAR_HEIGHT + 14;

        doc.font("Helvetica").fontSize(10).fillColor("white");
        data.skills.forEach(skill => {
            const skillText = String(skill).trim();
            if (!skillText) return;

            const skillHeight = doc.heightOfString(skillText, { width: SIDEBAR_WIDTH - SIDEBAR_PADDING * 2 - 15, lineGap: 2 });
            if (sidebarY + skillHeight > PAGE_HEIGHT - 30) return;

            doc.circle(sidebarX + 3, sidebarY + 4, 1.5).fill("white");
            doc.text(skillText, sidebarX + 12, sidebarY, {
                width: SIDEBAR_WIDTH - SIDEBAR_PADDING * 2 - 15,
                lineGap: 2
            });
            sidebarY = doc.y + 8;
        });
    }

    // 7. Main Content
    let x = 35;
    let y = 30; // Reduced from 40
    const CONTENT_WIDTH = SIDEBAR_X - x - 25;

    const checkPageBreakElite = (needed = 40) => {
        if (y + needed > PAGE_HEIGHT - 30) { // Increased usable space
            doc.addPage();
            doc.rect(SIDEBAR_X, 0, SIDEBAR_WIDTH, PAGE_HEIGHT).fill(COLORS.sidebarBg);
            y = 30; // Matches new top margin
            return true;
        }
        return false;
    };

    const addSectionHeader = (title) => {
        checkPageBreakElite(20);
        doc.fillColor(COLORS.heading).font("Helvetica-Bold").fontSize(15).text(title.toUpperCase(), x, y); // Reduced size
        y += 16;
        doc.strokeColor(COLORS.divider).lineWidth(1).moveTo(x, y).lineTo(x + CONTENT_WIDTH, y).stroke();
        y += 8;
    };

    // Profile
    if (data.summary) {
        addSectionHeader("Profile");
        const summaryHeight = doc.heightOfString(data.summary, { width: CONTENT_WIDTH, lineGap: 1.5 });
        doc.font("Helvetica").fontSize(10).fillColor(COLORS.bodyText).text(data.summary, x, y, {
            width: CONTENT_WIDTH,
            align: 'justify',
            lineGap: 1.5
        });
        y = doc.y + 15; // Reduced from 20
    }

    // Work History
    if (data.experience.length > 0) {
        addSectionHeader("Work History");
        data.experience.forEach(job => {
            const dateHeight = doc.heightOfString(job.date, { width: 75 });
            const titleHeight = doc.heightOfString(job.title, { width: CONTENT_WIDTH - 75 });
            checkPageBreakElite(Math.max(dateHeight, titleHeight) + 8);

            doc.font("Helvetica").fontSize(9).fillColor(COLORS.lightText).text(job.date, x, y, { width: 75 });
            doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.bodyText).text(job.title, x + 75, y, { width: CONTENT_WIDTH - 75 });
            y = doc.y + 1;
            doc.font("Helvetica-Oblique").fontSize(9).fillColor(COLORS.lightText).text(job.company, x + 75, y);
            y = doc.y + 4;

            job.points.forEach(point => {
                const cleanPoint = "• " + point.trim().replace(/^•\s*/, '');
                const pointHeight = doc.heightOfString(cleanPoint, { width: CONTENT_WIDTH - 75, lineGap: 1.5 });
                checkPageBreakElite(pointHeight + 2);
                doc.font("Helvetica").fontSize(9).fillColor(COLORS.bodyText).text(cleanPoint, x + 75, y, {
                    width: CONTENT_WIDTH - 75,
                    align: 'justify',
                    lineGap: 1.5
                });
                y = doc.y + 2;
            });
            y += 5;
        });
        y += 8;
    }

    // Projects (New Support)
    if (data.projects.length > 0) {
        addSectionHeader("Projects");
        data.projects.forEach(proj => {
            checkPageBreakElite(20);
            doc.font("Helvetica").fontSize(9).fillColor(COLORS.lightText).text(proj.date, x, y, { width: 75 });
            doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.bodyText).text(proj.title, x + 75, y, { width: CONTENT_WIDTH - 75 });
            y = doc.y + 1;

            if (proj.description) {
                const descHeight = doc.heightOfString(proj.description, { width: CONTENT_WIDTH - 75, lineGap: 1.2 });
                checkPageBreakElite(descHeight + 3);
                doc.font("Helvetica").fontSize(9).fillColor(COLORS.bodyText).text(proj.description, x + 75, y, {
                    width: CONTENT_WIDTH - 75,
                    lineGap: 1.2
                });
                y = doc.y + 2;
            }
            if (proj.tech) {
                doc.font("Helvetica-Oblique").fontSize(8.5).fillColor(COLORS.lightText).text("Tech: " + proj.tech, x + 75, y);
                y = doc.y + 6;
            } else {
                y += 4;
            }
        });
        y = (y < doc.y ? doc.y : y) + 8;
    }

    // Education
    if (data.education.length > 0) {
        addSectionHeader("Education");
        data.education.forEach(edu => {
            checkPageBreakElite(20);
            doc.font("Helvetica").fontSize(9).fillColor(COLORS.lightText).text(edu.date, x, y, { width: 75 });
            doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.bodyText).text(edu.degree, x + 75, y, { width: CONTENT_WIDTH - 75 });
            y = doc.y + 1;
            doc.font("Helvetica-Oblique").fontSize(9).fillColor(COLORS.lightText).text(edu.school, x + 75, y);
            y = doc.y + 6;
        });
        y += 8;
    }

    // Certifications (New Support)
    if (data.certifications.length > 0) {
        addSectionHeader("Certifications");
        data.certifications.forEach(cert => {
            const certText = "• " + cert;
            const certHeight = doc.heightOfString(certText, { width: CONTENT_WIDTH, lineGap: 2 });
            checkPageBreakElite(certHeight + 4);
            doc.font("Helvetica").fontSize(10).fillColor(COLORS.bodyText).text(certText, x, y, {
                width: CONTENT_WIDTH,
                lineGap: 2
            });
            y = doc.y + 4;
        });
        y += 10; // Reduced gap
    }

    // Achievements (New Support)
    if (data.achievements.length > 0) {
        addSectionHeader("Achievements");
        data.achievements.forEach(ach => {
            const achText = "• " + ach;
            const achHeight = doc.heightOfString(achText, { width: CONTENT_WIDTH, lineGap: 1.5 });
            checkPageBreakElite(achHeight + 3);
            doc.font("Helvetica").fontSize(10).fillColor(COLORS.bodyText).text(achText, x, y, {
                width: CONTENT_WIDTH,
                lineGap: 1.5
            });
            y = doc.y + 3;
        });
    }
}

// LINE DRAW FUNCTION
function drawLine(doc, x, y, width) {
    doc.strokeColor("#CCCCCC")
        .lineWidth(1)
        .moveTo(x, y)
        .lineTo(x + width, y)
        .stroke();
}

/**
 * HIERO ESSENCE - A modern two-column corporate layout
 * Left sidebar (dark background, orange accent)
 * Right main content (white background)
 */
async function renderTemplate_HieroEssence(doc, rawData, colors, spacing) {
    const data = normalizeData(rawData);
    const sidebarWidth = PAGE_CONFIG.width * 0.35;
    const contentX = sidebarWidth;
    const contentWidth = PAGE_CONFIG.width - sidebarWidth;

    const getSafeArray = (arr) => Array.isArray(arr) ? arr : [];
    const pInfo = data.personalInfo || {};
    const skills = getSafeArray(data.skills);
    const languages = getSafeArray(data.languages);
    const hobbies = getSafeArray(data.hobbies);
    const projects = getSafeArray(data.projects);
    const edu = getSafeArray(data.education);
    const exp = getSafeArray(data.experience);
    const socials = getSafeArray(data.socialLinks);
    const summary = data.summary || '';

    const drawPageBackground = () => {
        doc.save();
        doc.fillColor('#000000').rect(0, 0, PAGE_CONFIG.width, PAGE_CONFIG.height).fill();
        doc.fillColor('#333333').rect(0, 0, sidebarWidth, PAGE_CONFIG.height).fill();
        doc.restore();
    };

    const smartAddPage = () => {
        doc.addPage();
        drawPageBackground();
    };

    // 1. Initial Backgrounds
    drawPageBackground();

    // ==================== SIDEBAR (LEFT) ====================
    let sidebarY = 0;
    const sidebarInnerX = 15;
    const sidebarInnerWidth = sidebarWidth - (sidebarInnerX * 2);

    // Profile Photo Area (Reduced Height for One-Page Fit)
    doc.save();
    doc.fillColor('#111111').rect(0, 0, sidebarWidth, 200).fill();
    if (pInfo.profilePhoto) {
        try {
            let imgData = pInfo.profilePhoto;
            if (imgData.startsWith('data:')) {
                const parts = imgData.split(',');
                if (parts.length > 1) {
                    imgData = Buffer.from(parts[1], 'base64');
                }
            }
            doc.image(imgData, 15, 15, {
                width: sidebarWidth - 30, height: 140
            });
        } catch (e) {
            console.error('Photo render error in PDF:', e);
            renderRectangularInitials(doc, pInfo.fullName, 15, 15, sidebarWidth - 30, 140);
        }
    } else {
        renderRectangularInitials(doc, pInfo.fullName || 'User', 15, 15, sidebarWidth - 30, 140);
    }
    doc.restore();
    sidebarY = 165;

    // Name & Title (Condensed)
    doc.fontSize(18).fillColor('#ffffff').font('Helvetica-Bold');
    const nameStr = (pInfo.fullName || 'YOUR NAME').toUpperCase();
    const nameH = doc.heightOfString(nameStr, { width: sidebarWidth - 20, align: 'center' });
    doc.text(nameStr, 10, sidebarY, { width: sidebarWidth - 20, align: 'center' });
    sidebarY += nameH + 2;

    doc.fontSize(8.5).fillColor(colors.accent).font('Helvetica');
    const roleStr = (pInfo.roleTitle || 'PROFESSIONAL').toUpperCase();
    const roleH = doc.heightOfString(roleStr, { width: sidebarWidth - 20, align: 'center', characterSpacing: 1.2 });
    doc.text(roleStr, 10, sidebarY, { width: sidebarWidth - 20, align: 'center', characterSpacing: 1.2 });
    sidebarY += roleH + 8;

    // Ensure contact starts below name/title
    sidebarY = Math.max(195, sidebarY);

    // Ultra-Condensed Folded Ribbons for Sidebar
    const addSidebarRibbon = (title) => {
        const ribbonH = 20;
        doc.fillColor(colors.accent).rect(0, sidebarY, sidebarWidth - 10, ribbonH).fill();
        doc.fillColor('#b37a1a').polygon([sidebarWidth - 10, sidebarY], [sidebarWidth, sidebarY + 8], [sidebarWidth - 10, sidebarY + 12]).fill();
        doc.fontSize(9.5).fillColor('#ffffff').font('Helvetica-Bold').text(title.toUpperCase(), sidebarInnerX, sidebarY + 5);
        sidebarY += ribbonH + 8;
    };

    // Contact
    addSidebarRibbon("Contact");
    doc.fontSize(8.5).font('Helvetica');
    const contactList = [
        { label: 'A', icon: '●', val: pInfo.address },
        { label: 'T', icon: '●', val: pInfo.phone },
        { label: 'E', icon: '●', val: pInfo.email },
        { label: 'W', icon: '●', val: pInfo.website }
    ];
    contactList.forEach(item => {
        if (item.val) {
            const h = doc.heightOfString(item.val, { width: sidebarInnerWidth - 30 });
            doc.fillColor(colors.accent).circle(sidebarInnerX + 4, sidebarY + 5, 2).fill();
            doc.fillColor('#ffffff').fontSize(8).text(item.val, sidebarInnerX + 18, sidebarY, { width: sidebarInnerWidth - 30 });
            sidebarY += Math.max(12, h + 4);
        }
    });

    // Portfolio
    if (socials.length > 0) {
        sidebarY += 2;
        addSidebarRibbon("Portfolio");
        socials.forEach(link => {
            if (!link) return;
            const h = doc.heightOfString(link, { width: sidebarInnerWidth - 30 });
            doc.fillColor(colors.accent).circle(sidebarInnerX + 4, sidebarY + 5, 2).fill();
            doc.fillColor('#ffffff').fontSize(8).text(link, sidebarInnerX + 18, sidebarY, { width: sidebarInnerWidth - 30 });
            sidebarY += Math.max(12, h + 4);
        });
    }

    // Language
    if (languages.length > 0) {
        sidebarY += 2;
        addSidebarRibbon("Language");
        languages.forEach((lang, i) => {
            const langName = lang.name || lang;
            const proficiency = lang.proficiency || (0.7 + Math.random() * 0.25);
            doc.fontSize(8.5).fillColor('#ffffff').text(String(langName).toUpperCase(), sidebarInnerX, sidebarY);
            sidebarY += 10;
            doc.rect(sidebarInnerX, sidebarY, sidebarInnerWidth, 4).fill('#111111');
            doc.rect(sidebarInnerX, sidebarY, sidebarInnerWidth * proficiency, 4).fill(colors.accent);
            sidebarY += 12;
        });
    }

    // Hobbies
    if (hobbies.length > 0) {
        sidebarY += 5;
        addSidebarRibbon("Hobbies");
        doc.fontSize(9).fillColor('#ffffff');
        let hX = sidebarInnerX;
        let hY = sidebarY;
        hobbies.forEach((h, i) => {
            doc.text(String(h), hX, hY, { width: sidebarInnerWidth / 2 - 5 });
            if (i % 2 === 0) hX += (sidebarInnerWidth / 2);
            else { hX = sidebarInnerX; hY += 18; }
        });
        sidebarY = hY + 15;
    }

    // ==================== MAIN CONTENT (RIGHT) ====================
    let mainY = 30;
    const mainInnerX = contentX + 25;
    const mainInnerWidth = contentWidth - 50;

    // Ultra-Condensed Ribbons for Main Area
    const addMainRibbon = (title) => {
        const ribbonH = 20;
        if (mainY > PAGE_CONFIG.height - 110) { smartAddPage(); mainY = 30; }
        doc.fillColor(colors.accent).rect(contentX + 5, mainY, contentWidth - 5, ribbonH).fill();
        // Fold on the LEFT for main content
        doc.fillColor('#b37a1a').polygon(
            [contentX + 5, mainY],
            [contentX, mainY + 6],
            [contentX + 5, mainY + 12]
        ).fill();

        const upperTitle = (title || '').toUpperCase();
        doc.fontSize(8.5).fillColor('#ffffff').font('Helvetica-Bold').text(upperTitle, mainInnerX - 10, mainY + 6, { align: 'center', width: mainInnerWidth + 20 });
        mainY += ribbonH + 4;
    };

    // About Me (Condensed)
    if (summary) {
        addMainRibbon("About Me");
        doc.fontSize(8).font('Helvetica').fillColor('#eeeeee');
        doc.text(summary, mainInnerX, mainY, { width: mainInnerWidth, align: 'justify', lineGap: 1.0 });
        mainY += doc.heightOfString(summary, { width: mainInnerWidth, align: 'justify', lineGap: 1.0 }) + 5;
    }

    // Education
    if (edu.length > 0) {
        addMainRibbon("Education");
        edu.forEach(e => {
            doc.fontSize(8.5).font('Helvetica-Bold');
            const school = (e.school || e.institution || 'Education').toUpperCase();
            const schoolH = doc.heightOfString(school, { width: mainInnerWidth - 80 });
            if (mainY + 30 > PAGE_CONFIG.height - 30) { smartAddPage(); mainY = 30; }

            doc.fillColor(colors.accent).circle(mainInnerX + 3, mainY + 4, 1.5).fill();
            doc.fillColor('#ffffff').text(school, mainInnerX + 15, mainY, { width: mainInnerWidth - 80 });
            doc.fontSize(7).fillColor(colors.accent).font('Helvetica').text(e.gradYear || '', mainInnerX, mainY, { align: 'right', width: mainInnerWidth });
            mainY += schoolH + 1;

            doc.fontSize(7.5).fillColor('#bbbbbb').font('Helvetica-Bold').text(e.degree || '', mainInnerX + 15, mainY);
            mainY += 8;

            if (e.gpa) {
                doc.fontSize(7).fillColor(colors.accent).text(`Result: CGPA ${e.gpa}`, mainInnerX + 15, mainY);
                mainY += 7;
            }
            mainY += 2;
        });
    }

    // Experience
    if (exp.length > 0) {
        addMainRibbon("Experience");
        exp.forEach(e => {
            const desc = e.description || '';
            const descH = desc ? doc.heightOfString(desc, { width: mainInnerWidth - 15, lineGap: 1.0 }) : 0;
            if (mainY + descH + 25 > PAGE_CONFIG.height - 30) { smartAddPage(); mainY = 30; }

            doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#ffffff');
            doc.fillColor(colors.accent).circle(mainInnerX + 3, mainY + 4, 1.5).fill();
            const jobTitle = (e.jobTitle || 'Experience').toUpperCase();
            doc.text(jobTitle, mainInnerX + 15, mainY, { width: mainInnerWidth - 100 });
            doc.fontSize(7).fillColor(colors.accent).font('Helvetica').text(`${e.startDate || ''} - ${e.endDate || ''}`, mainInnerX, mainY, { align: 'right', width: mainInnerWidth });
            mainY += doc.heightOfString(jobTitle, { width: mainInnerWidth - 100 }) + 1;

            doc.fontSize(7.5).fillColor(colors.accent).font('Helvetica-Bold').text(e.company || '', mainInnerX + 15, mainY);
            mainY += 8;

            if (desc) {
                doc.fontSize(7.5).fillColor('#eeeeee').font('Helvetica').text(desc, mainInnerX + 15, mainY, { width: mainInnerWidth - 15, lineGap: 1.0 });
                mainY += descH + 3;
            } else {
                mainY += 2;
            }
        });
    }

    // Projects (If data exists)
    if (projects.length > 0) {
        addMainRibbon("Projects");
        projects.forEach(proj => {
            const title = (proj.title || 'Project').toUpperCase();
            const desc = proj.description || '';
            const tech = proj.tech || '';

            const titleH = doc.heightOfString(title, { width: mainInnerWidth - 15 });
            const techH = tech ? doc.heightOfString(tech, { width: mainInnerWidth - 15 }) : 0;
            const descH = desc ? doc.heightOfString(desc, { width: mainInnerWidth - 15, lineGap: 1.2 }) : 0;

            if (mainY + titleH + techH + descH + 30 > PAGE_CONFIG.height - 40) { smartAddPage(); mainY = 30; }

            doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#ffffff').text(title, mainInnerX + 15, mainY);
            doc.fillColor(colors.accent).circle(mainInnerX + 3, mainY + 4, 2).fill();
            mainY += titleH + 2;

            if (tech) {
                doc.fontSize(8.5).fillColor(colors.accent).font('Helvetica-Bold').text(tech, mainInnerX + 15, mainY);
                mainY += 10;
            }

            if (desc) {
                doc.fontSize(8).fillColor('#eeeeee').font('Helvetica').text(desc, mainInnerX + 15, mainY, { width: mainInnerWidth - 15, lineGap: 1.2 });
                mainY += descH + 8;
            }
        });
    }

    // Certifications
    const certs = getSafeArray(data.certifications || data.certificates);
    if (certs.length > 0) {
        addMainRibbon("Certifications");
        certs.forEach(c => {
            const name = typeof c === 'string' ? c : (c.name || c.title || '');
            if (!name) return;
            if (mainY + 40 > PAGE_CONFIG.height - 40) { smartAddPage(); mainY = 30; }
            doc.fillColor(colors.accent).circle(mainInnerX + 5, mainY + 7, 2).fill();
            doc.fontSize(10).fillColor('#ffffff').font('Helvetica-Bold').text(name, mainInnerX + 20, mainY);
            mainY += 25;
        });
    }

    // Achievements
    const achievements = getSafeArray(data.achievements || data.awards);
    if (achievements.length > 0) {
        addMainRibbon("Achievements");
        achievements.forEach(a => {
            const val = typeof a === 'string' ? a : (a.name || a.title || '');
            if (!val) return;
            const h = doc.heightOfString(val, { width: mainInnerWidth - 25 });
            if (mainY + h + 20 > PAGE_CONFIG.height - 40) { smartAddPage(); mainY = 30; }
            doc.fillColor(colors.accent).circle(mainInnerX + 5, mainY + 7, 2).fill();
            doc.fontSize(10).fillColor('#eeeeee').font('Helvetica').text(val, mainInnerX + 20, mainY, { width: mainInnerWidth - 25 });
            mainY += h + 15;
        });
    }

    // Professional Skills (3-COLUMN ULTRA-GRID)
    if (skills.length > 0) {
        addMainRibbon("Professional Skills");
        let sY = mainY;
        const sWidth = (mainInnerWidth / 3) - 10;

        for (let i = 0; i < skills.length; i += 3) {
            if (sY + 40 > PAGE_CONFIG.height - 40) { smartAddPage(); sY = 30; }

            [0, 1, 2].forEach(offset => {
                const skill = skills[i + offset];
                if (skill) {
                    const sName = (skill.name || skill || '').toUpperCase();
                    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#ffffff');
                    const h = doc.heightOfString(sName, { width: sWidth });
                    const sX = mainInnerX + (offset * (sWidth + 15));
                    doc.text(sName, sX, sY, { width: sWidth });
                    doc.rect(sX, sY + h + 2, sWidth, 3).fill('#222222');
                    doc.rect(sX, sY + h + 2, sWidth * (0.8 + Math.random() * 0.15), 3).fill(colors.accent);
                }
            });
            sY += 28;
        }
    }
}

// Helper for initials in essence (Banner Style)
function renderRectangularInitials(doc, name, x, y, w, h) {
    doc.save();
    doc.fillColor('#222222').rect(x, y, w, h).fill();
    const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
    doc.fontSize(40).fillColor('#f5a623').font('Helvetica-Bold');
    doc.text(initials, x, y + (h / 2) - 20, { width: w, align: 'center' });
    doc.restore();
}

module.exports = { generateUnifiedResume };
