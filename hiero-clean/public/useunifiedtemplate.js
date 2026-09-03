/**
 * useunifiedtemplate.js
 * ─────────────────────────────────────────────────────
 * Single source of truth for populating the resume
 * builder form from imported / parsed resume data.
 *
 * Implements smart limits for a perfect single-page
 * layout and notifies the user of the adjustments.
 *
 * Call: window.fillFormWithImportedData(data)
 * ─────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ── Helpers ── */
  const val  = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
  const str  = (v)     => (Array.isArray(v) ? v.join(', ') : (v || '')).trim();
  const arr  = (v)     => (Array.isArray(v) ? v : (v ? [v] : []));
  const has  = (v)     => {
    if (!v) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') return Object.keys(v).length > 0;
    return String(v).trim().length > 0;
  };

  /* ── Page-Fit Statistics tracking ── */
  let importStats = {};

  /* Helper to limit array items and track stats */
  function limitArray(list, max) {
    const rawList = arr(list);
    return {
      items: rawList.slice(0, max),
      total: rawList.length,
      imported: Math.min(rawList.length, max),
      truncated: rawList.length > max
    };
  }

  /* Helper to limit flat strings/arrays and track stats */
  function limitFlatField(v, maxItems) {
    if (!v) return { text: '', total: 0, imported: 0, truncated: false };
    const items = Array.isArray(v) ? v : String(v).split(/,\s*/).filter(Boolean);
    const sliced = items.slice(0, maxItems);
    return {
      text: sliced.join(', '),
      total: items.length,
      imported: sliced.length,
      truncated: items.length > maxItems
    };
  }

  /* Helper to limit text content length and track stats */
  function limitTextLength(text, maxChars) {
    if (!text) return { text: '', total: 0, imported: 0, truncated: false };
    const cleanText = String(text).trim();
    if (cleanText.length <= maxChars) {
      return { text: cleanText, total: cleanText.length, imported: cleanText.length, truncated: false };
    }
    let truncated = cleanText.substring(0, maxChars);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 0) {
      truncated = truncated.substring(0, lastSpace);
    }
    return {
      text: truncated + '...',
      total: cleanText.length,
      imported: truncated.length,
      truncated: true
    };
  }

  /* ── Show / hide a whole section ── */
  function setSection(id, visible) {
    const el = document.getElementById(id);
    if (!el) return;
    const link = el.querySelector('.skip-link');
    if (!link) return;
    const isSkipped = el.classList.contains('skipped');
    if (visible && isSkipped)   link.click();   // un-skip → show
    if (!visible && !isSkipped) link.click();   // skip → hide
  }

  /* ── Show / hide an individual optional field group ── */
  function setField(groupId, fieldKey, visible) {
    const group = document.getElementById(groupId);
    if (!group) return;
    const span = group.querySelector('.field-skip');
    if (!span) return;
    const isSkipped = group.classList.contains('skipped');
    if (visible && isSkipped)   { if (typeof skipField === 'function') skipField(fieldKey); }
    if (!visible && !isSkipped) { if (typeof skipField === 'function') skipField(fieldKey); }
  }

  /* ── Dynamic containers with Smart Limits for Single Page ── */
  function fillExperience(data) {
    const container = document.getElementById('experienceContainer');
    if (!container) return;
    container.innerHTML = '';
    
    // Capped at 2 experiences for single page
    const res = limitArray(data.experience, 2);
    importStats.experience = res;

    res.items.forEach((exp, i) => {
      if (typeof addExperience === 'function') addExperience();
      const jobTitles  = document.getElementsByName('jobTitle[]');
      const companies  = document.getElementsByName('company[]');
      const startDates = document.getElementsByName('startDate[]');
      const endDates   = document.getElementsByName('endDate[]');
      const descs      = document.getElementsByName('jobDescription[]');
      if (jobTitles[i])  jobTitles[i].value  = exp.jobTitle  || '';
      if (companies[i])  companies[i].value  = exp.company   || '';
      if (startDates[i]) startDates[i].value = (exp.startDate || '').match(/\d{4}-\d{2}/) ? exp.startDate : '';
      const isPresent = !exp.endDate || /present|current/i.test(exp.endDate);
      if (isPresent) {
        const cb = container.querySelectorAll('.experience-item')[i]?.querySelector('input[type="checkbox"]');
        if (cb) { cb.checked = true; if (typeof toggleWorking === 'function') toggleWorking(cb); }
      } else if (endDates[i]) {
        endDates[i].value = (exp.endDate || '').match(/\d{4}-\d{2}/) ? exp.endDate : '';
      }
      if (descs[i]) descs[i].value = exp.description || exp.responsibilities || '';
    });
  }

  function fillEducation(data) {
    const container = document.getElementById('educationContainer');
    if (!container) return;
    container.innerHTML = '';

    // Capped at 2 education entries for single page
    const res = limitArray(data.education, 2);
    importStats.education = res;

    res.items.forEach((edu, i) => {
      if (typeof addEducation === 'function') addEducation();
      const degrees = document.getElementsByName('degree[]');
      const schools = document.getElementsByName('school[]');
      const years   = document.getElementsByName('gradYear[]');
      const gpas    = document.getElementsByName('gpa[]');
      if (degrees[i]) degrees[i].value = edu.degree  || '';
      if (schools[i]) schools[i].value = edu.school  || '';
      if (years[i])   years[i].value   = edu.gradYear || '';
      if (gpas[i])    gpas[i].value    = edu.gpa      || '';
    });
  }

  function fillInternships(data) {
    const container = document.getElementById('internshipsContainer');
    if (!container) return;

    // Capped at 2 internships for single page
    const res = limitArray(data.internships, 2);
    importStats.internships = res;

    if (!res.items.length) return;
    container.innerHTML = '';
    res.items.forEach((intern, i) => {
      if (typeof addInternship === 'function') addInternship();
      const roles  = document.getElementsByName('internRole[]');
      const orgs   = document.getElementsByName('internOrg[]');
      const starts = document.getElementsByName('internStart[]');
      const ends   = document.getElementsByName('internEnd[]');
      const descs  = document.getElementsByName('internDesc[]');
      if (roles[i])  roles[i].value  = intern.jobTitle || intern.role  || '';
      if (orgs[i])   orgs[i].value   = intern.company  || intern.org   || '';
      if (starts[i]) starts[i].value = intern.startDate || intern.start || '';
      if (ends[i])   ends[i].value   = intern.endDate  || intern.end   || '';
      if (descs[i])  descs[i].value  = intern.description || intern.desc || '';
    });
  }

  function fillProjects(data) {
    const container = document.getElementById('projectsContainer');
    if (!container) return;
    container.innerHTML = '';

    // Capped at 2 projects for single page
    const res = limitArray(data.projects, 2);
    importStats.projects = res;

    res.items.forEach((project, i) => {
      if (typeof addProject === 'function') addProject();
      const names    = document.getElementsByName('projectName[]');
      const techs    = document.getElementsByName('projectTech[]');
      const durations= document.getElementsByName('projectDuration[]');
      const descs    = document.getElementsByName('projectDescription[]');
      const links    = document.getElementsByName('projectLink[]');
      const achs     = document.getElementsByName('projectAchievement[]');
      if (names[i])     names[i].value     = project.name        || '';
      if (techs[i])     techs[i].value     = project.tech        || project.technologies || '';
      if (durations[i]) durations[i].value = project.duration    || '';
      if (descs[i])     descs[i].value     = project.description || '';
      if (links[i])     links[i].value     = project.link        || '';
      if (achs[i])      achs[i].value      = project.achievement || '';
    });
  }

  function fillReferences(data) {
    const container = document.getElementById('referencesContainer');
    if (!container) return;

    // Capped at 1 reference for single page
    const res = limitArray(data.references, 1);
    importStats.references = res;

    if (!res.items.length) return;
    container.innerHTML = '';
    res.items.forEach((ref, i) => {
      if (typeof addReference === 'function') addReference();
      const names     = document.getElementsByName('refName[]');
      const titles    = document.getElementsByName('refTitle[]');
      const companies = document.getElementsByName('refCompany[]');
      const phones    = document.getElementsByName('refPhone[]');
      const emails    = document.getElementsByName('refEmail[]');
      if (names[i])     names[i].value     = ref.name    || '';
      if (titles[i])    titles[i].value    = ref.title   || '';
      if (companies[i]) companies[i].value = ref.company || '';
      if (phones[i])    phones[i].value    = ref.phone   || '';
      if (emails[i])    emails[i].value    = ref.email   || '';
    });
  }

  function fillCustomDetails(data) {
    const container = document.getElementById('customDetailsContainer');
    if (!container) return;

    // Capped at 1 custom detail for single page
    const res = limitArray(data.customDetails, 1);
    importStats.customDetails = res;

    if (!res.items.length) return;
    container.innerHTML = '';
    res.items.forEach((detail, i) => {
      if (typeof addCustomDetail === 'function') addCustomDetail();
      const headings = document.getElementsByName('customHeading[]');
      const contents = document.getElementsByName('customContent[]');
      if (headings[i]) headings[i].value = detail.heading || '';
      if (contents[i]) contents[i].value = detail.content || '';
    });
  }

  /* Render visual Page-Fit Warning/Notice banner */
  function renderPageFitNotice() {
    let banner = document.getElementById('pageFitNotice');
    if (!banner) {
      const form = document.getElementById('resumeForm');
      if (!form) return;
      banner = document.createElement('div');
      banner.id = 'pageFitNotice';
      banner.style.cssText = `
        background: rgba(255, 173, 51, 0.08);
        border: 1px solid rgba(255, 173, 51, 0.3);
        border-radius: 12px;
        padding: 18px;
        margin-bottom: 25px;
        color: #fff;
        font-family: inherit;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        animation: fadeIn 0.4s ease;
      `;
      form.parentNode.insertBefore(banner, form);
    }

    let detailsHtml = '';
    let anyTruncated = false;

    const sections = [
      { key: 'summary', name: 'Professional Summary', unit: 'characters' },
      { key: 'experience', name: 'Work Experience', unit: 'items' },
      { key: 'internships', name: 'Internships', unit: 'items' },
      { key: 'projects', name: 'Projects', unit: 'items' },
      { key: 'education', name: 'Education', unit: 'items' },
      { key: 'technicalSkills', name: 'Technical Skills', unit: 'skills' },
      { key: 'softSkills', name: 'Soft Skills', unit: 'skills' },
      { key: 'certifications', name: 'Certifications', unit: 'items' },
      { key: 'achievements', name: 'Achievements', unit: 'items' },
      { key: 'publications', name: 'Publications', unit: 'items' },
      { key: 'references', name: 'References', unit: 'items' }
    ];

    sections.forEach(sec => {
      const stats = importStats[sec.key];
      if (stats && stats.total > 0) {
        if (stats.truncated) {
          anyTruncated = true;
          detailsHtml += `<li style="margin-bottom: 6px; color: #ffad33; display: flex; align-items: center; gap: 8px;">
            <span style="display:inline-block; width:6px; height:6px; background:#ffad33; border-radius:50%;"></span>
            <strong>${sec.name}</strong>: Capped at ${stats.imported} ${sec.unit} (out of ${stats.total} imported) to fit one page.
          </li>`;
        } else {
          detailsHtml += `<li style="margin-bottom: 6px; color: #2ae023; display: flex; align-items: center; gap: 8px;">
            <span style="display:inline-block; width:6px; height:6px; background:#2ae023; border-radius:50%;"></span>
            <strong>${sec.name}</strong>: Filled all ${stats.imported} ${sec.unit}.
          </li>`;
        }
      }
    });

    if (!anyTruncated) {
      banner.style.background = 'rgba(42, 224, 35, 0.08)';
      banner.style.borderColor = 'rgba(42, 224, 35, 0.3)';
      banner.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-weight: bold; font-size: 15px; display: flex; align-items: center; gap: 8px; color: #2ae023;">
            <i class="fas fa-check-circle"></i> Perfect Page Fit!
          </span>
          <button type="button" onclick="document.getElementById('pageFitNotice').style.display='none'" style="background: none; border: none; color: #aaa; cursor: pointer; font-size: 18px; line-height: 1; outline: none;">&times;</button>
        </div>
        <p style="font-size: 13px; margin: 0; color: #ddd; line-height: 1.4;">
          Your resume data fits perfectly within the single-page constraints! No sections were truncated.
        </p>
      `;
    } else {
      banner.style.background = 'rgba(255, 173, 51, 0.08)';
      banner.style.borderColor = 'rgba(255, 173, 51, 0.3)';
      banner.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-weight: bold; font-size: 15px; display: flex; align-items: center; gap: 8px; color: #ffad33;">
            <i class="fas fa-exclamation-triangle"></i> One-Page Layout Optimized
          </span>
          <button type="button" onclick="document.getElementById('pageFitNotice').style.display='none'" style="background: none; border: none; color: #aaa; cursor: pointer; font-size: 18px; line-height: 1; outline: none;">&times;</button>
        </div>
        <p style="font-size: 13px; margin: 0 0 10px 0; color: #ddd; line-height: 1.4;">
          To ensure your resume fits perfectly on <strong>exactly one page</strong>, we optimized and capped content-heavy sections. You can review or manually adjust these limits below:
        </p>
        <ul style="font-size: 12px; margin: 0; padding-left: 5px; list-style: none; line-height: 1.6;">
          ${detailsHtml}
        </ul>
      `;
    }
    banner.style.display = 'block';
    banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ══════════════════════════════════════════════════
     MAIN EXPORT: fillFormWithImportedData(data)
  ══════════════════════════════════════════════════ */
  window.fillFormWithImportedData = function (data) {
    try {
      console.log('[UnifiedTemplate] Filling form with data:', data);
      importStats = {}; // Reset stats

      /* Preserve template */
      const preservedTemplate = (typeof selectedTemplate !== 'undefined' && selectedTemplate)
        || localStorage.getItem('selectedTemplate');
      if (typeof clearForm === 'function') clearForm(true);
      if (preservedTemplate) {
        if (typeof selectedTemplate !== 'undefined') window.selectedTemplate = preservedTemplate;
        localStorage.setItem('selectedTemplate', preservedTemplate);
      }

      /* ── 1. Personal Info ── */
      const pi = data.personalInfo || {};
      val('fullName',            pi.fullName);
      val('email',               pi.email);
      val('phone',               pi.phone);
      val('address',             pi.address);
      val('linkedin',            pi.linkedin  || data.linkedin);
      val('github',              pi.github    || data.github);
      val('website',             pi.website   || data.website);
      val('professionalTitle',   pi.professionalTitle   || data.professionalTitle);
      val('professionalHeadline',pi.professionalHeadline|| data.professionalHeadline);

      /* ── 2. Summary & Skills (with Smart Limits) ── */
      // Cap summary at 350 chars (~50-60 words) to avoid page overflow
      const summaryRes = limitTextLength(data.summary, 350);
      importStats.summary = summaryRes;
      val('summary', summaryRes.text);

      // Skill caps
      const techSkillsRes = limitFlatField(data.technicalSkills || data.skills, 15);
      importStats.technicalSkills = techSkillsRes;
      val('technicalSkills', techSkillsRes.text);

      const softSkillsRes = limitFlatField(data.softSkills, 8);
      importStats.softSkills = softSkillsRes;
      val('softSkills', softSkillsRes.text);

      /* ── 3. Additional flat fields (with Smart Limits) ── */
      const certsRes = limitFlatField(data.certifications, 4);
      importStats.certifications = certsRes;
      val('certifications', certsRes.text);

      const langRes = limitFlatField(data.languages, 4);
      importStats.languages = langRes;
      val('languages', langRes.text);

      const achRes = limitFlatField(data.achievements, 4);
      importStats.achievements = achRes;
      val('achievements', achRes.text);

      const hobRes = limitFlatField(data.hobbies, 4);
      importStats.hobbies = hobRes;
      val('hobbies', hobRes.text);

      const extraRes = limitFlatField(data.extraCurricular, 3);
      importStats.extraCurricular = extraRes;
      val('extraCurricular', extraRes.text);

      const pubRes = limitFlatField(data.publications, 2);
      importStats.publications = pubRes;
      val('publications', pubRes.text);

      val('additionalInfo', str(data.additionalInfo));

      /* ── 4. Dynamic sections ── */
      fillExperience(data);
      fillEducation(data);
      fillInternships(data);
      fillProjects(data);
      fillReferences(data);
      fillCustomDetails(data);

      /* ── 5. Custom sections from LLM ── */
      if (Array.isArray(data.customSections) && data.customSections.length) {
        const first = data.customSections[0];
        val('customSectionTitle',   first.title || 'Custom Section');
        val('customSectionContent', Array.isArray(first.items) ? first.items.join('\n• ') : (first.items || ''));
      }

      /* ── 6. Show/hide SECTIONS based on whether they have data ── */
      const secRules = [
        { id: 'section-summary',           keys: ['summary'] },
        { id: 'section-experience',         keys: ['experience'] },
        { id: 'section-education',          keys: ['education'] },
        { id: 'section-internships',        keys: ['internships'] },
        { id: 'section-projects',           keys: ['projects'] },
        { id: 'section-skills',             keys: ['technicalSkills', 'softSkills', 'skills'] },
        { id: 'section-additional-details', keys: ['certifications', 'languages'] },
        { id: 'section-additional',         keys: ['achievements', 'hobbies', 'extraCurricular', 'publications'] },
        { id: 'section-references',         keys: ['references'] },
        { id: 'section-custom',             keys: ['customDetails', 'customSections'] }
      ];
      secRules.forEach(rule => {
        const visible = rule.keys.some(k => has(data[k]));
        setSection(rule.id, visible);
      });

      /* ── 7. Show/hide INDIVIDUAL OPTIONAL FIELDS ── */
      const fieldRules = [
        { key: 'address',              group: 'group-address',              src: data.personalInfo?.address              || data.address },
        { key: 'linkedin',             group: 'group-linkedin',             src: data.personalInfo?.linkedin             || data.linkedin },
        { key: 'github',               group: 'group-github',               src: data.personalInfo?.github               || data.github },
        { key: 'website',              group: 'group-website',              src: data.personalInfo?.website              || data.website },
        { key: 'professionalTitle',    group: 'group-professionalTitle',    src: data.personalInfo?.professionalTitle    || data.professionalTitle },
        { key: 'professionalHeadline', group: 'group-professionalHeadline', src: data.personalInfo?.professionalHeadline || data.professionalHeadline },
        { key: 'certifications',       group: 'group-certifications',       src: data.certifications },
        { key: 'languages',            group: 'group-languages',            src: data.languages },
        { key: 'achievements',         group: 'group-achievements',         src: data.achievements },
        { key: 'hobbies',              group: 'group-hobbies',              src: data.hobbies },
        { key: 'extraCurricular',      group: 'group-extraCurricular',      src: data.extraCurricular },
        { key: 'publications',         group: 'group-publications',         src: data.publications }
      ];
      fieldRules.forEach(rule => {
        setField(rule.group, rule.key, has(rule.src));
      });

      /* ── 8. Final UI update ── */
      const templateSelection = document.getElementById('templateSelection');
      const formStepIndicator = document.getElementById('formStepIndicator');
      const mainLayout        = document.querySelector('.main-layout');
      const bottomActions     = document.querySelector('.bottom-actions');
      if (templateSelection) templateSelection.style.display = 'none';
      if (formStepIndicator) formStepIndicator.style.display = 'block';
      if (mainLayout)        mainLayout.style.display        = 'grid';
      if (bottomActions)     bottomActions.style.display     = 'flex';

      history.pushState({ step: 2, template: localStorage.getItem('selectedTemplate') }, '', '');
      localStorage.setItem('resumeData', JSON.stringify(data));

      console.log('[UnifiedTemplate] ✅ Form filled successfully.');
      
      // Render our smart page fit notice banner at the top of the form
      renderPageFitNotice();
      
      // Let the user know import was successful with optimizations
      alert('✅ Resume imported! We adjusted some section lengths for a perfect single-page layout. Review details at the top of the form.');
    } catch (err) {
      console.error('[UnifiedTemplate] ❌ Error:', err);
    }
  };

})();
