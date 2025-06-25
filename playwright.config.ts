import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/visual',
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