# Testing Standards

## Overview

Maintain comprehensive test coverage with co-located tests that are easy to find and maintain.

## Test Organization

### Co-locate Tests with Source

```markdown
lib/
  utils/
    logger.ts                 # Source file
    __tests__/               # Tests for this module
      logger.test.ts
    __mocks__/               # Mock implementations
      logger.mock.ts
```

### Never Put Tests in Separate Directory

```bash
# ❌ DON'T separate tests from source
src/
  utils/
    logger.ts
test/            # Far from source
  utils/
    logger.test.ts

# ✅ DO co-locate tests
lib/
  utils/
    logger.ts
    __tests__/
      logger.test.ts
```

## Writing Tests

### Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('FeatureName', () => {
  // Setup shared across tests
  beforeEach(() => {
    // Reset state
  });

  describe('methodName', () => {
    it('should handle normal case', () => {
      // Arrange
      const input = createTestInput();

      // Act
      const result = methodName(input);

      // Assert
      expect(result).toBe(expected);
    });

    it('should handle error case', () => {
      // Test error scenarios
      expect(() => methodName(null)).toThrow(ValidationError);
    });
  });
});
```

### Test Coverage

Aim for:

- **Statements**: > 80%
- **Branches**: > 80%
- **Functions**: > 80%
- **Lines**: > 80%

Critical paths should have 100% coverage.

### Mock Creation

```bash
// In __mocks__/service.mock.ts
export const createMockService = () => ({
  fetchData: vi.fn().mockResolvedValue(testData),
  saveData: vi.fn().mockResolvedValue({ success: true })
});

// In tests
import { createMockService } from '../__mocks__/service.mock';

const mockService = createMockService();
```

## Test Types

### Unit Tests

```typescript
// Test individual functions/methods
describe('calculateTotal', () => {
  it('should sum prices correctly', () => {
    const items = [{ price: 10 }, { price: 20 }];
    expect(calculateTotal(items)).toBe(30);
  });
});
```

### Integration Tests

```typescript
// Test multiple components together
describe('Order Processing', () => {
  it('should process order end-to-end', async () => {
    const order = createTestOrder();
    const result = await processOrder(order);

    expect(result.status).toBe('completed');
    expect(mockPaymentService.charge).toHaveBeenCalled();
    expect(mockInventory.update).toHaveBeenCalled();
  });
});
```

### Error Testing

```text
// Always test error cases
describe('error handling', () => {
  it('should handle network errors', async () => {
    mockApi.fetch.mockRejectedValue(new NetworkError('Timeout'));

    await expect(fetchData()).rejects.toThrow(NetworkError);
    expect(logger.error).toHaveBeenCalled();
  });
});
```

## Handling Promise Rejections in Tests

The project includes a global unhandled rejection handler that prevents test failures from unhandled promises. This means:

### Automatic Handling

1. **Tests don't fail on unhandled rejections** - They're logged but don't cause test failures
2. **No manual cleanup needed** - The global test setup handles this automatically
3. **Debug mode available** - Set `DEBUG_UNHANDLED_REJECTIONS=true` to see rejection warnings

### Testing Promise Rejections

```typescript
import { expectRejection, verifyRejection } from '@test/helpers/error-handling';

// Simple rejection test
it('should reject with error message', async () => {
  await expectRejection(failingPromise, 'Expected error message');
});

// Detailed rejection verification
it('should reject with specific error details', async () => {
  await verifyRejection(failingPromise, {
    message: /timeout/i,
    name: 'TimeoutError',
    code: 'TIMEOUT_ERROR'
  });
});

// Standard vitest pattern still works
it('should reject on invalid input', async () => {
  await expect(someAsyncFunction('invalid')).rejects.toThrow(ValidationError);
});
```

### Background Operations

For tests that trigger background operations with intentional rejections (e.g., abort scenarios):

```typescript
it('should handle concurrent operations with abort', async () => {
  const controller = new AbortController();

  // Start operations
  const promises = startConcurrentOperations({ signal: controller.signal });

  // Abort will cause background rejections - these are handled automatically
  controller.abort();

  // Test continues without failing
  await expect(promises[0]).rejects.toThrow('Operation aborted');
});
```

No special handling is needed - the global setup manages background rejections.

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the code does, not how

2. **Use Descriptive Test Names**
   - "should return user data when ID is valid"
   - "should throw NotFoundError when user does not exist"

3. **Keep Tests Independent**
   - Each test should run in isolation
   - Use beforeEach/afterEach for setup/teardown

4. **Test Edge Cases**
   - Null/undefined inputs
   - Empty arrays/objects
   - Boundary values
   - Error conditions

5. **Use Test Utilities**

   ```typescript
   // Create helpers for common operations
   export const createTestUser = (overrides = {}) => ({
     id: 'test-id',
     email: 'test@example.com',
     ...overrides
   });

```

## Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch

# Run specific file
pnpm test logger.test.ts
```

## References

- [Vitest Documentation](https://vitest.dev/)
- [Testing Error Scenarios](../../lib/utils/errors/docs/testing-errors.md)
