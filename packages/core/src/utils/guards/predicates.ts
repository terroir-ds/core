/**
 * @module @utils/guards/predicates
 * 
 * Reusable predicate functions for common conditions and logical combinations.
 * 
 * Provides lightweight, composable predicate functions that can be used for
 * filtering, validation, and conditional logic. Designed to work seamlessly
 * with TypeScript's type system and provide excellent performance.
 * 
 * Research Summary (2025-01-27):
 * - **Lodash predicates**: Well-tested patterns but not TypeScript-first
 * - **Ramda**: Functional approach but adds significant bundle size
 * - **Remeda**: TypeScript-first but focused on data transformation
 * - **Custom implementation**: Lightweight, optimized for our use cases
 * 
 * Decision: Custom implementation with proven patterns
 * - Use battle-tested logical patterns from functional programming
 * - Leverage shared utilities for consistency
 * - Provide TypeScript-first API with proper type narrowing
 * - Zero additional dependencies for predicate functions
 * 
 * Features:
 * - Numeric predicates (positive, negative, in range, etc.)
 * - String predicates (empty, min/max length, pattern matching)
 * - Array predicates (length checks, content validation)
 * - Object predicates (property checks, shape validation)
 * - Logical combinators (and, or, not)
 * - Composable and reusable design
 * - Performance-optimized implementations
 * - Excellent TypeScript support
 * 
 * @example Basic predicates
 * ```typescript
 * import { isPositive, hasMinLength, isNotEmpty } from '@utils/guards/predicates';
 * 
 * const ages = [15, 25, 35, -5];
 * const validAges = ages.filter(isPositive); // [25, 35]
 * 
 * const names = ['', 'John', 'A', 'Alice'];
 * const validNames = names.filter(hasMinLength(2)); // ['John', 'Alice']
 * 
 * const items = ['apple', '', 'banana', ''];
 * const nonEmptyItems = items.filter(isNotEmpty); // ['apple', 'banana']
 * ```
 * 
 * @example Predicate composition
 * ```typescript
 * import { and, or, not, isPositive, isInRange } from '@utils/guards/predicates';
 * 
 * const isValidAge = and(isPositive, isInRange(0, 120));
 * const isTeenOrAdult = or(isInRange(13, 19), isInRange(18, 100));
 * const isNotZero = not((n: number) => n === 0);
 * 
 * const users = [
 *   { age: 25, active: true },
 *   { age: -5, active: false },
 *   { age: 150, active: true }
 * ];
 * 
 * const validUsers = users.filter(user => isValidAge(user.age));
 * ```
 * 
 * @example Object validation
 * ```typescript
 * import { hasProperty, hasProperties, every } from '@utils/guards/predicates';
 * 
 * const users = [
 *   { id: 1, name: 'John', email: 'john@example.com' },
 *   { id: 2, name: 'Jane' }, // missing email
 *   { id: 3, name: 'Bob', email: 'bob@example.com' }
 * ];
 * 
 * const hasEmail = hasProperty('email');
 * const hasRequiredFields = hasProperties(['id', 'name', 'email']);
 * 
 * const usersWithEmail = users.filter(hasEmail);
 * const completeUsers = users.filter(hasRequiredFields);
 * ```
 */

// =============================================================================
// IMPORTS (using shared utilities and type guards)
// =============================================================================

import {
  isString,
  isNumber,
  isArray,
} from './type-guards.js';

import {
  hasOwnProp,
  isObjectLike,
  deepEquals as deepEqualsShared,
} from '@utils/shared/index.js';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * A predicate function that tests a value and returns a boolean.
 * 
 * @template T - The type of value being tested
 * 
 * @public
 */
export type Predicate<T = unknown> = (value: T) => boolean;

/**
 * A type guard predicate that narrows the type.
 * 
 * @template T - The input type
 * @template U - The narrowed type
 * 
 * @public
 */
export type TypeGuardPredicate<T, U extends T> = (value: T) => value is U;

// =============================================================================
// NUMERIC PREDICATES
// =============================================================================

/**
 * Predicate to check if a number is positive (> 0).
 * 
 * @param value - Number to test
 * @returns True if value is a positive number
 * 
 * @example
 * ```typescript
 * const numbers = [-1, 0, 1, 2.5];
 * const positive = numbers.filter(isPositive); // [1, 2.5]
 * ```
 * 
 * @public
 */
