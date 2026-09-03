const mongoose = require('mongoose');

const videoLibrarySchema = new mongoose.Schema({
    skillId: { type: String, required: true, index: true },
    tier: { 
        type: String, 
        required: true, 
        enum: ['foundational', 'core', 'advanced', 'masterclass'] 
    },
    languageCode: { 
        type: String, 
        required: true, 
        enum: ['en', 'te', 'hi', 'ta', 'kn', 'ml'] 
    },
    moduleOrder: { type: Number, required: true, min: 1, max: 3 },
    title: { type: String, required: true },
    titleLocalized: { type: String },
    youtubeId: { type: String, required: true },
    durationSec: { type: Number, default: 1800 },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

videoLibrarySchema.index({ skillId: 1, tier: 1, languageCode: 1, moduleOrder: 1 }, { unique: true });

module.exports = mongoose.model('VideoLibrary', videoLibrarySchema);
