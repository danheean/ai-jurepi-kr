import { test, expect, type Page } from '@playwright/test';

// Relative navigation uses the baseURL from playwright.config.ts.
const BASE_URL = process.env.BASE_URL || '';

// Pre-seed cookie consent so the ConsentBanner overlay never intercepts hovers.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'consent-banner',
      JSON.stringify({ analytics: true, ads: true })
    );
  });
});

// ============================================================================
// Cursor affordance: Tailwind v4 preflight leaves <button> at cursor:default
// (a breaking change from v3). Every enabled interactive control — buttons,
// links, summaries — must render cursor:pointer so hover communicates
// clickability. Guarded here as a computed-style sweep instead of per-element
// class assertions so new buttons are covered automatically by the base rule.
// ============================================================================

async function expectPointerCursor(page: Page, selector: string) {
  const el = page.locator(selector).first();
  await expect(el, `${selector} should be visible`).toBeVisible();
  const cursor = await el.evaluate((node) => getComputedStyle(node).cursor);
  expect(cursor, `${selector} should show cursor:pointer`).toBe('pointer');
}

test('home page: all interactive controls show pointer cursor', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/ko`);

  // Header controls (search trigger + theme toggle are <button> elements).
  await expectPointerCursor(page, 'header nav button');

  // Share row buttons.
  await expectPointerCursor(page, '[data-testid="share-button-copy"]');
  await expectPointerCursor(page, '[data-testid="share-button-x"]');

  // Category filter chips.
  await expectPointerCursor(page, '[data-testid="category-all"]');

  // Favorites filter toggle.
  await expectPointerCursor(page, '[data-testid="favorites-filter-toggle"]');

  // Card heart (favorite) button.
  await expectPointerCursor(page, 'button[aria-label*="즐겨찾기"]');
});

test('home page: no enabled button renders a non-pointer cursor', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/ko`);

  // Full sweep across every visible, enabled button on the page.
  const offenders = await page.evaluate(() => {
    const buttons = Array.from(
      document.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
    );
    return buttons
      .filter((b) => b.offsetParent !== null) // visible only
      .filter((b) => getComputedStyle(b).cursor !== 'pointer')
      .map(
        (b) =>
          b.dataset.testid ||
          b.getAttribute('aria-label') ||
          b.textContent?.trim().slice(0, 40) ||
          '<unnamed button>'
      );
  });
  expect(offenders, `buttons without pointer cursor: ${offenders.join(', ')}`).toEqual([]);
});

test('tool page: interactive controls show pointer cursor', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/ko/tools/hairstyle-recommendation`);

  // Sweep all visible enabled buttons on the tool page too (entry chooser,
  // pickers, actions are <button> elements).
  const offenders = await page.evaluate(() => {
    const buttons = Array.from(
      document.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
    );
    return buttons
      .filter((b) => b.offsetParent !== null)
      .filter((b) => getComputedStyle(b).cursor !== 'pointer')
      .map(
        (b) =>
          b.dataset.testid ||
          b.getAttribute('aria-label') ||
          b.textContent?.trim().slice(0, 40) ||
          '<unnamed button>'
      );
  });
  expect(offenders, `buttons without pointer cursor: ${offenders.join(', ')}`).toEqual([]);

  // FAQ <summary> rows inherit cursor-pointer from their <details> parent.
  const summary = page.locator('summary').first();
  if (await summary.isVisible()) {
    const cursor = await summary.evaluate(
      (node) => getComputedStyle(node).cursor
    );
    expect(cursor, 'FAQ summary should show cursor:pointer').toBe('pointer');
  }
});
