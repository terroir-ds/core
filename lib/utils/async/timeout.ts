/**
 * Timeout utilities for async operations
 * Provides robust timeout handling with proper cleanup
 */

import type { CancellableOptions, ErrorConstructor } from '@utils/types/async.types.js';
import { checkAborted, createAbortError } from './helpers/abort.js';
import { raceWithCleanup } from './helpers/race.js';
import { createCleanupManager } from './helpers/cleanup.js';
import { AsyncErrorMessages } from './helpers/messages.js';
import { createManagedTimer } from './helpers/timers.js';

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
  checkAborted(signal);

  if (promises.length === 0) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(AsyncErrorMessages.NO_PROMISES + ' and no fallback specified');
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