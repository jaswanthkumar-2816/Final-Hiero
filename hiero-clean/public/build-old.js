// Combined DOMContentLoaded event listener, improved error handling, better UX, and consistent async/await

document.addEventListener('DOMContentLoaded', async () => {
  // Auto-authenticate if no token exists
  try {
    await ensureAuthenticated();
    const token = localStorage.getItem('token');
    console.log("Token found on resume-builder.html:", token);
    if (token) {
      switchStep('basic');
    } else {
      showStatus('Authentication failed. Please refresh the page.', 'error');
      return;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    showStatus('Authentication failed. Please refresh the page.', 'error');
    return;
  }

  // Add skip and back listeners after DOM is loaded
  steps.forEach(step => {
    const skipBtn = document.getElementById(`${step}Skip`);
    if (skipBtn) skipBtn.addEventListener('click', () => skipStep(step));
    const backBtn = document.getElementById(`${step}Back`);
    if (backBtn) backBtn.addEventListener('click', () => goBackStep(step));
    const form = document.getElementById(`${step}Form`);
    if (form) {
      form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          if (e.target.tagName === 'TEXTAREA') {
            e.preventDefault();
            submitStep(step);
          } else {
            e.preventDefault();
            submitStep(step);
          }
        }
      });
    }
  });

  // Add listeners for Add More buttons
  const addEducationBtn = document.getElementById('addEducationBtn');
  if (addEducationBtn) addEducationBtn.addEventListener('click', addEducationEntry);
  const addProjectBtn = document.getElementById('addProjectBtn');
  if (addProjectBtn) addProjectBtn.addEventListener('click', addProjectEntry);
  const addCertificationBtn = document.getElementById('addCertificationBtn');
  if (addCertificationBtn) addCertificationBtn.addEventListener('click', addCertificationEntry);
  const addAchievementBtn = document.getElementById('addAchievementBtn');
  if (addAchievementBtn) addAchievementBtn.addEventListener('click', addAchievementEntry);
  const addReferenceBtn = document.getElementById('addReferenceBtn');
  if (addReferenceBtn) addReferenceBtn.addEventListener('click', addReferenceEntry);
});

function skipStep(step) {
  const nextStep = steps[steps.indexOf(step) + 1];
  if (nextStep) {
    switchStep(nextStep);
  }
}

function goBackStep(step) {
  const prevStep = steps[steps.indexOf(step) - 1];
  if (prevStep) {
    switchStep(prevStep);
  }
}

async function submitStep(step) {
  if (step === 'photo') {
    const formData = collectFormData(step);
    if (!formData) {
      showStatus('Please select a photo', 'error');
      return;
    }
    await uploadPhoto(formData);
    return;
  }
  const data = collectFormData(step);
  if (!data) {
    showStatus('Please fill all fields', 'error');
    return;
  }
  
  // Add userId to all requests
  data.userId = userId;
  showLoading(true);
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`http://localhost:5003/api/resume/${step}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (response.ok) {
      showStatus(result.message || `${step} saved`, 'success');
      // For multi-entry steps, already handled by arrays
      // Move to next step for all steps
      const nextStep = steps[steps.indexOf(step) + 1];
      if (nextStep) {
        switchStep(nextStep);
      }
    } else {
      showStatus(result.error || 'Failed to save', 'error');
      console.error("API Error:", result);
    }
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
    console.error("API Exception:", error);
  } finally {
    showLoading(false);
  }
}

async function uploadPhoto(formData) {
  showLoading(true);
  try {
    const token = getAuthToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch('http://localhost:5003/api/resume/photo', {
      method: 'POST',
      headers,
      body: formData
    });
    const result = await response.json();
    if (response.ok) {
      showStatus('Photo uploaded', 'success');
      switchStep('template');
    } else {
      showStatus(result.error || 'Photo upload failed', 'error');
      console.error("Photo Upload Error:", result);
    }
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
    console.error("Photo Upload Exception:", error);
  } finally {
    showLoading(false);
  }
}

async function sendChatMessage() {
  const message = document.getElementById('chatInput').value;
  if (!message) {
    showStatus('Please enter a message', 'error');
    return;
  }
  appendChatMessage('You', message);
  showLoading(true);
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch('http://localhost:5003/api/resume/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({ message })
    });
    const result = await response.json();
    if (response.ok) {
      appendChatMessage('Bot', result.message);
      showStatus(`Saved to ${result.section}`, 'success');
    } else {
      showStatus(result.error || 'Failed to process message', 'error');
      console.error("Chat Error:", result);
    }
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
    console.error("Chat Exception:", error);
  } finally {
    showLoading(false);
    document.getElementById('chatInput').value = '';
  }
}

async function previewResume() {
  showLoading(true);
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch('http://localhost:5003/api/resume/preview', {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId })
    });
    const result = await response.json();
    if (response.ok) {
      showStatus('Preview generated', 'success');
      window.open('http://localhost:5003/api/resume/preview-view', '_blank');
    } else {
      showStatus(result.error || 'Failed to generate preview', 'error');
      console.error("Preview Error:", result);
    }
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
    console.error("Preview Exception:", error);
  } finally {
    showLoading(false);
  }
}

async function downloadResume() {
  showLoading(true);
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    // Send userId to get the complete resume data from backend
    const response = await fetch('http://localhost:5003/api/resume/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId })
    });
    const result = await response.json();
    if (response.ok) {
      showStatus('Resume generated', 'success');
      const a = document.createElement('a');
      a.href = `http://localhost:5003/api/resume/download?file=${result.file}`;
      a.download = result.file;
      a.click();
    } else {
      showStatus(result.error || 'Failed to generate resume', 'error');
      console.error("Download Error:", result);
    }
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
    console.error("Download Exception:", error);
  } finally {
    showLoading(false);
  }
}

