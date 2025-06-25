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
  
  // Reset environment to clean state
  process.env = { ...originalEnv };
});

// Global cleanup after each test
afterEach(() => {
  // Restore original environment
  process.env = originalEnv;
  
  // Clear any timers
  vi.clearAllTimers();
  
  // Restore all mocks
  vi.restoreAllMocks();
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
(globalThis as any).resetTestEnvironment = () => {
  vi.resetModules();
  vi.clearAllMocks();
  process.env = { ...originalEnv };
};

(globalThis as any).setTestEnv = (vars: Record<string, string | undefined>) => {
  Object.entries(vars).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
};