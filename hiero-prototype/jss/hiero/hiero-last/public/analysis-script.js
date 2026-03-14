document.addEventListener("DOMContentLoaded", () => {
  // Use the same server for analysis
  const BACKEND_URL = "";
  console.log("🔍 Using backend:", BACKEND_URL);
  const form = document.getElementById("analyze-form");
  const loadingOverlay = document.getElementById("loading-overlay");
  const connectionStatus = document.getElementById("connection-status");
  const statusText = document.getElementById("status-text");
  const analyzeBtn = document.getElementById("analyze-btn");
  const optimizeBtn = document.getElementById("optimize-btn");
  const resultPanel = document.getElementById("optimizer-results");
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
        connectionStatus.style.display = "block";
        connectionStatus.style.backgroundColor = "black";
        connectionStatus.style.color = "#00ff00";
        statusText.textContent = "Welcome to Hiero";
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
      console.log('Resume file:', resume ? `${resume.name} (${resume.size} bytes)` : 'NONE');
      console.log('JD mode:', jdMode);
      console.log('JD file:', jdFile ? `${jdFile.name} (${jdFile.size} bytes)` : 'NONE');
      console.log('JD text length:', jdMode === 'text' ? jdTextEl.value.length : 0);

      // Validation
      if (!resume) { alert("Please upload your resume PDF."); return; }
      if (jdMode === 'file' && !jdFile) { alert("Please upload the job description file or switch to text mode."); return; }
      if (jdMode === 'text' && (!jdTextEl || !jdTextEl.value.trim())) { alert("Please paste the job description text."); return; }

      if (!loadingOverlay) { console.error("Loading overlay not found."); alert("Loading animation failed to start."); return; }
      // Show loading overlay
      loadingOverlay.classList.add("visible");

      const formData = new FormData();
      formData.append('resume', resume);
      if (jdMode === 'file') {
        formData.append('jd', jdFile);
      } else {
        formData.append('jd_text', jdTextEl.value.trim()); // align with backend key jd_text
      }

      try {
        const analyzeUrl = `${BACKEND_URL}/api/analysis/analyze`;
        console.log('📤 Sending to backend:', analyzeUrl);
        const response = await fetch(analyzeUrl, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } });
        console.log('✅ Response received:', response.status, response.statusText);

        // Handle validation errors (422)
        if (response.status === 422) {
          const errJson = await response.json().catch(() => ({}));
          console.warn('⚠️ Validation error from backend:', errJson);
          showValidationErrors(errJson);
          loadingOverlay.classList.remove('visible');
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Server error response:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('📊 RAW Backend Response:', result);

        // Transform backend response to match result.html expectations
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

        // Store in localStorage with transformed data + full learning plan
        const storageData = { success: true, data: transformedData, rawData: result, learningPlan: result.learningPlan || [], timestamp: new Date().toISOString() };
        localStorage.setItem('analysisResult', JSON.stringify(storageData));
        localStorage.setItem('hieroLearningPlan', JSON.stringify(result.learningPlan || []));

        console.log('⏳ Redirecting in 1.2 seconds...');
        setTimeout(() => { window.location.href = 'result.html'; }, 1200);
      } catch (error) {
        console.error('❌ Error during analysis:', error.message);
        if (loadingOverlay) loadingOverlay.classList.remove('visible');
        alert('Analysis failed: ' + error.message + '\nCheck console for details.');
      }
    });
  }

  // === ATS Resume Optimizer Handler ===
  if (optimizeBtn) {
    optimizeBtn.addEventListener('click', async () => {
      const resume = document.getElementById('resume').files[0];
      const jdFile = document.getElementById('jd')?.files?.[0];
      const jdTextEl = document.getElementById("jd-text");
      const jdMode = document.querySelector('input[name="jd_mode"]:checked')?.value || 'file';

      if (!resume) { alert("Please upload your resume PDF."); return; }
      if (jdMode === 'file' && !jdFile) { alert("Please upload the job description file or switch to text mode."); return; }
      if (jdMode === 'text' && (!jdTextEl || !jdTextEl.value.trim())) { alert("Please paste the job description text."); return; }

      loadingOverlay.querySelector('p').innerHTML = "Generating ATS Optimized Resume...<br>This utilizes advanced AI and may take 10-15 seconds.";
      loadingOverlay.classList.add("visible");

      const formData = new FormData();
      formData.append('resume', resume);
      if (jdMode === 'file') {
        formData.append('jd', jdFile);
      } else {
        formData.append('jd_text', jdTextEl.value.trim());
      }

      try {
        const token = localStorage.getItem('token') || localStorage.getItem('jwtToken');
        const optimizeUrl = `${BACKEND_URL}/api/resume/optimize-resume`;

        const response = await fetch(optimizeUrl, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });

        if (!response.ok) {
          throw new Error(`Optimization failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✨ Optimization Result:', data);

        // Update UI
        document.getElementById('ats-score').textContent = `${data.analysis.ats_score}%`;

        const keywordsCont = document.getElementById('missing-keywords');
        keywordsCont.innerHTML = data.analysis.missing_keywords.map(k =>
          `<span style="background:#222; color:#0dff00; padding:4px 10px; border-radius:15px; font-size:0.8rem; border:1px solid #0dff0033;">${k}</span>`
        ).join('');

        const skillsCont = document.getElementById('suggested-skills');
        skillsCont.innerHTML = data.analysis.suggested_skills.map(s =>
          `<span style="background:#0dff0011; color:#0dff00; padding:4px 10px; border-radius:15px; font-size:0.8rem; border:1px solid #0dff00;">${s}</span>`
        ).join('');

        document.getElementById('improvements-text').textContent = data.analysis.improvements_made;

        // Populate Preview Editor
        const editor = document.getElementById('resume-preview-editor');
        editor.innerHTML = formatOptimizedResume(data.optimizedData);

        // Show Results
        resultPanel.style.display = 'block';
        resultPanel.scrollIntoView({ behavior: 'smooth' });

        // Store optimized data for download
        window.currentOptimizedData = data.optimizedData;

      } catch (error) {
        console.error('Optimization error:', error);
        alert('Failed to optimize resume: ' + error.message);
      } finally {
        loadingOverlay.classList.remove("visible");
        loadingOverlay.querySelector('p').innerHTML = "Analyzing your resume...<br>This may take a few seconds.";
      }
    });
  }

  function formatOptimizedResume(data) {
    let text = `${data.personalInfo.fullName}\n`;
    text += `${data.personalInfo.email} | ${data.personalInfo.phone}\n`;
    if (data.personalInfo.address) text += `${data.personalInfo.address}\n`;
    if (data.personalInfo.linkedin) text += `${data.personalInfo.linkedin}\n`;
    text += `\nPROFESSIONAL SUMMARY\n${data.summary}\n`;
    text += `\nCORE SKILLS\n${data.skills}\n`;

    text += `\nPROFESSIONAL EXPERIENCE\n`;
    data.experience.forEach(exp => {
      text += `${exp.jobTitle} | ${exp.company} | ${exp.startDate} - ${exp.endDate}\n`;
      text += `${exp.description}\n\n`;
    });

    if (data.projects && data.projects.length > 0) {
      text += `PROJECTS\n`;
      data.projects.forEach(p => {
        text += `${p.name} | ${p.tech} | ${p.duration}\n`;
        text += `${p.description}\n\n`;
      });
    }

    text += `EDUCATION\n`;
    data.education.forEach(edu => {
      text += `${edu.degree} | ${edu.school} | ${edu.gradYear}\n`;
      if (edu.gpa) text += `GPA: ${edu.gpa}\n`;
    });

    return text;
  }

  // Handle Downloads
  document.getElementById('download-optimized-pdf')?.addEventListener('click', async () => {
    if (!window.currentOptimizedData) return;
    try {
      const response = await fetch(`${BACKEND_URL}/download-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: 'hiero-standard',
          personalInfo: window.currentOptimizedData.personalInfo,
          summary: window.currentOptimizedData.summary,
          experience: window.currentOptimizedData.experience,
          education: window.currentOptimizedData.education,
          projects: window.currentOptimizedData.projects,
          technicalSkills: window.currentOptimizedData.skills
        })
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'Optimized_Resume.pdf'; a.click();
    } catch (e) { alert('Download failed'); }
  });

  document.getElementById('download-optimized-docx')?.addEventListener('click', async () => {
    if (!window.currentOptimizedData) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/resume/download-docx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: 'classic',
          personalInfo: window.currentOptimizedData.personalInfo,
          summary: window.currentOptimizedData.summary,
          experience: window.currentOptimizedData.experience,
          education: window.currentOptimizedData.education,
          projects: window.currentOptimizedData.projects,
          skills: window.currentOptimizedData.skills
        })
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'Optimized_Resume.doc'; a.click();
    } catch (e) { alert('Download failed'); }
  });

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

  // Helper function to generate project suggestions based on missing skills
  function generateProjectSuggestions(result) {
    const projects = [];

    // 1. Prioritize projects directly from backend (enhanced rule-based engine)
    if (result.projectSuggestions && Array.isArray(result.projectSuggestions)) {
      result.projectSuggestions.forEach(p => {
        if (typeof p === 'string' && p.trim()) projects.push(p);
        else if (typeof p === 'object' && p.title) projects.push(p.title);
        else if (typeof p === 'object' && p.name) projects.push(p.name);
      });
    }

    // 2. Fallback to learning plan projects if backend list was empty
    if (projects.length === 0 && result.learningPlan && Array.isArray(result.learningPlan)) {
      result.learningPlan.forEach(plan => {
        if (plan.miniProjects && Array.isArray(plan.miniProjects)) {
          plan.miniProjects.forEach(proj => {
            if (typeof proj === 'string' && proj.trim()) projects.push(proj);
          });
        }
      });
    }

    // 3. Final fallback (hardcoded) if still empty
    if (projects.length === 0) {
      const domain = result.domain || 'it';
      const suggestions = {
        it: [
          'Build a REST API service',
          'Create a Full-Stack Web App',
          'Develop a Data Visualization Dashboard'
        ],
        hr: [
          'HR Analytics Dashboard',
          'Recruitment Tracker System',
          'Employee Engagement Portal'
        ],
        finance: [
          'Personal Expense Tracker',
          'Investment Portfolio Manager',
          'Budget Planning Tool'
        ]
      };
      return (suggestions[domain] || suggestions.it).slice(0, 3);
    }

    return projects.slice(0, 6);
  }
});
