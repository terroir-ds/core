/**
 * @module @lib/config/__mocks__/config.mock
 * 
 * Mock implementations for the configuration module in the Terroir Core Design System.
 * 
 * Provides comprehensive mock utilities for testing components that depend on
 * environment configuration without relying on actual environment variables.
 * These mocks allow tests to run in isolation with predictable configuration
 * values while maintaining the same API as the real config module.
 * 
 * @example Basic mock usage
 * ```typescript
 * import { createConfigMock } from '@lib/config/__mocks__/config.mock';
 * 
 * it('should handle production config', () => {
 *   const config = createConfigMock({ NODE_ENV: 'production' });
 *   
 *   expect(config.isProduction()).toBe(true);
 *   expect(config.isDevelopment()).toBe(false);
 * });
 * ```
 * 
 * @example Mocking the entire module
 * ```typescript
 * import { mockConfigProduction } from '@lib/config/__mocks__/config.mock';
 * 
 * beforeEach(() => {
 *   mockConfigProduction();
 * });
 * 
 * it('should use production config', async () => {
 *   const { env, isProduction } = await import('@lib/config');
 *   
 *   expect(env.NODE_ENV).toBe('production');
 *   expect(isProduction()).toBe(true);
 * });
 * ```
 * 
 * @example Testing with custom environment
 * ```typescript
 * import { createConfigMock } from '@lib/config/__mocks__/config.mock';
 * 
 * it('should handle custom log levels', () => {
 *   const config = createConfigMock({ 
 *     LOG_LEVEL: 'debug',
 *     STRICT_CONTRAST: false 
 *   });
 *   
 *   expect(config.env.LOG_LEVEL).toBe('debug');
 *   expect(config.env.STRICT_CONTRAST).toBe(false);
 * });
 * ```
 * 
 * Mock implementations for @lib/config module
 * Used for testing components that depend on environment configuration
 */

import { vi } from 'vitest';
import type { Env } from '@lib/config/index.js';

/**
 * Default mock environment configuration
 */
export const defaultMockEnv: Env = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'error',
  CI: false,
  npm_package_version: '1.0.0',
  DESIGN_SYSTEM_VERSION: '0.1.0',
  OPTIMIZE_IMAGES: true,
  GENERATE_WEBP: true,
  STRICT_CONTRAST: true,
  VISUAL_REGRESSION_THRESHOLD: 0.1,
  OTEL_SERVICE_NAME: undefined,
  OTEL_EXPORTER_OTLP_ENDPOINT: undefined,
  OTEL_EXPORTER_OTLP_HEADERS: undefined,
  LOG_SHIP_ENDPOINT: undefined,
  LOG_SHIP_API_KEY: undefined,
};

/**
 * Create a mock for @lib/config module with custom environment
 */
export function createConfigMock(overrides: Partial<Env> = {}) {
  const env = { ...defaultMockEnv, ...overrides };
  
  return {
    env,
    isDevelopment: vi.fn(() => env.NODE_ENV === 'development'),
    isProduction: vi.fn(() => env.NODE_ENV === 'production'),
    isTest: vi.fn(() => env.NODE_ENV === 'test'),
    isCI: vi.fn(() => env.CI === true),
  };
}

/**
 * Mock @lib/config module with default test environment
 */
export function mockConfigModule() {
  vi.doMock('@lib/config/index.js', () => createConfigMock());
}

/**
 * Mock @lib/config module for development environment
 */
export function mockConfigDevelopment() {
  vi.doMock('@lib/config/index.js', () => createConfigMock({
    NODE_ENV: 'development',
    LOG_LEVEL: 'debug',
  }));
}

/**
 * Mock @lib/config module for production environment
 */
export function mockConfigProduction() {
  vi.doMock('@lib/config/index.js', () => createConfigMock({
    NODE_ENV: 'production',
    LOG_LEVEL: 'info',
  }));
}

/**
 * Mock @lib/config module for CI environment
 */
export function mockConfigCI() {
  vi.doMock('@lib/config/index.js', () => createConfigMock({
    CI: true,
  }));
}