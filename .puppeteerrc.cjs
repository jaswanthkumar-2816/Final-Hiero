const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
    // Keep the browser inside the project so a Render build persists it.
    cacheDirectory: join(__dirname, '.cache', 'puppeteer'),

    // skipDownload was true, so `npm install` never fetched Chrome. Locally
    // that was invisible — macOS falls back to /Applications/Google Chrome —
    // but on a Linux container there is no Chrome at all, puppeteer.launch
    // failed, and resume rendering silently fell back to PDFKit. That produced
    // a generic 2.4KB PDF with none of the HTML templates, which is why
    // templates looked right locally and wrong on the server.
    // Set PUPPETEER_SKIP_DOWNLOAD=true to opt out (e.g. a machine that already
    // has Chrome and does not want the extra download).
    skipDownload: process.env.PUPPETEER_SKIP_DOWNLOAD === 'true',
};
