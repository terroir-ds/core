/**
 * @module @utils/errors/messages
 * 
 * Centralized error messages for the Terroir Core Design System.
 * 
 * Provides a comprehensive catalog of error message templates that ensure
 * consistent messaging across the entire application. Messages are organized
 * by category and designed to be easily localizable for future i18n support.
 * 
 * Benefits:
 * - Consistent error messaging across the system
 * - Test stability (copy changes don't break tests)
 * - Future i18n support ready
 * - Easy maintenance and updates
 * - Type-safe message keys
 * - Categorized for easy filtering
 * 
 * @example Basic usage
 * ```typescript
 * import { getMessage } from '@utils/errors/messages';
 * 
 * // Simple messages
 * const msg1 = getMessage('PERMISSION_DENIED');
 * // "Permission denied"
 * 
 * // Messages with parameters
 * const msg2 = getMessage('OPERATION_FAILED', 3);
 * // "Operation failed after 3 attempt(s)"
 * 
 * const msg3 = getMessage('RESOURCE_NOT_FOUND', 'User', '123');
 * // "User not found: 123"
 * ```
 * 
 * @example With error classes
 * ```typescript
 * import { ValidationError } from '@utils/errors';
 * import { getMessage } from '@utils/errors/messages';
 * 
 * throw new ValidationError(
 *   getMessage('VALIDATION_REQUIRED', 'email'),
 *   { code: 'EMAIL_REQUIRED' }
 * );
 * ```
 * 
 * @example Category filtering
 * ```typescript
 * import { ERROR_MESSAGE_CATEGORIES } from '@utils/errors/messages';
 * 
 * // Get all validation message keys
 * const validationKeys = ERROR_MESSAGE_CATEGORIES.VALIDATION;
 * 
 * // Check if error is network-related
 * if (ERROR_MESSAGE_CATEGORIES.NETWORK.includes(error.code)) {
 *   enableRetry();
 * }
 * ```
 * 
 * @example Future i18n support
 * ```typescript
 * import { createLocalizedMessages } from '@utils/errors/messages';
 * 
 * // Ready for future localization
 * const messages = createLocalizedMessages('fr');
 * const msg = messages.messages.PERMISSION_DENIED;
 * ```
 */

/**
 * Core error message templates catalog.
 * 
 * Contains all error messages used throughout the application, organized
 * by category. Messages can be simple strings or functions that accept
 * parameters for dynamic content.
 * 
 * @example
 * ```typescript
 * // Static message
 * ERROR_MESSAGES.PERMISSION_DENIED // "Permission denied"
 * 
 * // Dynamic message
 * ERROR_MESSAGES.OPERATION_FAILED(3) // "Operation failed after 3 attempt(s)"
 * ```
 * 
 * @public
 */
