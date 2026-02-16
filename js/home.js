/**
 * Homepage Entry Point — Initializes all modules for index.html
 * Typing animation, mobile nav, smooth scroll.
 * @module home
 */

import { initTheme } from './theme.js';
import { initI18n, onLangChange } from './i18n.js';
import { initParticles } from './particles.js';
import { initAnimations } from './animations.js';
import { initMobileNav, updateCopyrightYear } from './utils.js';

/* ── Constants ── */
const TYPING_SPEED_MS = 80;
const TYPING_PAUSE_MS = 2000;
const TYPING_DELETE_SPEED_MS = 40;

/** Default (English) typing phrases — used as fallback before i18n loads */
const DEFAULT_PHRASES = [
  'Senior Backend Engineer',
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

/* ── Initialize Everything ── */
async function init() {
  initTheme();
  await initI18n();
  initParticles();
  initAnimations();
  initMobileNav();
  initSmoothScroll();
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
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
