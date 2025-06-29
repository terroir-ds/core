import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Import the functions we want to test
import { detectLanguage } from '@scripts/utils/markdown-fixes/fix-markdown-code-blocks.js';

describe('fix-markdown-code-blocks', () => {
  let tempDir;

  beforeEach(() => {
    // Create a temporary directory for test files
    tempDir = mkdtempSync(join(tmpdir(), 'markdown-fix-test-'));
  });

  afterEach(() => {
    // Clean up temp directory
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('detectLanguage', () => {
    it('should detect bash from shell commands', () => {
      const cases = [
        'pnpm install',
        'npm run test',
        'cd /path/to/dir',
        '#!/bin/bash\necho "hello"',
        '# This is a shell script\nls -la'
      ];

      cases.forEach(code => {
        expect(detectLanguage(code, 'test.md')).toBe('bash');
      });
    });

    it('should detect typescript from type annotations', () => {
      const cases = [
        'const x: string = "hello"',
        'interface User { name: string }',
        'type MyType = string | number',
        'function test<T>(arg: T): T { return arg; }'
      ];

      cases.forEach(code => {
        expect(detectLanguage(code, 'test.md')).toBe('typescript');
      });
    });

    it('should detect javascript from common patterns', () => {
      const cases = [
        'const x = "hello"',
        'console.log("test")',
        'module.exports = {}',
        'require("./file")'
      ];

      cases.forEach(code => {
        expect(detectLanguage(code, 'test.md')).toBe('javascript');
      });
    });

    it('should detect json from structure', () => {
      const cases = [
        '{ "name": "test" }',
        '[\n  "item1",\n  "item2"\n]',
        '{\n  "scripts": {\n    "test": "vitest"\n  }\n}'
      ];

      cases.forEach(code => {
        expect(detectLanguage(code, 'test.md')).toBe('json');
      });
    });

    it('should default to text for unknown patterns', () => {
      expect(detectLanguage('Some random text', 'test.md')).toBe('text');
    });
  });

  // Integration tests handle the actual code block processing
  // See fix-markdown-code-blocks-integration.test.js for full tests
});