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

/** Cards visible at first (two rows on desktop) */
const TESTIMONIALS_INITIAL_COUNT = 4;

/** Cards revealed per "Show more" click */
const TESTIMONIALS_STEP = 3;

/** @type {(() => void)|null} Re-renders the button label for the current language */
let updateTestimonialsLabel = null;

/**
 * Returns a translated label, or the English fallback before translations load.
 * @param {string} key - i18n key
 * @param {string} fallback - English text
 * @returns {string} Label
 */
function labelOr(key, fallback) {
  const value = t(key);
  return value === key ? fallback : value;
}

/**
 * Shows the first testimonials and reveals the rest in steps with "Show more".
 * Once every card is visible the same button becomes "Show less": it collapses
 * back to the first cards and returns the reader to the section heading, so the
 * page never jumps and leaves them somewhere unexpected.
 * Without JS every card stays visible and the button stays hidden.
 */
function initTestimonialsLoadMore() {
  const grid = document.getElementById('testimonials-grid');
  const button = document.getElementById('testimonials-more');
  const section = document.getElementById('testimonials');
  const heading = document.getElementById('testimonials-title');
  if (!grid || !button) {
    return;
  }

  const cards = Array.from(grid.querySelectorAll('.testimonial'));
  if (cards.length <= TESTIMONIALS_INITIAL_COUNT) {
    return;
  }

  let shown = TESTIMONIALS_INITIAL_COUNT;

  const render = () => {
    cards.forEach((card, index) => {
      card.hidden = index >= shown;
    });
    const allShown = shown >= cards.length;
    button.setAttribute('aria-expanded', String(allShown));
    updateTestimonialsLabel();
  };

  updateTestimonialsLabel = () => {
    const remaining = cards.length - shown;
    button.textContent = remaining > 0
      ? labelOr('testimonials.load_more', 'Show more testimonials ({count})').replace('{count}', String(remaining))
      : labelOr('testimonials.show_less', 'Show fewer testimonials');
  };

  render();
  button.hidden = false;

  button.addEventListener('click', () => {
    if (shown >= cards.length) {
      shown = TESTIMONIALS_INITIAL_COUNT;
      render();

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      (section || grid).scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
      return;
    }

    const firstNew = cards[shown];
    shown = Math.min(cards.length, shown + TESTIMONIALS_STEP);
    render();

    /* Move focus to the first revealed card so keyboard and screen-reader users land on the new content */
    firstNew.setAttribute('tabindex', '-1');
    firstNew.focus();
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
