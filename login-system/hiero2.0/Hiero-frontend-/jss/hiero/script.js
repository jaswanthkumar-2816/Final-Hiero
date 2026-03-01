// Load Dashboard Data
async function loadDashboard() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('You are not logged in. Redirecting to login page...');
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/dashboard', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const result = await response.json();
      document.getElementById('welcome-message').textContent = result.message;
    } else {
      alert('Session expired or invalid token. Redirecting to login page...');
      localStorage.removeItem('token');
      window.location.href = 'login.html';
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
    alert('An error occurred. Please try again.');
  }
}

// Call loadDashboard when the page loads
if (window.location.pathname.includes('dashboard.html')) {
  loadDashboard();
}

// Redirect to Create Resume Page
document.getElementById('create-resume')?.addEventListener('click', () => {
  window.location.href = 'resume-create.html';
});

// Redirect to Analyze Resume Page
document.getElementById('analyze-resume')?.addEventListener('click', () => {
  window.location.href = 'resume-analyze.html';
});

// Logout Functionality
document.getElementById('logout-btn')?.addEventListener('click', () => {
  localStorage.removeItem('token');
  alert('Logged out successfully!');
  window.location.href = 'login.html';
});