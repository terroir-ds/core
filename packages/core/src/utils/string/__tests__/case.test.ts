/**
 * @module @utils/string/__tests__/case.test.ts
 * 
 * Tests for case conversion utilities.
 */

import { describe, it, expect } from 'vitest';
import {
  splitWords,
  camelCase,
  pascalCase,
  snakeCase,
  kebabCase,
  titleCase,
  constantCase,
  dotCase,
  pathCase,
  sentenceCase,
  isCamelCase,
  isPascalCase,
  isSnakeCase,
  isKebabCase,
  isConstantCase,
} from '@utils/string/case';

describe('Case Conversion Utilities', () => {
  describe('splitWords', () => {
    it('should split camelCase', () => {
      expect(splitWords('helloWorld')).toEqual(['hello', 'World']);
      expect(splitWords('getHTTPResponseCode')).toEqual(['get', 'HTTP', 'Response', 'Code']);
      expect(splitWords('XMLHttpRequest')).toEqual(['XML', 'Http', 'Request']);
    });

    it('should split kebab-case', () => {
      expect(splitWords('hello-world')).toEqual(['hello', 'world']);
      expect(splitWords('my-long-variable-name')).toEqual(['my', 'long', 'variable', 'name']);
    });

    it('should split snake_case', () => {
      expect(splitWords('hello_world')).toEqual(['hello', 'world']);
      expect(splitWords('my_long_variable_name')).toEqual(['my', 'long', 'variable', 'name']);
    });

    it('should split space-separated words', () => {
      expect(splitWords('hello world')).toEqual(['hello', 'world']);
      expect(splitWords('multiple   spaces   here')).toEqual(['multiple', 'spaces', 'here']);
    });

    it('should handle mixed separators', () => {
      expect(splitWords('hello-world_test case')).toEqual(['hello', 'world', 'test', 'case']);
      expect(splitWords('API_KEYs-and HTMLElements')).toEqual(['API', 'KE', 'Ys', 'and', 'HTML', 'Elements']);
    });

    it('should handle numbers', () => {
      expect(splitWords('hello123world')).toEqual(['hello', '123', 'world']);
      expect(splitWords('version2API')).toEqual(['version', '2', 'API']);
      expect(splitWords('test123ABC456def')).toEqual(['test', '123', 'ABC', '456', 'def']);
    });

    it('should handle consecutive uppercase letters', () => {
      expect(splitWords('XMLHttpRequest')).toEqual(['XML', 'Http', 'Request']);
      expect(splitWords('HTTPSProxy')).toEqual(['HTTPS', 'Proxy']);
      expect(splitWords('URLPath')).toEqual(['URL', 'Path']);
    });

    it('should handle edge cases', () => {
      expect(splitWords('')).toEqual([]);
      expect(splitWords('   ')).toEqual([]);
      expect(splitWords('a')).toEqual(['a']);
      expect(splitWords('A')).toEqual(['A']);
      expect(splitWords('123')).toEqual(['123']);
    });

    it('should handle special characters', () => {
      expect(splitWords('hello.world')).toEqual(['hello', 'world']);
      expect(splitWords('file@domain.com')).toEqual(['file', 'domain', 'com']);
    });
  });

  describe('camelCase', () => {
    it('should convert to camelCase', () => {
      expect(camelCase('hello world')).toBe('helloWorld');
      expect(camelCase('Hello-World')).toBe('helloWorld');
      expect(camelCase('hello_world')).toBe('helloWorld');
      expect(camelCase('HELLO WORLD')).toBe('helloWorld');
    });

    it('should handle complex cases', () => {
      expect(camelCase('XMLHttpRequest')).toBe('xmlHttpRequest');
      expect(camelCase('get-HTTP-response-code')).toBe('getHttpResponseCode');
      expect(camelCase('API_KEY_SECRET')).toBe('apiKeySecret');
    });

    it('should handle single words', () => {
      expect(camelCase('hello')).toBe('hello');
      expect(camelCase('HELLO')).toBe('hello');
      expect(camelCase('Hello')).toBe('hello');
    });

    it('should handle empty strings', () => {
      expect(camelCase('')).toBe('');
      expect(camelCase('   ')).toBe('');
    });

    it('should preserve numbers', () => {
      expect(camelCase('version 2 api')).toBe('version2Api');
      expect(camelCase('test123abc')).toBe('test123Abc');
    });
  });

  describe('pascalCase', () => {
    it('should convert to PascalCase', () => {
      expect(pascalCase('hello world')).toBe('HelloWorld');
      expect(pascalCase('hello-world')).toBe('HelloWorld');
      expect(pascalCase('hello_world')).toBe('HelloWorld');
      expect(pascalCase('HELLO WORLD')).toBe('HelloWorld');
    });

    it('should handle complex cases', () => {
      expect(pascalCase('XMLHttpRequest')).toBe('XmlHttpRequest');
      expect(pascalCase('get-HTTP-response-code')).toBe('GetHttpResponseCode');
      expect(pascalCase('API_KEY_SECRET')).toBe('ApiKeySecret');
    });

    it('should handle single words', () => {
      expect(pascalCase('hello')).toBe('Hello');
      expect(pascalCase('HELLO')).toBe('Hello');
      expect(pascalCase('Hello')).toBe('Hello');
    });

    it('should handle empty strings', () => {
      expect(pascalCase('')).toBe('');
      expect(pascalCase('   ')).toBe('');
    });
  });

  describe('snakeCase', () => {
    it('should convert to snake_case', () => {
      expect(snakeCase('hello world')).toBe('hello_world');
      expect(snakeCase('helloWorld')).toBe('hello_world');
      expect(snakeCase('Hello-World')).toBe('hello_world');
      expect(snakeCase('HELLO WORLD')).toBe('hello_world');
    });

    it('should convert to UPPER_SNAKE_CASE', () => {
      expect(snakeCase('hello world', true)).toBe('HELLO_WORLD');
      expect(snakeCase('helloWorld', true)).toBe('HELLO_WORLD');
    });

    it('should handle complex cases', () => {
      expect(snakeCase('XMLHttpRequest')).toBe('xml_http_request');
      expect(snakeCase('getHTTPResponseCode')).toBe('get_http_response_code');
    });

    it('should handle numbers', () => {
      expect(snakeCase('version2API')).toBe('version_2_api');
      expect(snakeCase('test123abc')).toBe('test_123_abc');
    });
  });

  describe('kebabCase', () => {
    it('should convert to kebab-case', () => {
      expect(kebabCase('hello world')).toBe('hello-world');
      expect(kebabCase('helloWorld')).toBe('hello-world');
      expect(kebabCase('Hello_World')).toBe('hello-world');
      expect(kebabCase('HELLO WORLD')).toBe('hello-world');
    });

    it('should handle complex cases', () => {
      expect(kebabCase('XMLHttpRequest')).toBe('xml-http-request');
      expect(kebabCase('getHTTPResponseCode')).toBe('get-http-response-code');
    });

    it('should handle numbers', () => {
      expect(kebabCase('version2API')).toBe('version-2-api');
      expect(kebabCase('test123abc')).toBe('test-123-abc');
    });
  });

  describe('titleCase', () => {
    it('should convert to Title Case', () => {
      expect(titleCase('hello world')).toBe('Hello World');
      expect(titleCase('the quick brown fox')).toBe('The Quick Brown Fox');
      expect(titleCase('HELLO WORLD')).toBe('Hello World');
    });

    it('should handle smart title case', () => {
      expect(titleCase('the quick brown fox', false)).toBe('The Quick Brown Fox');
      expect(titleCase('a tale of two cities', false)).toBe('A Tale of Two Cities');
      expect(titleCase('lord of the rings', false)).toBe('Lord of the Rings');
    });

    it('should always capitalize first and last words', () => {
      expect(titleCase('a', false)).toBe('A');
      expect(titleCase('the end', false)).toBe('The End');
      expect(titleCase('of mice and men', false)).toBe('Of Mice and Men');
    });

    it('should handle single words', () => {
      expect(titleCase('hello')).toBe('Hello');
      expect(titleCase('HELLO')).toBe('Hello');
    });
  });

  describe('constantCase', () => {
    it('should convert to CONSTANT_CASE', () => {
      expect(constantCase('hello world')).toBe('HELLO_WORLD');
      expect(constantCase('helloWorld')).toBe('HELLO_WORLD');
      expect(constantCase('Hello-World')).toBe('HELLO_WORLD');
    });

    it('should handle complex cases', () => {
      expect(constantCase('XMLHttpRequest')).toBe('XML_HTTP_REQUEST');
      expect(constantCase('getHTTPResponseCode')).toBe('GET_HTTP_RESPONSE_CODE');
    });
  });

  describe('dotCase', () => {
    it('should convert to dot.case', () => {
      expect(dotCase('hello world')).toBe('hello.world');
      expect(dotCase('helloWorld')).toBe('hello.world');
      expect(dotCase('Hello-World')).toBe('hello.world');
    });

    it('should handle complex cases', () => {
      expect(dotCase('XMLHttpRequest')).toBe('xml.http.request');
      expect(dotCase('getHTTPResponseCode')).toBe('get.http.response.code');
    });
  });

  describe('pathCase', () => {
    it('should convert to path/case', () => {
      expect(pathCase('hello world')).toBe('hello/world');
      expect(pathCase('helloWorld')).toBe('hello/world');
      expect(pathCase('Hello-World')).toBe('hello/world');
    });

    it('should handle complex cases', () => {
      expect(pathCase('XMLHttpRequest')).toBe('xml/http/request');
      expect(pathCase('getHTTPResponseCode')).toBe('get/http/response/code');
    });
  });

  describe('sentenceCase', () => {
    it('should convert to Sentence case', () => {
      expect(sentenceCase('hello world')).toBe('Hello world');
      expect(sentenceCase('HELLO WORLD')).toBe('Hello world');
      expect(sentenceCase('helloWorld')).toBe('Helloworld');
    });

    it('should handle multiple sentences', () => {
      expect(sentenceCase('hello. world')).toBe('Hello. World');
      expect(sentenceCase('first sentence! second sentence?')).toBe('First sentence! Second sentence?');
    });

    it('should handle empty strings', () => {
      expect(sentenceCase('')).toBe('');
      expect(sentenceCase('   ')).toBe('   ');
    });
  });

  describe('Case Validation', () => {
    describe('isCamelCase', () => {
      it('should identify camelCase', () => {
        expect(isCamelCase('helloWorld')).toBe(true);
        expect(isCamelCase('hello')).toBe(true);
        expect(isCamelCase('getHTTPResponse')).toBe(true);
        expect(isCamelCase('version2API')).toBe(true);
      });

      it('should reject non-camelCase', () => {
        expect(isCamelCase('HelloWorld')).toBe(false); // PascalCase
        expect(isCamelCase('hello_world')).toBe(false); // snake_case
        expect(isCamelCase('hello-world')).toBe(false); // kebab-case
        expect(isCamelCase('hello world')).toBe(false); // space
        expect(isCamelCase('')).toBe(false); // empty
      });
    });

    describe('isPascalCase', () => {
      it('should identify PascalCase', () => {
        expect(isPascalCase('HelloWorld')).toBe(true);
        expect(isPascalCase('Hello')).toBe(true);
        expect(isPascalCase('GetHTTPResponse')).toBe(true);
        expect(isPascalCase('Version2API')).toBe(true);
      });

      it('should reject non-PascalCase', () => {
        expect(isPascalCase('helloWorld')).toBe(false); // camelCase
        expect(isPascalCase('hello_world')).toBe(false); // snake_case
        expect(isPascalCase('hello-world')).toBe(false); // kebab-case
        expect(isPascalCase('')).toBe(false); // empty
      });
    });

    describe('isSnakeCase', () => {
      it('should identify snake_case', () => {
        expect(isSnakeCase('hello_world')).toBe(true);
        expect(isSnakeCase('hello')).toBe(true);
        expect(isSnakeCase('get_http_response')).toBe(true);
        expect(isSnakeCase('version_2_api')).toBe(true);
      });

      it('should reject non-snake_case', () => {
        expect(isSnakeCase('HelloWorld')).toBe(false); // PascalCase
        expect(isSnakeCase('helloWorld')).toBe(false); // camelCase
        expect(isSnakeCase('hello-world')).toBe(false); // kebab-case
        expect(isSnakeCase('HELLO_WORLD')).toBe(false); // CONSTANT_CASE
        expect(isSnakeCase('')).toBe(false); // empty
      });
    });

    describe('isKebabCase', () => {
      it('should identify kebab-case', () => {
        expect(isKebabCase('hello-world')).toBe(true);
        expect(isKebabCase('hello')).toBe(true);
        expect(isKebabCase('get-http-response')).toBe(true);
        expect(isKebabCase('version-2-api')).toBe(true);
      });

      it('should reject non-kebab-case', () => {
        expect(isKebabCase('HelloWorld')).toBe(false); // PascalCase
        expect(isKebabCase('helloWorld')).toBe(false); // camelCase
        expect(isKebabCase('hello_world')).toBe(false); // snake_case
        expect(isKebabCase('')).toBe(false); // empty
      });
    });

    describe('isConstantCase', () => {
      it('should identify CONSTANT_CASE', () => {
        expect(isConstantCase('HELLO_WORLD')).toBe(true);
        expect(isConstantCase('HELLO')).toBe(true);
        expect(isConstantCase('GET_HTTP_RESPONSE')).toBe(true);
        expect(isConstantCase('VERSION_2_API')).toBe(true);
      });

      it('should reject non-CONSTANT_CASE', () => {
        expect(isConstantCase('HelloWorld')).toBe(false); // PascalCase
        expect(isConstantCase('helloWorld')).toBe(false); // camelCase
        expect(isConstantCase('hello_world')).toBe(false); // snake_case
        expect(isConstantCase('hello-world')).toBe(false); // kebab-case
        expect(isConstantCase('')).toBe(false); // empty
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty and whitespace strings', () => {
      expect(camelCase('')).toBe('');
      expect(pascalCase('   ')).toBe('');
      expect(snakeCase('\t\n')).toBe('');
    });

    it('should handle strings with only separators', () => {
      expect(camelCase('---')).toBe('');
      expect(pascalCase('___')).toBe('');
      expect(kebabCase('   ')).toBe('');
    });

    it('should handle Unicode characters', () => {
      expect(camelCase('café résumé')).toBe('caféRésumé');
      expect(snakeCase('naïve approach')).toBe('naïve_approach');
    });

    it('should handle numbers at boundaries', () => {
      expect(splitWords('abc123def456')).toEqual(['abc', '123', 'def', '456']);
      expect(camelCase('test 123 abc')).toBe('test123Abc');
      expect(snakeCase('version2Release3')).toBe('version_2_release_3');
    });

    it('should handle single character inputs', () => {
      expect(camelCase('a')).toBe('a');
      expect(pascalCase('a')).toBe('A');
      expect(snakeCase('A')).toBe('a');
      expect(kebabCase('X')).toBe('x');
    });

    it('should handle already converted strings', () => {
      expect(camelCase('alreadyCamelCase')).toBe('alreadyCamelCase');
      expect(pascalCase('AlreadyPascalCase')).toBe('AlreadyPascalCase');
      expect(snakeCase('already_snake_case')).toBe('already_snake_case');
      expect(kebabCase('already-kebab-case')).toBe('already-kebab-case');
    });
  });

  describe('Performance', () => {
    it('should handle large inputs efficiently', () => {
      const longString = 'very'.repeat(1000) + 'LongString';
      
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        camelCase(longString);
        pascalCase(longString);
        snakeCase(longString);
        kebabCase(longString);
      }
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(1000); // Should complete in under 1000ms
    });

    it('should handle many small conversions efficiently', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        camelCase(`test ${i} string`);
        pascalCase(`another ${i} test`);
        snakeCase(`final ${i} example`);
      }
      
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
    });
  });
});