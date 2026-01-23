document.addEventListener("DOMContentLoaded", () => {
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
      // Just check if backend root is up
      const response = await fetch("http://localhost:5001/");
      if (response.ok || response.status === 404) { // 404 is fine for root
        connectionStatus.style.display = "block";
        connectionStatus.style.backgroundColor = "#d4edda";
        connectionStatus.style.color = "#155724";
        statusText.textContent = "✅ Backend connected successfully";
        analyzeBtn.disabled = false;
      } else {
        throw new Error("Backend not responding");
      }
    } catch (error) {
      connectionStatus.style.display = "block";
      connectionStatus.style.backgroundColor = "#f8d7da";
      connectionStatus.style.color = "#721c24";
      statusText.textContent = "❌ Backend connection failed. Please ensure the server is running on port 5001";
      analyzeBtn.disabled = true;
    }
  }

  // Test connection when page loads
  testBackendConnection();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const resumeFile = document.getElementById("resume")?.files[0];
    const jdFile = document.getElementById("jd")?.files[0];

    if (!resumeFile || !jdFile) {
      alert("Please upload both resume and job description files.");
      return;
    }

    if (!loadingOverlay) {
      console.error("Loading overlay not found.");
      alert("Loading animation failed to start.");
      return;
    }

    loadingOverlay.classList.add("visible");

    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jd", jdFile);

    try {
      const response = await fetch("http://localhost:5001/api/analyze", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`);
      }

      if (result.success && result.data) {
        localStorage.setItem("analysisResult", JSON.stringify(result.data));
        console.log("✅ Stored in localStorage:", result.data);
        window.location.href = "result.html";
      } else {
        throw new Error(result.error || 'No analysis data returned');
      }

    } catch (error) {
      console.error("Analysis error:", error);
      
      // Show more specific error messages
      let errorMessage = "Failed to analyze resume";
      if (error.message.includes("Failed to fetch")) {
        errorMessage = "Cannot connect to backend server. Please ensure the server is running on port 5001.";
      } else if (error.message.includes("NetworkError")) {
        errorMessage = "Network error. Please check your internet connection.";
      } else {
        errorMessage = error.message;
      }
      
      alert(`❌ ${errorMessage}`);
    } finally {
      loadingOverlay.classList.remove("visible");
    }
  });
});
