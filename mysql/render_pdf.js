// Usage: node render_pdf.js <input.html> <output.pdf>
const { chromium } = require('playwright');
const { pathToFileURL } = require('url');

(async () => {
  const [, , input, output] = process.argv;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(pathToFileURL(input).href);
  await page.pdf({
    path: output, format: 'A4', printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: "<div style='font-size:8px;width:100%;text-align:center;color:#888'>" +
      "MySQL Interview Book &middot; page <span class='pageNumber'></span> / <span class='totalPages'></span></div>",
    margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
  });
  await browser.close();
})();
