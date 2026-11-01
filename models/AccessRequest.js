const mongoose = require('mongoose');

// A company asking to be let into Connect.
//
// Connect has no public signup — a recruiter reads other people's
// applications, so an account exists only because someone decided it should.
// This is that decision, written down: the request arrives here, a HIERO
// admin approves or rejects it, and approval is what creates the account.
//
// Before this, the sign-up form told people to send an email and stored
// nothing, so every request depended on somebody noticing a message.
const accessRequestSchema = new mongoose.Schema({
    companyName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    contactName: { type: String, default: '' },
    industry: { type: String, default: 'general' },
    phone: { type: String, default: '' },

    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true
    },

    // Who decided, and what they said. A rejection with no reason is a
    // support ticket waiting to happen.
    decidedAt: { type: Date, default: null },
    decidedBy: { type: String, default: '' },
    note: { type: String, default: '' },

    // Set on approval, so a request can be traced to the account it created.
    accountId: { type: String, default: '' },

    createdAt: { type: Date, default: Date.now },
    lastRequestedAt: { type: Date, default: Date.now }
});

accessRequestSchema.methods.toSafeJSON = function toSafeJSON() {
    return {
        id: this._id.toString(),
        companyName: this.companyName,
        email: this.email,
        contactName: this.contactName,
        industry: this.industry || 'general',
        phone: this.phone,
        status: this.status,
        note: this.note,
        accountId: this.accountId,
        decidedAt: this.decidedAt,
        decidedBy: this.decidedBy,
        createdAt: this.createdAt,
        lastRequestedAt: this.lastRequestedAt
    };
};

module.exports = mongoose.models.AccessRequest
    || mongoose.model('AccessRequest', accessRequestSchema);
