import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';

// CI/Production configuration - stricter thresholds
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      coverage: {
        enabled: true,
        // Higher thresholds for CI/production builds
        thresholds: {
          lines: 70,
          functions: 70,
          branches: 60,
          statements: 70,
        },
      },
    },
  })
);