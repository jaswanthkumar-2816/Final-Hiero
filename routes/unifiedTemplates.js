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
    'hiero-monethon': {
        primary: '#1F2A36',
        secondary: '#F2B66D',
        accent: '#F2B66D',
        background: '#FFFFFF',
        light: '#EEEEEE'
    },
    'hiero-essence': {
        primary: '#ffffff',
        secondary: '#aaaaaa',
        accent: '#f5a623',
        background: '#121212',
        sidebarBg: '#1e1e1e',
        sidebarText: '#ffffff'
    },
    'hiero-timeline': {
        primary: '#222222',
        secondary: '#777777',
        accent: '#222222',
        background: '#FFFFFF',
        light: '#e5e7e5',
        timeline: '#dddddd'
    },
    'hiero-signature': {
        primary: '#000000',
        secondary: '#555555',
        accent: '#f37021', // Orange
        background: '#FFFFFF',
        light: '#f7f7f7'
    },
    'hiero-vision': {
        primary: '#5a2d24',       // Terracotta dark
        secondary: '#c96f5a',     // Terracotta
        accent: '#8a4b3c',        // Dark terracotta
        background: '#FFFFFF',
        light: '#f5ece9'
    },
    'hiero-premium': {
        primary: '#1F3A5F',
        secondary: '#4A6572',
        accent: '#E2E6EA',
        background: '#F4F6F8',
        light: '#FFFFFF'
    },
    'hiero-prestige': {
        primary: '#2e2e2e',
        secondary: '#333333',
        accent: '#2e2e2e',
        background: '#f4f4f4',
        sidebarBg: '#2e2e2e',
        sidebarText: '#ffffff',
        light: '#e0e0e0'
    },
    'hiero-royal': {
        primary: '#1a1a1a',      // Deep black for name/titles
        secondary: '#3a3a3a',    // Dark grey for text
        accent: '#8B7D6B',       // Warm brown/tan for section icons
        background: '#EDE8D9',  // Warm beige background
        light: '#BFAF9A'         // Light warm beige
    },
    'hiero-cool': {
        primary: '#0B0B0B',
        secondary: '#151515',
        accent: '#10B981',
        background: '#0B0B0B',
        light: '#34D399',
        text: '#F9FAFB'
    },
    'hiero-legion': {
        primary: '#000000',
        secondary: '#1a1a1a',
        accent: '#000000',
        background: '#FFFFFF',
        light: '#f3f4f6'
    },
    'hiero-vertex': {
        primary: '#333333',
        secondary: '#666666',
        accent: '#333333',
        background: '#E0E2E5',
        light: '#FFFFFF'
    }
};

