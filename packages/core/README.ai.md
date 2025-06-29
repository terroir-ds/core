# @terroir/core

**Install**: `pnpm add @terroir/core`  
**Import**: `import { guards, errors, logger } from '@terroir/core';`

## 🎯 Common Tasks

| I need to...             | Use this          | Example                                                |
| ------------------------ | ----------------- | ------------------------------------------------------ |
| Check if value is string | `isString()`      | `if (isString(val)) { /* val is string */ }`           |
| Validate email           | `validateEmail()` | `validateEmail("user@example.com") // { valid: true }` |
| Assert non-null          | `assertDefined()` | `assertDefined(config, "Config required")`             |
| Create typed error       | `ValidationError` | `throw new ValidationError("Invalid", { field })`      |
| Log with structure       | `logger.info()`   | `logger.info({ userId }, "User logged in")`            |
| Handle async timeout     | `withTimeout()`   | `await withTimeout(fetch(url), 5000)`                  |

## 🚀 Quick Start

```typescript
// Most common imports
import {
  // Guards
  isString,
  isNumber,
  assertDefined,
  // Errors
  ValidationError,
  wrapError,
  // Logger
  logger,
  // Async
  withTimeout,
  retry,
} from '@terroir/core';

// Example usage
function processUser(data: unknown) {
  assertDefined(data, 'User data required');

  if (!isString(data.email)) {
    throw new ValidationError('Invalid email', {
      field: 'email',
      value: data.email,
    });
  }

  logger.info({ email: data.email }, 'Processing user');
}
```

## 📦 Module Exports

<details>
<summary>Guards & Validation (click to expand)</summary>

| Function        | Type                                                       | Use Case                  |
| --------------- | ---------------------------------------------------------- | ------------------------- |
| `isString`      | `(val: unknown) => val is string`                          | Type guard for strings    |
| `isNumber`      | `(val: unknown) => val is number`                          | Type guard for numbers    |
| `isArray`       | `(val: unknown) => val is unknown[]`                       | Type guard for arrays     |
| `assertDefined` | `<T>(val: T, msg?: string): asserts val is NonNullable<T>` | Assert not null/undefined |
| `validateEmail` | `(email: string) => ValidationResult`                      | Email validation          |
| `validateUrl`   | `(url: string) => ValidationResult`                        | URL validation            |

</details>

<details>
<summary>Error Handling (click to expand)</summary>

| Class/Function     | Use Case                  | Example                                         |
| ------------------ | ------------------------- | ----------------------------------------------- |
| `ValidationError`  | Input validation failures | `throw new ValidationError("Invalid", context)` |
| `NetworkError`     | API/fetch failures        | `throw new NetworkError("Timeout", { url })`    |
| `wrapError`        | Add context to errors     | `throw wrapError(err, "During user save")`      |
| `isRetryableError` | Check if should retry     | `if (isRetryableError(err)) retry()`            |

</details>

<details>
<summary>Logging (click to expand)</summary>

| Method           | Use Case      | Example                                    |
| ---------------- | ------------- | ------------------------------------------ |
| `logger.info()`  | General info  | `logger.info({ id }, "Created")`           |
| `logger.error()` | Errors        | `logger.error({ err }, "Failed")`          |
| `logger.child()` | Scoped logger | `const userLog = logger.child({ userId })` |

</details>

## ⚡ Performance Notes

- Guards are inlined by TypeScript
- Logger uses Pino (fastest Node logger)
- All functions tree-shakeable
- Zero runtime dependencies for guards

## 🔧 Common Patterns

### Pattern 1: Validate and transform

```typescript
import { assertDefined, isString, ValidationError } from '@terroir/core';

function parseConfig(data: unknown): Config {
  assertDefined(data, 'Config required');

  if (!isString(data.apiKey)) {
    throw new ValidationError('Invalid API key');
  }

  return { apiKey: data.apiKey };
}
```

### Pattern 2: Retry with timeout

```typescript
import { retry, withTimeout, NetworkError } from '@terroir/core';

const data = await retry(() => withTimeout(fetch(url), 5000), { maxAttempts: 3, delay: 1000 });
```

## ❌ Common Mistakes

```text
// ❌ Wrong - using console
console.log('User created');

// ✅ Right - use logger
logger.info({ userId }, 'User created');

// ❌ Wrong - generic errors
throw new Error('Failed');

// ✅ Right - typed errors
throw new ValidationError('Failed', { field: 'email' });
```

---

## 📊 AI Metadata

```text
token_cost: 1200
quick_ref_tokens: 250
stability: stable
last_updated: 2025-06-29
```
