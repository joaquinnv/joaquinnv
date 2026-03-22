/**
 * LinkedIn banner studio — theme, i18n, document title, PNG download links.
 * @module banner
 */

import { initTheme } from './theme.js';
import { initI18n, onLangChange } from './i18n.js';
import { initBannerParticles } from './particles.js';
import { initCurrentPageNavLink, initMobileNav } from './utils.js';
import { renderSiteNav } from './site-nav.js';

const BANNER_CACHE_BUST = '20260322banner10';
const PNG_BY_THEME = {
  dark: {
    href: `assets/linkedin-banner.png?v=${BANNER_CACHE_BUST}`,
    download: 'joaquin-noguera-linkedin-banner-dark.png',
  },
  light: {
    href: `assets/linkedin-banner-light.png?v=${BANNER_CACHE_BUST}`,
    download: 'joaquin-noguera-linkedin-banner-light.png',
  },
};

function syncDocTitle() {
  const el = document.getElementById('banner-page-title-src');
  if (el && el.textContent) {
    document.title = el.textContent.trim();
  }
}

function initBannerDownloads() {
  document.querySelectorAll('[data-banner-download]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-banner-download');
      const spec = theme ? PNG_BY_THEME[theme] : null;
      if (!spec) {
        return;
      }
      const link = document.createElement('a');
      link.href = spec.href;
      link.download = spec.download;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  });
}

async function init() {
  renderSiteNav('banner');
  initTheme();
  await initI18n();
  onLangChange(() => {
    syncDocTitle();
  });
  syncDocTitle();
  initMobileNav();
  initCurrentPageNavLink();
  initBannerDownloads();
  initBannerParticles();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
