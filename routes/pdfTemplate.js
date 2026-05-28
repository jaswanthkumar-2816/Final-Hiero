const puppeteer = require('puppeteer');
const fs = require('fs');
const { generateWordHTML } = require('./wordTemplates');
let sharedBrowserPromise = null;

async function getSharedBrowser() {
    if (!sharedBrowserPromise) {
        const launchOptions = {
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process'
            ]
        };

        const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        if (process.platform === 'darwin' && fs.existsSync(macChrome)) {
            launchOptions.executablePath = macChrome;
        } else if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        }

        sharedBrowserPromise = puppeteer.launch(launchOptions).catch((err) => {
            sharedBrowserPromise = null;
            throw err;
        });
    }
    return sharedBrowserPromise;
}

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
    const browser = await getSharedBrowser();
    const page = await browser.newPage();

    try {
        // Emulate screen media to ensure colors, backgrounds and margins render accurately
        await page.emulateMediaType('screen');
        
        // `domcontentloaded` is much faster than `networkidle0` for local inline HTML templates.
        await page.setContent(html, { waitUntil: 'domcontentloaded' });
        
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

        await page.close();
        return pdfBuffer;
    } catch (error) {
        await page.close().catch(() => {});
        throw error;
    }
}

// Single source of truth HTML generator for both PDF and DOCX
function generateResumeHtmlForOutput(data, templateId) {
    return generateWordHTML(data, templateId);
}

module.exports = {
    generatePuppeteerPDF,
    generateResumeHtmlForOutput
};
