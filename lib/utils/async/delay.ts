/**
 * Delay utilities for async operations
 * Provides promise-based delays with cancellation support
 */

import type { CancellableOptions } from '@utils/types/async.types.js';

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

  // Check if already aborted
  if (signal?.aborted) {
    throw new DOMException('Operation aborted', 'AbortError');
  }

  return new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(resolve, ms);

    // Allow process to exit if requested
    if (unref && typeof timeoutId === 'object' && 'unref' in timeoutId) {
      timeoutId.unref();
    }

    // Handle abort signal
    if (signal) {
      const handleAbort = () => {
        clearTimeout(timeoutId);
        reject(new DOMException('Operation aborted', 'AbortError'));
      };
      
      signal.addEventListener('abort', handleAbort, { once: true });
    }
  });
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
    throw new Error('Delay values must be non-negative');
  }
  
  if (min > max) {
    throw new Error('Minimum delay must not exceed maximum delay');
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
  
  let timeoutId: NodeJS.Timeout | null = null;
  let maxTimeoutId: NodeJS.Timeout | null = null;
  let resolve: (() => void) | null = null;
  let reject: ((reason: unknown) => void) | null = null;
  let promise: Promise<void> | null = null;
  let startTime: number | null = null;

  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (maxTimeoutId) {
      clearTimeout(maxTimeoutId);
      maxTimeoutId = null;
    }
    resolve = null;
    reject = null;
    promise = null;
    startTime = null;
  };

  const flush = () => {
    if (resolve) {
      const currentResolve = resolve;
      cleanup();
      currentResolve();
    }
  };

  const cancel = () => {
    if (reject) {
      const error = new DOMException('Debounced delay cancelled', 'AbortError');
      const currentReject = reject;
      cleanup();
      currentReject(error);
    } else {
      cleanup();
    }
  };

  // Handle abort signal
  if (signal) {
    signal.addEventListener('abort', cancel, { once: true });
  }

  const delay = (): Promise<void> => {
    // Cancel any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Initialize promise if needed
    if (!promise) {
      promise = new Promise<void>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      
      // Set start time for maxWait
      if (maxWait && !startTime) {
        startTime = Date.now();
        maxTimeoutId = setTimeout(flush, maxWait);
      }
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      flush();
    }, ms);

    return promise;
  };

  return { delay, cancel, flush };
}