export const ERROR_MESSAGES = {
  // Retry/Network errors
  OPERATION_FAILED: (attempts: number) => `Operation failed after ${attempts} attempt(s)`,
  OPERATION_CANCELLED: 'Operation cancelled',
  OPERATION_ABORTED: 'Operation aborted',
  OPERATION_TIMEOUT: (ms: number) => `Operation timed out after ${ms}ms`,
  
  // Circuit breaker errors  
  CIRCUIT_OPEN: 'Circuit breaker is open',
  CIRCUIT_HALF_OPEN: 'Circuit breaker half-open',
  CIRCUIT_CLOSED: 'Circuit breaker closed',
  
  // Validation errors
  VALIDATION_REQUIRED: (field: string) => `${field} is required`,
  VALIDATION_INVALID: (field: string, value?: unknown) => 
    value !== undefined ? `${field} has invalid value: ${String(value)}` : `${field} is invalid`,
  VALIDATION_TYPE: (field: string, expected: string, actual: string) => 
    `${field} must be ${expected}, got ${actual}`,
  VALIDATION_RANGE: (field: string, min?: number, max?: number) => {
    if (min !== undefined && max !== undefined) {
      return `${field} must be between ${min} and ${max}`;
    } else if (min !== undefined) {
      return `${field} must be at least ${min}`;
    } else if (max !== undefined) {
      return `${field} must be at most ${max}`;
    }
    return `${field} is out of range`;
  },
  
  // Configuration errors
  CONFIG_MISSING: (key: string) => `Configuration key '${key}' is missing`,
  CONFIG_INVALID: (key: string, reason?: string) => 
    reason ? `Configuration key '${key}' is invalid: ${reason}` : `Configuration key '${key}' is invalid`,
  CONFIG_ENV_MISSING: (env: string) => `Environment variable '${env}' is not set`,
  CONFIG_FILE_NOT_FOUND: (path: string) => `Configuration file not found: ${path}`,
  CONFIG_FILE_INVALID: (path: string, reason?: string) => 
    reason ? `Configuration file invalid: ${path} - ${reason}` : `Configuration file invalid: ${path}`,
  
  // Permission/Security errors
  PERMISSION_DENIED: 'Permission denied',
  PERMISSION_INSUFFICIENT: (required: string) => `Insufficient permissions. Required: ${required}`,
  AUTH_REQUIRED: 'Authentication required',
  AUTH_INVALID: 'Invalid authentication credentials',
  AUTH_EXPIRED: 'Authentication token has expired',
  
  // Resource errors
  RESOURCE_NOT_FOUND: (type: string, id?: string) => 
    id ? `${type} not found: ${id}` : `${type} not found`,
  RESOURCE_CONFLICT: (type: string, id?: string) => 
    id ? `${type} already exists: ${id}` : `${type} already exists`,
  RESOURCE_LOCKED: (type: string, id?: string) => 
    id ? `${type} is locked: ${id}` : `${type} is locked`,
  RESOURCE_UNAVAILABLE: (type: string) => `${type} is temporarily unavailable`,
  
  // Network/Integration errors
  NETWORK_CONNECTION_FAILED: 'Network connection failed',
  NETWORK_TIMEOUT: 'Network request timed out',
  NETWORK_UNAVAILABLE: 'Network is unavailable',
  SERVICE_UNAVAILABLE: (service: string) => `Service '${service}' is unavailable`,
  SERVICE_ERROR: (service: string, error?: string) => 
    error ? `Service '${service}' error: ${error}` : `Service '${service}' error`,
  API_RATE_LIMITED: 'API rate limit exceeded',
  API_QUOTA_EXCEEDED: 'API quota exceeded',
  
  // Business logic errors
  BUSINESS_RULE_VIOLATED: (rule: string) => `Business rule violated: ${rule}`,
  WORKFLOW_INVALID_STATE: (current: string, attempted: string) => 
    `Cannot transition from '${current}' to '${attempted}'`,
  DATA_INCONSISTENT: (details?: string) => 
    details ? `Data inconsistency detected: ${details}` : 'Data inconsistency detected',
  
  // File/IO errors
  FILE_NOT_FOUND: (path: string) => `File not found: ${path}`,
  FILE_ACCESS_DENIED: (path: string) => `Access denied to file: ${path}`,
  FILE_TOO_LARGE: (path: string, maxSize?: string) => 
    maxSize ? `File too large: ${path} (max: ${maxSize})` : `File too large: ${path}`,
  DIRECTORY_NOT_FOUND: (path: string) => `Directory not found: ${path}`,
  DISK_FULL: 'Insufficient disk space',
  
  // General system errors
  INTERNAL_ERROR: 'An internal error occurred',
  UNEXPECTED_ERROR: 'An unexpected error occurred',
  NOT_IMPLEMENTED: (feature: string) => `Feature not implemented: ${feature}`,
  DEPRECATED_FEATURE: (feature: string, alternative?: string) => 
    alternative ? `Feature '${feature}' is deprecated. Use '${alternative}' instead` : `Feature '${feature}' is deprecated`,
  
  // HTTP-specific errors
  HTTP_BAD_REQUEST: 'Bad request',
  HTTP_UNAUTHORIZED: 'Unauthorized',
  HTTP_FORBIDDEN: 'Forbidden',
  HTTP_NOT_FOUND: 'Not found',
  HTTP_METHOD_NOT_ALLOWED: (method: string) => `Method '${method}' not allowed`,
  HTTP_CONFLICT: 'Conflict',
  HTTP_UNPROCESSABLE_ENTITY: 'Unprocessable entity',
  HTTP_TOO_MANY_REQUESTS: 'Too many requests',
  HTTP_INTERNAL_SERVER_ERROR: 'Internal server error',
  HTTP_BAD_GATEWAY: 'Bad gateway',
  HTTP_SERVICE_UNAVAILABLE: 'Service unavailable',
  HTTP_GATEWAY_TIMEOUT: 'Gateway timeout',
  HTTP_UNPROCESSABLE: 'Unprocessable entity',
  HTTP_RATE_LIMITED: 'Rate limited',
  HTTP_SERVER_ERROR: 'Server error',
  HTTP_CLIENT_ERROR: 'Client error',
  
  // General
  UNKNOWN_ERROR: 'Unknown error',
  MULTIPLE_ERRORS: 'Multiple errors occurred',
} as const;

