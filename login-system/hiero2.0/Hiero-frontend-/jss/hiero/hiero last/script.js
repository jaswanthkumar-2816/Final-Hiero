// ✅ Splash Screen Logic
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.getElementById("splash-screen").style.display = "none";
    document.getElementById("main-content").classList.remove("hidden");
    // Show role selection first
    document.getElementById("role-selection").classList.remove("hidden");
  }, 3000);
});

// ✅ Role Selection
const roleButtons = {
  student: "student-btn",
  jobSeeker: "job-seeker-btn",
};

Object.entries(roleButtons).forEach(([role, id]) => {
  document.getElementById(id)?.addEventListener("click", () => {
    localStorage.setItem("role", role);
    document.getElementById("role-selection").classList.add("hidden");
    document.getElementById("login-form").classList.remove("hidden");
  });
});

// ✅ Login Submission
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!name || !password) return alert("Please enter both name and password.");

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `${name}@example.com`, password })
      });

      const result = await response.json();
      if (response.ok) {
        localStorage.setItem("token", result.token);
        alert("Login successful!");
        document.getElementById("login-form").classList.add("hidden");
        document.getElementById("chatContainer").classList.remove("hidden");
        initializeChatbot();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      console.error("Login Error:", err);
      alert("Login failed. Please try again.");
    }
  });
}

// ✅ Token Validation
if (window.location.pathname.includes("index.html")) {
  const token = localStorage.getItem("token");
  if (!token) {
    document.getElementById("role-selection").classList.remove("hidden");
  }
}

// ✅ Handle OAuth Token
(function handleOAuthToken() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (token) {
    localStorage.setItem("token", token);
    window.history.replaceState({}, document.title, window.location.pathname);
    window.location.href = "index.html";
  }
})();

// ✅ Load Career Tools Page
async function loadCareerToolsPage() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Not logged in. Redirecting...");
    window.location.href = "index.html";
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await response.json();
    if (response.ok) {
      document.getElementById("welcome-message")?.textContent = result.message || "Welcome to Hiero!";
      if (result.name && result.email) {
        document.getElementById("user-info")?.innerHTML = `
          <p><strong>Name:</strong> ${result.name}</p>
          <p><strong>Email:</strong> ${result.email}</p>
        `;
      }
    } else {
      throw new Error("Invalid session");
    }
  } catch (err) {
    console.error("Dashboard Error:", err);
    alert("Session expired. Please log in again.");
    localStorage.removeItem("token");
    window.location.href = "index.html";
  }
}

if (window.location.pathname.includes("career-tools.html")) {
  loadCareerToolsPage();
}

// ✅ Logout Functionality
const logoutBtn = document.getElementById("logout-btn");
logoutBtn?.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("resumeDraft");
  alert("Logged out successfully!");
  window.location.href = "index.html";
});

// ✅ Resume Analysis
const analysisForm = document.getElementById("analysis-form");
analysisForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const resumeFile = document.getElementById("resume-file")?.files[0];
  const jdFile = document.getElementById("jd-file")?.files[0];
  if (!resumeFile || !jdFile) return alert("Upload both resume and JD.");

  const formData = new FormData();
  formData.append("resume", resumeFile);
  formData.append("jobDescription", jdFile);

  try {
    const res = await fetch("http://localhost:5000/api/resume/analyze", {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: formData,
    });

    const result = await res.json();
    if (res.ok) {
      localStorage.setItem("analysisResult", JSON.stringify(result));
      window.location.href = "analysis-result.html";
    } else {
      alert("Resume analysis failed.");
    }
  } catch (err) {
    console.error("Analysis Error:", err);
    alert("An error occurred during analysis.");
  }
});

// ✅ Display Analysis Results
if (window.location.pathname.includes("analysis-result.html")) {
  const container = document.getElementById("result-content");
  const result = JSON.parse(localStorage.getItem("analysisResult") || "{}");

  if (!result.score && !result.missingSkills && !result.videos) {
    container.innerHTML = "<p>No results found. Try again.</p>";
  } else {
    const links = (Object.values(result.videos || {}).flat()).map((url, i) =>
      `<li><a href="${url}" target="_blank">Tutorial ${i + 1}</a></li>`
    ).join("");

    container.innerHTML = `
      <div><h3>Resume Score</h3><p>${result.score || "N/A"}%</p></div>
      <div><h3>Missing Skills</h3><ul>${(result.missingSkills || []).map(s => `<li>${s}</li>`).join("")}</ul></div>
      <div><h3>Learning Resources</h3><ul>${links}</ul></div>
    `;
  }

  document.getElementById("back-btn")?.addEventListener("click", () => {
    window.location.href = "career-tools.html";
  });
}

