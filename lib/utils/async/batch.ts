/**
 * Batch processing utilities for async operations
 * Provides concurrent processing with control over parallelism
 */

import type {
  CancellableOptions,
  CancellableProgressOptions,
  BatchResult as BatchResultBase,
  AsyncMapper
} from '@utils/types/async.types.js';

export interface BatchOptions extends CancellableProgressOptions {
  concurrency?: number;
  preserveOrder?: boolean;
  stopOnError?: boolean;
}

// Re-export BatchResult for backward compatibility
export type BatchResult<T, R> = BatchResultBase<T, R, Error>;

export interface ChunkedOptions extends CancellableOptions {
  chunkSize: number;
}

export interface RateLimitOptions extends CancellableOptions {
  maxPerSecond: number;
  burst?: number;
}

/**
 * Process items in batches with concurrency control
 */
export async function processBatch<T, R>(
  items: T[],
  processor: AsyncMapper<T, R>,
  options?: BatchOptions
): Promise<BatchResult<T, R>[]> {
  const {
    concurrency = 5,
    preserveOrder = true,
    stopOnError = false,
    onProgress,
    signal
  } = options ?? {};

  if (signal?.aborted) {
    throw new DOMException('Operation aborted', 'AbortError');
  }

  if (items.length === 0) {
    return [];
  }

  const results: BatchResult<T, R>[] = [];
  const queue = [...items.map((item, index) => ({ item, index }))];
  let completed = 0;
  let shouldStop = false;

  const processItem = async (item: T, index: number): Promise<void> => {
    if (shouldStop || signal?.aborted) {
      return;
    }

    try {
      const result = await processor(item, index);
      results[index] = { item, value: result, index };
    } catch (error) {
      results[index] = { 
        item, 
        error: error instanceof Error ? error : new Error(String(error)), 
        index 
      };
      
      if (stopOnError) {
        shouldStop = true;
      }
    }

    completed++;
    onProgress?.(completed, items.length);
  };

  // Process items with concurrency limit
  const workers: Promise<void>[] = [];
  
  for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
    workers.push((async () => {
      while (queue.length > 0 && !shouldStop && !signal?.aborted) {
        const next = queue.shift();
        if (next) {
          await processItem(next.item, next.index);
        }
      }
    })());
  }

  await Promise.all(workers);

  if (signal?.aborted) {
    throw new DOMException('Operation aborted', 'AbortError');
  }

  return preserveOrder ? results : results.filter(r => r !== undefined);
}

/**
 * Process items in chunks
 */
export async function processChunked<T, R>(
  items: T[],
  processor: (chunk: T[]) => Promise<R[]>,
  options: ChunkedOptions
): Promise<R[]> {
  const { chunkSize, signal } = options;

  if (signal?.aborted) {
    throw new DOMException('Operation aborted', 'AbortError');
  }

  if (chunkSize <= 0) {
    throw new Error('Chunk size must be positive');
  }

  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += chunkSize) {
    if (signal?.aborted) {
      throw new DOMException('Operation aborted', 'AbortError');
    }

    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await processor(chunk);
    results.push(...chunkResults);
  }

  return results;
}

/**
 * Map with concurrency limit
 */
export async function mapConcurrent<T, R>(
  items: T[],
  mapper: AsyncMapper<T, R>,
  concurrency: number = 5
): Promise<R[]> {
  const batchResults = await processBatch(items, mapper, {
    concurrency,
    preserveOrder: true,
    stopOnError: true
  });

  const results: R[] = [];
  
  for (const batchResult of batchResults) {
    if (batchResult.error) {
      throw batchResult.error;
    }
    if (batchResult.value !== undefined) {
      results.push(batchResult.value);
    }
  }

  return results;
}

/**
 * Process with rate limiting
 */
export async function processRateLimited<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options?: RateLimitOptions
): Promise<R[]> {
  const {
    maxPerSecond,
    burst = maxPerSecond,
    signal
  } = options ?? { maxPerSecond: 10 };

  if (signal?.aborted) {
    throw new DOMException('Operation aborted', 'AbortError');
  }

  if (maxPerSecond <= 0) {
    throw new Error('Rate limit must be positive');
  }

  const results: R[] = [];
  const delayMs = 1000 / maxPerSecond;
  let tokens = burst;
  let lastRefill = Date.now();

  for (let i = 0; i < items.length; i++) {
    if (signal?.aborted) {
      throw new DOMException('Operation aborted', 'AbortError');
    }

    // Refill tokens
    const now = Date.now();
    const elapsed = now - lastRefill;
    const refillAmount = (elapsed / 1000) * maxPerSecond;
    tokens = Math.min(burst, tokens + refillAmount);
    lastRefill = now;

    // Wait if no tokens available
    if (tokens < 1) {
      const waitTime = (1 - tokens) * delayMs;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      tokens = 1;
    }

    // Process item
    tokens--;
    const item = items[i];
    if (item !== undefined) {
      const result = await processor(item);
      results.push(result);
    }
  }

  return results;
}