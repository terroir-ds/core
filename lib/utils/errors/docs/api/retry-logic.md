# Retry Logic API Reference

## Core Retry Functions

### retry()

Execute a function with retry logic and exponential backoff.

```typescript
async function retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
```

**Parameters**:

- `fn`: The async function to retry
- `options`: Retry configuration

**RetryOptions Interface**:

```typescript
interface RetryOptions {
  maxAttempts?: number; // Default: 3
  initialDelay?: number; // Default: 100ms
  maxDelay?: number; // Default: 10000ms
  backoffFactor?: number; // Default: 2
  jitter?: boolean; // Default: true
  timeout?: number; // Default: 30000ms
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  signal?: AbortSignal;
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
  context?: LogContext;
}
```

**Example**:

```typescript
// Basic retry
const data = await retry(() => fetchData());

// With custom options
const result = await retry(
  async () => {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  {
    maxAttempts: 5,
    initialDelay: 500,
    backoffFactor: 1.5,
    timeout: 10000,
    onRetry: (error, attempt, delay) => {
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms`);
    },
  }
);
```

### Delay Calculation

The delay between retries is calculated using exponential backoff:

```typescript
delay = initialDelay * Math.pow(backoffFactor, attempt - 1);
delay = Math.min(delay, maxDelay);

// With jitter (±25%)
if (jitter) {
  const jitterAmount = delay * 0.25;
  delay += (Math.random() * 2 - 1) * jitterAmount;
}
```

**Example delays** (initialDelay=100, backoffFactor=2):

- Attempt 1: 100ms (±25ms with jitter)
- Attempt 2: 200ms (±50ms with jitter)
- Attempt 3: 400ms (±100ms with jitter)
- Attempt 4: 800ms (±200ms with jitter)

## Conditional Retry

### shouldRetry Callback

Control which errors trigger retries.

```typescript
const result = await retry(() => apiCall(), {
  shouldRetry: (error, attempt) => {
    // Don't retry validation errors
    if (error instanceof ValidationError) {
      return false;
    }

    // Retry network errors up to 5 times
    if (error instanceof NetworkError) {
      return attempt <= 5;
    }

    // Retry rate limits after delay
    if (error.statusCode === 429) {
      const retryAfter = error.headers?.['retry-after'];
      if (retryAfter) {
        // Wait for suggested time
        return true;
      }
    }

    // Default: retry server errors
    return error.statusCode >= 500;
  },
});
```

## Timeout Handling

### withTimeout()

Execute a promise with timeout protection.

```typescript
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<T>;
```

**Parameters**:

- `promise`: The promise to execute
- `timeoutMs`: Timeout in milliseconds
- `signal`: Optional abort signal for cancellation

**Example**:

```typescript
// Basic timeout
const result = await withTimeout(
  longRunningOperation(),
  5000 // 5 seconds
);

// With abort signal
const controller = new AbortController();
const result = await withTimeout(fetchData(), 5000, controller.signal);

// Cancel if needed
controller.abort();
```

## Signal Handling

### combineSignals()

Combine multiple abort signals into one.

```typescript
function combineSignals(signals: (AbortSignal | undefined)[]): AbortSignal;
```

**Parameters**:

- `signals`: Array of signals to combine (undefined values are filtered)

**Returns**: A signal that aborts when any input signal aborts

**Example**:

```typescript
// User cancellation + timeout
const userController = new AbortController();
const timeoutController = new AbortController();

setTimeout(() => timeoutController.abort(), 5000);

const combinedSignal = combineSignals([userController.signal, timeoutController.signal]);

try {
  const result = await retry(() => fetchData(), { signal: combinedSignal });
} catch (error) {
  if (error.message.includes('cancelled')) {
    console.log('Operation was cancelled or timed out');
  }
}
```

### Cancellation Support

Use AbortSignal for cancellable retries:

```typescript
const controller = new AbortController();

// Start operation
const promise = retry(() => expensiveOperation(), {
  signal: controller.signal,
  maxAttempts: 10,
});

// Cancel after 5 seconds
setTimeout(() => {
  controller.abort(new Error('User cancelled'));
}, 5000);

try {
  await promise;
} catch (error) {
  console.log('Cancelled:', error.message);
}
```

## Batch Operations

### batchRetry()

Process multiple items with retry logic and concurrency control.

```typescript
async function batchRetry<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  options?: RetryOptions & { concurrency?: number }
): Promise<Array<{ item: T; result?: R; error?: Error }>>;
```

**Parameters**:

- `items`: Array of items to process
- `fn`: Function to process each item
- `options`: Retry options plus concurrency

**Returns**: Array of results with success/error for each item

**Example**:

```typescript
const users = [user1, user2, user3, ...];

const results = await batchRetry(
  users,
  async (user) => {
    return await updateUser(user);
  },
  {
    concurrency: 5,      // Process 5 at a time
    maxAttempts: 3,
    initialDelay: 100,
  }
);

