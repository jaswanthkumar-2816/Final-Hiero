const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const files = fs.readdirSync(path.join(__dirname, '..'));
const pdfFiles = files.filter(f => f.endsWith('.pdf'));

console.log(`Found ${pdfFiles.length} PDF files to test.`);

async function testFile(file) {
    const filePath = path.join(__dirname, '..', file);
    try {
        const buffer = fs.readFileSync(filePath);
        const data = await pdfParse(buffer);
        console.log(`✅ ${file}: Parsed successfully! Text length: ${data.text ? data.text.length : 0}`);
    } catch (err) {
        console.log(`❌ ${file}: Failed with error: ${err.message}`);
    }
}

async function run() {
    for (const file of pdfFiles) {
        await testFile(file);
    }
}

run();
