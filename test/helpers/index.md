# Test Helpers

Shared test utilities and helpers for the Terroir Core Design System test suite.

## Overview

This directory contains reusable test utilities that make writing tests easier, more consistent, and less repetitive. The helpers are organized by functionality and can be imported individually or through the main index.

## Available Helpers

### Async Test Utils (`async-test-utils.ts`)

Utilities for testing asynchronous operations:

- **`useFakeTimers()`** - Setup fake timers with automatic cleanup
- **`waitForNextTick()`** - Wait for promises to settle
- **`advanceAndSettle(ms)`** - Advance timers and settle promises
- **`createAbortedController(reason?)`** - Create pre-aborted controllers
- **`trackPromiseState(promise)`** - Track promise resolution state
- **`mockSequentialResults(results)`** - Create mocks with sequential results
- **`assertPending(promise, timeout?)`** - Assert promise is still pending
- **`createControllableOperation()`** - Manually control async operations

### Timing Helpers (`timing-helpers.ts`)

Utilities for testing time-sensitive operations:

- **`createConcurrencyTracker()`** - Track concurrent operation execution
- **`mockDateNow(initialTime?)`** - Mock Date.now with time control
- **`measureExecutionTiming(operation)`** - Measure async operation timing
- **`createRateLimiter(max, burst?)`** - Test rate limiting behavior
- **`simulateWork(durationMs)`** - Simulate CPU-intensive work
- **`createBatchTimingTracker()`** - Track batch processing performance

### Event Helpers (`event-helpers.ts`)

Utilities for testing event-based APIs:

- **`createMockEventTarget()`** - Full-featured mock EventTarget
- **`spyOnEventListeners(target)`** - Spy on event listener methods
- **`waitForEvent(target, type, timeout?)`** - Wait for specific events
- **`createTrackedAbortController()`** - AbortController with tracking
- **`assertEventListenersCleanedUp()`** - Verify proper cleanup

### Error Handling (`error-handling.ts`)

Utilities for testing expected errors and promise rejections without unhandled rejection warnings:

- **`expectRejection(promise, expectedError?)`** - Clean promise rejection testing
- **`verifyRejection(promise, expectations)`** - Detailed error verification
- **`captureExpectedError(fn)`** - Capture and examine thrown errors
- **`expectErrors()`** - Suppress unhandled rejection warnings
- **`cleanupErrorHandling()`** - Clean up error handlers
- **`suppressConsoleErrors()`** - Mock console errors for expected logs
- **`createDelayedRejection(error, delayMs)`** - Create promises that reject after delay
- **`createDelayedResolution(value, delayMs)`** - Create promises that resolve after delay

## Usage Examples

### Testing Async Operations

```typescript
import { describe, it, expect } from 'vitest';
import { useFakeTimers, advanceAndSettle, createAbortedController } from '@test/helpers';

describe('MyAsyncFunction', () => {
  useFakeTimers(); // Automatically sets up/tears down fake timers

  it('should handle timeout', async () => {
    const promise = myAsyncFunction({ timeout: 1000 });

    // Advance time and settle promises
    await advanceAndSettle(1000);

    await expect(promise).rejects.toThrow('Timeout');
  });

  it('should handle cancellation', async () => {
    const controller = createAbortedController('User cancelled');

    await expect(myAsyncFunction({ signal: controller.signal })).rejects.toThrow('User cancelled');
  });
});
```

### Testing Concurrency

```typescript
import { createConcurrencyTracker } from '@test/helpers';

it('should limit concurrent operations', async () => {
  const tracker = createConcurrencyTracker();

  const operations = Array.from({ length: 10 }, (_, i) => tracker.track(() => processItem(i)));

  await Promise.all(operations);

  expect(tracker.getMaxConcurrent()).toBeLessThanOrEqual(5);
});
```

### Testing Event Handling

```typescript
import { createMockEventTarget, waitForEvent } from '@test/helpers';

it('should emit events', async () => {
  const target = createMockEventTarget();
  const handler = vi.fn();

  target.addEventListener('custom', handler);

  // Dispatch and wait for async handlers
  await target.dispatchAndWait(new CustomEvent('custom', { detail: 'test' }));

  expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'custom', detail: 'test' }));
});
```

### Testing Expected Errors

```typescript
import { expectRejection, verifyRejection, captureExpectedError } from '@test/helpers';

it('should handle promise rejections cleanly', async () => {
  // Instead of: await expect(promise).rejects.toThrow('error');
  await expectRejection(functionThatShouldReject(), 'Expected error message');
});

it('should verify detailed error properties', async () => {
  const controller = new AbortController();
  controller.abort();

  await verifyRejection(operationWithAbortSignal({ signal: controller.signal }), {
    message: 'Operation aborted',
    name: 'AbortError',
    customCheck: (error) => error instanceof DOMException,
  });
});

it('should capture and examine errors', async () => {
  const error = await captureExpectedError(async () => {
    await functionThatThrows();
  });

  expect(error.message).toBe('Expected error');
  expect(error.cause).toBeDefined();
});
```

