/**
 * @fileoverview Typed error classes for async utilities
 * @module @utils/async/errors
 */

import {
  BaseError,
  ValidationError,
  type ErrorOptions,
  ErrorSeverity,
  ErrorCategory,
} from '@utils/errors/index.js';
import { getMessage } from '@utils/errors/messages.js';

/**
 * Error thrown when an async operation is aborted
 */
export class AsyncAbortError extends BaseError {
  constructor(message = getMessage('OPERATION_ABORTED'), options?: ErrorOptions) {
    super(message, {
      ...options,
      code: options?.code ?? 'ASYNC_ABORTED',
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.LOW,
      retryable: false,
      statusCode: 499, // Client Closed Request
    });
  }
}

/**
 * Error thrown when an async operation times out
 */
export class AsyncTimeoutError extends BaseError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, {
      ...options,
      code: options?.code ?? 'ASYNC_TIMEOUT',
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      statusCode: 408, // Request Timeout
    });
  }
}

/**
 * Error thrown for invalid async operation parameters
 */
export class AsyncValidationError extends ValidationError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, {
      ...options,
      code: options?.code ?? 'ASYNC_INVALID_PARAMETER',
    });
  }
}

/**
 * Error thrown when rate limits are exceeded
 */
export class RateLimitError extends BaseError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, {
      ...options,
      code: options?.code ?? 'RATE_LIMIT_EXCEEDED',
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      statusCode: 429, // Too Many Requests
    });
  }
}

/**
 * Error thrown when queue operations fail
 */
export class QueueError extends BaseError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, {
      ...options,
      code: options?.code ?? 'QUEUE_ERROR',
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.MEDIUM,
      retryable: options?.retryable ?? false,
      statusCode: 503, // Service Unavailable
    });
  }
}

/**
 * Error thrown for polling operations
 */
export class PollingError extends BaseError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, {
      ...options,
      code: options?.code ?? 'POLLING_ERROR',
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.MEDIUM,
      retryable: false,
      statusCode: 408, // Request Timeout
    });
  }
}