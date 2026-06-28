const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: "new"
    });
    const page = await browser.newPage();
    
    // Test the project.html directly as if we navigated
    const nameStr = 'Develop a Retrieval-Augmented Generation (RAG) system for a question-answering chatbot';
    const testUrl = 'http://localhost:2816/project.html?name=' + encodeURIComponent(nameStr);
    
    console.log("Navigating to:", testUrl);
    await page.goto(testUrl, { waitUntil: 'networkidle2' });
    
    const title = await page.title();
    console.log("Page Title:", title);
    
    const heroH1 = await page.$eval('#hero-h1', el => el.textContent).catch(() => 'NOT_FOUND');
    console.log("Hero H1:", heroH1);
    
    await page.screenshot({ path: 'scratch/project-test-screenshot.png' });
    console.log("Saved screenshot to scratch/project-test-screenshot.png");
    
    await browser.close();
  } catch (err) {
    console.error("Puppeteer test failed:", err);
    process.exit(1);
  }
})();
