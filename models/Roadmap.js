const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Roadmap', roadmapSchema);
