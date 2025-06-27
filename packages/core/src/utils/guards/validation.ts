/**
 * @module @utils/guards/validation
 * 
 * Common validation patterns and utilities with TypeScript type narrowing.
 * 
 * Provides comprehensive validation functions for common use cases like
 * email, URL, phone numbers, and other data formats. Designed to integrate
 * with our error system and provide excellent performance.
 * 
 * This refactored version uses shared utilities to reduce code duplication
 * while maintaining the same public API.
 */

// =============================================================================
// IMPORTS
// =============================================================================

import {
  isString,
  isDefined,
  isNumber,
} from './type-guards.js';

import {
  createPatternValidator,
  validateLength,
  validateRange,
  type PatternValidationOptions,
  type LengthConstraints,
  createValidationError,
  createValidationContext,
} from '@utils/shared';

import {
  ValidationError,
} from '@utils/errors/base-error.js';

// =============================================================================
// TYPES AND INTERFACES (Same as original)
// =============================================================================

export interface ValidationResult<T = unknown> {
  valid: boolean;
  value?: T;
  errors?: ValidationError[];
  input: unknown;
}

export interface EmailValidationOptions {
  allowPlus?: boolean;
  allowDots?: boolean;
  maxLength?: number;
  requireTld?: boolean;
}

export interface UrlValidationOptions {
  protocols?: string[];
  requireProtocol?: boolean;
  allowLocalhost?: boolean;
  allowIp?: boolean;
}

export interface PhoneValidationOptions {
  format?: 'international' | 'national' | 'e164';
  countryCode?: string;
  allowExtensions?: boolean;
}

export interface PasswordValidationOptions {
  minLength?: number;
  maxLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  disallowCommon?: boolean;
}

export interface CreditCardValidationOptions {
  allowedTypes?: ('visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb')[];
  validateExpiry?: boolean;
  validateCvv?: boolean;
}

// =============================================================================
// VALIDATION PATTERNS
// =============================================================================

const EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const URL_PATTERN = /^(?:(?:https?|ftp|ftps):\/\/)?(?:[-\w\.])+(?:\:[0-9]+)?(?:\/[^\s]*)?$/i;
const PHONE_INTERNATIONAL_PATTERN = /^\+?[1-9]\d{1,14}$/;
const PHONE_US_PATTERN = /^(?:\+?1[\s-]?)?\(?([2-9]\d{2})\)?[\s-]?([2-9]\d{2})[\s-]?(\d{4})$/;
const PHONE_EXTENSION_PATTERN = /^(.*?)(?:\s*(?:ext|x|extension)\.?\s*(\d+))?$/i;

// Card type patterns
const CARD_PATTERNS = {
  visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
  mastercard: /^(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}$/,
  amex: /^3[47][0-9]{13}$/,
  discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
  diners: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,
  jcb: /^(?:2131|1800|35\d{3})\d{11}$/,
};

// =============================================================================
// INTERNAL VALIDATORS USING SHARED UTILITIES
// =============================================================================

// Create reusable pattern validators
const emailValidator = createPatternValidator(
  EMAIL_PATTERN,
  'Email',
  'EMAIL_INVALID_FORMAT',
  (value: string) => {
    // Additional email-specific validation
    const parts = value.split('@');
    if (parts.length !== 2) {
      return createValidationError('Invalid email format', {
        code: 'EMAIL_INVALID_FORMAT',
        context: { value },
      });
    }
    return null;
  }
);

const urlValidator = createPatternValidator(
  URL_PATTERN,
  'URL',
  'URL_INVALID_FORMAT'
);

const phoneValidator = createPatternValidator(
  PHONE_INTERNATIONAL_PATTERN,
  'Phone number',
  'PHONE_INVALID_FORMAT'
);

// =============================================================================
// EMAIL VALIDATION
// =============================================================================

