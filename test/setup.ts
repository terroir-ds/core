/**
 * @module test/setup
 * 
 * Global test setup and utilities for the Terroir Core Design System.
 * 
 * This file is loaded before all tests and provides:
 * - Environment variable management
 * - Unhandled rejection handling
 * - Module and mock cleanup
 * - Global test utilities
 * 
 * Features:
 * - Stores and restores original environment variables
 * - Manages unhandled promise rejections gracefully
 * - Suppresses PromiseRejectionHandledWarning warnings
 * - Provides global test utilities for environment management
 * - Ensures clean state between tests
 * 
 * @example Using global test utilities
 * ```typescript
 * describe('Environment-dependent tests', () => {
 *   beforeEach(() => {
 *     resetTestEnvironment();
 *   });
 *   
 *   it('should handle production mode', () => {
 *     setTestEnv({ NODE_ENV: 'production' });
 *     expect(process.env.NODE_ENV).toBe('production');
 *   });
 * });
 * ```
 * 
 * The setup automatically:
 * - Sets NODE_ENV to 'test'
 * - Sets LOG_LEVEL to 'debug'
 * - Sets LOG_PRETTY to 'false'
 * - Clears all mocks and timers between tests
 * - Restores original environment after each test
 */

import { beforeEach, afterEach, afterAll, vi } from 'vitest';

// Store original environment variables
const originalEnv = process.env;

// Store original promise rejection handlers
const originalUnhandledRejection = process.listeners('unhandledRejection');
const originalRejectionHandled = process.listeners('rejectionHandled');

// Increase max listeners to prevent warnings in tests
// Tests can create many event listeners, especially when running in parallel
// Note: We set this directly here rather than importing from shared utilities
// to avoid circular dependencies during test setup
const originalMaxListeners = process.getMaxListeners();
process.setMaxListeners(100);

// Track unhandled rejections for cleanup
const unhandledRejections = new Map<Promise<unknown>, { reason: unknown; promise: Promise<unknown> }>();

// Remove all existing handlers
process.removeAllListeners('unhandledRejection');
process.removeAllListeners('rejectionHandled');

// Add our test-friendly handlers
process.on('unhandledRejection', (reason, promise) => {
  // Store the rejection for potential cleanup
  unhandledRejections.set(promise, { reason, promise });
  
  // Log for debugging if needed (but don't fail the test)
  if (process.env['DEBUG_UNHANDLED_REJECTIONS'] === 'true') {
    console.warn('Unhandled rejection in test:', reason);
  }
});

process.on('rejectionHandled', (promise) => {
  // Remove from our tracking when handled
  unhandledRejections.delete(promise);
});

// Suppress PromiseRejectionHandledWarning warnings
// These are expected in our tests when we handle promise rejections 
// that were initially detected as unhandled
const originalWarningListeners = process.listeners('warning');
process.removeAllListeners('warning');

process.on('warning', (warning) => {
  // Ignore PromiseRejectionHandledWarning - these are expected
  if (warning.name === 'PromiseRejectionHandledWarning') {
    return;
  }
  
  // Re-emit other warnings to original listeners
  originalWarningListeners.forEach(listener => {
    listener(warning);
  });
});

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
  
  // Clear tracked unhandled rejections
  unhandledRejections.clear();
  
  // Clean up error handling
  try {
    const { globalErrorCleanup } = await import('@test/helpers/error-handling.js');
    globalErrorCleanup();
  } catch {
    // Ignore if error handling helper not available
  }
  
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

// Restore original handlers after all tests
afterAll(() => {
  // Clear our handlers
  process.removeAllListeners('unhandledRejection');
  process.removeAllListeners('rejectionHandled');
  process.removeAllListeners('warning');
  
  // Restore original unhandled rejection handlers
  originalUnhandledRejection.forEach(listener => {
    process.on('unhandledRejection', listener as NodeJS.UnhandledRejectionListener);
  });
  
  // Restore original rejection handled handlers
  originalRejectionHandled.forEach(listener => {
    process.on('rejectionHandled', listener as NodeJS.RejectionHandledListener);
  });
  
  // Restore original warning handlers
  originalWarningListeners.forEach(listener => {
    process.on('warning', listener as NodeJS.WarningListener);
  });
  
  // Clear any remaining tracked rejections
  unhandledRejections.clear();
  
  // Restore original max listeners
  process.setMaxListeners(originalMaxListeners);
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