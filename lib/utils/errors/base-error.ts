/**
 * Base error classes for Terroir Core Design System
 * 
 * Features:
 * - Error.cause for error chaining (Node 16.9+)
 * - Structured error context
 * - Serialization support (enhanced with serialize-error)
 * - Stack trace enhancement
 * - Error categorization
 */

/// <reference lib="dom" />

import { randomUUID } from 'crypto';
import { serializeError } from 'serialize-error';
import type { LogContext } from '@utils/types/logger.types.js';
import {
  ErrorSeverity,
  ErrorCategory,
  type ErrorContext,
  type ErrorOptions,
} from '../types/error.types.js';
import { getMessage } from './messages.js';

// Re-export for backward compatibility
export {
  ErrorSeverity,
  ErrorCategory,
  type ErrorContext,
  type ErrorOptions,
} from '../types/error.types.js';

/**
 * Base error class with modern Node.js features
 */
export abstract class BaseError extends Error {
  /** Unique error instance ID */
  public readonly errorId: string;
  /** When the error occurred */
  public readonly timestamp: string;
  /** Error severity */
  public readonly severity: ErrorSeverity;
  /** Error category */
  public readonly category: ErrorCategory;
  /** Whether the operation can be retried */
  public readonly retryable: boolean;
  /** HTTP status code */
  public readonly statusCode: number;
  /** Machine-readable error code */
  public readonly code: string;
  /** Structured context */
  public readonly context: ErrorContext;

  constructor(message: string, options: ErrorOptions = {}) {
    super(message, { cause: options.cause });
    
    // Error.cause is available in Node 16.9+
    this.name = this.constructor.name;
    this.errorId = randomUUID();
    this.timestamp = new Date().toISOString();
    
    // Set properties with defaults
    this.severity = options.severity ?? ErrorSeverity.MEDIUM;
    this.category = options.category ?? ErrorCategory.UNKNOWN;
    this.retryable = options.retryable ?? false;
    this.statusCode = options.statusCode ?? 500;
    this.code = options.code ?? 'UNKNOWN_ERROR';
    
    // Merge context
    this.context = {
      errorId: this.errorId,
      timestamp: this.timestamp,
      ...options.context,
    };
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Get the root cause of the error chain
   */
  getRootCause(): Error | unknown {
    let cause: Error | unknown = this.cause;
    while (cause instanceof Error && cause.cause) {
      cause = cause.cause;
    }
    return cause || this;
  }

  /**
   * Get all errors in the chain
   */
  getErrorChain(): Array<Error | unknown> {
    const chain: Array<Error | unknown> = [this];
    let current: Error | unknown = this.cause;
    
    while (current) {
      chain.push(current);
      if (current instanceof Error) {
        current = current.cause;
      } else {
        break;
      }
    }
    
    return chain;
  }

  /**
   * Check if error chain contains a specific error type
   */
  hasErrorType<T extends Error>(errorClass: new (...args: unknown[]) => T): boolean {
    return this.getErrorChain().some(error => error instanceof errorClass);
  }

  /**
   * Serialize error for logging or API responses
   * Uses serialize-error to handle circular references
   */
  toJSON(): Record<string, unknown> {
    // Use serialize-error for robust serialization with circular reference handling
    const serialized = serializeError(this);
    
    // Ensure our custom properties are included
    return {
      ...serialized,
      errorId: this.errorId,
      timestamp: this.timestamp,
      severity: this.severity,
      category: this.category,
      retryable: this.retryable,
      statusCode: this.statusCode,
      code: this.code,
      context: this.context,
    };
  }

  /**
   * Create a safe object for external APIs (no stack traces)
   */
  toPublicJSON(): Record<string, unknown> {
    return {
      errorId: this.errorId,
      timestamp: this.timestamp,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      retryable: this.retryable,
    };
  }

  /**
   * Format error for logging with context
   */
  toLogContext(): LogContext {
    return {
      err: this,
      errorId: this.errorId,
      errorCode: this.code,
      severity: this.severity,
      category: this.category,
      retryable: this.retryable,
      ...this.context,
    };
  }
}

/**
 * Validation error for input validation failures
 */
export class ValidationError extends BaseError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      ...options,
      category: ErrorCategory.VALIDATION,
      severity: options.severity ?? ErrorSeverity.LOW,
      statusCode: options.statusCode ?? 400,
      code: options.code ?? 'VALIDATION_ERROR',
      retryable: false,
    });
  }
}

