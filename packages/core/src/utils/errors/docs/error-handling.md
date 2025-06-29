# Error Handling System

The Terroir Core Design System provides a comprehensive error handling system designed for modern Node.js applications. It offers structured error classes, retry logic, circuit breakers, and centralized error management.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Error Classes](#error-classes)
- [Error Handling](#error-handling)
- [Retry Logic](#retry-logic)
- [Circuit Breakers](#circuit-breakers)
- [Error Messages](#error-messages)
- [Best Practices](#best-practices)
- [Migration Guide](#migration-guide)
- [API Reference](#api-reference)

## Overview

The error system provides:

- **Structured Error Classes**: Type-safe errors with rich context
- **Error Chaining**: Using native `Error.cause` (Node.js 16.9+)
- **Retry Logic**: Exponential backoff with jitter
- **Circuit Breakers**: Prevent cascading failures
- **Global Handlers**: Unified error handling across your application
- **Recovery Strategies**: Automatic error recovery
- **Centralized Messages**: Consistent, maintainable error messages

## Features

### Modern Node.js Features

- Native `Error.cause` for error chaining
- `AggregateError` support for multiple errors
- `AbortSignal` for cancellation
- Structured logging with Pino

### Error Management

- Unique error IDs for tracking
- Severity levels (low, medium, high, critical)
- Error categories for classification
- Retryable error detection
- Stack trace enhancement

### Resilience Patterns

- Exponential backoff with jitter
- Circuit breaker pattern
- Timeout handling
- Batch operations with retry
- Resource cleanup

## Quick Start

### Basic Usage

```typescript
import { ValidationError, handleError } from '@terroir/core/lib/utils/errors';

// Throw a structured error
throw new ValidationError('Email is required', {
  code: 'VALIDATION_EMAIL_REQUIRED',
  context: {
    field: 'email',
    value: null,
  },
});

// Handle errors globally
try {
  await someOperation();
} catch (error) {
  await handleError(error, {
    operation: 'userRegistration',
    userId: user.id,
  });
}
```

### With Retry Logic

```typescript
import { retry, NetworkError } from '@terroir/core/lib/utils/errors';

// Retry a network operation
const result = await retry(
  async () => {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new NetworkError(`HTTP ${response.status}`);
    }
    return response.json();
  },
  {
    maxAttempts: 3,
    initialDelay: 100,
    timeout: 5000,
  }
);
```

### With Circuit Breaker

```typescript
import { CircuitBreaker, retryWithCircuitBreaker } from '@terroir/core/lib/utils/errors';

// Create a circuit breaker
const apiBreaker = new CircuitBreaker({
  failureThreshold: 5,
  cooldownPeriod: 30000, // 30 seconds
  name: 'ExternalAPI',
});

// Use with retry
const data = await retryWithCircuitBreaker(
  () => fetch('/api/external').then((r) => r.json()),
  apiBreaker,
  { maxAttempts: 3 }
);
```

## Core Concepts

### Error Severity

Errors are classified by severity to help prioritize handling:

```text
enum ErrorSeverity {
  LOW = 'low', // Info-level, minor issues
  MEDIUM = 'medium', // Warning-level, should be addressed
  HIGH = 'high', // Error-level, requires attention
  CRITICAL = 'critical', // Fatal-level, immediate action needed
}
```

### Error Categories

Errors are grouped into categories for better organization:

```text
enum ErrorCategory {
  VALIDATION = 'validation', // Input validation failures
  CONFIGURATION = 'configuration', // Config/setup issues
  NETWORK = 'network', // Network/connectivity issues
  PERMISSION = 'permission', // Auth/authz failures
  RESOURCE = 'resource', // Resource not found/available
  BUSINESS_LOGIC = 'business_logic', // Domain-specific failures
  INTEGRATION = 'integration', // Third-party service issues
  UNKNOWN = 'unknown', // Uncategorized errors
}
```

### Error Context

All errors support rich context for debugging:

```typescript
interface ErrorContext {
  errorId?: string; // Unique error instance ID
  timestamp?: string; // When error occurred
  requestId?: string; // Request correlation ID
  userId?: string; // User identifier (auto-redacted)
  component?: string; // Component/module name
  operation?: string; // Operation being performed
  metadata?: Record<string, unknown>; // Additional data
}
```

## Error Classes

### BaseError

The foundation for all custom errors:

```typescript
import { BaseError, ErrorSeverity, ErrorCategory } from '@terroir/core/lib/utils/errors';

class CustomError extends BaseError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, {
      ...options,
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.BUSINESS_LOGIC,
      code: 'CUSTOM_ERROR',
      retryable: false,
    });
  }
}
```

### Built-in Error Classes

#### ValidationError

For input validation failures:

```yaml
throw new ValidationError('Invalid email format', {
  code: 'INVALID_EMAIL',
  context: {
    field: 'email',
    value: 'not-an-email',
    pattern: '^[^@]+@[^@]+\\.[^@]+$',
  },
});
```

#### ConfigurationError

For configuration issues:

```yaml
throw new ConfigurationError('Missing API key', {
  code: 'CONFIG_MISSING_API_KEY',
  context: {
    configKey: 'API_KEY',
    environment: process.env.NODE_ENV,
  },
});
```

#### NetworkError

For network-related failures:

```yaml
throw new NetworkError('Connection timeout', {
  code: 'NETWORK_TIMEOUT',
  retryable: true,
  context: {
    url: 'https://api.example.com',
    timeout: 5000,
  },
});
```

#### PermissionError

For authorization failures:

```yaml
throw new PermissionError('Insufficient permissions', {
  code: 'PERMISSION_INSUFFICIENT',
  context: {
    required: ['admin', 'write'],
    actual: ['read'],
  },
});
```

#### ResourceError

For missing resources:

```yaml
throw new ResourceError('User not found', {
  code: 'RESOURCE_USER_NOT_FOUND',
  statusCode: 404,
  context: {
    resourceType: 'user',
    resourceId: userId,
  },
});
```

#### BusinessLogicError

For domain-specific failures:

```yaml
throw new BusinessLogicError('Insufficient balance', {
  code: 'INSUFFICIENT_BALANCE',
  context: {
    required: 100,
    available: 50,
    currency: 'USD',
  },
});
```

#### IntegrationError

For third-party service issues:

```yaml
throw new IntegrationError('Payment gateway error', {
  code: 'PAYMENT_GATEWAY_ERROR',
  retryable: true,
  context: {
    service: 'stripe',
    error: stripeError,
  },
});
```

#### MultiError

For aggregating multiple errors:

```typescript
const errors = await Promise.allSettled(operations);
const failures = errors.filter((r) => r.status === 'rejected').map((r) => r.reason);

if (failures.length > 0) {
  throw new MultiError(failures, 'Multiple operations failed', {
    totalOperations: operations.length,
    failedCount: failures.length,
  });
}
```

## Error Handling

### Global Error Handlers

Set up global handlers for uncaught errors:

```typescript
import { setupGlobalErrorHandlers } from '@terroir/core/lib/utils/errors';

// Install handlers at app startup
setupGlobalErrorHandlers();

// Handles:
// - uncaughtException
// - unhandledRejection
// - Node.js warnings
// - SIGTERM/SIGINT for graceful shutdown
```

### Custom Error Handlers

Register custom handlers for specific error types:

```typescript
import { registerErrorHandler, registerRecoveryStrategy } from '@terroir/core/lib/utils/errors';

// Register a custom handler
registerErrorHandler('metrics', async (error, context) => {
  await metrics.recordError({
    error: error.message,
    severity: error.severity,
    ...context,
  });
});

// Register a recovery strategy
registerRecoveryStrategy('NETWORK_TIMEOUT', async (error) => {
  // Try fallback endpoint
  return await fetch('/api/fallback').then((r) => r.json());
});
```

### Error Boundaries

Wrap operations with error boundaries:

```typescript
import { errorBoundary } from '@terroir/core/lib/utils/errors';

const result = await errorBoundary(
  async () => {
    return await riskyOperation();
  },
  {
    fallback: defaultValue,
    onError: async (error) => {
      await notifyAdmin(error);
    },
    context: {
      operation: 'dataSync',
    },
  }
);
```

### Function Wrapping

Add error handling to existing functions:

```typescript
import { withErrorHandling } from '@terroir/core/lib/utils/errors';

const safeFunction = withErrorHandling(
  async (data: Data) => {
    return await processData(data);
  },
  {
    defaultValue: { success: false },
    context: { component: 'DataProcessor' },
  }
);
```

## Retry Logic

### Basic Retry

Simple retry with exponential backoff:

```typescript
import { retry } from '@terroir/core/lib/utils/errors';

const data = await retry(() => fetchData(), {
  maxAttempts: 3,
  initialDelay: 100,
  maxDelay: 5000,
  backoffFactor: 2,
  jitter: true,
});
```

### Conditional Retry

Retry only specific errors:

```typescript
const result = await retry(() => apiCall(), {
  shouldRetry: (error, attempt) => {
    // Only retry network errors
    if (error instanceof NetworkError) {
      return attempt < 3;
    }
    // Don't retry validation errors
    if (error instanceof ValidationError) {
      return false;
    }
    return true;
  },
  onRetry: (error, attempt, delay) => {
    logger.info(`Retrying after ${delay}ms (attempt ${attempt})`);
  },
});
```

### Timeout Handling

Add timeouts to operations:

```typescript
import { withTimeout } from '@terroir/core/lib/utils/errors';

const result = await withTimeout(
  longRunningOperation(),
  5000, // 5 second timeout
  abortSignal
);
```

### Cancellation Support

Use AbortSignal for cancellation:

```typescript
const controller = new AbortController();

// Cancel after 10 seconds
setTimeout(() => controller.abort(), 10000);

try {
  const result = await retry(() => fetchData(), {
    signal: controller.signal,
    maxAttempts: 5,
  });
} catch (error) {
  if (error.message.includes('cancelled')) {
    console.log('Operation was cancelled');
  }
}
```

## Circuit Breakers

### Basic Circuit Breaker

Prevent cascading failures:

```typescript
import { CircuitBreaker } from '@terroir/core/lib/utils/errors';

const breaker = new CircuitBreaker({
  failureThreshold: 5, // Open after 5 failures
  successThreshold: 2, // Close after 2 successes
  timeWindow: 60000, // Count failures in 1 minute window
  cooldownPeriod: 30000, // Wait 30s before half-open
  name: 'DatabaseBreaker',
});

// Use the breaker
try {
  const result = await breaker.execute(() => database.query('SELECT * FROM users'));
} catch (error) {
  if (error.code === 'CIRCUIT_OPEN') {
    // Use cache or return degraded response
    return getCachedData();
  }
  throw error;
}
```

### Circuit Breaker States

Circuit breakers have three states:

1. **Closed**: Normal operation, requests pass through
2. **Open**: Failing, requests immediately rejected
3. **Half-Open**: Testing recovery, limited requests allowed

```typescript
// Check circuit state
const state = breaker.getState();
const stats = breaker.getStats();

console.log({
  state,
  failures: stats.failures,
  lastFailureTime: stats.lastFailureTime,
});

// Manually reset if needed
breaker.reset();
```

### Combined Patterns

Use retry with circuit breaker:

```typescript
const result = await retryWithCircuitBreaker(
  async () => {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  breaker,
  {
    maxAttempts: 3,
    initialDelay: 100,
  }
);
```

## Error Messages

### Centralized Messages

Use centralized messages for consistency:

```typescript
import { getMessage, ERROR_MESSAGES } from '@terroir/core/lib/utils/errors';

// Get a message
const message = getMessage('VALIDATION_REQUIRED', 'email');
// Output: "email is required"

// With multiple parameters
const rangeMessage = getMessage('VALIDATION_RANGE', 'age', 18, 65);
// Output: "age must be between 18 and 65"
```

### Message Categories

Messages are organized by category:

```typescript
import { ERROR_MESSAGE_CATEGORIES } from '@terroir/core/lib/utils/errors';

// Get all validation messages
const validationKeys = ERROR_MESSAGE_CATEGORIES.VALIDATION;
// ['VALIDATION_REQUIRED', 'VALIDATION_INVALID', ...]

// Get all network messages
const networkKeys = ERROR_MESSAGE_CATEGORIES.NETWORK;
// ['NETWORK_CONNECTION_FAILED', 'NETWORK_TIMEOUT', ...]
```

### Custom Messages

Extend the message system:

```typescript
import { ValidationError, getMessage } from '@terroir/core/lib/utils/errors';

// Use built-in messages
throw new ValidationError(getMessage('VALIDATION_RANGE', 'score', 0, 100), {
  code: 'SCORE_OUT_OF_RANGE',
  context: { field: 'score', value: 150 },
});
```

## Best Practices

### 1. Always Use Structured Errors

```yaml
// ❌ Bad
throw new Error('Invalid input');

// ✅ Good
throw new ValidationError('Invalid email format', {
  code: 'INVALID_EMAIL_FORMAT',
  context: {
    field: 'email',
    value: input.email,
    pattern: EMAIL_REGEX.source,
  },
});
```

### 2. Provide Rich Context

```yaml
// ❌ Bad
throw new Error('Operation failed');

// ✅ Good
throw new IntegrationError('Payment processing failed', {
  code: 'PAYMENT_PROCESSING_ERROR',
  retryable: true,
  context: {
    service: 'stripe',
    operation: 'charge',
    amount: 9999,
    currency: 'USD',
    customerId: customer.id,
    errorCode: stripeError.code,
  },
});
```

### 3. Use Error Chaining

```yaml
try {
  await processPayment(order);
} catch (error) {
  // ❌ Bad - loses original error
  throw new Error('Payment failed');

  // ✅ Good - preserves error chain
  throw new BusinessLogicError('Order processing failed', {
    cause: error,
    context: {
      orderId: order.id,
      amount: order.total,
    },
  });
}
```

### 4. Handle Errors at the Right Level

```typescript
// ✅ Good - handle at appropriate level
async function controller(req, res) {
  try {
    const result = await service.process(req.body);
    res.json(result);
  } catch (error) {
    // Let error handler middleware handle it
    next(error);
  }
}

// ✅ Good - centralized error handling
app.use(async (error, req, res, next) => {
  await handleError(error, {
    requestId: req.id,
    userId: req.user?.id,
    path: req.path,
  });

  if (isBaseError(error)) {
    res.status(error.statusCode).json(error.toPublicJSON());
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 5. Use Appropriate Retry Strategies

```typescript
// ✅ Good - retry only retryable errors
const result = await retry(() => externalApiCall(), {
  shouldRetry: (error) => {
    if (error instanceof NetworkError) return true;
    if (error instanceof ValidationError) return false;
    if (error.statusCode === 429) return true; // Rate limited
    if (error.statusCode >= 500) return true; // Server errors
    return false;
  },
  maxAttempts: 3,
  backoffFactor: 2,
});
```

### 6. Implement Circuit Breakers for External Services

```typescript
// ✅ Good - protect against cascading failures
const breakers = new Map<string, CircuitBreaker>();

function getBreaker(service: string): CircuitBreaker {
  if (!breakers.has(service)) {
    breakers.set(
      service,
      new CircuitBreaker({
        name: service,
        failureThreshold: 5,
        cooldownPeriod: 30000,
      })
    );
  }
  return breakers.get(service)!;
}

// Use breaker for each service
const userServiceBreaker = getBreaker('UserService');
const users = await userServiceBreaker.execute(() => userService.getUsers());
```

### 7. Log Errors Appropriately

```yaml
// ✅ Good - errors are automatically logged based on severity
try {
  await operation();
} catch (error) {
  // This logs based on error severity
  await handleError(error, {
    operation: 'dataSync',
    batchId: batch.id,
  });

  // Re-throw if needed upstream
  throw error;
}
```

### 8. Clean Up Resources

```typescript
// ✅ Good - ensure cleanup happens
async function withResource() {
  const resource = await acquireResource();

  try {
    return await errorBoundary(() => processWithResource(resource), {
      onError: async (error) => {
        await resource.rollback();
      },
    });
  } finally {
    await resource.release();
  }
}
```

## Migration Guide

### From Basic Errors

```typescript
// Before
try {
  await operation();
} catch (error) {
  console.error('Operation failed:', error);
  throw new Error('Operation failed');
}

// After
import { handleError, wrapError, NetworkError } from '@terroir/core/lib/utils/errors';

try {
  await operation();
} catch (error) {
  // Wrap unknown errors
  const wrappedError = isNetworkError(error)
    ? new NetworkError('Operation failed', { cause: error })
    : wrapError(error, 'Operation failed');

  // Handle with context
  await handleError(wrappedError, {
    operation: 'dataSync',
  });

  throw wrappedError;
}
```

### From Custom Error Classes

```typescript
// Before
class MyError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'MyError';
  }
}

// After
import { BaseError, ErrorSeverity } from '@terroir/core/lib/utils/errors';

class MyError extends BaseError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, {
      ...options,
      code: options?.code ?? 'MY_ERROR',
      severity: ErrorSeverity.MEDIUM,
      retryable: false,
    });
  }
}
```

### From Promise Rejection Handling

```typescript
// Before
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection:', reason);
});

// After
import { setupGlobalErrorHandlers } from '@terroir/core/lib/utils/errors';

// This sets up all global handlers
setupGlobalErrorHandlers();
```

### From Manual Retry Logic

```typescript
// Before
async function retryOperation(fn, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
}

// After
import { retry } from '@terroir/core/lib/utils/errors';

const result = await retry(fn, {
  maxAttempts: 3,
  backoffFactor: 2,
  initialDelay: 1000,
  jitter: true,
});
```

## API Reference

For detailed API documentation, see:

- [Error Classes API](./api/error-classes.md)
- [Error Handlers API](./api/error-handlers.md)
- [Retry Logic API](./api/retry-logic.md)
- [Circuit Breaker API](./api/circuit-breaker.md)
- [Error Messages API](./api/error-messages.md)

## Related Documentation

- [Logging System](../logger/docs/logging.md)
- [Type Definitions](../types/README.md)
- [Testing Error Scenarios](./testing-errors.md)