// --- Multi-entry data arrays ---
let educationEntries = [];
let projectEntries = [];
let certificationEntries = [];
let achievementEntries = [];
let referenceEntries = [];

function collectFormData(step) {
  switch (step) {
    case 'basic': {
      const nameElem = document.getElementById('basicName');
      const emailElem = document.getElementById('basicEmail');
      const phoneElem = document.getElementById('basicPhone');
      const careerElem = document.getElementById('basicCareerObjective');
      const websiteElem = document.getElementById('basicWebstite'); // Fixed typo: should match HTML id
      if (!nameElem || !emailElem || !phoneElem || !careerElem || !websiteElem) {
        console.error('Basic form elements missing');
        return null;
      }
      return {
        full_name: nameElem.value,
        contact_info: {
          email: emailElem.value,
          phone: phoneElem.value
        },
        career_summary: careerElem.value,
        website: websiteElem.value
      };
    }
    case 'education':
      return { education: educationEntries.length ? educationEntries : [] };
    case 'projects':
      return { projects: projectEntries.length ? projectEntries : [] };
    case 'skills': {
      const techElem = document.getElementById('skillsTechnical');
      const mgmtElem = document.getElementById('skillsManagement');
      if (!techElem || !mgmtElem) return null;
      return {
        skills: {
          technical: techElem.value ? techElem.value.split(',').map(s => s.trim()) : [],
          management: mgmtElem.value ? mgmtElem.value.split(',').map(s => s.trim()) : []
        }
      };
    }
    case 'certifications':
      return { certifications: certificationEntries.length ? certificationEntries : [] };
    case 'achievements':
      return { achievements: achievementEntries.length ? achievementEntries : [] };
    case 'hobbies': {
      const hobbiesElem = document.getElementById('hobbies');
      return {
        hobbies: hobbiesElem && hobbiesElem.value ? hobbiesElem.value.split(',').map(h => h.trim()) : []
      };
    }
    case 'personal_details': {
      const dobElem = document.getElementById('personalDob');
      const genderElem = document.getElementById('personalGender');
      const addrElem = document.getElementById('personalAddress');
      if (!dobElem || !genderElem || !addrElem) return null;
      return {
        personal_details: {
          dob: dobElem.value,
          gender: genderElem.value,
          address: addrElem.value
        }
      };
    }
    case 'references':
      return { references: referenceEntries.length ? referenceEntries : [] };
    case 'photo': {
      const fileElem = document.getElementById('photo');
      if (!fileElem || !fileElem.files[0]) return null;
      const formData = new FormData();
      formData.append('photo', fileElem.files[0]);
      return formData;
    }
    case 'template': {
      const templateElem = document.getElementById('template');
      if (!templateElem) return null;
      return { template: templateElem.value };
    }
    default:
      return null;
  }
}

