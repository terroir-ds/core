/**
 * Tests for delay utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  delay,
  delayValue,
  randomDelay,
  debouncedDelay
} from '../delay.js';
import { expectRejection } from '@test/helpers/error-handling.js';

describe('delay utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('delay', () => {
    it('should resolve after specified time', async () => {
      const promise = delay(100);
      let resolved = false;
      
      promise.then(() => { resolved = true; });
      
      expect(resolved).toBe(false);
      
      vi.advanceTimersByTime(99);
      await Promise.resolve();
      expect(resolved).toBe(false);
      
      vi.advanceTimersByTime(1);
      await promise;
      expect(resolved).toBe(true);
    });

    it('should handle zero delay', async () => {
      const promise = delay(0);
      vi.advanceTimersByTime(0);
      await promise;
      // Should resolve without error
    });

    it('should reject if signal already aborted', async () => {
      const controller = new AbortController();
      controller.abort();
      
      await expectRejection(
        delay(100, { signal: controller.signal }),
        'Operation aborted'
      );
    });

    it('should reject when signal aborts', async () => {
      const controller = new AbortController();
      const promise = delay(100, { signal: controller.signal });
      
      controller.abort();
      
      await expectRejection(promise, 'Operation aborted');
    });

    it('should cleanup timeout on abort', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const controller = new AbortController();
      
      const promise = delay(100, { signal: controller.signal });
      controller.abort();
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      promise.catch(() => {
        // Expected to reject
      });
    });

    it('should not leak event listeners', async () => {
      const controller = new AbortController();
      const addEventListenerSpy = vi.spyOn(controller.signal, 'addEventListener');
      
      const promise = delay(100, { signal: controller.signal });
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('abort', expect.any(Function), { once: true });
      
      vi.advanceTimersByTime(100);
      await promise;
      
      // The listener should be automatically removed due to { once: true }
    });

    it('should handle unref option', async () => {
      // This is difficult to test directly, but we can ensure it doesn't break
      const promise = delay(100, { unref: true });
      
      vi.advanceTimersByTime(100);
      await promise;
      // Should complete without error
    });
  });

  describe('delayValue', () => {
    it('should return value after delay', async () => {
      const value = { test: 'data' };
      const promise = delayValue(value, 100);
      
      vi.advanceTimersByTime(100);
      
      const result = await promise;
      expect(result).toBe(value);
    });

    it('should handle primitive values', async () => {
      const promise = delayValue(42, 50);
      
      vi.advanceTimersByTime(50);
      
      const result = await promise;
      expect(result).toBe(42);
    });

    it('should reject on abort', async () => {
      const controller = new AbortController();
      const promise = delayValue('value', 100, { signal: controller.signal });
      
      controller.abort();
      
      await expectRejection(promise, 'Operation aborted');
    });
  });

  describe('randomDelay', () => {
    it('should delay within range', async () => {
      // Mock Math.random to return predictable values
      const randomSpy = vi.spyOn(Math, 'random');
      
      // Test minimum delay
      randomSpy.mockReturnValue(0);
      const minPromise = randomDelay(100, 200);
      vi.advanceTimersByTime(100);
      await minPromise;
      
      // Test maximum delay
      randomSpy.mockReturnValue(0.999);
      const maxPromise = randomDelay(100, 200);
      vi.advanceTimersByTime(200);
      await maxPromise;
      
      // Test middle value
      randomSpy.mockReturnValue(0.5);
      const midPromise = randomDelay(100, 200);
      vi.advanceTimersByTime(150);
      await midPromise;
    });

    it('should handle same min and max', async () => {
      const promise = randomDelay(100, 100);
      vi.advanceTimersByTime(100);
      await promise;
    });

    it('should throw for negative values', async () => {
      await expectRejection(
        randomDelay(-10, 100),
        'Delay values must be non-negative'
      );
      await expectRejection(
        randomDelay(10, -100),
        'Delay values must be non-negative'
      );
    });

    it('should throw if min > max', async () => {
      await expectRejection(
        randomDelay(200, 100),
        'Minimum delay must not exceed maximum delay'
      );
    });

    it('should handle abort signal', async () => {
      const controller = new AbortController();
      const promise = randomDelay(100, 200, { signal: controller.signal });
      
      controller.abort();
      
      await expectRejection(promise, 'Operation aborted');
    });
  });

  describe('debouncedDelay', () => {
    it('should delay execution', async () => {
      const { delay } = debouncedDelay(100);
      
      const promise = delay();
      let resolved = false;
      promise.then(() => { resolved = true; });
      
      vi.advanceTimersByTime(99);
      await Promise.resolve();
      expect(resolved).toBe(false);
      
      vi.advanceTimersByTime(1);
      await promise;
      expect(resolved).toBe(true);
    });

    it('should reset on multiple calls', async () => {
      const { delay } = debouncedDelay(100);
      
      const promise1 = delay();
      let resolved = false;
      promise1.then(() => { resolved = true; });
      
      vi.advanceTimersByTime(50);
      
      const promise2 = delay();
      expect(promise1).toBe(promise2); // Same promise
      
      vi.advanceTimersByTime(50);
      await Promise.resolve();
      expect(resolved).toBe(false); // Not resolved yet
      
      vi.advanceTimersByTime(50);
      await promise2;
      expect(resolved).toBe(true);
    });

    it('should handle cancel', async () => {
      const { delay, cancel } = debouncedDelay(100);
      
      const promise = delay();
      cancel();
      
      await expectRejection(promise, 'Debounced delay cancelled');
    });

    it('should handle flush', async () => {
      const { delay, flush } = debouncedDelay(100);
      
      const promise = delay();
      flush();
      
      await promise; // Should resolve immediately
    });

    it('should cleanup on cancel', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const { delay, cancel } = debouncedDelay(100);
      
      const promise = delay();
      cancel();
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      // Handle the rejection
      await promise.catch(() => {
        // Expected to reject
      });
    });

    it('should handle maxWait option', async () => {
      const { delay } = debouncedDelay(100, { maxWait: 150 });
      
      const promise = delay();
      let resolved = false;
      promise.then(() => { resolved = true; });
      
      // Keep resetting
      vi.advanceTimersByTime(50);
      delay();
      
      vi.advanceTimersByTime(50);
      delay();
      
      vi.advanceTimersByTime(50);
      await promise;
      expect(resolved).toBe(true); // Should resolve due to maxWait
    });

    it('should abort on signal', async () => {
      const controller = new AbortController();
      const { delay } = debouncedDelay(100, { signal: controller.signal });
      
      const promise = delay();
      controller.abort();
      
      await expectRejection(promise, 'Debounced delay cancelled');
    });

    it('should handle multiple cancel calls', async () => {
      const { delay, cancel } = debouncedDelay(100);
      
      // Cancel without active delay
      expect(() => cancel()).not.toThrow();
      
      // Start delay and cancel twice
      const promise = delay();
      cancel();
      expect(() => cancel()).not.toThrow();
      
      // Handle the rejection
      await promise.catch(() => {
        // Expected to reject
      });
    });

    it('should handle multiple flush calls', () => {
      const { delay, flush } = debouncedDelay(100);
      
      // Flush without active delay
      expect(() => flush()).not.toThrow();
      
      // Start delay and flush twice
      delay();
      flush();
      expect(() => flush()).not.toThrow();
    });
  });

  describe('performance', () => {
    it('should handle many concurrent delays', async () => {
      const promises = Array.from({ length: 1000 }, (_, i) => 
        delay(i % 100)
      );
      
      vi.advanceTimersByTime(100);
      
      await Promise.all(promises);
      // All should resolve without error
    });
  });
});