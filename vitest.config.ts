/**
 * @module vitest.config
 * 
 * Vitest configuration for the Terroir Core Design System.
 * 
 * Configures the test runner with:
 * - Path aliases matching TypeScript configuration
 * - Global test setup with proper cleanup
 * - JSDOM environment for DOM-related tests
 * - Console log filtering for expected warnings
 * - V8 coverage provider with reasonable thresholds
 * 
 * Test features:
 * - Global utilities available in all tests
 * - Automatic mock and timer cleanup
 * - Unhandled rejection handling
 * - Request ID tracking for async operations
 * - Coverage focused on source files only
 * 
 * Coverage thresholds are set conservatively to allow for growth:
 * - Lines: 60%
 * - Functions: 60%
 * - Branches: 50%
 * - Statements: 60%
 */

import { defineConfig } from 'vitest/config';
import { coverageConfigDefaults } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@terroir/core': path.resolve(__dirname, './packages/core/src/index.ts'),
      '@lib': path.resolve(__dirname, './packages/core/src'),
      '@utils': path.resolve(__dirname, './packages/core/src/utils'),
      '@colors': path.resolve(__dirname, './packages/core/src/colors'),
      '@config': path.resolve(__dirname, './packages/core/src/config'),
      '@scripts': path.resolve(__dirname, './scripts'),
      '@packages': path.resolve(__dirname, './packages'),
      '@test': path.resolve(__dirname, './test'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.resolve(__dirname, './test/setup.ts')],
    onConsoleLog: (log) => {
      // Suppress expected abort error warnings in tests
      if (log.includes('PromiseRejectionHandledWarning') || log.includes('AbortError: Operation aborted')) {
        return false;
      }
      return true;
    },
    coverage: {
      // Simple, modern coverage configuration
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      
      // Single set of reasonable thresholds for the whole project
      // Start conservative, increase as codebase matures
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
      
      // Focus coverage on source files only
      include: ['packages/*/src/**/*.{js,ts}'],
      exclude: [
        ...coverageConfigDefaults.exclude,
        '**/__tests__/**',
        '**/__mocks__/**',
      ],
    },
  },
});