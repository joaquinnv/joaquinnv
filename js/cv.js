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
const PDF_FILENAME_BY_LANG = {
  en: 'Joaquin-Noguera-CV-EN.pdf',
  es: 'Joaquin-Noguera-CV-ES.pdf',
};
const PDF_PATH_BY_LANG = {
  en: 'assets/joaquin-noguera-cv-en.pdf',
  es: 'assets/joaquin-noguera-cv-es.pdf',
};
/** Bust browser/CDN cache when the pre-built PDF is regenerated (`npm run build:pdf`). */
const PDF_CACHE_BUST = '20260326a';

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
      const lang = document.documentElement.lang === 'es' ? 'es' : 'en';
      const pdfPath = PDF_PATH_BY_LANG[lang];
      const pdfFilename = PDF_FILENAME_BY_LANG[lang];
      const link = document.createElement('a');
      link.href = `${pdfPath}?v=${PDF_CACHE_BUST}`;
      link.download = pdfFilename;
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
