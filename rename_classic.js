const fs = require('fs');

// 1. Update unifiedTemplates.js
const unifyPath = 'routes/unifiedTemplates.js';
let unifyContent = fs.readFileSync(unifyPath, 'utf8');
unifyContent = unifyContent.replace(/case 'hiero-classic':/g, "case 'hiero-urban':");
unifyContent = unifyContent.replace(/renderTemplate_HieroClassic/g, "renderTemplate_HieroUrban");
fs.writeFileSync(unifyPath, unifyContent, 'utf8');

// 2. Update resume-builder.html
const htmlPath = 'hiero-prototype/jss/hiero/hiero-last/public/resume-builder.html';
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// The card block for 'hiero-classic' looks like:
// <div class="template-card" data-category="professional" data-template="hiero-classic" data-type="free">
// Let's replace hiero-classic with hiero-urban, and its category from professional to modern.
htmlContent = htmlContent.replace(/data-category="professional" data-template="hiero-classic"/g, 'data-category="modern" data-template="hiero-urban"');

// Replace any remaining 'hiero-classic' and 'Hiero Classic'
htmlContent = htmlContent.replace(/hiero-classic/g, 'hiero-urban');
htmlContent = htmlContent.replace(/Hiero Classic/g, 'Hiero Urban');

fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log('Renamed Hiero Classic to Hiero Urban');
