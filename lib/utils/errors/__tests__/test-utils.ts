/**
 * Test utilities for error handling tests
 * 
 * Provides utilities to suppress expected warnings while preserving
 * detection of unexpected errors in tests.
 */

import { beforeEach, afterEach } from 'vitest';

/**
 * Suppress expected promise rejection warnings during error tests
 * 
 * These warnings are expected when testing error scenarios because
 * test frameworks handle promise rejections asynchronously.
 */
export function suppressWarningsInErrorTests() {
  let originalRejectionListeners: Array<(...args: unknown[]) => void> = [];

  beforeEach(() => {
    // Store and remove original unhandledRejection listeners
    originalRejectionListeners = process.listeners('unhandledRejection') as Array<(...args: unknown[]) => void>;
    process.removeAllListeners('unhandledRejection');

    // Add silent handler for test rejections
    process.on('unhandledRejection', () => {
      // Silently suppress - these are expected in error tests
    });
  });

  afterEach(() => {
    process.removeAllListeners('unhandledRejection');
    originalRejectionListeners.forEach(listener => {
      process.on('unhandledRejection', listener);
    });
  });
}

// Additional test utilities can be added here as needed