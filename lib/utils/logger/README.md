# Logger Utilities

A high-performance, structured logging system for the Terroir Core Design System with security features, performance tracking, and environment-aware output.

## Overview

The logger provides:

- **Structured Logging**: JSON format in production, pretty format in development
- **Security Features**: Automatic redaction of sensitive data
- **Performance Tracking**: Built-in utilities for measuring operations
- **Child Loggers**: Context-specific logging with inheritance
- **Request Tracking**: Automatic request ID propagation
- **Environment Aware**: Adapts output based on NODE_ENV
- **TypeScript Support**: Full type safety for log data

## Installation

```typescript
import {
  logger,
  createLogger,
  logStart,
  logSuccess,
  measureTime,
} from '@terroir/core/lib/utils/logger';
```

## Core API

### Basic Logging

```typescript
// Simple messages
logger.info('Application started');
logger.warn('Deprecation warning');
logger.error('Connection failed');

// With structured data
logger.info({ userId: 123, action: 'login' }, 'User authenticated');
logger.error({ err: error, attemptCount: 3 }, 'Failed to connect');

// With formatting
logger.info({ count: 5 }, 'Processed %d items', 5);
```

### Log Levels

The logger supports standard Pino log levels:

- `trace` (10): Most detailed debugging information
- `debug` (20): Detailed debugging information
- `info` (30): General informational messages
- `warn` (40): Warning messages
- `error` (50): Error messages
- `fatal` (60): Fatal errors that crash the application

```typescript
// Check if a level is enabled
if (logger.isLevelEnabled('debug')) {
  const debugData = computeExpensiveDebugInfo();
  logger.debug(debugData, 'Debug information');
}

// Set minimum level
const customLogger = createLogger({
  name: 'api',
  level: 'warn', // Only warn and above
});
```

### Child Loggers

Create contextual loggers that inherit configuration:

```typescript
// Create child with additional context
const requestLogger = logger.child({
  requestId: '123-456',
  userId: 'user-789',
});

requestLogger.info('Processing request');
// Logs: { ...baseContext, requestId: '123-456', userId: 'user-789' }

// Nested children
const dbLogger = requestLogger.child({ component: 'database' });
dbLogger.info({ query: 'SELECT *' }, 'Executing query');
```

### Performance Tracking

Built-in utilities for measuring operations:

```typescript
// Simple operation timing
const result = await measureTime('database-query', async () => {
  return await db.query('SELECT * FROM users');
});

// Manual timing
logStart('export-process');
await processExport();
logSuccess('export-process', { recordCount: 1000 });

// Log performance metrics
const start = performance.now();
await doExpensiveOperation();
logPerformance('expensive operation', performance.now() - start);

// With structured data
logStart('api-call', { endpoint: '/users', method: 'GET' });
const response = await fetch('/users');
logSuccess('api-call', {
  statusCode: response.status,
  duration: Date.now() - startTime,
});
```

### Error Logging

Enhanced error logging with stack traces and context:

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error(
    {
      err: error,
      operation: 'riskyOperation',
      context: { userId: 123 },
    },
    'Operation failed'
  );
}

// With error cause chain
logger.error(
  {
    err: {
      message: 'Database connection failed',
      cause: originalError,
    },
  },
  'Failed to initialize database'
);
```

## Advanced Features

### Custom Logger Creation

```typescript
const apiLogger = createLogger({
  name: 'api',
  level: 'info',
  enabled: process.env.ENABLE_API_LOGS === 'true',
});

// With custom serializers
const customLogger = createLogger({
  name: 'custom',
  serializers: {
    user: (user) => ({ id: user.id, name: user.name }),
    req: (req) => ({ method: req.method, url: req.url }),
  },
});
```

### Security Features

The logger automatically redacts sensitive data:

```typescript
// These will be redacted automatically
logger.info({
  password: 'secret123', // Redacted
  apiKey: 'key-456', // Redacted
  token: 'bearer-789', // Redacted
  email: 'user@example.com', // Partially redacted
  phone: '+1234567890', // Partially redacted
});

