const fs = require('fs');
const pdfParse = require('pdf-parse');
const path = require('path');

const filePath = path.join(__dirname, '..', 'test-saanvi.pdf');
console.log('Reading file:', filePath);

try {
    const dataBuffer = fs.readFileSync(filePath);
    console.log('File read successfully. Buffer length:', dataBuffer.length);
    
    pdfParse(dataBuffer).then(data => {
        console.log('PDF parsed successfully!');
        console.log('Text length:', data.text ? data.text.length : 0);
        console.log('Text preview:', data.text ? data.text.substring(0, 200) : 'none');
    }).catch(err => {
        console.error('PDF parsing promise rejected:', err);
    });
} catch (err) {
    console.error('Error reading or parsing:', err);
}
