/**
 * @module test/utils/guards/assertions
 * 
 * Unit tests for assertion utilities
 * 
 * Tests assertion functionality including:
 * - Core assertions (assert, assertDefined, assertType)
 * - Type assertions (assertInstanceOf)
 * - Specialized assertions (assertMinLength, assertInRange, etc.)
 * - Soft assertions for non-throwing variants
 * - Custom assertion creation
 * - Error message and context generation
 * - Integration with existing error system
 * - Performance with assertion chains
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  AssertionError,
  assert,
  assertDefined,
  assertType,
  assertInstanceOf,
  assertMinLength,
  assertInRange,
  assertPattern,
  assertProperties,
  assertNever,
  softAssert,
  createAssertion,
  assertNonEmptyString,
} from '@utils/guards/assertions';
import { ValidationError } from '@utils/errors/base-error';

describe('AssertionError', () => {
  it('should extend ValidationError', () => {
    const error = new AssertionError('Test assertion failed');
    expect(error).toBeInstanceOf(ValidationError);
    expect(error).toBeInstanceOf(AssertionError);
    expect(error.name).toBe('AssertionError');
  });

  it('should have default error code', () => {
    const error = new AssertionError('Test message');
    expect(error.code).toBe('ASSERTION_FAILED');
  });

  it('should accept custom error code and context', () => {
    const error = new AssertionError('Test message', {
      code: 'CUSTOM_ASSERTION',
      context: { value: 42, expected: 'string' }
    });
    
    expect(error.code).toBe('CUSTOM_ASSERTION');
    expect(error.context).toMatchObject({
      assertionType: 'runtime',
      value: 42,
      expected: 'string'
    });
  });
});

describe('Core Assertions', () => {
  describe('assert', () => {
    it('should pass for truthy values', () => {
      expect(() => assert(true, 'Should pass')).not.toThrow();
      expect(() => assert(1, 'Should pass')).not.toThrow();
      expect(() => assert('non-empty', 'Should pass')).not.toThrow();
      expect(() => assert([], 'Should pass')).not.toThrow();
      expect(() => assert({}, 'Should pass')).not.toThrow();
    });

    it('should throw AssertionError for falsy values', () => {
      expect(() => assert(false, 'Should fail')).toThrow(AssertionError);
      expect(() => assert(0, 'Should fail')).toThrow(AssertionError);
      expect(() => assert('', 'Should fail')).toThrow(AssertionError);
      expect(() => assert(null, 'Should fail')).toThrow(AssertionError);
      expect(() => assert(undefined, 'Should fail')).toThrow(AssertionError);
    });

    it('should include custom error code', () => {
      try {
        assert(false, 'Custom failure', 'CUSTOM_CODE');
      } catch (error) {
        expect(error).toBeInstanceOf(AssertionError);
        expect((error as AssertionError).code).toBe('CUSTOM_CODE');
        expect((error as AssertionError).message).toBe('Custom failure');
      }
    });

    it('should include condition in context', () => {
      try {
        assert(false, 'Failed assertion');
      } catch (error) {
        expect((error as AssertionError).context).toMatchObject({
          condition: 'false'
        });
      }
    });
  });

  describe('assertDefined', () => {
    it('should pass for defined values', () => {
      expect(() => assertDefined(0, 'Should pass')).not.toThrow();
      expect(() => assertDefined('', 'Should pass')).not.toThrow();
      expect(() => assertDefined(false, 'Should pass')).not.toThrow();
      expect(() => assertDefined([], 'Should pass')).not.toThrow();
      expect(() => assertDefined({}, 'Should pass')).not.toThrow();
    });

    it('should throw for null and undefined', () => {
      expect(() => assertDefined(null, 'Should fail')).toThrow(AssertionError);
      expect(() => assertDefined(undefined, 'Should fail')).toThrow(AssertionError);
    });

    it('should use default error code for undefined values', () => {
      try {
        assertDefined(undefined, 'Value is required');
      } catch (error) {
        expect((error as AssertionError).code).toBe('VALUE_UNDEFINED');
      }
    });

    it('should include type and value in context', () => {
      try {
        assertDefined(null, 'Null value');
      } catch (error) {
        expect((error as AssertionError).context).toMatchObject({
          value: 'null',
          type: 'object'
        });
      }
    });

    it('should work with TypeScript type narrowing', () => {
      function processOptional(value: string | undefined): string {
        assertDefined(value, 'Value is required');
        // TypeScript should know value is string here
        return value.toUpperCase();
      }

      expect(processOptional('hello')).toBe('HELLO');
      expect(() => processOptional(undefined)).toThrow(AssertionError);
    });
  });

  describe('assertType', () => {
    it('should pass for correct primitive types', () => {
      expect(() => assertType('hello', 'string')).not.toThrow();
      expect(() => assertType(123, 'number')).not.toThrow();
      expect(() => assertType(true, 'boolean')).not.toThrow();
      expect(() => assertType({}, 'object')).not.toThrow();
      expect(() => assertType(() => {}, 'function')).not.toThrow();
    });

    it('should throw for incorrect types', () => {
      expect(() => assertType(123, 'string')).toThrow(AssertionError);
      expect(() => assertType('hello', 'number')).toThrow(AssertionError);
      expect(() => assertType({}, 'string')).toThrow(AssertionError);
    });

    it('should generate default error messages', () => {
      try {
        assertType(123, 'string');
      } catch (error) {
        expect((error as AssertionError).message).toBe('Expected string, got number');
      }
    });

    it('should use custom error messages', () => {
      try {
        assertType(123, 'string', 'Value must be a string');
      } catch (error) {
        expect((error as AssertionError).message).toBe('Value must be a string');
      }
    });

    it('should include type information in context', () => {
      try {
        assertType(123, 'string');
      } catch (error) {
        expect((error as AssertionError).context).toMatchObject({
          expected: 'string',
          actual: 'number',
          value: '123'
        });
      }
    });
  });

  describe('assertInstanceOf', () => {
    it('should pass for correct instances', () => {
      expect(() => assertInstanceOf(new Date(), Date)).not.toThrow();
      expect(() => assertInstanceOf(new Error(), Error)).not.toThrow();
      expect(() => assertInstanceOf([], Array)).not.toThrow();
      expect(() => assertInstanceOf(/regex/, RegExp)).not.toThrow();
    });

    it('should throw for incorrect instances', () => {
      expect(() => assertInstanceOf({}, Date)).toThrow(AssertionError);
      expect(() => assertInstanceOf('string', Error)).toThrow(AssertionError);
      expect(() => assertInstanceOf(123, Array)).toThrow(AssertionError);
    });

    it('should generate default error messages', () => {
      try {
        assertInstanceOf({}, Date);
      } catch (error) {
        expect((error as AssertionError).message).toBe('Expected instance of Date, got Object');
      }
    });

    it('should handle custom error messages', () => {
      try {
        assertInstanceOf({}, Date, 'Expected a Date object');
      } catch (error) {
        expect((error as AssertionError).message).toBe('Expected a Date object');
      }
    });

    it('should include constructor information in context', () => {
      try {
        assertInstanceOf({}, Date);
      } catch (error) {
        expect((error as AssertionError).context).toMatchObject({
          expected: 'Date',
          actual: 'Object'
        });
      }
    });

    it('should handle values with no constructor', () => {
      const nullProto = Object.create(null);
      try {
        assertInstanceOf(nullProto, Date);
      } catch (error) {
        expect((error as AssertionError).context).toMatchObject({
          expected: 'Date',
          actual: 'object'
        });
      }
    });
  });
});

describe('Specialized Assertions', () => {
  describe('assertMinLength', () => {
    it('should pass for arrays with sufficient length', () => {
      expect(() => assertMinLength([1, 2, 3], 2)).not.toThrow();
      expect(() => assertMinLength([1, 2, 3], 3)).not.toThrow();
      expect(() => assertMinLength(['a'], 1)).not.toThrow();
    });

    it('should throw for arrays with insufficient length', () => {
      expect(() => assertMinLength([1], 2)).toThrow(AssertionError);
      expect(() => assertMinLength([], 1)).toThrow(AssertionError);
    });

    it('should throw for non-arrays', () => {
      expect(() => assertMinLength('string' as unknown as unknown[], 2)).toThrow(AssertionError);
      expect(() => assertMinLength({} as unknown as unknown[], 1)).toThrow(AssertionError);
    });

    it('should generate appropriate error messages', () => {
      try {
        assertMinLength([1], 3);
      } catch (error) {
        expect((error as AssertionError).message).toBe('Array must have at least 3 items, got 1');
      }
    });

    it('should include length information in context', () => {
      try {
        assertMinLength([1, 2], 5);
      } catch (error) {
        expect((error as AssertionError).context).toMatchObject({
          expected: 5,
          actual: 2,
          arrayLength: 2
        });
      }
    });
  });

  describe('assertInRange', () => {
    it('should pass for numbers within range', () => {
      expect(() => assertInRange(5, 0, 10)).not.toThrow();
      expect(() => assertInRange(0, 0, 10)).not.toThrow(); // Inclusive min
      expect(() => assertInRange(10, 0, 10)).not.toThrow(); // Inclusive max
    });

    it('should throw for numbers outside range', () => {
      expect(() => assertInRange(-1, 0, 10)).toThrow(AssertionError);
      expect(() => assertInRange(11, 0, 10)).toThrow(AssertionError);
    });

    it('should throw for non-numbers', () => {
      expect(() => assertInRange('5' as unknown as number, 0, 10)).toThrow(AssertionError);
      expect(() => assertInRange({} as unknown as number, 0, 10)).toThrow(AssertionError);
    });

    it('should generate appropriate error messages', () => {
      try {
        assertInRange(15, 0, 10);
      } catch (error) {
        expect((error as AssertionError).message).toBe('Value must be between 0 and 10, got 15');
      }
    });

    it('should include range information in context', () => {
      try {
        assertInRange(-5, 0, 100);
      } catch (error) {
        expect((error as AssertionError).context).toMatchObject({
          value: -5,
          min: 0,
          max: 100,
          range: '0-100'
        });
      }
    });
  });

  describe('assertPattern', () => {
    it('should pass for strings matching pattern', () => {
      expect(() => assertPattern('hello', /^h/)).not.toThrow();
      expect(() => assertPattern('test@example.com', /@/)).not.toThrow();
      expect(() => assertPattern('123', /^\d+$/)).not.toThrow();
    });

    it('should throw for strings not matching pattern', () => {
      expect(() => assertPattern('hello', /^\d+$/)).toThrow(AssertionError);
      expect(() => assertPattern('invalid-email', /@/)).toThrow(AssertionError);
    });

    it('should throw for non-strings', () => {
      expect(() => assertPattern(123 as unknown as string, /^\d+$/)).toThrow(AssertionError);
      expect(() => assertPattern({} as unknown as string, /@/)).toThrow(AssertionError);
    });

    it('should include pattern information in context', () => {
      try {
        assertPattern('hello', /^\d+$/);
      } catch (error) {
        expect((error as AssertionError).context).toMatchObject({
          value: 'hello',
          pattern: '/^\\d+$/',
          patternFlags: ''
        });
      }
    });

    it('should handle regex flags', () => {
      try {
        assertPattern('HELLO', /^hello$/i);
      } catch {
        // Should not throw, but if it did, flags should be included
      }

      try {
        assertPattern('hello', /^HELLO$/);
      } catch (error) {
        expect((error as AssertionError).context).toMatchObject({
          patternFlags: ''
        });
      }
    });
  });

  describe('assertProperties', () => {
    it('should pass for objects with all required properties', () => {
      const obj = { id: 1, name: 'John', email: 'john@example.com' };
      expect(() => assertProperties(obj, ['id', 'name'])).not.toThrow();
      expect(() => assertProperties(obj, ['id', 'name', 'email'])).not.toThrow();
    });

    it('should throw for objects missing properties', () => {
      const obj = { id: 1, name: 'John' };
      expect(() => assertProperties(obj, ['id', 'name', 'email' as keyof typeof obj])).toThrow(AssertionError);
      expect(() => assertProperties(obj, ['missing' as keyof typeof obj])).toThrow(AssertionError);
    });

    it('should throw for non-objects', () => {
      expect(() => assertProperties('string' as unknown as Record<string, unknown>, ['length'])).toThrow(AssertionError);
      expect(() => assertProperties(null as unknown as Record<string, unknown>, ['prop'])).toThrow(AssertionError);
    });

    it('should list missing properties in error message', () => {
      const obj = { id: 1, name: 'John' };
      try {
        assertProperties(obj, ['id', 'name', 'email' as keyof typeof obj, 'phone' as keyof typeof obj]);
      } catch (error) {
        expect((error as AssertionError).message).toBe('Object missing required properties: email, phone');
      }
    });

    it('should include property information in context', () => {
      const obj = { id: 1 };
      try {
        assertProperties(obj, ['id', 'name' as keyof typeof obj, 'email' as keyof typeof obj]);
      } catch (error) {
        expect((error as AssertionError).context).toMatchObject({
          missing: ['name', 'email'],
          required: ['id', 'name', 'email'],
          available: ['id']
        });
      }
    });
  });
});

describe('Utility Assertions', () => {
  describe('assertNever', () => {
    it('should always throw', () => {
      expect(() => assertNever('unexpected' as never)).toThrow(AssertionError);
      expect(() => assertNever(123 as never)).toThrow(AssertionError);
      expect(() => assertNever({} as never)).toThrow(AssertionError);
    });

    it('should include value in error message', () => {
      try {
        assertNever('unexpected' as never);
      } catch (error) {
        expect((error as AssertionError).message).toBe('Unexpected value reached assertNever: unexpected');
      }
    });

    it('should use custom error messages', () => {
      try {
        assertNever('value' as never, 'Custom never message');
      } catch (error) {
        expect((error as AssertionError).message).toBe('Custom never message');
      }
    });

    it('should be useful in exhaustive switch statements', () => {
      type Status = 'pending' | 'complete' | 'error';
      
      function processStatus(status: Status): string {
        switch (status) {
          case 'pending':
            return 'Processing...';
          case 'complete':
            return 'Done!';
          case 'error':
            return 'Failed!';
          default:
            assertNever(status);
        }
      }

      expect(processStatus('pending')).toBe('Processing...');
      expect(processStatus('complete')).toBe('Done!');
      expect(processStatus('error')).toBe('Failed!');
    });
  });

  describe('softAssert', () => {
    // consoleMock was removed as it's not used in the test

    beforeEach(() => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    it('should return true for truthy values without throwing', () => {
      expect(softAssert(true, 'Should pass')).toBe(true);
      expect(softAssert(1, 'Should pass')).toBe(true);
      expect(softAssert('non-empty', 'Should pass')).toBe(true);
    });

    it('should return false for falsy values without throwing', () => {
      expect(softAssert(false, 'Should fail')).toBe(false);
      expect(softAssert(0, 'Should fail')).toBe(false);
      expect(softAssert('', 'Should fail')).toBe(false);
      expect(softAssert(null, 'Should fail')).toBe(false);
      expect(softAssert(undefined, 'Should fail')).toBe(false);
    });

    it('should use custom logger when provided', () => {
      const customLogger = vi.fn();
      softAssert(false, 'Custom log message', customLogger);
      
      expect(customLogger).toHaveBeenCalledWith(
        'Soft assertion failed: Custom log message',
        expect.objectContaining({
          condition: 'false',
          timestamp: expect.any(String)
        })
      );
    });

    it('should be useful for non-breaking validation', () => {
      function validateConfig(config: unknown) {
        let validConfig: { port?: number } = {};

        if (typeof config === 'object' && config !== null) {
          validConfig = config as { port?: unknown };
        } else {
          softAssert(false, 'Config should be an object');
        }

        if (!softAssert(typeof validConfig.port === 'number', 'Port should be a number')) {
          validConfig.port = 3000;
        }

        return validConfig;
      }

      expect(validateConfig({ port: 8080 })).toEqual({ port: 8080 });
      expect(validateConfig({ port: 'invalid' })).toEqual({ port: 3000 });
      expect(validateConfig('invalid')).toEqual({ port: 3000 });
    });
  });
});

describe('Custom Assertions', () => {
  describe('createAssertion', () => {
    it('should create working assertion from predicate', () => {
      const assertEven = createAssertion(
        (value: unknown): value is number => typeof value === 'number' && value % 2 === 0,
        'Value must be an even number',
        'NOT_EVEN'
      );

      expect(() => assertEven(2)).not.toThrow();
      expect(() => assertEven(4)).not.toThrow();
      expect(() => assertEven(1)).toThrow(AssertionError);
      expect(() => assertEven('2')).toThrow(AssertionError);
    });

    it('should use custom error messages', () => {
      const assertPositive = createAssertion(
        (value: unknown): value is number => typeof value === 'number' && value > 0,
        'Must be a positive number'
      );

      try {
        (assertPositive as (value: unknown) => void)(-1);
      } catch (error) {
        expect((error as AssertionError).message).toBe('Must be a positive number');
      }
    });

    it('should support dynamic error messages', () => {
      const assertInRange = createAssertion(
        (value: unknown): value is number => typeof value === 'number' && value >= 0 && value <= 100,
        (value) => `Value ${value} must be between 0 and 100`,
        'OUT_OF_RANGE'
      );

      try {
        (assertInRange as (value: unknown) => void)(150);
      } catch (error) {
        expect((error as AssertionError).message).toBe('Value 150 must be between 0 and 100');
        expect((error as AssertionError).code).toBe('OUT_OF_RANGE');
      }
    });

    it('should work with complex type predicates', () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const assertUser = createAssertion(
        (obj: unknown): obj is User => {
          return typeof obj === 'object' && obj !== null &&
                 'id' in obj && typeof (obj as User).id === 'number' &&
                 'name' in obj && typeof (obj as User).name === 'string' &&
                 'email' in obj && typeof (obj as User).email === 'string';
        },
        'Invalid user object',
        'INVALID_USER'
      );

      const validUser = { id: 1, name: 'John', email: 'john@example.com' };
      const invalidUser = { id: 1, name: 'John' }; // Missing email

      expect(() => assertUser(validUser)).not.toThrow();
      expect(() => assertUser(invalidUser)).toThrow(AssertionError);
    });

    it('should include context information', () => {
      const assertString = createAssertion(
        (value: unknown): value is string => typeof value === 'string',
        'Must be a string'
      );

      try {
        (assertString as (value: unknown) => void)(123);
      } catch (error) {
        expect((error as AssertionError).context).toMatchObject({
          value: '123',
          type: 'number'
        });
      }
    });
  });
});

describe('Performance Tests', () => {
  it('should handle assertion chains efficiently', () => {
    function validateUser(data: unknown) {
      assertType(data, 'object');
      assertProperties(data as Record<string, unknown>, ['id', 'name', 'email', 'age']);
      
      const user = data as Record<string, unknown>;
      assertType(user.id, 'number');
      assertType(user.name, 'string');
      assertType(user.email, 'string');
      assertType(user.age, 'number');
      
      assertInRange(user.age, 0, 120);
      assertPattern(user.email, /@/);
      assertNonEmptyString(user.name);
      
      return user;
    }

    const validUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    };

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      validateUser(validUser);
    }
    const end = performance.now();

    expect(end - start).toBeLessThan(100); // Should be very fast
  });

  it('should handle batch assertions efficiently', () => {
    const data = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      value: i * 2
    }));

    const start = performance.now();
    data.forEach(item => {
      assertType(item, 'object');
      assertProperties(item, ['id', 'value']);
      assertType(item.id, 'number');
      assertType(item.value, 'number');
      assertInRange(item.id, 0, 999);
    });
    const end = performance.now();

    expect(end - start).toBeLessThan(80); // Should complete quickly (realistic threshold for CI)
  });
});

describe('Error Integration', () => {
  it('should integrate with existing error system', () => {
    try {
      assertDefined(null, 'Required value');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(AssertionError);
      
      // Should have all BaseError properties
      expect((error as AssertionError).errorId).toBeDefined();
      expect((error as AssertionError).timestamp).toBeDefined();
      expect((error as AssertionError).severity).toBeDefined();
      expect((error as AssertionError).category).toBeDefined();
    }
  });

  it('should serialize properly for logging', () => {
    try {
      assertInRange(150, 0, 100, 'Age out of range');
    } catch (error) {
      const serialized = (error as AssertionError).toJSON();
      
      expect(serialized).toMatchObject({
        name: 'AssertionError',
        message: 'Age out of range',
        code: 'OUT_OF_RANGE',
        errorId: expect.any(String),
        timestamp: expect.any(String)
      });
    }
  });

  it('should provide public-safe serialization', () => {
    try {
      assertPattern('invalid-email', /@/, 'Invalid email format');
    } catch (error) {
      const publicJson = (error as AssertionError).toPublicJSON();
      
      expect(publicJson).toMatchObject({
        errorId: expect.any(String),
        timestamp: expect.any(String),
        code: 'PATTERN_MISMATCH',
        message: 'Invalid email format',
        statusCode: 400,
        retryable: false
      });
      
      // Should not include stack trace or internal context
      expect(publicJson).not.toHaveProperty('stack');
      expect(publicJson).not.toHaveProperty('context');
    }
  });
});