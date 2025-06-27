# Error Handlers API Reference

## Global Error Handling

### setupGlobalErrorHandlers()

Install global error handlers for Node.js process events.

```typescript
function setupGlobalErrorHandlers(): void;
```typescript
**Handles**:

- `uncaughtException`: Logs fatal error and exits after 1 second
- `unhandledRejection`: Logs error but continues running
- `warning`: Logs Node.js warnings
- `SIGTERM`, `SIGINT`: Graceful shutdown with cleanup

**Example**:

```typescript
// Call once at application startup
import { setupGlobalErrorHandlers } from '@terroir/core/lib/utils/errors';

setupGlobalErrorHandlers();
```typescript
## Error Handler Registration

### registerErrorHandler()

Register a custom error handler.

```typescript
function registerErrorHandler(name: string, handler: ErrorHandler): void;
```typescript
**Parameters**:

- `name`: Unique identifier for the handler
- `handler`: Function to handle errors

**ErrorHandler Type**:

```typescript
type ErrorHandler = (error: Error, context?: LogContext) => void | Promise<void>;
```typescript
**Example**:

```typescript
// Register metrics handler
registerErrorHandler('metrics', async (error, context) => {
  await metrics.recordError({
    errorType: error.name,
    severity: error.severity,
    ...context,
  });
});

// Register alerting handler
registerErrorHandler('alerts', async (error, context) => {
  if (error.severity === ErrorSeverity.CRITICAL) {
    await alerting.sendAlert({
      title: 'Critical Error',
      message: error.message,
      context,
    });
  }
});
```typescript
### unregisterErrorHandler()

Remove a registered error handler.

```typescript
function unregisterErrorHandler(name: string): void;
```typescript
**Parameters**:

- `name`: The handler name to remove

**Example**:

```typescript
// Remove handler
unregisterErrorHandler('metrics');
```typescript
### handleError()

Process error with all registered handlers.

```typescript
async function handleError(error: unknown, context?: LogContext): Promise<void>;
```typescript
**Parameters**:

- `error`: The error to handle
- `context`: Additional logging context

**Behavior**:

1. Wraps non-BaseError instances
2. Logs based on error severity
3. Runs all registered handlers
4. Uses `Promise.allSettled` to ensure all handlers run

**Example**:

```typescript
try {
  await riskyOperation();
} catch (error) {
  await handleError(error, {
    operation: 'userImport',
    userId: user.id,
    batchId: batch.id,
  });
}
```typescript
## Recovery Strategies

### registerRecoveryStrategy()

Register an error recovery strategy.

```typescript
function registerRecoveryStrategy(errorCode: string, strategy: RecoveryStrategy): void;
```typescript
**Parameters**:

- `errorCode`: The error code to handle
- `strategy`: Function that attempts recovery

**RecoveryStrategy Type**:

```typescript
type RecoveryStrategy<T = void> = (error: Error) => T | Promise<T>;
```typescript
**Example**:

```typescript
// Register cache fallback for network errors
registerRecoveryStrategy('NETWORK_TIMEOUT', async (error) => {
  logger.info('Using cached data due to network timeout');
  return cache.get('lastKnownGoodData');
});

// Register retry for rate limits
registerRecoveryStrategy('RATE_LIMITED', async (error) => {
  const retryAfter = error.context?.retryAfter || 60;
  await sleep(retryAfter * 1000);
  return retry(() => originalOperation());
});
```typescript
### tryRecover()

Attempt to recover from an error using registered strategies.

```typescript
async function tryRecover<T>(error: unknown, defaultValue?: T): Promise<T | undefined>;
```typescript
**Parameters**:

- `error`: The error to recover from
- `defaultValue`: Value to return if recovery fails

**Returns**: Recovery result, defaultValue, or undefined

**Example**:

```typescript
try {
  return await fetchUserData(userId);
} catch (error) {
  // Try recovery, fall back to empty user
  const recovered = await tryRecover(error, {
    id: userId,
    name: 'Unknown',
  });
  return recovered;
}
```typescript
## Error Boundaries

### errorBoundary()

Wrap async operations with error handling and recovery.

```typescript
async function errorBoundary<T>(
  operation: () => Promise<T>,
  options?: {
    fallback?: T | (() => T | Promise<T>);
    onError?: (error: Error) => void | Promise<void>;
    context?: LogContext;
    retry?: boolean;
  }
): Promise<T>;
```typescript
**Parameters**:

- `operation`: The async function to execute
- `options`: Error handling configuration

**Options**:

- `fallback`: Value or function to use on error
- `onError`: Custom error handler
- `context`: Logging context
- `retry`: Whether to attempt retry (not implemented)

**Example**:

```typescript
// With static fallback
const data = await errorBoundary(() => fetchData(), { fallback: [] });

// With dynamic fallback
const user = await errorBoundary(() => fetchUser(id), {
  fallback: async () => {
    const cached = await cache.get(`user:${id}`);
    return cached || { id, name: 'Unknown' };
  },
  onError: async (error) => {
    await notifyAdmins('User fetch failed', error);
  },
});
```typescript
### withErrorHandling()

Create a function that handles its own errors.

```typescript
function withErrorHandling<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options?: {
    defaultValue?: ReturnType<T>;
    context?: LogContext;
    rethrow?: boolean;
  }
): T;
```typescript
**Parameters**:

- `fn`: Function to wrap
- `options`: Error handling configuration

**Options**:

- `defaultValue`: Value to return on error
- `context`: Logging context
- `rethrow`: Whether to re-throw after handling

**Example**:

