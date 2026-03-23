// --- Unified Hiero Theme & Profile Engine ---

function toggleTheme() {
    const body = document.body;
    const html = document.documentElement;
    const isLight = body.classList.toggle('light-mode');
    
    // Sync both methods (class and data-attribute)
    if (isLight) {
        html.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        localStorage.setItem('hiero-theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        localStorage.setItem('hiero-theme', 'dark');
    }

    updateThemeIcons(isLight);
}

function updateThemeIcons(isLight) {
    const icons = document.querySelectorAll('.theme-toggle i, .theme-toggle-btn i, #theme-switch i');
    icons.forEach(icon => {
        if (isLight) {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            icon.style.color = '#333';
        } else {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            icon.style.color = 'white';
        }
    });
}

function updateGlobalUserProfile() {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
        console.warn('Hiero: No user data found in localStorage.');
        return;
    }

    try {
        const userData = JSON.parse(savedUser);
        console.log('Hiero: Syncing profile for', userData.email || userData.name);

        // Targeted element groups
        const avatarElements = document.querySelectorAll('.user-avatar, .user-avatar-small, .user-avatar-nav, #user-avatar, .user-profile .user-avatar');
        const nameElements = document.querySelectorAll('.user-name, #userName, .user-info h3, .user-profile span.user-name');
        const emailElements = document.querySelectorAll('#userEmail, .user-info p, .user-email');

        const initials = userData.name ? 
            userData.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 
            (userData.email ? userData.email[0].toUpperCase() : 'H');

        avatarElements.forEach(el => {
            el.innerHTML = ''; // Clear existing
            if (userData.picture) {
                const img = document.createElement('img');
                img.src = userData.picture;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.borderRadius = '50%';
                img.style.objectFit = 'cover';
                img.onerror = () => {
                    el.innerHTML = initials;
                    el.style.background = 'rgba(255, 255, 255, 0.05)';
                };
                el.appendChild(img);
                el.style.padding = '0';
                el.style.overflow = 'hidden';
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
            } else {
                el.textContent = initials;
                el.style.background = 'rgba(255, 255, 255, 0.05)';
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
                el.style.color = 'white';
                el.style.fontWeight = '700';
            }
        });

        const fullName = userData.name || (userData.email ? userData.email.split('@')[0] : 'User');
        const firstName = fullName.split(' ')[0];

        nameElements.forEach(el => {
            if (el.classList.contains('user-name-full') || el.id === 'userName') {
                el.textContent = fullName;
            } else {
                el.textContent = firstName;
            }
        });

        emailElements.forEach(el => {
            el.textContent = userData.email || '';
        });

    } catch (e) {
        console.error('Hiero: Error syncing profile:', e);
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || localStorage.getItem('hiero-theme') || 'dark';
    const isLight = savedTheme === 'light';
    
    const body = document.body;
    const html = document.documentElement;

    if (isLight) {
        body.classList.add('light-mode');
        html.setAttribute('data-theme', 'light');
    } else {
        body.classList.remove('light-mode');
        html.setAttribute('data-theme', 'dark');
    }

    updateThemeIcons(isLight);
    updateGlobalUserProfile();
}

// Global Font & Logo Consistency
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    
    // Inject global font if not present
    if (!document.getElementById('hiero-global-font')) {
        const style = document.createElement('style');
        style.id = 'hiero-global-font';
        style.textContent = `
            body, h1, h2, h3, h4, h5, h6, p, span, a, button, input, textarea { 
                font-family: 'Inter', -apple-system, sans-serif !important; 
            }
            .user-avatar-nav img, .user-avatar img, .user-avatar-small img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        `;
        document.head.appendChild(style);
    }
});

window.addEventListener('load', updateGlobalUserProfile);
window.toggleTheme = toggleTheme;
