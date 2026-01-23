const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

// Import the improved PDF parsing function
async function safeExtractPdf(buffer, fileName = 'unknown'){
  console.log(`Attempting to parse PDF: ${fileName}, size: ${buffer.length} bytes`);
  
  // Method 1: Standard pdf-parse with default options
  try {
    const result = await pdfParse(buffer);
    if (result.text && result.text.trim().length > 0) {
      console.log(`Successfully extracted ${result.text.length} characters using standard pdf-parse`);
      return result.text.trim();
    }
  } catch(error) {
    console.warn(`Standard pdf-parse failed for ${fileName}:`, error.message);
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
      console.log(`Successfully extracted ${result.text.length} characters using lenient pdf-parse`);
      return result.text.trim();
    }
  } catch(error) {
    console.warn(`Lenient pdf-parse failed for ${fileName}:`, error.message);
  }
  
  // Method 3: pdf-parse with minimal options (first page only)
  try {
    const result = await pdfParse(buffer, {
      max: 1, // Only first page
      normalizeWhitespace: true
    });
    if (result.text && result.text.trim().length > 0) {
      console.log(`Successfully extracted ${result.text.length} characters from first page only`);
      return result.text.trim();
    }
  } catch(error) {
    console.warn(`First page pdf-parse failed for ${fileName}:`, error.message);
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
      console.log(`Successfully extracted ${extractedText.length} characters using binary extraction`);
      return extractedText.trim();
    }
  } catch(error) {
    console.warn(`Binary extraction failed for ${fileName}:`, error.message);
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
        console.log(`Successfully extracted ${reconstructedText.length} characters using ASCII extraction`);
        return reconstructedText;
      }
    }
  } catch(error) {
    console.warn(`ASCII extraction failed for ${fileName}:`, error.message);
  }
  
  console.error(`All PDF extraction methods failed for ${fileName}`);
  return '';
}

// Test function
async function testPdfParsing() {
  const uploadsDir = path.join(__dirname, 'uploads');
  
  try {
    const files = fs.readdirSync(uploadsDir);
    const pdfFiles = files.filter(file => file.endsWith('.pdf')).slice(0, 3); // Test first 3 PDF files
    
    if (pdfFiles.length === 0) {
      console.log('No PDF files found in uploads directory');
      return;
    }
    
    console.log(`Testing PDF parsing on ${pdfFiles.length} files...\n`);
    
    for (const file of pdfFiles) {
      const filePath = path.join(uploadsDir, file);
      console.log(`\n=== Testing file: ${file} ===`);
      
      try {
        const buffer = fs.readFileSync(filePath);
        const extractedText = await safeExtractPdf(buffer, file);
        
        if (extractedText.length > 0) {
          console.log(`✅ Success! Extracted ${extractedText.length} characters`);
          console.log(`Preview: ${extractedText.substring(0, 200)}...`);
        } else {
          console.log(`❌ Failed to extract any text from ${file}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error reading uploads directory:', error.message);
  }
}

// Run the test
testPdfParsing();
