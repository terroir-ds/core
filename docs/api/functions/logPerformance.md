[**Terroir Core Design System v0.1.0**](../README.md)

---

[Terroir Core Design System](../globals.md) / logPerformance

# Function: logPerformance()

> **logPerformance**(`operation`, `duration`, `context`): `void`

Defined in: [utils/logger/index.ts:742](https://github.com/terroir-ds/core/blob/9691713b8c512b7d2abe808c4f7084bdfab798bf/lib/utils/logger/index.ts#L742)

Logs performance metrics for an operation.

Standardizes performance logging with consistent structure for
monitoring and analysis of operation durations.

## Parameters

### operation

`string`

Name of the operation being measured

### duration

`number`

Duration in milliseconds

### context

[`LogContext`](../interfaces/LogContext.md) = `{}`

Additional context to include in the log

## Returns

`void`

## Example

```typescript
const start = performance.now();
await processData();
const duration = performance.now() - start;

logPerformance('data processing', duration);
// Logs: "data processing took 1234ms"

logPerformance('API call', 250, {
  endpoint: '/users',
  method: 'GET',
});
```
