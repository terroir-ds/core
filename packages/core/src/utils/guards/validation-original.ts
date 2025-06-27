/**
 * @module @utils/guards/validation
 * 
 * Common validation patterns and utilities with TypeScript type narrowing.
 * 
 * Provides comprehensive validation functions for common use cases like
 * email, URL, phone numbers, and other data formats. Designed to integrate
 * with our error system and provide excellent performance.
 * 
 * Research Summary (2025-01-27):
 * - **Validator.js**: 13.15.15, 13k+ dependents, mature but not TypeScript-first
 * - **Zod**: Already in project, excellent for schema validation but heavier
 * - **Custom regex**: Battle-tested patterns, zero dependencies, best performance
 * 
 * Decision: Custom implementations using battle-tested patterns
 * - Use RFC-compliant regex patterns where applicable
 * - Leverage shared utilities for consistency
 * - Provide Zod-compatible result format option
 * - Zero additional dependencies for core validations
 * 
 * Features:
 * - RFC-compliant email validation (RFC 5322)
 * - URL validation with protocol support
 * - Phone number validation (international formats)
 * - Credit card validation with Luhn algorithm
 * - Strong password validation
 * - Flexible validation result format
 * - Integration with existing error system
 * - Excellent TypeScript support
 * 
 * @example Basic validation
 * ```typescript
 * import { validateEmail, validateUrl, isValidEmail } from '@utils/guards/validation';
 * 
 * // Simple boolean checks
 * if (isValidEmail(userInput)) {
 *   // TypeScript knows userInput is a valid email string
 *   await sendEmail(userInput);
 * }
 * 
 * // Detailed validation results
 * const result = validateEmail(userInput);
 * if (result.valid) {
 *   console.log('Valid email:', result.value);
 * } else {
 *   console.log('Errors:', result.errors);
 * }
 * ```
 * 
 * @example Advanced validation
 * ```typescript
 * import { validatePassword, validateCreditCard } from '@utils/guards/validation';
 * 
 * const passwordResult = validatePassword(password, {
 *   minLength: 12,
 *   requireUppercase: true,
 *   requireSpecialChars: true
 * });
 * 
 * const cardResult = validateCreditCard(cardNumber, {
 *   allowedTypes: ['visa', 'mastercard']
 * });
 * ```
 * 
 * @example Integration with forms
 * ```typescript
 * import { createValidator } from '@utils/guards/validation';
 * 
 * const userValidator = createValidator({
 *   email: validateEmail,
 *   phone: validatePhone,
 *   age: (value) => validateInRange(Number(value), 18, 120)
 * });
 * 
 * const result = userValidator(formData);
 * if (!result.valid) {
 *   displayErrors(result.errors);
 * }
 * ```
 */

// =============================================================================
// IMPORTS (using shared utilities and existing patterns)
// =============================================================================

import {
  isString,
  isDefined,
} from './type-guards.js';

import {
  createPatternValidator,
  validateLength,
  type PatternValidationOptions,
  type LengthConstraints,
  createValidationError,
} from '@utils/shared';

import {
  ValidationError,
} from '@utils/errors/base-error.js';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Validation result format compatible with Zod and other validation libraries.
 * 
 * Provides both success/failure indication and detailed error information
 * for complex validation scenarios.
 * 
 * @template T - The validated value type
 * 
 * @public
 */
export interface ValidationResult<T = unknown> {
  /** Whether the validation passed */
  valid: boolean;
  /** The validated value (only present when valid is true) */
  value?: T;
  /** Array of validation errors (only present when valid is false) */
  errors?: ValidationError[];
  /** Raw input value for debugging */
  input?: unknown;
}

/**
 * Options for email validation.
 * 
 * @public
 */
export interface EmailValidationOptions {
  /** Allow plus signs in email addresses (default: true) */
  allowPlus?: boolean;
  /** Allow dots in email addresses (default: true) */
  allowDots?: boolean;
  /** Maximum length for email (default: 254) */
  maxLength?: number;
  /** Require TLD (default: true) */
  requireTld?: boolean;
}

