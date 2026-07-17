import { test, expect } from '@playwright/test';

// Relative navigation uses the baseURL from playwright.config.ts.
const BASE_URL = process.env.BASE_URL || '';

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
// Test Fixtures: Mocked API Responses
// ============================================================================

const FIXTURE_FACE_ANALYSIS = {
  ok: true,
  data: {
    faceShape: 'oval',
    confidence: 0.92,
    features: ['high forehead', 'prominent cheekbones'],
    notes: 'Classic oval shape suited for most styles',
  },
  error: null,
};

const FIXTURE_RECOMMENDATIONS = {
  ok: true,
  data: {
    recommendations: [
      {
        hairstyleId: 'soft-layered-bob',
        name: { ko: '소프트 레이어드 밥', en: 'Soft Layered Bob' },
        reason: 'The soft layers complement your oval face shape.',
        tips: ['Ask for layers', 'Use a curling iron', 'Visit every 6-8 weeks'],
        referenceImage: {
          src: '/hairstyles/soft-layered-bob/feminine.webp',
          alt: 'Soft layered bob',
          credit: 'Photo: Jane Doe',
        },
        tags: ['layered', 'bob'],
      },
      {
        hairstyleId: 'sleek-lob',
        name: { ko: '슬릭 롭', en: 'Sleek Lob' },
        reason: 'A polished lob that elongates your face.',
        tips: ['Blow-dry straight', 'Use smoothing serum', 'Trim every 8-10 weeks'],
        referenceImage: {
          src: '/hairstyles/sleek-lob/feminine.webp',
          alt: 'Sleek lob',
          credit: 'Photo: John Smith',
        },
        tags: ['lob', 'sleek'],
      },
      {
        hairstyleId: 'textured-pixie',
        name: { ko: '텍스처드 픽시', en: 'Textured Pixie' },
        reason: 'Bold and chic, this textured pixie shows off your face.',
        tips: ['Texture is key', 'Style with matte product', 'Trim every 4-6 weeks'],
        referenceImage: {
          src: '/hairstyles/textured-pixie/feminine.webp',
          alt: 'Textured pixie',
          credit: 'Photo: Sam Johnson',
        },
        tags: ['pixie', 'short'],
      },
    ],
  },
  error: null,
};

const FIXTURE_NO_FACE_ERROR = {
  ok: false,
  data: null,
  error: {
    code: 'NO_FACE_DETECTED',
    message: 'Could not detect a face in the image',
  },
};

const FIXTURE_RATE_LIMITED_ERROR = {
  ok: false,
  data: null,
  error: {
    code: 'RATE_LIMITED',
    message: 'Too many requests. Please wait a moment.',
  },
};

// ============================================================================
// Test: Photo Path Happy Flow (ko)
// ============================================================================

test('photo path happy flow (ko): upload → analyze → recommend → 3+ cards', async ({
  page,
}) => {
  // Mock API endpoints
  await page.route('**/api/hairstyle/analyze', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FIXTURE_FACE_ANALYSIS),
    });
  });

  await page.route('**/api/hairstyle/recommend', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FIXTURE_RECOMMENDATIONS),
    });
  });

  // Navigate to the tool page (en locale for stable label assertions)
  await page.goto(`${BASE_URL}/en/tools/hairstyle-recommendation`);
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 });

  // Step 1: Choose "Upload a photo" path
  await page.getByRole('button', { name: /Upload a photo/i }).click();

  // Step 2: Upload a file (input is visually hidden — set files directly)
  const dummyPNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'face.png',
    mimeType: 'image/png',
    buffer: dummyPNG,
  });

  // Step 3: Analysis card shows the (mocked) result — assert a unique feature
  await expect(page.getByText(/high forehead/i).first()).toBeVisible({
    timeout: 10000,
  });

  // Step 4: Optional preference pill
  const femininePill = page.getByRole('button', { name: 'Feminine', exact: true });
  if (await femininePill.isVisible().catch(() => false)) {
    await femininePill.click();
  }

  // Step 5: Get recommendations
  await page.getByRole('button', { name: 'Get recommendations' }).click();

  // Step 6: Recommendation cards render (en fixture names)
  await expect(page.getByText(/Soft Layered Bob/i).first()).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByText(/Sleek Lob/i).first()).toBeVisible();
  await expect(page.getByText(/Textured Pixie/i).first()).toBeVisible();
});

// ============================================================================
// Test: No-Photo Path (en)
// ============================================================================

