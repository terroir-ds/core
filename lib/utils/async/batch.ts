/**
 * @module @utils/async/batch
 * 
 * Batch processing utilities for async operations in the Terroir Core Design System.
 * Provides concurrent processing with control over parallelism, chunking, rate limiting,
 * and progress reporting for efficient handling of large datasets.
 * 
 * @example Process multiple items concurrently
 * ```typescript
 * import { processBatch } from '@utils/async/batch';
 * 
 * const urls = ['url1', 'url2', 'url3', ...];
 * 
 * const results = await processBatch(
 *   urls,
 *   async (url) => fetch(url).then(r => r.json()),
 *   { 
 *     concurrency: 3,
 *     onProgress: (completed, total) => {
 *       console.log(`Progress: ${completed}/${total}`);
 *     }
 *   }
 * );
 * ```
 * 
 * @example Rate-limited API calls
 * ```typescript
 * import { processRateLimited } from '@utils/async/batch';
 * 
 * // Max 10 requests per second with burst of 20
 * const results = await processRateLimited(
 *   items,
 *   async (item) => callAPI(item),
 *   { maxPerSecond: 10, burst: 20 }
 * );
 * ```
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
import { AsyncAbortError, AsyncValidationError } from './errors.js';

/**
 * Options for batch processing operations
 * 
 * @public
 */
export interface BatchOptions extends CancellableProgressOptions {
  /**
   * Maximum number of items to process concurrently
   * @defaultValue 5
   */
  concurrency?: number;
  
  /**
   * Whether to preserve the order of results matching input order
   * When false, results return as they complete
   * @defaultValue true
   */
  preserveOrder?: boolean;
  
  /**
   * Whether to stop processing on first error
   * When false, continues processing and includes errors in results
   * @defaultValue false
   */
  stopOnError?: boolean;
}

/**
 * Result of a batch operation including both successes and failures
 * @typeParam T - Input item type
 * @typeParam R - Result type for successful operations
 * 
 * @public
 */
export type BatchResult<T, R> = BatchResultBase<T, R, Error>;

/**
 * Options for chunked processing
 * 
 * @public
 */
export interface ChunkedOptions extends CancellableOptions {
  /**
   * Number of items to process in each chunk
   */
  chunkSize: number;
}

/**
 * Options for rate-limited processing
 * 
 * @public
 */
export interface RateLimitOptions extends CancellableOptions {
  /**
   * Maximum operations per second
   */
  maxPerSecond: number;
  
  /**
   * Burst capacity for temporary spikes
   * Allows temporarily exceeding the rate limit
   * @defaultValue maxPerSecond * 2
   */
  burst?: number;
}

/**
 * Processes an array of items concurrently with controlled parallelism.
 * 
 * This function provides efficient batch processing with configurable concurrency,
 * error handling, and progress reporting. Results include both successful values
 * and errors, allowing for partial failure handling.
 * 
 * @typeParam T - The type of input items
 * @typeParam R - The type of successful results
 * 
 * @param items - Array of items to process
 * @param processor - Async function to process each item
 * @param options - Optional configuration
 * @param options.concurrency - Maximum concurrent operations (default: 5)
 * @param options.preserveOrder - Preserve input order in results (default: true)
 * @param options.stopOnError - Stop on first error (default: false)
 * @param options.onProgress - Progress callback
 * @param options.signal - AbortSignal for cancellation
 * 
 * @returns Array of results with either value or error for each item
 * 
 * @throws {AsyncAbortError} If aborted via signal
 * 
 * @example Basic batch processing
 * ```typescript
 * const urls = ['url1', 'url2', 'url3'];
 * 
 * const results = await processBatch(
 *   urls,
 *   async (url) => fetch(url).then(r => r.json()),
 *   { concurrency: 2 }
 * );
 * 
 * // Handle results
 * for (const result of results) {
 *   if (result.error) {
 *     console.error(`Failed to fetch ${result.item}:`, result.error);
 *   } else {
 *     console.log(`Data from ${result.item}:`, result.value);
 *   }
 * }
 * ```
 * 
 * @example With progress tracking
 * ```typescript
 * const files = await getFilesToProcess();
 * 
 * const results = await processBatch(
 *   files,
 *   async (file) => processFile(file),
 *   {
 *     concurrency: 4,
 *     onProgress: (completed, total) => {
 *       const percent = Math.round((completed / total) * 100);
 *       updateProgressBar(percent);
 *     }
 *   }
 * );
 * ```
 * 
 * @example Stop on first error
 * ```typescript
 * const critical = await processBatch(
 *   items,
 *   async (item) => validateCriticalItem(item),
 *   {
 *     stopOnError: true,
 *     preserveOrder: false // Get results as they complete
 *   }
 * );
 * ```
 * 
 * @public
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

  // Check if we were aborted
  if (signal?.aborted) {
    throw new AsyncAbortError();
  }

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
    throw new AsyncValidationError(AsyncErrorMessages.INVALID_CHUNK_SIZE, {
      context: { chunkSize }
    });
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
    throw new AsyncValidationError(AsyncErrorMessages.INVALID_RATE_LIMIT, {
      context: { maxPerSecond }
    });
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