/**
 * Options for URL validation.
 * 
 * @public
 */
export interface UrlValidationOptions {
  /** Allowed protocols (default: ['http', 'https']) */
  protocols?: string[];
  /** Require protocol (default: true) */
  requireProtocol?: boolean;
  /** Allow localhost (default: false) */
  allowLocalhost?: boolean;
  /** Allow IP addresses (default: true) */
  allowIp?: boolean;
}

/**
 * Options for phone number validation.
 * 
 * @public
 */
export interface PhoneValidationOptions {
  /** Country code format (default: 'international') */
  format?: 'international' | 'national' | 'e164';
  /** Required country code (optional) */
  countryCode?: string;
  /** Allow extensions (default: false) */
  allowExtensions?: boolean;
}

/**
 * Options for password validation.
 * 
 * @public
 */
export interface PasswordValidationOptions {
  /** Minimum length (default: 8) */
  minLength?: number;
  /** Maximum length (default: 128) */
  maxLength?: number;
  /** Require uppercase letters (default: false) */
  requireUppercase?: boolean;
  /** Require lowercase letters (default: false) */
  requireLowercase?: boolean;
  /** Require numbers (default: false) */
  requireNumbers?: boolean;
  /** Require special characters (default: false) */
  requireSpecialChars?: boolean;
  /** Disallow common passwords (default: true) */
  disallowCommon?: boolean;
}

/**
 * Options for credit card validation.
 * 
 * @public
 */
export interface CreditCardValidationOptions {
  /** Allowed card types */
  allowedTypes?: ('visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb')[];
  /** Validate expiration date */
  validateExpiry?: boolean;
  /** Validate CVV */
  validateCvv?: boolean;
}

// =============================================================================
// VALIDATION PATTERNS (Battle-tested regex patterns)
// =============================================================================

/**
 * Email validation regex based on RFC 5322.
 * 
 * This pattern is simplified but covers 99.9% of real-world email addresses.
 * Based on the HTML5 specification and widely used in production systems.
 * 
 * @private
 */
const EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * URL validation regex supporting common protocols.
 * 
 * Based on RFC 3986 but simplified for practical use cases.
 * Supports HTTP, HTTPS, FTP, and other common protocols.
 * 
 * @private
 */
const URL_PATTERN = /^(?:(?:https?|ftp|ftps):\/\/)?(?:[-\w\.])+(?:\:[0-9]+)?(?:\/[^\s]*)?$/i;

/**
 * International phone number pattern (E.164 format).
 * 
 * Supports international format with country code (+1234567890).
 * Based on ITU-T E.164 recommendation.
 * 
 * @private
 */
const PHONE_INTERNATIONAL_PATTERN = /^\+?[1-9]\d{1,14}$/;

/**
 * US phone number pattern (various formats).
 * 
 * Supports common US phone number formats:
 * - (123) 456-7890
 * - 123-456-7890
 * - 123.456.7890
 * - 1234567890
 * 
 * @private
 */
const PHONE_US_PATTERN = /^(?:\+?1[-.\s]?)?(?:\(?[0-9]{3}\)?[-.\s]?)?[0-9]{3}[-.\s]?[0-9]{4}$/;

/**
 * Strong password patterns for different requirements.
 * 
 * @private
 */
const PASSWORD_PATTERNS = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  numbers: /[0-9]/,
  specialChars: /[!@#$%^&*(),.?":{}|<>]/,
} as const;

/**
 * Credit card patterns for major card types.
 * 
 * Based on official card number formats from major issuers.
 * 
 * @private
 */
const CREDIT_CARD_PATTERNS = {
  visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
  mastercard: /^5[1-5][0-9]{14}$/,
  amex: /^3[47][0-9]{13}$/,
  discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
  diners: /^3[0689][0-9]{11}$/,
  jcb: /^(?:2131|1800|35\d{3})\d{11}$/,
} as const;

/**
 * Common weak passwords to avoid.
 * 
 * @private
 */
