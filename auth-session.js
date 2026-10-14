/* Hiero — keeps a signed-in session alive.
 *
 * The server re-issues a token once the current one passes half its 7-day life
 * and returns it on X-Refreshed-Token (see authenticateToken in routes/auth.js).
 * Nothing was reading that header, so tokens simply expired and users were sent
 * back to the login page about once a week. This wraps fetch to catch the new
 * token and store it.
 *
 * The app reads the token under two different keys depending on the page
 * ('token' in most places, 'jwtToken' in others), so both are written here to
 * keep every page agreeing about who is signed in.
 *
 * Load it before any script that calls the API:
 *   <script src="/auth-session.js"></script>
 */
(function () {
    'use strict';

    var KEYS = ['token', 'jwtToken'];

    function store(token) {
        if (!token) return;
        try {
            for (var i = 0; i < KEYS.length; i++) localStorage.setItem(KEYS[i], token);
        } catch (e) {
            // Private browsing, or storage disabled. The current token still
            // works for this page load; there is nothing useful to do here.
        }
    }

    function read() {
        try {
            for (var i = 0; i < KEYS.length; i++) {
                var v = localStorage.getItem(KEYS[i]);
                if (v) return v;
            }
        } catch (e) { /* storage unavailable */ }
        return null;
    }

    function clear() {
        try {
            for (var i = 0; i < KEYS.length; i++) localStorage.removeItem(KEYS[i]);
            localStorage.removeItem('user');
        } catch (e) { /* storage unavailable */ }
    }

    // Reads the expiry out of the JWT payload. This decides whether to bother
    // sending a request, nothing more -- the server still verifies every token,
    // so a forged payload gains nothing here.
    function expired(token) {
        try {
            var part = token.split('.')[1];
            if (!part) return false;
            var json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
            var exp = JSON.parse(json).exp;
            return typeof exp === 'number' && exp * 1000 <= Date.now();
        } catch (e) {
            return false;   // unreadable: let the server be the judge
        }
    }

    // One source of truth, so a page that wrote only one key does not leave the
    // other stale and pointing at a previous account.
    //
    // Logging out used to clear 'token' and leave 'jwtToken' behind, and pages
    // read `token || jwtToken`, so the dead session came back, got rejected,
    // and bounced the user to the login page again. Copying one key to the
    // other would have reintroduced exactly that, so an expired token clears
    // the session here instead of being propagated.
    var current = read();
    if (current && expired(current)) clear();
    else store(current);

    var nativeFetch = window.fetch;
    if (typeof nativeFetch === 'function') {
        window.fetch = function () {
            return nativeFetch.apply(this, arguments).then(function (response) {
                try {
                    var fresh = response.headers && response.headers.get('X-Refreshed-Token');
                    if (fresh) store(fresh);
                } catch (e) { /* opaque or cross-origin response */ }
                return response;
            });
        };
    }

    // Some older pages still use XMLHttpRequest.
    var open = window.XMLHttpRequest && window.XMLHttpRequest.prototype.open;
    if (open) {
        window.XMLHttpRequest.prototype.open = function () {
            this.addEventListener('load', function () {
                try {
                    var fresh = this.getResponseHeader('X-Refreshed-Token');
                    if (fresh) store(fresh);
                } catch (e) { /* header not exposed */ }
            });
            return open.apply(this, arguments);
        };
    }

    window.HieroSession = { get: read, set: store, clear: clear, expired: expired };
})();
