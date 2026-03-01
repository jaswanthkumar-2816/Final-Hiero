// Clean, consolidated resume builder script - fixed all duplicate issues and backend integration

// Global variables
const steps = [
  'basic', 'education', 'projects', 'skills', 'certifications',
  'achievements', 'hobbies', 'personal_details', 'references', 'photo', 'template', 'preview'
];
let currentStep = 'basic';

// Multi-entry arrays
let educationEntries = [];
let projectEntries = [];
let certificationEntries = [];
let achievementEntries = [];
let referenceEntries = [];

// Helper functions
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

// Main submit function
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
    
    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('Server returned non-JSON response');
    }
    
    const result = await response.json();
    if (response.ok) {
      showStatus(result.message || `${step} saved`, 'success');
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

// Photo upload function
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

// Chat function
async function sendChatMessage() {
  const message = document.getElementById('chatInput').value;
  if (!message) {
    showStatus('Please enter a message', 'error');
    return;
  }
  
  document.getElementById('chatInput').value = '';
  appendChatMessage('You', message);
  
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch('http://localhost:5003/api/resume/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({ message })
    });
    
    const result = await response.json();
    if (response.ok) {
      appendChatMessage('Assistant', result.response);
    } else {
      appendChatMessage('Assistant', 'Error: ' + (result.error || 'Failed to get response'));
    }
  } catch (error) {
    appendChatMessage('Assistant', 'Error: ' + error.message);
  }
}

// Preview function
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
      body: JSON.stringify({})
    });
    
    const result = await response.json();
    if (response.ok) {
      showStatus('Preview ready', 'success');
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

// Download function
async function downloadResume() {
  showLoading(true);
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch('http://localhost:5003/api/resume/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify({})
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

// Form data collection function
function collectFormData(step) {
  switch (step) {
    case 'basic': {
      const nameElem = document.getElementById('basicName');
      const emailElem = document.getElementById('basicEmail');
      const phoneElem = document.getElementById('basicPhone');
      const careerElem = document.getElementById('basicCareerObjective');
      const websiteElem = document.getElementById('basicWebsite') || document.getElementById('basicWebstite'); // Handle typo
      
      if (!nameElem || !emailElem || !phoneElem || !careerElem) {
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
        website: websiteElem ? websiteElem.value : ''
      };
    }
    case 'education':
      return { education: educationEntries };
    case 'projects':
      return { projects: projectEntries };
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
      return { certifications: certificationEntries };
    case 'achievements':
      return { achievements: achievementEntries };
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
      return { references: referenceEntries };
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

// Multi-entry form functions
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
  if (list) {
    list.innerHTML = educationEntries.map(e => 
      `<li>${e.institution} - ${e.degree} (${e.year})${e.gpa ? ', GPA: ' + e.gpa : ''}</li>`
    ).join('');
  }
}

function clearEducationForm() {
  ['eduInstitution', 'eduDegree', 'eduYear', 'eduGpa'].forEach(id => {
    const elem = document.getElementById(id);
    if (elem) elem.value = '';
  });
}

function addProjectEntry() {
  const name = document.getElementById('projName').value;
  const desc = document.getElementById('projDescription').value;
  const duration = document.getElementById('projDuration').value;
  const year = document.getElementById('projYear').value;
  
  if (!name || !desc) {
    showStatus('Please fill Name and Description', 'error');
    return;
  }
  
  projectEntries.push({ name, description: desc, duration, year });
  renderProjectList();
  clearProjectForm();
}

function renderProjectList() {
  const list = document.getElementById('projectList');
  if (list) {
    list.innerHTML = projectEntries.map(p => 
      `<li>${p.name} - ${p.description} (${p.year || 'No date'})${p.duration ? ', Duration: ' + p.duration : ''}</li>`
    ).join('');
  }
}

function clearProjectForm() {
  ['projName', 'projDescription', 'projDuration', 'projYear'].forEach(id => {
    const elem = document.getElementById(id);
    if (elem) elem.value = '';
  });
}

function addCertificationEntry() {
  const name = document.getElementById('certName').value;
  const issuer = document.getElementById('certIssuer').value;
  const year = document.getElementById('certYear').value;
  
  if (!name || !issuer) {
    showStatus('Please fill Name and Issuer', 'error');
    return;
  }
  
  certificationEntries.push({ name, issuer, year });
  renderCertificationList();
  clearCertificationForm();
}

function renderCertificationList() {
  const list = document.getElementById('certificationList');
  if (list) {
    list.innerHTML = certificationEntries.map(c => 
      `<li>${c.name} by ${c.issuer} (${c.year || 'No date'})</li>`
    ).join('');
  }
}

function clearCertificationForm() {
  ['certName', 'certIssuer', 'certYear'].forEach(id => {
    const elem = document.getElementById(id);
    if (elem) elem.value = '';
  });
}

function addAchievementEntry() {
  const achName = document.getElementById('achName').value;
  const achDesc = document.getElementById('achDescription').value;
  const achYear = document.getElementById('achYear').value;
  
  if (!achName || !achDesc) {
    showStatus('Please fill Name and Description', 'error');
    return;
  }
  
  achievementEntries.push({ name: achName, description: achDesc, year: achYear });
  renderAchievementList();
  clearAchievementForm();
}

function renderAchievementList() {
  const list = document.getElementById('achievementList');
  if (list) {
    list.innerHTML = achievementEntries.map(a => 
      `<li>${a.name} - ${a.description} (${a.year || 'No date'})</li>`
    ).join('');
  }
}

function clearAchievementForm() {
  ['achName', 'achDescription', 'achYear'].forEach(id => {
    const elem = document.getElementById(id);
    if (elem) elem.value = '';
  });
}

function addReferenceEntry() {
  const refName = document.getElementById('refName').value;
  const refTitle = document.getElementById('refTitle').value;
  const refCompany = document.getElementById('refCompany').value;
  const refEmail = document.getElementById('refEmail').value;
  const refPhone = document.getElementById('refPhone').value;
  
  if (!refName || !refEmail) {
    showStatus('Please fill Name and Email', 'error');
    return;
  }
  
  referenceEntries.push({ name: refName, title: refTitle, company: refCompany, email: refEmail, phone: refPhone });
  renderReferenceList();
  clearReferenceForm();
}

function renderReferenceList() {
  const list = document.getElementById('referenceList');
  if (list) {
    list.innerHTML = referenceEntries.map(r => 
      `<li>${r.name} - ${r.title} at ${r.company} (${r.email})</li>`
    ).join('');
  }
}

function clearReferenceForm() {
  ['refName', 'refTitle', 'refCompany', 'refEmail', 'refPhone'].forEach(id => {
    const elem = document.getElementById(id);
    if (elem) elem.value = '';
  });
}

// Navigation functions
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

function switchStep(step) {
  steps.forEach(s => {
    const section = document.getElementById(s);
    if (section) section.style.display = s === step ? 'block' : 'none';
  });
  currentStep = step;
}

// UI helper functions
function showStatus(message, type = 'info') {
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

// DOM Content Loaded event
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
          e.preventDefault();
          submitStep(step);
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
