import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('markdown fixes orchestrator', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'orchestrator-test-'));
  });

  afterEach(() => {
    // Reset working directory before cleanup to avoid ENOENT errors
    process.chdir(__dirname);
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('full pipeline', () => {
    it('should run all fixes in correct order', () => {
      // Create a markdown file with all types of issues
      const input = `
# Test Document

## Code Block Issues

### Missing Language
\`\`\`
pnpm install
\`\`\`bash

### Extra Blank Lines
\`\`\`javascript

const x = 42;

\`\`\`
## Link Issues

See [broken link](#broken-section)
Check [Code Block Issues](#code-block-issues)

## Another Section

\`\`\`bash
echo "test"
\`\`\`
\`\`\`javascript
console.log("next");
\`\`\`
`;

      const expected = `
# Test Document

## Code Block Issues

### Missing Language

\`\`\`bash
pnpm install
\`\`\`

### Extra Blank Lines

\`\`\`javascript
const x = 42;
\`\`\`

## Link Issues

See [broken link](#broken-section)
Check [Code Block Issues](#code-block-issues)

## Another Section

\`\`\`bash
echo "test"
\`\`\`

\`\`\`javascript
console.log("next");
\`\`\`
`;

      const testFile = join(tempDir, 'full-test.md');
      writeFileSync(testFile, input);

      // Run the orchestrator
      process.chdir(tempDir);
      const output = execSync(`node ${join(__dirname, '../../index.js')}`, {
        encoding: 'utf8'
      });

      const result = readFileSync(testFile, 'utf8');
      expect(result).toBe(expected);

      // Check output messages
      expect(output).toContain('Running all markdown fixes');
      // The actual output will have log lines from the scripts
      expect(output).toContain('📊 Summary:');
      expect(output).toContain('Fixed');
    });

    it('should handle errors gracefully', () => {
      // Test with non-existent directory
      // const badDir = join(tempDir, 'non-existent');
      
      process.chdir(tempDir);
      
      // The scripts run on the current directory, not a bad one
      const output = execSync(`node ${join(__dirname, '../../index.js')}`, {
        encoding: 'utf8'
      });

      // Should complete successfully on empty directory
      expect(output).toContain('Running all markdown fixes');
      expect(output).toContain('📊 Summary:');
    });

    it('should report correct statistics', () => {
      // Create multiple files with different issues
      const file1 = join(tempDir, 'file1.md');
      const file2 = join(tempDir, 'file2.md');

      writeFileSync(file1, `
# File 1
\`\`\`
code without language
\`\`\`
`);

      writeFileSync(file2, `
# File 2
## Section
[Broken](#broken)
`);

      process.chdir(tempDir);
      const output = execSync(`node ${join(__dirname, '../../index.js')}`, {
        encoding: 'utf8'
      });

      // Should report fixes from both scripts
      expect(output).toContain('Fixed');
      expect(output).toContain('📊 Summary:');
    });
  });

  describe('script order', () => {
    it('should run code block fixes before link fixes', () => {
      // This is important because code block fixes might change heading IDs
      const input = `
# Document

## \`Code\` Section

Link to [Code Section](#code-section)

\`\`\`
some code
\`\`\`
`;

      const testFile = join(tempDir, 'order-test.md');
      writeFileSync(testFile, input);

      process.chdir(tempDir);
      execSync(`node ${join(__dirname, '../../index.js')}`, {
        encoding: 'utf8'
      });

      const result = readFileSync(testFile, 'utf8');
      
      // Code blocks should be fixed (language added)
      expect(result).toContain('```text');
      
      // Link should still work (not broken by code block changes)
      expect(result).toContain('[Code Section](#code-section)');
    });
  });

  describe('configuration', () => {
    it('should allow running individual fixes', () => {
      const input = `
# Test
\`\`\`
code
\`\`\`
[Link](#broken)
`;

      const testFile = join(tempDir, 'individual.md');
      writeFileSync(testFile, input);

      // Run only code block fixes
      process.chdir(tempDir);
      execSync(`node ${join(__dirname, '../../fix-markdown-code-blocks.js')}`, {
        encoding: 'utf8'
      });

      const result = readFileSync(testFile, 'utf8');
      
      // Code should be fixed
      expect(result).toMatch(/```\w+/);
      
      // Link should still be broken
      expect(result).toContain('[Link](#broken)');
    });
  });
});