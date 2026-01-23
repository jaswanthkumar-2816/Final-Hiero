const mongoose = require('mongoose');

const jobDescriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true }, // The pasted JD text
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('JobDescription', jobDescriptionSchema);
