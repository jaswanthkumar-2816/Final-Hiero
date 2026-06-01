const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { generateWordHTML } = require('./wordTemplates');

let sharedBrowserPromise = null;

async function getSharedBrowser() {
    if (sharedBrowserPromise) {
        try {
            const browser = await sharedBrowserPromise;
            if (!browser.isConnected()) {
                console.warn('⚠️ Shared browser is disconnected. Resetting cache.');
                sharedBrowserPromise = null;
            }
        } catch (e) {
            sharedBrowserPromise = null;
        }
    }

    if (!sharedBrowserPromise) {
        const launchOptions = {
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process'
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
                '/usr/bin/chrome'
            ];
            for (const p of linuxFallbacks) {
                if (fs.existsSync(p)) {
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

// Helper to launch a fresh, dedicated one-off browser instance for robust crash recovery
async function launchFreshBrowser() {
    const launchOptions = {
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    };

    let resolvedPath = null;

    const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    if (process.platform === 'darwin' && fs.existsSync(macChrome)) {
        resolvedPath = macChrome;
    }

    if (!resolvedPath && fs.existsSync('.chromium_path')) {
        try {
            const p = fs.readFileSync('.chromium_path', 'utf8').trim();
            if (p && fs.existsSync(p)) resolvedPath = p;
        } catch (e) {}
    }
    
    if (!resolvedPath && fs.existsSync(path.join(__dirname, '..', '.chromium_path'))) {
        try {
            const p = fs.readFileSync(path.join(__dirname, '..', '.chromium_path'), 'utf8').trim();
            if (p && fs.existsSync(p)) resolvedPath = p;
        } catch (e) {}
    }

    if (!resolvedPath && process.env.PUPPETEER_EXECUTABLE_PATH) {
        let p = process.env.PUPPETEER_EXECUTABLE_PATH;
        if (!p.startsWith('/') && !p.startsWith('.')) resolvedPath = p;
        else if (fs.existsSync(p)) resolvedPath = p;
    }

    if (!resolvedPath) {
        const linuxFallbacks = ['/usr/bin/chromium-browser', '/usr/bin/chromium', '/usr/bin/google-chrome', '/usr/bin/chrome'];
        for (const p of linuxFallbacks) {
            if (fs.existsSync(p)) { resolvedPath = p; break; }
        }
    }

    if (resolvedPath) {
        launchOptions.executablePath = resolvedPath;
    }

    return puppeteer.launch(launchOptions);
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
    let browser;
    let page;
    let isDedicatedBrowser = false;

    try {
        browser = await getSharedBrowser();
        page = await browser.newPage();
    } catch (launchErr) {
        console.warn('⚠️ Shared browser acquisition failed, launching dedicated recovery browser:', launchErr.message);
        sharedBrowserPromise = null; // Invalidate shared instance cache
        try {
            browser = await launchFreshBrowser();
            page = await browser.newPage();
            isDedicatedBrowser = true;
        } catch (dedicatedErr) {
            console.error('❌ Dedicated browser launch fallback also failed:', dedicatedErr.message);
            throw launchErr; // Throw original error to trigger PDFKit fallback
        }
    }

    try {
        await page.emulateMediaType('screen');
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await new Promise(r => setTimeout(r, 800));
        await page.evaluateHandle('document.fonts.ready');
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            timeout: 20000,
            margin: {
                top: '0px',
                right: '0px',
                bottom: '0px',
                left: '0px'
            }
        });

        await page.close().catch(() => {});
        if (isDedicatedBrowser) {
            await browser.close().catch(() => {});
        }
        return pdfBuffer;
    } catch (error) {
        console.error('⚠️ First-pass PDF generation failed (attempting dedicated browser recovery):', error.message);
        if (page) {
            await page.close().catch(() => {});
        }
        if (isDedicatedBrowser && browser) {
            await browser.close().catch(() => {});
        }

        // --- SECOND PASS DEDICATED FAILOVER ---
        if (!isDedicatedBrowser) {
            console.log('🔄 Attempting clean dedicated browser launch recovery path...');
            sharedBrowserPromise = null; // Invalidate shared instance
            
            let recoveryBrowser;
            let recoveryPage;
            try {
                recoveryBrowser = await launchFreshBrowser();
                recoveryPage = await recoveryBrowser.newPage();
                
                await recoveryPage.emulateMediaType('screen');
                await recoveryPage.setContent(html, { waitUntil: 'domcontentloaded', timeout: 25000 });
                await new Promise(r => setTimeout(r, 800));
                await recoveryPage.evaluateHandle('document.fonts.ready');
                
                const recoveredBuffer = await recoveryPage.pdf({
                    format: 'A4',
                    printBackground: true,
                    timeout: 25000,
                    margin: {
                        top: '0px',
                        right: '0px',
                        bottom: '0px',
                        left: '0px'
                    }
                });

                await recoveryPage.close().catch(() => {});
                await recoveryBrowser.close().catch(() => {});
                console.log('✅ Recovery successful. PDF generated using dedicated instance.');
                return recoveredBuffer;
            } catch (recoveryErr) {
                console.error('❌ Dedicated recovery browser failed:', recoveryErr.message);
                if (recoveryPage) await recoveryPage.close().catch(() => {});
                if (recoveryBrowser) await recoveryBrowser.close().catch(() => {});
                throw recoveryErr;
            }
        } else {
            throw error;
        }
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
