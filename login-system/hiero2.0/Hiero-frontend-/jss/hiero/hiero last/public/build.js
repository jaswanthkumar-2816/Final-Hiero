// Hiero Resume Builder - Clean Implementation with proper authentication
// Template management variables
let selectedTemplate = null;
let availableTemplates = [];

// Step management
const steps = ['basic', 'education', 'projects', 'skills', 'certifications', 'achievements', 'hobbies', 'personal_details', 'references', 'photo', 'preview'];
let currentStep = 'basic';

// Entry arrays for multi-item forms
let educationEntries = [];
let projectEntries = [];
let certificationEntries = [];
let achievementEntries = [];
let referenceEntries = [];

// Authentication functions
function getAuthToken() {
  // Try to get token from URL params first (OAuth redirect)
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get('token');
  if (urlToken) {
    localStorage.setItem('jwtToken', urlToken);
    // Clean URL by removing token param
    const url = new URL(window.location);
    url.searchParams.delete('token');
    url.searchParams.delete('user');
    window.history.replaceState({}, document.title, url.toString());
    return urlToken;
  }
  
  // Fallback to localStorage
  return localStorage.getItem('jwtToken');
}

function clearAuthToken() {
  localStorage.removeItem('jwtToken');
}

async function ensureAuthenticated() {
  let token = getAuthToken();
  if (!token) {
    // Try to get a demo token for testing
    try {
      const response = await fetch('http://localhost:5003/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      });
      const result = await response.json();
      if (result.success && result.token) {
        localStorage.setItem('jwtToken', result.token);
        token = result.token;
        showStatus('Authenticated successfully', 'success');
      } else {
        throw new Error('Failed to get demo token');
      }
    } catch (error) {
      showStatus('Authentication failed. Please try refreshing the page.', 'error');
      throw new Error('No authentication token');
    }
  }
  return token;
}

// Main submit step function
async function submitStep(step) {
  console.log(`[DEBUG] Submitting step: ${step}`);
  
  try {
    // Special handling for photo upload
    if (step === 'photo') {
      const photoElem = document.getElementById('photo');
      if (photoElem && photoElem.files[0]) {
        const formData = new FormData();
        formData.append('photo', photoElem.files[0]);
        await uploadPhoto(formData);
        return;
      } else {
        // Skip photo if no file selected
        console.log('[DEBUG] No photo selected, skipping to preview');
        switchStep('preview');
        return;
      }
    }

    const data = collectFormData(step);
    console.log(`[DEBUG] Collected data for ${step}:`, data);
    
    if (!data) {
      showStatus('Please fill all required fields', 'error');
      return;
    }

    showLoading(true);
    await ensureAuthenticated();
    
    const headers = { 'Content-Type': 'application/json' };
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    console.log('[DEBUG] Submitting step:', step, 'with data:', data);
    
    const response = await fetch(`http://localhost:5003/api/resume/${step}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('Server returned non-JSON response');
    }
    
    const result = await response.json();
    console.log('[DEBUG] Response for', step, result);
    
    if (response.ok && result.success) {
      showStatus(result.message || `${step} saved successfully`, 'success');
      // Navigate to next step
      const nextStepIndex = steps.indexOf(step) + 1;
      if (nextStepIndex < steps.length) {
        const nextStep = steps[nextStepIndex];
        switchStep(nextStep);
      } else {
        // All steps completed, show preview
        switchStep('preview');
      }
    } else {
      showStatus(result.error || 'Failed to save', 'error');
    }
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
    console.error('[DEBUG] Exception submitting', step, error);
  } finally {
    showLoading(false);
  }
}

// Upload photo function
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
      showStatus('Photo uploaded successfully', 'success');
      switchStep('preview');
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

// Generate preview function
async function generatePreview() {
  try {
    showLoading(true);
    await ensureAuthenticated();
    
    const headers = { 'Content-Type': 'application/json' };
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    console.log('[DEBUG] Generating preview...');
    
    const response = await fetch('http://localhost:5003/api/resume/preview', {
      method: 'POST',
      headers
    });
    
    const result = await response.json();
    console.log('[DEBUG] Preview response:', result);
    
    if (response.ok && result.success) {
      displayPreview(result.preview);
      showStatus('Resume preview generated successfully', 'success');
    } else {
      showStatus(result.error || 'Failed to generate preview', 'error');
      console.error('[DEBUG] Preview error:', result);
    }
  } catch (error) {
    showStatus('Error generating preview: ' + error.message, 'error');
    console.error('[DEBUG] Preview exception:', error);
  } finally {
    showLoading(false);
  }
}

// Generate and download resume
async function generateResume() {
  try {
    showLoading(true);
    await ensureAuthenticated();
    
    const headers = { 'Content-Type': 'application/json' };
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    console.log('[DEBUG] Generating resume for download...');
    console.log('[DEBUG] Token:', token ? `${token.substring(0, 30)}...` : 'NO TOKEN');
    console.log('[DEBUG] Headers:', headers);
    
    // First, set the template if one is selected
    if (selectedTemplate) {
      await fetch('http://localhost:5003/api/resume/template', {
        method: 'POST',
        headers,
        body: JSON.stringify({ template: selectedTemplate })
      });
    }
    
    const response = await fetch('http://localhost:5003/api/resume/generate-fast', {
      method: 'POST',
      headers
    });
    
    const result = await response.json();
    console.log('[DEBUG] Generate response:', result);
    
    if (response.ok && result.success) {
      showStatus('Resume generated successfully', 'success');
      // Download the file
      if (result.file) {
        window.location.href = `http://localhost:5003/api/resume/download?file=${result.file}`;
      }
    } else {
      showStatus(result.error || 'Failed to generate resume', 'error');
      console.error('[DEBUG] Generate error:', result);
    }
  } catch (error) {
    showStatus('Error generating resume: ' + error.message, 'error');
    console.error('[DEBUG] Generate exception:', error);
  } finally {
    showLoading(false);
  }
}

