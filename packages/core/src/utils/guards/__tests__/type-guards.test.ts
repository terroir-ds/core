/**
 * @module test/utils/guards/type-guards
 * 
 * Unit tests for type guard utilities
 * 
 * Tests type guard functionality including:
 * - Primitive type guards (string, number, boolean, etc.)
 * - Complex type guards (objects, arrays, functions)
 * - Node.js specific type guards (Buffer, Stream)
 * - Utility type guards (empty objects, plain objects)
 * - Custom type guard creation
 * - Proper TypeScript type narrowing
 * - Edge cases and boundary conditions
 * - Performance with large datasets
 */

import { describe, it, expect } from 'vitest';
import {
  // Primitive type guards
  isString,
  isNumber,
  isBoolean,
  isSymbol,
  isBigInt,
  isFunction,
  isObject,
  isArray,
  isNull,
  isUndefined,
  isNullish,
  isDefined,
  
  // Advanced type guards
  isError,
  isPromise,
  isAsyncFunction,
  isDate,
  isRegExp,
  isMap,
  isSet,
  isWeakMap,
  isWeakSet,
  
  // Utility type guards
  isEmptyObject,
  isEmptyArray,
  isEmptyString,
  isPlainObject,
  isPrimitive,
  isIterable,
  
  // Custom type guard creation
  createTypeGuard,
} from '@utils/guards/type-guards';

