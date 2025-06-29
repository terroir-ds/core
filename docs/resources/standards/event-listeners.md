# Event Listener Management Standards

## Overview

Node.js has a default limit of 10 event listeners per event to prevent memory leaks. When this limit is exceeded, you'll see:

```text
MaxListenersExceededWarning: Possible EventEmitter memory leak detected
```

This document outlines our standards for managing event listeners to avoid this warning and prevent actual memory leaks.

## When This Happens

Common scenarios where this warning appears:

1. **Test Environments** - Running many tests in parallel
2. **Logger Instances** - Multiple modules creating loggers
3. **Async Utilities** - AbortSignal and Promise handlers
4. **Process Event Handlers** - Global error/warning handlers

## Solutions

### 1. Test Environments

For test setup files, increase the limit globally:

```typescript
// In test/setup.ts or vitest.setup.ts
const originalMaxListeners = process.getMaxListeners();
process.setMaxListeners(100);

// In afterAll cleanup
process.setMaxListeners(originalMaxListeners);
```

### 2. Using Shared Utilities

We provide utilities in `@utils/shared/event-listeners`:

```typescript
import { 
  increaseMaxListeners, 
  withMaxListeners,
  suppressMaxListenersWarning,
  configureTestMaxListeners 
} from '@utils/shared/event-listeners';

// Increase by 50
const cleanup = increaseMaxListeners(process, 50);
// ... do work
cleanup();

// Set to specific value
const restore = withMaxListeners(process, 100);
// ... do work
restore();

// For async operations
const result = await suppressMaxListenersWarning(async () => {
  // Operation that creates many listeners
  return await complexOperation();
});

// In test setup
const cleanup = configureTestMaxListeners();
```

### 3. Best Practices

#### Always Clean Up Listeners

```text
// ❌ Bad - no cleanup
process.on('exit', handler);

// ✅ Good - with cleanup
process.on('exit', handler);
return () => process.off('exit', handler);
```

#### Use `once` for One-Time Events

```text
// ❌ Bad - permanent listener for one-time event
emitter.on('ready', handler);

// ✅ Good - automatically removed after first call
emitter.once('ready', handler);
```

#### Use WeakMap/WeakSet for Tracking

```typescript
// ❌ Bad - can cause memory leaks
const listeners = new Map<object, Function>();

// ✅ Good - allows garbage collection
const listeners = new WeakMap<object, Function>();
```

#### Return Cleanup Functions

```typescript
// ✅ Good pattern
export function watchSomething(handler: Function): () => void {
  process.on('SIGINT', handler);
  process.on('SIGTERM', handler);
  
  return () => {
    process.off('SIGINT', handler);
    process.off('SIGTERM', handler);
  };
}
```

## Module-Specific Guidelines

### Logger Module

Already implements test environment detection:

```text
if (isTest()) {
  process.setMaxListeners(50);
}
```

### Async Utilities

Use `{ once: true }` and cleanup patterns:

```typescript
const controller = new AbortController();
controller.signal.addEventListener('abort', handler, { once: true });
```

### Error Handlers

Track and clean up global handlers:

```typescript
const originalHandlers = process.listeners('uncaughtException');
// ... add handlers
// ... in cleanup
process.removeAllListeners('uncaughtException');
originalHandlers.forEach(h => process.on('uncaughtException', h));
```

## Testing Considerations

1. **Always use test setup** - Configure max listeners in setup files
2. **Clean up in afterEach/afterAll** - Restore original values
3. **Use test helpers** - Leverage `@test/helpers/event-helpers`
4. **Monitor in CI** - Watch for warnings in test output

## When to Investigate Further

Increase the limit temporarily, but investigate if:

1. The warning appears in **production** code
2. The number keeps growing over time
3. Memory usage increases significantly
4. The same warning appears repeatedly

These may indicate actual memory leaks that need fixing.

## Quick Reference

```typescript
// In any module that might create many listeners
import { isTestEnvironment } from '@utils/shared/event-listeners';

if (isTestEnvironment()) {
  process.setMaxListeners(process.getMaxListeners() + 50);
}

// Or use the utility
import { configureTestMaxListeners } from '@utils/shared/event-listeners';
const cleanup = configureTestMaxListeners();
// ... in cleanup
cleanup();
```

## Related Standards

- [Error Handling](./error-handling.md) - Global error listeners
- [Testing Standards](./testing.md) - Test environment setup
- [Async Patterns](./async-patterns.md) - Promise and signal handling
