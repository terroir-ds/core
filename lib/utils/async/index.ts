/**
 * Async utilities for the Terroir Core Design System
 * Provides robust async operations with proper cancellation and error handling
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