export function isValidEmail(value: unknown): value is string {
  if (!isString(value) || value.length === 0 || value.length > 254) {
    return false;
  }
  return EMAIL_PATTERN.test(value);
}

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
  
  // Use pattern validator for base validation
  const baseResult = emailValidator(value, {
    required: false,
    allowEmpty: false,
    trim: false,
  });
  
  const errors: ValidationError[] = [];
  
  // Convert base errors to ValidationError instances
  if (!baseResult.valid) {
    baseResult.errors.forEach(err => {
      errors.push(new ValidationError(err.message, {
        code: err.code,
        context: err.context,
      }));
    });
    return { valid: false, errors, input: value };
  }
  
  const emailValue = baseResult.data!;
  
  // Length validation
  const lengthResult = validateLength(emailValue, { max: maxLength }, 'Email');
  if (!lengthResult.valid) {
    errors.push(new ValidationError(lengthResult.errors[0], {
      code: 'EMAIL_TOO_LONG',
      context: { value: emailValue, length: emailValue.length, maxLength },
    }));
  }
  
  // Plus sign check
  if (!allowPlus && emailValue.includes('+')) {
    errors.push(new ValidationError('Plus signs not allowed in email', {
      code: 'EMAIL_PLUS_NOT_ALLOWED',
      context: { value: emailValue },
    }));
  }
  
  // Dots check
  if (!allowDots && emailValue.includes('.')) {
    errors.push(new ValidationError('Dots not allowed in email', {
      code: 'EMAIL_DOTS_NOT_ALLOWED',
      context: { value: emailValue },
    }));
  }
  
  // TLD check
  if (requireTld) {
    const parts = emailValue.split('@');
    if (parts.length === 2 && parts[1] && !parts[1].includes('.')) {
      errors.push(new ValidationError('Email must have a top-level domain', {
        code: 'EMAIL_NO_TLD',
        context: { value: emailValue, domain: parts[1] },
      }));
    }
  }
  
  return errors.length > 0 
    ? { valid: false, errors, input: value }
    : { valid: true, value: emailValue, input: value };
}

// =============================================================================
// URL VALIDATION
// =============================================================================

export function isValidUrl(value: unknown): value is string {
  if (!isString(value) || value.length === 0) {
    return false;
  }
  return URL_PATTERN.test(value);
}

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
  
  // Use pattern validator for base validation
  const baseResult = urlValidator(value, {
    required: false,
    allowEmpty: false,
    trim: true,
  });
  
  const errors: ValidationError[] = [];
  
  if (!baseResult.valid) {
    baseResult.errors.forEach(err => {
      errors.push(new ValidationError(err.message, {
        code: err.code,
        context: err.context,
      }));
    });
    return { valid: false, errors, input: value };
  }
  
  const urlValue = baseResult.data!;
  
  // Protocol validation
  if (requireProtocol) {
    const hasProtocol = protocols.some(p => urlValue.toLowerCase().startsWith(`${p}://`));
    if (!hasProtocol) {
      errors.push(new ValidationError('URL must include a valid protocol', {
        code: 'URL_NO_PROTOCOL',
        context: { value: urlValue, allowedProtocols: protocols },
      }));
    }
  }
  
  // Localhost check
  if (!allowLocalhost && (urlValue.includes('localhost') || urlValue.includes('127.0.0.1'))) {
    errors.push(new ValidationError('Localhost URLs are not allowed', {
      code: 'URL_LOCALHOST_NOT_ALLOWED',
      context: { value: urlValue },
    }));
  }
  
  // IP address check
  if (!allowIp && /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(urlValue)) {
    errors.push(new ValidationError('IP addresses are not allowed', {
      code: 'URL_IP_NOT_ALLOWED',
      context: { value: urlValue },
    }));
  }
  
  return errors.length > 0 
    ? { valid: false, errors, input: value }
    : { valid: true, value: urlValue, input: value };
}

// =============================================================================
// PHONE VALIDATION
// =============================================================================