// ✅ Chatbot Resume Builder Script (Polished for Neon Style UI)
window.addEventListener("DOMContentLoaded", async () => {
  const chatContainer = document.getElementById("chatContainer");
  const userInput = document.getElementById("userInput");
  const sendButton = document.getElementById("sendButton");
  const skipButton = document.getElementById("skipButton");
  const typingIndicator = document.getElementById("typingIndicator");
  const progressTracker = document.getElementById("progressTracker");

  const userId = `user_${Date.now()}@example.com`;
  const resumeData = { userId };
  let currentStepIndex = 0;

  const questions = [
    {
      question: "Hi there! 👋 I’m Hiero. Let's build your resume! What’s your full name?",
      key: "full_name",
      validate: (val) => val.trim().split(" ").length >= 2 ? null : "Enter full name (e.g., Riya Patel).",
      response: (val) => `Nice to meet you, ${val.split(" ")[0]}! Let's get your contact info.`,
      api: "/resume/basic"
    },
    {
      question: "What's your contact info? (email, phone, location)",
      key: "contact_info",
      validate: (val) => val.includes("@") ? null : "Enter a valid email address.",
      response: () => "Contact info noted! Let's add your career goal.",
      api: "/resume/basic"
    },
    {
      question: "What is your career objective?",
      key: "career_objective",
      validate: (val) => val.length >= 10 ? null : "Please write a detailed objective.",
      response: () => "Great! Let’s add your education.",
      api: "/resume/basic"
    },
    {
      question: "Education details? (Degree, College, Years, Score)",
      key: "education",
      validate: (val) => val.length >= 10 ? null : "Include degree, institution, years & score.",
      response: () => "Education updated! Next, your projects.",
      api: "/resume/education"
    },
    {
      question: "Any projects to showcase?",
      key: "projects",
      validate: (val) => val.length >= 5 ? null : "Add at least one project.",
      response: () => "Awesome! Now list your skills.",
      api: "/resume/projects"
    },
    {
      question: "What are your skills? (e.g., Python, Java, Teamwork)",
      key: "skills",
      validate: (val) => val.split(",").length >= 2 ? null : "List at least two skills.",
      response: () => "Skills added! Got any certifications?",
      api: "/resume/skills"
    },
    {
      question: "Certifications? Type 'skip' if none.",
      key: "certifications",
      optional: true,
      response: (val) => val.toLowerCase() === "skip" ? "No certifications? Okay! Achievements next." : "Certifications noted! Now achievements.",
      api: "/resume/certifications"
    },
    {
      question: "Achievements? (e.g., Hackathon winner)",
      key: "achievements",
      validate: (val) => val.length >= 5 ? null : "Mention at least one achievement.",
      response: () => "Amazing! Want to share your hobbies?",
      api: "/resume/achievements"
    },
    {
      question: "Your hobbies? Type 'skip' to skip.",
      key: "hobbies",
      optional: true,
      response: (val) => val.toLowerCase() === "skip" ? "Got it! Now personal details." : "Cool! Hobbies add personality. Now personal details.",
      api: "/resume/hobbies"
    },
    {
      question: "Add your personal details (DOB, Gender, Nationality)",
      key: "personal_details",
      validate: (val) => val.length >= 10 ? null : "Include DOB, gender, nationality.",
      response: () => "Thanks! Do you have references?",
      api: "/resume/personal_details"
    },
    {
      question: "References? Or type 'Available upon request'",
      key: "references",
      validate: (val) => val.length >= 5 ? null : "Provide reference or 'Available upon request'.",
      response: () => "All done! Generating your resume...",
      api: "/resume/references"
    },
  ];

  async function addMessage(message, isBot = true) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${isBot ? "bot-message" : "user-message"}`;
    if (isBot) {
      const iconDiv = document.createElement("div");
      iconDiv.className = "bot-icon";
      iconDiv.textContent = "H";
      messageDiv.appendChild(iconDiv);
    }
    const span = document.createElement("span");
    span.textContent = message;
    messageDiv.appendChild(span);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  async function simulateTyping(message) {
    typingIndicator.style.display = "block";
    await new Promise((r) => setTimeout(r, 800 + message.length * 15));
    typingIndicator.style.display = "none";
    await addMessage(message);
  }

  async function callApi(endpoint, data) {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5000${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to save data to server.");
    return await res.json();
  }

  async function handleNextQuestion() {
    const q = questions[currentStepIndex];
    progressTracker.textContent = `Step ${currentStepIndex + 1} of ${questions.length}`;
    await simulateTyping(typeof q.question === "function" ? q.question(resumeData) : q.question);
    skipButton.classList.toggle("hidden", !q.optional);
  }

  sendButton.addEventListener("click", async () => {
    const input = userInput.value.trim();
    const q = questions[currentStepIndex];
    if (!input && !q.optional) return;

    addMessage(input, false);
    userInput.value = "";

    if (q.validate) {
      const err = q.validate(input);
      if (err) return simulateTyping(err);
    }

    resumeData[q.key] = input;
    if (q.api) await callApi(q.api, { [q.key]: input, userId });

    if (q.response) await simulateTyping(typeof q.response === "function" ? q.response(input) : q.response);

    currentStepIndex++;
    if (currentStepIndex < questions.length) {
      handleNextQuestion();
    } else {
      await simulateTyping("Generating your resume now... Please wait.");
      const res = await callApi("/resume/generate", { userId });
      await simulateTyping("✅ Resume generated! Choose your template below:");

      const downloadDiv = document.createElement("div");
      downloadDiv.innerHTML = `
        <div style="margin-top: 20px">
          <button class="btn" onclick="alert('Pay ₹10 via UPI to unlock this resume!')">Preview Template</button>
          <button class="btn" onclick="alert('Your resume is downloaded successfully. Best of luck!')">Download Template</button>
        </div>`;
      chatContainer.appendChild(downloadDiv);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  });

  skipButton.addEventListener("click", () => {
    resumeData[questions[currentStepIndex].key] = "N/A";
    currentStepIndex++;
    handleNextQuestion();
  });

  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendButton.click();
  });

  // Start chatbot
  handleNextQuestion();
});

// === Resume vs JD Non-Tech Friendly Analysis (added) ===
(function(){
  const analyzeForm = document.getElementById('analyze-form');
  if(!analyzeForm) return; // only on analysis page
  const loadingOverlay = document.getElementById('loading-overlay');
  const connectionStatus = document.getElementById('connection-status');
  const statusText = document.getElementById('status-text');
  const analyzeBtn = document.getElementById('analyze-btn');

  testBackend();

  analyzeForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const resumeInput = document.getElementById('resume');
    const jdInput = document.getElementById('jd');
    const jdTextEl = document.getElementById('jd-text');
    const mode = document.querySelector('input[name="jd_mode"]:checked')?.value || 'file';
    if(!resumeInput.files[0]) return alert('Upload resume PDF');
    if(mode==='file' && !jdInput.files[0]) return alert('Upload JD file or switch to text mode');
    if(mode==='text' && !jdTextEl.value.trim()) return alert('Paste JD text');

    const fd = new FormData();
    fd.append('resume', resumeInput.files[0]);
    if(mode==='file') fd.append('jd', jdInput.files[0]); else fd.append('jdText', jdTextEl.value.trim());

    loadingOverlay?.classList.add('visible');
    analyzeBtn?.classList.add('loading');

    try {
      console.log('📤 Sending request to /api/analyze...');
      const resp = await fetch('/api/analysis/api/analyze', { method: 'POST', body: fd });
      console.log('📥 Response received:', resp.status, resp.statusText);
      
      let json;
      try { 
        json = await resp.json();
        console.log('✅ JSON parsed successfully:', json);
      } catch(parseErr){
        console.error('❌ JSON parse failed:', parseErr);
        const text = await resp.text().catch(() => 'Could not read response');
        console.error('❌ Response body:', text.substring(0, 500));
        throw new Error('Server did not return valid JSON. Check console for details.');
      }
      
      if(!resp.ok) {
        throw new Error(json.error || `Server error ${resp.status}`);
      }
      
      // Backend returns: { domain, jdSkills, resumeSkills, matched, missing, score }
      // Transform to expected format for result.html
      const analysisData = {
        domain: json.domain,
        score: json.score || 0,
        jdSkills: json.jdSkills || [],
        resumeSkills: json.resumeSkills || [],
        matched: json.matched || [],
        missing: json.missing || [],
        domainType: json.domain
      };
      
      console.log('✅ Analysis complete - Domain:', analysisData.domain, 'Score:', analysisData.score);
      sessionStorage.setItem('analysisSessionId', Date.now().toString());
      sessionStorage.setItem('analysisData', JSON.stringify(analysisData));
      window.location.href='result.html';
    } catch(err){
      console.error('❌ Analysis error:', err);
      alert('❌ Analysis failed: '+ err.message);
    } finally {
      loadingOverlay?.classList.remove('visible');
      analyzeBtn?.classList.remove('loading');
    }
  });
})();
// === End Added Block ===