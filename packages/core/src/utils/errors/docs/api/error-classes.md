# Error Classes API Reference

## BaseError

The abstract base class for all custom errors in the Terroir Core Design System.

### Constructor

```text
constructor(message: string, options?: ErrorOptions)
```

#### Parameters

- `message` (string): The error message
- `options` (ErrorOptions): Optional configuration object

#### ErrorOptions Interface

```typescript
interface ErrorOptions {
  cause?: Error | unknown; // Original error that caused this error
  context?: ErrorContext; // Structured context data
  severity?: ErrorSeverity; // Error severity level
  category?: ErrorCategory; // Error classification
  retryable?: boolean; // Whether operation can be retried
  statusCode?: number; // HTTP status code
  code?: string; // Machine-readable error code
}
```

### Properties

| Property     | Type             | Description                            |
| ------------ | ---------------- | -------------------------------------- |
| `errorId`    | string           | Unique UUID for this error instance    |
| `timestamp`  | string           | ISO 8601 timestamp when error occurred |
| `severity`   | ErrorSeverity    | Error severity level                   |
| `category`   | ErrorCategory    | Error classification                   |
| `retryable`  | boolean          | Whether the operation can be retried   |
| `statusCode` | number           | HTTP status code (default: 500)        |
| `code`       | string           | Machine-readable error code            |
| `context`    | ErrorContext     | Structured context data                |
| `cause`      | Error \| unknown | Original error (native Error.cause)    |

### Methods

#### getRootCause()

Get the root cause of the error chain.

```text
getRootCause(): Error | unknown
```

**Returns**: The deepest error in the cause chain

**Example**:

```typescript
const rootCause = error.getRootCause();
console.log('Root cause:', rootCause.message);
```

#### getErrorChain()

Get all errors in the cause chain.

```text
getErrorChain(): Array<Error | unknown>
```

**Returns**: Array of all errors from this error to the root cause

**Example**:

```typescript
const chain = error.getErrorChain();
console.log(`Error chain depth: ${chain.length}`);
```

#### hasErrorType()

Check if error chain contains a specific error type.

```text
hasErrorType<T extends Error>(errorClass: new (...args: unknown[]) => T): boolean
```

**Parameters**:

- `errorClass`: The error class constructor to check for

**Returns**: true if any error in the chain is an instance of the given class

**Example**:

```text
if (error.hasErrorType(NetworkError)) {
  console.log('Network error in chain');
}
```

#### toJSON()

Serialize error for logging or storage.

```text
toJSON(): Record<string, unknown>
```

**Returns**: Complete error data including stack trace

**Example**:

```typescript
const errorData = error.toJSON();
await logger.error(errorData);
```

#### toPublicJSON()

Create a safe object for external APIs (no stack traces).

```text
toPublicJSON(): Record<string, unknown>
```

**Returns**: Sanitized error data safe for public consumption

**Example**:

```text
res.status(error.statusCode).json(error.toPublicJSON());
```

#### toLogContext()

Format error for structured logging.

```text
toLogContext(): LogContext
```

**Returns**: Error data formatted for Pino logger

**Example**:

```text
logger.error(error.toLogContext(), error.message);
```

## Built-in Error Classes

### ValidationError

For input validation failures.

```typescript
class ValidationError extends BaseError
```

**Default Properties**:

- `category`: ErrorCategory.VALIDATION
- `severity`: ErrorSeverity.LOW
- `statusCode`: 400
- `code`: 'VALIDATION_ERROR'
- `retryable`: false

**Example**:

```yaml
throw new ValidationError('Invalid email format', {
  code: 'INVALID_EMAIL',
  context: {
    field: 'email',
    value: 'not-an-email',
  },
});
```

### ConfigurationError

For configuration and setup issues.

```typescript
class ConfigurationError extends BaseError
```

**Default Properties**:

- `category`: ErrorCategory.CONFIGURATION
- `severity`: ErrorSeverity.HIGH
- `statusCode`: 500
- `code`: 'CONFIG_ERROR'
- `retryable`: false

**Example**:

```yaml
throw new ConfigurationError('Missing required configuration', {
  code: 'CONFIG_MISSING',
  context: {
    missingKeys: ['API_KEY', 'DATABASE_URL'],
  },
});
```

### NetworkError

For network and connectivity issues.

```typescript
class NetworkError extends BaseError
```

**Default Properties**:

- `category`: ErrorCategory.NETWORK
- `severity`: ErrorSeverity.MEDIUM
- `statusCode`: 503
- `code`: 'NETWORK_ERROR'
- `retryable`: true

**Example**:

```yaml
throw new NetworkError('Connection timeout', {
  code: 'TIMEOUT',
  context: {
    url: 'https://api.example.com',
    timeout: 5000,
  },
});
```

### PermissionError

For authentication and authorization failures.

```typescript
class PermissionError extends BaseError
```

**Default Properties**:

- `category`: ErrorCategory.PERMISSION
- `severity`: ErrorSeverity.MEDIUM
- `statusCode`: 403
- `code`: 'PERMISSION_ERROR'
- `retryable`: false

**Example**:

```yaml
throw new PermissionError('Insufficient permissions', {
  code: 'INSUFFICIENT_PERMISSIONS',
  context: {
    required: ['admin', 'write'],
    actual: ['read'],
  },
});
```

### ResourceError

For missing or unavailable resources.

```typescript
class ResourceError extends BaseError
```

**Default Properties**:

