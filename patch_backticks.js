const fs = require('fs');
let file = 'routes/resume.js';
let content = fs.readFileSync(file, 'utf8');

// Replace wrong escapes introduced by node script string literal interpolation
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync(file, content, 'utf8');
