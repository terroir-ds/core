import { defineConfig } from 'vitest/config';
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
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      
      // Coverage thresholds
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
      
      // Files to include/exclude
      include: [
        'lib/**/*.{js,ts}',
        'packages/*/src/**/*.{js,ts}',
        'scripts/**/*.{js,ts}',
      ],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/tests/**',
        '**/*.spec.*',
        '**/*.test.*',
      ],
    },
  },
});