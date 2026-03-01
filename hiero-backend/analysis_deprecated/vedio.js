const SkillVideos = require("./skillvedios");

// Hardcoded video tutorials for common skills
const defaultTutorials = {
  nodejs: [
    "https://www.youtube.com/watch?v=TlB_eWDSMt4", // Node.js Crash Course
    "https://www.youtube.com/watch?v=fBNz5xF-Kx4", // Node.js for Beginners
  ],
  react: [
    "https://www.youtube.com/watch?v=bMknfKXIFA8", // React Tutorial
    "https://www.youtube.com/watch?v=Ke90Tje7VS0", // React Crash Course
  ],
  sql: [
    "https://www.youtube.com/watch?v=HXV3zeQKqGY", // SQL for Beginners
    "https://www.youtube.com/watch?v=7S_tz1z_5bA", // SQL Tutorial
  ],
  python: [
    "https://www.youtube.com/watch?v=rfscVS0vtbw", // Python for Beginners
    "https://www.youtube.com/watch?v=kqtD5dpn9C8", // Python Crash Course
  ],
  javascript: [
    "https://www.youtube.com/watch?v=hdI2bqOjy3c", // JavaScript Crash Course
    "https://www.youtube.com/watch?v=PkZNo7MFNFg", // JavaScript for Beginners
  ],
};

// Get hardcoded videos for a skill
function getVideoTutorials(skill) {
  const normalizedSkill = skill.toLowerCase().trim();
  const videos = defaultTutorials[normalizedSkill] || [];
  return videos.map((url, index) => ({
    id: { videoId: `hardcoded-${normalizedSkill}-${index}` },
    snippet: {
      title: `Tutorial for ${normalizedSkill} #${index + 1}`,
      description: `Learn ${normalizedSkill} with this tutorial`,
      url,
    },
  }));
}

// Fetch video tutorials (hardcoded or API)
async function fetchVideoTutorials(skill) {
  try {
    const normalizedSkill = skill.toLowerCase().trim();

    // Check MongoDB cache
    const cached = await SkillVideos.findOne({ skill: normalizedSkill });
    if (cached) {
      console.log(`Returning cached videos for ${skill}`);
      return cached.videos;
    }

    // Use hardcoded videos
    const hardcodedVideos = getVideoTutorials(normalizedSkill);
    console.log(`Using hardcoded videos for ${skill}`);
    // Cache in MongoDB
    await SkillVideos.create({
      skill: normalizedSkill,
      videos: hardcodedVideos,
    });
    return hardcodedVideos;
  } catch (error) {
    console.error(`Error fetching videos for ${skill}:`, error.message);
    return getVideoTutorials(normalizedSkill); // Fallback to hardcoded
  }
}

module.exports = { fetchVideoTutorials, getVideoTutorials };