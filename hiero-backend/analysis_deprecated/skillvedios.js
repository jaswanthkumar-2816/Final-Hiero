const mongoose = require("mongoose");

const skillVideosSchema = new mongoose.Schema({
  skill: { type: String, required: true, unique: true },
  videos: [
    {
      id: {
        videoId: { type: String, required: true }
      },
      snippet: {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        url: { type: String, required: true },
        thumbnail: { type: String, default: '' }
      }
    }
  ],
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model("SkillVideos", skillVideosSchema);