/**
 * @module @utils/errors
 * 
 * Comprehensive error handling system for the Terroir Core Design System.
 * 
 * This module provides a complete error handling solution with structured errors,
 * automatic retries, circuit breakers, and recovery strategies. All errors extend
 * from BaseError to provide consistent error handling across the application.
 * 
 * Features:
 * - Structured error classes with unique IDs and context
 * - Native error chaining using Error.cause (Node 16.9+)
 * - Automatic retry logic with exponential backoff
 * - Circuit breaker pattern for fault tolerance
 * - Global error handlers and recovery strategies
 * - Centralized error messages for i18n support
 * - Type-safe error handling with TypeScript
 * 
 * @example Basic error handling
 * ```typescript
 * import { ValidationError, isRetryableError } from '@utils/errors';
 * 
 * try {
 *   validateUserInput(data);
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     return res.status(400).json(error.toPublicJSON());
 *   }
 *   
 *   if (isRetryableError(error)) {
 *     return retry(() => processData(data));
 *   }
 *   
 *   throw error;
 * }
 * ```
 * 
 * @example Retry with circuit breaker
 * ```typescript
 * import { retryWithCircuitBreaker } from '@utils/errors';
 * 
 * const fetchData = retryWithCircuitBreaker(
 *   async () => {
 *     const response = await fetch('/api/data');
 *     if (!response.ok) throw new Error('Failed');
 *     return response.json();
 *   },
 *   {
 *     maxRetries: 3,
 *     circuitBreaker: {
 *       failureThreshold: 5,
 *       resetTimeout: 60000
 *     }
 *   }
 * );
 * ```
 * 
 * @example Global error handling
 * ```typescript
 * import { setupGlobalErrorHandlers, registerErrorHandler } from '@utils/errors';
 * 
 * // Set up default handlers
 * setupGlobalErrorHandlers();
 * 
 * // Register custom handler
 * registerErrorHandler((error, context) => {
 *   if (error instanceof DatabaseError) {
 *     notifyOps(error);
 *     return true; // Handled
 *   }
 *   return false;
 * });
 * ```
 * 
 * @example Error recovery
 * ```typescript
 * import { withErrorHandling, registerRecoveryStrategy } from '@utils/errors';
 * 
 * // Register recovery strategy
 * registerRecoveryStrategy('database', async (error) => {
 *   if (error instanceof DatabaseError) {
 *     await reconnectDatabase();
 *     return { recovered: true, value: null };
 *   }
 *   return { recovered: false };
 * });
 * 
 * // Use with automatic recovery
 * const result = await withErrorHandling(
 *   async () => queryDatabase(),
 *   { 
 *     fallback: getCachedData(),
 *     recoveryStrategies: ['database']
 *   }
 * );
 * ```
 */

// Base error classes and types
export {
  BaseError,
  ValidationError,
  ConfigurationError,
  NetworkError,
  PermissionError,
  ResourceError,
  BusinessLogicError,
  IntegrationError,
  MultiError,
  ErrorSeverity,
  ErrorCategory,
  type ErrorContext,
  type ErrorOptions,
  isError,
  isBaseError,
  isRetryableError,
  wrapError,
  createErrorFromResponse,
} from './base-error.js';

// Retry and resilience patterns
export {
  retry,
  withTimeout,
  CircuitBreaker,
  retryWithCircuitBreaker,
  batchRetry,
  makeRetryable,
  type RetryOptions,
  type CircuitBreakerOptions,
} from './retry.js';

// Error handlers and utilities
export {
  registerErrorHandler,
  unregisterErrorHandler,
  registerRecoveryStrategy,
  handleError,
  tryRecover,
  withErrorHandling,
  errorBoundary,
  setupGlobalErrorHandlers,
  formatError,
  extractErrorDetails,
  assert,
  assertDefined,
  type ErrorHandler,
  type RecoveryStrategy,
} from './handlers.js';

// Centralized error messages
export {
  ERROR_MESSAGES,
  ERROR_MESSAGE_CATEGORIES,
  getMessage,
  createLocalizedMessages,
  validateMessages,
  type ErrorMessageKey,
  type I18nErrorMessages,
} from './messages.js';

// All functions are already exported above