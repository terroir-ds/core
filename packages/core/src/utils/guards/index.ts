/**
 * @module @utils/guards
 * 
 * Type guards, assertions, and validation utilities for the Terroir Core Design System.
 * 
 * Provides lightweight, TypeScript-first utilities for runtime type checking,
 * validation, and assertions. Designed to work alongside Zod for complex schemas
 * while offering optimized primitives for common type checking scenarios.
 * 
 * Features:
 * - Zero-overhead type guards for primitives
 * - Runtime assertions with proper type narrowing
 * - Common validation patterns (email, URL, etc.)
 * - Composable predicate functions
 * - Zod-compatible validation results
 * - Performance-optimized implementations
 * 
 * @example Type guards
 * ```typescript
 * import { isString, isNumber, isDefined } from '@utils/guards';
 * 
 * function processValue(value: unknown) {
 *   if (isString(value)) {
 *     // TypeScript knows value is string
 *     return value.toUpperCase();
 *   }
 *   
 *   if (isNumber(value) && value > 0) {
 *     return value * 2;
 *   }
 *   
 *   throw new Error('Invalid value');
 * }
 * ```
 * 
 * @example Assertions
 * ```typescript
 * import { assertDefined, assertType } from '@utils/guards';
 * 
 * function getUser(id: string | undefined) {
 *   assertDefined(id, 'User ID is required');
 *   // TypeScript knows id is string
 *   
 *   const user = findUser(id);
 *   assertDefined(user, 'User not found');
 *   // TypeScript knows user is defined
 *   
 *   return user;
 * }
 * ```
 * 
 * @example Validation
 * ```typescript
 * import { validateEmail, validateUrl, validateSchema } from '@utils/guards';
 * 
 * const emailResult = validateEmail('user@example.com');
 * if (emailResult.valid) {
 *   console.log('Valid email:', emailResult.value);
 * }
 * 
 * // Schema validation
 * const userSchema = {
 *   email: validateEmail,
 *   phone: validatePhone
 * };
 * 
 * const result = validateSchema(userData, userSchema);
 * if (!result.valid) {
 *   console.log('Validation errors:', result.errors);
 * }
 * ```
 * 
 * @example Predicates
 * ```typescript
 * import { isPositive, hasMinLength, and, isInRange } from '@utils/guards';
 * 
 * const isValidAge = and(isPositive, isInRange(0, 120));
 * const isValidName = hasMinLength(2);
 * 
 * const users = [
 *   { age: 25, name: 'John' },
 *   { age: -5, name: 'Jane' },
 *   { age: 30, name: 'A' }
 * ];
 * 
 * const validUsers = users.filter(user => 
 *   isValidAge(user.age) && isValidName(user.name)
 * ); // [{ age: 25, name: 'John' }]
 * ```
 * 
 */

// Export all type guards
export {
  // Primitive type guards
  isString,
  isNumber,
  isBoolean,
  isSymbol,
  isBigInt,
  isFunction,
  isObject,
  isArray,
  isNull,
  isUndefined,
  isNullish,
  isDefined,
  
  // Advanced type guards
  isError,
  isPromise,
  isAsyncFunction,
  isDate,
  isRegExp,
  isMap,
  isSet,
  isWeakMap,
  isWeakSet,
  
  // Node.js specific type guards
  isBuffer,
  isStream,
  isReadableStream,
  isWritableStream,
  
  // Utility type guards
  isEmptyObject,
  isEmptyArray,
  isEmptyString,
  isPlainObject,
  isPrimitive,
  isIterable,
  
  // Custom type guard creation
  createTypeGuard,
} from './type-guards.js';

// Export assertions
export {
  // Error types
  AssertionError,
  
  // Assertion functions
  assert,
  assertDefined,
  assertType,
  assertInstanceOf,
  assertMinLength,
  assertInRange,
  assertPattern,
  assertProperties,
  assertNever,
  softAssert,
} from './assertions.js';

// Export validation utilities
export {
  // Types
  type ValidationResult,
  type EmailValidationOptions,
  type UrlValidationOptions,
  type PhoneValidationOptions,
  type PasswordValidationOptions,
  type CreditCardValidationOptions,
  
  // Email validation
  isValidEmail,
  validateEmail,
  
  // URL validation
  isValidUrl,
  validateUrl,
  
  // Phone number validation
  isValidPhone,
  validatePhone,
  
  // Password validation
  validatePassword,
  
  // Credit card validation
  validateCreditCard,
  
  // Custom validators
  createValidator,
  validateSchema,
} from './validation.js';

// Export predicate functions
export {
  // Types
  type Predicate,
  type TypeGuardPredicate,
  
  // Numeric predicates
  isPositive,
  isNegative,
  isZero,
  isInteger,
  isFinite,
  isInRange,
  isGreaterThan,
  isLessThan,
  
  // String predicates
  isEmpty,
  isNotEmpty,
  hasMinLength,
  hasMaxLength,
  hasExactLength,
  matches,
  startsWith,
  endsWith,
  
  // Array predicates
  hasLength,
  hasMinItems,
  hasMaxItems,
  includes,
  every,
  some,
  
  // Object predicates
  hasProperty,
  hasProperties,
  hasPropertyValue,
  
  // Logical combinators
  not,
  and,
  or,
  xor,
  
  // Utility predicates
  alwaysTrue,
  alwaysFalse,
  equals,
  deepEquals,
  oneOf,
} from './predicates.js';

// Re-export common guards from other modules for convenience
export {
  isPromise as isPromiseType,
  isAbortError,
} from '@utils/types/async.types.js';

export {
  isError as isErrorType,
  isBaseError,
  isRetryableError,
} from '@utils/errors/base-error.js';