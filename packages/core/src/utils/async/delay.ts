/**
 * @module @utils/async/delay
 * 
 * Delay utilities for async operations in the Terroir Core Design System.
 * Provides promise-based delays with cancellation support, debouncing,
 * and various delay patterns for flow control.
 * 
 * @example Basic delay
 * ```typescript
 * import { delay } from '@utils/async/delay';
 * 
 * // Wait 2 seconds
 * await delay(2000);
 * console.log('2 seconds have passed');
 * ```
 * 
 * @example Cancellable delay
 * ```typescript
 * const controller = new AbortController();
 * 
 * // Start a 10 second delay
 * const delayPromise = delay(10000, { signal: controller.signal });
 * 
 * // Cancel after 2 seconds
 * setTimeout(() => controller.abort(), 2000);
 * 
 * try {
 *   await delayPromise;
 * } catch (error) {
 *   console.log('Delay was cancelled');
 * }
 * ```
 * 
 * @example Debounced delay
 * ```typescript
 * const debounced = debouncedDelay(500);
 * 
 * // Call multiple times - only the last one executes
 * debounced.delay(); // cancelled
 * debounced.delay(); // cancelled
 * debounced.delay(); // executes after 500ms
 * ```
 */

import type { CancellableOptions } from '@utils/types/async.types.js';
import { checkAborted, createAbortError } from './helpers/abort.js';
import { createManagedTimer } from './helpers/timers.js';
import { createCleanupManager } from './helpers/cleanup.js';
import { AsyncErrorMessages } from './helpers/messages.js';
import { AsyncValidationError } from './errors.js';
import { getMessage } from '@utils/errors/messages.js';

/**
 * Options for delay operations
 * 
 * @public
 */
export interface DelayOptions extends CancellableOptions {
  /**
   * Whether to unref the timer (Node.js only)
   * When true, the delay won't keep the process alive
   * 
   * @defaultValue false
   */
  unref?: boolean;
}

/**
 * Options for debounced delay operations
 * 
 * @public
 */
export interface DebouncedDelayOptions extends CancellableOptions {
  /**
   * Maximum time to wait before forcing execution
   * Prevents infinite delays when events keep triggering
   * 
   * @example
   * ```typescript
   * // Force execution after 5 seconds max
   * const debounced = debouncedDelay(1000, { maxWait: 5000 });
   * ```
   */
  maxWait?: number;
}

/**
 * Creates a promise that resolves after a specified delay.
 * 
 * This is a promise-based alternative to setTimeout with proper
 * cancellation support via AbortSignal. The delay can be cancelled
 * at any time, causing the promise to reject.
 * 
 * @param ms - Delay duration in milliseconds
 * @param options - Optional configuration
 * @param options.signal - AbortSignal for cancellation
 * @param options.unref - Whether to unref the timer (Node.js only)
 * 
 * @returns Promise that resolves after the delay
 * 
 * @throws {AsyncValidationError} If ms is negative
 * @throws {DOMException} If aborted via signal
 * 
 * @example Basic delay
 * ```typescript
 * // Wait 1 second
 * await delay(1000);
 * console.log('1 second has passed');
 * ```
 * 
 * @example With cancellation
 * ```typescript
 * const controller = new AbortController();
 * 
 * // Start delay with cancellation
 * const delayPromise = delay(5000, { signal: controller.signal });
 * 
 * // Cancel after 1 second
 * setTimeout(() => controller.abort(), 1000);
 * 
 * try {
 *   await delayPromise;
 * } catch (error) {
 *   if (error.name === 'AbortError') {
 *     console.log('Delay was cancelled');
 *   }
 * }
 * ```
 * 
 * @example In async flow control
 * ```typescript
 * async function retryWithBackoff(fn: () => Promise<void>) {
 *   for (let i = 0; i < 3; i++) {
 *     try {
 *       await fn();
 *       return;
 *     } catch (error) {
 *       if (i < 2) {
 *         // Exponential backoff: 1s, 2s, 4s
 *         await delay(1000 * Math.pow(2, i));
 *       }
 *     }
 *   }
 * }
 * ```
 * 
 * @public
 */
