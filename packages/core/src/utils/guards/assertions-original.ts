/**
 * @module @utils/guards/assertions
 * 
 * Runtime assertion functions with TypeScript type narrowing.
 * 
 * Provides comprehensive assertion utilities that throw on failure while
 * narrowing TypeScript types. Designed to integrate with our existing error
 * system and provide excellent developer experience with clear error messages.
 * 
 * Features:
 * - TypeScript assertion signatures for proper type narrowing
 * - Integration with existing BaseError and ValidationError classes
 * - Soft assertions for non-throwing variants
 * - Performance-optimized implementations
 * - Consistent error messages and context
 * - Development-friendly stack traces
 * 
 * @example Basic assertions
 * ```typescript
 * import { assertDefined, assertType, assert } from '@utils/guards/assertions';
 * 
 * function processUser(user: unknown) {
 *   assertType(user, 'object', 'User must be an object');
 *   // TypeScript knows user is object
 *   
 *   assertDefined(user.id, 'User ID is required');
 *   // TypeScript knows user.id is defined
 *   
 *   assert(typeof user.id === 'number', 'User ID must be a number');
 *   // Custom condition assertion
 * }
 * ```
 * 
 * @example Soft assertions
 * ```typescript
 * import { softAssert } from '@utils/guards/assertions';
 * 
 * function validateConfig(config: unknown) {
 *   // Returns boolean, logs warning in development
 *   if (!softAssert(isObject(config), 'Config should be object')) {
 *     config = getDefaultConfig();
 *   }
 * }
 * ```
 * 
 * @example Range and pattern assertions
 * ```typescript
 * import { assertInRange, assertPattern, assertMinLength } from '@utils/guards/assertions';
 * 
 * function createUser(age: number, email: string, tags: string[]) {
 *   assertInRange(age, 0, 120, 'Age must be between 0 and 120');
 *   assertPattern(email, /\S+@\S+\.\S+/, 'Invalid email format');
 *   assertMinLength(tags, 1, 'At least one tag is required');
 *   
 *   // All assertions passed, safe to proceed
 *   return { age, email, tags };
 * }
 * ```
 */

// =============================================================================
// IMPORTS (using shared utilities and existing error system)
// =============================================================================

import {
  isObjectLike,
  hasOwnProp,
  devWarn,
  createAssertionError,
  createTypeError,
  createRangeError,
  createLengthError,
  createPropertyError,
  validateLength,
  validateRange,
} from '@utils/shared/index.js';

import {
  ValidationError,
  type ErrorContext,
} from '@utils/errors/base-error.js';

import {
  isString,
  isNumber,
  isBoolean,
  isArray,
  isObject,
  isDefined,
  isFunction,
} from './type-guards.js';

// =============================================================================
// ERROR CLASSES
// =============================================================================

/**
 * Error thrown when an assertion fails.
 * 
 * Extends ValidationError to integrate with our existing error system
 * while providing assertion-specific context and error codes.
 * 
 * @extends {ValidationError}
 * 
 * @example
 * ```typescript
 * throw new AssertionError('Value must be positive', {
 *   code: 'ASSERTION_FAILED',
 *   context: { value: -5, expected: '> 0' }
 * });
 * ```
 * 
 * @public
 */
export class AssertionError extends ValidationError {
  constructor(
    message: string,
    options: {
      code?: string;
      context?: ErrorContext;
    } = {}
  ) {
    super(message, {
      ...options,
      code: options.code ?? 'ASSERTION_FAILED',
      context: {
        assertionType: 'runtime',
        ...options.context,
      },
    });
    
    this.name = 'AssertionError';
  }
}

// =============================================================================
// CORE ASSERTION FUNCTIONS
// =============================================================================

/**
 * Assert that a condition is truthy.
 * 
 * The most basic assertion function. If the condition is falsy,
 * throws an AssertionError with the provided message.
 * 
 * @param condition - Value to test for truthiness
 * @param message - Error message if assertion fails
 * @param code - Optional error code for tracking
 * 
 * @throws {AssertionError} If condition is falsy
 * 
 * @example
 * ```typescript
 * assert(user.age >= 18, 'User must be an adult');
 * assert(items.length > 0, 'Items array cannot be empty', 'EMPTY_ARRAY');
 * ```
 * 
 * @public
 */
