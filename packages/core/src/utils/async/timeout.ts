/**
 * @module @utils/async/timeout
 * 
 * Timeout utilities for async operations in the Terroir Core Design System.
 * Provides robust timeout handling with proper cleanup, cancellation support,
 * and customizable error handling.
 * 
 * @example Basic timeout wrapper
 * ```typescript
 * import { withTimeout } from '@utils/async/timeout';
 * 
 * // Timeout a fetch operation after 5 seconds
 * try {
 *   const response = await withTimeout(
 *     fetch('/api/data'),
 *     5000
 *   );
 * } catch (error) {
 *   if (error instanceof TimeoutError) {
 *     console.error('Request timed out');
 *   }
 * }
 * ```
 * 
 * @example With custom error message
 * ```typescript
 * const data = await withTimeout(
 *   loadData(),
 *   3000,
 *   { message: 'Data loading took too long' }
 * );
 * ```
 * 
 * @example With abort signal
 * ```typescript
 * const controller = new AbortController();
 * 
 * const result = await withTimeout(
 *   processData(),
 *   10000,
 *   { signal: controller.signal }
 * );
 * 
 * // Can cancel before timeout
 * controller.abort();
 * ```
 */

import type { CancellableOptions, ErrorConstructor } from '@utils/types/async.types.js';
import { checkAborted, createAbortError } from './helpers/abort.js';
import { raceWithCleanup } from './helpers/race.js';
import { createCleanupManager } from './helpers/cleanup.js';
import { AsyncErrorMessages } from './helpers/messages.js';
import { AsyncValidationError } from './errors.js';
import { createManagedTimer } from './helpers/timers.js';

/**
 * Options for timeout operations
 * 
 * @public
 */
export interface TimeoutOptions extends CancellableOptions {
  /**
   * Custom error message for timeout
   * Can be a string or a function that receives the timeout duration
   * 
   * @example
   * ```typescript
   * // Static message
   * { message: 'Operation timed out' }
   * 
   * // Dynamic message
   * { message: (ms) => `Timed out after ${ms}ms` }
   * ```
   */
  message?: string | ((ms: number) => string);
  
  /**
   * Custom error class to use instead of TimeoutError
   * Must extend Error
   * 
   * @defaultValue TimeoutError
   */
  errorClass?: ErrorConstructor;
}

/**
 * Error thrown when an operation times out
 * 
 * @public
 * @category Errors
 */
export class TimeoutError extends Error {
  /**
   * Creates a new TimeoutError
   * @param message - Error message describing the timeout
   */
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Wraps a promise with a timeout, rejecting if the operation takes too long.
 * 
 * This function provides robust timeout handling with proper cleanup of timers
 * and event listeners. It supports cancellation via AbortSignal and custom
 * error handling.
 * 
 * @typeParam T - The type of the promise result
 * 
 * @param promise - The promise to wrap with a timeout
 * @param ms - Timeout duration in milliseconds
 * @param options - Optional configuration
 * @param options.signal - AbortSignal for cancellation
 * @param options.message - Custom timeout error message
 * @param options.errorClass - Custom error class (defaults to TimeoutError)
 * 
 * @returns The result of the promise if it resolves before timeout
 * 
 * @throws {TimeoutError} If the operation times out
 * @throws {DOMException} If the operation is aborted via signal
 * 
 * @example Basic usage
 * ```typescript
 * // Times out after 5 seconds
 * const result = await withTimeout(fetchData(), 5000);
 * ```
 * 
 * @example With custom error
 * ```typescript
 * class CustomTimeoutError extends Error {}
 * 
 * const result = await withTimeout(
 *   longRunningOperation(),
 *   10000,
 *   {
 *     message: 'Operation took too long',
 *     errorClass: CustomTimeoutError
 *   }
 * );
 * ```
 * 
 * @example With cancellation
 * ```typescript
 * const controller = new AbortController();
 * 
 * // Set a 30 second timeout with ability to cancel
 * const promise = withTimeout(
 *   downloadLargeFile(),
 *   30000,
 *   { signal: controller.signal }
 * );
 * 
 * // Cancel if user clicks cancel button
 * cancelButton.onclick = () => controller.abort();
 * ```
 * 
 * @public
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  options?: TimeoutOptions
): Promise<T> {
  const { signal, message, errorClass = TimeoutError } = options ?? {};

  // Check if already aborted
  checkAborted(signal);

  // Create cleanup manager
  const cleanup = createCleanupManager();

  // Create timeout with managed timer
  const timerOptions = signal ? { signal } : undefined;
  const timer = createManagedTimer(ms, timerOptions);
  const timeoutPromise = timer.promise.then(() => {
    const errorMessage = typeof message === 'function' 
      ? message(ms) 
      : message ?? AsyncErrorMessages.TIMEOUT(ms);
    throw new errorClass(errorMessage);
  });

  // Add timer cleanup
  cleanup.add(() => timer.clear());

  // Handle abort signal
  if (signal) {
    const abortPromise = new Promise<never>((_, reject) => {
      const handleAbort = () => reject(createAbortError());
      signal.addEventListener('abort', handleAbort, { once: true });
      cleanup.add(() => signal.removeEventListener('abort', handleAbort));
    });

    return raceWithCleanup(
      [promise, timeoutPromise, abortPromise],
      () => cleanup.execute()
    );
  }

  return raceWithCleanup(
    [promise, timeoutPromise],
    () => cleanup.execute()
  );
}

