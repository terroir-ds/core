/**
 * @module @utils/string/__tests__/slugify.test.ts
 * 
 * Tests for slugify utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  slugify,
  createSlugifier,
  safeFilename,
  uniqueSlug,
  isValidSlug,
  slugToTitle,
} from '../slugify.js';

describe('Slugify Utilities', () => {
  describe('slugify', () => {
    it('should create basic slugs', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Simple Test')).toBe('simple-test');
      expect(slugify('Multiple   Spaces')).toBe('multiple-spaces');
    });

    it('should handle special characters', () => {
      expect(slugify('Hello & World!')).toBe('hello-and-world');
      expect(slugify('Price: $29.99')).toBe('price-dollar-29-99');
      expect(slugify('100% Pure')).toBe('100-percent-pure');
      expect(slugify('Café & Restaurant')).toBe('cafe-and-restaurant');
    });

    it('should handle Unicode characters', () => {
      expect(slugify('Åpfel über München')).toBe('apfel-uber-munchen');
      expect(slugify('Naïve approach')).toBe('naive-approach');
      expect(slugify('Résumé & CV')).toBe('resume-and-cv');
      expect(slugify('北京市')).toBe(''); // Non-Latin characters removed in strict mode
    });

    it('should handle accented characters', () => {
      expect(slugify('Café')).toBe('cafe');
      expect(slugify('Señor')).toBe('senor');
      expect(slugify('Zürich')).toBe('zurich');
      expect(slugify('São Paulo')).toBe('sao-paulo');
    });

    it('should use custom separator', () => {
      expect(slugify('hello world', { separator: '_' })).toBe('hello_world');
      expect(slugify('test case', { separator: '.' })).toBe('test.case');
      expect(slugify('my example', { separator: '' })).toBe('myexample');
    });

    it('should respect maxLength', () => {
      expect(slugify('Very Long Title That Exceeds Limit', { maxLength: 20 }))
        .toBe('very-long-title-that');
      expect(slugify('Short', { maxLength: 20 })).toBe('short');
      expect(slugify('Exactly twenty chars', { maxLength: 20 }))
        .toHaveLength(20);
    });

    it('should trim separators from ends', () => {
      expect(slugify('-hello-world-', { trim: true })).toBe('hello-world');
      expect(slugify('__test__', { separator: '_', trim: true })).toBe('test');
      expect(slugify('...dots...', { separator: '.', trim: true })).toBe('dots');
    });

    it('should disable trimming when requested', () => {
      expect(slugify('-hello-world-', { trim: false })).toBe('-hello-world-');
      expect(slugify('__test__', { separator: '_', trim: false })).toBe('__test__');
    });

    it('should preserve case when requested', () => {
      expect(slugify('Hello World', { lowercase: false })).toBe('Hello-World');
      expect(slugify('CAPS TEST', { lowercase: false })).toBe('CAPS-TEST');
    });

    it('should use non-strict mode', () => {
      expect(slugify('Hello 世界', { strict: false })).toBe('hello-世界');
      expect(slugify('Test Ñoño', { strict: false })).toBe('test-noño');
    });

    it('should handle custom replacements', () => {
      const replacements = { '&': 'and', '@': 'at' };
      expect(slugify('Cats & Dogs @ Home', { replacements })).toBe('cats-and-dogs-at-home');
      expect(slugify('user@domain.com', { replacements })).toBe('user-at-domain-com');
    });

    it('should use language-specific replacements', () => {
      expect(slugify('Schöne Grüße', { locale: 'de' })).toBe('schoene-gruesse');
      expect(slugify('Привет мир', { locale: 'ru' })).toBe('privet-mir');
      expect(slugify('Résumé français', { locale: 'fr' })).toBe('resume-francais');
    });

    it('should handle edge cases', () => {
      expect(slugify('')).toBe('');
      expect(slugify('   ')).toBe('');
      expect(slugify('!!!')).toBe('');
      expect(slugify('123')).toBe('123');
      expect(slugify('a')).toBe('a');
    });

    it('should collapse multiple separators', () => {
      expect(slugify('hello---world')).toBe('hello-world');
      expect(slugify('test___case', { separator: '_' })).toBe('test_case');
      expect(slugify('multi   space   test')).toBe('multi-space-test');
    });

    it('should handle mixed case and separators', () => {
      expect(slugify('camelCaseString')).toBe('camelcasestring');
      expect(slugify('PascalCaseString')).toBe('pascalcasestring');
      expect(slugify('snake_case_string')).toBe('snake-case-string');
      expect(slugify('kebab-case-string')).toBe('kebab-case-string');
    });
  });

  describe('createSlugifier', () => {
    it('should create reusable slugifier', () => {
      const slugifier = createSlugifier({ separator: '_', maxLength: 10 });
      
      expect(slugifier('hello world')).toBe('hello_worl');
      expect(slugifier('test case')).toBe('test_case');
      expect(slugifier('another example')).toBe('another_ex');
    });

    it('should preserve options across calls', () => {
      const germanSlugifier = createSlugifier({
        locale: 'de',
        separator: '_',
        maxLength: 50
      });
      
      expect(germanSlugifier('Schöne Grüße')).toBe('schoene_gruesse');
      expect(germanSlugifier('Über uns')).toBe('ueber_uns');
    });
  });

  describe('safeFilename', () => {
    it('should create safe filenames', () => {
      expect(safeFilename('My Document.pdf')).toBe('my-document.pdf');
      expect(safeFilename('File with "quotes".txt')).toBe('file-with-quotes.txt');
      expect(safeFilename('Résumé & CV.docx')).toBe('resume-cv.docx');
    });

    it('should handle files without extensions', () => {
      expect(safeFilename('README')).toBe('readme');
      expect(safeFilename('My Notes')).toBe('my-notes');
    });

    it('should preserve extension case handling', () => {
      expect(safeFilename('Document.PDF')).toBe('document.pdf');
      expect(safeFilename('Image.JPEG')).toBe('image.jpeg');
    });

    it('should handle multiple dots', () => {
      expect(safeFilename('archive.tar.gz')).toBe('archive-tar.gz');
      expect(safeFilename('config.local.json')).toBe('config-local.json');
    });

    it('should handle edge cases', () => {
      expect(safeFilename('')).toBe('');
      expect(safeFilename('.hidden')).toBe('hidden');
      expect(safeFilename('file.')).toBe('file');
      expect(safeFilename('.tar.gz')).toBe('tar.gz');
    });

    it('should use custom options', () => {
      expect(safeFilename('My File.txt', { separator: '_' })).toBe('my_file.txt');
      expect(safeFilename('Long Filename.pdf', { maxLength: 10 })).toBe('long-f.pdf');
    });
  });

  describe('uniqueSlug', () => {
    it('should return original if not exists', () => {
      const existsCheck = (slug: string) => false;
      expect(uniqueSlug('hello world', existsCheck)).toBe('hello-world');
    });

    it('should append number if exists', () => {
      const existing = new Set(['hello-world', 'hello-world-2']);
      const existsCheck = (slug: string) => existing.has(slug);
      
      expect(uniqueSlug('hello world', existsCheck)).toBe('hello-world-3');
    });

    it('should find first available number', () => {
      const existing = new Set(['test', 'test-2', 'test-3', 'test-5']);
      const existsCheck = (slug: string) => existing.has(slug);
      
      expect(uniqueSlug('test', existsCheck)).toBe('test-4');
    });

    it('should work with custom separator', () => {
      const existing = new Set(['test_slug']);
      const existsCheck = (slug: string) => existing.has(slug);
      
      expect(uniqueSlug('test slug', existsCheck, { separator: '_' }))
        .toBe('test_slug_2');
    });

    it('should handle high collision counts', () => {
      const existing = new Set();
      for (let i = 1; i <= 100; i++) {
        existing.add(i === 1 ? 'popular' : `popular-${i}`);
      }
      const existsCheck = (slug: string) => existing.has(slug);
      
      expect(uniqueSlug('popular', existsCheck)).toBe('popular-101');
    });
  });

  describe('isValidSlug', () => {
    it('should validate correct slugs', () => {
      expect(isValidSlug('hello-world')).toBe(true);
      expect(isValidSlug('simple')).toBe(true);
      expect(isValidSlug('test-123')).toBe(true);
      expect(isValidSlug('a')).toBe(true);
      expect(isValidSlug('multiple-word-slug')).toBe(true);
    });

    it('should reject invalid slugs', () => {
      expect(isValidSlug('Hello-World')).toBe(false); // uppercase
      expect(isValidSlug('hello world')).toBe(false); // space
      expect(isValidSlug('hello_world')).toBe(false); // wrong separator
      expect(isValidSlug('-hello')).toBe(false); // leading separator
      expect(isValidSlug('hello-')).toBe(false); // trailing separator
      expect(isValidSlug('hello--world')).toBe(false); // consecutive separators
      expect(isValidSlug('')).toBe(false); // empty
    });

    it('should validate with custom separator', () => {
      expect(isValidSlug('hello_world', '_')).toBe(true);
      expect(isValidSlug('hello-world', '_')).toBe(false);
      expect(isValidSlug('hello.world', '.')).toBe(true);
    });

    it('should validate in non-strict mode', () => {
      expect(isValidSlug('héllo-wörld', '-', false)).toBe(true);
      expect(isValidSlug('test-世界', '-', false)).toBe(true);
      expect(isValidSlug('HELLO-WORLD', '-', false)).toBe(false); // still case sensitive
    });
  });

  describe('slugToTitle', () => {
    it('should convert slugs to titles', () => {
      expect(slugToTitle('hello-world')).toBe('Hello World');
      expect(slugToTitle('simple')).toBe('Simple');
      expect(slugToTitle('multiple-word-slug')).toBe('Multiple Word Slug');
    });

    it('should handle custom separator', () => {
      expect(slugToTitle('hello_world', '_')).toBe('Hello World');
      expect(slugToTitle('test.case', '.')).toBe('Test Case');
    });

    it('should handle numbers and mixed content', () => {
      expect(slugToTitle('api-v2-docs')).toBe('Api V2 Docs');
      expect(slugToTitle('test-123-abc')).toBe('Test 123 Abc');
    });

    it('should handle edge cases', () => {
      expect(slugToTitle('')).toBe('');
      expect(slugToTitle('single')).toBe('Single');
      expect(slugToTitle('a')).toBe('A');
    });
  });

  describe('Language Support', () => {
    it('should handle German characters', () => {
      expect(slugify('Schöne Grüße aus München', { locale: 'de' }))
        .toBe('schoene-gruesse-aus-muenchen');
      expect(slugify('Straße', { locale: 'de' })).toBe('strasse');
    });

    it('should handle Spanish characters', () => {
      expect(slugify('Niño pequeño', { locale: 'es' }))
        .toBe('nino-pequeno');
    });

    it('should handle French characters', () => {
      expect(slugify('Résumé français', { locale: 'fr' }))
        .toBe('resume-francais');
    });

    it('should handle Polish characters', () => {
      expect(slugify('Łódź Kraków', { locale: 'pl' }))
        .toBe('lodz-krakow');
    });

    it('should handle Russian characters', () => {
      expect(slugify('Привет мир', { locale: 'ru' }))
        .toBe('privet-mir');
      expect(slugify('Москва', { locale: 'ru' }))
        .toBe('moskva');
    });

    it('should handle Arabic characters', () => {
      expect(slugify('مرحبا بالعالم', { locale: 'ar' }))
        .toBe('mrhba-balalm');
    });

    it('should fall back to default for unknown locales', () => {
      expect(slugify('Café résumé', { locale: 'unknown' }))
        .toBe('cafe-resume');
    });
  });

  describe('Performance', () => {
    it('should handle large inputs efficiently', () => {
      const longString = 'very long string with many words '.repeat(100);
      
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        slugify(longString, { maxLength: 50 });
      }
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle many small slugifications efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        slugify(`Test String ${i}`);
        safeFilename(`File ${i}.txt`);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50); // Should complete in under 50ms
    });

    it('should handle unique slug generation efficiently', () => {
      const existing = new Set();
      for (let i = 0; i < 100; i++) {
        existing.add(`slug-${i}`);
      }
      const existsCheck = (slug: string) => existing.has(slug);
      
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        uniqueSlug('slug', existsCheck);
      }
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle only special characters', () => {
      expect(slugify('!@#$%^&*()')).toBe('');
      expect(slugify('+++')).toBe('plus-plus-plus');
      expect(slugify('===')).toBe('equals-equals-equals');
    });

    it('should handle mixed scripts', () => {
      expect(slugify('Hello 世界 World')).toBe('hello-world');
      expect(slugify('Test Тест Test')).toBe('test-test');
    });

    it('should handle very long strings', () => {
      const veryLong = 'word'.repeat(1000);
      const result = slugify(veryLong, { maxLength: 50 });
      expect(result).toHaveLength(50);
      expect(result).not.toContain('-');
    });

    it('should handle numeric-only strings', () => {
      expect(slugify('12345')).toBe('12345');
      expect(slugify('123.456')).toBe('123-456');
      expect(slugify('1,000,000')).toBe('1-000-000');
    });

    it('should handle emoji and symbols', () => {
      expect(slugify('Hello 👋 World 🌍')).toBe('hello-world');
      expect(slugify('Stars ⭐ and 🌟')).toBe('stars-and');
    });

    it('should handle currency symbols', () => {
      expect(slugify('Price €50')).toBe('price-euro-50');
      expect(slugify('Cost $100')).toBe('cost-dollar-100');
      expect(slugify('Value ¥1000')).toBe('value-yen-1000');
    });
  });
});