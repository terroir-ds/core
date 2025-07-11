[**Terroir Core Design System v0.1.0**](../README.md)

***

[Terroir Core Design System](../globals.md) / logPerformance

# Function: logPerformance()

> **logPerformance**(`operation`, `duration`, `context`): `void`

Defined in: [utils/logger/index.ts:747](https://github.com/terroir-ds/core/blob/0096649176492a6e21b16e854cb30ade347b1bac/packages/core/src/utils/logger/index.ts#L747)

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
  method: 'GET' 
});
```
