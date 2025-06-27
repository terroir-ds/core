/**
 * @module test/helpers/timing-helpers
 * 
 * Test helpers for timing and performance measurements in the Terroir Core Design System.
 * 
 * Provides comprehensive utilities for testing time-sensitive operations including
 * concurrency tracking, time mocking, performance measurement, and rate limiting.
 * These helpers ensure accurate testing of performance-critical code and timing-dependent
 * behavior.
 * 
 * @example Tracking concurrency
 * ```typescript
 * import { createConcurrencyTracker } from '@test/helpers/timing-helpers';
 * 
 * it('should limit concurrent operations', async () => {
 *   const tracker = createConcurrencyTracker();
 *   
 *   await Promise.all([
 *     tracker.track(() => delay(100)),
 *     tracker.track(() => delay(100)),
 *     tracker.track(() => delay(100))
 *   ]);
 *   
 *   expect(tracker.getMaxConcurrent()).toBe(3);
 * });
 * ```
 * 
 * @example Mocking Date.now
 * ```typescript
 * import { mockDateNow } from '@test/helpers/timing-helpers';
 * 
 * it('should track elapsed time', () => {
 *   const time = mockDateNow(1000);
 *   
 *   const start = Date.now(); // 1000
 *   time.advance(500);
 *   const end = Date.now(); // 1500
 *   
 *   expect(end - start).toBe(500);
 *   time.restore();
 * });
 * ```
 * 
 * @example Measuring performance
 * ```typescript
 * import { measureExecutionTiming } from '@test/helpers/timing-helpers';
 * 
 * it('should complete within time limit', async () => {
 *   const { result, duration } = await measureExecutionTiming(
 *     () => processData()
 *   );
 *   
 *   expect(duration).toBeLessThan(1000);
 *   expect(result).toBeDefined();
 * });
 * ```
 */

import { vi } from 'vitest';

/**
 * Track concurrent operations
 * Useful for testing concurrency limits
 */
export function createConcurrencyTracker(): {
  track: <T>(operation: () => Promise<T>) => Promise<T>;
  getMaxConcurrent: () => number;
  getCurrentActive: () => number;
  reset: () => void;
} {
  let activeCount = 0;
  let maxActive = 0;

  const track = async <T>(operation: () => Promise<T>): Promise<T> => {
    activeCount++;
    maxActive = Math.max(maxActive, activeCount);
    
    try {
      return await operation();
    } finally {
      activeCount--;
    }
  };

  return {
    track,
    getMaxConcurrent: () => maxActive,
    getCurrentActive: () => activeCount,
    reset: () => {
      activeCount = 0;
      maxActive = 0;
    },
  };
}

/**
 * Mock Date.now with controllable time
 * @param initialTime - Starting time value
 * @returns Controls for advancing time
 */
export function mockDateNow(initialTime: number = 0): {
  now: ReturnType<typeof vi.spyOn>;
  advance: (ms: number) => void;
  set: (time: number) => void;
  restore: () => void;
} {
  let currentTime = initialTime;
  const now = vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

  return {
    now,
    advance: (ms: number) => {
      currentTime += ms;
    },
    set: (time: number) => {
      currentTime = time;
    },
    restore: () => {
      now.mockRestore();
    },
  };
}

/**
 * Measure execution timing of async operations
 * @param operation - Operation to measure
 * @returns Result and timing information
 */
export async function measureExecutionTiming<T>(
  operation: () => Promise<T>
): Promise<{
  result: T;
  duration: number;
  startTime: number;
  endTime: number;
}> {
  const startTime = performance.now();
  const result = await operation();
  const endTime = performance.now();
  
  return {
    result,
    duration: endTime - startTime,
    startTime,
    endTime,
  };
}

/**
 * Create a rate limiter for testing
 * Tracks calls and enforces rate limits
 */
