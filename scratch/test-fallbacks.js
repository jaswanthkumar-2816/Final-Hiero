const fs = require('fs');
const path = require('path');

function extractBinary(buffer) {
    try {
        const bufferString = buffer.toString('binary');
        const textPatterns = [
            /\(([^)]+)\)\s*Tj/g,
            /\[([^\]]+)\]\s*TJ/g,
            /BT\s+(.*?)\s+ET/gs
        ];
        let extractedText = '';
        for (const pattern of textPatterns) {
            const matches = [...bufferString.matchAll(pattern)];
            matches.forEach(match => {
                let text = match[1] || match[0];
                text = text.replace(/[()[\]]/g, ' ')
                          .replace(/\\[rnt]/g, ' ')
                          .replace(/\s+/g, ' ')
                          .trim();
                if (text.length > 2 && /[a-zA-Z]/.test(text)) {
                    extractedText += text + ' ';
                }
            });
        }
        return extractedText.trim();
    } catch (e) {
        return '';
    }
}

function extractAscii(buffer) {
    try {
        const bufferString = buffer.toString('ascii');
        const readableText = bufferString.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
                                       .replace(/\s+/g, ' ')
                                       .trim();
        const words = readableText.match(/[a-zA-Z]{3,}/g);
        if (words && words.length > 5) {
            return words.join(' ');
        }
        return '';
    } catch (e) {
        return '';
    }
}

const files = ['test-debug.pdf', 'test_hiero_retail.pdf'];
for (const file of files) {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) continue;
    const buffer = fs.readFileSync(filePath);
    console.log(`=== ${file} ===`);
    console.log('Binary length:', extractBinary(buffer).length);
    console.log('Binary preview:', extractBinary(buffer).substring(0, 200));
    console.log('ASCII length:', extractAscii(buffer).length);
    console.log('ASCII preview:', extractAscii(buffer).substring(0, 200));
}
