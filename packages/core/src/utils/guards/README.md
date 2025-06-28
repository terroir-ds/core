# Type Guards & Validation Utilities

A comprehensive TypeScript-first library for runtime type checking, validation, and assertions.

## Overview

This module provides lightweight, performance-optimized utilities for runtime type safety. It's designed to complement TypeScript's compile-time type checking with robust runtime validation.

## Features

- **Zero-overhead type guards** for primitive types
- **Runtime assertions** with proper TypeScript type narrowing
- **Common validation patterns** (email, URL, semver, etc.)
- **Composable predicates** for building complex validations
- **Zod-compatible** validation results
- **Performance-optimized** implementations
- **Full TypeScript support** with inference

## Modules

### Type Guards (`type-guards.ts`)

Fast, zero-overhead type checking with proper TypeScript type narrowing.

```typescript
import { isString, isNumber, isDefined } from '@utils/guards';

function processValue(value: unknown) {
  if (isString(value)) {
    // TypeScript knows value is string
    return value.toUpperCase();
  }
  
  if (isNumber(value) && isFinite(value)) {
    return value * 2;
  }
  
  throw new Error('Invalid value');
}
```bash
### Assertions (`assertions.ts`)

Runtime assertions that throw on failure with proper type narrowing.

```typescript
import { assertDefined, assertType, assertInRange } from '@utils/guards';

function calculatePercentage(value: number | undefined, total: number) {
  assertDefined(value, 'Value is required');
  // TypeScript knows value is number
  
  assertInRange(value, 0, total, 'Value must be between 0 and total');
  
  return (value / total) * 100;
}
```bash
### Validation (`validation.ts`)

Common validation patterns with detailed error reporting.

```typescript
import { validateEmail, validateUrl, composeValidators } from '@utils/guards';

// Simple validation
const emailResult = validateEmail('user@example.com');
if (emailResult.valid) {
  console.log('Valid email:', emailResult.value);
} else {
  console.error('Validation errors:', emailResult.errors);
}

// Compose validators
const validateCompanyEmail = composeValidators(
  validateEmail,
  (email) => email.endsWith('@company.com') 
    ? { valid: true, value: email }
    : { valid: false, errors: [{ message: 'Must be company email' }] }
);
```bash
### Predicates (`predicates.ts`)

Reusable, composable predicate functions.

```typescript
import { isPositive, hasMinLength, and, or, not } from '@utils/guards';

// Create composed predicates
const isValidAge = and(isPositive, (n: number) => n <= 120);
const isValidName = and(hasMinLength(2), not(isEmpty));

// Use in filters and validations
const validUsers = users.filter(user => 
  isValidAge(user.age) && isValidName(user.name)
);
```bash
## Performance

All type guards are optimized for performance:

- **Primitive guards**: Single `typeof` checks with no overhead
- **Object guards**: Minimal property access with caching where beneficial
- **Validation**: Lazy error message generation
- **Predicates**: Arrow functions for optimal JIT compilation

## Comparison with Zod

| Feature | Guards | Zod | Use Case |
|---------|--------|-----|----------|
| Primitive type checking | ✅ Faster | ❌ Slower | Hot paths, type guards |
| Schema validation | ❌ Limited | ✅ Excellent | Complex objects, API validation |
| Bundle size | ✅ Smaller | ❌ Larger | Simple validation needs |
| Type inference | ✅ Good | ✅ Excellent | Both suitable |
| Error messages | ✅ Good | ✅ Excellent | Zod better for user-facing |

**Recommendation**: Use Guards for simple type checking and hot paths, Zod for complex schema validation.

## Integration with Existing Code

This module is designed to work alongside existing validation:

```typescript
// Use with Zod schemas
import { z } from 'zod';
import { validateEmail } from '@utils/guards';

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().refine(email => validateEmail(email).valid, {
    message: 'Invalid email format'
  }),
  age: z.number().int().positive().max(120)
});

// Replace scattered type checks
import { isString, isDefined } from '@utils/guards';

// Before: Manual type checking
if (typeof value === 'string' && value != null) {
  // ...
}

// After: Clean type guards
if (isString(value) && isDefined(value)) {
  // ...
}
```bash
## Migration Guide

### From Manual Type Checks

```typescript
// Before
if (typeof value === 'string') { /* ... */ }
if (value != null) { /* ... */ }
if (Array.isArray(value)) { /* ... */ }

// After
import { isString, isDefined, isArray } from '@utils/guards';

if (isString(value)) { /* ... */ }
if (isDefined(value)) { /* ... */ }
if (isArray(value)) { /* ... */ }
```bash
### From Existing Error Handling

```typescript
// Before
if (!user) {
  throw new Error('User not found');
}

// After
import { assertDefined } from '@utils/guards';

assertDefined(user, 'User not found');
// TypeScript now knows user is defined
```

## Best Practices

1. **Use type guards for simple checks**: Fast and type-safe
2. **Use assertions for required conditions**: Clear error messages
3. **Use validation for user input**: Detailed error reporting
4. **Compose predicates for complex logic**: Reusable and testable
5. **Prefer guards over Zod for hot paths**: Performance matters
6. **Use Zod for complex schemas**: Better error messages and features

## Contributing

When adding new utilities:

1. Follow existing patterns for consistency
2. Add comprehensive tests including TypeScript type tests
3. Optimize for performance (avoid object allocation in hot paths)
4. Include JSDoc documentation with examples
5. Update this README with usage examples

## API Reference

See the TypeScript definitions and JSDoc comments in each module for detailed API documentation.
