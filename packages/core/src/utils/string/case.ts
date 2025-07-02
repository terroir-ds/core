/**
 * @module @utils/string/case
 * 
 * String case conversion utilities.
 * 
 * Provides functions for converting between different string cases
 * (camelCase, PascalCase, snake_case, kebab-case, etc.). All functions
 * handle edge cases like acronyms, numbers, and special characters.
 * 
 * @example
 * ```typescript
 * import { camelCase, pascalCase, snakeCase } from '@utils/string/case';
 * 
 * camelCase('hello-world'); // 'helloWorld'
 * pascalCase('hello_world'); // 'HelloWorld'
 * snakeCase('helloWorld'); // 'hello_world'
 * ```
 */

// =============================================================================
// WORD SPLITTING
// =============================================================================

/**
 * Splits a string into words, handling various delimiters and cases.
 * 
 * @param str - String to split
 * @returns Array of words
 * 
 * @example
 * ```typescript
 * splitWords('helloWorld'); // ['hello', 'World']
 * splitWords('hello-world'); // ['hello', 'world']
 * splitWords('hello_world'); // ['hello', 'world']
 * splitWords('HelloWORLD'); // ['Hello', 'WORLD']
 * splitWords('hello123world'); // ['hello', '123', 'world']
 * ```
 */
export function splitWords(str: string): string[] {
  if (!str) return [];
  
  // Replace common delimiters with spaces
  let processed = str
    .replace(/[-_.@]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Split on transitions between different character types
  const words: string[] = [];
  let currentWord = '';
  let prevType: 'upper' | 'lower' | 'digit' | 'other' | null = null;
  
  for (let i = 0; i < processed.length; i++) {
    const char = processed[i];
    if (!char) continue; // Guard against undefined
    
    let currentType: 'upper' | 'lower' | 'digit' | 'other';
    
    if (char === ' ') {
      if (currentWord) {
        words.push(currentWord);
        currentWord = '';
      }
      prevType = null;
      continue;
    } else if (/[A-Z]/.test(char)) {
      currentType = 'upper';
    } else if (/[a-z]/.test(char)) {
      currentType = 'lower';
    } else if (/[0-9]/.test(char)) {
      currentType = 'digit';
    } else {
      currentType = 'other';
    }
    
    // Determine if we should start a new word
    if (prevType !== null && (
      // Transition from lowercase to uppercase (camelCase)
      (prevType === 'lower' && currentType === 'upper') ||
      // Transition from letter to digit or vice versa
      (prevType !== 'digit' && currentType === 'digit') ||
      (prevType === 'digit' && currentType !== 'digit') ||
      // Transition from uppercase to lowercase (but keep consecutive uppercase together)
      (prevType === 'upper' && currentType === 'lower' && i > 1 && processed[i - 2] !== undefined && processed[i - 2] && /[A-Z]/.test(processed[i - 2] as string))
    )) {
      if (currentWord) {
        // Special case: if transitioning from uppercase to lowercase, 
        // include the last uppercase letter with the lowercase word
        if (prevType === 'upper' && currentType === 'lower' && currentWord.length > 1) {
          const lastChar = currentWord[currentWord.length - 1];
          words.push(currentWord.slice(0, -1));
          currentWord = lastChar || '';
        } else {
          words.push(currentWord);
          currentWord = '';
        }
      }
    }
    
    currentWord += char;
    prevType = currentType;
  }
  
  if (currentWord) {
    words.push(currentWord);
  }
  
  return words.filter(word => word.length > 0);
}

// =============================================================================
// CASE CONVERSIONS
// =============================================================================

/**
 * Converts a string to camelCase.
 * 
 * @param str - String to convert
 * @returns camelCase string
 * 
 * @example
 * ```typescript
 * camelCase('hello world'); // 'helloWorld'
 * camelCase('Hello-World'); // 'helloWorld'
 * camelCase('__hello_world__'); // 'helloWorld'
 * camelCase('XMLHttpRequest'); // 'xmlHttpRequest'
 * ```
 */
export function camelCase(str: string): string {
  const words = splitWords(str);
  if (words.length === 0) return '';
  
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index === 0) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}

/**
 * Converts a string to PascalCase (UpperCamelCase).
 * 
 * @param str - String to convert
 * @returns PascalCase string
 * 
 * @example
 * ```typescript
 * pascalCase('hello world'); // 'HelloWorld'
 * pascalCase('hello-world'); // 'HelloWorld'
 * pascalCase('__hello_world__'); // 'HelloWorld'
 * pascalCase('XMLHttpRequest'); // 'XmlHttpRequest'
 * ```
 */