// Process results
for (const { item, result, error } of results) {
  if (error) {
    console.error(`Failed to update user ${item.id}:`, error);
  } else {
    console.log(`Updated user ${item.id}`);
  }
}
```

## Function Wrapping

### makeRetryable()

Convert any async function into a retryable version.

```typescript
function makeRetryable<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  defaultOptions?: RetryOptions
): T;
```

**Parameters**:

- `fn`: The async function to wrap
- `defaultOptions`: Default retry options

**Returns**: A new function with retry logic

**Example**:

```typescript
// Original function
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
}

// Make it retryable
const retryableFetchUser = makeRetryable(fetchUser, {
  maxAttempts: 3,
  initialDelay: 500,
});

// Use like normal
const user = await retryableFetchUser('123');

// Can override options per call
const user2 = await retry(() => retryableFetchUser('456'), { maxAttempts: 5 });
```

## Advanced Patterns

### Retry with Backpressure

Handle rate limits intelligently:

```typescript
const result = await retry(() => apiCall(), {
  shouldRetry: (error, attempt) => {
    return error.statusCode === 429; // Only retry rate limits
  },
  onRetry: async (error, attempt, delay) => {
    // Check for Retry-After header
    const retryAfter = error.response?.headers['retry-after'];
    if (retryAfter) {
      const waitTime = parseInt(retryAfter) * 1000;
      console.log(`Rate limited, waiting ${waitTime}ms`);
      await sleep(waitTime);
    }
  },
});
```

### Retry with Different Strategies

Try different approaches on retry:

```typescript
let useBackupServer = false;

const result = await retry(
  async () => {
    const url = useBackupServer ? 'https://backup.api.com/data' : 'https://primary.api.com/data';

    return await fetch(url).then((r) => r.json());
  },
  {
    onRetry: (error, attempt) => {
      // Switch to backup after 2 failures
      if (attempt >= 2) {
        useBackupServer = true;
        console.log('Switching to backup server');
      }
    },
  }
);
```

### Retry with Exponential Backoff and Jitter

Prevent thundering herd with jitter:

```typescript
// Multiple clients retrying simultaneously
const results = await Promise.all(
  clients.map((client) =>
    retry(() => client.connect(), {
      maxAttempts: 5,
      initialDelay: 1000,
      backoffFactor: 2,
      jitter: true, // Important for distributed systems
    })
  )
);
```

## Error Handling in Retry

### Error Wrapping

All retry failures are wrapped in NetworkError:

```typescript
try {
  await retry(() => operation());
} catch (error) {
  // error is NetworkError with original in cause
  console.log(error.message); // "Operation failed after 3 attempt(s)"
  console.log(error.cause); // Original error
  console.log(error.context); // { attempts: 3, duration: 1234 }
}
```

### Logging

Retry operations are automatically logged:

```typescript
// On retry
logger.warn(
  {
    err: error,
    attempt: 2,
    nextDelay: 200,
    maxAttempts: 3,
  },
  'Operation failed, retrying'
);

// On success after retry
logger.info(
  {
    attempt: 2,
    duration: 1234,
  },
  'Operation succeeded after retry'
);

// On final failure
logger.error(
  {
    attempts: 3,
    duration: 5678,
  },
  'Retry failed'
);
```

## Performance Considerations

### Memory Usage

Be careful with large datasets in retry:

```typescript
// ❌ Bad - holds large data in memory during retries
const bigData = await retry(() => fetchLargeDataset());

// ✅ Good - stream data
const stream = await retry(() => fetchDataStream());
await processStream(stream);
```

### Connection Pooling

Reuse connections across retries:

```typescript
const pool = createConnectionPool();

const result = await retry(
  async () => {
    const conn = await pool.acquire();
    try {
      return await conn.query('SELECT * FROM users');
    } finally {
      pool.release(conn);
    }
  },
  {
    shouldRetry: (error) => {
      // Don't retry if pool is exhausted
      return !error.message.includes('No connections available');
    },
  }
);
```

### Resource Cleanup

Ensure cleanup happens even with retries:

```typescript
async function withCleanup() {
  let resource;

  try {
    resource = await retry(() => acquireResource());
    return await retry(() => useResource(resource));
  } finally {
    if (resource) {
      await resource.cleanup();
    }
  }
}
```

## Testing Retry Logic

Example test scenarios:

```typescript
import { retry } from '@terroir/core/lib/utils/errors';
import { jest } from '@jest/globals';

describe('retry', () => {
  it('should retry on failure', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValueOnce('Success');

    const result = await retry(fn, {
      maxAttempts: 3,
      initialDelay: 0,
    });

    expect(result).toBe('Success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should respect cancellation', async () => {
    const controller = new AbortController();
    const fn = jest
      .fn()
      .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

    const promise = retry(fn, {
      signal: controller.signal,
      maxAttempts: 5,
    });

    // Cancel after 100ms
    setTimeout(() => controller.abort(), 100);

    await expect(promise).rejects.toThrow('cancelled');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```
