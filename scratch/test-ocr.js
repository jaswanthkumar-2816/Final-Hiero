const Tesseract = require('tesseract.js');
const path = require('path');

const filePath = path.join(__dirname, '..', 'test-saanvi.pdf');
console.log('Running Tesseract OCR on:', filePath);

Tesseract.recognize(filePath, 'eng')
    .then(({ data: { text } }) => {
        console.log('OCR completed successfully!');
        console.log('Text length:', text.length);
        console.log('Text preview:', text.substring(0, 300));
    })
    .catch(err => {
        console.error('OCR failed:', err);
    });