function addEducationEntry() {
  const inst = document.getElementById('eduInstitution').value;
  const deg = document.getElementById('eduDegree').value;
  const year = document.getElementById('eduYear').value;
  const gpa = document.getElementById('eduGpa').value;
  if (!inst || !deg || !year) {
    showStatus('Please fill Institution, Degree, and Year', 'error');
    return;
  }
  educationEntries.push({ institution: inst, degree: deg, year, gpa });
  renderEducationList();
  clearEducationForm();
}
function renderEducationList() {
  const list = document.getElementById('educationList');
  list.innerHTML = educationEntries.map(e => `<li>${e.institution} - ${e.degree} (${e.year})${e.gpa ? ', GPA: ' + e.gpa : ''}</li>`).join('');
}
function clearEducationForm() {
  document.getElementById('eduInstitution').value = '';
  document.getElementById('eduDegree').value = '';
  document.getElementById('eduYear').value = '';
  document.getElementById('eduGpa').value = '';
}

function addProjectEntry() {
  const name = document.getElementById('projectName').value;
  const desc = document.getElementById('projectDesc').value;
  const duration = document.getElementById('projectDuration').value;
  const year = document.getElementById('projectYear').value;
  if (!name || !desc) {
    showStatus('Please fill Project Name and Description', 'error');
    return;
  }
  projectEntries.push({ name, description: desc, duration, year });
  renderProjectsList();
  clearProjectsForm();
}
function renderProjectsList() {
  const list = document.getElementById('projectsList');
  list.innerHTML = projectEntries.map(p => `<li>${p.name} - ${p.description}${p.year ? ' (' + p.year + ')' : ''}</li>`).join('');
}
function clearProjectsForm() {
  document.getElementById('projectName').value = '';
  document.getElementById('projectDesc').value = '';
  document.getElementById('projectDuration').value = '';
  document.getElementById('projectYear').value = '';
}

function addCertificationEntry() {
  const name = document.getElementById('certName').value;
  const issuer = document.getElementById('certIssuer').value;
  const year = document.getElementById('certYear').value;
  if (!name) {
    showStatus('Please fill Certification Name', 'error');
    return;
  }
  certificationEntries.push({ name, issuer, year });
  renderCertificationsList();
  clearCertificationsForm();
}
function renderCertificationsList() {
  const list = document.getElementById('certificationsList');
  list.innerHTML = certificationEntries.map(c => `<li>${c.name}${c.issuer ? ' - ' + c.issuer : ''}${c.year ? ' (' + c.year + ')' : ''}</li>`).join('');
}
function clearCertificationsForm() {
  document.getElementById('certName').value = '';
  document.getElementById('certIssuer').value = '';
  document.getElementById('certYear').value = '';
}

function addAchievementEntry() {
  const title = document.getElementById('achTitle').value;
  const desc = document.getElementById('achDesc').value;
  const year = document.getElementById('achYear').value;
  if (!title) {
    showStatus('Please fill Achievement Title', 'error');
    return;
  }
  achievementEntries.push({ title, description: desc, year });
  renderAchievementsList();
  clearAchievementsForm();
}
function renderAchievementsList() {
  const list = document.getElementById('achievementsList');
  list.innerHTML = achievementEntries.map(a => `<li>${a.title}${a.description ? ' - ' + a.description : ''}${a.year ? ' (' + a.year + ')' : ''}</li>`).join('');
}
function clearAchievementsForm() {
  document.getElementById('achTitle').value = '';
  document.getElementById('achDesc').value = '';
  document.getElementById('achYear').value = '';
}

