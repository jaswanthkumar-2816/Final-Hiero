/**
 * Deterministic Anchor & Entity Extraction Algorithms
 * Provides high-precision rule-based extraction for grounding AI models.
 */

// Regex definitions
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

// International, US, Indian, and general phone number patterns
const PHONE_REGEX = /(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?)?\d{3,5}[\s.-]?\d{4,5}\b/g;

// Known URL patterns
const LINKEDIN_REGEX = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|profile)\/([A-Za-z0-9_-]+)/gi;
const GITHUB_REGEX = /(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_-]+)/gi;
const PORTFOLIO_REGEX = /\b(?:https?:\/\/)?(?:[a-zA-Z0-9-]+\.)+(?:com|org|io|dev|me|net|tech|app|xyz|in)\b(?:\/[^\s,]*)?/gi;

// Known free/common email domains to NEVER extract as website/portfolio
const EMAIL_HOST_BLACKLIST = /^(?:gmail|yahoo|outlook|hotmail|example|email|mail|proton|protonmail|icloud|aol|zoho|gmx|yandex|rediffmail)\.[a-z]{2,}$/i;

// Known standard resume section keywords
const STANDARD_SECTIONS = [
    { key: 'summary', patterns: [/^(?:professional\s+)?summary/i, /^career\s+objective/i, /^profile/i, /^about(?:\s+me)?/i] },
    { key: 'experience', patterns: [/^(?:work|professional|employment)\s+experience/i, /^experience/i, /^work\s+history/i, /^internships?/i] },
    { key: 'education', patterns: [/^education(?:al\s+qualifications?)?/i, /^academic\s+(?:background|history|credentials)/i, /^qualifications/i] },
    { key: 'skills', patterns: [/^(?:technical\s+|core\s+|management\s+)?skills/i, /^technologies/i, /^tech\s+stack/i, /^competencies/i, /^areas\s+of\s+expertise/i] },
    { key: 'projects', patterns: [/^(?:academic\s+|personal\s+)?projects/i, /^key\s+projects/i] },
    { key: 'certifications', patterns: [/^certifications?/i, /^licenses?\s*(?:&|and)?\s*certifications?/i, /^courses/i] },
    { key: 'languages', patterns: [/^languages?/i] }
];

/**
 * Extracts emails with deduplication and domain validity checks.
 */
function extractEmails(text) {
    if (!text) return [];
    const matches = text.match(EMAIL_REGEX) || [];
    const cleaned = matches.map(e => e.trim().toLowerCase());
    return [...new Set(cleaned)];
}

/**
 * Extracts phone numbers and normalizes valid candidate numbers (7-15 digits).
 */
function extractPhoneNumbers(text) {
    if (!text) return [];
    const matches = text.match(PHONE_REGEX) || [];
    const results = [];

    for (let raw of matches) {
        const digits = raw.replace(/\D/g, '');
        if (digits.length >= 10 && digits.length <= 15) {
            // Check if it's not a postal code or year (like 20212022)
            if (!/^(19|20)\d{2}/.test(digits) || digits.length > 10) {
                results.push(raw.trim());
            }
        }
    }
    return [...new Set(results)];
}

/**
 * Extracts social links and portfolios.
 * Safely ignores email domain substrings and candidate email hosts.
 */
function extractUrls(text, candidateEmails = []) {
    const urls = {
        linkedin: '',
        github: '',
        portfolio: '',
        others: []
    };

    if (!text) return urls;

    // Collect domain names from extracted emails to avoid false portfolio matches
    const emailDomains = new Set();
    const foundEmails = candidateEmails.length ? candidateEmails : (text.match(EMAIL_REGEX) || []);
    for (const em of foundEmails) {
        const parts = em.split('@');
        if (parts[1]) emailDomains.add(parts[1].toLowerCase());
    }

    // Match LinkedIn
    const linkedinMatches = text.match(LINKEDIN_REGEX);
    if (linkedinMatches && linkedinMatches.length > 0) {
        let l = linkedinMatches[0];
        if (!l.startsWith('http')) l = 'https://' + l.replace(/^\/+/, '');
        urls.linkedin = l;
    }

    // Match GitHub
    const githubMatches = text.match(GITHUB_REGEX);
    if (githubMatches && githubMatches.length > 0) {
        let g = githubMatches[0];
        if (!g.startsWith('http')) g = 'https://' + g.replace(/^\/+/, '');
        urls.github = g;
    }

    // Strip emails from text before matching generic portfolio URLs
    const textWithoutEmails = text.replace(EMAIL_REGEX, ' ');

    // Match Portfolios
    const genericMatches = textWithoutEmails.match(PORTFOLIO_REGEX) || [];
    for (let url of genericMatches) {
        const clean = url.trim().replace(/[.,;)]+$/, '');
        if (/linkedin\.com/i.test(clean) || /github\.com/i.test(clean)) continue;

        // Extract hostname
        const hostMatch = clean.match(/(?:https?:\/\/)?([a-zA-Z0-9.-]+)/);
        const host = hostMatch ? hostMatch[1].toLowerCase() : clean.toLowerCase();

        // Reject if matches known email providers, tech libraries, or candidate's email domain
        if (EMAIL_HOST_BLACKLIST.test(host)) continue;
        if (emailDomains.has(host)) continue;
        if (/^(?:email|mail|example)\.com$/i.test(host)) continue;
        if (/^(?:socket\.io|reactjs\.org|vuejs\.org|nextjs\.org|expressjs\.com|nestjs\.com|angular\.io|getbootstrap\.com|tailwindcss\.com|docker\.com|npmjs\.com|pypi\.org|mongodb\.com|postgresql\.org|redis\.io)$/i.test(host)) continue;

        let fullUrl = clean.startsWith('http') ? clean : `https://${clean}`;
        if (!urls.portfolio) {
            urls.portfolio = fullUrl;
        } else if (!urls.others.includes(fullUrl) && urls.others.length < 5) {
            urls.others.push(fullUrl);
        }
    }

    return urls;
}

