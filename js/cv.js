/**
 * CV Page Entry Point — Initializes modules for cv.html
 * Print/download buttons, mobile nav, theme, i18n, animations.
 * @module cv
 */

import { initTheme } from './theme.js';
import { initI18n } from './i18n.js';
import { initAnimations } from './animations.js';
import { initMobileNav, updateCopyrightYear } from './utils.js';

/* ── Constants ── */
const PDF_FILENAME = 'Joaquin-Noguera-CV.pdf';
const PDF_PATH = 'assets/joaquin-noguera-cv.pdf';

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
      link.href = PDF_PATH;
      link.download = PDF_FILENAME;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
}

/** Prevents redundant navigation for the current-page nav item. */
function initCurrentPageNavLink() {
  const currentCvLink = document.querySelector('[data-nav-current]');
  if (currentCvLink) {
    currentCvLink.addEventListener('click', (event) => {
      event.preventDefault();
    });
  }
}

/** Initializes all CV page modules and features. */
async function init() {
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
