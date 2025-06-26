/**
 * Tests for timeout utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withTimeout, timeout, raceWithTimeout, TimeoutError } from '../timeout.js';
import { expectRejection, verifyRejection } from '@test/helpers/error-handling.js';

describe('timeout utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('withTimeout', () => {
    it('should resolve if promise completes before timeout', async () => {
      const promise = Promise.resolve('success');
      const result = await withTimeout(promise, 1000);
      expect(result).toBe('success');
    });

    it('should reject with TimeoutError if promise takes too long', async () => {
      const promise = new Promise(() => {}); // Never resolves
      const timeoutPromise = withTimeout(promise, 100);
      
      vi.advanceTimersByTime(100);
      
      await verifyRejection(timeoutPromise, {
        message: 'Operation timed out after 100ms',
        customCheck: (error) => error instanceof TimeoutError
      });
    });

    it('should use custom error message', async () => {
      const promise = new Promise(() => {});
      const timeoutPromise = withTimeout(promise, 100, {
        message: 'Custom timeout message'
      });
      
      vi.advanceTimersByTime(100);
      
      await expectRejection(timeoutPromise, 'Custom timeout message');
    });

    it('should use custom error message function', async () => {
      const promise = new Promise(() => {});
      const timeoutPromise = withTimeout(promise, 100, {
        message: (ms) => `Timed out waiting ${ms}ms`
      });
      
      vi.advanceTimersByTime(100);
      
      await expectRejection(timeoutPromise, 'Timed out waiting 100ms');
    });

    it('should use custom error class', async () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const promise = new Promise(() => {});
      const timeoutPromise = withTimeout(promise, 100, {
        errorClass: CustomError
      });
      
      vi.advanceTimersByTime(100);
      
      await verifyRejection(timeoutPromise, {
        customCheck: (error) => error instanceof CustomError
      });
    });

    it('should handle already aborted signal', async () => {
      const controller = new AbortController();
      controller.abort();
      
      const promise = Promise.resolve('value');
      
      await expectRejection(
        withTimeout(promise, 1000, { signal: controller.signal }),
        'Operation aborted'
      );
    });

    it('should abort on signal', async () => {
      const controller = new AbortController();
      const promise = new Promise(() => {});
      
      const timeoutPromise = withTimeout(promise, 1000, {
        signal: controller.signal
      });
      
      controller.abort();
      
      await expectRejection(timeoutPromise, 'Operation aborted');
    });

    it('should cleanup timeout when promise resolves', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      const promise = Promise.resolve('value');
      await withTimeout(promise, 1000);
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should cleanup listeners on abort', async () => {
      const controller = new AbortController();
      const removeEventListenerSpy = vi.spyOn(controller.signal, 'removeEventListener');
      
      const promise = Promise.resolve('value');
      await withTimeout(promise, 1000, { signal: controller.signal });
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('abort', expect.any(Function));
    });
  });

  describe('timeout', () => {
    it('should reject after specified time', async () => {
      const timeoutPromise = timeout(100);
      
      vi.advanceTimersByTime(100);
      
      await verifyRejection(timeoutPromise, {
        message: 'Timeout after 100ms',
        customCheck: (error) => error instanceof TimeoutError
      });
    });

    it('should use custom message', async () => {
      const timeoutPromise = timeout(100, { message: 'Custom message' });
      
      vi.advanceTimersByTime(100);
      
      await expectRejection(timeoutPromise, 'Custom message');
    });

    it('should handle already aborted signal', async () => {
      const controller = new AbortController();
      controller.abort();
      
      await expectRejection(
        timeout(1000, { signal: controller.signal }),
        'Operation aborted'
      );
    });

    it('should abort on signal', async () => {
      const controller = new AbortController();
      const timeoutPromise = timeout(1000, { signal: controller.signal });
      
      controller.abort();
      
      await expectRejection(timeoutPromise, 'Operation aborted');
    });

    it('should cleanup timeout on abort', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const controller = new AbortController();
      
      const timeoutPromise = timeout(1000, { signal: controller.signal });
      controller.abort();
      
      try {
        await timeoutPromise;
      } catch {
        // Expected to throw, just testing cleanup
      }
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('raceWithTimeout', () => {
    it('should resolve with first resolved promise', async () => {
      const promises = [
        new Promise(resolve => setTimeout(() => resolve('slow'), 200)),
        Promise.resolve('fast')
      ];
      
      const result = await raceWithTimeout(promises, 1000);
      expect(result).toBe('fast');
    });

    it('should reject with timeout if all promises are slow', async () => {
      const promises = [
        new Promise(() => {}),
        new Promise(() => {})
      ];
      
      const racePromise = raceWithTimeout(promises, 100);
      
      vi.advanceTimersByTime(100);
      
      await verifyRejection(racePromise, {
        customCheck: (error) => error instanceof TimeoutError
      });
    });

    it('should return fallback on timeout', async () => {
      const promises = [new Promise(() => {})];
      const racePromise = raceWithTimeout(promises, 100, { fallback: 'default' });
      
      vi.advanceTimersByTime(100);
      
      const result = await racePromise;
      expect(result).toBe('default');
    });

    it('should throw error when no promises and no fallback', async () => {
      await expectRejection(
        raceWithTimeout([], 100),
        'No promises provided and no fallback specified'
      );
    });

    it('should return fallback when no promises provided', async () => {
      const result = await raceWithTimeout([], 100, { fallback: 'default' });
      expect(result).toBe('default');
    });

    it('should handle already aborted signal', async () => {
      const controller = new AbortController();
      controller.abort();
      
      await expectRejection(
        raceWithTimeout([Promise.resolve('value')], 1000, {
          signal: controller.signal
        }),
        'Operation aborted'
      );
    });

    it('should propagate non-timeout errors', async () => {
      const error = new Error('Custom error');
      
      await expectRejection(
        raceWithTimeout([Promise.reject(error)], 1000),
        'Custom error'
      );
    });
  });

  describe('performance', () => {
    it('should handle many concurrent timeouts efficiently', async () => {
      const promises = Array.from({ length: 1000 }, (_, i) => 
        withTimeout(Promise.resolve(i), 1000)
      );
      
      const results = await Promise.all(promises);
      expect(results).toHaveLength(1000);
      expect(results[0]).toBe(0);
      expect(results[999]).toBe(999);
    });
  });
});