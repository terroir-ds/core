/**
 * @module playwright.config
 * 
 * Playwright configuration for visual regression testing in the Terroir Core Design System.
 * 
 * Configures automated browser testing for:
 * - Visual regression snapshots
 * - Cross-browser compatibility (Chrome, Firefox, Safari)
 * - Mobile viewport testing (Pixel 5, iPhone 12)
 * - Accessibility testing
 * - Component interaction testing
 * 
 * Test features:
 * - Parallel test execution (4 workers locally, 1 on CI)
 * - Automatic retry on CI (2 retries)
 * - Trace collection on first retry
 * - Screenshots and videos on failure
 * - Storybook integration for component testing
 * - Consistent viewport sizes for visual regression
 * 
 * The configuration automatically starts Storybook dev server
 * before running tests and reuses existing servers locally.
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/visual',
  testMatch: '**/*.playwright.ts',
  outputDir: './test/visual/results',
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env['CI'],
  
  // Retry on CI only
  retries: process.env['CI'] ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env['CI'] ? 1 : 4,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: './tests/visual/report' }],
    ['json', { outputFile: './tests/visual/results.json' }],
  ],
  
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:6006',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot options
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Visual regression specific
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },
    // Mobile viewports
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'pnpm storybook:dev',
    port: 6006,
    reuseExistingServer: !process.env['CI'],
  },
});