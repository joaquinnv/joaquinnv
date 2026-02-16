import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const HEADING_TEXT_PREVIEW_MAX = 50;

/* ==========================================================================
   Accessibility Tests — WCAG AA compliance via axe-core
   ========================================================================== */

test.describe('Accessibility — Homepage', () => {
  test('should not have WCAG AA violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('.particle-canvas')
      .analyze();

    const violations = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.length,
    }));

    expect(violations, `Found ${violations.length} accessibility violations:\n${JSON.stringify(violations, null, 2)}`).toHaveLength(0);
  });

  test('has proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    const headings = await page.evaluate((maxLen) => {
      const headingEls = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return Array.from(headingEls).map((h) => ({
        level: parseInt(h.tagName.charAt(1), 10),
        text: h.textContent.trim().substring(0, maxLen),
      }));
    }, HEADING_TEXT_PREVIEW_MAX);

    expect(headings.length).toBeGreaterThan(0);

    const h1Count = headings.filter((h) => h.level === 1).length;
    expect(h1Count).toBe(1);
  });

  test('all images have alt text', async ({ page }) => {
    await page.goto('/');

    const imagesWithoutAlt = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      return Array.from(imgs)
        .filter((img) => !img.getAttribute('alt') && !img.getAttribute('aria-hidden'))
        .map((img) => img.src);
    });

    expect(imagesWithoutAlt).toHaveLength(0);
  });

  test('interactive elements have accessible names', async ({ page }) => {
    await page.goto('/');

    const unlabeledButtons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      return Array.from(buttons)
        .filter((btn) => {
          const text = btn.textContent.trim();
          const ariaLabel = btn.getAttribute('aria-label');
          const ariaLabelledBy = btn.getAttribute('aria-labelledby');
          return !text && !ariaLabel && !ariaLabelledBy;
        })
        .map((btn) => btn.outerHTML.substring(0, 100));
    });

    expect(unlabeledButtons).toHaveLength(0);
  });

  test('lang attribute is set on html element', async ({ page }) => {
    await page.goto('/');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
    expect(['en', 'es']).toContain(lang);
  });
});

test.describe('Accessibility — CV Page', () => {
  test('should not have WCAG AA violations', async ({ page }) => {
    await page.goto('/cv.html');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const violations = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.length,
    }));

    expect(violations, `Found ${violations.length} accessibility violations:\n${JSON.stringify(violations, null, 2)}`).toHaveLength(0);
  });

  test('has semantic landmarks', async ({ page }) => {
    await page.goto('/cv.html');

    const landmarks = await page.evaluate(() => {
      return {
        header: document.querySelectorAll('header').length,
        main: document.querySelectorAll('main').length,
        footer: document.querySelectorAll('footer').length,
        nav: document.querySelectorAll('nav').length,
      };
    });

    expect(landmarks.header).toBeGreaterThanOrEqual(1);
    expect(landmarks.main).toBe(1);
    expect(landmarks.footer).toBeGreaterThanOrEqual(1);
    expect(landmarks.nav).toBeGreaterThanOrEqual(1);
  });
});