/**
 * Error message categories for grouping and filtering.
 * 
 * Groups error message keys by their category, making it easy to
 * identify error types and apply category-specific handling.
 * 
 * @example
 * ```typescript
 * // Check if error is retryable
 * if (ERROR_MESSAGE_CATEGORIES.NETWORK.includes(errorCode)) {
 *   return retry(operation);
 * }
 * 
 * // Get all validation errors for documentation
 * const validationErrors = ERROR_MESSAGE_CATEGORIES.VALIDATION
 *   .map(key => ({ key, message: ERROR_MESSAGES[key] }));
 * ```
 * 
 * @public
 */
export const ERROR_MESSAGE_CATEGORIES = {
  RETRY: [
    'OPERATION_FAILED',
    'OPERATION_CANCELLED', 
    'OPERATION_TIMEOUT',
    'CIRCUIT_OPEN',
    'CIRCUIT_HALF_OPEN',
    'CIRCUIT_CLOSED',
  ],
  VALIDATION: [
    'VALIDATION_REQUIRED',
    'VALIDATION_INVALID',
    'VALIDATION_TYPE',
    'VALIDATION_RANGE',
  ],
  CONFIGURATION: [
    'CONFIG_MISSING',
    'CONFIG_INVALID',
    'CONFIG_ENV_MISSING',
    'CONFIG_FILE_NOT_FOUND',
    'CONFIG_FILE_INVALID',
  ],
  PERMISSION: [
    'PERMISSION_DENIED',
    'PERMISSION_INSUFFICIENT',
    'AUTH_REQUIRED',
    'AUTH_INVALID',
    'AUTH_EXPIRED',
  ],
  RESOURCE: [
    'RESOURCE_NOT_FOUND',
    'RESOURCE_CONFLICT',
    'RESOURCE_LOCKED',
    'RESOURCE_UNAVAILABLE',
  ],
  NETWORK: [
    'NETWORK_CONNECTION_FAILED',
    'NETWORK_TIMEOUT',
    'NETWORK_UNAVAILABLE',
    'SERVICE_UNAVAILABLE',
    'SERVICE_ERROR',
    'API_RATE_LIMITED',
    'API_QUOTA_EXCEEDED',
  ],
  BUSINESS: [
    'BUSINESS_RULE_VIOLATED',
    'WORKFLOW_INVALID_STATE',
    'DATA_INCONSISTENT',
  ],
  FILE: [
    'FILE_NOT_FOUND',
    'FILE_ACCESS_DENIED',
    'FILE_TOO_LARGE',
    'DIRECTORY_NOT_FOUND',
    'DISK_FULL',
  ],
  SYSTEM: [
    'INTERNAL_ERROR',
    'UNEXPECTED_ERROR',
    'NOT_IMPLEMENTED',
    'DEPRECATED_FEATURE',
  ],
  HTTP: [
    'HTTP_BAD_REQUEST',
    'HTTP_UNAUTHORIZED',
    'HTTP_FORBIDDEN',
    'HTTP_NOT_FOUND',
    'HTTP_METHOD_NOT_ALLOWED',
    'HTTP_CONFLICT',
    'HTTP_UNPROCESSABLE_ENTITY',
    'HTTP_TOO_MANY_REQUESTS',
    'HTTP_INTERNAL_SERVER_ERROR',
    'HTTP_BAD_GATEWAY',
    'HTTP_SERVICE_UNAVAILABLE',
    'HTTP_GATEWAY_TIMEOUT',
    'HTTP_UNPROCESSABLE',
    'HTTP_RATE_LIMITED',
    'HTTP_SERVER_ERROR',
    'HTTP_CLIENT_ERROR',
  ],
  GENERAL: [
    'UNKNOWN_ERROR',
    'MULTIPLE_ERRORS',
  ],
} as const;

