[**Terroir Core Design System v0.1.0**](../README.md)

***

[Terroir Core Design System](../globals.md) / PerformanceMetrics

# Interface: PerformanceMetrics

Defined in: [utils/types/logger.types.ts:79](https://github.com/terroir-ds/core/blob/0096649176492a6e21b16e854cb30ade347b1bac/packages/core/src/utils/types/logger.types.ts#L79)

Performance metrics for operation tracking.

Standard structure for logging performance data. Used by the logger's
timer utilities to automatically track operation durations.

## Example

```typescript
const timer = logger.startTimer();
await expensiveOperation();
timer.done({ operation: 'dataProcessing' }, 'Processing complete');
// Logs with: { perf: { operation: 'dataProcessing', duration: 1234, durationUnit: 'ms' } }
```

## Properties

### duration

> **duration**: `number`

Defined in: [utils/types/logger.types.ts:81](https://github.com/terroir-ds/core/blob/0096649176492a6e21b16e854cb30ade347b1bac/packages/core/src/utils/types/logger.types.ts#L81)

***

### durationUnit

> **durationUnit**: `"ms"`

Defined in: [utils/types/logger.types.ts:82](https://github.com/terroir-ds/core/blob/0096649176492a6e21b16e854cb30ade347b1bac/packages/core/src/utils/types/logger.types.ts#L82)

***

### operation

> **operation**: `string`

Defined in: [utils/types/logger.types.ts:80](https://github.com/terroir-ds/core/blob/0096649176492a6e21b16e854cb30ade347b1bac/packages/core/src/utils/types/logger.types.ts#L80)
