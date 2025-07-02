# Task: Type Guard and Assertion Utilities

<!-- AUTO-MANAGED: Do not edit below this line -->
**Method**: Multi Pass Development with 5 Phases
**Completed**: 2025-07-02
<!-- END AUTO-MANAGED -->

## Completion Summary
**Status**: ✅ COMPLETED (prior to formal tracking)
**Implementation Location**: `/packages/core/src/utils/guards/`
**All Modules Implemented**:
- `type-guards.ts` - 29 comprehensive type guard functions
- `assertions.ts` - Runtime assertions with proper TypeScript support
- `validation.ts` - Common validation patterns and utilities
- `predicates.ts` - Reusable predicate functions
- Full test coverage in `__tests__/` subdirectory

## Key Achievements
1. **Comprehensive Type Guard Suite**: All primitive and complex type guards implemented
2. **Proper TypeScript Narrowing**: All guards properly narrow types for TypeScript
3. **Performance Optimized**: Zero overhead, designed for hot paths
4. **Well Documented**: Excellent JSDoc with usage examples
5. **Battle Tested**: 80+ test cases ensuring reliability

## Patterns Extracted
- [@pattern:type-guard-implementation] - Creating performant type guards
- [@pattern:assertion-error-handling] - Proper assertion error patterns
- [@pattern:validation-result-interface] - Consistent validation return types
- [@standard:prefer-type-guards] - Use type guards instead of raw typeof

## Technical Debt Identified
- 11+ files still using raw `typeof` checks instead of type guards
- Zod dependency underutilized (only in config/env.ts)
- Some validation patterns have duplication
- Created backlog task for cleanup: `009-type-guard-adoption.md`

## Objective
Implement comprehensive type checking, validation, and assertion utilities for runtime type safety across the design system.

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

## Implementation Requirements

### 1. Type Guards (`type-guards.ts`)

Core type guards with proper TypeScript narrowing:

```typescript
// Primitives
export function isString(value: unknown): value is string;
export function isNumber(value: unknown): value is number;
export function isBoolean(value: unknown): value is boolean;
export function isSymbol(value: unknown): value is symbol;
export function isBigInt(value: unknown): value is bigint;

// Objects and functions
export function isFunction(value: unknown): value is Function;
export function isObject(value: unknown): value is object;
export function isArray<T = unknown>(value: unknown): value is T[];
export function isPlainObject(value: unknown): boolean;

// Null checks
export function isNull(value: unknown): value is null;
export function isUndefined(value: unknown): value is undefined;
export function isNullish(value: unknown): value is null | undefined;
export function isDefined<T>(value: T | null | undefined): value is T;

// Advanced types
export function isError(value: unknown): value is Error;
export function isPromise<T = unknown>(value: unknown): value is Promise<T>;
export function isAsyncFunction(value: unknown): value is (...args: any[]) => Promise<any>;
export function isDate(value: unknown): value is Date;
export function isRegExp(value: unknown): value is RegExp;
export function isMap<K = unknown, V = unknown>(value: unknown): value is Map<K, V>;
export function isSet<T = unknown>(value: unknown): value is Set<T>;
export function isWeakMap(value: unknown): value is WeakMap<object, unknown>;
export function isWeakSet(value: unknown): value is WeakSet<object>;

// Node.js specific
export function isBuffer(value: unknown): value is Buffer;
export function isStream(value: unknown): value is NodeJS.ReadableStream | NodeJS.WritableStream;
export function isReadableStream(value: unknown): value is NodeJS.ReadableStream;
export function isWritableStream(value: unknown): value is NodeJS.WritableStream;

// Utility guards
export function isEmptyObject(value: unknown): boolean;
export function isEmptyArray(value: unknown): boolean;
export function isEmptyString(value: unknown): boolean;
export function isEmpty(value: unknown): boolean;
export function isPrimitive(value: unknown): boolean;
export function isIterable(value: unknown): value is Iterable<unknown>;

// Custom guard creator
export function createTypeGuard<T>(
  predicate: (value: unknown) => boolean,
  typeName?: string
): (value: unknown) => value is T;
```

### 2. Assertions (`assertions.ts`)

Runtime assertions that throw on failure:

