function toggleTheme() {
    const body = document.body;
    const icon = document.querySelector('.theme-toggle i');

    body.classList.toggle('light-mode');

    const isLight = body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');

    if (icon) {
        if (isLight) {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            icon.style.color = '#333';
        } else {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            icon.style.color = 'white';
        }
    }
}

// Function to initialize theme state on load
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const body = document.body;

    if (savedTheme === 'light') {
        body.classList.add('light-mode');
    }

    // Ensure icon matches state
    const isLight = body.classList.contains('light-mode');
    const icon = document.querySelector('.theme-toggle i');

    if (icon) {
        if (isLight) {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            icon.style.color = '#333';
        } else {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            icon.style.color = 'white';
        }
    }
}

// Run on load
window.addEventListener('DOMContentLoaded', initTheme);
// Also run on 'load' event just in case DOMContentLoaded fired too early for some reason (e.g. script placement)
window.addEventListener('load', initTheme);
