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
  const visited = new WeakSet<object>();
  
  try {
    let result: unknown;
    
    if (Array.isArray(data)) {
      result = [];
      visited.add(data);
      stack.push({ source: data, target: result as unknown[], depth: 0 });
    } else {
      result = {};
      visited.add(data as object);
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
      
      // Check depth limit - copy without redaction if beyond maxDepth
      if (depth > maxDepth) {
        if (Array.isArray(source) && Array.isArray(target)) {
          for (let i = 0; i < source.length; i++) {
            target[i] = source[i];
          }
        } else if (typeof source === 'object' && source !== null) {
          Object.assign(target as Record<string, unknown>, source as Record<string, unknown>);
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
            // Check for circular reference
            if (visited.has(value)) {
              target[i] = '[Circular]';
            } else if (value instanceof Date) {
              // Preserve Date objects
              target[i] = new Date(value);
            } else if (value instanceof Map) {
              // Handle Map objects
              const newMap = new Map();
              for (const [k, v] of value) {
                if (shouldRedactValue(k, v, allPatterns, customRedactor, checkContent)) {
                  newMap.set(k, getRedactedValue(v));
                } else {
                  newMap.set(k, v);
                }
              }
              target[i] = newMap;
            } else if (value instanceof Set) {
              // Handle Set objects
              const newSet = new Set();
              for (const v of value) {
                if (checkContent && typeof v === 'string' && checkSensitiveContent(v)) {
                  newSet.add(getRedactedValue(v));
                } else {
                  newSet.add(v);
                }
              }
              target[i] = newSet;
            } else {
              visited.add(value);
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
            // Check for circular reference
            if (visited.has(value)) {
              (target as Record<string, unknown>)[key] = '[Circular]';
            } else if (value instanceof Date) {
              // Preserve Date objects
              (target as Record<string, unknown>)[key] = new Date(value);
            } else if (value instanceof Map) {
              // Handle Map objects
              const newMap = new Map();
              for (const [k, v] of value) {
                if (shouldRedactValue(k, v, allPatterns, customRedactor, checkContent)) {
                  newMap.set(k, getRedactedValue(v));
                } else {
                  newMap.set(k, v);
                }
              }
              (target as Record<string, unknown>)[key] = newMap;
            } else if (value instanceof Set) {
              // Handle Set objects
              const newSet = new Set();
              for (const v of value) {
                if (checkContent && typeof v === 'string' && checkSensitiveContent(v)) {
                  newSet.add(getRedactedValue(v));
                } else {
                  newSet.add(v);
                }
              }
              (target as Record<string, unknown>)[key] = newSet;
            } else {
              visited.add(value);
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
  /** Case sensitive path matching. Default: true */
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
    caseSensitive = true,
    separator = '.',
  } = options;
  
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  // Deep clone the data
  const result = JSON.parse(JSON.stringify(data));
  
  // Process each path
  for (const path of paths) {
    redactPath(result, path, redactedValue, caseSensitive, separator);
  }
  
  return result;
}

/**
 * Helper function to redact a single path
 */
function redactPath(
  obj: unknown,
  path: string,
  redactedValue: string,
  caseSensitive: boolean,
  separator: string
): void {
  // Parse path into segments, handling array notation
  const segments: Array<{ key: string; isArray: boolean; index?: number | '*' }> = [];
  
  // Split by separator but keep array notation intact
  const parts = path.split(separator);
  for (const part of parts) {
    const arrayMatch = part.match(/^(.+?)\[(\d+|\*)\]$/);
    if (arrayMatch && arrayMatch[1] && arrayMatch[2]) {
      segments.push({
        key: arrayMatch[1],
        isArray: true,
        index: arrayMatch[2] === '*' ? '*' : parseInt(arrayMatch[2], 10)
      });
    } else {
      segments.push({ key: part, isArray: false });
    }
  }
  
  // Navigate through the object
  let current = obj;
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i];
    
    if (!current || typeof current !== 'object') {
      return;
    }
    
    // Find matching key
    const actualKey = segment ? findKey(current, segment.key, caseSensitive) : null;
    if (!actualKey) {
      return;
    }
    
    current = (current as Record<string, unknown>)[actualKey];
    
    // Handle array access
    if (segment && segment.isArray && Array.isArray(current)) {
      if (segment.index === '*') {
        // Process remaining path for all array elements
        const remainingPath = segments.slice(i + 1).map(s => 
          s.isArray ? `${s.key}[${s.index}]` : s.key
        ).join(separator);
        
        for (let j = 0; j < current.length; j++) {
          redactPath(current[j], remainingPath, redactedValue, caseSensitive, separator);
        }
        return;
      } else if (typeof segment.index === 'number' && segment.index < current.length) {
        current = current[segment.index];
      } else {
        return;
      }
    }
  }
  
  // Redact the final value(s)
  const lastSegment = segments[segments.length - 1];
  if (lastSegment && current && typeof current === 'object') {
    // For case-insensitive matching, we need to find ALL matching keys
    const keys = Object.keys(current as Record<string, unknown>);
    
    if (caseSensitive) {
      // Case sensitive - only exact match
      if (keys.includes(lastSegment.key)) {
        (current as Record<string, unknown>)[lastSegment.key] = redactedValue;
      }
    } else {
      // Case insensitive - match all variations
      const lowerKey = lastSegment.key.toLowerCase();
      for (const key of keys) {
        if (key.toLowerCase() === lowerKey) {
          (current as Record<string, unknown>)[key] = redactedValue;
        }
      }
    }
  }
}

/**
 * Find a key in an object with optional case-insensitive matching
 */
function findKey(obj: unknown, key: string, caseSensitive: boolean): string | undefined {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }
  
  const keys = Object.keys(obj as Record<string, unknown>);
  
  if (caseSensitive) {
    return keys.find(k => k === key);
  } else {
    const lowerKey = key.toLowerCase();
    return keys.find(k => k.toLowerCase() === lowerKey);
  }
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
    customRedactor: (_key, value) => {
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
  // For non-objects, check if it's a string with sensitive content
  if (typeof value === 'string') {
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
  
  // For objects, check all fields recursively
  if (value && typeof value === 'object') {
    const stack: Array<{ obj: unknown; key?: string }> = [{ obj: value }];
    const visited = new WeakSet<object>();
    
    while (stack.length > 0) {
      const item = stack.pop();
      if (!item) continue;
      const { obj, key } = item;
      
      // Check if the field name itself is sensitive
      if (key && isSensitiveFieldName(key)) {
        return true;
      }
      
      // Handle arrays
      if (Array.isArray(obj)) {
        for (const item of obj) {
          if (typeof item === 'string') {
            if (checkSensitiveContent(item) || (patterns && patterns.some(p => p.test(item)))) {
              return true;
            }
          } else if (item && typeof item === 'object' && !visited.has(item)) {
            visited.add(item);
            stack.push({ obj: item });
          }
        }
      }
      // Handle objects
      else if (obj && typeof obj === 'object') {
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
          // Check field name
          if (isSensitiveFieldName(k)) {
            return true;
          }
          
          // Check string values
          if (typeof v === 'string') {
            if (checkSensitiveContent(v) || (patterns && patterns.some(p => p.test(v)))) {
              return true;
            }
          }
          // Recurse into nested objects
          else if (v && typeof v === 'object' && !visited.has(v)) {
            visited.add(v);
            stack.push({ obj: v, key: k });
          }
        }
      }
    }
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
  /** Minimum length of result. If specified, pads with mask characters */
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
    minLength,
  } = options;
  
  if (!value || typeof value !== 'string') {
    return '';
  }
  
  // Calculate mask positions
  const totalShow = showFirst + showLast;
  if (totalShow >= value.length) {
    return value;
  }
  
  // Don't mask if original string is already being fully shown
  if (showFirst >= value.length || showLast >= value.length) {
    return value;
  }
  
  const start = value.substring(0, showFirst);
  const end = value.substring(value.length - showLast);
  const middleLength = value.length - totalShow;
  
  // Apply minimum length if specified
  if (minLength !== undefined && value.length < minLength) {
    const totalLength = minLength;
    const maskLength = totalLength - showFirst - showLast;
    return start + maskChar.repeat(Math.max(maskLength, 0)) + end;
  }
  
  return start + maskChar.repeat(middleLength) + end;
}