```typescript
export class AssertionError extends Error {
  constructor(
    message: string, 
    public code?: string,
    public context?: Record<string, unknown>
  );
}

// Basic assertions
export function assert(
  condition: unknown, 
  message: string,
  code?: string
): asserts condition;

export function assertDefined<T>(
  value: T | null | undefined, 
  message: string,
  code?: string
): asserts value is T;

export function assertType<T>(
  value: unknown,
  type: 'string' | 'number' | 'boolean' | 'object' | 'function',
  message?: string
): asserts value is T;

export function assertInstanceOf<T>(
  value: unknown,
  constructor: new (...args: any[]) => T,
  message?: string
): asserts value is T;

// Validation assertions
export function assertMinLength<T>(
  array: T[],
  minLength: number,
  message?: string
): void;

export function assertInRange(
  value: number,
  min: number,
  max: number,
  message?: string
): void;

export function assertPattern(
  value: string,
  pattern: RegExp,
  message?: string
): void;

export function assertProperties<T extends object>(
  obj: T,
  properties: (keyof T)[],
  message?: string
): void;

// Special assertions
export function assertNever(value: never): never;

export function softAssert(
  condition: unknown,
  message: string,
  logger?: (msg: string) => void
): boolean;
```

### 3. Validation Patterns (`validation.ts`)

Common validation functions:

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

// Email validation
export function isValidEmail(email: string): boolean;
export function validateEmail(email: string): ValidationResult<string>;

// URL validation
export function isValidUrl(url: string, options?: {
  protocols?: string[];
  requireProtocol?: boolean;
}): boolean;
export function validateUrl(url: string, options?: URLValidationOptions): ValidationResult<string>;

// Semantic version validation
export function isValidSemver(version: string): boolean;
export function validateSemver(version: string): ValidationResult<string>;

// File path validation
export function isValidPath(path: string, options?: {
  allowRelative?: boolean;
  checkExists?: boolean;
}): boolean;
export function validatePath(path: string, options?: PathValidationOptions): ValidationResult<string>;

// Port number validation
export function isValidPort(port: number | string): boolean;
export function validatePort(port: number | string): ValidationResult<number>;

// Environment variable validation
export function validateEnvVar(
  name: string,
  options?: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'json';
    validator?: (value: string) => boolean;
    transform?: (value: string) => unknown;
  }
): ValidationResult;

// Create custom validator
export function createValidator<T>(
  validate: (value: unknown) => boolean | ValidationResult<T>,
  options?: {
    message?: string;
    code?: string;
  }
): (value: unknown) => ValidationResult<T>;

// Compose validators
export function composeValidators<T>(
  ...validators: ((value: T) => ValidationResult<T>)[]
): (value: T) => ValidationResult<T>;

// Object schema validation
export function validateObject<T extends object>(
  obj: unknown,
  schema: {
    [K in keyof T]: (value: unknown) => ValidationResult;
  }
): ValidationResult<T>;
```

### 4. Predicates (`predicates.ts`)

Reusable predicate functions for filtering and validation:

```typescript
// Numeric predicates
export const isPositive = (n: number): boolean => n > 0;
export const isNegative = (n: number): boolean => n < 0;
export const isInteger = (n: number): boolean => Number.isInteger(n);
export const isFinite = (n: number): boolean => Number.isFinite(n);
export const isInRange = (min: number, max: number) => (n: number): boolean => n >= min && n <= max;

// String predicates
export const isEmpty = (s: string): boolean => s.length === 0;
export const isNotEmpty = (s: string): boolean => s.length > 0;
export const hasMinLength = (min: number) => (s: string): boolean => s.length >= min;
export const hasMaxLength = (max: number) => (s: string): boolean => s.length <= max;
export const matches = (pattern: RegExp) => (s: string): boolean => pattern.test(s);

// Array predicates
export const hasLength = (length: number) => <T>(arr: T[]): boolean => arr.length === length;
export const hasMinItems = (min: number) => <T>(arr: T[]): boolean => arr.length >= min;
export const hasMaxItems = (max: number) => <T>(arr: T[]): boolean => arr.length <= max;
export const includes = <T>(item: T) => (arr: T[]): boolean => arr.includes(item);
export const every = <T>(predicate: (item: T) => boolean) => (arr: T[]): boolean => arr.every(predicate);
export const some = <T>(predicate: (item: T) => boolean) => (arr: T[]): boolean => arr.some(predicate);

// Object predicates
export const hasProperty = (prop: string) => (obj: object): boolean => prop in obj;
export const hasOwnProperty = (prop: string) => (obj: object): boolean => Object.hasOwn(obj, prop);
export const hasProperties = (props: string[]) => (obj: object): boolean => props.every(p => p in obj);

