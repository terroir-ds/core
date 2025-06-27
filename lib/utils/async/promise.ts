/**
 * @module @utils/async/promise
 * 
 * Promise manipulation utilities for the Terroir Core Design System.
 * Provides advanced promise patterns including deferred promises, retry logic,
 * fallback handling, and race conditions with proper cancellation support.
 * 
 * @example Retry with exponential backoff
 * ```typescript
 * import { retry } from '@utils/async/promise';
 * 
 * const data = await retry(
 *   async () => fetch('/api/data').then(r => r.json()),
 *   {
 *     attempts: 3,
 *     delay: (attempt) => Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
 *   }
 * );
 * ```
 * 
 * @example Deferred promise for external control
 * ```typescript
 * import { defer } from '@utils/async/promise';
 * 
 * const deferred = defer<string>();
 * 
 * // Somewhere else in code
 * someEvent.on('complete', (result) => {
 *   deferred.resolve(result);
 * });
 * 
 * // Wait for the result
 * const result = await deferred.promise;
 * ```
 */

import type {
  CancellableOptions,
  Deferred as DeferredBase,
  RetryDelay,
  RetryPredicate,
  AsyncFactory
} from '@utils/types/async.types.js';
import pRetry from 'p-retry';
import { getMessage } from '@utils/errors/messages.js';
import { checkAborted } from './helpers/abort.js';
import { AsyncValidationError } from './errors.js';

/**
 * Deferred promise that can be resolved/rejected externally
 * @typeParam T - The type of the resolved value
 * 
 * @public
 */
export type Deferred<T> = DeferredBase<T>;

/**
 * Options for retry operations
 * 
 * @public
 */
export interface RetryOptions extends CancellableOptions {
  /**
   * Total number of attempts (including the first try)
   * @defaultValue 3
   */
  attempts?: number;
  
  /**
   * Delay between retries in milliseconds
   * Can be a number or function that calculates delay based on attempt
   * @defaultValue 1000
   * 
   * @example
   * ```typescript
   * // Fixed delay
   * { delay: 2000 } // 2 seconds between retries
   * 
   * // Exponential backoff
   * { delay: (attempt) => Math.pow(2, attempt) * 1000 }
   * ```
   */
  delay?: RetryDelay;
  
  /**
   * Predicate to determine if an error should trigger a retry
   * Return false to stop retrying and throw the error
   * @defaultValue () => true
   * 
   * @example
   * ```typescript
   * // Only retry network errors
   * {
   *   shouldRetry: (error) => {
   *     return error.code === 'NETWORK_ERROR';
   *   }
   * }
   * ```
   */
  shouldRetry?: RetryPredicate;
}

/**
 * Options for firstSuccessful operations
 * 
 * @public
 */
export interface FirstSuccessfulOptions extends CancellableOptions {}

/**
 * Creates a deferred promise with external control over resolution.
 * 
 * A deferred promise provides a way to create a promise and control its
 * resolution from outside the promise constructor. This is useful for
 * bridging callback-based APIs to promises or controlling async flow.
 * 
 * @typeParam T - The type of the resolved value
 * 
 * @returns Object with promise and control methods
 * @returns returns.promise - The promise to await
 * @returns returns.resolve - Function to resolve the promise
 * @returns returns.reject - Function to reject the promise
 * 
 * @example Bridging callback API to promise
 * ```typescript
 * function promisifiedCallback() {
 *   const deferred = defer<string>();
 *   
 *   legacyAPI.doSomething((error, result) => {
 *     if (error) {
 *       deferred.reject(error);
 *     } else {
 *       deferred.resolve(result);
 *     }
 *   });
 *   
 *   return deferred.promise;
 * }
 * ```
 * 
 * @example Coordinating multiple async operations
 * ```typescript
 * const ready = defer<void>();
 * 
 * // Component 1
 * async function initializeDatabase() {
 *   await connectDB();
 *   ready.resolve();
 * }
 * 
 * // Component 2
 * async function startServer() {
 *   await ready.promise; // Wait for DB
 *   server.listen(3000);
 * }
 * ```
 * 
 * @example With timeout
 * ```typescript
 * const deferred = defer<Data>();
 * 
 * // Set a timeout
 * setTimeout(() => {
 *   deferred.reject(new Error('Operation timed out'));
 * }, 5000);
 * 
 * // Resolve when data arrives
 * socket.on('data', (data) => {
 *   deferred.resolve(data);
 * });
 * 
 * const data = await deferred.promise;
 * ```
 * 
 * @public
 */
export function defer<T>(): DeferredBase<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  
  return { promise, resolve, reject };
}

