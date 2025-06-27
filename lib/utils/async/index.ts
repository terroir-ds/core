/**
 * @module @utils/async
 * 
 * Comprehensive async utilities for the Terroir Core Design System.
 * 
 * Provides robust async operations with proper cancellation, error handling,
 * timeout management, and progress tracking. All utilities support AbortSignal
 * for cancellation and follow consistent error handling patterns.
 * 
 * @example Import all async utilities
 * ```typescript
 * import { withTimeout, delay, processBatch, retry } from '@utils/async';
 * ```
 * 
 * @example Timeout management
 * ```typescript
 * import { withTimeout } from '@utils/async';
 * 
 * const result = await withTimeout(
 *   fetchData(),
 *   { timeout: 5000, errorMessage: 'Data fetch timed out' }
 * );
 * ```
 * 
 * @example Batch processing with cancellation
 * ```typescript
 * import { processBatch } from '@utils/async';
 * 
 * const controller = new AbortController();
 * const results = await processBatch(items, processItem, {
 *   concurrency: 5,
 *   signal: controller.signal,
 *   onProgress: (progress) => console.log(`${progress.percent}% complete`)
 * });
 * ```
 * 
 * @example Retry with exponential backoff
 * ```typescript
 * import { retry } from '@utils/async';
 * 
 * const data = await retry(
 *   () => fetchFromAPI(),
 *   {
 *     maxAttempts: 3,
 *     delay: 1000,
 *     backoff: 'exponential',
 *     shouldRetry: (error) => error.code === 'NETWORK_ERROR'
 *   }
 * );
 * ```
 */

// Re-export shared async types
export type {
  // Base options
  CancellableOptions,
  ProgressOptions,
  CancellableProgressOptions,
  
  // Callbacks and functions
  ProgressCallback,
  AsyncMapper,
  AsyncProcessor,
  AsyncFactory,
  AsyncPredicate,
  AsyncVoidFunction,
  
  // Result types
  Result,
  
  // Pattern types
  RetryDelay,
  RetryPredicate,
  ErrorConstructor,
} from '@utils/types/async.types.js';

// Also export utility functions
export {
  isPromise,
  isAbortError as isAbortErrorType,
  createErrorClass,
} from '@utils/types/async.types.js';

// Timeout utilities
export {
  withTimeout,
  timeout,
  raceWithTimeout,
  type TimeoutOptions,
} from './timeout.js';

// Delay utilities
export {
  delay,
  delayValue,
  randomDelay,
  debouncedDelay,
  type DelayOptions,
  type DebouncedDelayOptions,
} from './delay.js';

// Signal utilities
export {
  combineSignals,
  timeoutSignal,
  eventSignal,
  isAbortError,
  waitForAbort,
  manualSignal,
} from './signals.js';

// Batch processing utilities
export {
  processBatch,
  processChunked,
  mapConcurrent,
  processRateLimited,
  type BatchOptions,
  type BatchResult,
  type ChunkedOptions,
  type RateLimitOptions,
} from './batch.js';

// Error types
export {
  AsyncAbortError,
  AsyncTimeoutError,
  AsyncValidationError,
  RateLimitError,
  QueueError,
  PollingError,
} from './errors.js';

// Promise manipulation utilities
export {
  defer,
  retry,
  promiseWithFallback,
  allSettledWithTimeout,
  firstSuccessful,
  type Deferred,
  type RetryOptions,
  type FirstSuccessfulOptions,
} from './promise.js';