export function isPositive(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

/**
 * Predicate to check if a number is negative (< 0).
 * 
 * @param value - Number to test
 * @returns True if value is a negative number
 * 
 * @example
 * ```typescript
 * const numbers = [-1, 0, 1, -2.5];
 * const negative = numbers.filter(isNegative); // [-1, -2.5]
 * ```
 * 
 * @public
 */
export function isNegative(value: unknown): value is number {
  return isNumber(value) && value < 0;
}

/**
 * Predicate to check if a number is zero.
 * 
 * @param value - Number to test
 * @returns True if value is exactly zero
 * 
 * @example
 * ```typescript
 * const numbers = [-1, 0, 1, 0.0];
 * const zeros = numbers.filter(isZero); // [0, 0.0]
 * ```
 * 
 * @public
 */
export function isZero(value: unknown): value is number {
  return isNumber(value) && value === 0;
}

/**
 * Predicate to check if a number is an integer.
 * 
 * @param value - Number to test
 * @returns True if value is an integer
 * 
 * @example
 * ```typescript
 * const numbers = [1, 1.5, 2, 2.7];
 * const integers = numbers.filter(isInteger); // [1, 2]
 * ```
 * 
 * @public
 */
export function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value);
}

/**
 * Predicate to check if a number is finite (not Infinity or NaN).
 * 
 * @param value - Number to test
 * @returns True if value is a finite number
 * 
 * @example
 * ```typescript
 * const numbers = [1, Infinity, NaN, 2.5];
 * const finite = numbers.filter(isFinite); // [1, 2.5]
 * ```
 * 
 * @public
 */
export function isFinite(value: unknown): value is number {
  return isNumber(value) && Number.isFinite(value);
}

/**
 * Create a predicate to check if a number is within a range (inclusive).
 * 
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Predicate function for range checking
 * 
 * @example
 * ```typescript
 * const isValidAge = isInRange(0, 120);
 * const isPercentage = isInRange(0, 100);
 * 
 * const ages = [25, -5, 150, 30];
 * const validAges = ages.filter(isValidAge); // [25, 30]
 * ```
 * 
 * @public
 */
export function isInRange(min: number, max: number): Predicate<unknown> {
  return (value: unknown): value is number => {
    return isNumber(value) && value >= min && value <= max;
  };
}

/**
 * Create a predicate to check if a number is greater than a threshold.
 * 
 * @param threshold - Minimum value (exclusive)
 * @returns Predicate function for greater than checking
 * 
 * @example
 * ```typescript
 * const isAdult = isGreaterThan(17); // 18+
 * const isPositiveNonZero = isGreaterThan(0);
 * 
 * const ages = [16, 18, 25];
 * const adults = ages.filter(isAdult); // [18, 25]
 * ```
 * 
 * @public
 */
export function isGreaterThan(threshold: number): Predicate<unknown> {
  return (value: unknown): value is number => {
    return isNumber(value) && value > threshold;
  };
}

/**
 * Create a predicate to check if a number is less than a threshold.
 * 
 * @param threshold - Maximum value (exclusive)
 * @returns Predicate function for less than checking
 * 
 * @example
 * ```typescript
 * const isChild = isLessThan(18);
 * const isBelowFreezing = isLessThan(0);
 * 
 * const ages = [16, 18, 25];
 * const children = ages.filter(isChild); // [16]
 * ```
 * 
 * @public
 */
export function isLessThan(threshold: number): Predicate<unknown> {
  return (value: unknown): value is number => {
    return isNumber(value) && value < threshold;
  };
}

// =============================================================================
// STRING PREDICATES
// =============================================================================

/**
 * Predicate to check if a string is empty.
 * 
 * @param value - String to test
 * @returns True if value is an empty string
 * 
 * @example
 * ```typescript
 * const strings = ['hello', '', 'world', ''];
 * const empty = strings.filter(isEmpty); // ['', '']
 * ```
 * 
 * @public
 */
export function isEmpty(value: unknown): value is string {
  return isString(value) && value.length === 0;
}

/**
 * Predicate to check if a string is not empty.
 * 
 * @param value - String to test
 * @returns True if value is a non-empty string
 * 
 * @example
 * ```typescript
 * const strings = ['hello', '', 'world', ''];
 * const nonEmpty = strings.filter(isNotEmpty); // ['hello', 'world']
 * ```
 * 
 * @public
 */
