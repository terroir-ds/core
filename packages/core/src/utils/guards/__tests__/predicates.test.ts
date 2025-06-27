/**
 * @module test/utils/guards/predicates
 * 
 * Unit tests for predicate utilities
 * 
 * Tests predicate functionality including:
 * - Numeric predicates (positive, negative, ranges)
 * - String predicates (empty, length, patterns)
 * - Array predicates (length, content validation)
 * - Object predicates (property checks)
 * - Logical combinators (and, or, not, xor)
 * - Utility predicates (equality, one-of)
 * - Predicate composition and chaining
 * - Performance with filtering operations
 * - Type narrowing in conditional logic
 */

import { describe, it, expect } from 'vitest';
import {
  // Types
  type Predicate,
  type TypeGuardPredicate,
  
  // Numeric predicates
  isPositive,
  isNegative,
  isZero,
  isInteger,
  isFinite,
  isInRange,
  isGreaterThan,
  isLessThan,
  
  // String predicates
  isEmpty,
  isNotEmpty,
  hasMinLength,
  hasMaxLength,
  hasExactLength,
  matches,
  startsWith,
  endsWith,
  
  // Array predicates
  hasLength,
  hasMinItems,
  hasMaxItems,
  includes,
  every,
  some,
  
  // Object predicates
  hasProperty,
  hasProperties,
  hasPropertyValue,
  
  // Logical combinators
  not,
  and,
  or,
  xor,
  
  // Utility predicates
  alwaysTrue,
  alwaysFalse,
  equals,
  deepEquals,
  oneOf,
} from '../predicates.js';

