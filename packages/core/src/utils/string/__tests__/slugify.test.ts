import { describe, it, expect } from 'vitest';
import {
  slugify,
  createSlugifier,
  safeFilename,
  uniqueSlug,
  isValidSlug,
  slugToTitle,
} from '@utils/string/slugify';

describe('Slugify Utilities', () => {
  describe('slugify', () => {
    it('should create basic slugs', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('  Trim Spaces  ')).toBe('trim-spaces');
      expect(slugify('Multiple   Spaces')).toBe('multiple-spaces');
      expect(slugify('UPPERCASE')).toBe('uppercase');
    });

    it('should handle special characters', () => {
      expect(slugify('Hello & World!')).toBe('hello-and-world');
      expect(slugify('Price: $29.99')).toBe('price-dollar29-99');
      expect(slugify('100% Pure')).toBe('100percent-pure');
      expect(slugify('Café & Restaurant')).toBe('cafe-and-restaurant');
      expect(slugify('user@email.com')).toBe('useratemail-com');
      expect(slugify('C++ Programming')).toBe('cplusplus-programming');
    });

    it('should handle Unicode characters', () => {
      expect(slugify('Åpfel über München')).toBe('apfel-uber-munchen');
      expect(slugify('Naïve approach')).toBe('naive-approach');
      expect(slugify('Résumé & CV')).toBe('resume-and-cv');
      expect(slugify('北京市')).toBe(''); // Non-Latin characters removed in strict mode
      expect(slugify('Hello 世界')).toBe('hello'); // Mixed content, non-ASCII removed
    });

    it('should handle accented characters', () => {
      expect(slugify('Café')).toBe('cafe');
      expect(slugify('Señor')).toBe('senor');
      expect(slugify('Zürich')).toBe('zurich');
      expect(slugify('São Paulo')).toBe('sao-paulo');
      expect(slugify('Łódź')).toBe('lodz');
    });

    it('should use custom separator', () => {
      expect(slugify('hello world', { separator: '_' })).toBe('hello_world');
      expect(slugify('test case', { separator: '.' })).toBe('test.case');
      expect(slugify('my example', { separator: '' })).toBe('myexample');
      expect(slugify('a-b-c', { separator: '_' })).toBe('a_b_c');
    });

    it('should respect maxLength', () => {
      expect(slugify('Very Long Title That Exceeds Limit', { maxLength: 20 })).toBe(
        'very-long-title-that'
      );
      expect(slugify('Short', { maxLength: 20 })).toBe('short');
      expect(slugify('Exactly twenty chars', { maxLength: 20 })).toHaveLength(20);
      expect(slugify('Truncate-at-separator', { maxLength: 10 })).toBe('truncate');
    });

    it('should trim separators from ends', () => {
      expect(slugify('-hello-world-')).toBe('hello-world');
      expect(slugify('__test__', { separator: '_' })).toBe('test');
      expect(slugify('...dots...', { separator: '.' })).toBe('dots');
      expect(slugify('---')).toBe('');
    });

    it('should disable trimming when requested', () => {
      expect(slugify('-hello-world-', { trim: false })).toBe('-hello-world-');
      expect(slugify('test', { separator: '_', trim: false })).toBe('test');
      expect(slugify('-test', { trim: false })).toBe('-test');
    });

    it('should preserve case when requested', () => {
      expect(slugify('Hello World', { lowercase: false })).toBe('Hello-World');
      expect(slugify('CAPS TEST', { lowercase: false })).toBe('CAPS-TEST');
      expect(slugify('camelCase', { lowercase: false })).toBe('camelCase');
    });

    it('should use non-strict mode', () => {
      expect(slugify('Hello 世界', { strict: false })).toBe('hello-世界');
      expect(slugify('Café résumé', { strict: false })).toBe('café-résumé');
      expect(slugify('test_underscore', { strict: false })).toBe('test_underscore');
      expect(slugify('keep-hyphens', { strict: false })).toBe('keep-hyphens');
    });

    it('should handle custom replacements', () => {
      const replacements = { '&': 'and', '@': 'at' };
      expect(slugify('Cats & Dogs @ Home', { replacements })).toBe('cats-and-dogs-at-home');
      expect(slugify('user@domain.com', { replacements })).toBe('useratdomain-com');
      expect(slugify('A&B@C', { replacements })).toBe('aandbatc');
    });

    it('should use language-specific replacements', () => {
      expect(slugify('Schöne Grüße', { locale: 'de' })).toBe('schoene-gruesse');
      expect(slugify('Über München', { locale: 'de' })).toBe('ueber-muenchen');
      expect(slugify('Привет мир', { locale: 'ru' })).toBe('privet-mir');
      expect(slugify('Résumé français', { locale: 'fr' })).toBe('resume-francais');
      expect(slugify('Łódź Kraków', { locale: 'pl' })).toBe('lodz-krakow');
    });

    it('should handle edge cases', () => {
      expect(slugify('')).toBe('');
      expect(slugify('   ')).toBe('');
      expect(slugify('!!!')).toBe('');
      expect(slugify('123')).toBe('123');
      expect(slugify('a')).toBe('a');
      expect(slugify('@#$%')).toBe('athashdollarpercent');
      expect(slugify('...')).toBe('');
    });

    it('should collapse multiple separators', () => {
      expect(slugify('hello---world')).toBe('hello-world');
      expect(slugify('test___case', { separator: '_' })).toBe('test_case');
      expect(slugify('multi   space   test')).toBe('multi-space-test');
      expect(slugify('a....b', { separator: '.' })).toBe('a.b');
    });

    it('should handle mixed content', () => {
      expect(slugify('Price €50')).toBe('price-euro50');
      expect(slugify('Temperature: 20°C')).toBe('temperature-20degc');
      expect(slugify('™ Trademark')).toBe('tm-trademark');
      expect(slugify('Copyright © 2024')).toBe('copyright-c-2024');
    });

    it('should handle mathematical symbols', () => {
      expect(slugify('2 × 3 = 6')).toBe('2-x-3-equals-6');
      expect(slugify('10 ÷ 2')).toBe('10-div-2');
      expect(slugify('± tolerance')).toBe('plus-minus-tolerance');
      expect(slugify('a ≈ b')).toBe('a-approx-b');
    });

    it('should handle quotes and punctuation', () => {
      expect(slugify('"Quoted Text"')).toBe('quoted-text');
      expect(slugify("It's great!")).toBe('its-great');
      expect(slugify('Hello—World')).toBe('hello-world');
      expect(slugify('one…two…three')).toBe('one-two-three');
    });
  });

  describe('createSlugifier', () => {
    it('should create reusable slugifier', () => {
      const germanSlugify = createSlugifier({ locale: 'de', separator: '_' });
      expect(germanSlugify('Über München')).toBe('ueber_muenchen');
      expect(germanSlugify('Schöne Grüße')).toBe('schoene_gruesse');
    });

    it('should preserve options across calls', () => {
      const upperSlugify = createSlugifier({ lowercase: false });
      expect(upperSlugify('Hello World')).toBe('Hello-World');
      expect(upperSlugify('Test Case')).toBe('Test-Case');

      const customSlugify = createSlugifier({
        separator: '_',
        maxLength: 10,
        replacements: { '&': 'AND' },
      });
      expect(customSlugify('Test & Check')).toBe('test_and');
    });
  });

  describe('safeFilename', () => {
    it('should create safe filenames', () => {
      expect(safeFilename('My Document.pdf')).toBe('my-document.pdf');
      expect(safeFilename('File with "quotes".txt')).toBe('file-with-quotes.txt');
      expect(safeFilename('Résumé & CV.docx')).toBe('resume-and-cv.docx');
      expect(safeFilename('Price $99.xlsx')).toBe('price-dollar99.xlsx');
    });

    it('should handle files without extensions', () => {
      expect(safeFilename('README')).toBe('readme');
      expect(safeFilename('My Notes')).toBe('my-notes');
      expect(safeFilename('.gitignore')).toBe('gitignore');
    });

    it('should preserve extension case handling', () => {
      expect(safeFilename('Document.PDF')).toBe('document.pdf');
      expect(safeFilename('Image.JPEG')).toBe('image.jpeg');
      expect(safeFilename('Script.JS')).toBe('script.js');
    });

    it('should handle multiple dots', () => {
      expect(safeFilename('archive.tar.gz')).toBe('archive-tar.gz');
      expect(safeFilename('config.local.json')).toBe('config-local.json');
      expect(safeFilename('v1.2.3.txt')).toBe('v1-2-3.txt');
    });

    it('should handle edge cases', () => {
      expect(safeFilename('')).toBe('');
      expect(safeFilename('.hidden')).toBe('hidden');
      expect(safeFilename('file.')).toBe('file');
      expect(safeFilename('.tar.gz')).toBe('tar.gz');
      expect(safeFilename('...')).toBe('');
    });

    it('should use custom options', () => {
      expect(safeFilename('My File.txt', { separator: '_' })).toBe('my_file.txt');
      expect(safeFilename('Long Filename.pdf', { maxLength: 10 })).toBe('long.pdf');
      expect(safeFilename('TEST.TXT', { lowercase: false })).toBe('TEST.txt');
      expect(safeFilename('Price: $99.doc', { maxLength: 15 })).toBe('price.doc');
    });

    it('should sanitize extensions', () => {
      expect(safeFilename('file.t@x#t')).toBe('file.txt');
      expect(safeFilename('doc.123abc')).toBe('doc.123abc');
      expect(safeFilename('test.!!!!')).toBe('test');
    });
  });

  describe('uniqueSlug', () => {
    it('should return original if not exists', () => {
      const existsCheck = (_slug: string) => false;
      expect(uniqueSlug('hello world', existsCheck)).toBe('hello-world');
      expect(uniqueSlug('test', existsCheck)).toBe('test');
    });

    it('should append number if exists', () => {
      const existing = new Set(['hello-world']);
      const existsCheck = (slug: string) => existing.has(slug);
      expect(uniqueSlug('hello world', existsCheck)).toBe('hello-world-2');
    });

    it('should find first available number', () => {
      const existing = new Set(['test', 'test-2', 'test-3', 'test-5']);
      const existsCheck = (slug: string) => existing.has(slug);
      expect(uniqueSlug('test', existsCheck)).toBe('test-4');
    });

    it('should work with custom separator', () => {
      const existing = new Set(['test_slug']);
      const existsCheck = (slug: string) => existing.has(slug);
      expect(uniqueSlug('test slug', existsCheck, { separator: '_' })).toBe('test_slug_2');
    });

    it('should handle high collision counts', () => {
      const existing = new Set<string>();
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
      expect(isValidSlug('test123')).toBe(true);
      expect(isValidSlug('a-b-c')).toBe(true);
      expect(isValidSlug('123')).toBe(true);
      expect(isValidSlug('a')).toBe(true);
    });

    it('should reject invalid slugs', () => {
      expect(isValidSlug('Hello-World')).toBe(false); // uppercase
      expect(isValidSlug('-hello')).toBe(false); // leading separator
      expect(isValidSlug('hello-')).toBe(false); // trailing separator
      expect(isValidSlug('hello--world')).toBe(false); // consecutive separators
      expect(isValidSlug('')).toBe(false); // empty
      expect(isValidSlug('hello world')).toBe(false); // space
      expect(isValidSlug('hello@world')).toBe(false); // special char
    });

    it('should validate with custom separator', () => {
      expect(isValidSlug('hello_world', '_')).toBe(true);
      expect(isValidSlug('hello-world', '_')).toBe(false);
      expect(isValidSlug('hello.world', '.')).toBe(true);
      expect(isValidSlug('_hello', '_')).toBe(false);
      expect(isValidSlug('hello__world', '_')).toBe(false);
    });

    it('should validate in non-strict mode', () => {
      expect(isValidSlug('hello-world', '-', false)).toBe(true);
      expect(isValidSlug('café-résumé', '-', false)).toBe(true);
      expect(isValidSlug('test-世界', '-', false)).toBe(true);
      expect(isValidSlug('привет-мир', '-', false)).toBe(true);
      expect(isValidSlug('HELLO-WORLD', '-', false)).toBe(false); // still case sensitive
      expect(isValidSlug('test_underscore', '-', false)).toBe(true);
      expect(isValidSlug('hello@world', '-', false)).toBe(false); // @ not allowed
    });
  });

  describe('slugToTitle', () => {
    it('should convert slugs to titles', () => {
      expect(slugToTitle('hello-world')).toBe('Hello World');
      expect(slugToTitle('my-test-case')).toBe('My Test Case');
      expect(slugToTitle('a-b-c')).toBe('A B C');
      expect(slugToTitle('123-test')).toBe('123 Test');
    });

    it('should handle custom separator', () => {
      expect(slugToTitle('hello_world', '_')).toBe('Hello World');
      expect(slugToTitle('test.case', '.')).toBe('Test Case');
      expect(slugToTitle('one__two', '_')).toBe('One  Two'); // preserves empty parts
    });

    it('should handle edge cases', () => {
      expect(slugToTitle('')).toBe('');
      expect(slugToTitle('hello')).toBe('Hello');
      expect(slugToTitle('a')).toBe('A');
      expect(slugToTitle('html5')).toBe('Html5');
    });

    it('should handle numbers and mixed content', () => {
      expect(slugToTitle('api-v2')).toBe('Api V2');
      expect(slugToTitle('test-123-case')).toBe('Test 123 Case');
      expect(slugToTitle('3d-model')).toBe('3d Model');
    });
  });

  describe('Language Support', () => {
    it('should handle German characters', () => {
      expect(slugify('Äpfel über München', { locale: 'de' })).toBe('aepfel-ueber-muenchen');
      expect(slugify('Größe maßen', { locale: 'de' })).toBe('groesse-massen');
      expect(slugify('Straße', { locale: 'de' })).toBe('strasse');
    });

    it('should handle Spanish characters', () => {
      expect(slugify('Niño mañana', { locale: 'es' })).toBe('nino-manana');
      expect(slugify('¿Cómo estás?', { locale: 'es' })).toBe('como-estas');
    });

    it('should handle French characters', () => {
      expect(slugify('Ça va très bien', { locale: 'fr' })).toBe('ca-va-tres-bien');
      expect(slugify('À bientôt', { locale: 'fr' })).toBe('a-bientot');
    });

    it('should handle Polish characters', () => {
      expect(slugify('Łódź Kraków', { locale: 'pl' })).toBe('lodz-krakow');
      expect(slugify('Zażółć gęślą jaźń', { locale: 'pl' })).toBe('zazolc-gesla-jazn');
    });

    it('should handle Russian characters', () => {
      expect(slugify('Привет мир', { locale: 'ru' })).toBe('privet-mir');
      expect(slugify('Москва', { locale: 'ru' })).toBe('moskva');
      expect(slugify('Ёлка', { locale: 'ru' })).toBe('yolka');
    });

    it('should handle Arabic characters', () => {
      expect(slugify('مرحبا بالعالم', { locale: 'ar' })).toBe('mrhba-balalm');
      expect(slugify('السلام', { locale: 'ar' })).toBe('alslam');
    });

    it('should fall back to default for unknown locales', () => {
      expect(slugify('Café résumé', { locale: 'unknown' })).toBe('cafe-resume');
      expect(slugify('Über test', { locale: 'xyz' })).toBe('uber-test');
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

      expect(duration).toBeLessThan(1000); // Should complete in under 1s
    });

    it('should handle many small slugifications efficiently', () => {
      const strings = [
        'Hello World',
        'Test Case',
        'Café résumé',
        'Über München',
        '北京市',
        'user@email.com',
        'Price: $99.99',
        '100% complete',
      ];

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        strings.forEach((s) => slugify(s));
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete in under 1s
    });

    it('should handle unique slug generation efficiently', () => {
      const existing = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        existing.add(`test-${i}`);
      }
      const existsCheck = (slug: string) => existing.has(slug);

      const start = performance.now();
      uniqueSlug('test', existsCheck);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Should complete quickly
    });
  });

  describe('Edge Cases', () => {
    it('should handle strings with only special characters', () => {
      expect(slugify('!!!')).toBe('');
      expect(slugify('@#$')).toBe('athashdollar');
      expect(slugify('...')).toBe('');
      expect(slugify('---')).toBe('');
      expect(slugify('___', { separator: '_' })).toBe('');
      expect(slugify('++++')).toBe('plusplusplusplus');
      expect(slugify('====')).toBe('equalsequalsequalsequals');
    });

    it('should handle mixed scripts', () => {
      expect(slugify('Hello 世界 World')).toBe('hello-world');
      expect(slugify('Test Тест Test')).toBe('test-test');
      expect(slugify('ABC 123 ΑΒΓ')).toBe('abc-123');
      expect(slugify('Café 北京 résumé', { strict: false })).toBe('café-北京-résumé');
    });

    it('should handle very long strings', () => {
      const veryLong = 'word'.repeat(1000);
      const result = slugify(veryLong, { maxLength: 50 });
      expect(result).toHaveLength(50);
      expect(result).toBe('wordwordwordwordwordwordwordwordwordwordwordwordwo');
    });

    it('should handle numeric-only strings', () => {
      expect(slugify('12345')).toBe('12345');
      expect(slugify('123.456')).toBe('123-456');
      expect(slugify('1,000,000')).toBe('1-000-000');
      expect(slugify('3.14159')).toBe('3-14159');
    });

    it('should handle emoji and symbols', () => {
      expect(slugify('Hello 👋 World 🌍')).toBe('hello-world');
      expect(slugify('Stars ⭐ and 🌟')).toBe('stars-and');
      expect(slugify('😀😃😄')).toBe('');
      expect(slugify('Test 🎉 Party', { strict: false })).toBe('test-party');
    });

    it('should handle currency symbols correctly', () => {
      expect(slugify('Price €50')).toBe('price-euro50');
      expect(slugify('Cost $100')).toBe('cost-dollar100');
      expect(slugify('Value ¥1000')).toBe('value-yen1000');
      expect(slugify('£25 pounds')).toBe('pound25-pounds');
      expect(slugify('¢99 cents')).toBe('cent99-cents');
    });

    it('should handle HTML entities', () => {
      // HTML entities are treated as regular text
      expect(slugify('&amp;&lt;&gt;')).toBe('andamp-andlt-andgt');
      expect(slugify('&nbsp;test')).toBe('andnbsp-test');
      expect(slugify('&copy;2024')).toBe('andcopy-2024');
      // Real symbols work as expected
      expect(slugify('© 2024')).toBe('c-2024');
      expect(slugify('Price < $100')).toBe('price-lt-dollar100');
    });

    it('should handle whitespace variations', () => {
      expect(slugify('tab\there')).toBe('tab-here');
      expect(slugify('new\nline')).toBe('new-line');
      expect(slugify('carriage\rreturn')).toBe('carriage-return');
      expect(slugify('non\u00A0breaking\u00A0space')).toBe('non-breaking-space');
    });
  });
});
