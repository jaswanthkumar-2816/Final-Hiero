const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} }
});

module.exports = mongoose.model('Resume', resumeSchema);
