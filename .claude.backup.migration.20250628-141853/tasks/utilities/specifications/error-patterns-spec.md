# Standardized Error Patterns Specification

## Overview

This specification defines standardized error types, patterns, and handling strategies for the Terroir Core Design System. It ensures consistent error handling across all packages and utilities.

## Goals

1. **Consistency**: Uniform error handling across the codebase
2. **Debuggability**: Rich context for troubleshooting
3. **Type Safety**: Full TypeScript support for error handling
4. **User Experience**: Clear, actionable error messages
5. **Observability**: Integration with logging and monitoring

## Error Hierarchy

### Base Error Classes

```typescript
// Base error class for all Terroir errors
export abstract class TerroirError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode?: number;
  
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
  
  toJSON(): ErrorJson {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      stack: this.stack,
      cause: this.cause instanceof Error ? {
        name: this.cause.name,
        message: this.cause.message
      } : this.cause
    };
  }
}
```

### Standard Error Types

#### 1. Validation Error
```typescript
export class ValidationError extends TerroirError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
  
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message, { ...context, field, value });
  }
}

// Usage
throw new ValidationError(
  'Invalid color format',
  'primaryColor',
  '#xyz',
  { expected: 'hex color' }
);
```

#### 2. Configuration Error
```typescript
export class ConfigurationError extends TerroirError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly statusCode = 500;
  
  constructor(
    message: string,
    public readonly configKey?: string,
    context?: Record<string, unknown>
  ) {
    super(message, { ...context, configKey });
  }
}
```

#### 3. Network Error
```typescript
export class NetworkError extends TerroirError {
  readonly code = 'NETWORK_ERROR';
  readonly statusCode?: number;
  
  constructor(
    message: string,
    public readonly url?: string,
    public readonly method?: string,
    statusCode?: number,
    context?: Record<string, unknown>
  ) {
    super(message, { ...context, url, method });
    this.statusCode = statusCode;
  }
}
```

#### 4. Timeout Error
```typescript
export class TimeoutError extends TerroirError {
  readonly code = 'TIMEOUT_ERROR';
  readonly statusCode = 408;
  
  constructor(
    message: string,
    public readonly timeout: number,
    public readonly operation?: string,
    context?: Record<string, unknown>
  ) {
    super(message, { ...context, timeout, operation });
  }
}
```

#### 5. Resource Error
```typescript
export class ResourceError extends TerroirError {
  readonly code = 'RESOURCE_ERROR';
  readonly statusCode = 404;
  
  constructor(
    message: string,
    public readonly resource: string,
    public readonly identifier?: string,
    context?: Record<string, unknown>
  ) {
    super(message, { ...context, resource, identifier });
  }
}
```

#### 6. Permission Error
```typescript
export class PermissionError extends TerroirError {
  readonly code = 'PERMISSION_ERROR';
  readonly statusCode = 403;
  
  constructor(
    message: string,
    public readonly action?: string,
    public readonly resource?: string,
    context?: Record<string, unknown>
  ) {
    super(message, { ...context, action, resource });
  }
}
```

## Error Codes

### Code Format
```
[CATEGORY]_[SPECIFIC_ERROR]
```

### Standard Categories
- `VALIDATION` - Input validation failures
- `CONFIGURATION` - Config/setup issues
- `NETWORK` - Network/API failures
- `RESOURCE` - Resource not found/unavailable
- `PERMISSION` - Authorization failures
- `OPERATION` - Operation failures
- `INTERNAL` - Internal system errors

### Example Codes
```typescript
export const ErrorCodes = {
  // Validation
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_OUT_OF_RANGE: 'VALIDATION_OUT_OF_RANGE',
  
  // Configuration
  CONFIGURATION_MISSING_KEY: 'CONFIGURATION_MISSING_KEY',
  CONFIGURATION_INVALID_VALUE: 'CONFIGURATION_INVALID_VALUE',
  
  // Network
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_CONNECTION_FAILED: 'NETWORK_CONNECTION_FAILED',
  
  // Resource
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  
  // Permission
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  PERMISSION_INSUFFICIENT: 'PERMISSION_INSUFFICIENT',
} as const;
```

## Error Handling Patterns

### 1. Try-Catch with Context
```typescript
export async function loadConfig(path: string): Promise<Config> {
  try {
    const content = await fs.readFile(path, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ConfigurationError(
        'Invalid JSON in configuration file',
        path,
        { cause: error }
      );
    }
    
    if (isNodeError(error) && error.code === 'ENOENT') {
      throw new ResourceError(
        'Configuration file not found',
        'config',
        path,
        { cause: error }
      );
    }
    
    throw new ConfigurationError(
      'Failed to load configuration',
      path,
      { cause: error }
    );
  }
}
```

### 2. Error Wrapping
```typescript
export function wrapError(
  error: unknown,
  message: string,
  context?: Record<string, unknown>
): TerroirError {
  if (error instanceof TerroirError) {
    return error;
  }
  
  return new OperationError(message, context, error);
}

// Usage
try {
  await riskyOperation();
} catch (error) {
  throw wrapError(error, 'Operation failed', { operation: 'risky' });
}
```

### 3. Error Recovery
```typescript
export async function withFallback<T>(
  operation: () => Promise<T>,
  fallback: (error: TerroirError) => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const terroirError = error instanceof TerroirError 
      ? error 
      : wrapError(error, 'Operation failed');
      
    logger.warn({
      message: 'Operation failed, attempting fallback',
      error: terroirError.toJSON()
    });
    
    return fallback(terroirError);
  }
}
```

