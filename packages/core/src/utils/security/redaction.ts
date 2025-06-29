/**
 * @module @utils/security/redaction
 * 
 * Data redaction utilities for protecting sensitive information.
 * 
 * Provides deep object redaction with configurable patterns, path-based
 * redaction, and safe serialization. Optimized for performance with
 * iterative processing and object pooling.
 * 
 * @example
 * ```typescript
 * import { redact, createRedactor } from '@utils/security/redaction';
 * 
 * // Basic redaction
 * const data = {
 *   user: 'john',
 *   password: 'secret123',
 *   apiKey: 'sk_live_abc123'
 * };
 * 
 * const safe = redact(data);
 * // { user: 'john', password: '[REDACTED]', apiKey: '[REDACTED]' }
 * ```
 */

import {
  SENSITIVE_FIELD_PATTERNS,
  isSensitiveFieldName,
  containsSensitiveContent as checkSensitiveContent,
} from './patterns.js';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Options for data redaction.
 */
export interface RedactionOptions {
  /** Enable deep redaction of nested objects. Default: true */
  deep?: boolean;
  /** Additional patterns to check field names against */
  patterns?: RegExp[];
  /** Custom redactor function for specific logic */
  customRedactor?: (key: string, value: unknown) => unknown;
  /** Maximum depth to traverse. Default: 10 */
  maxDepth?: number;
  /** Preserve object structure (keep keys). Default: true */
  preserveStructure?: boolean;
  /** Value to use for redacted fields. Default: '[REDACTED]' */
  redactedValue?: string | ((original: unknown) => string);
  /** Maximum string length before truncation. Default: 10000 */
  maxStringLength?: number;
  /** Check content for sensitive patterns. Default: true */
  checkContent?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_REDACTED_VALUE = '[REDACTED]';
const DEFAULT_MAX_DEPTH = 10;
const DEFAULT_MAX_STRING_LENGTH = 10000;
const MAX_STACK_SIZE = 1000;

// Object pooling for performance
const POOL_SIZE = 50;
const stackPool: Array<Array<{
  source: Record<string, unknown> | unknown[];
  target: Record<string, unknown> | unknown[];
  key?: string | number;
  depth: number;
}>> = [];

// Initialize the pool
for (let i = 0; i < POOL_SIZE; i++) {
  stackPool.push([]);
}

// =============================================================================
// POOL MANAGEMENT
// =============================================================================

/**
 * Get a stack array from the pool or create a new one.
 */
function getStackFromPool(): Array<{
  source: Record<string, unknown> | unknown[];
  target: Record<string, unknown> | unknown[];
  key?: string | number;
  depth: number;
}> {
  return stackPool.pop() || [];
}

/**
 * Return a stack array to the pool after clearing it.
 */
function returnStackToPool(stack: Array<{
  source: Record<string, unknown> | unknown[];
  target: Record<string, unknown> | unknown[];
  key?: string | number;
  depth: number;
}>): void {
  if (stackPool.length < POOL_SIZE) {
    stack.length = 0;
    stackPool.push(stack);
  }
}

// =============================================================================
// MAIN REDACTION FUNCTION
// =============================================================================

/**
 * Deep redacts sensitive data from objects.
 * 
 * Uses iterative processing to prevent stack overflow on deeply nested objects.
 * Automatically detects sensitive field names and content patterns.
 * 
 * @param data - Data to redact
 * @param options - Redaction options
 * @returns Redacted copy of the data
 * 
 * @example
 * ```typescript
 * const user = {
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   password: 'secret123',
 *   profile: {
 *     ssn: '123-45-6789',
 *     phone: '555-1234'
 *   }
 * };
 * 
 * const safe = redact(user);
 * // {
 * //   name: 'John Doe',
 * //   email: '[REDACTED]',
 * //   password: '[REDACTED]',
 * //   profile: {
 * //     ssn: '[REDACTED]',
 * //     phone: '555-1234'
 * //   }
 * // }
 * ```
 */
export function redact<T>(data: T, options: RedactionOptions = {}): T {
  const {
    deep = true,
    patterns = [],
    customRedactor,
    maxDepth = DEFAULT_MAX_DEPTH,
    preserveStructure = true,
    redactedValue = DEFAULT_REDACTED_VALUE,
    maxStringLength = DEFAULT_MAX_STRING_LENGTH,
    checkContent = true,
  } = options;
  
  // Combine default and custom patterns
  const allPatterns = [...SENSITIVE_FIELD_PATTERNS, ...patterns];
  
  // Handle primitives
  if (data === null || data === undefined) {
    return data;
  }
  
  // Get redacted value
  const getRedactedValue = (original: unknown): string => {
    if (typeof redactedValue === 'function') {
      return redactedValue(original);
    }
    return redactedValue;
  };
  
  // Handle string content
  if (typeof data === 'string') {
    if (checkContent && (checkSensitiveContent(data) || data.length > maxStringLength)) {
      return getRedactedValue(data) as T;
    }
    return data;
  }
  
  // Non-objects pass through
  if (typeof data !== 'object') {
    return data;
  }
  
  // Deep redaction using iterative approach
  if (!deep) {
    // Shallow redaction
    if (Array.isArray(data)) {
      return data.map((item, index) => 
        shouldRedactValue(String(index), item, allPatterns, customRedactor, checkContent)
          ? getRedactedValue(item)
          : item
      ) as T;
    } else {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        if (shouldRedactValue(key, value, allPatterns, customRedactor, checkContent)) {
          if (preserveStructure) {
            result[key] = getRedactedValue(value);
          }
        } else {
          result[key] = value;
        }
      }
      return result as T;
    }
  }
  
