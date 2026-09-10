const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const dataUrl = 'data:image/png;base64,' + fs.readFileSync('logo-hiero.png').toString('base64');
    
    await page.setContent('<html><body style="margin:0;"><canvas id="c"></canvas></body></html>');
    
    const croppedBase64 = await page.evaluate(async (url) => {
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = url; });
      
      const c = document.getElementById('c');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      const id = ctx.getImageData(0, 0, img.width, img.height);
      let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
      
      // Top 52% contains the glowing lotus emblem
      for (let y = 0; y < img.height * 0.52; y++) {
        for (let x = 0; x < img.width; x++) {
          const idx = (y * img.width + x) * 4;
          const r = id.data[idx];
          const g = id.data[idx + 1];
          const b = id.data[idx + 2];
          if (g > 40 && g > r * 1.15) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      
      const pad = 20;
      const cropX = Math.max(0, minX - pad);
      const cropY = Math.max(0, minY - pad);
      const cropW = Math.min(img.width - cropX, (maxX - minX) + pad * 2);
      const cropH = Math.min(img.height - cropY, (maxY - minY) + pad * 2);
      
      const outCanvas = document.createElement('canvas');
      outCanvas.width = cropW;
      outCanvas.height = cropH;
      const outCtx = outCanvas.getContext('2d');
      
      outCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      return outCanvas.toDataURL('image/png');
    }, dataUrl);
    
    const base64Data = croppedBase64.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync('hiero-logo-icon.png', Buffer.from(base64Data, 'base64'));
    console.log('HIERO_LOGO_CROPPED_OK');
    await browser.close();
  } catch (err) {
    console.error('ERROR:', err);
  }
})();
