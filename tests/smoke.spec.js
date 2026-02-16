import { test, expect } from '@playwright/test';

const NAV_LINK_COUNT = 6;
const CONTACT_CARD_COUNT = 4;
const MIN_EXPERIENCE_ENTRIES = 4;
const MIN_SKILL_TAGS = 10;
const MOBILE_VIEWPORT_WIDTH = 375;
const MOBILE_VIEWPORT_HEIGHT = 812;

/* ==========================================================================
   Smoke Tests — Verifies critical paths load and core features function
   ========================================================================== */

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads and displays the hero section', async ({ page }) => {
    await expect(page).toHaveTitle(/Joaquín Noguera/);
    await expect(page.locator('.hero__title')).toBeVisible();
    await expect(page.locator('.hero__title')).toContainText('Joaquín Noguera');
  });

  test('navigation links are visible', async ({ page }) => {
    const navLinks = page.locator('.nav__link');
    await expect(navLinks).toHaveCount(NAV_LINK_COUNT);
  });

  test('all main sections exist', async ({ page }) => {
    const sections = ['about', 'experience', 'skills', 'testimonials', 'contact'];
    for (const id of sections) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
  });

  test('theme toggle switches data-theme attribute', async ({ page }) => {
    const html = page.locator('html');
    const themeToggle = page.locator('[data-theme-toggle]').first();

    const initialTheme = await html.getAttribute('data-theme');
    await themeToggle.click();
    const newTheme = await html.getAttribute('data-theme');

    expect(newTheme).not.toEqual(initialTheme);
  });

  test('language toggle switches lang attribute', async ({ page }) => {
    const html = page.locator('html');
    const langToggle = page.locator('[data-lang-toggle]').first();
    const initialLang = await html.getAttribute('lang');

    await langToggle.click();
    await expect.poll(async () => html.getAttribute('lang')).not.toBe(initialLang);
    const lang = await html.getAttribute('lang');

    expect(['en', 'es']).toContain(lang);
  });

  test('contact section displays contact cards', async ({ page }) => {
    const cards = page.locator('.contact__card');
    await expect(cards).toHaveCount(CONTACT_CARD_COUNT);
  });

  test('skip link is present and focusable', async ({ page }) => {
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();

    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();
  });

  test('particle canvas exists', async ({ page }) => {
    const canvas = page.locator('#particle-canvas');
    await expect(canvas).toBeAttached();
  });

  test('footer displays copyright year', async ({ page }) => {
    const year = new Date().getFullYear().toString();
    await expect(page.locator('#copyright-year')).toHaveText(year);
  });
});

test.describe('CV Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cv.html');
  });

  test('loads and displays header information', async ({ page }) => {
    await expect(page).toHaveTitle(/CV.*Joaquín Noguera/);
    await expect(page.locator('.cv__name')).toBeVisible();
    await expect(page.locator('.cv__title')).toBeVisible();
  });

  test('experience section has entries', async ({ page }) => {
    const entries = page.locator('.cv__xp-item');
    const count = await entries.count();
    expect(count).toBeGreaterThanOrEqual(MIN_EXPERIENCE_ENTRIES);
  });

  test('skills section displays skill tags', async ({ page }) => {
    const tags = page.locator('.cv__skill-tags .tag');
    const count = await tags.count();
    expect(count).toBeGreaterThanOrEqual(MIN_SKILL_TAGS);
  });

  test('print and download buttons exist', async ({ page }) => {
    await expect(page.locator('#print-btn')).toBeVisible();
    await expect(page.locator('#download-btn')).toBeVisible();
  });

  test('navigation links point back to homepage', async ({ page }) => {
    const firstNavLink = page.locator('.nav__link').first();
    const href = await firstNavLink.getAttribute('href');
    expect(href).toContain('index.html');
  });
});

test.describe('404 Page', () => {
  test('displays error page with navigation', async ({ page }) => {
    await page.goto('/404.html');
    await expect(page.locator('.error-page__code')).toHaveText('404');
    await expect(page.locator('.btn--primary')).toBeVisible();
  });
});

test.describe('Responsive', () => {
  test('mobile nav toggle appears on small screens', async ({ page }) => {
    await page.setViewportSize({ width: MOBILE_VIEWPORT_WIDTH, height: MOBILE_VIEWPORT_HEIGHT });
    await page.goto('/');
    await expect(page.locator('#mobile-toggle')).toBeVisible();
  });

  test('mobile nav opens on toggle click', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.setViewportSize({ width: MOBILE_VIEWPORT_WIDTH, height: MOBILE_VIEWPORT_HEIGHT });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    /* Wait for JS modules to fully initialize */
    await page.waitForFunction(() => {
      const yearEl = document.getElementById('copyright-year');
      return yearEl && yearEl.textContent === new Date().getFullYear().toString();
    }, { timeout: 10000 });

    expect(errors, `JS errors on page: ${errors.join(', ')}`).toHaveLength(0);

    const toggle = page.locator('#mobile-toggle');
    await expect(toggle).toBeVisible();

    /* Use evaluate to click directly on the DOM element */
    const expanded = await page.evaluate(() => {
      const btn = document.getElementById('mobile-toggle');
      btn.click();
      return btn.getAttribute('aria-expanded');
    });

    expect(expanded).toBe('true');
    await expect(page.locator('.nav__links')).toHaveClass(/nav__links--open/);
  });
});
