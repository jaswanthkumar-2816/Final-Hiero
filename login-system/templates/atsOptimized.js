const { generateClassicTemplate } = require('./classic');

function generateATSOptimizedTemplate(data) {
  return generateClassicTemplate(data);
}

module.exports = { generateATSOptimizedTemplate };
