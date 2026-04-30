const axios = require("axios");
// const SkillVideos = require("./skillvedios");

// Comprehensive hardcoded videos
const defaultTutorials = {
  // Programming Languages
  python: [
    "https://www.youtube.com/watch?v=rfscVS0vtbw",
    "https://www.youtube.com/watch?v=kqtD5dpn9C8",
  ],
  javascript: [
    "https://www.youtube.com/watch?v=hdI2bqOjy3c",
    "https://www.youtube.com/watch?v=PkZNo7MFNFg",
  ],
  java: [
    "https://www.youtube.com/watch?v=eIrMbAQSU34",
    "https://www.youtube.com/watch?v=grEKMHGYyns",
  ],
  cpp: [
    "https://www.youtube.com/watch?v=8jLOx1hD3_o",
    "https://www.youtube.com/watch?v=8mO6sI_X0nY",
  ],
  
  // Web Technologies
  html: [
    "https://www.youtube.com/watch?v=UB1O30fR-EE",
    "https://www.youtube.com/watch?v=PlxWf493en4",
  ],
  css: [
    "https://www.youtube.com/watch?v=yfoY53X1OvQ",
    "https://www.youtube.com/watch?v=1PnVor36_40",
  ],
  react: [
    "https://www.youtube.com/watch?v=bMknfKXIFA8",
    "https://www.youtube.com/watch?v=Ke90Tje7VS0",
  ],
  nodejs: [
    "https://www.youtube.com/watch?v=TlB_eWDSMt4",
    "https://www.youtube.com/watch?v=fBNz5xF-Kx4",
  ],
  angular: [
    "https://www.youtube.com/watch?v=3dHNOWTI7H8",
    "https://www.youtube.com/watch?v=k5E2AVpwsko",
  ],
  vue: [
    "https://www.youtube.com/watch?v=4deVCNJq3qc",
    "https://www.youtube.com/watch?v=YrxBCBibVo0",
  ],
  
  // Databases
  sql: [
    "https://www.youtube.com/watch?v=HXV3zeQKqGY",
    "https://www.youtube.com/watch?v=7S_tz1z_5bA",
  ],
  mongodb: [
    "https://www.youtube.com/watch?v=pWbMrx5rVBE",
    "https://www.youtube.com/watch?v=Www6cTUymCY",
  ],
  mysql: [
    "https://www.youtube.com/watch?v=7S_tz1z_5bA",
    "https://www.youtube.com/watch?v=HXV3zeQKqGY",
  ],
  
  // Cloud & DevOps
  aws: [
    "https://www.youtube.com/watch?v=ulprqHHWlng",
    "https://www.youtube.com/watch?v=Ia-UEYYR44s",
  ],
  docker: [
    "https://www.youtube.com/watch?v=fqMOX6JJhGo",
    "https://www.youtube.com/watch?v=pTFZFxdXhOI",
  ],
  kubernetes: [
    "https://www.youtube.com/watch?v=d6WC5n9G_sM",
    "https://www.youtube.com/watch?v=PH-2FfFD2BU",
  ],
  
  // Data Science & ML
  "machine learning": [
    "https://www.youtube.com/watch?v=KNAWp2S3w94",
    "https://www.youtube.com/watch?v=aircAruvnKk",
  ],
  ml: [
    "https://www.youtube.com/watch?v=KNAWp2S3w94",
    "https://www.youtube.com/watch?v=aircAruvnKk",
  ],
  tensorflow: [
    "https://www.youtube.com/watch?v=6_2hzRopPbQ",
    "https://www.youtube.com/watch?v=tPYj3fFJGjk",
  ],
  "deep learning": [
    "https://www.youtube.com/watch?v=aircAruvnKk",
    "https://www.youtube.com/watch?v=VyWAvY2CF3c",
  ],
  
  // Mobile Development
  flutter: [
    "https://www.youtube.com/watch?v=1ukSR1GRtMU",
    "https://www.youtube.com/watch?v=GLSG_WhzYWg",
  ],
  "react native": [
    "https://www.youtube.com/watch?v=0-S5a0eXPoc",
    "https://www.youtube.com/watch?v=0-S5a0eXPoc",
  ],
  
  // Other Technologies
  git: [
    "https://www.youtube.com/watch?v=SWYqp7iY_Tc",
    "https://www.youtube.com/watch?v=USjZcfj8yxE",
  ],
  github: [
    "https://www.youtube.com/watch?v=SWYqp7iY_Tc",
    "https://www.youtube.com/watch?v=USjZcfj8yxE",
  ],
  graphql: [
    "https://www.youtube.com/watch?v=Y0lDGjwRYKw",
    "https://www.youtube.com/watch?v=ed8SzALpx1Q",
  ],
  blockchain: [
    "https://www.youtube.com/watch?v=2y_6g2uQjQo",
    "https://www.youtube.com/watch?v=QphJEO9ZX6s",
  ],
};

