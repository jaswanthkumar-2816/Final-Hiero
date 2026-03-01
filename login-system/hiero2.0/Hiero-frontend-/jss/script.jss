const steps = [
  { field: 'full_name', question: 'What is your full name?', endpoint: '/resume/basic' },
  { field: 'contact_info', question: 'Please provide your contact info (email | phone).', endpoint: '/resume/basic' },
  { field: 'career_objective', question: 'What is your career objective?', endpoint: '/resume/basic', isTextarea: true },
  { field: 'education', question: 'List your education (e.g., B.Tech, XYZ University, 2020-2024).', endpoint: '/resume/education', isTextarea: true },
  { field: 'projects', question: 'Describe a project (title, date, description).', endpoint: '/resume/projects', isProject: true },
  { field: 'technical_skills', question: 'List your technical skills.', endpoint: '/resume/skills', isTextarea: true },
  { field: 'photo', question: 'Please upload a profile photo.', endpoint: '/resume/photo', isFile: true },
  { field: 'generate', question: 'Ready to generate your resume PDF?', endpoint: '/resume/generate' },
];

function setError(elementId, message) {
  document.getElementById(elementId).textContent = message;
}

function clearError(elementId) {
  document.getElementById(elementId).textContent = '';
}

// Splash Screen
if (document.getElementById('splash-screen')) {
  setTimeout(() => {
    window.location.href = 'role.html';
  }, 3000);
}

// Role Select
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

// Auth
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

// Dashboard
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

// Resume Builder
let currentStepIndex = 0;
let resumeData = {};
let projectCount = 0;

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
        <div class="chat-message bot"><div class="avatar"></div><div class="content">${steps.find(s => s.field === 'projects').question}</div></div>
        <div class="chat-message user"><div class="content">Title: ${title}, Date: ${date}, Description: ${description}</div><div class="avatar"></div></div>
      `;
    } else if (field !== 'photo') {
      chatContainer.innerHTML += `
        <div class="chat-message bot"><div class="avatar"></div><div class="content">${steps.find(s => s.field === field)?.question || 'Please provide details.'}</div></div>
        <div class="chat-message user"><div class="content">${value}</div><div class="avatar"></div></div>
      `;
    }
  });

  if (currentStepIndex < steps.length) {
    const step = steps[currentStepIndex];
    chatContainer.innerHTML += `<div class="chat-message bot"><div class="avatar"></div><div class="content">${step.question}</div></div>`;
    chatInput.style.display = step.isFile ? 'none' : 'block';
    chatInput.placeholder = step.isProject ? 'Enter title | date | description' : `Enter your ${step.field.replace('_', ' ')}`;
    chatSubmit.textContent = step.isFile ? 'Upload' : 'Send';
    if (step.isFile) {
      chatInput.type = 'file';
      chatInput.accept = 'image/*';
    } else {
      chatInput.type = 'text';
      chatInput.accept = '';
    }
    chatContainer.scrollTop = chatContainer.scrollHeight;
  } else {
    chatInput.style.display = 'none';
    chatSubmit.style.display = 'none';
  }
}

if (document.getElementById('chat-container')) {
  renderChat();
  const chatInput = document.getElementById('chat-input');
  const chatSubmit = document.getElementById('chat-submit');
  chatSubmit.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('builder-error', 'Please log in again');
      window.location.href = 'auth.html';
      return;
    }
    const step = steps[currentStepIndex];
    let value = step.isFile ? chatInput.files[0] : chatInput.value.trim();
    if (!value && !step.isFile) {
      setError('builder-error', `Please enter your ${step.field.replace('_', ' ')}`);
      return;
    }
    if (step.isProject && !value.includes('|')) {
      setError('builder-error', 'Please enter in format: title | date | description');
      return;
    }
    clearError('builder-error');
    chatSubmit.disabled = true;
    chatSubmit.classList.add('loading');
    try {
      const userIdResponse = await fetch('http://localhost:3000/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userId = (await userIdResponse.json()).id || 'user123';
      let data;
      if (step.isFile) {
        data = new FormData();
        data.append('userId', userId);
        data.append('photo', value);
      } else if (step.isProject) {
        data = { userId, projects: [{ title: value.split('|')[0], date: value.split('|')[1], description: value.split('|')[2] }] };
        value = value.split('|').join('|');
        resumeData[`project_${projectCount++}`] = value;
      } else if (step.field === 'generate') {
        data = { userId };
      } else {
        data = { userId, [step.field]: value };
        resumeData[step.field] = value;
      }
      const response = await fetch(`http://localhost:5000${step.endpoint}`, {
        method: 'POST',
        headers: step.isFile ? { Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: step.isFile ? data : JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save data');
      }
      if (step.field === 'generate') {
        window.location.href = `http://localhost:5000/resume/download?file=${result.file}`;
      } else {
        if (step.isProject) {
          resumeData[step.field] = resumeData[step.field] || [];
          resumeData[step.field].push(value);
          chatContainer.innerHTML += `<div class="chat-message bot"><div class="avatar"></div><div class="content">Would you like to add another project?</div></div>`;
          chatInput.value = '';
          chatInput.placeholder = 'Type "yes" to add another project or "no" to continue';
          chatSubmit.textContent = 'Send';
          chatSubmit.disabled = false;
          chatSubmit.classList.remove('loading');
          chatSubmit.onclick = () => {
            if (chatInput.value.toLowerCase() === 'yes') {
              chatContainer.innerHTML += `<div class="chat-message user"><div class="content">Yes</div><div class="avatar"></div></div>`;
              chatContainer.innerHTML += `<div class="chat-message bot"><div class="avatar"></div><div class="content">${step.question}</div></div>`;
              chatInput.placeholder = 'Enter title | date | description';
              chatSubmit.onclick = null;
              renderChat();
            } else {
              currentStepIndex++;
              chatInput.value = '';
              renderChat();
            }
          };
        } else {
          currentStepIndex++;
          chatInput.value = '';
          renderChat();
        }
      }
    } catch (err) {
      setError('builder-error', err.message);
    } finally {
      if (!step.isProject) {
        chatSubmit.disabled = false;
        chatSubmit.classList.remove('loading');
      }
    }
  });
}

