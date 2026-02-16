/**
 * Theme Module — Dark/light mode toggle with system preference detection
 * Persists preference in localStorage, falls back to OS prefers-color-scheme.
 * @module theme
 */

const STORAGE_KEY = 'jcv-theme';
const THEME_DARK = 'dark';
const THEME_LIGHT = 'light';

/**
 * Determines the initial theme based on stored preference or OS setting.
 * @returns {'dark'|'light'} The resolved theme
 */
function getInitialTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === THEME_DARK || stored === THEME_LIGHT) {
    return stored;
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? THEME_DARK : THEME_LIGHT;
}

/**
 * Applies the given theme to the document and updates toggle icon.
 * @param {string} theme - 'dark' or 'light'
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (_error) {
    /* Ignore localStorage failures in privacy-restricted environments */
  }

  const toggleButtons = document.querySelectorAll('[data-theme-toggle]');
  toggleButtons.forEach((btn) => {
    btn.setAttribute('aria-label',
      theme === THEME_DARK ? 'Switch to light mode' : 'Switch to dark mode'
    );
  });
}

/**
 * Toggles between dark and light themes.
 */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === THEME_DARK ? THEME_LIGHT : THEME_DARK;
  applyTheme(next);
}

/**
 * Initializes the theme system.
 * Sets initial theme, binds toggle buttons, and listens for OS changes.
 */
export function initTheme() {
  const initialTheme = getInitialTheme();
  applyTheme(initialTheme);

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', toggleTheme);
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(e.matches ? THEME_DARK : THEME_LIGHT);
    }
  });
}
