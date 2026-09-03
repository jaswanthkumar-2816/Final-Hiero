document.addEventListener("DOMContentLoaded", () => {
  // Use the current origin for analysis API
  const BACKEND_URL = "";
  console.log("🔍 Using unified backend API");
  const form = document.getElementById("analyze-form");
  const loadingOverlay = document.getElementById("loading-overlay");
  const analyzeBtn = document.getElementById("analyze-btn");
  const validationBox = document.getElementById('validation-errors');
  const validationText = document.getElementById('validation-errors-text');
  const jdTextWrapper = document.getElementById('jd-text-wrapper');
  const jdFileWrapper = document.getElementById('jd-file-wrapper');

  // === Toggle JD input mode ===
  document.querySelectorAll('input[name="jd_mode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const mode = document.querySelector('input[name="jd_mode"]:checked').value;
      if (mode === 'text') {
        if (jdTextWrapper) jdTextWrapper.style.display = 'block';
        if (jdFileWrapper) jdFileWrapper.style.display = 'none';
      } else {
        if (jdTextWrapper) jdTextWrapper.style.display = 'none';
        if (jdFileWrapper) jdFileWrapper.style.display = 'block';
      }
    });
  });

  if (!form) {
    console.error("Form not found. Check 'analysis.html' for <form id='analyze-form'>.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const resume = document.getElementById('resume')?.files?.[0];
    const jdFile = document.getElementById('jd')?.files?.[0];
    const jdTextEl = document.getElementById('jd-text');
    const jdMode = document.querySelector('input[name="jd_mode"]:checked')?.value || 'file';
    const errors = [];

    if (!resume) errors.push('Upload your resume as a PDF or TXT file.');
    if (jdMode === 'file' && !jdFile) errors.push('Upload a job-description file or switch to pasted text.');
    if (jdMode === 'text' && !jdTextEl?.value.trim()) errors.push('Paste the job description before analysing.');

    if (errors.length) {
      showValidationErrors({ details: errors });
      return;
    }

    if (!loadingOverlay) {
      showValidationErrors({ details: 'The analysis screen could not start. Refresh the page and try again.' });
      return;
    }

    const formData = new FormData();
    formData.append('resume', resume);
    if (jdMode === 'file') {
      formData.append('jd', jdFile);
    } else {
      formData.append('jd_text', jdTextEl.value.trim());
    }

    const animationState = startLoadingAnimation();
    if (analyzeBtn) analyzeBtn.disabled = true;

    try {
      const response = await fetch('/api/analysis/analyze', {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        throw new Error(result.details || result.error || `Analysis failed (${response.status}).`);
      }

      const raw = result.data || result;
      await finishLoadingAnimation(animationState, raw.score || 0);

      const rawMatched = Array.isArray(raw.matchedSkills) ? raw.matchedSkills : [];
      const rawMissing = Array.isArray(raw.missingSkills) ? raw.missingSkills : [];
      const rawResume = Array.isArray(raw.resumeSkills) ? raw.resumeSkills : [];
      const rawJD = Array.isArray(raw.jdSkills) ? raw.jdSkills : [];
      const jdSet = new Set(rawJD.map((skill) => skill.toLowerCase().trim()));
      const matchedSet = new Set(rawMatched.map((skill) => skill.toLowerCase().trim()));
      const computedExtra = rawResume.filter((skill) => skill && !jdSet.has(skill.toLowerCase().trim()) && !matchedSet.has(skill.toLowerCase().trim()));

      const transformedData = {
        score: Math.min(Math.max(parseInt(raw.score, 10) || 0, 0), 100),
        domain: raw.domain || 'it',
        jobTitle: raw.jobTitle || '',
        jdSkills: rawJD,
        resumeSkills: rawResume,
        matchedSkills: rawMatched,
        missingSkills: rawMissing,
        extraSkills: Array.isArray(raw.extraSkills) && raw.extraSkills.length ? raw.extraSkills : computedExtra,
        skillToLearnFirst: raw.skillToLearnFirst || rawMissing[0] || '',
        projectSuggestions: generateProjectSuggestions(raw),
        learningTrack: Array.isArray(raw.learningTrack) ? raw.learningTrack : [],
        recruiterInsights: raw.recruiterInsights || null,
        interviewChance: raw.interviewChance || null,
        scoreBreakdown: raw.scoreBreakdown || null,
        atsScore: raw.atsScore || null,
        atsKeywords: raw.atsKeywords || null,
        atsFormatting: raw.atsFormatting || null,
        atsReadability: raw.atsReadability || null,
        atsStructure: raw.atsStructure || null,
        atsActionVerbs: raw.atsActionVerbs || null,
        experience: raw.experience || [],
        education: raw.education || [],
        summary: raw.summary || null,
        resumeText: raw.resumeText || '',
        jdText: raw.jdText || '',
      };

      const storageData = {
        success: true,
        data: transformedData,
        rawData: raw,
        learningPlan: raw.learningPlan || [],
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('analysisResult', JSON.stringify(storageData));
      localStorage.setItem('hieroLearningPlan', JSON.stringify(raw.learningPlan || []));
      localStorage.setItem('hieroInterviewContext', JSON.stringify({
        jobTitle: transformedData.jobTitle || '',
        company: '',
        jdText: transformedData.jdText || '',
        resumeText: transformedData.resumeText || '',
        score: transformedData.score,
        timestamp: storageData.timestamp
      }));

      setTimeout(() => { window.location.href = 'result.html'; }, 800);
    } catch (error) {
      console.error('Analysis error:', error);
      animationState.stop();
      loadingOverlay.classList.remove('visible');
      showValidationErrors({ details: error.message || 'Analysis failed. Please try again.' });
      if (analyzeBtn) analyzeBtn.disabled = false;
    }
  });

  function startLoadingAnimation() {
    const overlay = document.getElementById('loading-overlay');
    const logo = document.getElementById('manifesting-logo');
    const titleEl = document.getElementById('loader-title');
    
    if (overlay) overlay.classList.add('visible');
    
    let progress = 0;
    const stages = [
      { id: 'stage-1', threshold: 0 },
      { id: 'stage-2', threshold: 35 },
      { id: 'stage-3-real', threshold: 70 }
    ];

    const interval = setInterval(() => {
      if (progress < 95) {
        progress += Math.random() * 0.8; 
        updateUI(progress);
      }
    }, 200);

    function updateUI(p) {
      if (logo) {
        const opacity = Math.min(p / 100, 1);
        const blur = 10 - (p / 100 * 10);
        const scale = 0.9 + (p / 100 * 0.1);
        logo.style.opacity = opacity;
        logo.style.filter = `blur(${blur}px) brightness(${0.5 + (p/100*0.5)}) drop-shadow(0 0 ${p/8}px var(--primary-accent))`;
        logo.style.transform = `scale(${scale})`;
      }

      stages.forEach(s => {
        const el = document.getElementById(s.id);
        if (!el) return;
        if (p >= s.threshold) {
          if (p >= s.threshold + 30 || p >= 90) {
            el.classList.add('completed');
            el.classList.remove('active');
          } else {
            el.classList.add('active');
          }
        }
      });
    }

    return {
      stop: () => clearInterval(interval),
      updateFinal: (p) => updateUI(p),
      container: overlay,
      title: titleEl
    };
  }

  async function finishLoadingAnimation(state, score) {
    state.stop();
    state.updateFinal(100);
    
    ['stage-1', 'stage-2', 'stage-3-real'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.remove('active');
        el.classList.add('completed');
        const icon = el.querySelector('.stage-icon i');
        if (icon) icon.className = 'fa-solid fa-check';
      }
    });

    const title = state.title;
    if (title) {
      title.innerHTML = `Match Score <span>${score}%</span>`;
    }
  }

  function showValidationErrors(errJson) {
    if (!validationBox || !validationText) return;
    const details = errJson.details || errJson.error || 'Validation failed.';
    validationText.textContent = Array.isArray(details) ? details.join(' ') : String(details);
    validationBox.style.display = 'block';
  }

  function generateProjectSuggestions(raw) {
    if (Array.isArray(raw.projectSuggestions) && raw.projectSuggestions.length > 0) {
      return raw.projectSuggestions;
    }
    const missing = Array.isArray(raw.missingSkills) ? raw.missingSkills : [];
    const skill1 = missing[0] || 'Full-Stack Web Dev';
    const skill2 = missing[1] || 'REST APIs';
    return [
      `Build an end-to-end Application featuring ${skill1} with authentication and dashboard analytics.`,
      `Develop a scalable Microservice leveraging ${skill2} and automated unit testing workflows.`,
      `Create an Open-Source Tool or library integrating ${skill1} and ${skill2} for real-time data processing.`
    ];
  }
});