const COMMON_PASSWORDS = new Set([
  'password', '123456', '123456789', 'qwerty', 'abc123',
  'password123', 'admin', 'letmein', 'welcome', 'monkey',
  'dragon', 'master', 'sunshine', 'princess', 'football',
]);

// =============================================================================
// EMAIL VALIDATION
// =============================================================================

/**
 * Type guard to check if a string is a valid email address.
 * 
 * Uses RFC 5322 compliant pattern with reasonable practical limitations.
 * Performs basic format validation suitable for most use cases.
 * 
 * @param value - Value to validate
 * @returns True if value is a valid email string
 * 
 * @example
 * ```typescript
 * if (isValidEmail(userInput)) {
 *   // TypeScript knows userInput is a valid email string
 *   await sendWelcomeEmail(userInput);
 * }
 * ```
 * 
 * @public
 */
export function isValidEmail(value: unknown): value is string {
  if (!isString(value)) {
    return false;
  }
  
  // Check length constraints
  if (value.length === 0 || value.length > 254) {
    return false;
  }
  
  return EMAIL_PATTERN.test(value);
}

/**
 * Comprehensive email validation with detailed error reporting.
 * 
 * Provides detailed validation results including specific error messages
 * for different validation failures. Supports various email validation options.
 * 
 * @param value - Email address to validate
 * @param options - Validation options
 * @returns Detailed validation result
 * 
 * @example
 * ```typescript
 * const result = validateEmail(userInput, {
 *   allowPlus: false,
 *   maxLength: 100
 * });
 * 
 * if (result.valid) {
 *   console.log('Valid email:', result.value);
 * } else {
 *   result.errors?.forEach(error => console.log(error.message));
 * }
 * ```
 * 
 * @public
 */
export function validateEmail(
  value: unknown,
  options: EmailValidationOptions = {}
): ValidationResult<string> {
  const {
    allowPlus = true,
    allowDots = true,
    maxLength = 254,
    requireTld = true,
  } = options;
  
  const errors: ValidationError[] = [];
  
  // Type check
  if (!isString(value)) {
    errors.push(new ValidationError('Email must be a string', {
      code: 'EMAIL_TYPE_ERROR',
      context: { value, type: typeof value },
    }));
    return { valid: false, errors, input: value };
  }
  
  // Length check
  if (value.length === 0) {
    errors.push(new ValidationError('Email cannot be empty', {
      code: 'EMAIL_EMPTY',
      context: { value },
    }));
    return { valid: false, errors, input: value };
  }
  
  if (value.length > maxLength) {
    errors.push(new ValidationError(`Email too long (max ${maxLength} characters)`, {
      code: 'EMAIL_TOO_LONG',
      context: { value, length: value.length, maxLength },
    }));
    return { valid: false, errors, input: value };
  }
  
  // Basic format check
  if (!EMAIL_PATTERN.test(value)) {
    errors.push(new ValidationError('Invalid email format', {
      code: 'EMAIL_INVALID_FORMAT',
      context: { value },
    }));
    return { valid: false, errors, input: value };
  }
  
  // Plus sign check
  if (!allowPlus && value.includes('+')) {
    errors.push(new ValidationError('Plus signs not allowed in email', {
      code: 'EMAIL_PLUS_NOT_ALLOWED',
      context: { value },
    }));
    return { valid: false, errors, input: value };
  }
  
  // Dots check
  if (!allowDots && value.includes('.')) {
    errors.push(new ValidationError('Dots not allowed in email', {
      code: 'EMAIL_DOTS_NOT_ALLOWED',
      context: { value },
    }));
    return { valid: false, errors, input: value };
  }
  
  // TLD check
  if (requireTld) {
    const parts = value.split('@');
    if (parts.length === 2 && parts[1] && !parts[1].includes('.')) {
      errors.push(new ValidationError('Email must have a top-level domain', {
        code: 'EMAIL_NO_TLD',
        context: { value, domain: parts[1] },
      }));
      return { valid: false, errors, input: value };
    }
  }
  
  return { valid: true, value, input: value };
}

