const puppeteer = require('puppeteer');
const path = require('path');

async function extractWithPuppeteer(fileName) {
    const filePath = path.join(__dirname, '..', fileName);
    const fileUrl = `file://${filePath}`;
    console.log('Navigating Puppeteer to:', fileUrl);

    let browser;
    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(fileUrl, { waitUntil: 'load' });
        
        // Wait a bit for PDF rendering if any
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Attempt to extract text from page
        const text = await page.evaluate(() => {
            return document.body.innerText;
        });

        console.log(`Successfully extracted ${text.length} characters.`);
        console.log('Text preview:', text.substring(0, 300));
    } catch (err) {
        console.error('Puppeteer extraction failed:', err);
    } finally {
        if (browser) await browser.close();
    }
}

extractWithPuppeteer('test-debug.pdf');
