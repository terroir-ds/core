/**
 * Tests for centralized error messages
 */

import { describe, it, expect } from 'vitest';
import {
  ERROR_MESSAGES,
  ERROR_MESSAGE_CATEGORIES,
  getMessage,
  createLocalizedMessages,
  validateMessages,
  type ErrorMessageKey,
} from '../messages.js';

describe('Error Messages', () => {
  describe('ERROR_MESSAGES', () => {
    it('should contain all expected message categories', () => {
      expect(ERROR_MESSAGES).toHaveProperty('OPERATION_FAILED');
      expect(ERROR_MESSAGES).toHaveProperty('OPERATION_CANCELLED');
      expect(ERROR_MESSAGES).toHaveProperty('CIRCUIT_OPEN');
      expect(ERROR_MESSAGES).toHaveProperty('VALIDATION_REQUIRED');
      expect(ERROR_MESSAGES).toHaveProperty('CONFIG_MISSING');
      expect(ERROR_MESSAGES).toHaveProperty('PERMISSION_DENIED');
      expect(ERROR_MESSAGES).toHaveProperty('RESOURCE_NOT_FOUND');
      expect(ERROR_MESSAGES).toHaveProperty('NETWORK_CONNECTION_FAILED');
      expect(ERROR_MESSAGES).toHaveProperty('HTTP_BAD_REQUEST');
    });

    it('should have function templates for parameterized messages', () => {
      expect(typeof ERROR_MESSAGES.OPERATION_FAILED).toBe('function');
      expect(typeof ERROR_MESSAGES.OPERATION_TIMEOUT).toBe('function');
      expect(typeof ERROR_MESSAGES.VALIDATION_REQUIRED).toBe('function');
      expect(typeof ERROR_MESSAGES.CONFIG_MISSING).toBe('function');
    });

    it('should have string templates for static messages', () => {
      expect(typeof ERROR_MESSAGES.OPERATION_CANCELLED).toBe('string');
      expect(typeof ERROR_MESSAGES.CIRCUIT_OPEN).toBe('string');
      expect(typeof ERROR_MESSAGES.PERMISSION_DENIED).toBe('string');
      expect(typeof ERROR_MESSAGES.NETWORK_CONNECTION_FAILED).toBe('string');
    });
  });

  describe('getMessage()', () => {
    it('should return static messages correctly', () => {
      expect(getMessage('OPERATION_CANCELLED')).toBe('Operation cancelled');
      expect(getMessage('CIRCUIT_OPEN')).toBe('Circuit breaker is open');
      expect(getMessage('PERMISSION_DENIED')).toBe('Permission denied');
      expect(getMessage('INTERNAL_ERROR')).toBe('An internal error occurred');
    });

    it('should return parameterized messages correctly', () => {
      expect(getMessage('OPERATION_FAILED', 3)).toBe('Operation failed after 3 attempt(s)');
      expect(getMessage('OPERATION_TIMEOUT', 5000)).toBe('Operation timed out after 5000ms');
      expect(getMessage('VALIDATION_REQUIRED', 'email')).toBe('email is required');
      expect(getMessage('CONFIG_MISSING', 'API_KEY')).toBe("Configuration key 'API_KEY' is missing");
    });

    it('should handle complex parameterized messages', () => {
      expect(getMessage('VALIDATION_TYPE', 'age', 'number', 'string'))
        .toBe('age must be number, got string');
      
      expect(getMessage('VALIDATION_RANGE', 'score', 0, 100))
        .toBe('score must be between 0 and 100');
      
      expect(getMessage('VALIDATION_RANGE', 'count', 1))
        .toBe('count must be at least 1');
      
      expect(getMessage('VALIDATION_RANGE', 'limit', undefined, 50))
        .toBe('limit must be at most 50');
    });

    it('should handle optional parameters', () => {
      expect(getMessage('VALIDATION_INVALID', 'email'))
        .toBe('email is invalid');
      
      expect(getMessage('VALIDATION_INVALID', 'email', 'invalid@'))
        .toBe('email has invalid value: invalid@');
      
      expect(getMessage('RESOURCE_NOT_FOUND', 'User'))
        .toBe('User not found');
      
      expect(getMessage('RESOURCE_NOT_FOUND', 'User', '123'))
        .toBe('User not found: 123');
    });

    it('should handle HTTP status messages', () => {
      expect(getMessage('HTTP_BAD_REQUEST')).toBe('Bad request');
      expect(getMessage('HTTP_NOT_FOUND')).toBe('Not found');
      expect(getMessage('HTTP_METHOD_NOT_ALLOWED', 'DELETE'))
        .toBe("Method 'DELETE' not allowed");
      expect(getMessage('HTTP_INTERNAL_SERVER_ERROR')).toBe('Internal server error');
    });
  });

  describe('ERROR_MESSAGE_CATEGORIES', () => {
    it('should categorize messages correctly', () => {
      expect(ERROR_MESSAGE_CATEGORIES.RETRY).toContain('OPERATION_FAILED');
      expect(ERROR_MESSAGE_CATEGORIES.RETRY).toContain('CIRCUIT_OPEN');
      
      expect(ERROR_MESSAGE_CATEGORIES.VALIDATION).toContain('VALIDATION_REQUIRED');
      expect(ERROR_MESSAGE_CATEGORIES.VALIDATION).toContain('VALIDATION_INVALID');
      
      expect(ERROR_MESSAGE_CATEGORIES.HTTP).toContain('HTTP_BAD_REQUEST');
      expect(ERROR_MESSAGE_CATEGORIES.HTTP).toContain('HTTP_NOT_FOUND');
      
      expect(ERROR_MESSAGE_CATEGORIES.NETWORK).toContain('NETWORK_CONNECTION_FAILED');
      expect(ERROR_MESSAGE_CATEGORIES.NETWORK).toContain('SERVICE_UNAVAILABLE');
    });

    it('should have all expected categories', () => {
      expect(ERROR_MESSAGE_CATEGORIES).toHaveProperty('RETRY');
      expect(ERROR_MESSAGE_CATEGORIES).toHaveProperty('VALIDATION');
      expect(ERROR_MESSAGE_CATEGORIES).toHaveProperty('CONFIGURATION');
      expect(ERROR_MESSAGE_CATEGORIES).toHaveProperty('PERMISSION');
      expect(ERROR_MESSAGE_CATEGORIES).toHaveProperty('RESOURCE');
      expect(ERROR_MESSAGE_CATEGORIES).toHaveProperty('NETWORK');
      expect(ERROR_MESSAGE_CATEGORIES).toHaveProperty('BUSINESS');
      expect(ERROR_MESSAGE_CATEGORIES).toHaveProperty('FILE');
      expect(ERROR_MESSAGE_CATEGORIES).toHaveProperty('SYSTEM');
      expect(ERROR_MESSAGE_CATEGORIES).toHaveProperty('HTTP');
    });
  });

  describe('createLocalizedMessages()', () => {
    it('should create localized messages object', () => {
      const localized = createLocalizedMessages('en');
      
      expect(localized).toHaveProperty('locale', 'en');
      expect(localized).toHaveProperty('messages');
      expect(localized.messages).toBe(ERROR_MESSAGES);
    });

    it('should default to English locale', () => {
      const localized = createLocalizedMessages();
      
      expect(localized.locale).toBe('en');
    });

    it('should handle different locales', () => {
      const spanish = createLocalizedMessages('es');
      const french = createLocalizedMessages('fr');
      
      expect(spanish.locale).toBe('es');
      expect(french.locale).toBe('fr');
      
      // For now, both should return English messages
      expect(spanish.messages).toBe(ERROR_MESSAGES);
      expect(french.messages).toBe(ERROR_MESSAGES);
    });
  });

  describe('validateMessages()', () => {
    it('should validate all message templates', () => {
      expect(validateMessages()).toBe(true);
    });

    it('should ensure no message template throws errors', () => {
      // Test a representative sample of each message type
      const testCases: Array<[ErrorMessageKey, unknown[]]> = [
        ['OPERATION_FAILED', [3]],
        ['OPERATION_TIMEOUT', [5000]],
        ['OPERATION_CANCELLED', []],
        ['CIRCUIT_OPEN', []],
        ['VALIDATION_REQUIRED', ['email']],
        ['VALIDATION_INVALID', ['age', 'abc']],
        ['VALIDATION_TYPE', ['id', 'number', 'string']],
        ['VALIDATION_RANGE', ['score', 0, 100]],
        ['CONFIG_MISSING', ['API_KEY']],
        ['CONFIG_INVALID', ['port', 'must be number']],
        ['PERMISSION_DENIED', []],
        ['RESOURCE_NOT_FOUND', ['User', '123']],
        ['SERVICE_ERROR', ['PaymentService', 'timeout']],
        ['HTTP_BAD_REQUEST', []],
        ['HTTP_METHOD_NOT_ALLOWED', ['DELETE']],
      ];

      for (const [key, args] of testCases) {
        expect(() => getMessage(key, ...args)).not.toThrow();
        expect(getMessage(key, ...args)).toBeTruthy();
        expect(typeof getMessage(key, ...args)).toBe('string');
      }
    });
  });

  describe('Message consistency', () => {
    it('should use consistent terminology', () => {
      // Operation-related messages should use "Operation"
      expect(getMessage('OPERATION_FAILED', 1)).toMatch(/^Operation/);
      expect(getMessage('OPERATION_TIMEOUT', 1000)).toMatch(/^Operation/);
      expect(getMessage('OPERATION_CANCELLED')).toMatch(/^Operation/);
      
      // Circuit breaker messages should mention "Circuit breaker"
      expect(getMessage('CIRCUIT_OPEN')).toMatch(/Circuit breaker/);
      
      // Validation messages should be clear about what's wrong
      expect(getMessage('VALIDATION_REQUIRED', 'field')).toMatch(/is required/);
      expect(getMessage('VALIDATION_INVALID', 'field')).toMatch(/is invalid/);
    });

    it('should have appropriate message lengths', () => {
      // Most error messages should be reasonably concise
      expect(getMessage('PERMISSION_DENIED').length).toBeLessThan(50);
      expect(getMessage('INTERNAL_ERROR').length).toBeLessThan(50);
      expect(getMessage('OPERATION_CANCELLED').length).toBeLessThan(50);
      
      // Parameterized messages should still be reasonable
      expect(getMessage('OPERATION_FAILED', 5).length).toBeLessThan(100);
      expect(getMessage('VALIDATION_TYPE', 'field', 'string', 'number').length).toBeLessThan(100);
    });

    it('should not contain placeholder text', () => {
      // Make sure no messages contain obvious placeholder text
      const allStaticMessages = Object.entries(ERROR_MESSAGES)
        .filter(([, value]) => typeof value === 'string')
        .map(([, value]) => value as string);
      
      for (const message of allStaticMessages) {
        expect(message).not.toMatch(/TODO|FIXME|placeholder|xxx/i);
        expect(message.trim().length).toBeGreaterThan(0);
      }
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle validation range with no bounds', () => {
      expect(getMessage('VALIDATION_RANGE', 'value')).toBe('value is out of range');
    });

    it('should handle service error without details', () => {
      expect(getMessage('SERVICE_ERROR', 'PaymentService')).toBe("Service 'PaymentService' error");
    });

    it('should handle config invalid without reason', () => {
      expect(getMessage('CONFIG_INVALID', 'database')).toBe("Configuration key 'database' is invalid");
    });

    it('should handle file too large without max size', () => {
      expect(getMessage('FILE_TOO_LARGE', '/tmp/large.jpg')).toBe('File too large: /tmp/large.jpg');
    });

    it('should handle deprecated feature without alternative', () => {
      expect(getMessage('DEPRECATED_FEATURE', 'oldApi')).toBe("Feature 'oldApi' is deprecated");
    });

    it('should handle deprecated feature with alternative', () => {
      expect(getMessage('DEPRECATED_FEATURE', 'oldApi', 'newApi'))
        .toBe("Feature 'oldApi' is deprecated. Use 'newApi' instead");
    });

    it('should handle business logic data inconsistency without details', () => {
      expect(getMessage('DATA_INCONSISTENT')).toBe('Data inconsistency detected');
    });

    it('should handle business logic data inconsistency with details', () => {
      expect(getMessage('DATA_INCONSISTENT', 'user age mismatch'))
        .toBe('Data inconsistency detected: user age mismatch');
    });
  });

  describe('Real-world usage scenarios', () => {
    it('should provide messages suitable for error logging', () => {
      const errorMessage = getMessage('OPERATION_FAILED', 3);
      expect(errorMessage).toMatch(/\d+ attempt/);
      expect(errorMessage.length).toBeGreaterThan(10);
    });

    it('should provide messages suitable for user display', () => {
      const userMessage = getMessage('PERMISSION_DENIED');
      expect(userMessage).toBe('Permission denied');
      expect(userMessage.toLowerCase()).not.toContain('error');
    });

    it('should provide consistent API error messages', () => {
      expect(getMessage('HTTP_BAD_REQUEST')).toBe('Bad request');
      expect(getMessage('HTTP_UNAUTHORIZED')).toBe('Unauthorized');
      expect(getMessage('HTTP_FORBIDDEN')).toBe('Forbidden');
      expect(getMessage('HTTP_NOT_FOUND')).toBe('Not found');
    });
  });
});