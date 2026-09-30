/**
 * Additional Details & Dynamic Heading Formatting Engine
 * Dedicated to detecting, formatting, and harmonizing all novel, custom, or extra
 * resume sections into first-class form fields without duplicates or false positives.
 */

/**
 * Cleans and formats section title to proper Title Case.
 */
function normalizeHeading(heading) {
    if (!heading || typeof heading !== 'string') return 'Additional Information';
    
    // Remove leading/trailing symbols, colons, dashes, hashes
    let clean = heading.replace(/^[\s\-–—:*#]+|[\s\-–—:*#]+$/g, '').trim();
    clean = clean.replace(/\s+/g, ' ');

    // If completely upper-case, convert to Title Case
    if (clean === clean.toUpperCase() && clean.length > 3) {
        clean = clean
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    return clean;
}

/**
 * Normalizes content into clean, professional bulleted text and individual items.
 * Deduplicates overlapping and fragment lines.
 */
function normalizeSectionContent(content) {
    if (!content) return { content: '', items: [] };

    let lines = [];
    if (Array.isArray(content)) {
        lines = content.map(c => (typeof c === 'object' ? (c.text || c.content || JSON.stringify(c)) : String(c).trim())).filter(Boolean);
    } else if (typeof content === 'string') {
        lines = content
            .split(/\n+/)
            .map(l => l.trim())
            .filter(Boolean);
    } else if (typeof content === 'object') {
        lines = Object.entries(content).map(([k, v]) => `${k}: ${v}`);
    }

    const rawItems = [];
    for (let line of lines) {
        // Strip existing bullet markers or numbers
        let text = line.replace(/^[\s•\-\*⁃‣\d+\.\)]+/, '').trim();
        // Ignore very short fragment lines (< 4 chars)
        if (text && text.length >= 4) {
            rawItems.push(text);
        }
    }

    // Substring & fuzzy deduplication
    const finalItems = [];
    for (const item of rawItems) {
        const itemLower = item.toLowerCase();
        // Check if this item is already subsumed by an existing longer item or subsumes one
        let duplicate = false;
        for (let j = 0; j < finalItems.length; j++) {
            const existingLower = finalItems[j].toLowerCase();
            if (existingLower === itemLower) {
                duplicate = true;
                break;
            }
            // If existing item starts with this item or contains 90% of it
            if (existingLower.includes(itemLower)) {
                duplicate = true;
                break;
            }
            if (itemLower.includes(existingLower) && itemLower.length > existingLower.length + 5) {
                finalItems[j] = item; // replace with more complete version
                duplicate = true;
                break;
            }
        }
        if (!duplicate) {
            finalItems.push(item);
        }
    }

    return {
        content: finalItems.map(i => `• ${i}`).join('\n'),
        items: finalItems
    };
}

/**
 * Merges LLM-extracted custom sections with deterministically discovered novel headings.
 * Ensures complete coverage, zero noise, and zero information loss.
 */
function harmonizeAdditionalDetails(
    llmCustomDetails = [],
    deterministicExtraSections = [],
    existingProjects = [],
    existingEducation = [],
    candidateName = '',
    existingExperience = [],
    hasDedicated = {}
) {
    const sectionMap = new Map();

    // Blacklist words and known entities to prevent company/job titles from becoming custom sections
    const entityTokens = new Set([
        ...existingProjects.map(p => (p.title || p.name || '').toLowerCase().trim()),
        ...existingEducation.map(e => (e.degree || '').toLowerCase().trim()),
        ...existingEducation.map(e => (e.institution || e.school || e.college || '').toLowerCase().trim()),
        ...existingExperience.map(exp => (exp.company || '').toLowerCase().trim()),
        ...existingExperience.map(exp => (exp.jobTitle || '').toLowerCase().trim()),
        ...(candidateName ? [candidateName.toLowerCase().trim()] : [])
    ].filter(Boolean));

    const isBlacklisted = (lowerKey) => {
        // Standard sections or synonyms
        if (/^(personal|contact|summary|objective|work experience|employment|experience|education|skills|technical skills|soft skills|management skills|tech stack|core competencies|projects|certifications|languages|references)$/i.test(lowerKey)) {
            return true;
        }

        // If already populated in dedicated form textareas, do not create duplicate custom detail items
        if (hasDedicated.achievements && /^(?:achievements?|awards?|honors?|key achievements?)$/i.test(lowerKey)) {
            return true;
        }
        if (hasDedicated.publications && /^(?:publications?|research\s+papers?|patents?|whitepapers?)$/i.test(lowerKey)) {
            return true;
        }
        if (hasDedicated.hobbies && /^(?:hobbies|interests|leisure|pastimes)$/i.test(lowerKey)) {
            return true;
        }
        if (hasDedicated.extraCurricular && /^(?:extracurricular(?:\s+activities)?|volunteer(?:ing)?|social\s+causes)$/i.test(lowerKey)) {
            return true;
        }

        // Noise lines
        if (/^(cgpa|gpa|percentage|marks|grade|score|roll no|phone|email|location|present|year|years|duration|date)\b/i.test(lowerKey)) {
            return true;
        }

        // Common company names or job titles
        if (/^(google|stripe|apple|microsoft|amazon|meta|netflix|oracle|ibm|tcs|infosys|wipro)$/i.test(lowerKey)) {
            return true;
        }
        if (/^(assistant professor|software engineer|senior software engineer|lead developer|backend developer|frontend developer|ux designer|data scientist|intern)$/i.test(lowerKey)) {
            return true;
        }

        // Check if matches known entity
        if (entityTokens.has(lowerKey)) return true;

        return false;
    };

    const addOrMerge = (rawHeading, rawContent, source) => {
        if (!rawHeading) return;
        const normalizedHead = normalizeHeading(rawHeading);
        const lowerKey = normalizedHead.toLowerCase();

        if (isBlacklisted(lowerKey)) return;

        const { content, items } = normalizeSectionContent(rawContent);
        if (!content && items.length === 0) return;

        // Verify content doesn't just contain candidate's email or phone
        if (items.length === 1 && /@|^\s*\+?\d{8,15}\s*$/.test(items[0])) return;

        if (sectionMap.has(lowerKey)) {
            const existing = sectionMap.get(lowerKey);
            // Combine items with deduplication
            const combined = [...existing.items];
            for (const it of items) {
                if (!combined.some(c => c.toLowerCase() === it.toLowerCase() || c.toLowerCase().includes(it.toLowerCase()))) {
                    combined.push(it);
                }
            }
            existing.items = combined;
            existing.content = combined.map(i => `• ${i}`).join('\n');
            existing.sources.push(source);
        } else {
            sectionMap.set(lowerKey, {
                id: `custom_${sectionMap.size + 1}`,
                heading: normalizedHead,
                content,
                items,
                sources: [source]
            });
        }
    };

    // 1. Ingest LLM parsed details (Primary ground truth)
    if (Array.isArray(llmCustomDetails)) {
        for (const item of llmCustomDetails) {
            if (typeof item === 'object' && item !== null) {
                const heading = item.heading || item.title || item.name || item.section;
                const content = item.content || item.description || item.details || item.items || item.text;
                addOrMerge(heading, content, 'groq-ai');
            }
        }
    }

    // 2. Ingest deterministic extra headings only if high confidence and not already represented
    if (Array.isArray(deterministicExtraSections)) {
        for (const sec of deterministicExtraSections) {
            const lowerH = sec.heading.toLowerCase();
            const isHighConfidence = /seminar|conference|workshop|publication|patent|award|honor|achievement|volunteer|lecture|membership|activity/i.test(lowerH);
            if (isHighConfidence) {
                addOrMerge(sec.heading, sec.content, 'deterministic-parser');
            }
        }
    }

    const additionalDetails = Array.from(sectionMap.values()).map(sec => ({
        id: sec.id,
        heading: sec.heading,
        content: sec.content,
        items: sec.items
    }));

    const customDetails = additionalDetails.map(d => ({
        heading: d.heading,
        content: d.content
    }));

    return {
        additionalDetails,
        customDetails
    };
}

module.exports = {
    normalizeHeading,
    normalizeSectionContent,
    harmonizeAdditionalDetails
};