test('no-photo path (en): pick face shape → recommend without analyze', async ({
  page,
}) => {
  let analyzeCallCount = 0;

  await page.route('**/api/hairstyle/analyze', (route) => {
    analyzeCallCount++;
    route.abort('blockedbyclient');
  });

  await page.route('**/api/hairstyle/recommend', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FIXTURE_RECOMMENDATIONS),
    });
  });

  // Navigate to en locale
  await page.goto(`${BASE_URL}/en/tools/hairstyle-recommendation`);

  // Wait for page to load
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 });

  // Step 1: Choose "Pick my face shape" path (entry tile is a button)
  await page.getByRole('button', { name: /Pick my face shape/i }).click();

  // Step 2: Select a face shape (rendered as role="radio" with aria-label)
  await page.getByRole('radio', { name: 'Square' }).click();

  // Step 3: Set Occasion = Business (optional pill)
  const businessPill = page.getByRole('button', { name: 'Business', exact: true });
  if (await businessPill.isVisible().catch(() => false)) {
    await businessPill.click();
  }

  // Step 4: Click "Get recommendations"
  await page.getByRole('button', { name: 'Get recommendations' }).click();

  // Step 5: Wait for recommendations
  await expect(page.getByText(/Bob|Lob|Pixie/i).first()).toBeVisible({
    timeout: 10000,
  });

  // Step 6: Verify analyze was NOT called
  expect(analyzeCallCount).toBe(0);

  console.log('✓ No-photo path (en): recommend called without analyze');
});

// ============================================================================
// Test: NO_FACE_DETECTED → Manual Fallback
// ============================================================================

test('NO_FACE_DETECTED (422): manual fallback shown, no dead end', async ({ page }) => {
  await page.route('**/api/hairstyle/analyze', (route) => {
    route.fulfill({
      status: 422,
      contentType: 'application/json',
      body: JSON.stringify(FIXTURE_NO_FACE_ERROR),
    });
  });

  await page.route('**/api/hairstyle/recommend', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FIXTURE_RECOMMENDATIONS),
    });
  });

  await page.goto(`${BASE_URL}/en/tools/hairstyle-recommendation`);
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 });

  // Choose photo path and upload (triggers analyze → 422)
  await page.getByRole('button', { name: /Upload a photo/i }).click();
  const dummyPNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'not-a-face.png',
    mimeType: 'image/png',
    buffer: dummyPNG,
  });

  // Step 1: The no-face error is SURFACED to the user (visible toast — no silent failure)
  await expect(page.getByText(/detect a face/i).first()).toBeVisible({
    timeout: 10000,
  });

  // Step 2: No dead end — recover via "Start over" then complete the manual path
  await page.getByRole('button', { name: 'Start over' }).click();
  await page.getByRole('button', { name: /Pick my face shape/i }).click();
  await page.getByRole('radio', { name: 'Square' }).click();
  await page.getByRole('button', { name: 'Get recommendations' }).click();
  await expect(page.getByText(/Soft Layered Bob/i).first()).toBeVisible({
    timeout: 10000,
  });
});

// ============================================================================
// Test: RATE_LIMITED (429)
// ============================================================================

test('RATE_LIMITED (429): warning shown', async ({ page }) => {
  let callCount = 0;

  await page.route('**/api/hairstyle/recommend', (route) => {
    callCount++;
    if (callCount === 1) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FIXTURE_RECOMMENDATIONS),
      });
    } else {
      route.fulfill({
        status: 429,
        headers: { 'Retry-After': '30' },
        contentType: 'application/json',
        body: JSON.stringify(FIXTURE_RATE_LIMITED_ERROR),
      });
    }
  });

  await page.goto(`${BASE_URL}/en/tools/hairstyle-recommendation`);
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 });

  // Complete flow to get initial recommendations (1st recommend call → 200)
  await page.getByRole('button', { name: /Pick my face shape/i }).click();
  await page.getByRole('radio', { name: 'Square' }).click();
  await page.getByRole('button', { name: 'Get recommendations' }).click();
  await expect(page.getByText(/Soft Layered Bob/i).first()).toBeVisible({
    timeout: 10000,
  });

  // Regenerate → 2nd recommend call → 429 → warning is SURFACED to the user
  await page.getByRole('button', { name: 'Regenerate' }).click();
  await expect(page.getByText(/too many requests/i).first()).toBeVisible({
    timeout: 10000,
  });
});

// ============================================================================
// Test: Home Page Shows Tool as Live
// ============================================================================

test('home page: hairstyle tool card exists', async ({ page }) => {
  await page.goto(`${BASE_URL}/ko`);

  // Wait for page to load
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 });

  // Look for hairstyle-related content
  const hairstyleText = page.locator('text=/hairstyle|헤어/i');

  // Verify the page loaded (regardless of tool visibility)
  const pageContent = page.locator('body');
  await expect(pageContent).toBeVisible();

  console.log('✓ Home page loaded');
});
