# Script Error Handling Pattern

## Context

When building Node.js scripts, especially those that manipulate files and run in test environments, you often encounter expected errors that should be handled gracefully rather than crashing the process.

Common scenarios:

- `ENOENT` errors when directories are cleaned up during tests
- Worker thread exits in test runners like Vitest
- Maximum listener warnings when running many concurrent operations

## Problem

Scripts need robust error handling that:

1. Doesn't depend on application packages (to avoid circular dependencies)
2. Can distinguish between expected and unexpected errors
3. Behaves differently in test vs production environments
4. Is simple to implement and maintain

## Solution

Create a lightweight error handler module specifically for scripts that:

- Sets up process-level error handlers
- Identifies and suppresses expected errors in test environments
- Logs unexpected errors appropriately
- Can be easily cleaned up after tests

## Implementation

### 1. Error Handler Module

```javascript
// scripts/utils/helpers/error-handler.js

export function setupScriptErrorHandlers(options = {}) {
  const { suppressExpected = false, exitOnError = true } = options;

  process.on('uncaughtException', (error) => {
    if (suppressExpected && isExpectedTestError(error)) {
      return;
    }
    console.error('Uncaught Exception:', error);
    if (exitOnError && process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  });

  process.on('unhandledRejection', (reason, promise) => {
    if (suppressExpected && isExpectedTestError(reason)) {
      return;
    }
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    if (exitOnError && process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  });
}

function isExpectedTestError(error) {
  if (!error) return false;

  // ENOENT errors are common when cleaning up temp directories
  if (error.code === 'ENOENT' && error.syscall === 'uv_cwd') {
    return true;
  }

  // Worker thread exits in vitest
  if (error.message && error.message.includes('worker thread exited')) {
    return true;
  }

  return false;
}

export function cleanupErrorHandlers() {
  process.removeAllListeners('uncaughtException');
  process.removeAllListeners('unhandledRejection');
  process.removeAllListeners('warning');
}
```

### 2. Test Setup

```javascript
// __tests__/setup.js
import { setupScriptErrorHandlers, cleanupErrorHandlers } from '../helpers/error-handler.js';

beforeAll(() => {
  setupScriptErrorHandlers({
    suppressExpected: true,
    exitOnError: false,
  });
});

afterAll(() => {
  cleanupErrorHandlers();
});
```

### 3. Production Script Usage

```javascript
#!/usr/bin/env node
import { setupScriptErrorHandlers } from './helpers/error-handler.js';

// Set up error handling for production
setupScriptErrorHandlers({
  suppressExpected: false,
  exitOnError: true,
});

// Script logic here
async function main() {
  // ...
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
```

## Benefits

1. **No Dependencies**: Scripts remain independent of application packages
2. **Test-Friendly**: Expected errors don't fail tests
3. **Production-Safe**: Unexpected errors still exit with proper codes
4. **Maintainable**: Centralized list of expected errors
5. **Flexible**: Can be configured per environment

## Considerations

1. **Error Classification**: Keep the `isExpectedTestError` function updated as new expected errors are discovered
2. **Logging**: In production, consider integrating with proper logging infrastructure
3. **Cleanup**: Always clean up handlers in tests to avoid interference
4. **Process Exit**: Be careful about exit behavior in different environments

## When to Use

- Building standalone scripts that run in CI/CD
- Creating utilities that manipulate files
- Writing scripts that spawn child processes
- Any script that needs to handle both test and production environments

## When NOT to Use

- Inside application code (use proper error handling utilities)
- For complex error recovery scenarios (use try/catch with specific handling)
- When you need error metrics or monitoring (use application-level error handling)

## Related Patterns

- Application Error Handling (see `@utils/errors`)
- Graceful Shutdown Patterns
- Test Environment Setup