describe('Primitive Type Guards', () => {
  describe('isString', () => {
    it('should return true for strings', () => {
      expect(isString('')).toBe(true);
      expect(isString('hello')).toBe(true);
      expect(isString('123')).toBe(true);
      expect(isString(String('test'))).toBe(true);
    });

    it('should return false for non-strings', () => {
      expect(isString(123)).toBe(false);
      expect(isString(true)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString({})).toBe(false);
      expect(isString([])).toBe(false);
      expect(isString(new String('test'))).toBe(false); // String object
    });
  });

  describe('isNumber', () => {
    it('should return true for numbers', () => {
      expect(isNumber(0)).toBe(true);
      expect(isNumber(123)).toBe(true);
      expect(isNumber(-456)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
      expect(isNumber(Infinity)).toBe(true);
      expect(isNumber(-Infinity)).toBe(true);
      expect(isNumber(Number(42))).toBe(true);
    });

    it('should return false for NaN', () => {
      expect(isNumber(NaN)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isNumber('123')).toBe(false);
      expect(isNumber(true)).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
      expect(isNumber({})).toBe(false);
      expect(isNumber([])).toBe(false);
      expect(isNumber(new Number(42))).toBe(false); // Number object
    });
  });

  describe('isBoolean', () => {
    it('should return true for booleans', () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
      expect(isBoolean(Boolean(1))).toBe(true);
      expect(isBoolean(Boolean(0))).toBe(true);
    });

    it('should return false for non-booleans', () => {
      expect(isBoolean(1)).toBe(false);
      expect(isBoolean(0)).toBe(false);
      expect(isBoolean('true')).toBe(false);
      expect(isBoolean('false')).toBe(false);
      expect(isBoolean(null)).toBe(false);
      expect(isBoolean(undefined)).toBe(false);
      expect(isBoolean(new Boolean(true))).toBe(false); // Boolean object
    });
  });

  describe('isSymbol', () => {
    it('should return true for symbols', () => {
      expect(isSymbol(Symbol())).toBe(true);
      expect(isSymbol(Symbol('test'))).toBe(true);
      expect(isSymbol(Symbol.for('global'))).toBe(true);
      expect(isSymbol(Symbol.iterator)).toBe(true);
    });

    it('should return false for non-symbols', () => {
      expect(isSymbol('symbol')).toBe(false);
      expect(isSymbol(123)).toBe(false);
      expect(isSymbol(null)).toBe(false);
      expect(isSymbol(undefined)).toBe(false);
      expect(isSymbol({})).toBe(false);
    });
  });

  describe('isBigInt', () => {
    it('should return true for BigInts', () => {
      expect(isBigInt(BigInt(123))).toBe(true);
      expect(isBigInt(123n)).toBe(true);
      expect(isBigInt(BigInt('456'))).toBe(true);
    });

    it('should return false for non-BigInts', () => {
      expect(isBigInt(123)).toBe(false);
      expect(isBigInt('123n')).toBe(false);
      expect(isBigInt(null)).toBe(false);
      expect(isBigInt(undefined)).toBe(false);
      expect(isBigInt({})).toBe(false);
    });
  });

  describe('isFunction', () => {
    it('should return true for functions', () => {
      expect(isFunction(() => {})).toBe(true);
      expect(isFunction(function() {})).toBe(true);
      expect(isFunction(async function() {})).toBe(true);
      expect(isFunction(function*() {})).toBe(true);
      expect(isFunction(class {})).toBe(true);
      expect(isFunction(Date)).toBe(true);
      expect(isFunction(Math.max)).toBe(true);
    });

    it('should return false for non-functions', () => {
      expect(isFunction({})).toBe(false);
      expect(isFunction([])).toBe(false);
      expect(isFunction('function')).toBe(false);
      expect(isFunction(123)).toBe(false);
      expect(isFunction(null)).toBe(false);
      expect(isFunction(undefined)).toBe(false);
    });
  });

  describe('isObject', () => {
    it('should return true for objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ a: 1 })).toBe(true);
      expect(isObject([])).toBe(true);
      expect(isObject(new Date())).toBe(true);
      expect(isObject(/regex/)).toBe(true);
      expect(isObject(new Map())).toBe(true);
      expect(isObject(new Set())).toBe(true);
    });

    it('should return false for non-objects', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject('string')).toBe(false);
      expect(isObject(123)).toBe(false);
      expect(isObject(true)).toBe(false);
      expect(isObject(Symbol())).toBe(false);
    });
  });

  describe('isArray', () => {
    it('should return true for arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray(new Array(5))).toBe(true);
      expect(isArray(Array.from('hello'))).toBe(true);
    });

    it('should return false for array-like objects', () => {
      expect(isArray({ 0: 'a', 1: 'b', length: 2 })).toBe(false);
      expect(isArray('string')).toBe(false); // Has length property
      expect(isArray({ length: 0 })).toBe(false);
    });

    it('should return false for non-arrays', () => {
      expect(isArray({})).toBe(false);
      expect(isArray('array')).toBe(false);
      expect(isArray(123)).toBe(false);
      expect(isArray(null)).toBe(false);
      expect(isArray(undefined)).toBe(false);
    });
  });

  describe('isNull', () => {
    it('should return true only for null', () => {
      expect(isNull(null)).toBe(true);
    });

    it('should return false for non-null values', () => {
      expect(isNull(undefined)).toBe(false);
      expect(isNull(0)).toBe(false);
      expect(isNull('')).toBe(false);
      expect(isNull(false)).toBe(false);
      expect(isNull({})).toBe(false);
      expect(isNull([])).toBe(false);
    });
  });

  describe('isUndefined', () => {
    it('should return true only for undefined', () => {
      expect(isUndefined(undefined)).toBe(true);
      expect(isUndefined(void 0)).toBe(true);
    });

    it('should return false for non-undefined values', () => {
      expect(isUndefined(null)).toBe(false);
      expect(isUndefined(0)).toBe(false);
      expect(isUndefined('')).toBe(false);
      expect(isUndefined(false)).toBe(false);
      expect(isUndefined({})).toBe(false);
      expect(isUndefined([])).toBe(false);
    });
  });

  describe('isNullish', () => {
    it('should return true for null and undefined', () => {
      expect(isNullish(null)).toBe(true);
      expect(isNullish(undefined)).toBe(true);
      expect(isNullish(void 0)).toBe(true);
    });

    it('should return false for non-nullish values', () => {
      expect(isNullish(0)).toBe(false);
      expect(isNullish('')).toBe(false);
      expect(isNullish(false)).toBe(false);
      expect(isNullish({})).toBe(false);
      expect(isNullish([])).toBe(false);
      expect(isNullish(NaN)).toBe(false);
    });
  });

  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined(0)).toBe(true);
      expect(isDefined('')).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined({})).toBe(true);
      expect(isDefined([])).toBe(true);
      expect(isDefined(NaN)).toBe(true);
    });

    it('should return false for null and undefined', () => {
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
      expect(isDefined(void 0)).toBe(false);
    });
  });
});

