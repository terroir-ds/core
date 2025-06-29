/**
 * @module @utils/security/patterns
 * 
 * Security patterns and regular expressions for sensitive data detection.
 * 
 * Provides pre-compiled patterns for common sensitive data types and
 * utilities for creating custom pattern matchers. Optimized for performance
 * with caching and lazy compilation.
 * 
 * @example
 * ```typescript
 * import { SENSITIVE_FIELD_PATTERNS, createMatcher } from '@utils/security/patterns';
 * 
 * // Check if a field name is sensitive
 * const isSensitiveField = createMatcher(SENSITIVE_FIELD_PATTERNS);
 * if (isSensitiveField('api_key')) {
 *   // Handle sensitive field
 * }
 * ```
 */

// =============================================================================
// FIELD NAME PATTERNS
// =============================================================================

/**
 * Common sensitive field name patterns.
 * These patterns match field names that typically contain sensitive data.
 */
export const SENSITIVE_FIELD_PATTERNS: ReadonlyArray<RegExp> = [
  /^.*(password|passwd|pwd).*$/i,
  /^.*(secret|api[_-]?key|apikey).*$/i,
  /^.*(token|auth|authorization).*$/i,
  /^.*(cert|certificate|private[_-]?key).*$/i,
  /^.*(ssn|social|tax[_-]?id).*$/i,
  /^.*(credit[_-]?card|cc[_-]?num|cvv|cvc).*$/i,
  /^.*(bank[_-]?account|account[_-]?number|routing[_-]?number).*$/i,
  /^.*(pin|passcode|security[_-]?code).*$/i,
  /^.*(session|cookie).*$/i,
  /^.*(bearer|jwt|oauth).*$/i,
];

/**
 * Simple field names that should be checked without regex.
 * Faster than regex for exact matches.
 */
export const SENSITIVE_FIELD_NAMES = new Set([
  'password', 'passwd', 'pwd',
  'token', 'api_key', 'apikey', 'api-key',
  'secret', 'private', 'priv',
  'key', 'auth', 'authorization',
  'session', 'cookie',
  'credit_card', 'creditcard', 'cc_number',
  'ssn', 'social_security',
  'bank_account', 'account_number',
  'pin', 'cvv', 'cvc'
]);

// =============================================================================
// CONTENT PATTERNS
// =============================================================================

/**
 * Content patterns that indicate sensitive data.
 * These patterns match actual sensitive values in strings.
 */
export const SENSITIVE_CONTENT_PATTERNS: ReadonlyArray<RegExp> = [
  // Credit card numbers (with spaces/dashes)
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
  
  // JWT tokens
  /\beyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b/,
  
  // US Social Security Numbers
  /\b\d{3}-\d{2}-\d{4}\b/,
  
  // Base64 encoded potential keys (min 20 chars)
  /^[A-Za-z0-9+/]{20,}={0,2}$/,
  
  // Private keys
  /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/,
  /-----BEGIN ENCRYPTED PRIVATE KEY-----/,
  
  // API Keys - Common formats
  /^(gh[ps]_|github_)[A-Za-z0-9]{36,}$/, // GitHub
  /^(sk|pk)_(test|live)_[A-Za-z0-9]{24,}$/, // Stripe
  /^AKIA[0-9A-Z]{16}$/, // AWS Access Key ID (standard format)
  /\bAKIA[A-Z0-9_]{16,}\b/i, // AWS Access Key ID (flexible format)
  /^[A-Za-z0-9]{40}$/, // Generic 40-char API key (AWS Secret, GitHub Classic)
  
  // Email addresses (for privacy)
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  
  // IP Addresses
  /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/, // IPv4
  /\b(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}\b/, // IPv6 (simplified)
  
  // Phone numbers
  /\b\+?1?\s*\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/, // US format
  /\b\+[1-9]\d{1,14}\b/, // International E.164 format
];

// =============================================================================
// BINARY CONTENT PATTERNS
// =============================================================================

/**
 * Patterns that indicate binary or encoded content.
 */
export const BINARY_PATTERNS: ReadonlyArray<RegExp> = [
  // Control characters (excluding common whitespace)
  // eslint-disable-next-line no-control-regex
  /[\x00-\x08\x0E-\x1F\x7F-\x9F]/,
  
  // Large base64 strings (likely encoded binary)
  /^[A-Za-z0-9+/]{1000,}={0,2}$/,
  
  // Hex encoded data (min 32 chars, like hashes)
  /^[a-fA-F0-9]{32,}$/,
];

// =============================================================================
// PATTERN UTILITIES
// =============================================================================

/**
 * Pattern matcher options.
 */
export interface PatternMatcherOptions {
  /** Match all patterns (AND) or any pattern (OR). Default: false (OR) */
  matchAll?: boolean;
  /** Case sensitive matching. Default: depends on pattern */
  caseSensitive?: boolean;
  /** Cache compiled patterns. Default: true */
  cache?: boolean;
}

// Pattern cache for performance
const patternCache = new Map<string, RegExp>();

/**
 * Creates a pattern matcher function from an array of patterns.
 * 
 * @param patterns - Array of regex patterns
 * @param options - Matcher options
 * @returns Function that tests if a value matches the patterns
 * 
 * @example
 * ```typescript
 * const isApiKey = createMatcher([
 *   /^sk_[a-zA-Z0-9]{24,}$/,
 *   /^pk_[a-zA-Z0-9]{24,}$/
 * ]);
 * 
 * if (isApiKey(value)) {
 *   console.log('Found API key');
 * }
 * ```
 */
