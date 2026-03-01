const { generateModernProTemplate } = require('./modernPro');

function generateCreativeBoldTemplate(data) {
  return generateModernProTemplate(data)
    .replace('linear-gradient(135deg, #2ae023, #1a8b17)', 'linear-gradient(135deg, #667eea, #764ba2)')
    .replace(/#2ae023/g, '#667eea');
}

module.exports = { generateCreativeBoldTemplate };
