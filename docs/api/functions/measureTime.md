[**Terroir Core Design System v0.1.0**](../README.md)

---

[Terroir Core Design System](../globals.md) / measureTime

# Function: measureTime()

> **measureTime**\<`T`\>(`operation`, `fn`, `context`): `Promise`\<`T`\>

Defined in: [utils/logger/index.ts:856](https://github.com/terroir-ds/core/blob/9691713b8c512b7d2abe808c4f7084bdfab798bf/lib/utils/logger/index.ts#L856)

Measures and logs the execution time of an async operation.

Wraps an async function to automatically measure its execution
time and log the result with performance metrics. Handles both
successful completion and errors.

## Type Parameters

### T

`T`

The return type of the async function

## Parameters

### operation

`string`

Name of the operation being measured

### fn

() => `Promise`\<`T`\>

Async function to execute and measure

### context

[`LogContext`](../interfaces/LogContext.md) = `{}`

Additional context to include in logs

## Returns

`Promise`\<`T`\>

The result of the async function

## Throws

The original error if the function fails

## Examples

```typescript
const result = await measureTime('database query', async () => db.query('SELECT * FROM users'));
// Logs: "database query took 45ms" on success
// Logs error with duration on failure
```

```typescript
const data = await measureTime('API fetch', async () => fetch('/api/data').then((r) => r.json()), {
  endpoint: '/api/data',
  method: 'GET',
});
```

```typescript
try {
  await measureTime('risky operation', async () => riskyOperation(), { retries: 3 });
} catch (error) {
  // Error is logged with duration before being re-thrown
  handleError(error);
}
```