  // Deep redaction with iterative processing
  const stack = getStackFromPool();
  
  try {
    let result: unknown;
    
    if (Array.isArray(data)) {
      result = [];
      stack.push({ source: data, target: result as unknown[], depth: 0 });
    } else {
      result = {};
      stack.push({ 
        source: data as Record<string, unknown>, 
        target: result as Record<string, unknown>, 
        depth: 0 
      });
    }
    
    while (stack.length > 0) {
      // Prevent stack exhaustion
      if (stack.length > MAX_STACK_SIZE) {
        return '[REDACTION STACK LIMIT EXCEEDED]' as T;
      }
      
      const item = stack.pop();
      if (!item) continue;
      const { source, target, depth } = item;
      
      // Check depth limit
      if (depth > maxDepth) {
        if (Array.isArray(target) && typeof target.length === 'number') {
          for (let i = 0; i < (source as unknown[]).length; i++) {
            target[i] = '[MAX DEPTH EXCEEDED]';
          }
        } else {
          for (const key of Object.keys(source as Record<string, unknown>)) {
            (target as Record<string, unknown>)[key] = '[MAX DEPTH EXCEEDED]';
          }
        }
        continue;
      }
      
      // Process arrays
      if (Array.isArray(source) && Array.isArray(target)) {
        for (let i = 0; i < source.length; i++) {
          const value = source[i];
          
          if (shouldRedactValue(String(i), value, allPatterns, customRedactor, checkContent)) {
            target[i] = getRedactedValue(value);
          } else if (typeof value === 'string') {
            // Check string content and length
            if (checkContent && checkSensitiveContent(value)) {
              target[i] = getRedactedValue(value);
            } else if (value.length > maxStringLength) {
              target[i] = value.substring(0, maxStringLength) + '[TRUNCATED]';
            } else {
              target[i] = value;
            }
          } else if (value !== null && typeof value === 'object') {
            if (Array.isArray(value)) {
              target[i] = [];
              stack.push({ 
                source: value, 
                target: target[i] as unknown[], 
                depth: depth + 1 
              });
            } else {
              target[i] = {};
              stack.push({ 
                source: value as Record<string, unknown>, 
                target: target[i] as Record<string, unknown>, 
                depth: depth + 1 
              });
            }
          } else {
            target[i] = value;
          }
        }
      }
      // Process objects
      else if (typeof source === 'object' && source !== null) {
        for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
          if (shouldRedactValue(key, value, allPatterns, customRedactor, checkContent)) {
            if (preserveStructure) {
              (target as Record<string, unknown>)[key] = getRedactedValue(value);
            }
          } else if (typeof value === 'string') {
            // Check string content and length
            if (checkContent && checkSensitiveContent(value)) {
              (target as Record<string, unknown>)[key] = getRedactedValue(value);
            } else if (value.length > maxStringLength) {
              (target as Record<string, unknown>)[key] = value.substring(0, maxStringLength) + '[TRUNCATED]';
            } else {
              (target as Record<string, unknown>)[key] = value;
            }
          } else if (value !== null && typeof value === 'object') {
            if (Array.isArray(value)) {
              (target as Record<string, unknown>)[key] = [];
              stack.push({ 
                source: value, 
                target: (target as Record<string, unknown>)[key] as unknown[], 
                depth: depth + 1 
              });
            } else {
              (target as Record<string, unknown>)[key] = {};
              stack.push({ 
                source: value as Record<string, unknown>, 
                target: (target as Record<string, unknown>)[key] as Record<string, unknown>, 
                depth: depth + 1 
              });
            }
          } else {
            (target as Record<string, unknown>)[key] = value;
          }
        }
      }
    }
    
