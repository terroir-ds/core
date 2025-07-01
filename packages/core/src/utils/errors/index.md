# Error Handling System

A comprehensive error handling system for the Terroir Core Design System, providing structured error classes, retry logic, circuit breakers, and centralized error management.

## Quick Links

- 📖 **[Complete Documentation](./docs/error-handling.md)** - Full guide with examples
- 🔧 **[API Reference](./docs/api/)** - Detailed API documentation
- 🧪 **[Testing Guide](./docs/testing-errors.md)** - Testing error scenarios

## Features

- 🏗️ **Structured Error Classes** - Type-safe errors with rich context
- 🔗 **Error Chaining** - Native `Error.cause` support (Node.js 16.9+)
- 🔄 **Retry Logic** - Exponential backoff with jitter
- 🚦 **Circuit Breakers** - Prevent cascading failures
- 🌍 **Global Handlers** - Unified error handling
- 🔧 **Recovery Strategies** - Automatic error recovery
- 📝 **Centralized Messages** - Consistent error messaging

## Installation

The error system is part of the core library:

```typescript
import {
  ValidationError,
  retry,
  CircuitBreaker,
  handleError,
} from '@terroir/core/lib/utils/errors';
```

## Quick Start

### Basic Error Handling

```typescript
import { ValidationError, handleError } from '@terroir/core/lib/utils/errors';

// Throw structured errors
throw new ValidationError('Email is required', {
  code: 'EMAIL_REQUIRED',
  context: { field: 'email' },
});

// Handle errors globally
try {
  await riskyOperation();
} catch (error) {
  await handleError(error, {
    operation: 'userRegistration',
  });
}
```

### Retry Failed Operations

```typescript
import { retry } from '@terroir/core/lib/utils/errors';

const data = await retry(
  async () => {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  {
    maxAttempts: 3,
    timeout: 5000,
  }
);
```

### Circuit Breaker Protection

```typescript
import { CircuitBreaker } from '@terroir/core/lib/utils/errors';

const apiBreaker = new CircuitBreaker({
  failureThreshold: 5,
  cooldownPeriod: 30000,
});

const data = await apiBreaker.execute(() => fetch('/api/external').then((r) => r.json()));
```

## Error Classes

| Class                | Purpose                   | Status Code | Retryable |
| -------------------- | ------------------------- | ----------- | --------- |
| `ValidationError`    | Input validation failures | 400         | No        |
| `ConfigurationError` | Config/setup issues       | 500         | No        |
| `NetworkError`       | Network/connectivity      | 503         | Yes       |
| `PermissionError`    | Auth/authz failures       | 403         | No        |
| `ResourceError`      | Missing resources         | 404         | No        |
| `BusinessLogicError` | Domain violations         | 422         | No        |
| `IntegrationError`   | Third-party issues        | 502         | Yes       |
| `MultiError`         | Multiple errors           | -           | -         |

## API Overview

### Error Creation

```typescript
const error = new NetworkError('Connection timeout', {
  code: 'TIMEOUT',
  retryable: true,
  context: {
    url: 'https://api.example.com',
    timeout: 5000,
  },
});
```

### Error Handling

```text
// Global handlers
setupGlobalErrorHandlers();

// Custom handlers
registerErrorHandler('metrics', async (error, context) => {
  await metrics.recordError(error);
});

// Recovery strategies
registerRecoveryStrategy('NETWORK_TIMEOUT', async () => {
  return await cache.getLastKnown();
});
```

### Retry Logic

```typescript
// With custom retry logic
const result = await retry(operation, {
  maxAttempts: 5,
  shouldRetry: (error) => error.retryable,
  onRetry: (error, attempt, delay) => {
    logger.info(`Retry ${attempt} after ${delay}ms`);
  },
});
```

### Circuit Breakers

```typescript
const breaker = new CircuitBreaker({
  failureThreshold: 5,
  successThreshold: 2,
  timeWindow: 60000,
  cooldownPeriod: 30000,
});

// Check state
if (breaker.getState() === 'open') {
  return getCachedData();
}
```

## Documentation

### 📚 Guides

- **[Error Handling Guide](./docs/error-handling.md)** - Complete guide with examples
- **[Testing Errors](./docs/testing-errors.md)** - Testing patterns and utilities

### 🔧 API Reference

- **[Error Classes](./docs/api/error-classes.md)** - All error class APIs
- **[Error Handlers](./docs/api/error-handlers.md)** - Handler registration and execution
- **[Retry Logic](./docs/api/retry-logic.md)** - Retry functions and patterns
- **[Circuit Breakers](./docs/api/circuit-breaker.md)** - Circuit breaker implementation
- **[Error Messages](./docs/api/error-messages.md)** - Centralized messaging system

## Examples

### Express Middleware

```yaml
app.use(async (error, req, res, next) => {
  await handleError(error, {
    requestId: req.id,
    path: req.path,
  });

  if (isBaseError(error)) {
    res.status(error.statusCode).json(error.toPublicJSON());
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Database Operations

```typescript
const dbBreaker = new CircuitBreaker({ name: 'Database' });

async function queryWithRetry(sql: string) {
  return await retryWithCircuitBreaker(() => db.query(sql), dbBreaker, { maxAttempts: 3 });
}
```

### Batch Processing

```typescript
const results = await batchRetry(items, async (item) => processItem(item), {
  concurrency: 5,
  maxAttempts: 3,
});

const failures = results.filter((r) => r.error);
if (failures.length > 0) {
  throw new MultiError(
    failures.map((f) => f.error!),
    `${failures.length} items failed`
  );
}
```

## Best Practices

1. **Use appropriate error classes** - Choose the right error type for clarity
2. **Provide rich context** - Include relevant debugging information
3. **Chain errors properly** - Preserve the original cause
4. **Handle at the right level** - Don't catch errors too early
5. **Configure retry wisely** - Only retry transient failures
6. **Monitor circuit breakers** - Track open circuits as health indicators
7. **Test error paths** - Ensure proper error handling and recovery

## Node.js Requirements

- Node.js 18+ (uses native `Error.cause`)
- TypeScript 5.0+ (for full type support)

## Contributing

See the [main contributing guide](../../../../CONTRIBUTING.md) for general guidelines.

For error system specific contributions:

- Add tests for new error scenarios
- Update documentation for API changes
- Follow existing error patterns
- Include context in error messages

## Related Systems

- [Logger](../logger/) - Structured logging system
- [Types](../types/) - Type definitions
- [Config](../config/) - Configuration management
