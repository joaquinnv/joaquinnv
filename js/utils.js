/**
 * Shared Utilities — DRY helpers used across pages
 * @module utils
 */

/**
 * Sets up the mobile hamburger menu toggle.
 * Handles open/close state, accessibility attributes, and Escape key.
 */
export function initMobileNav() {
  const toggle = document.getElementById('mobile-toggle');
  const links = document.querySelector('.nav__links');

  if (!toggle || !links) {
    return;
  }

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    links.classList.toggle('nav__links--open', !isOpen);
  });

  links.querySelectorAll('.nav__link').forEach((link) => {
    link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      links.classList.remove('nav__links--open');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      toggle.setAttribute('aria-expanded', 'false');
      links.classList.remove('nav__links--open');
      toggle.focus();
    }
  });
}

/**
 * Updates the copyright year in the footer to the current year.
 */
export function updateCopyrightYear() {
  const yearEl = document.getElementById('copyright-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }
}

/**
 * Creates a debounced version of a function.
 * Prevents excessive calls during rapid events like resize/scroll.
 * @param {Function} fn - The function to debounce
 * @param {number} delayMs - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delayMs) {
  let timerId = null;
  return function debouncedFn(...args) {
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      fn.apply(this, args);
      timerId = null;
    }, delayMs);
  };
}

/**
 * Sanitizes a string by escaping HTML special characters.
 * Prevents XSS when displaying user-provided text.
 * @param {string} str - The string to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeInput(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
