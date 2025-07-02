/**
 * @module test/lib/utils/async/helpers/rate-limit
 * 
 * Unit tests for rate limiting utilities
 * 
 * Tests rate limiting functionality including:
 * - TokenBucket algorithm with refill rates
 * - RateLimiter with execute and wrap methods
 * - createRateLimiter helper function
 * - SlidingWindowRateLimiter for time-based limits
 * - Token acquisition (sync and async)
 * - Wait time calculations
 * - Burst capacity handling
 * - Abort signal support
 * - Window sliding behavior
 * - Reset functionality
 * - Parameter validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  TokenBucket,
  RateLimiter,
  createRateLimiter,
  SlidingWindowRateLimiter,
} from '@utils/async/helpers/rate-limit';

describe('rate-limit helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('TokenBucket', () => {
    it('should create with initial tokens', () => {
      const bucket = new TokenBucket(10, 5);
      expect(bucket.getAvailableTokens()).toBe(10);
    });

    it('should validate constructor parameters', () => {
      expect(() => new TokenBucket(0, 5)).toThrow('maxTokens must be positive');
      expect(() => new TokenBucket(-1, 5)).toThrow('maxTokens must be positive');
      expect(() => new TokenBucket(10, 0)).toThrow('refillRate must be positive');
      expect(() => new TokenBucket(10, -1)).toThrow('refillRate must be positive');
    });

    it('should acquire tokens synchronously when available', () => {
      const bucket = new TokenBucket(10, 5);
      
      expect(bucket.tryAcquire(3)).toBe(true);
      expect(bucket.getAvailableTokens()).toBe(7);
      
      expect(bucket.tryAcquire(7)).toBe(true);
      expect(bucket.getAvailableTokens()).toBe(0);
      
      expect(bucket.tryAcquire(1)).toBe(false);
    });

    it('should validate acquire count', () => {
      const bucket = new TokenBucket(10, 5);
      
      expect(() => bucket.tryAcquire(0)).toThrow('Token count must be positive');
      expect(() => bucket.tryAcquire(-1)).toThrow('Token count must be positive');
    });

    it('should refill tokens over time', () => {
      const bucket = new TokenBucket(10, 5); // 5 tokens per second
      
      bucket.tryAcquire(10); // Use all tokens
      expect(bucket.getAvailableTokens()).toBe(0);
      
      vi.advanceTimersByTime(1000); // 1 second
      expect(bucket.getAvailableTokens()).toBe(5);
      
      vi.advanceTimersByTime(1000); // Another second
      expect(bucket.getAvailableTokens()).toBe(10); // Capped at max
      
      vi.advanceTimersByTime(1000); // Another second
      expect(bucket.getAvailableTokens()).toBe(10); // Still capped
    });

    it('should calculate wait time correctly', () => {
      const bucket = new TokenBucket(10, 5); // 5 tokens per second
      
      bucket.tryAcquire(10); // Use all tokens
      
      expect(bucket.getWaitTime(1)).toBe(200); // 1 token / 5 per second = 0.2s
      expect(bucket.getWaitTime(5)).toBe(1000); // 5 tokens / 5 per second = 1s
      expect(bucket.getWaitTime(10)).toBe(2000); // 10 tokens / 5 per second = 2s
      
      vi.advanceTimersByTime(500);
      expect(bucket.getWaitTime(1)).toBe(0); // Should have 2.5 tokens
      expect(bucket.getWaitTime(3)).toBe(100); // Need 0.5 more tokens
    });

    it('should wait for tokens asynchronously', async () => {
      const bucket = new TokenBucket(10, 5);
      
      bucket.tryAcquire(10); // Use all tokens
      
      const promise = bucket.acquire(5);
      
      vi.advanceTimersByTime(999);
      await vi.runAllTimersAsync();
      
      // Should still be waiting
      let resolved = false;
      promise.then(() => { resolved = true; });
      expect(resolved).toBe(false);
      
      vi.advanceTimersByTime(1);
      await vi.runAllTimersAsync();
      await promise;
      
      expect(bucket.getAvailableTokens()).toBe(0);
    });

    it('should handle abort signal', async () => {
      const bucket = new TokenBucket(10, 5);
      const controller = new AbortController();
      
      bucket.tryAcquire(10); // Use all tokens
      
      const promise = bucket.acquire(5, { signal: controller.signal });
      
      vi.advanceTimersByTime(500);
      controller.abort();
      
      await expect(promise).rejects.toThrow('Operation aborted');
    });

    it('should handle max wait timeout', async () => {
      const bucket = new TokenBucket(10, 5);
      
      bucket.tryAcquire(10); // Use all tokens
      
      const promise = bucket.acquire(5, { maxWaitMs: 500 });
      
      vi.advanceTimersByTime(600);
      await vi.runAllTimersAsync();
      
      await expect(promise).rejects.toThrow(/Timeout waiting for 5 tokens after \d+ms/);
    });

    it('should validate acquire parameters', async () => {
      const bucket = new TokenBucket(10, 5);
      
      await expect(bucket.acquire(0)).rejects.toThrow('Token count must be positive');
      await expect(bucket.acquire(11)).rejects.toThrow('Cannot acquire 11 tokens, max is 10');
    });

    it('should reset to full capacity', () => {
      const bucket = new TokenBucket(10, 5);
      
      bucket.tryAcquire(8);
      expect(bucket.getAvailableTokens()).toBe(2);
      
      bucket.reset();
      expect(bucket.getAvailableTokens()).toBe(10);
    });
  });

  describe('RateLimiter', () => {
    it('should limit calls per second', async () => {
      const limiter = new RateLimiter(2); // 2 calls per second
      const fn = vi.fn().mockResolvedValue('result');
      
      // First two calls should be immediate
      await limiter.execute(fn);
      await limiter.execute(fn);
      expect(fn).toHaveBeenCalledTimes(2);
      
      // Third call should wait
      const promise = limiter.execute(fn);
      expect(fn).toHaveBeenCalledTimes(2);
      
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();
      await promise;
      
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should handle burst size', async () => {
      const limiter = new RateLimiter(2, { burstSize: 5 });
      const fn = vi.fn();
      
      // Should allow 5 calls immediately (burst size)
      for (let i = 0; i < 5; i++) {
        await limiter.execute(fn);
      }
      expect(fn).toHaveBeenCalledTimes(5);
      
      // 6th call should wait
      const promise = limiter.execute(fn);
      expect(fn).toHaveBeenCalledTimes(5);
      
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();
      await promise;
      
      expect(fn).toHaveBeenCalledTimes(6);
    });

    it('should throw on limit when configured', async () => {
      const limiter = new RateLimiter(1, { throwOnLimit: true });
      const fn = vi.fn();
      
      await limiter.execute(fn);
      expect(fn).toHaveBeenCalledOnce();
      
      await expect(limiter.execute(fn)).rejects.toThrow('Rate limit exceeded');
      expect(fn).toHaveBeenCalledOnce();
    });

    it('should wrap functions', async () => {
      const limiter = new RateLimiter(2);
      const fn = vi.fn((x: number) => x * 2);
      const wrapped = limiter.wrap(fn as (...args: unknown[]) => unknown) as (x: number) => Promise<number>;
      
      expect(await wrapped(5)).toBe(10);
      expect(await wrapped(10)).toBe(20);
      
      // Third call should be rate limited
      const promise = wrapped(15);
      
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();
      
      expect(await promise).toBe(30);
    });

    it('should check if would limit', async () => {
      const limiter = new RateLimiter(1);
      
      expect(limiter.wouldLimit()).toBe(false);
      
      await limiter.execute(() => {});
      expect(limiter.wouldLimit()).toBe(true);
      
      vi.advanceTimersByTime(1000);
      expect(limiter.wouldLimit()).toBe(false);
    });

    it('should get wait time', async () => {
      const limiter = new RateLimiter(2); // 2 per second
      
      expect(limiter.getWaitTime()).toBe(0);
      
      await limiter.execute(() => {});
      await limiter.execute(() => {});
      
      expect(limiter.getWaitTime()).toBe(500); // 0.5 seconds for next token
    });

    it('should reset', async () => {
      const limiter = new RateLimiter(1);
      
      await limiter.execute(() => {});
      expect(limiter.wouldLimit()).toBe(true);
      
      limiter.reset();
      expect(limiter.wouldLimit()).toBe(false);
    });
  });

  describe('createRateLimiter', () => {
    it('should create a simple rate limiter function', async () => {
      const rateLimited = createRateLimiter(2); // 2 per second
      const fn = vi.fn().mockResolvedValue('result');
      
      expect(await rateLimited(fn)).toBe('result');
      expect(await rateLimited(fn)).toBe('result');
      
      const promise = rateLimited(fn);
      
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();
      
      expect(await promise).toBe('result');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('SlidingWindowRateLimiter', () => {
    it('should limit calls in sliding window', () => {
      const limiter = new SlidingWindowRateLimiter(3, 1000); // 3 calls per second
      
      expect(limiter.tryCall()).toBe(true);
      expect(limiter.tryCall()).toBe(true);
      expect(limiter.tryCall()).toBe(true);
      expect(limiter.tryCall()).toBe(false);
      
      expect(limiter.getCurrentCalls()).toBe(3);
    });

    it('should validate constructor parameters', () => {
      expect(() => new SlidingWindowRateLimiter(0, 1000)).toThrow('maxCalls must be positive');
      expect(() => new SlidingWindowRateLimiter(10, 0)).toThrow('windowMs must be positive');
    });

    it('should slide window over time', () => {
      const limiter = new SlidingWindowRateLimiter(3, 1000);
      
      limiter.tryCall(); // t=0
      limiter.tryCall(); // t=0
      limiter.tryCall(); // t=0
      
      expect(limiter.tryCall()).toBe(false);
      
      vi.advanceTimersByTime(500);
      expect(limiter.tryCall()).toBe(false); // Still within window
      
      vi.advanceTimersByTime(501); // Total: 1001ms elapsed
      expect(limiter.tryCall()).toBe(true); // All calls from t=0 expired, now t=1001
      expect(limiter.tryCall()).toBe(true); // Still have room (only 1 call from previous line)
      
      vi.advanceTimersByTime(500);
      expect(limiter.getCurrentCalls()).toBe(2); // Both calls from t=1001 are still within window
    });

    it('should wait for available slot', async () => {
      const limiter = new SlidingWindowRateLimiter(2, 1000);
      
      limiter.tryCall();
      limiter.tryCall();
      
      const promise = limiter.waitForCall();
      
      vi.advanceTimersByTime(999);
      await vi.runAllTimersAsync();
      
      // Should still be waiting
      let resolved = false;
      promise.then(() => { resolved = true; });
      expect(resolved).toBe(false);
      
      vi.advanceTimersByTime(2);
      await vi.runAllTimersAsync();
      await promise;
      
      expect(limiter.getCurrentCalls()).toBe(1);
    });

    it('should handle abort signal', async () => {
      const limiter = new SlidingWindowRateLimiter(1, 1000);
      const controller = new AbortController();
      
      limiter.tryCall();
      
      const promise = limiter.waitForCall(controller.signal);
      
      vi.advanceTimersByTime(500);
      controller.abort();
      
      await expect(promise).rejects.toThrow('Operation aborted');
    });

    it('should reset limiter', () => {
      const limiter = new SlidingWindowRateLimiter(3, 1000);
      
      limiter.tryCall();
      limiter.tryCall();
      expect(limiter.getCurrentCalls()).toBe(2);
      
      limiter.reset();
      expect(limiter.getCurrentCalls()).toBe(0);
      
      expect(limiter.tryCall()).toBe(true);
    });

    it('should handle rapid calls correctly', () => {
      const limiter = new SlidingWindowRateLimiter(5, 1000);
      
      // Make 5 calls at different times
      limiter.tryCall(); // t=0
      vi.advanceTimersByTime(200);
      
      limiter.tryCall(); // t=200
      vi.advanceTimersByTime(200);
      
      limiter.tryCall(); // t=400
      vi.advanceTimersByTime(200);
      
      limiter.tryCall(); // t=600
      vi.advanceTimersByTime(200);
      
      limiter.tryCall(); // t=800
      
      expect(limiter.getCurrentCalls()).toBe(5);
      expect(limiter.tryCall()).toBe(false);
      
      // At t=1001, first call should expire
      vi.advanceTimersByTime(201);
      expect(limiter.getCurrentCalls()).toBe(4);
      expect(limiter.tryCall()).toBe(true);
    });
  });
});