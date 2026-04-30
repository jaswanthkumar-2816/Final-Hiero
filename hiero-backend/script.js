// ✅ Hiero Resume Builder - Frontend with Backend Integration (Modified for PDF download)

// Base URL for backend API
const API_BASE_URL = 'http://localhost:5001';

// Simple form for job description and resume submission
function createAnalysisForm() {
  const appContainer = document.getElementById('app') || document.body;
  appContainer.innerHTML = `
    <div class="container">
      <h1>Resume Analysis</h1>
      <div id="error" class="error"></div>
      <form id="analysisForm">
        <div class="form-group">
          <label for="jdText">Job Description:</label>
          <textarea id="jdText" rows="8" required></textarea>
        </div>
        <div class="form-group">
          <label for="resumeText">Resume Text:</label>
          <textarea id="resumeText" rows="12" required></textarea>
        </div>
        <div class="form-group">
          <label>Or upload files:</label>
          <input type="file" id="jdFile" accept=".pdf,.txt,.docx">
          <input type="file" id="resumeFile" accept=".pdf,.txt,.docx">
        </div>
        <button type="submit" class="btn">Analyze</button>
      </form>
      <div id="results" class="results"></div>
    </div>
  `;

  document.getElementById('analysisForm').addEventListener('submit', handleAnalysisSubmit);
}

async function handleAnalysisSubmit(e) {
  e.preventDefault();
  
  const errorEl = document.getElementById('error');
  const resultsEl = document.getElementById('results');
  errorEl.textContent = '';
  resultsEl.innerHTML = '<p>Analyzing... This may take a moment.</p>';

  const formData = new FormData();
  const jdText = document.getElementById('jdText').value.trim();
  const resumeText = document.getElementById('resumeText').value.trim();
  const jdFile = document.getElementById('jdFile').files[0];
  const resumeFile = document.getElementById('resumeFile').files[0];

  try {
    if ((!jdText && !jdFile) || (!resumeText && !resumeFile)) {
      throw new Error('Please provide both job description and resume, either as text or file uploads');
    }

    if (jdText) formData.append('jdText', jdText);
    if (resumeText) formData.append('resumeText', resumeText);
    if (jdFile) formData.append('jd', jdFile);
    if (resumeFile) formData.append('resume', resumeFile);

    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      body: formData
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!response.ok) {
      const errorText = await response.text();
      if (isJson) {
        const errorData = JSON.parse(errorText || '{}');
        throw new Error(errorData.error || 'Analysis failed');
      }
      throw new Error(`Server returned HTML instead of JSON (status ${response.status}). ${errorText.slice(0, 120)}`);
    }

    if (!isJson) {
      const text = await response.text();
      throw new Error(`Server returned HTML instead of JSON. Raw response: ${text.slice(0, 120)}`);
    }

    const data = await response.json();
    displayResults(data);
  } catch (error) {
    console.error('Analysis error:', error);
    errorEl.textContent = error.message || 'An error occurred during analysis';
    resultsEl.innerHTML = '';
  }
}

function displayResults(data) {
  const resultsEl = document.getElementById('results');
  resultsEl.innerHTML = `
    <div class="result-section">
      <h3>Analysis Results</h3>
      <p><strong>Domain:</strong> ${data.domain}</p>
      
      <div class="match-score">
        <h4>Match Score: ${data.score}%</h4>
        <div class="score-bar">
          <div class="score-fill" style="width: ${data.score}%"></div>
        </div>
      </div>
      
      <div class="skills-section">
        <div class="skills-matched">
          <h4>Matched Skills (${data.matched.length})</h4>
          <ul>${data.matched.map(skill => `<li>${skill}</li>`).join('')}</ul>
        </div>
        
        <div class="skills-missing">
          <h4>Missing Skills (${data.missing.length})</h4>
          <ul>${data.missing.map(skill => `<li>${skill}</li>`).join('')}</ul>
        </div>
      </div>
    </div>
  `;
}

