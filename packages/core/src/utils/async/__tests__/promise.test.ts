/**
 * @module test/lib/utils/async/promise
 * 
 * Unit tests for promise manipulation utilities
 * 
 * Tests promise utilities including:
 * - defer for creating deferred promises
 * - retry with exponential backoff and custom predicates
 * - promiseWithFallback for timeout handling
 * - allSettledWithTimeout for bounded parallel operations
 * - firstSuccessful for trying multiple promise factories
 * - Abort signal support across all utilities
 * - Error aggregation with AggregateError
 * - Integration between utilities (retry + defer)
 * - Edge cases (empty arrays, zero delays)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  defer,
  retry,
  promiseWithFallback,
  allSettledWithTimeout,
  firstSuccessful
} from '@utils/async/promise';
import { getMessage } from '@utils/errors/messages';
import { expectRejection, verifyRejection } from '@test/helpers/error-handling';

describe('promise utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('defer', () => {
    it('should create deferred promise', () => {
      const deferred = defer<string>();
      
      expect(deferred.promise).toBeInstanceOf(Promise);
      expect(typeof deferred.resolve).toBe('function');
      expect(typeof deferred.reject).toBe('function');
    });

    it('should resolve deferred promise', async () => {
      const deferred = defer<string>();
      
      deferred.resolve('success');
      
      const result = await deferred.promise;
      expect(result).toBe('success');
    });

    it('should reject deferred promise', async () => {
      const deferred = defer<string>();
      
      deferred.reject(new Error('failure'));
      
      await expectRejection(deferred.promise, 'failure');
    });

    it('should handle promise-like values', async () => {
      const deferred = defer<string>();
      
      deferred.resolve(Promise.resolve('async success'));
      
      const result = await deferred.promise;
      expect(result).toBe('async success');
    });
  });

  describe('retry', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      
      const result = await retry(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      vi.useFakeTimers();
      
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');
      
      const promise = retry(fn, { attempts: 3, delay: 100 });
      
      // Run all timers to completion
      await vi.runAllTimersAsync();
      
      const result = await promise;
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
      
      vi.useRealTimers();
    });

    it('should fail after max attempts', async () => {
      vi.useFakeTimers();
      
      // Handle expected background rejections from retry logic
      const originalHandlers = process.listeners('unhandledRejection');
      process.removeAllListeners('unhandledRejection');
      process.on('unhandledRejection', (reason: unknown) => {
        if (reason instanceof Error && reason.message === 'persistent failure') {
          return; // Expected retry rejections
        }
        console.error('Unexpected rejection:', reason);
      });
      
      try {
        const fn = vi.fn().mockRejectedValue(new Error('persistent failure'));
        const promise = retry(fn, { attempts: 3, delay: 10 });
        
        await vi.runAllTimersAsync();
        await expectRejection(promise, 'persistent failure');
        expect(fn).toHaveBeenCalledTimes(3);
      } finally {
        vi.useRealTimers();
        process.removeAllListeners('unhandledRejection');
        originalHandlers.forEach(handler => {
          process.on('unhandledRejection', handler as NodeJS.UnhandledRejectionListener);
        });
      }
    }, 10000);

    it('should use exponential backoff', async () => {
      vi.useFakeTimers();
      
      // Handle expected background rejections from retry logic
      const originalHandlers = process.listeners('unhandledRejection');
      process.removeAllListeners('unhandledRejection');
      process.on('unhandledRejection', (reason: unknown) => {
        if (reason instanceof Error && reason.message === 'fail') {
          return; // Expected retry rejections
        }
        console.error('Unexpected rejection:', reason);
      });
      
      try {
        const fn = vi.fn().mockRejectedValue(new Error('fail'));
        const delays: number[] = [];
        
        const backoff = (attempt: number) => {
          const delay = Math.pow(2, attempt - 1) * 100;
          delays.push(delay);
          return delay;
        };
        
        const promise = retry(fn, { 
          attempts: 4, 
          delay: backoff 
        });
        
        await vi.runAllTimersAsync();
        await expectRejection(promise, 'fail');
        expect(delays).toEqual([100, 200, 400]);
      } finally {
        vi.useRealTimers();
        process.removeAllListeners('unhandledRejection');
        originalHandlers.forEach(handler => {
          process.on('unhandledRejection', handler as NodeJS.UnhandledRejectionListener);
        });
      }
    });
    it('should respect shouldRetry predicate', async () => {
      vi.useFakeTimers();
      
      // Handle expected background rejections from retry logic
      const originalHandlers = process.listeners('unhandledRejection');
      process.removeAllListeners('unhandledRejection');
      process.on('unhandledRejection', (reason: unknown) => {
        if (reason instanceof Error && (reason.message === 'retryable' || reason.message === 'fatal')) {
          return; // Expected retry rejections
        }
        console.error('Unexpected rejection:', reason);
      });
      
      try {
        const fn = vi.fn()
          .mockRejectedValueOnce(new Error('retryable'))
          .mockRejectedValueOnce(new Error('fatal'))
          .mockResolvedValue('success');
        
        const shouldRetry = (error: unknown) => {
          return error instanceof Error && error.message === 'retryable';
        };
        
        const promise = retry(fn, { 
          attempts: 3, 
          delay: 0,
          shouldRetry 
        });
        
        await vi.runAllTimersAsync();
        await expectRejection(promise, 'fatal');
        expect(fn).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
        process.removeAllListeners('unhandledRejection');
        originalHandlers.forEach(handler => {
          process.on('unhandledRejection', handler as NodeJS.UnhandledRejectionListener);
        });
      }
    }, 15000);

    it('should handle abort signal', async () => {
      const controller = new AbortController();
      const fn = vi.fn().mockResolvedValue('success');
      
      controller.abort();
      
      await verifyRejection(
        retry(fn, { signal: controller.signal }),
        { 
          message: 'Operation aborted',
          name: 'AbortError',
          customCheck: (error) => error instanceof DOMException || error.name === 'AbortError'
        }
      );
      
      expect(fn).not.toHaveBeenCalled();
    });

    it('should abort during retry', async () => {
      const controller = new AbortController();
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      
      const promise = retry(fn, { 
        attempts: 3, 
        delay: 100,
        signal: controller.signal 
      });
      
      // Let first attempt fail
      await Promise.resolve();
      
      // Abort during delay
      controller.abort();
      
      await expectRejection(promise, 'The operation was aborted.');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle zero delay', async () => {
      vi.useFakeTimers();
      
      try {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');
      
      const promise = retry(fn, { attempts: 2, delay: 0 });
      
      await vi.runAllTimersAsync();
      const result = await promise;
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('promiseWithFallback', () => {
    it('should return promise result on success', async () => {
      const promise = Promise.resolve('success');
      
      const result = await promiseWithFallback(promise, 'fallback');
      
      expect(result).toBe('success');
    });

    it('should return fallback on failure', async () => {
      const promise = Promise.reject(new Error('fail'));
      
      const result = await promiseWithFallback(promise, 'fallback');
      
      expect(result).toBe('fallback');
    });

    it('should execute fallback function', async () => {
      const promise = Promise.reject(new Error('fail'));
      const fallback = vi.fn().mockReturnValue('computed fallback');
      
      const result = await promiseWithFallback(promise, fallback);
      
      expect(result).toBe('computed fallback');
      expect(fallback).toHaveBeenCalled();
    });

    it('should handle async fallback function', async () => {
      vi.useFakeTimers();
      
      const promise = Promise.reject(new Error('fail'));
      const fallback = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async fallback';
      };
      
      const resultPromise = promiseWithFallback(promise, fallback);
      
      await vi.runAllTimersAsync();
      const result = await resultPromise;
      
      expect(result).toBe('async fallback');
      
      vi.useRealTimers();
    });

    it('should apply timeout', async () => {
      const promise = new Promise(() => {}); // Never resolves
      
      const resultPromise = promiseWithFallback(promise, 'timeout fallback', 100);
      
      vi.advanceTimersByTime(100);
      const result = await resultPromise;
      
      expect(result).toBe('timeout fallback');
    });

    it('should return result if completes before timeout', async () => {
      const promise = new Promise<string>(resolve => {
        setTimeout(() => resolve('quick result'), 50);
      });
      
      const resultPromise = promiseWithFallback(promise, 'fallback', 100);
      
      vi.advanceTimersByTime(50);
      const result = await resultPromise;
      
      expect(result).toBe('quick result');
    });
  });

  describe('allSettledWithTimeout', () => {
    it('should return all results', async () => {
      const promises = [
        Promise.resolve('success 1'),
        Promise.reject(new Error('fail')),
        Promise.resolve('success 2')
      ];
      
      const results = await allSettledWithTimeout(promises, 1000);
      
      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ status: 'fulfilled', value: 'success 1' });
      expect(results[1]).toEqual({ 
        status: 'rejected', 
        reason: expect.objectContaining({ message: 'fail' }) 
      });
      expect(results[2]).toEqual({ status: 'fulfilled', value: 'success 2' });
    });

    it('should timeout slow promises', async () => {
      const promises = [
        Promise.resolve('fast'),
        new Promise(() => {}), // Never resolves
        new Promise(resolve => setTimeout(() => resolve('slow'), 200))
      ];
      
      const resultsPromise = allSettledWithTimeout(promises, 100);
      
      vi.advanceTimersByTime(100);
      const results = await resultsPromise;
      
      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ status: 'fulfilled', value: 'fast' });
      expect(results[1]).toEqual({ 
        status: 'rejected', 
        reason: expect.objectContaining({ message: 'Timeout after 100ms' }) 
      });
      expect(results[2]).toEqual({ 
        status: 'rejected', 
        reason: expect.objectContaining({ message: 'Timeout after 100ms' }) 
      });
    });

    it('should handle empty array', async () => {
      const results = await allSettledWithTimeout([], 100);
      
      expect(results).toEqual([]);
    });
  });

  describe('firstSuccessful', () => {
    it('should return first successful result', async () => {
      const factories = [
        () => Promise.reject(new Error('fail 1')),
        () => Promise.resolve('success'),
        () => Promise.resolve('not reached')
      ];
      
      const result = await firstSuccessful(factories);
      
      expect(result).toBe('success');
    });

    it('should try all factories until success', async () => {
      const attempts: number[] = [];
      const factories = [
        () => {
          attempts.push(1);
          return Promise.reject(new Error('fail 1'));
        },
        () => {
          attempts.push(2);
          return Promise.reject(new Error('fail 2'));
        },
        () => {
          attempts.push(3);
          return Promise.resolve('finally success');
        }
      ];
      
      const result = await firstSuccessful(factories);
      
      expect(result).toBe('finally success');
      expect(attempts).toEqual([1, 2, 3]);
    });

    it('should throw AggregateError if all fail', async () => {
      const factories = [
        () => Promise.reject(new Error('fail 1')),
        () => Promise.reject(new Error('fail 2')),
        () => Promise.reject(new Error('fail 3'))
      ];
      
      await expect(firstSuccessful(factories))
        .rejects.toThrow(AggregateError);
      
      try {
        await firstSuccessful(factories);
      } catch (error) {
        expect(error).toBeInstanceOf(AggregateError);
        expect((error as AggregateError).errors).toHaveLength(3);
        expect((error as AggregateError).message).toBe(getMessage('OPERATION_FAILED', 3));
      }
    });

    it('should handle empty array', async () => {
      await expect(firstSuccessful([]))
        .rejects.toThrow(getMessage('VALIDATION_REQUIRED', 'promise factories'));
    });

    it('should handle abort signal', async () => {
      const controller = new AbortController();
      const factories = [() => Promise.resolve('success')];
      
      controller.abort();
      
      await expect(
        firstSuccessful(factories, { signal: controller.signal })
      ).rejects.toThrow(getMessage('OPERATION_ABORTED'));
    });

    it('should abort during execution', async () => {
      const controller = new AbortController();
      const attempts: number[] = [];
      
      const factories = [
        () => {
          attempts.push(1);
          return Promise.reject(new Error('fail 1'));
        },
        async () => {
          attempts.push(2);
          controller.abort('Operation aborted');
          // Since abort is called before resolution, the signal check after resolution should catch it
          return 'success';
        }
      ];
      
      await expect(
        firstSuccessful(factories, { signal: controller.signal })
      ).rejects.toThrow(getMessage('OPERATION_ABORTED'));
      
      expect(attempts).toEqual([1, 2]);
    });
  });

  describe('integration', () => {
    it('should combine retry with defer', async () => {
      vi.useFakeTimers();
      
      const deferred = defer<string>();
      let attempts = 0;
      
      const fn = () => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('not yet'));
        }
        return deferred.promise;
      };
      
      const retryPromise = retry(fn, { attempts: 5, delay: 10 });
      
      // Run timers and resolve deferred
      await vi.runAllTimersAsync();
      deferred.resolve('deferred success');
      
      const result = await retryPromise;
      expect(result).toBe('deferred success');
      expect(attempts).toBe(3);
      
      vi.useRealTimers();
    });
  });
});