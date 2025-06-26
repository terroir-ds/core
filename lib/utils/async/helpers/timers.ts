/**
 * @fileoverview Timer management utilities for async operations
 * @module @utils/async/helpers/timers
 */

import { createAbortError } from './abort';
import { createCleanupManager } from './cleanup';

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
      throw error;
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
 * Creates a debounced version of a function
 * @param fn - The function to debounce
 * @param ms - Milliseconds to wait
 * @param options - Timer options
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number,
  options?: TimerOptions
): T & { cancel: () => void } {
  let timer: ManagedTimer | null = null;
  
  const debounced = ((...args: Parameters<T>) => {
    // Cancel previous timer
    timer?.clear();
    
    // Create new timer
    timer = createManagedTimer(ms, options);
    
    // Execute function after delay
    timer.promise.then(
      () => fn(...args),
      () => {} // Ignore abort errors
    );
  }) as T & { cancel: () => void };
  
  debounced.cancel = () => {
    timer?.clear();
    timer = null;
  };
  
  return debounced;
}

/**
 * Creates a throttled version of a function
 * @param fn - The function to throttle
 * @param ms - Minimum milliseconds between calls
 * @param options - Throttle options
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number,
  options?: TimerOptions & { leading?: boolean; trailing?: boolean }
): T & { cancel: () => void } {
  let timer: ManagedTimer | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastCallTime = 0;
  
  const { leading = true, trailing = true } = options || {};
  
  const throttled = ((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;
    
    lastArgs = args;
    
    const execute = () => {
      lastCallTime = Date.now();
      if (lastArgs) {
        fn(...lastArgs);
        lastArgs = null;
      }
    };
    
    // Cancel any pending timer
    timer?.clear();
    
    if (timeSinceLastCall >= ms) {
      // Enough time has passed, execute immediately if leading
      if (leading) {
        execute();
      }
    }
    
    if (trailing && lastArgs) {
      // Schedule execution after remaining time
      const remainingTime = ms - timeSinceLastCall;
      timer = createManagedTimer(Math.max(0, remainingTime), options);
      timer.promise.then(
        () => execute(),
        () => {} // Ignore abort errors
      );
    }
  }) as T & { cancel: () => void };
  
  throttled.cancel = () => {
    timer?.clear();
    timer = null;
    lastArgs = null;
  };
  
  return throttled;
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
      throw new Error(`Polling timed out after ${timeout}ms`);
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