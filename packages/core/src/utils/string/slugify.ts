/**
 * @module @utils/string/slugify
 * 
 * URL-safe string utilities for creating slugs.
 * 
 * Provides functions for converting strings to URL-safe slugs with
 * proper handling of Unicode characters, special characters, and
 * various customization options.
 * 
 * @example
 * ```typescript
 * import { slugify, createSlugifier } from '@utils/string/slugify';
 * 
 * slugify('Hello World!'); // 'hello-world'
 * slugify('Café & Restaurant'); // 'cafe-restaurant'
 * slugify('Åpfel über München'); // 'apfel-uber-munchen'
 * ```
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Options for slug generation.
 */
export interface SlugifyOptions {
  /** Separator character. Default: '-' */
  separator?: string;
  /** Convert to lowercase. Default: true */
  lowercase?: boolean;
  /** Remove special characters. Default: true */
  strict?: boolean;
  /** Custom character replacements */
  replacements?: Record<string, string>;
  /** Maximum length of the slug */
  maxLength?: number;
  /** Locale for string comparison. Default: 'en' */
  locale?: string;
  /** Trim separators from start/end. Default: true */
  trim?: boolean;
}

// =============================================================================
// CHARACTER MAPPINGS
// =============================================================================

/**
 * Default character replacements for common accented characters.
 */
const DEFAULT_REPLACEMENTS: Record<string, string> = {
  // Latin characters
  'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Æ': 'AE',
  'Ç': 'C', 'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E', 'Ì': 'I', 'Í': 'I',
  'Î': 'I', 'Ï': 'I', 'Ð': 'D', 'Ñ': 'N', 'Ò': 'O', 'Ó': 'O', 'Ô': 'O',
  'Õ': 'O', 'Ö': 'O', 'Ø': 'O', 'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
  'Ý': 'Y', 'Þ': 'TH', 'ß': 'ss',
  'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae',
  'ç': 'c', 'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e', 'ì': 'i', 'í': 'i',
  'î': 'i', 'ï': 'i', 'ð': 'd', 'ñ': 'n', 'ò': 'o', 'ó': 'o', 'ô': 'o',
  'õ': 'o', 'ö': 'o', 'ø': 'o', 'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
  'ý': 'y', 'þ': 'th', 'ÿ': 'y',
  
  // Extended Latin
  'Ā': 'A', 'ā': 'a', 'Ă': 'A', 'ă': 'a', 'Ą': 'A', 'ą': 'a', 'Ć': 'C',
  'ć': 'c', 'Ĉ': 'C', 'ĉ': 'c', 'Ċ': 'C', 'ċ': 'c', 'Č': 'C', 'č': 'c',
  'Ď': 'D', 'ď': 'd', 'Đ': 'D', 'đ': 'd', 'Ē': 'E', 'ē': 'e', 'Ĕ': 'E',
  'ĕ': 'e', 'Ė': 'E', 'ė': 'e', 'Ę': 'E', 'ę': 'e', 'Ě': 'E', 'ě': 'e',
  'Ĝ': 'G', 'ĝ': 'g', 'Ğ': 'G', 'ğ': 'g', 'Ġ': 'G', 'ġ': 'g', 'Ģ': 'G',
  'ģ': 'g', 'Ĥ': 'H', 'ĥ': 'h', 'Ħ': 'H', 'ħ': 'h', 'Ĩ': 'I', 'ĩ': 'i',
  'Ī': 'I', 'ī': 'i', 'Ĭ': 'I', 'ĭ': 'i', 'Į': 'I', 'į': 'i', 'İ': 'I',
  'ı': 'i', 'Ĳ': 'IJ', 'ĳ': 'ij', 'Ĵ': 'J', 'ĵ': 'j', 'Ķ': 'K', 'ķ': 'k',
  'ĸ': 'k', 'Ĺ': 'L', 'ĺ': 'l', 'Ļ': 'L', 'ļ': 'l', 'Ľ': 'L', 'ľ': 'l',
  'Ŀ': 'L', 'ŀ': 'l', 'Ł': 'L', 'ł': 'l', 'Ń': 'N', 'ń': 'n',
  'Ś': 'S', 'ś': 's', 'Ź': 'Z', 'ź': 'z', 'Ż': 'Z', 'ż': 'z',
  
  // Currency and symbols
  '€': 'euro', '$': 'dollar', '£': 'pound', '¥': 'yen', '¢': 'cent',
  '©': 'c', '®': 'r', '™': 'tm', '°': 'deg',
  
  // Mathematical symbols
  '×': 'x', '÷': 'div', '±': 'plus-minus', '≤': 'lte', '≥': 'gte',
  '≠': 'ne', '≈': 'approx', '∞': 'infinity',
  
  // Common symbols
  '&': 'and', '@': 'at', '#': 'hash', '%': 'percent',
  '+': 'plus', '=': 'equals', '<': 'lt', '>': 'gt',
  
  // Quotes and dashes
  '"': '', "'": '', '`': '', '\u201C': '', '\u201D': '',
  '–': '-', '—': '-', '…': '...',
};

