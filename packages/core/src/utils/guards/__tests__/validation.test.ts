/**
 * @module test/utils/guards/validation
 * 
 * Unit tests for validation utilities
 * 
 * Tests validation functionality including:
 * - Email validation with RFC compliance
 * - URL validation with protocol support
 * - Phone number validation (international and national formats)
 * - Password validation with security requirements
 * - Credit card validation with Luhn algorithm
 * - Custom validator creation and composition
 * - Schema validation for objects
 * - Performance with large datasets
 * - Edge cases and security considerations
 */

import { describe, it, expect } from 'vitest';
import {
  // Types
  type ValidationResult,
  type EmailValidationOptions,
  type UrlValidationOptions,
  type PhoneValidationOptions,
  type PasswordValidationOptions,
  type CreditCardValidationOptions,
  
  // Email validation
  isValidEmail,
  validateEmail,
  
  // URL validation
  isValidUrl,
  validateUrl,
  
  // Phone validation
  isValidPhone,
  validatePhone,
  
  // Password validation
  validatePassword,
  
  // Credit card validation
  validateCreditCard,
  
  // Custom validators
  createValidator,
  validateSchema,
} from '../validation.js';
import { ValidationError } from '../../errors/base-error.js';

describe('Email Validation', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user+tag@example.com',
        'firstname.lastname@example.com',
        'user_name@example-domain.com',
        'user123@domain123.com',
        'a@b.co',
        'very.long.email.address@very-long-domain-name.com',
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should return false for invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@invalid.com',
        'invalid@.com',
        'invalid@com',
        'invalid..double.dot@example.com',
        'invalid@example..com',
        '.invalid@example.com',
        'invalid.@example.com',
        'invalid@example.',
        'invalid@',
        'inv alid@example.com', // Space
        'invalid@exam ple.com', // Space in domain
      ];

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });

    it('should return false for non-string values', () => {
      expect(isValidEmail(123)).toBe(false);
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
      expect(isValidEmail({})).toBe(false);
      expect(isValidEmail([])).toBe(false);
    });

    it('should handle length limits', () => {
      expect(isValidEmail('')).toBe(false);
      
      // Test very long email (over 254 characters)
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should return success for valid emails', () => {
      const result = validateEmail('user@example.com');
      
      expect(result.valid).toBe(true);
      expect(result.value).toBe('user@example.com');
      expect(result.errors).toBeUndefined();
      expect(result.input).toBe('user@example.com');
    });

    it('should return errors for invalid emails', () => {
      const result = validateEmail('invalid-email');
      
      expect(result.valid).toBe(false);
      expect(result.value).toBeUndefined();
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0]).toBeInstanceOf(ValidationError);
      expect(result.errors![0].code).toBe('EMAIL_INVALID_FORMAT');
    });

    it('should validate against custom options', () => {
      const options: EmailValidationOptions = {
        allowPlus: false,
        maxLength: 20
      };

      // Test plus sign restriction
      const plusResult = validateEmail('user+tag@example.com', options);
      expect(plusResult.valid).toBe(false);
      expect(plusResult.errors![0].code).toBe('EMAIL_PLUS_NOT_ALLOWED');

      // Test length restriction
      const longResult = validateEmail('very.long.email@example.com', options);
      expect(longResult.valid).toBe(false);
      expect(longResult.errors![0].code).toBe('EMAIL_TOO_LONG');
    });

    it('should handle type errors', () => {
      const result = validateEmail(123);
      
      expect(result.valid).toBe(false);
      expect(result.errors![0].code).toBe('EMAIL_TYPE_ERROR');
    });

    it('should handle empty emails', () => {
      const result = validateEmail('');
      
      expect(result.valid).toBe(false);
      expect(result.errors![0].code).toBe('EMAIL_EMPTY');
    });

    it('should validate TLD requirement', () => {
      const options: EmailValidationOptions = { requireTld: true };
      
      const result = validateEmail('user@localhost', options);
      expect(result.valid).toBe(false);
      expect(result.errors![0].code).toBe('EMAIL_NO_TLD');
    });

    it('should allow emails without TLD when configured', () => {
      const options: EmailValidationOptions = { requireTld: false };
      
      const result = validateEmail('user@localhost', options);
      expect(result.valid).toBe(true);
    });
  });
});