// Extract video ID from a YouTube URL
function extractVideoId(url) {
  const match = url.match(/v=([^&]+)/);
  return match ? match[1] : "dQw4w9WgXcQ";
}

// Format a video object for frontend
function formatVideo({ videoId, title, description, url, thumbnail }) {
  return {
    id: { videoId },
    snippet: {
      title,
      description,
      url,
      thumbnail,
    },
  };
}

// Get hardcoded videos for a skill
function getHardcodedVideos(skill) {
  const normalized = skill.toLowerCase().trim();
  const urls = defaultTutorials[normalized] || [];
  if (urls.length === 0) return [];
  return urls.map((url, i) =>
    formatVideo({
      videoId: extractVideoId(url),
      title: `${skill.charAt(0).toUpperCase() + skill.slice(1)} Tutorial #${i + 1}`,
      description: `Learn ${skill} with this tutorial`,
      url,
      thumbnail: `https://img.youtube.com/vi/${extractVideoId(url)}/0.jpg`,
    })
  );
}

// Remove duplicate videos by videoId
function dedupeVideos(videos) {
  const seen = new Set();
  return videos.filter((v) => {
    const id = v.id.videoId;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

// Fetch videos from YouTube API for a skill
async function fetchYouTubeVideos(skill) {
  if (!process.env.USE_YOUTUBE_API || process.env.USE_YOUTUBE_API !== "true") return [];
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];
  const queries = [
    `${skill} beginner tutorial`,
    `${skill} project`,
    `${skill} advanced`,
  ];
  let videos = [];
  for (const q of queries) {
    try {
      const res = await axios.get(
        `https://www.googleapis.com/youtube/v3/search`,
        {
          params: {
            key: apiKey,
            part: "snippet",
            q: q,
            type: "video",
            maxResults: 3,
            order: "relevance",
          },
        }
      );
      if (res.data && res.data.items) {
        videos.push(
          ...res.data.items.map((item) =>
            formatVideo({
              videoId: item.id.videoId,
              title: item.snippet.title,
              description: item.snippet.description,
              url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
              thumbnail: item.snippet.thumbnails?.high?.url || `https://img.youtube.com/vi/${item.id.videoId}/0.jpg`,
            })
          )
        );
      }
    } catch (err) {
      // Ignore individual query errors, try next
      continue;
    }
  }
  return dedupeVideos(videos).slice(0, 3); // Return top 3 unique
}

// Main hybrid fetch logic
async function fetchVideoTutorials(skill) {
  const normalizedSkill = skill.toLowerCase().trim();
  // 1. Check MongoDB cache
  try {
    // const SkillVideos = require("../hiero analysis part/skillvedios");
    const cached = null; // Temporarily commenting out SkillVideos import
    if (cached && Array.isArray(cached.videos) && cached.videos.length > 0) {
      return cached.videos;
    }
  } catch (e) {
    // Cache errors are non-fatal
  }
  // 2. Use hardcoded videos if available
  const hardcoded = getHardcodedVideos(normalizedSkill);
  if (hardcoded.length > 0) {
    // Cache and return
    try {
      // const SkillVideos = require("../hiero analysis part/skillvedios");
      // await SkillVideos.create({ skill: normalizedSkill, videos: hardcoded });
    } catch (e) {}
    return hardcoded;
  }
  // 3. Fallback to YouTube API
  const apiVideos = await fetchYouTubeVideos(normalizedSkill);
  if (apiVideos.length > 0) {
    // Cache and return
    try {
      // const SkillVideos = require("../hiero analysis part/skillvedios");
      // await SkillVideos.create({ skill: normalizedSkill, videos: apiVideos });
    } catch (e) {}
    return apiVideos;
  }
  // 4. Fallback to generic YouTube search links
  return [
    formatVideo({
      videoId: `search-${normalizedSkill}-1`,
      title: `Learn ${skill} - Beginner Tutorial`,
      description: `YouTube search for ${skill} beginner tutorial`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill + " tutorial for beginners")}`,
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
    }),
    formatVideo({
      videoId: `search-${normalizedSkill}-2`,
      title: `${skill} Full Course`,
      description: `YouTube search for ${skill} full course`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill + " full course")}`,
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg",
    }),
  ];
}

module.exports = { fetchVideoTutorials };