# Test Mocks

This directory contains shared mock implementations for use across all tests.

## Available Mocks

### Config Mocks (`config.mock.ts`)

Mock the environment configuration module:

```typescript
import { mockConfigDevelopment, mockConfigProduction, createConfigMock } from '@test/__mocks__/config.mock.js';

// Use predefined environments
mockConfigDevelopment(); // Sets NODE_ENV=development, LOG_LEVEL=debug
mockConfigProduction();  // Sets NODE_ENV=production, LOG_LEVEL=info

// Or create custom config
vi.doMock('@lib/config/index.js', () => createConfigMock({
  NODE_ENV: 'test',
  LOG_LEVEL: 'warn',
  CI: true
}));
```

### Logger Mocks (`logger.mock.ts`)

Mock the logger module:

```typescript
import { mockLoggerModule, createMockLogger, createTestLogStream } from '@test/__mocks__/logger.mock.js';

// Mock entire logger module
mockLoggerModule();

// Or create a custom mock logger
const mockLogger = createMockLogger();

// Capture log output for testing
const { output, stream } = createTestLogStream();
const testLogger = pino({}, stream);
// Access captured logs in output array
```

## Usage Examples

### Testing a Module that Uses Config

```typescript
import { describe, it, expect, vi } from 'vitest';
import { mockConfigProduction } from '@test/__mocks__/config.mock.js';

describe('MyModule', () => {
  it('should behave differently in production', async () => {
    vi.resetModules();
    mockConfigProduction();
    
    const { myFunction } = await import('./my-module.js');
    expect(myFunction()).toBe('production-behavior');
  });
});
```

### Testing a Module that Uses Logger

```typescript
import { describe, it, expect, vi } from 'vitest';
import { mockLoggerModule } from '@test/__mocks__/logger.mock.js';

describe('MyService', () => {
  it('should log operations', async () => {
    vi.resetModules();
    mockLoggerModule();
    
    const { logger } = await import('@utils/logger.js');
    const { myService } = await import('./my-service.js');
    
    myService.doSomething();
    
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ operation: 'something' }),
      'Did something'
    );
  });
});
```

## Best Practices

1. **Always reset modules** before applying mocks:
   ```typescript
   vi.resetModules();
   mockConfigDevelopment();
   ```

2. **Import modules after mocking** to ensure mocks are applied:
   ```typescript
   mockLoggerModule();
   const { myModule } = await import('./my-module.js');
   ```

3. **Use createTestLogStream** for testing actual log output:
   ```typescript
   const { output, stream } = createTestLogStream();
   // ... use stream with logger
   expect(output[0]).toMatchObject({ level: 30, msg: 'test' });
   ```

4. **Combine mocks** when testing complex scenarios:
   ```typescript
   mockConfigProduction();
   mockLoggerModule();
   ```