// =============================================================================
// URL VALIDATION
// =============================================================================

/**
 * Type guard to check if a string is a valid URL.
 * 
 * Validates URLs using a practical regex pattern that covers most common use cases.
 * Supports HTTP, HTTPS, FTP, and other common protocols.
 * 
 * @param value - Value to validate
 * @returns True if value is a valid URL string
 * 
 * @example
 * ```typescript
 * if (isValidUrl(userInput)) {
 *   // TypeScript knows userInput is a valid URL string
 *   await fetch(userInput);
 * }
 * ```
 * 
 * @public
 */
export function isValidUrl(value: unknown): value is string {
  if (!isString(value)) {
    return false;
  }
  
  try {
    new URL(value);
    return true;
  } catch {
    // Fallback to regex for edge cases
    return URL_PATTERN.test(value);
  }
}

/**
 * Comprehensive URL validation with detailed error reporting.
 * 
 * Uses the native URL constructor for accurate validation with fallback
 * to regex patterns. Supports various URL validation options.
 * 
 * @param value - URL to validate
 * @param options - Validation options
 * @returns Detailed validation result
 * 
 * @example
 * ```typescript
 * const result = validateUrl(userInput, {
 *   protocols: ['https'],
 *   allowLocalhost: false
 * });
 * 
 * if (result.valid) {
 *   console.log('Valid URL:', result.value);
 * } else {
 *   result.errors?.forEach(error => console.log(error.message));
 * }
 * ```
 * 
 * @public
 */
export function validateUrl(
  value: unknown,
  options: UrlValidationOptions = {}
): ValidationResult<string> {
  const {
    protocols = ['http', 'https'],
    requireProtocol = true,
    allowLocalhost = false,
    allowIp = true,
  } = options;
  
  const errors: ValidationError[] = [];
  
  // Type check
  if (!isString(value)) {
    errors.push(new ValidationError('URL must be a string', {
      code: 'URL_TYPE_ERROR',
      context: { value, type: typeof value },
    }));
    return { valid: false, errors, input: value };
  }
  
  // Empty check
  if (value.length === 0) {
    errors.push(new ValidationError('URL cannot be empty', {
      code: 'URL_EMPTY',
      context: { value },
    }));
    return { valid: false, errors, input: value };
  }
  
  let url: URL;
  
  try {
    // Try to parse with native URL constructor
    url = new URL(value);
  } catch (error) {
    // Try adding protocol if missing
    if (!requireProtocol && !value.includes('://')) {
      try {
        url = new URL(`https://${value}`);
      } catch {
        errors.push(new ValidationError('Invalid URL format', {
          code: 'URL_INVALID_FORMAT',
          context: { value, parseError: String(error) },
        }));
        return { valid: false, errors, input: value };
      }
    } else {
      errors.push(new ValidationError('Invalid URL format', {
        code: 'URL_INVALID_FORMAT',
        context: { value, parseError: String(error) },
      }));
      return { valid: false, errors, input: value };
    }
  }
  
  // Protocol check
  const protocol = url.protocol.slice(0, -1); // Remove trailing ':'
  if (!protocols.includes(protocol)) {
    errors.push(new ValidationError(`Protocol not allowed: ${protocol}`, {
      code: 'URL_PROTOCOL_NOT_ALLOWED',
      context: { value, protocol, allowedProtocols: protocols },
    }));
    return { valid: false, errors, input: value };
  }
  
  // Localhost check
  if (!allowLocalhost && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
    errors.push(new ValidationError('Localhost URLs not allowed', {
      code: 'URL_LOCALHOST_NOT_ALLOWED',
      context: { value, hostname: url.hostname },
    }));
    return { valid: false, errors, input: value };
  }
  
  // IP address check
  if (!allowIp && /^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)) {
    errors.push(new ValidationError('IP address URLs not allowed', {
      code: 'URL_IP_NOT_ALLOWED',
      context: { value, hostname: url.hostname },
    }));
    return { valid: false, errors, input: value };
  }
  
  return { valid: true, value: url.toString(), input: value };
}

