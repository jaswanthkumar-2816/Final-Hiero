const fs = require('fs');
let file = 'routes/unifiedTemplates.js';
let content = fs.readFileSync(file, 'utf8');

// The single backslash evaluated to a literal newline during the script creation
content = content.replace(/split\('\n'\)/g, "split('\\n')");

fs.writeFileSync(file, content, 'utf8');
