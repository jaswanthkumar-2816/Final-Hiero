const express = require("express");
const router = express.Router();
const { fetchVideoTutorials } = require("./videoTutorials");

// POST /api/skills/videos
// Get video tutorials for a list of skills
router.post("/videos", async (req, res) => {
  try {
    const { skills } = req.body; // Expect array of skills (e.g., ["nodejs", "react"])
    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ error: "Skills array is required" });
    }

    // Fetch videos for each skill
    const videoPromises = skills.map((skill) => fetchVideoTutorials(skill));
    const videoResults = await Promise.all(videoPromises);

    // Combine results
    const result = skills.reduce((acc, skill, index) => {
      acc[skill] = videoResults[index];
      return acc;
    }, {});

    res.json(result);
  } catch (error) {
    console.error("Error fetching skill videos:", error.message);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// POST /api/skills/problems
// Get practice problems for a skill and day
router.post("/problems", async (req, res) => {
  try {
    const { skill, day } = req.body;
    if (!skill) {
      return res.status(400).json({ error: "Skill is required" });
    }

    // Hardcoded problems for different skills and days
    const problemsData = {
      "Data Mining and Pattern Recognition": {
        1: [
          "Problem 1: Identify patterns in dataset A using clustering algorithms",
          "Problem 2: Detect anomalies in dataset B using statistical methods",
          "Problem 3: Apply association rule mining to find correlations"
        ],
        2: [
          "Problem 1: Build a decision tree classifier for customer segmentation",
          "Problem 2: Apply K-means clustering on dataset C with optimal K selection",
          "Problem 3: Implement Apriori algorithm for market basket analysis"
        ]
      },
      "React": {
        1: [
          "Problem 1: Create a simple React component with props",
          "Problem 2: Implement state management using useState hook",
          "Problem 3: Build a todo list component"
        ],
        2: [
          "Problem 1: Create a form component with controlled inputs",
          "Problem 2: Implement useEffect for API calls",
          "Problem 3: Build a custom hook for data fetching"
        ]
      },
      "Node.js": {
        1: [
          "Problem 1: Create a basic Express server",
          "Problem 2: Set up REST API endpoints",
          "Problem 3: Implement middleware for logging"
        ],
        2: [
          "Problem 1: Connect to MongoDB database",
          "Problem 2: Create CRUD operations",
          "Problem 3: Implement authentication middleware"
        ]
      },
      "Python": {
        1: [
          "Problem 1: Write a function to calculate factorial",
          "Problem 2: Create a list comprehension to filter even numbers",
          "Problem 3: Implement a simple class with methods"
        ],
        2: [
          "Problem 1: Read and process CSV files",
          "Problem 2: Create a decorator function",
          "Problem 3: Implement error handling with try-except"
        ]
      },
      "JavaScript": {
        1: [
          "Problem 1: Create a function to reverse a string",
          "Problem 2: Implement array methods (map, filter, reduce)",
          "Problem 3: Build a simple calculator"
        ],
        2: [
          "Problem 1: Work with async/await and promises",
          "Problem 2: Create a debounce function",
          "Problem 3: Implement event delegation"
        ]
      }
    };

    const problems = problemsData[skill]?.[day] || [
      "Problem 1: Practice the basic concepts of " + skill,
      "Problem 2: Apply intermediate techniques in " + skill,
      "Problem 3: Work on advanced " + skill + " concepts"
    ];

    res.json({ problems });
  } catch (error) {
    console.error("Error fetching problems:", error.message);
    res.status(500).json({ error: "Failed to fetch problems" });
  }
});

// POST /api/skills/quizzes
// Get quiz questions for a skill and day
router.post("/quizzes", async (req, res) => {
  try {
    const { skill, day } = req.body;
    if (!skill) {
      return res.status(400).json({ error: "Skill is required" });
    }

    // Hardcoded quizzes for different skills and days
    const quizzesData = {
      "Data Mining and Pattern Recognition": {
        1: {
          question: "What is the primary goal of pattern recognition in data mining?",
          answer: "To identify regularities and patterns in data for making predictions and decisions."
        },
        2: {
          question: "What is the difference between supervised and unsupervised learning in pattern recognition?",
          answer: "Supervised learning uses labeled data to train models, while unsupervised learning finds patterns in unlabeled data."
        }
      },
      "React": {
        1: {
          question: "What is the purpose of the useState hook in React?",
          answer: "useState allows functional components to manage state and re-render when state changes."
        },
        2: {
          question: "What is the difference between props and state in React?",
          answer: "Props are read-only data passed from parent to child, while state is internal data that can change and trigger re-renders."
        }
      },
      "Node.js": {
        1: {
          question: "What is the purpose of middleware in Express.js?",
          answer: "Middleware functions have access to request and response objects and can modify them or end the request-response cycle."
        },
        2: {
          question: "What is the difference between synchronous and asynchronous operations in Node.js?",
          answer: "Synchronous operations block execution until completion, while asynchronous operations allow other code to run while waiting."
        }
      },
      "Python": {
        1: {
          question: "What is the difference between a list and a tuple in Python?",
          answer: "Lists are mutable (can be changed), while tuples are immutable (cannot be changed after creation)."
        },
        2: {
          question: "What is a decorator in Python and how is it used?",
          answer: "A decorator is a function that modifies another function, allowing you to add functionality without changing the original function's code."
        }
      },
      "JavaScript": {
        1: {
          question: "What is the difference between var, let, and const in JavaScript?",
          answer: "var is function-scoped and hoisted, let is block-scoped and not hoisted, const is block-scoped and cannot be reassigned."
        },
        2: {
          question: "What is closure in JavaScript?",
          answer: "A closure is a function that has access to variables in its outer scope even after the outer function has returned."
        }
      }
    };

    const quiz = quizzesData[skill]?.[day] || {
      question: "What is the main concept you learned about " + skill + " today?",
      answer: "The main concept involves understanding and applying " + skill + " fundamentals and best practices."
    };

    res.json({ quiz });
  } catch (error) {
    console.error("Error fetching quiz:", error.message);
    res.status(500).json({ error: "Failed to fetch quiz" });
  }
});

// POST /api/skills/lessons
// Get complete lesson data (videos, problems, quizzes) for a skill
router.post("/lessons", async (req, res) => {
  try {
    const { skill, days = 7 } = req.body;
    if (!skill) {
      return res.status(400).json({ error: "Skill is required" });
    }

    // Fetch videos for the skill
    const videos = await fetchVideoTutorials(skill);
    
    // Generate lesson data for specified number of days
    const lessons = [];
    for (let day = 1; day <= days; day++) {
      // Get problems for this day
      const problemsRes = await fetch(`${req.protocol}://${req.get('host')}/api/skills/problems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill, day })
      });
      const problemsData = await problemsRes.json();
      
      // Get quiz for this day
      const quizRes = await fetch(`${req.protocol}://${req.get('host')}/api/skills/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill, day })
      });
      const quizData = await quizRes.json();
      
      // Select video for this day (cycle through available videos)
      const videoIndex = (day - 1) % videos.length;
      const video = videos[videoIndex] || videos[0];
      
      lessons.push({
        day,
        skill,
        problems: problemsData.problems,
        quiz: quizData.quiz,
        video: video?.snippet?.url || `https://www.youtube.com/embed/dQw4w9WgXcQ`
      });
    }

    res.json({ lessons, totalDays: days });
  } catch (error) {
    console.error("Error fetching lessons:", error.message);
    res.status(500).json({ error: "Failed to fetch lessons" });
  }
});

module.exports = router;