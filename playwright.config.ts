import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for ai.jurepi.kr E2E.
 * Boots the production build (next start) and runs the specs in tests/e2e.
 * AI-dependent flows are route-mocked in the specs (no real provider calls).
 */
const PORT = 3100;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `pnpm exec next start -p ${PORT}`,
    url: `http://localhost:${PORT}/ko`,
    timeout: 120_000,
    reuseExistingServer: false,
  },
});