// Display preview in the UI
function displayPreview(preview) {
  // Switch to preview step
  switchStep('preview');
  
  // The preview content is already handled by the HTML structure
  // Just ensure the preview form is visible
  showStatus('Resume preview generated successfully', 'success');
}

// Collect form data based on step
function collectFormData(step) {
  console.log(`[DEBUG] Collecting form data for step: ${step}`);
  
  switch (step) {
    case 'basic': {
      const nameElem = document.getElementById('basicName');
      const emailElem = document.getElementById('basicEmail');
      const phoneElem = document.getElementById('basicPhone');
      const careerElem = document.getElementById('basicCareerObjective');
      const websiteElem = document.getElementById('basicWebsite') || document.getElementById('basicWebstite');
      
      console.log('[DEBUG] Basic form elements:', { nameElem, emailElem, phoneElem, careerElem, websiteElem });
      
      if (!nameElem || !emailElem || !phoneElem) {
        console.error('[DEBUG] Basic form elements missing');
        return null;
      }
      
      if (!nameElem.value || !emailElem.value || !phoneElem.value) {
        console.error('[DEBUG] Required basic info fields are empty:', {
          name: nameElem.value,
          email: emailElem.value,
          phone: phoneElem.value
        });
        return null;
      }
      
      const data = {
        full_name: nameElem.value,
        contact_info: {
          email: emailElem.value,
          phone: phoneElem.value,
          website: websiteElem ? websiteElem.value : ''
        },
        career_summary: careerElem ? careerElem.value : '',
        website: websiteElem ? websiteElem.value : ''
      };
      
      console.log('[DEBUG] Basic data collected:', data);
      return data;
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
    case 'photo':
      // Photo is handled separately in uploadPhoto function
      return {};
    default:
      return null;
  }
}

// Step navigation functions
function switchStep(step) {
  // Hide all forms and preview
  steps.forEach(s => {
    const section = document.getElementById(`${s}Form`);
    if (section) {
      section.classList.remove('active');
      section.style.display = 'none';
    }
  });
  
  const previewContainer = document.getElementById('previewContainer');
  if (previewContainer) {
    previewContainer.style.display = 'none';
  }
  
  // Show the target step
  const targetSection = document.getElementById(`${step}Form`);
  if (targetSection) {
    targetSection.classList.add('active');
    targetSection.style.display = 'block';
  }
  
  currentStep = step;
  
  // Update URL
  try {
    history.pushState({ step }, '', '#' + step);
  } catch(_) {}
  
  // Update progress
  updateProgress(step);
}

function updateProgress(step) {
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const currentStepEl = document.getElementById('currentStep');
  
  if (progressFill && progressText) {
    const progress = ((steps.indexOf(step) + 1) / steps.length) * 100;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `Step ${steps.indexOf(step) + 1} of ${steps.length}: ${step.charAt(0).toUpperCase() + step.slice(1)}`;
  }
  
  if (currentStepEl) {
    currentStepEl.textContent = steps.indexOf(step) + 1;
  }
}

// Utility functions
function showStatus(message, type = 'info') {
  const container = document.querySelector('.resume-container');
  if (!container) return;
  
  // Remove existing status
  const existing = container.querySelector('.status-message');
  if (existing) existing.remove();
  
  // Create new status
  const status = document.createElement('div');
  status.className = `status-message ${type}`;
  status.textContent = message;
  
  container.insertBefore(status, container.firstChild);
  
  // Auto-remove success messages
  if (type === 'success') {
    setTimeout(() => status.remove(), 5000);
  }
}

function showLoading(show) {
  // Simple loading indicator
  let loader = document.getElementById('loadingIndicator');
  if (!loader && show) {
    loader = document.createElement('div');
    loader.id = 'loadingIndicator';
    loader.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); color: #45c604; padding: 20px; border-radius: 10px; z-index: 1000;';
    loader.textContent = 'Loading...';
    document.body.appendChild(loader);
  } else if (loader && !show) {
    loader.remove();
  }
}

