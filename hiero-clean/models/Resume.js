const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    data: {
        basic: { type: Object },
        education: { type: Array },
        projects: { type: Array },
        skills: { type: Object },
        professional_certifications: { type: Array },
        personal_certifications: { type: Array },
        achievements: { type: Array },
        hobbies: { type: Array },
        personal_details: { type: Object },
        references: { type: Array },
        summary: { type: String },
        photo: { type: String },
        template: { type: String }
    }
});

module.exports = mongoose.model('Resume', resumeSchema);
