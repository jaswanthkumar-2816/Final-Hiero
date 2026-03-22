document.addEventListener("DOMContentLoaded", () => {
  // Use the same server for analysis
  const BACKEND_URL = "";
  console.log("🔍 Using backend:", BACKEND_URL);
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
        jdTextWrapper.style.display = 'block';
        jdFileWrapper.style.display = 'none';
      } else {
        jdTextWrapper.style.display = 'none';
        jdFileWrapper.style.display = 'block';
      }
    });
  });

  if (!form) {
    console.error("Form not found. Check 'analysis.html' for <form id='analyze-form'>.");
    alert("Form setup error. Please refresh or check the page.");
    return;
  }

  // Test backend connection on page load
  async function testBackendConnection() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/analysis/health`);
      const data = await response.json();
      if (response.ok && data.status === 'ok') {
        connectionStatus.style.display = "flex";
        statusText.textContent = "";
        analyzeBtn.disabled = false;
      } else {
        throw new Error("Health check failed");
      }
    } catch (error) {
      connectionStatus.style.display = "block";
      connectionStatus.style.backgroundColor = "#f8d7da";
      connectionStatus.style.color = "#721c24";
      statusText.textContent = "❌ Backend connection failed. Please ensure the analysis server is running";
      analyzeBtn.disabled = true;
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

      const resume = document.getElementById('resume').files[0];
      const jdFile = document.getElementById('jd')?.files?.[0];
      const jdTextEl = document.getElementById("jd-text");
      const jdMode = document.querySelector('input[name="jd_mode"]:checked')?.value || 'file';

      console.log('📝 Form submitted');

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
      if (jdMode === 'file') {
        formData.append('jd', jdFile);
      }

      try {
        const analyzeUrl = `${BACKEND_URL}/api/analysis/analyze`;
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

        // Finish animation before redirect
        await finishLoadingAnimation(animationState, result.score || 0);

        const transformedData = {
          score: Math.min(Math.max(parseInt(result.score) || 0, 0), 100),
          domain: result.domain || 'it',
          jdSkills: Array.isArray(result.jdSkills) ? result.jdSkills : [],
          resumeSkills: Array.isArray(result.resumeSkills) ? result.resumeSkills : [],
          matchedSkills: Array.isArray(result.matchedSkills) ? result.matchedSkills : (Array.isArray(result.matched) ? result.matched : []),
          missingSkills: Array.isArray(result.missingSkills) ? result.missingSkills : (Array.isArray(result.missing) ? result.missing : []),
          extraSkills: Array.isArray(result.extraSkills) ? result.extraSkills : [],
          skillToLearnFirst: (result.skillToLearnFirst) ? result.skillToLearnFirst : ((result.missingSkills && result.missingSkills.length > 0) ? result.missingSkills[0] : 'JavaScript'),
          projectSuggestions: generateProjectSuggestions(result)
        };

        const storageData = { success: true, data: transformedData, rawData: result, learningPlan: result.learningPlan || [], timestamp: new Date().toISOString() };
        localStorage.setItem('analysisResult', JSON.stringify(storageData));
        localStorage.setItem('hieroLearningPlan', JSON.stringify(result.learningPlan || []));

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
    const beam = document.getElementById('manifest-beam');
    const titleEl = document.getElementById('loader-title');
    
    overlay.classList.add('visible');
    
    let progress = 0;
    const stages = [
      { id: 'stage-1', threshold: 0 },
      { id: 'stage-2', threshold: 35 },
      { id: 'stage-3-real', threshold: 70 }
    ];

    const interval = setInterval(() => {
      if (progress < 95) {
        // To reach 95% in ~30s with 200ms interval:
        // 30,000 / 200 = 150 increments.
        // 95 / 150 = 0.63 average increment.
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
    
    // Mark all as completed
    ['stage-1', 'stage-2', 'stage-3-real'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.remove('active');
        el.classList.add('completed');
        const icon = el.querySelector('.stage-icon i');
        if (icon) icon.className = 'fa-solid fa-check';
      }
    });

    state.title.innerHTML = 'Analysis <span>Complete!</span>';
    document.getElementById('loader-subtitle').textContent = `Match Score: ${score}% - Generating report...`;
    
    return new Promise(r => setTimeout(r, 1000));
  }

  function showValidationErrors(err) {
    if (!validationBox || !validationText) return;
    const messages = [];
    if (err && err.type === 'invalid_jd') {
      messages.push('Job Description file appears invalid or incomplete. Upload a proper JD with sections like Roles, Responsibilities, Requirements.');
    } else if (err && err.type === 'invalid_resume') {
      messages.push('Resume appears invalid (too short or missing sections). Ensure it includes Education, Experience, Skills, Projects etc.');
    } else if (err && err.message) {
      messages.push(err.message);
    } else {
      messages.push('Unknown validation failure. Please re-check files.');
    }
    if (err && typeof err.detectedLength === 'number') {
      messages.push(`Detected text length: ${err.detectedLength}`);
    }
    validationText.innerHTML = messages.map(m => `<div>• ${escapeHtml(m)}</div>`).join('');
    validationBox.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function generateProjectSuggestions(result) {
    const projects = [];
    if (result.projectSuggestions && Array.isArray(result.projectSuggestions)) {
      result.projectSuggestions.forEach(p => {
        if (typeof p === 'string' && p.trim()) projects.push(p);
        else if (typeof p === 'object' && p.title) projects.push(p.title);
        else if (typeof p === 'object' && p.name) projects.push(p.name);
      });
    }
    if (projects.length === 0 && result.learningPlan && Array.isArray(result.learningPlan)) {
      result.learningPlan.forEach(plan => {
        if (plan.miniProjects && Array.isArray(plan.miniProjects)) {
          plan.miniProjects.forEach(proj => {
            if (typeof proj === 'string' && proj.trim()) projects.push(proj);
          });
        }
      });
    }
    if (projects.length === 0) {
      const domain = result.domain || 'it';
      const suggestions = {
        it: ['Build a REST API service', 'Create a Full-Stack Web App', 'Develop a Data Visualization Dashboard'],
        hr: ['HR Analytics Dashboard', 'Recruitment Tracker System', 'Employee Engagement Portal'],
        finance: ['Personal Expense Tracker', 'Investment Portfolio Manager', 'Budget Planning Tool'],
        agriculture: ['Agri-Supply Chain Tracker', 'Crop Yield Prediction Model', 'Smart Farm Management System']
      };
      return (suggestions[domain] || suggestions.it).slice(0, 3);
    }
    return projects.slice(0, 6);
  }
});