export function pascalCase(str: string): string {
  const words = splitWords(str);
  if (words.length === 0) return '';
  
  return words
    .map(word => {
      const lower = word.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}

/**
 * Converts a string to snake_case.
 * 
 * @param str - String to convert
 * @param uppercase - Use UPPER_SNAKE_CASE. Default: false
 * @returns snake_case string
 * 
 * @example
 * ```typescript
 * snakeCase('hello world'); // 'hello_world'
 * snakeCase('helloWorld'); // 'hello_world'
 * snakeCase('Hello-World'); // 'hello_world'
 * snakeCase('Hello World', true); // 'HELLO_WORLD'
 * ```
 */
export function snakeCase(str: string, uppercase = false): string {
  const words = splitWords(str);
  if (words.length === 0) return '';
  
  const joined = words
    .map(word => word.toLowerCase())
    .join('_');
  
  return uppercase ? joined.toUpperCase() : joined;
}

/**
 * Converts a string to kebab-case.
 * 
 * @param str - String to convert
 * @returns kebab-case string
 * 
 * @example
 * ```typescript
 * kebabCase('hello world'); // 'hello-world'
 * kebabCase('helloWorld'); // 'hello-world'
 * kebabCase('Hello World'); // 'hello-world'
 * kebabCase('__hello_world__'); // 'hello-world'
 * ```
 */
export function kebabCase(str: string): string {
  const words = splitWords(str);
  if (words.length === 0) return '';
  
  return words
    .map(word => word.toLowerCase())
    .join('-');
}

/**
 * Converts a string to Title Case.
 * 
 * @param str - String to convert
 * @param allWords - Capitalize all words (true) or use smart title case (false). Default: false
 * @returns Title Case string
 * 
 * @example
 * ```typescript
 * titleCase('hello world'); // 'Hello World'
 * titleCase('the quick brown fox'); // 'The Quick Brown Fox'
 * titleCase('the quick brown fox', false); // 'The Quick Brown Fox' (smart)
 * ```
 */
export function titleCase(str: string, allWords = true): string {
  // Common words that shouldn't be capitalized in smart title case
  const minorWords = new Set([
    'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from',
    'in', 'into', 'nor', 'of', 'on', 'or', 'so', 'the', 'to',
    'up', 'with', 'yet'
  ]);
  
  const words = str.toLowerCase().split(/\s+/);
  if (words.length === 0) return '';
  
  return words
    .map((word, index) => {
      // Always capitalize first and last words
      if (index === 0 || index === words.length - 1 || allWords) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      
      // In smart mode, don't capitalize minor words
      if (!allWords && minorWords.has(word)) {
        return word;
      }
      
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Converts a string to CONSTANT_CASE.
 * 
 * @param str - String to convert
 * @returns CONSTANT_CASE string
 * 
 * @example
 * ```typescript
 * constantCase('hello world'); // 'HELLO_WORLD'
 * constantCase('helloWorld'); // 'HELLO_WORLD'
 * constantCase('Hello-World'); // 'HELLO_WORLD'
 * ```
 */
export function constantCase(str: string): string {
  return snakeCase(str, true);
}

/**
 * Converts a string to dot.case.
 * 
 * @param str - String to convert
 * @returns dot.case string
 * 
 * @example
 * ```typescript
 * dotCase('hello world'); // 'hello.world'
 * dotCase('helloWorld'); // 'hello.world'
 * dotCase('Hello-World'); // 'hello.world'
 * ```
 */
export function dotCase(str: string): string {
  const words = splitWords(str);
  if (words.length === 0) return '';
  
  return words
    .map(word => word.toLowerCase())
    .join('.');
}

/**
 * Converts a string to path/case.
 * 
 * @param str - String to convert
 * @returns path/case string
 * 
 * @example
 * ```typescript
 * pathCase('hello world'); // 'hello/world'
 * pathCase('helloWorld'); // 'hello/world'
 * pathCase('Hello-World'); // 'hello/world'
 * ```
 */
export function pathCase(str: string): string {
  const words = splitWords(str);
  if (words.length === 0) return '';
  
  return words
    .map(word => word.toLowerCase())
    .join('/');
}

/**
 * Converts a string to Sentence case.
 * 
 * @param str - String to convert
 * @returns Sentence case string
 * 
 * @example
 * ```typescript
 * sentenceCase('hello world'); // 'Hello world'
 * sentenceCase('HELLO WORLD'); // 'Hello world'
 * sentenceCase('hello. world'); // 'Hello. World'
 * ```
 */
export function sentenceCase(str: string): string {
  if (!str) return '';
  
  // Split by sentence endings
  const sentences = str.toLowerCase().split(/([.!?]+\s*)/);
  
  return sentences
    .map((part, index) => {
      // Skip punctuation parts
      if (index % 2 === 1) return part;
      
      // Capitalize first letter of sentence
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Checks if a string is in camelCase.
 * 
 * @param str - String to check
 * @returns True if string is in camelCase
 */
export function isCamelCase(str: string): boolean {
  return /^[a-z][a-zA-Z0-9]*$/.test(str);
}

/**
 * Checks if a string is in PascalCase.
 * 
 * @param str - String to check
 * @returns True if string is in PascalCase
 */
export function isPascalCase(str: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(str);
}

/**
 * Checks if a string is in snake_case.
 * 
 * @param str - String to check
 * @returns True if string is in snake_case
 */
export function isSnakeCase(str: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(str);
}

/**
 * Checks if a string is in kebab-case.
 * 
 * @param str - String to check
 * @returns True if string is in kebab-case
 */
export function isKebabCase(str: string): boolean {
  return /^[a-z][a-z0-9-]*$/.test(str);
}

/**
 * Checks if a string is in CONSTANT_CASE.
 * 
 * @param str - String to check
 * @returns True if string is in CONSTANT_CASE
 */
export function isConstantCase(str: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(str);
}