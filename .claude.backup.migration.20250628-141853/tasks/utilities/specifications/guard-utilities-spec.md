# Type Guards and Assertions Specification

## Overview
Extract type checking, validation, and assertion utilities for use across the Terroir Core Design System.

## Module Structure
```
lib/utils/guards/
├── index.ts              # Main exports
├── type-guards.ts        # Type checking utilities
├── assertions.ts         # Runtime assertions
├── validation.ts         # Common validation patterns
├── predicates.ts         # Reusable predicate functions
└── __tests__/
    ├── type-guards.test.ts
    ├── assertions.test.ts
    ├── validation.test.ts
    └── predicates.test.ts
```

## Detailed Specifications

### 1. Type Guards (`type-guards.ts`)

```typescript
/**
 * Core type guards with proper type narrowing
 */
export function isString(value: unknown): value is string;
export function isNumber(value: unknown): value is number;
export function isBoolean(value: unknown): value is boolean;
export function isSymbol(value: unknown): value is symbol;
export function isBigInt(value: unknown): value is bigint;
export function isFunction(value: unknown): value is Function;
export function isObject(value: unknown): value is object;
export function isArray<T = unknown>(value: unknown): value is T[];
export function isNull(value: unknown): value is null;
export function isUndefined(value: unknown): value is undefined;
export function isNullish(value: unknown): value is null | undefined;
export function isDefined<T>(value: T | null | undefined): value is T;

/**
 * Advanced type guards
 */
export function isError(value: unknown): value is Error;
export function isPromise<T = unknown>(value: unknown): value is Promise<T>;
export function isAsyncFunction(value: unknown): value is (...args: any[]) => Promise<any>;
export function isDate(value: unknown): value is Date;
export function isRegExp(value: unknown): value is RegExp;
export function isMap<K = unknown, V = unknown>(value: unknown): value is Map<K, V>;
export function isSet<T = unknown>(value: unknown): value is Set<T>;
export function isWeakMap(value: unknown): value is WeakMap<object, unknown>;
export function isWeakSet(value: unknown): value is WeakSet<object>;

/**
 * Node.js specific type guards
 */
export function isBuffer(value: unknown): value is Buffer;
export function isStream(value: unknown): value is NodeJS.ReadableStream | NodeJS.WritableStream;
export function isReadableStream(value: unknown): value is NodeJS.ReadableStream;
export function isWritableStream(value: unknown): value is NodeJS.WritableStream;

/**
 * Utility type guards
 */
export function isEmptyObject(value: unknown): boolean;
export function isEmptyArray(value: unknown): boolean;
export function isEmptyString(value: unknown): boolean;
export function isPlainObject(value: unknown): boolean;
export function isPrimitive(value: unknown): boolean;
export function isIterable(value: unknown): value is Iterable<unknown>;

/**
 * Create custom type guard
 */
export function createTypeGuard<T>(
  predicate: (value: unknown) => boolean,
  typeName?: string
): (value: unknown) => value is T;
```

**Testing Requirements:**
- ✅ Test all primitive type guards
- ✅ Test object and array detection
- ✅ Test null/undefined handling
- ✅ Test advanced type detection
- ✅ Test edge cases (NaN, Infinity)
- ✅ Test type narrowing in TypeScript
- ✅ Test custom type guard creation
- ✅ Performance benchmarks

### 2. Assertions (`assertions.ts`)