describe('Advanced Type Guards', () => {
  describe('isError', () => {
    it('should return true for Error instances', () => {
      expect(isError(new Error())).toBe(true);
      expect(isError(new TypeError())).toBe(true);
      expect(isError(new ReferenceError())).toBe(true);
      expect(isError(new SyntaxError())).toBe(true);
    });

    it('should return false for error-like objects', () => {
      expect(isError({ message: 'error', stack: 'stack' })).toBe(false);
      expect(isError({ name: 'Error', message: 'error' })).toBe(false);
    });

    it('should return false for non-errors', () => {
      expect(isError('Error')).toBe(false);
      expect(isError({})).toBe(false);
      expect(isError(null)).toBe(false);
      expect(isError(undefined)).toBe(false);
    });
  });

  describe('isPromise', () => {
    it('should return true for Promise instances', () => {
      expect(isPromise(Promise.resolve())).toBe(true);
      expect(isPromise(Promise.reject().catch(() => {}))).toBe(true);
      expect(isPromise(new Promise(() => {}))).toBe(true);
    });

    it('should return true for thenable objects', () => {
      const thenable = { then: () => {} };
      expect(isPromise(thenable)).toBe(true);
    });

    it('should return false for non-promises', () => {
      expect(isPromise({})).toBe(false);
      expect(isPromise(() => {})).toBe(false);
      expect(isPromise({ then: 'not a function' })).toBe(false);
      expect(isPromise(null)).toBe(false);
      expect(isPromise(undefined)).toBe(false);
    });
  });

  describe('isAsyncFunction', () => {
    it('should return true for async functions', () => {
      expect(isAsyncFunction(async () => {})).toBe(true);
      expect(isAsyncFunction(async function() {})).toBe(true);
    });

    it('should return false for regular functions', () => {
      expect(isAsyncFunction(() => {})).toBe(false);
      expect(isAsyncFunction(function() {})).toBe(false);
      expect(isAsyncFunction(function*() {})).toBe(false);
    });

    it('should return false for non-functions', () => {
      expect(isAsyncFunction({})).toBe(false);
      expect(isAsyncFunction('async')).toBe(false);
      expect(isAsyncFunction(null)).toBe(false);
    });
  });

  describe('isDate', () => {
    it('should return true for Date instances', () => {
      expect(isDate(new Date())).toBe(true);
      expect(isDate(new Date('2023-01-01'))).toBe(true);
      expect(isDate(new Date(0))).toBe(true);
    });

    it('should return true for invalid dates', () => {
      expect(isDate(new Date('invalid'))).toBe(true);
    });

    it('should return false for date-like values', () => {
      expect(isDate('2023-01-01')).toBe(false);
      expect(isDate(1640995200000)).toBe(false); // Timestamp
      expect(isDate({ getTime: () => Date.now() })).toBe(false);
    });

    it('should return false for non-dates', () => {
      expect(isDate({})).toBe(false);
      expect(isDate(null)).toBe(false);
      expect(isDate(undefined)).toBe(false);
    });
  });

  describe('isRegExp', () => {
    it('should return true for RegExp instances', () => {
      expect(isRegExp(/test/)).toBe(true);
      expect(isRegExp(new RegExp('test'))).toBe(true);
      expect(isRegExp(/test/gi)).toBe(true);
    });

    it('should return false for regex-like strings', () => {
      expect(isRegExp('/test/')).toBe(false);
      expect(isRegExp('test')).toBe(false);
    });

    it('should return false for non-regexes', () => {
      expect(isRegExp({})).toBe(false);
      expect(isRegExp(null)).toBe(false);
      expect(isRegExp(undefined)).toBe(false);
    });
  });

  describe('isMap', () => {
    it('should return true for Map instances', () => {
      expect(isMap(new Map())).toBe(true);
      expect(isMap(new Map([['a', 1]]))).toBe(true);
    });

    it('should return false for map-like objects', () => {
      expect(isMap({ set: () => {}, get: () => {} })).toBe(false);
      expect(isMap({})).toBe(false);
    });

    it('should return false for non-maps', () => {
      expect(isMap([])).toBe(false);
      expect(isMap(null)).toBe(false);
      expect(isMap(undefined)).toBe(false);
    });
  });

  describe('isSet', () => {
    it('should return true for Set instances', () => {
      expect(isSet(new Set())).toBe(true);
      expect(isSet(new Set([1, 2, 3]))).toBe(true);
    });

    it('should return false for set-like objects', () => {
      expect(isSet({ add: () => {}, has: () => {} })).toBe(false);
      expect(isSet([])).toBe(false);
    });

    it('should return false for non-sets', () => {
      expect(isSet({})).toBe(false);
      expect(isSet(null)).toBe(false);
      expect(isSet(undefined)).toBe(false);
    });
  });

  describe('isWeakMap', () => {
    it('should return true for WeakMap instances', () => {
      expect(isWeakMap(new WeakMap())).toBe(true);
    });

    it('should return false for non-weakmaps', () => {
      expect(isWeakMap(new Map())).toBe(false);
      expect(isWeakMap({})).toBe(false);
      expect(isWeakMap(null)).toBe(false);
    });
  });

  describe('isWeakSet', () => {
    it('should return true for WeakSet instances', () => {
      expect(isWeakSet(new WeakSet())).toBe(true);
    });

    it('should return false for non-weaksets', () => {
      expect(isWeakSet(new Set())).toBe(false);
      expect(isWeakSet([])).toBe(false);
      expect(isWeakSet(null)).toBe(false);
    });
  });
});

