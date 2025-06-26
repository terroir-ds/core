# Testing Standards

## Overview

Maintain comprehensive test coverage with co-located tests that are easy to find and maintain.

## Test Organization

### Co-locate Tests with Source

````text
lib/
  utils/
    logger.ts                 # Source file
    __tests__/               # Tests for this module
      logger.test.ts
    __mocks__/               # Mock implementations
      logger.mock.ts
```text
### Never Put Tests in Separate Directory

```text
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
```text
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
```yaml
### Test Coverage

Aim for:
- **Statements**: > 80%
- **Branches**: > 80%
- **Functions**: > 80%
- **Lines**: > 80%

Critical paths should have 100% coverage.

### Mock Creation

```typescript
// In __mocks__/service.mock.ts
export const createMockService = () => ({
  fetchData: vi.fn().mockResolvedValue(testData),
  saveData: vi.fn().mockResolvedValue({ success: true })
});

// In tests
import { createMockService } from '../__mocks__/service.mock';

const mockService = createMockService();
```text
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
```text
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
```text
### Error Testing

```typescript
// Always test error cases
describe('error handling', () => {
  it('should handle network errors', async () => {
    mockApi.fetch.mockRejectedValue(new NetworkError('Timeout'));

    await expect(fetchData()).rejects.toThrow(NetworkError);
    expect(logger.error).toHaveBeenCalled();
  });
});
```typescript
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
````

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
