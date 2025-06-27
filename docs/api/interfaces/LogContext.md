[**Terroir Core Design System v0.1.0**](../README.md)

---

[Terroir Core Design System](../globals.md) / LogContext

# Interface: LogContext

Defined in: [utils/types/logger.types.ts:59](https://github.com/terroir-ds/core/blob/9691713b8c512b7d2abe808c4f7084bdfab798bf/lib/utils/types/logger.types.ts#L59)

Context object for structured logging.

Allows arbitrary key-value pairs for log enrichment. Common fields include
userId, requestId, sessionId, but any serializable data can be included.
The logger will automatically merge this context with async local storage
context for request tracing.

## Example

```typescript
const context: LogContext = {
  userId: 123,
  requestId: 'req-456',
  action: 'purchase',
  amount: 99.99,
  items: ['item-1', 'item-2'],
};
```

## Indexable

\[`key`: `string`\]: `unknown`
