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
import pRetry from 'p-retry';
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
 * Retry a promise-returning function using p-retry
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