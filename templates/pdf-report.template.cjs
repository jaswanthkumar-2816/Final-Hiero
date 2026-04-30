/**
 * Hiero Analysis Report PDF Template
 * Location: /templates/pdf-report.template.cjs
 * High-resolution A4 layout for Puppeteer rendering
 */
module.exports = (data) => {
    const { score, domain, matchedSkills, missingSkills, projectSuggestions, skillToLearnFirst, timestamp } = data;
    
    const formatDate = (dateStr) => {
        try { return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
        catch(e) { return new Date().toLocaleDateString(); }
    }

    const renderSkills = (skills, type) => {
        if (!skills || !skills.length) return `<div class="empty-msg">No ${type} skills detected.</div>`;
        return skills.map(s => `<span class="skill-tag ${type}">${s}</span>`).join(' ');
    }

    const renderItems = (items) => {
        if (!items || !items.length) return `<li>Collecting more insights...</li>`;
        return items.map(i => `<li>${i}</li>`).join('');
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            
            :root {
                --primary: #1D9E75;
                --text-main: #0F172A;
                --text-muted: #64748B;
                --border: #E2E8F0;
                --bg-light: #F8FAFC;
            }

            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; color: var(--text-main); line-height: 1.5; padding: 40px; background: white; }

            /* Page Structure */
            .page-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--primary); padding-bottom: 20px; margin-bottom: 40px; }
            .brand h1 { font-weight: 800; font-size: 24px; color: var(--primary); letter-spacing: -0.5px; }
            .brand p { font-size: 12px; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }
            .report-meta { text-align: right; }
            .report-meta h2 { font-size: 14px; font-weight: 700; color: var(--text-main); }
            .report-meta p { font-size: 11px; color: var(--text-muted); }

            /* Score Card */
            .summary-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 30px; margin-bottom: 40px; }
            .score-card { background: var(--bg-light); border: 1px solid var(--border); border-radius: 16px; padding: 25px; text-align: center; }
            .score-card .val { font-size: 48px; font-weight: 800; color: var(--primary); line-height: 1; }
            .score-card .label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-top: 8px; }
            
            .summary-text h3 { font-size: 18px; margin-bottom: 10px; font-weight: 700; }
            .summary-text p { font-size: 14px; color: var(--text-muted); line-height: 1.6; }

            /* Sections */
            .section { margin-bottom: 35px; }
            .section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; color: var(--primary); letter-spacing: 1px; margin-bottom: 15px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }

            /* Skill Tags */
            .skill-list { display: flex; flex-wrap: wrap; gap: 8px; }
            .skill-tag { padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; display: inline-block; }
            .skill-tag.matched { background: #E1F5EE; color: #0F6E56; border: 1px solid #BCE5D8; }
            .skill-tag.missing { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }

            /* List Styling */
            ul { list-style: none; }
            li { position: relative; padding-left: 20px; font-size: 14px; margin-bottom: 10px; color: var(--text-muted); }
            li::before { content: "•"; position: absolute; left: 0; color: var(--primary); font-weight: 900; }

            .project-item { margin-bottom: 15px; }
            .project-item b { display: block; color: var(--text-main); font-size: 15px; margin-bottom: 4px; }

            /* Footer */
            .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); }
            
            /* Avoid page breaks inside sections */
            .section { page-break-inside: avoid; }
        </style>
    </head>
    <body>
        <header class="page-header">
            <div class="brand">
                <h1>HIERO AI</h1>
                <p>Growth Intelligence Report</p>
            </div>
            <div class="report-meta">
                <h2>Analysis Summary Report</h2>
                <p>Generated: ${formatDate(timestamp)}</p>
                <p>Target Domain: <b>${domain || 'Technology'}</b></p>
            </div>
        </header>

        <div class="summary-grid">
            <div class="score-card">
                <div class="val">${score}%</div>
                <div class="label">Match Score</div>
            </div>
            <div class="summary-text">
                <h3>Executive Summary</h3>
                <p>
                    ${score > 70 
                        ? 'Candidate shows strong alignment with core technical requirements. Specialized optimization recommended for top-tier competitive placement.' 
                        : 'Significant bridge potential identified. Following the recommended learning roadmap will substantially increase technical viability for the target role.'}
                </p>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Skills Analysis</div>
            <div style="margin-bottom: 20px;">
                <p style="font-size:12px; margin-bottom:8px; font-weight:700;">Matched Proficiencies:</p>
                <div class="skill-list">
                    ${renderSkills(matchedSkills, 'matched')}
                </div>
            </div>
            <div>
                <p style="font-size:12px; margin-bottom:8px; font-weight:700;">Critical Skill Gaps:</p>
                <div class="skill-list">
                    ${renderSkills(missingSkills, 'missing')}
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Resume Feedback & Tips</div>
            <ul>
                <li>Add measurable achievements with quantifiable metrics.</li>
                <li>Highlight <b>${skillToLearnFirst || 'Core Skills'}</b> in our professional profile.</li>
                <li>Ensure technical keywords match the job description precisely.</li>
                <li>Maintain a single-page format if under 5 years experience.</li>
            </ul>
        </div>

        <div class="section">
            <div class="section-title">Recommended Bridging Projects</div>
            ${Array.isArray(projectSuggestions) ? projectSuggestions.map(p => `
                <div class="project-item">
                    <b>${p}</b>
                    <p style="font-size:13px; color:var(--text-muted);">Self-directed project designed to validate mastery of missing skills.</p>
                </div>
            `).join('') : `<li>Building project recommendations...</li>`}
        </div>

        <div class="section">
            <div class="section-title">Learning Roadmap & Interview Focus</div>
            <p style="font-size:14px; margin-bottom:12px;">Immediate Focus: <b>${skillToLearnFirst}</b></p>
            <ul>
                <li>Prioritize understanding core architectural principles.</li>
                <li>Prepare for technical questions regarding ${matchedSkills.slice(0, 3).join(', ')}.</li>
                <li>Practice coding challenges for ${skillToLearnFirst}.</li>
            </ul>
        </div>

        <footer class="footer">
            <span>Generated by Hiero Intelligence &copy; 2026</span>
            <span>Ref: ANALYSIS-${Math.random().toString(36).substring(7).toUpperCase()}</span>
        </footer>
    </body>
    </html>
    `;
};
