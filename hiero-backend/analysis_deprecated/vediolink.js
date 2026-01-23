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
  // Add more skills as needed (e.g., java, aws, docker)
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

    // Use hardcoded videos if available
    const hardcodedVideos = getVideoTutorials(normalizedSkill);
    if (hardcodedVideos.length > 0) {
      console.log(`Using hardcoded videos for ${skill}`);
      // Cache in MongoDB
      await SkillVideos.create({
        skill: normalizedSkill,
        videos: hardcodedVideos,
      });
      return hardcodedVideos;
    }

    // Fallback to YouTube API (disabled for now)
    if (process.env.USE_YOUTUBE_API === "true") {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?key=${process.env.YOUTUBE_API_KEY}&part=snippet&q=${normalizedSkill}+tutorial&maxResults=2`
      );
      const data = await response.json();
      if (data.error) {
        console.error("YouTube API error:", data.error.message);
        return getVideoTutorials(normalizedSkill); // Fallback to hardcoded
      }
      const videos = data.items.map((item) => ({
        id: item.id,
        snippet: {
          title: item.snippet.title,
          description: item.snippet.description,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        },
      }));
      // Cache in MongoDB
      await SkillVideos.create({
        skill: normalizedSkill,
        videos,
      });
      return videos;
    }

    // No videos found
    console.log(`No videos found for ${skill}`);
    return [];
  } catch (error) {
    console.error(`Error fetching videos for ${skill}:`, error.message);
    return getVideoTutorials(normalizedSkill); // Fallback to hardcoded
  }
}

module.exports = { fetchVideoTutorials, getVideoTutorials };