export async function delay(
  ms: number,
  options?: DelayOptions
): Promise<void> {
  const { signal, unref = false } = options ?? {};

  // Validate input
  if (ms < 0) {
    throw new AsyncValidationError(AsyncErrorMessages.INVALID_DELAY, {
      context: { ms }
    });
  }

  // Check if already aborted
  checkAborted(signal);

  const timerOptions = signal ? { signal, unref } : { unref };
  const timer = createManagedTimer(ms, timerOptions);
  return timer.promise;
}

/**
 * Delays returning a value by a specified time.
 * 
 * Useful for simulating async operations, rate limiting,
 * or adding delays to promise chains while preserving values.
 * 
 * @typeParam T - The type of the value to return
 * 
 * @param value - Value to return after the delay
 * @param ms - Delay duration in milliseconds
 * @param options - Optional configuration
 * @param options.signal - AbortSignal for cancellation
 * @param options.unref - Whether to unref the timer (Node.js only)
 * 
 * @returns The input value after the delay
 * 
 * @throws {AsyncValidationError} If ms is negative
 * @throws {DOMException} If aborted via signal
 * 
 * @example Basic usage
 * ```typescript
 * // Return value after 1 second
 * const result = await delayValue('hello', 1000);
 * console.log(result); // 'hello' (after 1 second)
 * ```
 * 
 * @example In promise chains
 * ```typescript
 * const data = await fetchData()
 *   .then(data => delayValue(data, 2000)) // Add 2s delay
 *   .then(data => processData(data));
 * ```
 * 
 * @example Simulating async operations
 * ```typescript
 * async function simulateAPICall() {
 *   // Simulate 500ms network delay
 *   return delayValue({ id: 1, name: 'Test' }, 500);
 * }
 * ```
 * 
 * @public
 */
export async function delayValue<T>(
  value: T,
  ms: number,
  options?: DelayOptions
): Promise<T> {
  await delay(ms, options);
  return value;
}

/**
 * Creates a delay with a random duration within a specified range.
 * 
 * Useful for jittering operations to avoid thundering herd problems,
 * simulating realistic network conditions, or adding randomness to
 * retry logic.
 * 
 * @param min - Minimum delay in milliseconds (inclusive)
 * @param max - Maximum delay in milliseconds (inclusive)
 * @param options - Optional configuration
 * @param options.signal - AbortSignal for cancellation
 * @param options.unref - Whether to unref the timer (Node.js only)
 * 
 * @returns Promise that resolves after the random delay
 * 
 * @throws {AsyncValidationError} If min or max is negative, or min > max
 * @throws {DOMException} If aborted via signal
 * 
 * @example Basic random delay
 * ```typescript
 * // Wait between 1 and 3 seconds
 * await randomDelay(1000, 3000);
 * ```
 * 
 * @example Jittered retry
 * ```typescript
 * async function retryWithJitter(fn: () => Promise<void>) {
 *   for (let i = 0; i < 3; i++) {
 *     try {
 *       await fn();
 *       return;
 *     } catch (error) {
 *       if (i < 2) {
 *         // Add jitter to avoid thundering herd
 *         await randomDelay(500, 2000);
 *       }
 *     }
 *   }
 * }
 * ```
 * 
 * @example Simulating network latency
 * ```typescript
 * async function simulateNetworkCall() {
 *   // Simulate 50-500ms network latency
 *   await randomDelay(50, 500);
 *   return fetchData();
 * }
 * ```
 * 
 * @public
 */
export async function randomDelay(
  min: number,
  max: number,
  options?: DelayOptions
): Promise<void> {
  if (min < 0 || max < 0) {
    throw new AsyncValidationError(AsyncErrorMessages.INVALID_DELAY, {
      context: { min, max }
    });
  }
  
  if (min > max) {
    throw new AsyncValidationError(getMessage('DELAY_MIN_MAX_INVALID'), {
      context: { min, max }
    });
  }
  
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return delay(ms, options);
}