// Map template IDs to their internal keys
const TEMPLATE_MAP = {
    'template-4': 'template-4',
    'template4': 'template-4',
    'hiero-academic': 'template-4',
    'hiero-studio': 'hiero-studio',
    'hiero-monethon': 'hiero-monethon',
    'monethon': 'hiero-monethon',
    'hiero monethon': 'hiero-monethon',
    'hiero-nova': 'hiero-nova',
    'nova': 'hiero-nova',
    'hiero-legion': 'hiero-legion',
    'legion': 'hiero-legion',
    'hiero-essence': 'hiero-essence',
    'essence': 'hiero-essence',
    'hiero-timeline': 'hiero-timeline',
    'timeline': 'hiero-timeline',
    'hiero-minimal': 'hiero-timeline',
    'hiero-signature': 'hiero-signature',
    'signature': 'hiero-signature',
    'hiero-vision': 'hiero-vision',
    'vision': 'hiero-vision',
    'hiero-premium': 'hiero-premium',
    'premium': 'hiero-premium',
    'hiero-prestige': 'hiero-prestige',
    'prestige': 'hiero-prestige',
    'hiero-royal': 'hiero-royal',
    'royal': 'hiero-royal',
    'hiero-cool': 'hiero-cool',
    'cool': 'hiero-cool',
    'hiero-vertex': 'hiero-vertex',
    'vertex': 'hiero-vertex'
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
    'internships',
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
function getSafeArray(arr) {
    if (!arr) return [];
    if (Array.isArray(arr)) return arr;
    if (typeof arr === 'string') return arr.split('\n').filter(s => s.trim());
    return [];
}

/**
 * Converts a Base64 data URL (or raw Base64 string) to a Buffer for PDFKit.
 * PDFKit's doc.image() requires a Buffer or file path, NOT a data URL string.
 */
function base64ToBuffer(dataUrl) {
    if (!dataUrl) return null;
    try {
        // Handle data:image/jpeg;base64,.... format
        const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        return Buffer.from(base64Data, 'base64');
    } catch (e) {
        console.error('base64ToBuffer error:', e);
        return null;
    }
}

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

function addBulletPoint(doc, text, x, y, maxWidth, options, template = 'classic') {
    const spacing = getTemplateSpacing(template);
    const colors = options.accent ? options : { accent: options.primary || '#000', secondary: options.secondary || '#333' };
    const fontSize = options.fontSize || FONT_SIZES.body;

    doc.fillColor(colors.accent).circle(x - 10, y + 3, (fontSize / 6)).fill();
    doc.fillColor(colors.secondary).fontSize(fontSize);
    const lineHeightPx = fontSize * spacing.lineHeight;

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

    lines.forEach((line, index) => {
        doc.text(line, x, y + (index * lineHeightPx), {
            width: maxWidth,
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
        if (v && typeof v === 'string') return toArray(v);
        for (let alias of aliases) {
            const val = data[alias] || p[alias];
            if (Array.isArray(val) && val.length > 0) return val;
            if (val && typeof val === 'string' && val.trim().length > 0) return toArray(val);
        }
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
            education: getArr(data.education, ['academicDetails', 'educationList', 'academics', 'academicHistory', 'edu']).map(edu => {
                const dates = String(edu.dates || '');
                return {
                    degree: edu.degree || edu.course || edu.title || '',
                    school: edu.school || edu.institution || edu.institute || '',
                    gradYear: edu.gradYear || edu.year || edu.graduationDate || (dates ? dates.split('-')[1]?.trim() || dates : ''),
                    gpa: edu.gpa || edu.grade || edu.details || '',
                    location: edu.location || ''
                };
            }),
            skills: getArr(data.skills, ['technicalSkills', 'professionalSkills', 'skillsList', 'coreCompetencies', 'expertise', 'techSkills']),
            softSkills: getArr(data.softSkills, ['managementSkills', 'interpersonalSkills', 'softSkillsList', 'personalSkills']),
            certifications: getArr(data.certifications, ['certificates', 'personalCertifications', 'awards', 'certificationList']).map(c => typeof c === 'string' ? { name: c } : c),
            projects: getArr(data.projects, ['projectList', 'customDetails', 'personalProjects', 'portfolios']).filter(proj => !proj.heading || proj.heading.toLowerCase().includes('project')).map(proj => {
                return {
                    title: proj.title || proj.projectName || proj.name || proj.heading || '',
                    description: proj.description || proj.details || proj.content || '',
                    tech: proj.tech || proj.technologies || proj.techStack || '',
                    duration: proj.duration || proj.date || ''
                };
            }),
            achievements: getArr(data.achievements, ['awards', 'honors', 'achievementsList', 'awardList']),
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
                case 'hiero-retail':
                    renderTemplate_HieroRetail(doc, data);
                    doc.end();
                    if (outStream && outStream.on) {
                        outStream.on('finish', () => resolve(true));
                        outStream.on('error', reject);
                    } else {
                        resolve(doc);
                    }
                    return;

                case 'hiero-urban':
                    await renderTemplate_HieroUrban(doc, data);
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
                case 'hiero-timeline':
                    await renderTemplate_HieroTimeline(doc, data, colors, spacing);
                    doc.end();
                    if (outStream && outStream.on) {
                        outStream.on('finish', () => resolve(true));
                        outStream.on('error', reject);
                    } else {
                        resolve(doc);
                    }
                    return;
                case 'template-4':
                    await renderTemplate_HieroAcademic(doc, data);
                    doc.end();
                    if (outStream && outStream.on) {
                        outStream.on('finish', () => resolve(true));
                        outStream.on('error', reject);
                    } else {
                        resolve(doc);
                    }
                    return;
                case 'hiero-monethon':
                    renderTemplate_HieroMonethon(doc, data, options);
                    doc.end();
                    if (outStream && outStream.on) {
                        outStream.on('finish', () => resolve(true));
                        outStream.on('error', reject);
                    } else {
                        resolve(doc);
                    }
                    return;
                case 'hiero-nova':
                    await renderTemplate_HieroNova(doc, data);
                    doc.end();
                    if (outStream && outStream.on) {
                        outStream.on('finish', () => resolve(true));
                        outStream.on('error', reject);
                    } else {
                        resolve(doc);
                    }
                    return;

                case 'hiero-legion':
                    await renderTemplate_HieroLegion(doc, data);
                    doc.end();
                    if (outStream && outStream.on) {
                        outStream.on('finish', () => resolve(true));
                        outStream.on('error', reject);
                    } else {
                        resolve(doc);
                    }
                    return;

                case 'hiero-signature':
                    renderTemplate_HieroSignature(doc, data);
                    doc.end();
                    if (outStream && outStream.on) {
                        outStream.on('finish', () => resolve(true));
                        outStream.on('error', reject);
                    } else {
                        resolve(doc);
                    }
                    return;

                case 'hiero-vision':
                    await renderTemplate_HieroVision(doc, data, colors, spacing);
                    doc.end();
                    if (outStream && outStream.on) {
                        outStream.on('finish', () => resolve(true));
                        outStream.on('error', reject);
                    } else {
                        resolve(doc);
                    }
                    return;
                case 'hiero-premium':
                    await renderTemplate_HieroPremium(doc, data, colors, spacing);
                    doc.end();
                    if (outStream && outStream.on) {
                        outStream.on('finish', () => resolve(true));
                        outStream.on('error', reject);
                    } else {
                        resolve(doc);
                    }
                    return;
                case 'hiero-prestige':
                    await renderTemplate_HieroPrestige(doc, data, colors, spacing);
                    doc.end();
                    if (outStream && outStream.on) {
                        outStream.on('finish', () => resolve(true));
                        outStream.on('error', reject);
                    } else {
                        resolve(doc);
                    }
                    return;
                case 'hiero-cool':
                    renderTemplate_HieroCool(doc, data);
                    doc.end();
                    if (outStream && outStream.on) {
                        outStream.on('finish', () => resolve(true));
                        outStream.on('error', reject);
                    } else {
                        resolve(doc);
                    }
                    return;

                case 'hiero-vertex':
                    renderTemplate_HieroVertex(doc, data);
                    doc.end();
                    if (outStream && outStream.on) {
                        outStream.on('finish', () => resolve(true));
                        outStream.on('error', reject);
                    } else {
                        resolve(doc);
                    }
                    return;

                case 'hiero-royal':
                    await renderTemplate_HieroRoyal(doc, data);
                    doc.end();
                    if (outStream && outStream.on) {
                        outStream.on('finish', () => resolve(true));
                        outStream.on('error', reject);
                    } else {
                        resolve(doc);
                    }
                    return;

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
        case 'internships':
            const expData = sectionKey === 'experience' ? data.experience : data.internships;
            const sectionTitle = sectionKey === 'experience' ? 'Work Experience' : 'Internship Experience';

            if (expData && expData.length > 0) {
                checkPageBreak(doc, 100, forceSingle);
                const startSectionY = doc.y;

                if (isAcademicSplit) {
                    renderSectionTitle(doc, sectionTitle, colors, normalizedTemplate);
                } else if (isSideLayout) {
                    renderSectionTitle(doc, sectionTitle, colors, normalizedTemplate);
                    doc.y = startSectionY;
                } else {
                    renderSectionTitle(doc, sectionTitle, colors, normalizedTemplate);
                }

                const drawX = isSideLayout ? (PAGE_CONFIG.margin + labelWidth + contentGap) : PAGE_CONFIG.margin;
                const drawWidth = isSideLayout ? contentWidth : (isAcademicSplit ? academicLeftWidth : maxWidth);

                expData.forEach((exp, index) => {
                    checkPageBreak(doc, 80, forceSingle);
                    doc.fontSize(FONT_SIZES.jobTitle).fillColor(colors.primary).font(isAcademicSplit ? 'Times-Bold' : 'Helvetica-Bold')
                        .text(`${exp.jobTitle || ''} – ${exp.company || ''}`, drawX, doc.y, { width: drawWidth });
                    const dateRange = [exp.startDate, exp.endDate || 'Present'].filter(Boolean).join(' – ');
                    doc.fontSize(FONT_SIZES.body).font(isAcademicSplit ? 'Times-Italic' : 'Helvetica-Oblique').fillColor(colors.secondary)
                        .text(`(${dateRange})`, drawX, doc.y);
                    if (exp.description) {
                        doc.moveDown(0.2);
                        const bullets = exp.description.split('\n').filter(b => b.trim());
                        bullets.forEach(bullet => {
                            checkPageBreak(doc, 20, forceSingle);
                            const cleanBullet = bullet.replace(/^[•\-\*]\s*/, '');
                            const h = addBulletPoint(doc, cleanBullet, drawX + spacing.bulletIndent, doc.y, drawWidth - spacing.bulletIndent, colors, normalizedTemplate);
                            doc.y += h + 2;
                        });
                    }
                    if (index < expData.length - 1) doc.moveDown(spacing.itemGap);
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
                checkPageBreak(doc, 100, forceSingle);
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
                    checkPageBreak(doc, 50, forceSingle);
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
        case 'technicalSkills':
            const skillsVal = data.technicalSkills || data.skills;
            if (skillsVal && skillsVal.length > 0) {
                checkPageBreak(doc, 100, forceSingle);
                renderSectionTitle(doc, isAcademicSplit ? 'Technical Strengths' : 'Skills & Technologies', colors, normalizedTemplate);

                if (isAcademicSplit) {
                    const skills = Array.isArray(skillsVal) ? skillsVal : skillsVal.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
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
                    const skillsText = Array.isArray(skillsVal) ? skillsVal.join(' • ') : skillsVal;
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
                    checkPageBreak(doc, 100, forceSingle);
                    renderSectionTitle(doc, 'Projects', colors, normalizedTemplate);
                    projectsList.forEach((proj, index) => {
                        checkPageBreak(doc, 80, forceSingle);
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
                        checkPageBreak(doc, 100, forceSingle);
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

        case 'languages':
            if (data.languages && data.languages.length > 0) {
                checkPageBreak(doc, 60, forceSingle);
                renderSectionTitle(doc, 'Languages', colors, normalizedTemplate);
                const items = Array.isArray(data.languages) ? data.languages : data.languages.split(/[\n,]/).map(l => l.trim()).filter(Boolean);
                doc.fontSize(FONT_SIZES.body).fillColor(colors.secondary).font('Helvetica')
                    .text(items.join(' • '), PAGE_CONFIG.margin, doc.y, { width: maxWidth });
                doc.moveDown(spacing.sectionGap / 10);
            }
            break;

        case 'hobbies':
            if (data.hobbies && data.hobbies.length > 0) {
                checkPageBreak(doc, 60, forceSingle);
                renderSectionTitle(doc, 'Hobbies', colors, normalizedTemplate);
                const items = Array.isArray(data.hobbies) ? data.hobbies : data.hobbies.split(/[\n,]/).map(h => h.trim()).filter(Boolean);
                doc.fontSize(FONT_SIZES.body).fillColor(colors.secondary).font('Helvetica')
                    .text(items.join(' • '), PAGE_CONFIG.margin, doc.y, { width: maxWidth });
                doc.moveDown(spacing.sectionGap / 10);
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
                        checkPageBreak(doc, 100, forceSingle);
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
                        checkPageBreak(doc, 100, forceSingle);
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
                checkPageBreak(doc, 100, forceSingle);
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
                checkPageBreak(doc, 100, forceSingle);
                renderSectionTitle(doc, 'References', colors, normalizedTemplate);
                data.references.forEach((ref, index) => {
                    checkPageBreak(doc, 60, forceSingle);
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
                        checkPageBreak(doc, 100, forceSingle);
                        renderSectionTitle(doc, custom.heading, colors, normalizedTemplate);
                        doc.fontSize(FONT_SIZES.body).fillColor(colors.secondary).font('Helvetica').text(custom.content, { width: maxWidth, align: 'justify' });
                        doc.moveDown(spacing.sectionGap / 10);
                    }
                });
            }
            break;

        case 'customSectionContent':
            if (data.customSectionContent) {
                checkPageBreak(doc, 100, forceSingle);
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
            const photoBuffer = base64ToBuffer(data.personalInfo.profilePhoto);
            if (photoBuffer) {
                doc.image(photoBuffer,
                    sidebarX + (sidebarWidth / 2) - photoRadius,
                    sidebarY,
                    {
                        width: photoRadius * 2,
                        height: photoRadius * 2
                    }
                );
            } else {
                renderStudioInitials(doc, data.personalInfo?.fullName || "User", photoCenterX, photoCenterY, photoRadius, sidebarWidth, sidebarX);
            }
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
    const skillsVal = data.technicalSkills || data.skills;
    if (skillsVal) {
        doc.save();
        doc.fillColor('#5e1b1b').rect(sidebarX, sidebarY, sidebarWidth, 30).fill();
        doc.restore();

        doc.fontSize(14)
            .fillColor('#ffffff')// White
            .font('Helvetica-Bold')
            .text('Skills', sidebarTextX, sidebarY + 8);

        sidebarY += 45;

        const skillsList = Array.isArray(skillsVal)
            ? skillsVal
            : (typeof skillsVal === 'string' ? skillsVal.split(/[\n,]/).map(s => s.trim()) : []);

        doc.fontSize(9).font('Helvetica');
        skillsList.filter(Boolean).slice(0, 15).forEach(skill => {
            doc.circle(sidebarTextX + 4, sidebarY + 4, 2).fill('#ffffff');
            doc.fillColor('#ffffff').text(skill, sidebarTextX + 15, sidebarY, { width: sidebarContentWidth - 15 });
            sidebarY += doc.heightOfString(skill, { width: sidebarContentWidth - 15 }) + 6;
        });
    }

    // -- Additional Sections (Sidebar) --
    const addStudioSidebarList = (title, val) => {
        if (!val) return;
        const items = Array.isArray(val) ? val : val.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
        if (items.length === 0) return;

        sidebarY += 10;
        doc.save();
        doc.fillColor('#5e1b1b').rect(sidebarX, sidebarY, sidebarWidth, 30).fill();
        doc.restore();
        doc.fontSize(12).fillColor('#ffffff').font('Helvetica-Bold').text(title, sidebarTextX, sidebarY + 8);
        sidebarY += 45;

        doc.fontSize(9).font('Helvetica');
        items.forEach(item => {
            doc.circle(sidebarTextX + 4, sidebarY + 4, 2).fill('#ffffff');
            doc.fillColor('#ffffff').text(item, sidebarTextX + 15, sidebarY, { width: sidebarContentWidth - 15 });
            sidebarY += doc.heightOfString(item, { width: sidebarContentWidth - 15 }) + 6;
        });
    };

    addStudioSidebarList('Languages', data.languages);
    addStudioSidebarList('Hobbies', data.hobbies);
    addStudioSidebarList('Certifications', data.certifications);
    addStudioSidebarList('Achievements', data.achievements);

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

    // -- Work History / Internships --
    const combinedExp = (data.experience || []).concat(data.internships || []);
    if (combinedExp.length > 0) {
        doc.fontSize(16)
            .fillColor(colors.accent)
            .font('Helvetica-Bold')
            .text('Work History', mainX, doc.y);

        doc.moveTo(mainX, doc.y + 5).lineTo(mainX + mainWidth, doc.y + 5)
            .strokeColor('#e5e7eb').lineWidth(1).stroke();

        doc.moveDown(0.8);
        doc.y += 10;

        combinedExp.forEach(exp => {
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

    // -- Projects (Main Area) --
    const studioProj = data.projects || [];
    if (studioProj.length > 0) {
        if (doc.y > PAGE_CONFIG.height - 100) {
            doc.addPage();
            doc.save();
            doc.fillColor(colors.accent).rect(sidebarX, 0, sidebarWidth, PAGE_CONFIG.height).fill();
            doc.restore();
            doc.y = 40;
        }

        doc.fontSize(16).fillColor(colors.accent).font('Helvetica-Bold').text('Projects', mainX, doc.y);
        doc.moveTo(mainX, doc.y + 5).lineTo(mainX + mainWidth, doc.y + 5).strokeColor('#e5e7eb').lineWidth(1).stroke();
        doc.moveDown(1.2);

        studioProj.forEach(proj => {
            if (doc.y > PAGE_CONFIG.height - 60) {
                doc.addPage();
                doc.save();
                doc.fillColor(colors.accent).rect(sidebarX, 0, sidebarWidth, PAGE_CONFIG.height).fill();
                doc.restore();
                doc.y = 40;
            }
            doc.fontSize(12).fillColor('#000000').font('Helvetica-Bold').text(proj.name || proj.title || '');
            if (proj.description) {
                doc.fontSize(10).fillColor('#374151').font('Helvetica').text(proj.description || '', { width: mainWidth, align: 'justify' });
            }
            doc.moveDown(0.8);
        });
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
        experience: (Array.isArray(originalData.experience) ? originalData.experience : [])
            .concat(Array.isArray(originalData.internships) ? originalData.internships : [])
            .map(e => ({
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

    // Achievements
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

    // Languages & Hobbies (Elite Layout)
    const addEliteList = (title, val) => {
        if (!val || (Array.isArray(val) && val.length === 0)) return;
        const items = Array.isArray(val) ? val : val.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
        if (items.length === 0) return;

        addSectionHeader(title);
        checkPageBreakElite(20);
        doc.font("Helvetica").fontSize(10).fillColor(COLORS.bodyText).text(items.join(" • "), x, y, { width: CONTENT_WIDTH });
        y = doc.y + 15;
    };

    addEliteList("Languages", data.languages);
    addEliteList("Hobbies", data.hobbies);
}

// LINE DRAW FUNCTION
function drawLine(doc, x, y, width) {
    doc.strokeColor("#CCCCCC")
        .lineWidth(1)
        .moveTo(x, y)
        .lineTo(x + width, y)
        .stroke();
}



// ==================== MONETHON TEMPLATE (NEW) ====================
/**
 * renderTemplate_HieroMonethon - Implementation matching reference image
 * One JavaScript function ONLY as requested.
 */
function renderTemplate_HieroMonethon(doc, data, options = {}) {
    const colors = {
        orange: '#F2B66D',
        navy: '#1F2A36',
        text: '#222222',
        white: '#FFFFFF'
    };

    const MARGIN = 40;
    const PAGE_WIDTH = 595.28;
    const PAGE_HEIGHT = 841.89;
    const COL1_WIDTH = (PAGE_WIDTH - (MARGIN * 2)) * 0.65;
    const COL2_WIDTH = (PAGE_WIDTH - (MARGIN * 2)) * 0.35;
    const COL2_X = MARGIN + COL1_WIDTH;

    const forceSinglePage = options.forceSinglePage || false;
    const personal = data.personalInfo || {};

    // ============================================================
    // CRITICAL: Override doc.addPage to be a no-op only if forceSinglePage is requested
    // ============================================================
    const _originalAddPage = doc.addPage.bind(doc);
    const _protoAddPage = doc.constructor.prototype.addPage;
    const noOpAddPage = function () { return doc; };

    if (forceSinglePage) {
        doc.addPage = noOpAddPage;
        doc.constructor.prototype.addPage = noOpAddPage;
    }

    // Helper to draw sidebar background
    const drawSidebarBg = (isFirstPage = false) => {
        const y = isFirstPage ? 280 : 0;
        const height = isFirstPage ? PAGE_HEIGHT - 280 : PAGE_HEIGHT;
        doc.save();
        doc.rect(COL2_X, y, COL2_WIDTH + MARGIN, height).fill(colors.navy);
        doc.restore();
    };

    // Helper for page breaks — always single-page
    const checkBreak = (currentY, needed, isLeft = true) => {
        return false;
    };

    // --- 1. HEADER ---
    doc.rect(0, 0, PAGE_WIDTH, 15).fill(colors.orange);

    // Photo Placement
    const photoY = 40;
    const photoWidth = 120;
    const photoHeight = 140;

    doc.save();
    // Neutral background for photo area
    doc.rect(MARGIN, photoY, photoWidth, photoHeight).fill('#EEEEEE');

    if (personal && personal.profilePhoto) {
        try {
            const photoBuffer = base64ToBuffer(personal.profilePhoto);
            if (photoBuffer) {
                doc.image(photoBuffer, MARGIN, photoY, {
                    width: photoWidth,
                    height: photoHeight
                });
            } else {
                doc.fillColor('#CCCCCC').font('Helvetica-Bold').fontSize(14).text('PHOTO', MARGIN, photoY + 60, { width: photoWidth, align: 'center' });
            }
        } catch (e) {
            console.error('Monethon Photo Error:', e);
            doc.fillColor('#CCCCCC').font('Helvetica-Bold').fontSize(14).text('PHOTO', MARGIN, photoY + 60, { width: photoWidth, align: 'center' });
        }
    } else {
        doc.rect(MARGIN, photoY, photoWidth, photoHeight).strokeColor('#CCCCCC').lineWidth(1).stroke();
        doc.fillColor('#999999').font('Helvetica').fontSize(12).text('PHOTO', MARGIN, photoY + 65, { width: photoWidth, align: 'center' });
    }
    doc.restore();

    // Contact Icons/Text
    const iconX = MARGIN + 140;
    const contactTextX = iconX + 20;
    let contactY = photoY + 10;

    const contactFields = [
        { key: 'phone' },
        { key: 'email' },
        { key: 'address' },
        { key: 'location' },
        { key: 'website' }
    ];

    contactFields.forEach(field => {
        let val = (data.contact && data.contact[field.key]) || personal[field.key] || data[field.key];
        if (field.key === 'phone' && !val && personal.contact_info) val = personal.contact_info;

        if (val) {
            doc.circle(iconX + 5, contactY + 5, 5).fill(colors.navy);
            doc.font('Helvetica').fontSize(9).fillColor(colors.text).text(val, contactTextX, contactY, { width: 140 });
            contactY = doc.y + 8;
        }
    });

    // Name and Title — dynamically reduce font size for long names
    const headerRightX = PAGE_WIDTH - MARGIN - 260;
    const fullName = personal.fullName || data.name || (data.basic && data.basic.full_name) || 'RESUME OWNER';
    const nameUpper = fullName.toUpperCase();
    // Scale font: 28 for short, 22 for medium, 18 for very long names
    let nameFontSize = 28;
    if (nameUpper.length > 20) nameFontSize = 22;
    if (nameUpper.length > 28) nameFontSize = 18;
    doc.font('Helvetica-Bold').fontSize(nameFontSize).fillColor(colors.navy).text(nameUpper, headerRightX, 45, { width: 260, align: 'right', lineGap: 2 });

    doc.rect(PAGE_WIDTH - MARGIN + 5, 45, 5, 80).fill(colors.orange);

    // Better Title extraction
    const titleText = (data.title || personal.roleTitle || personal.headline || (data.experience && data.experience[0] && data.experience[0].jobTitle) || 'PROFESSIONAL').toUpperCase();
    doc.font('Helvetica').fontSize(10).fillColor(colors.text).text(titleText, headerRightX, doc.y + 5, { width: 260, align: 'right', characterSpacing: 2 });

    // --- 2. PROFILE SECTION ---
    const profileY = 200;
    const summaryText = data.profile || data.summary || personal.summary || (data.basic && data.basic.career_summary) || '';
    const summaryWidth = PAGE_WIDTH - (MARGIN * 2) - 30;

    doc.font('Helvetica').fontSize(9);
    const textHeight = doc.heightOfString(summaryText, {
        width: summaryWidth,
        align: 'justify',
        lineGap: 2
    });

    const profileBoxHeight = Math.max(80, textHeight + 50);

    doc.rect(MARGIN, profileY, PAGE_WIDTH - (MARGIN * 2), profileBoxHeight).fill(colors.orange);
    doc.font('Helvetica-Bold').fontSize(16).fillColor(colors.navy).text('PROFILE', MARGIN + 15, profileY + 12);
    doc.font('Helvetica').fontSize(9).fillColor(colors.text).text(summaryText, MARGIN + 15, profileY + 32, {
        width: summaryWidth,
        align: 'justify',
        lineGap: 2
    });

    // --- 3. BODY LAYOUT ---
    let leftY = profileY + profileBoxHeight + 20;
    let rightY = profileY + profileBoxHeight + 20;

    drawSidebarBg(true);

    // Experience
    const experiences = data.experience || [];
    if (experiences.length > 0) {
        doc.font('Helvetica-Bold').fontSize(16).fillColor(colors.navy).text('EXPERIENCE', MARGIN, leftY);
        doc.moveTo(MARGIN, leftY + 18).lineTo(MARGIN + 100, leftY + 18).strokeColor(colors.text).lineWidth(2).stroke();
        leftY += 30;

        experiences.forEach(exp => {
            checkBreak(leftY, 80);
            doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.text).text((exp.jobTitle || exp.role || '').toUpperCase(), MARGIN, leftY);
            doc.font('Helvetica').fontSize(10).fillColor(colors.text).text(`${exp.company || ''} ${exp.location ? '| ' + exp.location : ''}`, MARGIN, doc.y + 2);
            const dates = exp.years || ((exp.startDate ? exp.startDate : '') + (exp.endDate ? ' - ' + exp.endDate : (exp.startDate ? ' - Present' : '')));
            if (dates) doc.font('Helvetica-Oblique').fontSize(9).text(dates, MARGIN, doc.y + 2);

            doc.font('Helvetica').fontSize(9).fillColor(colors.text).text(exp.description || '', MARGIN, doc.y + 4, {
                width: COL1_WIDTH - 20,
                align: 'justify'
            });
            leftY = doc.y + 15;
        });
    }

    // Internships (Separate Section)
    const internships = data.internships || [];
    if (internships.length > 0) {
        leftY += 10;
        doc.font('Helvetica-Bold').fontSize(16).fillColor(colors.navy).text('INTERNSHIPS', MARGIN, leftY);
        doc.moveTo(MARGIN, leftY + 18).lineTo(MARGIN + 100, leftY + 18).strokeColor(colors.text).lineWidth(2).stroke();
        leftY += 30;

        internships.forEach(intern => {
            checkBreak(leftY, 70);
            doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.text).text((intern.jobTitle || intern.role || '').toUpperCase(), MARGIN, leftY);
            doc.font('Helvetica').fontSize(10).fillColor(colors.text).text(intern.company || intern.org || '', MARGIN, doc.y + 2);
            const dates = intern.years || ((intern.startDate ? intern.startDate : '') + (intern.endDate ? ' - ' + intern.endDate : (intern.startDate ? ' - Present' : '')));
            if (dates) doc.font('Helvetica-Oblique').fontSize(9).text(dates, MARGIN, doc.y + 2);

            doc.font('Helvetica').fontSize(9).fillColor(colors.text).text(intern.description || intern.desc || '', MARGIN, doc.y + 4, {
                width: COL1_WIDTH - 20,
                align: 'justify'
            });
            leftY = doc.y + 15;
        });
    }


    // Education
    const education = data.education || [];
    if (education.length > 0) {
        leftY += 15;
        checkBreak(leftY, 60);
        doc.font('Helvetica-Bold').fontSize(16).fillColor(colors.navy).text('EDUCATION', MARGIN, leftY);
        doc.moveTo(MARGIN, leftY + 18).lineTo(MARGIN + 100, leftY + 18).strokeColor(colors.text).lineWidth(2).stroke();
        leftY += 30;

        education.forEach(edu => {
            checkBreak(leftY, 50);
            const yearWidth = 70;
            doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.text).text(edu.gradYear || edu.years || '', MARGIN, leftY, { width: yearWidth });
            doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.text).text(edu.degree || '', MARGIN + yearWidth, leftY);
            doc.font('Helvetica').fontSize(9).fillColor(colors.text).text(edu.school || edu.institute || '', MARGIN + yearWidth, doc.y + 2);
            leftY = doc.y + 15;
        });
    }

    // Projects (Optional - Added to main column)
    const projects = data.projects || [];
    if (projects.length > 0 && Array.isArray(projects)) {
        leftY += 15;
        checkBreak(leftY, 60);
        doc.font('Helvetica-Bold').fontSize(16).fillColor(colors.navy).text('PROJECTS', MARGIN, leftY);
        doc.moveTo(MARGIN, leftY + 18).lineTo(MARGIN + 100, leftY + 18).strokeColor(colors.text).lineWidth(2).stroke();
        leftY += 30;

        projects.forEach(proj => {
            checkBreak(leftY, 50);
            doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.text).text((proj.name || proj.title || '').toUpperCase(), MARGIN, leftY);
            if (proj.technologies) doc.font('Helvetica').fontSize(9).text(`Tech: ${proj.technologies}`, MARGIN, doc.y + 2);
            doc.font('Helvetica').fontSize(9).text(proj.description || '', MARGIN, doc.y + 2, { width: COL1_WIDTH - 20 });
            leftY = doc.y + 12;
        });
    }

    // --- RIGHT SIDEBAR ---
    const sidebarContentX = COL2_X + 15;
    const sidebarContentWidth = COL2_WIDTH - 25;

    // Helper for sidebar sections
    const sidebarSection = (title) => {
        checkBreak(rightY, 40, false);
        doc.font('Helvetica-Bold').fontSize(14).fillColor(colors.white).text(`■ ${title}`, sidebarContentX, rightY);
        rightY = doc.y + 10;
    };

    // Awards
    sidebarSection('AWARDS');
    let awards = data.awards || data.achievements || [];
    if (typeof awards === 'string') awards = awards.split('\n').filter(a => a.trim());

    awards.forEach(award => {
        checkBreak(rightY, 30, false);
        if (typeof award === 'string') {
            doc.font('Helvetica').fontSize(9).fillColor(colors.white).text(award, sidebarContentX, rightY, { width: sidebarContentWidth });
            rightY = doc.y + 10;
        } else {
            doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.white).text((award.title || '').toUpperCase(), sidebarContentX, rightY, { width: sidebarContentWidth });
            if (award.year) doc.font('Helvetica').fontSize(8).fillColor(colors.orange).text(award.year, sidebarContentX, doc.y + 1);
            rightY = doc.y + 10;
        }
    });

    // Reference
    rightY += 10;
    sidebarSection('REFERENCE');
    const references = data.references || [];
    if (references.length > 0) {
        references.forEach(ref => {
            checkBreak(rightY, 50, false);
            doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.white).text((ref.name || '').toUpperCase(), sidebarContentX, rightY);
            doc.font('Helvetica').fontSize(9).fillColor(colors.white).text(ref.title || ref.role || '', sidebarContentX, doc.y + 2);
            if (ref.phone) doc.font('Helvetica').fontSize(8).fillColor(colors.white).text(`Cell: ${ref.phone}`, sidebarContentX, doc.y + 2);
            rightY = doc.y + 12;
        });
    } else {
        doc.font('Helvetica').fontSize(9).fillColor(colors.white).text('AVAILABLE UPON REQUEST', sidebarContentX, rightY);
        rightY = doc.y + 20;
    }

    // Certifications
    let certifications = data.certifications || [];
    if (typeof certifications === 'string') certifications = certifications.split(/[\n,]/).map(c => c.trim()).filter(Boolean);
    if (certifications.length > 0) {
        rightY += 10;
        sidebarSection('CERTIFICATIONS');
        certifications.forEach(cert => {
            checkBreak(rightY, 30, false);
            doc.font('Helvetica').fontSize(9).fillColor(colors.white).text(cert, sidebarContentX, rightY, { width: sidebarContentWidth });
            rightY = doc.y + 8;
        });
    }

    // Languages & Hobbies
    const addSidebarList = (title, items) => {
        if (!items || items.length === 0) return;
        rightY += 10;
        sidebarSection(title);
        const listText = Array.isArray(items) ? items.join(', ') : items;
        doc.font('Helvetica').fontSize(9).fillColor(colors.white).text(listText, sidebarContentX, rightY, { width: sidebarContentWidth });
        rightY = doc.y + 12;
    };

    addSidebarList('LANGUAGES', data.languages);
    addSidebarList('HOBBIES', data.hobbies);

    // Skills (Force keep on one page if possible)
    rightY += 10;

    // Calculate total skill height
    let skillList = [];
    if (Array.isArray(data.skills)) {
        skillList = data.skills;
    } else if (typeof data.skills === 'string') {
        skillList = data.skills.split(',').map(s => ({ name: s.trim(), level: 80 }));
    } else if (typeof data.technicalSkills === 'string') {
        skillList = data.technicalSkills.split(',').map(s => ({ name: s.trim(), level: 80 }));
    }

    sidebarSection('SKILL');

    skillList.forEach(skill => {
        // Stop rendering skills if we're about to overflow the page
        if (rightY + 16 > PAGE_HEIGHT - MARGIN) return;

        const skillName = typeof skill === 'string' ? skill : (skill.name || '');
        const skillLevel = typeof skill === 'object' ? (skill.level || 80) : 80;

        doc.font('Helvetica').fontSize(8).fillColor(colors.white).text(skillName.toUpperCase(), sidebarContentX, rightY, { width: sidebarContentWidth });
        rightY = doc.y + 2;
        // Guard again after text rendering
        if (rightY + 5 > PAGE_HEIGHT - MARGIN) return;
        doc.rect(sidebarContentX, rightY, sidebarContentWidth, 2).fill('rgba(255,255,255,0.2)');
        const progress = (parseInt(skillLevel) || 80) / 100;
        doc.rect(sidebarContentX, rightY, sidebarContentWidth * progress, 2).fill(colors.orange);
        rightY += 10;
    });

    // Restore both instance and prototype addPage
    doc.addPage = _originalAddPage;
    doc.constructor.prototype.addPage = _protoAddPage;
}

async function renderTemplate_HieroNova(doc, rawData) {
    const data = normalizeData(rawData);
    const pInfo = data.personalInfo || {};

    // Layout Constants (Editorial Perfection)
    const PAGE_WIDTH = 595.28;
    const PAGE_HEIGHT = 841.89;
    const sidebarWidth = PAGE_WIDTH * 0.38;
    const headerHeight = 170;

    const yellow = '#f4b400';
    const dark = '#1a1a1a';
    const textBlack = '#1a1a1a';
    const greyText = '#777777';
    const lightGrey = '#e5e5e5';
    const white = '#ffffff';

    // Helper: Premium Vector Icons
    const drawCustomIcon = (type, x, y) => {
        doc.save();
        doc.circle(x, y, 9).fill(white);
        doc.fillColor(dark);
        doc.translate(x, y);
        if (type === 'LOC') {
            doc.moveTo(0, 4).lineTo(-3, 0).bezierCurveTo(-4, -4, 4, -4, 3, 0).closePath().fill();
            doc.fillColor(white).circle(0, -1, 1).fill();
        } else if (type === 'TEL') {
            doc.rect(-2.5, -4, 5, 8).fill();
            doc.fillColor(white).rect(-1.5, -3, 3, 5).fill();
            doc.fillColor(dark).circle(0, 3, 0.5).fill();
        } else if (type === 'MAIL') {
            doc.rect(-4, -3, 8, 6).fill();
            doc.strokeColor(white).lineWidth(0.5).moveTo(-4, -3).lineTo(0, 0).lineTo(4, -3).stroke();
        } else if (type === 'WEB') {
            doc.circle(0, 0, 4.5).stroke();
            doc.lineWidth(0.5).moveTo(-4.5, 0).lineTo(4.5, 0).stroke();
            doc.moveTo(0, -4.5).lineTo(0, 4.5).stroke();
            doc.ellipse(0, 0, 2, 4.5).stroke();
        } else if (type === 'LINKEDIN') {
            doc.rect(-4, -4, 8, 8).fill();
            doc.fillColor(white).font('Helvetica-Bold').fontSize(6).text('in', -3, -3);
        } else if (type === 'GITHUB') {
            doc.circle(0, 0, 4.5).fill();
            doc.fillColor(dark).circle(-1.5, -1, 1.5).fill();
            doc.circle(1.5, -1, 1.5).fill();
        }
        doc.restore();
    };

    // 1. Backgrounds
    doc.rect(0, 0, sidebarWidth, headerHeight).fill(yellow);
    doc.rect(PAGE_WIDTH - 85, 0, 85, 45).fill(yellow);
    doc.rect(0, headerHeight, sidebarWidth, PAGE_HEIGHT - headerHeight).fill(dark);

    // 2. Profile Photo
    if (pInfo.profilePhoto) {
        try {
            let imgData = pInfo.profilePhoto;
            if (imgData.startsWith('data:image')) {
                const parts = imgData.split(',');
                if (parts.length > 1) imgData = Buffer.from(parts[1], 'base64');
            }
            const pSize = 135;
            const pX = (sidebarWidth - pSize) / 2;
            const pY = (headerHeight - pSize) / 2;

            doc.save();
            doc.circle(pX + pSize / 2, pY + pSize / 2, pSize / 2).clip();
            doc.image(imgData, pX, pY, { width: pSize, height: pSize, cover: [pSize, pSize] });
            doc.restore();

            doc.circle(pX + pSize / 2, pY + pSize / 2, pSize / 2 + 3).lineWidth(3).strokeColor(white).stroke();
        } catch (e) { }
    }

    // 3. Header Text
    const nameX = sidebarWidth + 45;
    let nameY = 65;
    const fullName = (pInfo.fullName || data.name || "YOUR NAME").toUpperCase();
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(' ') || "";

    doc.fillColor(textBlack).font('Times-Roman').fontSize(34).text(firstName, nameX, nameY);
    nameY = doc.y - 8;
    doc.font('Times-Bold').fontSize(44).text(lastName, nameX, nameY);

    const role = (pInfo.roleTitle || data.title || "PROFESSIONAL TITLE").toUpperCase();
    doc.font('Helvetica').fontSize(14).fillColor(greyText).text(role, nameX, doc.y + 8, { characterSpacing: 4 });
    doc.moveTo(nameX + 110, doc.y + 10).lineTo(PAGE_WIDTH - 40, doc.y + 10).strokeColor(yellow).lineWidth(6).stroke();

    // 4. Main Content (Optimized for One Page)
    let mY = headerHeight + 55;
    const mX = nameX;
    const mWidth = PAGE_WIDTH - mX - 40;

    const mSecH = (t) => {
        doc.fillColor(textBlack).font('Times-Bold').fontSize(16).text(t.toUpperCase(), mX, mY, { characterSpacing: 2 });
        const lineY = doc.y + 2;
        doc.moveTo(mX, lineY).lineTo(mX + 160, lineY).strokeColor('#cccccc').lineWidth(1.5).stroke();
        mY = lineY + 18;
    };

    // Experience
    const exp = getSafeArray(data.experience);
    if (exp.length > 0) {
        mSecH('EXPERIENCE');
        exp.slice(0, 3).forEach(e => {
            doc.circle(mX - 25, mY + 6, 4).fill(yellow);
            doc.fillColor(textBlack).font('Helvetica-Bold').fontSize(11.5).text((e.jobTitle || "").toUpperCase(), mX, mY, { continued: true });
            doc.fillColor(greyText).font('Helvetica').fontSize(9.5).text(` (${e.startDate || ""} - ${e.endDate || "Present"})`);
            doc.fillColor('#444444').font('Helvetica').fontSize(10.5).lineGap(0.5).text(e.description || "", mX, doc.y + 1, { width: mWidth });
            mY = doc.y + 10;
        });
    }

    // Projects
    const projs = getSafeArray(data.projects);
    if (projs.length > 0) {
        mSecH('PROJECTS');
        projs.slice(0, 2).forEach(p => {
            doc.circle(mX - 25, mY + 6, 4).fill(yellow);
            doc.fillColor('#333333').font('Helvetica').fontSize(11.5).text((p.title || p.name || "").toUpperCase(), mX, mY);
            doc.fillColor('#444444').font('Helvetica').fontSize(10.5).lineGap(0.5).text(p.description || "", mX, doc.y + 1, { width: mWidth });
            mY = doc.y + 8;
        });
    }

    // Education
    const edu = getSafeArray(data.education);
    if (edu.length > 0) {
        mSecH('EDUCATION');
        edu.slice(0, 2).forEach(e => {
            doc.circle(mX - 25, mY + 6, 4).fill(yellow);
            doc.fillColor(textBlack).font('Helvetica-Bold').fontSize(11).text((e.degree || "").toUpperCase(), mX, mY);
            doc.fillColor('#444444').font('Helvetica').fontSize(10.5).text(`${e.school || ""} (${e.gradYear || ""})`, mX, doc.y + 1);
            mY = doc.y + 8;
        });
    }

    mSecH('SKILLS');
    const sks = getSafeArray(data.skills).slice(0, 8);
    const colW = mWidth / 2 - 10;
    doc.font('Helvetica-Bold').fontSize(9.5);
    sks.forEach((s, i) => {
        const n = (typeof s === 'string' ? s : (s.name || "")).toUpperCase();
        if (!n) return;
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cX = mX + (col * (colW + 20));
        const cY = mY + (row * 18);
        if (cY > PAGE_HEIGHT - 35) return;
        doc.fillColor(textBlack).text(n, cX, cY, { width: colW - 55, height: 12, ellipsis: true });
        const tX = cX + colW - 45;
        doc.save();
        doc.roundedRect(tX, cY + 2, 40, 4, 1.5).fillColor('#f0f0f0').fill();
        doc.roundedRect(tX, cY + 2, 30, 4, 1.5).fillColor(yellow).fill();
        doc.restore();
    });

    // 5. Sidebar Content
    const sPadding = 32;
    const sWidth = sidebarWidth - (sPadding * 2);
    let sY = headerHeight + 30;

    const sSecH = (txt) => {
        doc.fillColor(white).font('Times-Bold').fontSize(14).text(txt.toUpperCase(), sPadding, sY, { characterSpacing: 2 });
        sY = doc.y + 15;
    };

    sSecH('ABOUT ME');
    doc.font('Helvetica').fontSize(11).fillColor(white).lineGap(1.2).text(data.summary || "Professional summary here.", sPadding, sY, { width: sWidth });
    sY = doc.y + 30;

    sSecH('CONTACT');
    const cLabels = [
        { t: 'LOC', lab: 'Address:', v: pInfo.address || data.address || "" },
        { t: 'TEL', lab: 'Tel:', v: pInfo.phone || data.phone || "" },
        { t: 'MAIL', lab: 'Email:', v: pInfo.email || data.email || "" }
    ];
    cLabels.forEach(c => {
        if (!c.v) return;
        drawCustomIcon(c.t, sPadding + 10, sY + 6);
        doc.fillColor(white).font('Helvetica-Bold').fontSize(9).text(c.lab, sPadding + 32, sY, { continued: true });
        doc.font('Helvetica').text(" " + c.v, { width: sWidth - 32 });
        sY = doc.y + 8;
    });

    const languages = pInfo.languagesKnown || data.languages;
    if (languages) {
        sY += 25;
        sSecH('LANGUAGES');
        doc.font('Helvetica').fontSize(9).fillColor(white).text(languages, sPadding, sY, { width: sWidth });
    }
}

/**
 * 🏛️ HIERO LEGION TEMPLATE
 * A sophisticated monochrome design with a bold shield-masked profile 
 * and a strong vertical charcoal badge.
 */
async function renderTemplate_HieroLegion(doc, rawData) {
    const data = normalizeData(rawData);
    const pInfo = data.personalInfo || {};

    const PAGE_WIDTH = 595.28;
    const PAGE_HEIGHT = 841.89;
    const sidebarWidth = 220;
    const headerHeight = 160;

    const black = '#000000';
    const dark = '#1a1a1a';
    const softGrey = '#f3f4f6';
    const white = '#ffffff';

    // 1. Sidebar Background (Vertical Badge)
    doc.rect(0, 0, sidebarWidth, PAGE_HEIGHT).fill(dark);

    // 2. Shield Profile Mask
    if (pInfo.profilePhoto) {
        try {
            let imgData = base64ToBuffer(pInfo.profilePhoto);
            const pSize = 130;
            const pX = (sidebarWidth - pSize) / 2;
            const pY = 40;

            doc.save();
            // Shield Path
            const cx = pX + pSize / 2;
            const cy = pY + pSize / 2;
            const r = pSize / 2;

            doc.moveTo(cx, pY) // Top center
                .bezierCurveTo(cx + r, pY, cx + r, cy, cx + r, cy + 10)
                .bezierCurveTo(cx + r, cy + r, cx, cy + r + 15, cx, cy + r + 25) // Pointed bottom
                .bezierCurveTo(cx, cy + r + 15, cx - r, cy + r, cx - r, cy + 10)
                .bezierCurveTo(cx - r, cy, cx - r, pY, cx, pY)
                .closePath().clip();

            doc.image(imgData, pX, pY, { width: pSize, height: (pSize * 1.2), cover: [pSize, pSize] });
            doc.restore();

            // Border
            doc.save();
            doc.moveTo(cx, pY)
                .bezierCurveTo(cx + r, pY, cx + r, cy, cx + r, cy + 10)
                .bezierCurveTo(cx + r, cy + r, cx, cy + r + 15, cx, cy + r + 25)
                .bezierCurveTo(cx, cy + r + 15, cx - r, cy + r, cx - r, cy + 10)
                .bezierCurveTo(cx - r, cy, cx - r, pY, cx, pY)
                .closePath().lineWidth(3).strokeColor(white).stroke();
            doc.restore();
        } catch (e) { }
    }

    // 3. Main Content Rendering (White Area)
    const mainX = sidebarWidth + 35;
    const mainWidth = PAGE_WIDTH - mainX - 35;
    let y = 50;

    // Header in Main Area
    const name = (pInfo.fullName || "").toUpperCase();
    doc.fillColor(black).font('Helvetica-Bold').fontSize(32).text(name, mainX, y);
    y = doc.y + 5;
    doc.fillColor(dark).font('Helvetica').fontSize(14).text((pInfo.roleTitle || "").toUpperCase(), { characterSpacing: 2 });
    y = doc.y + 20;

    // Standard Section Rendering
    const mSec = (title) => {
        doc.fillColor(black).font('Helvetica-Bold').fontSize(14).text(title.toUpperCase(), mainX, y, { characterSpacing: 2 });
        const lineY = doc.y + 3;
        doc.moveTo(mainX, lineY).lineTo(PAGE_WIDTH - 35, lineY).lineWidth(1).strokeColor('#eeeeee').stroke();
        y = lineY + 12;
    };

    // Experience
    const exp = getSafeArray(data.experience);
    if (exp.length > 0) {
        mSec('Professional Experience');
        exp.forEach(e => {
            doc.fillColor(black).font('Helvetica-Bold').fontSize(11).text(e.jobTitle || "", mainX, y, { continued: true });
            doc.fillColor('#666666').font('Helvetica').fontSize(10).text(`  |  ${e.company || ""}  (${e.startDate || ""} - ${e.endDate || "Present"})`);
            doc.fillColor('#333333').font('Helvetica').fontSize(10.5).lineGap(1).text(e.description || "", mainX, doc.y + 2, { width: mainWidth });
            y = doc.y + 12;
        });
    }

    // Projects
    const projs = getSafeArray(data.projects);
    if (projs.length > 0) {
        mSec('Projects');
        projs.forEach(p => {
            doc.fillColor(black).font('Helvetica-Bold').fontSize(11).text(p.title || p.name || "", mainX, y);
            doc.fillColor('#444444').font('Helvetica').fontSize(10.5).text(p.description || "", { width: mainWidth });
            y = doc.y + 10;
        });
    }

    // Education
    const edu = getSafeArray(data.education);
    if (edu.length > 0) {
        mSec('Education');
        edu.forEach(e => {
            doc.fillColor(black).font('Helvetica-Bold').fontSize(10.5).text(e.degree || "", mainX, y);
            doc.fillColor('#444444').font('Helvetica').fontSize(10).text(`${e.school || ""} | ${e.gradYear || ""}`);
            y = doc.y + 10;
        });
    }

    // 4. Sidebar Content (Contacts, Skills)
    let sY = 220;
    const sX = 25;
    const sW = sidebarWidth - 50;

    const sidebarSec = (t) => {
        doc.fillColor(white).font('Helvetica-Bold').fontSize(12).text(t.toUpperCase(), sX, sY, { characterSpacing: 1.5 });
        sY = doc.y + 10;
    };

    sidebarSec('Contact');
    doc.fillColor('#cccccc').font('Helvetica').fontSize(9);
    if (pInfo.email) { doc.text(pInfo.email, sX, sY); sY = doc.y + 4; }
    if (pInfo.phone) { doc.text(pInfo.phone, sX, sY); sY = doc.y + 4; }
    if (pInfo.address) { doc.text(pInfo.address, sX, sY, { width: sW }); sY = doc.y + 8; }
    sY += 20;

    sidebarSec('Skills');
    const skills = getSafeArray(data.skills);
    doc.fillColor(white).font('Helvetica').fontSize(9.5).lineGap(2);
    skills.forEach(s => {
        const n = typeof s === 'string' ? s : (s.name || "");
        doc.text("• " + n, sX, sY);
        sY = doc.y;
    });
}

module.exports = {
    generateUnifiedResume,
    TEMPLATE_COLORS,
    TEMPLATE_MAP,
    renderTemplate_HieroMonethon,
    renderTemplate_HieroNova,
    renderTemplate_HieroLegion,
    renderTemplate_HieroEssence
};


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

/**
 * 🏛️ HIERO MINIMAL (TIMELINE) TEMPLATE
 * A light, elegant corporate resume with a vertical timeline layout.
 */
async function renderTemplate_HieroTimeline(doc, rawData, colors, spacing) {
    const data = normalizeData(rawData);
    const pInfo = data.personalInfo || {};
    const exp = getSafeArray(data.experience);
    const edu = getSafeArray(data.education);
    const projects = getSafeArray(data.projects);
    const certs = getSafeArray(data.certifications);
    const summary = data.summary || '';
    const skills = getSafeArray(data.skills);
    const softSkills = getSafeArray(data.softSkills);

    // Derive professional title: explicit > first job title > "Professional"
    const roleTitle = pInfo.roleTitle
        || pInfo.title
        || (exp.length > 0 ? (exp[0].jobTitle || exp[0].role || '') : '')
        || '';

    let currentY = PAGE_CONFIG.margin;
    const margin = PAGE_CONFIG.margin;
    const contentWidth = PAGE_CONFIG.contentWidth;

    // Helper: Add new page and reset Y
    const smartAddPage = () => {
        if (currentY <= PAGE_CONFIG.margin + 5) return; // Already at top of a page
        doc.addPage();
        // Redraw the signature left border on new page
        doc.save().rect(0, 0, 15, PAGE_CONFIG.height).fill('#111111').restore();
        currentY = PAGE_CONFIG.margin;
    };

    // Draw the signature left border on initial page
    doc.save().rect(0, 0, 15, PAGE_CONFIG.height).fill('#111111').restore();

    // ==================== HEADER ====================
    const photoSize = 90;
    const headerX = margin + photoSize + 25;
    const headerWidth = contentWidth - (photoSize + 25);

    // Profile Photo (Circular - matched to image scale)
    if (pInfo.profilePhoto) {
        try {
            let imgData = pInfo.profilePhoto;
            if (imgData.startsWith('data:')) {
                const parts = imgData.split(',');
                if (parts.length > 1) imgData = Buffer.from(parts[1], 'base64');
            }
            doc.save()
                .circle(margin + photoSize / 2, currentY + photoSize / 2, photoSize / 2)
                .clip()
                .image(imgData, margin, currentY, { width: photoSize, height: photoSize })
                .restore();
        } catch (e) {
            renderCircularInitials(doc, pInfo.fullName, margin, currentY, photoSize);
        }
    } else {
        renderCircularInitials(doc, pInfo.fullName || 'U', margin, currentY, photoSize);
    }

    // Name - Elite Serif Bold (Synchronized with Headings)
    const nameY = currentY + 4;
    doc.fillColor('#000000') // Pure black for maximum thickness
        .font('Times-Bold')
        .fontSize(29) // Slightly larger
        .text(pInfo.fullName || 'RESUME', headerX, nameY, { width: headerWidth, characterSpacing: 0.2 });

    // Professional Title - Subtle uppercase with elevated kerning
    let currentTextY = doc.y + 1;
    if (roleTitle) {
        doc.fillColor('#666666')
            .font('Helvetica')
            .fontSize(9.5)
            .text(roleTitle.toUpperCase(), headerX, currentTextY, {
                width: headerWidth,
                characterSpacing: 1.8
            });
        currentTextY = doc.y + 12;
    }

    // Contact Info Grid (2 Columns) - Ultra-Premium Vector Icon Implementation
    const contactX1 = headerX;
    const contactX2 = headerX + (headerWidth / 2) + 5;

    // Custom Vector Icon Drawing (High-Fidelity & Glitch-Free)
    const drawPremiumIcon = (type, x, y) => {
        doc.save().lineWidth(0.6).strokeColor('#333333');
        if (type === 'PHONE') {
            doc.rect(x + 2.5, y + 1, 5, 8).stroke();
            doc.circle(x + 5, y + 7.5, 0.4).fill('#333333');
        } else if (type === 'LOCATION') {
            doc.circle(x + 5, y + 3.5, 2.8).stroke();
            doc.circle(x + 5, y + 3.5, 0.8).fill('#333333');
            doc.moveTo(x + 2.3, y + 4.5).quadraticCurveTo(x + 5, y + 10, x + 7.7, y + 4.5).stroke();
        } else if (type === 'WEB') {
            doc.circle(x + 5, y + 5, 4.2).stroke();
            doc.ellipse(x + 5, y + 5, 1.8, 4.2).stroke();
            doc.moveTo(x + 1, y + 5).lineTo(x + 9, y + 5).stroke();
        } else if (type === 'EMAIL') {
            doc.rect(x + 1, y + 2, 8, 6).stroke();
            doc.moveTo(x + 1, y + 2).lineTo(x + 5, y + 5.5).lineTo(x + 9, y + 2).stroke();
        }
        doc.restore();
    };

    const drawContactItem = (type, text, x, y) => {
        if (!text) return 0;
        drawPremiumIcon(type, x, y);
        doc.fillColor(colors.secondary)
            .font('Helvetica')
            .fontSize(8.5)
            .text(text, x + 18, y + 1, { width: (headerWidth / 2) - 25, height: 12, lineBreak: false });
        return 16;
    };

    let contactY = currentTextY + 10;
    const row1H = Math.max(
        drawContactItem('PHONE', pInfo.phone, contactX1, contactY),
        drawContactItem('LOCATION', pInfo.address, contactX2, contactY)
    );
    contactY += row1H;

    const row2H = Math.max(
        drawContactItem('WEB', pInfo.website || pInfo.linkedin, contactX1, contactY),
        drawContactItem('EMAIL', pInfo.email, contactX2, contactY)
    );
    contactY += row2H;

    currentY = Math.max(contactY + 22, margin + photoSize + 22);

    // Divider - Ultra-thin Executive Line (Slightly bolder)
    doc.moveTo(headerX, currentY - 14)
        .lineTo(margin + contentWidth, currentY - 14)
        .strokeColor(colors.light)
        .lineWidth(0.8)
        .stroke();

    currentY += 5;

    // ==================== SUMMARY (if present) ====================
    if (summary) {
        if (currentY + 40 > PAGE_CONFIG.height - margin) smartAddPage();
        doc.fillColor('#555555') // Soft grey as requested
            .font('Helvetica')
            .fontSize(10) // Balanced size
            .text(summary, margin, currentY, {
                width: contentWidth,
                lineGap: 1.8,
                align: 'justify'
            });
        currentY = doc.y + 16;

        // Second thin divider after summary
        doc.moveTo(margin, currentY - 8)
            .lineTo(margin + contentWidth, currentY - 8)
            .strokeColor(colors.light)
            .lineWidth(0.5)
            .stroke();
    }

    // ==================== BODY LAYOUT ====================
    const leftColWidth = contentWidth * 0.25;
    const timelineX = margin + leftColWidth + 20;
    const rightColX = timelineX + 25;
    const rightColWidth = contentWidth - (leftColWidth + 45);

    const renderTimelineSection = (title, items) => {
        if (!items || items.length === 0) return;

        // Section header
        if (currentY + 40 > PAGE_CONFIG.height - margin) smartAddPage();

        doc.fillColor(colors.primary)
            .font('Times-Bold')
            .fontSize(10)
            .text(title.toUpperCase(), rightColX, currentY, {
                characterSpacing: 1.4,
                width: rightColWidth
            });

        currentY += 18;

        // Underline section header (Extending from right column) - Increased padding for premium feel
        doc.moveTo(rightColX, currentY - 4)
            .lineTo(margin + contentWidth, currentY - 4)
            .strokeColor('#dddddd')
            .lineWidth(1)
            .stroke();

        currentY += 6;

        items.forEach((item, idx) => {
            // Map fields generically across all section types
            const itemTitle = item.jobTitle || item.role || item.degree || item.title || item.name || '';
            const subTitle = item.company || item.school || item.org || item.institution || '';
            const dateStr = item.date
                ? String(item.date)
                : item.startDate
                    ? `${item.startDate} - ${item.endDate || 'Present'}`
                    : item.gradYear
                        ? String(item.gradYear)
                        : item.duration || '';
            const description = item.description || item.responsibilities || item.subtitle || item.achievement || item.details || '';

            if (!itemTitle && !subTitle) return; // Skip empty items

            // Estimate heights
            doc.font('Helvetica-Bold').fontSize(10);
            const titleH = doc.heightOfString(itemTitle || ' ', { width: rightColWidth });
            doc.font('Helvetica').fontSize(9);
            const descH = description
                ? doc.heightOfString(description, { width: rightColWidth, lineGap: 1.5 })
                : 0;
            const itemTotalH = titleH + (subTitle ? 14 : 0) + descH + 12;

            // Page break check (more conservative)
            if (currentY + itemTotalH > PAGE_CONFIG.height - margin - 10) {
                smartAddPage();
            }

            const nodeY = currentY + 5;

            // Draw Timeline vertical line
            const lineTop = idx === 0 ? nodeY : currentY - 10;
            const lineBottom = currentY + itemTotalH - 4;
            doc.moveTo(timelineX, lineTop)
                .lineTo(timelineX, lineBottom)
                .strokeColor(colors.timeline)
                .lineWidth(1.5)
                .stroke();

            // Draw Node circle (filled white with border)
            doc.save();
            doc.circle(timelineX, nodeY, 4).fillAndStroke('#ffffff', colors.timeline);
            doc.restore();

            // ---- LEFT COLUMN ----
            const isSkills = title.toUpperCase() === "SKILLS";
            if (isSkills && itemTitle) {
                doc.fillColor(colors.primary)
                    .font('Helvetica-Bold')
                    .fontSize(9)
                    .text(itemTitle, margin, currentY, { width: leftColWidth, align: 'right' });
            } else if (subTitle) {
                doc.fillColor(colors.primary)
                    .font('Helvetica-Bold')
                    .fontSize(9)
                    .text(subTitle, margin, currentY, { width: leftColWidth, align: 'right' });
            }
            if (dateStr && !isSkills) {
                doc.fillColor(colors.secondary)
                    .font('Helvetica')
                    .fontSize(8)
                    .text(dateStr, margin, subTitle ? doc.y : currentY, { width: leftColWidth, align: 'right' });
            }

            // ---- RIGHT COLUMN ----
            if (!isSkills && itemTitle) {
                doc.fillColor(colors.primary)
                    .font('Helvetica-Bold')
                    .fontSize(9.5)
                    .text(itemTitle, rightColX, currentY, { width: rightColWidth });
            }

            if (description) {
                doc.fillColor(colors.secondary)
                    .font('Helvetica')
                    .fontSize(8.5)
                    .text(description, rightColX, (isSkills ? currentY : doc.y + 1), { width: rightColWidth, lineGap: 1.5 });
            }

            // High-density vertical rhythm
            currentY = Math.max(doc.y + 10, currentY + itemTotalH - 4);
        });

        currentY += 8;
    };

    // ==================== RENDER SECTIONS ====================
    // 1. Work Experience
    renderTimelineSection("Work Experience", exp);

    // 2. Education
    // Normalise education field names before rendering
    const eduNorm = edu.map(e => ({
        title: e.degree || e.name || e.title || '',
        school: e.school || e.institution || '',
        date: e.gradYear ? String(e.gradYear) : (e.date || ''),
        description: e.description || (e.gpa ? `GPA: ${e.gpa}` : '')
    }));
    renderTimelineSection("Education", eduNorm);

    // 3. Skills (brief list in single item)
    const allSkillItems = [];
    // Technical Skills
    const techSkillsSrc = data.skills && data.skills.length > 0 ? data.skills
        : data.technicalSkills ? [data.technicalSkills]
            : [];
    const techSkillsStr = Array.isArray(techSkillsSrc)
        ? techSkillsSrc.join(' • ')
        : String(techSkillsSrc);
    if (techSkillsStr) allSkillItems.push({ title: 'Technical Skills', description: techSkillsStr });

    // Soft Skills
    const softSkillsSrc = data.softSkills && data.softSkills.length > 0 ? data.softSkills : [];
    const softSkillsStr = Array.isArray(softSkillsSrc)
        ? softSkillsSrc.join(' • ')
        : String(softSkillsSrc);
    if (softSkillsStr) allSkillItems.push({ title: 'Soft Skills', description: softSkillsStr });

    if (allSkillItems.length > 0) {
        renderTimelineSection("Skills", allSkillItems);
    }

    // 4. Certifications & Projects
    const certsNorm = certs.map(c => ({
        title: c.name || c.title || (typeof c === 'string' ? c : ''),
        description: c.description || c.issuer || ''
    }));
    const projNorm = projects.map(p => ({
        title: p.title || p.name || '',
        description: [(p.tech || p.technologies ? `Tech: ${p.tech || p.technologies}` : ''), p.description].filter(Boolean).join(' — ')
    }));
    const combined = [...certsNorm, ...projNorm].filter(i => i.title);
    if (combined.length > 0) {
        renderTimelineSection("Certifications & Projects", combined);
    }

    // 5. Achievements, Languages, Hobbies (Combined into one section if needed or separate)
    const achievements = getSafeArray(data.achievements);
    const languages = getSafeArray(data.languages);
    const hobbies = getSafeArray(data.hobbies);

    if (achievements.length > 0) {
        renderTimelineSection("Achievements", achievements.map(a => ({ title: 'Key Achievement', description: typeof a === 'string' ? a : (a.name || a.title || '') })));
    }

    const miscItems = [];
    if (languages.length > 0) {
        miscItems.push({ title: 'Languages', description: languages.join(', ') });
    }
    if (hobbies.length > 0) {
        miscItems.push({ title: 'Interests', description: hobbies.join(', ') });
    }
    if (miscItems.length > 0) {
        renderTimelineSection("Personal Details", miscItems);
    }

    // 6. References
    const refs = getSafeArray(data.references);
    if (refs.length > 0) {
        const refItems = refs.map(r => ({
            title: r.name || 'Reference',
            description: `${r.title || ''}${r.company ? ' at ' + r.company : ''}${r.email ? ' | ' + r.email : ''}${r.phone ? ' | ' + r.phone : ''}`
        }));
        renderTimelineSection("References", refItems);
    }

    // Final positioning check (prevent potential PDFKit auto-page-break on end)
    currentY = Math.min(currentY, PAGE_CONFIG.height - margin);
}

// Helper for Circular Initials fallback
function renderCircularInitials(doc, name, x, y, size) {
    doc.save();
    doc.circle(x + size / 2, y + size / 2, size / 2)
        .fillColor('#f0f0f0')
        .fill();

    const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
    doc.fillColor('#777777')
        .font('Helvetica-Bold')
        .fontSize(size * 0.4)
        .text(initials, x, y + size * 0.35, { width: size, align: 'center' });
    doc.restore();
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

// ==================== HIERO RETAIL TEMPLATE ====================
function renderTemplate_HieroRetail(doc, rawData) {
    // Helper to sanitize and format data
    const toArray = (v) => {
        if (Array.isArray(v)) return v.map(item => (typeof item === 'object' && item !== null) ? (item.name || item.title || item.skill || JSON.stringify(item)) : String(item));
        if (typeof v === 'string') return v.split(/[\n,;]/).map(s => s.trim()).filter(Boolean);
        return [];
    };

    let pInfo = rawData.personalInfo || {};
    let data = {
        name: rawData.name || pInfo.fullName || "John Doe",
        title: rawData.title || pInfo.roleTitle || rawData.role || (rawData.experience && rawData.experience[0] && rawData.experience[0].jobTitle) || "Retail Professional",
        summary: rawData.summary || "Motivated professional with experience boosting sales and customer loyalty. Resourceful at understanding customer needs and directing to desirable merchandise.",
        profileImage: rawData.profileImage || pInfo.profilePhoto || null,
        contact: {
            address: rawData.address || pInfo.address || "123 Main Street, City",
            phone: rawData.phone || pInfo.phone || "(555) 123-4567",
            email: rawData.email || pInfo.email || "hello@example.com"
        },
        skills: toArray(rawData.skills || pInfo.skills || ["Customer Service", "Sales expertise", "Inventory Management", "Loss Prevention", "Product Promotions"]),
        education: (Array.isArray(rawData.education) && rawData.education.length > 0 ? rawData.education : [{ gradYear: "2016", degree: "Diploma: Retail Management", school: "State University" }]).map(e => ({
            date: (e.startDate ? `${e.startDate} - ${e.endDate || 'Present'}` : e.gradYear) || e.date || "",
            degree: e.degree || "",
            institution: e.school || e.institution || ""
        })),
        workHistory: (Array.isArray(rawData.experience) && rawData.experience.length > 0 ? rawData.experience : [
            { startDate: "2016", endDate: "Present", jobTitle: "Retail Sales Associate", company: "H&M", description: "Effectively upsold products by introducing accessories.\nGenerated brand awareness and positive product impressions." }
        ]).map(e => ({
            date: (e.startDate ? `${e.startDate} -\n${e.endDate || 'Present'}` : e.date) || "",
            title: e.jobTitle || e.title || "",
            company: e.company || "",
            bullets: toArray(e.description || e.points || e.bullets || "")
        }))
    };

    const PAGE_WIDTH = 595.28;
    const PAGE_HEIGHT = 841.89;

    // Background and Outer Border
    doc.save();
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill('#1f2a6b');
    doc.rect(12, 12, PAGE_WIDTH - 24, PAGE_HEIGHT - 24).fill('#ffffff');
    doc.restore();

    // HEADER SECTION
    let startY = 50;
    let startX = 50;

    doc.font('Helvetica-Bold').fontSize(32).fillColor('#1f2a6b').text(data.name, startX, startY);
    let titleY = doc.y + 4;

    doc.font('Helvetica-Oblique').fontSize(14).fillColor('#6c757d').text(data.title.toUpperCase(), startX, titleY);
    let summaryY = doc.y + 12;

    doc.font('Helvetica').fontSize(10).fillColor('#333333')
        .text(data.summary, startX, summaryY, { width: 495, lineGap: 4 });

    // LEFT COLUMN
    let leftY = doc.y + 30;
    const rightX = 260;

    // Profile Image
    if (data.profileImage && data.profileImage.startsWith('data:image')) {
        try {
            // Circle crop image
            doc.save();
            doc.circle(startX + 60, leftY + 60, 60).clip();
            doc.image(data.profileImage, startX, leftY, { width: 120, height: 120 });
            doc.restore();
            leftY += 130 + 15;
        } catch (e) {
            console.error('Error rendering image in Hiero Retail', e);
        }
    }

    // CONTACT Header
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#1f2a6b').text('Contact', startX, leftY);
    leftY = doc.y + 4;
    doc.moveTo(startX, leftY).lineTo(startX + 170, leftY).strokeColor('#d0d0d0').lineWidth(1).stroke();
    leftY += 10;

    // Contact Fields
    const contactFields = [
        { label: 'Address', value: data.contact.address },
        { label: 'Phone', value: data.contact.phone },
        { label: 'E-mail', value: data.contact.email }
    ];

    contactFields.forEach(field => {
        if (field.value) {
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333').text(field.label, startX, leftY);
            doc.font('Helvetica').fontSize(10).fillColor('#555555').text(field.value, startX, doc.y + 2, { width: 170 });
            leftY = doc.y + 8;
        }
    });

    leftY += 10;

    // SKILLS Header
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#1f2a6b').text('Skills', startX, leftY);
    leftY = doc.y + 4;
    doc.moveTo(startX, leftY).lineTo(startX + 170, leftY).strokeColor('#d0d0d0').lineWidth(1).stroke();
    leftY += 10;

    // Skills List
    doc.font('Helvetica').fontSize(10).fillColor('#333333');
    data.skills.forEach(skill => {
        doc.circle(startX + 3, leftY + 4, 1.5).fill('#333333');
        doc.text(skill, startX + 12, leftY, { width: 170 - 12 });
        leftY = doc.y + 4;
    });

    // RIGHT COLUMN (align top to the same Y as left column start)
    let rightY = summaryY + doc.heightOfString(data.summary, { width: 495, lineGap: 4 }) + 30;

    // EDUCATION Header
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#1f2a6b').text('Education', rightX, rightY);
    rightY = doc.y + 4;
    doc.moveTo(rightX, rightY).lineTo(PAGE_WIDTH - 50, rightY).strokeColor('#d0d0d0').lineWidth(1).stroke();
    rightY += 10;

    data.education.forEach(edu => {
        let entryY = rightY;
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#555555').text(edu.date, rightX, entryY, { width: 70 });
        let dateBottom = doc.y;

        doc.font('Helvetica-Bold').fontSize(12).fillColor('#333333').text(edu.degree, rightX + 80, entryY, { width: 200 });
        doc.font('Helvetica-Oblique').fontSize(10).fillColor('#666666').text(edu.institution, rightX + 80, doc.y + 2, { width: 200 });

        rightY = Math.max(dateBottom, doc.y) + 12;
    });

    rightY += 5;

    // WORK HISTORY Header
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#1f2a6b').text('Work History', rightX, rightY);
    rightY = doc.y + 4;
    doc.moveTo(rightX, rightY).lineTo(PAGE_WIDTH - 50, rightY).strokeColor('#d0d0d0').lineWidth(1).stroke();
    rightY += 10;

    data.workHistory.forEach(job => {
        let eY = rightY;

        // Date column 
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#555555').text(job.date, rightX, eY, { width: 70 });
        let dateBottomY = doc.y;

        // Content column
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#333333').text(job.title, rightX + 80, eY, { width: 200 });
        if (job.company) {
            doc.font('Helvetica-Oblique').fontSize(10).fillColor('#666666').text(job.company, rightX + 80, doc.y + 2, { width: 200 });
        }

        let contentY = doc.y + 6;
        job.bullets.forEach(bullet => {
            if (!bullet) return;
            doc.circle(rightX + 80 + 3, contentY + 4, 1.5).fill('#333333');
            doc.font('Helvetica').fontSize(10).fillColor('#333333').text(bullet, rightX + 80 + 12, contentY, { width: 200 - 12 });
            contentY = doc.y + 3;
        });

        rightY = Math.max(dateBottomY, contentY) + 12;
    });
}


function renderTemplate_HieroSignature(doc, rawData) {
    const data = normalizeData(rawData);
    const colors = TEMPLATE_COLORS['hiero-signature'];

    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const SIDEBAR_W = PAGE_W * 0.35;
    const LEFT_W = PAGE_W - SIDEBAR_W;
    const SIDEBAR_X = LEFT_W;

    // Helper for rotated text
    const renderRotatedLabel = (text, x, y, color) => {
        doc.save();
        doc.fillColor(color).font('Helvetica-Bold').fontSize(14);
        const textW = doc.widthOfString(text.toUpperCase());
        doc.translate(x, y);
        doc.rotate(-90);
        doc.text(text.toUpperCase(), -textW / 2, 0);
        doc.restore();
    };

    // Backgrounds
    doc.save();
    doc.fillColor('#000000').rect(SIDEBAR_X, 0, SIDEBAR_W, PAGE_H).fill();
    doc.restore();

    // Sections on Left
    let currentY = 0;
    const sections = [
        { id: 'summary', title: 'About Me', color: '#f7f7f7', textColor: '#000000' },
        { id: 'experience', title: 'Experience', color: '#FFFFFF', accent: true, textColor: '#FFFFFF' },
        { id: 'education', title: 'Education', color: '#FFFFFF', textColor: '#000000' },
        { id: 'projects', title: 'Projects', color: '#FFFFFF', textColor: '#000000' }
    ];

    sections.forEach(sec => {
        let contentHeight = 150; // default min height
        let items = [];

        if (sec.id === 'summary') {
            items = [data.summary].filter(Boolean);
            contentHeight = Math.max(120, doc.heightOfString(data.summary || '', { width: LEFT_W - 140 }) + 80);
        } else {
            items = getSafeArray(data[sec.id]);
            if (items.length === 0) return;
            // Rough calc for height
            contentHeight = items.length * 80 + 60;
        }

        if (currentY + contentHeight > PAGE_H) {
            // Very basic page overflow handling for this custom renderer
            // (In a real scenario we'd need more complex logic, but trying to keep it "per-template" as requested)
        }

        doc.save();
        doc.fillColor(sec.color).rect(0, currentY, LEFT_W, contentHeight).fill();
        if (sec.accent) {
            doc.fillColor(colors.accent).rect(0, currentY, 85, contentHeight).fill();
        }
        doc.restore();

        renderRotatedLabel(sec.title, 45, currentY + (contentHeight / 2), sec.id === 'experience' ? '#FFFFFF' : '#000000');

        // Content
        let itemY = currentY + 35;
        const contentX = 100;
        const contentW = LEFT_W - 140;

        if (sec.id === 'summary') {
            doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11).text('PROFESSIONAL PROFILE', contentX, itemY);
            itemY += 18;
            doc.fillColor(colors.secondary).font('Helvetica').fontSize(10).text(data.summary || '', contentX, itemY, { width: contentW, align: 'justify', lineGap: 3 });
        } else if (sec.id === 'experience') {
            items.forEach(exp => {
                doc.fillColor(colors.accent).font('Helvetica-Bold').fontSize(9).text(`${exp.startDate || ''} - ${exp.endDate || 'Present'}`, contentX, itemY);
                itemY += 12;
                doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11).text((exp.jobTitle || '').toUpperCase(), contentX, itemY);
                itemY += 14;
                doc.fillColor('#333333').font('Helvetica-Bold').fontSize(9).text((exp.company || '').toUpperCase(), contentX, itemY);
                itemY += 12;
                if (exp.description) {
                    doc.fillColor(colors.secondary).font('Helvetica').fontSize(9).text(exp.description, contentX, itemY, { width: contentW, lineGap: 2 });
                    itemY = doc.y + 15;
                } else {
                    itemY += 15;
                }
            });
        } else if (sec.id === 'education') {
            items.forEach(edu => {
                doc.fillColor(colors.accent).font('Helvetica-Bold').fontSize(9).text(edu.gradYear || '', contentX, itemY);
                itemY += 12;
                doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11).text((edu.school || '').toUpperCase(), contentX, itemY);
                itemY += 14;
                doc.fillColor(colors.secondary).font('Helvetica').fontSize(10).text(edu.degree || '', contentX, itemY);
                itemY = doc.y + 15;
            });
        } else if (sec.id === 'projects') {
            items.forEach(proj => {
                doc.fillColor(colors.accent).font('Helvetica-Bold').fontSize(9).text(proj.duration || '', contentX, itemY);
                itemY += 12;
                doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11).text((proj.title || '').toUpperCase(), contentX, itemY);
                itemY += 14;
                doc.fillColor(colors.secondary).font('Helvetica').fontSize(10).text(proj.description || '', contentX, itemY, { width: contentW });
                itemY = doc.y + 15;
            });
        }

        currentY += contentHeight;
        // Separator
        doc.save();
        doc.strokeColor('#f0f0f0').lineWidth(1).moveTo(0, currentY).lineTo(LEFT_W, currentY).stroke();
        doc.restore();
    });

    // Sidebar Content (Right)
    const sidebarInnerX = SIDEBAR_X + 25;
    const sidebarInnerW = SIDEBAR_W - 50;
    let sidebarY = 35;

    // Photo
    const photoFrameH = 220;
    doc.save();
    doc.fillColor('#1a1a1a').rect(SIDEBAR_X + 35, sidebarY, SIDEBAR_W - 70, photoFrameH).fill();
    if (data.personalInfo?.profilePhoto) {
        try {
            const buffer = base64ToBuffer(data.personalInfo.profilePhoto);
            if (buffer) {
                doc.image(buffer, SIDEBAR_X + 35, sidebarY, { width: SIDEBAR_W - 70, height: photoFrameH, fit: [SIDEBAR_W - 70, photoFrameH], align: 'center', valign: 'center' });
            }
        } catch (e) {
            console.error('Signature Photo Error:', e);
        }
    }
    doc.restore();

    // Initials Circle
    const initials = (data.personalInfo.fullName || 'UN').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    doc.save();
    doc.fillColor(colors.accent).circle(SIDEBAR_X + 24, sidebarY + 35, 24).fill();
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(14).text(initials, SIDEBAR_X, sidebarY + 35 - 7, { width: 48, align: 'center' });
    doc.restore();

    sidebarY += photoFrameH + 30;

    // Name
    const fullName = (data.personalInfo.fullName || 'User Name').toUpperCase();
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || 'USER';
    const lastName = nameParts.slice(1).join(' ') || 'NAME';

    // Dynamic Font Size for Sidebar Name
    let nameSize = 24;
    if (fullName.length > 20) nameSize = 20;
    if (fullName.length > 28) nameSize = 16;

    doc.fillColor('#FFFFFF').font('Helvetica').fontSize(nameSize).text(firstName, sidebarInnerX, sidebarY);
    sidebarY = doc.y;
    doc.font('Helvetica-Bold').fontSize(nameSize).text(lastName, sidebarInnerX, sidebarY);
    sidebarY = doc.y + 10;

    // Job Title
    doc.fillColor('#888888').font('Helvetica-Bold').fontSize(8).text((data.personalInfo.roleTitle || 'Professional Title').toUpperCase(), sidebarInnerX, sidebarY, { characterSpacing: 2 });
    sidebarY = doc.y + 15;
    doc.strokeColor('#333333').lineWidth(1).moveTo(sidebarInnerX, sidebarY).lineTo(SIDEBAR_X + SIDEBAR_W - 25, sidebarY).stroke();
    sidebarY += 25;

    // Expertise (Skills with Bars)
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(11).text('EXPERTISE', sidebarInnerX, sidebarY);
    sidebarY = doc.y + 15;

    const skills = getSafeArray(data.skills).slice(0, 6);
    skills.forEach(skill => {
        doc.fillColor('#AAAAAA').font('Helvetica-Bold').fontSize(8).text(String(skill).toUpperCase(), sidebarInnerX, sidebarY, { characterSpacing: 1 });
        sidebarY = doc.y + 5;
        doc.fillColor('#222222').rect(sidebarInnerX, sidebarY, sidebarInnerW, 4).fill();
        doc.fillColor(colors.accent).rect(sidebarInnerX, sidebarY, sidebarInnerW * 0.85, 4).fill();
        sidebarY += 15;
    });

    sidebarY += 15;

    // Contact
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(11).text('CONTACT', sidebarInnerX, sidebarY);
    sidebarY = doc.y + 15;

    const contactItems = [
        { label: 'LOCATION', val: data.personalInfo.address || 'India' },
        { label: 'EMAIL', val: data.personalInfo.email },
        { label: 'PHONE', val: data.personalInfo.phone }
    ];

    contactItems.forEach(item => {
        if (item.val) {
            doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7.5).text(item.label, sidebarInnerX, sidebarY, { characterSpacing: 1 });
            sidebarY = doc.y + 4;
            doc.fillColor('#888888').font('Helvetica').fontSize(9).text(item.val, sidebarInnerX, sidebarY);
            sidebarY = doc.y + 12;
        }
    });
}

/**
 * HIERO PRESTIGE - Corporate editorial layout with sidebar
 */
async function renderTemplate_HieroPrestige(doc, rawData, colors, spacing) {
    const data = normalizeData(rawData);
    const sidebarWidth = PAGE_CONFIG.width * 0.32;
    const contentWidth = PAGE_CONFIG.width - sidebarWidth;
    const pInfo = data.personalInfo || {};

    // Standard high-end colors
    const COLORS = {
        sidebar: '#1e293b',
        main: '#ffffff',
        accent: '#3b82f6',
        textDark: '#0f172a',
        textLight: '#f8fafc',
        textMuted: '#64748b',
        sectionBar: '#f1f5f9'
    };

    const drawBackgrounds = () => {
        doc.save();
        doc.fillColor(COLORS.main).rect(sidebarWidth, 0, contentWidth, PAGE_CONFIG.height).fill();
        doc.fillColor(COLORS.sidebar).rect(0, 0, sidebarWidth, PAGE_CONFIG.height).fill();
        doc.restore();
    };

    const smartAddPage = () => {
        doc.addPage();
        drawBackgrounds();
        return 50; // New page top margin
    };

    drawBackgrounds();

    // --- SIDEBAR ---
    let sidebarY = 50;
    const sidebarInnerX = 30;
    const sidebarInnerWidth = sidebarWidth - 60;

    // Sidebar Title Helper
    const drawSidebarTitle = (title) => {
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text(title.toUpperCase(), sidebarInnerX, sidebarY, { characterSpacing: 2 });
        sidebarY = doc.y + 5;
        doc.save().lineWidth(0.5).strokeColor('rgba(255, 255, 255, 0.1)').moveTo(sidebarInnerX, sidebarY).lineTo(sidebarInnerX + sidebarInnerWidth, sidebarY).stroke().restore();
        sidebarY += 15;
    };

    drawSidebarTitle('Information');

    const contactFields = [
        { val: pInfo.address, label: 'Location' },
        { val: pInfo.phone, label: 'Phone' },
        { val: pInfo.email, label: 'Email' },
        { val: pInfo.website || pInfo.linkedin, label: 'Web' }
    ];

    contactFields.forEach(field => {
        if (field.val) {
            doc.fillColor('#ffffff').font('Helvetica').fontSize(9).text(field.val, sidebarInnerX, sidebarY, { width: sidebarInnerWidth, lineGap: 2 });
            sidebarY = doc.y + 12;
        }
    });

    // References in Sidebar
    const refs = getSafeArray(data.references);
    if (refs.length > 0) {
        sidebarY += 20;
        drawSidebarTitle('References');
        refs.slice(0, 2).forEach(ref => {
            doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10).text((ref.name || '').toUpperCase(), sidebarInnerX, sidebarY);
            doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#cbd5e1').text(ref.role || ref.title || '', sidebarInnerX, doc.y + 2);
            doc.font('Helvetica').fontSize(8.5).fillColor('#ffffff').text(ref.phone || '', sidebarInnerX, doc.y + 3);
            doc.text(ref.email || '', sidebarInnerX, doc.y + 1);
            sidebarY = doc.y + 20;
        });
    }

    // --- MAIN CONTENT ---
    let mainY = 50;
    const mainInnerX = sidebarWidth + 45;
    const mainInnerWidth = contentWidth - 90;

    // Header with photo on right
    const name = (pInfo.fullName || 'JOHN DOE').toUpperCase();
    const role = (pInfo.roleTitle || 'PROFESSIONAL').toUpperCase();

    // Calculate dynamic name size
    let nameFontSize = 30; // Reduced from 34
    if (name.length > 15) nameFontSize = 24; // Reduced from 28
    if (name.length > 22) nameFontSize = 20; // Reduced from 24

    // We calculate heights to help alignment
    const photoSize = 100;
    const photoX = sidebarWidth + contentWidth - 45 - photoSize;
    const headerTop = 50;

    doc.fillColor(COLORS.textDark).font('Times-Bold').fontSize(nameFontSize).text(name, mainInnerX, headerTop, { width: mainInnerWidth - photoSize - 20 });
    const headerBottom = doc.y;

    // doc.fillColor(COLORS.accent).font('Times-Bold').fontSize(12).text(role, mainInnerX, nameBottom + 8, { characterSpacing: 2 });
    // const headerBottom = doc.y;

    // Profile Photo on the right - Centered 'Cover' logic
    if (pInfo.profilePhoto) {
        try {
            const buffer = base64ToBuffer(pInfo.profilePhoto);
            if (buffer) {
                const finalPhotoY = headerTop;

                // Manual 'cover' calculation for perfect centering
                const img = doc.openImage(buffer);
                const iw = img.width;
                const ih = img.height;
                const scale = Math.max(photoSize / iw, photoSize / ih);
                const finalW = iw * scale;
                const finalH = ih * scale;
                const offX = (photoSize - finalW) / 2;
                const offY = (photoSize - finalH) / 2;

                doc.save();
                doc.circle(photoX + (photoSize / 2), finalPhotoY + (photoSize / 2), photoSize / 2).clip();
                doc.image(buffer, photoX + offX, finalPhotoY + offY, { width: finalW, height: finalH });
                doc.restore();
                doc.save().lineWidth(2).strokeColor(COLORS.sectionBar).circle(photoX + (photoSize / 2), finalPhotoY + (photoSize / 2), photoSize / 2).stroke().restore();
            }
        } catch (e) {
            console.error('Prestige PDF Photo Error:', e);
        }
    }

    mainY = Math.max(headerBottom, headerTop + photoSize) + 15; // Tightened from 20

    const renderHeader = (title) => {
        if (mainY > PAGE_CONFIG.height - 80) { mainY = smartAddPage(); }
        doc.fillColor(COLORS.textDark).font('Times-Bold').fontSize(10).text(title.toUpperCase(), mainInnerX, mainY, { characterSpacing: 1.5 });
        mainY = doc.y + 3;
        doc.save().lineWidth(1.5).strokeColor('#cbd5e1').moveTo(mainInnerX, mainY).lineTo(mainInnerX + mainInnerWidth, mainY).stroke().restore();
        mainY += 8;
    };

    // Experience
    const exp = getSafeArray(data.experience);
    if (exp.length > 0) {
        renderHeader('Work Experience');
        const timelineX = mainInnerX - 25;
        exp.forEach(item => {
            if (mainY > PAGE_CONFIG.height - 100) { mainY = smartAddPage(); }

            // Year
            doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(9).text(`${item.startDate || ''} - ${item.endDate || 'Present'}`, mainInnerX, mainY);
            const yearY = mainY;
            mainY = doc.y + 4;

            // Company & Title
            doc.fillColor(COLORS.textDark).font('Times-Bold').fontSize(11).text(item.company || '', mainInnerX, mainY);
            mainY = doc.y + 1;
            doc.font('Helvetica-Oblique').fontSize(9).fillColor(COLORS.textMuted).text(item.jobTitle || '', mainInnerX, mainY);
            mainY = doc.y + 6;

            // Description - slightly smaller font
            if (item.description) {
                const bullets = String(item.description).split('\n').filter(b => b.trim());
                bullets.forEach(bullet => {
                    const h = addBulletPoint(doc, bullet.replace(/^[•\-\*]\s*/, ''), mainInnerX + 15, mainY, mainInnerWidth - 15, {
                        accent: COLORS.textDark,
                        secondary: COLORS.textDark,
                        fontSize: 8.5 // Reduced font size
                    });
                    mainY += h + 1; // Reduced line gap
                });
            }

            // Timeline Node
            doc.save().lineWidth(2).strokeColor(COLORS.sidebar).circle(timelineX, yearY + 5, 4).stroke().restore();

            mainY += 6; // Reduced from 10
        });
    }

    // Education
    const education = getSafeArray(data.education);
    if (education.length > 0) {
        renderHeader('Education');
        education.forEach(item => {
            if (mainY > PAGE_CONFIG.height - 80) { mainY = smartAddPage(); }

            doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(9).text(item.gradYear || item.startDate || '', mainInnerX, mainY);
            const yearY = mainY;
            mainY = doc.y + 4;

            doc.fillColor(COLORS.textDark).font('Times-Bold').fontSize(10).text(item.school || '', mainInnerX, mainY);
            mainY = doc.y + 1;
            doc.font('Helvetica').fontSize(9).fillColor(COLORS.textMuted).text(item.degree || '', mainInnerX, mainY);

            // Node
            doc.save().lineWidth(2).strokeColor(COLORS.sidebar).circle(mainInnerX - 25, yearY + 5, 4).stroke().restore();

            mainY = doc.y + 6; // Reduced from 12
        });
    }

    // Skills - Aggressive compaction
    const skills = getSafeArray(data.skills);
    if (skills.length > 0) {
        renderHeader('Skills & Expertise');
        const colWidth = (mainInnerWidth - 30) / 2;
        const rowHeight = 22; // Very tight row height
        let currentSkillsY = mainY;

        skills.forEach((skill, i) => {
            const isRight = i % 2 === 1;
            const x = isRight ? mainInnerX + colWidth + 30 : mainInnerX;
            const y = currentSkillsY;

            if (y > PAGE_CONFIG.height - 40) {
                mainY = smartAddPage();
                currentSkillsY = mainY;
            }

            // Skill Name & Percentage - Tiny but readable
            const level = (0.7 + (Math.random() * 0.25)).toFixed(2);
            const percent = Math.round(level * 100);

            doc.fillColor(COLORS.textDark).font('Helvetica').fontSize(7.5).text(String(skill).toUpperCase(), x, y, { width: colWidth - 30, lineBreak: false });
            doc.fillColor(COLORS.accent).font('Helvetica').fontSize(7).text(`${percent}%`, x + colWidth - 25, y, { width: 25, align: 'right' });

            const barsY = doc.y + 4;
            doc.fillColor(COLORS.sectionBar).rect(x, barsY, colWidth, 3).fill();
            doc.fillColor(COLORS.accent).rect(x, barsY, colWidth * level, 3).fill();

            if (isRight || i === skills.length - 1) {
                currentSkillsY = y + rowHeight;
            }
        });
        mainY = currentSkillsY;
    }
}



// ==================== HIERO VISION TEMPLATE ====================
// Two-column layout: terracotta left sidebar + white right content area
async function renderTemplate_HieroVision(doc, rawData, colors, spacing) {
    const data = normalizeData(rawData);
    doc.addPage = function () { return doc; };

    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const TERRA = '#c96f5a';
    const TERRA_DARK = '#8a4b3c';
    const TERRA_DEEP = '#5a2d24';
    const WHITE = '#FFFFFF';
    const TEXT_DARK = '#222222';
    const TEXT_MED = '#444444';
    const SIDEBAR_W = PAGE_W * 0.37;
    const CONTENT_X = SIDEBAR_W;
    const CONTENT_W = PAGE_W - SIDEBAR_W;
    const MARGIN_S = 25;    // sidebar inner margin
    const MARGIN_C = 35;    // content inner margin

    // Draw sidebar background
    doc.rect(0, 0, SIDEBAR_W, PAGE_H).fill(TERRA);

    // Draw white right area
    doc.rect(SIDEBAR_W, 0, CONTENT_W, PAGE_H).fill(WHITE);

    // ---- SIDEBAR: Profile Photo ----
    let sideY = 30;
    const IMG_R = 70; // radius
    const IMG_CX = SIDEBAR_W / 2;
    const IMG_CY = sideY + IMG_R;

    if (data.personalInfo.profilePhoto) {
        doc.save();
        doc.circle(IMG_CX, IMG_CY, IMG_R).clip();
        try {
            const buf = base64ToBuffer(data.personalInfo.profilePhoto);
            doc.image(buf, IMG_CX - IMG_R, IMG_CY - IMG_R, { width: IMG_R * 2, height: IMG_R * 2, cover: [IMG_R * 2, IMG_R * 2] });
        } catch (e) { }
        doc.restore();
        // white ring
        doc.circle(IMG_CX, IMG_CY, IMG_R).lineWidth(4).strokeColor(WHITE).stroke();
    } else {
        doc.circle(IMG_CX, IMG_CY, IMG_R).fill(TERRA_DARK);
        doc.circle(IMG_CX, IMG_CY, IMG_R).lineWidth(4).strokeColor(WHITE).stroke();
    }

    sideY = IMG_CY + IMG_R + 20;

    // ---- SIDEBAR: Contact Items ----
    function drawSidebarSection(title, lines) {
        // Section header bar
        doc.rect(0, sideY, SIDEBAR_W, 26).fill(TERRA_DARK);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(WHITE);
        doc.text(title.toUpperCase(), MARGIN_S, sideY + 8, { width: SIDEBAR_W - MARGIN_S * 2 });
        sideY += 30;

        lines.filter(Boolean).forEach(line => {
            doc.font('Helvetica').fontSize(9.5).fillColor(WHITE);
            const lineH = doc.heightOfString('• ' + line, { width: SIDEBAR_W - MARGIN_S * 2 - 10 });
            doc.text('• ' + line, MARGIN_S + 10, sideY, { width: SIDEBAR_W - MARGIN_S * 2 - 10 });
            sideY += lineH + 4;
        });
        sideY += 10;
    }

    // Contact
    const contactLines = [
        data.personalInfo.phone,
        data.personalInfo.email,
        data.personalInfo.linkedin,
        data.personalInfo.github,
        data.personalInfo.website,
        data.personalInfo.address
    ].filter(Boolean);
    if (contactLines.length > 0) drawSidebarSection('Contact', contactLines);

    // Skills
    const skills = [
        ...(data.technicalSkills ? [data.technicalSkills] : []),
        ...(data.softSkills ? [data.softSkills] : []),
        ...(data.skills || [])
    ];
    if (skills.length > 0) {
        const skillLines = [];
        skills.forEach(s => {
            const str = typeof s === 'string' ? s : String(s);
            str.split(',').map(p => p.trim()).filter(Boolean).forEach(p => skillLines.push(p));
        });
        drawSidebarSection('Skills', skillLines);
    }

    // Education (sidebar)
    const edus = data.education || [];
    if (edus.length > 0) {
        drawSidebarSection('Education', edus.map(e =>
            `${e.school || ''}${e.degree ? ' — ' + e.degree : ''}${e.gradYear ? ' (' + e.gradYear + ')' : ''}`
        ));
    }

    // Languages
    const langs = data.personalInfo.languagesKnown || '';
    if (langs) drawSidebarSection('Languages', [langs]);

    // Interests
    const hobbies = data.hobbies || data.interests || [];
    if (hobbies.length > 0) drawSidebarSection('Interests', Array.isArray(hobbies) ? hobbies : [hobbies]);

    // ---- RIGHT CONTENT ----
    let rightY = 30;

    // Decorative ribbon
    const RIBBON_W = 40; const RIBBON_H = 60;
    doc.rect(PAGE_W - RIBBON_W - 35, 0, RIBBON_W, RIBBON_H).fill(TERRA);
    doc.polygon(
        [PAGE_W - RIBBON_W - 35, RIBBON_H],
        [PAGE_W - RIBBON_W - 35 + RIBBON_W / 2, RIBBON_H + 15],
        [PAGE_W - RIBBON_W - 35 + RIBBON_W, RIBBON_H]
    ).fill(TERRA);

    // Name
    const name = data.personalInfo.fullName || 'YOUR NAME';
    doc.font('Helvetica-Bold').fontSize(32).fillColor(TERRA_DEEP);
    doc.text(name, CONTENT_X + MARGIN_C, rightY, { width: CONTENT_W - MARGIN_C * 2 });
    rightY += 40;

    // Job title badge
    const jobTitle = data.personalInfo.jobTitle || data.experience?.[0]?.jobTitle || 'Professional';
    doc.rect(CONTENT_X + MARGIN_C, rightY, 220, 24).fill(TERRA_DARK);
    doc.font('Helvetica').fontSize(11).fillColor(WHITE);
    doc.text(jobTitle, CONTENT_X + MARGIN_C + 10, rightY + 6, { width: 200 });
    rightY += 40;

    function drawContentSection(title, renderFn) {
        // Section header
        doc.rect(CONTENT_X + MARGIN_C, rightY, 220, 22).fill(TERRA_DARK);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(WHITE);
        doc.text(title.toUpperCase(), CONTENT_X + MARGIN_C + 10, rightY + 6, { width: 200 });
        rightY += 28;

        const startY = rightY;
        renderFn();
        rightY += 14;
    }

    // Objective / Summary
    if (data.summary) {
        drawContentSection('Objective', () => {
            doc.font('Helvetica').fontSize(10).fillColor(TEXT_MED);
            doc.text(data.summary, CONTENT_X + MARGIN_C, rightY, { width: CONTENT_W - MARGIN_C * 2, align: 'justify' });
            rightY += doc.heightOfString(data.summary, { width: CONTENT_W - MARGIN_C * 2 }) + 4;
        });
    }

    // Experience
    const exps = data.experience || [];
    if (exps.length > 0) {
        drawContentSection('Work Experience', () => {
            exps.forEach(exp => {
                doc.font('Helvetica-Bold').fontSize(10.5).fillColor(TEXT_DARK);
                doc.text(`${exp.company ? exp.company + ', ' : ''}${exp.jobTitle || ''}`, CONTENT_X + MARGIN_C, rightY, { width: CONTENT_W - MARGIN_C * 2 });
                rightY += 14;

                doc.font('Helvetica').fontSize(9.5).fillColor(TERRA);
                doc.text(`${exp.startDate || ''} - ${exp.endDate || 'Present'}`, CONTENT_X + MARGIN_C, rightY);
                rightY += 14;

                if (exp.description) {
                    exp.description.split('\n').filter(Boolean).forEach(line => {
                        const cl = '- ' + line.replace(/^[-•]\s*/, '');
                        doc.font('Helvetica').fontSize(9.5).fillColor(TEXT_MED);
                        const lh = doc.heightOfString(cl, { width: CONTENT_W - MARGIN_C * 2 });
                        doc.text(cl, CONTENT_X + MARGIN_C, rightY, { width: CONTENT_W - MARGIN_C * 2 });
                        rightY += lh + 2;
                    });
                }
                rightY += 10;
            });
        });
    }

    // Projects
    const projects = data.projects || [];
    if (projects.length > 0) {
        drawContentSection('Projects', () => {
            projects.forEach(proj => {
                doc.font('Helvetica-Bold').fontSize(10.5).fillColor(TEXT_DARK);
                doc.text(proj.title || '', CONTENT_X + MARGIN_C, rightY, { width: CONTENT_W - MARGIN_C * 2 });
                rightY += 14;
                if (proj.tech) {
                    doc.font('Helvetica').fontSize(9.5).fillColor(TERRA);
                    doc.text(proj.tech, CONTENT_X + MARGIN_C, rightY);
                    rightY += 12;
                }
                if (proj.description) {
                    proj.description.split('\n').filter(Boolean).forEach(line => {
                        const cl = '- ' + line.replace(/^[-•]\s*/, '');
                        doc.font('Helvetica').fontSize(9.5).fillColor(TEXT_MED);
                        const lh = doc.heightOfString(cl, { width: CONTENT_W - MARGIN_C * 2 });
                        doc.text(cl, CONTENT_X + MARGIN_C, rightY, { width: CONTENT_W - MARGIN_C * 2 });
                        rightY += lh + 2;
                    });
                }
                rightY += 8;
            });
        });
    }

    // Certifications
    const certs = data.certifications || [];
    if (certs.length > 0) {
        drawContentSection('Certifications', () => {
            certs.forEach(cert => {
                const name = typeof cert === 'string' ? cert : (cert.name || cert.title || '');
                doc.font('Helvetica-Bold').fontSize(10).fillColor(TEXT_DARK);
                doc.text('• ' + name, CONTENT_X + MARGIN_C, rightY, { width: CONTENT_W - MARGIN_C * 2 });
                rightY += 16;
            });
        });
    }

    // Activities
    const acts = data.activities || data.extraCurricular || [];
    if (acts.length > 0) {
        drawContentSection('Activities', () => {
            acts.forEach(act => {
                const t = typeof act === 'string' ? act : (act.title || act.name || '');
                const r = typeof act === 'string' ? '' : (act.role || act.description || '');
                doc.font('Helvetica-Bold').fontSize(10).fillColor(TEXT_DARK);
                doc.text('• ' + t, CONTENT_X + MARGIN_C, rightY, { width: CONTENT_W - MARGIN_C * 2 });
                rightY += 14;
                if (r) {
                    doc.font('Helvetica').fontSize(9.5).fillColor(TEXT_MED);
                    const lh = doc.heightOfString(r, { width: CONTENT_W - MARGIN_C * 2 });
                    doc.text(r, CONTENT_X + MARGIN_C + 10, rightY, { width: CONTENT_W - MARGIN_C * 2 - 10 });
                    rightY += lh + 4;
                }
            });
        });
    }
}

async function renderTemplate_HieroPremium(doc, rawData, colors, spacing) {
    const data = normalizeData(rawData);

    // Prevent accidental pagination that causes infinite loops and scattered text
    doc.addPage = function () { return doc; };

    // Page Settings
    const MARGIN = 30;
    const PAGE_W = 595.28;
    const PAGE_H = 841.89;

    // Grid settings
    const COL_GAP = 15;
    const TOTAL_W = PAGE_W - (MARGIN * 2);
    const LEFT_W = TOTAL_W * 0.35;
    const RIGHT_W = TOTAL_W * 0.65 - COL_GAP;
    const LEFT_X = MARGIN;
    const RIGHT_X = MARGIN + LEFT_W + COL_GAP;

    // Colors matching the STEVEN TERRY image reference strictly
    const BG_COLOR = '#F4F5F7';      // Light grey layout
    const CARD_BG = '#FFFFFF';       // White Cards
    const PEACH_ACCENT = '#F2B66D';  // The peach/orange color used in headers
    const SHAPE_ACCENT1 = '#EFD6C8'; // Background triangle color
    const SHAPE_ACCENT2 = '#E6C6B3'; // Background triangle color
    const TEXT_PRI = '#333333';      // Main text dark
    const TEXT_SEC = '#555555';      // Secondary text lighter
    const TEXT_HEADER = '#000000';   // Header text inside peach box

    // 1. Draw Background Shapes
    doc.rect(0, 0, PAGE_W, PAGE_H).fill(BG_COLOR);

    // Render the abstract background triangles as seen in the template
    doc.path(`M0,0 L${PAGE_W * 0.5},0 L0,${PAGE_H * 0.25} Z`).fill(SHAPE_ACCENT1);
    doc.path(`M0,${PAGE_H * 0.3} L${LEFT_X + LEFT_W + 10},${PAGE_H * 0.8} L0,${PAGE_H * 0.9} Z`).fill(SHAPE_ACCENT2);
    doc.path(`M${PAGE_W * 0.7},${PAGE_H} L${PAGE_W},${PAGE_H - PAGE_H * 0.2} L${PAGE_W},${PAGE_H} Z`).fill(SHAPE_ACCENT2);

    let leftY = MARGIN;
    let rightY = MARGIN;

    // --- DRAW HEADER AREA ---
    // Profile Image
    const IMG_SIZE = 110;
    if (data.personalInfo.profilePhoto) {
        doc.save();
        doc.circle(LEFT_X + IMG_SIZE / 2, leftY + IMG_SIZE / 2, IMG_SIZE / 2).clip();
        try {
            const imgBuffer = base64ToBuffer(data.personalInfo.profilePhoto);
            doc.image(imgBuffer, LEFT_X, leftY, { width: IMG_SIZE, height: IMG_SIZE, cover: [IMG_SIZE, IMG_SIZE] });
        } catch (e) { }
        doc.restore();
    } else {
        doc.circle(LEFT_X + IMG_SIZE / 2, leftY + IMG_SIZE / 2, IMG_SIZE / 2).fill('#CCCCCC');
    }

    // Name & Title
    doc.font('Helvetica-Bold').fontSize(26).fillColor(TEXT_PRI);
    const nameText = (data.personalInfo.fullName || 'STEVEN TERRY').toUpperCase();
    const textStartY = leftY + 25;

    doc.text(nameText, RIGHT_X, textStartY, { width: RIGHT_W, align: 'center' });

    doc.moveTo(RIGHT_X + 20, textStartY + 35).lineTo(RIGHT_X + RIGHT_W - 20, textStartY + 35).lineWidth(1).strokeColor('#CCCCCC').stroke();

    doc.font('Helvetica').fontSize(12).fillColor(TEXT_SEC);
    doc.text(data.personalInfo.jobTitle || data.experience?.[0]?.jobTitle || 'Sales Staff', RIGHT_X, textStartY + 45, { width: RIGHT_W, align: 'center' });

    leftY += IMG_SIZE + 20;
    rightY = leftY;

    // --- Card Render Function ---
    // This absolutely isolates text measuring from rendering to prevent boundary issues
    function drawCard(x, y, width, renderContentFn, hasHeader = true, title = '') {
        const CARD_PAD = 12;
        const HEADER_H = 22;
        const CONTENT_START_Y = y + (hasHeader ? HEADER_H + CARD_PAD + 10 : CARD_PAD);

        let contentH = renderContentFn(x + CARD_PAD, CONTENT_START_Y, width - CARD_PAD * 2, true) || 0;
        const totalH = contentH + (hasHeader ? HEADER_H + 10 : 0) + CARD_PAD * 2;

        // Stop rendering if it physically won't fit to prevent page wrap blowups
        if (y + totalH > PAGE_H + 50) return Math.max(0, PAGE_H - y);

        // Draw shadow layer (mock drop shadow)
        doc.roundedRect(x + 3, y + 3, width, totalH, 6).fillOpacity(0.05).fill('#000000');
        doc.fillOpacity(1); // Reset opacity

        // Draw Card Background
        doc.roundedRect(x, y, width, totalH, 6).fill(CARD_BG);

        // Draw Header Box
        if (hasHeader && title) {
            doc.rect(x + CARD_PAD, y + CARD_PAD, width - CARD_PAD * 2, HEADER_H).fill(PEACH_ACCENT);
            doc.font('Helvetica-Bold').fontSize(10).fillColor(TEXT_HEADER);
            doc.text(title.toUpperCase(), x + CARD_PAD + 10, y + CARD_PAD + 6);
        }

        // Lock clipping region so overflowing content doesn't break everything
        doc.save();
        doc.roundedRect(x, y, width, totalH, 6).clip();

        // Render Actual Content
        renderContentFn(x + CARD_PAD, CONTENT_START_Y, width - CARD_PAD * 2, false);

        doc.restore();

        return totalH + 12; // Return card height + margin bottom
    }

    // --- LEFT COLUMN ---
    // 1. Personal Info 
    leftY += drawCard(LEFT_X, leftY, LEFT_W, (cx, cy, cw, dry) => {
        let cyy = cy;
        const items = [
            data.personalInfo.gender,
            data.personalInfo.dob,
            data.personalInfo.phone,
            data.personalInfo.email,
            data.personalInfo.linkedin,
            data.personalInfo.github,
            data.personalInfo.website,
            data.personalInfo.address
        ].filter(Boolean);

        items.forEach(itm => {
            if (!dry) {
                // simple bullet
                doc.fontSize(10).font('Helvetica').fillColor(PEACH_ACCENT).text('•', cx, cyy);
                doc.fillColor(TEXT_SEC).text(itm, cx + 12, cyy, { width: cw - 12 });
            }
            cyy += 18;
        });
        return cyy - cy;
    }, false);

    // 2. Objective
    if (data.summary) {
        leftY += drawCard(LEFT_X, leftY, LEFT_W, (cx, cy, cw, dry) => {
            doc.fontSize(9.5).font('Helvetica');
            const lines = data.summary.split('\n').filter(Boolean);
            let hTotal = 0;
            lines.forEach(line => {
                const lh = doc.heightOfString(line, { width: cw, lineGap: 2 });
                if (!dry) doc.fillColor(TEXT_SEC).text(line, cx, cy + hTotal, { width: cw, lineGap: 2 });
                hTotal += lh + 4;
            });
            return hTotal;
        }, true, 'Objective');
    }

    // 3. Skills
    const skills = [...(data.technicalSkills ? [data.technicalSkills] : []), ...(data.softSkills ? [data.softSkills] : []), ...(data.skills || [])];
    if (skills.length > 0) {
        leftY += drawCard(LEFT_X, leftY, LEFT_W, (cx, cy, cw, dry) => {
            let cyy = cy;
            skills.forEach(skillBlock => {
                const blockStr = typeof skillBlock === 'string' ? skillBlock : String(skillBlock);
                const descParts = blockStr.split(',').map(s => s.trim()).filter(Boolean);
                if (descParts.length > 0) {
                    if (!dry) doc.fontSize(10).font('Helvetica-Bold').fillColor(TEXT_PRI).text('Skills:', cx, cyy);
                    cyy += 14;
                    descParts.forEach(p => {
                        const txt = '- ' + p;
                        doc.fontSize(9.5).font('Helvetica');
                        const h = doc.heightOfString(txt, { width: cw });
                        if (!dry) doc.fillColor(TEXT_SEC).text(txt, cx + 5, cyy, { width: cw });
                        cyy += h + 2;
                    });
                    cyy += 6;
                }
            });
            return cyy - cy;
        }, true, 'Skills');
    }

    // 4. Languages
    const languages = data.personalInfo.languagesKnown || data.languages || '';
    if (languages) {
        leftY += drawCard(LEFT_X, leftY, LEFT_W, (cx, cy, cw, dry) => {
            doc.fontSize(9.5).font('Helvetica');
            const lines = (typeof languages === 'string' ? languages.split(',') : Array.isArray(languages) ? languages : []).map(s => s.trim ? s.trim() : '').filter(Boolean).join(', ');
            if (!lines) return 0;
            const h = doc.heightOfString(lines, { width: cw });
            if (!dry) doc.fillColor(TEXT_SEC).text(lines, cx, cy, { width: cw });
            return h;
        }, true, 'Languages');
    }

    // 5. Interests (Mapped from Hobbies)
    const hobbies = data.hobbies || data.interests || [];
    if (hobbies.length > 0) {
        leftY += drawCard(LEFT_X, leftY, LEFT_W, (cx, cy, cw, dry) => {
            doc.fontSize(9.5).font('Helvetica');
            const hs = hobbies.join(', ');
            const h = doc.heightOfString(hs, { width: cw });
            if (!dry) doc.fillColor(TEXT_SEC).text(hs, cx, cy, { width: cw });
            return h;
        }, true, 'Interests');
    }

    // --- RIGHT COLUMN ---
    // 1. Education
    const edus = data.education || [];
    if (edus.length > 0) {
        rightY += drawCard(RIGHT_X, rightY, RIGHT_W, (cx, cy, cw, dry) => {
            let cyy = cy;
            edus.forEach(edu => {
                if (!dry) {
                    doc.fontSize(11).font('Helvetica-Bold').fillColor(TEXT_PRI).text(edu.school || '', cx, cyy);
                    doc.fontSize(10).font('Helvetica').fillColor(TEXT_SEC).text(edu.degree || '', cx, cyy + 14);
                    doc.fontSize(9.5).fillColor(TEXT_SEC).text(`${edu.startDate || ''} - ${edu.endDate || ''}`, cx, cyy + 26);
                    if (edu.gpa) doc.fontSize(9.5).text(`GPA: ${edu.gpa}`, cx, cyy + 38);
                }
                cyy += (edu.gpa ? 52 : 40);
            });
            return cyy - cy;
        }, true, 'Education');
    }

    // 2. Work Experience
    const exps = data.experience || [];
    if (exps.length > 0) {
        rightY += drawCard(RIGHT_X, rightY, RIGHT_W, (cx, cy, cw, dry) => {
            let cyy = cy;
            exps.forEach(exp => {
                if (!dry) {
                    doc.fontSize(10.5).font('Helvetica-Bold').fillColor(TEXT_PRI)
                        .text(`${exp.company ? exp.company + ', ' : ''}${exp.jobTitle || ''}`, cx, cyy);
                    doc.fontSize(9.5).font('Helvetica').fillColor(TEXT_SEC)
                        .text(`${exp.startDate || ''} - ${exp.endDate || 'Present'}`, cx, cyy + 14);
                }
                cyy += 26;

                if (exp.description) {
                    if (!dry && !exp.description.includes('Main responsibilities:')) {
                        doc.fontSize(9.5).font('Helvetica').fillColor(TEXT_SEC).text('Main responsibilities:', cx, cyy);
                    }
                    if (!exp.description.includes('Main responsibilities:')) cyy += 12;

                    const descLines = exp.description.split('\n').filter(Boolean);
                    descLines.forEach(l => {
                        const cl = '- ' + l.replace(/^[-•]\s*/, '');
                        doc.fontSize(9.5).font('Helvetica');
                        const h = doc.heightOfString(cl, { width: cw });
                        if (!dry) doc.fillColor(TEXT_SEC).text(cl, cx, cyy, { width: cw });
                        cyy += h + 2;
                    });
                }
                cyy += 12;
            });
            return cyy - cy;
        }, true, 'Work Experience');
    }

    // 3. Projects
    const projects = data.projects || [];
    if (projects.length > 0) {
        rightY += drawCard(RIGHT_X, rightY, RIGHT_W, (cx, cy, cw, dry) => {
            let cyy = cy;
            projects.forEach(proj => {
                if (!dry) {
                    doc.fontSize(10.5).font('Helvetica-Bold').fillColor(TEXT_PRI)
                        .text(proj.title || '', cx, cyy);
                    if (proj.tech) {
                        doc.fontSize(9.5).font('Helvetica').fillColor(PEACH_ACCENT)
                            .text(proj.tech, cx, cyy + 14);
                    }
                }
                cyy += (proj.tech ? 28 : 14);

                if (proj.description) {
                    const descLines = proj.description.split('\n').filter(Boolean);
                    descLines.forEach(l => {
                        const cl = '- ' + l.replace(/^[-•]\s*/, '');
                        doc.fontSize(9.5).font('Helvetica');
                        const h = doc.heightOfString(cl, { width: cw });
                        if (!dry) doc.fillColor(TEXT_SEC).text(cl, cx, cyy, { width: cw });
                        cyy += h + 2;
                    });
                }
                cyy += 12;
            });
            return cyy - cy;
        }, true, 'Projects');
    }

    // 4. Certifications
    const certs = data.certifications || [];
    if (certs.length > 0) {
        rightY += drawCard(RIGHT_X, rightY, RIGHT_W, (cx, cy, cw, dry) => {
            let cyy = cy;
            certs.forEach(cert => {
                const name = typeof cert === 'string' ? cert : (cert.name || cert.title || '');
                if (!dry) {
                    doc.fontSize(10.5).font('Helvetica-Bold').fillColor(TEXT_PRI)
                        .text('• ' + name, cx, cyy);
                }
                cyy += 18;
            });
            return cyy - cy;
        }, true, 'Certifications');
    }

    // 5. Activities
    const acts = data.activities || data.extraCurricular || [];
    if (acts.length > 0) {
        rightY += drawCard(RIGHT_X, rightY, RIGHT_W, (cx, cy, cw, dry) => {
            let cyy = cy;
            acts.forEach(act => {
                const t = typeof act === 'string' ? act : (act.title || act.name || '');
                const d = typeof act === 'string' ? '' : (act.date || '');
                const r = typeof act === 'string' ? '' : (act.role || act.description || '');

                if (!dry) {
                    doc.fontSize(10.5).font('Helvetica-Bold').fillColor(TEXT_PRI).text(t, cx, cyy);
                    let my = cyy + 14;
                    if (d) { doc.fontSize(9.5).font('Helvetica').fillColor(TEXT_SEC).text(d, cx, my); my += 12; }

                    if (r) {
                        const rParts = r.split('\n').filter(Boolean);
                        rParts.forEach(l => {
                            const cl = '- ' + l.replace(/^[-•]\s*/, '');
                            const h = doc.heightOfString(cl, { width: cw });
                            doc.text(cl, cx, my, { width: cw });
                            my += h + 2;
                        });
                        cyy = my;
                    } else cyy = my;
                } else {
                    cyy += 14;
                    if (d) cyy += 12;
                    if (r) {
                        const rParts = r.split('\n').filter(Boolean);
                        rParts.forEach(l => {
                            doc.fontSize(9.5).font('Helvetica');
                            cyy += doc.heightOfString('- ' + l, { width: cw }) + 2;
                        });
                    }
                }
                cyy += 6;
            });
            return cyy - cy;
        }, true, 'Activities');
    }
}

// ==================== HIERO ROYAL (KickResume-Style Beige) ====================
async function renderTemplate_HieroRoyal(doc, rawData) {
    const data = normalizeData(rawData);
    // Prevent paginating
    doc.addPage = function () { return doc; };

    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const MARGIN = 36;
    const CONTENT_W = PAGE_W - MARGIN * 2;

    // Colors from image
    const BG = '#EDE8D9';   // warm beige background
    const ICON_BG = '#B8AC98';   // the round icon circle color
    const ICON_FG = '#FFFFFF';   // icon glyph color
    const BLACK = '#1A1A1A';   // name
    const DARK = '#2C2C2C';   // section titles, bold text
    const MED = '#4A4A4A';   // body text
    const LIGHT = '#6A6A6A';   // dates, secondary
    const BULLET = '#7A7060';   // bullet dots in contact row
    const LINE_CLR = '#C5BC9E';   // horizontal divider lines
    const TAG_BG = '#D8D2C0';   // strength tag pill background
    const TAG_TXT = '#3A3A2A';   // strength tag text

    // Fill beige background
    doc.rect(0, 0, PAGE_W, PAGE_H).fill(BG);

    let y = MARGIN;

    // ======= HEADER =======
    const PHOTO_SIZE = 88;
    const PHOTO_X = PAGE_W - MARGIN - PHOTO_SIZE;
    const HEADER_TEXT_W = PHOTO_X - MARGIN - 10;

    // Name
    const fullName = data.personalInfo.fullName || 'Your Name';
    doc.font('Helvetica-Bold').fontSize(28).fillColor(BLACK);
    doc.text(fullName, MARGIN, y, { width: HEADER_TEXT_W });
    y += 36;

    // Contact line — each item prefixed with a filled bullet dot
    const contactItems = [
        data.personalInfo.nationality ? `Nationality: ${data.personalInfo.nationality}` : null,
        data.personalInfo.address ? `Address: ${data.personalInfo.address}` : null,
        data.personalInfo.email ? `Email address: ${data.personalInfo.email}` : null,
        data.personalInfo.phone ? `Phone: ${data.personalInfo.phone}` : null,
        data.personalInfo.linkedin ? `LinkedIn: ${data.personalInfo.linkedin}` : null,
    ].filter(Boolean);

    doc.font('Helvetica').fontSize(9).fillColor(MED);
    contactItems.forEach((item, i) => {
        // bullet
        doc.fillColor(BULLET).circle(MARGIN + 4, y + 3.5, 2.5).fill();
        doc.fillColor(MED).text(item, MARGIN + 12, y, { width: HEADER_TEXT_W - 12 });
        y += 14;
    });

    // Profile photo – positioned at top right
    const PHOTO_Y = MARGIN;
    if (data.personalInfo.profilePhoto) {
        try {
            const buf = base64ToBuffer(data.personalInfo.profilePhoto);
            if (buf) {
                doc.save();
                doc.rect(PHOTO_X, PHOTO_Y, PHOTO_SIZE, PHOTO_SIZE).clip();
                doc.image(buf, PHOTO_X, PHOTO_Y, { width: PHOTO_SIZE, height: PHOTO_SIZE, cover: [PHOTO_SIZE, PHOTO_SIZE] });
                doc.restore();
            }
        } catch (e) {
            // placeholder grey box
            doc.rect(PHOTO_X, PHOTO_Y, PHOTO_SIZE, PHOTO_SIZE).fill('#C0B8A8');
        }
    } else {
        doc.rect(PHOTO_X, PHOTO_Y, PHOTO_SIZE, PHOTO_SIZE).fill('#C0B8A8');
    }

    // Horizontal divider after header
    y = Math.max(y, PHOTO_Y + PHOTO_SIZE) + 10;
    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).strokeColor(LINE_CLR).lineWidth(0.8).stroke();
    y += 14;

    // ======= SECTION RENDERER =======
    // Icon radius and dimensions
    const ICON_R = 12;
    const DATE_COL_W = 105;   // left: dates / location
    const BODY_X = MARGIN + ICON_R * 2 + 14 + DATE_COL_W + 14;
    const BODY_W = PAGE_W - MARGIN - BODY_X;

    function drawSectionHeader(title) {
        // Icon circle with simple text glyph shorthand
        doc.circle(MARGIN + ICON_R, y + ICON_R, ICON_R).fill(ICON_BG);
        // For icon text, use a simple single letter or symbol
        const icons = {
            'Resume summary': 'R',
            'Work experience': 'W',
            'Education': 'E',
            'Strengths': 'S',
            'Certificates': 'C',
            'Hobbies': 'H'
        };
        const glyph = icons[title] || title.charAt(0);
        doc.font('Helvetica-Bold').fontSize(9).fillColor(ICON_FG);
        const gW = doc.widthOfString(glyph);
        doc.text(glyph, MARGIN + ICON_R - gW / 2, y + ICON_R - 4.5);

        doc.font('Helvetica-Bold').fontSize(12).fillColor(DARK);
        doc.text(title, MARGIN + ICON_R * 2 + 10, y + ICON_R - 6.5, { width: 180 });

        // Horizontal rule extending from right of title to right margin
        const ruleStartX = MARGIN + ICON_R * 2 + 10 + doc.widthOfString(title) + 10;
        doc.moveTo(ruleStartX, y + ICON_R).lineTo(PAGE_W - MARGIN, y + ICON_R).strokeColor(LINE_CLR).lineWidth(0.7).stroke();

        y += ICON_R * 2 + 10;
    }

    // ======= SUMMARY =======
    if (data.summary) {
        drawSectionHeader('Resume summary');
        doc.font('Helvetica').fontSize(9.5).fillColor(MED);
        doc.text(data.summary, MARGIN, y, { width: CONTENT_W, align: 'justify', lineGap: 1.5 });
        y += doc.heightOfString(data.summary, { width: CONTENT_W }) + 16;

        doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).strokeColor(LINE_CLR).lineWidth(0.6).stroke();
        y += 14;
    }

    // ======= WORK EXPERIENCE =======
    const exps = data.experience || [];
    if (exps.length > 0) {
        drawSectionHeader('Work experience');

        exps.forEach(exp => {
            // Date + location left column
            const dateStr = `${exp.startDate || ''} – ${exp.endDate || 'present'}`;
            const locStr = exp.location || '';
            doc.font('Helvetica').fontSize(9).fillColor(LIGHT);
            doc.text(dateStr, MARGIN, y, { width: DATE_COL_W + ICON_R * 2 + 14 });
            if (locStr) {
                y += 12;
                doc.text(locStr, MARGIN, y, { width: DATE_COL_W + ICON_R * 2 + 14 });
                y -= 12;
            }

            // Job title + company
            doc.font('Helvetica-Bold').fontSize(10.5).fillColor(DARK);
            doc.text(exp.jobTitle || '', BODY_X, y, { width: BODY_W });
            y += 14;

            const company = exp.company || '';
            if (company) {
                doc.font('Helvetica-Bold').fontSize(9.5).fillColor(DARK);
                doc.text(company, BODY_X, y, { width: BODY_W });
                y += 13;
            }

            // Bullet points
            if (exp.description) {
                const lines = exp.description.split('\n').filter(l => l.trim());
                lines.forEach(line => {
                    const clean = line.replace(/^[\*\-•]\s*/, '');
                    doc.font('Helvetica').fontSize(9.5).fillColor(MED);
                    const txt = '• ' + clean;
                    const lh = doc.heightOfString(txt, { width: BODY_W - 4 });
                    doc.text(txt, BODY_X, y, { width: BODY_W - 4, lineGap: 1 });
                    y += lh + 3;
                });
            }
            y += 12;
        });

        doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).strokeColor(LINE_CLR).lineWidth(0.6).stroke();
        y += 14;
    }

    // ======= EDUCATION =======
    const edus = data.education || [];
    if (edus.length > 0) {
        drawSectionHeader('Education');

        edus.forEach(edu => {
            const dateStr = edu.gradYear ? edu.gradYear : '';
            doc.font('Helvetica').fontSize(9).fillColor(LIGHT);
            doc.text(dateStr, MARGIN, y, { width: DATE_COL_W + ICON_R * 2 + 14 });

            doc.font('Helvetica-Bold').fontSize(10.5).fillColor(DARK);
            doc.text(edu.degree || '', BODY_X, y, { width: BODY_W });
            y += 14;

            doc.font('Helvetica-Bold').fontSize(9.5).fillColor(DARK);
            doc.text(edu.school || '', BODY_X, y, { width: BODY_W });
            y += 13;

            if (edu.gpa) {
                doc.font('Helvetica').fontSize(9).fillColor(MED);
                doc.text(edu.gpa, BODY_X, y, { width: BODY_W });
                y += 12;
            }
            y += 8;
        });

        doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).strokeColor(LINE_CLR).lineWidth(0.6).stroke();
        y += 14;
    }

    // ======= STRENGTHS / SKILLS =======
    const allSkills = [
        ...(data.skills || []),
        ...(data.softSkills || []),
        ...(typeof data.technicalSkills === 'string' ? data.technicalSkills.split(',').map(s => s.trim()).filter(Boolean) : [])
    ].filter(Boolean).slice(0, 14); // cap to avoid overflow

    if (allSkills.length > 0) {
        drawSectionHeader('Strengths');
        // Tag pills – wrapping
        let tagX = MARGIN;
        const TAG_H = 22;
        const TAG_PAD = 10;
        const TAG_GAP = 8;
        const TAG_ROW_GAP = 8;

        allSkills.forEach(skill => {
            const label = typeof skill === 'string' ? skill : String(skill);
            doc.font('Helvetica').fontSize(9);
            const tagW = Math.min(doc.widthOfString(label) + TAG_PAD * 2, 160);

            if (tagX + tagW > PAGE_W - MARGIN) {
                tagX = MARGIN;
                y += TAG_H + TAG_ROW_GAP;
            }
            doc.roundedRect(tagX, y, tagW, TAG_H, 4).fill(TAG_BG);
            doc.fillColor(TAG_TXT).text(label, tagX + TAG_PAD, y + 6, { width: tagW - TAG_PAD * 2, ellipsis: true });
            tagX += tagW + TAG_GAP;
        });
        y += TAG_H + 16;

        doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).strokeColor(LINE_CLR).lineWidth(0.6).stroke();
        y += 14;
    }

    // ======= CERTIFICATIONS =======
    const certs = data.certifications || [];
    if (certs.length > 0) {
        drawSectionHeader('Certificates');

        certs.forEach(cert => {
            const name = typeof cert === 'string' ? cert : (cert.name || cert.title || '');
            const date = typeof cert === 'object' ? (cert.date || cert.year || '') : '';

            if (date) {
                doc.font('Helvetica').fontSize(9).fillColor(LIGHT);
                doc.text(date, MARGIN, y, { width: DATE_COL_W + ICON_R * 2 + 14 });
            }

            doc.font('Helvetica-Bold').fontSize(10.5).fillColor(DARK);
            doc.text(name, BODY_X, y, { width: BODY_W });
            y += 14;

            if (typeof cert === 'object' && cert.issuer) {
                doc.font('Helvetica-Bold').fontSize(9.5).fillColor(DARK);
                doc.text(cert.issuer, BODY_X, y, { width: BODY_W });
                y += 13;
            }
            y += 6;
        });

        doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).strokeColor(LINE_CLR).lineWidth(0.6).stroke();
        y += 14;
    }

    // ======= HOBBIES =======
    const hobbies = data.hobbies || data.interests || [];
    if (hobbies.length > 0) {
        drawSectionHeader('Hobbies');

        // Display as row of labeled groups (like the image icons row)
        const hobbyArr = Array.isArray(hobbies)
            ? hobbies.map(h => typeof h === 'string' ? h : String(h))
            : [String(hobbies)];

        doc.font('Helvetica').fontSize(9.5).fillColor(MED);
        const hobbyIconSymbols = ['📷', '📚', '🎸', '⚽', '🎨', '🏃', '🍳', '✈️'];
        const colW = Math.floor(CONTENT_W / Math.min(hobbyArr.length, 5));

        hobbyArr.slice(0, 5).forEach((hobby, i) => {
            const hx = MARGIN + i * colW;
            // draw a simple circle icon placeholder
            doc.circle(hx + colW / 2, y + 16, 14).fillColor(LINE_CLR).fill();
            doc.font('Helvetica').fontSize(8).fillColor(MED);
            doc.text(hobby, hx, y + 36, { width: colW, align: 'center' });
        });
        y += 60;
    }
}

// ==================== HIERO ACADEMIC (Dark / Yellow — KickResume Pixel-Perfect) ====================
async function renderTemplate_HieroAcademic(doc, rawData) {
    const data = normalizeData(rawData);
    doc.addPage = function () { return doc; };  // strict single page

    const PW = 595.28;
    const PH = 841.89;

    const DARK = '#222222';
    const YEL = '#F0D03D';
    const WHITE = '#FFFFFF';
    const LGRAY = '#D0D0D0';
    const BLACK = '#111111';

    const LEFT_W = 230;
    const RIGHT_X = 230;
    const RIGHT_W = PW - RIGHT_X;

    // 1. Base dark background
    doc.rect(0, 0, PW, PH).fill(DARK);

    // 2. Top yellow polygon on right side
    doc.moveTo(RIGHT_X, 0)
        .lineTo(PW, 0)
        .lineTo(PW, 140)
        .lineTo(RIGHT_X, 200)
        .closePath()
        .fill(YEL);

    // 3. Bottom yellow polygon on right side
    doc.moveTo(RIGHT_X, PH - 60)
        .lineTo(PW, PH - 120)
        .lineTo(PW, PH)
        .lineTo(RIGHT_X, PH)
        .closePath()
        .fill(YEL);

    const PI = data.personalInfo || {};

    // ---------------- RIGHT HEADER ELEMENTS ----------------
    // Profile Picture
    const PR = 45;
    const PCX = 310;
    const PCY = 85;

    doc.save();
    doc.circle(PCX, PCY, PR).clip();
    let photoDrawn = false;
    if (PI.profilePhoto) {
        try {
            const buf = base64ToBuffer(PI.profilePhoto);
            if (buf) {
                doc.image(buf, PCX - PR, PCY - PR, { width: PR * 2, height: PR * 2, cover: [PR * 2, PR * 2] });
                photoDrawn = true;
            }
        } catch (e) { }
    }
    if (!photoDrawn) {
        doc.rect(PCX - PR, PCY - PR, PR * 2, PR * 2).fill('#444444');
    }
    doc.restore();

    // Contact Info (Top Right - black text on yellow)
    let detY = 40;
    const detX = 390;
    doc.font('Helvetica').fontSize(9).fillColor(BLACK);
    const detailItems = [
        PI.dob ? PI.dob : null,
        PI.nationality ? PI.nationality : null,
        PI.phone ? PI.phone : null,
        PI.email ? PI.email : null,
        PI.linkedin ? PI.linkedin : null
    ].filter(Boolean);

    detailItems.forEach(txt => {
        doc.circle(detX + 4, detY + 4, 3).stroke(BLACK).lineWidth(1);
        doc.circle(detX + 4, detY + 4, 1.5).fill(BLACK);
        doc.text(txt, detX + 12, detY, { width: PW - detX - 20, lineBreak: false });
        detY += 15;
    });

    // Footer Text (Bottom Right - black text on yellow)
    const fX = PW - 180;
    const fY = PH - 40;
    doc.font('Helvetica').fontSize(9).fillColor(BLACK);
    if (PI.address) {
        doc.circle(fX - 8, fY + 4, 3).stroke(BLACK).lineWidth(1);
        doc.circle(fX - 8, fY + 4, 1.5).fill(BLACK);
        doc.text(PI.address, fX, fY, { width: 160 });
    }
    if (PI.website) {
        doc.circle(fX - 8, fY + 19, 3).stroke(BLACK).lineWidth(1);
        doc.circle(fX - 8, fY + 19, 1.5).fill(BLACK);
        doc.text(PI.website, fX, fY + 15, { width: 160 });
    }

    // ---------------- LEFT COLUMN ELEMENTS ----------------
    let ly = 40;

    // Name
    const fullName = (PI.fullName || 'YOUR NAME').trim();
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    doc.font('Helvetica-Bold').fontSize(34).fillColor(WHITE).text(firstName.toUpperCase(), 30, ly);
    ly += 34;
    doc.font('Helvetica-Bold').fontSize(34).fillColor(LGRAY).text(lastName.toUpperCase(), 30, ly);
    ly += 50;

    // Objective
    if (data.summary) {
        doc.rect(30, ly + 2, 8, 8).stroke(YEL).lineWidth(1.5);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(YEL).text('RESUME OBJECTIVE', 45, ly);
        ly += 22;
        doc.font('Helvetica').fontSize(8.5).fillColor(LGRAY);
        const summH = doc.heightOfString(data.summary, { width: 170, lineGap: 2 });
        doc.text(data.summary, 30, ly, { width: 170, lineGap: 2 });
        ly += summH + 20;
    }

    // Experience
    const exps = data.experience || [];
    if (exps.length > 0) {
        doc.rect(30, ly + 2, 8, 8).stroke(YEL).lineWidth(1.5);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(YEL).text('WORK EXPERIENCE', 45, ly);
        ly += 25;

        exps.forEach(exp => {
            if (ly > PH - 40) return;
            const startD = exp.startDate || '';
            const endD = exp.endDate || 'Present';
            const loc = exp.location || '';
            let dateLoc = `${startD} - ${endD}`;
            if (loc) dateLoc += `    ${loc}`;
            doc.font('Helvetica').fontSize(7.5).fillColor(YEL).text(dateLoc.toUpperCase(), 30, ly);
            ly += 12;

            doc.font('Helvetica-Bold').fontSize(10).fillColor(WHITE).text(exp.jobTitle || '', 30, ly);
            ly += 13;

            if (exp.company) {
                doc.font('Helvetica-Bold').fontSize(9).fillColor(LGRAY).text(exp.company, 30, ly);
                ly += 12;
            }

            if (exp.description) {
                const lines = exp.description.split('\n').filter(l => l.trim());
                doc.font('Helvetica').fontSize(8).fillColor(LGRAY);
                lines.forEach(line => {
                    if (ly > PH - 30) return;
                    const clean = line.replace(/^[\*\-•]\s*/, '');
                    const txt = '•  ' + clean;
                    const h = doc.heightOfString(txt, { width: 170, lineGap: 1.5 });
                    doc.text(txt, 30, ly, { width: 170, lineGap: 1.5 });
                    ly += h + 2;
                });
            }
            ly += 15;
        });
    }

    // ---------------- RIGHT COLUMN ELEMENTS ----------------
    let ry = 230; // Starts below the top yellow polygon

    // Education
    const edus = data.education || [];
    if (edus.length > 0) {
        doc.rect(RIGHT_X + 20, ry + 2, 8, 8).stroke(YEL).lineWidth(1.5);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(YEL).text('EDUCATION', RIGHT_X + 35, ry);
        ry += 25;

        edus.forEach(edu => {
            if (ry > PH - 100) return;
            const d = edu.gradYear || '';
            const loc = edu.location || '';
            let dateLoc = d;
            if (loc) dateLoc += (d ? '    ' : '') + loc;
            if (dateLoc) {
                doc.font('Helvetica').fontSize(7.5).fillColor(YEL).text(dateLoc.toUpperCase(), RIGHT_X + 20, ry);
                ry += 12;
            }

            doc.font('Helvetica-Bold').fontSize(10).fillColor(WHITE).text(edu.degree || '', RIGHT_X + 20, ry);
            ry += 13;

            if (edu.school) {
                doc.font('Helvetica-Bold').fontSize(9).fillColor(LGRAY).text(edu.school, RIGHT_X + 20, ry);
                ry += 12;
            }
            if (edu.gpa) {
                doc.font('Helvetica').fontSize(8.5).fillColor(LGRAY).text(edu.gpa, RIGHT_X + 20, ry);
                ry += 12;
            }
            ry += 15;
        });
    }

    // Skills
    const techSkills = typeof data.technicalSkills === 'string' ? data.technicalSkills.split(',').map(s => s.trim()).filter(Boolean) : (data.technicalSkills || []);
    const extSkills = data.skills ? data.skills : techSkills;

    if (extSkills.length > 0) {
        doc.rect(RIGHT_X + 20, ry + 2, 8, 8).stroke(YEL).lineWidth(1.5);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(YEL).text('SKILLS', RIGHT_X + 35, ry);
        ry += 20;

        doc.font('Helvetica-Bold').fontSize(8).fillColor(WHITE).text('SOFTWARE', RIGHT_X + 20, ry);
        ry += 15;

        extSkills.slice(0, 5).forEach((sk, i) => {
            if (ry > PH - 90) return;
            doc.font('Helvetica').fontSize(8.5).fillColor(LGRAY).text(sk, RIGHT_X + 20, ry);
            const barX = RIGHT_X + 110;
            const percentages = [0.95, 0.85, 0.75, 0.65, 0.55];
            const pct = percentages[i] || 0.6;
            doc.rect(barX, ry + 3, RIGHT_W - 140, 4).fill('#444444');
            doc.rect(barX, ry + 3, (RIGHT_W - 140) * pct, 4).fill(YEL);
            ry += 14;
        });
        ry += 10;
    }

    // Languages
    const langs = typeof data.languages === 'string' ? data.languages.split(',').map(s => s.trim()).filter(Boolean) : (data.languages || []);
    if (langs.length > 0 && ry < PH - 140) {
        doc.font('Helvetica-Bold').fontSize(8).fillColor(WHITE).text('LANGUAGES', RIGHT_X + 20, ry);
        ry += 15;
        langs.slice(0, 3).forEach((lang, i) => {
            if (ry > PH - 100) return;
            doc.font('Helvetica').fontSize(8.5).fillColor(LGRAY).text(lang, RIGHT_X + 20, ry);
            const profs = ['Native', 'Professional', 'Limited'];
            const lvl = profs[i] || 'Limited';
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor(YEL).text(lvl, RIGHT_X + 110, ry);
            ry += 14;
        });
        ry += 10;
    }

    // Special Skills
    const soft = typeof data.softSkills === 'string' ? data.softSkills.split(',').map(s => s.trim()).filter(Boolean) : (data.softSkills || []);
    if (soft.length > 0 && ry < PH - 140) {
        doc.rect(RIGHT_X + 20, ry + 2, 8, 8).stroke(YEL).lineWidth(1.5);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(YEL).text('SPECIAL SKILLS', RIGHT_X + 35, ry);
        ry += 20;

        soft.slice(0, 5).forEach(sk => {
            if (ry > PH - 100) return;
            const txt = '•  ' + sk;
            doc.font('Helvetica').fontSize(8.5).fillColor(LGRAY);
            const h = doc.heightOfString(txt, { width: RIGHT_W - 50 });
            doc.text(txt, RIGHT_X + 20, ry, { width: RIGHT_W - 50 });
            ry += h + 3;
        });
    }
}


// ==================== HIERO CLASSIC (Specific Layout) ====================
async function renderTemplate_HieroUrban(doc, rawData) {
    const data = normalizeData(rawData);
    doc.addPage = function () { return doc; };  // strict single page

    const PW = 595.28;
    const PH = 841.89;

    const DARK = '#1E293B';      // Deep Slate Blue for dark sections
    const LIGHT = '#F8FAFC';     // Very Soft Slate for background
    const WHITE = '#FFFFFF';
    const GRAY_TEXT = '#475569'; // Slate 600 for body text
    const BLACK = '#0F172A';     // Darker Slate for headings
    const ACCENT = '#0284C7';    // Vibrant Sky Blue for highlights

    const LEFT_W = 205;
    const RIGHT_X = 230;
    const RIGHT_W = PW - RIGHT_X - 30;
    const HDR_H = 160;

    // 1. Base background (Light Gray)
    doc.rect(0, 0, PW, PH).fill(LIGHT);

    // 2. Header Left Dark Box
    doc.rect(0, 0, LEFT_W, HDR_H).fill(DARK);

    const PI = data.personalInfo || {};

    // ---------------- HEADER ELEMENTS ----------------
    // Profile Picture
    const PR = 50;
    const PCX = LEFT_W / 2;
    const PCY = HDR_H / 2;

    doc.save();
    doc.circle(PCX, PCY, PR).clip();
    let photoDrawn = false;
    if (PI.profilePhoto) {
        try {
            const buf = base64ToBuffer(PI.profilePhoto);
            if (buf) {
                doc.image(buf, PCX - PR, PCY - PR, { width: PR * 2, height: PR * 2, cover: [PR * 2, PR * 2] });
                photoDrawn = true;
            }
        } catch (e) { }
    }
    if (!photoDrawn) {
        doc.rect(PCX - PR, PCY - PR, PR * 2, PR * 2).fill('#555555');
    }
    doc.restore();

    // Name and Title
    let ry = 40;
    const fullName = (PI.fullName || 'YOUR NAME').trim();
    doc.font('Helvetica-Bold').fontSize(34).fillColor(BLACK).text(fullName.toUpperCase(), RIGHT_X, ry);
    ry += 40;

    // Title Box
    const title = PI.jobTitle || 'Professional';
    doc.rect(RIGHT_X, ry, PW - RIGHT_X - 30, 20).fill(ACCENT);
    doc.font('Helvetica').fontSize(10).fillColor(WHITE).text(title, RIGHT_X + 10, ry + 6);

    // ---------------- LEFT COLUMN ELEMENTS ----------------
    let ly = HDR_H + 20;

    // Contact Info
    const contacts = [
        { icon: 'p', txt: PI.phone || '' },
        { icon: 'e', txt: PI.email || '' },
        { icon: 'w', txt: PI.website || PI.linkedin || '' },
        { icon: 'a', txt: PI.address || '' }
    ];

    doc.lineWidth(1);
    contacts.forEach(c => {
        if (!c.txt) return;
        doc.moveTo(25, ly).lineTo(LEFT_W - 25, ly).strokeColor('#CCCCCC').stroke();
        ly += 10;

        // Use a generic rectangle/polygon as "Icon placeholder" 
        doc.circle(35, ly + 5, 6).fill(ACCENT);
        doc.font('Helvetica-Bold').fontSize(8).fillColor(WHITE).text(c.icon.toUpperCase(), 32.5, ly + 1.5, { lineBreak: false });

        doc.font('Helvetica').fontSize(9).fillColor(DARK).text(c.txt, 55, ly + 0.5, { width: 120, lineBreak: false });
        ly += 15;
    });
    // Final contact line
    doc.moveTo(25, ly).lineTo(LEFT_W - 25, ly).strokeColor('#CCCCCC').stroke();
    ly += 20;

    // Dark Bottom Box
    doc.rect(0, ly, LEFT_W, PH - ly).fill(DARK);

    // Education
    ly += 25;
    if (data.education && data.education.length > 0) {
        doc.font('Helvetica-Bold').fontSize(12).fillColor(ACCENT).text('EDUCATION', 25, ly, { characterSpacing: 1.5 });
        doc.moveTo(25, ly + 16).lineTo(100, ly + 16).strokeColor(ACCENT).stroke();
        ly += 30;

        data.education.forEach(edu => {
            if (ly > PH - 40) return;
            doc.font('Helvetica-Bold').fontSize(9).fillColor(WHITE).text(edu.degree || '', 25, ly);
            ly += 12;
            doc.font('Helvetica').fontSize(8).fillColor('#CCCCCC').text(edu.school || '', 25, ly);
            ly += 11;
            const dates = edu.gradYear || '';
            if (dates) {
                doc.font('Helvetica').fontSize(8).fillColor('#CCCCCC').text(dates, 25, ly);
                ly += 11;
            }
            ly += 8;
        });
    }

    // Skills
    const techSkills = typeof data.technicalSkills === 'string' ? data.technicalSkills.split(',').map(s => s.trim()).filter(Boolean) : (data.technicalSkills || []);
    const extSkills = data.skills ? data.skills : techSkills;

    if (extSkills.length > 0) {
        ly += 10;
        doc.font('Helvetica-Bold').fontSize(12).fillColor(ACCENT).text('SKILLS', 25, ly, { characterSpacing: 1.5 });
        doc.moveTo(25, ly + 16).lineTo(80, ly + 16).strokeColor(ACCENT).stroke();
        ly += 30;

        extSkills.slice(0, 5).forEach((sk, i) => {
            if (ly > PH - 40) return;
            doc.font('Helvetica').fontSize(8.5).fillColor(WHITE).text(sk, 25, ly);
            const percentages = [0.95, 0.85, 0.75, 0.65, 0.55];
            const pct = percentages[i] || 0.6;

            // Outer rectangle
            doc.rect(95, ly + 2, 75, 5).strokeColor(ACCENT).stroke();
            // Inner filled
            doc.rect(95, ly + 2, 75 * pct, 5).fill(ACCENT);

            ly += 16;
        });
    }

    // Interests
    const hobbies = typeof data.hobbies === 'string' ? data.hobbies.split(',').map(s => s.trim()).filter(Boolean) : (data.hobbies || []);
    if (hobbies.length > 0) {
        ly += 15;
        doc.font('Helvetica-Bold').fontSize(12).fillColor(ACCENT).text('INTERESTS', 25, ly, { characterSpacing: 1.5 });
        doc.moveTo(25, ly + 16).lineTo(100, ly + 16).strokeColor(ACCENT).stroke();
        ly += 30;

        let col1 = [], col2 = [];
        hobbies.slice(0, 6).forEach((h, i) => { i % 2 === 0 ? col1.push(h) : col2.push(h); });

        let tempy = ly;
        col1.forEach(h => {
            if (tempy > PH - 20) return;
            doc.font('Helvetica').fontSize(8.5).fillColor('#CCCCCC').text(h, 25, tempy);
            tempy += 14;
        });
        tempy = ly;
        col2.forEach(h => {
            if (tempy > PH - 20) return;
            doc.font('Helvetica').fontSize(8.5).fillColor('#CCCCCC').text(h, 95, tempy);
            tempy += 14;
        });
    }

    // ---------------- RIGHT COLUMN ELEMENTS ----------------
    ry = HDR_H + 20;

    function renderSectionTitleR(title, y) {
        doc.font('Helvetica-Bold').fontSize(12).fillColor(BLACK).text(title.toUpperCase(), RIGHT_X, y, { characterSpacing: 1 });
        doc.moveTo(RIGHT_X, y + 16).lineTo(PW - 30, y + 16).strokeColor(ACCENT).stroke();
        return y + 30;
    }

    // Statement
    if (data.summary) {
        ry = renderSectionTitleR('STATEMENT', ry);
        doc.font('Helvetica').fontSize(9).fillColor(GRAY_TEXT);
        const sh = doc.heightOfString(data.summary, { width: RIGHT_W, lineGap: 2 });
        doc.text(data.summary, RIGHT_X, ry, { width: RIGHT_W, lineGap: 2 });
        ry += sh + 25;
    }

    // Experience
    const exps = data.experience || [];
    if (exps.length > 0) {
        ry = renderSectionTitleR('EXPERIENCE', ry);

        exps.forEach(exp => {
            if (ry > PH - 80) return;
            const startD = exp.startDate || '';
            const endD = exp.endDate || 'Present';
            const dateStr = `${startD}-${endD}`;

            // Date Box (Right aligned box like in image)
            const dateW = 60;
            doc.rect(PW - 30 - dateW, ry, dateW, 14).fill('#E0F2FE');
            doc.font('Helvetica-Bold').fontSize(7.5).fillColor(ACCENT).text(dateStr.toUpperCase(), PW - 30 - dateW, ry + 3, { width: dateW, align: 'center' });

            // Job Title
            doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK).text(exp.jobTitle ? exp.jobTitle.toUpperCase() : '', RIGHT_X, ry);
            ry += 15;

            // Company/Location
            const loc = exp.location ? `/${exp.location}` : '';
            doc.font('Helvetica').fontSize(8.5).fillColor(GRAY_TEXT).text(`${exp.company || ''}${loc}`, RIGHT_X, ry);
            ry += 15;

            // Description
            if (exp.description) {
                const lines = exp.description.split('\n').filter(l => l.trim());
                doc.font('Helvetica').fontSize(8.5).fillColor(GRAY_TEXT);
                lines.forEach(line => {
                    if (ry > PH - 30) return;
                    const clean = line.replace(/^[\*\-•]\s*/, '');
                    const txt = '• ' + clean;
                    const h = doc.heightOfString(txt, { width: RIGHT_W, lineGap: 2 });
                    doc.text(txt, RIGHT_X, ry, { width: RIGHT_W, lineGap: 2 });
                    ry += h + 2;
                });
            }
            ry += 15;
        });
    }

    // References
    const refs = data.references || [];
    if (refs.length > 0 && ry < PH - 80) {
        ry = renderSectionTitleR('REFERENCE', ry);

        // Calculate available width for boxes
        const spaceW = PW - RIGHT_X - 30; // approx 335
        const refW = (spaceW - 15) / 2;
        let rx = RIGHT_X;

        refs.slice(0, 2).forEach((ref, index) => {
            // Draw Box
            doc.rect(rx, ry, refW, 60).fillAndStroke('#F1F5F9', '#CBD5E1');

            let tryy = ry + 8;
            doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK).text(ref.name || 'Reference Name', rx + 10, tryy);
            tryy += 12;
            doc.font('Helvetica').fontSize(8).fillColor(GRAY_TEXT).text(ref.title || 'Role', rx + 10, tryy);
            tryy += 12;
            if (ref.phone) {
                doc.font('Helvetica').fontSize(8).fillColor(DARK).text(`T : ${ref.phone}`, rx + 10, tryy);
                tryy += 10;
            }
            if (ref.email) {
                doc.font('Helvetica').fontSize(8).fillColor(DARK).text(`E : ${ref.email}`, rx + 10, tryy);
            }
            rx += refW + 15; // Move X over for next reference
        });
    }
}

