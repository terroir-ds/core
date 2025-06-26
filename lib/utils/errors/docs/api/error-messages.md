# Error Messages API Reference

## Overview

The error messages system provides centralized, consistent error messaging with built-in support for internationalization (i18n).

## Core Functions

### getMessage()

Get a formatted error message by key.

```typescript
function getMessage(key: keyof typeof ERROR_MESSAGES, ...args: any[]): string;
```typescript
**Parameters**:

- `key`: The message key from ERROR_MESSAGES
- `args`: Variable arguments for message formatting

**Returns**: Formatted error message string

**Example**:

```typescript
// Simple message
const msg1 = getMessage('OPERATION_CANCELLED');
// "Operation cancelled"

// Message with parameters
const msg2 = getMessage('OPERATION_FAILED', 3);
// "Operation failed after 3 attempt(s)"

// Multiple parameters
const msg3 = getMessage('VALIDATION_RANGE', 'age', 18, 65);
// "age must be between 18 and 65"
```typescript
## Message Templates

### ERROR_MESSAGES Object

All available error message templates:

#### Retry/Network Messages

```typescript
OPERATION_FAILED: (attempts: number) => string;
// "Operation failed after {attempts} attempt(s)"

OPERATION_CANCELLED: string;
// "Operation cancelled"

OPERATION_TIMEOUT: (ms: number) => string;
// "Operation timed out after {ms}ms"

CIRCUIT_OPEN: string;
// "Circuit breaker is open"
```typescript
#### Validation Messages

```typescript
VALIDATION_REQUIRED: (field: string) => string;
// "{field} is required"

VALIDATION_INVALID: (field: string, value?: unknown) => string;
// "{field} has invalid value: {value}" or "{field} is invalid"

VALIDATION_TYPE: (field: string, expected: string, actual: string) => string;
// "{field} must be {expected}, got {actual}"

VALIDATION_RANGE: (field: string, min?: number, max?: number) => string;
// "{field} must be between {min} and {max}"
// "{field} must be at least {min}"
// "{field} must be at most {max}"
```typescript
#### Configuration Messages

```typescript
CONFIG_MISSING: (key: string) => string;
// "Configuration key '{key}' is missing"

CONFIG_INVALID: (key: string, reason?: string) => string;
// "Configuration key '{key}' is invalid: {reason}"

CONFIG_ENV_MISSING: (env: string) => string;
// "Environment variable '{env}' is not set"

CONFIG_FILE_NOT_FOUND: (path: string) => string;
// "Configuration file not found: {path}"
```typescript
#### Permission Messages

```typescript
PERMISSION_DENIED: string;
// "Permission denied"

PERMISSION_INSUFFICIENT: (required: string) => string;
// "Insufficient permissions. Required: {required}"

AUTH_REQUIRED: string;
// "Authentication required"

AUTH_INVALID: string;
// "Invalid authentication credentials"

AUTH_EXPIRED: string;
// "Authentication token has expired"
```typescript
#### Resource Messages

```typescript
RESOURCE_NOT_FOUND: (type: string, id?: string) => string;
// "{type} not found: {id}" or "{type} not found"

RESOURCE_CONFLICT: (type: string, id?: string) => string;
// "{type} already exists: {id}" or "{type} already exists"

RESOURCE_LOCKED: (type: string, id?: string) => string;
// "{type} is locked: {id}" or "{type} is locked"

RESOURCE_UNAVAILABLE: (type: string) => string;
// "{type} is temporarily unavailable"
```typescript
#### Network/Integration Messages

```typescript
NETWORK_CONNECTION_FAILED: string;
// "Network connection failed"

NETWORK_TIMEOUT: string;
// "Network request timed out"

SERVICE_UNAVAILABLE: (service: string) => string;
// "Service '{service}' is unavailable"

SERVICE_ERROR: (service: string, error?: string) => string;
// "Service '{service}' error: {error}" or "Service '{service}' error"

API_RATE_LIMITED: string;
// "API rate limit exceeded"
```typescript
#### Business Logic Messages

```typescript
BUSINESS_RULE_VIOLATED: (rule: string) => string;
// "Business rule violated: {rule}"

WORKFLOW_INVALID_STATE: (current: string, attempted: string) => string;
// "Cannot transition from '{current}' to '{attempted}'"

DATA_INCONSISTENT: (details?: string) => string;
// "Data inconsistency detected: {details}" or "Data inconsistency detected"
```typescript
#### File/IO Messages

```typescript
FILE_NOT_FOUND: (path: string) => string;
// "File not found: {path}"

FILE_ACCESS_DENIED: (path: string) => string;
// "Access denied to file: {path}"

FILE_TOO_LARGE: (path: string, maxSize?: string) => string;
// "File too large: {path} (max: {maxSize})" or "File too large: {path}"

DIRECTORY_NOT_FOUND: (path: string) => string;
// "Directory not found: {path}"

DISK_FULL: string;
// "Insufficient disk space"
```typescript
#### HTTP Messages