/**
 * Language-specific character mappings.
 */
const LANGUAGE_REPLACEMENTS: Record<string, Record<string, string>> = {
  de: {
    'Ä': 'Ae', 'ä': 'ae', 'Ö': 'Oe', 'ö': 'oe', 'Ü': 'Ue', 'ü': 'ue',
    'ß': 'ss'
  },
  es: {
    'Ñ': 'N', 'ñ': 'n'
  },
  fr: {
    'Ç': 'C', 'ç': 'c'
  },
  pl: {
    'Ą': 'A', 'ą': 'a', 'Ć': 'C', 'ć': 'c', 'Ę': 'E', 'ę': 'e',
    'Ł': 'L', 'ł': 'l', 'Ń': 'N', 'ń': 'n', 'Ó': 'O', 'ó': 'o',
    'Ś': 'S', 'ś': 's', 'Ź': 'Z', 'ź': 'z', 'Ż': 'Z', 'ż': 'z'
  },
  ru: {
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E',
    'Ё': 'Yo', 'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K',
    'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R',
    'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts',
    'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '',
    'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e',
    'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k',
    'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
    'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
    'э': 'e', 'ю': 'yu', 'я': 'ya'
  },
  ar: {
    'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h',
    'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's',
    'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': '',
    'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm',
    'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y'
  }
};

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Converts a string to a URL-safe slug.
 * 
 * @param str - String to slugify
 * @param options - Slugify options
 * @returns URL-safe slug
 * 
 * @example
 * ```typescript
 * slugify('Hello World!'); // 'hello-world'
 * slugify('Café & Restaurant'); // 'cafe-restaurant'
 * slugify('Multiple   Spaces'); // 'multiple-spaces'
 * slugify('Åpfel über München', { locale: 'de' }); // 'aepfel-ueber-muenchen'
 * slugify('Very Long Title That Exceeds Limit', { maxLength: 20 }); // 'very-long-title-that'
 * ```
 */
