/**
 * @module utils/shared/validation
 * 
 * Shared validation helpers to reduce duplication across guard utilities.
 * Provides reusable patterns for common validation scenarios.
 */

// Import only what we need from type-guards to avoid circular dependency
import { isString, isArray } from '../guards/type-guards.js';

// Define ValidationError type locally to avoid circular dependency
interface ValidationErrorType {
  code: string;
  message: string;
  path: (string | number)[];
  context?: Record<string, unknown>;
}

/**
 * Length constraints for validation
 */
export interface LengthConstraints {
  min?: number;
  max?: number;
  exact?: number;
}

/**
 * Result of a length validation check
 */
export interface LengthValidationResult {
  valid: boolean;
  actualLength: number;
  constraints: LengthConstraints;
  errors: string[];
}

/**
 * Options for pattern validation
 */
export interface PatternValidationOptions {
  required?: boolean;
  allowEmpty?: boolean;
  trim?: boolean;
  normalize?: boolean;
}

/**
 * Creates a reusable pattern validator
 */
export function createPatternValidator(
  pattern: RegExp,
  typeName: string,
  errorCode: string,
  additionalValidation?: (value: string) => ValidationErrorType | null
) {
  return (value: unknown, options: PatternValidationOptions = {}) => {
    const errors: ValidationErrorType[] = [];
    
    // Handle undefined/null
    if (value === null || value === undefined) {
      if (options.required) {
        errors.push({
          code: `${errorCode}_REQUIRED`,
          message: `${typeName} is required`,
          path: [],
        });
      }
      return {
        valid: errors.length === 0,
        data: value as string | undefined,
        errors,
      };
    }
    
    // Type check
    if (!isString(value)) {
      errors.push({
        code: `${errorCode}_TYPE`,
        message: `${typeName} must be a string`,
        path: [],
        context: { actualType: typeof value },
      });
      return { valid: false, data: undefined, errors };
    }
    
    // Normalize if requested
    let normalizedValue = value;
    if (options.trim) {
      normalizedValue = normalizedValue.trim();
    }
    if (options.normalize) {
      normalizedValue = normalizedValue.toLowerCase();
    }
    
    // Empty check
    if (!options.allowEmpty && normalizedValue.length === 0) {
      errors.push({
        code: `${errorCode}_EMPTY`,
        message: `${typeName} cannot be empty`,
        path: [],
      });
      return { valid: false, data: undefined, errors };
    }
    
    // Pattern validation
    if (normalizedValue.length > 0 && !pattern.test(normalizedValue)) {
      errors.push({
        code: errorCode,
        message: `Invalid ${typeName} format`,
        path: [],
        context: { value: normalizedValue },
      });
    }
    
    // Additional validation
    if (additionalValidation && errors.length === 0) {
      const additionalError = additionalValidation(normalizedValue);
      if (additionalError) {
        errors.push(additionalError);
      }
    }
    
    return {
      valid: errors.length === 0,
      data: errors.length === 0 ? normalizedValue : undefined,
      errors,
    };
  };
}

/**
 * Validates length constraints for strings and arrays
 */
export function validateLength(
  value: string | unknown[],
  constraints: LengthConstraints,
  itemName: string = 'value'
): LengthValidationResult {
  const errors: string[] = [];
  const length = isString(value) ? value.length : value.length;
  
  if (constraints.exact !== undefined && length !== constraints.exact) {
    errors.push(`${itemName} must be exactly ${constraints.exact} characters`);
  }
  
  if (constraints.min !== undefined && length < constraints.min) {
    errors.push(`${itemName} must be at least ${constraints.min} characters`);
  }
  
  if (constraints.max !== undefined && length > constraints.max) {
    errors.push(`${itemName} must be at most ${constraints.max} characters`);
  }
  
  return {
    valid: errors.length === 0,
    actualLength: length,
    constraints,
    errors,
  };
}

/**
 * Result of an empty check
 */
export interface EmptyCheckResult {
  isEmpty: boolean;
  type: 'null' | 'undefined' | 'string' | 'array' | 'object' | 'map' | 'set' | 'other';
  size?: number;
}

/**
 * Generic empty check for various types
 */
export function checkEmpty(value: unknown): EmptyCheckResult {
  if (value === null) {
    return { isEmpty: true, type: 'null' };
  }
  
  if (value === undefined) {
    return { isEmpty: true, type: 'undefined' };
  }
  
  if (isString(value)) {
    return { 
      isEmpty: value.length === 0, 
      type: 'string',
      size: value.length,
    };
  }
  
  if (isArray(value)) {
    return { 
      isEmpty: value.length === 0, 
      type: 'array',
      size: value.length,
    };
  }
  
  if (value instanceof Map) {
    return { 
      isEmpty: value.size === 0, 
      type: 'map',
      size: value.size,
    };
  }
  
  if (value instanceof Set) {
    return { 
      isEmpty: value.size === 0, 
      type: 'set',
      size: value.size,
    };
  }
  
  if (value !== null && typeof value === 'object') {
    const keys = Object.keys(value);
    return { 
      isEmpty: keys.length === 0, 
      type: 'object',
      size: keys.length,
    };
  }
  
  return { isEmpty: false, type: 'other' };
}

/**
 * Validates a numeric value is within a range
 */
export function validateRange(
  value: number,
  min?: number,
  max?: number,
  inclusive: boolean = true
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (min !== undefined) {
    if (inclusive ? value < min : value <= min) {
      errors.push(`Value must be ${inclusive ? '>=' : '>'} ${min}`);
    }
  }
  
  if (max !== undefined) {
    if (inclusive ? value > max : value >= max) {
      errors.push(`Value must be ${inclusive ? '<=' : '<'} ${max}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Creates a context object for validation errors
 */
export function createValidationContext(
  value: unknown,
  expected?: string,
  constraints?: Record<string, unknown>
): Record<string, unknown> {
  const context: Record<string, unknown> = {
    value,
    actualType: typeof value,
  };
  
  if (expected) {
    context['expected'] = expected;
  }
  
  if (constraints) {
    Object.assign(context, constraints);
  }
  
  return context;
}