```typescript
HTTP_BAD_REQUEST: string;
// "Bad request"

HTTP_UNAUTHORIZED: string;
// "Unauthorized"

HTTP_FORBIDDEN: string;
// "Forbidden"

HTTP_NOT_FOUND: string;
// "Not found"

HTTP_METHOD_NOT_ALLOWED: (method: string) => string;
// "Method '{method}' not allowed"

HTTP_TOO_MANY_REQUESTS: string;
// "Too many requests"

HTTP_INTERNAL_SERVER_ERROR: string;
// "Internal server error"

HTTP_SERVICE_UNAVAILABLE: string;
// "Service unavailable"

HTTP_GATEWAY_TIMEOUT: string;
// "Gateway timeout"
```typescript
## Message Categories

### ERROR_MESSAGE_CATEGORIES

Grouping of related message keys:

```typescript
const ERROR_MESSAGE_CATEGORIES = {
  RETRY: [
    'OPERATION_FAILED',
    'OPERATION_CANCELLED',
    'OPERATION_TIMEOUT',
    'CIRCUIT_OPEN',
    // ...
  ],
  VALIDATION: ['VALIDATION_REQUIRED', 'VALIDATION_INVALID', 'VALIDATION_TYPE', 'VALIDATION_RANGE'],
  CONFIGURATION: [
    'CONFIG_MISSING',
    'CONFIG_INVALID',
    'CONFIG_ENV_MISSING',
    // ...
  ],
  // ... more categories
};
```typescript
**Usage**:

```typescript
// Get all validation message keys
const validationKeys = ERROR_MESSAGE_CATEGORIES.VALIDATION;

// Check if a key is validation-related
const isValidationError = ERROR_MESSAGE_CATEGORIES.VALIDATION.includes(errorKey);

// Iterate over a category
for (const key of ERROR_MESSAGE_CATEGORIES.NETWORK) {
  console.log(`Network error: ${key}`);
}
```typescript
## Type Definitions

### ErrorMessageKey

Type-safe message keys:

```typescript
type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
```typescript
**Usage**:

```typescript
function logError(key: ErrorMessageKey, ...args: any[]) {
  const message = getMessage(key, ...args);
  logger.error({ messageKey: key }, message);
}

// Type-safe usage
logError('VALIDATION_REQUIRED', 'email'); // ✅
logError('INVALID_KEY', 'email'); // ❌ Type error
```typescript
## Internationalization

### I18nErrorMessages Interface

Structure for localized messages:

```typescript
interface I18nErrorMessages {
  locale: string;
  messages: typeof ERROR_MESSAGES;
}
```typescript
### createLocalizedMessages()

Create locale-specific message sets:

```typescript
function createLocalizedMessages(locale: string = 'en'): I18nErrorMessages;
```typescript
**Parameters**:

- `locale`: Language/locale code (default: 'en')

**Returns**: I18nErrorMessages object

**Example**:

```typescript
// Currently returns English messages
const enMessages = createLocalizedMessages('en');

// Future implementation could load locale-specific files
const esMessages = createLocalizedMessages('es');
// Would load from './locales/es/errors.json'
```typescript
### Future i18n Implementation

```typescript
// Example of future localized messages
const spanishMessages = {
  VALIDATION_REQUIRED: (field: string) => `${field} es requerido`,
  VALIDATION_INVALID: (field: string) => `${field} es inválido`,
  // ... more translations
};

// Usage with i18n
const i18n = new I18nManager();
i18n.addMessages('es', spanishMessages);

function getLocalizedMessage(key: ErrorMessageKey, locale: string, ...args: any[]) {
  const messages = i18n.getMessages(locale);
  return messages[key](...args);
}
```typescript
## Validation

### validateMessages()

Test that all message templates are valid:

```typescript
function validateMessages(): boolean;
```typescript
**Returns**: true if all messages are valid, false otherwise

**Example**:

```typescript
// Run in tests to ensure message integrity
describe('Error Messages', () => {
  it('should have valid message templates', () => {
    expect(validateMessages()).toBe(true);
  });
});
```typescript
## Usage Patterns

### With Error Classes

```typescript
import { ValidationError, getMessage } from '@terroir/core/lib/utils/errors';

// Use centralized messages
throw new ValidationError(getMessage('VALIDATION_REQUIRED', 'email'), {
  code: 'EMAIL_REQUIRED',
  context: { field: 'email' },
});

// Complex validation
if (age < 18 || age > 65) {
  throw new ValidationError(getMessage('VALIDATION_RANGE', 'age', 18, 65), {
    code: 'AGE_OUT_OF_RANGE',
    context: { field: 'age', value: age },
  });
}
```typescript
### Dynamic Message Building

