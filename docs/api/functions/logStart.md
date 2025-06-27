[**Terroir Core Design System v0.1.0**](../README.md)

---

[Terroir Core Design System](../globals.md) / logStart

# Function: logStart()

> **logStart**(`processName`, `context`): `void`

Defined in: [utils/logger/index.ts:686](https://github.com/terroir-ds/core/blob/9691713b8c512b7d2abe808c4f7084bdfab798bf/lib/utils/logger/index.ts#L686)

Logs the start of a process or operation.

Standardizes the logging of process initialization with consistent
formatting and phase tracking.

## Parameters

### processName

`string`

Name of the process being started

### context

[`LogContext`](../interfaces/LogContext.md) = `{}`

Additional context to include in the log

## Returns

`void`

## Example

```typescript
logStart('database migration');
// Logs: "Starting database migration" with phase: 'start'

logStart('API server', { port: 3000, env: 'production' });
// Includes additional context in the log
```
