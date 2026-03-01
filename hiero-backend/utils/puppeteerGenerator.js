import puppeteer from 'puppeteer';
import logger from 'winston';

/**
 * Generates a PDF from HTML content using Puppeteer.
 * @param {string} html - The full HTML content to render.
 * @param {string} outputPath - Where to save the PDF.
 * @returns {Promise<void>}
 */
export async function generatePuppeteerPDF(html, outputPath) {
    let browser;
    try {
        logger.info(`🚀 Starting Puppeteer for output: ${outputPath}`);

        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();

        // Set viewport to A4 size
        await page.setViewport({
            width: 794, // ~210mm at 96dpi
            height: 1123, // ~297mm at 96dpi
            deviceScaleFactor: 2 // Higher resolution
        });

        // Set content and wait for fonts/images
        await page.setContent(html, {
            waitUntil: ['networkidle0', 'load', 'domcontentloaded']
        });

        // Add some extra time for Google Fonts to definitely load
        await new Promise(resolve => setTimeout(resolve, 500));

        await page.pdf({
            path: outputPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            },
            preferCSSPageSize: true
        });

        logger.info(`✅ Puppeteer PDF generated at ${outputPath}`);
    } catch (error) {
        logger.error('❌ Puppeteer PDF Generation Error:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