describe('URL Validation', () => {
  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://www.example.com/path',
        'https://example.com:8080',
        'https://example.com/path?query=value',
        'https://example.com/path#fragment',
        'ftp://files.example.com',
        'https://subdomain.example.com',
      ];

      validUrls.forEach(url => {
        expect(isValidUrl(url)).toBe(true);
      });
    });

    it('should return false for invalid URLs', () => {
      const invalidUrls = [
        'invalid',
        'http://',
        'https://',
        '://example.com',
        'http:///path',
        'not-a-url',
      ];

      invalidUrls.forEach(url => {
        expect(isValidUrl(url)).toBe(false);
      });
    });

    it('should return false for non-string values', () => {
      expect(isValidUrl(123)).toBe(false);
      expect(isValidUrl(null)).toBe(false);
      expect(isValidUrl(undefined)).toBe(false);
      expect(isValidUrl({})).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('should return success for valid URLs', () => {
      const result = validateUrl('https://example.com');
      
      expect(result.valid).toBe(true);
      expect(result.value).toBe('https://example.com/');
      expect(result.errors).toBeUndefined();
    });

    it('should return errors for invalid URLs', () => {
      const result = validateUrl('invalid-url');
      
      expect(result.valid).toBe(false);
      expect(result.errors![0].code).toBe('URL_INVALID_FORMAT');
    });

    it('should validate protocol restrictions', () => {
      const options: UrlValidationOptions = {
        protocols: ['https']
      };

      const httpResult = validateUrl('http://example.com', options);
      expect(httpResult.valid).toBe(false);
      expect(httpResult.errors![0].code).toBe('URL_PROTOCOL_NOT_ALLOWED');

      const httpsResult = validateUrl('https://example.com', options);
      expect(httpsResult.valid).toBe(true);
    });

    it('should handle localhost restrictions', () => {
      const options: UrlValidationOptions = {
        allowLocalhost: false
      };

      const localhostResult = validateUrl('https://localhost:3000', options);
      expect(localhostResult.valid).toBe(false);
      expect(localhostResult.errors![0].code).toBe('URL_LOCALHOST_NOT_ALLOWED');

      const regularResult = validateUrl('https://example.com', options);
      expect(regularResult.valid).toBe(true);
    });

    it('should handle IP address restrictions', () => {
      const options: UrlValidationOptions = {
        allowIp: false
      };

      const ipResult = validateUrl('https://192.168.1.1', options);
      expect(ipResult.valid).toBe(false);
      expect(ipResult.errors![0].code).toBe('URL_IP_NOT_ALLOWED');
    });

    it('should handle protocol requirement', () => {
      const options: UrlValidationOptions = {
        requireProtocol: false
      };

      const result = validateUrl('example.com', options);
      expect(result.valid).toBe(true);
      expect(result.value).toBe('https://example.com/');
    });

    it('should handle type errors', () => {
      const result = validateUrl(123);
      
      expect(result.valid).toBe(false);
      expect(result.errors![0].code).toBe('URL_TYPE_ERROR');
    });
  });
});

describe('Phone Number Validation', () => {
  describe('isValidPhone', () => {
    it('should return true for valid phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '+12345678901',
        '1234567890',
        '(123) 456-7890',
        '123-456-7890',
        '123.456.7890',
        '+44 20 7946 0958',
        '+86 138 0013 8000',
      ];

      validPhones.forEach(phone => {
        expect(isValidPhone(phone)).toBe(true);
      });
    });

    it('should return false for invalid phone numbers', () => {
      const invalidPhones = [
        '123',
        '12345678901234567890', // Too long
        'phone',
        '123-abc-7890',
        '+',
        '',
      ];

      invalidPhones.forEach(phone => {
        expect(isValidPhone(phone)).toBe(false);
      });
    });

    it('should return false for non-string values', () => {
      expect(isValidPhone(123)).toBe(false);
      expect(isValidPhone(null)).toBe(false);
      expect(isValidPhone(undefined)).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should return success for valid phone numbers', () => {
      const result = validatePhone('+1234567890');
      
      expect(result.valid).toBe(true);
      expect(result.value).toBe('+1234567890');
    });

    it('should validate international format', () => {
      const options: PhoneValidationOptions = {
        format: 'international'
      };

      const result = validatePhone('+1234567890', options);
      expect(result.valid).toBe(true);

      const invalidResult = validatePhone('1234567890', options);
      expect(invalidResult.valid).toBe(false);
    });

    it('should validate E.164 format', () => {
      const options: PhoneValidationOptions = {
        format: 'e164'
      };

      const result = validatePhone('+1234567890', options);
      expect(result.valid).toBe(true);

      const invalidResult = validatePhone('1234567890', options);
      expect(invalidResult.valid).toBe(false);
    });

    it('should validate country codes', () => {
      const options: PhoneValidationOptions = {
        format: 'international',
        countryCode: 'US'
      };

      const usResult = validatePhone('+1234567890', options);
      expect(usResult.valid).toBe(true);

      const ukResult = validatePhone('+44207946095', options);
      expect(ukResult.valid).toBe(false);
      expect(ukResult.errors![0].code).toBe('PHONE_WRONG_COUNTRY');
    });

    it('should handle type and length errors', () => {
      const typeResult = validatePhone(123);
      expect(typeResult.valid).toBe(false);
      expect(typeResult.errors![0].code).toBe('PHONE_TYPE_ERROR');

      const lengthResult = validatePhone('123');
      expect(lengthResult.valid).toBe(false);
      expect(lengthResult.errors![0].code).toBe('PHONE_INVALID_LENGTH');
    });
  });
});