```typescript
export class AssertionError extends Error {
  constructor(
    message: string,
    public code?: string,
    public context?: Record<string, unknown>
  );
}

/**
 * Assert a condition is truthy
 */
export function assert(
  condition: unknown,
  message: string,
  code?: string
): asserts condition;

/**
 * Assert value is defined (not null or undefined)
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message: string,
  code?: string
): asserts value is T;

/**
 * Assert value is of specific type
 */
export function assertType<T>(
  value: unknown,
  type: 'string' | 'number' | 'boolean' | 'object' | 'function',
  message?: string
): asserts value is T;

/**
 * Assert value is instance of class
 */
export function assertInstanceOf<T>(
  value: unknown,
  constructor: new (...args: any[]) => T,
  message?: string
): asserts value is T;

/**
 * Assert array has minimum length
 */
export function assertMinLength<T>(
  array: T[],
  minLength: number,
  message?: string
): void;

/**
 * Assert number is within range
 */
export function assertInRange(
  value: number,
  min: number,
  max: number,
  message?: string
): void;

/**
 * Assert string matches pattern
 */
export function assertPattern(
  value: string,
  pattern: RegExp,
  message?: string
): void;

/**
 * Assert object has required properties
 */
export function assertProperties<T extends object>(
  obj: T,
  properties: (keyof T)[],
  message?: string
): void;

/**
 * Never assertion for exhaustive checks
 */
export function assertNever(value: never): never;

/**
 * Soft assertion that logs instead of throwing
 */
export function softAssert(
  condition: unknown,
  message: string,
  logger?: (msg: string) => void
): boolean;
```

**Testing Requirements:**
- ✅ Test assertion success cases
- ✅ Test assertion failure cases
- ✅ Test custom error codes
- ✅ Test error context
- ✅ Test type narrowing
- ✅ Test soft assertions
- ✅ Test error messages
- ✅ Test stack traces

### 3. Validation Utilities (`validation.ts`)

```typescript
export interface ValidationResult<T = unknown> {
  valid: boolean;
  value?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  field?: string;
  message: string;
  code?: string;
  context?: Record<string, unknown>;
}

/**
 * Email validation
 */
export function isValidEmail(email: string): boolean;
export function validateEmail(email: string): ValidationResult<string>;

/**
 * URL validation
 */
export function isValidUrl(url: string, options?: {
  protocols?: string[];
  requireProtocol?: boolean;
}): boolean;
export function validateUrl(url: string, options?: URLValidationOptions): ValidationResult<string>;

/**
 * Semantic version validation
 */
export function isValidSemver(version: string): boolean;
export function validateSemver(version: string): ValidationResult<string>;

/**
 * File path validation
 */
export function isValidPath(path: string, options?: {
  allowRelative?: boolean;
  checkExists?: boolean;
}): boolean;
export function validatePath(path: string, options?: PathValidationOptions): ValidationResult<string>;

/**
 * Port number validation
 */
export function isValidPort(port: number | string): boolean;
export function validatePort(port: number | string): ValidationResult<number>;

/**
 * Environment variable validation
 */
export function validateEnvVar(
  name: string,
  options?: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'json';
    validator?: (value: string) => boolean;
    transform?: (value: string) => unknown;
  }
): ValidationResult;

/**
 * Create custom validator
 */
export function createValidator<T>(
  validate: (value: unknown) => boolean | ValidationResult<T>,
  options?: {
    message?: string;
    code?: string;
  }
): (value: unknown) => ValidationResult<T>;

/**
 * Compose validators
 */
export function composeValidators<T>(
  ...validators: ((value: T) => ValidationResult<T>)[]
): (value: T) => ValidationResult<T>;

/**
 * Object schema validation
 */
export function validateObject<T extends object>(
  obj: unknown,
  schema: {
    [K in keyof T]: (value: unknown) => ValidationResult;
  }
): ValidationResult<T>;
```

**Testing Requirements:**
- ✅ Test email validation (various formats)
- ✅ Test URL validation
- ✅ Test semver validation
- ✅ Test path validation
- ✅ Test port validation
- ✅ Test env var validation
- ✅ Test custom validators
- ✅ Test validator composition
- ✅ Test error aggregation

### 4. Predicate Functions (`predicates.ts`)

