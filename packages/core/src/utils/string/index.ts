/**
 * @module @utils/string
 * 
 * Comprehensive string manipulation utilities for the Terroir Core Design System.
 * 
 * Provides a complete set of string utilities including:
 * - Text formatting (truncate, ellipsis, bytes, duration)
 * - Case conversion (camelCase, PascalCase, snake_case, kebab-case)
 * - URL-safe slugification with Unicode support
 * - Number and currency formatting
 * - Relative time formatting
 * 
 * All utilities are pure functions with no side effects and comprehensive
 * TypeScript support.
 * 
 * @example
 * ```typescript
 * import {
 *   truncate,
 *   formatBytes,
 *   camelCase,
 *   slugify
 * } from '@utils/string';
 * 
 * // Text formatting
 * truncate('Very long text...', { maxLength: 10 }); // 'Very lo...'
 * formatBytes(1536); // '1.5 KB'
 * 
 * // Case conversion
 * camelCase('hello-world'); // 'helloWorld'
 * 
 * // URL-safe slugs
 * slugify('Café & Restaurant'); // 'cafe-restaurant'
 * ```
 */

// Re-export all formatting utilities
export {
  // Text formatting
  truncate,
  ellipsis,
  type TruncateOptions,
  
  // Byte formatting
  formatBytes,
  type FormatBytesOptions,
  
  // Duration formatting
  formatDuration,
  formatRelativeTime,
  type FormatDurationOptions,
  type FormatRelativeTimeOptions,
  
  // Number formatting
  formatNumber,
  formatPercentage,
  formatCurrency,
  type FormatNumberOptions,
} from './formatting.js';

// Re-export all case conversion utilities
export {
  // Word splitting
  splitWords,
  
  // Case conversions
  camelCase,
  pascalCase,
  snakeCase,
  kebabCase,
  titleCase,
  constantCase,
  dotCase,
  pathCase,
  sentenceCase,
  
  // Case validation
  isCamelCase,
  isPascalCase,
  isSnakeCase,
  isKebabCase,
  isConstantCase,
} from './case.js';

// Re-export all slugify utilities
export {
  // Main slugify functions
  slugify,
  createSlugifier,
  safeFilename,
  uniqueSlug,
  
  // Validation and conversion
  isValidSlug,
  slugToTitle,
  
  // Types
  type SlugifyOptions,
} from './slugify.js';

// =============================================================================
// ADDITIONAL UTILITIES
// =============================================================================

/**
 * Removes leading and trailing whitespace from a string.
 * Enhanced version of String.prototype.trim with additional options.
 * 
 * @param str - String to trim
 * @param chars - Characters to trim. Default: whitespace
 * @returns Trimmed string
 * 
 * @example
 * ```typescript
 * trim('  hello  '); // 'hello'
 * trim('---hello---', '-'); // 'hello'
 * trim('  hello\n\t'); // 'hello'
 * ```
 */
