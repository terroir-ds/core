/**
 * @fileoverview Tests for promise race utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createTimeoutPromise,
  raceWithCleanup,
  raceWithIndex,
  raceWithTimeouts,
  raceUntil,
  raceWithCancellation,
  raceFirstN,
} from '../race';

describe('race helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createTimeoutPromise', () => {
    it('should reject after timeout', async () => {
      const promise = createTimeoutPromise(1000);
      
      vi.advanceTimersByTime(999);
      await vi.runAllTimersAsync();
      
      // Should not reject yet
      let rejected = false;
      promise.catch(() => { rejected = true; });
      expect(rejected).toBe(false);
      
      vi.advanceTimersByTime(1);
      await vi.runAllTimersAsync();
      
      await expect(promise).rejects.toThrow('Operation timed out after 1000ms');
    });

    it('should use custom error factory', async () => {
      const errorFactory = (ms: number) => new Error(`Custom timeout: ${ms}`);
      const promise = createTimeoutPromise(500, errorFactory);
      
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();
      
      await expect(promise).rejects.toThrow('Custom timeout: 500');
    });
  });

  describe('raceWithCleanup', () => {
    it('should race promises and call cleanup', async () => {
      const cleanup = vi.fn();
      const promise1 = new Promise(resolve => setTimeout(() => resolve('first'), 100));
      const promise2 = new Promise(resolve => setTimeout(() => resolve('second'), 200));
      
      const resultPromise = raceWithCleanup([promise1, promise2], cleanup);
      
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
      
      const result = await resultPromise;
      expect(result).toBe('first');
      expect(cleanup).toHaveBeenCalledOnce();
    });

    it('should call cleanup even on error', async () => {
      const cleanup = vi.fn();
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const promise1 = Promise.reject(new Error('Failed'));
      const promise2 = new Promise(resolve => setTimeout(() => resolve('ok'), 100));
      
      await expect(raceWithCleanup([promise1, promise2], cleanup))
        .rejects.toThrow('Failed');
      
      expect(cleanup).toHaveBeenCalledOnce();
    });

    it('should handle cleanup errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const cleanup = vi.fn().mockRejectedValue(new Error('Cleanup failed'));
      const promise = Promise.resolve('result');
      
      const result = await raceWithCleanup([promise], cleanup);
      
      expect(result).toBe('result');
      expect(cleanup).toHaveBeenCalledOnce();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Cleanup error in race:',
        expect.any(Error)
      );
    });
  });

  describe('raceWithIndex', () => {
    it('should return winner with index and timing', async () => {
      const promise1 = new Promise(resolve => setTimeout(() => resolve('first'), 200));
      const promise2 = new Promise(resolve => setTimeout(() => resolve('second'), 100));
      const promise3 = new Promise(resolve => setTimeout(() => resolve('third'), 300));
      
      const resultPromise = raceWithIndex([promise1, promise2, promise3]);
      
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
      
      const result = await resultPromise;
      
      expect(result.value).toBe('second');
      expect(result.index).toBe(1);
      expect(result.elapsed).toBeGreaterThanOrEqual(100);
      expect(result.elapsed).toBeLessThan(200);
    });

    it('should throw if no promises provided', async () => {
      await expect(raceWithIndex([])).rejects.toThrow('No promises provided');
    });

    it('should handle rejection', async () => {
      const promise1 = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Failed')), 100)
      );
      const promise2 = new Promise(resolve => 
        setTimeout(() => resolve('ok'), 200)
      );
      
      const resultPromise = raceWithIndex([promise1, promise2]);
      
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
      
      await expect(resultPromise).rejects.toThrow('Failed');
    });
  });

  describe('raceWithTimeouts', () => {
    it('should race with individual timeouts', async () => {
      const slow = new Promise(resolve => setTimeout(() => resolve('slow'), 200));
      const fast = new Promise(resolve => setTimeout(() => resolve('fast'), 50));
      
      const resultPromise = raceWithTimeouts([
        { promise: slow, timeout: 100, name: 'slow-op' },
        { promise: fast, timeout: 100, name: 'fast-op' }
      ]);
      
      vi.advanceTimersByTime(50);
      await vi.runAllTimersAsync();
      
      expect(await resultPromise).toBe('fast');
    });

    it('should timeout individual operations', async () => {
      const slow = new Promise(resolve => setTimeout(() => resolve('slow'), 200));
      const slower = new Promise(resolve => setTimeout(() => resolve('slower'), 300));
      
      const resultPromise = raceWithTimeouts([
        { promise: slow, timeout: 100, name: 'slow-op' },
        { promise: slower, timeout: 150, name: 'slower-op' }
      ]);
      
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
      
      await expect(resultPromise).rejects.toThrow('Operation "slow-op" timed out after 100ms');
    });

    it('should handle operations without timeout', async () => {
      const fast = Promise.resolve('fast');
      const slow = new Promise(resolve => setTimeout(() => resolve('slow'), 100));
      
      const result = await raceWithTimeouts([
        { promise: fast },
        { promise: slow, timeout: 50 }
      ]);
      
      expect(result).toBe('fast');
    });

    it('should throw if no operations provided', async () => {
      await expect(raceWithTimeouts([])).rejects.toThrow('No promises provided');
    });
  });

  describe('raceUntil', () => {
    it('should race until condition is met', async () => {
      const promise1 = Promise.resolve(5);
      const promise2 = Promise.resolve(10);
      const promise3 = Promise.resolve(15);
      
      const result = await raceUntil(
        [promise1, promise2, promise3],
        value => value > 8
      );
      
      expect(result).toBe(10);
    });

    it('should timeout if specified', async () => {
      const promises = [
        new Promise(resolve => setTimeout(() => resolve(5), 200)),
        new Promise(resolve => setTimeout(() => resolve(10), 300))
      ];
      
      const resultPromise = raceUntil(
        promises,
        value => value > 20,
        { timeout: 100 }
      );
      
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
      
      await expect(resultPromise).rejects.toThrow('Operation timed out after 100ms');
    });

    it('should reject if no results match', async () => {
      const promises = [
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3)
      ];
      
      await expect(
        raceUntil(promises, value => value > 10)
      ).rejects.toThrow('No results matched the condition. Received 3 results.');
    });

    it('should reject non-matching if configured', async () => {
      const promises = [
        Promise.resolve(5),
        new Promise(resolve => setTimeout(() => resolve(15), 100))
      ];
      
      await expect(
        raceUntil(
          promises,
          value => value > 10,
          { rejectNonMatching: true }
        )
      ).rejects.toThrow('Promise at index 0 did not match condition');
    });

    it('should handle all promises failing', async () => {
      const promises = [
        Promise.reject(new Error('Error 1')),
        Promise.reject(new Error('Error 2'))
      ];
      
      await expect(
        raceUntil(promises, () => true)
      ).rejects.toThrow('All 2 promises failed.');
    });
  });

  describe('raceWithCancellation', () => {
    it('should cancel losing operations', async () => {
      const abortFn1 = vi.fn();
      const abortFn2 = vi.fn();
      
      const op1 = {
        start: (signal: AbortSignal) => {
          signal.addEventListener('abort', abortFn1);
          return new Promise(resolve => setTimeout(() => resolve('slow'), 200));
        },
        name: 'slow'
      };
      
      const op2 = {
        start: (signal: AbortSignal) => {
          signal.addEventListener('abort', abortFn2);
          return new Promise(resolve => setTimeout(() => resolve('fast'), 100));
        },
        name: 'fast'
      };
      
      const resultPromise = raceWithCancellation([op1, op2]);
      
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
      
      const result = await resultPromise;
      
      expect(result).toBe('fast');
      expect(abortFn1).toHaveBeenCalled(); // Slow operation was cancelled
      expect(abortFn2).not.toHaveBeenCalled(); // Fast operation won
    });

    it('should cancel all on error', async () => {
      const abortFn1 = vi.fn();
      const abortFn2 = vi.fn();
      
      const op1 = {
        start: (signal: AbortSignal) => {
          signal.addEventListener('abort', abortFn1);
          return Promise.reject(new Error('Failed'));
        }
      };
      
      const op2 = {
        start: (signal: AbortSignal) => {
          signal.addEventListener('abort', abortFn2);
          return new Promise(resolve => setTimeout(() => resolve('ok'), 100));
        }
      };
      
      await expect(raceWithCancellation([op1, op2])).rejects.toThrow('Failed');
      
      expect(abortFn1).toHaveBeenCalled();
      expect(abortFn2).toHaveBeenCalled();
    });

    it('should throw if no operations provided', async () => {
      await expect(raceWithCancellation([])).rejects.toThrow('No promises provided');
    });
  });

  describe('raceFirstN', () => {
    it('should get first N results', async () => {
      const promises = [
        new Promise(resolve => setTimeout(() => resolve('1st'), 100)),
        new Promise(resolve => setTimeout(() => resolve('2nd'), 50)),
        new Promise(resolve => setTimeout(() => resolve('3rd'), 150)),
        new Promise(resolve => setTimeout(() => resolve('4th'), 75))
      ];
      
      const resultPromise = raceFirstN(promises, 2);
      
      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();
      
      const results = await resultPromise;
      
      expect(results).toHaveLength(2);
      expect(results).toContain('2nd'); // Fastest
      expect(results).toContain('4th'); // Second fastest
    });

    it('should return all if count >= length', async () => {
      const promises = [
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3)
      ];
      
      const results = await raceFirstN(promises, 5);
      
      expect(results).toEqual([1, 2, 3]);
    });

    it('should handle failures appropriately', async () => {
      const promises = [
        Promise.reject(new Error('Error 1')),
        Promise.resolve('ok1'),
        Promise.reject(new Error('Error 2')),
        Promise.resolve('ok2')
      ];
      
      const results = await raceFirstN(promises, 2);
      
      expect(results).toEqual(['ok1', 'ok2']);
    });

    it('should reject if not enough successes', async () => {
      const promises = [
        Promise.reject(new Error('Error 1')),
        Promise.resolve('ok'),
        Promise.reject(new Error('Error 2')),
        Promise.reject(new Error('Error 3'))
      ];
      
      await expect(raceFirstN(promises, 3))
        .rejects.toThrow('Cannot get 3 results. Only 1 succeeded.');
    });

    it('should validate inputs', async () => {
      await expect(raceFirstN([], 1)).rejects.toThrow('No promises provided');
      await expect(raceFirstN([Promise.resolve(1)], 0)).rejects.toThrow('Count must be positive');
      await expect(raceFirstN([Promise.resolve(1)], -1)).rejects.toThrow('Count must be positive');
    });
  });
});