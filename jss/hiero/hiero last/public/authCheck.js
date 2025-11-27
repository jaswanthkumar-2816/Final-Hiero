// authCheck.js
// Call this on every protected page (dashboard, profile, etc.)
(function() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }
  // Optional: JWT expiry check
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp * 1000;
    if (Date.now() > expiry) {
      localStorage.removeItem('token');
      window.location.href = '/login.html';
    }
  } catch (e) {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
  }
})();