export function slugify(str: string, options: SlugifyOptions = {}): string {
  const {
    separator = '-',
    lowercase = true,
    strict = true,
    replacements = {},
    maxLength,
    locale = 'en',
    trim = true
  } = options;

  if (!str) return '';

  let result = str;

  // Apply custom replacements first
  for (const [from, to] of Object.entries(replacements)) {
    result = result.replace(new RegExp(escapeRegExp(from), 'g'), to);
  }

  // Apply language-specific replacements
  const langReplacements = LANGUAGE_REPLACEMENTS[locale] || {};
  for (const [from, to] of Object.entries(langReplacements)) {
    result = result.replace(new RegExp(escapeRegExp(from), 'g'), to);
  }

  // Apply default character replacements
  if (strict) {
    // In strict mode, replace all mapped characters
    for (const [from, to] of Object.entries(DEFAULT_REPLACEMENTS)) {
      result = result.replace(new RegExp(escapeRegExp(from), 'g'), to);
    }
  } else {
    // In non-strict mode, only replace symbols and keep accented letters
    const symbolReplacements = {
      // Currency and symbols
      '€': 'euro', '$': 'dollar', '£': 'pound', '¥': 'yen', '¢': 'cent',
      '©': 'c', '®': 'r', '™': 'tm', '°': 'deg',
      // Mathematical symbols
      '×': 'x', '÷': 'div', '±': 'plus-minus', '≤': 'lte', '≥': 'gte',
      '≠': 'ne', '≈': 'approx', '∞': 'infinity',
      // Common symbols
      '&': 'and', '@': 'at', '#': 'hash', '%': 'percent',
      '+': 'plus', '=': 'equals', '<': 'lt', '>': 'gt',
      // Quotes and dashes
      '"': '', "'": '', '`': '', '\u201C': '', '\u201D': '',
      '–': '-', '—': '-', '…': '...',
    };
    for (const [from, to] of Object.entries(symbolReplacements)) {
      result = result.replace(new RegExp(escapeRegExp(from), 'g'), to);
    }
  }

  // Convert to lowercase if requested
  if (lowercase) {
    result = result.toLowerCase();
  }

  // Replace non-alphanumeric characters with separator
  if (strict) {
    // In strict mode, only allow ASCII alphanumeric
    result = result.replace(/[^a-zA-Z0-9]+/g, separator);
  } else {
    // More permissive: allow Unicode letters, numbers, hyphens and underscores
    result = result.replace(/[^\p{L}\p{N}\-_]+/gu, separator);
  }

  // Replace multiple consecutive separators with single separator
  if (separator) {
    const separatorRegex = new RegExp(`\\${separator}+`, 'g');
    result = result.replace(separatorRegex, separator);
  }

  // Trim separators from start and end
  if (trim && separator) {
    const trimRegex = new RegExp(`^\\${separator}+|\\${separator}+$`, 'g');
    result = result.replace(trimRegex, '');
  }

  // Apply maximum length if specified
  if (maxLength && result.length > maxLength) {
    // Store the full string before truncation to check what comes after
    const fullString = result;
    result = result.substring(0, maxLength);
    
    // Check if we truncated in the middle of a word
    // by seeing if the next character after truncation is not a separator
    const nextChar = fullString[maxLength];
    const truncatedMidWord = nextChar && nextChar !== separator;
    
    // If we truncated in the middle of a word, remove the partial word
    if (truncatedMidWord && separator && result.includes(separator)) {
      const lastSeparatorIndex = result.lastIndexOf(separator);
      if (lastSeparatorIndex > 0) {
        result = result.substring(0, lastSeparatorIndex);
      }
    }
    
    // Trim separator from end if present
    if (trim && separator && result.endsWith(separator)) {
      result = result.replace(new RegExp(`\\${separator}+$`), '');
    }
  }

  return result;
}

/**
 * Creates a custom slugifier function with preset options.
 * 
 * @param options - Default slugify options
 * @returns Slugifier function
 * 
 * @example
 * ```typescript
 * const germanSlugify = createSlugifier({
 *   locale: 'de',
 *   maxLength: 50,
 *   separator: '_'
 * });
 * 
 * germanSlugify('Schöne Grüße'); // 'schoene_gruesse'
 * ```
 */
export function createSlugifier(options: SlugifyOptions): (str: string) => string {
  return (str: string) => slugify(str, options);
}

/**
 * Creates a URL-safe filename from a string.
 * 
 * @param filename - Original filename
 * @param options - Slugify options (separator defaults to '-')
 * @returns Safe filename
 * 
 * @example
 * ```typescript
 * safeFilename('My Document (Final).pdf'); // 'my-document-final.pdf'
 * safeFilename('Résumé & CV.docx'); // 'resume-cv.docx'
 * safeFilename('File with "quotes".txt'); // 'file-with-quotes.txt'
 * ```
 */
