document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("analyze-form");
  const loadingOverlay = document.getElementById("loading-overlay");
  const connectionStatus = document.getElementById("connection-status");
  const statusText = document.getElementById("status-text");
  const analyzeBtn = document.getElementById("analyze-btn");

  if (!form) {
    console.error("Form not found.");
    alert("Form setup error. Please refresh.");
    return;
  }

  async function testBackendConnection() {
    try {

      const response = await fetch("/api/analysis/health");

      if (response.ok) {

        connectionStatus.style.display = "block";
        connectionStatus.style.backgroundColor = "#d4edda";
        connectionStatus.style.color = "#155724";
        statusText.textContent = "✅ Backend connected";

        analyzeBtn.disabled = false;

      } else {
        throw new Error("Backend not responding");
      }

    } catch (error) {

      connectionStatus.style.display = "block";
      connectionStatus.style.backgroundColor = "#f8d7da";
      connectionStatus.style.color = "#721c24";
      statusText.textContent = "❌ Backend connection failed";

      analyzeBtn.disabled = true;

    }
  }

  testBackendConnection();

  form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const resumeFile = document.getElementById("resume")?.files[0];
    const jdFile = document.getElementById("jd")?.files[0];

    if (!resumeFile || !jdFile) {
      alert("Please upload both files.");
      return;
    }

    loadingOverlay.classList.add("visible");

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing...";

    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jd", jdFile);

    try {

      const response = await fetch("/api/analysis/analyze", {
        method: "POST",
        body: formData
      });

      let result;

      try {
        result = await response.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (!response.ok) {
        throw new Error(result.error || "Server error");
      }

      if (!result.success || !result.data) {
        throw new Error("No analysis data returned");
      }

      localStorage.setItem("analysisResult", JSON.stringify(result.data));

      window.location.href = "result.html";

    } catch (error) {

      console.error("Analysis error:", error);

      let message = "Analysis failed";

      if (error.message.includes("fetch")) {
        message = "Cannot connect to backend server.";
      }

      alert(`❌ ${message}`);

    } finally {

      loadingOverlay.classList.remove("visible");

      analyzeBtn.disabled = false;
      analyzeBtn.textContent = "Analyze Resume";

    }

  });

});