const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Initialize Razorpay SDK instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_T1Sny5T0rJRQuw',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '6cFpqePtEeyOBcfRftetu9Zm'
});

const PLAN_PRICES = {
    'affordable': 9,   // ₹9
    'premium': 25,     // ₹25
    'single': 9,       // ₹9 (fallback)
    'week': 49,        // ₹49 (fallback)
    'month': 99,       // ₹99 (fallback)
    '3months': 149,    // ₹149 (fallback)
    '6months': 249     // ₹249 (fallback)
};

const USERS_FILE = path.join(__dirname, '..', 'users.json');

// Helper to check if MongoDB is connected
function isMongoConnected() {
    const mongoose = require('mongoose');
    return mongoose.connection && mongoose.connection.readyState === 1;
}

// 🎟️ POST /api/payment/create-order
// Prepares a secure order with Razorpay
router.post('/create-order', async (req, res) => {
    try {
        const { planId } = req.body;
        
        if (!planId || PLAN_PRICES[planId] === undefined) {
            return res.status(400).json({ error: 'Invalid or missing planId' });
        }

        const amountInRupees = PLAN_PRICES[planId];
        const amountInPaise = amountInRupees * 100;

        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `receipt_order_${Date.now()}_${Math.floor(Math.random() * 1000)}`
        };

        const order = await razorpay.orders.create(options);
        
        res.json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_T1Sny5T0rJRQuw'
        });
    } catch (err) {
        console.error('❌ Razorpay order creation failed:', err.message);
        res.status(500).json({ error: 'Failed to create payment order', details: err.message });
    }
});

// 🔐 POST /api/payment/verify-payment
// Cryptographically validates the transaction and updates subscription status
router.post('/verify-payment', authenticateToken, async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, planId } = req.body;
        const userEmail = req.user.email;
        const userId = req.user.userId;

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !planId) {
            return res.status(400).json({ error: 'Missing required validation parameters' });
        }

        if (PLAN_PRICES[planId] === undefined) {
            return res.status(400).json({ error: 'Invalid plan selected' });
        }

        // Validate the cryptographic signature
        const secret = process.env.RAZORPAY_KEY_SECRET || '6cFpqePtEeyOBcfRftetu9Zm';
        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            console.error('⚠️ Signature mismatch for payment validation!');
            return res.status(400).json({ error: 'Payment signature verification failed' });
        }

        // Calculate subscription expiration date
        const daysToAdd = {
            'affordable': 30,
            'premium': 90,
            'single': 1,
            'week': 7,
            'month': 30,
            '3months': 90,
            '6months': 180
        }[planId] || 30;

        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + daysToAdd);

        console.log(`✅ Payment verified for user ${userEmail}. Plan: ${planId}, Duration: ${daysToAdd} days.`);

        // 1. Update status in MongoDB
        if (isMongoConnected()) {
            const user = await User.findOne({ email: userEmail.toLowerCase().trim() });
            if (user) {
                user.isPro = true;
                user.proUntil = expirationDate;
                user.proPlan = planId;
                await user.save();
                console.log('✅ MongoDB user record updated with PRO access.');
            }
        }

        // 2. Update status in local users.json fallback
        try {
            const authObj = require('./auth');
            const localUsers = authObj.users || [];
            const userIdx = localUsers.findIndex(u => u.email && u.email.toLowerCase().trim() === userEmail.toLowerCase().trim());
            
            if (userIdx !== -1) {
                localUsers[userIdx].isPro = true;
                localUsers[userIdx].proUntil = expirationDate.toISOString();
                localUsers[userIdx].proPlan = planId;
                
                // Write updated array back to JSON storage
                fs.writeFileSync(USERS_FILE, JSON.stringify(localUsers, null, 2));
                console.log('✅ Local JSON user record updated with PRO access.');
            }
        } catch (jsonErr) {
            console.error('Error writing to users.json during payment verification:', jsonErr.message);
        }

        res.json({
            success: true,
            message: 'Payment verified successfully. Account upgraded to PRO!',
            proUntil: expirationDate.toISOString(),
            proPlan: planId
        });

    } catch (err) {
        console.error('❌ Payment verification failed:', err.message);
        res.status(500).json({ error: 'Verification server error', details: err.message });
    }
});

module.exports = router;
