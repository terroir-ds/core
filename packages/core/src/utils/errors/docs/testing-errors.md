# Testing Error Scenarios

This guide covers best practices and patterns for testing error handling in the Terroir Core Design System.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Testing Error Classes](#testing-error-classes)
- [Testing Error Handlers](#testing-error-handlers)
- [Testing Retry Logic](#testing-retry-logic)
- [Testing Circuit Breakers](#testing-circuit-breakers)
- [Integration Testing](#integration-testing)
- [Test Utilities](#test-utilities)
- [Common Patterns](#common-patterns)

## Testing Philosophy

### Global Error Handling

The project includes global unhandled rejection handling both in production (via `setupGlobalErrorHandlers()`) and in tests (via the test setup). This means:

1. **Tests don't fail on unhandled rejections** - They're logged but don't cause test failures
2. **No manual cleanup needed** - The global test setup handles this automatically
3. **Focus on testing behavior** - Use assertion helpers for expected errors
4. **Debug mode available** - Set `DEBUG_UNHANDLED_REJECTIONS=true` to see rejection warnings

### Principles

1. **Test the behavior, not the implementation**
2. **Cover both success and failure paths**
3. **Test error propagation and context**
4. **Verify recovery mechanisms**
5. **Ensure proper cleanup**

### What to Test

- Error creation with correct properties
- Error chaining and cause preservation
- Context propagation
- Retry behavior and backoff
- Circuit breaker state transitions
- Error handler invocation
- Recovery strategy execution
- Resource cleanup on failure

### Assertion Helpers

For testing expected promise rejections, use these helpers:

`````typescript
import { expectRejection, verifyRejection } from '@test/helpers/error-handling';

// Simple assertion
await expectRejection(promise, 'Expected error message');

// Detailed verification
await verifyRejection(promise, {
  message: /pattern/,
  code: 'ERROR_CODE',
  name: 'ValidationError',
});
```text
These helpers automatically handle the promise rejection without triggering warnings.

## Testing Error Classes

### Basic Error Creation

````typescript
import { ValidationError, ErrorSeverity, ErrorCategory } from '@terroir/core/lib/utils/errors';

describe('ValidationError', () => {
  it('should create error with default properties', () => {
    const error = new ValidationError('Invalid input');

    expect(error.message).toBe('Invalid input');
    expect(error.name).toBe('ValidationError');
    expect(error.severity).toBe(ErrorSeverity.LOW);
    expect(error.category).toBe(ErrorCategory.VALIDATION);
    expect(error.statusCode).toBe(400);
    expect(error.retryable).toBe(false);
    expect(error.errorId).toMatch(/^[0-9a-f-]{36}$/); // UUID
  });

  it('should accept custom options', () => {
    const cause = new Error('Original error');
    const error = new ValidationError('Validation failed', {
      cause,
      code: 'CUSTOM_CODE',
      context: {
        field: 'email',
        value: 'invalid',
      },
    });

    expect(error.cause).toBe(cause);
    expect(error.code).toBe('CUSTOM_CODE');
    expect(error.context.field).toBe('email');
    expect(error.context.value).toBe('invalid');
  });
});
```text
### Error Chaining

```typescript
describe('Error Chaining', () => {
  it('should preserve error chain', () => {
    const rootCause = new Error('Database connection failed');
    const middleError = new NetworkError('Query failed', { cause: rootCause });
    const topError = new BusinessLogicError('User creation failed', { cause: middleError });

    expect(topError.getRootCause()).toBe(rootCause);
    expect(topError.getErrorChain()).toEqual([topError, middleError, rootCause]);
    expect(topError.hasErrorType(NetworkError)).toBe(true);
    expect(topError.hasErrorType(ValidationError)).toBe(false);
  });
});
```text
### Error Serialization

```typescript
describe('Error Serialization', () => {
  it('should serialize to JSON', () => {
    const error = new ValidationError('Test error', {
      code: 'TEST_ERROR',
      context: { foo: 'bar' },
    });

    const json = error.toJSON();
    expect(json).toMatchObject({
      name: 'ValidationError',
      message: 'Test error',
      code: 'TEST_ERROR',
      errorId: expect.any(String),
      timestamp: expect.any(String),
      severity: 'low',
      category: 'validation',
      retryable: false,
      statusCode: 400,
      context: expect.objectContaining({ foo: 'bar' }),
    });
  });

  it('should create safe public JSON', () => {
    const error = new ValidationError('Internal details');
    const publicJson = error.toPublicJSON();

    expect(publicJson).not.toHaveProperty('stack');
    expect(publicJson).not.toHaveProperty('cause');
    expect(publicJson).toHaveProperty('errorId');
    expect(publicJson).toHaveProperty('message');
  });
});
```text
## Testing Error Handlers

### Handler Registration

```typescript
import {
  registerErrorHandler,
  unregisterErrorHandler,
  handleError,
} from '@terroir/core/lib/utils/errors';

describe('Error Handlers', () => {
  const mockHandler = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    unregisterErrorHandler('test-handler');
  });

  it('should call registered handlers', async () => {
    registerErrorHandler('test-handler', mockHandler);

    const error = new Error('Test error');
    await handleError(error, { test: true });

    expect(mockHandler).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test error' }),
      expect.objectContaining({ test: true })
    );
  });

  it('should handle multiple handlers', async () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    registerErrorHandler('handler1', handler1);
    registerErrorHandler('handler2', handler2);

    await handleError(new Error('Test'));

    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();

    unregisterErrorHandler('handler1');
    unregisterErrorHandler('handler2');
  });
});
```text
### Recovery Strategies

```typescript
import { registerRecoveryStrategy, tryRecover } from '@terroir/core/lib/utils/errors';

describe('Recovery Strategies', () => {
  it('should execute recovery strategy', async () => {
    const mockData = { recovered: true };
    registerRecoveryStrategy('TEST_ERROR', async () => mockData);

    const error = new BaseError('Test', { code: 'TEST_ERROR' });
    const result = await tryRecover(error);

    expect(result).toEqual(mockData);
  });

  it('should return default value on recovery failure', async () => {
    registerRecoveryStrategy('FAILING_RECOVERY', async () => {
      throw new Error('Recovery failed');
    });

    const error = new BaseError('Test', { code: 'FAILING_RECOVERY' });
    const result = await tryRecover(error, 'default');

    expect(result).toBe('default');
  });
});
```text
### Error Boundaries

```typescript
import { errorBoundary } from '@terroir/core/lib/utils/errors';

describe('Error Boundary', () => {
  it('should catch and handle errors', async () => {
    const onError = jest.fn();
    const fallback = { default: true };

    const result = await errorBoundary(
      async () => {
        throw new Error('Operation failed');
      },
      {
        fallback,
        onError,
      }
    );

    expect(result).toEqual(fallback);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Operation failed' }));
  });

  it('should use fallback function', async () => {
    const result = await errorBoundary(
      async () => {
        throw new Error('Failed');
      },
      {
        fallback: async () => {
          return { computed: true };
        },
      }
    );

    expect(result).toEqual({ computed: true });
  });
});
```text
## Testing Retry Logic

### Basic Retry

```typescript
import { retry } from '@terroir/core/lib/utils/errors';

describe('Retry Logic', () => {
  it('should retry on failure', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValueOnce('Success');

    const result = await retry(fn, {
      maxAttempts: 3,
      initialDelay: 0, // No delay for tests
    });

    expect(result).toBe('Success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should fail after max attempts', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Always fails'));

    await expect(retry(fn, { maxAttempts: 2, initialDelay: 0 })).rejects.toThrow(
      'Operation failed after 2 attempt(s)'
    );

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
```text
### Conditional Retry

```typescript
describe('Conditional Retry', () => {
  it('should respect shouldRetry callback', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new ValidationError('Invalid'))
      .mockRejectedValueOnce(new NetworkError('Timeout'))
      .mockResolvedValueOnce('Success');

    const result = await retry(fn, {
      maxAttempts: 3,
      initialDelay: 0,
      shouldRetry: (error) => !(error instanceof ValidationError),
    });

    // Should fail immediately on ValidationError
    await expect(result).rejects.toThrow('Invalid');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```text
### Cancellation

```typescript
describe('Retry Cancellation', () => {
  it('should respect abort signal', async () => {
    const controller = new AbortController();
    const fn = jest
      .fn()
      .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    const promise = retry(fn, {
      signal: controller.signal,
      maxAttempts: 5,
      initialDelay: 50,
    });

    // Cancel after first attempt
    setTimeout(() => controller.abort(), 25);

    await expect(promise).rejects.toThrow(/cancelled/);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```text
### Timing and Delays

```typescript
describe('Retry Timing', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should use exponential backoff', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'))
      .mockResolvedValueOnce('Success');

    const promise = retry(fn, {
      maxAttempts: 3,
      initialDelay: 100,
      backoffFactor: 2,
      jitter: false, // Disable jitter for predictable timing
    });

    // First attempt - immediate
    expect(fn).toHaveBeenCalledTimes(1);

    // Second attempt - after 100ms
    jest.advanceTimersByTime(100);
    await Promise.resolve(); // Let microtasks run
    expect(fn).toHaveBeenCalledTimes(2);

    // Third attempt - after 200ms more
    jest.advanceTimersByTime(200);
    await Promise.resolve();
    expect(fn).toHaveBeenCalledTimes(3);

    const result = await promise;
    expect(result).toBe('Success');
  });
});
```text
## Testing Circuit Breakers

### State Transitions

```typescript
import { CircuitBreaker } from '@terroir/core/lib/utils/errors';

describe('Circuit Breaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      cooldownPeriod: 100,
      timeWindow: 1000,
    });
  });

  it('should open after threshold failures', async () => {
    const failingFn = jest.fn().mockRejectedValue(new Error('Fail'));

    // Fail 3 times to open circuit
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(failingFn)).rejects.toThrow('Fail');
    }

    expect(breaker.getState()).toBe('open');

    // Next call should fail immediately
    await expect(breaker.execute(failingFn)).rejects.toThrow('Circuit breaker is open');
    expect(failingFn).toHaveBeenCalledTimes(3); // Not called again
  });

  it('should transition to half-open after cooldown', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Fail'))
      .mockRejectedValueOnce(new Error('Fail'))
      .mockRejectedValueOnce(new Error('Fail'))
      .mockResolvedValue('Success');

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(fn)).rejects.toThrow();
    }

    // Wait for cooldown
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Should allow one request (half-open)
    const result = await breaker.execute(fn);
    expect(result).toBe('Success');
    expect(breaker.getState()).toBe('half-open');
  });
});
```text
### Time Window Testing

```typescript
describe('Circuit Breaker Time Window', () => {
  it('should forget old failures', async () => {
    const breaker = new CircuitBreaker({
      failureThreshold: 3,
      timeWindow: 100, // 100ms window
    });

    const failingFn = jest.fn().mockRejectedValue(new Error('Fail'));

    // Two failures
    await expect(breaker.execute(failingFn)).rejects.toThrow();
    await expect(breaker.execute(failingFn)).rejects.toThrow();

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Old failures should be forgotten
    await expect(breaker.execute(failingFn)).rejects.toThrow();
    expect(breaker.getState()).toBe('closed'); // Still closed
  });
});
```text
## Integration Testing

### Full Error Flow

```typescript
describe('Error Flow Integration', () => {
  it('should handle complete error flow', async () => {
    const mockLogger = jest.spyOn(logger, 'error');
    const mockMetrics = jest.fn();

    // Register handlers
    registerErrorHandler('metrics', mockMetrics);
    registerRecoveryStrategy('NETWORK_ERROR', async () => {
      return { cached: true };
    });

    // Create circuit breaker
    const breaker = new CircuitBreaker({
      failureThreshold: 2,
      name: 'TestService',
    });

    // Simulate failures
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new NetworkError('Timeout'))
      .mockRejectedValueOnce(new NetworkError('Timeout'))
      .mockResolvedValueOnce({ fresh: true });

    // First call - retry and recover
    const result1 = await errorBoundary(
      () =>
        retryWithCircuitBreaker(operation, breaker, {
          maxAttempts: 2,
          initialDelay: 0,
        }),
      {
        onError: handleError,
      }
    );

    expect(result1).toEqual({ cached: true }); // Recovered
    expect(mockMetrics).toHaveBeenCalled();
    expect(mockLogger).toHaveBeenCalled();

    // Cleanup
    unregisterErrorHandler('metrics');
  });
});
```text
## Test Utilities

### Error Test Helpers

Create a test utilities file at `lib/utils/errors/__tests__/test-utils.ts`:

```typescript
import { BaseError, ErrorOptions } from '../base-error.js';