describe('Numeric Predicates', () => {
  describe('isPositive', () => {
    it('should return true for positive numbers', () => {
      expect(isPositive(1)).toBe(true);
      expect(isPositive(0.1)).toBe(true);
      expect(isPositive(Infinity)).toBe(true);
      expect(isPositive(Number.MAX_VALUE)).toBe(true);
    });

    it('should return false for non-positive numbers', () => {
      expect(isPositive(0)).toBe(false);
      expect(isPositive(-1)).toBe(false);
      expect(isPositive(-0.1)).toBe(false);
      expect(isPositive(-Infinity)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isPositive('1')).toBe(false);
      expect(isPositive(true)).toBe(false);
      expect(isPositive(null)).toBe(false);
      expect(isPositive(undefined)).toBe(false);
      expect(isPositive({})).toBe(false);
      expect(isPositive(NaN)).toBe(false);
    });
  });

  describe('isNegative', () => {
    it('should return true for negative numbers', () => {
      expect(isNegative(-1)).toBe(true);
      expect(isNegative(-0.1)).toBe(true);
      expect(isNegative(-Infinity)).toBe(true);
      expect(isNegative(Number.MIN_VALUE * -1)).toBe(true);
    });

    it('should return false for non-negative numbers', () => {
      expect(isNegative(0)).toBe(false);
      expect(isNegative(1)).toBe(false);
      expect(isNegative(0.1)).toBe(false);
      expect(isNegative(Infinity)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isNegative('-1')).toBe(false);
      expect(isNegative(false)).toBe(false);
      expect(isNegative(null)).toBe(false);
      expect(isNegative(NaN)).toBe(false);
    });
  });

  describe('isZero', () => {
    it('should return true for zero', () => {
      expect(isZero(0)).toBe(true);
      expect(isZero(-0)).toBe(true);
      expect(isZero(0.0)).toBe(true);
    });

    it('should return false for non-zero numbers', () => {
      expect(isZero(1)).toBe(false);
      expect(isZero(-1)).toBe(false);
      expect(isZero(0.1)).toBe(false);
      expect(isZero(NaN)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isZero('0')).toBe(false);
      expect(isZero(false)).toBe(false);
      expect(isZero(null)).toBe(false);
    });
  });

  describe('isInteger', () => {
    it('should return true for integers', () => {
      expect(isInteger(0)).toBe(true);
      expect(isInteger(1)).toBe(true);
      expect(isInteger(-1)).toBe(true);
      expect(isInteger(42)).toBe(true);
      expect(isInteger(Number.MAX_SAFE_INTEGER)).toBe(true);
    });

    it('should return false for non-integers', () => {
      expect(isInteger(1.5)).toBe(false);
      expect(isInteger(0.1)).toBe(false);
      expect(isInteger(Infinity)).toBe(false);
      expect(isInteger(-Infinity)).toBe(false);
      expect(isInteger(NaN)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isInteger('1')).toBe(false);
      expect(isInteger(true)).toBe(false);
      expect(isInteger(null)).toBe(false);
    });
  });

  describe('isFinite', () => {
    it('should return true for finite numbers', () => {
      expect(isFinite(0)).toBe(true);
      expect(isFinite(1)).toBe(true);
      expect(isFinite(-1)).toBe(true);
      expect(isFinite(1.5)).toBe(true);
      expect(isFinite(Number.MAX_VALUE)).toBe(true);
      expect(isFinite(Number.MIN_VALUE)).toBe(true);
    });

    it('should return false for infinite numbers', () => {
      expect(isFinite(Infinity)).toBe(false);
      expect(isFinite(-Infinity)).toBe(false);
      expect(isFinite(NaN)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isFinite('1')).toBe(false);
      expect(isFinite(null)).toBe(false);
      expect(isFinite(undefined)).toBe(false);
    });
  });

  describe('isInRange', () => {
    it('should return predicate that checks range inclusively', () => {
      const isValidAge = isInRange(0, 120);
      
      expect(isValidAge(0)).toBe(true);
      expect(isValidAge(25)).toBe(true);
      expect(isValidAge(120)).toBe(true);
      expect(isValidAge(-1)).toBe(false);
      expect(isValidAge(121)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      const isPercentage = isInRange(0, 100);
      
      expect(isPercentage('50')).toBe(false);
      expect(isPercentage(null)).toBe(false);
      expect(isPercentage(undefined)).toBe(false);
    });

    it('should work with decimal ranges', () => {
      const isRating = isInRange(0.0, 5.0);
      
      expect(isRating(3.5)).toBe(true);
      expect(isRating(0.0)).toBe(true);
      expect(isRating(5.0)).toBe(true);
      expect(isRating(-0.1)).toBe(false);
      expect(isRating(5.1)).toBe(false);
    });
  });

  describe('isGreaterThan', () => {
    it('should return predicate that checks greater than', () => {
      const isAdult = isGreaterThan(17); // 18+
      
      expect(isAdult(18)).toBe(true);
      expect(isAdult(25)).toBe(true);
      expect(isAdult(17)).toBe(false);
      expect(isAdult(16)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      const isPositiveNonZero = isGreaterThan(0);
      
      expect(isPositiveNonZero('1')).toBe(false);
      expect(isPositiveNonZero(true)).toBe(false);
    });
  });

  describe('isLessThan', () => {
    it('should return predicate that checks less than', () => {
      const isChild = isLessThan(18);
      
      expect(isChild(17)).toBe(true);
      expect(isChild(10)).toBe(true);
      expect(isChild(18)).toBe(false);
      expect(isChild(25)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      const isBelowFreezing = isLessThan(0);
      
      expect(isBelowFreezing('-10')).toBe(false);
      expect(isBelowFreezing(false)).toBe(false);
    });
  });
});

describe('String Predicates', () => {
  describe('isEmpty', () => {
    it('should return true for empty strings', () => {
      expect(isEmpty('')).toBe(true);
      expect(isEmpty(String())).toBe(true);
    });

    it('should return false for non-empty strings', () => {
      expect(isEmpty(' ')).toBe(false);
      expect(isEmpty('a')).toBe(false);
      expect(isEmpty('hello')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty([])).toBe(false);
      expect(isEmpty(null)).toBe(false);
      expect(isEmpty(undefined)).toBe(false);
    });
  });

  describe('isNotEmpty', () => {
    it('should return true for non-empty strings', () => {
      expect(isNotEmpty(' ')).toBe(true);
      expect(isNotEmpty('a')).toBe(true);
      expect(isNotEmpty('hello')).toBe(true);
    });

    it('should return false for empty strings', () => {
      expect(isNotEmpty('')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(isNotEmpty(1)).toBe(false);
      expect(isNotEmpty(true)).toBe(false);
      expect(isNotEmpty([])).toBe(false);
    });
  });

  describe('hasMinLength', () => {
    it('should return predicate that checks minimum length', () => {
      const hasValidName = hasMinLength(2);
      
      expect(hasValidName('John')).toBe(true);
      expect(hasValidName('Al')).toBe(true);
      expect(hasValidName('A')).toBe(false);
      expect(hasValidName('')).toBe(false);
    });

    it('should return false for non-strings', () => {
      const hasMinTwo = hasMinLength(2);
      
      expect(hasMinTwo([1, 2])).toBe(false);
      expect(hasMinTwo(12)).toBe(false);
      expect(hasMinTwo(null)).toBe(false);
    });
  });

  describe('hasMaxLength', () => {
    it('should return predicate that checks maximum length', () => {
      const hasBriefDescription = hasMaxLength(100);
      
      expect(hasBriefDescription('Short')).toBe(true);
      expect(hasBriefDescription('')).toBe(true);
      expect(hasBriefDescription('A'.repeat(100))).toBe(true);
      expect(hasBriefDescription('A'.repeat(101))).toBe(false);
    });

    it('should return false for non-strings', () => {
      const hasMaxTen = hasMaxLength(10);
      
      expect(hasMaxTen(5)).toBe(false);
      expect(hasMaxTen([])).toBe(false);
    });
  });

  describe('hasExactLength', () => {
    it('should return predicate that checks exact length', () => {
      const isValidZipCode = hasExactLength(5);
      
      expect(isValidZipCode('12345')).toBe(true);
      expect(isValidZipCode('1234')).toBe(false);
      expect(isValidZipCode('123456')).toBe(false);
      expect(isValidZipCode('')).toBe(false);
    });

    it('should return false for non-strings', () => {
      const hasLengthFive = hasExactLength(5);
      
      expect(hasLengthFive([1, 2, 3, 4, 5])).toBe(false);
      expect(hasLengthFive(12345)).toBe(false);
    });
  });

  describe('matches', () => {
    it('should return predicate that checks regex patterns', () => {
      const isEmailLike = matches(/@/);
      const isNumeric = matches(/^\d+$/);
      
      expect(isEmailLike('user@domain.com')).toBe(true);
      expect(isEmailLike('invalid')).toBe(false);
      
      expect(isNumeric('123')).toBe(true);
      expect(isNumeric('abc')).toBe(false);
    });

    it('should work with string patterns', () => {
      const hasAtSign = matches('@');
      
      expect(hasAtSign('email@domain.com')).toBe(true);
      expect(hasAtSign('no-at-sign')).toBe(false);
    });

    it('should return false for non-strings', () => {
      const isPattern = matches(/test/);
      
      expect(isPattern(123)).toBe(false);
      expect(isPattern(null)).toBe(false);
      expect(isPattern(undefined)).toBe(false);
    });
  });

  describe('startsWith', () => {
    it('should return predicate that checks prefix', () => {
      const isHttpUrl = startsWith('http');
      
      expect(isHttpUrl('https://example.com')).toBe(true);
      expect(isHttpUrl('http://example.com')).toBe(true);
      expect(isHttpUrl('ftp://example.com')).toBe(false);
    });

    it('should support case-insensitive matching', () => {
      const isApiRoute = startsWith('/api/', false);
      
      expect(isApiRoute('/API/users')).toBe(true);
      expect(isApiRoute('/api/users')).toBe(true);
      expect(isApiRoute('/web/users')).toBe(false);
    });

    it('should return false for non-strings', () => {
      const startsWithA = startsWith('a');
      
      expect(startsWithA(123)).toBe(false);
      expect(startsWithA(['a', 'b'])).toBe(false);
    });
  });

  describe('endsWith', () => {
    it('should return predicate that checks suffix', () => {
      const isJavaScriptFile = endsWith('.js');
      
      expect(isJavaScriptFile('script.js')).toBe(true);
      expect(isJavaScriptFile('module.mjs')).toBe(false);
      expect(isJavaScriptFile('style.css')).toBe(false);
    });

    it('should support multiple suffixes', () => {
      const isImageFile = endsWith(['.jpg', '.png', '.gif']);
      
      expect(isImageFile('photo.jpg')).toBe(true);
      expect(isImageFile('logo.png')).toBe(true);
      expect(isImageFile('animation.gif')).toBe(true);
      expect(isImageFile('document.pdf')).toBe(false);
    });

    it('should support case-insensitive matching', () => {
      const isImageFile = endsWith(['.jpg', '.png'], false);
      
      expect(isImageFile('photo.JPG')).toBe(true);
      expect(isImageFile('logo.PNG')).toBe(true);
    });

    it('should return false for non-strings', () => {
      const endsWithJs = endsWith('.js');
      
      expect(endsWithJs(123)).toBe(false);
      expect(endsWithJs({})).toBe(false);
    });
  });
});

describe('Array Predicates', () => {
  describe('hasLength', () => {
    it('should return predicate that checks exact array length', () => {
      const isPair = hasLength(2);
      
      expect(isPair([1, 2])).toBe(true);
      expect(isPair(['a', 'b'])).toBe(true);
      expect(isPair([1])).toBe(false);
      expect(isPair([1, 2, 3])).toBe(false);
      expect(isPair([])).toBe(false);
    });

    it('should return false for non-arrays', () => {
      const hasLengthTwo = hasLength(2);
      
      expect(hasLengthTwo('ab')).toBe(false);
      expect(hasLengthTwo({ length: 2 })).toBe(false);
      expect(hasLengthTwo(null)).toBe(false);
    });
  });

  describe('hasMinItems', () => {
    it('should return predicate that checks minimum array length', () => {
      const hasMultipleItems = hasMinItems(2);
      
      expect(hasMultipleItems([1, 2])).toBe(true);
      expect(hasMultipleItems([1, 2, 3])).toBe(true);
      expect(hasMultipleItems([1])).toBe(false);
      expect(hasMultipleItems([])).toBe(false);
    });

    it('should return false for non-arrays', () => {
      const hasMinOne = hasMinItems(1);
      
      expect(hasMinOne('a')).toBe(false);
      expect(hasMinOne(1)).toBe(false);
    });
  });

  describe('hasMaxItems', () => {
    it('should return predicate that checks maximum array length', () => {
      const isSmallList = hasMaxItems(5);
      
      expect(isSmallList([])).toBe(true);
      expect(isSmallList([1, 2, 3])).toBe(true);
      expect(isSmallList([1, 2, 3, 4, 5])).toBe(true);
      expect(isSmallList([1, 2, 3, 4, 5, 6])).toBe(false);
    });

    it('should return false for non-arrays', () => {
      const hasMaxFive = hasMaxItems(5);
      
      expect(hasMaxFive('hello')).toBe(false);
      expect(hasMaxFive(5)).toBe(false);
    });
  });

  describe('includes', () => {
    it('should return predicate that checks array inclusion', () => {
      const hasApple = includes('apple');
      const hasZero = includes(0);
      
      expect(hasApple(['apple', 'banana'])).toBe(true);
      expect(hasApple(['banana', 'orange'])).toBe(false);
      
      expect(hasZero([0, 1, 2])).toBe(true);
      expect(hasZero([1, 2, 3])).toBe(false);
    });

    it('should work with object references', () => {
      const obj = { id: 1 };
      const hasObj = includes(obj);
      
      expect(hasObj([obj, { id: 2 }])).toBe(true);
      expect(hasObj([{ id: 1 }, { id: 2 }])).toBe(false); // Different reference
    });

    it('should return false for non-arrays', () => {
      const hasA = includes('a');
      
      expect(hasA('abc')).toBe(false);
      expect(hasA({ a: true })).toBe(false);
    });
  });

  describe('every', () => {
    it('should return predicate that checks all items', () => {
      const allPositive = every(isPositive);
      const allStrings = every((x: unknown): x is string => typeof x === 'string');
      
      expect(allPositive([1, 2, 3])).toBe(true);
      expect(allPositive([1, -2, 3])).toBe(false);
      expect(allPositive([])).toBe(true); // Empty array
      
      expect(allStrings(['a', 'b', 'c'])).toBe(true);
      expect(allStrings(['a', 1, 'c'])).toBe(false);
    });

    it('should return false for non-arrays', () => {
      const allNumbers = every((x: unknown): x is number => typeof x === 'number');
      
      expect(allNumbers('123')).toBe(false);
      expect(allNumbers(null)).toBe(false);
    });
  });

  describe('some', () => {
    it('should return predicate that checks any items', () => {
      const somePositive = some(isPositive);
      const someStrings = some((x: unknown): x is string => typeof x === 'string');
      
      expect(somePositive([1, -2])).toBe(true);
      expect(somePositive([-1, -2])).toBe(false);
      expect(somePositive([])).toBe(false); // Empty array
      
      expect(someStrings(['a', 1])).toBe(true);
      expect(someStrings([1, 2])).toBe(false);
    });

    it('should return false for non-arrays', () => {
      const someNumbers = some((x: unknown): x is number => typeof x === 'number');
      
      expect(someNumbers('123')).toBe(false);
      expect(someNumbers(null)).toBe(false);
    });
  });
});

describe('Object Predicates', () => {
  describe('hasProperty', () => {
    it('should return predicate that checks property existence', () => {
      const hasId = hasProperty('id');
      const hasEmail = hasProperty('email');
      
      expect(hasId({ id: 1, name: 'John' })).toBe(true);
      expect(hasId({ name: 'John' })).toBe(false);
      
      expect(hasEmail({ email: 'john@example.com' })).toBe(true);
      expect(hasEmail({ name: 'John' })).toBe(false);
    });

    it('should work with symbol properties', () => {
      const sym = Symbol('test');
      const hasSymbol = hasProperty(sym);
      
      expect(hasSymbol({ [sym]: 'value' })).toBe(true);
      expect(hasSymbol({ other: 'value' })).toBe(false);
    });

    it('should return false for non-objects', () => {
      const hasLength = hasProperty('length');
      
      expect(hasLength('string')).toBe(false); // Strings have length but not object-like
      expect(hasLength(null)).toBe(false);
      expect(hasLength(undefined)).toBe(false);
      expect(hasLength(123)).toBe(false);
    });
  });

  describe('hasProperties', () => {
    it('should return predicate that checks multiple properties', () => {
      const hasUserFields = hasProperties(['id', 'name', 'email']);
      
      expect(hasUserFields({ id: 1, name: 'John', email: 'john@example.com' })).toBe(true);
      expect(hasUserFields({ id: 1, name: 'John' })).toBe(false); // Missing email
      expect(hasUserFields({ id: 1, name: 'John', email: 'john@example.com', extra: true })).toBe(true); // Extra properties OK
    });

    it('should return true for empty property list', () => {
      const hasNoRequired = hasProperties([]);
      
      expect(hasNoRequired({})).toBe(true);
      expect(hasNoRequired({ any: 'property' })).toBe(true);
    });

    it('should return false for non-objects', () => {
      const hasProps = hasProperties(['prop']);
      
      expect(hasProps(null)).toBe(false);
      expect(hasProps('string')).toBe(false);
      expect(hasProps(123)).toBe(false);
    });
  });

  describe('hasPropertyValue', () => {
    it('should return predicate that checks property value', () => {
      const isActive = hasPropertyValue('active', true);
      const isAdmin = hasPropertyValue('role', 'admin');
      
      expect(isActive({ active: true, name: 'John' })).toBe(true);
      expect(isActive({ active: false, name: 'John' })).toBe(false);
      expect(isActive({ name: 'John' })).toBe(false); // Missing property
      
      expect(isAdmin({ role: 'admin' })).toBe(true);
      expect(isAdmin({ role: 'user' })).toBe(false);
    });

    it('should use strict equality', () => {
      const hasZero = hasPropertyValue('value', 0);
      
      expect(hasZero({ value: 0 })).toBe(true);
      expect(hasZero({ value: '0' })).toBe(false);
      expect(hasZero({ value: false })).toBe(false);
    });

    it('should return false for non-objects', () => {
      const hasValue = hasPropertyValue('prop', 'value');
      
      expect(hasValue(null)).toBe(false);
      expect(hasValue('string')).toBe(false);
    });
  });
});

describe('Logical Combinators', () => {
  describe('not', () => {
    it('should negate predicates', () => {
      const isNotEmpty = not(isEmpty);
      const isNotPositive = not(isPositive);
      
      expect(isNotEmpty('hello')).toBe(true);
      expect(isNotEmpty('')).toBe(false);
      
      expect(isNotPositive(-1)).toBe(true);
      expect(isNotPositive(1)).toBe(false);
    });

    it('should work with complex predicates', () => {
      const isNotInRange = not(isInRange(0, 100));
      
      expect(isNotInRange(-1)).toBe(true);
      expect(isNotInRange(101)).toBe(true);
      expect(isNotInRange(50)).toBe(false);
    });
  });

  describe('and', () => {
    it('should combine predicates with AND logic', () => {
      const isValidAge = and(isPositive, isInRange(0, 120));
      const isValidName = and(
        (x: unknown): x is string => typeof x === 'string',
        isNotEmpty,
        hasMinLength(2)
      );
      
      expect(isValidAge(25)).toBe(true);
      expect(isValidAge(0)).toBe(false); // Not positive
      expect(isValidAge(150)).toBe(false); // Out of range
      expect(isValidAge(-5)).toBe(false); // Both fail
      
      expect(isValidName('John')).toBe(true);
      expect(isValidName('A')).toBe(false); // Too short
      expect(isValidName('')).toBe(false); // Empty
      expect(isValidName(123)).toBe(false); // Not string
    });

    it('should short-circuit on first failure', () => {
      let called = false;
      const sideEffect = (x: unknown) => {
        called = true;
        return true;
      };
      
      const combined = and(
        (x: unknown) => false, // Always fails
        sideEffect
      );
      
      combined('test');
      expect(called).toBe(false); // Should not be called
    });
  });

  describe('or', () => {
    it('should combine predicates with OR logic', () => {
      const isValidId = or(
        (x: unknown): x is string => typeof x === 'string',
        (x: unknown): x is number => typeof x === 'number'
      );
      const isSpecialAge = or(isZero, isInRange(65, 120));
      
      expect(isValidId(123)).toBe(true);
      expect(isValidId('abc')).toBe(true);
      expect(isValidId(true)).toBe(false);
      
      expect(isSpecialAge(0)).toBe(true);
      expect(isSpecialAge(70)).toBe(true);
      expect(isSpecialAge(30)).toBe(false);
    });

    it('should short-circuit on first success', () => {
      let called = false;
      const sideEffect = (x: unknown) => {
        called = true;
        return false;
      };
      
      const combined = or(
        (x: unknown) => true, // Always succeeds
        sideEffect
      );
      
      combined('test');
      expect(called).toBe(false); // Should not be called
    });
  });

  describe('xor', () => {
    it('should combine predicates with XOR logic', () => {
      const isExclusiveCondition = xor(
        (x: number) => x > 0,
        (x: number) => x < 10
      );
      
      expect(isExclusiveCondition(-5)).toBe(true); // Only second condition (< 10)
      expect(isExclusiveCondition(15)).toBe(true); // Only first condition (> 0)
      expect(isExclusiveCondition(5)).toBe(false); // Both conditions true
      expect(isExclusiveCondition(-15)).toBe(true); // Only second condition (< 10)
    });

    it('should work with multiple predicates', () => {
      const exactlyOne = xor(
        (x: number) => x === 1,
        (x: number) => x === 2,
        (x: number) => x === 3
      );
      
      expect(exactlyOne(1)).toBe(true);
      expect(exactlyOne(2)).toBe(true);
      expect(exactlyOne(3)).toBe(true);
      expect(exactlyOne(4)).toBe(false);
    });
  });
});

describe('Utility Predicates', () => {
  describe('alwaysTrue', () => {
    it('should always return true', () => {
      const predicate = alwaysTrue();
      
      expect(predicate(true)).toBe(true);
      expect(predicate(false)).toBe(true);
      expect(predicate(null)).toBe(true);
      expect(predicate(undefined)).toBe(true);
      expect(predicate({})).toBe(true);
      expect(predicate([])).toBe(true);
    });
  });

  describe('alwaysFalse', () => {
    it('should always return false', () => {
      const predicate = alwaysFalse();
      
      expect(predicate(true)).toBe(false);
      expect(predicate(false)).toBe(false);
      expect(predicate(null)).toBe(false);
      expect(predicate(undefined)).toBe(false);
      expect(predicate({})).toBe(false);
      expect(predicate([])).toBe(false);
    });
  });

  describe('equals', () => {
    it('should check strict equality', () => {
      const isZero = equals(0);
      const isTrue = equals(true);
      const isNull = equals(null);
      
      expect(isZero(0)).toBe(true);
      expect(isZero('0')).toBe(false);
      expect(isZero(false)).toBe(false);
      
      expect(isTrue(true)).toBe(true);
      expect(isTrue(1)).toBe(false);
      expect(isTrue('true')).toBe(false);
      
      expect(isNull(null)).toBe(true);
      expect(isNull(undefined)).toBe(false);
    });

    it('should work with object references', () => {
      const obj = { id: 1 };
      const isObj = equals(obj);
      
      expect(isObj(obj)).toBe(true);
      expect(isObj({ id: 1 })).toBe(false); // Different reference
    });
  });

  describe('deepEquals', () => {
    it('should check deep equality for objects', () => {
      const isDefaultConfig = deepEquals({ theme: 'light', lang: 'en' });
      
      expect(isDefaultConfig({ theme: 'light', lang: 'en' })).toBe(true);
      expect(isDefaultConfig({ theme: 'dark', lang: 'en' })).toBe(false);
      expect(isDefaultConfig({ theme: 'light', lang: 'fr' })).toBe(false);
      expect(isDefaultConfig({ theme: 'light', lang: 'en', extra: true })).toBe(false);
    });

    it('should handle nested objects', () => {
      const isNestedConfig = deepEquals({
        user: { name: 'John', age: 30 },
        settings: { theme: 'dark' }
      });
      
      expect(isNestedConfig({
        user: { name: 'John', age: 30 },
        settings: { theme: 'dark' }
      })).toBe(true);
      
      expect(isNestedConfig({
        user: { name: 'Jane', age: 30 },
        settings: { theme: 'dark' }
      })).toBe(false);
    });

    it('should handle primitive values', () => {
      const isFortyTwo = deepEquals(42);
      
      expect(isFortyTwo(42)).toBe(true);
      expect(isFortyTwo('42')).toBe(false);
      expect(isFortyTwo(43)).toBe(false);
    });

    it('should handle null and undefined', () => {
      const isNull = deepEquals(null);
      const isUndefined = deepEquals(undefined);
      
      expect(isNull(null)).toBe(true);
      expect(isNull(undefined)).toBe(false);
      
      expect(isUndefined(undefined)).toBe(true);
      expect(isUndefined(null)).toBe(false);
    });
  });

  describe('oneOf', () => {
    it('should check if value is in allowed list', () => {
      const isValidStatus = oneOf(['active', 'inactive', 'pending']);
      const isPrimaryColor = oneOf(['red', 'blue', 'yellow']);
      
      expect(isValidStatus('active')).toBe(true);
      expect(isValidStatus('pending')).toBe(true);
      expect(isValidStatus('invalid')).toBe(false);
      
      expect(isPrimaryColor('red')).toBe(true);
      expect(isPrimaryColor('green')).toBe(false);
    });

    it('should work with numbers', () => {
      const isValidGrade = oneOf([1, 2, 3, 4, 5]);
      
      expect(isValidGrade(3)).toBe(true);
      expect(isValidGrade(6)).toBe(false);
      expect(isValidGrade('3')).toBe(false); // Type matters
    });

    it('should work with empty arrays', () => {
      const neverValid = oneOf([]);
      
      expect(neverValid('anything')).toBe(false);
      expect(neverValid(null)).toBe(false);
    });
  });
});

describe('Predicate Composition', () => {
  it('should compose complex validation logic', () => {
    // Create a complex user validator
    const isValidUser = and(
      hasProperties(['id', 'name', 'email', 'status']),
      hasPropertyValue('status', 'active'),
      (user: unknown) => {
        const u = user as any;
        return isPositive(u.id) &&
               hasMinLength(2)(u.name) &&
               matches(/@/)(u.email);
      }
    );
    
    const validUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      status: 'active'
    };
    
    const invalidUser1 = {
      id: -1, // Invalid ID
      name: 'John',
      email: 'john@example.com',
      status: 'active'
    };
    
    const invalidUser2 = {
      id: 1,
      name: 'John',
      email: 'invalid-email', // Invalid email
      status: 'active'
    };
    
    expect(isValidUser(validUser)).toBe(true);
    expect(isValidUser(invalidUser1)).toBe(false);
    expect(isValidUser(invalidUser2)).toBe(false);
  });

  it('should create reusable validation predicates', () => {
    // Age validation predicates
    const isChild = isLessThan(13);
    const isTeen = and(isInRange(13, 19), isInteger);
    const isAdult = isGreaterThan(17);
    const isSenior = isGreaterThan(64);
    
    // Combine for age categories
    const getAgeCategory = (age: number): string => {
      if (isChild(age)) return 'child';
      if (isTeen(age)) return 'teen';
      if (isSenior(age)) return 'senior';
      if (isAdult(age)) return 'adult';
      return 'unknown';
    };
    
    expect(getAgeCategory(10)).toBe('child');
    expect(getAgeCategory(16)).toBe('teen');
    expect(getAgeCategory(25)).toBe('adult');
    expect(getAgeCategory(70)).toBe('senior');
  });

  it('should optimize with short-circuiting', () => {
    let expensiveCallCount = 0;
    
    const expensivePredicate = (value: unknown) => {
      expensiveCallCount++;
      return typeof value === 'string' && value.length > 100;
    };
    
    const optimizedCheck = and(
      (x: unknown): x is string => typeof x === 'string', // Fast check first
      hasMinLength(10), // Medium check
      expensivePredicate // Expensive check last
    );
    
    // Should short-circuit on first failure
    optimizedCheck(123); // Not string
    optimizedCheck('short'); // Too short
    optimizedCheck('a'.repeat(50)); // Long enough but not > 100
    optimizedCheck('a'.repeat(150)); // Should pass all checks
    
    expect(expensiveCallCount).toBe(2); // Only called for last two tests
  });
});

describe('Performance Tests', () => {
  it('should handle large-scale filtering efficiently', () => {
    const data = Array.from({ length: 100000 }, (_, i) => ({
      id: i,
      value: i % 100,
      active: i % 2 === 0,
      category: ['A', 'B', 'C'][i % 3]
    }));
    
    const isValidItem = and(
      hasProperty('id'),
      hasProperty('value'),
      hasPropertyValue('active', true),
      (item: unknown) => isInRange(0, 50)((item as any).value)
    );
    
    const start = performance.now();
    const filtered = data.filter(isValidItem);
    const end = performance.now();
    
    expect(filtered.length).toBeGreaterThan(0);
    expect(end - start).toBeLessThan(100); // Should be fast
  });

  it('should optimize predicate chains', () => {
    const numbers = Array.from({ length: 50000 }, (_, i) => i - 25000);
    
    // Chain of numeric predicates
    const isSpecialNumber = and(
      isInteger,
      isPositive,
      isInRange(100, 1000),
      (n: unknown) => (n as number) % 7 === 0
    );
    
    const start = performance.now();
    const special = numbers.filter(isSpecialNumber);
    const end = performance.now();
    
    expect(special.length).toBeGreaterThan(0);
    expect(end - start).toBeLessThan(50);
  });

  it('should handle complex object filtering efficiently', () => {
    const users = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      age: 18 + (i % 50),
      role: ['user', 'admin', 'moderator'][i % 3],
      active: i % 4 !== 0
    }));
    
    const isValidActiveUser = and(
      hasProperties(['id', 'name', 'email', 'age', 'role']),
      hasPropertyValue('active', true),
      (user: unknown) => {
        const u = user as any;
        return isInRange(18, 65)(u.age) &&
               oneOf(['user', 'admin'])(u.role) &&
               matches(/@/)(u.email);
      }
    );
    
    const start = performance.now();
    const validUsers = users.filter(isValidActiveUser);
    const end = performance.now();
    
    expect(validUsers.length).toBeGreaterThan(0);
    expect(end - start).toBeLessThan(100);
  });
});