export function assert(
  condition: unknown,
  message: string,
  code?: string
): asserts condition {
  if (!condition) {
    throw new AssertionError(message, {
      code: code ?? 'CONDITION_FAILED',
      context: { condition: String(condition) },
    });
  }
}

/**
 * Assert that a value is defined (not null or undefined).
 * 
 * One of the most commonly used assertions. Provides proper TypeScript
 * type narrowing to exclude null and undefined from the type.
 * 
 * @param value - Value to check
 * @param message - Error message if assertion fails
 * @param code - Optional error code for tracking
 * 
 * @throws {AssertionError} If value is null or undefined
 * 
 * @example
 * ```typescript
 * function processUser(user: User | undefined) {
 *   assertDefined(user, 'User is required');
 *   // TypeScript knows user is User (not undefined)
 *   return user.name;
 * }
 * ```
 * 
 * @public
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message: string,
  code?: string
): asserts value is T {
  if (!isDefined(value)) {
    throw new AssertionError(message, {
      code: code ?? 'VALUE_UNDEFINED',
      context: { 
        value: String(value),
        type: typeof value,
      },
    });
  }
}

/**
 * Assert that a value is of a specific primitive type.
 * 
 * Provides type narrowing for primitive types with clear error messages.
 * More convenient than manual typeof checks for common scenarios.
 * 
 * @param value - Value to check
 * @param expectedType - Expected primitive type
 * @param message - Optional custom error message
 * 
 * @throws {AssertionError} If value is not of expected type
 * 
 * @example
 * ```typescript
 * assertType(userInput, 'string');
 * // TypeScript knows userInput is string
 * 
 * assertType(count, 'number', 'Count must be a number');
 * // TypeScript knows count is number
 * ```
 * 
 * @public
 */
export function assertType<T extends 'string' | 'number' | 'boolean' | 'object' | 'function'>(
  value: unknown,
  expectedType: T,
  message?: string
): asserts value is T extends 'string' ? string
  : T extends 'number' ? number
  : T extends 'boolean' ? boolean
  : T extends 'object' ? object
  : T extends 'function' ? Function
  : never {
  
  const actualType = typeof value;
  const isCorrectType = 
    (expectedType === 'string' && isString(value)) ||
    (expectedType === 'number' && isNumber(value)) ||
    (expectedType === 'boolean' && isBoolean(value)) ||
    (expectedType === 'object' && isObject(value)) ||
    (expectedType === 'function' && isFunction(value));
  
  if (!isCorrectType) {
    const defaultMessage = `Expected ${expectedType}, got ${actualType}`;
    throw new AssertionError(message ?? defaultMessage, {
      code: 'TYPE_MISMATCH',
      context: {
        expected: expectedType,
        actual: actualType,
        value: String(value),
      },
    });
  }
}

/**
 * Assert that a value is an instance of a specific class.
 * 
 * Useful for checking object instances and providing proper type narrowing
 * for class instances and built-in objects.
 * 
 * @param value - Value to check
 * @param constructor - Constructor function to check against
 * @param message - Optional custom error message
 * 
 * @throws {AssertionError} If value is not an instance of constructor
 * 
 * @example
 * ```typescript
 * assertInstanceOf(dateValue, Date, 'Expected a Date object');
 * // TypeScript knows dateValue is Date
 * 
 * assertInstanceOf(error, Error);
 * // TypeScript knows error is Error
 * ```
 * 
 * @public
 */
export function assertInstanceOf<T>(
  value: unknown,
  constructor: new (...args: any[]) => T,
  message?: string
): asserts value is T {
  if (!(value instanceof constructor)) {
    const constructorName = constructor.name || 'Unknown';
    const actualType = value === null ? 'null' 
      : value === undefined ? 'undefined'
      : value.constructor?.name || typeof value;
    
    const defaultMessage = `Expected instance of ${constructorName}, got ${actualType}`;
    
    throw new AssertionError(message ?? defaultMessage, {
      code: 'INSTANCE_MISMATCH',
      context: {
        expected: constructorName,
        actual: actualType,
        value: String(value),
      },
    });
  }
}

// =============================================================================
// SPECIALIZED ASSERTIONS
// =============================================================================

