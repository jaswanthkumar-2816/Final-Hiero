// --- Hiero: global profile sync ---------------------------------------------
//
// THEMING HAS MOVED. It now lives in one place, served by the backend:
//
//     <link rel="stylesheet" href="/theme/hiero.css">
//     <script src="/theme/hiero.js"></script>
//
// This file used to carry its own copy of the theme logic, writing the keys
// 'theme' and 'hiero-theme' and toggling body.light-mode itself. Other pages
// used three further keys and two other mechanisms, so a choice made on one
// page was invisible to the next. All of that is gone from here; what remains
// is the profile sync, which was never theming and is still needed.
//
// toggleTheme() is kept as a shim because a dozen pages call it from inline
// onclick attributes. It delegates to the shared engine when that engine is
// present, and falls back to the old behaviour on any page that has not been
// connected yet -- so this file is safe during the migration either way.

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

function toggleTheme() {
    if (window.Hiero && window.Hiero.theme) return window.Hiero.theme.cycle();

    // Fallback for a page that has not yet loaded /theme/hiero.js.
    var isLight = document.body.classList.toggle('light-mode');
    document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
    try { localStorage.setItem('hiero.theme', isLight ? 'light' : 'dark'); } catch (e) {}
    return isLight ? 'light' : 'dark';
}

document.addEventListener('DOMContentLoaded', function () {
    updateGlobalUserProfile();

    // Only applied where the shared engine is absent; once a page loads
    // /theme/hiero.js this is a no-op, because that engine has already set the
    // attribute and the body class before first paint.
    if (!(window.Hiero && window.Hiero.theme)) {
        var saved = 'system';
        try { saved = localStorage.getItem('hiero.theme') || localStorage.getItem('theme') || 'system'; } catch (e) {}
        var dark = saved === 'dark' ||
            (saved === 'system' && window.matchMedia &&
             window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        document.body.classList.toggle('light-mode', !dark);
    }

    // The global Inter override that used to live here has been removed. It
    // set font-family with !important on every element across a dozen pages,
    // which beat the brand typefaces the theme serves (Fraunces for headings,
    // Plus Jakarta Sans for body). The avatar sizing it also carried is kept,
    // because that is layout, not type.
    if (!document.getElementById('hiero-avatar-fix')) {
        var style = document.createElement('style');
        style.id = 'hiero-avatar-fix';
        style.textContent =
            ".user-avatar-nav img, .user-avatar img, .user-avatar-small img {" +
            " width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }";
        document.head.appendChild(style);
    }
});

window.addEventListener('load', updateGlobalUserProfile);
window.toggleTheme = toggleTheme;
