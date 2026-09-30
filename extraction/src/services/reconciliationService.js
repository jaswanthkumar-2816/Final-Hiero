const { harmonizeAdditionalDetails } = require('./additionalDetailsEngine');

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * Converts a free-text resume date into the `YYYY-MM` string that
 * `<input type="month">` accepts. Anything an input element would silently
 * reject is converted here instead of being dropped by the browser.
 *
 * "Jan 2023" / "January 2023" / "01/2023" / "2023-1" / "2023" -> "2023-01"
 * "Present" / "" / unparseable                                -> ""
 */
function toMonthInputValue(raw) {
    if (!raw) return '';
    const str = String(raw).trim();
    if (!str || /present|current|now|till\s*date|ongoing|pursuing/i.test(str)) return '';

    // Already valid: YYYY-MM (pad single-digit months such as "2023-1")
    const iso = str.match(/^(\d{4})[-/](\d{1,2})$/);
    if (iso) {
        const m = parseInt(iso[2], 10);
        if (m >= 1 && m <= 12) return `${iso[1]}-${String(m).padStart(2, '0')}`;
    }

    // Numeric month first: MM/YYYY, MM-YYYY
    const numFirst = str.match(/^(\d{1,2})[-/](\d{4})$/);
    if (numFirst) {
        const m = parseInt(numFirst[1], 10);
        if (m >= 1 && m <= 12) return `${numFirst[2]}-${String(m).padStart(2, '0')}`;
    }

    const yearMatch = str.match(/\b(19\d{2}|20\d{2})\b/);
    if (!yearMatch) return '';
    const year = yearMatch[1];

    // Month name anywhere in the string ("Jan 2023", "2023 January", "Sept. 2021")
    const lower = str.toLowerCase();
    for (let i = 0; i < MONTH_NAMES.length; i++) {
        if (lower.includes(MONTH_NAMES[i])) {
            return `${year}-${String(i + 1).padStart(2, '0')}`;
        }
    }

    // Year only -> January, so the year at least survives into the form
    return `${year}-01`;
}

/**
 * Normalizes an end date, preserving the "currently working here" signal.
 * Returns { value, isCurrent } where `value` is form-ready (`YYYY-MM` or '').
 */
function normalizeEndDate(raw, isCurrentFlag) {
    const str = String(raw || '').trim();
    const looksCurrent = Boolean(isCurrentFlag) || /present|current|now|till\s*date|ongoing/i.test(str);
    return {
        value: looksCurrent ? '' : toMonthInputValue(str),
        isCurrent: looksCurrent
    };
}

/**
 * Calculates total experience in years and months based on experience date ranges.
 */
function calculateExperienceMetrics(experienceList = []) {
    let totalMonths = 0;

    const parseYearMonth = (str) => {
        if (!str || typeof str !== 'string') return null;
        if (/present|current|now|till date/i.test(str)) {
            const now = new Date();
            return { year: now.getFullYear(), month: now.getMonth() + 1 };
        }
        // Normalized `YYYY-MM` values carry an exact month — use it.
        const isoMatch = str.match(/^(\d{4})-(\d{2})$/);
        if (isoMatch) {
            return { year: parseInt(isoMatch[1], 10), month: parseInt(isoMatch[2], 10) };
        }

        const yearMatch = str.match(/\b(19\d{2}|20\d{2})\b/);
        if (!yearMatch) return null;
        const year = parseInt(yearMatch[1], 10);

        // Try detecting month name or number
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        let month = 6; // default mid-year
        const lower = str.toLowerCase();
        for (let idx = 0; idx < months.length; idx++) {
            if (lower.includes(months[idx])) {
                month = idx + 1;
                break;
            }
        }
        return { year, month };
    };

    for (const exp of experienceList) {
        const start = parseYearMonth(exp.startDate);
        const end = parseYearMonth(exp.endDate) || (exp.isCurrent ? parseYearMonth('Present') : null);

        if (start && end) {
            const months = (end.year - start.year) * 12 + (end.month - start.month);
            if (months > 0 && months < 600) {
                totalMonths += months;
            }
        }
    }

    const totalYears = (totalMonths / 12).toFixed(1);
    return {
        totalMonths,
        totalYears: parseFloat(totalYears) || 0,
        formattedExperience: totalMonths >= 12
            ? `${Math.floor(totalMonths / 12)} yrs ${totalMonths % 12} mos`
            : `${totalMonths} mos`
    };
}

