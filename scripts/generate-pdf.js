#!/usr/bin/env node
/**
 * Generates EN and ES PDFs of the CV page using Playwright.
 * Run: npm run build:pdf
 *
 * First-time setup (if launch fails): npx playwright install chromium
 *
 * After publishing a new PDF, bump `PDF_CACHE_BUST` in js/cv.js so the
 * download button does not serve a stale file from the browser cache.
 */

const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const PORT = 3099;
/* Force language + light theme so exports are deterministic regardless of localStorage. */
const EXPORTS = [
  {
    lang: 'en',
    outputPath: path.resolve(__dirname, '..', 'assets', 'joaquin-noguera-cv-en.pdf'),
  },
  {
    lang: 'es',
    outputPath: path.resolve(__dirname, '..', 'assets', 'joaquin-noguera-cv-es.pdf'),
  },
];
async function main() {
  /* Start a temporary local server (shell: true helps Windows find npx) */
  const server = spawn('npx', ['serve', '.', '-l', String(PORT), '--no-clipboard'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'ignore',
    shell: true,
  });

  /* Wait for server to be ready */
  await new Promise((resolve) => setTimeout(resolve, 3000));

  try {
    const browser = await chromium.launch();

    for (const { lang, outputPath } of EXPORTS) {
      const context = await browser.newContext({ colorScheme: 'light' });
      await context.addInitScript((forcedLang) => {
        try {
          localStorage.setItem('jcv-lang', forcedLang);
        } catch (_err) {
          /* ignore */
        }
      }, lang);
      const page = await context.newPage();
      const cvUrl = `http://127.0.0.1:${PORT}/cv.html?lang=${lang}`;

      await page.goto(cvUrl, { waitUntil: 'networkidle', timeout: 60_000 });
      await page.waitForFunction(
        () => !document.documentElement.hasAttribute('data-i18n-pending'),
        { timeout: 15_000 },
      );
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'light');
      });

      /* Hide chrome only — spacing comes from css/print.css (@page + body padding).
         Do not set PDF margins here: doubling Playwright margins + CSS caused a blank first page. */
      await page.addStyleTag({
        content: `
          .nav, .footer, .cv__actions, .badge, .badge__dot { display: none !important; }
          .animate-on-scroll { opacity: 1 !important; transform: none !important; }
        `,
      });

      await page.pdf({
        path: outputPath,
        format: 'A4',
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        printBackground: true,
      });

      console.log(`✅ PDF generated (${lang}): ${outputPath}`);
      await context.close();
    }

    await browser.close();
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error('❌ PDF generation failed:', err.message);
  process.exit(1);
});
