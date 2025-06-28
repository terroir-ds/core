# Security Utilities Specification

## Overview
Extract security and data protection utilities from the logger for use across the Terroir Core Design System.

## Module Structure
```
lib/utils/security/
├── index.ts             # Main exports
├── redaction.ts         # Data redaction utilities
├── patterns.ts          # Security patterns and regex
├── sanitization.ts      # Input sanitization
├── hashing.ts          # Hashing and masking utilities
└── __tests__/
    ├── redaction.test.ts
    ├── patterns.test.ts
    ├── sanitization.test.ts
    └── hashing.test.ts
```

## Detailed Specifications

### 1. Redaction Utilities (`redaction.ts`)

```typescript
export interface RedactionOptions {
  deep?: boolean;
  patterns?: RegExp[];
  customRedactor?: (key: string, value: unknown) => unknown;
  maxDepth?: number;
  preserveStructure?: boolean;
  redactedValue?: string | ((original: unknown) => string);
}

/**
 * Deep redact sensitive data from objects
 */
export function redact<T>(
  data: T,
  options?: RedactionOptions
): T;

/**
 * Create a custom redactor function
 */
export function createRedactor(
  options: RedactionOptions
): <T>(data: T) => T;

/**
 * Redact specific paths in an object
 */
export function redactPaths<T>(
  data: T,
  paths: string[],
  options?: {
    redactedValue?: string;
    caseSensitive?: boolean;
  }
): T;

/**
 * Redact values matching patterns
 */
export function redactByPattern<T>(
  data: T,
  patterns: RegExp[],
  options?: RedactionOptions
): T;

/**
 * Safe JSON stringify with redaction
 */
export function safeStringify(
  data: unknown,
  options?: {
    redact?: boolean;
    space?: number;
    replacer?: (key: string, value: unknown) => unknown;
  }
): string;

/**
 * Check if value contains sensitive content
 */
export function containsSensitive(
  value: unknown,
  patterns?: RegExp[]
): boolean;

/**
 * Mask sensitive strings
 */
export function mask(
  value: string,
  options?: {
    showFirst?: number;
    showLast?: number;
    maskChar?: string;
    minLength?: number;
  }
): string;
```

**Testing Requirements:**
- ✅ Test deep object redaction
- ✅ Test circular reference handling
- ✅ Test various data types
- ✅ Test custom patterns
- ✅ Test performance with large objects
- ✅ Test path-based redaction
- ✅ Test masking options
- ✅ Security validation

### 2. Security Patterns (`patterns.ts`)

```typescript
/**
 * Common sensitive field patterns
 */
export const SENSITIVE_FIELD_PATTERNS: ReadonlyArray<RegExp> = [
  /^.*(password|passwd|pwd).*$/i,
  /^.*(secret|api[_-]?key|apikey).*$/i,
  /^.*(token|auth|authorization).*$/i,
  /^.*(cert|certificate|private[_-]?key).*$/i,
  /^.*(ssn|social|tax[_-]?id).*$/i,
  /^.*(credit[_-]?card|cc[_-]?num|cvv).*$/i,
];

/**
 * Content patterns that indicate sensitive data
 */
export const SENSITIVE_CONTENT_PATTERNS: ReadonlyArray<RegExp> = [
  /^[A-Za-z0-9+/]{20,}={0,2}$/, // Base64 potential keys
  /^(gh[ps]_|github_)[A-Za-z0-9]{36,}$/, // GitHub tokens
  /^(sk|pk)_(test|live)_[A-Za-z0-9]{24,}$/, // Stripe keys
  /^[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}$/, // Credit cards
  /^\d{3}-\d{2}-\d{4}$/, // SSN
];

/**
 * Binary content patterns
 */
export const BINARY_PATTERNS: ReadonlyArray<RegExp> = [
  /[\x00-\x08\x0E-\x1F\x7F-\x9F]/,
  /^[A-Za-z0-9+/]{1000,}={0,2}$/, // Large base64
];

/**
 * Create pattern matcher
 */
export function createMatcher(
  patterns: RegExp[],
  options?: {
    matchAll?: boolean;
    caseSensitive?: boolean;
  }
): (value: string) => boolean;

/**
 * Compile patterns for performance
 */
export function compilePatterns(
  patterns: (string | RegExp)[],
  flags?: string
): RegExp[];

/**
 * Pattern builder for common scenarios
 */
export class PatternBuilder {
  static creditCard(): RegExp;
  static email(): RegExp;
  static ipAddress(): RegExp;
  static jwt(): RegExp;
  static apiKey(prefix?: string): RegExp;
  static custom(pattern: string, flags?: string): RegExp;
}
```

### 3. Input Sanitization (`sanitization.ts`)