/**
 * Assert that an array has a minimum length.
 * 
 * Useful for validating that required data is present and that
 * operations requiring minimum items can proceed safely.
 * 
 * @param array - Array to check
 * @param minLength - Minimum required length
 * @param message - Optional custom error message
 * 
 * @throws {AssertionError} If array length is less than minimum
 * 
 * @example
 * ```typescript
 * assertMinLength(userTags, 1, 'At least one tag is required');
 * assertMinLength(reviewers, 2); // Uses default message
 * ```
 * 
 * @public
 */
export function assertMinLength<T>(
  array: T[],
  minLength: number,
  message?: string
): void {
  if (!isArray(array)) {
    throw new AssertionError('Value must be an array', {
      code: 'NOT_ARRAY',
      context: { value: String(array), type: typeof array },
    });
  }
  
  if (array.length < minLength) {
    const defaultMessage = `Array must have at least ${minLength} items, got ${array.length}`;
    throw new AssertionError(message ?? defaultMessage, {
      code: 'INSUFFICIENT_LENGTH',
      context: {
        expected: minLength,
        actual: array.length,
        arrayLength: array.length,
      },
    });
  }
}

/**
 * Assert that a number is within a specific range (inclusive).
 * 
 * Validates that numeric values fall within acceptable bounds.
 * Useful for age validation, percentage ranges, array indices, etc.
 * 
 * @param value - Number to check
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @param message - Optional custom error message
 * 
 * @throws {AssertionError} If value is outside the range
 * 
 * @example
 * ```typescript
 * assertInRange(percentage, 0, 100, 'Percentage must be 0-100');
 * assertInRange(age, 0, 120); // Uses default message
 * ```
 * 
 * @public
 */
export function assertInRange(
  value: number,
  min: number,
  max: number,
  message?: string
): void {
  if (!isNumber(value)) {
    throw new AssertionError('Value must be a number', {
      code: 'NOT_NUMBER',
      context: { value: String(value), type: typeof value },
    });
  }
  
  if (value < min || value > max) {
    const defaultMessage = `Value must be between ${min} and ${max}, got ${value}`;
    throw new AssertionError(message ?? defaultMessage, {
      code: 'OUT_OF_RANGE',
      context: {
        value,
        min,
        max,
        range: `${min}-${max}`,
      },
    });
  }
}

/**
 * Assert that a string matches a regular expression pattern.
 * 
 * Useful for validating email formats, phone numbers, URLs,
 * and other pattern-based validation scenarios.
 * 
 * @param value - String to test
 * @param pattern - Regular expression to match against
 * @param message - Optional custom error message
 * 
 * @throws {AssertionError} If string doesn't match pattern
 * 
 * @example
 * ```typescript
 * assertPattern(email, /\S+@\S+\.\S+/, 'Invalid email format');
 * assertPattern(phoneNumber, /^\d{10}$/, 'Phone must be 10 digits');
 * ```
 * 
 * @public
 */
export function assertPattern(
  value: string,
  pattern: RegExp,
  message?: string
): void {
  if (!isString(value)) {
    throw new AssertionError('Value must be a string', {
      code: 'NOT_STRING',
      context: { value: String(value), type: typeof value },
    });
  }
  
  if (!pattern.test(value)) {
    const defaultMessage = `String does not match required pattern`;
    throw new AssertionError(message ?? defaultMessage, {
      code: 'PATTERN_MISMATCH',
      context: {
        value,
        pattern: pattern.toString(),
        patternFlags: pattern.flags,
      },
    });
  }
}

/**
 * Assert that an object has specific required properties.
 * 
 * Validates that an object contains all necessary properties before
 * accessing them. Useful for API responses, configuration objects, etc.
 * 
 * @param obj - Object to check
 * @param properties - Array of required property names
 * @param message - Optional custom error message
 * 
 * @throws {AssertionError} If any required properties are missing
 * 
 * @example
 * ```typescript
 * assertProperties(user, ['id', 'name', 'email']);
 * assertProperties(config, ['apiKey', 'baseUrl'], 'Missing config properties');
 * ```
 * 
 * @public
 */
