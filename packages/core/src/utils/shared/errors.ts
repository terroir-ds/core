/**
 * @module utils/shared/errors
 * 
 * Shared error creation and formatting utilities.
 * Provides consistent error handling patterns across the codebase.
 */

import { createErrorMessage } from './index.js';
import type { ErrorContext } from '../errors/base-error.js';
import { getMessage } from '../errors/messages.js';

/**
 * Options for creating validation errors
 */
export interface ValidationErrorOptions {
  code: string;
  context?: ErrorContext;
  path?: (string | number)[];
}

/**
 * Creates a standardized validation error object.
 * Used for consistent error reporting across validation utilities.
 * 
 * @param message - Error message
 * @param options - Error options
 * @returns Validation error object
 */
export function createValidationError(
  message: string,
  options: ValidationErrorOptions
): {
  code: string;
  message: string;
  path: (string | number)[];
  context?: ErrorContext;
} {
  return {
    code: options.code,
    message,
    path: options.path || [],
    ...(options.context && { context: options.context }),
  };
}

/**
 * Creates a consistent assertion error with context.
 * 
 * @param message - Base error message
 * @param actual - Actual value
 * @param expected - Expected value/type
 * @param code - Error code
 * @returns Formatted error with context
 */
export function createAssertionError(
  message: string,
  actual: unknown,
  expected: string,
  code: string = 'ASSERTION_FAILED'
): Error {
  const error = new Error(
    createErrorMessage(message, {
      expected,
      actual: typeof actual === 'object' ? 
        JSON.stringify(actual, null, 2) : 
        String(actual),
      actualType: typeof actual,
    })
  );
  
  // Add error code as a non-enumerable property
  Object.defineProperty(error, 'code', {
    value: code,
    enumerable: false,
    configurable: true,
  });
  
  return error;
}

/**
 * Creates a type error with consistent formatting.
 * 
 * @param value - The value that failed type check
 * @param expectedType - Expected type name
 * @param path - Optional property path
 * @returns Formatted type error
 */
export function createTypeError(
  value: unknown,
  expectedType: string,
  path?: (string | number)[]
): Error {
  const pathStr = path && path.length > 0 ? 
    ` at path "${path.join('.')}"` : 
    '';
    
  const actualType = value === null ? 'null' :
    value === undefined ? 'undefined' :
    Array.isArray(value) ? 'array' :
    typeof value;
    
  return new Error(
    getMessage('TYPE_MISMATCH', expectedType, actualType, pathStr || undefined)
  );
}

/**
 * Creates a range error with consistent formatting.
 * 
 * @param value - The value that's out of range
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @param inclusive - Whether bounds are inclusive
 * @returns Formatted range error
 */
export function createRangeError(
  value: number,
  min?: number,
  max?: number,
  inclusive: boolean = true
): Error {
  // For non-inclusive bounds, we adjust the values by a small amount
  // since the centralized message doesn't support exclusive bounds
  const adjustedMin = min !== undefined && !inclusive ? min + 0.01 : min;
  const adjustedMax = max !== undefined && !inclusive ? max - 0.01 : max;
  
  return new Error(getMessage('VALUE_OUT_OF_RANGE', value, adjustedMin, adjustedMax));
}

/**
 * Creates a length error with consistent formatting.
 * 
 * @param actualLength - Actual length
 * @param constraints - Length constraints (min, max, exact)
 * @param itemType - Type of item (e.g., "string", "array")
 * @returns Formatted length error
 */
export function createLengthError(
  actualLength: number,
  constraints: { min?: number; max?: number; exact?: number }
): Error {
  if (constraints.exact !== undefined) {
    return new Error(
      getMessage('LENGTH_OUT_OF_RANGE', actualLength, constraints.exact, constraints.exact)
    );
  }
  
  return new Error(
    getMessage('LENGTH_OUT_OF_RANGE', actualLength, constraints.min, constraints.max)
  );
}

/**
 * Creates a property error for missing or invalid properties.
 * 
 * @param objectType - Type of object being checked
 * @param property - Property name
 * @param reason - Reason for error ("missing", "invalid", etc.)
 * @returns Formatted property error
 */
export function createPropertyError(
  objectType: string,
  property: string | symbol,
  reason: 'missing' | 'invalid' | 'readonly' | 'type' = 'missing'
): Error {
  const propStr = typeof property === 'symbol' ? 
    property.toString() : 
    `"${property}"`;
    
  switch (reason) {
    case 'missing':
      return new Error(getMessage('PROPERTY_MISSING', propStr, objectType));
    case 'invalid':
      return new Error(getMessage('PROPERTY_UNKNOWN', propStr, objectType));
    case 'readonly':
      return new Error(`Cannot modify readonly property ${propStr} of ${objectType}`);
    case 'type':
      return new Error(`Property ${propStr} has incorrect type on ${objectType}`);
    default:
      return new Error(`Property ${propStr} error on ${objectType}: ${reason}`);
  }
}

/**
 * Creates an error for multiple missing properties.
 * 
 * @param objectType - Type of object being checked
 * @param properties - Array of missing property names
 * @returns Formatted error for multiple missing properties
 */
export function createMissingPropertiesError(
  objectType: string,
  properties: (string | symbol)[]
): Error {
  if (properties.length === 0) {
    return new Error(`${objectType} validation passed`);
  }
  
  const propNames = properties.map(p => 
    typeof p === 'symbol' ? p.toString() : p
  ).join(', ');
  
  return new Error(`${objectType} missing required properties: ${propNames}`);
}

/**
 * Extracts a clean stack trace from an error.
 * Removes internal frames and cleans up paths.
 * 
 * @param error - Error to extract stack from
 * @param framesToSkip - Number of frames to skip from top
 * @returns Cleaned stack trace
 */
export function extractCleanStack(error: Error, framesToSkip: number = 0): string {
  if (!error.stack) {
    return '';
  }
  
  const lines = error.stack.split('\n');
  const cleaned = lines
    .slice(framesToSkip + 1) // Skip error message and specified frames
    .filter(line => {
      // Remove internal Node.js frames
      return !line.includes('node_modules/') &&
             !line.includes('internal/') &&
             !line.includes('(<anonymous>)');
    })
    .map(line => line.trim());
    
  return cleaned.join('\n');
}