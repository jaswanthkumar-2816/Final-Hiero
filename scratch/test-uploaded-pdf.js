const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const filePath = path.join(__dirname, '..', 'uploads', '1776864794357-ywsap3z.pdf');
console.log('Testing uploaded PDF:', filePath);

if (!fs.existsSync(filePath)) {
    console.error('File does not exist!');
    process.exit(1);
}

const buffer = fs.readFileSync(filePath);
console.log('File size:', buffer.length);

pdfParse(buffer)
    .then(data => {
        console.log('Parsed successfully!');
        console.log('Text length:', data.text ? data.text.length : 0);
        console.log('Text preview:', data.text ? data.text.substring(0, 300) : 'none');
    })
    .catch(err => {
        console.error('Failed with error:', err);
    });