export function isNotEmpty(value: unknown): value is string {
  return isString(value) && value.length > 0;
}

/**
 * Create a predicate to check if a string has a minimum length.
 * 
 * @param minLength - Minimum required length
 * @returns Predicate function for length checking
 * 
 * @example
 * ```typescript
 * const hasValidName = hasMinLength(2);
 * const hasValidPassword = hasMinLength(8);
 * 
 * const names = ['A', 'John', 'Alice'];
 * const validNames = names.filter(hasValidName); // ['John', 'Alice']
 * ```
 * 
 * @public
 */
export function hasMinLength(minLength: number): Predicate<unknown> {
  return (value: unknown): value is string => {
    return isString(value) && value.length >= minLength;
  };
}

/**
 * Create a predicate to check if a string has a maximum length.
 * 
 * @param maxLength - Maximum allowed length
 * @returns Predicate function for length checking
 * 
 * @example
 * ```typescript
 * const hasBriefDescription = hasMaxLength(100);
 * const hasValidUsername = hasMaxLength(20);
 * 
 * const descriptions = ['Short', 'This is a very long description...'];
 * const brief = descriptions.filter(hasBriefDescription);
 * ```
 * 
 * @public
 */
export function hasMaxLength(maxLength: number): Predicate<unknown> {
  return (value: unknown): value is string => {
    return isString(value) && value.length <= maxLength;
  };
}

/**
 * Create a predicate to check if a string has an exact length.
 * 
 * @param length - Required exact length
 * @returns Predicate function for length checking
 * 
 * @example
 * ```typescript
 * const isValidZipCode = hasExactLength(5);
 * const isValidStateCode = hasExactLength(2);
 * 
 * const codes = ['12345', '123', 'CA', 'NY'];
 * const zipCodes = codes.filter(isValidZipCode); // ['12345']
 * const stateCodes = codes.filter(isValidStateCode); // ['CA', 'NY']
 * ```
 * 
 * @public
 */
export function hasExactLength(length: number): Predicate<unknown> {
  return (value: unknown): value is string => {
    return isString(value) && value.length === length;
  };
}

/**
 * Create a predicate to check if a string matches a pattern.
 * 
 * @param pattern - Regular expression or string pattern
 * @returns Predicate function for pattern matching
 * 
 * @example
 * ```typescript
 * const isEmailLike = matches(/@/);
 * const isNumeric = matches(/^\\d+$/);
 * const startsWithA = matches(/^A/i);
 * 
 * const inputs = ['user@domain.com', 'invalid', '123', 'apple'];
 * const emails = inputs.filter(isEmailLike); // ['user@domain.com']
 * const numbers = inputs.filter(isNumeric); // ['123']
 * ```
 * 
 * @public
 */
export function matches(pattern: RegExp | string): Predicate<unknown> {
  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
  
  return (value: unknown): value is string => {
    return isString(value) && regex.test(value);
  };
}

/**
 * Create a predicate to check if a string starts with a prefix.
 * 
 * @param prefix - Required prefix
 * @param caseSensitive - Whether comparison is case sensitive (default: true)
 * @returns Predicate function for prefix checking
 * 
 * @example
 * ```typescript
 * const isHttpUrl = startsWith('http');
 * const isApiRoute = startsWith('/api/', false);
 * 
 * const urls = ['https://example.com', 'ftp://files.com'];
 * const httpUrls = urls.filter(isHttpUrl); // ['https://example.com']
 * ```
 * 
 * @public
 */
export function startsWith(prefix: string, caseSensitive = true): Predicate<unknown> {
  return (value: unknown): value is string => {
    if (!isString(value)) return false;
    
    if (caseSensitive) {
      return value.startsWith(prefix);
    } else {
      return value.toLowerCase().startsWith(prefix.toLowerCase());
    }
  };
}

/**
 * Create a predicate to check if a string ends with a suffix.
 * 
 * @param suffix - Required suffix
 * @param caseSensitive - Whether comparison is case sensitive (default: true)
 * @returns Predicate function for suffix checking
 * 
 * @example
 * ```typescript
 * const isJavaScriptFile = endsWith('.js');
 * const isImageFile = endsWith(['.jpg', '.png', '.gif'], false);
 * 
 * const files = ['script.js', 'style.css', 'image.PNG'];
 * const jsFiles = files.filter(isJavaScriptFile); // ['script.js']
 * ```
 * 
 * @public
 */
