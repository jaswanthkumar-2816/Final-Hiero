/**
 * HIERO — Auth Service
 * Business logic for authentication. No Express dependencies.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRY } = require('../../config/constants');

// In-memory user store (migrated from legacy auth.js)
// In production, this should be fully replaced by MongoDB User model
let users = [];
let userIdCounter = 1;

function loadUsers(userData) {
    users = userData || [];
    userIdCounter = users.length > 0 ? Math.max(...users.map(u => Number(u.id) || 0)) + 1 : 1;
}

function findUserByEmail(email) {
    return users.find(u => u.email && u.email.trim().toLowerCase() === (email || '').trim().toLowerCase());
}

function findUserByIdentifier(identifier) {
    const id = (identifier || '').trim().toLowerCase();
    return users.find(u => {
        const uEmail = (u.email || '').trim().toLowerCase();
        const uName = (u.name || u.username || '').trim().toLowerCase();
        return uEmail === id || uName === id;
    });
}

function findUserById(id) {
    return users.find(u => String(u.id) === String(id));
}

function createUser({ name, email, password }) {
    const hashedPassword = bcrypt.hashSync(password.trim(), 10);
    const newUser = {
        id: String(userIdCounter++),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        emailVerified: true,
        signupMethod: 'email',
        createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    return newUser;
}

async function verifyPassword(plainText, hashedPassword) {
    return bcrypt.compare(plainText.trim(), hashedPassword);
}

function generateToken(user) {
    return jwt.sign(
        { userId: user.id, name: user.name, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
    );
}

function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

function getAllUsers() {
    return users;
}

module.exports = {
    loadUsers,
    findUserByEmail,
    findUserByIdentifier,
    findUserById,
    createUser,
    verifyPassword,
    generateToken,
    verifyToken,
    getAllUsers,
};