// Load templates from backend
async function loadTemplates() {
  try {
    showStatus('Loading templates...', 'info');
    showLoading(true);
    const response = await fetch('http://localhost:5003/api/resume/templates');
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    const result = await response.json();
    const templates = result.templates || [];
    const categories = result.categories || {};
    
    if (!templates.length) {
      showStatus('No templates available', 'info');
      return;
    }
    
    availableTemplates = templates.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      preview: t.preview.startsWith('/') ? `http://localhost:5003${t.preview}` : t.preview,
      recommended: t.recommended || [],
      category: t.category
    }));
    
    renderTemplateGrid(availableTemplates);
    showStatus(`Loaded ${availableTemplates.length} templates`, 'success');
  } catch (error) {
    console.error('Template load error:', error);
    showStatus('Failed to load templates', 'error');
  } finally {
    showLoading(false);
  }
}

// Render template grid
function renderTemplateGrid(templates) {
  const container = document.getElementById('templateGrid');
  if (!container) return;
  
  if (!templates.length) {
    container.innerHTML = '<p style="text-align: center; color: #666;">No templates available</p>';
    return;
  }
  
  container.innerHTML = templates.map(template => `
    <div class="template-card" data-template-id="${template.id}">
      <div class="template-preview">
        <img src="${template.preview}" alt="${template.name}" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFByZXZpZXc8L3RleHQ+PC9zdmc+'">
      </div>
      <div class="template-info">
        <h3>${template.name}</h3>
        <p>${template.description}</p>
        <button class="btn btn-green select-template" onclick="selectTemplate('${template.id}')">
          Select Template
        </button>
      </div>
    </div>
  `).join('');
}