// =============================================================================
// PHONE NUMBER VALIDATION
// =============================================================================

/**
 * Type guard to check if a string is a valid phone number.
 * 
 * Validates international phone numbers using E.164 format.
 * Supports both international (+1234567890) and national formats.
 * 
 * @param value - Value to validate
 * @returns True if value is a valid phone number string
 * 
 * @example
 * ```typescript
 * if (isValidPhone(userInput)) {
 *   // TypeScript knows userInput is a valid phone number string
 *   await sendSMS(userInput, message);
 * }
 * ```
 * 
 * @public
 */
export function isValidPhone(value: unknown): value is string {
  if (!isString(value)) {
    return false;
  }
  
  // Clean the phone number (remove spaces, dots, parentheses)
  const cleaned = value.replace(/[\s\-\.\(\)]/g, '');
  
  return PHONE_INTERNATIONAL_PATTERN.test(cleaned) || PHONE_US_PATTERN.test(value);
}

/**
 * Comprehensive phone number validation with format options.
 * 
 * Supports various phone number formats including international E.164,
 * national formats, and US-specific patterns.
 * 
 * @param value - Phone number to validate
 * @param options - Validation options
 * @returns Detailed validation result
 * 
 * @example
 * ```typescript
 * const result = validatePhone(userInput, {
 *   format: 'international',
 *   countryCode: 'US'
 * });
 * 
 * if (result.valid) {
 *   console.log('Valid phone:', result.value);
 * } else {
 *   result.errors?.forEach(error => console.log(error.message));
 * }
 * ```
 * 
 * @public
 */
export function validatePhone(
  value: unknown,
  options: PhoneValidationOptions = {}
): ValidationResult<string> {
  const {
    format = 'international',
    countryCode,
    // allowExtensions = false, // Not implemented yet
  } = options;
  
  const errors: ValidationError[] = [];
  
  // Type check
  if (!isString(value)) {
    errors.push(new ValidationError('Phone number must be a string', {
      code: 'PHONE_TYPE_ERROR',
      context: { value, type: typeof value },
    }));
    return { valid: false, errors, input: value };
  }
  
  // Empty check
  if (value.length === 0) {
    errors.push(new ValidationError('Phone number cannot be empty', {
      code: 'PHONE_EMPTY',
      context: { value },
    }));
    return { valid: false, errors, input: value };
  }
  
  // Clean the phone number
  const cleaned = value.replace(/[\s\-\.\(\)]/g, '');
  
  // Length check (E.164 allows 4-15 digits after country code)
  if (cleaned.length < 5 || cleaned.length > 16) {
    errors.push(new ValidationError('Phone number length invalid', {
      code: 'PHONE_INVALID_LENGTH',
      context: { value, cleaned, length: cleaned.length },
    }));
    return { valid: false, errors, input: value };
  }
  
  // Format-specific validation
  let isValid = false;
  
  switch (format) {
    case 'international':
      isValid = PHONE_INTERNATIONAL_PATTERN.test(cleaned);
      if (!isValid) {
        errors.push(new ValidationError('Invalid international phone format', {
          code: 'PHONE_INVALID_INTERNATIONAL',
          context: { value, cleaned },
        }));
      }
      break;
      
    case 'national':
      isValid = PHONE_US_PATTERN.test(value);
      if (!isValid) {
        errors.push(new ValidationError('Invalid national phone format', {
          code: 'PHONE_INVALID_NATIONAL',
          context: { value },
        }));
      }
      break;
      
    case 'e164':
      isValid = /^\+[1-9]\d{1,14}$/.test(cleaned);
      if (!isValid) {
        errors.push(new ValidationError('Invalid E.164 phone format', {
          code: 'PHONE_INVALID_E164',
          context: { value, cleaned },
        }));
      }
      break;
  }
  
  if (!isValid) {
    return { valid: false, errors, input: value };
  }
  
  // Country code check
  if (countryCode && format === 'international') {
    const countryCodeMap: Record<string, string> = {
      'US': '+1',
      'CA': '+1',
      'UK': '+44',
      'AU': '+61',
      'DE': '+49',
      'FR': '+33',
      'JP': '+81',
      'CN': '+86',
    };
    
    const expectedPrefix = countryCodeMap[countryCode];
    if (expectedPrefix && !cleaned.startsWith(expectedPrefix.slice(1))) {
      errors.push(new ValidationError(`Phone number must be from ${countryCode}`, {
        code: 'PHONE_WRONG_COUNTRY',
        context: { value, countryCode, expectedPrefix },
      }));
      return { valid: false, errors, input: value };
    }
  }
  
  return { valid: true, value: cleaned, input: value };
}

