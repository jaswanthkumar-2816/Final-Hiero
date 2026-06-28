const fs = require('fs');
const path = require('path');
const PDFJS = require('../node_modules/pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js');

async function extractText(file) {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
        console.log(`File ${file} does not exist`);
        return;
    }
    const buffer = fs.readFileSync(filePath);
    
    PDFJS.disableWorker = true;
    try {
        console.log(`\n=== Processing ${file} ===`);
        const loadingTask = PDFJS.getDocument({
            data: new Uint8Array(buffer),
            stopAtErrors: false,
            disableRange: true,
            disableStream: true
        });
        const doc = await loadingTask;
        console.log('Success! Pages:', doc.numPages);
        
        let fullText = '';
        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const textContent = await page.getTextContent({
                normalizeWhitespace: false,
                disableCombineTextItems: false
            });
            let lastY, text = '';
            for (let item of textContent.items) {
                if (lastY == item.transform[5] || !lastY) {
                    text += item.str;
                } else {
                    text += '\n' + item.str;
                }
                lastY = item.transform[5];
            }
            fullText += `\n\n${text}`;
        }
        console.log('Extracted text length:', fullText.trim().length);
        console.log('Preview:', fullText.trim().substring(0, 300));
    } catch (err) {
        console.error(`Failed for ${file}:`, err.message, err.details || '');
    }
}

async function run() {
    await extractText('test-debug.pdf');
    await extractText('test_hiero_retail.pdf');
}

run();