export function safeFilename(filename: string, options: SlugifyOptions = {}): string {
  if (!filename) return '';

  // Separate name and extension
  const lastDotIndex = filename.lastIndexOf('.');
  let name = filename;
  let extension = '';

  if (lastDotIndex > 0 && lastDotIndex < filename.length - 1) {
    name = filename.substring(0, lastDotIndex);
    extension = filename.substring(lastDotIndex + 1);
  }

  // Slugify the extension (but keep it simple)
  const safeExtension = extension
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  // Calculate max length for name if maxLength is specified
  let nameOptions = { separator: '-', ...options };
  if (options.maxLength && safeExtension) {
    // Reserve space for dot and extension
    nameOptions.maxLength = options.maxLength - safeExtension.length - 1;
    if (nameOptions.maxLength < 1) {
      nameOptions.maxLength = 1; // At least one character for name
    }
  }

  // Slugify the name part
  const safeName = slugify(name, nameOptions);

  return safeExtension ? `${safeName}.${safeExtension}` : safeName;
}

/**
 * Generates a unique slug by appending a number if the slug already exists.
 * 
 * @param str - String to slugify
 * @param existsCheck - Function to check if slug exists
 * @param options - Slugify options
 * @returns Unique slug
 * 
 * @example
 * ```typescript
 * const existingSlugs = new Set(['hello-world', 'hello-world-2']);
 * 
 * uniqueSlug('Hello World', slug => existingSlugs.has(slug));
 * // 'hello-world-3'
 * ```
 */
export function uniqueSlug(
  str: string,
  existsCheck: (slug: string) => boolean,
  options: SlugifyOptions = {}
): string {
  const baseSlug = slugify(str, options);
  
  if (!existsCheck(baseSlug)) {
    return baseSlug;
  }

  const separator = options.separator || '-';
  let counter = 2;
  let candidate = `${baseSlug}${separator}${counter}`;

  while (existsCheck(candidate)) {
    counter++;
    candidate = `${baseSlug}${separator}${counter}`;
  }

  return candidate;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Escapes special regex characters in a string.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Checks if a string is a valid slug (contains only allowed characters).
 * 
 * @param str - String to check
 * @param separator - Allowed separator character. Default: '-'
 * @param strict - Use strict character set (a-z, 0-9 only). Default: true
 * @returns True if string is a valid slug
 * 
 * @example
 * ```typescript
 * isValidSlug('hello-world'); // true
 * isValidSlug('hello_world', '_'); // true
 * isValidSlug('Hello World'); // false
 * isValidSlug('hello-world-'); // false (trailing separator)
 * ```
 */
export function isValidSlug(str: string, separator = '-', strict = true): boolean {
  if (!str) return false;

  const escapedSeparator = escapeRegExp(separator);
  
  // Check if starts or ends with separator
  if (str.startsWith(separator) || str.endsWith(separator)) {
    return false;
  }

  // Check if contains consecutive separators
  const consecutiveSeparators = new RegExp(`\\${escapedSeparator}{2,}`);
  if (consecutiveSeparators.test(str)) {
    return false;
  }

  // Check character set
  if (strict) {
    const validChars = new RegExp(`^[a-z0-9\\${escapedSeparator}]+$`);
    return validChars.test(str);
  } else {
    // Non-strict mode: lowercase Unicode letters, numbers, separator, hyphen, underscore
    // Note: Still case-sensitive, only lowercase allowed
    const validChars = new RegExp(`^[\\p{Ll}\\p{Lo}\\p{N}\\-_\\${escapedSeparator}]+$`, 'u');
    return validChars.test(str);
  }
}

/**
 * Reverses basic slug transformations to create a readable title.
 * 
 * @param slug - Slug to convert
 * @param separator - Separator used in slug. Default: '-'
 * @returns Readable title
 * 
 * @example
 * ```typescript
 * slugToTitle('hello-world'); // 'Hello World'
 * slugToTitle('my_great_post', '_'); // 'My Great Post'
 * slugToTitle('api-v2-docs'); // 'Api V2 Docs'
 * ```
 */
export function slugToTitle(slug: string, separator = '-'): string {
  if (!slug) return '';

  return slug
    .split(separator)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}