    return result as T;
  } finally {
    returnStackToPool(stack);
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Determines if a value should be redacted based on key and content.
 */
function shouldRedactValue(
  key: string,
  value: unknown,
  patterns: RegExp[],
  customRedactor?: (key: string, value: unknown) => unknown,
  checkContent = true
): boolean {
  // Check custom redactor first
  if (customRedactor) {
    const result = customRedactor(key, value);
    if (result !== value) {
      return true;
    }
  }
  
  // Check field name
  if (isSensitiveFieldName(key)) {
    return true;
  }
  
  // Check patterns
  if (patterns.some(pattern => pattern.test(key))) {
    return true;
  }
  
  // Check string content
  if (checkContent && typeof value === 'string' && checkSensitiveContent(value)) {
    return true;
  }
  
  return false;
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Creates a custom redactor function with preset options.
 * 
 * @param options - Redaction options
 * @returns Redactor function
 * 
 * @example
 * ```typescript
 * const redactUser = createRedactor({
 *   patterns: [/^internal_/],
 *   customRedactor: (key, value) => {
 *     if (key === 'email') return maskEmail(value);
 *     return value;
 *   }
 * });
 * 
 * const safeUser = redactUser(userData);
 * ```
 */
export function createRedactor(options: RedactionOptions): <T>(data: T) => T {
  return <T>(data: T): T => redact(data, options);
}

// =============================================================================
// PATH-BASED REDACTION
// =============================================================================

/**
 * Options for path-based redaction.
 */
export interface PathRedactionOptions {
  /** Value to use for redacted fields */
  redactedValue?: string;
  /** Case sensitive path matching. Default: false */
  caseSensitive?: boolean;
  /** Path separator. Default: '.' */
  separator?: string;
}

/**
 * Redacts specific paths in an object.
 * 
 * @param data - Data to redact
 * @param paths - Array of paths to redact (e.g., ['user.password', 'api.key'])
 * @param options - Path redaction options
 * @returns Redacted copy of the data
 * 
 * @example
 * ```typescript
 * const data = {
 *   user: {
 *     name: 'John',
 *     password: 'secret',
 *     profile: {
 *       ssn: '123-45-6789'
 *     }
 *   }
 * };
 * 
 * const safe = redactPaths(data, ['user.password', 'user.profile.ssn']);
 * // { user: { name: 'John', password: '[REDACTED]', profile: { ssn: '[REDACTED]' } } }
 * ```
 */
export function redactPaths<T>(
  data: T,
  paths: string[],
  options: PathRedactionOptions = {}
): T {
  const {
    redactedValue = DEFAULT_REDACTED_VALUE,
    caseSensitive = false,
    separator = '.',
  } = options;
  
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  // Deep clone the data
  const result = JSON.parse(JSON.stringify(data));
  
  // Normalize paths
  const normalizedPaths = paths.map(path => 
    caseSensitive ? path : path.toLowerCase()
  );
  
  // Redact each path
  for (const path of normalizedPaths) {
    const parts = path.split(separator);
    let current = result;
    
    // Navigate to the parent of the target
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      
      if (!current || typeof current !== 'object') {
        break;
      }
      
      // Find matching key (case-insensitive if needed)
      const key = Object.keys(current).find(k =>
        caseSensitive ? k === part : k.toLowerCase() === part
      );
      
      if (key && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        break;
      }
    }
    
    // Redact the final property
    if (current && typeof current === 'object') {
      const lastPart = parts[parts.length - 1];
      const key = Object.keys(current).find(k =>
        caseSensitive ? k === lastPart : k.toLowerCase() === lastPart
      );
      
      if (key && key in current) {
        (current as Record<string, unknown>)[key] = redactedValue;
      }
    }
  }
  
  return result;
}

// =============================================================================
// PATTERN-BASED REDACTION
// =============================================================================

/**
 * Redacts values matching specific patterns.
 * 
 * @param data - Data to redact
 * @param patterns - Patterns to match against string values
 * @param options - Redaction options
 * @returns Redacted copy of the data
 * 
 * @example
 * ```typescript
 * const data = {
 *   log: 'User email: john@example.com, ID: 12345',
 *   apiKey: 'sk_live_abc123'
 * };
 * 
 * const safe = redactByPattern(data, [
 *   /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
 *   /sk_live_[A-Za-z0-9]+/g
 * ]);
 * // { log: 'User email: [REDACTED], ID: 12345', apiKey: '[REDACTED]' }
 * ```
 */
export function redactByPattern<T>(
  data: T,
  patterns: RegExp[],
  options: RedactionOptions = {}
): T {
  const { redactedValue = DEFAULT_REDACTED_VALUE } = options;
  
  return redact(data, {
    ...options,
    customRedactor: (key, value) => {
      if (typeof value === 'string') {
        let result = value;
        for (const pattern of patterns) {
          result = result.replace(pattern, 
            typeof redactedValue === 'function' 
              ? redactedValue(value) 
              : redactedValue
          );
        }
        return result !== value ? result : value;
      }
      return value;
    }
  });
}

// =============================================================================
// SAFE SERIALIZATION
// =============================================================================

/**
 * Options for safe JSON stringification.
 */
export interface SafeStringifyOptions {
  /** Enable redaction. Default: true */
  redact?: boolean;
  /** Indentation for pretty printing */
  space?: number;
  /** Custom replacer function */
  replacer?: (key: string, value: unknown) => unknown;
  /** Redaction options */
  redactionOptions?: RedactionOptions;
}

/**
 * Safely stringifies data with automatic redaction.
 * 
 * @param data - Data to stringify
 * @param options - Stringify options
 * @returns JSON string with sensitive data redacted
 * 
 * @example
 * ```typescript
 * const user = { name: 'John', password: 'secret123' };
 * const json = safeStringify(user);
 * // '{"name":"John","password":"[REDACTED]"}'
 * ```
 */
export function safeStringify(
  data: unknown,
  options: SafeStringifyOptions = {}
): string {
  const {
    redact: shouldRedact = true,
    space,
    replacer,
    redactionOptions = {},
  } = options;
  
  const safeData = shouldRedact ? redact(data, redactionOptions) : data;
  
  return JSON.stringify(safeData, replacer, space);
}

// =============================================================================
// CONTENT CHECKING
// =============================================================================

/**
 * Checks if a value contains sensitive content.
 * 
 * @param value - Value to check
 * @param patterns - Additional patterns to check against
 * @returns True if value contains sensitive content
 */
export function containsSensitive(
  value: unknown,
  patterns?: RegExp[]
): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  
  // Check default patterns
  if (checkSensitiveContent(value)) {
    return true;
  }
  
  // Check additional patterns
  if (patterns) {
    return patterns.some(pattern => pattern.test(value));
  }
  
  return false;
}

