document.addEventListener('DOMContentLoaded', () => {
  // Start at the first step
  showStep('basic');
});

// Store resume data and selected template
let resumeData = {};
let selectedTemplate = 'alatacv';

// List of steps in order
const steps = [
  'basic', 'education', 'projects', 'skills', 'certifications',
  'achievements', 'hobbies', 'personal_details', 'references', 'photo', 'template', 'generate'
];

// Show the given step and hide others
function showStep(step) {
  steps.forEach(s => {
    const el = document.getElementById(`${s}-form`);
    if (el) el.classList.remove('active');
  });
  const current = document.getElementById(`${step}-form`);
  if (current) current.classList.add('active');
}
window.showStep = showStep;

// Show/hide loading overlay
function toggleLoading(show) {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

// Set status message
function setStatus(message, className = '') {
  const status = document.getElementById('status');
  if (status) {
    status.textContent = message;
    status.className = `status ${className}`;
  }
}

// Submit a step (called by Next buttons)
window.submitStep = async function(step) {
  try {
    toggleLoading(true);
    let body = {};
    let apiUrl = `http://localhost:5005/resume/${step}`;
    let options = { method: 'POST', headers: {}, body: null };

    if (step === 'photo') {
      const photoFile = document.getElementById('photo')?.files[0];
      if (!photoFile) return window.skipPhoto();
      const formData = new FormData();
      formData.append('photo', photoFile);
      options.body = formData;
    } else {
      body = getFormData(step);
      resumeData[step] = body;
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    let nextStep = getNextStep(step);

    // Try backend, but always progress to next step even if backend fails
    try {
      const response = await fetch(apiUrl, options);
      const result = await response.json();
      if (response.ok) {
        nextStep = result.nextStep || nextStep;
        setStatus(result.message || 'Step saved ✅', 'status-success');
      } else {
        setStatus(result.error || 'Error submitting data', 'status-error');
      }
    } catch (err) {
      setStatus('Backend not connected, progressing anyway...', 'status-error');
    }

    showStep(nextStep);
  } catch (err) {
    console.error(err);
    setStatus('Error: ' + err.message, 'status-error');
  } finally {
    toggleLoading(false);
  }
};

// Collect form data for a step
function getFormData(step) {
  const data = {};
  document.querySelectorAll(`#${step}-form-element input, #${step}-form-element textarea`).forEach(input => {
    data[input.id] = input.value.trim();
  });
  return data;
}

// Get the next step in the flow
function getNextStep(currentStep) {
  const index = steps.indexOf(currentStep);
  return steps[index + 1] || 'template';
}

// Skip photo upload
window.skipPhoto = function() {
  showStep('template');
  setStatus('Skipped photo upload', 'status-success');
};

// Handle template selection
window.submitTemplate = function() {
  const selected = document.querySelector('input[name="template"]:checked');
  selectedTemplate = selected ? selected.value : 'alatacv';
  setStatus('Template selected: ' + selectedTemplate, 'status-success');
  showStep('generate');
};

// Fetch resume preview
window.fetchPreview = async function() {
  try {
    toggleLoading(true);
    const response = await fetch('http://localhost:5005/resume/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...resumeData, template: selectedTemplate })
    });
    const result = await response.json();
    const preview = document.getElementById('preview');
    if (preview) {
      preview.textContent = JSON.stringify(result.preview || result, null, 2);
    }
  } catch (err) {
    setStatus('Error loading preview: ' + err.message, 'status-error');
  } finally {
    toggleLoading(false);
  }
};

// Generate and download resume
window.generateResume = async function() {
  if (!resumeData.basic?.full_name) {
    setStatus('Fill in basic info first.', 'status-error');
    showStep('basic');
    return;
  }

  if (!confirm('Pay ₹10 to download your resume?')) {
    setStatus('Payment cancelled.', 'status-error');
    return;
  }

  try {
    toggleLoading(true);
    const response = await fetch('http://localhost:5005/resume/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...resumeData, template: selectedTemplate })
    });
    const result = await response.json();

    if (response.ok && result.file) {
      const link = document.createElement('a');
      link.href = `http://localhost:5005/resume/download?file=${encodeURIComponent(result.file)}`;
      link.download = result.file;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setStatus('Downloading resume...', 'status-success');
    } else {
      setStatus(result.error || 'Error generating resume', 'status-error');
    }
  } catch (err) {
    console.error(err);
    setStatus('Error generating resume: ' + err.message, 'status-error');
  } finally {
    toggleLoading(false);
  }
};
const form = document.getElementById("analyze-form");
if (!form) {
  alert("Form setup error. Please refresh or check the page.");
  return;
}