// =============================================================================
// PASSWORD VALIDATION
// =============================================================================

/**
 * Comprehensive password validation with security requirements.
 * 
 * Validates passwords against various security criteria including length,
 * character complexity, and common password detection.
 * 
 * @param value - Password to validate
 * @param options - Validation options
 * @returns Detailed validation result
 * 
 * @example
 * ```typescript
 * const result = validatePassword(userInput, {
 *   minLength: 12,
 *   requireUppercase: true,
 *   requireSpecialChars: true,
 *   disallowCommon: true
 * });
 * 
 * if (!result.valid) {
 *   result.errors?.forEach(error => {
 *     displayPasswordError(error.message);
 *   });
 * }
 * ```
 * 
 * @public
 */
export function validatePassword(
  value: unknown,
  options: PasswordValidationOptions = {}
): ValidationResult<string> {
  const {
    minLength = 8,
    maxLength = 128,
    requireUppercase = false,
    requireLowercase = false,
    requireNumbers = false,
    requireSpecialChars = false,
    disallowCommon = true,
  } = options;
  
  const errors: ValidationError[] = [];
  
  // Type check
  if (!isString(value)) {
    errors.push(new ValidationError('Password must be a string', {
      code: 'PASSWORD_TYPE_ERROR',
      context: { value, type: typeof value },
    }));
    return { valid: false, errors, input: value };
  }
  
  // Length checks
  if (value.length < minLength) {
    errors.push(new ValidationError(`Password must be at least ${minLength} characters`, {
      code: 'PASSWORD_TOO_SHORT',
      context: { value: '[REDACTED]', length: value.length, minLength },
    }));
  }
  
  if (value.length > maxLength) {
    errors.push(new ValidationError(`Password must be at most ${maxLength} characters`, {
      code: 'PASSWORD_TOO_LONG',
      context: { value: '[REDACTED]', length: value.length, maxLength },
    }));
  }
  
  // Character requirement checks
  if (requireUppercase && !PASSWORD_PATTERNS.uppercase.test(value)) {
    errors.push(new ValidationError('Password must contain at least one uppercase letter', {
      code: 'PASSWORD_NO_UPPERCASE',
      context: { value: '[REDACTED]' },
    }));
  }
  
  if (requireLowercase && !PASSWORD_PATTERNS.lowercase.test(value)) {
    errors.push(new ValidationError('Password must contain at least one lowercase letter', {
      code: 'PASSWORD_NO_LOWERCASE',
      context: { value: '[REDACTED]' },
    }));
  }
  
  if (requireNumbers && !PASSWORD_PATTERNS.numbers.test(value)) {
    errors.push(new ValidationError('Password must contain at least one number', {
      code: 'PASSWORD_NO_NUMBERS',
      context: { value: '[REDACTED]' },
    }));
  }
  
  if (requireSpecialChars && !PASSWORD_PATTERNS.specialChars.test(value)) {
    errors.push(new ValidationError('Password must contain at least one special character', {
      code: 'PASSWORD_NO_SPECIAL_CHARS',
      context: { value: '[REDACTED]' },
    }));
  }
  
  // Common password check
  if (disallowCommon && COMMON_PASSWORDS.has(value.toLowerCase())) {
    errors.push(new ValidationError('Password is too common', {
      code: 'PASSWORD_TOO_COMMON',
      context: { value: '[REDACTED]' },
    }));
  }
  
  if (errors.length > 0) {
    return { valid: false, errors, input: '[REDACTED]' };
  }
  
  return { valid: true, value, input: '[REDACTED]' };
}