describe('Password Validation', () => {
  describe('validatePassword', () => {
    it('should return success for valid passwords', () => {
      const result = validatePassword('SecurePassword123!');
      
      expect(result.valid).toBe(true);
      expect(result.value).toBe('SecurePassword123!');
      expect(result.input).toBe('[REDACTED]'); // Should redact password in logs
    });

    it('should validate length requirements', () => {
      const options: PasswordValidationOptions = {
        minLength: 10,
        maxLength: 20
      };

      const shortResult = validatePassword('short', options);
      expect(shortResult.valid).toBe(false);
      expect(shortResult.errors![0].code).toBe('PASSWORD_TOO_SHORT');

      const longResult = validatePassword('verylongpasswordthatexceedslimit', options);
      expect(longResult.valid).toBe(false);
      expect(longResult.errors![0].code).toBe('PASSWORD_TOO_LONG');
    });

    it('should validate character requirements', () => {
      const options: PasswordValidationOptions = {
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      };

      const weakResult = validatePassword('password', options);
      expect(weakResult.valid).toBe(false);
      expect(weakResult.errors).toHaveLength(3); // Missing uppercase, numbers, special chars

      const strongResult = validatePassword('StrongPass123!', options);
      expect(strongResult.valid).toBe(true);
    });

    it('should detect common passwords', () => {
      const options: PasswordValidationOptions = {
        disallowCommon: true
      };

      const commonResult = validatePassword('password', options);
      expect(commonResult.valid).toBe(false);
      expect(commonResult.errors![0].code).toBe('PASSWORD_TOO_COMMON');

      const uniqueResult = validatePassword('UniquePassword123!', options);
      expect(uniqueResult.valid).toBe(true);
    });

    it('should handle type errors', () => {
      const result = validatePassword(123);
      
      expect(result.valid).toBe(false);
      expect(result.errors![0].code).toBe('PASSWORD_TYPE_ERROR');
    });

    it('should redact passwords in all outputs', () => {
      const result = validatePassword('weak');
      
      expect(result.input).toBe('[REDACTED]');
      if (result.errors) {
        result.errors.forEach(error => {
          expect(error.context.value).toBe('[REDACTED]');
        });
      }
    });
  });
});

