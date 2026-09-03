const mongoose = require('mongoose');

const userVideoProgressSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    videoId: { type: String }, // Maps to VideoLibrary _id or youtubeId
    youtubeId: { type: String, required: true },
    skillId: { type: String, required: true },
    watchedDurationSec: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0, min: 0, max: 100 },
    status: { 
        type: String, 
        enum: ['not_started', 'in_progress', 'completed'], 
        default: 'not_started' 
    },
    completedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

userVideoProgressSchema.index({ userId: 1, skillId: 1, youtubeId: 1 }, { unique: true });

module.exports = mongoose.model('UserVideoProgress', userVideoProgressSchema);
