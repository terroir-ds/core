/**
 * Test utilities for error handling tests
 * 
 * Re-exports the shared error handling utilities for consistency.
 * This file is deprecated - use @test/helpers/error-handling.js directly.
 */

// Re-export the shared error handling utilities
export {
  expectRejection,
  verifyRejection,
  captureExpectedError,
  expectErrors,
  cleanupErrorHandling,
  suppressConsoleErrors,
  createDelayedRejection,
  createDelayedResolution
} from '@test/helpers/error-handling.js';

/**
 * @deprecated Use expectErrors() from '@test/helpers/error-handling.js' instead
 * This function is kept for backward compatibility
 */
export function suppressWarningsInErrorTests() {
  // This function is now a no-op since the global test setup handles error suppression
  // and individual tests should use expectErrors() when needed
}