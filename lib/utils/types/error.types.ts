/**
 * Error handling types for Terroir Core Design System
 */

import type { LogContext } from './logger.types.js';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error categories for classification
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
 * Retry configuration options
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
 * Circuit breaker configuration options
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