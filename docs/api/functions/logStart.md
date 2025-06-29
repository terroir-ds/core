[**Terroir Core Design System v0.1.0**](../README.md)

***

[Terroir Core Design System](../globals.md) / logStart

# Function: logStart()

> **logStart**(`processName`, `context`): `void`

Defined in: [utils/logger/index.ts:691](https://github.com/terroir-ds/core/blob/0096649176492a6e21b16e854cb30ade347b1bac/packages/core/src/utils/logger/index.ts#L691)

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

```text
logStart('database migration');
// Logs: "Starting database migration" with phase: 'start'

logStart('API server', { port: 3000, env: 'production' });
// Includes additional context in the log
```