function initializeApp() {
  // DOM Elements for Login
  const loginSection = document.getElementById("loginSection");
  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");
  const loginButton = document.getElementById("loginButton");
  const loginError = document.getElementById("loginError");
  const resumeSection = document.getElementById("resumeSection");

  // Handle Login
  loginButton.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      loginError.textContent = "Please enter both email and password.";
      loginError.classList.remove('hidden');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed. Please try again.');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      loginSection.classList.add('hidden');
      resumeSection.classList.remove('hidden');
      loginError.classList.add('hidden');
      initializeChatbot(); // Start the chatbot after successful login
    } catch (error) {
      loginError.textContent = error.message;
      loginError.classList.remove('hidden');
    }
  });

  // If token exists, skip login and start chatbot
  if (localStorage.getItem('token')) {
    loginSection.classList.add('hidden');
    resumeSection.classList.remove('hidden');
    initializeChatbot();
  }
}

function initializeChatbot() {
  // DOM Elements for Chatbot
  const chatContainer = document.getElementById("chatContainer");
  const userInput = document.getElementById("userInput");
  const sendButton = document.getElementById("sendButton");
  const skipButton = document.getElementById("skipButton");
  const goBackButton = document.getElementById("goBackButton");
  const progressTracker = document.getElementById("progressTracker");
  const typingIndicator = document.getElementById("typingIndicator");
  const projectCardsContainer = document.getElementById("projectCards");
  const personalDetailsForm = document.getElementById("personalDetailsForm");
  const photoUpload = document.getElementById("photoUpload");
  const templateModal = document.getElementById("templateModal");
  const previewTemplateBtn = document.getElementById("previewTemplate");
  const downloadTemplateBtn = document.getElementById("downloadTemplate");
  const previewModal = document.getElementById("previewModal");
  const resumePreview = document.getElementById("resumePreview");
  const closePreviewBtn = document.getElementById("closePreview");

  // State Management
  const userId = `user_${Date.now()}@example.com`;
  let currentStep = 'start';
  let currentQuestionIndex = 0;
  let resumeData = JSON.parse(localStorage.getItem('resumeDraft')) || { userId };
  let history = [];
  let canGoBack = false;
  let projects = [];
  let selectedTemplate = null;
  let skillsTechnical = '';
  let certificationsProfessional = '';

  // Auto-suggestions
  const skillsSuggestions = [
    "Python", "Java", "JavaScript", "C++", "SQL", "React", "Node.js", "Teamwork", "Leadership", "Project Management"
  ];
  const universitySuggestions = [
    "IIT Mumbai", "IIT Delhi", "MIT", "Stanford University", "Harvard University", "University of Mumbai"
  ];

  // Define Questions with Dynamic Responses (Modified to match reference resume structure)
  const questions = {
    start: [
      {
        question: "Hey there! 👋 I’m Hiero, your resume buddy. Let’s make a quick resume! Ready? Just click 'Send'.",
        key: 'start',
        response: () => "Great! Let's start with your basic info. 😊",
        api: '/resume/start'
      }
    ],
    basic: [
      {
        question: () => "Let’s add your basic info. What’s your full name? (e.g., Priya Sharma)",
        key: 'full_name',
        validate: (val) => val.trim().split(' ').length >= 2 ? null : "Please include both your first and last name!",
        response: (val) => `Nice to meet you, ${val.split(' ')[0]}! Let's add more details. 😊`,
      },
      {
        question: (data) => `Hey ${data.full_name.split(' ')[0]}, what’s your contact info? (e.g., priya.sharma@email.com, +91 99887 65432, 202, Lotus Lane, Mumbai, Maharashtra - 400001)`,
        key: 'contact_info',
        validate: (val) => val.includes('@') ? null : "Please include at least an email address!",
        response: () => "Got it! Your contact info is all set. 📞",
      },
      {
        question: (data) => `What’s your LinkedIn profile? (e.g., linkedin.com/in/priya-sharma) Type 'skip' if none.`,
        key: 'linkedin',
        optional: true,
        response: (val) => val.toLowerCase() === 'skip' ? "No LinkedIn? That’s fine!" : "LinkedIn added! 🔗",
      },
      {
        question: (data) => `What’s your GitHub profile? (e.g., github.com/priya-dev) Type 'skip' if none.`,
        key: 'github',
        optional: true,
        response: (val) => val.toLowerCase() === 'skip' ? "No GitHub? OK!" : "GitHub added! 🐙",
      },
      {
        question: (data) => `Do you have a personal website, ${data.full_name.split(' ')[0]}? (e.g., https://priyasharma.dev) Type 'skip' if none.`,
        key: 'website',
        optional: true,
        response: (val) => val.toLowerCase() === 'skip' ? "No website? That’s okay! Let’s move on. 😊" : "Great, I’ve added your website! 🌐",
      },
      {
        question: (data) => `What’s your career objective, ${data.full_name.split(' ')[0]}? (e.g., Aspiring Data Analyst with a strong foundation in data processing and visualization, eager to leverage analytical skills in a dynamic team environment.)`,
        key: 'career_objective',
        type: 'textarea',
        suggest: (val) => val.length < 20 ? "That’s a bit short! Maybe add more details?" : null,
        response: (val) => val.length >= 20 ? "That’s a great objective! 🚀 Let’s move on." : "Looks good! Let’s keep going. 😊",
        api: '/resume/basic',
        formatData: (val) => ({
          userId,
          full_name: resumeData.full_name,
          contact_info: resumeData.contact_info,
          linkedin: resumeData.linkedin || '',
          github: resumeData.github || '',
          website: resumeData.website || '',
          career_objective: val
        })
      }
    ],
    education: [
      {
        question: (data) => `Now, tell me about your education, ${data.full_name.split(' ')[0]}. Add each degree on a new line. (e.g., M.Sc. in Data Science, IIT Bombay, 2021 - 2023 | CGPA: 9.0/10\nB.Sc. in Statistics, University of Pune, 2018 - 2021 | Percentage: 87%)`,
        key: 'education',
        type: 'textarea',
        response: () => "Education details added! That’s a key part of your resume. 📚",
        api: '/resume/education',
        autosuggest: 'university'
      }
    ],
    projects: [
      {
        question: "Let’s add your projects. Add at least one project below. (e.g., Data Visualization Dashboard | Personal Project - Jun 2023 | • Built an interactive dashboard using Python and Power BI to analyze sales trends)",
        key: 'projects',
        type: 'projects',
        validate: (val) => val.length > 0 ? null : "Please add at least one project!",
        response: () => "Awesome projects! They’ll really stand out on your resume. 🌟",
        api: '/resume/projects'
      }
    ],
    skills_technical: [
      {
        question: "What technical skills do you have? (e.g., Python, R, SQL, Power BI, Tableau, Excel) List at least two, separated by commas.",
        key: 'skills_technical',
        validate: (val) => val.split(',').length >= 2 ? null : "Please list at least two technical skills, separated by commas.",
        response: () => "Great technical skills! Now, let’s add your management skills.",
        store: (val) => { skillsTechnical = val; },
        autosuggest: 'skills'
      }
    ],
    skills_management: [
      {
        question: "What management skills do you have? (e.g., Problem-solving, Communication, Leadership, Team Handling) List at least two, separated by commas.",
        key: 'skills_management',
        validate: (val) => val.split(',').length >= 2 ? null : "Please list at least two management skills, separated by commas.",
        response: (val) => `Nice skills! ${val.split(',')[0].trim()} is a great one to have. ${getEncouragingPhrase()}`,
        api: '/resume/skills',
        formatData: (val) => ({
          userId,
          technical: skillsTechnical,
          management: val
        }),
        autosuggest: 'skills'
      }
    ],
    certifications_professional: [
      {
        question: "Got any professional certifications? (e.g., AWS Certified Data Analytics - Specialty (2022), Microsoft Certified: Azure Data Scientist Associate (2023)) List them separated by commas. Type 'skip' if none.",
        key: 'certifications_professional',
        optional: true,
        response: () => "Thanks for sharing! Now, let’s talk about personal certifications.",
        store: (val) => { certificationsProfessional = val.toLowerCase() === 'skip' ? 'N/A' : val; }
      }
    ],
    certifications_personal: [
      {
        question: "Got any personal certifications? (e.g., Data Science Certification - Coursera (2022), Machine Learning - edX (2023)) List them separated by commas. Type 'skip' if none.",
        key: 'certifications_personal',
        optional: true,
        response: (val) => val.toLowerCase() === 'skip' ? "No personal certifications? No worries! Let’s move to your achievements." : "Nice personal certifications! Let’s talk about your achievements next.",
        api: '/resume/certifications',
        formatData: (val) => ({
          userId,
          professional: certificationsProfessional,
          personal: val.toLowerCase() === 'skip' ? 'N/A' : val
        })
      }
    ],
    achievements: [
      {
        question: "Any achievements you’d like to show off? (e.g., Top 10 in National Data Science Hackathon 2023, Published research paper in IJDS) Share at least one, separated by commas.",
        key: 'achievements',
        response: () => "Impressive achievements! They’ll definitely catch attention. 🌟",
        api: '/resume/achievements'
      }
    ],
    hobbies: [
      {
        question: "What are your hobbies or interests? (e.g., Reading data science blogs, Playing badminton) Type 'skip' if you’d rather not share.",
        key: 'hobbies',
        optional: true,
        response: (val) => val.toLowerCase() === 'skip' ? "No hobbies to share? No worries! Let’s keep going. 😊" : `I love that you enjoy ${val.split(',')[0].trim()}! It adds a nice personal touch. 😄`,
        api: '/resume/hobbies'
      }
    ],
    personal: [
      {
        question: (data) => `Let’s wrap up with some personal details, ${data.full_name.split(' ')[0]}. Please fill in the form below.`,
        key: 'personal_details',
        type: 'form',
        response: () => "Personal details added! We’re almost done. 😊",
        api: '/resume/personal_details',
        formatData: (val) => ({
          userId,
          dob: val.dob,
          gender: val.gender,
          nationality: val.nationality,
          marital_status: val.maritalStatus,
          languages: val.languages
        })
      }
    ],
    references: [
      {
        question: "Finally, add any references or type ‘Available upon request’.",
        key: 'references',
        response: () => "References set! That’s the last piece of your resume. 🎉",
        api: '/resume/references'
      }
    ],
    photo: [
      {
        question: "Want to upload your photo? (Optional) Click below to upload or type 'skip'.",
        key: 'photo',
        type: 'file',
        optional: true,
        response: (val) => val.toLowerCase() === 'skip' ? "No photo? That’s fine! Let’s finish up! 😊" : "Thanks for uploading your photo! Let’s generate your resume now.",
        api: '/resume/photo'
      }
    ],
    generate: [
      {
        question: (data) => `Done, ${data.full_name.split(' ')[0]}! Generating your resume…`,
        key: 'generate',
        type: 'loader',
        final: true,
        api: '/resume/generate'
      }
    ],
  };

  const totalSteps = 14;
  let completedSteps = Object.keys(resumeData).length > 1 ? Object.keys(resumeData).length - 1 : 0;

  // Helper to get random encouraging phrase
  const getEncouragingPhrase = () => {
    const phrases = [
      "You’re doing great! 😊",
      "Awesome, keep it up! 🚀",
      "Looking good so far! 🌟",
      "Nice one! Let’s keep going. 👍",
      "I’m loving your answers! 😄"
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  };

  // Add a message to the chat
  function addMessage(message, isBot = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isBot ? 'bot-message' : 'user-message'}`;
    if (isBot) {
      const iconDiv = document.createElement('div');
      iconDiv.className = 'bot-icon';
      iconDiv.textContent = '🤖';
      messageDiv.appendChild(iconDiv);
    }
    const textDiv = document.createElement('span');
    textDiv.textContent = message;
    messageDiv.appendChild(textDiv);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Simulate typing effect
  async function simulateTyping(message) {
    typingIndicator.style.display = 'flex';
    await new Promise(resolve => setTimeout(resolve, 1000 + message.length * 20));
    typingIndicator.style.display = 'none';
    addMessage(message);
  }

  // Clear previous messages
  function clearPreviousMessages() {
    while (chatContainer.children.length > 0) {
      chatContainer.removeChild(chatContainer.children[0]);
    }
  }

  // Update progress tracker
  function updateProgress() {
    progressTracker.textContent = `Step ${completedSteps + 1} of ${totalSteps}`;
  }

  // Save draft to localStorage
  function saveDraft() {
    localStorage.setItem('resumeDraft', JSON.stringify(resumeData));
  }

  // Populate auto-suggestions
  function populateSuggestions(type) {
    const datalist = document.getElementById('suggestions');
    datalist.innerHTML = '';
    const suggestions = type === 'skills' ? skillsSuggestions : universitySuggestions;
    suggestions.forEach(suggestion => {
      const option = document.createElement('option');
      option.value = suggestion;
      datalist.appendChild(option);
    });
  }

  // Add project card (Modified to support bullet points in description)
  function addProjectCard() {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
      <input type="text" placeholder="Project Title (e.g., Data Visualization Dashboard)">
      <input type="text" placeholder="Year (e.g., Personal Project - Jun 2023)">
      <textarea placeholder="Description (use • for bullets, e.g., • Built an interactive dashboard...)"></textarea>
      <button type="button" onclick="this.parentElement.remove()">Remove</button>
    `;
    projectCardsContainer.appendChild(card);
  }

  // Backend Integration Functions
  async function callApi(endpoint, data, token, isFormData = false) {
    const headers = isFormData ? { Authorization: `Bearer ${token}` } : { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    // Map frontend endpoints to backend endpoints
    const endpointMap = {
      '/resume/basic': '/api/analyze',
      '/resume/skills': '/api/analyze',
      '/resume/education': '/api/analyze',
      '/resume/projects': '/api/analyze',
      '/resume/certifications': '/api/analyze',
      '/resume/photo': '/api/analyze',
      '/resume/personal_details': '/api/analyze',
      '/resume/generate': '/api/analyze'
    };

    const backendEndpoint = endpointMap[endpoint] || endpoint;
    const body = isFormData ? data : JSON.stringify(data);
    
    try {
      const response = await fetch(`${API_BASE_URL}${backendEndpoint}`, {
        method: 'POST',
        headers,
        body
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error('Failed to parse JSON response:', responseText);
        throw new Error('Invalid response from server. Please try again.');
      }

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to process your request. Please try again.');
      }

      return responseData;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  async function downloadResume(fileName, token) {
    const response = await fetch(`${API_BASE_URL}/resume/download?file=${fileName}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error('Failed to download the resume.');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Calculate Resume Score (Mock)
  function calculateResumeScore(data) {
    let score = 50; // Base score
    if (data.career_objective?.length > 20) score += 10;
    if (data.education) score += 10;
    if (data.skills_technical?.split(',').length >= 3) score += 10;
    if (data.projects?.length > 0) score += 10;
    if (data.achievements) score += 10;
    return Math.min(score, 100);
  }

  // Handle the current step
  async function handleStep(token) {
    const stepQuestions = questions[currentStep];
    const currentQuestion = stepQuestions[currentQuestionIndex];
    const questionText = typeof currentQuestion.question === 'function' ? currentQuestion.question(resumeData) : currentQuestion.question;

    clearPreviousMessages();
    await simulateTyping(questionText);

    // Adjust input type based on step
    userInput.classList.toggle('hidden', currentQuestion.type !== undefined && currentQuestion.type !== 'textarea');
    if (currentQuestion.type === 'textarea') {
      userInput.replaceWith(document.createElement('textarea'));
      userInput = document.querySelector('textarea');
      userInput.id = 'userInput';
      userInput.placeholder = "Type your answer here...";
    } else if (currentQuestion.type === 'projects') {
      projectCardsContainer.classList.remove('hidden');
      if (projectCardsContainer.children.length === 0) addProjectCard();
      const addMoreBtn = document.createElement('button');
      addMoreBtn.textContent = "Add Another Project";
      addMoreBtn.className = 'btn';
      addMoreBtn.onclick = addProjectCard;
      projectCardsContainer.appendChild(addMoreBtn);
    } else if (currentQuestion.type === 'form') {
      personalDetailsForm.classList.remove('hidden');
    } else if (currentQuestion.type === 'file') {
      photoUpload.classList.remove('hidden');
    } else if (currentQuestion.type === 'loader') {
      sendButton.disabled = true;
      skipButton.classList.add('hidden');
      goBackButton.classList.add('hidden');
    }

    // Show skip button for optional steps
    skipButton.classList.toggle('hidden', !currentQuestion.optional);

    // Populate auto-suggestions if applicable
    if (currentQuestion.autosuggest) {
      populateSuggestions(currentQuestion.autosuggest);
    }

    canGoBack = history.length > 0;
    goBackButton.classList.toggle('hidden', !canGoBack);
    updateProgress();
  }

  // Send button click handler
  sendButton.addEventListener('click', async () => {
    let userResponse = userInput.value.trim();
    const token = localStorage.getItem("token");
    if (!token) {
      await simulateTyping("Please log in to continue.");
      return;
    }
    const stepQuestions = questions[currentStep];
    const currentQuestion = stepQuestions[currentQuestionIndex];

    // Handle different input types
    if (currentQuestion.type === 'projects') {
      projects = Array.from(projectCardsContainer.querySelectorAll('.project-card')).map(card => {
        const inputs = card.querySelectorAll('input, textarea');
        return `${inputs[0].value} | ${inputs[1].value} | ${inputs[2].value}`;
      }).filter(project => project.split('|').every(part => part.trim()));
      userResponse = projects.join('\n');
      projectCardsContainer.innerHTML = '';
      projectCardsContainer.classList.add('hidden');
    } else if (currentQuestion.type === 'form') {
      userResponse = {
        dob: document.getElementById('dob').value,
        gender: document.getElementById('gender').value,
        nationality: document.getElementById('nationality').value,
        maritalStatus: document.getElementById('maritalStatus').value,
        languages: document.getElementById('languages').value
      };
      if (!userResponse.dob || !userResponse.gender || !userResponse.nationality || !userResponse.maritalStatus || !userResponse.languages) {
        await simulateTyping("Please fill in all personal details!");
        return;
      }
      personalDetailsForm.classList.add('hidden');
    } else if (currentQuestion.type === 'file') {
      userResponse = userInput.value.trim();
    }

    // Allow empty input for the 'start' step since it only requires clicking "Send"
    if (!userResponse && !currentQuestion.type && !currentQuestion.optional && currentStep !== 'start') return;

    if (userResponse && !currentQuestion.type && currentStep !== 'start') {
      addMessage(userResponse, false);
      userInput.value = '';
    }

    try {
      // Validate user input
      if (currentQuestion.validate) {
        const validationError = currentQuestion.validate(userResponse);
        if (validationError) {
          clearPreviousMessages();
          if (!currentQuestion.type) addMessage(userResponse, false);
          await simulateTyping(validationError);
          return;
        }
      }

      // Suggest improvements if applicable
      if (currentQuestion.suggest) {
        const suggestion = currentQuestion.suggest(userResponse);
        if (suggestion) {
          clearPreviousMessages();
          addMessage(userResponse, false);
          await simulateTyping(suggestion);
          return;
        }
      }

      // Add dynamic response if provided
      if (currentQuestion.response) {
        const dynamicResponse = await currentQuestion.response(userResponse);
        await simulateTyping(dynamicResponse);
      }

      // Store the response in resumeData
      if (currentQuestion.key && currentStep !== 'generate' && currentStep !== 'start') {
        if (currentQuestion.store) {
          currentQuestion.store(userResponse);
        } else {
          resumeData[currentQuestion.key] = userResponse;
        }
        saveDraft();
      }

      // Handle API call if applicable
      if (currentQuestion.api && currentQuestion.key !== 'generate' && currentQuestion.key !== 'photo') {
        const data = currentQuestion.formatData ? currentQuestion.formatData(userResponse) : { [currentQuestion.key]: userResponse, userId };
        const response = await callApi(currentQuestion.api, data, token);
        currentStep = response.nextStep || currentStep;
      } else if (currentQuestion.api && currentQuestion.key === 'photo' && userResponse.toLowerCase() !== 'skip') {
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('photo', photoUpload.files[0]);
        const response = await callApi('/resume/photo', formData, token, true);
        photoUpload.classList.add('hidden');
        currentStep = response.nextStep || currentStep;
      } else if (currentQuestion.api && currentQuestion.key === 'start') {
        const response = await callApi('/resume/start', { userId }, token);
        currentStep = response.nextStep || currentStep;
      }

      // Handle optional steps
      if (currentQuestion.optional && userResponse.toLowerCase() === 'skip') {
        resumeData[currentQuestion.key] = 'N/A';
        saveDraft();
      }

      // Move to the next question or step
      history.push({ step: currentStep, index: currentQuestionIndex, question: currentQuestion });
      currentQuestionIndex++;
      if (currentQuestionIndex >= stepQuestions.length) {
        completedSteps++;
        currentStep = Object.keys(questions)[Object.keys(questions).indexOf(currentStep) + 1];
        currentQuestionIndex = 0;

        // Final step: Generate resume and show templates
        if (currentStep === 'generate') {
          const data = {
            userId,
            full_name: resumeData.full_name,
            contact_info: resumeData.contact_info,
            linkedin: resumeData.linkedin || '',
            github: resumeData.github || '',
            website: resumeData.website || '',
            career_objective: resumeData.career_objective,
            education: resumeData.education,
            projects: projects,
            skills: {
              technical: resumeData.skills_technical,
              management: resumeData.skills_management
            },
            certifications: {
              professional: resumeData.certifications_professional,
              personal: resumeData.certifications_personal
            },
            achievements: resumeData.achievements,
            hobbies: resumeData.hobbies || 'N/A',
            personal_details: resumeData.personal_details || {},
            references: resumeData.references || 'Available upon request',
            photo: resumeData.photo || null
          };

          const response = await callApi('/resume/generate', data, token); // Send full data for PDF generation
          clearPreviousMessages();
          await simulateTyping('Your resume is ready! Let’s choose a style for it. 🎉');

          // Calculate and display resume score
          const score = calculateResumeScore(data);
          document.getElementById('resumeScore').textContent = `Resume Score: ${score}%`;

          // Show template modal (theme unchanged)
          templateModal.style.display = 'flex';

          // Handle template selection
          document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
              document.querySelectorAll('.template-card').forEach(c => c.style.border = '1px solid #00ff00a7');
              card.style.border = '2px solid #00ff00a8';
              selectedTemplate = card.dataset.template;
            });
          });

          // Preview template
          previewTemplateBtn.addEventListener('click', async () => {
            if (!selectedTemplate) return alert("Please select a template!");
            try {
              const previewResponse = await callApi('/resume/preview', { userId }, token);
              resumePreview.textContent = previewResponse.preview;
              previewModal.style.display = 'flex';
            } catch (error) {
              await simulateTyping(`Error previewing resume: ${error.message}`);
            }
          });

          // Close preview modal
          closePreviewBtn.addEventListener('click', () => {
            previewModal.style.display = 'none';
          });

          // Download template (triggers PDF download)
          downloadTemplateBtn.addEventListener('click', async () => {
            if (!selectedTemplate) return alert("Please select a template!");
            try {
              await downloadResume(response.file, token);
              await simulateTyping('Your resume has been downloaded as a PDF! 😊');
              localStorage.removeItem('resumeDraft');
            } catch (error) {
              await simulateTyping(`Error downloading resume: ${error.message}`);
            }
          });

         return;
        }
      }

      handleStep(token);
    } catch (error) {
      clearPreviousMessages();
      if (!currentQuestion.type && currentStep !== 'start') addMessage(userResponse, false);
      await simulateTyping(`Oops, something went wrong: ${error.message}. Let’s try that again, okay? 😅`);
    }
  });

  // Skip button click handler
  skipButton.addEventListener('click', async () => {
    const token = localStorage.getItem("token");
    const stepQuestions = questions[currentStep];
    const currentQuestion = stepQuestions[currentQuestionIndex];

    resumeData[currentQuestion.key] = 'N/A';
    saveDraft();

    if (currentQuestion.response) {
      const dynamicResponse = await currentQuestion.response('skip');
      await simulateTyping(dynamicResponse);
    }

    history.push({ step: currentStep, index: currentQuestionIndex, question: currentQuestion });
    currentQuestionIndex++;
    if (currentQuestionIndex >= stepQuestions.length) {
      completedSteps++;
      currentStep = Object.keys(questions)[Object.keys(questions).indexOf(currentStep) + 1];
      currentQuestionIndex = 0;
    }

    handleStep(token);
  });

  // Go Back button click handler
  goBackButton.addEventListener('click', () => {
    if (history.length > 0) {
      const lastEntry = history.pop();
      currentStep = lastEntry.step;
      currentQuestionIndex = lastEntry.index;
      delete resumeData[lastEntry.question.key];
      completedSteps--;
      saveDraft();
      clearPreviousMessages();
      handleStep(localStorage.getItem("token"));
    }
  });

  // Allow Enter key to send message
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendButton.click();
  });

  // Initialize the chatbot
  handleStep(localStorage.getItem("token"));
}

// Add some basic styles
const style = document.createElement('style');
style.textContent = `
  body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 20px;
    color: #333;
  }
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  .form-group {
    margin-bottom: 15px;
  }
  label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }
  textarea, input[type="file"] {
    width: 100%;
    padding: 8px;
    margin-bottom: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  .btn {
    background: #4CAF50;
    color: white;
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
  }
  .btn:hover {
    background: #45a049;
  }
  .error {
    color: #d32f2f;
    margin: 10px 0;
    padding: 10px;
    background: #ffebee;
    border-radius: 4px;
    display: none;
  }
  .results {
    margin-top: 20px;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #f9f9f9;
  }
  .skills-section {
    display: flex;
    gap: 20px;
    margin-top: 20px;
  }
  .skills-matched, .skills-missing {
    flex: 1;
    padding: 10px;
    border-radius: 4px;
  }
  .skills-matched { background: #e8f5e9; }
  .skills-missing { background: #ffebee; }
  .score-bar {
    width: 100%;
    height: 20px;
    background: #e0e0e0;
    border-radius: 10px;
    margin: 10px 0;
    overflow: hidden;
  }
  .score-fill {
    height: 100%;
    background: #4CAF50;
    transition: width 0.5s ease-in-out;
  }
`;
document.head.appendChild(style);

// Start the application
createAnalysisForm();