/**
 * Creates a debounced delay that resets on each call.
 * 
 * This function returns an object with methods to control a delay that
 * resets every time it's called. Only the last call within the delay
 * period will resolve. Useful for implementing debounced user input,
 * search-as-you-type, or auto-save features.
 * 
 * @param ms - Delay duration in milliseconds
 * @param options - Optional configuration
 * @param options.signal - AbortSignal for cancellation
 * @param options.maxWait - Maximum time to wait before forcing execution
 * 
 * @returns Object with delay control methods
 * @returns returns.delay - Function that returns a promise resolving after the debounced delay
 * @returns returns.cancel - Function that cancels the pending delay
 * @returns returns.flush - Function that immediately resolves the pending delay
 * 
 * @example Basic debouncing
 * ```typescript
 * const debounced = debouncedDelay(500);
 * 
 * // User types quickly
 * input.oninput = async () => {
 *   await debounced.delay();
 *   // Only executes 500ms after user stops typing
 *   performSearch(input.value);
 * };
 * ```
 * 
 * @example With max wait
 * ```typescript
 * // Force execution after 2 seconds max
 * const debounced = debouncedDelay(500, { maxWait: 2000 });
 * 
 * // Even if user keeps typing, search executes after 2s
 * input.oninput = async () => {
 *   await debounced.delay();
 *   performSearch(input.value);
 * };
 * ```
 * 
 * @example Manual control
 * ```typescript
 * const debounced = debouncedDelay(1000);
 * 
 * // Start delay
 * const promise = debounced.delay();
 * 
 * // Force immediate execution
 * debounced.flush();
 * 
 * // Or cancel entirely
 * debounced.cancel();
 * ```
 * 
 * @example Auto-save implementation
 * ```typescript
 * const autoSave = debouncedDelay(3000, { maxWait: 10000 });
 * 
 * editor.onchange = async () => {
 *   showSavingIndicator();
 *   try {
 *     await autoSave.delay();
 *     await saveDocument();
 *     showSavedIndicator();
 *   } catch (error) {
 *     if (error.name === 'AbortError') {
 *       console.log('Save cancelled');
 *     }
 *   }
 * };
 * 
 * // Save immediately on explicit save
 * saveButton.onclick = () => autoSave.flush();
 * ```
 * 
 * @public
 */
export function debouncedDelay(
  ms: number,
  options?: DebouncedDelayOptions
): {
  delay: () => Promise<void>;
  cancel: () => void;
  flush: () => void;
} {
  const { signal, maxWait } = options ?? {};
  
  let timer: ReturnType<typeof createManagedTimer> | null = null;
  let maxTimer: ReturnType<typeof createManagedTimer> | null = null;
  let resolve: (() => void) | null = null;
  let reject: ((reason: unknown) => void) | null = null;
  let promise: Promise<void> | null = null;
  let startTime: number | null = null;

  const cleanup = createCleanupManager();

  const reset = () => {
    timer?.clear();
    maxTimer?.clear();
    timer = null;
    maxTimer = null;
    resolve = null;
    reject = null;
    promise = null;
    startTime = null;
  };

  const flush = () => {
    if (resolve) {
      const currentResolve = resolve;
      reset();
      currentResolve();
    }
  };

  const cancel = () => {
    if (reject) {
      const error = createAbortError(getMessage('DEBOUNCED_DELAY_CANCELLED'));
      const currentReject = reject;
      reset();
      currentReject(error);
    } else {
      reset();
    }
  };

  // Handle abort signal
  if (signal) {
    cleanup.add(() => signal.removeEventListener('abort', cancel));
    signal.addEventListener('abort', cancel, { once: true });
  }

  const delay = (): Promise<void> => {
    // Cancel any existing timeout
    timer?.clear();

    // Initialize promise if needed
    if (!promise) {
      promise = new Promise<void>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      
      // Set start time for maxWait
      if (maxWait && !startTime) {
        startTime = Date.now();
        const maxTimerOptions = signal ? { signal } : undefined;
        maxTimer = createManagedTimer(maxWait, maxTimerOptions);
        maxTimer.promise.then(flush, () => {});
      }
    }

    // Set new timeout
    const timerOptions = signal ? { signal } : undefined;
    timer = createManagedTimer(ms, timerOptions);
    timer.promise.then(flush, () => {});

    return promise;
  };

  return { delay, cancel, flush };
}