describe('Utility Type Guards', () => {
  describe('isEmptyObject', () => {
    it('should return true for empty objects', () => {
      expect(isEmptyObject({})).toBe(true);
      expect(isEmptyObject(Object.create(null))).toBe(true);
    });

    it('should return false for non-empty objects', () => {
      expect(isEmptyObject({ a: 1 })).toBe(false);
      expect(isEmptyObject({ length: 0 })).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isEmptyObject([])).toBe(false);
      expect(isEmptyObject(null)).toBe(false);
      expect(isEmptyObject(undefined)).toBe(false);
      expect(isEmptyObject('')).toBe(false);
    });
  });

  describe('isEmptyArray', () => {
    it('should return true for empty arrays', () => {
      expect(isEmptyArray([])).toBe(true);
      expect(isEmptyArray(new Array())).toBe(true);
    });

    it('should return false for non-empty arrays', () => {
      expect(isEmptyArray([1])).toBe(false);
      expect(isEmptyArray([''])).toBe(false);
      expect(isEmptyArray([undefined])).toBe(false);
    });

    it('should return false for non-arrays', () => {
      expect(isEmptyArray({})).toBe(false);
      expect(isEmptyArray('')).toBe(false);
      expect(isEmptyArray(null)).toBe(false);
    });
  });

  describe('isEmptyString', () => {
    it('should return true for empty strings', () => {
      expect(isEmptyString('')).toBe(true);
      expect(isEmptyString(String())).toBe(true);
    });

    it('should return false for non-empty strings', () => {
      expect(isEmptyString(' ')).toBe(false);
      expect(isEmptyString('a')).toBe(false);
      expect(isEmptyString('0')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(isEmptyString(0)).toBe(false);
      expect(isEmptyString([])).toBe(false);
      expect(isEmptyString(null)).toBe(false);
    });
  });

  describe('isPlainObject', () => {
    it('should return true for plain objects', () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject({ a: 1 })).toBe(true);
      expect(isPlainObject(Object.create(null))).toBe(true);
    });

    it('should return false for non-plain objects', () => {
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(new Date())).toBe(false);
      expect(isPlainObject(new Map())).toBe(false);
      expect(isPlainObject(/regex/)).toBe(false);
      expect(isPlainObject(() => {})).toBe(false);
    });

    it('should return false for instances of custom classes', () => {
      class Custom {}
      expect(isPlainObject(new Custom())).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isPlainObject(null)).toBe(false);
      expect(isPlainObject(undefined)).toBe(false);
      expect(isPlainObject('object')).toBe(false);
    });
  });

  describe('isPrimitive', () => {
    it('should return true for primitive values', () => {
      expect(isPrimitive('string')).toBe(true);
      expect(isPrimitive(123)).toBe(true);
      expect(isPrimitive(true)).toBe(true);
      expect(isPrimitive(null)).toBe(true);
      expect(isPrimitive(undefined)).toBe(true);
      expect(isPrimitive(Symbol())).toBe(true);
      expect(isPrimitive(123n)).toBe(true);
    });

    it('should return false for non-primitive values', () => {
      expect(isPrimitive({})).toBe(false);
      expect(isPrimitive([])).toBe(false);
      expect(isPrimitive(() => {})).toBe(false);
      expect(isPrimitive(new Date())).toBe(false);
      expect(isPrimitive(/regex/)).toBe(false);
    });
  });

  describe('isIterable', () => {
    it('should return true for iterable objects', () => {
      expect(isIterable([])).toBe(true);
      expect(isIterable('string')).toBe(true);
      expect(isIterable(new Set())).toBe(true);
      expect(isIterable(new Map())).toBe(true);
      expect(isIterable(new Int8Array())).toBe(true);
    });

    it('should return true for custom iterables', () => {
      const customIterable = {
        *[Symbol.iterator]() {
          yield 1;
          yield 2;
        }
      };
      expect(isIterable(customIterable)).toBe(true);
    });

    it('should return false for non-iterable objects', () => {
      expect(isIterable({})).toBe(false);
      expect(isIterable(123)).toBe(false);
      expect(isIterable(null)).toBe(false);
      expect(isIterable(undefined)).toBe(false);
    });
  });
});