// Predicate combinators
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

## Testing Requirements

1. **Type Guards**:
   - Test all primitive types
   - Test edge cases (NaN, Infinity)
   - Verify TypeScript type narrowing
   - Performance benchmarks

2. **Assertions**:
   - Success and failure cases
   - Error messages and codes
   - Context preservation
   - Stack trace quality

3. **Validation**:
   - Valid and invalid inputs
   - Error aggregation
   - Custom validators
   - Composition behavior

4. **Predicates**:
   - All predicate functions
   - Combinator behavior
   - Edge cases

## Improvement Plan (Enhanced Implementation)

### Phase 1: Code Migration & Quality (Week 1) 🔥 HIGH

1. **Replace Raw Type Checks**
Replace existing raw `typeof` checks across codebase with type guards

2. **ESLint Rule Creation**
```javascript
// eslint-rules/prefer-type-guards.js
module.exports = {
  create(context) {
    return {
      BinaryExpression(node) {
        if (
          node.left.type === 'UnaryExpression' &&
          node.left.operator === 'typeof' &&
          node.operator === '===' &&
          node.right.type === 'Literal'
        ) {
          context.report({
            node,
            message: `Use type guard instead of typeof check`,
            fix(fixer) {
              // Auto-fix to appropriate type guard
            }
          });
        }
      }
    };
  }
};
```

3. **Pattern Validation Factory**
```typescript
export function createPatternValidator(
  pattern: RegExp,
  errorCode: string,
  errorMessage: string
): (value: string) => ValidationResult<string> {
  return (value: string): ValidationResult<string> => {
    if (!isString(value)) {
      return {
        valid: false,
        errors: [new ValidationError('Value must be string', { code: 'NOT_STRING', context: { value } })],
        input: value
      };
    }
    
    if (!pattern.test(value)) {
      return {
        valid: false,
        errors: [new ValidationError(errorMessage, { code: errorCode, context: { value, pattern: pattern.source } })],
        input: value
      };
    }
    
    return { valid: true, value, input: value };
  };
}
```

### Phase 2: Zod Integration (Week 2) 🟡 HIGH

1. **Zod Adapter**
```typescript
// zod-adapter.ts
import { z } from 'zod';
import type { ValidationResult } from './validation.js';

export function zodToValidation<T>(
  schema: z.ZodSchema<T>
): (value: unknown) => ValidationResult<T> {
  return (value: unknown): ValidationResult<T> => {
    const result = schema.safeParse(value);
    if (result.success) {
      return { valid: true, value: result.data, input: value };
    }
    return {
      valid: false,
      errors: result.error.errors.map(e =>
        new ValidationError(e.message, {
          code: e.code,
          path: e.path,
          context: { zodError: e }
        })
      ),
      input: value
    };
  };
}
```

2. **Hybrid Validation Strategy**
- Simple type guards for primitives (performance)
- Zod for complex schemas (nested objects)
- ValidationResult interface for consistency

### Phase 3: Migration Priority

Files to update in order:
1. `colors/generator.ts` - Core functionality
2. `utils/errors/*.ts` - Error handling consistency  
3. `utils/guards/assertions.ts` - Self-consistency
4. `utils/async/*.ts` - Async utilities
5. `utils/shared/*.ts` - Shared utilities

### Phase 4: Advanced Features

1. **Runtime Type Validation**
- Development mode enhanced checking
- Optional production validation
- Error tracking integration

2. **Code Generation**
- Generate guards from TypeScript interfaces
- Zod schemas as single source of truth
- Build process integration

## Success Criteria

- [ ] All modules implemented with full TypeScript support
- [ ] 100% test coverage
- [ ] Zero runtime overhead for type guards
- [ ] Performance benchmarks pass
- [ ] Integration with existing utilities
- [ ] Comprehensive documentation
- [ ] Examples for common use cases
- [ ] **Zero raw typeof checks in production code**
- [ ] **Zod integrated for complex schemas**
- [ ] **ESLint rule preventing new typeof checks**
- [ ] **Performance benchmarks documented**
- [ ] **Migration guide published**

## Dependencies

- Builds on error handling patterns
- Integrates with logger utilities
- May be used by other utility modules

## Notes

- Focus on developer experience
- Ensure tree-shaking works properly
- Follow existing code patterns
- Maintain backward compatibility