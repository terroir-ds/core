import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('markdown-fixes integration', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'markdown-integration-'));
  });

  afterEach(() => {
    // Reset working directory before cleanup to avoid ENOENT errors
    process.chdir(__dirname);
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('orchestrator integration', () => {
    it('should run all fixes in correct order', () => {
      // Create a markdown file with multiple issues
      const input = `
# Test Document

## Code Block Issues

### Missing Language
\`\`\`
pnpm install
\`\`\`bash

### Blank Lines Issue
\`\`\`javascript

const x = 42;

\`\`\`
## Next Section

### Consecutive Blocks
\`\`\`bash
echo "first"
\`\`\`
\`\`\`javascript
console.log("second");
\`\`\`

### Link Issue
See [broken link](#non-existent-section)
`;

      const expected = `
# Test Document

## Code Block Issues

### Missing Language

\`\`\`bash
pnpm install
\`\`\`

### Blank Lines Issue

\`\`\`javascript
const x = 42;
\`\`\`

## Next Section

### Consecutive Blocks

\`\`\`bash
echo "first"
\`\`\`

\`\`\`javascript
console.log("second");
\`\`\`

### Link Issue
See [broken link](#non-existent-section)
`;

      const testFile = join(tempDir, 'integration.md');
      writeFileSync(testFile, input);

      // Run the orchestrator
      process.chdir(tempDir);
      execSync(`node ${join(__dirname, '../../index.js')}`, {
        stdio: 'pipe'
      });

      const result = readFileSync(testFile, 'utf8');
      expect(result).toBe(expected);
    });
  });

  describe('real-world examples', () => {
    it('should handle complex nested structures', () => {
      const input = `
# API Documentation

## Installation

Install using your favorite package manager:

### NPM
\`\`\`
npm install @terroir/core
\`\`\`

### PNPM
\`\`\`
pnpm add @terroir/core
\`\`\`

## Usage

Here's how to use the library:

1. Import the functions:
   \`\`\`
   import { validate } from '@terroir/core';
   \`\`\`

2. Use in your code:
   \`\`\`
   const result = validate(input);
   if (!result.valid) {
     console.error(result.error);
   }
   \`\`\`

## Advanced Examples

### Nested Code Blocks

Sometimes you need to show markdown in markdown:

\`\`\`\`
# Example
\`\`\`javascript
console.log("nested");
\`\`\`
\`\`\`\`

### Configuration

\`\`\`
{
  "name": "@terroir/core",
  "version": "1.0.0"
}
\`\`\`
Done!
`;

      const testFile = join(tempDir, 'realworld.md');
      writeFileSync(testFile, input);

      // Run fixes
      process.chdir(tempDir);
      execSync(`node ${join(__dirname, '../../fix-markdown-code-blocks.js')}`, {
        stdio: 'pipe'
      });

      const result = readFileSync(testFile, 'utf8');
      
      // Check that all code blocks have languages
      expect(result).toMatch(/```bash\s*\n\s*npm install/);
      expect(result).toMatch(/```bash\s*\n\s*pnpm add/);
      expect(result).toMatch(/```typescript\s*\n\s*import/);
      expect(result).toMatch(/```javascript\s*\n\s*const result/);
      expect(result).toMatch(/```json\s*\n\s*{/);
      
      // Check blank lines
      expect(result).toMatch(/```\n\nDone!/);
    });
  });
});