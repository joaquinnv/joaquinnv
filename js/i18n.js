/**
 * Internationalization Module — EN/ES language switching
 * Loads translations from JSON files, swaps text via data-i18n attributes.
 * Persists preference in localStorage, supports ?lang= URL parameter.
 * @module i18n
 */

const STORAGE_KEY = 'jcv-lang';
const CACHE_PREFIX = 'jcv-i18n-cache-';
const DEFAULT_LANG = 'en';
const SUPPORTED_LANGS = ['en', 'es'];

/** @type {Object<string, Object>} Cache of loaded translation data */
const translationCache = {};

/** @type {string} Currently active language */
let currentLang = DEFAULT_LANG;

/** @type {Function[]} Callbacks invoked after every language switch */
const langChangeCallbacks = [];

/**
 * Resolves a nested key path (e.g., "hero.title") from an object.
 * @param {Object} obj - The translations object
 * @param {string} path - Dot-separated key path
 * @returns {string|undefined} The resolved value
 */
function resolveKey(obj, path) {
  return path.split('.').reduce((acc, key) => {
    if (acc && typeof acc === 'object') {
      return acc[key];
    }
    return undefined;
  }, obj);
}

/**
 * Determines the initial language from URL param, localStorage, or browser.
 * @returns {string} Language code ('en' or 'es')
 */
function getInitialLang() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang && SUPPORTED_LANGS.includes(urlLang)) {
    return urlLang;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LANGS.includes(stored)) {
    return stored;
  }

  const browserLang = navigator.language.slice(0, 2);
  if (SUPPORTED_LANGS.includes(browserLang)) {
    return browserLang;
  }

  return DEFAULT_LANG;
}

/**
 * Loads translation JSON for the given language.
 * Results are cached to prevent redundant network requests.
 * @param {string} lang - Language code
 * @returns {Promise<Object>} Translation data
 */
async function loadTranslations(lang) {
  if (translationCache[lang]) {
    return translationCache[lang];
  }

  let cached;
  try {
    cached = localStorage.getItem(`${CACHE_PREFIX}${lang}`);
  } catch (_error) {
    cached = null;
  }
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      translationCache[lang] = parsed;
      return parsed;
    } catch (_error) {
      try {
        localStorage.removeItem(`${CACHE_PREFIX}${lang}`);
      } catch (_err) {
        /* Ignore localStorage cleanup failures */
      }
    }
  }

  try {
    const response = await fetch(`i18n/${lang}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${lang}.json: ${response.status}`);
    }
    const data = await response.json();
    translationCache[lang] = data;
    try {
      localStorage.setItem(`${CACHE_PREFIX}${lang}`, JSON.stringify(data));
    } catch (_error) {
      /* Ignore cache write failures (quota/privacy mode) */
    }
    return data;
  } catch (error) {
    if (lang !== DEFAULT_LANG) {
      return loadTranslations(DEFAULT_LANG);
    }
    return {};
  }
}

/**
 * Applies translations to all elements with data-i18n attributes.
 * Supports textContent via data-i18n and attribute translation via data-i18n-[attr].
 * @param {Object} translations - The translation data object
 */
function applyTranslations(translations) {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const value = resolveKey(translations, key);
    if (value !== undefined) {
      el.textContent = value;
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    const value = resolveKey(translations, key);
    if (value !== undefined) {
      el.setAttribute('placeholder', value);
    }
  });

  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    const value = resolveKey(translations, key);
    if (value !== undefined) {
      el.setAttribute('aria-label', value);
    }
  });

  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    const value = resolveKey(translations, key);
    if (value !== undefined) {
      el.innerHTML = value;
    }
  });
}

/**
 * Updates the language toggle button label.
 */
function updateToggleLabel() {
  const toggleButtons = document.querySelectorAll('[data-lang-toggle]');
  toggleButtons.forEach((btn) => {
    const label = btn.querySelector('span');
    if (label) {
      label.textContent = currentLang.toUpperCase();
    }
    btn.setAttribute('aria-label',
      currentLang === 'en' ? 'Cambiar a español' : 'Switch to English'
    );
  });
}

/**
 * Switches to the specified language.
 * @param {string} lang - Language code
 */
export async function switchLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) {
    return;
  }

  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (_error) {
    /* Ignore localStorage failures in privacy-restricted environments */
  }
  document.documentElement.setAttribute('lang', lang);

  const translations = await loadTranslations(lang);
  applyTranslations(translations);
  updateToggleLabel();
  document.documentElement.removeAttribute('data-i18n-pending');

  langChangeCallbacks.forEach((cb) => {
    try {
      cb(lang, translations);
    } catch (_error) {
      /* Ignore callback failures to keep language switching resilient */
    }
  });

  const liveRegion = document.getElementById('i18n-live');
  if (liveRegion) {
    liveRegion.textContent = lang === 'en'
      ? 'Language changed to English'
      : 'Idioma cambiado a español';
  }
}

/**
 * Toggles between EN and ES.
 */
function toggleLang() {
  const next = currentLang === 'en' ? 'es' : 'en';
  switchLang(next);
}

/**
 * Registers a callback to be invoked on every language change.
 * @param {Function} callback - Receives (lang, translations)
 */
export function onLangChange(callback) {
  if (typeof callback === 'function') {
    langChangeCallbacks.push(callback);
  }
}

/**
 * Returns the current language code.
 * @returns {string} Current language
 */
export function getCurrentLang() {
  return currentLang;
}

/**
 * Gets a specific translation key for the current language.
 * @param {string} key - Dot-separated key path
 * @returns {string|undefined} The translated value
 */
export function t(key) {
  const translations = translationCache[currentLang];
  if (!translations) {
    return key;
  }
  return resolveKey(translations, key) || key;
}

/**
 * Initializes the i18n system.
 * Loads initial translations, binds toggle buttons.
 */
export async function initI18n() {
  currentLang = getInitialLang();
  document.documentElement.setAttribute('lang', currentLang);

  await switchLang(currentLang);
  document.documentElement.removeAttribute('data-i18n-pending');

  document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
    btn.addEventListener('click', toggleLang);
  });
}
