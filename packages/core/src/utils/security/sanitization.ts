/**
 * @module @utils/security/sanitization
 * 
 * Input sanitization utilities for security and data safety.
 * 
 * Provides functions to clean and validate user input, strip dangerous content,
 * and ensure data conforms to expected formats. Designed to prevent injection
 * attacks and ensure data integrity.
 * 
 * @example
 * ```typescript
 * import { sanitizeInput, stripDangerous } from '@utils/security/sanitization';
 * 
 * // Sanitize user input
 * const userInput = '<script>alert("xss")</script>Hello';
 * const safe = stripDangerous(userInput, { stripHtml: true });
 * // 'Hello'
 * ```
 */

import { isBinaryContent } from './patterns.js';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Options for input sanitization.
 */
export interface SanitizationOptions {
  /** Maximum allowed string length. Default: 10000 */
  maxLength?: number;
  /** Maximum depth for nested objects. Default: 10 */
  maxDepth?: number;
  /** Maximum array length. Default: 1000 */
  maxArrayLength?: number;
  /** Maximum object properties. Default: 100 */
  maxProperties?: number;
  /** Allowed data types. Default: all types */
  allowedTypes?: Array<'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'>;
  /** Strip binary content from strings. Default: true */
  stripBinary?: boolean;
  /** Normalize whitespace in strings. Default: false */
  normalizeWhitespace?: boolean;
  /** Trim strings. Default: true */
  trimStrings?: boolean;
}

/**
 * Options for stripping dangerous content.
 */
export interface StripOptions {
  /** Strip HTML tags. Default: true */
  stripHtml?: boolean;
  /** Strip script tags and content. Default: true */
  stripScripts?: boolean;
  /** Strip potential SQL injection. Default: false */
  stripSql?: boolean;
  /** Strip control characters. Default: true */
  stripControl?: boolean;
  /** Strip URLs. Default: false */
  stripUrls?: boolean;
  /** Allowed HTML tags (if stripHtml is false) */
  allowedTags?: string[];
}

/**
 * Options for path sanitization.
 */
export interface PathSanitizationOptions {
  /** Allow relative paths. Default: false */
  allowRelative?: boolean;
  /** Allow absolute paths. Default: true */
  allowAbsolute?: boolean;
  /** Base path for resolution. Default: process.cwd() */
  basePath?: string;
  /** Allow parent directory references (..). Default: false */
  allowParent?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_MAX_LENGTH = 10000;
const DEFAULT_MAX_DEPTH = 10;
const DEFAULT_MAX_ARRAY_LENGTH = 1000;
const DEFAULT_MAX_PROPERTIES = 100;

// Dangerous patterns
const SCRIPT_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const HTML_TAG_PATTERN = /<[^>]+>/g;
const SQL_KEYWORDS = /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|FROM|WHERE|AND|OR|ORDER BY|GROUP BY|HAVING)\b/gi;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const URL_PATTERN = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

// Path traversal patterns
const PATH_TRAVERSAL_PATTERN = /\.\.[/\\]/g;
const ABSOLUTE_PATH_PATTERN = /^([a-zA-Z]:[\\/]|\/)/;

// =============================================================================
// MAIN SANITIZATION FUNCTION
// =============================================================================

/**
 * Sanitizes user input recursively.
 * 
 * Ensures data conforms to expected types and constraints, preventing
 * malicious input from causing issues.
 * 
 * @param input - Input to sanitize
 * @param options - Sanitization options
 * @returns Sanitized copy of the input
 * 
 * @example
 * ```typescript
 * const input = {
 *   name: '  John Doe  ',
 *   bio: '<script>alert("xss")</script>Developer',
 *   tags: new Array(10000).fill('spam'),
 *   nested: { level: 1, next: { level: 2 } }
 * };
 * 
 * const clean = sanitizeInput(input, {
 *   maxArrayLength: 10,
 *   stripBinary: true,
 *   trimStrings: true
 * });
 * ```
 */
