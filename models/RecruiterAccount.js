const mongoose = require('mongoose');

// A company-side login for Connect. Deliberately separate from User: that
// model is student-shaped (points, badges, skill trees, roadmaps) and a
// recruiter is a different kind of account with a different blast radius —
// a recruiter reads other people's data, a student reads their own.
//
// There is no public signup for these. Accounts are created by
// scripts/create-recruiter.js, so a company exists in Connect only because
// somebody put it there on purpose.
const recruiterAccountSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    // bcrypt hash. The plaintext is never stored, logged or returned.
    passwordHash: { type: String, required: true },

    name: { type: String, default: '' },
    designation: { type: String, default: 'HR' },
    phone: { type: String, default: '' },

    // What this account is allowed to see. Every Connect query is scoped to
    // this company, and it comes from the signed token — never from a form
    // field the browser can set.
    companyId: { type: String, required: true, index: true },
    companyName: { type: String, required: true },

    role: { type: String, enum: ['recruiter', 'admin'], default: 'recruiter' },
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },

    // Set when an account is created with a temporary password, so the portal
    // can force a change on first sign-in.
    mustChangePassword: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date, default: null }
});

// What is safe to send to the browser: everything except the hash.
recruiterAccountSchema.methods.toSafeJSON = function toSafeJSON() {
    return {
        id: this._id.toString(),
        email: this.email,
        name: this.name,
        designation: this.designation,
        phone: this.phone,
        companyId: this.companyId,
        companyName: this.companyName,
        role: this.role,
        mustChangePassword: this.mustChangePassword
    };
};

module.exports = mongoose.models.RecruiterAccount
    || mongoose.model('RecruiterAccount', recruiterAccountSchema);