```typescript
// Build messages based on conditions
function validateConfig(config: Config) {
  const errors: string[] = [];

  if (!config.apiKey) {
    errors.push(getMessage('CONFIG_MISSING', 'apiKey'));
  }

  if (!config.databaseUrl) {
    errors.push(getMessage('CONFIG_MISSING', 'databaseUrl'));
  }

  if (config.port && (config.port < 1 || config.port > 65535)) {
    errors.push(getMessage('VALIDATION_RANGE', 'port', 1, 65535));
  }

  if (errors.length > 0) {
    throw new ConfigurationError(errors.join('; '));
  }
}
```typescript
### HTTP Error Responses

```typescript
// Map HTTP status to messages
function getHttpErrorMessage(status: number, method?: string): string {
  switch (status) {
    case 400:
      return getMessage('HTTP_BAD_REQUEST');
    case 401:
      return getMessage('HTTP_UNAUTHORIZED');
    case 403:
      return getMessage('HTTP_FORBIDDEN');
    case 404:
      return getMessage('HTTP_NOT_FOUND');
    case 405:
      return getMessage('HTTP_METHOD_NOT_ALLOWED', method || 'Unknown');
    case 429:
      return getMessage('HTTP_TOO_MANY_REQUESTS');
    case 500:
      return getMessage('HTTP_INTERNAL_SERVER_ERROR');
    case 503:
      return getMessage('HTTP_SERVICE_UNAVAILABLE');
    case 504:
      return getMessage('HTTP_GATEWAY_TIMEOUT');
    default:
      return `HTTP Error ${status}`;
  }
}
```typescript
### Contextual Messages

```typescript
// Add context to generic messages
class UserService {
  async getUser(id: string): Promise<User> {
    const user = await db.users.findById(id);

    if (!user) {
      throw new ResourceError(getMessage('RESOURCE_NOT_FOUND', 'User', id), {
        code: 'USER_NOT_FOUND',
        context: {
          resourceType: 'user',
          resourceId: id,
          searchCriteria: { id },
        },
      });
    }

    return user;
  }
}
```typescript
### Message Composition

```typescript
// Compose multiple messages
function validateUserInput(input: UserInput) {
  const validationErrors: string[] = [];

  // Required fields
  const requiredFields = ['email', 'password', 'name'];
  for (const field of requiredFields) {
    if (!input[field]) {
      validationErrors.push(getMessage('VALIDATION_REQUIRED', field));
    }
  }

  // Email format
  if (input.email && !isValidEmail(input.email)) {
    validationErrors.push(getMessage('VALIDATION_INVALID', 'email', input.email));
  }

  // Password strength
  if (input.password && input.password.length < 8) {
    validationErrors.push(getMessage('VALIDATION_RANGE', 'password length', 8));
  }

  if (validationErrors.length > 0) {
    throw new ValidationError(validationErrors.join('. '), {
      code: 'VALIDATION_FAILED',
      context: {
        errors: validationErrors,
        fields: Object.keys(input),
      },
    });
  }
}
```typescript
## Testing

### Testing with Messages

```typescript
import { getMessage, ValidationError } from '@terroir/core/lib/utils/errors';

describe('User Validation', () => {
  it('should require email', () => {
    expect(() => validateUser({ name: 'John' })).toThrow(
      getMessage('VALIDATION_REQUIRED', 'email')
    );
  });

  it('should validate email format', () => {
    expect(() => validateUser({ email: 'invalid' })).toThrow(
      getMessage('VALIDATION_INVALID', 'email', 'invalid')
    );
  });

  it('should validate age range', () => {
    expect(() => validateUser({ age: 150 })).toThrow(getMessage('VALIDATION_RANGE', 'age', 0, 120));
  });
});
```typescript
### Mocking Messages

```typescript
// Mock specific messages for testing
jest.mock('@terroir/core/lib/utils/errors/messages', () => ({
  getMessage: jest.fn((key, ...args) => {
    // Return predictable messages for tests
    return `TEST_${key}`;
  }),
  ERROR_MESSAGES: {
    VALIDATION_REQUIRED: () => 'TEST_MESSAGE',
  },
}));
```typescript
## Best Practices

### 1. Use Centralized Messages

```typescript
// ❌ Bad - hardcoded messages
throw new Error('Email is required');

// ✅ Good - centralized messages
throw new ValidationError(getMessage('VALIDATION_REQUIRED', 'email'));
```typescript
### 2. Include Context

```typescript
// ❌ Bad - generic message
throw new Error(getMessage('RESOURCE_NOT_FOUND', 'Resource'));

// ✅ Good - specific context
throw new ResourceError(getMessage('RESOURCE_NOT_FOUND', 'User', userId), {
  context: { userId, searchCriteria },
});
```typescript
### 3. Consistent Formatting

```typescript
// ✅ Good - consistent parameter order
getMessage('VALIDATION_TYPE', fieldName, expectedType, actualType);
getMessage('VALIDATION_RANGE', fieldName, minValue, maxValue);

// Field name always first, then constraints
```typescript
### 4. Future-Proof for i18n

```typescript
// ✅ Good - ready for localization
const message = getMessage('VALIDATION_REQUIRED', 'email');

// Future: could become
const message = getMessage('VALIDATION_REQUIRED', 'email', { locale: 'es' });
```
