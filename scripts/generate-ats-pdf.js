#!/usr/bin/env node
/**
 * Generates ATS-friendly (single-column, plain text) EN and ES CV PDFs.
 * Run: npm run build:pdf:ats
 *
 * Content is built from i18n/{en,es}.json via scripts/ats-template.js, so update
 * the JSON (not this file) when your experience changes.
 * First-time setup (if launch fails): npx playwright install chromium
 */
const { chromium } = require('@playwright/test');
const path = require('path');
const { buildAtsHtml } = require('./ats-template');

const EXPORTS = ['en', 'es'].map((lang) => ({
  lang,
  outputPath: path.resolve(__dirname, '..', 'assets', `joaquin-noguera-cv-ats-${lang}.pdf`),
}));

async function main() {
  const browser = await chromium.launch();
  try {
    for (const { lang, outputPath } of EXPORTS) {
      const page = await browser.newPage();
      await page.setContent(buildAtsHtml(lang), { waitUntil: 'load' });
      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
      });
      console.log(`✅ ATS PDF generated (${lang}): ${outputPath}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('❌ ATS PDF generation failed:', err.message);
  process.exit(1);
});
