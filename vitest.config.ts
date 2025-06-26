import { defineConfig } from 'vitest/config';
import { coverageConfigDefaults } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@terroir/core': path.resolve(__dirname, './lib/index.ts'),
      '@lib': path.resolve(__dirname, './lib'),
      '@utils': path.resolve(__dirname, './lib/utils'),
      '@colors': path.resolve(__dirname, './lib/colors'),
      '@config': path.resolve(__dirname, './lib/config'),
      '@scripts': path.resolve(__dirname, './scripts'),
      '@packages': path.resolve(__dirname, './packages'),
      '@test': path.resolve(__dirname, './test'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
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
      include: ['lib/**/*.{js,ts}'],
      exclude: [
        ...coverageConfigDefaults.exclude,
        '**/__tests__/**',
        '**/__mocks__/**',
      ],
    },
  },
});