const crypto = require('crypto');
const mongoose = require.main.require('mongoose');
const QREvent = require('../models/qr-event.model.cjs');

exports.logEvent = async (type, req, res) => {
    try {
        // 1. Identity Persistence (Cookie based)
        let sessionId = req.cookies?.hiero_qr_sid;
        if (!sessionId) {
            sessionId = crypto.randomBytes(16).toString('hex');
            // Set 30-min cookie if it's the landing path
            if (res && res.cookie) {
                res.cookie('hiero_qr_sid', sessionId, { maxAge: 1800000, httpOnly: true });
            }
        }

        // 2. Normalization
        const campaignId = (req.query.c || req.params.campaignId || req.session_campaign || "direct")
                          .toString().toLowerCase().trim();

        // 3. DEBOUNCE (10 second guard for scans)
        if (type === 'scan') {
            const lastScan = await QREvent.findOne({
                sessionId,
                type: 'scan',
                createdAt: { $gt: new Date(Date.now() - 10000) }
            });
            if (lastScan) return; // Silence repeat scans
        }

        const event = new QREvent({ 
            type, 
            sessionId, 
            campaignId: campaignId || "direct",
            ip: req.ip, 
            userAgent: req.headers['user-agent'] 
        });
        
        return event.save();
    } catch (err) {
        console.error('🔥 Tracking Logic Error:', err.message);
    }
};
