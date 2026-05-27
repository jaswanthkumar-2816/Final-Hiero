// =============================
// Base URLs
// =============================
const API_BASE = 'http://localhost:2816';   // Gateway (Proxies to Resume Service)
const ANALYSIS_BASE = 'http://localhost:2816'; // Gateway (Integrated Analysis Router)

// =============================
// Resume Templates
// =============================
const AVAILABLE_TEMPLATES = [
  'altacv',
  'awesomecv',
  'deedycv',
  'elegant',
  'modernsimple',
  'professionalcv'
];

// =============================
// Resume Builder Steps
// =============================
const steps = [
  { field: 'full_name', question: 'What is your full name?', endpoint: '/api/resume/basic' },
  { field: 'contact_info', question: 'Please provide your contact info (email | phone).', endpoint: '/api/resume/basic' },
  { field: 'career_summary', question: 'What is your career summary/objective?', endpoint: '/api/resume/basic', isTextarea: true },
  { field: 'education', question: 'List your education (e.g., B.Tech, XYZ University, 2020-2024).', endpoint: '/api/resume/education', isTextarea: true },
  { field: 'projects', question: 'Describe a project (title | date | description).', endpoint: '/api/resume/projects', isProject: true },
  { field: 'technical_skills', question: 'List your technical skills (comma separated).', endpoint: '/api/resume/skills', isTextarea: true },
  { field: 'template', question: `Choose a template (${AVAILABLE_TEMPLATES.join(', ')}).`, endpoint: '/api/resume/template' },
  { field: 'photo', question: 'Please upload a profile photo.', endpoint: '/api/resume/photo', isFile: true },
  { field: 'generate', question: 'Ready to generate your resume PDF?', endpoint: '/api/resume/generate' }
];

// =============================
// Utility Functions
// =============================
function setError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) el.textContent = message;
}
function clearError(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.textContent = '';
}
function validateEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}
function validatePhone(phone) {
  return /^[0-9]{10}$/.test(phone);
}
function showStatus(msg, type) {
  const errorBox = document.getElementById('builder-error');
  if (!errorBox) return;
  errorBox.textContent = msg;
  errorBox.className = type === 'error' ? 'error' : 'success';
}

// =============================
// Splash Screen
// =============================
if (document.getElementById('splash-screen')) {
  setTimeout(() => {
    window.location.href = 'role.html';
  }, 3000);
}

// =============================
// Role Select
// =============================
const studentBtn = document.getElementById('student-btn');
const jobSeekerBtn = document.getElementById('job-seeker-btn');
if (studentBtn && jobSeekerBtn) {
  studentBtn.addEventListener('click', () => {
    localStorage.setItem('role', 'student');
    window.location.href = 'auth.html';
  });
  jobSeekerBtn.addEventListener('click', () => {
    localStorage.setItem('role', 'job_seeker');
    window.location.href = 'auth.html';
  });
}

// =============================
// Auth Page
// =============================
function handleOAuthToken() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  if (token) {
    localStorage.setItem('token', token);
    window.history.replaceState({}, document.title, window.location.pathname);
    window.location.href = 'dashboard.html';
    return true;
  }
  return false;
}

if (document.getElementById('auth-error')) {
  handleOAuthToken();
  document.getElementById('google-login-btn').addEventListener('click', () => {
    window.location.href = 'http://localhost:3000/auth/google';
  });
  document.getElementById('github-login-btn').addEventListener('click', () => {
    window.location.href = 'http://localhost:3000/auth/github';
  });
  document.getElementById('google-signup-btn').addEventListener('click', () => {
    window.location.href = 'http://localhost:3000/auth/google';
  });
  document.getElementById('github-signup-btn').addEventListener('click', () => {
    window.location.href = 'http://localhost:3000/auth/github';
  });
}

// =============================
// Dashboard
// =============================
const createResumeBtn = document.getElementById('create-resume-btn');
const analyzeResumeBtn = document.getElementById('analyze-resume-btn');
if (createResumeBtn && analyzeResumeBtn) {
  createResumeBtn.addEventListener('click', () => {
    window.location.href = 'resume-builder.html';
  });
  analyzeResumeBtn.addEventListener('click', () => {
    window.location.href = 'upload.html';
  });
}

// =============================
// Resume Builder Logic
// =============================
let currentStepIndex = 0;
let resumeData = {};
let projectCount = 0;

async function skipStep() {
  const step = steps[currentStepIndex];
  currentStepIndex++;
  const chatInput = document.getElementById('chat-input');
  if (chatInput) chatInput.value = '';
  renderChat();
}

