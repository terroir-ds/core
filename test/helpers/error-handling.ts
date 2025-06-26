/**
 * Shared test utilities for handling expected errors and promise rejections
 * Prevents unhandled promise rejection warnings in tests
 */

import { vi, expect } from 'vitest';

/**
 * Track unhandled rejections during tests
 */
let unhandledRejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;
let uncaughtExceptionHandler: ((error: Error) => void) | null = null;

/**
 * Setup error handling for a test that expects errors
 * Call this at the beginning of tests that will generate expected errors
 */
export function expectErrors(): void {
  // Remove any existing handlers
  cleanupErrorHandling();
  
  // Add handlers to suppress expected errors
  unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
    // Prevent the default unhandled rejection warning
    event.preventDefault();
  };
  
  uncaughtExceptionHandler = (error: Error) => {
    // Log to console for debugging but don't fail the test
    console.debug('Expected error in test:', error.message);
  };
  
  // Register handlers
  if (typeof window !== 'undefined') {
    // Browser environment
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);
    window.addEventListener('error', (event) => {
      if (uncaughtExceptionHandler) {
        uncaughtExceptionHandler(event.error);
      }
    });
  } else {
    // Node.js environment
    process.on('unhandledRejection', unhandledRejectionHandler);
    process.on('uncaughtException', uncaughtExceptionHandler);
  }
}

/**
 * Clean up error handling after test
 * Call this in afterEach or at the end of tests that used expectErrors()
 */
export function cleanupErrorHandling(): void {
  if (unhandledRejectionHandler) {
    if (typeof window !== 'undefined') {
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
    } else {
      process.off('unhandledRejection', unhandledRejectionHandler);
    }
    unhandledRejectionHandler = null;
  }
  
  if (uncaughtExceptionHandler) {
    if (typeof window !== 'undefined') {
      // Browser error handler was added inline, can't remove easily
    } else {
      process.off('uncaughtException', uncaughtExceptionHandler);
    }
    uncaughtExceptionHandler = null;
  }
}

/**
 * Execute a function that's expected to throw/reject
 * Handles the error gracefully and returns the error
 */
export async function captureExpectedError<T>(
  fn: () => Promise<T>
): Promise<Error> {
  expectErrors();
  
  try {
    await fn();
    throw new Error('Expected function to throw but it did not');
  } catch (error) {
    if (error instanceof Error) {
      return error;
    }
    return new Error(String(error));
  } finally {
    cleanupErrorHandling();
  }
}

/**
 * Execute a synchronous function that's expected to throw
 */
export function captureExpectedErrorSync<T>(
  fn: () => T
): Error {
  expectErrors();
  
  try {
    fn();
    throw new Error('Expected function to throw but it did not');
  } catch (error) {
    if (error instanceof Error) {
      return error;
    }
    return new Error(String(error));
  } finally {
    cleanupErrorHandling();
  }
}

/**
 * Wrapper around expect().rejects that handles unhandled rejections
 * Use this instead of expect().rejects.toThrow() for cleaner test output
 */
export async function expectRejection<T>(
  promise: Promise<T>,
  expectedError?: string | RegExp | Error | ((error: Error) => boolean)
): Promise<void> {
  expectErrors();
  
  try {
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
  } finally {
    cleanupErrorHandling();
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
  expectErrors();
  
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
  } finally {
    cleanupErrorHandling();
  }
}

/**
 * Global cleanup function to call in test setup
 * Ensures no handlers leak between tests
 */
export function globalErrorCleanup(): void {
  cleanupErrorHandling();
  
  // Reset any global error state
  if (typeof window !== 'undefined') {
    // Browser cleanup if needed
  } else {
    // Node.js cleanup
    process.removeAllListeners('unhandledRejection');
    process.removeAllListeners('uncaughtException');
  }
}
/**
 * Handle concurrent operations that may have background promise rejections
 * This is specifically designed for batch processing and similar scenarios
 * where aborting operations leaves background promises that reject
 * 
 * @param testFn The test function to execute
 * @param expectedBackgroundErrors Array of error patterns expected in background
 */
export async function withConcurrentErrorHandling<T>(
  testFn: () => Promise<T>,
  expectedBackgroundErrors: (string | RegExp | ((error: unknown) => boolean))[] = []
): Promise<T> {
  const backgroundRejections: unknown[] = [];
  let isTestComplete = false;
  
  // Set up background rejection collector
  const backgroundHandler = (reason: unknown, promise: Promise<unknown>) => {
    if (isTestComplete) {
      // Test is done, collect background rejections for analysis
      backgroundRejections.push(reason);
      
      // Check if this rejection matches expected patterns
      const isExpected = expectedBackgroundErrors.some(pattern => {
        if (typeof pattern === 'string') {
          return reason instanceof Error && reason.message.includes(pattern);
        } else if (pattern instanceof RegExp) {
          return reason instanceof Error && pattern.test(reason.message);
        } else if (typeof pattern === 'function') {
          return pattern(reason);
        }
        return false;
      });
      
      if (!isExpected) {
        console.warn('Unexpected background rejection after test completion:', reason);
      }
      
      // Don't re-throw - this is expected cleanup behavior
      return;
    }
    
    // During test execution, let the normal error handling take over
    // Remove this handler temporarily to avoid infinite loops
    process.off('unhandledRejection', backgroundHandler);
    
    // Re-emit the rejection to trigger normal handling
    setImmediate(() => {
      process.emit('unhandledRejection', reason, promise);
      // Re-add our handler after a tick
      process.on('unhandledRejection', backgroundHandler);
    });
  };
  
  // Add background handler
  process.on('unhandledRejection', backgroundHandler);
  
  try {
    const result = await testFn();
    isTestComplete = true;
    
    // Give background operations a chance to complete
    await new Promise(resolve => setImmediate(resolve));
    
    return result;
  } finally {
    isTestComplete = true;
    process.off('unhandledRejection', backgroundHandler);
    
    // Wait a bit more for any final background operations
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

/**
 * Simplified version for the common case of AbortError background rejections
 * This is the most common scenario in concurrent operations
 */
export async function withAbortErrorHandling<T>(
  testFn: () => Promise<T>
): Promise<T> {
  return withConcurrentErrorHandling(testFn, [
    'Operation aborted',
    'AbortError',
    (error: unknown) => {
      return error instanceof DOMException && error.name === 'AbortError';
    }
  ]);
}
