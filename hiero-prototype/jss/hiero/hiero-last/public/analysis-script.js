document.addEventListener("DOMContentLoaded", () => {
  // Use the current origin for analysis API
  const BACKEND_URL = "";
  console.log("🔍 Using unified backend API");
  const form = document.getElementById("analyze-form");
  const loadingOverlay = document.getElementById("loading-overlay");
  const connectionStatus = document.getElementById("connection-status");
  const statusText = document.getElementById("status-text");
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

  // Test backend connection on page load
  async function testBackendConnection() {
    try {
      const response = await fetch(`/api/analysis/health`);
      const data = await response.json();
      if (response.ok && data.status === 'ok') {
        if (connectionStatus) {
          connectionStatus.style.display = "flex";
          connectionStatus.style.backgroundColor = "";
          connectionStatus.style.color = "";
        }
        if (statusText) statusText.textContent = "AI Engine Online";
        if (analyzeBtn) analyzeBtn.disabled = false;
      } else {
        throw new Error("Health check failed");
      }
    } catch (error) {
      console.warn("Primary health check warning:", error.message);
      // Fallback check against API root
      try {
        const rootCheck = await fetch("/api/me");
        if (rootCheck.ok || rootCheck.status === 401) {
          if (connectionStatus) connectionStatus.style.display = "flex";
          if (statusText) statusText.textContent = "AI Engine Online";
          if (analyzeBtn) analyzeBtn.disabled = false;
          return;
        }
      } catch (e) {}

      if (connectionStatus) {
        connectionStatus.style.display = "flex";
        connectionStatus.style.backgroundColor = "#f8d7da";
        connectionStatus.style.color = "#721c24";
      }
      if (statusText) statusText.textContent = "❌ Backend connection failed. Please ensure the server is running.";
      if (analyzeBtn) analyzeBtn.disabled = false; // Allow user attempt
    }
  }

  // Test connection when page loads
  testBackendConnection();

  // Enhanced Analysis Form Handler with Detailed Logging
  const analyzeForm = document.getElementById('analyze-form');
  if (analyzeForm) {
    analyzeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      // Reset validation box
      if (validationBox) { validationBox.style.display = 'none'; validationText.innerHTML = ''; }

      const resume = document.getElementById('resume')?.files?.[0];
      const jdFile = document.getElementById('jd')?.files?.[0];
      const jdTextEl = document.getElementById("jd-text");
      const jdMode = document.querySelector('input[name="jd_mode"]:checked')?.value || 'file';

      console.log('📝 Analysis Form submitted');

      // Validation
      if (!resume) { alert("Please upload your resume PDF."); return; }
      if (jdMode === 'file' && !jdFile) { alert("Please upload the job description file or switch to text mode."); return; }
      if (jdMode === 'text' && (!jdTextEl || !jdTextEl.value.trim())) { alert("Please paste the job description text."); return; }

      if (!loadingOverlay) { console.error("Loading overlay not found."); return; }
      
      // Start dynamic animation
      const animationState = startLoadingAnimation();

      const formData = new FormData();
      if (jdMode === 'text') {
        const text = jdTextEl.value.trim();
        formData.append('jd_text', text);
        formData.append('jd', text); 
        formData.append('description', text); 
      }
      
      formData.append('resume', resume);
      if (jdMode === 'file' && jdFile) {
        formData.append('jd', jdFile);
      }

      try {
        const analyzeUrl = `/api/analysis/analyze`;
        console.log('📤 Sending to backend:', analyzeUrl);
        const response = await fetch(analyzeUrl, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } });
        
        if (response.status === 422) {
          const errJson = await response.json().catch(() => ({}));
          showValidationErrors(errJson);
          loadingOverlay.classList.remove('visible');
          animationState.stop();
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        // Unwrap backend's { success: true, data: {...} } wrapper if present
        const raw = (result && result.data) ? result.data : result;

        // Finish animation before redirect
        await finishLoadingAnimation(animationState, raw.score || result.score || 0);

        const rawMatched = Array.isArray(raw.matchedSkills)  ? raw.matchedSkills
                         : Array.isArray(raw.matched)        ? raw.matched
                         : Array.isArray(raw.presentSkills)  ? raw.presentSkills
                         : [];

        const rawMissing = Array.isArray(raw.missingSkills) ? raw.missingSkills
                         : Array.isArray(raw.missing)        ? raw.missing
                         : [];

        const rawResume  = Array.isArray(raw.resumeSkills) ? raw.resumeSkills : [];
        const rawJD      = Array.isArray(raw.jdSkills)     ? raw.jdSkills     : [];

        // Extra skills = skills in resume NOT found in JD (bonus skills)
        const matchedSet = new Set(rawMatched.map(s => s.toLowerCase().trim()));
        const jdSet      = new Set(rawJD.map(s => s.toLowerCase().trim()));
        const computedExtra = rawResume.filter(s =>
          s && !jdSet.has(s.toLowerCase().trim()) && !matchedSet.has(s.toLowerCase().trim())
        );
        const rawExtra = Array.isArray(raw.extraSkills) && raw.extraSkills.length > 0
          ? raw.extraSkills : computedExtra;

        const transformedData = {
          score:              Math.min(Math.max(parseInt(raw.score) || 0, 0), 100),
          domain:             raw.domain || 'it',
          jdSkills:           rawJD,
          resumeSkills:       rawResume,
          matchedSkills:      rawMatched,
          missingSkills:      rawMissing,
          extraSkills:        rawExtra,
          skillToLearnFirst:  raw.skillToLearnFirst || rawMissing[0] || 'JavaScript',
          projectSuggestions: generateProjectSuggestions(raw),
          atsScore:           raw.atsScore        || null,
          atsKeywords:        raw.atsKeywords     || null,
          atsFormatting:      raw.atsFormatting   || null,
          atsReadability:     raw.atsReadability  || null,
          atsStructure:       raw.atsStructure    || null,
          atsActionVerbs:     raw.atsActionVerbs  || null,
          experience:         raw.experience      || [],
          education:          raw.education       || [],
          summary:            raw.summary         || null,
        };

        const storageData = { success: true, data: transformedData, rawData: raw, learningPlan: raw.learningPlan || [], timestamp: new Date().toISOString() };
        localStorage.setItem('analysisResult', JSON.stringify(storageData));
        localStorage.setItem('hieroLearningPlan', JSON.stringify(raw.learningPlan || []));

        setTimeout(() => { window.location.href = 'result.html'; }, 800);
      } catch (error) {
        console.error('❌ Error during analysis:', error.message);
        animationState.stop();
        if (loadingOverlay) loadingOverlay.classList.remove('visible');
        alert('Analysis failed: ' + error.message);
      }
    });
  } else {
    console.warn('⚠️ analyze-form not found on this page');
  }

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
    validationText.innerHTML = typeof details === 'string' ? details : JSON.stringify(details);
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
