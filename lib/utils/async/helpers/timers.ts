/**
 * @fileoverview Timer management utilities for async operations
 * @module @utils/async/helpers/timers
 */

import { createAbortError } from './abort';
import { createCleanupManager } from './cleanup';
import pDebounce from 'p-debounce';
import pThrottle from 'p-throttle';
import { logger } from '@utils/logger/index.js';
import { PollingError } from '../errors.js';

/**
 * A managed timer with cleanup capabilities
 */
export interface ManagedTimer {
  /**
   * Clear the timer
   */
  clear(): void;
  
  /**
   * Promise that resolves when timer completes or rejects if aborted
   */
  promise: Promise<void>;
  
  /**
   * The underlying timer ID
   */
  id: NodeJS.Timeout | null;
}

/**
 * Options for creating managed timers
 */
export interface TimerOptions {
  /**
   * Whether to unref the timer (Node.js only)
   */
  unref?: boolean;
  
  /**
   * AbortSignal to cancel the timer
   */
  signal?: AbortSignal;
}

/**
 * Creates a managed timer with automatic cleanup
 * @param ms - Milliseconds to wait
 * @param options - Timer options
 * @returns A managed timer instance
 */
export function createManagedTimer(ms: number, options?: TimerOptions): ManagedTimer {
  let timeoutId: NodeJS.Timeout | null = null;
  const cleanup = createCleanupManager();
  
  const promise = new Promise<void>((resolve, rej) => {
    
    // Check if already aborted
    if (options?.signal?.aborted) {
      rej(createAbortError());
      return;
    }
    
    timeoutId = setTimeout(() => {
      timeoutId = null;
      cleanup.execute();
      resolve();
    }, ms);
    
    // Unref the timer if requested (Node.js only)
    if (options?.unref && typeof timeoutId === 'object' && 'unref' in timeoutId) {
      timeoutId.unref();
    }
    
    // Setup abort handler
    if (options?.signal) {
      const handleAbort = () => {
        clear();
        rej(createAbortError());
      };
      
      options.signal.addEventListener('abort', handleAbort, { once: true });
      cleanup.add(() => options.signal?.removeEventListener('abort', handleAbort));
    }
  });
  
  const clear = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
      cleanup.execute();
    }
  };
  
  return {
    clear,
    promise,
    get id() {
      return timeoutId;
    }
  };
}

/**
 * Creates a managed interval with automatic cleanup
 * @param callback - Function to call on each interval
 * @param ms - Milliseconds between calls
 * @param options - Timer options
 * @returns A function to stop the interval
 */
export function createManagedInterval(
  callback: () => void | Promise<void>,
  ms: number,
  options?: TimerOptions
): () => void {
  let intervalId: NodeJS.Timeout | null = null;
  const cleanup = createCleanupManager();
  
  // Check if already aborted
  if (options?.signal?.aborted) {
    return () => {};
  }
  
  const wrappedCallback = async () => {
    try {
      await callback();
    } catch (error) {
      // Stop interval on error
      stop();
      // Log error but don't throw - we're in an async context with no handler
      logger.error({ error }, 'Interval callback error');
    }
  };
  
  intervalId = setInterval(wrappedCallback, ms);
  
  // Unref the interval if requested (Node.js only)
  if (options?.unref && typeof intervalId === 'object' && 'unref' in intervalId) {
    intervalId.unref();
  }
  
  const stop = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
      cleanup.execute();
    }
  };
  
  // Setup abort handler
  if (options?.signal) {
    const handleAbort = () => stop();
    options.signal.addEventListener('abort', handleAbort, { once: true });
    cleanup.add(() => options.signal?.removeEventListener('abort', handleAbort));
  }
  
  return stop;
}

