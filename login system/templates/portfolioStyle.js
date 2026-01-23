const { generateMinimalTemplate } = require('./minimal');

function generatePortfolioStyleTemplate(data) {
  return generateMinimalTemplate(data);
}

module.exports = { generatePortfolioStyleTemplate };