/**
 * Configuration error for config issues
 */
export class ConfigurationError extends BaseError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      ...options,
      category: ErrorCategory.CONFIGURATION,
      severity: options.severity ?? ErrorSeverity.HIGH,
      statusCode: options.statusCode ?? 500,
      code: options.code ?? 'CONFIG_ERROR',
      retryable: false,
    });
  }
}

/**
 * Network error for external service failures
 */
export class NetworkError extends BaseError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      ...options,
      category: ErrorCategory.NETWORK,
      severity: options.severity ?? ErrorSeverity.MEDIUM,
      statusCode: options.statusCode ?? 503,
      code: options.code ?? 'NETWORK_ERROR',
      retryable: options.retryable ?? true,
    });
  }
}

/**
 * Permission error for authorization failures
 */
export class PermissionError extends BaseError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      ...options,
      category: ErrorCategory.PERMISSION,
      severity: options.severity ?? ErrorSeverity.MEDIUM,
      statusCode: options.statusCode ?? 403,
      code: options.code ?? 'PERMISSION_ERROR',
      retryable: false,
    });
  }
}

/**
 * Resource error for missing or unavailable resources
 */
export class ResourceError extends BaseError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      ...options,
      category: ErrorCategory.RESOURCE,
      severity: options.severity ?? ErrorSeverity.MEDIUM,
      statusCode: options.statusCode ?? 404,
      code: options.code ?? 'RESOURCE_ERROR',
      retryable: false,
    });
  }
}

/**
 * Business logic error for domain-specific failures
 */
export class BusinessLogicError extends BaseError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      ...options,
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: options.severity ?? ErrorSeverity.MEDIUM,
      statusCode: options.statusCode ?? 422,
      code: options.code ?? 'BUSINESS_ERROR',
      retryable: false,
    });
  }
}

/**
 * Integration error for third-party service issues
 */
export class IntegrationError extends BaseError {
  constructor(message: string, options: ErrorOptions = {}) {
    super(message, {
      ...options,
      category: ErrorCategory.INTEGRATION,
      severity: options.severity ?? ErrorSeverity.HIGH,
      statusCode: options.statusCode ?? 502,
      code: options.code ?? 'INTEGRATION_ERROR',
      retryable: options.retryable ?? true,
    });
  }
}

/**
 * Aggregate multiple errors (using native AggregateError)
 */
export class MultiError extends AggregateError {
  public readonly errorId: string;
  public readonly timestamp: string;
  public readonly context: ErrorContext;

  constructor(errors: Error[], message: string, context?: ErrorContext) {
    super(errors, message);
    this.name = 'MultiError';
    this.errorId = randomUUID();
    this.timestamp = new Date().toISOString();
    this.context = {
      errorId: this.errorId,
      timestamp: this.timestamp,
      errorCount: errors.length,
      ...context,
    };
  }

  /**
   * Get all unique error types
   */
  getErrorTypes(): string[] {
    const types = new Set<string>();
    for (const error of this.errors) {
      if (error instanceof Error) {
        types.add(error.name);
      }
    }
    return Array.from(types);
  }

  /**
   * Get errors by type
   */
  getErrorsByType<T extends Error>(errorClass: new (...args: unknown[]) => T): T[] {
    return this.errors.filter((error): error is T => error instanceof errorClass);
  }