/**
 * Create a test error with predictable properties
 */
export function createTestError(
  message: string = 'Test error',
  options: Partial<ErrorOptions> = {}
): BaseError {
  return new (class TestError extends BaseError {
    constructor() {
      super(message, {
        code: 'TEST_ERROR',
        ...options,
      });
    }
  })();
}

/**
 * Create a failing function for testing
 */
export function createFailingFunction<T = unknown>(
  failures: number,
  successValue?: T
): jest.Mock<Promise<T>> {
  const fn = jest.fn();

  for (let i = 0; i < failures; i++) {
    fn.mockRejectedValueOnce(new Error(`Failure ${i + 1}`));
  }

  if (successValue !== undefined) {
    fn.mockResolvedValueOnce(successValue);
  }

  return fn;
}

/**
 * Wait for condition with timeout
 */
export async function waitFor(
  condition: () => boolean,
  timeout: number = 1000,
  interval: number = 10
): Promise<void> {
  const start = Date.now();

  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Mock timer helpers
 */
export const mockTimers = {
  setup() {
    jest.useFakeTimers();
  },

  cleanup() {
    jest.useRealTimers();
  },

  async advance(ms: number) {
    jest.advanceTimersByTime(ms);
    // Allow microtasks to run
    await Promise.resolve();
  },

  async runAll() {
    jest.runAllTimers();
    await Promise.resolve();
  },
};
```text
### Using Test Utilities

```typescript
import { createTestError, createFailingFunction, mockTimers } from './test-utils';

describe('Using Test Utilities', () => {
  beforeEach(() => mockTimers.setup());
  afterEach(() => mockTimers.cleanup());

  it('should test with utilities', async () => {
    const error = createTestError('Custom message', {
      code: 'CUSTOM_CODE',
      retryable: true,
    });

    expect(error.message).toBe('Custom message');
    expect(error.code).toBe('CUSTOM_CODE');
    expect(error.retryable).toBe(true);

    const fn = createFailingFunction(2, 'success');

    const result = await retry(fn, {
      maxAttempts: 3,
      initialDelay: 100,
    });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
```text
## Common Patterns

### Testing Error Context

```typescript
it('should preserve context through error chain', () => {
  const context = {
    userId: '123',
    operation: 'createOrder',
    orderId: '456',
  };

  const dbError = new NetworkError('Connection lost', { context });
  const serviceError = new IntegrationError('Order creation failed', {
    cause: dbError,
    context: { ...context, service: 'OrderService' },
  });

  expect(serviceError.context).toMatchObject({
    userId: '123',
    operation: 'createOrder',
    orderId: '456',
    service: 'OrderService',
  });
});
```text
### Testing Async Error Flows

```typescript
it('should handle async error propagation', async () => {
  async function innerOperation() {
    throw new ValidationError('Invalid data');
  }

  async function middleOperation() {
    try {
      return await innerOperation();
    } catch (error) {
      throw new BusinessLogicError('Operation failed', { cause: error });
    }
  }

  async function outerOperation() {
    return await errorBoundary(middleOperation, {
      fallback: { default: true },
    });
  }

  const result = await outerOperation();
  expect(result).toEqual({ default: true });
});
```text
### Testing Cleanup on Error

```typescript
it('should cleanup resources on error', async () => {
  const cleanup = jest.fn();

  class Resource {
    async use() {
      throw new Error('Usage failed');
    }

    async cleanup() {
      cleanup();
    }
  }

  const resource = new Resource();

  try {
    await resource.use();
  } catch (error) {
    // Handle error
  } finally {
    await resource.cleanup();
  }

  expect(cleanup).toHaveBeenCalled();
});
```text
### Testing Error Metrics

```typescript
it('should track error metrics', async () => {
  const metrics = {
    errors: new Map<string, number>(),

    increment(errorType: string) {
      const count = this.errors.get(errorType) || 0;
      this.errors.set(errorType, count + 1);
    },
  };

  registerErrorHandler('metrics', async (error) => {
    metrics.increment(error.name);
  });

  await handleError(new ValidationError('Test'));
  await handleError(new NetworkError('Test'));
  await handleError(new ValidationError('Test'));

  expect(metrics.errors.get('ValidationError')).toBe(2);
  expect(metrics.errors.get('NetworkError')).toBe(1);

  unregisterErrorHandler('metrics');
});
`````

## Best Practices

1. **Always clean up test state**
   - Unregister handlers
   - Reset mocks
   - Clear timers

2. **Test edge cases**
   - Empty error messages
   - Null/undefined causes
   - Circular references

3. **Use realistic timing**
   - Test with actual delays when needed
   - Use fake timers for predictable tests

4. **Test error boundaries**
   - Ensure errors don't leak
   - Verify cleanup happens
   - Check fallback behavior

5. **Mock external dependencies**
   - Logger
   - Metrics
   - Network calls

6. **Test concurrency**
   - Multiple errors simultaneously
   - Race conditions
   - Resource contention