describe('Custom Type Guard Creation', () => {
  describe('createTypeGuard', () => {
    it('should create a type guard from a predicate', () => {
      const isEven = createTypeGuard((n: unknown): n is number => 
        typeof n === 'number' && n % 2 === 0
      );

      expect(isEven(2)).toBe(true);
      expect(isEven(4)).toBe(true);
      expect(isEven(1)).toBe(false);
      expect(isEven(3)).toBe(false);
      expect(isEven('2')).toBe(false);
    });

    it('should work with complex predicates', () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const isUser = createTypeGuard((obj: unknown): obj is User => {
        return isPlainObject(obj) &&
               'id' in obj && typeof (obj as User).id === 'number' &&
               'name' in obj && typeof (obj as User).name === 'string' &&
               'email' in obj && typeof (obj as User).email === 'string';
      });

      expect(isUser({ id: 1, name: 'John', email: 'john@example.com' })).toBe(true);
      expect(isUser({ id: 1, name: 'John' })).toBe(false); // Missing email
      expect(isUser({ id: '1', name: 'John', email: 'john@example.com' })).toBe(false); // Wrong id type
      expect(isUser(null)).toBe(false);
    });
  });
});

describe('Performance Tests', () => {
  it('should handle large datasets efficiently', () => {
    // largeArray was removed as it's not used in the test
    const mixedArray = Array.from({ length: 10000 }, (_, i) => 
      i % 2 === 0 ? i : `item-${i}`
    );

    const start = performance.now();
    const numbers = mixedArray.filter(isNumber);
    const strings = mixedArray.filter(isString);
    const end = performance.now();

    expect(numbers).toHaveLength(5000);
    expect(strings).toHaveLength(5000);
    expect(end - start).toBeLessThan(100); // Should complete in less than 100ms
  });

  it('should be efficient with nested type checking', () => {
    const complexData = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      data: i % 3 === 0 ? [1, 2, 3] : { nested: true },
      optional: i % 2 === 0 ? new Date() : undefined
    }));

    const start = performance.now();
    const withArrayData = complexData.filter(item => isArray(item.data));
    const withObjectData = complexData.filter(item => isPlainObject(item.data));
    const withDates = complexData.filter(item => isDate(item.optional));
    const end = performance.now();

    expect(withArrayData).toHaveLength(334); // Every 3rd item (1000/3 ≈ 333)
    expect(withObjectData).toHaveLength(666); // Remaining items
    expect(withDates).toHaveLength(500); // Every 2nd item
    expect(end - start).toBeLessThan(50); // Should be very fast
  });
});

