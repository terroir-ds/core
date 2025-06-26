/**
 * Error handling system for Terroir Core Design System
 * 
 * This module provides a comprehensive error handling system with:
 * - Structured error classes with context
 * - Error chaining using Error.cause (Node 16.9+)
 * - Retry logic with exponential backoff
 * - Circuit breaker pattern
 * - Error serialization and formatting
 * - Global error handlers
 * - Recovery strategies
 * - Centralized error messages for consistency
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