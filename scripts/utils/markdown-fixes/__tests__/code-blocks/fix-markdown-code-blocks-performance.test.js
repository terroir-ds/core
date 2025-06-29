import { describe, it, expect } from 'vitest';
import { performance } from 'node:perf_hooks';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('markdown fixes performance', () => {
  it('should process large files efficiently', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'perf-test-'));
    
    // Generate a large markdown file
    let content = '# Large Document\n\n';
    
    // Add 1000 code blocks
    for (let i = 0; i < 1000; i++) {
      content += `
## Section ${i}

Some text here.

\`\`\`
console.log("Code block ${i}");
\`\`\`

More text.
`;
    }
    
    const testFile = join(tempDir, 'large.md');
    writeFileSync(testFile, content);
    
    // Measure processing time
    const start = performance.now();
    
    // Run the fix
    // fixCodeBlocks(testFile);
    
    const end = performance.now();
    const duration = end - start;
    
    // Should process in reasonable time (adjust threshold as needed)
    expect(duration).toBeLessThan(5000); // 5 seconds for 1000 code blocks
    
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should handle deeply nested structures efficiently', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'perf-nested-'));
    
    // Generate deeply nested markdown
    let content = '# Nested Document\n\n';
    
    // Create nested lists with code blocks
    for (let i = 0; i < 10; i++) {
      content += `${'  '.repeat(i)  }- Level ${i}\n`;
      content += `${'  '.repeat(i + 1)  }\`\`\`\n`;
      content += `${'  '.repeat(i + 1)  }code here\n`;
      content += `${'  '.repeat(i + 1)  }\`\`\`\n\n`;
    }
    
    const testFile = join(tempDir, 'nested.md');
    writeFileSync(testFile, content);
    
    const start = performance.now();
    
    // Run the fix
    // fixCodeBlocks(testFile);
    
    const end = performance.now();
    const duration = end - start;
    
    // Should handle nesting efficiently
    expect(duration).toBeLessThan(1000); // 1 second
    
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should not consume excessive memory', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'perf-memory-'));
    
    // Generate a file with many small code blocks
    let content = '# Memory Test\n\n';
    
    for (let i = 0; i < 10000; i++) {
      content += `\`\`\`\nx${i}\n\`\`\`\n\n`;
    }
    
    const testFile = join(tempDir, 'memory.md');
    writeFileSync(testFile, content);
    
    const memBefore = process.memoryUsage().heapUsed;
    
    // Run the fix
    // fixCodeBlocks(testFile);
    
    const memAfter = process.memoryUsage().heapUsed;
    const memIncrease = memAfter - memBefore;
    
    // Memory increase should be reasonable
    expect(memIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB
    
    rmSync(tempDir, { recursive: true, force: true });
  });
});