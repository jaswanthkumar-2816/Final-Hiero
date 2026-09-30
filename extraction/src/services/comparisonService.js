/**
 * Resume Comparison & Diff Algorithm
 * Analyzes previous vs current resume data and generates detailed section-by-section diffs.
 */

function compareResumes(previousData, currentData, previousAts = null, currentAts = null) {
    const prev = previousData || {};
    const curr = currentData || {};

    // 1. Personal Info Diff
    const prevP = prev.personalInfo || {};
    const currP = curr.personalInfo || {};
    const personalChanges = [];

    const pFields = [
        { key: 'fullName', label: 'Full Name' },
        { key: 'professionalTitle', label: 'Title / Headline' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'address', label: 'Location' },
        { key: 'linkedin', label: 'LinkedIn' },
        { key: 'github', label: 'GitHub' },
        { key: 'portfolio', label: 'Portfolio' }
    ];

    for (const f of pFields) {
        const valOld = (prevP[f.key] || '').trim();
        const valNew = (currP[f.key] || '').trim();
        if (valOld !== valNew) {
            personalChanges.push({
                field: f.label,
                key: f.key,
                previous: valOld,
                current: valNew,
                isNew: !valOld && Boolean(valNew),
                isRemoved: Boolean(valOld) && !valNew
            });
        }
    }

    // 2. Summary Diff
    const summaryChanged = (prev.summary || '').trim() !== (curr.summary || '').trim();

    // 3. Skills Diff Matrix
    const prevSkills = new Set((prev.skills?.technicalSkills || []).map(s => s.toLowerCase().trim()));
    const currSkills = new Set((curr.skills?.technicalSkills || []).map(s => s.toLowerCase().trim()));

    const rawPrevSkills = prev.skills?.technicalSkills || [];
    const rawCurrSkills = curr.skills?.technicalSkills || [];

    const addedSkills = rawCurrSkills.filter(s => !prevSkills.has(s.toLowerCase().trim()));
    const removedSkills = rawPrevSkills.filter(s => !currSkills.has(s.toLowerCase().trim()));
    const retainedSkills = rawCurrSkills.filter(s => prevSkills.has(s.toLowerCase().trim()));

    // Soft skills diff
    const prevSoft = new Set((prev.skills?.softSkills || []).map(s => s.toLowerCase().trim()));
    const currSoft = new Set((curr.skills?.softSkills || []).map(s => s.toLowerCase().trim()));
    const addedSoftSkills = (curr.skills?.softSkills || []).filter(s => !prevSoft.has(s.toLowerCase().trim()));

    // 4. Experience Diff
    const prevExp = prev.experience || [];
    const currExp = curr.experience || [];

    const addedPositions = [];
    const prevCompanyTitles = new Set(prevExp.map(e => `${e.company?.toLowerCase()}|${e.jobTitle?.toLowerCase()}`));

    for (const e of currExp) {
        const key = `${e.company?.toLowerCase()}|${e.jobTitle?.toLowerCase()}`;
        if (!prevCompanyTitles.has(key)) {
            addedPositions.push({
                jobTitle: e.jobTitle,
                company: e.company,
                dates: `${e.startDate} - ${e.endDate}`,
                bulletCount: e.bulletPoints?.length || 0
            });
        }
    }

    const prevMonths = prev.experienceMetrics?.totalMonths || 0;
    const currMonths = curr.experienceMetrics?.totalMonths || 0;
    const monthsDelta = currMonths - prevMonths;

    // 5. Additional / Novel Headings Diff
    const prevHeadings = new Set((prev.additionalDetails || []).map(d => d.heading?.toLowerCase().trim()));
    const currDetails = curr.additionalDetails || [];
    const newAdditionalHeadings = [];

    for (const d of currDetails) {
        if (!prevHeadings.has(d.heading?.toLowerCase().trim())) {
            newAdditionalHeadings.push({
                heading: d.heading,
                itemCount: d.items?.length || 1
            });
        }
    }

    // 6. ATS Score Comparison
    const prevScore = previousAts?.overallAtsScore ?? 0;
    const currScore = currentAts?.overallAtsScore ?? 0;
    const scoreDelta = currScore - prevScore;

    // 7. Executive Summary of Changes
    const highlights = [];
    if (scoreDelta > 0) highlights.push(`ATS score improved by +${scoreDelta} points (${prevScore} → ${currScore})`);
    if (addedSkills.length > 0) highlights.push(`Added ${addedSkills.length} new technical skills`);
    if (addedPositions.length > 0) highlights.push(`Added ${addedPositions.length} new career role(s)`);
    if (monthsDelta > 0) highlights.push(`Experience increased by ${(monthsDelta / 12).toFixed(1)} years`);
    if (newAdditionalHeadings.length > 0) highlights.push(`Discovered ${newAdditionalHeadings.length} new custom section(s): ${newAdditionalHeadings.map(h => h.heading).join(', ')}`);

    return {
        summary: highlights.length > 0 ? highlights : ['No major differences detected between resumes.'],
        scoreComparison: {
            previousScore: prevScore,
            currentScore: currScore,
            delta: scoreDelta,
            improved: scoreDelta > 0
        },
        personalChanges,
        summaryChanged,
        skillsDiff: {
            addedSkills,
            removedSkills,
            retainedSkills,
            addedSoftSkills,
            totalPrevious: rawPrevSkills.length,
            totalCurrent: rawCurrSkills.length
        },
        experienceDiff: {
            previousPositionsCount: prevExp.length,
            currentPositionsCount: currExp.length,
            addedPositions,
            monthsDelta,
            previousTenure: prev.experienceMetrics?.formattedExperience || '0 mos',
            currentTenure: curr.experienceMetrics?.formattedExperience || '0 mos'
        },
        additionalDetailsDiff: {
            previousCount: (prev.additionalDetails || []).length,
            currentCount: currDetails.length,
            newHeadings: newAdditionalHeadings
        }
    };
}

module.exports = {
    compareResumes
};
