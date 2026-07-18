import { test, expect } from '@playwright/test';

// Relative navigation uses the baseURL from playwright.config.ts.
const BASE_URL = process.env.BASE_URL || '';

const FAVORITES_KEY = 'ai-jurepi-home-favorites';

// Pre-seed cookie consent so the ConsentBanner overlay never intercepts clicks.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'consent-banner',
      JSON.stringify({ analytics: true, ads: true })
    );
  });
});

// ============================================================================
// Share row: the SNS + copy buttons are prerendered on the home page.
// (Native share is mounted-gated behind navigator.share, so it is NOT asserted.)
// ============================================================================

test('home page: share row renders SNS + copy buttons', async ({ page }) => {
  await page.goto(`${BASE_URL}/ko`);

  for (const id of ['naver', 'x', 'facebook', 'threads', 'telegram', 'whatsapp', 'copy']) {
    await expect(page.getByTestId(`share-button-${id}`)).toBeVisible();
  }
});

// ============================================================================
// Favorites: toggling the card heart persists to localStorage and updates the
// filter chip count; the favorites-only filter narrows the grid to saved tools.
// ============================================================================

test('home page: favoriting a tool persists and drives the filter', async ({ page }) => {
  await page.goto(`${BASE_URL}/ko`);

  const heart = page.locator('button[aria-label*="즐겨찾기 추가"]').first();
  await expect(heart).toBeVisible();
  await expect(heart).toHaveAttribute('aria-pressed', 'false');

  // Favorite it.
  await heart.click();

  // Heart flips to the "remove" state (aria-pressed=true).
  const active = page.locator('button[aria-label*="즐겨찾기 해제"]').first();
  await expect(active).toHaveAttribute('aria-pressed', 'true');

  // Persisted to the ai-scoped localStorage key.
  const stored = await page.evaluate((k) => window.localStorage.getItem(k), FAVORITES_KEY);
  expect(stored).toBeTruthy();
  const parsed = JSON.parse(stored as string);
  expect(parsed.version).toBe(1);
  expect(parsed.ids).toContain('hairstyle-recommendation');

  // Filter chip shows the saved count.
  const filterToggle = page.getByTestId('favorites-filter-toggle');
  await expect(filterToggle).toContainText('1');

  // Enabling the favorites-only filter keeps the favorited card visible.
  await filterToggle.click();
  await expect(filterToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('tool-card-hairstyle-recommendation')).toBeVisible();
});

test('home page: favorites survive a reload (localStorage)', async ({ page }) => {
  await page.goto(`${BASE_URL}/ko`);
  await page.locator('button[aria-label*="즐겨찾기 추가"]').first().click();
  await expect(page.getByTestId('favorites-filter-toggle')).toContainText('1');

  await page.reload();

  // Count badge is restored from localStorage, and the card shows the active heart.
  await expect(page.getByTestId('favorites-filter-toggle')).toContainText('1');
  await expect(
    page.locator('button[aria-label*="즐겨찾기 해제"]').first()
  ).toHaveAttribute('aria-pressed', 'true');
});