// Output:
// {
//   password: "[REDACTED]",
//   apiKey: "[REDACTED]",
//   token: "[REDACTED]",
//   email: "u***@example.com",
//   phone: "+1******890"
// }
```

**Redacted patterns include:**

- `password`, `passwd`, `pwd`
- `token`, `api_key`, `apikey`
- `secret`, `private`
- `auth`, `authorization`
- `session`, `cookie`
- `credit_card`, `ssn`
- `bank_account`, `pin`, `cvv`

**Size Limits:**

Large objects are automatically truncated to prevent memory issues:

```typescript
logger.info(
  {
    hugeData: veryLargeObject, // Truncated if > 10KB
  },
  'Processing data'
);
```

### Request Context

Automatic request ID tracking:

```typescript
// Request ID utilities
import {
  generateRequestId,
  setRequestId,
  getRequestId,
  clearRequestId,
  setRequestContext,
} from '@terroir/core/lib/utils/logger';

// Simple request ID tracking
app.use((req, res, next) => {
  const requestId = generateRequestId();
  setRequestId(requestId);

  res.on('finish', () => {
    clearRequestId();
  });

  next();
});

// Full request context
app.use((req, res, next) => {
  setRequestContext({
    requestId: req.id || generateRequestId(),
    userId: req.user?.id,
    method: req.method,
    path: req.path,
  });
  next();
});

// All subsequent logs include request context
logger.info('Processing request'); // Includes requestId automatically
```

### Performance Utilities

```typescript
// Batch operations with logging
await measureTime(
  'batch-process',
  async () => {
    for (const item of items) {
      await processItem(item);
    }
  },
  {
    onComplete: (duration) => {
      logger.info({ duration, itemCount: items.length }, 'Batch completed');
    },
  }
);

// Nested performance tracking
await measureTime('full-export', async () => {
  await measureTime('fetch-data', fetchData);
  await measureTime('transform-data', transformData);
  await measureTime('write-output', writeOutput);
});
```

## Environment-Specific Behavior

### Development Mode

- Pretty-printed output with colors
- Stack traces for errors
- All log levels enabled
- Synchronous output for debugging

```typescript
// NODE_ENV=development
logger.info({ user: { id: 123 } }, 'User logged in');
// Output:
// [16:23:45.123] INFO (app): User logged in
//   user: {
//     id: 123
//   }
```

### Production Mode

- JSON format for parsing
- Configurable log levels
- Asynchronous for performance
- No colors or formatting

```typescript
// NODE_ENV=production
logger.info({ user: { id: 123 } }, 'User logged in');
// Output:
// {"level":30,"time":1234567890,"msg":"User logged in","user":{"id":123}}
```

### Test Mode

- Disabled by default
- Can be enabled with TEST_LOG=true
- Captures logs for assertions

```typescript
// In tests
import { captureLogs } from '@terroir/core/lib/utils/logger/__mocks__/logger.mock';

it('should log success', () => {
  const logs = captureLogs(() => {
    myFunction();
  });

  expect(logs.info).toContainEqual(expect.objectContaining({ msg: 'Operation successful' }));
});
```

## Best Practices

### 1. Use Structured Data

```typescript
// ❌ Don't concatenate data into messages
logger.info(`User ${userId} performed ${action}`);

// ✅ Use structured data
logger.info({ userId, action }, 'User performed action');
```

### 2. Create Contextual Loggers

```typescript
// ❌ Don't repeat context
logger.info({ component: 'auth', userId }, 'Login attempt');
logger.info({ component: 'auth', userId }, 'Login successful');

// ✅ Create child logger with context
const authLogger = logger.child({ component: 'auth', userId });
authLogger.info('Login attempt');
authLogger.info('Login successful');
```

### 3. Use Appropriate Levels

```typescript
// Trace: Very detailed debugging
logger.trace({ query, params }, 'SQL query details');

// Debug: Debugging information
logger.debug({ config }, 'Loaded configuration');

// Info: General information
logger.info({ userId }, 'User logged in');

// Warn: Warning conditions
logger.warn({ retries: 3 }, 'Operation succeeded after retries');

// Error: Error conditions
logger.error({ err }, 'Operation failed');

// Fatal: Application crash
logger.fatal({ err }, 'Unrecoverable error');
```

### 4. Include Error Context

```typescript
// ❌ Don't log errors without context
logger.error(err);