/**
 * 🎨 HIERO COOL TEMPLATE
 * Two-column modern template with dark sidebar and purple accents.
 */
function renderTemplate_HieroCool(doc, data) {
    const margin = 40;
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const leftWidth = 195;

    // Normalize data to standard structure used in this file
    const normalized = typeof normalizeData === 'function' ? normalizeData(data) : data;
    const pInfo = normalized.personalInfo || {};

    const colors = {
        bg: '#0B0B0B',        // Obsidian Background
        sidebar: '#151515',   // Slightly lighter sidebar
        accent: '#10B981',    // Emerald
        highlight: '#34D399', // Soft Emerald
        text: '#F9FAFB',      // Main Text (Off-white)
        dim: '#94A3B8'        // Muted Slate
    };

    // Draw main background (Dark Theme)
    doc.rect(0, 0, pageWidth, pageHeight).fill(colors.bg);

    // Draw Left Column Sidebar
    doc.rect(0, 0, leftWidth, pageHeight).fill(colors.sidebar);

    // Profile Photo (Top Left)
    const photoSize = 110;
    const photoX = (leftWidth - photoSize) / 2;
    const photoY = margin;

    doc.save();
    doc.roundedRect(photoX, photoY, photoSize, photoSize, 15).clip();
    const photoSource = pInfo.profilePhoto || data.photo;
    if (photoSource) {
        try {
            const photoBuffer = typeof base64ToBuffer === 'function' ? base64ToBuffer(photoSource) : photoSource;
            if (photoBuffer) {
                doc.image(photoBuffer, photoX, photoY, { width: photoSize, height: photoSize });
            } else {
                doc.rect(photoX, photoY, photoSize, photoSize).fill('#222222');
            }
        } catch (e) {
            doc.rect(photoX, photoY, photoSize, photoSize).fill('#222222');
        }
    } else {
        doc.rect(photoX, photoY, photoSize, photoSize).fill('#222222');
    }
    doc.restore();

    // --- LEFT SIDEBAR CONTENT ---
    let sideY = photoY + photoSize + 40;
    const sideX = 25;
    const sideContentWidth = leftWidth - 50;

    // Contact Section
    doc.fillColor(colors.accent).font('Helvetica-Bold').fontSize(11).text("CONTACT", sideX, sideY, { characterSpacing: 1.5 });
    doc.moveTo(sideX, sideY + 14).lineTo(sideX + 30, sideY + 14).strokeColor(colors.accent).lineWidth(2).stroke();
    sideY += 30;

    const contactFields = [
        { val: pInfo.phone || (data.contact && data.contact.phone), icon: 'P' },
        { val: pInfo.email || (data.contact && data.contact.email), icon: 'E' },
        { val: pInfo.address || (data.contact && data.contact.address), icon: 'A' },
        { val: pInfo.linkedin || (data.contact && data.contact.linkedin), icon: 'L' }
    ].filter(f => f.val);

    contactFields.forEach(f => {
        doc.fillColor(colors.highlight).font('Helvetica-Bold').fontSize(7.5).text(f.icon, sideX, sideY + 1.5);
        doc.fillColor(colors.text).font('Helvetica').fontSize(8.5).text(f.val, sideX + 18, sideY, { width: sideContentWidth - 10 });
        sideY = doc.y + 12;
    });

    // Sidebar Items Helper (Skills / Languages)
    function renderSidebarList(title, items) {
        if (!items || items.length === 0) return;
        sideY += 20;
        const count = items.length;
        const fontSize = count > 15 ? 7.5 : (count > 10 ? 8.5 : 9.5);
        const itemSpacing = count > 15 ? 18 : (count > 10 ? 22 : 28);

        doc.fillColor(colors.accent).font('Helvetica-Bold').fontSize(11).text(title.toUpperCase(), sideX, sideY, { characterSpacing: 1.5 });
        doc.moveTo(sideX, sideY + 14).lineTo(sideX + 30, sideY + 14).strokeColor(colors.accent).lineWidth(2).stroke();
        sideY += 30;

        items.forEach(item => {
            if (sideY > pageHeight - 30) return;

            const raw = typeof item === 'string' ? item : (item.name || item.skill || '');
            const name = String(raw).replace(/^[^a-zA-Z0-9]+/, '').trim();
            if (!name) return;
            const level = (typeof item === 'object' && item.level) ? parseInt(item.level) : (75 + Math.floor(Math.random() * 20));

            doc.fillColor(colors.text).font('Helvetica').fontSize(fontSize);
            const textWidth = sideContentWidth;
            const textHeight = doc.heightOfString(name, { width: textWidth });
            doc.text(name, sideX, sideY, { width: textWidth });

            // Compact Progress Bar
            const barY = sideY + textHeight + 2;
            doc.rect(sideX, barY, textWidth, 2).fill('#222222');
            doc.rect(sideX, barY, textWidth * (level / 100), 2).fill(colors.accent);

            sideY = barY + (itemSpacing - 10);
        });
    }

    renderSidebarList("SKILLS", normalized.skills);
    if (sideY < pageHeight - 150) renderSidebarList("LANGUAGES", normalized.languages);

    // --- MAIN CONTENT AREA (RIGHT) ---
    const mainX = leftWidth + 30;
    const mainWidth = pageWidth - mainX - margin;
    let mainY = margin;

    // Name & Title Header
    const fullName = (pInfo.fullName || data.name || 'Professional Name').toUpperCase();
    doc.fillColor(colors.text).font('Times-Bold').fontSize(34).text(fullName, mainX, mainY, { width: mainWidth });
    mainY = doc.y + 2;

    const roleTitle = (pInfo.roleTitle || data.title || 'Professional Title');
    doc.fillColor(colors.accent).font('Helvetica-Bold').fontSize(14).text(roleTitle, mainX, mainY, { characterSpacing: 1 });
    mainY = doc.y + 15;

    // Professional Summary (Elegant Box)
    const summary = normalized.summary || data.summary || '';
    if (summary) {
        doc.fillColor(colors.dim).font('Helvetica').fontSize(9.5).text(summary, mainX, mainY, { width: mainWidth, lineGap: 3, align: 'justify' });
        mainY = doc.y + 30;
    }

    // Main Sections Helper
    function renderSection(title, items, type) {
        if (!items || items.length === 0) return;

        // Section Title with Modern Underline
        doc.fillColor(colors.text).font('Helvetica-Bold').fontSize(13).text(title.toUpperCase(), mainX, mainY, { characterSpacing: 1 });
        doc.rect(mainX, mainY + 15, 40, 3).fill(colors.accent);
        mainY += 35;

        items.forEach((item, idx) => {
            const heading = item.jobTitle || item.degree || item.title || '';
            const subHeading = item.company || item.school || item.institution || '';
            const date = item.years || (item.startDate ? `${item.startDate} - ${item.endDate || 'Present'}` : item.gradYear) || '';
            const details = item.description || item.tech || '';
            const bullets = Array.isArray(item.bullets) ? item.bullets : (details ? details.split('\n').filter(s => s.trim()) : []);

            // Check if item fits on page
            if (mainY > pageHeight - 100) {
                doc.addPage().rect(0, 0, pageWidth, pageHeight).fill(colors.bg);
                doc.rect(0, 0, leftWidth, pageHeight).fill(colors.sidebar);
                mainY = margin;
            }

            // Left side Date Column
            doc.fillColor(colors.highlight).font('Helvetica-Bold').fontSize(8.5).text(date.toUpperCase(), mainX, mainY, { width: 85 });

            // Content
            const contentX = mainX + 95;
            const contentWidth = mainWidth - 95;

            doc.fillColor(colors.text).font('Helvetica-Bold').fontSize(11).text(heading, contentX, mainY, { width: contentWidth });
            doc.fillColor(colors.accent).font('Helvetica').fontSize(10).text(subHeading, contentX, doc.y + 2, { width: contentWidth });

            mainY = doc.y + 8;

            bullets.forEach(b => {
                doc.fillColor(colors.dim).font('Helvetica').fontSize(9).text('•', contentX, mainY);
                doc.text(b.trim(), contentX + 10, mainY, { width: contentWidth - 10, lineGap: 2 });
                mainY = doc.y + 4;
            });

            mainY += 15;

            // Separator between items
            if (idx < items.length - 1) {
                doc.moveTo(mainX + 95, mainY - 5).lineTo(mainX + mainWidth, mainY - 5).strokeColor('#222222').lineWidth(0.5).stroke();
            }
        });
        mainY += 20;
    }

    renderSection("Work Experience", normalized.experience);
    renderSection("Education", normalized.education);
    if (normalized.projects && normalized.projects.length > 0) {
        renderSection("Selected Projects", normalized.projects);
    }

    // Certifications (Distinct Heading)
    if (normalized.certifications && normalized.certifications.length > 0) {
        doc.fillColor(colors.text).font('Helvetica-Bold').fontSize(13).text("CERTIFICATIONS", mainX, mainY, { characterSpacing: 1 });
        doc.rect(mainX, mainY + 15, 40, 3).fill(colors.accent);
        mainY += 35;

        normalized.certifications.forEach(cert => {
            const raw = typeof cert === 'object' ? (cert.name || cert.title) : cert;
            if (!raw) return;
            const text = raw.replace(/^[^a-zA-Z0-9]+/, '').trim();
            if (!text) return;

            doc.fillColor(colors.accent).circle(mainX + 4, mainY + 6, 2.5).fill();
            doc.fillColor(colors.text).font('Helvetica').fontSize(9.5).text(text, mainX + 15, mainY, { width: mainWidth - 20 });
            mainY = doc.y + 8;
        });
        mainY += 15;
    }

    // Achievements / Awards
    if (normalized.achievements && normalized.achievements.length > 0) {
        doc.fillColor(colors.text).font('Helvetica-Bold').fontSize(13).text("ACHIEVEMENTS", mainX, mainY, { characterSpacing: 1 });
        doc.rect(mainX, mainY + 15, 40, 3).fill(colors.accent);
        mainY += 35;

        normalized.achievements.forEach(item => {
            const raw = typeof item === 'object' ? (item.name || item.title) : item;
            if (!raw) return;
            const text = raw.replace(/^[^a-zA-Z0-9]+/, '').trim();
            if (!text || text.includes('%')) return;

            doc.fillColor(colors.accent).rect(mainX + 1, mainY + 3, 5, 5).fill();
            doc.fillColor(colors.text).font('Helvetica').fontSize(9.5).text(text, mainX + 15, mainY, { width: mainWidth - 20 });
            mainY = doc.y + 8;
        });
    }
}

