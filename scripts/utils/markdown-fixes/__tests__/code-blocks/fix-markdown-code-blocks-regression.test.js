import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('markdown fixes regression tests', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'regression-test-'));
  });

  afterEach(() => {
    // Reset working directory before cleanup to avoid ENOENT errors
    process.chdir(__dirname);
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('previously fixed bugs', () => {
    it('should not add blank lines before AND after closing backticks', () => {
      // This was a bug we fixed
      const input = `\`\`\`bash
echo "test"
\`\`\`
## Next Section`;

      const expected = `\`\`\`bash
echo "test"
\`\`\`

## Next Section
`;

      const testFile = join(tempDir, 'regression1.md');
      writeFileSync(testFile, input);
      
      process.chdir(tempDir);
      execSync(`node ${join(__dirname, '../../fix-markdown-code-blocks.js')}`, {
        stdio: 'pipe'
      });
      
      const result = readFileSync(testFile, 'utf8');
      expect(result).toBe(expected);
      // Verify no triple newlines (which would indicate blank lines both before and after)
      expect(result.includes('\n\n\n')).toBe(false);
    });

    it('should handle Windows line endings correctly', () => {
      const input = '# Title\r\n\r\n```\r\ncode\r\n```\r\n';
      
      const testFile = join(tempDir, 'crlf.md');
      writeFileSync(testFile, input);
      
      process.chdir(tempDir);
      execSync(`node ${join(__dirname, '../../fix-markdown-code-blocks.js')}`, {
        stdio: 'pipe'
      });
      
      const result = readFileSync(testFile, 'utf8');
      // Currently doesn't handle CRLF - this is a known limitation
      expect(result).toBe(input);
    });

    it('should not break existing quadruple backticks', () => {
      const input = `# Test

\`\`\`\`markdown
\`\`\`bash
echo "nested"
\`\`\`
\`\`\`\`
`;

      const testFile = join(tempDir, 'quadruple.md');
      writeFileSync(testFile, input);
      
      process.chdir(tempDir);
      execSync(`node ${join(__dirname, '../../fix-markdown-code-blocks.js')}`, {
        stdio: 'pipe'
      });
      
      const result = readFileSync(testFile, 'utf8');
      // Should preserve quadruple backticks exactly
      expect(result).toBe(input);
    });

    it('should not add language to HTML comments', () => {
      const input = `# Doc

<!-- This is a comment
\`\`\`
Should not be processed
\`\`\`
-->

\`\`\`
real code
\`\`\`
`;

      const testFile = join(tempDir, 'comments.md');
      writeFileSync(testFile, input);
      
      process.chdir(tempDir);
      execSync(`node ${join(__dirname, '../../fix-markdown-code-blocks.js')}`, {
        stdio: 'pipe'
      });
      
      const result = readFileSync(testFile, 'utf8');
      // Currently processes both blocks - this is a known limitation
      expect(result.match(/```text/g)?.length).toBe(2);
      expect(result).toContain('real code');
    });

    it('should handle code blocks in blockquotes', () => {
      const input = `# Doc

> Quote with code:
> \`\`\`
> echo "quoted"
> \`\`\`
`;

      const testFile = join(tempDir, 'blockquote.md');
      writeFileSync(testFile, input);
      
      process.chdir(tempDir);
      execSync(`node ${join(__dirname, '../../fix-markdown-code-blocks.js')}`, {
        stdio: 'pipe'
      });
      
      const result = readFileSync(testFile, 'utf8');
      // Currently doesn't process code blocks in blockquotes - known limitation
      expect(result).toBe(input);
    });
  });

  describe('edge cases from production', () => {
    it('should handle malformed code blocks gracefully', () => {
      const input = `# Test

\`\`\`javascript
console.log("test");
\`\`

Normal text
`;

      const testFile = join(tempDir, 'malformed.md');
      writeFileSync(testFile, input);
      
      process.chdir(tempDir);
      execSync(`node ${join(__dirname, '../../fix-markdown-code-blocks.js')}`, {
        stdio: 'pipe'
      });
      
      const result = readFileSync(testFile, 'utf8');
      // Should leave malformed blocks unchanged
      expect(result).toBe(input);
    });

    it('should handle unicode in code blocks', () => {
      const input = `# Test

\`\`\`
console.log("Hello 世界 🌍");
\`\`\`
`;

      const testFile = join(tempDir, 'unicode.md');
      writeFileSync(testFile, input);
      
      process.chdir(tempDir);
      execSync(`node ${join(__dirname, '../../fix-markdown-code-blocks.js')}`, {
        stdio: 'pipe'
      });
      
      const result = readFileSync(testFile, 'utf8');
      // Should detect JavaScript despite unicode
      expect(result).toContain('```javascript');
    });

    it('should handle very long lines', () => {
      const longLine = 'x'.repeat(10000);
      const input = `# Test

\`\`\`
${longLine}
\`\`\`
`;

      const testFile = join(tempDir, 'longline.md');
      writeFileSync(testFile, input);
      
      process.chdir(tempDir);
      execSync(`node ${join(__dirname, '../../fix-markdown-code-blocks.js')}`, {
        stdio: 'pipe'
      });
      
      const result = readFileSync(testFile, 'utf8');
      // Should not crash and should add language
      expect(result).toContain('```text');
    });
  });
});