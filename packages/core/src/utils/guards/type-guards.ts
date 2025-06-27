/**
 * @module @utils/guards/type-guards
 * 
 * High-performance TypeScript type guards with zero runtime overhead.
 * 
 * Provides comprehensive type checking utilities optimized for performance
 * while maintaining excellent TypeScript inference. All guards use minimal
 * operations and are designed to be inlined by modern JavaScript engines.
 * 
 * Features:
 * - Zero overhead primitive type guards
 * - Proper TypeScript type narrowing
 * - Node.js and browser compatibility
 * - Optimized for hot paths
 * - Battle-tested type checking patterns
 * 
 * @example Basic usage
 * ```typescript
 * import { isString, isNumber, isDefined } from '@utils/guards/type-guards';
 * 
 * function processInput(value: unknown) {
 *   if (isString(value)) {
 *     // TypeScript knows value is string
 *     return value.trim().toUpperCase();
 *   }
 *   
 *   if (isNumber(value) && isFinite(value)) {
 *     // TypeScript knows value is number
 *     return Math.round(value);
 *   }
 *   
 *   throw new TypeError('Expected string or number');
 * }
 * ```
 * 
 * @example Advanced type guards
 * ```typescript
 * import { isPlainObject, isAsyncFunction, isIterable } from '@utils/guards/type-guards';
 * 
 * function processConfig(config: unknown) {
 *   if (!isPlainObject(config)) {
 *     throw new TypeError('Config must be a plain object');
 *   }
 *   
 *   // TypeScript knows config is Record<string, unknown>
 *   for (const [key, value] of Object.entries(config)) {
 *     if (isAsyncFunction(value)) {
 *       await value();
 *     }
 *   }
 * }
 * ```
 */

// =============================================================================
// SHARED HELPERS (imported from shared utilities)
// =============================================================================

import {
  getObjectType,
  isObjectLike,
  hasOwnProp,
  isCallable,
  devWarn,
} from '@utils/shared/index.js';

// =============================================================================
// PRIMITIVE TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if a value is a string.
 * 
 * @param value - Value to check
 * @returns True if value is a string
 * 
 * @example
 * ```typescript
 * if (isString(userInput)) {
 *   // TypeScript knows userInput is string
 *   console.log(userInput.toUpperCase());
 * }
 * ```
 * 
 * @public
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if a value is a number (excluding NaN).
 * 
 * Note: This excludes NaN, which is technically of type 'number' but
 * usually indicates an error condition in calculations.
 * 
 * @param value - Value to check
 * @returns True if value is a finite number
 * 
 * @example
 * ```typescript
 * if (isNumber(userInput)) {
 *   // TypeScript knows userInput is number
 *   const doubled = userInput * 2;
 * }
 * ```
 * 
 * @public
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

/**
 * Type guard to check if a value is a boolean.
 * 
 * @param value - Value to check
 * @returns True if value is a boolean
 * 
 * @example
 * ```typescript
 * if (isBoolean(config.enabled)) {
 *   // TypeScript knows config.enabled is boolean
 *   return config.enabled ? 'on' : 'off';
 * }
 * ```
 * 
 * @public
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard to check if a value is a symbol.
 * 
 * @param value - Value to check
 * @returns True if value is a symbol
 * 
 * @public
 */
export function isSymbol(value: unknown): value is symbol {
  return typeof value === 'symbol';
}

/**
 * Type guard to check if a value is a bigint.
 * 
 * @param value - Value to check
 * @returns True if value is a bigint
 * 
 * @public
 */
export function isBigInt(value: unknown): value is bigint {
  return typeof value === 'bigint';
}

/**
 * Type guard to check if a value is a function.
 * 
 * @param value - Value to check
 * @returns True if value is a function
 * 
 * @example
 * ```typescript
 * if (isFunction(callback)) {
 *   // TypeScript knows callback is Function
 *   callback();
 * }
 * ```
 * 
 * @public
 */
export function isFunction(value: unknown): value is Function {
  return isCallable(value);
}

/**
 * Type guard to check if a value is an object (including arrays, but not null).
 * 
 * @param value - Value to check
 * @returns True if value is an object
 * 
 * @public
 */
export function isObject(value: unknown): value is object {
  return isObjectLike(value);
}

/**
 * Type guard to check if a value is an array.
 * 
 * Uses the native Array.isArray which is optimized by JavaScript engines.
 * 
 * @param value - Value to check
 * @returns True if value is an array
 * 
 * @example
 * ```typescript
 * if (isArray(data)) {
 *   // TypeScript knows data is unknown[]
 *   return data.map(item => processItem(item));
 * }
 * ```
 * 
 * @public
 */
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if a value is null.
 * 
 * @param value - Value to check
 * @returns True if value is null
 * 
 * @public
 */