export function sanitizeInput<T>(
  input: T,
  options: SanitizationOptions = {}
): T {
  const {
    maxLength = DEFAULT_MAX_LENGTH,
    maxDepth = DEFAULT_MAX_DEPTH,
    maxArrayLength = DEFAULT_MAX_ARRAY_LENGTH,
    maxProperties = DEFAULT_MAX_PROPERTIES,
    allowedTypes,
    stripBinary = true,
    normalizeWhitespace = false,
    trimStrings = true,
  } = options;
  
  // Type checking
  const type = getType(input);
  if (allowedTypes && !allowedTypes.includes(type as InputType)) {
    throw new TypeError(`Type '${type}' is not allowed`);
  }
  
  // Recursive sanitization with depth tracking
  function sanitizeRecursive(value: unknown, depth: number): unknown {
    if (depth > maxDepth) {
      return '[MAX DEPTH EXCEEDED]';
    }
    
    // Handle null/undefined
    if (value === null || value === undefined) {
      return value;
    }
    
    // Handle strings
    if (typeof value === 'string') {
      let result = value;
      
      // Strip binary content
      if (stripBinary && isBinaryContent(result)) {
        result = '[BINARY CONTENT REMOVED]';
      }
      
      // Trim
      if (trimStrings) {
        result = result.trim();
      }
      
      // Normalize whitespace
      if (normalizeWhitespace) {
        result = normalizeWhitespaceString(result);
      }
      
      // Enforce length limit
      if (result.length > maxLength) {
        result = result.substring(0, maxLength) + '[TRUNCATED]';
      }
      
      return result;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      const sanitized: unknown[] = [];
      const limit = Math.min(value.length, maxArrayLength);
      
      for (let i = 0; i < limit; i++) {
        sanitized.push(sanitizeRecursive(value[i], depth + 1));
      }
      
      if (value.length > maxArrayLength) {
        sanitized.push(`[${value.length - maxArrayLength} MORE ITEMS TRUNCATED]`);
      }
      
      return sanitized;
    }
    
    // Handle objects
    if (typeof value === 'object' && value !== null) {
      const sanitized: Record<string, unknown> = {};
      const entries = Object.entries(value);
      const limit = Math.min(entries.length, maxProperties);
      
      for (let i = 0; i < limit; i++) {
        const entry = entries[i];
        if (!entry) continue;
        const [key, val] = entry;
        // Sanitize key as well
        const sanitizedKey = typeof key === 'string' 
          ? key.substring(0, 100).replace(/[^\w.-]/g, '_')
          : String(key);
        sanitized[sanitizedKey] = sanitizeRecursive(val, depth + 1);
      }
      
      if (entries.length > maxProperties) {
        sanitized['_truncated'] = `${entries.length - maxProperties} MORE PROPERTIES`;
      }
      
      return sanitized;
    }
    
    // Pass through other types
    return value;
  }
  
  return sanitizeRecursive(input, 0) as T;
}

// =============================================================================
// CONTENT STRIPPING
// =============================================================================

/**
 * Strips potentially dangerous content from strings.
 * 
 * @param text - Text to clean
 * @param options - Strip options
 * @returns Cleaned text
 * 
 * @example
 * ```typescript
 * const dirty = '<script>alert("xss")</script>Hello <b>world</b>!';
 * const clean = stripDangerous(dirty, {
 *   stripHtml: true,
 *   stripScripts: true
 * });
 * // 'Hello world!'
 * ```
 */
export function stripDangerous(
  text: string,
  options: StripOptions = {}
): string {
  const {
    stripHtml = true,
    stripScripts = true,
    stripSql = false,
    stripControl = true,
    stripUrls = false,
    allowedTags = [],
  } = options;
  
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  let result = text;
  
  // Strip scripts first (if enabled)
  if (stripScripts) {
    result = result.replace(SCRIPT_PATTERN, '');
  }
  
  // Strip HTML tags
  if (stripHtml) {
    if (allowedTags.length > 0) {
      // Keep allowed tags
      const allowedPattern = new RegExp(
        `<(?!/?(?:${allowedTags.join('|')})\\s*/?>)[^>]+>`,
        'gi'
      );
      result = result.replace(allowedPattern, '');
    } else {
      // Strip all HTML
      result = result.replace(HTML_TAG_PATTERN, '');
    }
  }
  
  // Strip SQL keywords
  if (stripSql) {
    result = result.replace(SQL_KEYWORDS, (match) => '*'.repeat(match.length));
  }
  
  // Strip control characters
  if (stripControl) {
    result = result.replace(CONTROL_CHARS, '');
  }
  
  // Strip URLs
  if (stripUrls) {
    result = result.replace(URL_PATTERN, '[URL REMOVED]');
  }
  
  return result;
}

// =============================================================================
// PATH SANITIZATION
// =============================================================================

/**
 * Validates and sanitizes file paths.
 * 
 * @param path - Path to sanitize
 * @param options - Path sanitization options
 * @returns Sanitized path or null if invalid
 * 
 * @example
 * ```typescript
 * // Prevent path traversal
 * sanitizePath('../../../etc/passwd'); // null
 * sanitizePath('/safe/path/file.txt'); // '/safe/path/file.txt'
 * 
 * // With base path
 * sanitizePath('../../file.txt', {
 *   basePath: '/app/data',
 *   allowRelative: true
 * }); // null (goes outside base)
 * ```
 */
