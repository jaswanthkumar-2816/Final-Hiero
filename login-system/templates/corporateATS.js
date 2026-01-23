const { generateModernProTemplate } = require('./modernPro');

function generateCorporateATSTemplate(data) {
  return generateModernProTemplate(data);
}

module.exports = { generateCorporateATSTemplate };