/**
 * Creates a debounced version of a function using p-debounce
 * @param fn - The function to debounce
 * @param ms - Milliseconds to wait
 * @param options - Timer options
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number,
  options?: TimerOptions & { leading?: boolean }
): T & { cancel: () => void } {
  // Track cancellation state
  let isCancelled = false;
  let abortHandler: (() => void) | null = null;
  
  // Create p-debounce wrapper
  const pDebounced = pDebounce(
    async (...args: Parameters<T>) => {
      // Check if cancelled or aborted
      if (isCancelled || options?.signal?.aborted) {
        throw createAbortError();
      }
      
      // Execute the function
      const result = await fn(...args);
      
      // Check again in case it was cancelled during execution
      if (isCancelled) {
        throw createAbortError();
      }
      
      return result;
    },
    ms,
    {
      before: options?.leading ?? false
    }
  );
  
  // Create wrapper that handles abort signal
  const debounced = ((...args: Parameters<T>) => {
    // Reset cancelled state on new call
    isCancelled = false;
    
    // If abort signal, set up handler
    if (options?.signal && !abortHandler) {
      abortHandler = () => {
        isCancelled = true;
      };
      options.signal.addEventListener('abort', abortHandler, { once: true });
    }
    
    // Check if already aborted
    if (options?.signal?.aborted) {
      return Promise.reject(createAbortError());
    }
    
    return pDebounced(...args).catch((error) => {
      // Suppress abort errors from cancelled calls
      if (isCancelled && error.message === 'The operation was aborted.') {
        return undefined;
      }
      throw error;
    });
  }) as T & { cancel: () => void };
  
  // Add cancel method for compatibility
  debounced.cancel = () => {
    isCancelled = true;
    
    // Clean up abort handler
    if (options?.signal && abortHandler) {
      options.signal.removeEventListener('abort', abortHandler);
      abortHandler = null;
    }
  };
  
  return debounced;
}

/**
 * Creates a throttled version of a function using p-throttle
 * 
 * This implements rate limiting (X calls per interval) rather than
 * classic edge throttling. It's ideal for API rate limiting and 
 * ensuring a maximum number of calls within a time window.
 * 
 * @param fn - The function to throttle
 * @param limit - Maximum number of calls within the interval
 * @param interval - The timespan for limit in milliseconds
 * @param options - Additional throttle options
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number,
  interval: number,
  options?: {
    signal?: AbortSignal;
    strict?: boolean;
    onDelay?: (...args: unknown[]) => void;
  }
): T & { 
  isEnabled: boolean;
  readonly queueSize: number;
} {
  // Create p-throttle instance
  const throttler = pThrottle({
    limit,
    interval,
    strict: options?.strict,
    signal: options?.signal,
    onDelay: options?.onDelay
  });
  
  // Create throttled function
  const throttled = throttler(fn);
  
  return throttled as T & {
    isEnabled: boolean;
    readonly queueSize: number;
  };
}

/**
 * Creates a simple rate-limited function for backward compatibility
 * 
 * @deprecated Use throttle() with explicit limit and interval instead
 * @param fn - The function to throttle
 * @param ms - Minimum milliseconds between calls
 * @param options - Timer options
 * @returns A throttled version of the function
 */
export function createSimpleThrottle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number,
  options?: TimerOptions
): T & { cancel: () => void } {
  // For backward compatibility, create a simple 1-per-interval throttle
  const throttled = throttle(fn, 1, ms, {
    signal: options?.signal
  });
  
  // Add cancel method for compatibility
  const wrappedThrottled = ((...args: Parameters<T>) => {
    return throttled(...args);
  }) as T & { cancel: () => void };
  
  wrappedThrottled.cancel = () => {
    // p-throttle doesn't have a cancel method, but we can disable it
    throttled.isEnabled = false;
  };
  
  return wrappedThrottled;
}

/**
 * Polls a condition function until it returns true
 * @param condition - Function that returns true when polling should stop
 * @param interval - Milliseconds between polls
 * @param options - Polling options
 * @returns Promise that resolves when condition is met
 */
export async function poll(
  condition: () => boolean | Promise<boolean>,
  interval: number = 100,
  options?: TimerOptions & { timeout?: number }
): Promise<void> {
  const startTime = Date.now();
  const { timeout, signal } = options || {};
  
  while (true) {
    // Check abort signal
    if (signal?.aborted) {
      throw createAbortError();
    }
    
    // Check timeout
    if (timeout && Date.now() - startTime >= timeout) {
      throw new PollingError(`Polling timed out after ${timeout}ms`, {
        context: { timeout, elapsed: Date.now() - startTime }
      });
    }
    
    // Check condition
    if (await condition()) {
      return;
    }
    
    // Wait for next poll
    const timer = createManagedTimer(interval, signal ? { signal } : undefined);
    await timer.promise;
  }
}