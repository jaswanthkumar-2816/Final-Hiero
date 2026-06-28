const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'test-saanvi.pdf');
const data = fs.readFileSync(filePath);

console.log('PDF Length:', data.length);
console.log('Start of PDF (first 300 chars):');
console.log(data.toString('utf8', 0, Math.min(300, data.length)));
console.log('---');
console.log('End of PDF (last 300 chars):');
console.log(data.toString('utf8', Math.max(0, data.length - 300)));
