/**
 * @module @utils/guards/assertions
 * 
 * Runtime assertion functions with TypeScript type narrowing.
 * 
 * This refactored version uses shared error utilities to reduce duplication
 * while maintaining the same public API.
 */

// =============================================================================
// IMPORTS
// =============================================================================

import {
  isObjectLike,
  hasOwnProp,
  devWarn,
  createTypeError,
  createLengthError,
  createMissingPropertiesError,
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
 * Extends ValidationError to integrate with our existing error system.
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

export function assert(
  condition: unknown,
  message: string,
  code?: string
): asserts condition {
  if (!condition) {
    throw new AssertionError(message, { 
      ...(code && { code }),
      context: { condition: String(condition) }
    });
  }
}

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
        type: typeof value
      },
    });
  }
}

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
  
  const isCorrectType = 
    (expectedType === 'string' && isString(value)) ||
    (expectedType === 'number' && isNumber(value)) ||
    (expectedType === 'boolean' && isBoolean(value)) ||
    (expectedType === 'object' && isObject(value)) ||
    (expectedType === 'function' && isFunction(value));
  
  if (!isCorrectType) {
    // Use shared error creator
    const error = createTypeError(value, expectedType);
    throw new AssertionError(message ?? error.message, {
      code: 'TYPE_MISMATCH',
      context: {
        expected: expectedType,
        actual: typeof value,
        value: String(value),
      },
    });
  }
}

