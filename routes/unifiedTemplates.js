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
        primary: '#1F2A36',      // Dark Navy
        secondary: '#F2B66D',    // Orange
        accent: '#F2B66D',       // Orange
        background: '#FFFFFF',
        light: '#EEEEEE'
    }
};

// Map template IDs to their internal keys
const TEMPLATE_MAP = {
    'template-4': 'template-4',
    'hiero-studio': 'hiero-studio',
    'hiero-monethon': 'hiero-monethon',
    'monethon': 'hiero-monethon',
    'hiero monethon': 'hiero-monethon',
    'hiero-nova': 'hiero-nova',
    'nova': 'hiero-nova',
    'hiero-legion': 'hiero-nova',
    'legion': 'hiero-nova'
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
                case 'hiero-executive': renderHeader_Executive(doc, data, colors); break;
                case 'template-4': renderHeader_Academic(doc, data, colors); break;
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
                    renderTemplate_HieroNova(doc, data, options);
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

function renderTemplate_HieroNova(doc, originalData, options = {}) {
    const COLORS = {
        black: '#111111',
        darkGray: '#2B2B2B',
        lightGray: '#EFEFEF',
        textGray: '#555555',
        white: '#FFFFFF'
    };

    const MARGIN = 40;
    const LEFT_WIDTH = 175;
    const RIGHT_X = 240;
    const PAGE_WIDTH = 595.28;
    const PAGE_HEIGHT = 841.89;
    const RIGHT_WIDTH = PAGE_WIDTH - RIGHT_X - MARGIN;
    const CENTER_L = MARGIN + (LEFT_WIDTH / 2);

    const forceSinglePage = options.forceSinglePage === true; // Only if explicitly requested


    // CRITICAL: Override doc.addPage for single-page constraint if requested
    const _originalAddPage = doc.addPage.bind(doc);
    const _protoAddPage = doc.constructor.prototype.addPage;
    const noOpAddPage = function () { return doc; };

    if (forceSinglePage) {
        doc.addPage = noOpAddPage;
        doc.constructor.prototype.addPage = noOpAddPage;
    }


    const toArray = (v) => {
        if (Array.isArray(v)) return v;
        if (typeof v === 'string') return v.split(/[\n,;]/).map(s => s.trim()).filter(Boolean);
        return [];
    };

    const data = {
        name: originalData.name || originalData.fullName || originalData.personalInfo?.fullName || originalData.basics?.name || originalData.full_name || "Your Name",
        title: originalData.title || originalData.jobTitle || originalData.headline || originalData.personalInfo?.headline || originalData.basics?.label || (originalData.experience && originalData.experience[0] && (originalData.experience[0].jobTitle || originalData.experience[0].role)) || "Professional Title",
        summary: originalData.summary || originalData.description || originalData.personalInfo?.summary || originalData.basics?.summary || originalData.profile || "",
        contact: {
            address: originalData.address || originalData.location || originalData.personalInfo?.address || originalData.basics?.location?.address || originalData.basics?.location?.city || "",
            phone: originalData.phone || originalData.contactNumber || originalData.personalInfo?.phone || originalData.basics?.phone || "",
            email: originalData.email || originalData.emailAddress || originalData.personalInfo?.email || originalData.basics?.email || ""
        },
        expertise: toArray(originalData.skills || originalData.technicalSkills || originalData.skillSet || originalData.expertise || originalData.keywords || originalData.skill_list || []),
        experience: (originalData.experience || originalData.work || originalData.workHistory || originalData.work_experience || originalData.jobHistory || [])
            .concat(originalData.internships || originalData.volunteer || originalData.volunteering || [])
            .map(exp => ({
                role: exp.role || exp.jobTitle || exp.position || exp.title || "",
                company: exp.company || exp.employer || exp.organization || exp.org || "",
                years: exp.years || exp.duration || exp.dateRange || (exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : (exp.startDate || exp.date || "")),
                bullets: toArray(exp.bullets || exp.description || exp.responsibilities || exp.highlights || exp.summary || [])
            })),
        education: (originalData.education || originalData.academic || originalData.studies || originalData.education_history || originalData.academic_background || []).map(edu => ({
            degree: edu.degree || edu.qualification || edu.area || edu.studyType || "",
            institute: edu.institute || edu.school || edu.university || edu.college || edu.institution || "",
            years: edu.years || edu.gradYear || edu.duration || edu.date || (edu.startDate && edu.endDate ? `${edu.startDate} - ${edu.endDate}` : (edu.startDate || "")),
            description: edu.description || edu.courses || edu.major || ""
        })),
        projects: (Array.isArray(originalData.projects) ? originalData.projects : (originalData.projs || originalData.projectHistory || [])).map(proj => ({
            name: proj.name || proj.title || proj.projectName || "",
            technologies: proj.technologies || proj.tech || proj.keywords || proj.tools || "",
            years: proj.duration || proj.date || proj.years || "",
            description: proj.description || proj.summary || proj.details || ""
        })),
        awards: (originalData.awards || originalData.achievements || originalData.certifications || originalData.honors || []).map(aw => typeof aw === 'string' ? { title: aw } : {
            title: aw.title || aw.name || "",
            issuer: aw.issuer || aw.organization || aw.company || aw.authority || "",
            year: aw.year || aw.date || ""
        }),
        references: (originalData.references || originalData.recommenders || []).map(ref => ({
            name: ref.name || ref.fullName || "",
            role: ref.role || ref.title || ref.position || ref.relationship || "",
            phone: ref.phone || ref.contact || "",
            email: ref.email || ""
        }))
    };



    // Draw Subtle Page Background to avoid "whitish" feel
    doc.save();
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fillColor('#FBFAFB').fill();
    doc.restore();

    // --- LEFT COLUMN (Vertical Badge) ---

    // Shield Shape for Photo (Legion Rebranding)
    const hX = CENTER_L;
    const hY = 110;
    const hR = 60;

    const drawShield = (pathDoc) => {
        pathDoc.moveTo(hX, hY - hR)
            .quadraticCurveTo(hX + 55, hY - hR, hX + 55, hY - 10)
            .lineTo(hX + 55, hY + 20)
            .quadraticCurveTo(hX + 55, hY + 50, hX, hY + hR + 5)
            .quadraticCurveTo(hX - 55, hY + 50, hX - 55, hY + 20)
            .lineTo(hX - 55, hY - 10)
            .quadraticCurveTo(hX - 55, hY - hR, hX, hY - hR)
            .closePath();
    };

    // Draw Placeholder Background
    doc.save();
    drawShield(doc);
    doc.fillColor(COLORS.lightGray).fill();

    // Render Actual Photo if available
    const photo = originalData.personalInfo?.profilePhoto || originalData.photo;
    if (photo) {
        try {
            doc.save();
            drawShield(doc);
            doc.clip();


            let imgData = photo;
            if (typeof imgData === 'string' && imgData.includes(';base64,')) {
                imgData = Buffer.from(imgData.split(';base64,')[1], 'base64');
            }

            doc.image(imgData, hX - 60, hY - 60, {
                fit: [120, 120],
                align: 'center',
                valign: 'center'
            });
            doc.restore();
        } catch (e) {
            console.error("Hiero Nova Photo Error:", e);
        }
    }
    doc.restore();

    // Vertical Badge Background
    const bTop = 180;
    const bHeight = 310;
    doc.save();
    doc.moveTo(MARGIN, bTop + 35)
        .lineTo(CENTER_L, bTop)
        .lineTo(MARGIN + LEFT_WIDTH, bTop + 35)
        .lineTo(MARGIN + LEFT_WIDTH, bTop + bHeight - 40)
        .lineTo(CENTER_L, bTop + bHeight)
        .lineTo(MARGIN, bTop + bHeight - 40)
        .closePath()
        .fillColor(COLORS.black)
        .fill();

    // Name & Title in Badge
    // Name & Title in Badge
    const nameStr = (data.name || "YOUR NAME").toUpperCase();
    const nameParts = nameStr.split(/\s+/).filter(Boolean);

    // Dynamic Name Handling to prevent overlap
    let fontSize = 23;
    if (nameStr.length > 20) fontSize = 20;
    if (nameStr.length > 30) fontSize = 17;

    doc.fillColor(COLORS.white).font('Times-Bold').fontSize(fontSize);

    let curY = bTop + 55;
    const badgeContentWidth = LEFT_WIDTH - 10;
    const badgeX = MARGIN + 5;

    nameParts.forEach(p => {
        // If a single word is too wide, shrink it further
        let pSize = fontSize;
        while (doc.widthOfString(p, { size: pSize }) > badgeContentWidth && pSize > 12) {
            pSize -= 1;
        }

        doc.fontSize(pSize).text(p, badgeX, curY, {
            width: badgeContentWidth,
            align: 'center',
            lineGap: 0
        });
        curY = doc.y + 2; // Real text height tracking
    });

    curY += 10;
    doc.fontSize(10).font('Helvetica').text((data.title || '').toUpperCase(), MARGIN, curY, { width: LEFT_WIDTH, align: 'center' });
    curY = doc.y + 25;


    doc.moveTo(CENTER_L - 30, curY).lineTo(CENTER_L + 30, curY).strokeColor(COLORS.white).lineWidth(0.5).stroke();
    curY += 15;

    doc.fontSize(8).font('Helvetica').lineGap(2).text(data.summary || '', MARGIN + 15, curY, {
        width: LEFT_WIDTH - 30,
        align: 'center',
        height: bTop + bHeight - curY - 50,
        ellipsis: true
    });
    doc.restore();

    // Contact Section
    let leftY = bTop + bHeight + 10;
    const drawLeftHeader = (label) => {
        doc.fillColor(COLORS.black).font('Times-Bold').fontSize(12).text(label, MARGIN, leftY);
        leftY += 16;
        doc.moveTo(MARGIN, leftY).lineTo(MARGIN + 35, leftY).strokeColor(COLORS.black).lineWidth(1.2).stroke();
        leftY += 10;
    };


    drawLeftHeader('CONTACT');
    const contactLinks = [
        { val: data.contact?.address },
        { val: data.contact?.phone },
        { val: data.contact?.email }
    ];
    contactLinks.forEach(item => {
        if (item.val) {
            doc.circle(MARGIN + 4, leftY + 4, 2.5).fillColor(COLORS.black).fill();
            doc.fillColor(COLORS.textGray).font('Helvetica').fontSize(8.5).text(item.val, MARGIN + 15, leftY, { width: LEFT_WIDTH - 15 });
            leftY += 16;
        }
    });

    // Expertise Section
    leftY += 10;
    drawLeftHeader('EXPERTISE');
    (data.expertise || []).forEach(sk => {
        doc.fillColor(COLORS.textGray).font('Helvetica').fontSize(8.5).text('• ' + sk, MARGIN, leftY);
        leftY += 13;
    });

    // Awards Section
    if (data.awards.length > 0) {
        leftY += 10;
        drawLeftHeader('AWARD');
        data.awards.forEach(aw => {
            doc.fillColor(COLORS.black).font('Times-Bold').fontSize(9).text((aw.title || '').toUpperCase(), MARGIN, leftY, { width: LEFT_WIDTH, ellipsis: true });
            leftY = doc.y + 1;
            doc.fillColor(COLORS.textGray).font('Helvetica').fontSize(8).text(aw.issuer || '', MARGIN, leftY, { width: LEFT_WIDTH, height: 10, ellipsis: true });
            leftY = doc.y + 10;
        });
    }




    // --- RIGHT COLUMN (WHITE) ---
    let rightY = 40;

    const checkBreak = (h) => {
        if (!forceSinglePage && rightY + h > PAGE_HEIGHT - MARGIN) {
            doc.addPage();
            rightY = MARGIN;
        }
    };

    const drawRightHeader = (label) => {
        checkBreak(35);
        doc.fillColor(COLORS.black).font('Times-Bold').fontSize(14).text(label.toUpperCase(), RIGHT_X, rightY);
        rightY += 18;
        doc.moveTo(RIGHT_X, rightY).lineTo(RIGHT_X + 60, rightY).strokeColor(COLORS.black).lineWidth(2).stroke();
        rightY += 15;
    };


    // Experience
    if (data.experience.length > 0) {
        drawRightHeader('WORK EXPERIENCE');
        data.experience.forEach((exp, idx) => {
            checkBreak(60);

            doc.fillColor(COLORS.black).font('Times-Bold').fontSize(11).text((exp.role || '').toUpperCase(), RIGHT_X, rightY, { width: RIGHT_WIDTH - 80 });

            doc.fillColor(COLORS.textGray).font('Helvetica').fontSize(9).text(exp.years || '', RIGHT_X, rightY, { width: RIGHT_WIDTH, align: 'right' });
            rightY = doc.y + 2;
            doc.fillColor(COLORS.textGray).font('Helvetica').fontSize(9.5).text(exp.company || '', RIGHT_X, rightY);
            rightY = doc.y + 6;

            exp.bullets.forEach(b => {
                const bText = '• ' + b;
                const bH = doc.heightOfString(bText, { width: RIGHT_WIDTH - 10, fontSize: 9 });
                checkBreak(bH + 2);
                doc.font('Helvetica').fontSize(9).fillColor(COLORS.textGray).text(bText, RIGHT_X + 10, rightY, { width: RIGHT_WIDTH - 10, lineGap: 1 });
                rightY = doc.y + 3;
            });
            rightY += 10;
        });
    }


    // Projects
    if (data.projects && data.projects.length > 0) {
        rightY += 10;
        drawRightHeader('PROJECTS');
        data.projects.forEach(proj => {
            checkBreak(50);
            doc.fillColor(COLORS.black).font('Times-Bold').fontSize(10.5).text((proj.name || proj.title || '').toUpperCase(), RIGHT_X, rightY, { width: RIGHT_WIDTH - 80 });
            if (proj.years) doc.fillColor(COLORS.textGray).font('Helvetica').fontSize(8.5).text(proj.years, RIGHT_X, rightY, { width: RIGHT_WIDTH, align: 'right' });
            rightY = doc.y + 2;

            doc.fillColor(COLORS.textGray).font('Helvetica').fontSize(9).text(proj.description || '', RIGHT_X, rightY, { width: RIGHT_WIDTH, lineGap: 1 });
            rightY = doc.y + 12;
        });
    }


    // Education
    if (data.education.length > 0) {
        rightY += 10;
        drawRightHeader('EDUCATION');
        data.education.forEach(edu => {
            checkBreak(50);
            doc.rect(RIGHT_X - 5, rightY - 5, RIGHT_WIDTH + 10, 42).fillColor(COLORS.lightGray).fill();
            doc.fillColor(COLORS.black).font('Times-Bold').fontSize(10.5).text(edu.degree || '', RIGHT_X, rightY, { width: RIGHT_WIDTH - 60 });
            doc.fillColor(COLORS.textGray).font('Helvetica').fontSize(9).text(edu.years || '', RIGHT_X, rightY, { width: RIGHT_WIDTH - 5, align: 'right' });
            rightY = doc.y + 2;

            doc.fillColor(COLORS.darkGray).font('Helvetica').fontSize(9).text(edu.institute || '', RIGHT_X, rightY);
            rightY = doc.y + 15;
        });
    }


    // References
    if (data.references.length > 0) {
        rightY += 15;
        drawRightHeader('REFERENCES');
        const refW = RIGHT_WIDTH / 2;
        data.references.slice(0, 2).forEach((ref, i) => {
            const rx = RIGHT_X + (i * refW);
            let ry = rightY;
            doc.fillColor(COLORS.black).font('Times-Bold').fontSize(10).text(ref.name || '', rx, ry);
            ry = doc.y + 2;
            doc.fillColor(COLORS.textGray).font('Helvetica').fontSize(8.5).text(ref.role || '', rx, ry);
            ry = doc.y + 1;

            if (ref.phone) { doc.text(ref.phone, rx, ry); ry = doc.y + 1; }
            if (ref.email) doc.text(ref.email, rx, ry);
        });
    }

    // Restore page handling
    doc.addPage = _originalAddPage;
    doc.constructor.prototype.addPage = _protoAddPage;
}


module.exports = {
    generateUnifiedResume,
    TEMPLATE_COLORS,
    TEMPLATE_MAP,
    renderTemplate_HieroMonethon,
    renderTemplate_HieroNova
};



