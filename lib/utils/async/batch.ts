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
import { checkAborted } from './helpers/abort.js';
import { ConcurrentQueue } from './helpers/queue.js';
import { TokenBucket } from './helpers/rate-limit.js';
import { AsyncErrorMessages } from './helpers/messages.js';

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

  checkAborted(signal);

  if (items.length === 0) {
    return [];
  }

  // Create a wrapper to match the queue processor signature
  const queueProcessor = async (item: { item: T; index: number }) => {
    const result = await processor(item.item, item.index);
    return { item: item.item, value: result, index: item.index } as BatchResult<T, R>;
  };

  // Use concurrent queue for processing
  const queueOptions = {
    concurrency,
    stopOnError,
    preserveOrder,
    ...(onProgress && { onProgress }),
    ...(signal && { signal })
  };
  const queue = new ConcurrentQueue(queueProcessor, queueOptions);

  const indexedItems = items.map((item, index) => ({ item, index }));
  const results = await queue.process(indexedItems);

  // Convert queue results to batch results
  const batchResults: BatchResult<T, R>[] = [];
  
  for (const [input, result] of results) {
    if (result.success && result.result) {
      batchResults[input.index] = result.result;
    } else if (!result.success) {
      batchResults[input.index] = {
        item: input.item,
        error: result.error as Error,
        index: input.index
      };
    }
  }

  return preserveOrder ? batchResults : batchResults.filter(r => r !== undefined);
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

  checkAborted(signal);

  if (chunkSize <= 0) {
    throw new Error(AsyncErrorMessages.INVALID_CHUNK_SIZE);
  }

  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += chunkSize) {
    checkAborted(signal);

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

  checkAborted(signal);

  if (maxPerSecond <= 0) {
    throw new Error(AsyncErrorMessages.INVALID_RATE_LIMIT);
  }

  const bucket = new TokenBucket(burst, maxPerSecond);
  const results: R[] = [];

  for (let i = 0; i < items.length; i++) {
    checkAborted(signal);

    // Wait for token
    const acquireOptions = signal ? { signal } : undefined;
    await bucket.acquire(1, acquireOptions);

    // Process item
    const item = items[i];
    if (item !== undefined) {
      const result = await processor(item);
      results.push(result);
    }
  }

  return results;
}