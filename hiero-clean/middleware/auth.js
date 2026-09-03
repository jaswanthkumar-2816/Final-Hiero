/**
 * HIERO — JWT Authentication Middleware
 * Verifies Bearer tokens and attaches decoded user to req.user.
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : (authHeader || req.query.token);

    if (!token) {
        return res.status(401).json({ error: 'Access denied. Token missing.' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = decoded;
        next();
    });
}

// Optional auth — attaches user if token present, but doesn't block
function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

    if (token) {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (!err) req.user = decoded;
        });
    }
    next();
}

module.exports = { authenticateToken, optionalAuth };