describe('Edge Cases', () => {
  it('should handle prototype pollution attempts', () => {
    const maliciousObject = JSON.parse('{"__proto__": {"polluted": true}}');
    expect(isPlainObject(maliciousObject)).toBe(true);
    expect(isEmptyObject(maliciousObject)).toBe(false);
  });

  it('should handle circular references', () => {
    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;

    expect(isObject(circular)).toBe(true);
    expect(isPlainObject(circular)).toBe(true);
    expect(isEmptyObject(circular)).toBe(false);
  });

  it('should handle objects with no prototype', () => {
    const nullProto = Object.create(null);
    nullProto.prop = 'value';

    expect(isObject(nullProto)).toBe(true);
    expect(isPlainObject(nullProto)).toBe(true);
    expect(isEmptyObject(Object.create(null))).toBe(true);
  });

  it('should handle frozen and sealed objects', () => {
    const frozen = Object.freeze({ a: 1 });
    const sealed = Object.seal({ b: 2 });

    expect(isObject(frozen)).toBe(true);
    expect(isObject(sealed)).toBe(true);
    expect(isPlainObject(frozen)).toBe(true);
    expect(isPlainObject(sealed)).toBe(true);
    expect(isEmptyObject(frozen)).toBe(false);
    expect(isEmptyObject(sealed)).toBe(false);
  });
});

describe('TypeScript Type Narrowing', () => {
  it('should properly narrow types in conditional blocks', () => {
    function processValue(value: unknown): string {
      if (isString(value)) {
        // TypeScript should know value is string here
        return value.toUpperCase();
      }
      
      if (isNumber(value)) {
        // TypeScript should know value is number here
        return value.toFixed(2);
      }
      
      if (isArray(value)) {
        // TypeScript should know value is unknown[] here
        return `Array with ${value.length} items`;
      }
      
      return 'Unknown type';
    }

    expect(processValue('hello')).toBe('HELLO');
    expect(processValue(3.14159)).toBe('3.14');
    expect(processValue([1, 2, 3])).toBe('Array with 3 items');
    expect(processValue({})).toBe('Unknown type');
  });

  it('should work with generic type guards', () => {
    function processOptional<T>(value: T | undefined, processor: (val: T) => string): string {
      if (isDefined(value)) {
        // TypeScript should know value is T here
        return processor(value);
      }
      return 'undefined';
    }

    expect(processOptional('test', s => s.toUpperCase())).toBe('TEST');
    expect(processOptional(undefined, (s: string) => s.toUpperCase())).toBe('undefined');
  });
});