```typescript
// Create safe version of function
const safeParseJson = withErrorHandling((text: string) => JSON.parse(text), {
  defaultValue: {},
  context: { operation: 'parseConfig' },
});

// Use without try/catch
const config = await safeParseJson(configText);

// With rethrow for upstream handling
const processUser = withErrorHandling(
  async (user: User) => {
    return await userService.process(user);
  },
  {
    rethrow: true,
    context: { component: 'UserProcessor' },
  }
);
```typescript
## Error Formatting

### formatError()

Format error for human-readable display.

```typescript
function formatError(
  error: unknown,
  options?: {
    stack?: boolean;
    cause?: boolean;
    context?: boolean;
  }
): string;
```typescript
**Parameters**:

- `error`: The error to format
- `options`: Formatting options

**Options** (all default to `true`):

- `stack`: Include stack trace
- `cause`: Include error cause chain
- `context`: Include error context

**Example**:

```typescript
// Full error details
console.error(formatError(error));

// Minimal format
console.log(
  formatError(error, {
    stack: false,
    cause: false,
  })
);

// Output format:
// NetworkError: Connection timeout
//   Error ID: 123e4567-e89b-12d3-a456-426614174000
//   Code: NETWORK_TIMEOUT
//   Severity: medium
//   Category: network
//   Context:
//     url: https://api.example.com
//     timeout: 5000
//   Caused by:
//     Error: ETIMEDOUT
//   Stack:
//     at Socket._onTimeout (net.js:123:45)
//     ...
```typescript
### extractErrorDetails()

Extract error details as structured data.

```typescript
function extractErrorDetails(error: unknown): Record<string, unknown>;
```typescript
**Parameters**:

- `error`: The error to extract details from

**Returns**: Object with error properties

**Example**:

```typescript
const details = extractErrorDetails(error);
// {
//   name: 'ValidationError',
//   message: 'Invalid input',
//   stack: '...',
//   errorId: '...',
//   context: { ... }
// }

// Safe for non-errors too
const details2 = extractErrorDetails('string error');
// { error: 'string error' }
```typescript
## Assertions

### assert()

Assert a condition and throw if false.

```typescript
function assert(condition: unknown, message: string, code?: string): asserts condition;
```typescript
**Parameters**:

- `condition`: Value to test for truthiness
- `message`: Error message if assertion fails
- `code`: Error code (default: 'ASSERTION_FAILED')

**Example**:

```typescript
function processOrder(order: Order) {
  assert(order.items.length > 0, 'Order must have items');
  assert(order.total > 0, 'Order total must be positive', 'INVALID_TOTAL');

  // TypeScript knows order.items.length > 0 here
  const firstItem = order.items[0];
}
```typescript
### assertDefined()

Assert value is not null or undefined.

```typescript
function assertDefined<T>(value: T | null | undefined, message: string): asserts value is T;
```typescript
**Parameters**:

- `value`: Value to check
- `message`: Error message if undefined

**Example**:

```typescript
function getUser(id: string): User {
  const user = users.get(id);
  assertDefined(user, `User not found: ${id}`);

  // TypeScript knows user is defined here
  return user;
}
```typescript
## Process Event Handlers

### Graceful Shutdown

The `setupGlobalErrorHandlers()` function installs signal handlers for graceful shutdown:

```typescript
// Internal implementation
process.on('SIGTERM', async () => {
  logger.info({ signal: 'SIGTERM' }, 'Received shutdown signal');

  try {
    await gracefulShutdown();
    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Graceful shutdown failed');
    process.exit(1);
  }
});
```typescript
**Graceful Shutdown Process**:

1. Receives SIGTERM or SIGINT
2. Logs shutdown initiation
3. Executes registered shutdown tasks
4. Waits up to 30 seconds
5. Exits with appropriate code

**To add shutdown tasks**, modify the `gracefulShutdown` function:

```typescript
// Example shutdown tasks
async function gracefulShutdown(): Promise<void> {
  const shutdownTasks: Array<() => Promise<void>> = [
    () => database.close(),
    () => cache.disconnect(),
    () => server.close(),
    () => messageQueue.shutdown(),
  ];

  // Execute with timeout
  await Promise.race([
    Promise.all(shutdownTasks.map((task) => task().catch(logger.error))),
    sleep(30000).then(() => {
      throw new Error('Shutdown timeout');
    }),
  ]);
}
```typescript
## Examples

### Complete Error Handling Setup

```typescript
import {
  setupGlobalErrorHandlers,
  registerErrorHandler,
  registerRecoveryStrategy,
  handleError,
} from '@terroir/core/lib/utils/errors';

// 1. Setup global handlers
setupGlobalErrorHandlers();

// 2. Register custom handlers
registerErrorHandler('monitoring', async (error, context) => {
  await monitoring.track('error', {
    name: error.name,
    message: error.message,
    ...context,
  });
});

// 3. Register recovery strategies
registerRecoveryStrategy('DB_CONNECTION_LOST', async () => {
  await database.reconnect();
  return true;
});

// 4. Use in application
async function application() {
  try {
    await startServer();
  } catch (error) {
    await handleError(error, {
      component: 'server',
      phase: 'startup',
    });
    process.exit(1);
  }
}
```typescript
### Error Middleware for Express

```typescript
import { handleError, isBaseError } from '@terroir/core/lib/utils/errors';

export async function errorMiddleware(
  error: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  // Handle with context
  await handleError(error, {
    requestId: req.id,
    method: req.method,
    path: req.path,
    userId: req.user?.id,
  });

  // Send appropriate response
  if (isBaseError(error)) {
    res.status(error.statusCode).json(error.toPublicJSON());
  } else {
    res.status(500).json({
      error: 'Internal server error',
      requestId: req.id,
    });
  }
}
```