### 4. Error Aggregation
```typescript
export class AggregateError extends TerroirError {
  readonly code = 'AGGREGATE_ERROR';
  
  constructor(
    message: string,
    public readonly errors: TerroirError[],
    context?: Record<string, unknown>
  ) {
    super(message, {
      ...context,
      errorCount: errors.length,
      errorCodes: errors.map(e => e.code)
    });
  }
}

// Usage
const errors: TerroirError[] = [];

for (const item of items) {
  try {
    await processItem(item);
  } catch (error) {
    errors.push(wrapError(error, `Failed to process ${item.id}`));
  }
}

if (errors.length > 0) {
  throw new AggregateError(
    `Failed to process ${errors.length} items`,
    errors
  );
}
```

## Error Context

### Required Context
Every error should include:
- `timestamp` - When the error occurred
- `correlationId` - For tracing across services
- `environment` - dev/staging/production
- `version` - Application version

### Context Enrichment
```typescript
export function enrichError(
  error: TerroirError,
  additionalContext: Record<string, unknown>
): TerroirError {
  error.context = {
    ...error.context,
    ...additionalContext,
    timestamp: new Date().toISOString(),
    correlationId: getCorrelationId(),
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION
  };
  
  return error;
}
```

## Integration with Logger

### Automatic Logging
```typescript
export function createErrorHandler(logger: Logger) {
  return (error: unknown): void => {
    const terroirError = error instanceof TerroirError
      ? error
      : wrapError(error, 'Unhandled error');
    
    const logLevel = getLogLevel(terroirError);
    
    logger[logLevel]({
      message: terroirError.message,
      error: terroirError.toJSON(),
      stack: terroirError.stack
    });
  };
}

function getLogLevel(error: TerroirError): LogLevel {
  if (error.code.startsWith('VALIDATION_')) return 'warn';
  if (error.code.startsWith('PERMISSION_')) return 'warn';
  if (error.statusCode && error.statusCode >= 500) return 'error';
  return 'error';
}
```

## User-Facing Error Messages

### Message Format
```typescript
interface UserErrorMessage {
  title: string;
  description: string;
  action?: string;
  helpUrl?: string;
}

export function toUserMessage(error: TerroirError): UserErrorMessage {
  const messages: Record<string, UserErrorMessage> = {
    VALIDATION_INVALID_FORMAT: {
      title: 'Invalid Format',
      description: 'The provided value doesn\'t match the expected format.',
      action: 'Please check your input and try again.',
      helpUrl: '/docs/errors/validation'
    },
    NETWORK_TIMEOUT: {
      title: 'Request Timeout',
      description: 'The operation took too long to complete.',
      action: 'Please try again. If the problem persists, contact support.'
    }
    // ... more mappings
  };
  
  return messages[error.code] || {
    title: 'An Error Occurred',
    description: error.message,
    action: 'Please try again or contact support.'
  };
}
```

## Testing Error Handling

### Error Testing Utilities
```typescript
export function expectError(
  fn: () => unknown,
  expectedError: Partial<TerroirError>
): void {
  try {
    fn();
    throw new Error('Expected function to throw');
  } catch (error) {
    if (!(error instanceof TerroirError)) {
      throw new Error(`Expected TerroirError, got ${error}`);
    }
    
    if (expectedError.code && error.code !== expectedError.code) {
      throw new Error(`Expected code ${expectedError.code}, got ${error.code}`);
    }
    
    if (expectedError.message && !error.message.includes(expectedError.message)) {
      throw new Error(`Expected message to include "${expectedError.message}"`);
    }
  }
}

// Usage in tests
it('should throw validation error for invalid input', () => {
  expectError(
    () => validateColor('xyz'),
    { code: 'VALIDATION_INVALID_FORMAT', message: 'Invalid color' }
  );
});
```

## Migration Guide

### From Generic Errors
```typescript
// Before
throw new Error('Invalid configuration');

// After
throw new ConfigurationError('Invalid configuration', 'apiKey');
```

### From Custom Errors
```typescript
// Before
class MyCustomError extends Error {
  constructor(message: string) {
    super(message);
  }
}

// After
class MyCustomError extends TerroirError {
  readonly code = 'MY_CUSTOM_ERROR';
  
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}
```

## Best Practices

### 1. Be Specific
```typescript
// ❌ Bad
throw new Error('Operation failed');

// ✅ Good
throw new NetworkError(
  'Failed to fetch user data',
  '/api/users/123',
  'GET',
  response.status
);
```

### 2. Include Context
```typescript
// ❌ Bad
throw new ValidationError('Invalid value');

// ✅ Good
throw new ValidationError(
  'Color value must be a valid hex code',
  'primaryColor',
  providedValue,
  { expected: '#RRGGBB', received: providedValue }
);
```

### 3. Handle Errors Early
```typescript
// ❌ Bad - generic catch-all
try {
  // many operations
} catch (error) {
  console.error(error);
}

// ✅ Good - specific handling
try {
  const data = await fetchData();
  const validated = validateData(data);
  return processData(validated);
} catch (error) {
  if (error instanceof NetworkError) {
    return handleNetworkError(error);
  }
  if (error instanceof ValidationError) {
    return handleValidationError(error);
  }
  throw error;
}
```

## Implementation Checklist

- [ ] Create base TerroirError class
- [ ] Implement standard error types
- [ ] Define error code constants
- [ ] Create error handling utilities
- [ ] Add logger integration
- [ ] Create user message mappings
- [ ] Write testing utilities
- [ ] Update existing error handling
- [ ] Add documentation
- [ ] Create migration guide

## References

- [Error Handling Best Practices](https://www.joyent.com/node-js/production/design/errors)
- [TypeScript Error Handling](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- [Node.js Error Conventions](https://nodejs.org/api/errors.html)