// File: shared folder/hiero backend/models/Resume.js
 import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  data: {
    basic: { type: Object },
    education: { type: Array }, // <-- Change from String to Array
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

const Resume = mongoose.model('Resume', resumeSchema);
export default Resume; // ✅ Required for ES Modules