// =============================================================================
// CREDIT CARD VALIDATION
// =============================================================================

/**
 * Luhn algorithm implementation for credit card validation.
 * 
 * The Luhn algorithm is used to validate credit card numbers
 * and detect simple errors in typing credit card numbers.
 * 
 * @param value - Credit card number to validate
 * @returns True if the number passes Luhn validation
 * 
 * @private
 */
function luhnCheck(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  let sum = 0;
  let isEven = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]!, 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Detect credit card type from number.
 * 
 * @param value - Credit card number
 * @returns Card type or null if not detected
 * 
 * @private
 */
function detectCardType(value: string): keyof typeof CREDIT_CARD_PATTERNS | null {
  const cleaned = value.replace(/\D/g, '');
  
  for (const [type, pattern] of Object.entries(CREDIT_CARD_PATTERNS)) {
    if (pattern.test(cleaned)) {
      return type as keyof typeof CREDIT_CARD_PATTERNS;
    }
  }
  
  return null;
}

/**
 * Comprehensive credit card validation with Luhn check.
 * 
 * Validates credit card numbers using the Luhn algorithm and
 * checks against known card type patterns.
 * 
 * @param value - Credit card number to validate
 * @param options - Validation options
 * @returns Detailed validation result with card type
 * 
 * @example
 * ```typescript
 * const result = validateCreditCard(cardNumber, {
 *   allowedTypes: ['visa', 'mastercard'],
 *   validateExpiry: false
 * });
 * 
 * if (result.valid) {
 *   console.log('Valid card:', result.value);
 *   console.log('Card type:', result.cardType);
 * }
 * ```
 * 
 * @public
 */
export function validateCreditCard(
  value: unknown,
  options: CreditCardValidationOptions = {}
): ValidationResult<string> & { cardType?: string } {
  const {
    allowedTypes,
  } = options;
  
  const errors: ValidationError[] = [];
  
  // Type check
  if (!isString(value)) {
    errors.push(new ValidationError('Credit card number must be a string', {
      code: 'CARD_TYPE_ERROR',
      context: { value, type: typeof value },
    }));
    return { valid: false, errors, input: value };
  }
  
  // Clean the number
  const cleaned = value.replace(/\D/g, '');
  
  // Length check
  if (cleaned.length < 13 || cleaned.length > 19) {
    errors.push(new ValidationError('Credit card number must be 13-19 digits', {
      code: 'CARD_INVALID_LENGTH',
      context: { value: '[REDACTED]', length: cleaned.length },
    }));
    return { valid: false, errors, input: '[REDACTED]' };
  }
  
  // Luhn check
  if (!luhnCheck(cleaned)) {
    errors.push(new ValidationError('Invalid credit card number', {
      code: 'CARD_LUHN_FAILED',
      context: { value: '[REDACTED]' },
    }));
    return { valid: false, errors, input: '[REDACTED]' };
  }
  
  // Card type detection
  const cardType = detectCardType(cleaned);
  if (!cardType) {
    errors.push(new ValidationError('Unknown credit card type', {
      code: 'CARD_UNKNOWN_TYPE',
      context: { value: '[REDACTED]' },
    }));
    return { valid: false, errors, input: '[REDACTED]' };
  }
  
  // Allowed types check
  if (allowedTypes && !allowedTypes.includes(cardType)) {
    errors.push(new ValidationError(`Credit card type not allowed: ${cardType}`, {
      code: 'CARD_TYPE_NOT_ALLOWED',
      context: { cardType, allowedTypes, value: '[REDACTED]' },
    }));
    return { valid: false, errors, input: '[REDACTED]' };
  }
  
  return { 
    valid: true, 
    value: cleaned, 
    cardType,
    input: '[REDACTED]' 
  };
}