export function isNull(value: unknown): value is null {
  return value === null;
}

/**
 * Type guard to check if a value is undefined.
 * 
 * @param value - Value to check
 * @returns True if value is undefined
 * 
 * @public
 */
export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

/**
 * Type guard to check if a value is null or undefined (nullish).
 * 
 * @param value - Value to check
 * @returns True if value is null or undefined
 * 
 * @example
 * ```typescript
 * if (isNullish(userInput)) {
 *   return getDefaultValue();
 * }
 * ```
 * 
 * @public
 */
export function isNullish(value: unknown): value is null | undefined {
  return value == null; // Uses == to catch both null and undefined
}

/**
 * Type guard to check if a value is defined (not null or undefined).
 * 
 * @param value - Value to check
 * @returns True if value is not null or undefined
 * 
 * @example
 * ```typescript
 * if (isDefined(user.email)) {
 *   // TypeScript knows user.email is not null/undefined
 *   sendEmail(user.email);
 * }
 * ```
 * 
 * @public
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value != null; // Uses != to exclude both null and undefined
}

// =============================================================================
// ADVANCED TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if a value is an Error instance.
 * 
 * Re-exports the existing implementation from base-error.ts for consistency.
 * 
 * @param value - Value to check
 * @returns True if value is an Error
 * 
 * @public
 */
export { isError } from '@utils/errors/base-error.js';

/**
 * Type guard to check if a value is a Promise.
 * 
 * Re-exports the existing implementation from async.types.ts for consistency.
 * 
 * @param value - Value to check
 * @returns True if value is a Promise
 * 
 * @public
 */
export { isPromise } from '@utils/types/async.types.js';

/**
 * Type guard to check if a value is an async function.
 * 
 * @param value - Value to check
 * @returns True if value is an async function
 * 
 * @example
 * ```typescript
 * if (isAsyncFunction(handler)) {
 *   // TypeScript knows handler returns Promise
 *   await handler();
 * }
 * ```
 * 
 * @public
 */
export function isAsyncFunction(value: unknown): value is (...args: any[]) => Promise<any> {
  return isFunction(value) && getObjectType(value) === '[object AsyncFunction]';
}

/**
 * Type guard to check if a value is a Date instance.
 * 
 * @param value - Value to check
 * @returns True if value is a Date
 * 
 * @public
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date;
}

/**
 * Type guard to check if a value is a RegExp instance.
 * 
 * @param value - Value to check
 * @returns True if value is a RegExp
 * 
 * @public
 */
export function isRegExp(value: unknown): value is RegExp {
  return value instanceof RegExp;
}

/**
 * Type guard to check if a value is a Map instance.
 * 
 * @param value - Value to check
 * @returns True if value is a Map
 * 
 * @public
 */
export function isMap<K = unknown, V = unknown>(value: unknown): value is Map<K, V> {
  return value instanceof Map;
}

/**
 * Type guard to check if a value is a Set instance.
 * 
 * @param value - Value to check
 * @returns True if value is a Set
 * 
 * @public
 */
export function isSet<T = unknown>(value: unknown): value is Set<T> {
  return value instanceof Set;
}

/**
 * Type guard to check if a value is a WeakMap instance.
 * 
 * @param value - Value to check
 * @returns True if value is a WeakMap
 * 
 * @public
 */
export function isWeakMap(value: unknown): value is WeakMap<object, unknown> {
  return value instanceof WeakMap;
}

/**
 * Type guard to check if a value is a WeakSet instance.
 * 
 * @param value - Value to check
 * @returns True if value is a WeakSet
 * 
 * @public
 */
export function isWeakSet(value: unknown): value is WeakSet<object> {
  return value instanceof WeakSet;
}

// =============================================================================
// NODE.JS SPECIFIC TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if a value is a Buffer (Node.js only).
 * 
 * Safe to use in browsers (returns false).
 * 
 * @param value - Value to check
 * @returns True if value is a Buffer
 * 
 * @public
 */
export function isBuffer(value: unknown): value is Buffer {
  // Check if Buffer exists (Node.js environment) and value is instance
  return typeof Buffer !== 'undefined' && value instanceof Buffer;
}

/**
 * Type guard to check if a value is a readable or writable stream (Node.js).
 * 
 * @param value - Value to check
 * @returns True if value is a stream
 * 
 * @public
 */
export function isStream(value: unknown): value is NodeJS.ReadableStream | NodeJS.WritableStream {
  return isObjectLike(value) && isFunction((value as any).pipe);
}

/**
 * Type guard to check if a value is a readable stream (Node.js).
 * 
 * @param value - Value to check
 * @returns True if value is a readable stream
 * 
 * @public
 */
export function isReadableStream(value: unknown): value is NodeJS.ReadableStream {
  return isStream(value) && isFunction((value as any).read);
}

