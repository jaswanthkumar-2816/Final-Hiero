/* ============================================================================
   HIERO — THEME ENGINE
   ============================================================================
   The single source of truth for which theme is active. Pair it with
   hiero-theme.css, which holds the colours themselves.

   IN EVERY PAGE'S <head>, BEFORE ANY OTHER STYLESHEET OR <style>:

       <link rel="stylesheet" href="/hiero-theme.css">
       <script src="/hiero-theme.js"></script>

   No `defer`, no `async`. This has to run before the first paint or a
   dark-mode user gets a white flash on every page load.

   THREE MODES
       'light'   — always light
       'dark'    — always dark
       'system'  — follow the operating system, and keep following it if the
                   user changes it while the page is open   (the default)

   WHY ONE FILE
       Hiero had four different localStorage keys ('theme', 'hiero-theme',
       'hiero_theme', 'hiero_admin_theme') and three different mechanisms
       (a <html data-theme> attribute, a body.light-mode class, and a
       body.dark-mode class with the opposite polarity). Nothing read anyone
       else's key, so choosing light on one page and navigating to another put
       you back in dark. This file replaces all of it and migrates the old
       keys so nobody loses their setting.

   API
       Hiero.theme.get()        -> 'light' | 'dark' | 'system'   (the choice)
       Hiero.theme.resolved()   -> 'light' | 'dark'              (what is on)
       Hiero.theme.set(mode)                                     (any of three)
       Hiero.theme.cycle()      -> light -> dark -> system -> light
       Hiero.theme.onChange(fn) -> unsubscribe function

       window.toggleTheme()     kept as an alias: dozens of pages call it from
                                inline onclick handlers.

       Event: document.addEventListener('hiero:themechange', e => {
                  e.detail.mode;      // 'light' | 'dark' | 'system'
                  e.detail.resolved;  // 'light' | 'dark'
              });
   ========================================================================= */

