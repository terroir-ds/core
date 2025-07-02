import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('markdown fixes output validation', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'validation-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('MD031 compliance - blank lines around code blocks', () => {
    it('should add blank lines around code blocks', () => {
      const input = `# Test
\`\`\`
code
\`\`\`
Next section`;

      const expected = `# Test

\`\`\`text
code
\`\`\`

Next section
`;

      const testFile = join(tempDir, 'md031.md');
      writeFileSync(testFile, input);

      // Run fix
      execSync(`node ${join(__dirname, '../../fix-markdown-code-blocks.js')} "${tempDir}"`, {
        stdio: 'pipe'
      });

      const result = readFileSync(testFile, 'utf8');
      expect(result).toBe(expected);
    });
  });

  describe('MD040 compliance - language specified', () => {
    it('should add language identifiers to code blocks', () => {
      const input = `# Test

\`\`\`
console.log("test");
\`\`\`
`;

      const expected = `# Test

\`\`\`javascript
console.log("test");
\`\`\`
`;

      const testFile = join(tempDir, 'md040.md');
      writeFileSync(testFile, input);

      // Run fix
      execSync(`node ${join(__dirname, '../../fix-markdown-code-blocks.js')} "${tempDir}"`, {
        stdio: 'pipe'
      });

      const result = readFileSync(testFile, 'utf8');
      expect(result).toBe(expected);
    });
  });

  describe('document structure preservation', () => {
    it('should maintain document structure', () => {
      const input = `# Main Title

## Section 1

Some text here.

\`\`\`
code without language
\`\`\`

## Section 2

More text.

### Subsection 2.1

\`\`\`javascript
const x = 42;
\`\`\`

## Section 3

Final text.`;

      const testFile = join(tempDir, 'structure.md');
      writeFileSync(testFile, input);

      // Run fix
      execSync(`node ${join(__dirname, '../../fix-markdown-code-blocks.js')} "${tempDir}"`, {
        stdio: 'pipe'
      });

      const result = readFileSync(testFile, 'utf8');
      
      // Count sections to ensure structure is maintained
      const headingCount = (result.match(/^#{1,6}\s/gm) || []).length;
      expect(headingCount).toBe(5); // 1 h1, 3 h2, 1 h3
      
      // Ensure code blocks have languages
      const codeBlocks = result.match(/```\w+/g) || [];
      expect(codeBlocks.length).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should not break on edge cases', () => {
      const testCases = [
        {
          name: 'empty-file.md',
          input: '',
          shouldChange: false
        },
        {
          name: 'no-code.md',
          input: '# Just Text\n\nNo code blocks here.',
          shouldChange: false
        },
        {
          name: 'nested.md',
          input: '# Test\n\n````\n```\ninner\n```\n````',
          shouldChange: false // quadruple backticks unchanged
        }
      ];

      testCases.forEach(({ name, input, shouldChange }) => {
        const testFile = join(tempDir, name);
        writeFileSync(testFile, input);

        execSync(`node ${join(__dirname, '../../fix-markdown-code-blocks.js')} "${tempDir}"`, {
          stdio: 'pipe'
        });

        const result = readFileSync(testFile, 'utf8');
        
        if (!shouldChange) {
          expect(result).toBe(input);
        }
      });
    });
  });
});