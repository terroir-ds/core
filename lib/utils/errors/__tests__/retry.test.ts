/**
 * Tests for retry logic and resilience patterns
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  retry,
  withTimeout,
  CircuitBreaker,
  retryWithCircuitBreaker,
  batchRetry,
  makeRetryable,
} from '../retry.js';
import { getMessage } from '../messages.js';
import { suppressWarningsInErrorTests } from './test-utils.js';

describe('Retry Logic', () => {
  // Set up clean warning suppression for error tests
  suppressWarningsInErrorTests();
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('retry()', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      
      const result = await retry(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');
      
      const promise = retry(fn, { maxAttempts: 3, initialDelay: 100 });
      
      // Process all timers to completion
      await vi.runAllTimersAsync();
      
      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Always fails'));
      
      const promise = retry(fn, { maxAttempts: 2, initialDelay: 10 });
      
      // Process all timers and handle the promise rejection together
      const [, result] = await Promise.allSettled([
        vi.runAllTimersAsync(),
        promise
      ]);
      
      expect(result.status).toBe('rejected');
      if (result.status === 'rejected') {
        expect(result.reason).toMatchObject({
          message: getMessage('OPERATION_FAILED', 2),
          name: 'NetworkError'
        });
      }
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should apply exponential backoff', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Fail'));
      const delays: number[] = [];
      
      const promise = retry(fn, {
        maxAttempts: 4,
        initialDelay: 100,
        backoffFactor: 2,
        jitter: false,
        onRetry: (_error, _attempt, delay) => {
          delays.push(delay);
        },
      });
      
      const [, result] = await Promise.allSettled([
        vi.runAllTimersAsync(),
        promise
      ]);
      
      expect(result.status).toBe('rejected');
      expect(delays).toEqual([100, 200, 400]); // 100, 100*2, 100*4
    });

    it('should respect max delay', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Fail'));
      const delays: number[] = [];
      
      const promise = retry(fn, {
        maxAttempts: 4,
        initialDelay: 100,
        backoffFactor: 10,
        maxDelay: 500,
        jitter: false,
        onRetry: (_error, _attempt, delay) => {
          delays.push(delay);
        },
      });
      
      const [, result] = await Promise.allSettled([
        vi.runAllTimersAsync(),
        promise
      ]);
      
      expect(result.status).toBe('rejected');
      expect(delays).toEqual([100, 500, 500]); // Capped at maxDelay
    });

    it('should add jitter to delays', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Fail'));
      const delays: number[] = [];
      
      const promise = retry(fn, {
        maxAttempts: 3,
        initialDelay: 100,
        jitter: true,
        onRetry: (_error, _attempt, delay) => {
          delays.push(delay);
        },
      });
      
      const [, result] = await Promise.allSettled([
        vi.runAllTimersAsync(),
        promise
      ]);
      
      expect(result.status).toBe('rejected');
      // With jitter, delays should be within ±25% of base delay
      expect(delays[0]).toBeGreaterThanOrEqual(75);
      expect(delays[0]).toBeLessThanOrEqual(125);
    });

    it('should respect custom retry predicate', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Retryable'))
        .mockRejectedValueOnce(new Error('Not retryable'))
        .mockResolvedValue('success');
      
      const shouldRetry = (error: unknown) => {
        return error instanceof Error && error.message === 'Retryable';
      };
      
      const promise = retry(fn, {
        maxAttempts: 3,
        initialDelay: 10,
        shouldRetry,
      });
      
      await vi.runAllTimersAsync();
      
      await expect(promise).rejects.toMatchObject({
        name: 'NetworkError',
        cause: expect.objectContaining({
          message: 'Not retryable'
        })
      });
      expect(fn).toHaveBeenCalledTimes(2); // First attempt + one retry
    });

    it('should handle cancellation via AbortSignal', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Fail'));
      const controller = new AbortController();
      
      const promise = retry(fn, {
        maxAttempts: 5,
        initialDelay: 100,
        signal: controller.signal,
      });
      
      // Cancel after first attempt
      setTimeout(() => controller.abort('User cancelled'), 50);
      await vi.runAllTimersAsync();
      
      await expect(promise).rejects.toThrow('User cancelled');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockResolvedValue('success');
      
      const onRetry = vi.fn();
      
      const promise = retry(fn, {
        maxAttempts: 2,
        initialDelay: 10,
        jitter: false, // Disable jitter for predictable delay
        onRetry,
      });
      
      await vi.runAllTimersAsync();
      await promise;
      
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        expect.any(Error),
        1, // attempt
        10 // delay
      );
    });
  });

  describe('withTimeout()', () => {
    it('should resolve if operation completes in time', async () => {
      const promise = new Promise(resolve => {
        setTimeout(() => resolve('success'), 100);
      });
      
      const resultPromise = withTimeout(promise, 200);
      await vi.advanceTimersByTimeAsync(100);
      
      const result = await resultPromise;
      expect(result).toBe('success');
    });

    it('should reject if operation times out', async () => {
      const promise = new Promise(resolve => {
        setTimeout(() => resolve('too late'), 200);
      });
      
      const resultPromise = withTimeout(promise, 100);
      await vi.advanceTimersByTimeAsync(100);
      
      await expect(resultPromise).rejects.toThrow(getMessage('OPERATION_TIMEOUT', 100));
    });

    it('should respect abort signal', async () => {
      const controller = new AbortController();
      const promise = new Promise(resolve => {
        setTimeout(() => resolve('success'), 200);
      });
      
      const resultPromise = withTimeout(promise, 300, controller.signal);
      
      // Abort before timeout
      await vi.advanceTimersByTimeAsync(50);
      controller.abort('User cancelled');
      
      await expect(resultPromise).rejects.toThrow('User cancelled');
    });

    it('should clean up timeout on success', async () => {
      const promise = Promise.resolve('instant');
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
      
      await withTimeout(promise, 1000);
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('CircuitBreaker', () => {
    it('should allow requests when closed', async () => {
      const breaker = new CircuitBreaker();
      const fn = vi.fn().mockResolvedValue('success');
      
      const result = await breaker.execute(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalled();
      expect(breaker.getState()).toBe('closed');
    });

    it('should open after failure threshold', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        timeWindow: 60000,
      });
      
      const fn = vi.fn().mockRejectedValue(new Error('Fail'));
      
      // Fail 3 times to open circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow('Fail');
      }
      
      expect(breaker.getState()).toBe('open');
      
      // Next request should fail immediately
      await expect(breaker.execute(fn)).rejects.toThrow(getMessage('CIRCUIT_OPEN'));
      expect(fn).toHaveBeenCalledTimes(3); // Not called for 4th attempt
    });

    it('should move to half-open after cooldown', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        cooldownPeriod: 1000,
      });
      
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success');
      
      // Open circuit
      await expect(breaker.execute(fn)).rejects.toThrow();
      expect(breaker.getState()).toBe('open');
      
      // Wait for cooldown
      await vi.advanceTimersByTimeAsync(1000);
      
      // Should move to half-open and allow request
      const result = await breaker.execute(fn);
      expect(result).toBe('success');
      expect(breaker.getState()).toBe('half-open');
    });

    it('should close after success threshold in half-open', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        successThreshold: 2,
        cooldownPeriod: 100,
      });
      
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success');
      
      // Open circuit
      await expect(breaker.execute(fn)).rejects.toThrow();
      
      // Wait for cooldown
      await vi.advanceTimersByTimeAsync(100);
      
      // Succeed twice to close
      await breaker.execute(fn);
      expect(breaker.getState()).toBe('half-open');
      
      await breaker.execute(fn);
      expect(breaker.getState()).toBe('closed');
    });

    it('should re-open on failure in half-open', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 1,
        cooldownPeriod: 100,
      });
      
      const fn = vi.fn().mockRejectedValue(new Error('Always fails'));
      
      // Open circuit
      await expect(breaker.execute(fn)).rejects.toThrow();
      expect(breaker.getState()).toBe('open');
      
      // Wait for cooldown
      await vi.advanceTimersByTimeAsync(100);
      
      // Fail in half-open state
      await expect(breaker.execute(fn)).rejects.toThrow();
      expect(breaker.getState()).toBe('open');
    });

    it('should respect time window for failures', async () => {
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        timeWindow: 1000,
      });
      
      const fn = vi.fn().mockRejectedValue(new Error('Fail'));
      
      // Two failures
      await expect(breaker.execute(fn)).rejects.toThrow();
      await expect(breaker.execute(fn)).rejects.toThrow();
      
      // Wait for failures to expire
      await vi.advanceTimersByTimeAsync(1100);
      
      // Should still be closed (old failures expired)
      expect(breaker.getState()).toBe('closed');
      
      // New failure shouldn't open circuit
      await expect(breaker.execute(fn)).rejects.toThrow();
      expect(breaker.getState()).toBe('closed');
    });

    it('should provide statistics', () => {
      const breaker = new CircuitBreaker({ name: 'TestBreaker' });
      
      const stats = breaker.getStats();
      
      expect(stats).toMatchObject({
        name: 'TestBreaker',
        state: 'closed',
        failures: 0,
        timeWindow: expect.any(Number),
        failureThreshold: expect.any(Number),
      });
    });

    it('should reset circuit', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 1 });
      const fn = vi.fn().mockRejectedValue(new Error('Fail'));
      
      // Open circuit
      await expect(breaker.execute(fn)).rejects.toThrow();
      expect(breaker.getState()).toBe('open');
      
      // Reset
      breaker.reset();
      expect(breaker.getState()).toBe('closed');
      
      // Should work again
      fn.mockResolvedValue('success');
      const result = await breaker.execute(fn);
      expect(result).toBe('success');
    });
  });

  describe('retryWithCircuitBreaker()', () => {
    it('should combine retry and circuit breaker', async () => {
      const breaker = new CircuitBreaker();
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success');
      
      const promise = retryWithCircuitBreaker(
        fn,
        breaker,
        { maxAttempts: 2, initialDelay: 10 }
      );
      
      await vi.runAllTimersAsync();
      
      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should fail if circuit opens', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 1 });
      const fn = vi.fn().mockRejectedValue(new Error('Always fails'));
      
      // This will open the circuit
      const promise1 = retryWithCircuitBreaker(fn, breaker, { maxAttempts: 3, initialDelay: 10 });
      await vi.runAllTimersAsync();
      await expect(promise1).rejects.toThrow();
      
      // Circuit should be open, next call fails immediately
      await expect(
        retryWithCircuitBreaker(fn, breaker)
      ).rejects.toThrow(getMessage('CIRCUIT_OPEN'));
    });
  });

  describe('batchRetry()', () => {
    it('should process items in batches', async () => {
      const items = [1, 2, 3, 4, 5];
      const fn = vi.fn().mockImplementation(async (item) => item * 2);
      
      const results = await batchRetry(items, fn, {
        concurrency: 2,
        maxAttempts: 1,
      });
      
      expect(results).toHaveLength(5);
      expect(results.map(r => r.result)).toEqual([2, 4, 6, 8, 10]);
      expect(fn).toHaveBeenCalledTimes(5);
    });

    it('should retry failed items', async () => {
      const items = [1, 2, 3];
      let callCount = 0;
      const fn = vi.fn().mockImplementation(async (item) => {
        callCount++;
        if (callCount === 1 && item === 1) {
          throw new Error('Fail');
        }
        return item;
      });
      
      const promise = batchRetry(items, fn, {
        concurrency: 2,
        maxAttempts: 2,
        initialDelay: 10,
      });
      
      await vi.runAllTimersAsync();
      
      const results = await promise;
      
      // Sort results by item for consistent testing
      results.sort((a, b) => a.item - b.item);
      
      expect(results).toMatchObject([
        { item: 1, result: 1 },
        { item: 2, result: 2 },
        { item: 3, result: 3 },
      ]);
    });

    it('should capture errors for failed items', async () => {
      const items = [1, 2];
      const fn = vi.fn()
        .mockResolvedValueOnce(1)
        .mockRejectedValue(new Error('Item 2 failed'));
      
      const promise = batchRetry(items, fn, {
        maxAttempts: 2,
        initialDelay: 10,
      });
      
      await vi.runAllTimersAsync();
      
      const results = await promise;
      expect(results).toMatchObject([
        { item: 1, result: 1 },
        { item: 2, error: expect.any(Error) },
      ]);
      expect(results[1]?.error?.message).toContain(getMessage('OPERATION_FAILED', 2));
    });
  });

  describe('makeRetryable()', () => {
    it('should make function retryable', async () => {
      const originalFn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success');
      
      const retryableFn = makeRetryable(originalFn, {
        maxAttempts: 2,
        initialDelay: 10,
      });
      
      const promise = retryableFn('arg1', 'arg2');
      await vi.advanceTimersByTimeAsync(100);
      
      const result = await promise;
      expect(result).toBe('success');
      expect(originalFn).toHaveBeenCalledTimes(2);
      expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should preserve function signature', async () => {
      const originalFn = async (a: number, b: string): Promise<string> => {
        return `${a}-${b}`;
      };
      
      const retryableFn = makeRetryable(originalFn as (...args: unknown[]) => Promise<unknown>);
      const result = await retryableFn(42, 'test');
      
      expect(result).toBe('42-test');
    });
  });
});