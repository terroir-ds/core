# Script Error Handling Pattern

## Quick Context

Build robust Node.js scripts that handle expected errors gracefully in test environments while maintaining proper error reporting in production. Essential for file manipulation scripts and CI/CD tools.

**When to use**: Standalone scripts, file manipulation utilities, test environment scripts, any script that runs in both test and production contexts.

## Implementation

### Error Handler Module

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
  
  // ENOENT from cleaned up directories
  if (error.code === 'ENOENT' && error.syscall === 'uv_cwd') {
    return true;
  }
  
  // Vitest worker thread exits
  if (error.message?.includes('worker thread exited')) {
    return true;
  }
  
  return false;
}
```

### Test Setup

```javascript
// __tests__/setup.js
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

### Production Usage

```javascript
#!/usr/bin/env node
import { setupScriptErrorHandlers } from './helpers/error-handler.js';

setupScriptErrorHandlers({
  suppressExpected: false,
  exitOnError: true,
});

async function main() {
  // Script logic
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
```

## Anti-Pattern

```javascript
// ❌ No error handling
async function script() {
  await fs.readFile('missing.txt');  // Crashes in test
}

// ❌ Suppressing all errors
process.on('uncaughtException', () => {});  // Hides real issues

// ❌ Application dependencies in scripts
import { logger } from '@core/logger';  // Circular dependency
```

## Best Practice

1. **Zero dependencies**: Scripts remain independent of app packages
2. **Environment aware**: Different behavior for test vs production
3. **Expected errors**: Maintain list of known test errors
4. **Proper cleanup**: Remove handlers after tests
5. **Exit codes**: Return proper codes for CI/CD integration

## Task References

- Script error handling implementation for manage-agent-tasks.js
- Test environment setup for file manipulation utilities

---
*Pattern stability: High | Last validated: 2025-07-01*