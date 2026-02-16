/**
 * Scroll Animations — IntersectionObserver-based reveal system
 * Elements with .animate-on-scroll are revealed when they enter the viewport.
 * Respects prefers-reduced-motion: all elements start visible when motion is reduced.
 * @module animations
 */

const OBSERVER_THRESHOLD = 0.1;
const OBSERVER_ROOT_MARGIN = '0px 0px -50px 0px';
const NAV_OBSERVER_THRESHOLD = 0.3;
const NAV_OBSERVER_BOTTOM_MARGIN = '40%';

/**
 * Creates an IntersectionObserver that adds the visible class on entry.
 * @returns {IntersectionObserver|null} The observer instance, or null if reduced motion
 */
function createScrollObserver() {
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-on-scroll--visible');
          entry.target.removeAttribute('aria-hidden');
        }
      });
    },
    {
      threshold: OBSERVER_THRESHOLD,
      rootMargin: OBSERVER_ROOT_MARGIN,
    }
  );
}

/**
 * Computes the nav height in pixels from the CSS custom property.
 * Falls back to 64px if the property is not set.
 * @returns {number} Nav height in pixels
 */
function getNavHeightPx() {
  const NAV_HEIGHT_FALLBACK_PX = 64;
  const navEl = document.querySelector('.nav');
  if (navEl) {
    return navEl.offsetHeight || NAV_HEIGHT_FALLBACK_PX;
  }
  return NAV_HEIGHT_FALLBACK_PX;
}

/**
 * Sets up active nav link highlighting based on scroll position.
 */
function initActiveNavTracking() {
  const sections = document.querySelectorAll('.section[id]');
  if (sections.length === 0) {
    return;
  }

  const navLinks = document.querySelectorAll('.nav__link[href^="#"]');
  const navHeight = getNavHeightPx();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            link.classList.toggle(
              'nav__link--active',
              link.getAttribute('href') === `#${id}`
            );
          });
        }
      });
    },
    {
      threshold: NAV_OBSERVER_THRESHOLD,
      rootMargin: `-${navHeight}px 0px -${NAV_OBSERVER_BOTTOM_MARGIN} 0px`,
    }
  );

  sections.forEach((section) => observer.observe(section));
}

/**
 * Initializes all scroll-based animations.
 * If prefers-reduced-motion is enabled, all elements are immediately visible.
 * Gracefully handles IntersectionObserver failures.
 */
export function initAnimations() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const elements = document.querySelectorAll('.animate-on-scroll');

  if (prefersReducedMotion) {
    elements.forEach((el) => {
      el.classList.add('animate-on-scroll--visible');
    });
  } else {
    const observer = createScrollObserver();
    elements.forEach((el) => observer.observe(el));
  }

  try {
    initActiveNavTracking();
  } catch (_err) {
    /* Active nav tracking is non-critical — fail silently */
  }
}
