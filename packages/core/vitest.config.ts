/**
 * @module vitest.config
 * 
 * Vitest configuration for the @terroir/core package.
 * 
 * Configures coverage collection specifically for the core package utilities.
 */

import { defineConfig } from 'vitest/config';
import { coverageConfigDefaults } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@lib': path.resolve(__dirname, './src'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@colors': path.resolve(__dirname, './src/colors'),
      '@config': path.resolve(__dirname, './src/config'),
      '@test': path.resolve(__dirname, '../../test'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      path.resolve(__dirname, '../../test/worker-setup.ts'),
      path.resolve(__dirname, '../../test/setup.ts')
    ],
    exclude: ['**/node_modules/**'],
    onConsoleLog: (log) => {
      // Suppress expected abort error warnings in tests
      if (log.includes('PromiseRejectionHandledWarning') || log.includes('AbortError: Operation aborted')) {
        return false;
      }
      return true;
    },
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      
      // Focus coverage on our source files
      include: ['src/**/*.{js,ts}'],
      exclude: [
        ...coverageConfigDefaults.exclude,
        '**/__tests__/**',
        '**/__mocks__/**',
        '**/index.ts', // Re-export files
        'src/colors/**', // Colors module not fully implemented
        'src/**/types/**', // Type definition files
      ],
      
      // Thresholds disabled for individual test runs - enable for full coverage
      thresholds: {
        lines: 0,
        functions: 0, 
        branches: 0,
        statements: 0,
      },
      
      // All coverage collection settings
      all: false, // Only collect coverage for tested files
    },
    
    // Pool configuration
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 2,
        minThreads: 1,
      }
    },
    maxConcurrency: 5,
    testTimeout: 10000,
  },
});