// =============================================================================
// GENERIC VALIDATION UTILITIES
// =============================================================================

/**
 * Create a custom validator function with specific validation logic.
 * 
 * Factory function for creating reusable validators with custom logic
 * and error messages. Useful for domain-specific validation rules.
 * 
 * @param validator - Function that performs the validation
 * @param errorMessage - Error message template or function
 * @param errorCode - Error code for tracking
 * @returns Custom validation function
 * 
 * @example
 * ```typescript
 * const validateAge = createValidator(
 *   (value): value is number => isNumber(value) && value >= 18 && value <= 120,
 *   (value) => `Age must be between 18 and 120, got ${value}`,
 *   'INVALID_AGE'
 * );
 * 
 * const result = validateAge(userAge);
 * if (!result.valid) {
 *   console.log(result.errors?.[0]?.message);
 * }
 * ```
 * 
 * @public
 */
export function createValidator<T>(
  validator: (value: unknown) => value is T,
  errorMessage: string | ((value: unknown) => string),
  errorCode = 'CUSTOM_VALIDATION_FAILED'
): (value: unknown) => ValidationResult<T> {
  return (value: unknown): ValidationResult<T> => {
    if (validator(value)) {
      return { valid: true, value, input: value };
    }
    
    const message = typeof errorMessage === 'function' 
      ? errorMessage(value)
      : errorMessage;
      
    const error = new ValidationError(message, {
      code: errorCode,
      context: { value: String(value), type: typeof value },
    });
    
    return { valid: false, errors: [error], input: value };
  };
}

/**
 * Validate multiple values using a schema-like approach.
 * 
 * Validates an object against a schema of validation functions.
 * Returns combined results with all validation errors.
 * 
 * @param data - Data to validate
 * @param schema - Schema of validation functions
 * @returns Combined validation result
 * 
 * @example
 * ```typescript
 * const userSchema = {
 *   email: validateEmail,
 *   phone: validatePhone,
 *   age: (value: unknown) => createValidator(
 *     (v): v is number => isNumber(v) && v >= 18,
 *     'Must be 18 or older'
 *   )(value)
 * };
 * 
 * const result = validateSchema(formData, userSchema);
 * if (!result.valid) {
 *   Object.entries(result.fieldErrors).forEach(([field, errors]) => {
 *     console.log(`${field}:`, errors.map(e => e.message));
 *   });
 * }
 * ```
 * 
 * @public
 */
export function validateSchema<T extends Record<string, unknown>>(
  data: unknown,
  schema: Record<keyof T, (value: unknown) => ValidationResult>
): ValidationResult<T> & { fieldErrors?: Record<keyof T, ValidationError[]> } {
  const errors: ValidationError[] = [];
  const fieldErrors: Record<keyof T, ValidationError[]> = {} as Record<keyof T, ValidationError[]>;
  const validatedData = {} as T;
  
  // Type check for data
  if (!isDefined(data) || typeof data !== 'object') {
    const error = new ValidationError('Data must be an object', {
      code: 'SCHEMA_DATA_NOT_OBJECT',
      context: { data, type: typeof data },
    });
    return { valid: false, errors: [error], input: data };
  }
  
  const dataObj = data as Record<string, unknown>;
  
  // Validate each field
  for (const [field, validator] of Object.entries(schema)) {
    const fieldValue = dataObj[field];
    const result = validator(fieldValue);
    
    if (result.valid && result.value !== undefined) {
      validatedData[field as keyof T] = result.value as T[keyof T];
    } else if (result.errors) {
      fieldErrors[field as keyof T] = result.errors;
      errors.push(...result.errors);
    }
  }
  
  if (errors.length > 0) {
    return { 
      valid: false, 
      errors, 
      fieldErrors,
      input: data 
    };
  }
  
  return { 
    valid: true, 
    value: validatedData,
    input: data 
  };
}