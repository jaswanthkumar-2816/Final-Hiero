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
        primary: '#1a1a1a',
        secondary: '#4a4a4a',
        accent: '#10b981',       // Emerald accent for Studio
        background: '#FFFFFF',
        light: '#f3f4f6'
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
    }
};

// Map template IDs to their internal keys
const TEMPLATE_MAP = {
    'template4': 'template-4',
    'template-4': 'template-4',
    'hiero-studio': 'hiero-studio'
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
    return new Promise((resolve, reject) => {
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
                case 'hiero-studio':
                case 'hiero-onyx':
                case 'hiero-executive': renderHeader_Executive(doc, data, colors); break;
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
            if (data.projects && data.projects.length > 0) {
                checkPageBreak(doc, 100);
                renderSectionTitle(doc, 'Projects', colors, normalizedTemplate);
                data.projects.forEach((proj, index) => {
                    checkPageBreak(doc, 80);
                    doc.fontSize(FONT_SIZES.jobTitle).fillColor(colors.primary).font(isAcademicSplit ? 'Times-Bold' : 'Helvetica-Bold').text(proj.name || proj.title || '');
                    doc.fontSize(FONT_SIZES.body).fillColor(colors.secondary).font(isAcademicSplit ? 'Times-Roman' : 'Helvetica').text(proj.description || '', { width: maxWidth });
                    if (index < data.projects.length - 1) doc.moveDown(spacing.itemGap / 10);
                });
                doc.moveDown(spacing.sectionGap / 10);
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

module.exports = { generateUnifiedResume };
