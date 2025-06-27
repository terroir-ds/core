[**Terroir Core Design System v0.1.0**](../README.md)

---

[Terroir Core Design System](../globals.md) / createLogger

# Function: createLogger()

> **createLogger**(`context`): `Logger`

Defined in: [utils/logger/index.ts:792](https://github.com/terroir-ds/core/blob/9691713b8c512b7d2abe808c4f7084bdfab798bf/lib/utils/logger/index.ts#L792)

Creates a child logger with additional context.

Child loggers inherit all configuration from the parent logger
while adding their own context. This is useful for adding
module-specific or request-specific context. Child loggers
are tracked for resource management.

## Parameters

### context

[`LogContext`](../interfaces/LogContext.md)

Context to include in all logs from this logger

## Returns

`Logger`

A new logger instance with the additional context

## Examples

````typescript
// In auth module
const authLogger = createLogger({ module: 'auth' });

authLogger.info('User login attempt');
// Logs with: { module: 'auth', msg: 'User login attempt' }

authLogger.error({ userId, error }, 'Login failed');
// Includes module context automatically
```typescript
```typescript
function handleRequest(req: Request) {
  const reqLogger = createLogger({
    requestId: req.id,
    path: req.path,
    method: req.method,
  });

  reqLogger.info('Processing request');
  // All logs include request context
}
````
