# Logging Guide

This guide covers the structured logging implementation in Terroir Core Design System.

## Overview

We use [Pino](https://getpino.io/) for high-performance structured logging with:

- Environment-aware configuration
- Security features (automatic redaction)
- Performance tracking utilities
- TypeScript support
- Request correlation

## Basic Usage

```typescript
import { logger } from '@terroir/core/lib/utils/logger';

// Basic logging
logger.info('Application started');
logger.error({ err: error }, 'Failed to start application');
logger.debug({ config }, 'Loaded configuration');

// With structured data
logger.info({
  userId: 123,
  action: 'login',
  ip: request.ip
}, 'User logged in');
```

## Utility Functions

### Process Lifecycle

```typescript
import { logStart, logSuccess } from '@terroir/core/lib/utils/logger';

// Mark the start of a process
logStart('database migration');

// ... do work ...

// Mark successful completion
logSuccess('database migration', { 
  tablesCreated: 5,
  duration: 1234 
});
```

### Performance Tracking

```typescript
import { measureTime, logPerformance } from '@terroir/core/lib/utils/logger';

// Automatic measurement
const result = await measureTime('api call', async () => {
  return await fetchUserData(userId);
});

// Manual measurement
const start = performance.now();
await doExpensiveOperation();
logPerformance('expensive operation', performance.now() - start);
```

### Child Loggers

```typescript
import { createLogger } from '@terroir/core/lib/utils/logger';

// Create a logger with additional context
const requestLogger = createLogger({
  requestId: req.id,
  userId: req.user?.id,
  path: req.path
});

// All logs from this logger include the context
requestLogger.info('Processing request');
requestLogger.error({ err }, 'Request failed');
```

## Request Correlation

For tracing requests across services:

```typescript
import { 
  generateRequestId, 
  setRequestId, 
  clearRequestId 
} from '@terroir/core/lib/utils/logger';

// At request start
const requestId = generateRequestId();
setRequestId(requestId);

// All logs now include the requestId
logger.info('Processing request');

// At request end
clearRequestId();
```

## Security Features

### Automatic Redaction

Sensitive fields are automatically redacted:

```typescript
logger.info({
  user: {
    email: 'user@example.com',
    password: 'secret123',  // Automatically becomes '[REDACTED]'
    apiKey: 'xyz-789'       // Automatically becomes '[REDACTED]'
  }
}, 'User data');
```

Redacted patterns include:
- `password`, `passwd`, `pwd`
- `token`, `api_key`, `apikey`
- `secret`, `private`
- `auth`, `authorization`
- `session`, `cookie`
- `credit_card`, `ssn`
- `bank_account`, `pin`, `cvv`

### Size Limits

Large objects are automatically truncated to prevent memory issues:

```typescript
logger.info({
  hugeData: veryLargeObject  // Truncated if > 10KB
}, 'Processing data');
```

## Environment Configuration

### Development

- Pretty printed, colorized output
- Debug level logging
- Stack traces included
- Timestamp format: `HH:MM:ss.l`

### Production

- JSON structured output
- Info level logging (unless LOG_LEVEL set)
- Optimized for log aggregation
- Request ID correlation
- Path redaction enabled

### Testing

- Minimal output (errors only)
- No colors
- Single line format

## Best Practices

### DO ✅

```typescript
// Use structured logging
logger.info({ userId, action }, 'User performed action');

// Include error objects properly
logger.error({ err: error, userId }, 'Operation failed');

// Use child loggers for context
const moduleLogger = createLogger({ module: 'auth' });

// Track performance of critical operations
await measureTime('database query', async () => {
  await db.query(sql);
});

// Use appropriate log levels
logger.debug({ query }, 'Executing query');      // Development info
logger.info({ userId }, 'User logged in');        // Business events
logger.warn({ attempts }, 'Multiple login attempts'); // Warnings
logger.error({ err }, 'Database connection failed');  // Errors
```

### DON'T ❌

```typescript
// Don't use console.log
console.log('Debug info');  // ❌ Use logger.debug()

// Don't log sensitive data directly
logger.info(`Password: ${password}`);  // ❌ Will not be redacted

// Don't use string concatenation
logger.info('User ' + userId + ' logged in');  // ❌ Use structured data

// Don't log huge objects
logger.debug(entireDatabase);  // ❌ Log only relevant fields

// Don't ignore errors
catch (err) {
  // ❌ Silent failure
}
```

## Performance Considerations

1. **Use appropriate log levels** - Debug logs are filtered in production
2. **Avoid logging in tight loops** - Batch or sample instead
3. **Use child loggers** - Prevents repeated context data
4. **Let Pino handle formatting** - Don't pre-format messages

## Integration Examples

### Express Middleware

```typescript
app.use((req, res, next) => {
  const requestId = generateRequestId();
  setRequestId(requestId);
  
  const requestLogger = createLogger({
    requestId,
    method: req.method,
    path: req.path
  });
  
  req.logger = requestLogger;
  requestLogger.info('Request received');
  
  res.on('finish', () => {
    requestLogger.info({
      statusCode: res.statusCode,
      duration: Date.now() - req.startTime
    }, 'Request completed');
    clearRequestId();
  });
  
  next();
});
```

### Error Handler

```typescript
app.use((err, req, res, next) => {
  req.logger.error({
    err,
    stack: err.stack,
    statusCode: err.statusCode || 500
  }, 'Request error');
  
  res.status(err.statusCode || 500).json({
    error: 'Internal server error',
    requestId: getRequestId()
  });
});
```

## Troubleshooting

### No Logs Appearing

1. Check `NODE_ENV` - Test environment only shows errors
2. Check `LOG_LEVEL` environment variable
3. Ensure logger is imported from correct path

### Performance Issues

1. Reduce log level in production
2. Use sampling for high-frequency events
3. Check for accidental logging in loops

### Missing Context

1. Use child loggers for module/request context
2. Set request ID at entry points
3. Include relevant fields in structured data

## Configuration Reference

### Environment Variables

- `NODE_ENV` - Environment (development/production/test)
- `LOG_LEVEL` - Override default level (fatal/error/warn/info/debug/trace)
- `NO_COLOR` - Disable colors in development

### Log Levels

| Level | Value | Use Case |
|-------|-------|----------|
| fatal | 60 | Application crash |
| error | 50 | Errors requiring attention |
| warn | 40 | Warning conditions |
| info | 30 | General information |
| debug | 20 | Debug information |
| trace | 10 | Detailed trace info |

## Future Enhancements

- OpenTelemetry integration
- Log shipping configuration
- Sampling strategies
- Custom transports