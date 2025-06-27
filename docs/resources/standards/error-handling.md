# Error Handling Standards

## Overview

Always use the project's error handling utilities for consistent, type-safe error management across the codebase.

## Standards

### 1. Use Typed Error Classes

````typescript
// ❌ DON'T throw generic errors
throw new Error('User not found');

// ✅ DO use typed errors with context
import { NotFoundError } from '@utils/errors';
throw new NotFoundError('User not found', {
  code: 'USER_NOT_FOUND',
  context: { userId }
});
```text
### 2. Always Include Error Context

```typescript
// ❌ DON'T omit context
throw new ValidationError('Invalid input');

// ✅ DO provide rich context
throw new ValidationError('Invalid email format', {
  code: 'INVALID_EMAIL',
  context: {
    field: 'email',
    value: email,
    pattern: EMAIL_REGEX.toString()
  },
  help: 'Email must be in format: user@example.com'
});
```text
### 3. Use Error Chaining

```typescript
// ❌ DON'T lose original errors
try {
  await fetchUser(id);
} catch (error) {
  throw new Error('Failed to load user');
}

// ✅ DO chain errors with cause
try {
  await fetchUser(id);
} catch (error) {
  throw new ServiceError('Failed to load user', {
    code: 'USER_FETCH_FAILED',
    cause: error,
    context: { userId: id }
  });
}
```text
### 4. Handle Errors at Appropriate Levels

```typescript
// ❌ DON'T catch and ignore
try {
  await riskyOperation();
} catch (error) {
  // Silent failure
}

// ✅ DO handle appropriately
try {
  await riskyOperation();
} catch (error) {
  // Log for debugging
  logger.error({ err: error }, 'Operation failed');

  // Recover if possible
  if (isRecoverable(error)) {
    return fallbackValue;
  }

  // Re-throw with context
  throw new OperationError('Critical operation failed', {
    cause: error,
    code: 'OPERATION_FAILED'
  });
}
```text
### 5. Use Retry and Circuit Breaker Patterns

```typescript
// ❌ DON'T retry blindly
while (attempts < 3) {
  try {
    return await apiCall();
  } catch (error) {
    attempts++;
  }
}

// ✅ DO use retry utilities
import { retry, CircuitBreaker } from '@utils/errors';

// With retry
const result = await retry(
  () => apiCall(),
  {
    attempts: 3,
    delay: 1000,
    backoff: 'exponential',
    shouldRetry: (error) => !isNonRetryable(error)
  }
);

// With circuit breaker
const breaker = new CircuitBreaker({
  threshold: 5,
  timeout: 60000
});
const result = await breaker.execute(() => apiCall());
```text
### 6. Global Error Handling

```typescript
// ✅ Use centralized handlers
import { handleError } from '@utils/errors';

// In main app
process.on('unhandledRejection', (error) => {
  handleError(error, {
    context: { source: 'unhandledRejection' },
    severity: 'critical'
  });
});

// In request handlers
app.use((error, req, res, next) => {
  handleError(error, {
    context: {
      url: req.url,
      method: req.method
    }
  });

  res.status(error.statusCode || 500).json({
    error: error.toJSON()
  });
});
```text
## Available Error Types

```typescript
import {
  BaseError,         // Base class for all errors
  ValidationError,   // Input validation failures
  NotFoundError,     // Resource not found
  AuthError,         // Authentication failures
  NetworkError,      // Network/API failures
  ServiceError,      // Service-level failures
  ConfigError,       // Configuration issues
  TimeoutError      // Operation timeouts
} from '@utils/errors';
```text
## Testing Errors

```typescript
import { ValidationError } from '@utils/errors';

// Test error properties
expect(() => {
  validateEmail(invalidEmail);
}).toThrow(ValidationError);

// Test with context
try {
  validateEmail(invalidEmail);
} catch (error) {
  expect(error).toBeInstanceOf(ValidationError);
  expect(error.code).toBe('INVALID_EMAIL');
  expect(error.context.value).toBe(invalidEmail);
}
````

## References

- [Full Error Documentation](../../lib/utils/errors/docs/error-handling.md)
- [Error API Reference](../../lib/utils/errors/docs/api/)
- [Testing Errors Guide](../../lib/utils/errors/docs/testing-errors.md)