```typescript
/**
 * Numeric predicates
 */
export const isPositive = (n: number): boolean => n > 0;
export const isNegative = (n: number): boolean => n < 0;
export const isInteger = (n: number): boolean => Number.isInteger(n);
export const isFinite = (n: number): boolean => Number.isFinite(n);
export const isInRange = (min: number, max: number) => (n: number): boolean => n >= min && n <= max;

/**
 * String predicates
 */
export const isEmpty = (s: string): boolean => s.length === 0;
export const isNotEmpty = (s: string): boolean => s.length > 0;
export const hasMinLength = (min: number) => (s: string): boolean => s.length >= min;
export const hasMaxLength = (max: number) => (s: string): boolean => s.length <= max;
export const matches = (pattern: RegExp) => (s: string): boolean => pattern.test(s);

/**
 * Array predicates
 */
export const hasLength = (length: number) => <T>(arr: T[]): boolean => arr.length === length;
export const hasMinItems = (min: number) => <T>(arr: T[]): boolean => arr.length >= min;
export const hasMaxItems = (max: number) => <T>(arr: T[]): boolean => arr.length <= max;
export const includes = <T>(item: T) => (arr: T[]): boolean => arr.includes(item);
export const every = <T>(predicate: (item: T) => boolean) => (arr: T[]): boolean => arr.every(predicate);
export const some = <T>(predicate: (item: T) => boolean) => (arr: T[]): boolean => arr.some(predicate);

/**
 * Object predicates
 */
export const hasProperty = (prop: string) => (obj: object): boolean => prop in obj;
export const hasOwnProperty = (prop: string) => (obj: object): boolean => Object.hasOwn(obj, prop);
export const hasProperties = (props: string[]) => (obj: object): boolean => props.every(p => p in obj);

/**
 * Predicate combinators
 */
export const not = <T>(predicate: (value: T) => boolean) => (value: T): boolean => !predicate(value);
export const and = <T>(...predicates: ((value: T) => boolean)[]) => (value: T): boolean => 
  predicates.every(p => p(value));
export const or = <T>(...predicates: ((value: T) => boolean)[]) => (value: T): boolean => 
  predicates.some(p => p(value));
```

## Integration Examples

### Logger Input Validation
```typescript
import { assertDefined, isObject, validateObject } from '@utils/guards';

function validateLogInput(obj: unknown): unknown {
  if (!isObject(obj)) return obj;
  
  const result = validateObject(obj, {
    level: (v) => validateEnum(v, ['debug', 'info', 'warn', 'error']),
    message: (v) => validateString(v, { required: true }),
    context: (v) => isObject(v) ? { valid: true, value: v } : { valid: false }
  });
  
  if (!result.valid) {
    throw new ValidationError('Invalid log input', { errors: result.errors });
  }
  
  return result.value;
}
```

### Config Validation Enhancement
```typescript
import { assertDefined, validateEnvVar, composeValidators } from '@utils/guards';

// Enhanced env validation
const portValidator = composeValidators(
  (v) => validatePort(v),
  (v) => validateInRange(v, 3000, 9999)
);

const config = {
  port: validateEnvVar('PORT', {
    required: true,
    type: 'number',
    validator: portValidator
  }).value,
  
  nodeEnv: validateEnvVar('NODE_ENV', {
    required: true,
    validator: (v) => ['development', 'production', 'test'].includes(v)
  }).value
};
```

### API Parameter Validation
```typescript
import { assertType, validateEmail, validateObject } from '@utils/guards';

export async function createUser(params: unknown) {
  const validation = validateObject(params, {
    email: validateEmail,
    name: (v) => validateString(v, { minLength: 2, maxLength: 50 }),
    age: (v) => validateNumber(v, { min: 18, max: 120 })
  });
  
  if (!validation.valid) {
    throw new ValidationError('Invalid parameters', {
      errors: validation.errors
    });
  }
  
  // TypeScript now knows params is properly typed
  return await userService.create(validation.value);
}
```

## Performance Considerations

1. **Type Guards**: Optimize for common cases first
2. **Assertions**: Minimize stack trace generation in hot paths
3. **Validation**: Cache regex compilation
4. **Predicates**: Use arrow functions for better performance
5. **Error Creation**: Lazy error message generation

## Migration Strategy

### Phase 1: Core Implementation
1. Implement type guards
2. Implement assertions
3. Add validation utilities
4. Create predicate library

### Phase 2: Testing
1. Unit tests for all functions
2. Type tests for TypeScript
3. Performance benchmarks
4. Integration tests

### Phase 3: Integration
1. Update error system
2. Update config validation
3. Add to logger
4. Document patterns

## Success Metrics

- ✅ Zero runtime overhead for type guards
- ✅ Improved type safety
- ✅ Reduced validation boilerplate
- ✅ Consistent error messages
- ✅ 100% test coverage