export function createRateLimiter(
  maxPerSecond: number,
  burst: number = maxPerSecond
): {
  call: () => Promise<void>;
  getCallCount: () => number;
  reset: () => void;
} {
  let tokens = burst;
  let lastRefill = Date.now();
  let callCount = 0;

  const call = async (): Promise<void> => {
    const now = Date.now();
    const elapsed = now - lastRefill;
    const refillAmount = (elapsed / 1000) * maxPerSecond;
    tokens = Math.min(burst, tokens + refillAmount);
    lastRefill = now;

    if (tokens < 1) {
      const waitTime = ((1 - tokens) / maxPerSecond) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      tokens = 1;
    }

    tokens--;
    callCount++;
  };

  return {
    call,
    getCallCount: () => callCount,
    reset: () => {
      tokens = burst;
      lastRefill = Date.now();
      callCount = 0;
    },
  };
}

/**
 * Create a performance observer for testing
 * Collects performance entries during test execution
 */
export function createPerformanceObserver(
  entryTypes: string[] = ['measure']
): {
  start: () => void;
  stop: () => void;
  getEntries: () => PerformanceEntry[];
  clear: () => void;
} {
  const entries: PerformanceEntry[] = [];
  let observer: PerformanceObserver | null = null;

  const start = () => {
    if (typeof PerformanceObserver === 'undefined') {
      return; // Not available in this environment
    }

    observer = new PerformanceObserver((list) => {
      entries.push(...list.getEntries());
    });

    observer.observe({ entryTypes });
  };

  const stop = () => {
    observer?.disconnect();
    observer = null;
  };

  return {
    start,
    stop,
    getEntries: () => [...entries],
    clear: () => {
      entries.length = 0;
    },
  };
}

/**
 * Simulate CPU-intensive work for a given duration
 * Useful for testing timeout and cancellation behavior
 */
export async function simulateWork(durationMs: number): Promise<void> {
  const start = Date.now();
  
  while (Date.now() - start < durationMs) {
    // Yield to event loop periodically
    if ((Date.now() - start) % 10 === 0) {
      await new Promise(resolve => setImmediate ? setImmediate(resolve) : setTimeout(resolve, 0));
    }
  }
}

/**
 * Create a batch timing tracker
 * Tracks timing of items processed in batches
 */
export function createBatchTimingTracker(): {
  startBatch: (size: number) => void;
  endBatch: () => void;
  startItem: (index: number) => void;
  endItem: (index: number) => void;
  getStats: () => {
    batches: Array<{ size: number; duration: number }>;
    items: Array<{ index: number; duration: number }>;
    averageBatchTime: number;
    averageItemTime: number;
  };
} {
  const batches: Array<{ size: number; startTime: number; endTime?: number }> = [];
  const items: Map<number, { startTime: number; endTime?: number }> = new Map();

  return {
    startBatch: (size: number) => {
      batches.push({ size, startTime: performance.now() });
    },
    
    endBatch: () => {
      const current = batches[batches.length - 1];
      if (current && !current.endTime) {
        current.endTime = performance.now();
      }
    },
    
    startItem: (index: number) => {
      items.set(index, { startTime: performance.now() });
    },
    
    endItem: (index: number) => {
      const item = items.get(index);
      if (item && !item.endTime) {
        item.endTime = performance.now();
      }
    },
    
    getStats: () => {
      const completedBatches = batches
        .filter(b => b.endTime)
        .map(b => ({ size: b.size, duration: (b.endTime ?? 0) - b.startTime }));
      
      const completedItems = Array.from(items.entries())
        .filter(([_, item]) => item.endTime)
        .map(([index, item]) => ({ index, duration: (item.endTime ?? 0) - item.startTime }));
      
      const averageBatchTime = completedBatches.length > 0
        ? completedBatches.reduce((sum, b) => sum + b.duration, 0) / completedBatches.length
        : 0;
      
      const averageItemTime = completedItems.length > 0
        ? completedItems.reduce((sum, i) => sum + i.duration, 0) / completedItems.length
        : 0;
      
      return {
        batches: completedBatches,
        items: completedItems,
        averageBatchTime,
        averageItemTime,
      };
    },
  };
}