#!/usr/bin/env node
/**
 * Exports LinkedIn profile banners (1584 × 396 px) as PNG via Playwright.
 * Run from project root: npm run build:banner
 *
 * Optional: BANNER_LANG=es for Spanish text on the canvas (default: en).
 * First-time setup (if launch fails): npx playwright install chromium
 *
 * After regenerating, bump BANNER_CACHE_BUST in js/banner.js so download
 * links avoid stale browser cache.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3100;
const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const BANNER_LANG = process.env.BANNER_LANG === 'es' ? 'es' : 'en';
const BANNER_W = 1584;
const BANNER_H = 396;

const OUTPUTS = [
  { theme: 'dark', file: 'linkedin-banner.png' },
  { theme: 'light', file: 'linkedin-banner-light.png' },
];

function bannerUrl(theme) {
  const u = new URL(`http://127.0.0.1:${PORT}/banner.html`);
  u.searchParams.set('lang', BANNER_LANG);
  u.searchParams.set('theme', theme);
  u.searchParams.set('export', '1');
  return u.toString();
}

/** First IHDR chunk starts at byte 16 after 8-byte PNG signature + length + type. */
function readPngSize(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.length < 28) {
    return null;
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

async function main() {
  const server = spawn('npx', ['serve', '.', '-l', String(PORT), '--no-clipboard'], {
    cwd: ROOT,
    stdio: 'ignore',
    shell: true,
  });

  await new Promise((resolve) => setTimeout(resolve, 3000));

  try {
    const browser = await chromium.launch();

    for (const { theme, file } of OUTPUTS) {
      /* Fresh storage + prefers-color-scheme per export so dark PNG is never polluted by light OS theme */
      const context = await browser.newContext({
        colorScheme: theme === 'dark' ? 'dark' : 'light',
        /* Match export width so the banner is not centered with empty side margins (clip was clamped to ~1424px). */
        viewport: { width: BANNER_W, height: 900 },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      await page.goto(bannerUrl(theme), { waitUntil: 'networkidle', timeout: 60_000 });
      await page.waitForFunction(
        () => !document.documentElement.hasAttribute('data-i18n-pending'),
        { timeout: 15_000 },
      );
      await page.evaluate(() => document.fonts.ready);

      /* Guarantee theme on <html> after JS init (URL/localStorage races broke dark exports). */
      await page.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t);
        try {
          localStorage.setItem('jcv-theme', t);
        } catch (_err) {
          /* ignore */
        }
      }, theme);
      await page.waitForFunction(
        (t) => document.documentElement.getAttribute('data-theme') === t,
        theme,
        { timeout: 5000 },
      );

      await page.evaluate(
        () => new Promise((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        }),
      );
      await page.evaluate(() => {
        window.dispatchEvent(new Event('resize'));
      });
      await page.waitForTimeout(400);

      /*
       * Pixel-perfect PNG: viewport screenshot must be exactly BANNER_W×BANNER_H.
       * Do NOT rely on html.banner-export alone — if ?export=1 is dropped (redirect) those rules never
       * run and the top 396px is the studio copy (what you saw). Hide everything except #linkedin-banner.
       */
      await page.evaluate(() => {
        document.documentElement.classList.add('banner-export');
      });
      const exportBg = theme === 'dark' ? '#010409' : '#f8fafc';
      await page.addStyleTag({
        content: `
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: ${BANNER_W}px !important;
            height: ${BANNER_H}px !important;
            overflow: hidden !important;
            background: ${exportBg} !important;
          }
          body * {
            visibility: hidden !important;
          }
          #linkedin-banner,
          #linkedin-banner * {
            visibility: visible !important;
          }
          #linkedin-banner {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: ${BANNER_W}px !important;
            height: ${BANNER_H}px !important;
            min-width: ${BANNER_W}px !important;
            max-width: none !important;
            margin: 0 !important;
            border: none !important;
            box-sizing: border-box !important;
            z-index: 2147483646 !important;
          }
          #banner-particle-canvas.banner-particle-canvas {
            left: 0 !important;
            top: 0 !important;
            width: ${BANNER_W}px !important;
            height: ${BANNER_H}px !important;
            max-width: none !important;
          }
        `,
      });

      await page.setViewportSize({ width: BANNER_W, height: BANNER_H });
      await page.evaluate(() => {
        window.dispatchEvent(new Event('resize'));
        if (typeof window.__jcvBannerParticleResize === 'function') {
          window.__jcvBannerParticleResize();
        }
      });
      await page.waitForTimeout(200);
      await page.evaluate(() => {
        if (typeof window.__jcvBannerParticleResize === 'function') {
          window.__jcvBannerParticleResize();
        }
      });
      await page.waitForTimeout(250);
      await page.evaluate(
        () => new Promise((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        }),
      );

      const outPath = path.join(ASSETS, file);
      await page.screenshot({ path: outPath, type: 'png' });

      const dim = readPngSize(outPath);
      if (!dim || dim.width !== BANNER_W || dim.height !== BANNER_H) {
        throw new Error(
          `${file}: PNG is ${dim ? `${dim.width}×${dim.height}` : 'unreadable'}; require ${BANNER_W}×${BANNER_H}`,
        );
      }
      await context.close();
      console.log(`✅ ${file} (${theme}, lang=${BANNER_LANG})`);
    }

    await browser.close();
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error('❌ Banner export failed:', err.message);
  process.exit(1);
});
