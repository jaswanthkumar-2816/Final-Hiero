/**
 * useunifiedtemplate.js
 * ─────────────────────────────────────────────────────
 * Single source of truth for populating the resume
 * builder form from imported / parsed resume data.
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

  /* ── Dynamic containers ── */
  function fillExperience(data) {
    const container = document.getElementById('experienceContainer');
    if (!container) return;
    container.innerHTML = '';
    arr(data.experience).forEach((exp, i) => {
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
    arr(data.education).forEach((edu, i) => {
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
    const interns = arr(data.internships);
    if (!interns.length) return;
    container.innerHTML = '';
    interns.forEach((intern, i) => {
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
    arr(data.projects).forEach((project, i) => {
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
    if (!arr(data.references).length) return;
    const container = document.getElementById('referencesContainer');
    if (!container) return;
    container.innerHTML = '';
    arr(data.references).forEach((ref, i) => {
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
    if (!arr(data.customDetails).length) return;
    const container = document.getElementById('customDetailsContainer');
    if (!container) return;
    container.innerHTML = '';
    arr(data.customDetails).forEach((detail, i) => {
      if (typeof addCustomDetail === 'function') addCustomDetail();
      const headings = document.getElementsByName('customHeading[]');
      const contents = document.getElementsByName('customContent[]');
      if (headings[i]) headings[i].value = detail.heading || '';
      if (contents[i]) contents[i].value = detail.content || '';
    });
  }

  /* ══════════════════════════════════════════════════
     MAIN EXPORT: fillFormWithImportedData(data)
  ══════════════════════════════════════════════════ */
  window.fillFormWithImportedData = function (data) {
    try {
      console.log('[UnifiedTemplate] Filling form with data:', data);

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

      /* ── 2. Summary & Skills ── */
      val('summary',        data.summary);
      val('technicalSkills',str(data.technicalSkills || data.skills));
      val('softSkills',     str(data.softSkills));

      /* ── 3. Additional flat fields ── */
      val('certifications', str(data.certifications));
      val('languages',      str(data.languages));
      val('achievements',   str(data.achievements));
      val('hobbies',        str(data.hobbies));
      val('extraCurricular',str(data.extraCurricular));
      val('publications',   str(data.publications));
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
      alert('✅ Resume imported! Review your details and generate.');
    } catch (err) {
      console.error('[UnifiedTemplate] ❌ Error:', err);
    }
  };

})();
