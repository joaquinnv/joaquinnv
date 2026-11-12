/**
 * Homepage Entry Point — Initializes all modules for index.html
 * Typing animation, mobile nav, smooth scroll.
 * @module home
 */

import { initTheme } from './theme.js';
import { initI18n, onLangChange, t } from './i18n.js';
import { initParticles } from './particles.js';
import { initAnimations } from './animations.js';
import { initMobileNav, updateCopyrightYear } from './utils.js';
import { renderSiteNav } from './site-nav.js';

/* ── Constants ── */
const TYPING_SPEED_MS = 80;
const TYPING_PAUSE_MS = 2000;
const TYPING_DELETE_SPEED_MS = 40;

/** Default (English) typing phrases — used as fallback before i18n loads */
const DEFAULT_PHRASES = [
  'Senior Backend Developer',
  'Building payment systems at scale',
  'NestJS • Node.js • PostgreSQL',
  'Exploring AI with LangChain',
];

/* ── Typing Animation ── */

/** @type {number|null} Active timeout ID so we can cancel mid-animation */
let typingTimeoutId = null;

/**
 * Cancels any running typing animation.
 */
function stopTypingAnimation() {
  if (typingTimeoutId !== null) {
    clearTimeout(typingTimeoutId);
    typingTimeoutId = null;
  }
}

/**
 * Runs a continuous typing animation that cycles through phrases.
 * Skips animation and shows first phrase if prefers-reduced-motion is enabled.
 * @param {HTMLElement} element - The container element for typed text
 * @param {string[]} phrases - Array of strings to cycle through
 */
function startTypingAnimation(element, phrases) {
  stopTypingAnimation();

  if (!element || phrases.length === 0) {
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    element.textContent = phrases[0];
    return;
  }

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function type() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      charIndex--;
      element.textContent = currentPhrase.substring(0, charIndex);
    } else {
      charIndex++;
      element.textContent = currentPhrase.substring(0, charIndex);
    }

    let delay = isDeleting ? TYPING_DELETE_SPEED_MS : TYPING_SPEED_MS;

    if (!isDeleting && charIndex === currentPhrase.length) {
      delay = TYPING_PAUSE_MS;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      delay = TYPING_SPEED_MS;
    }

    typingTimeoutId = setTimeout(type, delay);
  }

  type();
}

/* ── Smooth Scroll for CTA buttons ── */

/**
 * Enables smooth scrolling for all anchor links pointing to page sections.
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') {
        return;
      }
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* ── Testimonials "Show more" ── */

/** Cards visible at first and revealed per click (two rows on desktop) */
const TESTIMONIALS_PAGE_SIZE = 4;

/** @type {(() => void)|null} Re-renders the button label for the current language */
let updateTestimonialsLabel = null;

/**
 * Shows the first page of testimonials and reveals the rest in pages
 * when the "Show more" button is clicked. Without JS every card stays visible.
 */
function initTestimonialsLoadMore() {
  const grid = document.getElementById('testimonials-grid');
  const button = document.getElementById('testimonials-more');
  if (!grid || !button) {
    return;
  }

  const cards = Array.from(grid.querySelectorAll('.testimonial'));
  if (cards.length <= TESTIMONIALS_PAGE_SIZE) {
    return;
  }

  let shown = TESTIMONIALS_PAGE_SIZE;
  cards.slice(shown).forEach((card) => {
    card.hidden = true;
  });

  updateTestimonialsLabel = () => {
    const remaining = cards.length - shown;
    const template = t('testimonials.load_more');
    button.textContent = template === 'testimonials.load_more'
      ? `Show more testimonials (${remaining})`
      : template.replace('{count}', String(remaining));
  };

  updateTestimonialsLabel();
  button.setAttribute('aria-expanded', 'false');
  button.hidden = false;

  button.addEventListener('click', () => {
    const next = cards.slice(shown, shown + TESTIMONIALS_PAGE_SIZE);
    next.forEach((card) => {
      card.hidden = false;
    });
    shown += next.length;

    /* Move focus to the first revealed card so keyboard and screen-reader users land on the new content */
    if (next.length > 0) {
      next[0].setAttribute('tabindex', '-1');
      next[0].focus();
    }

    if (shown >= cards.length) {
      button.hidden = true;
      button.setAttribute('aria-expanded', 'true');
    } else {
      updateTestimonialsLabel();
    }
  });
}

/* ── Initialize Everything ── */
async function init() {
  renderSiteNav('home');
  initTheme();
  await initI18n();
  initParticles();
  initAnimations();
  initMobileNav();
  initSmoothScroll();
  initTestimonialsLoadMore();
  updateCopyrightYear();

  /* Start typing with current language phrases (set by initI18n callback below) */
  const typingEl = document.getElementById('hero-typing');
  startTypingAnimation(typingEl, currentPhrases);
}

/** Phrases for the current language — updated by the lang-change callback */
let currentPhrases = DEFAULT_PHRASES;

/* Re-start typing animation every time the language changes */
onLangChange((_lang, translations) => {
  const phrases = translations?.hero?.typing;
  if (Array.isArray(phrases) && phrases.length > 0) {
    currentPhrases = phrases;
  } else {
    currentPhrases = DEFAULT_PHRASES;
  }

  const typingEl = document.getElementById('hero-typing');
  startTypingAnimation(typingEl, currentPhrases);

  if (updateTestimonialsLabel) {
    updateTestimonialsLabel();
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