/**
 * Algorithmic Section Segmentation:
 * Scans line by line, identifies headings, and separates them into:
 * 1. Standard sections
 * 2. High-confidence novel / extra headings (e.g. "Workshops", "Patents", "Publications", "Achievements")
 */
function segmentSections(rawText) {
    const lines = rawText.split('\n');
    const sections = [];
    let currentSection = {
        heading: 'HEADER',
        isStandard: true,
        standardKey: 'header',
        lines: []
    };

    const isHeadingCandidate = (line) => {
        const trimmed = line.trim().replace(/^#{1,4}\s*/, '');
        if (trimmed.length < 3 || trimmed.length > 50) return false;

        // Lines with email, phone, pipe contact headers, or links are NOT headings
        if (/@|\||https?:\/\/|\+\d{2}/.test(trimmed)) return false;

        // Lines with date ranges or years are NOT headings
        if (/\b(19\d{2}|20\d{2})\b.*(?:present|current|now|\b\d{4}\b)/i.test(trimmed)) return false;
        if (/^\d{4}\s*[-–]\s*(?:\d{4}|present)/i.test(trimmed)) return false;

        // Lines with GPA/marks/scores are NOT headings
        if (/(?:gpa|cgpa|percentage|\d+%|\d+\.\d+\/\d+)/i.test(trimmed)) return false;

        // Obvious candidate job titles or single companies are NOT headings
        if (/^(?:assistant\s+professor|software\s+engineer|senior\s+|lead\s+|director|manager|developer|intern|designer|architect|professor|lecturer)\b/i.test(trimmed)) return false;
        if (/^(?:google|stripe|apple|microsoft|amazon|meta|netflix|oracle|ibm|tcs|infosys|wipro)\b/i.test(trimmed)) return false;

        // Ends with period is a sentence, not a heading
        if (trimmed.endsWith('.') || trimmed.endsWith(';')) return false;

        // Explicit Markdown Heading
        if (line.trim().startsWith('#')) return true;

        // Check against known novel/extra heading keywords
        const isKnownNovel = /^(?:seminars?|conferences?|workshops?|publications?|research\s+papers?|patents?|awards?|honors?|achievements?|volunteer(?:ing)?|guest\s+lectures?|memberships?|extracurricular)/i.test(trimmed);
        if (isKnownNovel) return true;

        // ALL CAPS heading
        const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]{3,}/.test(trimmed) && trimmed.split(/\s+/).length <= 4;
        return isAllCaps;
    };

    const matchStandardSection = (headingText) => {
        const clean = headingText.replace(/^#{1,4}\s*/, '').replace(/[:\-–—]/g, '').trim();
        for (const sec of STANDARD_SECTIONS) {
            for (const pat of sec.patterns) {
                if (pat.test(clean)) return sec.key;
            }
        }
        return null;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (isHeadingCandidate(trimmed)) {
            const standardKey = matchStandardSection(trimmed);
            if (currentSection.lines.length > 0 || currentSection.heading !== 'HEADER') {
                sections.push(currentSection);
            }

            currentSection = {
                heading: trimmed.replace(/^#{1,4}\s*/, '').replace(/[:]/g, '').trim(),
                isStandard: Boolean(standardKey),
                standardKey: standardKey || 'custom',
                lines: []
            };
        } else {
            currentSection.lines.push(line);
        }
    }
    sections.push(currentSection);

    // Filter out standard vs novel/extra sections
    const extraSections = sections
        .filter(s => !s.isStandard && s.heading !== 'HEADER' && s.lines.filter(l => l.trim()).length > 0)
        .map(s => ({
            heading: s.heading,
            content: s.lines.join('\n').trim(),
            lineCount: s.lines.length
        }));

    return {
        allSections: sections,
        extraSections
    };
}

module.exports = {
    extractEmails,
    extractPhoneNumbers,
    extractUrls,
    segmentSections
};
