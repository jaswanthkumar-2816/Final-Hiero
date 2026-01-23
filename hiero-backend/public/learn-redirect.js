// learn-redirect.js - Utility for proper skill handling in learning flow
// This file ensures skills are properly passed from resume analysis to learn.html

/**
 * Navigate to learn.html with proper skill parameter
 * @param {string} skill - The skill to learn
 * @param {string} source - Source of navigation (analysis, dashboard, etc.)
 */
function navigateToLearn(skill, source = 'unknown') {
  console.log(`🎓 Navigating to learn skill: ${skill} from ${source}`);
  
  // Clean and validate skill name
  const cleanSkill = skill ? skill.trim() : '';
  
  if (!cleanSkill) {
    console.error('No skill provided for learning');
    alert('Please select a skill to learn');
    return;
  }
  
  // Save skill to localStorage as backup
  localStorage.setItem('selectedSkill', cleanSkill);
  localStorage.setItem('learnSource', source);
  localStorage.setItem('learnTimestamp', Date.now().toString());
  
  console.log(`✅ Saved skill to localStorage: ${cleanSkill}`);
  
  // Construct URL with proper encoding
  const encodedSkill = encodeURIComponent(cleanSkill);
  const learnUrl = `learn.html?skill=${encodedSkill}&source=${encodeURIComponent(source)}`;
  
  console.log(`🚀 Redirecting to: ${learnUrl}`);
  
  // Navigate to learn page
  window.location.href = learnUrl;
}

/**
 * Extract skill from resume analysis result
 * @returns {string|null} - First missing skill or null
 */
function getSkillFromAnalysis() {
  try {
    const analysisResult = JSON.parse(localStorage.getItem('analysisResult'));
    if (analysisResult?.missingSkills?.length > 0) {
      return analysisResult.missingSkills[0];
    }
  } catch (error) {
    console.error('Error parsing analysis result:', error);
  }
  return null;
}

/**
 * Set up learn buttons in resume analysis page
 * Call this after analysis results are displayed
 */
function setupLearnButtons() {
  console.log('🔧 Setting up learn buttons...');
  
  // Find all learn buttons
  const learnButtons = document.querySelectorAll('[data-skill], .learn-btn, .btn[onclick*="learn"]');
  
  learnButtons.forEach((button, index) => {
    let skill = '';
    
    // Try different methods to get skill
    if (button.dataset.skill) {
      skill = button.dataset.skill;
    } else if (button.textContent.includes('Learn')) {
      // Try to extract skill from button text or nearby elements
      const skillElement = document.getElementById('learn-first') || 
                          button.previousElementSibling ||
                          button.parentElement.querySelector('.skill-name');
      if (skillElement) {
        skill = skillElement.textContent.trim();
      }
    }
    
    if (skill) {
      console.log(`Found learn button ${index + 1} for skill: ${skill}`);
      
      // Remove old onclick handlers
      button.removeAttribute('onclick');
      
      // Add new click handler
      button.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToLearn(skill, 'analysis');
      });
      
      // Add visual indication that button is ready
      button.style.cursor = 'pointer';
      if (!button.textContent.includes('Start Learning')) {
        button.textContent = `Start Learning ${skill}`;
      }
    }
  });
}

/**
 * Auto-setup when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('📚 Learn-redirect.js loaded');
  
  // If we're on the analysis/result page, set up buttons
  if (window.location.pathname.includes('result') || 
      window.location.pathname.includes('analysis') ||
      document.getElementById('learn-first')) {
    
    // Wait a bit for dynamic content to load
    setTimeout(() => {
      setupLearnButtons();
    }, 1000);
  }
  
  // Global function for manual button setup
  window.navigateToLearn = navigateToLearn;
  window.setupLearnButtons = setupLearnButtons;
});

/**
 * Enhanced skill detection for learn.html
 * Call this in learn.html instead of the basic method
 */
function detectSkillForLearning() {
  console.log('🔍 Enhanced skill detection starting...');
  
  // 1. Try URL parameter first
  const urlParams = new URLSearchParams(window.location.search);
  const skillFromUrl = urlParams.get('skill');
  const source = urlParams.get('source') || 'unknown';
  
  console.log('URL params:', { skill: skillFromUrl, source });
  
  if (skillFromUrl) {
    console.log(`✅ Found skill in URL: ${skillFromUrl}`);
    // Save to localStorage for future reference
    localStorage.setItem('selectedSkill', skillFromUrl);
    return skillFromUrl;
  }
  
  // 2. Try localStorage (selectedSkill)
  const skillFromStorage = localStorage.getItem('selectedSkill');
  if (skillFromStorage) {
    console.log(`✅ Found skill in localStorage: ${skillFromStorage}`);
    return skillFromStorage;
  }
  
  // 3. Try analysis result
  const skillFromAnalysis = getSkillFromAnalysis();
  if (skillFromAnalysis) {
    console.log(`✅ Found skill in analysis: ${skillFromAnalysis}`);
    // Save for future reference
    localStorage.setItem('selectedSkill', skillFromAnalysis);
    return skillFromAnalysis;
  }
  
  // 4. Check if user has any preferences
  const userPreferences = localStorage.getItem('userPreferences');
  if (userPreferences) {
    try {
      const prefs = JSON.parse(userPreferences);
      if (prefs.lastSkill) {
        console.log(`✅ Found skill in preferences: ${prefs.lastSkill}`);
        return prefs.lastSkill;
      }
    } catch (error) {
      console.error('Error parsing user preferences:', error);
    }
  }
  
  console.warn('❌ No skill detected, using default');
  return null;
}

// Export for use in learn.html
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    navigateToLearn,
    detectSkillForLearning,
    setupLearnButtons,
    getSkillFromAnalysis
  };
}

// Make functions globally available
window.learnRedirect = {
  navigateToLearn,
  detectSkillForLearning,
  setupLearnButtons,
  getSkillFromAnalysis
};