export function isValidPhone(value: unknown, format?: 'international' | 'national' | 'e164'): value is string {
  if (!isString(value) || value.length === 0) {
    return false;
  }
  
  const cleanPhone = value.replace(/[\s()-]/g, '');
  
  switch (format) {
    case 'international':
    case 'e164':
      return PHONE_INTERNATIONAL_PATTERN.test(cleanPhone);
    case 'national':
      return PHONE_US_PATTERN.test(value);
    default:
      return PHONE_INTERNATIONAL_PATTERN.test(cleanPhone) || PHONE_US_PATTERN.test(value);
  }
}

export function validatePhone(
  value: unknown,
  options: PhoneValidationOptions = {}
): ValidationResult<string> {
  const {
    format = 'international',
    countryCode,
    allowExtensions = false,
  } = options;
  
  if (!isString(value)) {
    const error = new ValidationError('Phone number must be a string', {
      code: 'PHONE_TYPE_ERROR',
      context: createValidationContext(value, 'string'),
    });
    return { valid: false, errors: [error], input: value };
  }
  
  if (value.length === 0) {
    const error = new ValidationError('Phone number cannot be empty', {
      code: 'PHONE_EMPTY',
      context: { value },
    });
    return { valid: false, errors: [error], input: value };
  }
  
  let phoneValue = value;
  let extension: string | undefined;
  
  // Extract extension if present
  if (allowExtensions) {
    const match = PHONE_EXTENSION_PATTERN.exec(value);
    if (match && match[2]) {
      phoneValue = match[1].trim();
      extension = match[2];
    }
  }
  
  // Validate based on format
  const isValid = isValidPhone(phoneValue, format);
  
  if (!isValid) {
    const error = new ValidationError(`Invalid ${format} phone number format`, {
      code: 'PHONE_INVALID_FORMAT',
      context: { value: phoneValue, format },
    });
    return { valid: false, errors: [error], input: value };
  }
  
  // Country code validation
  if (countryCode && !phoneValue.includes(countryCode)) {
    const error = new ValidationError(`Phone number must include country code ${countryCode}`, {
      code: 'PHONE_WRONG_COUNTRY',
      context: { value: phoneValue, expectedCountryCode: countryCode },
    });
    return { valid: false, errors: [error], input: value };
  }
  
  const finalValue = extension ? `${phoneValue} ext. ${extension}` : phoneValue;
  return { valid: true, value: finalValue, input: value };
}

// =============================================================================
// PASSWORD VALIDATION
// =============================================================================

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
  
  if (!isString(value)) {
    const error = new ValidationError('Password must be a string', {
      code: 'PASSWORD_TYPE_ERROR',
      context: createValidationContext(value, 'string'),
    });
    return { valid: false, errors: [error], input: value };
  }
  
  const errors: ValidationError[] = [];
  
  // Length validation
  const lengthResult = validateLength(value, { min: minLength, max: maxLength }, 'Password');
  if (!lengthResult.valid) {
    lengthResult.errors.forEach(msg => {
      errors.push(new ValidationError(msg, {
        code: 'PASSWORD_LENGTH_ERROR',
        context: { length: value.length, minLength, maxLength },
      }));
    });
  }
  
  // Character requirements
  if (requireUppercase && !/[A-Z]/.test(value)) {
    errors.push(new ValidationError('Password must contain at least one uppercase letter', {
      code: 'PASSWORD_NO_UPPERCASE',
    }));
  }
  
  if (requireLowercase && !/[a-z]/.test(value)) {
    errors.push(new ValidationError('Password must contain at least one lowercase letter', {
      code: 'PASSWORD_NO_LOWERCASE',
    }));
  }
  
  if (requireNumbers && !/\d/.test(value)) {
    errors.push(new ValidationError('Password must contain at least one number', {
      code: 'PASSWORD_NO_NUMBERS',
    }));
  }
  
  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
    errors.push(new ValidationError('Password must contain at least one special character', {
      code: 'PASSWORD_NO_SPECIAL_CHARS',
    }));
  }
  
  // Common password check
  if (disallowCommon) {
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
    const lowerValue = value.toLowerCase();
    if (commonPasswords.some(common => lowerValue.includes(common))) {
      errors.push(new ValidationError('Password is too common', {
        code: 'PASSWORD_TOO_COMMON',
      }));
    }
  }
  
  return errors.length > 0 
    ? { valid: false, errors, input: value }
    : { valid: true, value, input: value };
}