function addReferenceEntry() {
  const name = document.getElementById('refName').value;
  const contact = document.getElementById('refContact').value;
  const relationship = document.getElementById('refRelationship').value;
  if (!name) {
    showStatus('Please fill Reference Name', 'error');
    return;
  }
  referenceEntries.push({ name, contact, relationship });
  renderReferencesList();
  clearReferencesForm();
}
function renderReferencesList() {
  const list = document.getElementById('referencesList');
  list.innerHTML = referenceEntries.map(r => `<li>${r.name}${r.contact ? ' - ' + r.contact : ''}${r.relationship ? ' (' + r.relationship + ')' : ''}</li>`).join('');
}
function clearReferencesForm() {
  document.getElementById('refName').value = '';
  document.getElementById('refContact').value = '';
  document.getElementById('refRelationship').value = '';
}

function showStatus(message, type) {
  const status = document.getElementById('status');
  if (!status) return;
  status.textContent = message;
  status.className = `mt-4 text-center ${type === 'success' ? 'text-green-500' : type === 'info' ? 'text-blue-500' : 'text-red-500'}`;
  setTimeout(() => status.textContent = '', 3000);
}

function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (!overlay) return;
  overlay.style.display = show ? 'flex' : 'none';
}

function appendChatMessage(sender, message) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;
  const messageDiv = document.createElement('div');
  messageDiv.className = `mb-2 ${sender === 'You' ? 'text-right' : 'text-left'}`;
  messageDiv.innerHTML = `<span class="font-bold ${sender === 'You' ? 'text-green-500' : 'text-blue-400'}">${sender}:</span> ${message}`;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 🔑 Token check on page load
  document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    console.log("Token found on resume-builder.html:", token);

    if (!token) {
      alert('Please login first');
      window.location.href = '/login.html';
    } else {
      switchStep('basic');
    }
  });
    const steps = [
      'basic', 'education', 'projects', 'skills', 'certifications',
      'achievements', 'hobbies', 'personal_details', 'references', 'photo', 'template', 'preview'
    ];
    let currentStep = 'basic';
    
    // Generate unique user ID for this session
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);


    // Helper to get JWT token from localStorage
    function getAuthToken() {
      return localStorage.getItem('token');
    }
    
    // Auto-authenticate with demo user if no token exists
    async function ensureAuthenticated() {
      const token = getAuthToken();
      if (!token) {
        try {
          const response = await fetch('http://localhost:5003/api/auth/demo', {
            method: 'POST'
          });
          const result = await response.json();
          if (result.success && result.token) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            console.log('Auto-authenticated with demo user');
            return result.token;
          }
        } catch (error) {
          console.error('Auto-authentication failed:', error);
          showStatus('Authentication failed. Please refresh the page.', 'error');
        }
      }
      return token;
    }

    async function submitStep(step) {
      if (step === 'photo') {
        const formData = collectFormData(step);
        if (!formData) {
          showStatus('Please select a photo', 'error');
          return;
        }
        await uploadPhoto(formData);
        return;
      }
      const data = collectFormData(step);
      if (!data) {
        showStatus('Please fill all fields', 'error');
        return;
      }
      showLoading(true);
      try {
        // Ensure user is authenticated
        await ensureAuthenticated();
        
        const headers = {
          'Content-Type': 'application/json'
        };
        const token = getAuthToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(`http://localhost:5003/api/resume/${step}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
          showStatus(result.message || `${step} saved`, 'success');
          // For multi-entry steps, already handled by arrays
          // Move to next step for all steps
          const nextStep = steps[steps.indexOf(step) + 1];
          if (nextStep) {
            switchStep(nextStep);
          }
        } else {
          showStatus(result.error || 'Failed to save', 'error');
          console.error("API Error:", result);
        }
      } catch (error) {
        showStatus('Error: ' + error.message, 'error');
        console.error("API Exception:", error);
      } finally {
        showLoading(false);
      }
    }

    async function uploadPhoto(formData) {
      showLoading(true);
      try {
        const token = getAuthToken();
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch('http://localhost:5003/api/resume/photo', {
          method: 'POST',
          headers,
          body: formData
        });
        const result = await response.json();
        if (response.ok) {
          showStatus('Photo uploaded', 'success');
          switchStep('template');
        } else {
          showStatus(result.error || 'Photo upload failed', 'error');
        }
      } catch (error) {
        showStatus('Error: ' + error.message, 'error');
      } finally {
        showLoading(false);
      }
    }

    async function sendChatMessage() {
      const message = document.getElementById('chatInput').value;
      if (!message) {
        showStatus('Please enter a message', 'error');
        return;
      }
      appendChatMessage('You', message);
      showLoading(true);
      try {
        const headers = {
          'Content-Type': 'application/json'
        };
        const token = getAuthToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch('http://localhost:5003/api/resume/chat', {
          method: 'POST',
          headers,
          body: JSON.stringify({ message })
        });
        const result = await response.json();
        if (response.ok) {
          appendChatMessage('Bot', result.message);
          showStatus(`Saved to ${result.section}`, 'success');
        } else {
          showStatus(result.error || 'Failed to process message', 'error');
        }
      } catch (error) {
        showStatus('Error: ' + error.message, 'error');
      } finally {
        showLoading(false);
        document.getElementById('chatInput').value = '';
      }
    }

    async function previewResume() {
      showLoading(true);
      try {
        const token = getAuthToken();
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch('http://localhost:5003/api/resume/preview', {
          method: 'POST',
          headers
        });
        const result = await response.json();
        if (response.ok) {
          showStatus('Preview generated', 'success');
          window.open('http://localhost:5003/api/resume/preview-view', '_blank');
        } else {
          showStatus(result.error || 'Failed to generate preview', 'error');
        }
      } catch (error) {
        showStatus('Error: ' + error.message, 'error');
      } finally {
        showLoading(false);
      }
    }

    async function downloadResume() {
      showLoading(true);
      try {
        const token = getAuthToken();
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch('http://localhost:5003/api/resume/generate', {
          method: 'POST',
          headers
        });
        const result = await response.json();
        if (response.ok) {
          showStatus('Resume generated', 'success');
          const a = document.createElement('a');
          a.href = `http://localhost:5003/api/resume/download?file=${result.file}`;
          a.download = result.file;
          a.click();
        } else {
          showStatus(result.error || 'Failed to generate resume', 'error');
        }
      } catch (error) {
        showStatus('Error: ' + error.message, 'error');
      } finally {
        showLoading(false);
      }
    }

    function collectFormData(step) {
      switch (step) {
        case 'basic': {
          const nameElem = document.getElementById('basicName');
          const emailElem = document.getElementById('basicEmail');
          const phoneElem = document.getElementById('basicPhone');
          const careerElem = document.getElementById('basicCareerObjective');
          const websiteElem = document.getElementById('basicWebstite'); // Fixed typo: should match HTML id
          if (!nameElem || !emailElem || !phoneElem || !careerElem || !websiteElem) return null;
          return {
            full_name: nameElem.value,
            contact_info: {
              email: emailElem.value,
              phone: phoneElem.value
            },
            career_summary: careerElem.value,
            website: websiteElem.value
          };
        }
        case 'education':
          return { education: educationEntries.length ? educationEntries : [] };
        case 'projects':
          return { projects: projectEntries.length ? projectEntries : [] };
        case 'skills': {
          const techElem = document.getElementById('skillsTechnical');
          const mgmtElem = document.getElementById('skillsManagement');
          if (!techElem || !mgmtElem) return null;
          return {
            skills: {
              technical: techElem.value ? techElem.value.split(',').map(s => s.trim()) : [],
              management: mgmtElem.value ? mgmtElem.value.split(',').map(s => s.trim()) : []
            }
          };
        }
        case 'certifications':
          return { certifications: certificationEntries.length ? certificationEntries : [] };
        case 'achievements':
          return { achievements: achievementEntries.length ? achievementEntries : [] };
        case 'hobbies': {
          const hobbiesElem = document.getElementById('hobbies');
          return {
            hobbies: hobbiesElem && hobbiesElem.value ? hobbiesElem.value.split(',').map(h => h.trim()) : []
          };
        }
        case 'personal_details': {
          const dobElem = document.getElementById('personalDob');
          const genderElem = document.getElementById('personalGender');
          const addrElem = document.getElementById('personalAddress');
          if (!dobElem || !genderElem || !addrElem) return null;
          return {
            personal_details: {
              dob: dobElem.value,
              gender: genderElem.value,
              address: addrElem.value
            }
          };
        }
        case 'references':
          return { references: referenceEntries.length ? referenceEntries : [] };
        case 'photo': {
          const fileElem = document.getElementById('photo');
          if (!fileElem || !fileElem.files[0]) return null;
          const formData = new FormData();
          formData.append('photo', fileElem.files[0]);
          return formData;
        }
        case 'template': {
          const templateElem = document.getElementById('template');
          if (!templateElem) return null;
          return { template: templateElem.value };
        }
        default:
          return null;
      }
    }

    function addEducationEntry() {
      const inst = document.getElementById('eduInstitution').value;
      const deg = document.getElementById('eduDegree').value;
      const year = document.getElementById('eduYear').value;
      const gpa = document.getElementById('eduGpa').value;
      if (!inst || !deg || !year) {
        showStatus('Please fill Institution, Degree, and Year', 'error');
        return;
      }
      educationEntries.push({ institution: inst, degree: deg, year, gpa });
      renderEducationList();
      clearEducationForm();
    }
    function renderEducationList() {
      const list = document.getElementById('educationList');
      list.innerHTML = educationEntries.map(e => `<li>${e.institution} - ${e.degree} (${e.year})${e.gpa ? ', GPA: ' + e.gpa : ''}</li>`).join('');
    }
    function clearEducationForm() {
      document.getElementById('eduInstitution').value = '';
      document.getElementById('eduDegree').value = '';
      document.getElementById('eduYear').value = '';
      document.getElementById('eduGpa').value = '';
    }

    function addProjectEntry() {
      const name = document.getElementById('projectName').value;
      const desc = document.getElementById('projectDesc').value;
      const duration = document.getElementById('projectDuration').value;
      const year = document.getElementById('projectYear').value;
      if (!name || !desc) {
        showStatus('Please fill Project Name and Description', 'error');
        return;
      }
      projectEntries.push({ name, description: desc, duration, year });
      renderProjectsList();
      clearProjectsForm();
    }
    function renderProjectsList() {
      const list = document.getElementById('projectsList');
      list.innerHTML = projectEntries.map(p => `<li>${p.name} - ${p.description}${p.year ? ' (' + p.year + ')' : ''}</li>`).join('');
    }
    function clearProjectsForm() {
      document.getElementById('projectName').value = '';
      document.getElementById('projectDesc').value = '';
      document.getElementById('projectDuration').value = '';
      document.getElementById('projectYear').value = '';
    }

    function addCertificationEntry() {
      const name = document.getElementById('certName').value;
      const issuer = document.getElementById('certIssuer').value;
      const year = document.getElementById('certYear').value;
      if (!name) {
        showStatus('Please fill Certification Name', 'error');
        return;
      }
      certificationEntries.push({ name, issuer, year });
      renderCertificationsList();
      clearCertificationsForm();
    }
    function renderCertificationsList() {
      const list = document.getElementById('certificationsList');
      list.innerHTML = certificationEntries.map(c => `<li>${c.name}${c.issuer ? ' - ' + c.issuer : ''}${c.year ? ' (' + c.year + ')' : ''}</li>`).join('');
    }
    function clearCertificationsForm() {
      document.getElementById('certName').value = '';
      document.getElementById('certIssuer').value = '';
      document.getElementById('certYear').value = '';
    }

    function addAchievementEntry() {
      const title = document.getElementById('achTitle').value;
      const desc = document.getElementById('achDesc').value;
      const year = document.getElementById('achYear').value;
      if (!title) {
        showStatus('Please fill Achievement Title', 'error');
        return;
      }
      achievementEntries.push({ title, description: desc, year });
      renderAchievementsList();
      clearAchievementsForm();
    }
    function renderAchievementsList() {
      const list = document.getElementById('achievementsList');
      list.innerHTML = achievementEntries.map(a => `<li>${a.title}${a.description ? ' - ' + a.description : ''}${a.year ? ' (' + a.year + ')' : ''}</li>`).join('');
    }
    function clearAchievementsForm() {
      document.getElementById('achTitle').value = '';
      document.getElementById('achDesc').value = '';
      document.getElementById('achYear').value = '';
    }

    function addReferenceEntry() {
      const name = document.getElementById('refName').value;
      const contact = document.getElementById('refContact').value;
      const relationship = document.getElementById('refRelationship').value;
      if (!name) {
        showStatus('Please fill Reference Name', 'error');
        return;
      }
      referenceEntries.push({ name, contact, relationship });
      renderReferencesList();
      clearReferencesForm();
    }
    function renderReferencesList() {
      const list = document.getElementById('referencesList');
      list.innerHTML = referenceEntries.map(r => `<li>${r.name}${r.contact ? ' - ' + r.contact : ''}${r.relationship ? ' (' + r.relationship + ')' : ''}</li>`).join('');
    }
    function clearReferencesForm() {
      document.getElementById('refName').value = '';
      document.getElementById('refContact').value = '';
      document.getElementById('refRelationship').value = '';
    }

    function showStatus(message, type) {
      const status = document.getElementById('status');
      if (!status) return;
      status.textContent = message;
      status.className = `mt-4 text-center ${type === 'success' ? 'text-green-500' : type === 'info' ? 'text-blue-500' : 'text-red-500'}`;
      setTimeout(() => status.textContent = '', 3000);
    }

    function showLoading(show) {
      const overlay = document.getElementById('loadingOverlay');
      if (!overlay) return;
      overlay.style.display = show ? 'flex' : 'none';
    }

    function appendChatMessage(sender, message) {
      const chatMessages = document.getElementById('chatMessages');
      if (!chatMessages) return;
      const messageDiv = document.createElement('div');
      messageDiv.className = `mb-2 ${sender === 'You' ? 'text-right' : 'text-left'}`;
      messageDiv.innerHTML = `<span class="font-bold ${sender === 'You' ? 'text-green-500' : 'text-blue-400'}">${sender}:</span> ${message}`;
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function switchStep(step) {
      document.querySelectorAll('.form-section').forEach(form => form.classList.remove('active'));
      const formSection = document.getElementById(`${step}Form`);
      if (formSection) {
        formSection.classList.add('active');
        currentStep = step;
        updateProgress();
        // Focus the first input for better UX
        const firstInput = formSection.querySelector('input, textarea, select');
        if (firstInput) firstInput.focus();
      }
      // Enable/disable back button
      const backBtn = document.getElementById(`${step}Back`);
      if (backBtn) {
        backBtn.style.display = steps.indexOf(step) === 0 ? 'none' : 'inline-block';
      }
      // Clear lists if needed
      if (step === 'education') renderEducationList();
      if (step === 'projects') renderProjectsList();
      if (step === 'certifications') renderCertificationsList();
      if (step === 'achievements') renderAchievementsList();
      if (step === 'references') renderReferencesList();
    }

    function updateProgress() {
      const stepIndex = steps.indexOf(currentStep);
      const progressPercent = ((stepIndex + 1) / steps.length) * 100;
      document.getElementById('progressFill').style.width = `${progressPercent}%`;
      document.getElementById('progressText').textContent = `Step ${stepIndex + 1} of ${steps.length}: ${currentStep.charAt(0).toUpperCase() + currentStep.slice(1)}`;
    }

    function showStatus(message, type) {
      const status = document.getElementById('status');
      if (!status) return;
      status.textContent = message;
      status.className = `mt-4 text-center ${type === 'success' ? 'text-green-500' : type === 'info' ? 'text-blue-500' : 'text-red-500'}`;
      setTimeout(() => status.textContent = '', 3000);
    }

    function showLoading(show) {
      const overlay = document.getElementById('loadingOverlay');
      if (!overlay) return;
      overlay.style.display = show ? 'flex' : 'none';
    }

    function appendChatMessage(sender, message) {
      const chatMessages = document.getElementById('chatMessages');
      if (!chatMessages) return;
      const messageDiv = document.createElement('div');
      messageDiv.className = `mb-2 ${sender === 'You' ? 'text-right' : 'text-left'}`;
      messageDiv.innerHTML = `<span class="font-bold ${sender === 'You' ? 'text-green-500' : 'text-blue-400'}">${sender}:</span> ${message}`;
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