/**
 * Sanitizes website/portfolio URL to prevent email domains from being treated as websites.
 */
function sanitizePortfolioUrl(url, email = '') {
    if (!url || typeof url !== 'string') return '';
    const clean = url.trim();
    if (!clean) return '';

    // If matches common fake / email domains or tech library domains
    if (/https?:\/\/(?:www\.)?(?:socket\.io|reactjs\.org|vuejs\.org|nextjs\.org|expressjs\.com|nestjs\.com|angular\.io|getbootstrap\.com|tailwindcss\.com|docker\.com|npmjs\.com|pypi\.org|mongodb\.com|postgresql\.org|redis\.io|email\.com|mail\.com|example\.com|gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|icloud\.com|proton\.me|protonmail\.com|aol\.com|zoho\.com)/i.test(clean)) {
        return '';
    }

    // If matches candidate's email domain
    if (email && email.includes('@')) {
        const domain = email.split('@')[1]?.toLowerCase();
        if (domain && clean.toLowerCase().includes(domain)) {
            return '';
        }
    }

    return clean;
}

/**
 * Reconciles and formats the extracted data into a complete, clean, form-ready structure.
 */
function reconcileExtractedData(llmData = {}, deterministicAnchors = {}) {
    const rawPersonal = llmData.personalInfo || {};
    const anchors = deterministicAnchors || {};

    // 1. Reconcile Personal Information
    const rawEmail = rawPersonal.email || (anchors.emails && anchors.emails[0]) || '';
    const rawPortfolio = sanitizePortfolioUrl(
        rawPersonal.portfolio || (anchors.urls && anchors.urls.portfolio) || '',
        rawEmail
    );

    // Initial personalInfo
    const personalInfo = {
        fullName: (rawPersonal.fullName || '').trim(),
        professionalTitle: (rawPersonal.professionalTitle || '').trim(),
        email: rawEmail.trim(),
        phone: (rawPersonal.phone || (anchors.phoneNumbers && anchors.phoneNumbers[0]) || '').trim(),
        address: (rawPersonal.address || '').trim(),
        linkedin: (rawPersonal.linkedin || (anchors.urls && anchors.urls.linkedin) || '').trim(),
        github: (rawPersonal.github || (anchors.urls && anchors.urls.github) || '').trim(),
        portfolio: rawPortfolio,
        website: rawPortfolio,
        dateOfBirth: (rawPersonal.dateOfBirth || '').trim(),
        gender: (rawPersonal.gender || '').trim(),
        nationality: (rawPersonal.nationality || '').trim()
    };

    // 2. Summary
    const summary = (llmData.summary || '').trim();

    // 3. Work Experience
    const experience = Array.isArray(llmData.experience)
        ? llmData.experience.map((exp, idx) => {
            const bulletPoints = Array.isArray(exp.bulletPoints) && exp.bulletPoints.length > 0
                ? exp.bulletPoints.map(b => String(b).replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean)
                : (exp.description ? String(exp.description).split('\n').map(b => b.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean) : []);

            const rawStart = (exp.startDate || '').trim();
            const rawEnd = (exp.endDate || (exp.isCurrent ? 'Present' : '')).trim();
            const end = normalizeEndDate(rawEnd, exp.isCurrent);

            return {
                id: `exp_${idx + 1}`,
                jobTitle: (exp.jobTitle || '').trim(),
                company: (exp.company || '').trim(),
                location: (exp.location || '').trim(),
                // Form-ready `YYYY-MM` so `<input type="month">` keeps the value
                startDate: toMonthInputValue(rawStart),
                endDate: end.value,
                // Original strings preserved for templates / display
                startDateText: rawStart,
                endDateText: rawEnd,
                isCurrent: end.isCurrent,
                bulletPoints,
                description: exp.description || bulletPoints.map(b => `• ${b}`).join('\n')
            };
        })
        : [];

    const expMetrics = calculateExperienceMetrics(experience);

    // If professionalTitle is still empty, infer it cleanly!
    if (!personalInfo.professionalTitle) {
        if (experience.length > 0 && experience[0].jobTitle) {
            personalInfo.professionalTitle = experience[0].jobTitle;
        } else if (summary) {
            const sumMatch = summary.match(/(?:dynamic|experienced|passionate|certified|driven|skilled)?\s*([a-zA-Z\s]{3,30}?)(?:\s+(?:with|specializing|having|experienced|in)\b|\.)/i);
            if (sumMatch && sumMatch[1] && sumMatch[1].trim().length > 3) {
                personalInfo.professionalTitle = sumMatch[1].trim();
            }
        }
    }
    personalInfo.roleTitle = personalInfo.professionalTitle;
    personalInfo.professionalHeadline = personalInfo.professionalTitle;

    // 4. Internships
    const internships = Array.isArray(llmData.internships)
        ? llmData.internships.map((intern, idx) => {
            const rawStart = (intern.startDate || '').trim();
            const rawEnd = (intern.endDate || '').trim();
            const end = normalizeEndDate(rawEnd, intern.isCurrent);

            return {
                id: `intern_${idx + 1}`,
                role: intern.role || intern.jobTitle || 'Intern',
                jobTitle: intern.role || intern.jobTitle || 'Intern',
                organization: intern.organization || intern.company || '',
                company: intern.organization || intern.company || '',
                startDate: toMonthInputValue(rawStart),
                endDate: end.value,
                startDateText: rawStart,
                endDateText: rawEnd,
                isCurrent: end.isCurrent,
                description: intern.description || ''
            };
        })
        : [];

    // 5. Education (with both school, institution, gpa, marks for form compatibility)
    const education = Array.isArray(llmData.education)
        ? llmData.education.map((edu, idx) => {
            const uni = (edu.institution || edu.university || '').trim();
            const col = (edu.college || '').trim();
            let schoolName = (edu.school || uni).trim();
            if (uni && col && !schoolName.includes(col)) schoolName = `${uni} — ${col}`;
            else if (col && !schoolName) schoolName = col;

            const grade = (edu.cgpaOrPercentage || edu.gpa || edu.marks || '').trim();

            return {
                id: `edu_${idx + 1}`,
                degree: (edu.degree || '').trim(),
                fieldOfStudy: (edu.fieldOfStudy || '').trim(),
                institution: uni,
                college: col,
                school: schoolName,
                location: (edu.location || '').trim(),
                gradYear: (edu.gradYear || '').trim(),
                cgpaOrPercentage: grade,
                gpa: grade,
                marks: grade
            };
        })
        : [];

    // 6. Skills
    const rawSkills = llmData.skills || {};
    const programmingLanguages = Array.isArray(rawSkills.programmingLanguages) ? rawSkills.programmingLanguages : [];
    const frameworksLibraries = Array.isArray(rawSkills.frameworksLibraries) ? rawSkills.frameworksLibraries : [];
    const databases = Array.isArray(rawSkills.databases) ? rawSkills.databases : [];
    const cloudDevops = Array.isArray(rawSkills.cloudDevops) ? rawSkills.cloudDevops : [];
    const toolsPlatforms = Array.isArray(rawSkills.toolsPlatforms) ? rawSkills.toolsPlatforms : [];
    const softSkills = Array.isArray(rawSkills.softSkills) ? rawSkills.softSkills : [];

    // Flatten all technical skills
    const combinedTechSkills = [
        ...programmingLanguages,
        ...frameworksLibraries,
        ...databases,
        ...cloudDevops,
        ...toolsPlatforms,
        ...(Array.isArray(rawSkills.allSkills) ? rawSkills.allSkills : [])
    ];
    const uniqueTechnicalSkills = [...new Set(combinedTechSkills.map(s => String(s).trim()))].filter(Boolean);

    // 7. Projects (with duration, achievement, name, title, tech)
    const projects = Array.isArray(llmData.projects)
        ? llmData.projects.map((proj, idx) => {
            const title = (proj.title || proj.name || '').trim();
            const techStr = Array.isArray(proj.techStack) ? proj.techStack.join(', ') : (proj.tech || proj.technologies || '');
            const duration = (proj.duration || proj.year || '').trim();
            const achievement = (proj.achievement || proj.metrics || '').trim();

            return {
                id: `proj_${idx + 1}`,
                name: title,
                title: title,
                role: (proj.role || '').trim(),
                tech: techStr,
                technologies: techStr,
                techStack: Array.isArray(proj.techStack) ? proj.techStack : techStr.split(',').map(s => s.trim()).filter(Boolean),
                duration,
                projectDuration: duration,
                achievement,
                projectAchievement: achievement,
                description: proj.description || '',
                bulletPoints: Array.isArray(proj.bulletPoints) ? proj.bulletPoints : [],
                link: proj.link || ''
            };
        })
        : [];

    // 8. Certifications
    const certifications = Array.isArray(llmData.certifications)
        ? llmData.certifications.map((cert, idx) => ({
            id: `cert_${idx + 1}`,
            name: cert.name || cert.title || '',
            issuingOrganization: cert.issuingOrganization || '',
            issueDate: cert.issueDate || '',
            credentialUrl: cert.credentialUrl || ''
        }))
        : [];

    // 9. Languages
    const languages = Array.isArray(llmData.languages)
        ? llmData.languages.map(lang => (typeof lang === 'string' ? { language: lang, proficiency: 'Proficient' } : lang))
        : [];

    // 10. Dedicated Sections (Achievements, Publications, Hobbies, ExtraCurricular)
    // Rejoins lines that a PDF text layer split mid-sentence, WITHOUT merging
    // genuinely separate bullets. Resume bullets rarely end in punctuation, so
    // "previous line has no full stop" is never on its own a reason to stitch.
    const stitchBulletFragments = (items = []) => {
        const cleaned = [];
        for (let raw of items) {
            let item = String(raw).replace(/^[•\-\*⁃‣]+\s*/, '').replace(/^\d+[.)]\s+/, '').trim();
            if (!item) continue;

            const prev = cleaned.length > 0 ? cleaned[cleaned.length - 1] : null;

            // The previous line was cut off mid-clause: it ends with a comma,
            // a hyphen, an opening bracket, or a dangling function word.
            const prevDangles = Boolean(prev) && (
                /[,;:(\[\-–—/&+]$/.test(prev) ||
                /\b(?:at|in|on|for|to|with|from|during|of|and|or|by|the|a|an|as|into|under|over)$/i.test(prev)
            );

            // This line is a continuation: it opens lowercase, or with a
            // connector/punctuation that cannot start a new bullet.
            const continuesPrev = /^[a-z]/.test(item) || /^[),;:\-–—]/.test(item);

            if (prev && (prevDangles || continuesPrev)) {
                const needsSpaceOnly = /[,;:(\[\-–—/&+]$/.test(prev) || /^[),;:\-–—]/.test(item);
                const separator = needsSpaceOnly ? ' ' : ' ';
                cleaned[cleaned.length - 1] = `${prev}${separator}${item}`.replace(/\s+/g, ' ').trim();
            } else {
                cleaned.push(item);
            }
        }
        return cleaned;
    };

    const formatBulletList = (input) => {
        if (!input) return '';
        const rawItems = Array.isArray(input)
            ? input
            : String(input).split(/\n+/).map(l => l.trim()).filter(Boolean);
        const stitched = stitchBulletFragments(rawItems);
        return stitched.map(item => `• ${item}`).join('\n');
    };

    let achievements = formatBulletList(llmData.achievements);
    let publications = formatBulletList(llmData.publications);
    let hobbies = Array.isArray(llmData.hobbies) ? llmData.hobbies.join(', ') : (llmData.hobbies || '');
    let extraCurricular = formatBulletList(llmData.extraCurricular);

    // 11. ⭐ Dynamic Novel / Extra Headings (Harmonized)
    const { additionalDetails } = harmonizeAdditionalDetails(
        llmData.additionalDetails,
        anchors.extraSections || [],
        projects,
        education,
        personalInfo.fullName,
        experience,
        {
            achievements: Boolean(achievements && achievements.length > 5),
            publications: Boolean(publications && publications.length > 5),
            hobbies: Boolean(hobbies && hobbies.length > 2),
            extraCurricular: Boolean(extraCurricular && extraCurricular.length > 5)
        }
    );

    // Check if additionalDetails has items that should be routed to dedicated fields
    const filteredCustomSections = [];
    (additionalDetails || []).forEach(sec => {
        const h = (sec.heading || '').toLowerCase();
        const contentStr = Array.isArray(sec.items) ? sec.items.map(i => `• ${i}`).join('\n') : (sec.content || '');

        if (h.includes('achievement') || h.includes('award') || h.includes('honor')) {
            if (!achievements) achievements = contentStr;
        } else if (h.includes('publication') || h.includes('research paper') || h.includes('whitepaper') || h.includes('patent')) {
            if (!publications) publications = contentStr;
        } else if (h.includes('hobbi') || h.includes('interest')) {
            if (!hobbies) hobbies = Array.isArray(sec.items) ? sec.items.join(', ') : sec.content;
        } else if (h.includes('extra') || h.includes('curricular') || h.includes('volunteer')) {
            if (!extraCurricular) extraCurricular = contentStr;
        } else {
            // Keep genuinely novel items in custom sections for form
            filteredCustomSections.push(sec);
        }
    });

    const customDetails = filteredCustomSections.map(d => ({
        heading: d.heading,
        content: d.content
    }));

    // Prepare flat strings for resume form fields
    const techSkillsStr = uniqueTechnicalSkills.join(', ');
    const softSkillsStr = softSkills.join(', ');
    const certsStr = certifications.map(c => c.name).filter(Boolean).join(', ');
    const langsStr = languages.map(l => l.language || l.name || l).filter(Boolean).join(', ');

    // 12. Direct Form Bindings
    const formFields = {
        // Flat personal fields
        fullName: personalInfo.fullName,
        jobTitle: personalInfo.professionalTitle,
        headline: personalInfo.professionalTitle,
        professionalTitle: personalInfo.professionalTitle,
        professionalHeadline: personalInfo.professionalHeadline,
        email: personalInfo.email,
        phone: personalInfo.phone,
        address: personalInfo.address,
        linkedin: personalInfo.linkedin,
        github: personalInfo.github,
        website: personalInfo.website,
        summary: summary,
        
        // Flat strings for basic form textareas/tags
        technicalSkills: techSkillsStr,
        softSkills: softSkillsStr,
        certifications: certsStr,
        languages: langsStr,
        achievements,
        publications,
        hobbies,
        extraCurricular,

        // Dynamic lists for repeaters/cards
        experience,
        internships,
        education,
        projects,
        certificationsList: certifications,

        // Dynamic extra headings container for form
        additionalDetails: filteredCustomSections,
        customDetails
    };

    return {
        personalInfo,
        summary,
        experience,
        internships,
        education,
        projects,
        technicalSkills: techSkillsStr,
        softSkills: softSkillsStr,
        certifications: certsStr,
        languages: langsStr,
        achievements,
        publications,
        hobbies,
        extraCurricular,
        skills: {
            categorized: {
                programmingLanguages,
                frameworksLibraries,
                databases,
                cloudDevops,
                toolsPlatforms
            },
            technicalSkills: uniqueTechnicalSkills,
            softSkills
        },
        certificationsList: certifications,
        languagesList: languages,
        additionalDetails: filteredCustomSections,
        customDetails,
        customSections: filteredCustomSections.map(s => ({
            title: s.heading,
            items: s.items
        })),
        experienceMetrics: expMetrics,
        formFields
    };
}

module.exports = {
    calculateExperienceMetrics,
    reconcileExtractedData
};
