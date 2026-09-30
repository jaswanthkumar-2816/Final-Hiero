const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

let tesseractWorker = null;
async function getTesseract() {
    if (!tesseractWorker) {
        const { createWorker } = require('tesseract.js');
        tesseractWorker = await createWorker('eng');
    }
    return tesseractWorker;
}

/**
 * Normalizes raw text from different parsers to preserve section structure and bullet points.
 */
function normalizeExtractedText(rawText) {
    if (!rawText || typeof rawText !== 'string') return '';

    return rawText
        // Normalize actual bullet points only (exclude en-dash \u2013 and em-dash \u2014)
        .replace(/[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25CF]/g, '\n• ')
        // Normalize multiple carriage returns & line feeds
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // Clean excessive spaces while preserving indentation
        .replace(/[ \t]+/g, ' ')
        // Normalize excessive consecutive blank lines to double newline
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/**
 * Extracts text from PDF files. If digital text is missing or sparse (<100 chars),
 * attempts OCR fallback if feasible.
 */
async function extractFromPdf(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    
    // Custom pager to preserve vertical flow
    const renderOptions = {
        pagerender: function(pageData) {
            return pageData.getTextContent().then(function(textContent) {
                let lastY = null;
                let text = '';
                for (let item of textContent.items) {
                    if (lastY == null || Math.abs(item.transform[5] - lastY) > 5) {
                        text += '\n' + item.str;
                    } else {
                        text += ' ' + item.str;
                    }
                    lastY = item.transform[5];
                }
                return text;
            });
        }
    };

    let text = '';
    try {
        const parsed = await pdfParse(dataBuffer, renderOptions);
        text = parsed.text || '';
    } catch (parseErr) {
        // Fallback to basic pdfParse without custom renderer
        const fallback = await pdfParse(dataBuffer);
        text = fallback.text || '';
    }

    // Check if the PDF is scanned or image-based (very little digital text)
    if (text.trim().length < 120) {
        console.warn(`[DocumentParser] Low text density in PDF (${text.trim().length} chars). Checking for OCR fallback...`);
        // If image conversion tool is present or basic OCR is needed
        // For now return whatever text was found; if completely empty, throw informative error
        if (text.trim().length < 10) {
            throw new Error('The PDF appears to be a scanned image without selectable text. Please upload a clear text PDF or image format (PNG/JPG).');
        }
    }

    return normalizeExtractedText(text);
}

/**
 * Extracts text from DOCX files using mammoth AST.
 */
async function extractFromDocx(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return normalizeExtractedText(result.value || '');
}

/**
 * Extracts text from image files (PNG, JPG, WEBP) using Tesseract OCR.
 */
async function extractFromImage(filePath) {
    try {
        const worker = await getTesseract();
        const { data: { text } } = await worker.recognize(filePath);
        return normalizeExtractedText(text || '');
    } catch (err) {
        throw new Error(`OCR processing failed: ${err.message}`);
    }
}

/**
 * Master parser detecting file type and routing to appropriate parser.
 */
async function parseDocument(filePath, originalFilename = '') {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found at path: ${filePath}`);
    }

    const ext = path.extname(originalFilename || filePath).toLowerCase();

    let rawText = '';
    switch (ext) {
        case '.pdf':
            rawText = await extractFromPdf(filePath);
            break;
        case '.docx':
        case '.doc':
            rawText = await extractFromDocx(filePath);
            break;
        case '.png':
        case '.jpg':
        case '.jpeg':
        case '.webp':
            rawText = await extractFromImage(filePath);
            break;
        case '.txt':
        case '.text':
        case '.md':
            rawText = fs.readFileSync(filePath, 'utf-8');
            rawText = normalizeExtractedText(rawText);
            break;
        default:
            // Attempt PDF first, then DOCX, then UTF-8 read
            try {
                rawText = await extractFromPdf(filePath);
            } catch {
                try {
                    rawText = await extractFromDocx(filePath);
                } catch {
                    rawText = fs.readFileSync(filePath, 'utf-8');
                }
            }
            rawText = normalizeExtractedText(rawText);
    }

    if (!rawText || rawText.trim().length < 15) {
        throw new Error('Extracted text is empty or too short. Please verify the resume document is readable.');
    }

    return {
        text: rawText,
        charCount: rawText.length,
        wordCount: rawText.split(/\s+/).filter(Boolean).length,
        detectedExtension: ext
    };
}

module.exports = {
    parseDocument,
    extractFromPdf,
    extractFromDocx,
    extractFromImage,
    normalizeExtractedText
};