describe('Credit Card Validation', () => {
  describe('validateCreditCard', () => {
    // Valid test credit card numbers (not real accounts)
    const validCards = {
      visa: '4111111111111111',
      mastercard: '5555555555554444',
      amex: '378282246310005',
      discover: '6011111111111117'
    };

    it('should return success for valid credit card numbers', () => {
      const result = validateCreditCard(validCards.visa);
      
      expect(result.valid).toBe(true);
      expect(result.value).toBe('4111111111111111');
      expect(result.cardType).toBe('visa');
      expect(result.input).toBe('[REDACTED]');
    });

    it('should detect different card types', () => {
      Object.entries(validCards).forEach(([type, number]) => {
        const result = validateCreditCard(number);
        expect(result.valid).toBe(true);
        expect(result.cardType).toBe(type);
      });
    });

    it('should validate Luhn algorithm', () => {
      // Invalid Luhn checksum
      const result = validateCreditCard('4111111111111112');
      
      expect(result.valid).toBe(false);
      expect(result.errors![0].code).toBe('CARD_LUHN_FAILED');
    });

    it('should validate card type restrictions', () => {
      const options: CreditCardValidationOptions = {
        allowedTypes: ['visa', 'mastercard']
      };

      const visaResult = validateCreditCard(validCards.visa, options);
      expect(visaResult.valid).toBe(true);

      const amexResult = validateCreditCard(validCards.amex, options);
      expect(amexResult.valid).toBe(false);
      expect(amexResult.errors![0].code).toBe('CARD_TYPE_NOT_ALLOWED');
    });

    it('should handle length validation', () => {
      const shortResult = validateCreditCard('411111111111');
      expect(shortResult.valid).toBe(false);
      expect(shortResult.errors![0].code).toBe('CARD_INVALID_LENGTH');

      const longResult = validateCreditCard('41111111111111111111');
      expect(longResult.valid).toBe(false);
      expect(longResult.errors![0].code).toBe('CARD_INVALID_LENGTH');
    });

    it('should handle type errors', () => {
      const result = validateCreditCard(123);
      
      expect(result.valid).toBe(false);
      expect(result.errors![0].code).toBe('CARD_TYPE_ERROR');
    });

    it('should redact card numbers in all outputs', () => {
      const result = validateCreditCard('invalid');
      
      expect(result.input).toBe('[REDACTED]');
      if (result.errors) {
        result.errors.forEach(error => {
          expect(error.context.value).toBe('[REDACTED]');
        });
      }
    });
  });
});

describe('Custom Validators', () => {
  describe('createValidator', () => {
    it('should create working validator from predicate', () => {
      const validateAge = createValidator(
        (value: unknown): value is number => 
          typeof value === 'number' && value >= 18 && value <= 120,
        'Age must be between 18 and 120',
        'INVALID_AGE'
      );

      const validResult = validateAge(25);
      expect(validResult.valid).toBe(true);
      expect(validResult.value).toBe(25);

      const invalidResult = validateAge(15);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors![0].code).toBe('INVALID_AGE');
    });

    it('should support dynamic error messages', () => {
      const validateRange = createValidator(
        (value: unknown): value is number => 
          typeof value === 'number' && value >= 0 && value <= 100,
        (value) => `Value ${value} must be between 0 and 100`
      );

      const result = validateRange(150);
      expect(result.valid).toBe(false);
      expect(result.errors![0].message).toBe('Value 150 must be between 0 and 100');
    });

    it('should work with complex type predicates', () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const validateUser = createValidator(
        (obj: unknown): obj is User => {
          return typeof obj === 'object' && obj !== null &&
                 typeof (obj as any).id === 'number' &&
                 typeof (obj as any).name === 'string' &&
                 typeof (obj as any).email === 'string' &&
                 isValidEmail((obj as any).email);
        },
        'Invalid user object'
      );

      const validUser = { id: 1, name: 'John', email: 'john@example.com' };
      const invalidUser = { id: 1, name: 'John', email: 'invalid-email' };

      expect(validateUser(validUser).valid).toBe(true);
      expect(validateUser(invalidUser).valid).toBe(false);
    });
  });

  describe('validateSchema', () => {
    it('should validate objects against schema', () => {
      const userSchema = {
        id: (value: unknown) => createValidator(
          (v): v is number => typeof v === 'number',
          'ID must be a number'
        )(value),
        name: (value: unknown) => createValidator(
          (v): v is string => typeof v === 'string' && v.length > 0,
          'Name must be a non-empty string'
        )(value),
        email: validateEmail
      };

      const validData = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com'
      };

      const result = validateSchema(validData, userSchema);
      expect(result.valid).toBe(true);
      expect(result.value).toEqual(validData);
    });

    it('should collect errors for invalid data', () => {
      const schema = {
        id: (value: unknown) => createValidator(
          (v): v is number => typeof v === 'number',
          'ID must be a number'
        )(value),
        email: validateEmail
      };

      const invalidData = {
        id: 'invalid',
        email: 'invalid-email'
      };

      const result = validateSchema(invalidData, schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.fieldErrors).toHaveProperty('id');
      expect(result.fieldErrors).toHaveProperty('email');
    });

    it('should handle non-object input', () => {
      const schema = {
        field: validateEmail
      };

      const result = validateSchema('not an object', schema);
      expect(result.valid).toBe(false);
      expect(result.errors![0].code).toBe('SCHEMA_DATA_NOT_OBJECT');
    });

    it('should work with complex schemas', () => {
      const registrationSchema = {
        user: (value: unknown) => validateSchema(value, {
          name: (v: unknown) => createValidator(
            (val): val is string => typeof val === 'string' && val.length >= 2,
            'Name must be at least 2 characters'
          )(v),
          email: validateEmail,
          age: (v: unknown) => createValidator(
            (val): val is number => typeof val === 'number' && val >= 18,
            'Must be 18 or older'
          )(v)
        }),
        password: (value: unknown) => validatePassword(value, {
          minLength: 8,
          requireUppercase: true,
          requireNumbers: true
        }),
        terms: (value: unknown) => createValidator(
          (v): v is boolean => v === true,
          'Must accept terms and conditions'
        )(value)
      };

      const validRegistration = {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          age: 25
        },
        password: 'SecurePass123',
        terms: true
      };

      const result = validateSchema(validRegistration, registrationSchema);
      expect(result.valid).toBe(true);
    });
  });
});

