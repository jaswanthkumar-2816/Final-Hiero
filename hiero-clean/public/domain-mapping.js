/**
 * Domain-specific configurations for the Hiero Resume Builder.
 * Maps subdomains to specific section orders, highlights, and template styles.
 */

const DOMAIN_CONFIG = {
  // Engineering & Tech
  'software-engineer': {
    sectionOrder: ['skills', 'projects', 'experience', 'education', 'certifications'],
    highlight: 'skills',
    templateStyle: 'minimal'
  },
  'frontend-developer': {
    sectionOrder: ['skills', 'projects', 'portfolio', 'experience', 'education'],
    highlight: 'projects',
    templateStyle: 'creative-bold'
  },
  'backend-developer': {
    sectionOrder: ['skills', 'projects', 'experience', 'education', 'certifications'],
    highlight: 'skills',
    templateStyle: 'minimal'
  },
  'full-stack-developer': {
    sectionOrder: ['skills', 'projects', 'experience', 'education', 'certifications'],
    highlight: 'projects',
    templateStyle: 'modern-pro'
  },
  'mobile-developer': {
    sectionOrder: ['skills', 'projects', 'experience', 'education'],
    highlight: 'projects',
    templateStyle: 'tech-focus'
  },
  'data-scientist': {
    sectionOrder: ['skills', 'projects', 'publications', 'experience', 'education'],
    highlight: 'skills',
    templateStyle: 'tech-focus'
  },
  'ml-engineer': {
    sectionOrder: ['skills', 'research', 'projects', 'experience', 'education'],
    highlight: 'skills',
    templateStyle: 'tech-focus'
  },
  'ai-engineer': {
    sectionOrder: ['skills', 'projects', 'research', 'experience', 'education'],
    highlight: 'skills',
    templateStyle: 'tech-focus'
  },
  'devops-engineer': {
    sectionOrder: ['skills', 'certifications', 'experience', 'projects', 'education'],
    highlight: 'skills',
    templateStyle: 'minimal'
  },
  'cybersecurity-analyst': {
    sectionOrder: ['skills', 'certifications', 'experience', 'education', 'projects'],
    highlight: 'certifications',
    templateStyle: 'minimal'
  },

  // Creative & Media
  'graphic-designer': {
    sectionOrder: ['portfolio', 'skills', 'experience', 'projects', 'education'],
    highlight: 'portfolio',
    templateStyle: 'creative-bold'
  },
  'ui-ux-designer': {
    sectionOrder: ['portfolio', 'projects', 'skills', 'experience', 'education'],
    highlight: 'projects',
    templateStyle: 'creative-bold'
  },
  'video-editor': {
    sectionOrder: ['portfolio', 'skills', 'experience', 'projects', 'education'],
    highlight: 'portfolio',
    templateStyle: 'creative-bold'
  },
  'content-creator': {
    sectionOrder: ['portfolio', 'social-metrics', 'experience', 'skills', 'education'],
    highlight: 'portfolio',
    templateStyle: 'creative-bold'
  },
  'marketing-manager': {
    sectionOrder: ['experience', 'metrics', 'skills', 'education', 'certifications'],
    highlight: 'metrics',
    templateStyle: 'modern-pro'
  },

  // Business & Management
  'product-manager': {
    sectionOrder: ['experience', 'projects', 'skills', 'education', 'certifications'],
    highlight: 'experience',
    templateStyle: 'modern-pro'
  },
  'business-analyst': {
    sectionOrder: ['experience', 'skills', 'projects', 'education', 'certifications'],
    highlight: 'skills',
    templateStyle: 'minimal'
  },
  'finance-manager': {
    sectionOrder: ['experience', 'certifications', 'skills', 'education', 'achievements'],
    highlight: 'experience',
    templateStyle: 'minimal'
  },
  'hr-specialist': {
    sectionOrder: ['experience', 'skills', 'education', 'certifications', 'achievements'],
    highlight: 'experience',
    templateStyle: 'minimal'
  },
  'sales-executive': {
    sectionOrder: ['experience', 'achievements', 'skills', 'education', 'certifications'],
    highlight: 'achievements',
    templateStyle: 'modern-pro'
  },

  // Medical & Healthcare
  'doctor': {
    sectionOrder: ['education', 'experience', 'specializations', 'certifications', 'publications'],
    highlight: 'education',
    templateStyle: 'classic'
  },
  'nurse': {
    sectionOrder: ['experience', 'certifications', 'education', 'skills', 'achievements'],
    highlight: 'certifications',
    templateStyle: 'classic'
  },
  'pharmacist': {
    sectionOrder: ['education', 'experience', 'certifications', 'skills', 'publications'],
    highlight: 'education',
    templateStyle: 'minimal'
  },
  'dentist': {
    sectionOrder: ['education', 'specializations', 'experience', 'certifications', 'achievements'],
    highlight: 'specializations',
    templateStyle: 'classic'
  },

  // Education & Academic
  'teacher': {
    sectionOrder: ['education', 'experience', 'skills', 'certifications', 'achievements'],
    highlight: 'education',
    templateStyle: 'classic'
  },
  'professor': {
    sectionOrder: ['education', 'publications', 'research', 'experience', 'certifications'],
    highlight: 'publications',
    templateStyle: 'classic'
  },
  'researcher': {
    sectionOrder: ['publications', 'research', 'education', 'experience', 'skills'],
    highlight: 'publications',
    templateStyle: 'minimal'
  }
};

/**
 * Normalizes user-facing section terms to internal IDs
 */
const SECTION_ID_MAP = {
  'summary': 'section-summary',
  'skills': 'section-skills',
  'projects': 'section-projects',
  'experience': 'section-experience',
  'education': 'section-education',
  'certifications': 'section-additional-details',
  'languages': 'section-additional-details',
  'portfolio': 'group-website',
  'research': 'section-internships',
  'publications': 'section-additional',
  'achievements': 'section-additional',
  'metrics': 'section-projects',
  'social-metrics': 'section-additional',
  'specializations': 'section-skills'
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DOMAIN_CONFIG, SECTION_ID_MAP };
}