// =============================================================================
// CREDIT CARD VALIDATION
// =============================================================================

function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  let sum = 0;
  let isEven = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    
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

export function isValidCreditCard(value: unknown): value is string {
  if (!isString(value)) {
    return false;
  }
  
  const cardNumber = value.replace(/[\s-]/g, '');
  
  if (!/^\d{13,19}$/.test(cardNumber)) {
    return false;
  }
  
  return luhnCheck(cardNumber);
}

export function validateCreditCard(
  value: unknown,
  options: CreditCardValidationOptions = {}
): ValidationResult<string> {
  const {
    allowedTypes,
    validateExpiry = false,
    validateCvv = false,
  } = options;
  
  if (!isString(value)) {
    const error = new ValidationError('Credit card number must be a string', {
      code: 'CARD_TYPE_ERROR',
      context: createValidationContext(value, 'string'),
    });
    return { valid: false, errors: [error], input: value };
  }
  
  const cardNumber = value.replace(/[\s-]/g, '');
  const errors: ValidationError[] = [];
  
  // Length check
  if (!/^\d{13,19}$/.test(cardNumber)) {
    errors.push(new ValidationError('Invalid credit card number length', {
      code: 'CARD_INVALID_LENGTH',
      context: { value: cardNumber, length: cardNumber.length },
    }));
    return { valid: false, errors, input: value };
  }
  
  // Luhn algorithm check
  if (!luhnCheck(cardNumber)) {
    errors.push(new ValidationError('Invalid credit card number', {
      code: 'CARD_INVALID_LUHN',
      context: { value: cardNumber },
    }));
    return { valid: false, errors, input: value };
  }
  
  // Card type validation
  if (allowedTypes && allowedTypes.length > 0) {
    const cardType = Object.entries(CARD_PATTERNS).find(([, pattern]) => 
      pattern.test(cardNumber)
    )?.[0];
    
    if (!cardType || !allowedTypes.includes(cardType as any)) {
      errors.push(new ValidationError('Credit card type not allowed', {
        code: 'CARD_TYPE_NOT_ALLOWED',
        context: { value: cardNumber, allowedTypes, detectedType: cardType },
      }));
    }
  }
  
  return errors.length > 0 
    ? { valid: false, errors, input: value }
    : { valid: true, value: cardNumber, input: value };
}

// =============================================================================
// COMPOSITE VALIDATORS
// =============================================================================

export function createValidator<T extends Record<string, (value: unknown) => ValidationResult>>(
  validators: T
): (data: Record<string, unknown>) => ValidationResult<{ [K in keyof T]: ReturnType<T[K]>['value'] }> {
  return (data: Record<string, unknown>) => {
    const errors: ValidationError[] = [];
    const result: any = {};
    
    for (const [field, validator] of Object.entries(validators)) {
      const fieldResult = validator(data[field]);
      
      if (fieldResult.valid) {
        result[field] = fieldResult.value;
      } else {
        fieldResult.errors?.forEach(error => {
          errors.push(new ValidationError(error.message, {
            code: error.code || 'VALIDATION_ERROR',
            context: { ...error.context, field },
          }));
        });
      }
    }
    
    return errors.length > 0
      ? { valid: false, errors, input: data }
      : { valid: true, value: result, input: data };
  };
}