/**
 * Creates a promise that rejects after a specified time period.
 * 
 * Useful for implementing timeouts in Promise.race() scenarios or
 * as a standalone delay that always rejects.
 * 
 * @param ms - Timeout duration in milliseconds
 * @param options - Optional configuration
 * @param options.signal - AbortSignal for cancellation
 * @param options.message - Custom timeout error message
 * 
 * @returns A promise that always rejects with TimeoutError
 * 
 * @throws {TimeoutError} Always throws after the specified time
 * @throws {DOMException} If aborted via signal before timeout
 * 
 * @example Basic timeout
 * ```typescript
 * // Race between data fetch and timeout
 * const result = await Promise.race([
 *   fetchData(),
 *   timeout(5000, { message: 'Data fetch timed out' })
 * ]);
 * ```
 * 
 * @example With abort signal
 * ```typescript
 * const controller = new AbortController();
 * 
 * const timeoutPromise = timeout(10000, {
 *   signal: controller.signal,
 *   message: 'Operation cancelled or timed out'
 * });
 * 
 * // Can cancel before timeout occurs
 * controller.abort();
 * ```
 * 
 * @public
 */
export function timeout(
  ms: number,
  options?: CancellableOptions & {
    message?: string;
  }
): Promise<never> {
  const { signal, message } = options ?? {};

  // Check if already aborted
  try {
    checkAborted(signal);
  } catch (error) {
    return Promise.reject(error);
  }

  const errorMessage = message ?? AsyncErrorMessages.TIMEOUT(ms);
  
  // Create managed timer
  const timerOptions = signal ? { signal } : undefined;
  const timer = createManagedTimer(ms, timerOptions);
  
  return timer.promise.then(() => {
    throw new TimeoutError(errorMessage);
  });
}

/**
 * Races multiple promises against a timeout, returning the first to resolve.
 * 
 * This function combines Promise.race() with timeout functionality, ensuring
 * that if none of the promises resolve within the specified time, a timeout
 * error is thrown. Optionally supports a fallback value on timeout.
 * 
 * @typeParam T - The type of the promise results
 * 
 * @param promises - Array of promises to race
 * @param ms - Timeout duration in milliseconds
 * @param options - Optional configuration
 * @param options.signal - AbortSignal for cancellation
 * @param options.fallback - Value to return if timeout occurs instead of throwing
 * 
 * @returns The result of the first promise to resolve, or the fallback value
 * 
 * @throws {TimeoutError} If timeout occurs and no fallback is provided
 * @throws {AsyncValidationError} If promises array is empty and no fallback
 * @throws {DOMException} If aborted via signal
 * 
 * @example Basic race with timeout
 * ```typescript
 * // First API endpoint to respond wins, or timeout after 3s
 * const data = await raceWithTimeout([
 *   fetch('/api/primary').then(r => r.json()),
 *   fetch('/api/backup').then(r => r.json()),
 *   fetch('/api/fallback').then(r => r.json())
 * ], 3000);
 * ```
 * 
 * @example With fallback value
 * ```typescript
 * // Return cached data if all endpoints timeout
 * const data = await raceWithTimeout(
 *   [fetchFromAPI1(), fetchFromAPI2()],
 *   5000,
 *   { fallback: getCachedData() }
 * );
 * ```
 * 
 * @example With cancellation
 * ```typescript
 * const controller = new AbortController();
 * 
 * const result = await raceWithTimeout(
 *   [slowOperation1(), slowOperation2()],
 *   10000,
 *   { signal: controller.signal }
 * );
 * ```
 * 
 * @public
 */
export async function raceWithTimeout<T>(
  promises: Promise<T>[],
  ms: number,
  options?: CancellableOptions & {
    fallback?: T;
  }
): Promise<T> {
  const { signal, fallback } = options ?? {};

  // Check if already aborted
  checkAborted(signal);

  if (promises.length === 0) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new AsyncValidationError(AsyncErrorMessages.NO_PROMISES + ' and no fallback specified', {
      context: { promisesLength: promises.length }
    });
  }

  try {
    return await withTimeout(
      Promise.race(promises),
      ms,
      signal ? { signal } : undefined
    );
  } catch (error) {
    if (error instanceof TimeoutError && fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
}