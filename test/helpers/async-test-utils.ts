/**
 * Shared test utilities for async operations
 * Provides common patterns for testing promises, timers, and cancellation
 */

import { beforeEach, afterEach, vi } from 'vitest';

/**
 * Setup fake timers for testing with automatic cleanup
 * Call this at the module level to apply to all tests in the file
 */
export function useFakeTimers(): void {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
}

/**
 * Wait for the next tick of the event loop
 * Useful for ensuring promises have settled
 */
export async function waitForNextTick(): Promise<void> {
  await Promise.resolve();
}

/**
 * Advance timers and wait for promises to settle
 * Combines timer advancement with promise resolution
 */
export async function advanceAndSettle(ms: number): Promise<void> {
  vi.advanceTimersByTime(ms);
  await vi.runAllTimersAsync();
  await waitForNextTick();
}

/**
 * Create an AbortController that's already aborted
 * @param reason - Optional abort reason
 */
export function createAbortedController(reason?: unknown): AbortController {
  const controller = new AbortController();
  controller.abort(reason);
  return controller;
}

/**
 * Track whether a promise has resolved or rejected
 * @param promise - Promise to track
 * @returns Object with state tracking methods
 */
export function trackPromiseState<T>(promise: Promise<T>): {
  isResolved: () => boolean;
  isRejected: () => boolean;
  isPending: () => boolean;
  getResult: () => T | undefined;
  getError: () => unknown;
} {
  let resolved = false;
  let rejected = false;
  let result: T | undefined;
  let error: unknown;

  promise
    .then((value) => {
      resolved = true;
      result = value;
    })
    .catch((err) => {
      rejected = true;
      error = err;
    });

  return {
    isResolved: () => resolved,
    isRejected: () => rejected,
    isPending: () => !resolved && !rejected,
    getResult: () => result,
    getError: () => error,
  };
}

/**
 * Create a mock function with sequential results
 * @param results - Array of results (values or errors)
 */
export function mockSequentialResults<T>(
  results: Array<{ type: 'resolve'; value: T } | { type: 'reject'; error: unknown }>
) {
  const fn = vi.fn();
  
  results.forEach((result) => {
    if (result.type === 'resolve') {
      fn.mockResolvedValueOnce(result.value);
    } else {
      fn.mockRejectedValueOnce(result.error);
    }
  });
  
  return fn;
}

/**
 * Create a mock function that resolves after a delay
 * @param value - Value to resolve with
 * @param delay - Delay in milliseconds
 */
export function createDelayedMock<T>(value: T, delay: number): () => Promise<T> {
  return async () => {
    await new Promise(resolve => setTimeout(resolve, delay));
    return value;
  };
}

/**
 * Create a mock function that rejects after a delay
 * @param error - Error to reject with
 * @param delay - Delay in milliseconds
 */
export function createDelayedRejectMock(error: unknown, delay: number): () => Promise<never> {
  return async () => {
    await new Promise(resolve => setTimeout(resolve, delay));
    throw error;
  };
}

/**
 * Wait for a specific number of event loop ticks
 * @param ticks - Number of ticks to wait
 */
export async function waitForTicks(ticks: number): Promise<void> {
  for (let i = 0; i < ticks; i++) {
    await waitForNextTick();
  }
}

/**
 * Create a promise that never resolves
 * Useful for testing timeout behavior
 */
export function neverResolve<T = never>(): Promise<T> {
  return new Promise(() => {
    // Never resolves
  });
}

/**
 * Create a promise that resolves after all other pending promises
 * Useful for ensuring all async operations have completed
 */
export async function afterAllPending(): Promise<void> {
  // Use setImmediate if available (Node.js), otherwise use setTimeout
  await new Promise<void>(resolve => {
    if (typeof setImmediate === 'function') {
      setImmediate(resolve);
    } else {
      setTimeout(resolve, 0);
    }
  });
}

/**
 * Assert that a promise is still pending (hasn't resolved or rejected)
 * @param promise - Promise to check
 * @param timeout - How long to wait before considering it pending
 */
export async function assertPending<T>(
  promise: Promise<T>,
  timeout: number = 10
): Promise<void> {
  const state = trackPromiseState(promise);
  
  await new Promise(resolve => setTimeout(resolve, timeout));
  
  if (!state.isPending()) {
    throw new Error('Promise was expected to be pending but has settled');
  }
}

/**
 * Create a controllable async operation
 * Allows manual control over when the operation completes
 */
export function createControllableOperation<T>(): {
  operation: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  
  const operation = () => new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  
  return { operation, resolve, reject };
}