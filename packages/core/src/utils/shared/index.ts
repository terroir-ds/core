/**
 * @module @utils/shared
 * 
 * Shared utility functions and helpers used across multiple utility modules.
 * 
 * This module provides common patterns, optimizations, and reusable functions
 * that are used throughout the Terroir Core Design System utilities. These
 * helpers are designed to be lightweight, performant, and TypeScript-first.
 * 
 * Features:
 * - Performance-optimized common operations
 * - Cached prototype methods and global references
 * - Reusable type checking patterns
 * - Cross-module utility functions
 * - Zero external dependencies
 * 
 * @example Object type checking
 * ```typescript
 * import { getObjectType, isObjectLike } from '@utils/shared';
 * 
 * if (isObjectLike(value) && getObjectType(value) === '[object Date]') {
 *   // Handle Date objects
 * }
 * ```
 * 
 * @example Performance helpers
 * ```typescript
 * import { hasOwnProperty, objectToString } from '@utils/shared';
 * 
 * // Use cached methods for better performance
 * const type = objectToString.call(value);
 * const hasKey = hasOwnProperty.call(obj, key);
 * ```
 */

// =============================================================================
// CACHED GLOBAL REFERENCES (Performance optimization)
// =============================================================================

/**
 * Cached Object.prototype methods for performance.
 * Avoids repeated property lookups in hot paths.
 * 
 * @internal
 */
export const ObjectPrototype = Object.prototype;
export const { toString: objectToString, hasOwnProperty } = ObjectPrototype;

/**
 * Cached Array.prototype methods for performance.
 * 
 * @internal
 */
export const ArrayPrototype = Array.prototype;

/**
 * Cached Function.prototype methods for performance.
 * 
 * @internal
 */
export const FunctionPrototype = Function.prototype;
export const { toString: functionToString } = FunctionPrototype;

// =============================================================================
// COMMON TYPE CHECKING PATTERNS
// =============================================================================

/**
 * Fast typeof check with null handling.
 * This is the most common pattern used throughout type guards.
 * 
 * @param value - Value to check
 * @param expectedType - Expected typeof result
 * @returns True if value matches type and is not null
 * 
 * @example
 * ```typescript
 * if (isTypeOf(value, 'string')) {
 *   // value is string and not null
 * }
 * ```
 * 
 * @public
 */
export function isTypeOf(value: unknown, expectedType: string): boolean {
  return typeof value === expectedType && value !== null;
}

/**
 * Get object's [[Class]] internal property using Object.prototype.toString.
 * This is the most reliable way to determine object types in JavaScript.
 * 
 * @param value - Value to check
 * @returns Object type string (e.g., '[object Array]')
 * 
 * @example
 * ```typescript
 * getObjectType([]) // '[object Array]'
 * getObjectType({}) // '[object Object]'
 * getObjectType(new Date()) // '[object Date]'
 * ```
 * 
 * @public
 */
export function getObjectType(value: unknown): string {
  return objectToString.call(value);
}

/**
 * Check if a value is an object (not null, not array, not function).
 * This is a commonly needed check across many type guards.
 * 
 * @param value - Value to check
 * @returns True if value is a plain object-like value
 * 
 * @example
 * ```typescript
 * isObjectLike({}) // true
 * isObjectLike([]) // true
 * isObjectLike(null) // false
 * isObjectLike('string') // false
 * ```
 * 
 * @public
 */
export function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Safe property access check using hasOwnProperty.
 * Uses the cached method for better performance.
 * 
 * @param obj - Object to check
 * @param key - Property key to check
 * @returns True if object has own property
 * 
 * @example
 * ```typescript
 * if (hasOwnProp(obj, 'key')) {
 *   // obj has its own 'key' property
 * }
 * ```
 * 
 * @public
 */
export function hasOwnProp(obj: unknown, key: string | symbol): boolean {
  return isObjectLike(obj) && hasOwnProperty.call(obj, key);
}

// =============================================================================
// FUNCTION UTILITIES
// =============================================================================

/**
 * Check if a value is callable (function).
 * More performant than instanceof checks.
 * 
 * @param value - Value to check
 * @returns True if value is callable
 * 
 * @public
 */
export function isCallable(value: unknown): value is Function {
  return typeof value === 'function';
}

/**
 * Get function name safely.
 * Handles anonymous functions and edge cases.
 * 
 * @param fn - Function to get name from
 * @returns Function name or 'anonymous'
 * 
 * @public
 */
export function getFunctionName(fn: Function): string {
  return fn.name || 'anonymous';
}

// =============================================================================
// ARRAY UTILITIES
// =============================================================================

/**
 * Check if a value is array-like (has length property and is not string/function).
 * 
 * @param value - Value to check
 * @returns True if value is array-like
 * 
 * @example
 * ```typescript
 * isArrayLike([1, 2, 3]) // true
 * isArrayLike('string') // false (strings are excluded)
 * isArrayLike({ length: 3, 0: 'a', 1: 'b' }) // true
 * ```
 * 
 * @public
 */
