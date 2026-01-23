// Central export for all resume templates
// Each template file exports a function (data) => html string

const { generateClassicTemplate } = require('./classic');
const { generateMinimalTemplate } = require('./minimal');
const { generateModernProTemplate } = require('./modernPro');
const { generateTechFocusTemplate } = require('./techFocus');
const { generateCreativeBoldTemplate } = require('./creativeBold');
const { generatePortfolioStyleTemplate } = require('./portfolioStyle');
const { generateATSOptimizedTemplate } = require('./atsOptimized');
const { generateCorporateATSTemplate } = require('./corporateATS');
const { generateElegantGradientTemplate } = require('./elegantGradient');
const { generateMinimalistMonoTemplate } = require('./minimalistMono');

function generateTemplateHTML(templateId, data) {
  const templates = {
    'classic': generateClassicTemplate,
    'minimal': generateMinimalTemplate,
    'modern-pro': generateModernProTemplate,
    'tech-focus': generateTechFocusTemplate,
    'creative-bold': generateCreativeBoldTemplate,
    'portfolio-style': generatePortfolioStyleTemplate,
    'ats-optimized': generateATSOptimizedTemplate,
    'corporate-ats': generateCorporateATSTemplate,
    'elegant-gradient': generateElegantGradientTemplate,
    'minimalist-mono': generateMinimalistMonoTemplate,
  };
  const generator = templates[templateId] || templates['classic'];
  return generator(data);
}

function listTemplates() {
  return [
    'classic',
    'minimal',
    'modern-pro',
    'tech-focus',
    'creative-bold',
    'portfolio-style',
    'ats-optimized',
    'corporate-ats',
    'elegant-gradient',
    'minimalist-mono'
  ];
}

module.exports = {
  generateTemplateHTML,
  listTemplates,
  generateClassicTemplate,
  generateMinimalTemplate,
  generateModernProTemplate,
  generateTechFocusTemplate,
  generateCreativeBoldTemplate,
  generatePortfolioStyleTemplate,
  generateATSOptimizedTemplate,
  generateCorporateATSTemplate,
  generateElegantGradientTemplate,
  generateMinimalistMonoTemplate
};
