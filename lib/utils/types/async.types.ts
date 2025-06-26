/**
 * @module @utils/types/async
 * 
 * Shared type definitions for async operations across the Terroir Core Design System.
 * These types provide consistent patterns for cancellation, progress reporting,
 * error handling, and other common async operation concerns.
 */

/**
 * Base options for operations that support cancellation via AbortSignal
 */
export interface CancellableOptions {
  /** Signal to abort the operation */
  signal?: AbortSignal;
}

/**
 * Callback for reporting operation progress
 */
export type ProgressCallback = (completed: number, total: number) => void;

/**
 * Deferred promise pattern - provides external control over promise resolution
 * Useful for bridging callback-based APIs to promises
 */
export interface Deferred<T> {
  /** The promise that will be resolved or rejected */
  promise: Promise<T>;
  /** Resolves the promise with a value */
  resolve: (value: T | PromiseLike<T>) => void;
  /** Rejects the promise with a reason */
  reject: (reason?: unknown) => void;
}

/**
 * Result container that can hold either a successful value or an error
 * Useful for operations that should continue despite individual failures
 */
export interface Result<T, E = Error> {
  /** The successful value, if any */
  value?: T;
  /** The error that occurred, if any */
  error?: E;
}

/**
 * Result with additional metadata for batch operations
 */
export interface BatchResult<T, R, E = Error> extends Result<R, E> {
  /** The original input item */
  item: T;
  /** Index of the item in the batch */
  index: number;
}

/**
 * Flexible retry delay strategy
 * Can be a fixed delay or a function that calculates delay based on attempt number
 */
export type RetryDelay = number | ((attempt: number) => number);

/**
 * Predicate to determine if an operation should be retried
 */
export type RetryPredicate = (error: unknown, attempt: number) => boolean;

/**
 * Constructor for custom error types
 */
export type ErrorConstructor = new (message: string) => Error;

/**
 * Async function that maps an item to a result
 */
export type AsyncMapper<T, R> = (item: T, index: number) => Promise<R>;

/**
 * Async function that processes a batch of items
 */
export type AsyncProcessor<T, R> = (items: T[]) => Promise<R[]>;

/**
 * Async function that creates a value
 */
export type AsyncFactory<T> = () => Promise<T>;

/**
 * Async predicate function
 */
export type AsyncPredicate<T> = (item: T) => Promise<boolean>;

/**
 * Async function with no parameters
 */
export type AsyncVoidFunction = () => Promise<void>;

/**
 * Options for operations that report progress
 */
export interface ProgressOptions {
  /** Callback to report progress */
  onProgress?: ProgressCallback;
}

/**
 * Combined options for cancellable operations with progress
 */
export interface CancellableProgressOptions extends CancellableOptions, ProgressOptions {}

/**
 * Type guard to check if a value is a Promise
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    'then' in value &&
    typeof value.then === 'function'
  );
}

/**
 * Type guard to check if an error is an abort error
 */
export function isAbortError(error: unknown): error is Error {
  if (!error || typeof error !== 'object') {
    return false;
  }
  
  // Check for DOMException with AbortError name
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }
  
  // Check for standard Error with abort-related names
  if (error instanceof Error) {
    return error.name === 'AbortError' || error.name === 'TimeoutError';
  }
  
  // Check for Node.js-style error objects
  const errorObj = error as { code?: string; name?: string };
  return (
    errorObj.code === 'ABORT_ERR' ||
    errorObj.name === 'AbortError'
  );
}

/**
 * Creates a typed error constructor
 */
export function createErrorClass(name: string): ErrorConstructor {
  return class extends Error {
    constructor(message: string) {
      super(message);
      this.name = name;
      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  };
}