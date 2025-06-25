import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';

// Development configuration - fast feedback, no coverage
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      coverage: {
        enabled: false, // Speed up dev testing
      },
      watch: true,
    },
  })
);