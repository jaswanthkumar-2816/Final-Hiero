const fs = require('fs');
const content = fs.readFileSync('result.html', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('href=\"#\"') || line.includes('href=\"\"') || line.includes('href=\'#\'')) {
    console.log((i + 1) + ': ' + line.trim());
  }
});
