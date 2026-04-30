const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qr.controller.cjs');
const analyticsController = require('../controllers/analytics.controller.cjs');

// Landing Page (Standard & Campaignized)
router.get(['/', '/:campaignId'], qrController.handleLanding);

// Redirections (Tracked)
router.get('/go/website', qrController.redirectWebsite);
router.get('/go/instagram', qrController.redirectInstagram);

// Admin / Stats
router.get('/admin/dashboard', analyticsController.getDashboard);

module.exports = router;
