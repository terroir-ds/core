/**
 * Timeout utilities for async operations
 * Provides robust timeout handling with proper cleanup
 */

import type { CancellableOptions, ErrorConstructor } from '@utils/types/async.types.js';

export interface TimeoutOptions extends CancellableOptions {
  message?: string | ((ms: number) => string);
  errorClass?: ErrorConstructor;
}

/**
 * Default timeout error class
 */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Add a timeout to any promise
 * @param promise - The promise to wrap
 * @param ms - Timeout in milliseconds
 * @param options - Additional options
 * @returns Promise that rejects on timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  options?: TimeoutOptions
): Promise<T> {
  const { signal, message, errorClass = TimeoutError } = options ?? {};

  // Check if already aborted
  if (signal?.aborted) {
    throw new DOMException('Operation aborted', 'AbortError');
  }

  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timeoutId = setTimeout(() => {
      const errorMessage = typeof message === 'function' 
        ? message(ms) 
        : message ?? `Operation timed out after ${ms}ms`;
      reject(new errorClass(errorMessage));
    }, ms);

    // Cleanup on signal abort
    const cleanup = () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', cleanup);
    };

    // Handle abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        cleanup();
        reject(new DOMException('Operation aborted', 'AbortError'));
      }, { once: true });
    }

    // Ensure cleanup when promise settles
    promise.finally(cleanup);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Create a timeout promise that rejects after specified time
 * @param ms - Timeout in milliseconds
 * @param options - Additional options
 */
export function timeout(
  ms: number,
  options?: CancellableOptions & {
    message?: string;
  }
): Promise<never> {
  const { signal, message = `Timeout after ${ms}ms` } = options ?? {};

  return new Promise((_, reject) => {
    // Check if already aborted
    if (signal?.aborted) {
      reject(new DOMException('Operation aborted', 'AbortError'));
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new TimeoutError(message));
    }, ms);

    // Handle abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        reject(new DOMException('Operation aborted', 'AbortError'));
      }, { once: true });
    }
  });
}

/**
 * Race multiple promises with a timeout
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
  if (signal?.aborted) {
    throw new DOMException('Operation aborted', 'AbortError');
  }

  if (promises.length === 0) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error('No promises provided and no fallback specified');
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