export function assertInstanceOf<T>(
  value: unknown,
  constructor: new (...args: any[]) => T,
  message?: string
): asserts value is T {
  if (!(value instanceof constructor)) {
    const constructorName = constructor.name || 'Unknown';
    const actualType = value === null ? 'null' 
      : value === undefined ? 'undefined'
      : (value as any).constructor?.name || typeof value;
    
    const defaultMessage = `Expected instance of ${constructorName}, got ${actualType}`;
    
    throw new AssertionError(message ?? defaultMessage, {
      code: 'INSTANCE_MISMATCH',
      context: (value as any).constructor === undefined && typeof value === 'object' ? {
        expected: constructorName,
        actual: 'object'
      } : {
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
      code: 'MIN_LENGTH_VIOLATION',
      context: {
        expected: minLength,
        actual: array.length,
        arrayLength: array.length,
      },
    });
  }
}

export function assertMaxLength(
  value: string | unknown[],
  maxLength: number,
  message?: string
): void {
  const itemType = isString(value) ? 'String' : 'Array';
  
  // Use shared length validation
  const result = validateLength(value, { max: maxLength }, itemType);
  
  if (!result.valid) {
    const error = createLengthError(result.actualLength, { max: maxLength }, itemType);
    throw new AssertionError(message ?? error.message, {
      code: 'MAX_LENGTH_VIOLATION',
      context: {
        actualLength: result.actualLength,
        maxLength,
        itemType,
      },
    });
  }
}

export function assertInRange(
  value: number,
  min: number,
  max: number,
  message?: string
): void {
  if (!isNumber(value)) {
    const error = createTypeError(value, 'number');
    throw new AssertionError(error.message, {
      code: 'NOT_NUMBER',
      context: { value: String(value), type: typeof value },
    });
  }
  
  // Use shared range validation
  const result = validateRange(value, min, max);
  
  if (!result.valid) {
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

export function assertPattern(
  value: string,
  pattern: RegExp,
  message?: string
): void {
  if (!isString(value)) {
    const error = createTypeError(value, 'string');
    throw new AssertionError(error.message, {
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

export function assertProperties<T extends object>(
  value: T,
  properties: Array<keyof T>,
  message?: string
): void {
  if (!isObjectLike(value)) {
    const error = createTypeError(value, 'object');
    throw new AssertionError(error.message, {
      code: 'NOT_OBJECT',
      context: { value: String(value), type: typeof value },
    });
  }
  
  const missing: Array<keyof T> = [];
  
  for (const prop of properties) {
    if (!hasOwnProp(value, prop as string)) {
      missing.push(prop);
    }
  }
  
  if (missing.length > 0) {
    const error = createMissingPropertiesError('Object', missing as string[]);
    
    throw new AssertionError(message ?? error.message, {
      code: 'MISSING_PROPERTIES',
      context: {
        missing,
        required: properties,
        available: Object.keys(value),
      },
    });
  }
}

// =============================================================================
// SOFT ASSERTIONS
// =============================================================================

export function softAssert(
  condition: unknown,
  message: string,
  customLogger?: string | ((message: string, context: any) => void)
): boolean {
  if (!condition) {
    const context = {
      condition: String(condition),
      timestamp: new Date().toISOString(),
    };
    
    if (typeof customLogger === 'function') {
      customLogger(`Soft assertion failed: ${message}`, context);
    } else {
      devWarn(`Soft assertion failed: ${message}`, {
        code: customLogger ?? 'SOFT_ASSERTION_FAILED',
        stack: new Error().stack,
      });
    }
    return false;
  }
  return true;
}

// =============================================================================
// ARRAY ASSERTIONS
// =============================================================================

export function assertNonEmptyArray<T>(
  value: T[],
  message?: string
): asserts value is [T, ...T[]] {
  if (!isArray(value)) {
    const error = createTypeError(value, 'array');
    throw new AssertionError(error.message, {
      code: 'NOT_ARRAY',
      context: { value: String(value), type: typeof value },
    });
  }
  
  if (value.length === 0) {
    throw new AssertionError(message ?? 'Array cannot be empty', {
      code: 'EMPTY_ARRAY',
      context: { length: 0 },
    });
  }
}

export function assertArrayIncludes<T>(
  array: T[],
  value: T,
  message?: string
): void {
  if (!isArray(array)) {
    const error = createTypeError(array, 'array');
    throw new AssertionError(error.message, {
      code: 'NOT_ARRAY',
      context: { value: String(array), type: typeof array },
    });
  }
  
  if (!array.includes(value)) {
    const defaultMessage = `Array does not include required value`;
    throw new AssertionError(message ?? defaultMessage, {
      code: 'VALUE_NOT_INCLUDED',
      context: {
        array: array.slice(0, 10), // Limit context size
        searchValue: value,
        arrayLength: array.length,
      },
    });
  }
}

// =============================================================================
// STRING ASSERTIONS
// =============================================================================

export function assertNonEmptyString(
  value: string,
  message?: string
): asserts value is string {
  assertType(value, 'string', message);
  
  if (value.trim().length === 0) {
    throw new AssertionError(message ?? 'String cannot be empty or whitespace', {
      code: 'EMPTY_STRING',
      context: { 
        value,
        length: value.length,
        trimmedLength: value.trim().length,
      },
    });
  }
}

export function assertOneOf<T>(
  value: T,
  allowedValues: readonly T[],
  message?: string
): void {
  if (!allowedValues.includes(value)) {
    const defaultMessage = `Value must be one of: ${allowedValues.join(', ')}`;
    throw new AssertionError(message ?? defaultMessage, {
      code: 'NOT_IN_ALLOWED_VALUES',
      context: {
        value,
        allowedValues,
        allowedCount: allowedValues.length,
      },
    });
  }
}

// =============================================================================
// UTILITY ASSERTIONS
// =============================================================================

export function assertNever(value: never, message?: string): never {
  const defaultMessage = `Unexpected value reached assertNever: ${value}`;
  throw new AssertionError(message ?? defaultMessage, {
    code: 'UNEXPECTED_VALUE',
    context: {
      value,
      type: typeof value,
    },
  });
}

// =============================================================================
// CUSTOM ASSERTION FACTORY
// =============================================================================

export function createAssertion<T>(
  predicate: (value: unknown) => value is T,
  errorMessage: string | ((value: unknown) => string),
  code = 'CUSTOM_ASSERTION_FAILED'
): (value: unknown, message?: string) => asserts value is T {
  return (value: unknown, message?: string): asserts value is T => {
    if (!predicate(value)) {
      const defaultMessage = typeof errorMessage === 'function' 
        ? errorMessage(value) 
        : errorMessage;
      
      throw new AssertionError(message ?? defaultMessage, {
        code,
        context: {
          value: String(value),
          type: typeof value,
        },
      });
    }
  };
}