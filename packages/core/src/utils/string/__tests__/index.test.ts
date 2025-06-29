/**
 * @module @utils/string/__tests__/index.test.ts
 * 
 * Tests for additional string utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  trim,
  pad,
  repeat,
  reverse,
  capitalize,
  uncapitalize,
  count,
  isBlank,
  isEmpty,
  charAt,
  swapCase,
  interpolate,
  template,
} from '../index.js';

describe('Additional String Utilities', () => {
  describe('trim', () => {
    it('should trim whitespace by default', () => {
      expect(trim('  hello  ')).toBe('hello');
      expect(trim('\n\thello\t\n')).toBe('hello');
      expect(trim('hello')).toBe('hello');
    });

    it('should trim custom characters', () => {
      expect(trim('---hello---', '-')).toBe('hello');
      expect(trim('+++test+++', '+')).toBe('test');
      expect(trim('...dots...', '.')).toBe('dots');
    });

    it('should trim multiple character types', () => {
      expect(trim('-.hello.-', '-.')).toBe('hello');
      expect(trim('()test()', '()')).toBe('test');
    });

    it('should handle edge cases', () => {
      expect(trim('')).toBe('');
      expect(trim('', '-')).toBe('');
      expect(trim('hello', '')).toBe('hello');
      expect(trim('   ', '')).toBe('   ');
    });
  });

  describe('pad', () => {
    it('should pad at end by default', () => {
      expect(pad('hello', 10)).toBe('hello     ');
      expect(pad('test', 8)).toBe('test    ');
    });

    it('should pad at start when requested', () => {
      expect(pad('hello', 10, ' ', true)).toBe('     hello');
      expect(pad('test', 8, '0', true)).toBe('0000test');
    });

    it('should use custom padding string', () => {
      expect(pad('hello', 10, '.-')).toBe('hello.-.-.');
      expect(pad('test', 10, 'abc')).toBe('testabcabc');
    });

    it('should handle padding longer than needed', () => {
      expect(pad('hello', 8, 'xyz')).toBe('helloxyz');
      expect(pad('test', 7, 'ab')).toBe('testaba');
    });

    it('should not pad if already long enough', () => {
      expect(pad('hello', 5)).toBe('hello');
      expect(pad('hello', 3)).toBe('hello');
    });

    it('should handle edge cases', () => {
      expect(pad('', 5)).toBe('     ');
      expect(pad('hello', 0)).toBe('hello');
      expect(pad('test', 4, '')).toBe('test');
    });
  });

  describe('repeat', () => {
    it('should repeat strings', () => {
      expect(repeat('hello', 3)).toBe('hellohellohello');
      expect(repeat('a', 5)).toBe('aaaaa');
      expect(repeat('ab', 3)).toBe('ababab');
    });

    it('should handle zero and negative counts', () => {
      expect(repeat('hello', 0)).toBe('');
      expect(repeat('hello', -1)).toBe('');
      expect(repeat('hello', -5)).toBe('');
    });

    it('should handle decimal counts', () => {
      expect(repeat('hello', 2.7)).toBe('hellohello'); // Floors to 2
      expect(repeat('test', 1.9)).toBe('test'); // Floors to 1
    });

    it('should handle edge cases', () => {
      expect(repeat('', 5)).toBe('');
      expect(repeat('hello', 1)).toBe('hello');
    });
  });

  describe('reverse', () => {
    it('should reverse strings', () => {
      expect(reverse('hello')).toBe('olleh');
      expect(reverse('12345')).toBe('54321');
      expect(reverse('a')).toBe('a');
    });

    it('should handle Unicode characters', () => {
      expect(reverse('🌟⭐')).toBe('⭐🌟');
      expect(reverse('café')).toBe('éfac');
    });

    it('should handle edge cases', () => {
      expect(reverse('')).toBe('');
      expect(reverse(' ')).toBe(' ');
    });

    it('should handle complex Unicode (surrogate pairs)', () => {
      expect(reverse('👨‍👩‍👧‍👦')).toContain('👦'); // Family emoji
      expect(reverse('🏳️‍🌈')).toContain('🌈'); // Flag emoji
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('Hello');
      expect(capitalize('hELLO')).toBe('Hello');
    });

    it('should handle single characters', () => {
      expect(capitalize('a')).toBe('A');
      expect(capitalize('A')).toBe('A');
    });

    it('should handle edge cases', () => {
      expect(capitalize('')).toBe('');
      expect(capitalize(' hello')).toBe(' hello'); // Leading space
      expect(capitalize('123hello')).toBe('123hello'); // Leading number
    });

    it('should handle Unicode', () => {
      expect(capitalize('café')).toBe('Café');
      expect(capitalize('münchen')).toBe('München');
    });
  });

  describe('uncapitalize', () => {
    it('should uncapitalize first letter', () => {
      expect(uncapitalize('Hello')).toBe('hello');
      expect(uncapitalize('HELLO')).toBe('hELLO');
      expect(uncapitalize('Hello World')).toBe('hello World');
    });

    it('should handle single characters', () => {
      expect(uncapitalize('A')).toBe('a');
      expect(uncapitalize('a')).toBe('a');
    });

    it('should handle edge cases', () => {
      expect(uncapitalize('')).toBe('');
      expect(uncapitalize('123Hello')).toBe('123Hello'); // Leading number
    });

    it('should handle acronyms', () => {
      expect(uncapitalize('XML')).toBe('xML');
      expect(uncapitalize('HTTP')).toBe('hTTP');
    });
  });

  describe('count', () => {
    it('should count substring occurrences', () => {
      expect(count('hello world hello', 'hello')).toBe(2);
      expect(count('abcabc', 'ab')).toBe(2);
      expect(count('aaa', 'aa')).toBe(2); // Overlapping
    });

    it('should handle case sensitivity', () => {
      expect(count('Hello World', 'hello', true)).toBe(0);
      expect(count('Hello World', 'hello', false)).toBe(1);
      expect(count('HELLO hello Hello', 'hello', false)).toBe(3);
    });

    it('should handle edge cases', () => {
      expect(count('', 'test')).toBe(0);
      expect(count('hello', '')).toBe(0);
      expect(count('hello', 'hello')).toBe(1);
      expect(count('hello', 'helloooo')).toBe(0);
    });

    it('should handle single character searches', () => {
      expect(count('hello', 'l')).toBe(2);
      expect(count('aaaaaa', 'a')).toBe(6);
      expect(count('hello', 'x')).toBe(0);
    });
  });

  describe('isBlank', () => {
    it('should identify blank strings', () => {
      expect(isBlank('')).toBe(true);
      expect(isBlank('   ')).toBe(true);
      expect(isBlank('\n\t')).toBe(true);
      expect(isBlank('\r\n\t ')).toBe(true);
    });

    it('should identify non-blank strings', () => {
      expect(isBlank('hello')).toBe(false);
      expect(isBlank(' hello ')).toBe(false);
      expect(isBlank('0')).toBe(false);
      expect(isBlank('false')).toBe(false);
    });

    it('should handle Unicode whitespace', () => {
      expect(isBlank('\u00A0')).toBe(true); // Non-breaking space
      expect(isBlank('\u2000\u2001')).toBe(true); // En/em spaces
    });
  });

  describe('isEmpty', () => {
    it('should identify empty strings', () => {
      expect(isEmpty('')).toBe(true);
    });

    it('should identify non-empty strings', () => {
      expect(isEmpty(' ')).toBe(false);
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty('0')).toBe(false);
    });
  });

  describe('charAt', () => {
    it('should get character at index', () => {
      expect(charAt('hello', 0)).toBe('h');
      expect(charAt('hello', 1)).toBe('e');
      expect(charAt('hello', 4)).toBe('o');
    });

    it('should handle negative indices', () => {
      expect(charAt('hello', -1)).toBe('o');
      expect(charAt('hello', -2)).toBe('l');
      expect(charAt('hello', -5)).toBe('h');
    });

    it('should handle out of bounds', () => {
      expect(charAt('hello', 10)).toBe('');
      expect(charAt('hello', -10)).toBe('');
      expect(charAt('', 0)).toBe('');
    });

    it('should handle Unicode', () => {
      expect(charAt('🌟⭐', 0)).toBe('🌟');
      expect(charAt('🌟⭐', 1)).toBe('⭐');
      expect(charAt('🌟⭐', -1)).toBe('⭐');
    });
  });

  describe('swapCase', () => {
    it('should swap case of letters', () => {
      expect(swapCase('Hello World')).toBe('hELLO wORLD');
      expect(swapCase('ABC123def')).toBe('abc123DEF');
      expect(swapCase('tEST cASE')).toBe('Test Case');
    });

    it('should preserve non-letters', () => {
      expect(swapCase('hello123')).toBe('HELLO123');
      expect(swapCase('test!@#')).toBe('TEST!@#');
    });

    it('should handle edge cases', () => {
      expect(swapCase('')).toBe('');
      expect(swapCase('123')).toBe('123');
      expect(swapCase('!@#')).toBe('!@#');
    });

    it('should handle Unicode', () => {
      expect(swapCase('Café')).toBe('cAFÉ');
      expect(swapCase('Müller')).toBe('mÜLLER');
    });
  });

  describe('interpolate', () => {
    it('should interpolate template variables', () => {
      expect(interpolate('Hello {{name}}!', { name: 'World' }))
        .toBe('Hello World!');
      expect(interpolate('{{greeting}} {{name}}', { greeting: 'Hi', name: 'Alice' }))
        .toBe('Hi Alice');
    });

    it('should handle missing variables', () => {
      expect(interpolate('Hello {{name}}!', {}))
        .toBe('Hello !');
      expect(interpolate('{{greeting}} {{name}}', { name: 'Alice' }))
        .toBe(' Alice');
    });

    it('should use fallback for missing variables', () => {
      expect(interpolate('Hello {{name}}!', {}, 'Unknown'))
        .toBe('Hello Unknown!');
      expect(interpolate('{{greeting}} {{name}}', { name: 'Alice' }, 'Hi'))
        .toBe('Hi Alice');
    });

    it('should handle complex values', () => {
      expect(interpolate('Count: {{count}}', { count: 42 }))
        .toBe('Count: 42');
      expect(interpolate('Active: {{active}}', { active: true }))
        .toBe('Active: true');
      expect(interpolate('Value: {{value}}', { value: null }))
        .toBe('Value: null');
    });

    it('should ignore non-matching patterns', () => {
      expect(interpolate('Hello {name}!', { name: 'World' }))
        .toBe('Hello {name}!');
      expect(interpolate('Hello {{}}!', { name: 'World' }))
        .toBe('Hello {{}}!');
    });

    it('should handle multiple instances', () => {
      expect(interpolate('{{name}} loves {{name}}', { name: 'Alice' }))
        .toBe('Alice loves Alice');
    });
  });

  describe('template', () => {
    it('should use custom delimiters', () => {
      expect(template('Hello ${name}!', { name: 'World' }, {
        delimiter: ['${', '}']
      })).toBe('Hello World!');
      
      expect(template('Hello %name%!', { name: 'World' }, {
        delimiter: ['%', '%']
      })).toBe('Hello World!');
    });

    it('should apply transformations', () => {
      expect(template('Hello {{name}}!', { name: 'world' }, {
        transform: (value) => value.toUpperCase()
      })).toBe('Hello WORLD!');
      
      expect(template('Count: {{count}}', { count: 42 }, {
        transform: (value) => `[${value}]`
      })).toBe('Count: [42]');
    });

    it('should use custom fallback', () => {
      expect(template('Hello {{name}}!', {}, {
        fallback: 'Unknown'
      })).toBe('Hello Unknown!');
    });

    it('should combine options', () => {
      expect(template('Hello ${name}!', { name: 'world' }, {
        delimiter: ['${', '}'],
        transform: (value) => value.toUpperCase(),
        fallback: 'UNKNOWN'
      })).toBe('Hello WORLD!');
      
      expect(template('Hello ${missing}!', {}, {
        delimiter: ['${', '}'],
        transform: (value) => value.toUpperCase(),
        fallback: 'unknown'
      })).toBe('Hello UNKNOWN!');
    });

    it('should handle regex special characters in delimiters', () => {
      expect(template('Hello (name)!', { name: 'World' }, {
        delimiter: ['(', ')']
      })).toBe('Hello World!');
      
      expect(template('Hello [name]!', { name: 'World' }, {
        delimiter: ['[', ']']
      })).toBe('Hello World!');
    });
  });

  describe('Performance', () => {
    it('should handle large strings efficiently', () => {
      const longString = 'a'.repeat(10000);
      
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        reverse(longString);
        capitalize(longString);
        count(longString, 'a');
      }
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle many small operations efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        trim(`  test ${i}  `);
        pad(`str${i}`, 10);
        capitalize(`word${i}`);
        reverse(`reverse${i}`);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50); // Should complete in under 50ms
    });

    it('should handle template interpolation efficiently', () => {
      const template_str = 'Hello {{name}}, you have {{count}} messages from {{sender}}!';
      const data = { name: 'Alice', count: 5, sender: 'Bob' };
      
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        interpolate(template_str, data);
      }
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings consistently', () => {
      expect(trim('')).toBe('');
      expect(pad('', 5)).toBe('     ');
      expect(repeat('', 3)).toBe('');
      expect(reverse('')).toBe('');
      expect(capitalize('')).toBe('');
      expect(count('', 'a')).toBe(0);
    });

    it('should handle Unicode consistently', () => {
      const unicode = 'Café résumé 🌟';
      expect(capitalize(unicode)).toBe('Café résumé 🌟');
      expect(reverse(unicode)).toContain('🌟');
      expect(count(unicode, 'é')).toBe(2);
    });

    it('should handle very long strings', () => {
      const veryLong = 'test'.repeat(10000);
      expect(charAt(veryLong, -1)).toBe('t');
      expect(count(veryLong, 'test')).toBe(10000);
      expect(isBlank(veryLong)).toBe(false);
    });

    it('should handle special characters in templates', () => {
      expect(interpolate('Cost: ${{price}}', { price: '29.99' }))
        .toBe('Cost: $29.99');
      expect(interpolate('Progress: {{percent}}%', { percent: 75 }))
        .toBe('Progress: 75%');
    });
  });
});