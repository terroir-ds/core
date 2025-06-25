import { test, expect } from '@playwright/test';

// Example visual regression tests for design system components
test.describe('Visual Regression Tests', () => {
  test.describe('Color System', () => {
    test('color palette displays correctly', async ({ page }) => {
      await page.goto('/iframe.html?id=tokens-colors--palette');
      await expect(page).toHaveScreenshot('color-palette.png');
    });

    test('contrast ratios are visible', async ({ page }) => {
      await page.goto('/iframe.html?id=tokens-colors--contrast-grid');
      await expect(page).toHaveScreenshot('contrast-grid.png');
    });
  });

  test.describe('Typography', () => {
    test('font scales render correctly', async ({ page }) => {
      await page.goto('/iframe.html?id=tokens-typography--scale');
      await expect(page).toHaveScreenshot('typography-scale.png');
    });
  });

  test.describe('Components', () => {
    test('button states', async ({ page }) => {
      await page.goto('/iframe.html?id=components-button--all-states');
      await expect(page).toHaveScreenshot('button-states.png');
    });

    test('form inputs', async ({ page }) => {
      await page.goto('/iframe.html?id=components-input--all-variants');
      await expect(page).toHaveScreenshot('input-variants.png');
    });

    test('card layouts', async ({ page }) => {
      await page.goto('/iframe.html?id=components-card--all-variants');
      await expect(page).toHaveScreenshot('card-variants.png');
    });
  });

  test.describe('Dark Mode', () => {
    test('components in dark mode', async ({ page }) => {
      await page.goto('/iframe.html?id=components-button--dark-mode');
      await page.emulateMedia({ colorScheme: 'dark' });
      await expect(page).toHaveScreenshot('dark-mode-components.png');
    });
  });

  test.describe('Responsive Design', () => {
    test('mobile layout', async ({ page, viewport }) => {
      // This test only runs on mobile projects
      if (viewport?.width && viewport.width > 500) {
        test.skip();
      }
      await page.goto('/iframe.html?id=layouts-responsive--mobile');
      await expect(page).toHaveScreenshot('mobile-layout.png');
    });
  });
});