export function isArrayLike(value: unknown): value is ArrayLike<unknown> {
  return (
    value != null &&
    typeof value !== 'function' &&
    typeof value !== 'string' &&
    typeof (value as any).length === 'number' &&
    (value as any).length >= 0 &&
    Number.isInteger((value as any).length)
  );
}

/**
 * Get the length of an array-like object safely.
 * 
 * @param value - Array-like value
 * @returns Length or 0 if not array-like
 * 
 * @public
 */
export function getLength(value: unknown): number {
  return isArrayLike(value) ? (value as ArrayLike<unknown>).length : 0;
}

// =============================================================================
// STRING UTILITIES
// =============================================================================

/**
 * Check if a string is empty or whitespace-only.
 * 
 * @param value - String to check
 * @returns True if string is empty or whitespace
 * 
 * @public
 */
export function isBlankString(value: string): boolean {
  return value.trim().length === 0;
}

/**
 * Normalize string for comparison (lowercase, trim whitespace).
 * 
 * @param value - String to normalize
 * @returns Normalized string
 * 
 * @public
 */
export function normalizeString(value: string): string {
  return value.trim().toLowerCase();
}

// =============================================================================
// ERROR UTILITIES
// =============================================================================

/**
 * Create a consistent error message with context.
 * 
 * @param message - Base error message
 * @param context - Additional context object
 * @returns Formatted error message
 * 
 * @example
 * ```typescript
 * const error = createErrorMessage('Validation failed', { field: 'email', value: 'invalid' });
 * // "Validation failed: field=email, value=invalid"
 * ```
 * 
 * @public
 */
export function createErrorMessage(message: string, context?: Record<string, unknown>): string {
  if (!context || Object.keys(context).length === 0) {
    return message;
  }
  
  const contextStr = Object.entries(context)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(', ');
    
  return `${message}: ${contextStr}`;
}

/**
 * Safe error conversion - ensures we always get an Error instance.
 * 
 * @param error - Error or unknown value
 * @returns Error instance
 * 
 * @public
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  
  if (typeof error === 'string') {
    return new Error(error);
  }
  
  return new Error(String(error));
}

// =============================================================================
// DEVELOPMENT UTILITIES
// =============================================================================

/**
 * Check if we're in development mode.
 * Uses NODE_ENV or falls back to checking for common dev indicators.
 * 
 * @returns True if in development mode
 * 
 * @public
 */
export function isDevelopment(): boolean {
  if (typeof process !== 'undefined' && process.env) {
    return process.env['NODE_ENV'] === 'development';
  }
  
  // Browser fallback - check for common development indicators
  if (typeof window !== 'undefined') {
    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('local')
    );
  }
  
  return false;
}

/**
 * Safe console warn that only logs in development.
 * 
 * @param message - Warning message
 * @param ...args - Additional arguments
 * 
 * @public
 */
export function devWarn(message: string, ...args: unknown[]): void {
  if (isDevelopment() && typeof console !== 'undefined' && console.warn) {
    console.warn(`[Terroir Core] ${message}`, ...args);
  }
}

// =============================================================================
// PERFORMANCE UTILITIES
// =============================================================================

/**
 * Simple object pooling for reducing garbage collection.
 * Useful for frequently created/destroyed objects.
 * 
 * @example
 * ```typescript
 * const pool = createObjectPool(() => ({ data: null }));
 * 
 * function processData(input: any) {
 *   const obj = pool.get();
 *   obj.data = input;
 *   
 *   try {
 *     return transform(obj);
 *   } finally {
 *     obj.data = null; // Reset state
 *     pool.release(obj);
 *   }
 * }
 * ```
 * 
 * @public
 */
export function createObjectPool<T>(factory: () => T, maxSize = 10) {
  const pool: T[] = [];
  
  return {
    get(): T {
      return pool.pop() || factory();
    },
    
    release(obj: T): void {
      if (pool.length < maxSize) {
        pool.push(obj);
      }
    },
    
    clear(): void {
      pool.length = 0;
    },
    
    size(): number {
      return pool.length;
    }
  };
}

/**
 * Memoize function results for performance.
 * Simple memoization with LRU eviction.
 * 
 * @param fn - Function to memoize
 * @param maxSize - Maximum cache size
 * @returns Memoized function
 * 
 * @public
 */
export function memoize<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  maxSize = 100
): (...args: TArgs) => TReturn {
  const cache = new Map<string, TReturn>();
  
  return (...args: TArgs): TReturn => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      // Move to end (LRU)
      const value = cache.get(key)!;
      cache.delete(key);
      cache.set(key, value);
      return value;
    }
    
    // Evict oldest if cache is full
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// =============================================================================
// RE-EXPORTS
// =============================================================================

// NOTE: Removed validation.js export to avoid circular dependency
// The validation utilities in guards/validation.ts should import from shared/validation.ts directly

// Export comparison utilities
export * from './comparison.js';

// Export error utilities
export * from './errors.js';

// Export event listener utilities  
export * from './event-listeners.js';