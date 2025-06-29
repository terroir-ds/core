/**
 * @module @utils/security
 * 
 * Security utilities for the Terroir Core Design System.
 * 
 * Provides comprehensive security utilities including data redaction,
 * input sanitization, pattern matching, and hashing. Designed to protect
 * sensitive data and prevent common security vulnerabilities.
 * 
 * @example
 * ```typescript
 * import { redact, sanitizeInput, hashObject } from '@utils/security';
 * 
 * // Redact sensitive data
 * const safe = redact({ password: 'secret', user: 'john' });
 * 
 * // Sanitize user input
 * const clean = sanitizeInput(userInput, { stripHtml: true });
 * 
 * // Hash objects for comparison
 * const hash = await hashObject(data);
 * ```
 */

// =============================================================================
// PATTERN EXPORTS
// =============================================================================

export {
  // Pattern constants
  SENSITIVE_FIELD_PATTERNS,
  SENSITIVE_FIELD_NAMES,
  SENSITIVE_CONTENT_PATTERNS,
  BINARY_PATTERNS,
  
  // Pattern utilities
  createMatcher,
  compilePatterns,
  PatternBuilder,
  
  // Content checking
  isBinaryContent,
  isSensitiveFieldName,
  containsSensitiveContent,
  
  // Types
  type PatternMatcherOptions,
} from './patterns.js';

// =============================================================================
// REDACTION EXPORTS
// =============================================================================

export {
  // Main redaction functions
  redact,
  createRedactor,
  redactPaths,
  redactByPattern,
  
  // Serialization
  safeStringify,
  
  // Content checking
  containsSensitive,
  
  // Masking
  mask,
  
  // Types
  type RedactionOptions,
  type PathRedactionOptions,
  type SafeStringifyOptions,
  type MaskOptions,
} from './redaction.js';

// =============================================================================
// SANITIZATION EXPORTS
// =============================================================================

export {
  // Main sanitization
  sanitizeInput,
  stripDangerous,
  sanitizePath,
  
  // String utilities
  safeTruncate,
  normalizeWhitespace,
  
  // Types
  type SanitizationOptions,
  type StripOptions,
  type PathSanitizationOptions,
  type TruncateOptions,
  type NormalizeWhitespaceOptions,
} from './sanitization.js';

// =============================================================================
// HASHING EXPORTS
// =============================================================================

export {
  // Object hashing
  hashObject,
  
  // String hashing
  hashString,
  
  // Consistent hashing
  consistentHash,
  
  // ID generation
  deterministicId,
  
  // Masking
  createMaskedValue,
  
  // Anonymization
  anonymize,
  
  // Types
  type ObjectHashOptions,
  type StringHashOptions,
  type AnonymizeOptions,
} from './hashing.js';

// =============================================================================
// COMMON SECURITY PATTERNS
// =============================================================================

/**
 * Pre-configured redactor for API responses.
 * Automatically redacts common sensitive fields and patterns.
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/user');
 * const data = await response.json();
 * const safe = apiRedactor(data);
 * ```
 */
export const apiRedactor = createRedactor({
  deep: true,
  checkContent: true,
  redactedValue: '[REDACTED]',
});

/**
 * Pre-configured redactor for logging.
 * More aggressive redaction for safety in logs.
 * 
 * @example
 * ```typescript
 * logger.info('User data:', logRedactor(userData));
 * ```
 */
export const logRedactor = createRedactor({
  deep: true,
  checkContent: true,
  maxStringLength: 1000,
  redactedValue: (original) => {
    if (typeof original === 'string' && original.includes('@')) {
      // Partially mask emails
      const parts = original.split('@');
      if (parts.length === 2) {
        const [local, domain] = parts;
        return `${local.substring(0, 2)}***@***.${domain.split('.').pop()}`;
      }
    }
    return '[REDACTED]';
  },
});

/**
 * Pre-configured sanitizer for user input.
 * Strips common dangerous patterns.
 * 
 * @example
 * ```typescript
 * const safe = inputSanitizer(userInput);
 * ```
 */
export const inputSanitizer = (input: unknown) => 
  sanitizeInput(input, {
    maxLength: 10000,
    stripBinary: true,
    trimStrings: true,
    normalizeWhitespace: true,
  });

/**
 * Pre-configured HTML stripper.
 * Removes all HTML tags and dangerous content.
 * 
 * @example
 * ```typescript
 * const text = htmlStripper('<p>Hello <script>alert("xss")</script>world</p>');
 * // 'Hello world'
 * ```
 */
export const htmlStripper = (text: string) =>
  stripDangerous(text, {
    stripHtml: true,
    stripScripts: true,
    stripControl: true,
  });