// =============================================================================
// MASKING UTILITIES
// =============================================================================

/**
 * Options for string masking.
 */
export interface MaskOptions {
  /** Number of characters to show at start. Default: 0 */
  showFirst?: number;
  /** Number of characters to show at end. Default: 0 */
  showLast?: number;
  /** Character to use for masking. Default: '*' */
  maskChar?: string;
  /** Minimum length before masking. Default: 4 */
  minLength?: number;
}

/**
 * Masks sensitive strings while preserving some characters.
 * 
 * @param value - String to mask
 * @param options - Masking options
 * @returns Masked string
 * 
 * @example
 * ```typescript
 * mask('john@example.com', { showFirst: 3, showLast: 4 });
 * // 'joh*********.com'
 * 
 * mask('4111111111111111', { showFirst: 4, showLast: 4 });
 * // '4111********1111'
 * ```
 */
export function mask(value: string, options: MaskOptions = {}): string {
  const {
    showFirst = 0,
    showLast = 0,
    maskChar = '*',
    minLength = 4,
  } = options;
  
  if (!value || typeof value !== 'string') {
    return '';
  }
  
  // Don't mask if too short
  if (value.length < minLength) {
    return maskChar.repeat(value.length);
  }
  
  // Calculate mask positions
  const totalShow = showFirst + showLast;
  if (totalShow >= value.length) {
    return value;
  }
  
  const start = value.substring(0, showFirst);
  const end = value.substring(value.length - showLast);
  const maskLength = value.length - totalShow;
  
  return start + maskChar.repeat(maskLength) + end;
}