- `category`: ErrorCategory.RESOURCE
- `severity`: ErrorSeverity.MEDIUM
- `statusCode`: 404
- `code`: 'RESOURCE_ERROR'
- `retryable`: false

**Example**:

```yaml
throw new ResourceError('User not found', {
  code: 'USER_NOT_FOUND',
  context: {
    resourceType: 'user',
    resourceId: userId,
  },
});
```

### BusinessLogicError

For domain-specific business rule violations.

```typescript
class BusinessLogicError extends BaseError
```

**Default Properties**:

- `category`: ErrorCategory.BUSINESS_LOGIC
- `severity`: ErrorSeverity.MEDIUM
- `statusCode`: 422
- `code`: 'BUSINESS_ERROR'
- `retryable`: false

**Example**:

```yaml
throw new BusinessLogicError('Insufficient funds', {
  code: 'INSUFFICIENT_FUNDS',
  context: {
    required: 100.0,
    available: 75.5,
    currency: 'USD',
  },
});
```

### IntegrationError

For third-party service integration issues.

```typescript
class IntegrationError extends BaseError
```

**Default Properties**:

- `category`: ErrorCategory.INTEGRATION
- `severity`: ErrorSeverity.HIGH
- `statusCode`: 502
- `code`: 'INTEGRATION_ERROR'
- `retryable`: true

**Example**:

```yaml
throw new IntegrationError('Payment gateway error', {
  code: 'PAYMENT_GATEWAY_ERROR',
  context: {
    service: 'stripe',
    operation: 'charge',
    externalError: stripeError,
  },
});
```

### MultiError

For aggregating multiple errors using native AggregateError.

```typescript
class MultiError extends AggregateError
```

**Additional Properties**:

- `errorId`: Unique identifier
- `timestamp`: When the multi-error was created
- `context`: Aggregated context information

**Methods**:

#### getErrorTypes()

Get all unique error types.

```text
getErrorTypes(): string[]
```

**Example**:

```typescript
const types = multiError.getErrorTypes();
// ['ValidationError', 'NetworkError']
```

#### getErrorsByType()

Get errors of a specific type.

```text
getErrorsByType<T extends Error>(errorClass: new (...args: unknown[]) => T): T[]
```

**Example**:

```typescript
const validationErrors = multiError.getErrorsByType(ValidationError);
```

#### hasErrorType()

Check if contains specific error type.

```text
hasErrorType<T extends Error>(errorClass: new (...args: unknown[]) => T): boolean
```

**Example**:

```text
if (multiError.hasErrorType(NetworkError)) {
  // Contains at least one network error
}
```

## Utility Functions

### isError()

Type guard to check if value is an Error.

```typescript
function isError(value: unknown): value is Error;
```

**Example**:

```text
if (isError(value)) {
  console.log(value.message);
}
```

### isBaseError()

Type guard to check if value is a BaseError.

```typescript
function isBaseError(value: unknown): value is BaseError;
```

**Example**:

```text
if (isBaseError(error)) {
  console.log(error.errorId);
}
```

### isRetryableError()

Check if an error is retryable.

```typescript
function isRetryableError(error: unknown): boolean;
```

**Logic**:

- Returns `true` for BaseError instances with `retryable: true`
- Returns `true` for network-related error codes (ECONNREFUSED, ETIMEDOUT, etc.)
- Returns `false` otherwise

**Example**:

```text
if (isRetryableError(error)) {
  await retry(() => operation());
}
```

### wrapError()

Wrap unknown errors in BaseError.

```typescript
function wrapError(error: unknown, message?: string, options?: ErrorOptions): BaseError;
```

**Parameters**:

- `error`: The error to wrap
- `message`: Optional custom message
- `options`: Additional error options

**Example**:

```yaml
try {
  JSON.parse(invalidJson);
} catch (error) {
  throw wrapError(error, 'Failed to parse configuration', {
    code: 'CONFIG_PARSE_ERROR',
    context: { configFile: 'app.json' },
  });
}
```

### createErrorFromResponse()

Create appropriate error from HTTP response.

```typescript
async function createErrorFromResponse(
  response: Response,
  context?: ErrorContext
): Promise<BaseError>;
```

**Parameters**:

- `response`: Fetch API Response object
- `context`: Additional context to include

**Status Code Mapping**:

- 400 → ValidationError
- 401, 403 → PermissionError
- 404 → ResourceError
- 422 → BusinessLogicError
- 429, 502, 503, 504 → NetworkError
- 500+ → IntegrationError

**Example**:

```typescript
const response = await fetch('/api/users');
if (!response.ok) {
  throw await createErrorFromResponse(response, {
    operation: 'fetchUsers',
  });
}
```

## Type Definitions

### ErrorSeverity

```text
enum ErrorSeverity {
  LOW = 'low', // Info-level logging
  MEDIUM = 'medium', // Warning-level logging
  HIGH = 'high', // Error-level logging
  CRITICAL = 'critical', // Fatal-level logging
}
```

### ErrorCategory

```text
enum ErrorCategory {
  VALIDATION = 'validation',
  CONFIGURATION = 'configuration',
  NETWORK = 'network',
  PERMISSION = 'permission',
  RESOURCE = 'resource',
  BUSINESS_LOGIC = 'business_logic',
  INTEGRATION = 'integration',
  UNKNOWN = 'unknown',
}
```

### ErrorContext

```typescript
interface ErrorContext {
  errorId?: string;
  timestamp?: string;
  requestId?: string;
  userId?: string; // Auto-redacted in logs
  component?: string;
  operation?: string;
  metadata?: Record<string, unknown>;
}
```
