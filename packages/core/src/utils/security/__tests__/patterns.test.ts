/**
 * @module @utils/security/__tests__/patterns.test.ts
 * 
 * Tests for security pattern utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  SENSITIVE_FIELD_PATTERNS,
  SENSITIVE_FIELD_NAMES,
  SENSITIVE_CONTENT_PATTERNS,
  BINARY_PATTERNS,
  createMatcher,
  compilePatterns,
  PatternBuilder,
  isBinaryContent,
  isSensitiveFieldName,
  containsSensitiveContent,
} from '../patterns.js';

describe('Security Patterns', () => {
  describe('Field Name Detection', () => {
    describe('isSensitiveFieldName', () => {
      it('should detect exact sensitive field names', () => {
        expect(isSensitiveFieldName('password')).toBe(true);
        expect(isSensitiveFieldName('token')).toBe(true);
        expect(isSensitiveFieldName('api_key')).toBe(true);
        expect(isSensitiveFieldName('apikey')).toBe(true);
        expect(isSensitiveFieldName('api-key')).toBe(true);
        expect(isSensitiveFieldName('secret')).toBe(true);
        expect(isSensitiveFieldName('ssn')).toBe(true);
        expect(isSensitiveFieldName('credit_card')).toBe(true);
      });

      it('should detect pattern-based sensitive field names', () => {
        expect(isSensitiveFieldName('user_password')).toBe(true);
        expect(isSensitiveFieldName('password_hash')).toBe(true);
        expect(isSensitiveFieldName('auth_token')).toBe(true);
        expect(isSensitiveFieldName('api_secret_key')).toBe(true);
        expect(isSensitiveFieldName('private_key')).toBe(true);
        expect(isSensitiveFieldName('credit_card_number')).toBe(true);
      });

      it('should be case insensitive', () => {
        expect(isSensitiveFieldName('PASSWORD')).toBe(true);
        expect(isSensitiveFieldName('ApiKey')).toBe(true);
        expect(isSensitiveFieldName('AUTH_TOKEN')).toBe(true);
      });

      it('should not detect non-sensitive field names', () => {
        expect(isSensitiveFieldName('username')).toBe(false);
        expect(isSensitiveFieldName('email')).toBe(false);
        expect(isSensitiveFieldName('name')).toBe(false);
        expect(isSensitiveFieldName('id')).toBe(false);
        expect(isSensitiveFieldName('')).toBe(false);
      });

      it('should handle edge cases', () => {
        expect(isSensitiveFieldName(null as unknown as string)).toBe(false);
        expect(isSensitiveFieldName(undefined as unknown as string)).toBe(false);
        expect(isSensitiveFieldName(123 as unknown as string)).toBe(false);
      });
    });
  });

  describe('Content Detection', () => {
    describe('containsSensitiveContent', () => {
      it('should detect credit card numbers', () => {
        expect(containsSensitiveContent('4111111111111111')).toBe(true);
        expect(containsSensitiveContent('4111 1111 1111 1111')).toBe(true);
        expect(containsSensitiveContent('4111-1111-1111-1111')).toBe(true);
      });

      it('should detect JWT tokens', () => {
        const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        expect(containsSensitiveContent(jwt)).toBe(true);
      });

      it('should detect social security numbers', () => {
        expect(containsSensitiveContent('123-45-6789')).toBe(true);
        expect(containsSensitiveContent('078-05-1120')).toBe(true);
      });

      it('should detect API keys', () => {
        // GitHub
        expect(containsSensitiveContent('ghp_1234567890abcdefghijklmnopqrstuvwxyz12')).toBe(true);
        expect(containsSensitiveContent('ghs_1234567890abcdefghijklmnopqrstuvwxyz12')).toBe(true);
        
        // Stripe
        expect(containsSensitiveContent('sk_test_1234567890abcdefghijklmnop')).toBe(true);
        expect(containsSensitiveContent('pk_live_1234567890abcdefghijklmnop')).toBe(true);
        
        // AWS
        expect(containsSensitiveContent('AKIAIOSFODNN7EXAMPLE')).toBe(true);
        expect(containsSensitiveContent('AKIA_FAKE_ACCESS_KEY_FOR_TESTING')).toBe(true);
        
        // Generic 40-char
        expect(containsSensitiveContent('a'.repeat(40))).toBe(true);
      });

      it('should detect email addresses', () => {
        expect(containsSensitiveContent('user@example.com')).toBe(true);
        expect(containsSensitiveContent('test.user+tag@domain.co.uk')).toBe(true);
      });

      it('should detect IP addresses', () => {
        // IPv4
        expect(containsSensitiveContent('192.168.1.1')).toBe(true);
        expect(containsSensitiveContent('10.0.0.1')).toBe(true);
        expect(containsSensitiveContent('255.255.255.255')).toBe(true);
        
        // IPv6
        expect(containsSensitiveContent('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
      });

      it('should detect private keys', () => {
        expect(containsSensitiveContent('-----BEGIN RSA PRIVATE KEY-----')).toBe(true);
        expect(containsSensitiveContent('-----BEGIN EC PRIVATE KEY-----')).toBe(true);
        expect(containsSensitiveContent('-----BEGIN ENCRYPTED PRIVATE KEY-----')).toBe(true);
      });

      it('should detect binary content', () => {
        const binaryString = 'Hello\x00World\x01';
        expect(containsSensitiveContent(binaryString)).toBe(true);
      });

      it('should not detect normal content', () => {
        expect(containsSensitiveContent('Hello World')).toBe(false);
        expect(containsSensitiveContent('This is a normal sentence.')).toBe(false);
        expect(containsSensitiveContent('12345')).toBe(false);
      });

      it('should handle edge cases', () => {
        expect(containsSensitiveContent('')).toBe(false);
        expect(containsSensitiveContent(null as unknown as string)).toBe(false);
        expect(containsSensitiveContent(undefined as unknown as string)).toBe(false);
        expect(containsSensitiveContent(123 as unknown as string)).toBe(false);
      });
    });

    describe('isBinaryContent', () => {
      it('should detect null bytes', () => {
        expect(isBinaryContent('\x00')).toBe(true);
        expect(isBinaryContent('Hello\x00World')).toBe(true);
      });

      it('should detect control characters', () => {
        expect(isBinaryContent('\x01\x02\x03')).toBe(true);
        expect(isBinaryContent('\x1F\x7F')).toBe(true);
      });

      it('should use threshold for detection', () => {
        // 30% binary content (default threshold)
        const mixedContent = 'Normal' + '\x00\x01\x02';
        expect(isBinaryContent(mixedContent)).toBe(true);
        
        // Below threshold
        const mostlyText = 'This is mostly normal text' + '\x00';
        expect(isBinaryContent(mostlyText)).toBe(false);
        
        // Custom threshold
        expect(isBinaryContent(mostlyText, 0.01)).toBe(true);
      });

      it('should allow common whitespace', () => {
        expect(isBinaryContent('Hello\nWorld')).toBe(false);
        expect(isBinaryContent('Tab\tSeparated')).toBe(false);
        expect(isBinaryContent('Carriage\rReturn')).toBe(false);
      });

      it('should handle edge cases', () => {
        expect(isBinaryContent('')).toBe(false);
        expect(isBinaryContent(null as unknown as string)).toBe(false);
        expect(isBinaryContent(undefined as unknown as string)).toBe(false);
      });
    });
  });

  describe('Pattern Utilities', () => {
    describe('createMatcher', () => {
      it('should create OR matcher by default', () => {
        const matcher = createMatcher([
          /^password$/,
          /^token$/,
        ]);
        
        expect(matcher('password')).toBe(true);
        expect(matcher('token')).toBe(true);
        expect(matcher('user')).toBe(false);
      });

      it('should create AND matcher when specified', () => {
        const matcher = createMatcher([
          /^api/,
          /key$/,
        ], { matchAll: true });
        
        expect(matcher('api_key')).toBe(true);
        expect(matcher('apikey')).toBe(true);
        expect(matcher('api_token')).toBe(false);
        expect(matcher('secret_key')).toBe(false);
      });

      it('should cache patterns for performance', () => {
        const patterns = [/test/];
        const matcher1 = createMatcher(patterns);
        const matcher2 = createMatcher(patterns);
        
        // Both should work
        expect(matcher1('test')).toBe(true);
        expect(matcher2('test')).toBe(true);
      });

      it('should handle empty patterns', () => {
        const matcher = createMatcher([]);
        expect(matcher('anything')).toBe(false);
      });

      it('should validate input types', () => {
        const matcher = createMatcher([/test/]);
        expect(matcher('')).toBe(false);
        expect(matcher(null as unknown as string)).toBe(false);
        expect(matcher(undefined as unknown as string)).toBe(false);
        expect(matcher(123 as unknown as string)).toBe(false);
      });
    });

    describe('compilePatterns', () => {
      it('should compile string patterns to RegExp', () => {
        const patterns = compilePatterns(['password', 'token'], 'i');
        
        expect(patterns[0].test('password')).toBe(true);
        expect(patterns[0].test('PASSWORD')).toBe(true);
        expect(patterns[1].test('token')).toBe(true);
        expect(patterns[1].test('TOKEN')).toBe(true);
      });

      it('should preserve existing RegExp patterns', () => {
        const original = /custom/gi;
        const patterns = compilePatterns([original, 'test']);
        
        expect(patterns[0]).toBe(original);
        expect(patterns[1]).toBeInstanceOf(RegExp);
      });

      it('should escape special regex characters', () => {
        const patterns = compilePatterns(['test.com', 'api[key]']);
        
        expect(patterns[0].test('test.com')).toBe(true);
        expect(patterns[0].test('testXcom')).toBe(false);
        expect(patterns[1].test('api[key]')).toBe(true);
        expect(patterns[1].test('apikey')).toBe(false);
      });

      it('should cache compiled patterns', () => {
        const patterns1 = compilePatterns(['test']);
        const patterns2 = compilePatterns(['test']);
        
        // Should return cached pattern (implementation detail)
        expect(patterns1[0].toString()).toBe(patterns2[0].toString());
      });
    });
  });

  describe('PatternBuilder', () => {
    it('should build credit card pattern', () => {
      const pattern = PatternBuilder.creditCard();
      expect(pattern.test('4111111111111111')).toBe(true);
      expect(pattern.test('4111 1111 1111 1111')).toBe(true);
      expect(pattern.test('4111-1111-1111-1111')).toBe(true);
      expect(pattern.test('411111111111111')).toBe(false); // Too short
    });

    it('should build email pattern', () => {
      const pattern = PatternBuilder.email();
      expect(pattern.test('user@example.com')).toBe(true);
      expect(pattern.test('test.user+tag@domain.co.uk')).toBe(true);
      expect(pattern.test('invalid@')).toBe(false);
      expect(pattern.test('@invalid.com')).toBe(false);
    });

    it('should build IP address patterns', () => {
      const ipv4 = PatternBuilder.ipAddress(4);
      expect(ipv4.test('192.168.1.1')).toBe(true);
      expect(ipv4.test('255.255.255.255')).toBe(true);
      expect(ipv4.test('256.1.1.1')).toBe(false);
      expect(ipv4.test('1.1.1')).toBe(false);
      
      const ipv6 = PatternBuilder.ipAddress(6);
      expect(ipv6.test('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
    });

    it('should build JWT pattern', () => {
      const pattern = PatternBuilder.jwt();
      const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      expect(pattern.test(jwt)).toBe(true);
      expect(pattern.test('not.a.jwt')).toBe(false);
    });

    it('should build API key pattern', () => {
      const pattern = PatternBuilder.apiKey('sk_', 24);
      expect(pattern.test('sk_test_1234567890abcdefghijklmnop')).toBe(true);
      expect(pattern.test('sk_short')).toBe(false);
      expect(pattern.test('pk_test_1234567890abcdefghijklmnop')).toBe(false);
    });

    it('should build custom pattern', () => {
      const pattern = PatternBuilder.custom('[a-z]+', 'i');
      expect(pattern.test('hello')).toBe(true);
      expect(pattern.test('HELLO')).toBe(true);
      expect(pattern.test('123')).toBe(false);
    });
  });

  describe('Pattern Constants', () => {
    it('should have comprehensive field patterns', () => {
      expect(SENSITIVE_FIELD_PATTERNS).toBeInstanceOf(Array);
      expect(SENSITIVE_FIELD_PATTERNS.length).toBeGreaterThan(0);
      
      // Test a few patterns
      const passwordPattern = SENSITIVE_FIELD_PATTERNS.find(p => 
        p.test('password')
      );
      expect(passwordPattern).toBeDefined();
    });

    it('should have sensitive field names set', () => {
      expect(SENSITIVE_FIELD_NAMES).toBeInstanceOf(Set);
      expect(SENSITIVE_FIELD_NAMES.size).toBeGreaterThan(0);
      expect(SENSITIVE_FIELD_NAMES.has('password')).toBe(true);
      expect(SENSITIVE_FIELD_NAMES.has('token')).toBe(true);
    });

    it('should have content patterns', () => {
      expect(SENSITIVE_CONTENT_PATTERNS).toBeInstanceOf(Array);
      expect(SENSITIVE_CONTENT_PATTERNS.length).toBeGreaterThan(0);
    });

    it('should have binary patterns', () => {
      expect(BINARY_PATTERNS).toBeInstanceOf(Array);
      expect(BINARY_PATTERNS.length).toBeGreaterThan(0);
    });
  });
});