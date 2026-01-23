document.addEventListener("DOMContentLoaded", () => {
  // Use the analysis backend - CORRECT ENDPOINT
  const BACKEND_URL = "https://hiero-analysis-part.onrender.com";
  const ANALYZE_ENDPOINT = "https://hiero-analysis-part.onrender.com/api/analyze";
  console.log("🔍 Using backend:", BACKEND_URL);
  console.log("🎯 Analyze endpoint:", ANALYZE_ENDPOINT);
  console.log("⏰ Timestamp:", new Date().toISOString());
  console.log("✅ CACHE BUSTED VERSION");

  const form = document.getElementById("analyze-form");
  const loadingOverlay = document.getElementById("loading-overlay");
  const connectionStatus = document.getElementById("connection-status");
  const statusText = document.getElementById("status-text");
  const analyzeBtn = document.getElementById("analyze-btn");

  if (!form) {
    console.error("Form not found. Check 'analysis.html' for <form id='analyze-form'>.");
    alert("Form setup error. Please refresh or check the page.");
    return;
  }

  // Test backend connection on page load
  async function testBackendConnection() {
    try {
      const healthUrl = `${BACKEND_URL}/health`;
      console.log('🏥 Testing backend health:', healthUrl);
      const response = await fetch(healthUrl, {
        method: 'GET'
      });
      const data = await response.json();
      console.log('📋 Health check response:', data);
      if (response.ok) {
        connectionStatus.style.display = "block";
        connectionStatus.style.backgroundColor = "black";
        connectionStatus.style.color = "#00ff00";
        statusText.textContent = "✅ Backend Ready";
        analyzeBtn.disabled = false;
        console.log('✅ Backend is healthy!');
      } else {
        throw new Error("Health check returned: " + response.status);
      }
    } catch (error) {
      console.error('❌ Health check error:', error.message);
      connectionStatus.style.display = "block";
      connectionStatus.style.backgroundColor = "#f8d7da";
      connectionStatus.style.color = "#721c24";
      statusText.textContent = "⚠️ Waiting for backend...";
      analyzeBtn.disabled = true;
      
      // Retry after 2 seconds
      setTimeout(testBackendConnection, 2000);
    }
  }

  // Test connection when page loads
  testBackendConnection();

  // Enhanced Analysis Form Handler with Detailed Logging
  const analyzeForm = document.getElementById('analyze-form');
  if (analyzeForm) {
    analyzeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const resume = document.getElementById('resume').files[0];
      const jd = document.getElementById('jd').files[0];
      const jdTextEl = document.getElementById("jd-text");
      const jdMode = document.querySelector('input[name="jd_mode"]:checked')?.value || 'file';

      console.log('📝 Form submitted');
      console.log('Resume file:', resume ? `${resume.name} (${resume.size} bytes)` : 'NONE');
      console.log('JD file:', jd ? `${jd.name} (${jd.size} bytes)` : 'NONE');
      
      // Validation
      if (!resume) {
        alert("Please upload your resume PDF.");
        return;
      }
      
      if (jdMode === 'file' && !jd) {
        alert("Please upload the job description file or switch to text mode.");
        return;
      }
      
      if (jdMode === 'text' && (!jdTextEl || !jdTextEl.value.trim())) {
        alert("Please paste the job description text.");
        return;
      }

      if (!loadingOverlay) {
        console.error("Loading overlay not found.");
        alert("Loading animation failed to start.");
        return;
      }

      // Show loading overlay
      loadingOverlay.classList.add("visible");
      
      const formData = new FormData();
      formData.append('resume', resume);
      if (jdMode === 'file') {
        formData.append('jd', jd);
      } else {
        formData.append('jd_text', jdTextEl.value.trim());
      }
      
      try {
        console.log('📤 Sending to backend:', ANALYZE_ENDPOINT);
        console.log('🔗 Method: POST');
        console.log('📦 FormData contains:', {
          resume: resume.name,
          jdMode: jdMode,
          jd: jdMode === 'file' ? jd?.name : 'text input'
        });
        
        const response = await fetch(ANALYZE_ENDPOINT, {
          method: 'POST',
          body: formData
        });
        
        console.log('✅ Response received:');
        console.log('   Status:', response.status, response.statusText);
        console.log('   Content-Type:', response.headers.get('Content-Type'));
        
        if (!response.ok) {
          const contentType = response.headers.get('Content-Type');
          let errorText = '';
          
          if (contentType?.includes('application/json')) {
            const errorData = await response.json();
            errorText = errorData.message || JSON.stringify(errorData);
          } else {
            errorText = await response.text();
          }
          
          console.error('❌ Server error (HTTP ' + response.status + '):', errorText);
          throw new Error(`Server error (${response.status}): ${errorText || response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📊 Backend Response Data:');
        console.log('   Full response:', JSON.stringify(result, null, 2));
        console.log('   Domain:', result.domain);
        console.log('   Score:', result.score);
        console.log('   JD Skills:', result.jdSkills);
        console.log('   Resume Skills:', result.resumeSkills);
        console.log('   Matched:', result.matched);
        console.log('   Missing:', result.missing);
        console.log('   Extra Skills:', result.extraSkills);
        
        // Transform backend response to match result.html expectations
        const transformedData = {
          score: Math.min(Math.max(parseInt(result.score) || 0, 0), 100),
          domain: result.domain || 'it',
          jdSkills: Array.isArray(result.jdSkills) ? result.jdSkills : [],
          resumeSkills: Array.isArray(result.resumeSkills) ? result.resumeSkills : [],
          matchedSkills: Array.isArray(result.matched) ? result.matched : [],
          missingSkills: Array.isArray(result.missing) ? result.missing : [],
          extraSkills: Array.isArray(result.extraSkills) ? result.extraSkills : [],
          skillToLearnFirst: (result.missing && Array.isArray(result.missing) && result.missing.length > 0) ? result.missing[0] : 'JavaScript',
          projectSuggestions: generateProjectSuggestions(result)
        };
        
        console.log('🔄 Transformed Data:', JSON.stringify(transformedData, null, 2));

        // Store in localStorage with transformed data
        const storageData = {
          success: true,
          data: transformedData,
          rawData: result,
          timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('analysisResult', JSON.stringify(storageData));
        
        console.log('💾 Stored in localStorage:');
        console.log('   Score:', transformedData.score);
        console.log('   Missing Skills:', transformedData.missingSkills.length, transformedData.missingSkills);
        console.log('   Matched Skills:', transformedData.matchedSkills.length, transformedData.matchedSkills);
        console.log('   Project Suggestions:', transformedData.projectSuggestions?.length);
        
        // Redirect to result page
        console.log('⏳ Redirecting in 2 seconds...');
        setTimeout(() => {
          console.log('🔄 Redirecting to result.html');
          window.location.href = 'result.html';
        }, 2000);
      } catch (error) {
        console.error('❌ Error during analysis:');
        console.error('   Endpoint used:', ANALYZE_ENDPOINT);
        console.error('   Message:', error.message);
        console.error('   Stack:', error.stack);
        
        if (loadingOverlay) loadingOverlay.classList.remove('visible');
        alert('Analysis failed: ' + error.message + '\n\nEndpoint: ' + ANALYZE_ENDPOINT + '\n\nCheck browser console for details.');
      }
    });
  } else {
    console.warn('⚠️ analyze-form not found on this page');
  }
  
  // Helper function to generate project suggestions based on missing skills
  function generateProjectSuggestions(result) {
    const domain = (result.domain || 'it').toLowerCase();
    const missingSkills = Array.isArray(result.missing) ? result.missing : [];
    
    const suggestions = {
      it: [
        { title: 'Build a REST API', desc: 'Create a backend service using Node.js/Python' },
        { title: 'Full-Stack App', desc: 'Build a complete web app with React & Node.js' },
        { title: 'Data Dashboard', desc: 'Create a data visualization dashboard' },
        { title: 'Mobile App', desc: 'Build an iOS/Android app with Flutter/React Native' },
        { title: 'E-commerce Platform', desc: 'Build a complete shopping system' },
        { title: 'Real-time Chat App', desc: 'Create a messaging application with WebSocket' }
      ],
      hr: [
        { title: 'HR Analytics Project', desc: 'Analyze employee data and create reports' },
        { title: 'Recruitment Portal', desc: 'Build a job application tracking system' },
        { title: 'Performance Dashboard', desc: 'Create employee performance tracking tool' }
      ],
      finance: [
        { title: 'Accounting System', desc: 'Create an expense tracking application' },
        { title: 'Budget Analyzer', desc: 'Build financial planning tools' },
        { title: 'Investment Portfolio', desc: 'Build a portfolio tracking application' }
      ],
      marketing: [
        { title: 'Campaign Analytics', desc: 'Create marketing campaign analysis tools' },
        { title: 'Social Media Dashboard', desc: 'Build a social media metrics dashboard' }
      ],
      default: [
        { title: 'Build a REST API', desc: 'Create a backend service' },
        { title: 'Full-Stack App', desc: 'Build a complete web application' },
        { title: 'Data Dashboard', desc: 'Create a data visualization dashboard' }
      ]
    };
    
    return ((suggestions[domain] || suggestions.default) || suggestions.it).slice(0, 3);
  }
});
