[**Terroir Core Design System v0.1.0**](../README.md)

***

[Terroir Core Design System](../globals.md) / measureTime

# Function: measureTime()

> **measureTime**\<`T`\>(`operation`, `fn`, `context`): `Promise`\<`T`\>

Defined in: [utils/logger/index.ts:640](https://github.com/terroir-ds/core/blob/a3f3cd156fc544ddf3040641fcdb94420bfa9e60/lib/utils/logger/index.ts#L640)

Measure and log execution time

## Type Parameters

### T

`T`

## Parameters

### operation

`string`

### fn

() => `Promise`\<`T`\>

### context

[`LogContext`](../interfaces/LogContext.md) = `{}`

## Returns

`Promise`\<`T`\>
