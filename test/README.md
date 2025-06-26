# Test Organization

This project uses **co-located tests** where test files live alongside the source code they test.

## Directory Structure

```bash
lib/
  utils/
    logger.ts                 # Source file
    __tests__/
      logger.test.ts         # Tests for logger.ts
    __mocks__/
      logger.mock.ts         # Mock implementations
  config/
    env.ts                   # Source file
    __tests__/
      env.test.ts           # Tests for env.ts
    __mocks__/
      config.mock.ts        # Mock implementations

test/                        # Shared test infrastructure only
  setup.ts                   # Global test setup
  helpers/                   # Shared test utilities
    index.ts                # Re-exports commonly used mocks
```bash
## Why Co-located Tests?

1. **Proximity**: Tests are right next to the code they test
2. **Discoverability**: Easy to find tests for any module
3. **Maintenance**: Tests move with code during refactoring
4. **Coverage**: Obvious which files lack tests

## Test File Conventions

- Test files: `__tests__/[name].test.ts`
- Mock files: `__mocks__/[name].mock.ts`
- Test data: `__fixtures__/[name].json`

## What Goes in `/test`?

Only **shared test infrastructure**:

- Global test setup/teardown
- Test utilities used across multiple modules
- Test configuration
- Performance benchmarks
- Integration test suites

## Importing Mocks

### From within the same module

```typescript
import { createTestLogStream } from '../__mocks__/logger.mock.js';
```bash
### From other modules

```typescript
import { createConfigMock } from '@lib/config/__mocks__/config.mock.js';
```bash
### Using test helpers (for commonly used mocks)

```typescript
import { createConfigMock, createMockLogger } from '@test/helpers';
```bash
## Running Tests

```bash
# Run all tests
pnpm test

# Run tests for a specific module
pnpm test lib/utils/__tests__/logger.test.ts

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```
