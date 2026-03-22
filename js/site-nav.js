/**
 * Shared site navigation — one markup source for index, CV, and banner pages.
 * Call {@link renderSiteNav} before {@link initI18n} so `data-i18n` nodes exist.
 * @module site-nav
 */

/** @typedef {'home' | 'cv' | 'banner'} SiteNavPage */

/** Section anchors + i18n keys + English placeholder text. */
const NAV_SECTIONS = [
  { slug: 'about', i18n: 'nav.about', fallback: 'About' },
  { slug: 'experience', i18n: 'nav.experience', fallback: 'Experience' },
  { slug: 'skills', i18n: 'nav.skills', fallback: 'Skills' },
  { slug: 'testimonials', i18n: 'nav.testimonials', fallback: 'Testimonials' },
  { slug: 'contact', i18n: 'nav.contact', fallback: 'Contact' },
];

/**
 * Injects the main nav into `#nav`. Must run on DOM ready.
 * @param {SiteNavPage} page - Which page is active (controls `href` prefixes and current link).
 */
export function renderSiteNav(page) {
  const header = document.getElementById('nav');
  if (!header) {
    return;
  }

  const isHome = page === 'home';
  const sectionHref = (slug) => (isHome ? `#${slug}` : `index.html#${slug}`);
  const logoHref = isHome ? '#' : 'index.html';

  const sectionLinks = NAV_SECTIONS.map(
    ({ slug, i18n, fallback }) =>
      `<a href="${sectionHref(slug)}" class="nav__link" data-i18n="${i18n}">${fallback}</a>`,
  ).join('\n                ');

  const cvIsCurrent = page === 'cv';
  const cvClass = cvIsCurrent ? 'nav__link nav__link--cv nav__link--current' : 'nav__link nav__link--cv';
  const cvCurrentAttrs = cvIsCurrent ? ' data-nav-current aria-current="page"' : '';

  const bannerIsCurrent = page === 'banner';
  const bannerClass = bannerIsCurrent
    ? 'nav__link nav__link--cv nav__link--current'
    : 'nav__link nav__link--cv';
  const bannerCurrentAttrs = bannerIsCurrent ? ' data-nav-current aria-current="page"' : '';

  header.innerHTML = `
        <div class="nav__container">
            <a href="${logoHref}" class="nav__logo" aria-label="Joaquín Noguera — Home">
                <span class="nav__logo-bracket">{</span>
                <span class="nav__logo-letter">J</span>
                <span class="nav__logo-bracket">}</span>
            </a>

            <nav class="nav__links" id="nav-links" aria-label="Main navigation">
                ${sectionLinks}
                <a href="cv.html" class="${cvClass}"${cvCurrentAttrs} data-i18n="nav.cv">View CV</a>
                <a href="banner.html" class="${bannerClass}"${bannerCurrentAttrs} data-i18n="nav.banner">LinkedIn banner</a>
            </nav>

            <div class="nav__actions">
                <button class="nav__lang-toggle" data-lang-toggle aria-label="Switch language">
                    <span>EN</span>
                </button>
                <button class="nav__theme-toggle" data-theme-toggle aria-label="Toggle dark mode">
                    <i class="fas fa-sun nav__theme-icon nav__theme-icon--sun" aria-hidden="true"></i>
                    <i class="fas fa-moon nav__theme-icon nav__theme-icon--moon" aria-hidden="true"></i>
                </button>
                <button class="nav__mobile-toggle" id="mobile-toggle" aria-label="Toggle menu" aria-expanded="false" aria-controls="nav-links">
                    <span class="hamburger"></span>
                </button>
            </div>
        </div>`;
}
