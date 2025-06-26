/**
 * Delay utilities for async operations
 * Provides promise-based delays with cancellation support
 */

import type { CancellableOptions } from '@utils/types/async.types.js';
import { checkAborted, createAbortError } from './helpers/abort.js';
import { createManagedTimer } from './helpers/timers.js';
import { createCleanupManager } from './helpers/cleanup.js';
import { AsyncErrorMessages } from './helpers/messages.js';
import { AsyncValidationError } from './errors.js';

export interface DelayOptions extends CancellableOptions {
  unref?: boolean;
}

export interface DebouncedDelayOptions extends CancellableOptions {
  maxWait?: number;
}

/**
 * Promise-based delay with cancellation support
 * @param ms - Delay in milliseconds
 * @param options - Additional options
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
 * Delay with value passthrough
 * @param value - Value to return after delay
 * @param ms - Delay in milliseconds
 * @param options - Additional options
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
 * Random delay within range
 * @param min - Minimum delay in milliseconds
 * @param max - Maximum delay in milliseconds
 * @param options - Additional options
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
    throw new AsyncValidationError('Minimum delay must not exceed maximum delay', {
      context: { min, max }
    });
  }
  
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return delay(ms, options);
}

/**
 * Debounced delay that resets on each call
 * @param ms - Delay in milliseconds
 * @param options - Additional options
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
      const error = createAbortError('Debounced delay cancelled');
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