  /**
   * Check if contains specific error type
   */
  hasErrorType<T extends Error>(errorClass: new (...args: unknown[]) => T): boolean {
    return this.errors.some(error => error instanceof errorClass);
  }

  /**
   * Serialize for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      errorId: this.errorId,
      timestamp: this.timestamp,
      context: this.context,
      errors: this.errors.map(error => {
        if (error instanceof BaseError) {
          return error.toJSON();
        }
        // Use serialize-error for non-BaseError instances
        return serializeError(error);
      }),
    };
  }
}

/**
 * Type guard to check if value is an Error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard to check if value is a BaseError
 */
export function isBaseError(value: unknown): value is BaseError {
  return value instanceof BaseError;
}

/**
 * Type guard to check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof BaseError) {
    return error.retryable;
  }
  // Network errors are generally retryable
  if (error instanceof Error) {
    const networkErrorPatterns = [
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'EPIPE',
      'ECONNABORTED',
    ];
    return networkErrorPatterns.some(pattern => 
      error.message.includes(pattern) || error.message.includes('fetch failed')
    );
  }
  return false;
}

/**
 * Wrap unknown errors in BaseError
 */
export function wrapError(error: unknown, message?: string, options?: ErrorOptions): BaseError {
  if (error instanceof BaseError) {
    return error;
  }
  
  const errorMessage = message || 'An unexpected error occurred';
  const cause = error instanceof Error ? error : new Error(String(error));
  
  return new class extends BaseError {
    constructor() {
      super(errorMessage, {
        ...options,
        cause,
        code: options?.code ?? 'WRAPPED_ERROR',
      });
      this.name = 'WrappedError';
    }
  }();
}

/**
 * Create error from HTTP response
 */
export async function createErrorFromResponse(response: Response, context?: ErrorContext): Promise<BaseError> {
  let message = `HTTP ${response.status}: ${response.statusText}`;
  let details: unknown = {};
  
  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      details = await response.json();
      if (typeof details === 'object' && details !== null && 'message' in details) {
        message = String((details as Record<string, unknown>)['message']);
      }
    } else {
      const text = await response.text();
      if (text) {
        message += ` - ${text}`;
      }
    }
  } catch {
    // Ignore parsing errors
  }
  
  const options: ErrorOptions = {
    statusCode: response.status,
    context: {
      ...context,
      url: response.url,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries((response.headers as any).entries()),
      ...(typeof details === 'object' && details !== null ? details : {}),
    },
  };
  
  // Map status codes to error types with centralized messages
  switch (response.status) {
    case 400:
      return new ValidationError(message || getMessage('HTTP_BAD_REQUEST'), options);
    case 401:
      return new PermissionError(message || getMessage('HTTP_UNAUTHORIZED'), options);
    case 403:
      return new PermissionError(message || getMessage('HTTP_FORBIDDEN'), options);
    case 404:
      return new ResourceError(message || getMessage('HTTP_NOT_FOUND'), options);
    case 422:
      return new BusinessLogicError(message || getMessage('HTTP_UNPROCESSABLE_ENTITY'), options);
    case 429:
      return new NetworkError(message || getMessage('HTTP_TOO_MANY_REQUESTS'), options);
    case 502:
      return new NetworkError(message || getMessage('HTTP_BAD_GATEWAY'), options);
    case 503:
      return new NetworkError(message || getMessage('HTTP_SERVICE_UNAVAILABLE'), options);
    case 504:
      return new NetworkError(message || getMessage('HTTP_GATEWAY_TIMEOUT'), options);
    default: {
      if (response.status >= 500) {
        return new IntegrationError(message || getMessage('HTTP_INTERNAL_SERVER_ERROR'), options);
      }
      class HTTPError extends BaseError {
        constructor() {
          super(message, options);
          this.name = 'HTTPError';
        }
      }
      return new HTTPError();
    }
  }
}