export function endsWith(suffix: string | string[], caseSensitive = true): Predicate<unknown> {
  const suffixes = Array.isArray(suffix) ? suffix : [suffix];
  
  return (value: unknown): value is string => {
    if (!isString(value)) return false;
    
    return suffixes.some(s => {
      if (caseSensitive) {
        return value.endsWith(s);
      } else {
        return value.toLowerCase().endsWith(s.toLowerCase());
      }
    });
  };
}

// =============================================================================
// ARRAY PREDICATES
// =============================================================================

/**
 * Create a predicate to check if an array has a specific length.
 * 
 * @param length - Required exact length
 * @returns Predicate function for length checking
 * 
 * @example
 * ```typescript
 * const isPair = hasLength(2);
 * const isTrio = hasLength(3);
 * 
 * const groups = [[1, 2], [1, 2, 3], [1]];
 * const pairs = groups.filter(isPair); // [[1, 2]]
 * ```
 * 
 * @public
 */
export function hasLength(length: number): Predicate<unknown> {
  return (value: unknown): value is unknown[] => {
    return isArray(value) && value.length === length;
  };
}

/**
 * Create a predicate to check if an array has a minimum number of items.
 * 
 * @param minItems - Minimum required items
 * @returns Predicate function for item count checking
 * 
 * @example
 * ```typescript
 * const hasMultipleItems = hasMinItems(2);
 * const isNonEmpty = hasMinItems(1);
 * 
 * const lists = [[], [1], [1, 2], [1, 2, 3]];
 * const nonEmpty = lists.filter(isNonEmpty); // [[1], [1, 2], [1, 2, 3]]
 * ```
 * 
 * @public
 */
export function hasMinItems(minItems: number): Predicate<unknown> {
  return (value: unknown): value is unknown[] => {
    return isArray(value) && value.length >= minItems;
  };
}

/**
 * Create a predicate to check if an array has a maximum number of items.
 * 
 * @param maxItems - Maximum allowed items
 * @returns Predicate function for item count checking
 * 
 * @example
 * ```typescript
 * const isSmallList = hasMaxItems(5);
 * const isPair = hasMaxItems(2);
 * 
 * const lists = [[1], [1, 2, 3, 4, 5, 6]];
 * const small = lists.filter(isSmallList); // [[1]]
 * ```
 * 
 * @public
 */
export function hasMaxItems(maxItems: number): Predicate<unknown> {
  return (value: unknown): value is unknown[] => {
    return isArray(value) && value.length <= maxItems;
  };
}

/**
 * Create a predicate to check if an array includes a specific value.
 * 
 * @param searchValue - Value to search for
 * @returns Predicate function for inclusion checking
 * 
 * @example
 * ```typescript
 * const hasApple = includes('apple');
 * const hasZero = includes(0);
 * 
 * const lists = [['apple', 'banana'], ['orange'], [0, 1, 2]];
 * const withApple = lists.filter(hasApple); // [['apple', 'banana']]
 * const withZero = lists.filter(hasZero); // [[0, 1, 2]]
 * ```
 * 
 * @public
 */
export function includes<T>(searchValue: T): Predicate<unknown> {
  return (value: unknown): value is T[] => {
    return isArray(value) && value.includes(searchValue);
  };
}

/**
 * Create a predicate to check if all array items satisfy a condition.
 * 
 * @param predicate - Predicate function for items
 * @returns Predicate function for all items checking
 * 
 * @example
 * ```typescript
 * const allPositive = every(isPositive);
 * const allStrings = every(isString);
 * 
 * const numbers = [[1, 2, 3], [-1, 2, 3], [1, 2]];
 * const positive = numbers.filter(allPositive); // [[1, 2, 3], [1, 2]]
 * ```
 * 
 * @public
 */
export function every<T>(predicate: Predicate<T>): Predicate<unknown> {
  return (value: unknown): value is T[] => {
    return isArray(value) && value.every((item): item is T => predicate(item as T));
  };
}

/**
 * Create a predicate to check if some array items satisfy a condition.
 * 
 * @param predicate - Predicate function for items
 * @returns Predicate function for some items checking
 * 
 * @example
 * ```typescript
 * const somePositive = some(isPositive);
 * const someStrings = some(isString);
 * 
 * const mixed = [[1, -2], [-1, -2], ['a', 1]];
 * const hasPositive = mixed.filter(somePositive); // [[1, -2]]
 * ```
 * 
 * @public
 */
