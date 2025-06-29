# Logging Standards

## Overview

Always use the structured logger for consistent, secure, and performant logging throughout the codebase.

## Standards

### 1. Never Use Console

```typescript
// ❌ NEVER use console methods
console.log('Processing items...');
console.error('Error:', error);
console.warn('Warning: deprecated');

// ✅ ALWAYS use the logger
import { logger } from '@utils/logger';
logger.info('Processing items...');
logger.error({ err: error }, 'Processing failed');
logger.warn('Deprecated feature used');
```

### 2. Use Structured Logging

```yaml
// ❌ DON'T log unstructured strings
logger.info(`Processing ${count} items for user ${userId}`);

// ✅ DO log structured data
logger.info(
  {
    count,
    userId,
    operation: 'batch-process'
  },
  'Processing items'
);
```

### 3. Use Helper Functions

```typescript
import { logStart, logSuccess, logError, measureTime } from '@utils/logger';

// ❌ DON'T manually track operations
logger.info('Starting color generation...');
const colors = await generateColors();
logger.info('Color generation complete');

// ✅ DO use operation helpers
logStart('color generation');
try {
  const colors = await measureTime('color generation', async () => {
    return await generateColors();
  });
  logSuccess('color generation', { count: colors.length });
} catch (error) {
  logError('color generation', error);
  throw error;
}
```

### 4. Include Appropriate Context

```yaml
// ❌ DON'T log without context
logger.error('Failed to save');

// ✅ DO include relevant context
logger.error(
  {
    err: error,
    userId,
    operation: 'save-profile',
    attempted: 3,
    duration: Date.now() - startTime
  },
  'Failed to save user profile'
);
```

### 5. Use Child Loggers for Context

```typescript
// ❌ DON'T repeat context manually
logger.info({ requestId }, 'Starting request');
logger.info({ requestId }, 'Validating input');
logger.info({ requestId }, 'Processing data');

// ✅ DO use child loggers
const requestLogger = logger.child({ requestId });
requestLogger.info('Starting request');
requestLogger.info('Validating input');
requestLogger.info('Processing data');
```

### 6. Security - Never Log Sensitive Data

```yaml
// ❌ NEVER log sensitive information
logger.info({
  password: user.password,
  apiKey: config.apiKey,
  creditCard: payment.cardNumber
});

// ✅ DO redact sensitive fields (automatic with our logger)
logger.info({
  user: {
    id: user.id,
    email: user.email
    // password automatically redacted
  },
  hasApiKey: !!config.apiKey
});
```

### 7. Use Appropriate Log Levels

```text
// Log levels and their usage:

// TRACE: Very detailed debugging info
logger.trace({ query }, 'SQL query executed');

// DEBUG: Debugging information
logger.debug({ config }, 'Loaded configuration');

// INFO: General informational messages
logger.info({ userId }, 'User logged in');

// WARN: Warning messages
logger.warn({ deprecated: 'oldMethod' }, 'Using deprecated API');

// ERROR: Error messages (include error object)
logger.error({ err: error }, 'Operation failed');

// FATAL: Critical errors that will crash the app
logger.fatal({ err: error }, 'Unrecoverable error');
```

### 8. Performance Tracking

```typescript
// ❌ DON'T manually calculate durations
const start = Date.now();
await operation();
logger.info(`Took ${Date.now() - start}ms`);

// ✅ DO use performance utilities
await measureTime('expensive-operation', async () => {
  await operation();
});
// Automatically logs: "expensive-operation completed in 123ms"
```

## Environment Configuration

The logger automatically adapts to the environment:

- **Development**: Pretty-printed, colorized output
- **Production**: JSON formatted for log aggregation
- **Test**: Minimal output to reduce noise

## Common Patterns

### API Endpoints

```typescript
export async function handleRequest(req: Request) {
  const requestLogger = logger.child({
    requestId: req.id,
    method: req.method,
    path: req.path
  });

  requestLogger.info('Request started');

  try {
    const result = await processRequest(req);
    requestLogger.info({ duration: req.duration }, 'Request completed');
    return result;
  } catch (error) {
    requestLogger.error({ err: error }, 'Request failed');
    throw error;
  }
}
```

### Batch Operations

```typescript
export async function processBatch(items: Item[]) {
  logStart('batch processing', { count: items.length });

  const results = await measureTime('batch processing', async () => {
    return await Promise.all(items.map(processItem));
  });

  logSuccess('batch processing', {
    processed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length
  });

  return results;
}
```

## References

- [Logger Implementation](../../lib/utils/logger.ts)
- [Logger Tests](../../lib/utils/__tests__/logger.test.ts)
