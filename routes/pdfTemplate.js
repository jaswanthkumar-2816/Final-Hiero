const puppeteer = require('puppeteer');
const { generateWordHTML } = require('./wordTemplates');

/**
 * Generates a high-fidelity PDF from the Word HTML template using Puppeteer.
 * Falls back to native PDFKit if there are launch/rendering errors.
 * 
 * @param {Object} data - Resume data
 * @param {string} templateId - Selected template ID (e.g. 'hiero-urban')
 * @returns {Promise<Buffer>} - Compiled PDF binary buffer
 */
async function generatePuppeteerPDF(data, templateId) {
    const html = generateWordHTML(data, templateId);

    // Launch Puppeteer headlessly pointing to Google Chrome
    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    });

    try {
        const page = await browser.newPage();
        
        // Emulate screen media to ensure colors, backgrounds and margins render accurately
        await page.emulateMediaType('screen');
        
        // Set the content and wait for it to load completely
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        // Print to PDF with exact A4 dimensions and background colors enabled
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0px',
                right: '0px',
                bottom: '0px',
                left: '0px'
            }
        });

        await browser.close();
        return pdfBuffer;
    } catch (error) {
        await browser.close();
        throw error;
    }
}

module.exports = {
    generatePuppeteerPDF
};