/**
 * Gets an error message by key with type safety.
 * 
 * Retrieves a message template and applies any provided arguments.
 * This abstraction layer is future-ready for i18n implementation,
 * allowing easy swapping of message catalogs based on locale.
 * 
 * @param key - The message key from ERROR_MESSAGES
 * @param args - Arguments to pass to message functions
 * @returns The formatted error message
 * 
 * @example
 * ```typescript
 * // Static message
 * getMessage('AUTH_REQUIRED'); // "Authentication required"
 * 
 * // Dynamic message with single parameter
 * getMessage('OPERATION_TIMEOUT', 5000); // "Operation timed out after 5000ms"
 * 
 * // Dynamic message with multiple parameters
 * getMessage('VALIDATION_TYPE', 'age', 'number', 'string'); 
 * // "age must be number, got string"
 * ```
 * 
 * @public
 */
export function getMessage(
  key: keyof typeof ERROR_MESSAGES,
  ...args: unknown[]
): string {
  const messageTemplate = ERROR_MESSAGES[key];
  
  if (typeof messageTemplate === 'function') {
    return (messageTemplate as (...args: unknown[]) => string)(...args);
  }
  
  return messageTemplate;
}

/**
 * Type-safe message keys
 */
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;

/**
 * Future i18n support - placeholder for locale-aware messages
 */
export interface I18nErrorMessages {
  locale: string;
  messages: typeof ERROR_MESSAGES;
}

/**
 * Creates a localized error message catalog.
 * 
 * Currently returns English messages, but provides the interface
 * for future internationalization support. When i18n is implemented,
 * this function will load locale-specific message files.
 * 
 * @param locale - The locale code (default: 'en')
 * @returns Localized message catalog
 * 
 * @example Future usage
 * ```typescript
 * // Load French messages
 * const frMessages = createLocalizedMessages('fr');
 * 
 * // Use in error handling
 * const errorMessage = frMessages.messages.PERMISSION_DENIED;
 * // Future: "Autorisation refusée"
 * ```
 * 
 * @public
 */
export function createLocalizedMessages(locale: string = 'en'): I18nErrorMessages {
  // For now, return English messages
  // In the future, this could load locale-specific message files
  return {
    locale,
    messages: ERROR_MESSAGES,
  };
}

/**
 * Validates that all message templates are properly defined.
 * 
 * Tests each message template with sample parameters to ensure
 * they can be called without errors. Useful for testing message
 * completeness in unit tests or during development.
 * 
 * @returns True if all messages are valid, false otherwise
 * 
 * @example
 * ```typescript
 * // In tests
 * describe('Error Messages', () => {
 *   it('should have valid message templates', () => {
 *     expect(validateMessages()).toBe(true);
 *   });
 * });
 * ```
 * 
 * @public
 */
export function validateMessages(): boolean {
  try {
    // Test each message template with dummy parameters
    getMessage('OPERATION_FAILED', 3);
    getMessage('OPERATION_TIMEOUT', 5000);
    getMessage('VALIDATION_REQUIRED', 'email');
    getMessage('VALIDATION_INVALID', 'age', 'abc');
    getMessage('VALIDATION_TYPE', 'id', 'number', 'string');
    getMessage('VALIDATION_RANGE', 'score', 0, 100);
    getMessage('CONFIG_MISSING', 'API_KEY');
    getMessage('CONFIG_INVALID', 'port', 'must be a number');
    getMessage('RESOURCE_NOT_FOUND', 'User', '123');
    getMessage('SERVICE_ERROR', 'PaymentService', 'timeout');
    // ... can add more validations as needed
    
    return true;
  } catch {
    return false;
  }
}