export function trim(str: string, chars?: string): string {
  // Handle null/undefined
  if (str == null) return '';
  
  // Convert to string if needed
  str = String(str);
  
  // If no chars specified, use native trim
  if (chars === undefined) {
    return str.trim();
  }
  
  // If chars is empty string, don't trim anything
  if (chars === '') {
    return str;
  }
  
  // Escape special regex characters
  const escapedChars = chars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^[${escapedChars}]+|[${escapedChars}]+$`, 'g');
  return str.replace(regex, '');
}

/**
 * Pads a string to a specified length.
 * 
 * @param str - String to pad
 * @param length - Target length
 * @param padString - String to pad with. Default: ' '
 * @param padStart - Pad at start (true) or end (false). Default: false
 * @returns Padded string
 * 
 * @example
 * ```typescript
 * pad('hello', 10); // 'hello     '
 * pad('hello', 10, '0', true); // '00000hello'
 * pad('hello', 8, '.-'); // 'hello.-.'
 * ```
 */
export function pad(str: string, length: number, padString = ' ', padStart = false): string {
  // Handle null/undefined
  if (str == null) str = '';
  
  // Convert to string
  str = String(str);
  
  // If target length is not positive or already met, return original
  if (length <= 0 || str.length >= length) return str;
  
  // Handle empty pad string
  if (!padString) padString = ' ';
  
  const padLength = length - str.length;
  let padding = '';
  
  // Build padding string
  const fullRepeats = Math.floor(padLength / padString.length);
  const remainder = padLength % padString.length;
  
  padding = padString.repeat(fullRepeats);
  if (remainder > 0) {
    padding += padString.substring(0, remainder);
  }
  
  return padStart ? padding + str : str + padding;
}

/**
 * Repeats a string a specified number of times.
 * 
 * @param str - String to repeat
 * @param count - Number of times to repeat
 * @returns Repeated string
 * 
 * @example
 * ```typescript
 * repeat('hello', 3); // 'hellohellohello'
 * repeat('*', 5); // '*****'
 * repeat('abc', 0); // ''
 * ```
 */
export function repeat(str: string, count: number): string {
  if (!str || count <= 0) return '';
  return str.repeat(Math.floor(count));
}

/**
 * Reverses a string.
 * Properly handles Unicode surrogate pairs.
 * 
 * @param str - String to reverse
 * @returns Reversed string
 * 
 * @example
 * ```typescript
 * reverse('hello'); // 'olleh'
 * reverse('🌟⭐'); // '⭐🌟'
 * ```
 */
export function reverse(str: string): string {
  if (!str) return '';
  
  // Use Intl.Segmenter for proper grapheme cluster handling if available
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    const graphemes = Array.from(segmenter.segment(str), seg => seg.segment);
    return graphemes.reverse().join('');
  }
  
  // Fallback to Array.from for older environments
  return Array.from(str).reverse().join('');
}

/**
 * Capitalizes the first letter of a string.
 * 
 * @param str - String to capitalize
 * @param locale - Locale for case conversion. Default: 'en-US'
 * @returns Capitalized string
 * 
 * @example
 * ```typescript
 * capitalize('hello world'); // 'Hello world'
 * capitalize('HELLO'); // 'Hello'
 * capitalize(''); // ''
 * ```
 */
export function capitalize(str: string, locale = 'en-US'): string {
  if (!str) return str;
  
  const first = str.charAt(0).toLocaleUpperCase(locale);
  const rest = str.slice(1).toLocaleLowerCase(locale);
  return first + rest;
}

/**
 * Converts first letter to lowercase.
 * 
 * @param str - String to uncapitalize
 * @param locale - Locale for case conversion. Default: 'en-US'
 * @returns Uncapitalized string
 * 
 * @example
 * ```typescript
 * uncapitalize('Hello World'); // 'hello World'
 * uncapitalize('XML'); // 'xML'
 * ```
 */
export function uncapitalize(str: string, locale = 'en-US'): string {
  if (!str) return str;
  
  const first = str.charAt(0).toLocaleLowerCase(locale);
  const rest = str.slice(1);
  return first + rest;
}

/**
 * Counts the number of occurrences of a substring.
 * 
 * @param str - String to search in
 * @param searchStr - Substring to search for
 * @param caseSensitive - Case sensitive search. Default: true
 * @returns Number of occurrences
 * 
 * @example
 * ```typescript
 * count('hello world hello', 'hello'); // 2
 * count('Hello World', 'hello', false); // 1
 * count('abcabc', 'ab'); // 2
 * ```
 */
export function count(str: string, searchStr: string, caseSensitive = true): number {
  if (!str || !searchStr) return 0;
  
  const haystack = caseSensitive ? str : str.toLowerCase();
  const needle = caseSensitive ? searchStr : searchStr.toLowerCase();
  
  let count = 0;
  let position = 0;
  
  // Always count overlapping matches for consistency
  while (true) {
    const index = haystack.indexOf(needle, position);
    if (index === -1) break;
    count++;
    // Advance by 1 to find overlapping matches
    position = index + 1;
  }
  
  return count;
}

/**
 * Checks if a string contains only whitespace characters.
 * 
 * @param str - String to check
 * @returns True if string is empty or contains only whitespace
 * 
 * @example
 * ```typescript
 * isBlank(''); // true
 * isBlank('   '); // true
 * isBlank('\n\t'); // true
 * isBlank('hello'); // false
 * ```
 */
export function isBlank(str: string): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Checks if a string is empty (length 0).
 * 
 * @param str - String to check
 * @returns True if string is empty
 * 
 * @example
 * ```typescript
 * isEmpty(''); // true
 * isEmpty('   '); // false
 * isEmpty('hello'); // false
 * ```
 */
export function isEmpty(str: string): boolean {
  return str.length === 0;
}

/**
 * Gets the character at a specific index, with support for negative indices.
 * 
 * @param str - String to get character from
 * @param index - Index (can be negative)
 * @returns Character at index, or empty string if out of bounds
 * 
 * @example
 * ```typescript
 * charAt('hello', 0); // 'h'
 * charAt('hello', -1); // 'o'
 * charAt('hello', 10); // ''
 * ```
 */
export function charAt(str: string, index: number): string {
  if (!str) return '';
  
  // Use Intl.Segmenter for proper grapheme cluster handling if available
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    const graphemes = Array.from(segmenter.segment(str), seg => seg.segment);
    
    // Handle negative indices
    if (index < 0) {
      index = graphemes.length + index;
    }
    
    // Return empty string if out of bounds
    if (index < 0 || index >= graphemes.length) {
      return '';
    }
    
    return graphemes[index] || '';
  }
  
  // Fallback to Array.from for older environments
  const chars = Array.from(str);
  
  // Handle negative indices
  if (index < 0) {
    index = chars.length + index;
  }
  
  // Return empty string if out of bounds
  if (index < 0 || index >= chars.length) {
    return '';
  }
  
  return chars[index] || '';
}

/**
 * Swaps the case of each character in a string.
 * 
 * @param str - String to swap case
 * @returns String with swapped case
 * 
 * @example
 * ```typescript
 * swapCase('Hello World'); // 'hELLO wORLD'
 * swapCase('ABC123def'); // 'abc123DEF'
 * ```
 */
export function swapCase(str: string): string {
  if (!str) return str;
  
  return str
    .split('')
    .map(char => {
      const lower = char.toLowerCase();
      const upper = char.toUpperCase();
      return char === lower ? upper : lower;
    })
    .join('');
}

// =============================================================================
// STRING TEMPLATES
// =============================================================================

/**
 * Simple string template interpolation.
 * 
 * @param template - Template string with {{key}} placeholders
 * @param values - Object with replacement values
 * @param fallback - Default value for missing keys
 * @returns Interpolated string
 * 
 * @example
 * ```typescript
 * interpolate('Hello {{name}}!', { name: 'World' }); // 'Hello World!'
 * interpolate('{{greeting}} {{name}}', { name: 'Alice' }, 'Hi'); // 'Hi Alice'
 * ```
 */
export function interpolate(
  template: string,
  values: Record<string, unknown>,
  fallback = ''
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : fallback;
  });
}

/**
 * Advanced template function with custom delimiter and transformations.
 * 
 * @param template - Template string
 * @param values - Replacement values
 * @param options - Template options
 * @returns Interpolated string
 * 
 * @example
 * ```typescript
 * template('Hello ${name}!', { name: 'world' }, {
 *   delimiter: ['${', '}'],
 *   transform: (value) => value.toUpperCase()
 * }); // 'Hello WORLD!'
 * ```
 */
export function template(
  template: string,
  values: Record<string, unknown>,
  options: {
    delimiter?: [string, string];
    transform?: (value: unknown) => string;
    fallback?: string;
  } = {}
): string {
  const {
    delimiter = ['{{', '}}'],
    transform = String,
    fallback = ''
  } = options;
  
  const [open, close] = delimiter;
  const regex = new RegExp(
    `${escapeRegExp(open)}(\\w+)${escapeRegExp(close)}`,
    'g'
  );
  
  return template.replace(regex, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      return transform(values[key]);
    }
    // Transform the fallback as well if a transform is provided
    return transform ? transform(fallback) : fallback;
  });
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}