// Render chat interface
function renderChat() {
  const chatContainer = document.getElementById('chat-container');
  const chatInput = document.getElementById('chat-input');
  const chatSubmit = document.getElementById('chat-submit');
  if (!chatContainer) return;

  chatContainer.innerHTML = '';
  Object.entries(resumeData).forEach(([field, value]) => {
    if (field.startsWith('project_')) {
      const [title, date, description] = value.split('|');
      chatContainer.innerHTML += `
        <div class="chat-message bot"><div class="content">${steps.find(s => s.field === 'projects').question}</div></div>
        <div class="chat-message user"><div class="content">Title: ${title}, Date: ${date}, Description: ${description}</div></div>
      `;
    } else if (field !== 'photo') {
      const q = steps.find(s => s.field === field)?.question || 'Please provide details.';
      const displayVal = typeof value === 'object' ? JSON.stringify(value) : value;
      chatContainer.innerHTML += `
        <div class="chat-message bot"><div class="content">${q}</div></div>
        <div class="chat-message user"><div class="content">${displayVal}</div></div>
      `;
    }
  });

  if (currentStepIndex < steps.length) {
    const step = steps[currentStepIndex];
    chatContainer.innerHTML += `<div class="chat-message bot"><div class="content">${step.question}</div></div>`;
    if (step.field === 'template') {
      chatContainer.innerHTML += `<div class="chat-message bot"><div class="content">Available: ${AVAILABLE_TEMPLATES.join(', ')}</div></div>`;
    }
    chatInput.style.display = step.isFile ? 'none' : 'block';
    chatSubmit.textContent = step.isFile ? 'Upload' : 'Send';
  } else {
    chatInput.style.display = 'none';
    chatSubmit.style.display = 'none';
  }
  const skipBtn = document.getElementById('skip-btn');
  if (skipBtn) {
    skipBtn.onclick = skipStep;
  }
}

if (document.getElementById('chat-container')) {
  renderChat();
  const chatInput = document.getElementById('chat-input');
  const chatSubmit = document.getElementById('chat-submit');
  chatSubmit.addEventListener('click', async () => {
    const step = steps[currentStepIndex];
    let value = step.isFile ? chatInput.files[0] : chatInput.value.trim();
    resumeData[step.field] = value;
    currentStepIndex++;
    chatInput.value = '';
    renderChat();
  });
}

// =============================
// Upload (Resume Analysis)
// =============================
const analyzeForm = document.getElementById('analyze-form');
if (analyzeForm) {
  const connectionStatus = document.getElementById('connection-status');
  const statusText = document.getElementById('status-text');
  const analyzeBtn = document.getElementById('analyze-btn');
  const MAX_FILE_MB = 5;

  async function testAnalysisServer() {
    try {
      const r = await fetch(ANALYSIS_BASE + '/health', { cache: 'no-store' });
      const data = r.ok ? await r.json() : null;
      if (data && data.status === 'ok') {
        connectionStatus.style.display = 'block';
        connectionStatus.style.background = '#000';
        connectionStatus.style.color = '#0dff00';
        statusText.textContent = '✅ Backend Ready';
        analyzeBtn.disabled = false;
      } else throw new Error('Bad health payload');
    } catch {
      connectionStatus.style.display = 'block';
      connectionStatus.style.background = '#330';
      connectionStatus.style.color = '#ff5555';
      statusText.textContent = '❌ Analysis server not reachable (port 5001)';
      analyzeBtn.disabled = true;
    }
  }
  testAnalysisServer();

  analyzeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (analyzeBtn?.disabled) return;

    const resumeFile = document.getElementById('resume')?.files[0];
    const jdFile = document.getElementById('jd')?.files[0];
    const jdText = document.getElementById('jd-text')?.value.trim();

    if (!resumeFile) return setError('upload-error', 'Please upload your resume PDF');
    if (resumeFile.type !== 'application/pdf') return setError('upload-error', 'Resume must be a PDF file');
    if (resumeFile.size > MAX_FILE_MB * 1024 * 1024) return setError('upload-error', 'Resume exceeds 5MB limit');
    if (!jdFile && !jdText) return setError('upload-error', 'Provide JD file or text');

    const formData = new FormData();
    formData.append('resume', resumeFile);
    if (jdFile) formData.append('jd', jdFile);
    if (jdText) formData.append('jd_text', jdText);

    try {
      const resp = await fetch(ANALYSIS_BASE + '/api/analysis/analyze', { method: 'POST', body: formData });
      const raw = await resp.text();
      let json;
      try { json = JSON.parse(raw); } catch { throw new Error('Server returned non-JSON'); }
      if (!resp.ok) throw new Error(json.error || `HTTP ${resp.status}`);
      if (!json.success || !json.analysis) throw new Error('Invalid analysis payload');

      sessionStorage.setItem('analysisSessionId', json.sessionId);
      sessionStorage.setItem('analysisData', JSON.stringify(json.analysis));

      window.location.href = 'result.html';
    } catch (err) {
      setError('upload-error', err.message || 'Analysis failed');
    }
  });
}

// =============================
// Logout
// =============================
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.onclick = function () {
    localStorage.removeItem('token');
    window.location.href = 'auth.html';
  };
}