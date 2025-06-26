/**
 * @fileoverview Standard error messages for async utilities
 * @module @utils/async/helpers/messages
 */

/**
 * Standard error messages used throughout async utilities
 */
export const AsyncErrorMessages = {
  // Timeout errors
  TIMEOUT: (ms: number) => `Operation timed out after ${ms}ms`,
  TIMEOUT_INVALID: 'Timeout must be a positive number',
  
  // Abort errors
  ABORTED: 'Operation aborted',
  ABORTED_WITH_REASON: (reason: string) => `Operation aborted: ${reason}`,
  
  // Promise errors
  NO_PROMISES: 'No promises provided',
  EMPTY_ARRAY: 'Array must not be empty',
  
  // Delay errors
  INVALID_DELAY: 'Delay must be a non-negative number',
  DELAY_SEQUENCE_EMPTY: 'Delay sequence must not be empty',
  INVALID_DELAY_VALUE: (value: unknown) => `Invalid delay value: ${value}`,
  
  // Batch processing errors
  INVALID_CHUNK_SIZE: 'Chunk size must be a positive integer',
  INVALID_CONCURRENCY: 'Concurrency must be a positive integer',
  INVALID_RATE_LIMIT: 'Rate limit must be positive',
  BATCH_EMPTY: 'Batch must not be empty',
  
  // Signal errors
  SIGNAL_AGGREGATION_FAILED: 'Failed to aggregate signals',
  SIGNAL_ALREADY_ABORTED: 'One or more signals already aborted',
  
  // Retry errors
  RETRY_LIMIT_EXCEEDED: (attempts: number) => `Retry limit exceeded after ${attempts} attempts`,
  INVALID_RETRY_COUNT: 'Retry count must be a non-negative integer',
  INVALID_RETRY_DELAY: 'Retry delay must be a non-negative number',
  
  // General validation errors
  INVALID_PARAMETER: (param: string, expected: string) => `Invalid parameter "${param}": expected ${expected}`,
  REQUIRED_PARAMETER: (param: string) => `Required parameter "${param}" is missing`,
  
  // Type errors
  INVALID_FUNCTION: 'Expected a function',
  INVALID_PROMISE: 'Expected a Promise',
  INVALID_ARRAY: 'Expected an array',
  INVALID_NUMBER: 'Expected a number',
  
  // Rate limiting errors
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  TOKEN_COUNT_INVALID: 'Token count must be positive',
  MAX_TOKENS_INVALID: 'Maximum tokens must be positive',
  REFILL_RATE_INVALID: 'Refill rate must be positive',
  
  // Queue errors
  QUEUE_FULL: 'Queue is full',
  QUEUE_EMPTY: 'Queue is empty',
  
  // Progress errors
  INVALID_TOTAL: 'Total must be a non-negative number',
  INVALID_INCREMENT: 'Increment must be positive',
} as const;

/**
 * Type-safe error message creator
 */
export type ErrorMessageKey = keyof typeof AsyncErrorMessages;

/**
 * Get a formatted error message
 * @param key - The error message key
 * @param args - Arguments for the message function
 * @returns The formatted error message
 */
export function getErrorMessage(key: ErrorMessageKey, ...args: unknown[]): string {
  const message = AsyncErrorMessages[key];
  if (typeof message === 'function') {
    return message(...args);
  }
  return message;
}

/**
 * Standard warning messages
 */
export const AsyncWarnings = {
  CLEANUP_FAILED: (count: number) => `${count} cleanup operations failed`,
  PARTIAL_BATCH_FAILURE: (failed: number, total: number) => 
    `${failed} of ${total} batch operations failed`,
  SLOW_OPERATION: (operation: string, ms: number) => 
    `Operation "${operation}" is taking longer than expected (${ms}ms)`,
  MEMORY_PRESSURE: 'High memory usage detected in async operation',
} as const;

/**
 * Debug messages for development
 */
export const AsyncDebugMessages = {
  OPERATION_START: (operation: string) => `Starting async operation: ${operation}`,
  OPERATION_COMPLETE: (operation: string, ms: number) => 
    `Completed async operation: ${operation} in ${ms}ms`,
  RETRY_ATTEMPT: (attempt: number, max: number) => 
    `Retry attempt ${attempt} of ${max}`,
  RATE_LIMIT_WAIT: (ms: number) => `Waiting ${ms}ms due to rate limit`,
  SIGNAL_RECEIVED: (type: string) => `Received signal: ${type}`,
} as const;