(function () {
    'use strict';

    var KEY = 'hiero.theme';

    // Deliberately a NEW key. Reusing one of the old ones would mean every
    // existing user arrives with a stale value from a system that worked
    // differently, which silently overrides the new default.
    var LEGACY_KEYS = ['theme', 'hiero-theme', 'hiero_theme', 'hiero_admin_theme'];

    var MODES = { light: 1, dark: 1, system: 1 };
    // Dark, not 'system', for now. Every page in Hiero was designed dark;
    // light mode still has invisible text on several of them. Following the
    // device would land most students -- whose laptops are set to light -- on
    // the broken theme. Switch this back to 'system' once light mode is
    // genuinely ready.
    var DEFAULT_MODE = 'dark';

    var root = document.documentElement;
    var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    var listeners = [];

    /* -- storage ---------------------------------------------------------- */
    // Every access is guarded: localStorage throws in private mode on some
    // browsers, and a theme engine must never be the thing that breaks a page.

    function readStored() {
        try {
            var v = localStorage.getItem(KEY);
            if (v && MODES[v]) return v;

            // First run on this browser: adopt whatever the old system had, so
            // an existing user's choice survives the migration.
            for (var i = 0; i < LEGACY_KEYS.length; i++) {
                var old = localStorage.getItem(LEGACY_KEYS[i]);
                if (old === 'light' || old === 'dark') {
                    try { localStorage.setItem(KEY, old); } catch (e) {}
                    return old;
                }
            }
        } catch (e) {}
        return DEFAULT_MODE;
    }

    function writeStored(mode) {
        try { localStorage.setItem(KEY, mode); } catch (e) {}
    }

    /* -- resolution -------------------------------------------------------- */

    function systemPrefers() {
        return (media && media.matches) ? 'dark' : 'light';
    }

    function resolve(mode) {
        return mode === 'system' ? systemPrefers() : mode;
    }

    /* -- application ------------------------------------------------------- */

    function apply(mode, animate) {
        var resolved = resolve(mode);

        if (animate) {
            root.classList.add('hiero-theme-switching');
            window.setTimeout(function () {
                root.classList.remove('hiero-theme-switching');
            }, 220);
        }

        // The canonical signal. hiero-theme.css keys off this and nothing else.
        root.setAttribute('data-theme', resolved);

        // Native controls, scrollbars and form widgets follow this.
        root.style.colorScheme = resolved;

        applyLegacyClasses(resolved);
        updateToggleIcons(resolved);
    }

    // Pages written before this file style themselves with body classes rather
    // than the attribute, and feedback.html uses the OPPOSITE polarity to
    // everything else ('dark-mode' added for dark, where the rest add
    // 'light-mode' for light). Setting all three keeps every existing page
    // working while they are migrated one at a time.
    function applyLegacyClasses(resolved) {
        var body = document.body;
        if (!body) return;   // <head> execution: handled again on DOM ready
        body.classList.toggle('light-mode', resolved === 'light');
        body.classList.toggle('dark-mode', resolved === 'dark');
    }

    // Keeps sun/moon icons in existing toggles pointing the right way without
    // each page having to do it.
    function updateToggleIcons(resolved) {
        var icons = document.querySelectorAll(
            '.theme-toggle i, .theme-toggle-btn i, #theme-switch i, #theme-icon'
        );
        for (var i = 0; i < icons.length; i++) {
            var el = icons[i];
            el.classList.remove('fa-sun', 'fa-moon');
            el.classList.add(resolved === 'dark' ? 'fa-sun' : 'fa-moon');
        }
    }

    function notify(mode) {
        var detail = { mode: mode, resolved: resolve(mode) };
        for (var i = 0; i < listeners.length; i++) {
            try { listeners[i](detail); } catch (e) { /* a bad listener must not stop the rest */ }
        }
        try {
            document.dispatchEvent(new CustomEvent('hiero:themechange', { detail: detail }));
        } catch (e) {}
    }

    /* -- public API -------------------------------------------------------- */

    var current = readStored();

    var api = {
        get: function () { return current; },

        resolved: function () { return resolve(current); },

        set: function (mode) {
            if (!MODES[mode]) return current;
            current = mode;
            writeStored(mode);
            apply(mode, true);
            notify(mode);
            return mode;
        },

        /* light -> dark -> system -> light. Three modes need three stops; a
           two-way toggle would make "follow my system" unreachable. */
        cycle: function () {
            return api.set(current === 'light' ? 'dark'
                         : current === 'dark'  ? 'system'
                         : 'light');
        },

        onChange: function (fn) {
            if (typeof fn !== 'function') return function () {};
            listeners.push(fn);
            return function () {
                var i = listeners.indexOf(fn);
                if (i > -1) listeners.splice(i, 1);
            };
        },

        /* For a three-way segmented control, so a page does not have to know
           the mode names or the ordering. */
        modes: ['light', 'dark', 'system']
    };

    window.Hiero = window.Hiero || {};
    window.Hiero.theme = api;

    // Dozens of pages call toggleTheme() from inline onclick attributes. Those
    // keep working, and now go through this engine instead of their own copy.
    window.toggleTheme = function () { return api.cycle(); };

    /* -- first paint ------------------------------------------------------- */
    // Runs immediately, while <head> is parsing. document.body does not exist
    // yet, so the legacy classes are applied again below once it does.
    apply(current, false);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            applyLegacyClasses(resolve(current));
            updateToggleIcons(resolve(current));
        });
    } else {
        applyLegacyClasses(resolve(current));
        updateToggleIcons(resolve(current));
    }

    /* -- stay in sync ------------------------------------------------------ */

    // The OS theme changed while the page is open. Only matters on 'system'.
    if (media) {
        var onSystemChange = function () {
            if (current === 'system') { apply(current, true); notify(current); }
        };
        if (media.addEventListener) media.addEventListener('change', onSystemChange);
        else if (media.addListener) media.addListener(onSystemChange);   // older Safari
    }

    // Another tab changed the theme. Without this, two open tabs disagree.
    window.addEventListener('storage', function (e) {
        if (e.key !== KEY || !e.newValue || !MODES[e.newValue]) return;
        current = e.newValue;
        apply(current, true);
        notify(current);
    });

    // Back/forward cache restores can resurrect a stale <html> attribute.
    window.addEventListener('pageshow', function (e) {
        if (e.persisted) apply(current, false);
    });
})();