export function some<T>(predicate: Predicate<T>): Predicate<unknown> {
  return (value: unknown): value is (T | unknown)[] => {
    return isArray(value) && value.some((item): item is T => predicate(item as T));
  };
}

// =============================================================================
// OBJECT PREDICATES
// =============================================================================

/**
 * Create a predicate to check if an object has a specific property.
 * 
 * @param property - Property name to check
 * @returns Predicate function for property checking
 * 
 * @example
 * ```typescript
 * const hasId = hasProperty('id');
 * const hasEmail = hasProperty('email');
 * 
 * const users = [
 *   { id: 1, name: 'John' },
 *   { name: 'Jane', email: 'jane@example.com' }
 * ];
 * const withId = users.filter(hasId); // [{ id: 1, name: 'John' }]
 * ```
 * 
 * @public
 */
export function hasProperty<K extends PropertyKey>(
  property: K
): TypeGuardPredicate<unknown, Record<K, unknown>> {
  return (value: unknown): value is Record<K, unknown> => {
    return isObjectLike(value) && hasOwnProp(value, property as string);
  };
}

/**
 * Create a predicate to check if an object has multiple properties.
 * 
 * @param properties - Array of property names to check
 * @returns Predicate function for properties checking
 * 
 * @example
 * ```typescript
 * const hasUserFields = hasProperties(['id', 'name', 'email']);
 * const hasCoordinates = hasProperties(['x', 'y']);
 * 
 * const objects = [
 *   { id: 1, name: 'John', email: 'john@example.com' },
 *   { id: 2, name: 'Jane' }, // missing email
 *   { x: 10, y: 20 }
 * ];
 * const validUsers = objects.filter(hasUserFields); // [first object]
 * ```
 * 
 * @public
 */
export function hasProperties<K extends PropertyKey>(
  properties: K[]
): TypeGuardPredicate<unknown, Record<K, unknown>> {
  return (value: unknown): value is Record<K, unknown> => {
    if (!isObjectLike(value)) return false;
    
    return properties.every(prop => hasOwnProp(value, prop as string));
  };
}

/**
 * Create a predicate to check if an object has a property with a specific value.
 * 
 * @param property - Property name to check
 * @param expectedValue - Expected property value
 * @returns Predicate function for property value checking
 * 
 * @example
 * ```typescript
 * const isActive = hasPropertyValue('active', true);
 * const isAdmin = hasPropertyValue('role', 'admin');
 * 
 * const users = [
 *   { id: 1, active: true, role: 'user' },
 *   { id: 2, active: false, role: 'admin' }
 * ];
 * const activeUsers = users.filter(isActive); // [first user]
 * ```
 * 
 * @public
 */
export function hasPropertyValue<K extends PropertyKey, V>(
  property: K,
  expectedValue: V
): TypeGuardPredicate<unknown, Record<K, V>> {
  return (value: unknown): value is Record<K, V> => {
    return isObjectLike(value) && 
           hasOwnProp(value, property as string) && 
           (value as Record<string, unknown>)[property as string] === expectedValue;
  };
}

// =============================================================================
// LOGICAL COMBINATORS
// =============================================================================

/**
 * Create a predicate that negates another predicate.
 * 
 * @param predicate - Predicate to negate
 * @returns Negated predicate function
 * 
 * @example
 * ```typescript
 * const isNotEmpty = not(isEmpty);
 * const isNotPositive = not(isPositive);
 * 
 * const strings = ['hello', '', 'world'];
 * const nonEmpty = strings.filter(isNotEmpty); // ['hello', 'world']
 * ```
 * 
 * @public
 */
export function not<T>(predicate: Predicate<T>): Predicate<T> {
  return (value: T): boolean => {
    return !predicate(value);
  };
}

/**
 * Create a predicate that combines multiple predicates with AND logic.
 * 
 * @param predicates - Predicates to combine
 * @returns Combined predicate function
 * 
 * @example
 * ```typescript
 * const isValidAge = and(isNumber, isPositive, isLessThan(120));
 * const isValidName = and(isString, isNotEmpty, hasMinLength(2));
 * 
 * const values = [25, -5, 'John', '', 150];
 * const validAges = values.filter(isValidAge); // [25]
 * ```
 * 
 * @public
 */
