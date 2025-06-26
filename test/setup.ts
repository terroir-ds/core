/**
 * Global test setup and utilities
 * This file is loaded before all tests
 */

import { beforeEach, afterEach, vi } from 'vitest';

// Store original environment variables
const originalEnv = process.env;

// Global setup for all tests
beforeEach(() => {
  // Reset modules before each test
  vi.resetModules();
  
  // Clear all mocks
  vi.clearAllMocks();
  
  // Reset environment to clean state and set required test variables
  process.env = { 
    ...originalEnv,
    NODE_ENV: 'test',
    LOG_LEVEL: 'debug',
    LOG_PRETTY: 'false'
  };
});

// Global cleanup after each test
afterEach(async () => {
  // Restore original environment
  process.env = originalEnv;
  
  // Clear any timers
  vi.clearAllTimers();
  
  // Restore all mocks
  vi.restoreAllMocks();
  
  // Clean up logger if it was imported
  try {
    const loggerModule = await vi.importActual('@utils/logger/index.js') as { cleanupLogger?: () => void };
    if (loggerModule.cleanupLogger) {
      loggerModule.cleanupLogger();
    }
  } catch {
    // Ignore errors if logger wasn't imported
  }
});

// Make test utilities globally available
declare global {
  /**
   * Reset test environment to clean state
   */
  function resetTestEnvironment(): void;
  
  /**
   * Set environment variables for testing
   */
  function setTestEnv(vars: Record<string, string | undefined>): void;
}

// Implement global test utilities
interface GlobalTestUtils {
  resetTestEnvironment: () => void;
  setTestEnv: (vars: Record<string, string | undefined>) => void;
}

const globalWithUtils = globalThis as typeof globalThis & GlobalTestUtils;

globalWithUtils.resetTestEnvironment = () => {
  vi.resetModules();
  vi.clearAllMocks();
  process.env = { ...originalEnv };
  
  // Clean up any global state
  delete (globalThis as { __requestId?: unknown }).__requestId;
  delete (globalThis as { __terroir?: unknown }).__terroir;
};

globalWithUtils.setTestEnv = (vars: Record<string, string | undefined>) => {
  Object.entries(vars).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
};