// ✅ Include relevant context
logger.error(
  {
    err,
    userId: req.user.id,
    endpoint: req.path,
    method: req.method,
  },
  'Request failed'
);
```

### 5. Measure Performance

```typescript
// ✅ Use built-in performance tracking
const result = await measureTime('expensive-operation', async () => {
  return await complexCalculation();
});

// ✅ Track multiple operations
logStart('data-pipeline');
const data = await measureTime('fetch', fetchData);
const processed = await measureTime('process', () => processData(data));
await measureTime('save', () => saveData(processed));
logSuccess('data-pipeline');
```

## Configuration

### Environment Variables

- `NODE_ENV`: Controls output format (development/production/test)
- `LOG_LEVEL`: Minimum log level (default: info)
- `TEST_LOG`: Enable logging in tests (default: false)
- `NO_COLOR`: Disable colors in development

### Logger Options

```typescript
interface LoggerOptions {
  name?: string; // Logger name
  level?: string; // Minimum level
  enabled?: boolean; // Enable/disable logger
  serializers?: object; // Custom serializers
  redact?: string[]; // Additional fields to redact
  prettyPrint?: boolean; // Force pretty printing
}
```

## Integration Examples

### Express Middleware

```typescript
app.use((req, res, next) => {
  const requestId = generateRequestId();
  setRequestId(requestId);

  const requestLogger = createLogger({
    name: 'request',
    requestId,
    method: req.method,
    path: req.path,
  });

  req.logger = requestLogger;
  requestLogger.info('Request received');

  res.on('finish', () => {
    requestLogger.info(
      {
        statusCode: res.statusCode,
        duration: Date.now() - req.startTime,
      },
      'Request completed'
    );
    clearRequestId();
  });

  next();
});
```

### Error Handler

```typescript
app.use((err, req, res, next) => {
  req.logger.error(
    {
      err,
      stack: err.stack,
      statusCode: err.statusCode || 500,
    },
    'Request error'
  );

  res.status(err.statusCode || 500).json({
    error: 'Internal server error',
    requestId: getRequestId(),
  });
});
```

## Testing

### Using the Mock Logger

```typescript
import {
  createMockLogger,
  captureLogs,
} from '@terroir/core/lib/utils/logger/__mocks__/logger.mock';

describe('MyComponent', () => {
  it('should log operations', () => {
    const mockLogger = createMockLogger();

    myFunction(mockLogger);

    expect(mockLogger.info).toHaveBeenCalledWith({ userId: 123 }, 'Operation completed');
  });

  it('should capture log output', () => {
    const logs = captureLogs(() => {
      logger.info('Test message');
      logger.error({ err: new Error('Test') }, 'Test error');
    });

    expect(logs.info).toHaveLength(1);
    expect(logs.error).toHaveLength(1);
    expect(logs.all).toHaveLength(2);
  });
});
```

## Performance Considerations

1. **Lazy Evaluation**: Check log levels before expensive operations
2. **Child Loggers**: Reuse child loggers instead of creating new ones
3. **Async Logging**: Production mode uses async streams
4. **Redaction Cost**: Minimize logged sensitive data

## Migration Guide

### From console.log

```typescript
// Before
console.log('User logged in:', userId);
console.error('Failed:', error);

// After
logger.info({ userId }, 'User logged in');
logger.error({ err: error }, 'Failed');
```

### From Winston

```typescript
// Before
winston.log('info', 'User logged in', { userId });
winston.error('Failed', error);

// After
logger.info({ userId }, 'User logged in');
logger.error({ err: error }, 'Failed');
```

### From Debug

```typescript
// Before
const debug = require('debug')('app:auth');
debug('User authenticated: %s', userId);

// After
const authLogger = logger.child({ component: 'auth' });
authLogger.debug({ userId }, 'User authenticated');
```

## Troubleshooting

### Logs Not Appearing

1. Check log level: `LOG_LEVEL` environment variable
2. Check if logger is enabled in tests: `TEST_LOG=true`
3. Verify logger isn't disabled: `enabled: false` option

### Performance Issues

1. Use appropriate log levels
2. Avoid logging in tight loops
3. Check for expensive serializers
4. Use child loggers for context

### Security Concerns

1. Never disable redaction in production
2. Review custom serializers for leaks
3. Avoid logging request bodies
4. Use structured data for sensitive operations

## Future Enhancements

- OpenTelemetry integration
- Log shipping configuration
- Sampling strategies
- Custom transports
