/**
 * @fileoverview Tests for timer management utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createManagedTimer,
  createManagedInterval,
  debounce,
  throttle,
  poll,
} from '../timers';

describe('timer helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createManagedTimer', () => {
    it('should create a timer that resolves after delay', async () => {
      const timer = createManagedTimer(1000);
      let resolved = false;
      
      timer.promise.then(() => { resolved = true; });
      
      expect(resolved).toBe(false);
      expect(timer.id).not.toBeNull();
      
      vi.advanceTimersByTime(999);
      expect(resolved).toBe(false);
      
      vi.advanceTimersByTime(1);
      await vi.runAllTimersAsync();
      expect(resolved).toBe(true);
      expect(timer.id).toBeNull();
    });

    it('should clear timer when clear is called', async () => {
      const timer = createManagedTimer(1000);
      let resolved = false;
      
      timer.promise.then(() => { resolved = true; });
      
      vi.advanceTimersByTime(500);
      timer.clear();
      
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();
      
      expect(resolved).toBe(false);
      expect(timer.id).toBeNull();
    });

    it('should handle abort signal', async () => {
      const controller = new AbortController();
      const timer = createManagedTimer(1000, { signal: controller.signal });
      
      const promise = timer.promise;
      
      vi.advanceTimersByTime(500);
      controller.abort();
      
      await expect(promise).rejects.toThrow('Operation aborted');
      expect(timer.id).toBeNull();
    });

    it('should reject immediately if signal already aborted', async () => {
      const controller = new AbortController();
      controller.abort();
      
      const timer = createManagedTimer(1000, { signal: controller.signal });
      
      await expect(timer.promise).rejects.toThrow('Operation aborted');
    });

    it('should unref timer if requested', () => {
      const timeoutId = { unref: vi.fn() };
      const originalSetTimeout = globalThis.setTimeout;
      globalThis.setTimeout = vi.fn(() => timeoutId) as unknown as typeof setTimeout;
      
      try {
        createManagedTimer(1000, { unref: true });
        expect(timeoutId.unref).toHaveBeenCalled();
      } finally {
        globalThis.setTimeout = originalSetTimeout;
      }
    });
  });

  describe('createManagedInterval', () => {
    it('should call callback repeatedly', () => {
      const callback = vi.fn();
      const stop = createManagedInterval(callback, 100);
      
      expect(callback).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
      
      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(2);
      
      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(3);
      
      stop();
      
      vi.advanceTimersByTime(200);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should handle async callbacks', async () => {
      let callCount = 0;
      const callback = vi.fn(async () => {
        callCount++;
        await Promise.resolve();
      });
      
      createManagedInterval(callback, 100);
      
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
      expect(callCount).toBe(1);
      
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
      expect(callCount).toBe(2);
    });

    it('should stop on callback error', async () => {
      const error = new Error('Callback error');
      const callback = vi.fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(error);
      
      createManagedInterval(callback, 100);
      
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
      expect(callback).toHaveBeenCalledTimes(1);
      
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
      expect(callback).toHaveBeenCalledTimes(2);
      
      // Should not be called again
      vi.advanceTimersByTime(200);
      await vi.runAllTimersAsync();
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should handle abort signal', () => {
      const controller = new AbortController();
      const callback = vi.fn();
      createManagedInterval(callback, 100, { signal: controller.signal });
      
      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
      
      controller.abort();
      
      vi.advanceTimersByTime(200);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should return noop if signal already aborted', () => {
      const controller = new AbortController();
      controller.abort();
      
      const callback = vi.fn();
      const stop = createManagedInterval(callback, 100, { signal: controller.signal });
      
      vi.advanceTimersByTime(200);
      expect(callback).not.toHaveBeenCalled();
      
      stop(); // Should not throw
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      
      debounced('a');
      debounced('b');
      debounced('c');
      
      expect(fn).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(99);
      expect(fn).not.toHaveBeenCalled();
      
      await vi.advanceTimersByTimeAsync(1);
      expect(fn).toHaveBeenCalledOnce();
      expect(fn).toHaveBeenCalledWith('c');
    });

    it('should reset timer on each call', async () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      
      debounced('a');
      await vi.advanceTimersByTimeAsync(50);
      
      debounced('b');
      await vi.advanceTimersByTimeAsync(50);
      
      debounced('c');
      await vi.advanceTimersByTimeAsync(50);
      
      expect(fn).not.toHaveBeenCalled();
      
      await vi.advanceTimersByTimeAsync(50);
      expect(fn).toHaveBeenCalledOnce();
      expect(fn).toHaveBeenCalledWith('c');
    });

    it('should cancel pending calls', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      
      debounced('a');
      vi.advanceTimersByTime(50);
      
      debounced.cancel();
      
      vi.advanceTimersByTime(50);
      expect(fn).not.toHaveBeenCalled();
    });

    it('should handle abort signal', () => {
      const controller = new AbortController();
      const fn = vi.fn();
      const debounced = debounce(fn, 100, { signal: controller.signal });
      
      debounced('a');
      vi.advanceTimersByTime(50);
      
      controller.abort();
      
      vi.advanceTimersByTime(50);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('throttle', () => {
    it('should throttle function calls with leading=true', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);
      
      throttled('a');
      expect(fn).toHaveBeenCalledOnce();
      expect(fn).toHaveBeenCalledWith('a');
      
      throttled('b');
      throttled('c');
      expect(fn).toHaveBeenCalledOnce();
      
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith('c');
    });

    it('should throttle with leading=false', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100, { leading: false });
      
      throttled('a');
      expect(fn).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledOnce();
      expect(fn).toHaveBeenCalledWith('a');
    });

    it('should throttle with trailing=false', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100, { trailing: false });
      
      throttled('a');
      expect(fn).toHaveBeenCalledOnce();
      expect(fn).toHaveBeenCalledWith('a');
      
      throttled('b');
      throttled('c');
      
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledOnce();
    });

    it('should cancel pending calls', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);
      
      throttled('a');
      throttled('b');
      
      expect(fn).toHaveBeenCalledOnce();
      
      throttled.cancel();
      
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledOnce();
    });

    it('should handle abort signal', () => {
      const controller = new AbortController();
      const fn = vi.fn();
      const throttled = throttle(fn, 100, { signal: controller.signal });
      
      throttled('a');
      throttled('b');
      
      expect(fn).toHaveBeenCalledOnce();
      
      controller.abort();
      
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledOnce();
    });
  });

  describe('poll', () => {
    it('should poll until condition is met', async () => {
      let count = 0;
      const condition = vi.fn(() => {
        count++;
        return count >= 3;
      });
      
      const promise = poll(condition, 100);
      
      expect(condition).toHaveBeenCalledOnce();
      
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
      expect(condition).toHaveBeenCalledTimes(2);
      
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
      expect(condition).toHaveBeenCalledTimes(3);
      
      await expect(promise).resolves.toBeUndefined();
    });

    it('should handle async conditions', async () => {
      let count = 0;
      const condition = vi.fn(async () => {
        await Promise.resolve();
        count++;
        return count >= 2;
      });
      
      const promise = poll(condition, 100);
      
      await vi.runAllTimersAsync();
      expect(condition).toHaveBeenCalledOnce();
      
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
      expect(condition).toHaveBeenCalledTimes(2);
      
      await expect(promise).resolves.toBeUndefined();
    });

    it('should timeout if specified', async () => {
      const condition = vi.fn(() => false);
      const promise = poll(condition, 100, { timeout: 250 });
      
      vi.advanceTimersByTime(300);
      await vi.runAllTimersAsync();
      
      await expect(promise).rejects.toThrow('Polling timed out after 250ms');
    });

    it('should handle abort signal', async () => {
      const controller = new AbortController();
      const condition = vi.fn(() => false);
      const promise = poll(condition, 100, { signal: controller.signal });
      
      vi.advanceTimersByTime(150);
      await vi.runAllTimersAsync();
      
      controller.abort();
      
      await expect(promise).rejects.toThrow('Operation aborted');
    });

    it('should check abort signal immediately', async () => {
      const controller = new AbortController();
      controller.abort();
      
      const condition = vi.fn(() => false);
      const promise = poll(condition, 100, { signal: controller.signal });
      
      await expect(promise).rejects.toThrow('Operation aborted');
      expect(condition).not.toHaveBeenCalled();
    });
  });
});