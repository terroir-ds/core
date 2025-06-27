# Error Classes API Reference

## BaseError

The abstract base class for all custom errors in the Terroir Core Design System.

### Constructor

```typescript
constructor(message: string, options?: ErrorOptions)
```typescript
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
```typescript
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

```typescript
getRootCause(): Error | unknown
```typescript
**Returns**: The deepest error in the cause chain

**Example**:

```typescript
const rootCause = error.getRootCause();
console.log('Root cause:', rootCause.message);
```typescript
#### getErrorChain()

Get all errors in the cause chain.

```typescript
getErrorChain(): Array<Error | unknown>
```typescript
**Returns**: Array of all errors from this error to the root cause

**Example**:

```typescript
const chain = error.getErrorChain();
console.log(`Error chain depth: ${chain.length}`);
```typescript
#### hasErrorType()

Check if error chain contains a specific error type.

```typescript
hasErrorType<T extends Error>(errorClass: new (...args: unknown[]) => T): boolean
```typescript
**Parameters**:

- `errorClass`: The error class constructor to check for

**Returns**: true if any error in the chain is an instance of the given class

**Example**:

```typescript
if (error.hasErrorType(NetworkError)) {
  console.log('Network error in chain');
}
```typescript
#### toJSON()

Serialize error for logging or storage.

```typescript
toJSON(): Record<string, unknown>
```typescript
**Returns**: Complete error data including stack trace

**Example**:

```typescript
const errorData = error.toJSON();
await logger.error(errorData);
```typescript
#### toPublicJSON()

Create a safe object for external APIs (no stack traces).

```typescript
toPublicJSON(): Record<string, unknown>
```typescript
**Returns**: Sanitized error data safe for public consumption

**Example**:

```typescript
res.status(error.statusCode).json(error.toPublicJSON());
```typescript
#### toLogContext()

Format error for structured logging.

```typescript
toLogContext(): LogContext
```typescript
**Returns**: Error data formatted for Pino logger

**Example**:

```typescript
logger.error(error.toLogContext(), error.message);
```typescript
## Built-in Error Classes

### ValidationError

For input validation failures.

```typescript
class ValidationError extends BaseError
```typescript
**Default Properties**:

- `category`: ErrorCategory.VALIDATION
- `severity`: ErrorSeverity.LOW
- `statusCode`: 400
- `code`: 'VALIDATION_ERROR'
- `retryable`: false

**Example**:

```typescript
throw new ValidationError('Invalid email format', {
  code: 'INVALID_EMAIL',
  context: {
    field: 'email',
    value: 'not-an-email',
  },
});
```typescript
### ConfigurationError

For configuration and setup issues.

```typescript
class ConfigurationError extends BaseError
```typescript
**Default Properties**:

- `category`: ErrorCategory.CONFIGURATION
- `severity`: ErrorSeverity.HIGH
- `statusCode`: 500
- `code`: 'CONFIG_ERROR'
- `retryable`: false

**Example**:

```typescript
throw new ConfigurationError('Missing required configuration', {
  code: 'CONFIG_MISSING',
  context: {
    missingKeys: ['API_KEY', 'DATABASE_URL'],
  },
});
```typescript
### NetworkError

For network and connectivity issues.

```typescript
class NetworkError extends BaseError
```typescript
**Default Properties**:

- `category`: ErrorCategory.NETWORK
- `severity`: ErrorSeverity.MEDIUM
- `statusCode`: 503
- `code`: 'NETWORK_ERROR'
- `retryable`: true

**Example**:

```typescript
throw new NetworkError('Connection timeout', {
  code: 'TIMEOUT',
  context: {
    url: 'https://api.example.com',
    timeout: 5000,
  },
});
```typescript
### PermissionError

For authentication and authorization failures.

```typescript
class PermissionError extends BaseError
```typescript
**Default Properties**:

- `category`: ErrorCategory.PERMISSION
- `severity`: ErrorSeverity.MEDIUM
- `statusCode`: 403
- `code`: 'PERMISSION_ERROR'
- `retryable`: false

**Example**:

```typescript
throw new PermissionError('Insufficient permissions', {
  code: 'INSUFFICIENT_PERMISSIONS',
  context: {
    required: ['admin', 'write'],
    actual: ['read'],
  },
});
```typescript
### ResourceError

For missing or unavailable resources.

```typescript
class ResourceError extends BaseError
```typescript
**Default Properties**:

- `category`: ErrorCategory.RESOURCE
- `severity`: ErrorSeverity.MEDIUM
- `statusCode`: 404
- `code`: 'RESOURCE_ERROR'
- `retryable`: false

**Example**:

```typescript
throw new ResourceError('User not found', {
  code: 'USER_NOT_FOUND',
  context: {
    resourceType: 'user',
    resourceId: userId,
  },
});
```typescript
### BusinessLogicError

For domain-specific business rule violations.

```typescript
class BusinessLogicError extends BaseError
```typescript
**Default Properties**:

- `category`: ErrorCategory.BUSINESS_LOGIC
- `severity`: ErrorSeverity.MEDIUM
- `statusCode`: 422
- `code`: 'BUSINESS_ERROR'
- `retryable`: false

**Example**:

```typescript
throw new BusinessLogicError('Insufficient funds', {
  code: 'INSUFFICIENT_FUNDS',
  context: {
    required: 100.0,
    available: 75.5,
    currency: 'USD',
  },
});
```typescript
### IntegrationError

For third-party service integration issues.

```typescript
class IntegrationError extends BaseError
```typescript
**Default Properties**:

- `category`: ErrorCategory.INTEGRATION
- `severity`: ErrorSeverity.HIGH
- `statusCode`: 502
- `code`: 'INTEGRATION_ERROR'
- `retryable`: true

**Example**:

```typescript
throw new IntegrationError('Payment gateway error', {
  code: 'PAYMENT_GATEWAY_ERROR',
  context: {
    service: 'stripe',
    operation: 'charge',
    externalError: stripeError,
  },
});
```typescript
### MultiError

For aggregating multiple errors using native AggregateError.

```typescript
class MultiError extends AggregateError
```typescript
**Additional Properties**:

- `errorId`: Unique identifier
- `timestamp`: When the multi-error was created
- `context`: Aggregated context information

**Methods**:

#### getErrorTypes()

Get all unique error types.

```typescript
getErrorTypes(): string[]
```typescript
**Example**:

```typescript
const types = multiError.getErrorTypes();
// ['ValidationError', 'NetworkError']
```typescript
#### getErrorsByType()

Get errors of a specific type.

```typescript
getErrorsByType<T extends Error>(errorClass: new (...args: unknown[]) => T): T[]
```typescript
**Example**:

```typescript
const validationErrors = multiError.getErrorsByType(ValidationError);
```typescript
#### hasErrorType()

Check if contains specific error type.

```typescript
hasErrorType<T extends Error>(errorClass: new (...args: unknown[]) => T): boolean
```typescript
**Example**:

```typescript
if (multiError.hasErrorType(NetworkError)) {
  // Contains at least one network error
}
```typescript
## Utility Functions

### isError()

Type guard to check if value is an Error.

```typescript
function isError(value: unknown): value is Error;
```typescript
**Example**:

```typescript
if (isError(value)) {
  console.log(value.message);
}
```typescript
### isBaseError()

Type guard to check if value is a BaseError.

```typescript
function isBaseError(value: unknown): value is BaseError;
```typescript
**Example**:

```typescript
if (isBaseError(error)) {
  console.log(error.errorId);
}
```typescript
### isRetryableError()

Check if an error is retryable.

```typescript
function isRetryableError(error: unknown): boolean;
```typescript
**Logic**:

- Returns `true` for BaseError instances with `retryable: true`
- Returns `true` for network-related error codes (ECONNREFUSED, ETIMEDOUT, etc.)
- Returns `false` otherwise

**Example**:

```typescript
if (isRetryableError(error)) {
  await retry(() => operation());
}
```typescript
### wrapError()

Wrap unknown errors in BaseError.

```typescript
function wrapError(error: unknown, message?: string, options?: ErrorOptions): BaseError;
```typescript
**Parameters**:

- `error`: The error to wrap
- `message`: Optional custom message
- `options`: Additional error options

**Example**:

```typescript
try {
  JSON.parse(invalidJson);
} catch (error) {
  throw wrapError(error, 'Failed to parse configuration', {
    code: 'CONFIG_PARSE_ERROR',
    context: { configFile: 'app.json' },
  });
}
```typescript
### createErrorFromResponse()

Create appropriate error from HTTP response.

```typescript
async function createErrorFromResponse(
  response: Response,
  context?: ErrorContext
): Promise<BaseError>;
```typescript
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
```typescript
## Type Definitions

### ErrorSeverity

```typescript
enum ErrorSeverity {
  LOW = 'low', // Info-level logging
  MEDIUM = 'medium', // Warning-level logging
  HIGH = 'high', // Error-level logging
  CRITICAL = 'critical', // Fatal-level logging
}
```typescript
### ErrorCategory

```typescript
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
```typescript
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