export function and<T>(...predicates: Predicate<T>[]): Predicate<T> {
  return (value: T): boolean => {
    return predicates.every(predicate => predicate(value));
  };
}

/**
 * Create a predicate that combines multiple predicates with OR logic.
 * 
 * @param predicates - Predicates to combine
 * @returns Combined predicate function
 * 
 * @example
 * ```typescript
 * const isValidId = or(isString, isNumber);
 * const isSpecialAge = or(isZero, isInRange(65, 120));
 * 
 * const ids = [123, 'abc', true, 'def'];
 * const validIds = ids.filter(isValidId); // [123, 'abc', 'def']
 * ```
 * 
 * @public
 */
export function or<T>(...predicates: Predicate<T>[]): Predicate<T> {
  return (value: T): boolean => {
    return predicates.some(predicate => predicate(value));
  };
}

/**
 * Create a predicate that tests conditions sequentially with XOR logic.
 * 
 * @param predicates - Predicates to combine
 * @returns XOR predicate function
 * 
 * @example
 * ```typescript
 * const isExclusiveCondition = xor(
 *   (x: number) => x > 0,
 *   (x: number) => x < 10
 * );
 * 
 * const numbers = [-5, 5, 15];
 * const exclusive = numbers.filter(isExclusiveCondition); // [-5, 15]
 * ```
 * 
 * @public
 */
export function xor<T>(...predicates: Predicate<T>[]): Predicate<T> {
  return (value: T): boolean => {
    const trueCount = predicates.filter(predicate => predicate(value)).length;
    return trueCount === 1;
  };
}

// =============================================================================
// UTILITY PREDICATES
// =============================================================================

/**
 * Create a predicate that always returns true.
 * 
 * @returns Predicate that always returns true
 * 
 * @example
 * ```typescript
 * const allItems = items.filter(alwaysTrue()); // returns all items
 * ```
 * 
 * @public
 */
export function alwaysTrue<T>(): Predicate<T> {
  return (): boolean => true;
}

/**
 * Create a predicate that always returns false.
 * 
 * @returns Predicate that always returns false
 * 
 * @example
 * ```typescript
 * const noItems = items.filter(alwaysFalse()); // returns empty array
 * ```
 * 
 * @public
 */
export function alwaysFalse<T>(): Predicate<T> {
  return (): boolean => false;
}

/**
 * Create a predicate that checks equality with a reference value.
 * 
 * @param reference - Reference value for comparison
 * @returns Predicate function for equality checking
 * 
 * @example
 * ```typescript
 * const isZero = equals(0);
 * const isActive = equals(true);
 * 
 * const numbers = [0, 1, 0, 2];
 * const zeros = numbers.filter(isZero); // [0, 0]
 * ```
 * 
 * @public
 */
export function equals<T>(reference: T): Predicate<unknown> {
  return (value: unknown): value is T => {
    return value === reference;
  };
}

/**
 * Create a predicate that checks deep equality with a reference value.
 * 
 * @param reference - Reference value for comparison
 * @returns Predicate function for deep equality checking
 * 
 * @example
 * ```typescript
 * const isDefaultConfig = deepEquals({ theme: 'light', lang: 'en' });
 * 
 * const configs = [
 *   { theme: 'light', lang: 'en' },
 *   { theme: 'dark', lang: 'en' }
 * ];
 * const defaults = configs.filter(isDefaultConfig); // [first config]
 * ```
 * 
 * @public
 */
export function deepEquals<T>(reference: T): Predicate<unknown> {
  return (value: unknown): value is T => {
    return deepEqualsShared(value, reference);
  };
}

/**
 * Create a predicate that tests if a value is one of the allowed values.
 * 
 * @param allowedValues - Array of allowed values
 * @returns Predicate function for inclusion checking
 * 
 * @example
 * ```typescript
 * const isValidStatus = oneOf(['active', 'inactive', 'pending']);
 * const isPrimaryColor = oneOf(['red', 'blue', 'yellow']);
 * 
 * const statuses = ['active', 'invalid', 'pending'];
 * const valid = statuses.filter(isValidStatus); // ['active', 'pending']
 * ```
 * 
 * @public
 */
export function oneOf<T>(allowedValues: T[]): TypeGuardPredicate<unknown, T> {
  return (value: unknown): value is T => {
    return allowedValues.includes(value as T);
  };
}