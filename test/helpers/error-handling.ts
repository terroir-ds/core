/**
 * @module test/helpers/error-handling
 * 
 * Test utilities for handling expected errors and promise rejections.
 * 
 * Provides comprehensive error testing utilities for the Terroir Core Design System
 * test suite. These helpers simplify testing error conditions, promise rejections,
 * and error properties. The project uses a global unhandled rejection handler in
 * test setup, so manual error handling is no longer needed for cleanup.
 * 
 * @example Testing promise rejections
 * ```typescript
 * import { expectRejection, verifyRejection } from '@test/helpers/error-handling';
 * 
 * it('should reject with specific error', async () => {
 *   await expectRejection(
 *     failingOperation(),
 *     'Operation failed'
 *   );
 *   
 *   // Or with more detailed checks
 *   await verifyRejection(failingOperation(), {
 *     message: /timeout/i,
 *     name: 'TimeoutError',
 *     code: 'ETIMEDOUT'
 *   });
 * });
 * ```
 * 
 * @example Capturing errors for inspection
 * ```typescript
 * import { captureExpectedError } from '@test/helpers/error-handling';
 * 
 * it('should include context in error', async () => {
 *   const error = await captureExpectedError(
 *     () => processInvalidData()
 *   );
 *   
 *   expect(error.cause).toBeDefined();
 *   expect(error.context).toHaveProperty('userId');
 * });
 * ```
 * 
 * @example Suppressing console errors
 * ```typescript
 * import { suppressConsoleErrors } from '@test/helpers/error-handling';
 * 
 * it('should log errors during operation', () => {
 *   const restore = suppressConsoleErrors();
 *   
 *   performOperationThatLogs();
 *   
 *   expect(console.error).toHaveBeenCalledWith(
 *     expect.stringContaining('Expected error')
 *   );
 *   
 *   restore();
 * });
 * ```
 */

import { vi, expect } from 'vitest';

/**
 * Wrapper around expect().rejects that provides consistent error handling
 * Use this for simple promise rejection assertions
 */
export async function expectRejection<T>(
  promise: Promise<T>,
  expectedError?: string | RegExp | Error | ((error: Error) => boolean)
): Promise<void> {
  if (typeof expectedError === 'string') {
    await expect(promise).rejects.toThrow(expectedError);
  } else if (expectedError instanceof RegExp) {
    await expect(promise).rejects.toThrow(expectedError);
  } else if (expectedError instanceof Error) {
    await expect(promise).rejects.toThrow(expectedError.message);
  } else if (typeof expectedError === 'function') {
    try {
      await promise;
      throw new Error('Expected promise to reject but it resolved');
    } catch (error) {
      if (error instanceof Error && expectedError(error)) {
        return; // Test passed
      }
      throw error;
    }
  } else {
    await expect(promise).rejects.toThrow();
  }
}

/**
 * Test utility to verify that a promise rejects with expected characteristics
 * More detailed than standard expect().rejects
 */
export async function verifyRejection<T>(
  promise: Promise<T>,
  expectations: {
    message?: string | RegExp;
    name?: string;
    code?: string;
    cause?: unknown;
    customCheck?: (error: Error) => boolean;
  }
): Promise<Error> {
  try {
    await promise;
    throw new Error('Expected promise to reject but it resolved');
  } catch (error) {
    // Handle DOMException and other error-like objects
    if (!(error instanceof Error) && !(error instanceof DOMException)) {
      throw new Error(`Expected Error object but got ${typeof error}: ${String(error)}`);
    }
    
    // Convert DOMException to Error for consistent handling but preserve original properties
    const errorObj = error instanceof Error ? error : (() => {
      const errorLike = error as { message?: string; name?: string };
      const err = new Error(errorLike.message || String(error));
      err.name = errorLike.name || 'Error';
      return err;
    })();
    
    if (expectations.message) {
      if (typeof expectations.message === 'string') {
        expect(errorObj.message).toBe(expectations.message);
      } else {
        expect(errorObj.message).toMatch(expectations.message);
      }
    }
    
    if (expectations.name) {
      expect(errorObj.name).toBe(expectations.name);
    }
    
    if (expectations.code) {
      expect((errorObj as { code?: string }).code).toBe(expectations.code);
    }
    
    if (expectations.cause !== undefined) {
      expect((errorObj as { cause?: unknown }).cause).toBe(expectations.cause);
    }
    
    if (expectations.customCheck) {
      expect(expectations.customCheck(errorObj)).toBe(true);
    }
    
    return errorObj;
  }
}

/**
 * Execute a function that's expected to throw/reject
 * Handles the error gracefully and returns the error
 */
export async function captureExpectedError<T>(
  fn: () => Promise<T>
): Promise<Error> {
  try {
    await fn();
    throw new Error('Expected function to throw but it did not');
  } catch (error) {
    if (error instanceof Error) {
      return error;
    }
    return new Error(String(error));
  }
}

/**
 * Execute a synchronous function that's expected to throw
 */
export function captureExpectedErrorSync<T>(
  fn: () => T
): Error {
  try {
    fn();
    throw new Error('Expected function to throw but it did not');
  } catch (error) {
    if (error instanceof Error) {
      return error;
    }
    return new Error(String(error));
  }
}

/**
 * Create a promise that will reject after a delay
 * Useful for testing timeout scenarios
 */
export function createDelayedRejection(
  error: Error,
  delayMs: number
): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(error), delayMs);
  });
}

/**
 * Create a promise that will resolve after a delay
 * Useful for testing race conditions
 */
export function createDelayedResolution<T>(
  value: T,
  delayMs: number
): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), delayMs);
  });
}

/**
 * Mock console methods to suppress expected error logs
 * Returns a cleanup function to restore original console
 */
export function suppressConsoleErrors(): () => void {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = vi.fn();
  console.warn = vi.fn();
  
  return () => {
    console.error = originalError;
    console.warn = originalWarn;
  };
}

// DEPRECATED: These functions are no longer needed with global error handling
// They are kept temporarily for backward compatibility but should not be used

/**
 * @deprecated No longer needed - global test setup handles unhandled rejections
 */
export function expectErrors(_options?: unknown): void {
  // No-op - global handler manages this
}

/**
 * @deprecated No longer needed - global test setup handles cleanup automatically
 */
export function cleanupErrorHandling(): void {
  // No-op - global handler manages this
}

/**
 * @deprecated No longer needed - global test setup handles cleanup automatically
 */
export function globalErrorCleanup(): void {
  // No-op - global handler manages this
}

/**
 * @deprecated No longer needed - global test setup handles background rejections
 */
export async function withConcurrentErrorHandling<T>(
  testFn: () => Promise<T>,
  _expectedBackgroundErrors?: unknown[]
): Promise<T> {
  // Just run the test function - global handler manages rejections
  return testFn();
}

/**
 * @deprecated No longer needed - global test setup handles abort errors
 */
export async function withAbortErrorHandling<T>(
  testFn: () => Promise<T>
): Promise<T> {
  // Just run the test function - global handler manages rejections
  return testFn();
}