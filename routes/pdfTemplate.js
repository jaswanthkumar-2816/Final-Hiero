const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { generateWordHTML } = require('./wordTemplates');

let sharedBrowserPromise = null;

async function getSharedBrowser() {
    if (!sharedBrowserPromise) {
        const launchOptions = {
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--single-process'
            ]
        };

        let resolvedPath = null;

        // 1. Check Darwin (Mac) Chrome local development path
        const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        if (process.platform === 'darwin' && fs.existsSync(macChrome)) {
            resolvedPath = macChrome;
        }

        // 2. Check build-time resolved chromium path file
        if (!resolvedPath && fs.existsSync('.chromium_path')) {
            try {
                const p = fs.readFileSync('.chromium_path', 'utf8').trim();
                if (p && fs.existsSync(p)) {
                    resolvedPath = p;
                }
            } catch (e) {}
        }
        
        if (!resolvedPath && fs.existsSync(path.join(__dirname, '..', '.chromium_path'))) {
            try {
                const p = fs.readFileSync(path.join(__dirname, '..', '.chromium_path'), 'utf8').trim();
                if (p && fs.existsSync(p)) {
                    resolvedPath = p;
                }
            } catch (e) {}
        }

        // 3. Check environment variable PUPPETEER_EXECUTABLE_PATH
        if (!resolvedPath && process.env.PUPPETEER_EXECUTABLE_PATH) {
            let p = process.env.PUPPETEER_EXECUTABLE_PATH;
            if (!p.startsWith('/') && !p.startsWith('.')) {
                resolvedPath = p; // Simple binary name (e.g. 'chromium') - use directly so Puppeteer resolves from PATH
            } else if (fs.existsSync(p)) {
                resolvedPath = p;
            }
        }

        // 4. Linux standard locations fallback
        if (!resolvedPath) {
            const linuxFallbacks = [
                '/usr/bin/chromium-browser',
                '/usr/bin/chromium',
                '/usr/bin/google-chrome',
                '/usr/bin/chrome',
                'chromium-browser',
                'chromium'
            ];
            for (const p of linuxFallbacks) {
                if (p.startsWith('/') || p.startsWith('.')) {
                    if (fs.existsSync(p)) {
                        resolvedPath = p;
                        break;
                    }
                } else {
                    // Use simple binary name directly so Puppeteer can find it in PATH
                    resolvedPath = p;
                    break;
                }
            }
        }

        if (resolvedPath) {
            launchOptions.executablePath = resolvedPath;
            console.log('Puppeteer launching with executablePath:', resolvedPath);
        } else {
            console.warn('Puppeteer launch could not find Chrome/Chromium; relying on default puppeteer search path');
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
        
        // Use 'domcontentloaded' instead of 'networkidle0':
        // networkidle0 waits for ALL network requests to complete — this times out when
        // Google Fonts or other external resources fail/are slow. domcontentloaded fires
        // as soon as the DOM is parsed, which is sufficient for inline/embedded styles.
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Give fonts an extra 1s to load after DOM is ready (avoids unstyled text)
        await new Promise(r => setTimeout(r, 1000));
        
        // Ensure web fonts are completely loaded and active before generating PDF
        await page.evaluateHandle('document.fonts.ready');
        
        // Print to PDF with exact A4 dimensions and background colors enabled
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            timeout: 30000,
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