// Template selection
function selectTemplate(templateId) {
  selectedTemplate = templateId;
  
  // Update UI
  document.querySelectorAll('.template-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  const selectedCard = document.querySelector(`[data-template-id="${templateId}"]`);
  if (selectedCard) {
    selectedCard.classList.add('selected');
  }
  
  showStatus(`Template "${templateId}" selected`, 'success');
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
  if (!list) return;
  
  list.innerHTML = educationEntries.map((entry, index) => `
    <li>
      ${entry.institution} - ${entry.degree} (${entry.year}) ${entry.gpa ? 'GPA: ' + entry.gpa : ''}
      <button onclick="removeEducationEntry(${index})" class="btn btn-gray btn-xs">Remove</button>
    </li>
  `).join('');
}

function removeEducationEntry(index) {
  educationEntries.splice(index, 1);
  renderEducationList();
}

function clearEducationForm() {
  document.getElementById('eduInstitution').value = '';
  document.getElementById('eduDegree').value = '';
  document.getElementById('eduYear').value = '';
  document.getElementById('eduGpa').value = '';
}

// Project form functions
function addProjectEntry() {
  const name = document.getElementById('projectName').value;
  const desc = document.getElementById('projectDesc').value;
  const tech = document.getElementById('projectTech').value;
  const link = document.getElementById('projectLink').value;
  
  if (!name || !desc) {
    showStatus('Please fill Project Name and Description', 'error');
    return;
  }
  
  projectEntries.push({ 
    title: name, 
    description: desc, 
    technologies: tech ? tech.split(',').map(t => t.trim()) : [],
    link: link || ''
  });
  renderProjectList();
  clearProjectForm();
}

function renderProjectList() {
  const list = document.getElementById('projectList');
  if (!list) return;
  
  list.innerHTML = projectEntries.map((entry, index) => `
    <li>
      <strong>${entry.title}</strong>: ${entry.description}
      ${entry.technologies.length ? `<br>Tech: ${entry.technologies.join(', ')}` : ''}
      <button onclick="removeProjectEntry(${index})" class="btn btn-gray btn-xs">Remove</button>
    </li>
  `).join('');
}

function removeProjectEntry(index) {
  projectEntries.splice(index, 1);
  renderProjectList();
}

function clearProjectForm() {
  document.getElementById('projectName').value = '';
  document.getElementById('projectDesc').value = '';
  document.getElementById('projectTech').value = '';
  document.getElementById('projectLink').value = '';
}

// Achievement functions
function addAchievementEntry() {
  const title = document.getElementById('achTitle').value;
  const desc = document.getElementById('achDesc').value;
  
  if (!title) {
    showStatus('Please fill Achievement Title', 'error');
    return;
  }
  
  achievementEntries.push(desc ? `${title}: ${desc}` : title);
  renderAchievementList();
  clearAchievementForm();
}

function renderAchievementList() {
  const list = document.getElementById('achievementList');
  if (!list) return;
  
  list.innerHTML = achievementEntries.map((entry, index) => `
    <li>
      ${entry}
      <button onclick="removeAchievementEntry(${index})" class="btn btn-gray btn-xs">Remove</button>
    </li>
  `).join('');
}

function removeAchievementEntry(index) {
  achievementEntries.splice(index, 1);
  renderAchievementList();
}

function clearAchievementForm() {
  document.getElementById('achTitle').value = '';
  document.getElementById('achDesc').value = '';
  document.getElementById('achYear').value = '';
}

// Helper functions for certifications
function addCertificationEntry() {
  const name = document.getElementById('certName').value;
  const issuer = document.getElementById('certIssuer').value;
  const year = document.getElementById('certYear').value;
  
  if (name) {
    certificationEntries.push({ name, issuer, year });
    renderCertificationList();
    clearCertificationForm();
  } else {
    showStatus('Please enter certification name', 'error');
  }
}

function renderCertificationList() {
  const list = document.getElementById('certificationsList');
  if (!list) return;
  
  list.innerHTML = certificationEntries.map((cert, index) => `
    <li>
      <strong>${cert.name}</strong>
      ${cert.issuer ? ` - ${cert.issuer}` : ''}
      ${cert.year ? ` (${cert.year})` : ''}
      <button onclick="removeCertificationEntry(${index})" class="btn btn-secondary" style="margin-left: 10px; padding: 5px 10px; font-size: 12px;">Remove</button>
    </li>
  `).join('');
}

function removeCertificationEntry(index) {
  certificationEntries.splice(index, 1);
  renderCertificationList();
}

function clearCertificationForm() {
  document.getElementById('certName').value = '';
  document.getElementById('certIssuer').value = '';
  document.getElementById('certYear').value = '';
}

// Helper functions for references
function addReferenceEntry() {
  const name = document.getElementById('refName').value;
  const contact = document.getElementById('refContact').value;
  const relationship = document.getElementById('refRelationship').value;
  
  if (name) {
    referenceEntries.push({ name, contact, relationship });
    renderReferenceList();
    clearReferenceForm();
  } else {
    showStatus('Please enter reference name', 'error');
  }
}

function renderReferenceList() {
  const list = document.getElementById('referencesList');
  if (!list) return;
  
  list.innerHTML = referenceEntries.map((ref, index) => `
    <li>
      <strong>${ref.name}</strong>
      ${ref.contact ? ` - ${ref.contact}` : ''}
      ${ref.relationship ? ` (${ref.relationship})` : ''}
      <button onclick="removeReferenceEntry(${index})" class="btn btn-secondary" style="margin-left: 10px; padding: 5px 10px; font-size: 12px;">Remove</button>
    </li>
  `).join('');
}

function removeReferenceEntry(index) {
  referenceEntries.splice(index, 1);
  renderReferenceList();
}

function clearReferenceForm() {
  document.getElementById('refName').value = '';
  document.getElementById('refContact').value = '';
  document.getElementById('refRelationship').value = '';
}

// Preview resume function (called from HTML)
async function previewResume() {
  await generatePreview();
}

// Download resume function (called from HTML)
async function downloadResume() {
  await generateResume();
}

// Skip step function (called from HTML)
function skipStep(step) {
  // For photo step, just proceed to next step
  if (step === 'photo') {
    switchStep('preview');
  }
}

// Function to restart the builder (called from HTML)
function restartBuilder() {
  if (confirm('Are you sure you want to start over? All current progress will be lost.')) {
    // Clear all form fields
    document.querySelectorAll('input, textarea').forEach(input => {
      if (input.type !== 'file') {
        input.value = '';
      }
    });
    
    // Clear all entry lists
    document.querySelectorAll('.entry-list').forEach(list => list.innerHTML = '');
    
    // Clear entry arrays
    educationEntries = [];
    projectEntries = [];
    certificationEntries = [];
    achievementEntries = [];
    referenceEntries = [];
    
    // Reset to first step
    switchStep('basic');
    
    // Clear status
    const status = document.getElementById('status');
    if (status) status.innerHTML = '';
    
    showStatus('Builder reset successfully', 'success');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Try to ensure authentication
  try {
    await ensureAuthenticated();
    showStatus('Ready to build your resume!', 'success');
  } catch (error) {
    showStatus('Authentication failed. Some features may not work.', 'error');
  }
  
  // Initialize first step
  switchStep('basic');
  
  // Load templates when we reach the template step
  if (currentStep === 'template') {
    await loadTemplates();
  }
  
  // Initialize "Add More" button event listeners
  const addEducationBtn = document.getElementById('addEducationBtn');
  if (addEducationBtn) {
    addEducationBtn.addEventListener('click', addEducationEntry);
  }
  
  const addProjectBtn = document.getElementById('addProjectBtn');
  if (addProjectBtn) {
    addProjectBtn.addEventListener('click', addProjectEntry);
  }
  
  const addCertificationBtn = document.getElementById('addCertificationBtn');
  if (addCertificationBtn) {
    addCertificationBtn.addEventListener('click', addCertificationEntry);
  }
  
  const addAchievementBtn = document.getElementById('addAchievementBtn');
  if (addAchievementBtn) {
    addAchievementBtn.addEventListener('click', addAchievementEntry);
  }
  
  const addReferenceBtn = document.getElementById('addReferenceBtn');
  if (addReferenceBtn) {
    addReferenceBtn.addEventListener('click', addReferenceEntry);
  }
});

// Make functions globally available
window.submitStep = submitStep;
window.switchStep = switchStep;
window.selectTemplate = selectTemplate;
window.addEducationEntry = addEducationEntry;
window.removeEducationEntry = removeEducationEntry;
window.addProjectEntry = addProjectEntry;
window.removeProjectEntry = removeProjectEntry;
window.addCertificationEntry = addCertificationEntry;
window.removeCertificationEntry = removeCertificationEntry;
window.addAchievementEntry = addAchievementEntry;
window.removeAchievementEntry = removeAchievementEntry;
window.addReferenceEntry = addReferenceEntry;
window.removeReferenceEntry = removeReferenceEntry;
window.generatePreview = generatePreview;
window.generateResume = generateResume;
window.openFastHTMLPreview = openFastHTMLPreview;
window.previewResume = previewResume;
window.downloadResume = downloadResume;
window.skipStep = skipStep;
window.restartBuilder = restartBuilder;
