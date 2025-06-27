# Async Utilities

A comprehensive collection of async utilities for the Terroir Core Design System, providing robust async operations with proper cancellation and error handling.

## Overview

This module provides a set of utilities to handle common async patterns:

- **Timeout Management**: Add timeouts to any promise
- **Delay Operations**: Promise-based delays with cancellation
- **Signal Handling**: Combine and manage AbortSignals
- **Batch Processing**: Process items with concurrency control
- **Promise Utilities**: Advanced promise patterns

## Installation

```typescript
import { withTimeout, delay, combineSignals, processBatch, retry } from '@terroir/core/lib/utils/async';
```bash
## API Reference

### Timeout Utilities

#### `withTimeout<T>(promise, ms, options?)`

Add a timeout to any promise.

```typescript
const result = await withTimeout(
  fetch('/api/data'),
  5000,
  { message: 'Request timed out' }
);
```bash
**Options:**

- `signal?: AbortSignal` - Cancel the operation
- `message?: string | ((ms: number) => string)` - Custom error message
- `errorClass?: new (message: string) => Error` - Custom error class

#### `timeout(ms, options?)`

Create a promise that rejects after specified time.

```typescript
await Promise.race([
  doWork(),
  timeout(5000, { message: 'Operation timed out' })
]);
```bash
#### `raceWithTimeout<T>(promises, ms, options?)`

Race multiple promises with a timeout.

```typescript
const result = await raceWithTimeout(
  [fetchPrimary(), fetchBackup()],
  3000,
  { fallback: cachedData }
);
```bash
### Delay Utilities

#### `delay(ms, options?)`

Promise-based delay with cancellation support.

```typescript
await delay(1000); // Wait 1 second

// With cancellation
const controller = new AbortController();
await delay(5000, { signal: controller.signal });
```bash
**Options:**

- `signal?: AbortSignal` - Cancel the delay
- `unref?: boolean` - Allow process to exit during delay

#### `delayValue<T>(value, ms, options?)`

Delay with value passthrough.

```typescript
const result = await delayValue('data', 1000);
console.log(result); // 'data' (after 1 second)
```bash
#### `randomDelay(min, max, options?)`

Random delay within range.

```typescript
await randomDelay(1000, 5000); // Wait 1-5 seconds
```bash
#### `debouncedDelay(ms, options?)`

Debounced delay that resets on each call.

```typescript
const { delay, cancel, flush } = debouncedDelay(500);

// Each call resets the timer
await delay(); // Only resolves 500ms after last call

// Cancel pending delay
cancel();

// Resolve immediately
flush();
```bash
### Signal Utilities

#### `combineSignals(signals)`

Combine multiple abort signals into one. Uses native `AbortSignal.any` when available (Node.js 20+).

```typescript
const combined = combineSignals([
  controller1.signal,
  controller2.signal,
  timeoutSignal(5000)
]);
```bash
#### `timeoutSignal(ms, reason?)`

Create a signal that aborts after timeout.

```typescript
const signal = timeoutSignal(5000);
await fetch('/api/data', { signal });
```bash
#### `eventSignal(target, events)`

Create a signal that aborts when events occur.

```typescript
const signal = eventSignal(window, ['beforeunload', 'offline']);
```bash
#### `isAbortError(error)`

Check if an error was caused by signal abortion.

```typescript
try {
  await fetch('/api/data', { signal });
} catch (error) {
  if (isAbortError(error)) {
    console.log('Operation was cancelled');
  }
}
```bash
#### `manualSignal()`

Create a signal that can be manually aborted.

```typescript
const { signal, abort } = manualSignal();

// Later...
abort('User cancelled');
```bash
### Batch Processing

#### `processBatch<T, R>(items, processor, options?)`

Process items in batches with concurrency control.

```typescript
const results = await processBatch(
  urls,
  async (url) => fetch(url),
  {
    concurrency: 5,
    onProgress: (completed, total) => {
      console.log(`${completed}/${total} processed`);
    }
  }
);
```bash
**Options:**

- `concurrency?: number` - Max parallel operations (default: 5)
- `preserveOrder?: boolean` - Maintain input order (default: true)
- `stopOnError?: boolean` - Stop on first error (default: false)
- `onProgress?: (completed: number, total: number) => void` - Progress callback
- `signal?: AbortSignal` - Cancel the operation

#### `processChunked<T, R>(items, processor, options)`

Process items in chunks.

```typescript
const results = await processChunked(
  largeDataset,
  async (chunk) => processChunk(chunk),
  { chunkSize: 100 }
);
```bash
#### `mapConcurrent<T, R>(items, mapper, concurrency?)`

Map with concurrency limit.

```typescript
const results = await mapConcurrent(
  items,
  async (item) => transform(item),
  10 // Process 10 at a time
);
```bash
#### `processRateLimited<T, R>(items, processor, options?)`

Process with rate limiting.

```typescript
const results = await processRateLimited(
  apiCalls,
  async (call) => makeApiCall(call),
  {
    maxPerSecond: 10,
    burst: 15 // Allow burst of 15
  }
);
```bash
### Promise Utilities

#### `defer<T>()`

Create a deferred promise.

```typescript
const deferred = defer<string>();

// Elsewhere...
deferred.resolve('success');
// or
deferred.reject(new Error('failed'));

const result = await deferred.promise;
```bash
#### `retry<T>(fn, options?)`

Retry a promise-returning function.

```typescript
const data = await retry(
  () => fetch('/api/data').then(r => r.json()),
  {
    attempts: 3,
    delay: (attempt) => Math.pow(2, attempt - 1) * 1000, // Exponential backoff
    shouldRetry: (error) => error.status !== 404
  }
);
```bash
**Options:**

