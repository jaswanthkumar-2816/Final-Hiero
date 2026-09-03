/**
 * HIERO — Passport OAuth Strategies
 * Google and GitHub OAuth configuration.
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;

function configurePassport() {
    // Google OAuth
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/auth/google/callback',
        }, (accessToken, refreshToken, profile, done) => {
            done(null, {
                id: profile.id,
                name: profile.displayName,
                email: profile.emails?.[0]?.value,
                picture: profile.photos?.[0]?.value,
            });
        }));
        console.log('✅ Google OAuth configured');
    } else {
        console.warn('⚠️  Google OAuth not configured (missing CLIENT_ID/SECRET)');
    }

    // GitHub OAuth
    if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
        passport.use(new GitHubStrategy({
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: '/auth/github/callback',
        }, (accessToken, refreshToken, profile, done) => {
            done(null, {
                id: profile.id,
                name: profile.displayName || profile.username,
                email: profile.emails?.[0]?.value,
                picture: profile.photos?.[0]?.value,
            });
        }));
        console.log('✅ GitHub OAuth configured');
    } else {
        console.warn('⚠️  GitHub OAuth not configured (missing CLIENT_ID/SECRET)');
    }

    // No session serialization needed (stateless JWT)
    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));
}

module.exports = { configurePassport };
