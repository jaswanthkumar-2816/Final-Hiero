const trackingService = require('../services/tracking.service.cjs');
const path = require('path');

exports.handleLanding = async (req, res) => {
    try {
        // Now passing 'res' to set the session cookie
        await trackingService.logEvent('scan', req, res);
        res.sendFile(path.join(__dirname, '../views/landing.html'));
    } catch (e) {
        res.status(500).send("Portal Error");
    }
};

exports.redirectWebsite = async (req, res) => {
    // Ensure log is recorded BEFORE redirect
    await trackingService.logEvent('website_click', req, res);
    res.redirect('https://Hiero.in');
};

exports.redirectInstagram = async (req, res) => {
    // Ensure log is recorded BEFORE redirect
    await trackingService.logEvent('instagram_click', req, res);
    res.redirect('https://www.instagram.com/jaswanth___hiero');
};
