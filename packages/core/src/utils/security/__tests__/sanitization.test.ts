/**
 * @module @utils/security/__tests__/sanitization.test.ts
 * 
 * Tests for input sanitization utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeInput,
  stripDangerous,
  sanitizePath,
  safeTruncate,
  normalizeWhitespace,
} from '../sanitization.js';

describe('Sanitization Utilities', () => {
  describe('sanitizeInput', () => {
    it('should handle primitive types', () => {
      expect(sanitizeInput('hello')).toBe('hello');
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput(true)).toBe(true);
      expect(sanitizeInput(null)).toBe(null);
      expect(sanitizeInput(undefined)).toBe(undefined);
    });

    it('should trim strings by default', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
      expect(sanitizeInput('\n\ttab\n')).toBe('tab');
    });

    it('should respect maxLength option', () => {
      const longString = 'a'.repeat(100);
      
      expect(sanitizeInput(longString, { maxLength: 50 })).toBe('a'.repeat(50));
      expect(sanitizeInput(longString, { maxLength: 10 })).toBe('a'.repeat(10));
    });

    it('should normalize whitespace', () => {
      const input = 'hello   world\n\ntab\ttab';
      
      expect(sanitizeInput(input, { normalizeWhitespace: true }))
        .toBe('hello world tab tab');
    });

    it('should strip binary characters', () => {
      const input = 'Hello\x00World\x01\x02';
      
      expect(sanitizeInput(input, { stripBinary: true }))
        .toBe('HelloWorld');
    });

    it('should sanitize objects recursively', () => {
      const input = {
        name: '  John  ',
        bio: 'Hello\x00World',
        nested: {
          value: '  trimmed  ',
        },
      };
      
      const result = sanitizeInput(input, {
        stripBinary: true,
        trimStrings: true,
      });
      
      expect(result.name).toBe('John');
      expect(result.bio).toBe('HelloWorld');
      expect(result.nested.value).toBe('trimmed');
    });

    it('should sanitize arrays', () => {
      const input = ['  hello  ', 'world\x00', '  test  '];
      
      const result = sanitizeInput(input, {
        stripBinary: true,
        trimStrings: true,
      });
      
      expect(result).toEqual(['hello', 'world', 'test']);
    });

    it('should handle nested structures', () => {
      const input = {
        users: [
          { name: '  John  ', tags: ['  admin  ', '  user  '] },
          { name: '  Jane  ', tags: ['  user  '] },
        ],
      };
      
      const result = sanitizeInput(input, { trimStrings: true });
      
      expect(result.users[0].name).toBe('John');
      expect(result.users[0].tags).toEqual(['admin', 'user']);
      expect(result.users[1].name).toBe('Jane');
    });

    it('should respect maxDepth option', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              value: '  trim me  ',
            },
          },
        },
      };
      
      const result = sanitizeInput(input, {
        trimStrings: true,
        maxDepth: 2,
      });
      
      // Should not sanitize beyond depth 2
      expect(result.level1.level2.level3.value).toBe('  trim me  ');
    });

    it('should remove null bytes', () => {
      const input = 'test\x00string';
      expect(sanitizeInput(input, { stripBinary: true })).toBe('teststring');
    });

    it('should handle special objects', () => {
      const date = new Date('2023-01-01');
      const regex = /test/g;
      const error = new Error('test');
      
      expect(sanitizeInput(date)).toEqual(date);
      expect(sanitizeInput(regex)).toEqual(regex);
      expect(sanitizeInput(error)).toEqual(error);
    });

    it('should strip control characters', () => {
      const input = 'Hello\x0EWorld\x1FTest';
      expect(sanitizeInput(input, { stripBinary: true }))
        .toBe('HelloWorldTest');
    });

    it('should preserve allowed whitespace', () => {
      const input = 'Line 1\nLine 2\tTabbed';
      expect(sanitizeInput(input, { stripBinary: true }))
        .toBe('Line 1\nLine 2\tTabbed');
    });
  });

  describe('stripDangerous', () => {
    it('should strip HTML tags', () => {
      const input = '<p>Hello <b>World</b></p>';
      expect(stripDangerous(input, { stripHtml: true }))
        .toBe('Hello World');
    });

    it('should strip script tags and content', () => {
      const input = 'Before<script>alert("xss")</script>After';
      expect(stripDangerous(input, { stripScripts: true }))
        .toBe('BeforeAfter');
    });

    it('should strip event handlers', () => {
      const input = '<div onclick="alert(1)">Click me</div>';
      expect(stripDangerous(input, { stripHtml: true }))
        .toBe('Click me');
    });

    it('should strip SQL keywords', () => {
      const input = "SELECT * FROM users WHERE name = 'test'";
      expect(stripDangerous(input, { stripSql: true }))
        .toBe("* users name = 'test'");
    });

    it('should strip multiple dangerous patterns', () => {
      const input = '<script>SELECT * FROM</script> users';
      const result = stripDangerous(input, {
        stripScripts: true,
        stripSql: true,
      });
      
      expect(result).toBe('users');
    });

    it('should handle nested HTML', () => {
      const input = '<div><p>Hello <span>World</span></p></div>';
      expect(stripDangerous(input, { stripHtml: true }))
        .toBe('Hello World');
    });

    it('should strip control characters', () => {
      const input = 'Hello\x00\x01\x02World';
      expect(stripDangerous(input, { stripControl: true }))
        .toBe('HelloWorld');
    });

    it('should preserve safe content', () => {
      const input = 'This is safe content with numbers 123';
      expect(stripDangerous(input, {
        stripHtml: true,
        stripScripts: true,
        stripSql: true,
      })).toBe('This is safe content with numbers 123');
    });

    it('should handle malformed HTML', () => {
      const input = '<p>Unclosed paragraph <b>Bold';
      expect(stripDangerous(input, { stripHtml: true }))
        .toBe('Unclosed paragraph Bold');
    });

    it('should strip various XSS attempts', () => {
      const xssAttempts = [
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        '<iframe src="javascript:alert(1)">',
        '<a href="javascript:alert(1)">Click</a>',
      ];
      
      for (const xss of xssAttempts) {
        const result = stripDangerous(xss, {
          stripHtml: true,
          stripScripts: true,
        });
        expect(result).not.toContain('alert');
        expect(result).not.toContain('javascript:');
        expect(result).not.toContain('onerror');
        expect(result).not.toContain('onload');
      }
    });

    it('should handle encoded characters', () => {
      const input = '&lt;script&gt;alert(1)&lt;/script&gt;';
      // Should not decode and then strip - encoded content stays as is
      expect(stripDangerous(input, { stripScripts: true }))
        .toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    it('should strip shell commands', () => {
      const input = 'rm -rf / && echo "done"';
      expect(stripDangerous(input, { stripShell: true }))
        .toBe('-rf / "done"');
    });
  });

  describe('sanitizePath', () => {
    it('should normalize path separators', () => {
      expect(sanitizePath('path\\to\\file')).toBe('path/to/file');
      expect(sanitizePath('path//to///file')).toBe('path/to/file');
    });

    it('should prevent directory traversal', () => {
      expect(sanitizePath('../../../etc/passwd')).toBe('etc/passwd');
      expect(sanitizePath('path/../../../secret')).toBe('secret');
      expect(sanitizePath('./../file')).toBe('file');
    });

    it('should remove absolute paths by default', () => {
      expect(sanitizePath('/etc/passwd')).toBe('etc/passwd');
      expect(sanitizePath('C:\\Windows\\System32')).toBe('Windows/System32');
    });

    it('should allow absolute paths when specified', () => {
      expect(sanitizePath('/usr/local/bin', { allowAbsolute: true }))
        .toBe('/usr/local/bin');
    });

    it('should respect maxLength', () => {
      const longPath = 'a/'.repeat(50) + 'file.txt';
      expect(sanitizePath(longPath, { maxLength: 50 }))
        .toHaveLength(50);
    });

    it('should allow only specified extensions', () => {
      const options = { allowedExtensions: ['.txt', '.pdf'] };
      
      expect(sanitizePath('file.txt', options)).toBe('file.txt');
      expect(sanitizePath('file.pdf', options)).toBe('file.pdf');
      expect(() => sanitizePath('file.exe', options)).toThrow();
    });

    it('should handle special characters', () => {
      expect(sanitizePath('file name.txt')).toBe('file name.txt');
      expect(sanitizePath('file:name.txt')).toBe('filename.txt');
      expect(sanitizePath('file<>name.txt')).toBe('filename.txt');
    });

    it('should handle null bytes', () => {
      expect(sanitizePath('file\x00.txt')).toBe('file.txt');
    });

    it('should preserve case by default', () => {
      expect(sanitizePath('MyFile.TXT')).toBe('MyFile.TXT');
    });

    it('should normalize to lowercase when specified', () => {
      expect(sanitizePath('MyFile.TXT', { lowercase: true }))
        .toBe('myfile.txt');
    });

    it('should handle URL-like paths', () => {
      expect(sanitizePath('http://example.com/path'))
        .toBe('http/example.com/path');
      expect(sanitizePath('file:///etc/passwd'))
        .toBe('file/etc/passwd');
    });

    it('should handle Windows drive letters', () => {
      expect(sanitizePath('C:\\Users\\Admin')).toBe('Users/Admin');
      expect(sanitizePath('D:/Projects/Code')).toBe('Projects/Code');
    });

    it('should handle empty and invalid input', () => {
      expect(sanitizePath('')).toBe('');
      expect(sanitizePath('.')).toBe('');
      expect(sanitizePath('..')).toBe('');
      expect(sanitizePath('///')).toBe('');
    });
  });

  describe('safeTruncate', () => {
    it('should truncate strings to specified length', () => {
      const text = 'This is a long string that needs truncation';
      
      expect(safeTruncate(text, { maxLength: 10 }))
        .toBe('This is...');
      expect(safeTruncate(text, { maxLength: 20 }))
        .toBe('This is a long st...');
    });

    it('should not truncate short strings', () => {
      const text = 'Short';
      expect(safeTruncate(text, { maxLength: 10 })).toBe('Short');
    });

    it('should use custom ellipsis', () => {
      const text = 'This is a long string';
      
      expect(safeTruncate(text, { maxLength: 10, ellipsis: '…' }))
        .toBe('This is a…');
      expect(safeTruncate(text, { maxLength: 10, ellipsis: ' [more]' }))
        .toBe('Thi [more]');
    });

    it('should break at word boundaries', () => {
      const text = 'This is a long string with words';
      
      expect(safeTruncate(text, {
        maxLength: 15,
        breakWords: false,
      })).toBe('This is a...');
    });

    it('should handle exact length', () => {
      const text = '12345';
      expect(safeTruncate(text, { maxLength: 5 })).toBe('12345');
    });

    it('should handle empty ellipsis', () => {
      const text = 'This is long';
      expect(safeTruncate(text, {
        maxLength: 7,
        ellipsis: '',
      })).toBe('This is');
    });

    it('should preserve HTML entities', () => {
      const text = 'Hello &amp; goodbye &lt;world&gt;';
      const result = safeTruncate(text, { maxLength: 15 });
      
      expect(result).toBe('Hello &amp;...');
    });

    it('should handle unicode correctly', () => {
      const text = 'Hello 👋 World 🌍 Test';
      const result = safeTruncate(text, { maxLength: 10 });
      
      expect(result).toBe('Hello 👋...');
    });

    it('should handle very small maxLength', () => {
      const text = 'Hello World';
      
      expect(safeTruncate(text, { maxLength: 1 })).toBe('...');
      expect(safeTruncate(text, { maxLength: 3 })).toBe('...');
      expect(safeTruncate(text, { maxLength: 4 })).toBe('H...');
    });

    it('should handle empty string', () => {
      expect(safeTruncate('', { maxLength: 10 })).toBe('');
    });
  });

  describe('normalizeWhitespace', () => {
    it('should collapse multiple spaces', () => {
      expect(normalizeWhitespace('hello   world')).toBe('hello world');
      expect(normalizeWhitespace('a    b    c')).toBe('a b c');
    });

    it('should normalize line breaks', () => {
      expect(normalizeWhitespace('hello\n\nworld')).toBe('hello world');
      expect(normalizeWhitespace('line1\r\nline2')).toBe('line1 line2');
    });

    it('should handle tabs', () => {
      expect(normalizeWhitespace('hello\t\tworld')).toBe('hello world');
      expect(normalizeWhitespace('tab\tseparated\tvalues'))
        .toBe('tab separated values');
    });

    it('should trim by default', () => {
      expect(normalizeWhitespace('  hello world  ')).toBe('hello world');
      expect(normalizeWhitespace('\n\nhello\n\n')).toBe('hello');
    });

    it('should preserve single line breaks when specified', () => {
      const text = 'Line 1\nLine 2\n\nLine 3';
      
      expect(normalizeWhitespace(text, { preserveLineBreaks: true }))
        .toBe('Line 1\nLine 2\nLine 3');
    });

    it('should not trim when specified', () => {
      expect(normalizeWhitespace('  hello  ', { trim: false }))
        .toBe(' hello ');
    });

    it('should handle mixed whitespace', () => {
      const text = '  hello\t\n\r\n  world  \t';
      expect(normalizeWhitespace(text)).toBe('hello world');
    });

    it('should handle empty string', () => {
      expect(normalizeWhitespace('')).toBe('');
      expect(normalizeWhitespace('   ')).toBe('');
      expect(normalizeWhitespace('\n\n')).toBe('');
    });

    it('should preserve single spaces', () => {
      expect(normalizeWhitespace('hello world')).toBe('hello world');
    });

    it('should handle unicode whitespace', () => {
      const text = 'hello\u00A0world'; // Non-breaking space
      expect(normalizeWhitespace(text)).toBe('hello world');
    });

    it('should handle very long whitespace sequences', () => {
      const text = 'hello' + ' '.repeat(1000) + 'world';
      expect(normalizeWhitespace(text)).toBe('hello world');
    });

    it('should use custom replacement', () => {
      const text = 'hello   world';
      expect(normalizeWhitespace(text, { replacement: '_' }))
        .toBe('hello_world');
    });
  });

  describe('Performance', () => {
    it('should handle large inputs efficiently', () => {
      const largeInput = {
        data: Array(1000).fill(null).map((_, i) => ({
          id: i,
          text: '  needs trimming  ',
          binary: 'text\x00with\x01binary',
        })),
      };
      
      const start = performance.now();
      const result = sanitizeInput(largeInput, {
        trimStrings: true,
        stripBinary: true,
      });
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(100); // Should be fast
      expect(result.data[0].text).toBe('needs trimming');
      expect(result.data[0].binary).toBe('textwithbinary');
    });

    it('should handle deeply nested objects efficiently', () => {
      let obj: Record<string, unknown> = { value: '  trim  ' };
      for (let i = 0; i < 50; i++) {
        obj = { nested: obj };
      }
      
      const start = performance.now();
      sanitizeInput(obj, {
        trimStrings: true,
        maxDepth: 20,
      });
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(50);
    });
  });
});