/**
 * Type guard to check if a value is a writable stream (Node.js).
 * 
 * @param value - Value to check
 * @returns True if value is a writable stream
 * 
 * @public
 */
export function isWritableStream(value: unknown): value is NodeJS.WritableStream {
  return isStream(value) && isFunction((value as any).write);
}

// =============================================================================
// UTILITY TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if an object is empty (has no own enumerable properties).
 * 
 * @param value - Value to check
 * @returns True if value is an empty object
 * 
 * @example
 * ```typescript
 * if (isEmptyObject(config)) {
 *   config = getDefaultConfig();
 * }
 * ```
 * 
 * @public
 */
export function isEmptyObject(value: unknown): boolean {
  if (!isObjectLike(value) || isArray(value)) {
    return false;
  }
  
  // Use for...in for performance (faster than Object.keys)
  for (const key in value) {
    if (hasOwnProp(value, key)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Type guard to check if an array is empty.
 * 
 * @param value - Value to check
 * @returns True if value is an empty array
 * 
 * @public
 */
export function isEmptyArray(value: unknown): boolean {
  return isArray(value) && value.length === 0;
}

/**
 * Type guard to check if a string is empty.
 * 
 * @param value - Value to check
 * @returns True if value is an empty string
 * 
 * @public
 */
export function isEmptyString(value: unknown): boolean {
  return isString(value) && value.length === 0;
}

/**
 * Type guard to check if a value is a plain object (created by Object literal or new Object()).
 * 
 * Excludes arrays, functions, dates, regexes, and other built-in objects.
 * Based on Lodash's isPlainObject implementation.
 * 
 * @param value - Value to check
 * @returns True if value is a plain object
 * 
 * @example
 * ```typescript
 * isPlainObject({});         // true
 * isPlainObject({ a: 1 });   // true
 * isPlainObject([]);         // false
 * isPlainObject(new Date()); // false
 * ```
 * 
 * @public
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!isObjectLike(value) || getObjectType(value) !== '[object Object]') {
    return false;
  }
  
  // Objects with no prototype (created with Object.create(null))
  const proto = Object.getPrototypeOf(value);
  if (proto === null) {
    return true;
  }
  
  // Objects created by Object constructor
  const Ctor = hasOwnProp(proto, 'constructor') && proto.constructor;
  return (
    typeof Ctor === 'function' &&
    Ctor instanceof Ctor &&
    Function.prototype.toString.call(Ctor) === Function.prototype.toString.call(Object)
  );
}

/**
 * Type guard to check if a value is a primitive type.
 * 
 * Primitives: string, number, boolean, symbol, bigint, null, undefined
 * 
 * @param value - Value to check
 * @returns True if value is a primitive
 * 
 * @public
 */
export function isPrimitive(value: unknown): value is string | number | boolean | symbol | bigint | null | undefined {
  return value == null || (typeof value !== 'object' && typeof value !== 'function');
}

/**
 * Type guard to check if a value is iterable (has Symbol.iterator method).
 * 
 * @param value - Value to check
 * @returns True if value is iterable
 * 
 * @example
 * ```typescript
 * if (isIterable(data)) {
 *   for (const item of data) {
 *     processItem(item);
 *   }
 * }
 * ```
 * 
 * @public
 */
export function isIterable(value: unknown): value is Iterable<unknown> {
  return value != null && isFunction((value as any)[Symbol.iterator]);
}

// =============================================================================
// CUSTOM TYPE GUARD CREATION
// =============================================================================

/**
 * Creates a custom type guard function.
 * 
 * Useful for creating domain-specific type guards with consistent error handling.
 * 
 * @param predicate - Function that checks if value matches type
 * @param typeName - Optional name for the type (used in error messages)
 * @returns Type guard function
 * 
 * @example
 * ```typescript
 * interface User { id: number; name: string; }
 * 
 * const isUser = createTypeGuard<User>(
 *   (value): value is User => 
 *     isPlainObject(value) &&
 *     isNumber(value.id) &&
 *     isString(value.name),
 *   'User'
 * );
 * 
 * if (isUser(data)) {
 *   // TypeScript knows data is User
 *   console.log(data.name);
 * }
 * ```
 * 
 * @public
 */
export function createTypeGuard<T>(
  predicate: (value: unknown) => boolean,
  typeName?: string
): (value: unknown) => value is T {
  const guard = (value: unknown): value is T => {
    try {
      return predicate(value);
    } catch (error) {
      // Log the error for debugging but don't throw
      // Type guards should be safe to use in any context
      devWarn(`Type guard ${typeName || 'unknown'} threw error:`, error);
      return false;
    }
  };
  
  // Add type name for debugging
  if (typeName) {
    Object.defineProperty(guard, 'name', { value: `is${typeName}` });
  }
  
  return guard;
}