/**
 * @module @utils
 * 
 * Comprehensive utility modules for the Terroir Core Design System.
 * 
 * Provides a collection of lightweight, TypeScript-first utilities for
 * async operations, error handling, logging, type guards, and validation.
 * All utilities are designed for performance, type safety, and developer
 * experience.
 * 
 * @example Re-export pattern usage
 * ```typescript
 * // Import specific utilities
 * import { logger } from '@utils/logger';
 * import { isString, assertDefined } from '@utils/guards';
 * import { withTimeout, retry } from '@utils/async';
 * 
 * // Or import from main utils
 * import { logger, isString, withTimeout } from '@utils';
 * ```
 */

// =============================================================================
// SHARED UTILITIES
// =============================================================================

export * from './shared/index.js';

// =============================================================================
// CORE UTILITIES
// =============================================================================

// Async utilities (selective exports to avoid conflicts)
export {
  withTimeout,
  delay,
  retry,
  processBatch,
  combineSignals,
  timeout,
  defer,
  type RetryOptions,
  type BatchResult,
  type Deferred,
} from './async/index.js';

// Error handling (selective exports to avoid conflicts)
export {
  BaseError,
  ValidationError,
  NetworkError,
  ResourceError,
  ConfigurationError,
  PermissionError,
  BusinessLogicError,
  IntegrationError,
  MultiError,
  isError,
  isBaseError,
  isRetryableError,
  wrapError,
  createErrorFromResponse,
} from './errors/index.js';

// Logging (selective exports)
export {
  logger,
  createLogger,
  measureTime,
  generateRequestId,
  setRequestId,
  getRequestId,
  clearRequestId,
  runWithContext,
  type LogContext,
  type PerformanceMetrics,
} from './logger/index.js';

// Type system
export * from './types/async.types.js';

// =============================================================================
// GUARD UTILITIES
// =============================================================================

// Type guards and validation (selective exports to avoid conflicts)
export {
  // Type guards
  isString,
  isNumber,
  isBoolean,
  isArray,
  isObject,
  isDefined,
  isNullish,
  isPromise,
  isPlainObject,
  
  // Assertions
  assert,
  assertDefined,
  assertType,
  assertInstanceOf,
  
  // Validation
  isValidEmail,
  validateEmail,
  isValidUrl,
  validateUrl,
  isValidPhone,
  validatePhone,
  
  // Predicates
  isPositive,
  isNegative,
  hasMinLength,
  hasProperty,
  and,
  or,
  not,
  
  // Types
  type ValidationResult,
  type Predicate,
} from './guards/index.js';

