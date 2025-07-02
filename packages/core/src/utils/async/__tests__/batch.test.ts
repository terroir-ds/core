/**
 * @module test/lib/utils/async/batch
 * 
 * Unit tests for batch processing utilities
 * 
 * Tests batch processing functionality including:
 * - processBatch with concurrency control and order preservation
 * - processChunked for splitting items into chunks
 * - mapConcurrent for concurrent mapping operations
 * - processRateLimited with token bucket rate limiting
 * - Error handling and recovery strategies
 * - Progress reporting and abort signal support
 * - Performance with large datasets (1000+ items)
 * - Burst capacity handling for rate limiting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  processBatch,
  processChunked,
  mapConcurrent,
  processRateLimited
} from '@utils/async/batch';
import { expectRejection } from '@test/helpers/error-handling';

describe('batch processing utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('processBatch', () => {
    it('should process items with default concurrency', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = vi.fn(async (item: number) => item * 2);
      
      const results = await processBatch(items, processor);
      
      expect(results).toHaveLength(5);
      expect(results[0]).toEqual({ item: 1, value: 2, index: 0 });
      expect(results[4]).toEqual({ item: 5, value: 10, index: 4 });
      expect(processor).toHaveBeenCalledTimes(5);
    });

    it('should respect concurrency limit', async () => {
      let activeCount = 0;
      let maxActive = 0;
      
      const processor = vi.fn(async (item: number) => {
        activeCount++;
        maxActive = Math.max(maxActive, activeCount);
        await new Promise(resolve => setTimeout(resolve, 10));
        activeCount--;
        return item;
      });
      
      const items = Array.from({ length: 10 }, (_, i) => i);
      const promise = processBatch(items, processor, { concurrency: 3 });
      
      // Run all timers to completion
      await vi.runAllTimersAsync();
      await promise;
      
      expect(maxActive).toBeLessThanOrEqual(3);
    });

    it('should preserve order when requested', async () => {
      const items = [1, 2, 3, 4, 5];
      const delays = [50, 10, 30, 20, 40];
      
      const processor = async (item: number, index: number) => {
        await new Promise(resolve => setTimeout(resolve, delays[index]));
        return item * 2;
      };
      
      const promise = processBatch(items, processor, { preserveOrder: true });
      await vi.runAllTimersAsync();
      
      const results = await promise;
      
      expect(results.map(r => r.value)).toEqual([2, 4, 6, 8, 10]);
    });

    it('should handle errors in items', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = async (item: number) => {
        if (item === 3) {
          throw new Error(`Error processing ${item}`);
        }
        return item * 2;
      };
      
      const results = await processBatch(items, processor);
      
      expect(results[2]?.error).toBeDefined();
      expect(results[2]?.error?.message).toBe('Error processing 3');
      expect(results[0]?.value).toBe(2);
      expect(results[4]?.value).toBe(10);
    });

    it('should stop on error when requested', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = vi.fn(async (item: number) => {
        if (item === 3) {
          throw new Error('Stop here');
        }
        return item * 2;
      });
      
      const results = await processBatch(items, processor, { 
        stopOnError: true,
        concurrency: 1 // Process sequentially for predictable behavior
      });
      
      // Should process first 3 items before stopping
      expect(processor).toHaveBeenCalledTimes(3);
      expect(results[0]?.value).toBe(2);
      expect(results[1]?.value).toBe(4);
      expect(results[2]?.error).toBeDefined();
    });

    it('should report progress', async () => {
      const items = [1, 2, 3, 4, 5];
      const progressReports: Array<{ completed: number; total: number }> = [];
      
      const processor = async (item: number) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return item;
      };
      
      const promise = processBatch(items, processor, {
        onProgress: (completed, total) => {
          progressReports.push({ completed, total });
        }
      });
      
      await vi.runAllTimersAsync();
      await promise;
      
      // Filter out any initial 0,0 progress report
      const actualReports = progressReports.filter(r => r.completed > 0 || r.total > 0);
      expect(actualReports).toHaveLength(5);
      expect(actualReports[0]).toEqual({ completed: 1, total: 5 });
      expect(actualReports[4]).toEqual({ completed: 5, total: 5 });
    });

    it('should handle abort signal', async () => {
      const controller = new AbortController();
      const items = [1, 2, 3, 4, 5];
      const processor = async (item: number) => item * 2;
      
      controller.abort();
      
      await expectRejection(
        processBatch(items, processor, { signal: controller.signal }),
        'Operation aborted'
      );
    });

    it('should abort during processing', async () => {
      const controller = new AbortController();
      const items = Array.from({ length: 10 }, (_, i) => i);
      let processed = 0;
      
      const processor = async (item: number) => {
        processed++;
        if (processed === 3) {
          controller.abort();
        }
        await new Promise(resolve => setTimeout(resolve, 10));
        return item;
      };
      
      const promise = processBatch(items, processor, { 
        signal: controller.signal,
        concurrency: 1
      });
      
      await vi.runAllTimersAsync();
      await expectRejection(promise, 'Operation aborted');
      expect(processed).toBeLessThanOrEqual(5);
    }, 15000);

    it('should handle empty array', async () => {
      const processor = vi.fn();
      const results = await processBatch([], processor);
      
      expect(results).toEqual([]);
      expect(processor).not.toHaveBeenCalled();
    });
  });

  describe('processChunked', () => {
    it('should process items in chunks', async () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const processedChunks: number[][] = [];
      
      const processor = async (chunk: number[]) => {
        processedChunks.push([...chunk]);
        return chunk.map(n => n * 2);
      };
      
      const results = await processChunked(items, processor, { chunkSize: 3 });
      
      expect(processedChunks).toEqual([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [10]
      ]);
      expect(results).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
    });

    it('should throw for invalid chunk size', async () => {
      const items = [1, 2, 3];
      const processor = async (chunk: number[]) => chunk;
      
      await expectRejection(
        processChunked(items, processor, { chunkSize: 0 }),
        'Chunk size must be a positive integer'
      );
      
      await expectRejection(
        processChunked(items, processor, { chunkSize: -1 }),
        'Chunk size must be a positive integer'
      );
    });

    it('should handle abort signal', async () => {
      const controller = new AbortController();
      const items = [1, 2, 3, 4, 5];
      const processor = async (chunk: number[]) => chunk;
      
      controller.abort();
      
      await expectRejection(
        processChunked(items, processor, { 
          chunkSize: 2, 
          signal: controller.signal 
        }),
        'Operation aborted'
      );
    });

    it('should abort during processing', async () => {
      const controller = new AbortController();
      const items = [1, 2, 3, 4, 5, 6];
      let chunksProcessed = 0;
      
      const processor = async (chunk: number[]) => {
        chunksProcessed++;
        if (chunksProcessed === 2) {
          controller.abort();
        }
        return chunk;
      };
      
      await expectRejection(
        processChunked(items, processor, { 
          chunkSize: 2, 
          signal: controller.signal 
        }),
        'Operation aborted'
      );
      
      expect(chunksProcessed).toBe(2);
    });
  });

  describe('mapConcurrent', () => {
    it('should map items with concurrency limit', async () => {
      const items = [1, 2, 3, 4, 5];
      const mapper = async (item: number) => item * 2;
      
      const results = await mapConcurrent(items, mapper, 2);
      
      expect(results).toEqual([2, 4, 6, 8, 10]);
    });

    it('should throw on first error', async () => {
      const items = [1, 2, 3, 4, 5];
      const mapper = async (item: number) => {
        if (item === 3) {
          throw new Error('Mapping error');
        }
        return item * 2;
      };
      
      await expectRejection(
        mapConcurrent(items, mapper, 2),
        'Mapping error'
      );
    });

    it('should use default concurrency', async () => {
      const items = [1, 2, 3];
      const mapper = async (item: number) => item * 2;
      
      const results = await mapConcurrent(items, mapper);
      
      expect(results).toEqual([2, 4, 6]);
    });
  });

  describe('processRateLimited', () => {
    it('should respect rate limit', async () => {
      const items = [1, 2, 3, 4, 5];
      let currentTime = 1000; // Start at a fixed time
      const processedTimes: number[] = [];
      
      const processor = async (item: number) => {
        processedTimes.push(currentTime);
        return item * 2;
      };
      
      // Mock Date.now for consistent timing
      vi.spyOn(Date, 'now').mockImplementation(() => currentTime);
      
      const promise = processRateLimited(items, processor, {
        maxPerSecond: 2 // Should take ~2.5 seconds for 5 items
      });
      
      // Process items by advancing time and letting promise settle
      const intervals = [0, 0, 500, 500, 500]; // First two immediate, then 500ms intervals
      for (let i = 0; i < 5; i++) {
        const interval = intervals[i] || 0;
        currentTime += interval;
        vi.advanceTimersByTime(interval);
        await Promise.resolve();
      }
      
      await vi.runAllTimersAsync();
      const results = await promise;
      
      expect(results).toEqual([2, 4, 6, 8, 10]);
      
      // Check timing - with maxPerSecond=2, we get 2 tokens initially
      // The actual processing times depend on when tokens are available
      expect(processedTimes[0]).toBeGreaterThanOrEqual(1000);
      expect(processedTimes[1]).toBeGreaterThanOrEqual(1000);
      // After first 2, we need to wait for tokens to refill
      expect(processedTimes[2]).toBeGreaterThanOrEqual(1500);
      expect(processedTimes[3]).toBeGreaterThanOrEqual(2000);
      expect(processedTimes[4]).toBeGreaterThanOrEqual(2500);
    });

    it('should handle burst capacity', async () => {
      const items = [1, 2, 3, 4, 5];
      let currentTime = 1000;
      const processedTimes: number[] = [];
      
      const processor = async (item: number) => {
        processedTimes.push(currentTime);
        return item;
      };
      
      vi.spyOn(Date, 'now').mockImplementation(() => currentTime);
      
      const promise = processRateLimited(items, processor, {
        maxPerSecond: 2,
        burst: 3 // Can process 3 items immediately
      });
      
      // Process items with timing
      const intervals = [0, 0, 0, 500, 500]; // First 3 immediate, then 500ms intervals
      for (let i = 0; i < 5; i++) {
        const interval = intervals[i] || 0;
        currentTime += interval;
        vi.advanceTimersByTime(interval);
        await Promise.resolve();
      }
      
      await vi.runAllTimersAsync();
      await promise;
      
      // First 3 should be processed immediately
      // With burst=3, first three can process when tokens available
      expect(processedTimes[0]).toBeGreaterThanOrEqual(1000);
      expect(processedTimes[1]).toBeGreaterThanOrEqual(1000);
      expect(processedTimes[2]).toBeGreaterThanOrEqual(1000);
      // Remaining items should be rate limited
      expect(processedTimes[3]).toBeGreaterThanOrEqual(1500);
      expect(processedTimes[4]).toBeGreaterThanOrEqual(2000);
    });

    it('should throw for invalid rate limit', async () => {
      const items = [1, 2, 3];
      const processor = async (item: number) => item;
      
      await expectRejection(
        processRateLimited(items, processor, { maxPerSecond: 0 }),
        'Rate limit must be positive'
      );
      
      await expectRejection(
        processRateLimited(items, processor, { maxPerSecond: -1 }),
        'Rate limit must be positive'
      );
    });

    it('should handle abort signal', async () => {
      const controller = new AbortController();
      const items = [1, 2, 3];
      const processor = async (item: number) => item;
      
      controller.abort();
      
      await expectRejection(
        processRateLimited(items, processor, { 
          maxPerSecond: 10,
          signal: controller.signal 
        }),
        'Operation aborted'
      );
    });

    it('should use default rate limit', async () => {
      const items = [1, 2, 3];
      const processor = async (item: number) => item * 2;
      
      const results = await processRateLimited(items, processor);
      
      expect(results).toEqual([2, 4, 6]);
    });
  });

  describe('performance', () => {
    it('should handle large datasets efficiently', async () => {
      const items = Array.from({ length: 1000 }, (_, i) => i);
      const processor = async (item: number) => item * 2;
      
      const results = await processBatch(items, processor, {
        concurrency: 50
      });
      
      expect(results).toHaveLength(1000);
      expect(results[0]?.value).toBe(0);
      expect(results[999]?.value).toBe(1998);
    });
  });
});
