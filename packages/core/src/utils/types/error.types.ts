/**
 * @module @utils/types/error
 * 
 * Type definitions for the error handling system.
 * 
 * Provides comprehensive type definitions for structured error handling,
 * including error categorization, severity levels, retry strategies, and
 * circuit breaker patterns. These types ensure consistent error handling
 * across the entire application.
 * 
 * @example Error creation with types
 * ```typescript
 * import type { ErrorOptions, ErrorSeverity } from '@utils/types/error';
 * 
 * const options: ErrorOptions = {
 *   severity: ErrorSeverity.HIGH,
 *   retryable: true,
 *   context: {
 *     operation: 'fetchUserData',
 *     userId: '123'
 *   }
 * };
 * 
 * throw new NetworkError('Failed to fetch user', options);
 * ```
 * 
 * @example Retry configuration
 * ```typescript
 * import type { RetryOptions } from '@utils/types/error';
 * 
 * const retryConfig: RetryOptions = {
 *   maxAttempts: 3,
 *   initialDelay: 1000,
 *   backoffFactor: 2,
 *   jitter: true,
 *   shouldRetry: (error) => error instanceof NetworkError
 * };
 * ```
 */

import type { LogContext } from './logger.types.js';

/**
 * Error severity levels for prioritization and alerting.
 * 
 * Used to categorize errors by their impact on the system:
 * - `LOW`: Minor issues, can be ignored in production
 * - `MEDIUM`: Should be investigated but not urgent
 * - `HIGH`: Requires attention, may impact users
 * - `CRITICAL`: System failure, immediate action required
 * 
 * @example
 * ```typescript
 * if (error.severity === ErrorSeverity.CRITICAL) {
 *   await alertOncallEngineer(error);
 * }
 * ```
 * 
 * @public
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error categories for classification and handling.
 * 
 * Categorizes errors by their domain for appropriate handling:
 * - `VALIDATION`: Input validation failures
 * - `CONFIGURATION`: Config/environment issues
 * - `NETWORK`: Network/connectivity problems
 * - `PERMISSION`: Auth/authorization failures
 * - `RESOURCE`: Missing/unavailable resources
 * - `BUSINESS_LOGIC`: Domain rule violations
 * - `INTEGRATION`: Third-party service issues
 * - `UNKNOWN`: Uncategorized errors
 * 
 * @example
 * ```typescript
 * switch (error.category) {
 *   case ErrorCategory.NETWORK:
 *   case ErrorCategory.INTEGRATION:
 *     return retry(operation);
 *   case ErrorCategory.VALIDATION:
 *     return showValidationErrors(error);
 *   default:
 *     return handleGenericError(error);
 * }
 * ```
 * 
 * @public
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  CONFIGURATION = 'configuration',
  NETWORK = 'network',
  PERMISSION = 'permission',
  RESOURCE = 'resource',
  BUSINESS_LOGIC = 'business_logic',
  INTEGRATION = 'integration',
  UNKNOWN = 'unknown',
}

/**
 * Structured error context
 */
export interface ErrorContext extends LogContext {
  /** Unique error instance ID */
  errorId?: string;
  /** Timestamp when error occurred */
  timestamp?: string;
  /** Request ID if available */
  requestId?: string;
  /** User ID if available (will be redacted in logs) */
  userId?: string;
  /** Component where error occurred */
  component?: string;
  /** Operation that failed */
  operation?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Error options for constructor
 */
export interface ErrorOptions {
  /** Error that caused this error */
  cause?: Error | unknown;
  /** Structured context */
  context?: ErrorContext;
  /** Error severity */
  severity?: ErrorSeverity;
  /** Error category */
  category?: ErrorCategory;
  /** Whether error is retryable */
  retryable?: boolean;
  /** HTTP status code if applicable */
  statusCode?: number;
  /** Error code for machines */
  code?: string;
}

/**
 * Configuration options for retry behavior.
 * 
 * Controls how operations are retried on failure, including backoff
 * strategies, timeouts, and cancellation. Used by the retry utilities
 * to implement resilient operations.
 * 
 * @example
 * ```typescript
 * const options: RetryOptions = {
 *   maxAttempts: 5,
 *   initialDelay: 100,
 *   maxDelay: 5000,
 *   backoffFactor: 2,
 *   jitter: true,
 *   timeout: 30000,
 *   shouldRetry: (error, attempt) => {
 *     return attempt < 3 && isRetryableError(error);
 *   },
 *   onRetry: (error, attempt, delay) => {
 *     logger.info(`Retry attempt ${attempt} after ${delay}ms`);
 *   }
 * };
 * ```
 * 
 * @public
 */
export interface RetryOptions {
  /** Maximum number of attempts */
  maxAttempts?: number;
  /** Initial delay in milliseconds */
  initialDelay?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** Backoff multiplication factor */
  backoffFactor?: number;
  /** Add random jitter to delays */
  jitter?: boolean;
  /** Operation timeout in milliseconds */
  timeout?: number;
  /** Custom retry predicate */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Cancellation signal */
  signal?: AbortSignal;
  /** Retry callback */
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
  /** Logger context */
  context?: LogContext;
}

/**
 * Configuration options for circuit breaker pattern.
 * 
 * Implements the circuit breaker pattern to prevent cascading failures.
 * The circuit opens after reaching failure threshold, rejects requests
 * during cooldown, then enters half-open state to test recovery.
 * 
 * @example
 * ```typescript
 * const config: CircuitBreakerOptions = {
 *   failureThreshold: 5,      // Open after 5 failures
 *   successThreshold: 2,      // Close after 2 successes  
 *   timeWindow: 60000,        // Count failures in 1 minute window
 *   cooldownPeriod: 30000,    // Wait 30s before half-open
 *   name: 'PaymentService'
 * };
 * 
 * const breaker = new CircuitBreaker(config);
 * ```
 * 
 * @public
 */
export interface CircuitBreakerOptions {
  /** Number of failures before opening circuit */
  failureThreshold?: number;
  /** Number of successes to close circuit */
  successThreshold?: number;
  /** Time window for failure counting (ms) */
  timeWindow?: number;
  /** Cooldown period when open (ms) */
  cooldownPeriod?: number;
  /** Circuit breaker name for logging */
  name?: string;
}

/**
 * Batch retry result
 */
export interface BatchRetryResult<T, U> {
  /** Original item */
  item: T;
  /** Success result */
  result?: U;
  /** Error if failed */
  error?: Error;
}