export function sanitizePath(
  path: string,
  options: PathSanitizationOptions = {}
): string | null {
  const {
    allowRelative = false,
    allowAbsolute = true,
    basePath = process.cwd(),
    allowParent = false,
  } = options;
  
  if (!path || typeof path !== 'string') {
    return null;
  }
  
  // Normalize slashes
  let normalized = path.replace(/\\/g, '/');
  
  // Check for null bytes
  if (normalized.includes('\0')) {
    return null;
  }
  
  // Check for parent directory references
  if (!allowParent && PATH_TRAVERSAL_PATTERN.test(normalized)) {
    return null;
  }
  
  // Check absolute vs relative
  const isAbsolute = ABSOLUTE_PATH_PATTERN.test(normalized);
  
  if (isAbsolute && !allowAbsolute) {
    return null;
  }
  
  if (!isAbsolute && !allowRelative) {
    return null;
  }
  
  // Resolve path
  try {
    const path = require('node:path');
    const resolved = isAbsolute
      ? path.resolve(normalized)
      : path.resolve(basePath, normalized);
    
    // Ensure resolved path is within base path
    if (!resolved.startsWith(basePath)) {
      return null;
    }
    
    return resolved;
  } catch {
    return null;
  }
}

// =============================================================================
// STRING UTILITIES
// =============================================================================

/**
 * Options for safe truncation.
 */
export interface TruncateOptions {
  /** Ellipsis string. Default: '...' */
  ellipsis?: string;
  /** Preserve whole words. Default: true */
  preserveWords?: boolean;
  /** Position to truncate from ('end', 'middle', 'start'). Default: 'end' */
  position?: 'end' | 'middle' | 'start';
}

/**
 * Safely truncates strings with options.
 * 
 * @param value - Value to truncate
 * @param maxLength - Maximum length
 * @param options - Truncation options
 * @returns Truncated string
 * 
 * @example
 * ```typescript
 * safeTruncate('This is a very long string', 10);
 * // 'This is...'
 * 
 * safeTruncate('LongWordThatShouldBeTruncated', 10, {
 *   preserveWords: false
 * });
 * // 'LongWordT...'
 * ```
 */
export function safeTruncate(
  value: unknown,
  maxLength: number,
  options: TruncateOptions = {}
): string {
  const {
    ellipsis = '...',
    preserveWords = true,
    position = 'end',
  } = options;
  
  // Convert to string
  const str = String(value || '');
  
  if (str.length <= maxLength) {
    return str;
  }
  
  const ellipsisLength = ellipsis.length;
  const availableLength = maxLength - ellipsisLength;
  
  if (availableLength <= 0) {
    return ellipsis.substring(0, maxLength);
  }
  
  switch (position) {
    case 'start':
      return ellipsis + str.substring(str.length - availableLength);
      
    case 'middle': {
      const halfLength = Math.floor(availableLength / 2);
      const start = str.substring(0, halfLength);
      const end = str.substring(str.length - (availableLength - halfLength));
      return start + ellipsis + end;
    }
    
    case 'end':
    default: {
      let truncated = str.substring(0, availableLength);
      
      // Preserve words if requested
      if (preserveWords) {
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > 0 && lastSpace > availableLength * 0.8) {
          truncated = truncated.substring(0, lastSpace);
        }
      }
      
      return truncated + ellipsis;
    }
  }
}

/**
 * Options for whitespace normalization.
 */
export interface NormalizeWhitespaceOptions {
  /** Preserve newlines. Default: false */
  preserveNewlines?: boolean;
  /** Collapse duplicate whitespace. Default: true */
  collapseDuplicates?: boolean;
  /** Trim start and end. Default: true */
  trim?: boolean;
}

/**
 * Normalizes whitespace and control characters.
 * 
 * @param text - Text to normalize
 * @param options - Normalization options
 * @returns Normalized text
 * 
 * @example
 * ```typescript
 * normalizeWhitespace('  Hello\n\n  world  \t !  ');
 * // 'Hello world !'
 * 
 * normalizeWhitespace('Line 1\n\nLine 2', {
 *   preserveNewlines: true
 * });
 * // 'Line 1\nLine 2'
 * ```
 */
export function normalizeWhitespace(
  text: string,
  options: NormalizeWhitespaceOptions = {}
): string {
  const {
    preserveNewlines = false,
    collapseDuplicates = true,
    trim = true,
  } = options;
  
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  let result = text;
  
  // Remove control characters (except newlines/tabs)
  // eslint-disable-next-line no-control-regex
  result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  if (preserveNewlines) {
    // Normalize line endings
    result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    if (collapseDuplicates) {
      // Collapse multiple newlines
      result = result.replace(/\n{3,}/g, '\n\n');
      // Collapse spaces/tabs on each line
      result = result.split('\n').map(line => 
        line.replace(/[ \t]+/g, ' ').trim()
      ).join('\n');
    }
  } else {
    // Replace all whitespace with spaces
    result = result.replace(/\s+/g, ' ');
  }
  
  if (trim) {
    result = result.trim();
  }
  
  return result;
}

/**
 * Internal helper to normalize whitespace in a string.
 */
function normalizeWhitespaceString(str: string): string {
  return str
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '');
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Gets the type of a value.
 */
function getType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}