// Upload
const uploadForm = document.getElementById('upload-form');
if (uploadForm) {
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const resumeFile = document.getElementById('resume-file').files[0];
    const jdFile = document.getElementById('jd-file').files[0];
    if (!resumeFile || !jdFile) {
      setError('upload-error', 'Please upload both resume and job description');
      return;
    }
    if (resumeFile.type !== 'application/pdf') {
      setError('upload-error', 'Resume must be a PDF file');
      return;
    }
    if (jdFile.type !== 'application/pdf' && jdFile.type !== 'text/plain') {
      setError('upload-error', 'Job description must be a PDF or text file');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setError('upload-error', 'Please log in again');
      window.location.href = 'auth.html';
      return;
    }
    const analyzeBtn = document.getElementById('analyze-btn');
    analyzeBtn.disabled = true;
    analyzeBtn.classList.add('loading');
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('jd', jdFile);
      const response = await fetch('http://localhost:5001/api/resume/analyze', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }
      localStorage.setItem('analysisResult', JSON.stringify(data));
      window.location.href = 'results.html';
    } catch (err) {
      setError('upload-error', err.message);
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.classList.remove('loading');
    }
  });
}

// Results
if (document.getElementById('result-content')) {
  const resultContent = document.getElementById('result-content');
  const backBtn = document.getElementById('back-btn');
  const result = JSON.parse(localStorage.getItem('analysisResult') || '{}');
  if (!result.score && !result.missingSkills && !result.videos) {
    resultContent.innerHTML = '<p>No analysis results available. Please try again.</p>';
  } else {
    const youtubeLinks = Object.values(result.videos || {}).flat();
    resultContent.innerHTML = `
      <div>
        <h3>Resume Score</h3>
        <p>${result.score ? result.score + '%' : 'N/A'}</p>
      </div>
      <div>
        <h3>Missing Skills</h3>
        <ul>${(result.missingSkills || []).map(skill => `<li>${skill}</li>`).join('')}</ul>
      </div>
      <div>
        <h3>Learning Resources</h3>
        <ul>${(youtubeLinks || []).map((link, i) => `<li><a href="${link}" target="_blank">Tutorial ${i + 1}</a></li>`).join('')}</ul>
      </div>
    `;
  }
  backBtn.addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });
}