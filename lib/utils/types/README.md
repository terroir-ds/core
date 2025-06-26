# Type Utilities

Shared type definitions and type guards for the Terroir Core Design System.

## Overview

This directory contains reusable TypeScript type definitions that are shared across multiple utilities and modules. By centralizing these types, we ensure consistency, reduce duplication, and make it easier to maintain type safety throughout the codebase.

## Directory Structure

```text
types/
├── async.types.ts    # Async operation types (promises, cancellation, etc.)
└── README.md         # This file
```

## Available Types

### Async Types (`async.types.ts`)

Common types for asynchronous operations:

#### Base Options

- **`CancellableOptions`** - Operations that support cancellation via AbortSignal
- **`ProgressOptions`** - Operations that report progress
- **`CancellableProgressOptions`** - Combined cancellable + progress

#### Result Types

- **`Result<T, E>`** - Container for success/error results
- **`BatchResult<T, R, E>`** - Result with metadata for batch operations

#### Function Types

- **`AsyncMapper<T, R>`** - Maps items asynchronously
- **`AsyncProcessor<T, R>`** - Processes batches of items
- **`AsyncFactory<T>`** - Creates values asynchronously
- **`AsyncPredicate<T>`** - Tests conditions asynchronously
- **`AsyncVoidFunction`** - Async function with no parameters

#### Pattern Types

- **`Deferred<T>`** - External promise control pattern
- **`RetryDelay`** - Flexible retry delay strategies
- **`RetryPredicate`** - Determines if retry should occur
- **`ErrorConstructor`** - Creates custom error types

#### Utility Functions

- **`isPromise(value)`** - Type guard for promises
- **`isAbortError(error)`** - Type guard for abort errors
- **`createErrorClass(name)`** - Creates typed error constructors

## Usage Examples

### Cancellable Operations

```typescript
import type { CancellableOptions } from '@utils/types/async.types';

interface MyOptions extends CancellableOptions {
  timeout?: number;
}

async function myOperation(options?: MyOptions): Promise<void> {
  if (options?.signal?.aborted) {
    throw new DOMException('Operation aborted', 'AbortError');
  }
  // ... operation logic
}
```

### Progress Reporting

```typescript
import type { CancellableProgressOptions } from '@utils/types/async.types';

async function processItems<T>(items: T[], options?: CancellableProgressOptions): Promise<void> {
  for (let i = 0; i < items.length; i++) {
    options?.onProgress?.(i + 1, items.length);
    // ... process item
  }
}
```

### Result Containers

```typescript
import type { Result } from '@utils/types/async.types';

async function tryOperation(): Promise<Result<string>> {
  try {
    const value = await riskyOperation();
    return { value };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}
```

### Deferred Promises

```typescript
import type { Deferred } from '@utils/types/async.types';

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
```

## Adding New Types

When adding new shared types:

1. **Check for existing patterns** - Reuse or extend existing types
2. **Document thoroughly** - Add JSDoc comments for all exports
3. **Consider generic versions** - Make types flexible with generics
4. **Export type guards** - Provide runtime checks when useful
5. **Update this README** - Document new types and usage

## Best Practices

### 1. Use Type-Only Imports

```typescript
// ✅ Good - type-only import
import type { CancellableOptions } from '@utils/types/async.types';

// ❌ Avoid - runtime import for types
import { CancellableOptions } from '@utils/types/async.types';
```

### 2. Extend Base Interfaces

```typescript
// ✅ Good - extend base interface
interface MyOptions extends CancellableOptions {
  customField: string;
}

// ❌ Avoid - duplicate fields
interface MyOptions {
  signal?: AbortSignal; // Duplicates CancellableOptions
  customField: string;
}
```

### 3. Use Generic Constraints

```typescript
// ✅ Good - constrained generic
function processResult<T, E extends Error>(result: Result<T, E>): T | null {
  return result.value ?? null;
}

// ❌ Avoid - unconstrained error type
function processResult<T>(result: Result<T, any>): T | null {
  return result.value ?? null;
}
```

### 4. Provide Default Type Parameters

```typescript
// ✅ Good - sensible defaults
export interface Result<T, E = Error> {
  value?: T;
  error?: E;
}

// Usage is simpler for common cases
const result: Result<string>; // E defaults to Error
```

## Migration Guide

When migrating code to use shared types:

1. **Identify duplicate type definitions**
2. **Import shared types instead**
3. **Update implementations to match**
4. **Run type checking to verify**
5. **Update tests if needed**

Example migration:

```typescript
// Before
interface MyOptions {
  signal?: AbortSignal;
  onProgress?: (done: number, total: number) => void;
}

// After
import type { CancellableProgressOptions } from '@utils/types/async.types';

interface MyOptions extends CancellableProgressOptions {
  // Only add unique fields here
}
```

## Type Safety Guidelines

1. **Avoid `any`** - Use `unknown` and type guards
2. **Prefer interfaces** - For object types (better error messages)
3. **Use const assertions** - For literal types
4. **Document edge cases** - In JSDoc comments
5. **Export discriminated unions** - For variant types

## Future Additions

Planned type modules:

- `validation.types.ts` - Input validation types
- `error.types.ts` - Error hierarchy and patterns
- `config.types.ts` - Configuration schemas
- `theme.types.ts` - Design token types
