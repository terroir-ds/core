/**
 * Promise manipulation utilities
 * Provides advanced promise patterns and helpers
 */

import type {
  CancellableOptions,
  Deferred as DeferredBase,
  RetryDelay,
  RetryPredicate,
  AsyncFactory
} from '@utils/types/async.types.js';
import { delay } from './delay.js';
import { getMessage } from '@utils/errors/messages.js';
import { checkAborted } from './helpers/abort.js';

// Re-export Deferred for backward compatibility
export type Deferred<T> = DeferredBase<T>;

export interface RetryOptions extends CancellableOptions {
  attempts?: number;
  delay?: RetryDelay;
  shouldRetry?: RetryPredicate;
}

export interface FirstSuccessfulOptions extends CancellableOptions {}

/**
 * Create a deferred promise
 * Useful when you need to control promise resolution externally
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
 * Retry a promise-returning function
 * @param fn - Function that returns a promise
 * @param options - Retry configuration
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

  let lastError: unknown;
  
  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (signal?.aborted) {
      throw new DOMException('Operation aborted', 'AbortError');
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (attempt < attempts && shouldRetry(error, attempt)) {
        // Calculate delay
        const delayTime = typeof delayMs === 'function' 
          ? delayMs(attempt) 
          : delayMs;
        
        if (delayTime > 0) {
          await delay(delayTime, signal ? { signal } : undefined);
        }
      } else {
        break;
      }
    }
  }
  
  throw lastError;
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
    throw new Error(getMessage('VALIDATION_REQUIRED', 'promise factories'));
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