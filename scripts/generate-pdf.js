#!/usr/bin/env node
/**
 * Generates a PDF of the CV page using Playwright.
 * Run: node scripts/generate-pdf.js
 */

const { chromium } = require('playwright');
const { execSync, spawn } = require('child_process');
const path = require('path');

const PORT = 3099;
const CV_URL = `http://localhost:${PORT}/cv.html`;
const OUTPUT_PATH = path.resolve(__dirname, '..', 'assets', 'joaquin-noguera-cv.pdf');

async function main() {
  /* Start a temporary local server */
  const server = spawn('npx', ['serve', '.', '-l', String(PORT), '--no-clipboard'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'ignore',
  });

  /* Wait for server to be ready */
  await new Promise((resolve) => setTimeout(resolve, 3000));

  try {
    const browser = await chromium.launch();
    const context = await browser.newContext({ colorScheme: 'light' });
    const page = await context.newPage();

    await page.goto(CV_URL, { waitUntil: 'networkidle' });

    /* Hide nav, footer, action buttons for PDF and set proper page margins */
    await page.addStyleTag({
      content: `
        @page { size: A4; margin: 12mm 15mm !important; }
        .nav, .footer, .cv__actions, .badge, .badge__dot { display: none !important; }
        .animate-on-scroll { opacity: 1 !important; transform: none !important; }
        body { padding: 0 !important; margin: 0 !important; }
      `,
    });

    await page.pdf({
      path: OUTPUT_PATH,
      format: 'A4',
      margin: { top: '12mm', right: '15mm', bottom: '12mm', left: '15mm' },
      printBackground: true,
    });

    console.log(`✅ PDF generated: ${OUTPUT_PATH}`);
    await browser.close();
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error('❌ PDF generation failed:', err.message);
  process.exit(1);
});
