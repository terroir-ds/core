[**Terroir Core Design System v0.1.0**](../README.md)

***

[Terroir Core Design System](../globals.md) / logSuccess

# Function: logSuccess()

> **logSuccess**(`processName`, `context`): `void`

Defined in: [utils/logger/index.ts:716](https://github.com/terroir-ds/core/blob/0096649176492a6e21b16e854cb30ade347b1bac/packages/core/src/utils/logger/index.ts#L716)

Logs successful completion of a process.

Provides consistent success logging with visual indicator (✓) and
status tracking for process completion.

## Parameters

### processName

`string`

Name of the completed process

### context

[`LogContext`](../interfaces/LogContext.md) = `{}`

Additional context to include in the log

## Returns

`void`

## Example

```typescript
logStart('data import');
await importData();
logSuccess('data import');
// Logs: "✓ data import completed successfully"

logSuccess('user registration', { userId: 123, duration: 250 });
```