/**
 * 🎨 HIERO VERTEX TEMPLATE
 * Minimalist header, two-column layout with dark right sidebar.
 */
function renderTemplate_HieroVertex(doc, data) {
    const pageWidth = 595.28;
    const pageHeight = 841.89;

    // Normalize data
    const normalized = typeof normalizeData === 'function' ? normalizeData(data) : data;
    const pInfo = normalized.personalInfo || {};

    const colors = {
        bgTop: '#F8FAFC',       // Slate 50 header
        bgLeft: '#FFFFFF',      // White left column
        bgRight: '#0F172A',     // Slate 900
        textDark: '#0F172A',    // Very dark text for left
        textLight: '#F8FAFC',   // White-ish text for right
        accentLine: '#94A3B8',  // Slate 400 for dividers
        whiteLine: '#CBD5E1',   // Slate 300 for right dividers
        boxBg: '#E2E8F0'        // Date box background Slate 200
    };

    // Draw Backgrounds
    doc.rect(0, 0, pageWidth, 150).fill(colors.bgTop);
    doc.rect(0, 150, 360, pageHeight - 150).fill(colors.bgLeft);
    doc.rect(360, 150, pageWidth - 360, pageHeight - 150).fill(colors.bgRight);

    // --- HEADER CONTENT ---
    let headerY = 35;

    // Name
    const fullName = (pInfo.fullName || data.name || 'LOTHER SMITH').toUpperCase();
    doc.fillColor(colors.textDark).font('Helvetica-Bold').fontSize(32).text(fullName, 0, headerY, { align: 'center', width: pageWidth, characterSpacing: 2 });

    // Title
    headerY += 40;
    const roleTitle = (pInfo.roleTitle || data.title || 'DESIGNER & DEVELOPER').toUpperCase();
    doc.fillColor(colors.textDark).font('Helvetica').fontSize(12).text(roleTitle, 0, headerY, { align: 'center', width: pageWidth, characterSpacing: 4 });

    // Contact Info Box
    headerY += 25;
    const boxX = 35;
    const boxY = headerY;
    const boxWidth = pageWidth - 70;
    const boxHeight = 40;

    doc.lineWidth(1).strokeColor(colors.accentLine);
    doc.rect(boxX, boxY, boxWidth, boxHeight).stroke();

    const cw = boxWidth / 3;

    // Inner vertical separators
    doc.moveTo(boxX + cw, boxY + 10).lineTo(boxX + cw, boxY + boxHeight - 10).stroke();
    doc.moveTo(boxX + 2 * cw, boxY + 10).lineTo(boxX + 2 * cw, boxY + boxHeight - 10).stroke();

    doc.fillColor(colors.textDark).font('Helvetica').fontSize(9);
    let iconY = boxY + 7;
    let textY = boxY + 25;

    // Draw Custom Primitive Icons to avoid scale matrix font corruption
    function drawPhone(px, py) {
        doc.lineWidth(1).strokeColor(colors.textDark);
        doc.rect(px + 2, py, 7, 12).stroke(); // Phone body
        doc.moveTo(px + 4, py + 2).lineTo(px + 7, py + 2).stroke(); // Speaker
        doc.circle(px + 5.5, py + 10, 0.5).fill(colors.textDark); // Button
    }

    function drawEnvelope(px, py) {
        doc.lineWidth(1).strokeColor(colors.textDark);
        doc.rect(px, py + 2, 12, 8).stroke();
        doc.moveTo(px, py + 2).lineTo(px + 6, py + 6).lineTo(px + 12, py + 2).stroke();
    }

    function drawMarker(px, py) {
        doc.lineWidth(1).strokeColor(colors.textDark);
        doc.path(`M ${px + 6} ${py + 11} C ${px + 6} ${py + 11} ${px + 2} ${py + 6} ${px + 2} ${py + 4} A 4 4 0 0 1 ${px + 10} ${py + 4} C ${px + 10} ${py + 6} ${px + 6} ${py + 11} ${px + 6} ${py + 11} Z`).stroke();
        doc.circle(px + 6, py + 4, 1.5).stroke();
    }

    // Left Column: Phone
    drawPhone(boxX + (cw / 2) - 5, iconY);
    doc.text(pInfo.phone || '+(000) 6666 6666', boxX, textY, { width: cw, align: 'center' });

    // Middle Column: Email
    drawEnvelope(boxX + cw + (cw / 2) - 6, iconY);
    doc.text(pInfo.email || 'yourname@gmail.com', boxX + cw, textY, { width: cw, align: 'center' });

    // Right Column: Location
    const locArr = [];
    if (pInfo.address) locArr.push(pInfo.address);
    if (locArr.length === 0) locArr.push("Washington, USA");
    const locText = locArr.join(', ').substring(0, 35);

    drawMarker(boxX + (cw * 2) + (cw / 2) - 6, iconY - 1);
    doc.text(locText, boxX + 2 * cw, textY, { width: cw, align: 'center' });

    // --- LEFT COLUMN CONTENT ---
    let leftY = 180;
    const leftX = 35;
    const leftW = 290;
    const maxPageY = pageHeight - 30; // Strict boundary constraint

    function renderLeftSectionHeader(title) {
        if (leftY > maxPageY - 40) return false;
        doc.fillColor(colors.textDark).font('Helvetica-Bold').fontSize(12).text(title.toUpperCase(), leftX, leftY, { characterSpacing: 2 });
        leftY += 18;
        doc.moveTo(leftX, leftY).lineTo(leftX + leftW, leftY).lineWidth(1).strokeColor(colors.accentLine).stroke();
        leftY += 15;
        return true;
    }

    const summary = normalized.summary || data.summary || '';
    if (summary) {
        if (renderLeftSectionHeader('STATEMENT')) {
            doc.fillColor(colors.textDark).font('Helvetica').fontSize(9.5).text(summary, leftX, leftY, { width: leftW, align: 'justify', lineGap: 3 });
            leftY = doc.y + 25;
        }
    }

    if (normalized.experience && normalized.experience.length > 0) {
        if (renderLeftSectionHeader('EXPERIENCE')) {
            for (const exp of normalized.experience) {
                if (leftY > maxPageY - 50) break; // Strict one-page cutoff

                const dateStr = exp.years || (exp.startDate ? `${exp.startDate}-${exp.endDate || 'Present'}` : '2011-2012');
                const title = (exp.jobTitle || 'POSITION TITLE HERE').toUpperCase();
                const compLoc = [exp.company || 'Company Name', exp.location || 'Location Text Here'].filter(Boolean).join('/');
                const desc = exp.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus vulputate libero sit amet dolor sit amet.';

                doc.rect(leftX, leftY, 78, 16).fill(colors.boxBg);
                doc.fillColor(colors.textDark).font('Helvetica').fontSize(8.5).text(dateStr, leftX, leftY + 4, { width: 78, align: 'center' });

                const titleH = doc.font('Helvetica-Bold').fontSize(10).heightOfString(title, { width: leftW - 88 });
                doc.text(title, leftX + 88, leftY, { width: leftW - 88 });

                const compLocH = doc.font('Helvetica').fontSize(9).heightOfString(compLoc, { width: leftW - 88 });
                doc.text(compLoc, leftX + 88, leftY + titleH + 2, { width: leftW - 88 });

                leftY += Math.max(26, titleH + compLocH + 10);

                doc.font('Helvetica').fontSize(9.5).text(desc, leftX, leftY, { width: leftW, align: 'justify', lineGap: 3 });
                leftY = doc.y + 20;
            }
            leftY += 5;
        }
    }

    if (normalized.references && normalized.references.length > 0) {
        if (leftY < maxPageY - 60 && renderLeftSectionHeader('REFERENCE')) {
            let rx = leftX;
            let ry = leftY;
            const refW = (leftW - 30) / 2;

            const refsToRender = Math.min(2, normalized.references.length);
            for (let idx = 0; idx < refsToRender; idx++) {
                const ref = normalized.references[idx];
                if (idx === 1) {
                    doc.moveTo(leftX + refW + 10, ry + 5).lineTo(leftX + refW + 10, ry + 40).lineWidth(1).strokeColor(colors.accentLine).stroke();
                    doc.moveTo(leftX + refW + 14, ry + 5).lineTo(leftX + refW + 14, ry + 40).stroke();
                    rx = leftX + refW + 24;
                }

                doc.fillColor(colors.textDark).font('Helvetica-Bold').fontSize(10).text((ref.name || 'MD. Alix Markin').toUpperCase(), rx, ry, { width: refW - 24 });
                const nameH = doc.heightOfString((ref.name || 'MD. Alix Markin').toUpperCase(), { width: refW - 24 });

                doc.font('Helvetica').fontSize(9).text(ref.title || 'Graphic Designer & Developer', rx, ry + nameH + 2, { width: refW - 24 });
                const titleH = doc.heightOfString(ref.title || 'Graphic Designer & Developer', { width: refW - 24 });

                doc.font('Helvetica-Bold').text(`T : `, rx, ry + nameH + titleH + 6, { continued: true }).font('Helvetica').text(ref.phone || '+(000) 8888 6666');
                doc.font('Helvetica-Bold').text(`E : `, rx, ry + nameH + titleH + 18, { continued: true }).font('Helvetica').text(ref.email || 'alixmarkin@mail.com', { width: refW - 24 });
            }
        }
    }

    // --- RIGHT COLUMN CONTENT ---
    let rightY = 180;
    const rightX = 390;
    const rightW = 175;

    function renderRightSectionHeader(title) {
        if (rightY > maxPageY - 40) return false;
        doc.fillColor(colors.whiteLine).font('Helvetica-Bold').fontSize(12).text(title.toUpperCase(), rightX, rightY, { characterSpacing: 2 });
        rightY += 18;
        doc.moveTo(rightX, rightY).lineTo(rightX + rightW, rightY).lineWidth(1).strokeColor(colors.whiteLine).stroke();
        rightY += 15;
        return true;
    }

    if (normalized.education && normalized.education.length > 0) {
        if (renderRightSectionHeader('EDUCATION')) {
            for (const edu of normalized.education) {
                if (rightY > maxPageY - 45) break; // Strict clip

                const title = (edu.degree || 'Master In Computer Tecno');
                const inst = [edu.school || 'University Name', edu.location].filter(Boolean).join('/');
                const dateStr = edu.gradYear || '2010-2013';

                const titleH = doc.font('Helvetica-Bold').fontSize(10).heightOfString(title, { width: rightW });
                doc.fillColor(colors.whiteLine).text(title, rightX, rightY, { width: rightW });

                const instH = doc.font('Helvetica').fontSize(9).heightOfString(inst, { width: rightW });
                doc.fillColor('#B0B0B0').text(inst, rightX, rightY + titleH + 2, { width: rightW });

                doc.text(dateStr, rightX, rightY + titleH + instH + 4, { width: rightW });
                rightY += titleH + instH + 20;
            }
            rightY += 5;
        }
    }

    let interestsRaw = normalized.hobbies || data.hobbies || data.interests;
    if (!interestsRaw || interestsRaw.length === 0) interestsRaw = 'Traveling, Playing, Swimming, Watching';

    if (interestsRaw) {
        if (renderRightSectionHeader('INTERESTS')) {
            const items = typeof interestsRaw === 'string' ? interestsRaw.split(/[,|]/).map(s => s.trim()).filter(Boolean) : (Array.isArray(interestsRaw) ? interestsRaw : []);

            doc.fillColor('#B0B0B0').font('Helvetica').fontSize(9.5);
            let ix = rightX;
            let iy = rightY;
            items.slice(0, 6).forEach((item, idx) => {
                if (iy > maxPageY - 20) return; // Strict clip

                const itemH = doc.heightOfString(item, { width: 80 });
                doc.text(item, ix, iy, { width: 80 });

                if (idx % 2 === 0) {
                    ix += 90;
                } else {
                    ix = rightX;
                    iy += Math.max(18, itemH + 6);
                }
            });
            rightY = (ix === rightX) ? iy : iy + 18;
            rightY += 20;
        }
    }

    function renderSkillsBars(title, skillsArray, defaultSkills) {
        const items = (skillsArray && skillsArray.length > 0) ? skillsArray : defaultSkills;
        if (!items || items.length === 0) return;
        if (!renderRightSectionHeader(title)) return;

        items.slice(0, 5).forEach(skill => {
            if (rightY > maxPageY - 20) return; // Strict clip

            const name = typeof skill === 'string' ? skill : (skill.name || skill.skill || 'Skill');
            const level = (typeof skill === 'object' && skill.level) ? parseInt(skill.level) : (75 + Math.floor(Math.random() * 20));

            const nameH = doc.font('Helvetica').fontSize(9.5).heightOfString(name, { width: 75 });
            doc.fillColor('#B0B0B0').text(name, rightX, rightY, { width: 75 });

            doc.rect(rightX + 80, rightY + 2, rightW - 80, 7).lineWidth(1).strokeColor(colors.whiteLine).stroke();
            doc.rect(rightX + 80, rightY + 2, (rightW - 80) * (level / 100), 7).fill(colors.whiteLine);

            rightY += Math.max(22, nameH + 8);
        });
        rightY += 15;
    }

    const techSkills = normalized.skills || data.skills || [];
    renderSkillsBars('PRO SKILLS', techSkills, ['Photoshop', 'Illustrator', 'Indesign', 'Ms Word', 'Powerpoint']);

    // Some data mappings map softSkills differently, so grab generic array
    let softArray = [];
    if (data.softSkills && Array.isArray(data.softSkills)) softArray = data.softSkills;
    else if (typeof data.softSkills === 'string') softArray = data.softSkills.split(',').map(s => s.trim()).filter(Boolean);

    renderSkillsBars('PER SKILLS', softArray, ['Creative', 'Teamwork', 'Punctual', 'Leadership']);
}

module.exports = { generateUnifiedResume };