```typescript
export interface SanitizationOptions {
  maxLength?: number;
  maxDepth?: number;
  maxArrayLength?: number;
  maxProperties?: number;
  allowedTypes?: string[];
  stripBinary?: boolean;
  normalizeWhitespace?: boolean;
}

/**
 * Sanitize user input
 */
export function sanitizeInput<T>(
  input: T,
  options?: SanitizationOptions
): T;

/**
 * Strip potentially dangerous content
 */
export function stripDangerous(
  text: string,
  options?: {
    stripHtml?: boolean;
    stripScripts?: boolean;
    stripSql?: boolean;
    stripControl?: boolean;
  }
): string;

/**
 * Validate and sanitize file paths
 */
export function sanitizePath(
  path: string,
  options?: {
    allowRelative?: boolean;
    allowAbsolute?: boolean;
    basePath?: string;
  }
): string | null;

/**
 * Truncate with safety
 */
export function safeTruncate(
  value: unknown,
  maxLength: number,
  options?: {
    ellipsis?: string;
    preserveWords?: boolean;
  }
): string;

/**
 * Normalize whitespace and control characters
 */
export function normalizeWhitespace(
  text: string,
  options?: {
    preserveNewlines?: boolean;
    collapseDuplicates?: boolean;
  }
): string;
```

### 4. Hashing and Masking (`hashing.ts`)

```typescript
/**
 * Create consistent hash for sampling/sharding
 */
export function consistentHash(
  value: string,
  options?: {
    algorithm?: 'djb2' | 'fnv1a' | 'xxhash';
    seed?: number;
  }
): number;

/**
 * Generate deterministic ID
 */
export function deterministicId(
  ...parts: string[]
): string;

/**
 * Create masked version of value
 */
export function createMaskedValue(
  value: string,
  mask: string | ((char: string, index: number) => string)
): string;

/**
 * Anonymize data while preserving structure
 */
export function anonymize<T>(
  data: T,
  options?: {
    preserveTypes?: boolean;
    preserveLength?: boolean;
    deterministicSeed?: string;
  }
): T;
```

## Integration Examples

### API Response Filtering
```typescript
import { redact, SENSITIVE_FIELD_PATTERNS } from '@utils/security';

// Redact sensitive data from API responses
export function filterApiResponse(data: unknown): unknown {
  return redact(data, {
    deep: true,
    patterns: SENSITIVE_FIELD_PATTERNS,
    redactedValue: '[REDACTED]'
  });
}
```

### Configuration Safety
```typescript
import { sanitizeInput, containsSensitive } from '@utils/security';

// Validate configuration
export function validateConfig(config: unknown): Config {
  const sanitized = sanitizeInput(config, {
    maxDepth: 5,
    stripBinary: true
  });
  
  if (containsSensitive(JSON.stringify(sanitized))) {
    throw new Error('Configuration contains sensitive data');
  }
  
  return sanitized as Config;
}
```

### User Input Protection
```typescript
import { stripDangerous, safeTruncate } from '@utils/security';

// Protect against malicious input
export function processUserInput(input: string): string {
  const cleaned = stripDangerous(input, {
    stripHtml: true,
    stripScripts: true,
    stripControl: true
  });
  
  return safeTruncate(cleaned, 1000, {
    ellipsis: '...',
    preserveWords: true
  });
}
```

### Logging Enhancement
```typescript
import { createRedactor, mask } from '@utils/security';

// Create specialized logger
const secureLogger = {
  info: (message: string, data?: unknown) => {
    const redactor = createRedactor({
      deep: true,
      customRedactor: (key, value) => {
        if (key === 'email') return mask(String(value), { showFirst: 3, showLast: 4 });
        return value;
      }
    });
    
    logger.info(message, redactor(data));
  }
};
```

## Performance Considerations

1. **Pattern Compilation**: Pre-compile regex patterns
2. **Depth Limits**: Prevent deep recursion
3. **Caching**: Cache redaction results for repeated data
4. **Streaming**: Support streaming for large data
5. **Memory**: Use object pools for temporary objects

## Security Considerations

1. **Defense in Depth**: Multiple layers of protection
2. **Fail Secure**: Default to redacting when uncertain
3. **No Logging**: Never log redacted values
4. **Constant Time**: Use constant-time comparisons where needed
5. **Regular Updates**: Keep patterns updated

## Migration Strategy

### Phase 1: Extract Core Functions
1. Move redaction logic from logger
2. Create comprehensive test suite
3. Document security patterns

### Phase 2: Enhance Capabilities
1. Add path-based redaction
2. Improve pattern matching
3. Add streaming support

### Phase 3: Integration
1. Update logger to use utilities
2. Add to API layer
3. Integrate with config system

## Success Metrics

- ✅ Zero sensitive data leaks
- ✅ <10ms overhead for typical objects
- ✅ 100% test coverage
- ✅ Pattern accuracy validation
- ✅ Memory efficiency