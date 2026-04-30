const mongoose = require.main.require('mongoose');

const qrEventSchema = new mongoose.Schema({
    type: { 
        type: String, 
        enum: ['scan', 'website_click', 'instagram_click'],
        required: true 
    },
    userId: { type: String, index: true },    
    sessionId: { type: String, index: true }, 
    campaignId: { type: String, default: 'direct', index: true }, 
    source: { type: String, default: 'qr' }, 
    ip: String,
    userAgent: String,
    createdAt: { type: Date, default: Date.now, index: true }
}, { 
    timestamps: false,
    versionKey: false 
});

// Compound index for time-series attribution
qrEventSchema.index({ createdAt: 1, campaignId: 1 });
qrEventSchema.index({ userId: 1, createdAt: 1 });

module.exports = mongoose.models.QREvent || mongoose.model('QREvent', qrEventSchema);
