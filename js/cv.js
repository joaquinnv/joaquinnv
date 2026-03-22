/**
 * CV Page Entry Point — Initializes modules for cv.html
 * Print/download buttons, mobile nav, theme, i18n, animations.
 * @module cv
 */

import { initTheme } from './theme.js';
import { initI18n } from './i18n.js';
import { initAnimations } from './animations.js';
import { initCurrentPageNavLink, initMobileNav, updateCopyrightYear } from './utils.js';
import { renderSiteNav } from './site-nav.js';

/* ── Constants ── */
const PDF_FILENAME = 'Joaquin-Noguera-CV.pdf';
const PDF_PATH = 'assets/joaquin-noguera-cv.pdf';
/** Bust browser/CDN cache when the pre-built PDF is regenerated (`npm run build:pdf`). */
const PDF_CACHE_BUST = '20260322e';

/** Handles print button — opens the browser print dialog. */
function initPrintButton() {
  const printBtn = document.getElementById('print-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  }
}

/**
 * Handles download button — triggers download of the pre-generated PDF.
 * Creates a temporary link element to initiate the download.
 */
function initDownloadButton() {
  const downloadBtn = document.getElementById('download-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const link = document.createElement('a');
      link.href = `${PDF_PATH}?v=${PDF_CACHE_BUST}`;
      link.download = PDF_FILENAME;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
}

/** Initializes all CV page modules and features. */
async function init() {
  renderSiteNav('cv');
  initTheme();
  await initI18n();
  initAnimations();
  initMobileNav();
  initCurrentPageNavLink();
  initPrintButton();
  initDownloadButton();
  updateCopyrightYear();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
