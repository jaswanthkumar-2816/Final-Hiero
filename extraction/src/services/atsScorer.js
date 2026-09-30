/**
 * ATS Optimization & Quality Scoring Engine
 * Analyzes parsed resume for completeness, action verb density, and quantifiable impact.
 */

const STRONG_ACTION_VERBS = [
    'accelerated', 'achieved', 'administered', 'architected', 'automated',
    'built', 'championed', 'collaborated', 'conceptualized', 'consolidated',
    'constructed', 'delivered', 'designed', 'developed', 'devised',
    'directed', 'engineered', 'enhanced', 'established', 'executed',
    'expanded', 'expedited', 'formulated', 'generated', 'implemented',
    'improved', 'increased', 'initiated', 'innovated', 'integrated',
    'launched', 'lead', 'managed', 'maximized', 'mentored',
    'migrated', 'modernized', 'negotiated', 'optimized', 'orchestrated',
    'overhauled', 'pioneered', 'reduced', 'refactored', 'resolved',
    'restructured', 'revamped', 'scaled', 'spearheaded', 'streamlined',
    'strengthened', 'transformed', 'upgraded'
];

const METRIC_REGEX = /\b(?:\d+[\d,.]*\%|\$\s*\d+[\d,.]*|\d+\s*(?:x|times|users|clients|projects|million|k|ms|seconds|hours))\b/i;

function scoreResume(parsedData, rawText = '') {
    let score = 0;
    const checks = [];
    const suggestions = [];

    // 1. Personal & Contact Completeness (max 20)
    let contactScore = 0;
    const p = parsedData.personalInfo || {};
    if (p.fullName && p.fullName.length > 2) contactScore += 5;
    if (p.email && p.email.includes('@')) contactScore += 5;
    if (p.phone && p.phone.length >= 8) contactScore += 5;
    if (p.linkedin || p.github || p.portfolio) contactScore += 5;
    score += contactScore;

    checks.push({
        name: 'Contact Information',
        score: contactScore,
        maxScore: 20,
        passed: contactScore >= 15
    });
    if (contactScore < 15) {
        suggestions.push('Ensure your phone number, professional email, and LinkedIn or portfolio link are clearly displayed.');
    }

    // 2. Summary & Headline (max 10)
    let summaryScore = 0;
    if (parsedData.summary && parsedData.summary.length >= 50) {
        summaryScore = 10;
    } else if (parsedData.summary && parsedData.summary.length > 0) {
        summaryScore = 5;
    }
    score += summaryScore;
    checks.push({
        name: 'Professional Summary',
        score: summaryScore,
        maxScore: 10,
        passed: summaryScore >= 5
    });
    if (summaryScore < 5) {
        suggestions.push('Add a concise 2-4 sentence professional summary highlighting your core expertise and value proposition.');
    }

    // 3. Work Experience & Bullet Points (max 25)
    let expScore = 0;
    const expList = parsedData.experience || [];
    if (expList.length > 0) {
        expScore += 10;
        const totalBullets = expList.reduce((acc, e) => acc + (e.bulletPoints?.length || 0), 0);
        if (totalBullets >= 4) expScore += 10;
        else if (totalBullets >= 2) expScore += 5;

        // Check for dates
        const hasDates = expList.every(e => e.startDate || e.endDate);
        if (hasDates) expScore += 5;
    }
    score += expScore;
    checks.push({
        name: 'Work Experience Quality',
        score: expScore,
        maxScore: 25,
        passed: expScore >= 20
    });
    if (expScore < 20) {
        suggestions.push('Expand your experience with detailed bullet points describing your technical contributions and start/end dates.');
    }

    // 4. Quantifiable Impact & Metrics (max 20)
    let metricBullets = 0;
    let totalBullets = 0;
    let actionVerbCount = 0;

    const allBullets = [
        ...expList.flatMap(e => e.bulletPoints || []),
        ...(parsedData.projects || []).flatMap(p => p.bulletPoints || [])
    ];
    totalBullets = allBullets.length;

    for (let bullet of allBullets) {
        const lower = bullet.toLowerCase();
        if (METRIC_REGEX.test(lower) || /\b\d+\b/.test(lower)) {
            metricBullets++;
        }
        const words = lower.split(/\s+/);
        if (STRONG_ACTION_VERBS.some(verb => words.includes(verb) || words[0] === verb)) {
            actionVerbCount++;
        }
    }

    const metricPercentage = totalBullets > 0 ? (metricBullets / totalBullets) * 100 : 0;
    let metricScore = 0;
    if (metricPercentage >= 40) metricScore = 20;
    else if (metricPercentage >= 20) metricScore = 14;
    else if (metricPercentage > 0) metricScore = 8;
    score += metricScore;

    checks.push({
        name: 'Quantified Results & Metrics',
        score: metricScore,
        maxScore: 20,
        passed: metricScore >= 14,
        details: `${metricBullets} out of ${totalBullets} bullets have quantifiable numbers/metrics`
    });
    if (metricScore < 14) {
        suggestions.push('Add measurable outcomes to your bullet points (e.g., "improved load times by 35%", "scaled API to handle 10k req/sec").');
    }

    // 5. Skills & Tech Stack (max 15)
    let skillScore = 0;
    const techSkills = parsedData.skills?.technicalSkills || [];
    if (techSkills.length >= 10) skillScore = 15;
    else if (techSkills.length >= 5) skillScore = 10;
    else if (techSkills.length > 0) skillScore = 5;
    score += skillScore;
    checks.push({
        name: 'Skills Depth & Diversity',
        score: skillScore,
        maxScore: 15,
        passed: skillScore >= 10,
        skillCount: techSkills.length
    });
    if (skillScore < 10) {
        suggestions.push('Include more relevant technical skills, frameworks, and modern tools to pass automated ATS filters.');
    }

    // 6. Education & Certifications (max 10)
    let eduScore = 0;
    if (parsedData.education?.length > 0) eduScore += 5;
    if (parsedData.certifications?.length > 0 || parsedData.projects?.length > 0) eduScore += 5;
    score += eduScore;
    checks.push({
        name: 'Education & Credentials',
        score: eduScore,
        maxScore: 10,
        passed: eduScore >= 5
    });

    const finalScore = Math.min(100, Math.max(10, Math.round(score)));

    let grade = 'Needs Work';
    let gradeColor = '#ef4444';
    if (finalScore >= 85) {
        grade = 'Excellent (ATS Optimized)';
        gradeColor = '#22c55e';
    } else if (finalScore >= 70) {
        grade = 'Strong Candidate';
        gradeColor = '#3b82f6';
    } else if (finalScore >= 50) {
        grade = 'Average';
        gradeColor = '#f59e0b';
    }

    return {
        overallAtsScore: finalScore,
        overallScore: finalScore,
        // `score` is what the resume-builder popup binds to — keep it in sync.
        score: finalScore,
        grade,
        gradeColor,
        checks,
        suggestions,
        metrics: {
            totalBullets,
            bulletsWithMetrics: metricBullets,
            bulletsWithStrongVerbs: actionVerbCount,
            totalSkillsFound: techSkills.length,
            experienceYears: parsedData.experienceMetrics?.totalYears || 0
        }
    };
}

module.exports = {
    scoreResume
};
