/**
 * @module @utils/security/__tests__/redaction.test.ts
 * 
 * Tests for data redaction utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  redact,
  createRedactor,
  redactPaths,
  redactByPattern,
  safeStringify,
  containsSensitive,
  mask,
} from '@utils/security/redaction';

describe('Redaction Utilities', () => {
  describe('redact', () => {
    it('should redact sensitive field names', () => {
      const data = {
        username: 'john',
        password: 'secret123',
        token: 'abc123',
        api_key: 'sk_test_123',
      };
      
      const result = redact(data);
      
      expect(result.username).toBe('john');
      expect(result.password).toBe('[REDACTED]');
      expect(result.token).toBe('[REDACTED]');
      expect(result.api_key).toBe('[REDACTED]');
    });

    it('should redact nested objects', () => {
      const data = {
        user: {
          name: 'John',
          credentials: {
            password: 'secret',
            apiKey: 'key123',
          },
        },
      };
      
      const result = redact(data);
      
      expect(result.user.name).toBe('John');
      expect(result.user.credentials.password).toBe('[REDACTED]');
      expect(result.user.credentials.apiKey).toBe('[REDACTED]');
    });

    it('should redact arrays', () => {
      const data = {
        users: [
          { name: 'John', password: 'pass1' },
          { name: 'Jane', password: 'pass2' },
        ],
      };
      
      const result = redact(data);
      
      expect(result.users[0].name).toBe('John');
      expect(result.users[0].password).toBe('[REDACTED]');
      expect(result.users[1].name).toBe('Jane');
      expect(result.users[1].password).toBe('[REDACTED]');
    });

    it('should redact content with sensitive patterns', () => {
      const data = {
        note: 'My credit card is 4111111111111111',
        email: 'Contact me at user@example.com',
        safe: 'This is just normal text',
      };
      
      const result = redact(data);
      
      expect(result.note).toBe('[REDACTED]');
      expect(result.email).toBe('[REDACTED]');
      expect(result.safe).toBe('This is just normal text');
    });

    it('should handle circular references', () => {
      const obj: Record<string, unknown> = { name: 'test', password: 'secret' };
      obj.self = obj;
      
      const result = redact(obj);
      
      expect(result.name).toBe('test');
      expect(result.password).toBe('[REDACTED]');
      expect(result.self).toBe('[Circular]');
    });

    it('should respect maxDepth option', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              password: 'deep-secret',
            },
          },
        },
      };
      
      const result = redact(data, { maxDepth: 2 });
      
      // Should not redact beyond depth 2
      expect(result.level1.level2.level3.password).toBe('deep-secret');
    });

    it('should use custom redacted value', () => {
      const data = { password: 'secret' };
      
      const result1 = redact(data, { redactedValue: '***' });
      expect(result1.password).toBe('***');
      
      const result2 = redact(data, {
        redactedValue: (original) => `[HIDDEN:${typeof original}]`,
      });
      expect(result2.password).toBe('[HIDDEN:string]');
    });

    it('should handle special values', () => {
      const data = {
        nullValue: null,
        undefinedValue: undefined,
        boolValue: true,
        numberValue: 123,
        dateValue: new Date('2023-01-01'),
        password: 'secret',
      };
      
      const result = redact(data);
      
      expect(result.nullValue).toBe(null);
      expect(result.undefinedValue).toBe(undefined);
      expect(result.boolValue).toBe(true);
      expect(result.numberValue).toBe(123);
      expect(result.dateValue).toEqual(new Date('2023-01-01'));
      expect(result.password).toBe('[REDACTED]');
    });

    it('should preserve object structure', () => {
      const data = {
        config: {
          password: 'secret',
          settings: {
            apiKey: 'key123',
          },
        },
      };
      
      const result = redact(data);
      
      expect(Object.keys(result)).toEqual(['config']);
      expect(Object.keys(result.config)).toEqual(['password', 'settings']);
      expect(Object.keys(result.config.settings)).toEqual(['apiKey']);
    });

    it('should handle Maps and Sets', () => {
      const data = {
        map: new Map([
          ['user', 'john'],
          ['password', 'secret'],
        ]),
        set: new Set(['value1', 'sk_test_4242424242424242424242424242']),
      };
      
      const result = redact(data);
      
      expect(result.map).toBeInstanceOf(Map);
      expect(result.map.get('user')).toBe('john');
      expect(result.map.get('password')).toBe('[REDACTED]');
      
      expect(result.set).toBeInstanceOf(Set);
      expect(Array.from(result.set)).toContain('value1');
      expect(Array.from(result.set)).toContain('[REDACTED]');
    });
  });

  describe('createRedactor', () => {
    it('should create reusable redactor', () => {
      const customRedactor = createRedactor({
        patterns: [/custom_secret/],
        redactedValue: '###',
      });
      
      const data1 = { custom_secret: 'value1', normal: 'data' };
      const data2 = { custom_secret: 'value2', other: 'info' };
      
      const result1 = customRedactor(data1);
      const result2 = customRedactor(data2);
      
      expect(result1.custom_secret).toBe('###');
      expect(result1.normal).toBe('data');
      expect(result2.custom_secret).toBe('###');
      expect(result2.other).toBe('info');
    });

    it('should combine default and custom patterns', () => {
      const redactor = createRedactor({
        patterns: [/my_pattern/],
      });
      
      const data = {
        password: 'default',
        my_pattern: 'custom',
        normal: 'unchanged',
      };
      
      const result = redactor(data);
      
      expect(result.password).toBe('[REDACTED]');
      expect(result.my_pattern).toBe('[REDACTED]');
      expect(result.normal).toBe('unchanged');
    });
  });

  describe('redactPaths', () => {
    it('should redact specific paths', () => {
      const data = {
        user: {
          name: 'John',
          email: 'john@example.com',
          profile: {
            age: 30,
            location: 'NYC',
          },
        },
      };
      
      const result = redactPaths(data, [
        'user.email',
        'user.profile.location',
      ]);
      
      expect(result.user.name).toBe('John');
      expect(result.user.email).toBe('[REDACTED]');
      expect(result.user.profile.age).toBe(30);
      expect(result.user.profile.location).toBe('[REDACTED]');
    });

    it('should handle array indices in paths', () => {
      const data = {
        users: [
          { name: 'John', email: 'john@example.com' },
          { name: 'Jane', email: 'jane@example.com' },
        ],
      };
      
      const result = redactPaths(data, [
        'users[0].email',
        'users[1].name',
      ]);
      
      expect(result.users[0].name).toBe('John');
      expect(result.users[0].email).toBe('[REDACTED]');
      expect(result.users[1].name).toBe('[REDACTED]');
      expect(result.users[1].email).toBe('jane@example.com');
    });

    it('should handle wildcard paths', () => {
      const data = {
        users: [
          { name: 'John', ssn: '123-45-6789' },
          { name: 'Jane', ssn: '987-65-4321' },
        ],
      };
      
      const result = redactPaths(data, ['users[*].ssn']);
      
      expect(result.users[0].name).toBe('John');
      expect(result.users[0].ssn).toBe('[REDACTED]');
      expect(result.users[1].name).toBe('Jane');
      expect(result.users[1].ssn).toBe('[REDACTED]');
    });

    it('should be case sensitive by default', () => {
      const data = { Password: 'secret', password: 'also-secret' };
      
      const result = redactPaths(data, ['password']);
      
      expect(result.Password).toBe('secret');
      expect(result.password).toBe('[REDACTED]');
    });

    it('should support case insensitive option', () => {
      const data = { Password: 'secret', PASSWORD: 'also-secret' };
      
      const result = redactPaths(data, ['password'], {
        caseSensitive: false,
      });
      
      expect(result.Password).toBe('[REDACTED]');
      expect(result.PASSWORD).toBe('[REDACTED]');
    });
  });

  describe('redactByPattern', () => {
    it('should redact values matching patterns', () => {
      const data = {
        config: {
          apiUrl: 'https://api.example.com',
          apiKey: 'sk_test_1234567890abcdef',
          version: '1.0.0',
        },
      };
      
      const result = redactByPattern(data, [
        /^sk_(test|live)_/,
      ]);
      
      expect(result.config.apiUrl).toBe('https://api.example.com');
      expect(result.config.apiKey).toBe('[REDACTED]');
      expect(result.config.version).toBe('1.0.0');
    });

    it('should work with multiple patterns', () => {
      const data = {
        stripe: 'sk_test_123',
        github: 'ghp_abc123',
        normal: 'not-a-key',
      };
      
      const result = redactByPattern(data, [
        /^sk_(test|live)_/,
        /^gh[ps]_/,
      ]);
      
      expect(result.stripe).toBe('[REDACTED]');
      expect(result.github).toBe('[REDACTED]');
      expect(result.normal).toBe('not-a-key');
    });
  });

  describe('safeStringify', () => {
    it('should stringify with redaction', () => {
      const data = {
        user: 'john',
        password: 'secret',
      };
      
      const json = safeStringify(data);
      const parsed = JSON.parse(json);
      
      expect(parsed.user).toBe('john');
      expect(parsed.password).toBe('[REDACTED]');
    });

    it('should handle circular references', () => {
      const obj: Record<string, unknown> = { name: 'test' };
      obj.self = obj;
      
      const json = safeStringify(obj);
      const parsed = JSON.parse(json);
      
      expect(parsed.name).toBe('test');
      expect(parsed.self).toBe('[Circular]');
    });

    it('should support formatting', () => {
      const data = { a: 1, b: 2 };
      const json = safeStringify(data, { space: 2 });
      
      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });

    it('should support custom replacer', () => {
      const data = { keep: 'yes', remove: 'no' };
      
      const json = safeStringify(data, {
        replacer: (key, value) => {
          if (key === 'remove') return undefined;
          return value;
        },
      });
      
      const parsed = JSON.parse(json);
      expect(parsed.keep).toBe('yes');
      expect(parsed.remove).toBeUndefined();
    });

    it('should redact before replacer', () => {
      const data = { password: 'secret' };
      
      const json = safeStringify(data, {
        redact: true,
        replacer: (key, value) => {
          // Should receive already redacted value
          if (key === 'password') {
            expect(value).toBe('[REDACTED]');
          }
          return value;
        },
      });
      
      const parsed = JSON.parse(json);
      expect(parsed.password).toBe('[REDACTED]');
    });
  });

  describe('containsSensitive', () => {
    it('should detect sensitive field names', () => {
      const obj = {
        username: 'john',
        password: 'secret',
      };
      
      expect(containsSensitive(obj)).toBe(true);
    });

    it('should detect sensitive content', () => {
      const obj = {
        note: 'My card: 4111111111111111',
      };
      
      expect(containsSensitive(obj)).toBe(true);
    });

    it('should use custom patterns', () => {
      const obj = {
        customField: 'custom-value',
        normal: 'normal-value',
      };
      
      expect(containsSensitive(obj, [/custom-value/])).toBe(true);
      expect(containsSensitive(obj, [/other-pattern/])).toBe(false);
    });

    it('should check nested objects', () => {
      const obj = {
        level1: {
          level2: {
            secret: 'hidden',
          },
        },
      };
      
      expect(containsSensitive(obj)).toBe(true);
    });

    it('should return false for non-sensitive data', () => {
      const obj = {
        name: 'John',
        age: 30,
        city: 'NYC',
      };
      
      expect(containsSensitive(obj)).toBe(false);
    });
  });

  describe('mask', () => {
    it('should mask strings with default options', () => {
      expect(mask('password123')).toBe('***********');
      expect(mask('short')).toBe('*****');
    });

    it('should show first N characters', () => {
      expect(mask('password123', { showFirst: 3 })).toBe('pas********');
      expect(mask('test', { showFirst: 2 })).toBe('te**');
    });

    it('should show last N characters', () => {
      expect(mask('password123', { showLast: 3 })).toBe('********123');
      expect(mask('test', { showLast: 2 })).toBe('**st');
    });

    it('should show first and last characters', () => {
      expect(mask('password123', { showFirst: 2, showLast: 2 }))
        .toBe('pa*******23');
    });

    it('should use custom mask character', () => {
      expect(mask('password', { maskChar: '#' })).toBe('########');
      expect(mask('test', { maskChar: 'X' })).toBe('XXXX');
    });

    it('should respect minimum length', () => {
      expect(mask('ab', { minLength: 6 })).toBe('******');
      expect(mask('test', { minLength: 6 })).toBe('******');
      expect(mask('longpassword', { minLength: 6 })).toBe('************');
    });

    it('should handle edge cases', () => {
      expect(mask('')).toBe('');
      expect(mask('a')).toBe('*');
      expect(mask('ab', { showFirst: 5 })).toBe('ab');
      expect(mask('ab', { showLast: 5 })).toBe('ab');
    });

    it('should handle special mask scenarios', () => {
      // Email masking
      const email = 'user@example.com';
      const [local, domain] = email.split('@');
      const maskedEmail = mask(local, { showFirst: 2 }) + '@' + domain;
      expect(maskedEmail).toBe('us**@example.com');
      
      // Credit card masking
      const cc = '4111111111111111';
      const maskedCC = mask(cc, { showLast: 4 });
      expect(maskedCC).toBe('************1111');
    });
  });

  describe('Performance', () => {
    it('should handle large objects efficiently', () => {
      const largeObj: Record<string, unknown> = {};
      for (let i = 0; i < 1000; i++) {
        largeObj[`field${i}`] = {
          data: 'value',
          password: 'secret',
          nested: {
            token: 'abc123',
          },
        };
      }
      
      const start = performance.now();
      const result = redact(largeObj);
      const duration = performance.now() - start;
      
      // Should complete reasonably fast
      expect(duration).toBeLessThan(100); // 100ms
      
      // Spot check results
      expect(result.field0.data).toBe('value');
      expect(result.field0.password).toBe('[REDACTED]');
      expect(result.field999.nested.token).toBe('[REDACTED]');
    });

    it('should handle deep nesting efficiently', () => {
      let obj: Record<string, unknown> = { password: 'secret' };
      for (let i = 0; i < 50; i++) {
        obj = { nested: obj, level: i };
      }
      
      const start = performance.now();
      redact(obj, { maxDepth: 20 });
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(50); // 50ms
    });
  });
});