- `attempts?: number` - Max retry attempts (default: 3)
- `delay?: number | ((attempt: number) => number)` - Delay between retries
- `shouldRetry?: (error: unknown, attempt: number) => boolean` - Retry predicate
- `signal?: AbortSignal` - Cancel retries

#### `promiseWithFallback<T>(promise, fallback, timeoutMs?)`

Promise with timeout and fallback.

```typescript
const data = await promiseWithFallback(
  fetchLatestData(),
  getCachedData, // Function or value
  5000 // Optional timeout
);
```bash
#### `allSettledWithTimeout<T>(promises, timeoutMs)`

All promises with individual timeouts.

```typescript
const results = await allSettledWithTimeout(
  [fetch1(), fetch2(), fetch3()],
  3000
);

results.forEach((result, i) => {
  if (result.status === 'fulfilled') {
    console.log(`Request ${i} succeeded:`, result.value);
  } else {
    console.log(`Request ${i} failed:`, result.reason);
  }
});
```bash
#### `firstSuccessful<T>(factories, options?)`

Try promises in sequence until one succeeds.

```typescript
const data = await firstSuccessful([
  () => fetchFromPrimary(),
  () => fetchFromSecondary(),
  () => fetchFromCache()
]);
```bash
## Usage Examples

### Resilient API Calls

```typescript
import { retry, withTimeout, isAbortError } from '@terroir/core/lib/utils/async';

async function fetchWithRetry(url: string, options?: RequestInit) {
  return retry(
    () => withTimeout(
      fetch(url, options).then(r => r.json()),
      5000
    ),
    {
      attempts: 3,
      delay: (attempt) => attempt * 1000,
      shouldRetry: (error) => !isAbortError(error)
    }
  );
}
```bash
### Batch Processing with Progress

```typescript
import { processBatch } from '@terroir/core/lib/utils/async';

async function processFiles(files: File[]) {
  const results = await processBatch(
    files,
    async (file) => {
      const data = await file.arrayBuffer();
      return processFileData(data);
    },
    {
      concurrency: 3,
      onProgress: (completed, total) => {
        updateProgressBar(completed / total * 100);
      }
    }
  );
  
  const successful = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);
  
  console.log(`Processed ${successful.length} files successfully`);
  if (failed.length > 0) {
    console.error(`${failed.length} files failed to process`);
  }
}
```bash
### Coordinated Cancellation

```typescript
import { combineSignals, delay, processBatch } from '@terroir/core/lib/utils/async';

async function processWithTimeout(items: string[], timeout: number) {
  const userController = new AbortController();
  const timeoutSignal = AbortSignal.timeout(timeout);
  
  // Combine user cancellation with timeout
  const signal = combineSignals([
    userController.signal,
    timeoutSignal
  ]);
  
  try {
    const results = await processBatch(
      items,
      async (item) => {
        await delay(100, { signal }); // Respect cancellation
        return process(item);
      },
      { signal, concurrency: 5 }
    );
    
    return results;
  } catch (error) {
    if (isAbortError(error)) {
      console.log('Processing was cancelled or timed out');
    }
    throw error;
  }
}
```bash
### Debounced Search

```typescript
import { debouncedDelay } from '@terroir/core/lib/utils/async';

function createSearch() {
  const { delay, cancel } = debouncedDelay(300);
  
  return async (query: string) => {
    // Cancel any pending search
    cancel();
    
    if (!query) return [];
    
    try {
      // Wait for user to stop typing
      await delay();
      
      // Perform search
      const results = await fetch(`/api/search?q=${query}`);
      return results.json();
    } catch (error) {
      if (isAbortError(error)) {
        // Search was cancelled (user typed again)
        return [];
      }
      throw error;
    }
  };
}
```bash
## Best Practices

1. **Always handle cancellation**: Check for abort errors when operations can be cancelled
2. **Use appropriate concurrency**: Balance between performance and resource usage
3. **Implement proper cleanup**: Ensure timers and listeners are cleaned up
4. **Choose the right utility**: Use `processBatch` for independent items, `processChunked` for related data
5. **Consider fallbacks**: Use `promiseWithFallback` or `firstSuccessful` for resilience

## Node.js Compatibility

All utilities are designed to work with Node.js 18+ and provide fallbacks for newer features:

- `combineSignals`: Uses native `AbortSignal.any` when available (Node.js 20+)
- `timeoutSignal`: Uses native `AbortSignal.timeout` when available (Node.js 18+)
- All utilities handle standard `DOMException` for abort errors

## Testing

The async utilities come with comprehensive tests. When testing code that uses these utilities:

```typescript
import { vi } from 'vitest';

// Use fake timers for delay/timeout tests
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// Advance timers in tests
it('should handle timeout', async () => {
  const promise = withTimeout(neverResolves(), 1000);
  
  vi.advanceTimersByTime(1000);
  
  await expect(promise).rejects.toThrow('Operation timed out');
});
```

## Performance Considerations

- **Timer Management**: All timers are properly cleaned up to prevent memory leaks
- **Signal Handling**: Listeners are removed after use
- **Concurrency Limits**: Default limits prevent resource exhaustion
- **Error Boundaries**: All utilities prevent unhandled promise rejections

## Migration Guide

If you're migrating from custom async utilities:

1. Replace custom timeout logic with `withTimeout`
2. Replace `setTimeout` delays with `delay`
3. Replace custom retry logic with `retry`
4. Replace `Promise.all` with `processBatch` for better control
5. Use `combineSignals` instead of manual signal combination

## Contributing

When adding new async utilities:

1. Follow the existing patterns for options and cancellation
2. Always support `AbortSignal` where applicable
3. Provide both value and error results where appropriate
4. Include comprehensive tests with timing scenarios
5. Document all options and edge cases