/**
 * Retries a promise-returning function with configurable attempts and delays.
 * 
 * This function wraps p-retry to provide a robust retry mechanism with
 * exponential backoff, custom retry logic, and proper cancellation support.
 * Failed attempts are retried based on the configuration until success or
 * maximum attempts are reached.
 * 
 * @typeParam T - The type of the successful result
 * 
 * @param fn - Function that returns a promise to retry
 * @param options - Retry configuration
 * @param options.attempts - Total number of attempts (default: 3)
 * @param options.delay - Delay between retries in ms (default: 1000)
 * @param options.shouldRetry - Predicate to determine if retry should occur
 * @param options.signal - AbortSignal for cancellation
 * 
 * @returns Result of the successful attempt
 * 
 * @throws The last error if all attempts fail
 * @throws {DOMException} If aborted via signal
 * 
 * @example Basic retry with fixed delay
 * ```typescript
 * const data = await retry(
 *   async () => fetch('/api/data').then(r => r.json()),
 *   { attempts: 3, delay: 1000 }
 * );
 * ```
 * 
 * @example Exponential backoff
 * ```typescript
 * const result = await retry(
 *   async () => unreliableOperation(),
 *   {
 *     attempts: 5,
 *     delay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 10000)
 *   }
 * );
 * ```
 * 
 * @example Conditional retry
 * ```typescript
 * const data = await retry(
 *   async () => fetchWithTimeout(),
 *   {
 *     attempts: 3,
 *     shouldRetry: (error, attempt) => {
 *       // Don't retry 4xx errors
 *       if (error.status >= 400 && error.status < 500) {
 *         return false;
 *       }
 *       // Retry up to 3 times for other errors
 *       return attempt < 3;
 *     }
 *   }
 * );
 * ```
 * 
 * @example With cancellation
 * ```typescript
 * const controller = new AbortController();
 * 
 * const promise = retry(
 *   async () => longRunningOperation(),
 *   { 
 *     attempts: 10,
 *     delay: 2000,
 *     signal: controller.signal 
 *   }
 * );
 * 
 * // Cancel after 30 seconds
 * setTimeout(() => controller.abort(), 30000);
 * ```
 * 
 * @public
 */
export async function retry<T>(
  fn: AsyncFactory<T>,
  options?: RetryOptions
): Promise<T> {
  const {
    attempts = 3,
    delay: delayMs = 1000,
    shouldRetry = () => true,
    signal
  } = options ?? {};

  checkAborted(signal);

  // Build p-retry options
  const pRetryOptions: {
    retries: number;
    signal?: AbortSignal;
    minTimeout?: number;
    maxTimeout?: number;
    factor?: number;
    randomize?: boolean;
    onFailedAttempt?: (error: Error & { attemptNumber: number; retriesLeft: number }) => Promise<void>;
    shouldRetry?: (error: Error & { attemptNumber: number; retriesLeft: number }) => boolean | Promise<boolean>;
  } = {
    retries: attempts - 1, // p-retry uses retries (not total attempts)
    ...(signal && { signal }),
    // Adapt our shouldRetry to p-retry's format
    shouldRetry: (error) => {
      // Our shouldRetry expects (error, attemptNumber), p-retry provides attemptNumber on the error
      return shouldRetry(error, error.attemptNumber);
    }
  };

  // Handle delay configuration
  if (typeof delayMs === 'number') {
    // For fixed delay, use p-retry's built-in timing options
    pRetryOptions.minTimeout = delayMs;
    pRetryOptions.maxTimeout = delayMs;
    pRetryOptions.factor = 1; // No exponential backoff
    pRetryOptions.randomize = false;
  } else if (typeof delayMs === 'function') {
    // For custom delay function, disable p-retry's built-in delay and handle it ourselves
    pRetryOptions.minTimeout = 0;
    pRetryOptions.maxTimeout = 0; 
    pRetryOptions.factor = 1;
    pRetryOptions.randomize = false;
    pRetryOptions.onFailedAttempt = async (error: Error & { attemptNumber: number; retriesLeft: number }) => {
      // Only delay if we're going to retry again
      if (error.retriesLeft > 0) {
        const customDelay = delayMs(error.attemptNumber);
        if (customDelay > 0) {
          await new Promise<void>(resolve => setTimeout(resolve, customDelay));
        }
      }
    };
  }

  return pRetry(fn, pRetryOptions);
}

/**
 * Promise with timeout and fallback
 * @param promise - Promise to wrap
 * @param fallback - Fallback value or function
 * @param timeoutMs - Optional timeout in milliseconds
 */
export async function promiseWithFallback<T>(
  promise: Promise<T>,
  fallback: T | (() => T | Promise<T>),
  timeoutMs?: number
): Promise<T> {
  try {
    if (timeoutMs !== undefined && timeoutMs > 0) {
      // Use Promise.race with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), timeoutMs);
      });
      
      return await Promise.race([promise, timeoutPromise]);
    }
    
    return await promise;
  } catch {
    // Return fallback value
    if (typeof fallback === 'function') {
      return await (fallback as () => T | Promise<T>)();
    }
    return fallback;
  }
}

/**
 * All promises with individual results and timeout
 * @param promises - Array of promises
 * @param timeoutMs - Timeout for each promise
 */
export async function allSettledWithTimeout<T>(
  promises: Promise<T>[],
  timeoutMs: number
): Promise<PromiseSettledResult<T>[]> {
  const wrappedPromises = promises.map(promise =>
    Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      )
    ])
  );
  
  return Promise.allSettled(wrappedPromises);
}

/**
 * First successful promise
 * Tries promises in sequence until one succeeds
 * @param factories - Array of functions that return promises
 * @param options - Additional options
 */
export async function firstSuccessful<T>(
  factories: AsyncFactory<T>[],
  options?: FirstSuccessfulOptions
): Promise<T> {
  const { signal } = options ?? {};

  checkAborted(signal);

  if (factories.length === 0) {
    throw new AsyncValidationError(getMessage('VALIDATION_REQUIRED', 'promise factories'), {
      context: { factoriesLength: factories.length }
    });
  }

  const errors: unknown[] = [];
  
  for (const factory of factories) {
    if (signal?.aborted) {
      throw new DOMException(getMessage('OPERATION_ABORTED'), 'AbortError');
    }

    try {
      const result = await factory();
      
      // Check signal again after promise resolves
      if (signal?.aborted) {
        throw new DOMException(getMessage('OPERATION_ABORTED'), 'AbortError');
      }
      
      return result;
    } catch (error) {
      // If this is an AbortError, propagate it immediately
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }
      errors.push(error);
    }
  }
  
  // All failed, throw aggregate error
  throw new AggregateError(errors, getMessage('OPERATION_FAILED', factories.length));
}