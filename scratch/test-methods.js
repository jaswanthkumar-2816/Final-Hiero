const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function safeExtractPdf(buffer, fileName = 'unknown'){
  console.log(`Attempting to parse PDF: ${fileName}, size: ${buffer.length} bytes`);
  
  // Method 1: Standard pdf-parse with default options
  try {
    const result = await pdfParse(buffer);
    if (result.text && result.text.trim().length > 0) {
      console.log(`Method 1 (Standard): Successfully extracted ${result.text.length} characters`);
      return result.text.trim();
    }
  } catch(error) {
    console.warn(`Method 1 (Standard) failed for ${fileName}:`, error.message);
  }
  
  // Method 2: pdf-parse with lenient options
  try {
    const result = await pdfParse(buffer, {
      max: 0, // Process all pages
      version: 'v1.10.100',
      normalizeWhitespace: false,
      disableCombineTextItems: false
    });
    if (result.text && result.text.trim().length > 0) {
      console.log(`Method 2 (Lenient): Successfully extracted ${result.text.length} characters`);
      return result.text.trim();
    }
  } catch(error) {
    console.warn(`Method 2 (Lenient) failed for ${fileName}:`, error.message);
  }
  
  // Method 3: pdf-parse with minimal options (first page only)
  try {
    const result = await pdfParse(buffer, {
      max: 1, // Only first page
      normalizeWhitespace: true
    });
    if (result.text && result.text.trim().length > 0) {
      console.log(`Method 3 (First page): Successfully extracted ${result.text.length} characters`);
      return result.text.trim();
    }
  } catch(error) {
    console.warn(`Method 3 (First page) failed for ${fileName}:`, error.message);
  }
  
  // Method 4: Try to extract raw text from PDF binary
  try {
    const bufferString = buffer.toString('binary');
    
    // Look for text streams in PDF
    const textPatterns = [
      /\(([^)]+)\)\s*Tj/g,  // Text showing operators
      /\[([^\]]+)\]\s*TJ/g,  // Text arrays
      /BT\s+(.*?)\s+ET/gs    // Text blocks
    ];
    
    let extractedText = '';
    
    for (const pattern of textPatterns) {
      const matches = [...bufferString.matchAll(pattern)];
      matches.forEach(match => {
        let text = match[1] || match[0];
        // Clean up the extracted text
        text = text.replace(/[()[\]]/g, ' ')
                  .replace(/\\[rnt]/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();
        
        if (text.length > 2 && /[a-zA-Z]/.test(text)) {
          extractedText += text + ' ';
        }
      });
    }
    
    if (extractedText.trim().length > 10) {
      console.log(`Method 4 (Binary): Successfully extracted ${extractedText.length} characters`);
      return extractedText.trim();
    }
  } catch(error) {
    console.warn(`Method 4 (Binary) failed for ${fileName}:`, error.message);
  }
  
  // Method 5: Try to find any readable ASCII text in the buffer
  try {
    const bufferString = buffer.toString('ascii');
    const readableText = bufferString.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
                                   .replace(/\s+/g, ' ')
                                   .trim();
    
    // Look for words (sequences of letters)
    const words = readableText.match(/[a-zA-Z]{3,}/g);
    if (words && words.length > 5) {
      const reconstructedText = words.join(' ');
      if (reconstructedText.length > 20) {
        console.log(`Method 5 (ASCII): Successfully extracted ${reconstructedText.length} characters`);
        return reconstructedText;
      }
    }
  } catch(error) {
    console.warn(`Method 5 (ASCII) failed for ${fileName}:`, error.message);
  }
  
  console.error(`All PDF extraction methods failed for ${fileName}`);
  return '';
}

async function test() {
  const filePath = path.join(__dirname, '..', 'test-saanvi.pdf');
  const buffer = fs.readFileSync(filePath);
  const text = await safeExtractPdf(buffer, 'test-saanvi.pdf');
  if (text) {
    console.log('Final Text Length:', text.length);
    console.log('Final Text Preview:', text.substring(0, 300));
  } else {
    console.log('Extraction completely failed!');
  }
}

test();