### Testing with Controlled Timing

```typescript
import { mockDateNow, createControllableOperation } from '@test/helpers';

it('should handle rate limiting', async () => {
  const time = mockDateNow(0);
  const { operation, resolve } = createControllableOperation<string>();

  const promise = rateLimitedFunction(operation);

  // Advance time
  time.advance(1000);

  // Resolve the operation
  resolve('success');

  expect(await promise).toBe('success');

  time.restore();
});
```

## Best Practices

### 1. Use Helper Functions Over Direct Mocking

```typescript
// ✅ Good - use helper
const controller = createAbortedController();

// ❌ Avoid - manual setup
const controller = new AbortController();
controller.abort();
```

### 2. Leverage Automatic Cleanup

```text
// ✅ Good - automatic cleanup
describe('MyTests', () => {
  useFakeTimers(); // Handles setup/teardown

  it('test 1', async () => { /* ... */ });
  it('test 2', async () => { /* ... */ });
});

// ❌ Avoid - manual cleanup
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.restoreAllMocks());
```

### 3. Track Async State Properly

```typescript
// ✅ Good - track state
const state = trackPromiseState(promise);
await advanceAndSettle(100);
expect(state.isPending()).toBe(true);

// ❌ Avoid - race conditions
let resolved = false;
promise.then(() => {
  resolved = true;
});
// May have race conditions
```

### 4. Use Type-Safe Helpers

```typescript
// ✅ Good - type safe
const results = mockSequentialResults<string>([
  { type: 'resolve', value: 'first' },
  { type: 'reject', error: new Error('failed') },
]);

// ❌ Avoid - loose typing
const fn = vi.fn();
fn.mockResolvedValueOnce('first');
fn.mockRejectedValueOnce(new Error('failed'));
```

## Adding New Helpers

When adding new test helpers:

1. **Check for existing patterns** - Avoid duplication
2. **Make them composable** - Small, focused functions
3. **Provide TypeScript types** - Full type safety
4. **Include JSDoc comments** - Document parameters and usage
5. **Add examples** - Show common use cases
6. **Consider cleanup** - Automatic cleanup where possible

Example structure:

````typescript
/**
 * Brief description of what the helper does
 * @param param1 - Description of parameter
 * @returns Description of return value
 * @example
 * ```typescript
 * const result = myHelper('value');
 * expect(result).toBe('expected');
 * ```
 */
export function myHelper(param1: string): string {
  // Implementation
}
````

## Performance Considerations

1. **Fake timers** - Always use fake timers for time-dependent tests
2. **Async settling** - Use `waitForNextTick()` instead of arbitrary delays
3. **Resource cleanup** - Ensure event listeners and timers are cleaned up
4. **Mock restoration** - Let helpers handle mock restoration

## Common Patterns

### Setup/Teardown Pattern

```yaml
describe('Feature', () => {
  useFakeTimers();

  let tracker: ReturnType<typeof createConcurrencyTracker>;

  beforeEach(() => {
    tracker = createConcurrencyTracker();
  });

  // Tests use tracker
});
```

### Assertion Helpers Pattern

```typescript
async function assertEventuallyTrue(
  condition: () => boolean,
  timeout: number = 1000
): Promise<void> {
  const start = Date.now();

  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('Condition not met within timeout');
    }
    await waitForNextTick();
  }
}
```

### State Machine Testing

```typescript
const states = {
  initial: 'idle',
  current: 'idle',
  transitions: [] as string[],

  transition(to: string) {
    this.transitions.push(`${this.current} -> ${to}`);
    this.current = to;
  },
};
```

## Debugging Tests

When tests using these helpers fail:

1. **Check timer advancement** - Ensure timers are advanced sufficiently
2. **Verify promise settling** - Use `waitForNextTick()` after state changes
3. **Inspect event listeners** - Use spy helpers to track registration
4. **Log timing information** - Use timing trackers to understand execution
5. **Check cleanup order** - Ensure cleanup happens in correct order

## Migration Guide

When migrating existing tests to use these helpers:

```typescript
// Before
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
});

it('test', async () => {
  const controller = new AbortController();
  controller.abort();
  // ...
});

// After
describe('Feature', () => {
  useFakeTimers();

  it('test', async () => {
    const controller = createAbortedController();
    // ...
  });
});
```

## Future Additions

Planned helper additions:

- Mock file system operations
- Mock network requests
- Visual regression helpers
- Accessibility testing utilities
- Performance benchmarking tools