export function assertProperties<T extends object>(
  obj: T,
  properties: (keyof T)[],
  message?: string
): void {
  if (!isObjectLike(obj)) {
    throw new AssertionError('Value must be an object', {
      code: 'NOT_OBJECT',
      context: { value: String(obj), type: typeof obj },
    });
  }
  
  const missingProperties = properties.filter(prop => !hasOwnProp(obj, prop as string));
  
  if (missingProperties.length > 0) {
    const missing = missingProperties.map(String).join(', ');
    const defaultMessage = `Object missing required properties: ${missing}`;
    throw new AssertionError(message ?? defaultMessage, {
      code: 'MISSING_PROPERTIES',
      context: {
        missing: missingProperties,
        required: properties,
        available: Object.keys(obj),
      },
    });
  }
}

// =============================================================================
// UTILITY ASSERTIONS
// =============================================================================

/**
 * Assert that code execution should never reach this point.
 * 
 * Used for exhaustive checks in switch statements and ensuring
 * all cases are handled. Helps TypeScript detect unreachable code.
 * 
 * @param value - The value that should be never (used for type checking)
 * @param message - Optional custom error message
 * 
 * @throws {AssertionError} Always throws when reached
 * 
 * @example
 * ```typescript
 * function processStatus(status: 'pending' | 'complete' | 'error') {
 *   switch (status) {
 *     case 'pending': return handlePending();
 *     case 'complete': return handleComplete();
 *     case 'error': return handleError();
 *     default: assertNever(status, `Unhandled status: ${status}`);
 *   }
 * }
 * ```
 * 
 * @public
 */
export function assertNever(value: never, message?: string): never {
  const defaultMessage = `Unexpected value reached assertNever: ${String(value)}`;
  throw new AssertionError(message ?? defaultMessage, {
    code: 'UNREACHABLE_CODE',
    context: {
      value: String(value),
      type: typeof value,
    },
  });
}

/**
 * Soft assertion that logs a warning instead of throwing.
 * 
 * Useful for validation that should warn developers but not break
 * application flow. Returns the result of the condition for easy
 * conditional logic.
 * 
 * @param condition - Condition to test
 * @param message - Warning message if condition fails
 * @param logger - Optional custom logger function
 * @returns The boolean result of the condition
 * 
 * @example
 * ```typescript
 * function loadConfig(data: unknown) {
 *   if (!softAssert(isObject(data), 'Config should be an object')) {
 *     data = getDefaultConfig();
 *   }
 *   
 *   // Continue processing...
 *   return data;
 * }
 * ```
 * 
 * @public
 */
export function softAssert(
  condition: unknown,
  message: string,
  logger?: (msg: string) => void
): boolean {
  const result = Boolean(condition);
  
  if (!result) {
    const logFunction = logger ?? devWarn;
    logFunction(`Soft assertion failed: ${message}`, {
      condition: String(condition),
      timestamp: new Date().toISOString(),
    });
  }
  
  return result;
}

// =============================================================================
// ASSERTION FACTORY
// =============================================================================

/**
 * Create a custom assertion function with specific error handling.
 * 
 * Useful for creating domain-specific assertions that follow
 * consistent patterns and error reporting.
 * 
 * @param predicate - Function that tests the condition
 * @param errorMessage - Message template or function
 * @param errorCode - Error code for tracking
 * @returns Custom assertion function
 * 
 * @example
 * ```typescript
 * const assertValidUser = createAssertion(
 *   (value): value is User => 
 *     isObject(value) && 
 *     typeof value.id === 'number' && 
 *     typeof value.name === 'string',
 *   'Invalid user object',
 *   'INVALID_USER'
 * );
 * 
 * // Usage
 * assertValidUser(userData);
 * // TypeScript knows userData is User
 * ```
 * 
 * @public
 */
export function createAssertion<T>(
  predicate: (value: unknown) => value is T,
  errorMessage: string | ((value: unknown) => string),
  errorCode = 'CUSTOM_ASSERTION_FAILED'
): (value: unknown) => asserts value is T {
  return (value: unknown): asserts value is T => {
    if (!predicate(value)) {
      const message = typeof errorMessage === 'function' 
        ? errorMessage(value)
        : errorMessage;
        
      throw new AssertionError(message, {
        code: errorCode,
        context: {
          value: String(value),
          type: typeof value,
        },
      });
    }
  };
}