# Security Utilities

Comprehensive security utilities for data protection, input sanitization, and safe hashing.

## Overview

The security module provides:

- **Data Redaction**: Automatically detect and redact sensitive information
- **Input Sanitization**: Clean and validate user input to prevent injection attacks
- **Pattern Matching**: Pre-built patterns for common sensitive data types
- **Hashing**: Fast, consistent hashing for caching and data anonymization

## Installation

```typescript
import { redact, sanitizeInput, hashObject } from '@utils/security';
```

## Features

### Data Redaction

Automatically detects and redacts sensitive fields and content:

```typescript
import { redact, createRedactor } from '@utils/security';

// Basic redaction
const data = {
  username: 'john',
  password: 'secret123',
  apiKey: 'sk_live_abc123',
  profile: {
    email: 'john@example.com',
    ssn: '123-45-6789',
  },
};

const safe = redact(data);
// {
//   username: 'john',
//   password: '[REDACTED]',
//   apiKey: '[REDACTED]',
//   profile: {
//     email: '[REDACTED]',
//     ssn: '[REDACTED]'
//   }
// }

// Custom redactor
const apiRedactor = createRedactor({
  customRedactor: (key, value) => {
    if (key === 'email' && typeof value === 'string') {
      // Partial masking
      return value.replace(/(.{2}).*@/, '$1***@');
    }
    return value;
  },
});
```

### Input Sanitization

Clean and validate user input:

```typescript
import { sanitizeInput, stripDangerous } from '@utils/security';

// Sanitize complex input
const input = {
  name: '  John Doe  ',
  bio: '<script>alert("xss")</script>Developer',
  tags: new Array(10000).fill('spam'),
};

const clean = sanitizeInput(input, {
  maxArrayLength: 10,
  stripBinary: true,
  trimStrings: true,
});

// Strip dangerous content
const html = '<p onclick="hack()">Hello <script>alert("xss")</script>world</p>';
const safe = stripDangerous(html, {
  stripHtml: true,
  stripScripts: true,
});
// 'Hello world'
```

### Pattern Matching

Pre-built patterns for sensitive data detection:

```typescript
import { SENSITIVE_FIELD_PATTERNS, createMatcher, PatternBuilder } from '@utils/security';

// Check field names
const isSensitive = createMatcher(SENSITIVE_FIELD_PATTERNS);
if (isSensitive('api_key')) {
  // Handle sensitive field
}

// Build custom patterns
const creditCardPattern = PatternBuilder.creditCard();
const jwtPattern = PatternBuilder.jwt();
```

### Hashing

Fast, consistent hashing using established libraries:

```typescript
import { hashObject, hashString, consistentHash } from '@utils/security';

// Hash objects (uses object-hash)
const user = { id: 123, name: 'John', roles: ['admin'] };
const hash = await hashObject(user);
// Same object structure always produces same hash

// Fast string hashing (uses xxhash)
const strHash = await hashString('hello world');
const hexHash = await hashString('hello world', { format: 'hex' });

// Consistent hashing for sharding
const serverIndex = await consistentHash(userId, numServers);
```

## Common Patterns

### API Response Filtering

```typescript
import { apiRedactor } from '@utils/security';

app.get('/api/user/:id', async (req, res) => {
  const user = await getUserById(req.params.id);
  // Automatically redact sensitive fields
  res.json(apiRedactor(user));
});
```

### Logging Safety

```typescript
import { logRedactor } from '@utils/security';
import { logger } from '@utils/logger';

// Safe logging with automatic redaction
logger.info(
  'User data:',
  logRedactor({
    id: 123,
    email: 'user@example.com',
    password: 'secret',
    creditCard: '4111111111111111',
  })
);
// Logs: User data: { id: 123, email: 'us***@***.com', password: '[REDACTED]', creditCard: '[REDACTED]' }
```

### Form Input Processing

```typescript
import { inputSanitizer, htmlStripper } from '@utils/security';

app.post('/api/comment', (req, res) => {
  // Sanitize all input
  const data = inputSanitizer(req.body);

  // Strip HTML from specific fields
  const comment = {
    ...data,
    content: htmlStripper(data.content),
  };

  saveComment(comment);
});
```

### Cache Key Generation

```typescript
import { deterministicId } from '@utils/security';

async function getCachedData(userId: string, dataType: string) {
  // Generate consistent cache key
  const cacheKey = await deterministicId('cache', userId, dataType);

  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const data = await fetchData(userId, dataType);
  await cache.set(cacheKey, data);
  return data;
}
```

## Security Patterns

### Path-Based Redaction

```typescript
import { redactPaths } from '@utils/security';

const data = {
  user: {
    name: 'John',
    password: 'secret',
    profile: {
      ssn: '123-45-6789',
      phone: '555-1234',
    },
  },
};

// Redact specific paths
const safe = redactPaths(data, ['user.password', 'user.profile.ssn']);
```

### Pattern-Based Redaction

```typescript
import { redactByPattern } from '@utils/security';

const text = {
  log: 'User john@example.com called API with key sk_live_abc123',
  note: 'Contact: 555-123-4567',
};

// Redact by patterns
const safe = redactByPattern(text, [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // emails
  /sk_live_[A-Za-z0-9]+/g, // API keys
  /\b\d{3}-\d{3}-\d{4}\b/g, // phone numbers
]);
```

### Data Anonymization

```typescript
import { anonymize } from '@utils/security';

const userData = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  orders: [
    { id: 123, amount: 99.99 },
    { id: 456, amount: 149.99 },
  ],
};

// Anonymize for testing/demos
const anonymous = await anonymize(userData, {
  preserveTypes: true,
  deterministicSeed: 'test-seed', // Same seed = same output
});
// {
//   name: 'XXXXX XXX',
//   email: 'xxxx@xxxxxxx.xxx',
//   age: 42,
//   orders: [
//     { id: 789, amount: 12.34 },
//     { id: 101, amount: 56.78 }
//   ]
// }
```

## Performance Considerations

1. **Redaction**: Uses iterative processing with object pooling to handle deep objects efficiently
2. **Patterns**: Pre-compiled regex patterns are cached for performance
3. **Hashing**: xxhash for fast string hashing, object-hash for consistent object hashing
4. **Sanitization**: Limits on depth and size prevent DoS attacks

## Security Notes

- Redaction is not reversible - redacted data is permanently removed
- Hashing functions are NOT cryptographic - use Node.js crypto for security
- Always validate and sanitize user input, even after sanitization
- Pattern matching may have false positives - test thoroughly
- Consider using allow-lists instead of deny-lists where possible

## Dependencies

- `object-hash`: Consistent object hashing
- `xxhash-wasm`: Fast non-cryptographic string hashing

## Testing

```bash
# Run security utility tests
pnpm test packages/core/src/utils/security

# Run with coverage
pnpm test:coverage packages/core/src/utils/security
```