describe('Performance Tests', () => {
  it('should handle email validation efficiently at scale', () => {
    const emails = Array.from({ length: 10000 }, (_, i) => `user${i}@example.com`);
    
    const start = performance.now();
    const results = emails.map(email => isValidEmail(email));
    const end = performance.now();
    
    expect(results.every(r => r === true)).toBe(true);
    expect(end - start).toBeLessThan(100); // Should complete quickly
  });

  it('should handle complex validation chains efficiently', () => {
    const userData = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      phone: '+1234567890',
      age: 20 + (i % 50)
    }));

    const start = performance.now();
    const results = userData.map(user => {
      const emailValid = isValidEmail(user.email);
      const phoneValid = isValidPhone(user.phone);
      const ageValid = user.age >= 18 && user.age <= 120;
      return emailValid && phoneValid && ageValid;
    });
    const end = performance.now();

    expect(results.every(r => r === true)).toBe(true);
    expect(end - start).toBeLessThan(50);
  });

  it('should handle schema validation efficiently', () => {
    const schema = {
      email: validateEmail,
      phone: validatePhone
    };

    const data = Array.from({ length: 1000 }, (_, i) => ({
      email: `user${i}@example.com`,
      phone: '+1234567890'
    }));

    const start = performance.now();
    const results = data.map(item => validateSchema(item, schema));
    const end = performance.now();

    expect(results.every(r => r.valid)).toBe(true);
    expect(end - start).toBeLessThan(200);
  });
});

describe('Security Tests', () => {
  it('should handle malicious input safely', () => {
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      '${7*7}', // Template injection
      'javascript:alert(1)',
      '../../etc/passwd', // Path traversal
      'DROP TABLE users;', // SQL injection
      '\x00\x01\x02', // Null bytes
    ];

    maliciousInputs.forEach(input => {
      expect(() => {
        isValidEmail(input);
        isValidUrl(input);
        isValidPhone(input);
        validatePassword(input);
      }).not.toThrow();
    });
  });

  it('should not leak sensitive information in errors', () => {
    try {
      validatePassword('weak-password');
    } catch (error) {
      const serialized = JSON.stringify(error);
      expect(serialized).not.toContain('weak-password');
      expect(serialized).toContain('[REDACTED]');
    }

    try {
      validateCreditCard('4111111111111111');
    } catch (error) {
      const serialized = JSON.stringify(error);
      expect(serialized).not.toContain('4111111111111111');
      expect(serialized).toContain('[REDACTED]');
    }
  });

  it('should handle prototype pollution attempts', () => {
    const maliciousData = JSON.parse('{"__proto__": {"polluted": true}, "email": "test@example.com"}');
    
    const result = validateSchema(maliciousData, {
      email: validateEmail
    });

    expect(result.valid).toBe(true);
    expect(({} as any).polluted).toBeUndefined(); // Should not pollute prototype
  });

  it('should handle circular references in validation context', () => {
    const circular: any = { email: 'test@example.com' };
    circular.self = circular;

    expect(() => {
      validateSchema(circular, {
        email: validateEmail,
        self: (value: unknown) => ({ valid: true, value })
      });
    }).not.toThrow();
  });
});