export function createMatcher(
  patterns: RegExp[],
  options: PatternMatcherOptions = {}
): (value: string) => boolean {
  const { matchAll = false, cache = true } = options;
  
  // Pre-compile patterns if needed
  const compiledPatterns = patterns.map(pattern => {
    if (!cache) return pattern;
    
    const key = pattern.toString();
    let cached = patternCache.get(key);
    if (!cached) {
      cached = new RegExp(pattern.source, pattern.flags);
      patternCache.set(key, cached);
    }
    return cached;
  });
  
  return (value: string): boolean => {
    if (!value || typeof value !== 'string') return false;
    
    if (matchAll) {
      return compiledPatterns.every(pattern => pattern.test(value));
    } else {
      return compiledPatterns.some(pattern => pattern.test(value));
    }
  };
}

/**
 * Compiles string patterns into RegExp objects.
 * 
 * @param patterns - Array of strings or RegExp objects
 * @param flags - Default flags for string patterns
 * @returns Array of compiled RegExp objects
 * 
 * @example
 * ```typescript
 * const patterns = compilePatterns([
 *   'password',
 *   /api[_-]?key/i,
 *   'secret'
 * ], 'i');
 * ```
 */
export function compilePatterns(
  patterns: (string | RegExp)[],
  flags = ''
): RegExp[] {
  return patterns.map(pattern => {
    if (pattern instanceof RegExp) {
      return pattern;
    }
    
    // Escape special regex characters in string
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const key = `${escaped}:${flags}`;
    
    let compiled = patternCache.get(key);
    if (!compiled) {
      compiled = new RegExp(escaped, flags);
      patternCache.set(key, compiled);
    }
    
    return compiled;
  });
}

// =============================================================================
// PATTERN BUILDER
// =============================================================================

/**
 * Builder for common security patterns.
 * Provides pre-built patterns for common use cases.
 */
export class PatternBuilder {
  /**
   * Creates a credit card pattern.
   * Matches major credit card formats with optional spaces/dashes.
   */
  static creditCard(): RegExp {
    return /\b(?:\d{4}[\s-]?){3}\d{4}\b/;
  }
  
  /**
   * Creates an email pattern.
   * Matches standard email addresses.
   */
  static email(): RegExp {
    return /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  }
  
  /**
   * Creates an IP address pattern.
   * 
   * @param version - IP version (4 or 6). Default: 4
   */
  static ipAddress(version: 4 | 6 = 4): RegExp {
    if (version === 6) {
      // Simplified IPv6 pattern
      return /\b(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}\b/;
    }
    // IPv4 pattern
    return /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/;
  }
  
  /**
   * Creates a JWT token pattern.
   * Matches standard JWT format (header.payload.signature).
   */
  static jwt(): RegExp {
    return /\beyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b/;
  }
  
  /**
   * Creates an API key pattern.
   * 
   * @param prefix - Optional key prefix (e.g., 'sk_', 'pk_')
   * @param length - Minimum key length after prefix. Default: 24
   */
  static apiKey(prefix = '', length = 24): RegExp {
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^${escapedPrefix}[A-Za-z0-9]{${length},}$`);
  }
  
  /**
   * Creates a custom pattern with proper escaping.
   * 
   * @param pattern - Pattern string
   * @param flags - RegExp flags
   */
  static custom(pattern: string, flags = ''): RegExp {
    return new RegExp(pattern, flags);
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Checks if a string contains binary content.
 * 
 * @param str - String to check
 * @param threshold - Ratio of non-printable chars to consider binary. Default: 0.3
 * @returns True if string appears to contain binary data
 */
export function isBinaryContent(str: string, threshold = 0.3): boolean {
  if (!str || str.length === 0) return false;
  
  // Check for null bytes first (quick check)
  if (str.includes('\0')) return true;
  
  // Count non-printable characters
  // eslint-disable-next-line no-control-regex
  const nonPrintable = str.match(/[\x00-\x08\x0E-\x1F\x7F-\x9F]/g);
  
  if (!nonPrintable) return false;
  
  // Check ratio
  return nonPrintable.length / str.length > threshold;
}

/**
 * Checks if a field name is potentially sensitive.
 * Uses both exact matching and pattern matching for performance.
 * 
 * @param fieldName - Field name to check
 * @returns True if field name appears sensitive
 */
export function isSensitiveFieldName(fieldName: string): boolean {
  if (!fieldName) return false;
  
  const lowerName = fieldName.toLowerCase();
  
  // Check exact matches first (faster)
  if (SENSITIVE_FIELD_NAMES.has(lowerName)) {
    return true;
  }
  
  // Check patterns
  return SENSITIVE_FIELD_PATTERNS.some(pattern => pattern.test(fieldName));
}

/**
 * Checks if content contains sensitive data.
 * 
 * @param content - Content to check
 * @returns True if content appears to contain sensitive data
 */
export function containsSensitiveContent(content: string): boolean {
  if (!content || typeof content !== 'string') return false;
  
  // Check binary content first
  if (isBinaryContent(content)) return true;
  
  // Check against sensitive patterns
  return SENSITIVE_CONTENT_PATTERNS.some(pattern => pattern.test(content));
}