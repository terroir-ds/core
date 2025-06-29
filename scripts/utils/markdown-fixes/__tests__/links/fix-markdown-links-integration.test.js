import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('fix-markdown-links integration', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'links-integration-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('real-world scenarios', () => {
    it('should fix documentation with table of contents', () => {
      const input = `
# API Documentation

## Table of Contents

- [Introduction](#intro)
- [Getting Started](#getting-started)
- [API Reference](#api-ref)
- [Examples](#examples)
- [Contributing](#contrib)

## Introduction

Welcome to the API documentation.

## Getting Started

Installation instructions here.

## API Reference

### Functions

#### processData()

Processes the input data.

#### validateInput()

Validates the input.

## Examples

### Basic Example

\`\`\`javascript
// code here
\`\`\`

### Advanced Example

\`\`\`javascript
// more code
\`\`\`

## Contributing

See [Getting Started](#getting-started) for setup instructions.
`;

      const expected = `
# API Documentation

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Contributing](#contributing)

## Introduction

Welcome to the API documentation.

## Getting Started

Installation instructions here.

## API Reference

### Functions

#### processData()

Processes the input data.

#### validateInput()

Validates the input.

## Examples

### Basic Example

\`\`\`javascript
// code here
\`\`\`

### Advanced Example

\`\`\`javascript
// more code
\`\`\`

## Contributing

See [Getting Started](#getting-started) for setup instructions.
`;

      const testFile = join(tempDir, 'docs.md');
      writeFileSync(testFile, input);

      // Run the fixer
      execSync(`node ${join(__dirname, '../../fix-markdown-links.js')} ${testFile}`, {
        stdio: 'pipe'
      });

      const result = readFileSync(testFile, 'utf8');
      expect(result).toBe(expected);
    });

    it('should handle cross-references in technical docs', () => {
      const input = `
# Technical Guide

## Overview

This guide covers [Installation](#install), [Configuration](#config), and [usage](#usage).

## Installation

See the [Configuration](#config) section after installing.

## Configuration

Refer back to [Installation](#install) if needed.

## Usage

Make sure you've completed [Installation](#install) and [Configuration](#config).

## Troubleshooting

### Common Issues

If you have problems with [Installation](#install), check the logs.

### Configuration Errors

See [Configuration](#config) for correct settings.
`;

      const expected = `
# Technical Guide

## Overview

This guide covers [Installation](#installation), [Configuration](#configuration), and [usage](#usage).

## Installation

See the [Configuration](#configuration) section after installing.

## Configuration

Refer back to [Installation](#installation) if needed.

## Usage

Make sure you've completed [Installation](#installation) and [Configuration](#configuration).

## Troubleshooting

### Common Issues

If you have problems with [Installation](#installation), check the logs.

### Configuration Errors

See [Configuration](#configuration) for correct settings.
`;

      const testFile = join(tempDir, 'technical.md');
      writeFileSync(testFile, input);

      execSync(`node ${join(__dirname, '../../fix-markdown-links.js')} ${testFile}`, {
        stdio: 'pipe'
      });

      const result = readFileSync(testFile, 'utf8');
      expect(result).toBe(expected);
    });

    it('should handle mixed valid and invalid links', () => {
      const input = `
# Mixed Document

## Valid Section

- [Valid Section](#valid-section) - already correct
- [Invalid Link](#invalid) - needs fixing
- [Another Valid](#valid-section) - already correct
- [Broken Reference](#broken-ref) - needs fixing

## Another Section

Links:
- [Valid Section](#valid-section) ✓
- [Another Section](#another) ✗
- [External](https://example.com#fragment) ✓
`;

      const testFile = join(tempDir, 'mixed.md');
      writeFileSync(testFile, input);

      // Capture output
      const output = execSync(`node ${join(__dirname, '../../fix-markdown-links.js')} ${testFile}`, {
        encoding: 'utf8'
      });

      const result = readFileSync(testFile, 'utf8');
      
      // Check that valid links stayed the same
      expect(result).toContain('[Valid Section](#valid-section)');
      expect(result).toContain('[Another Valid](#valid-section)');
      expect(result).toContain('[External](https://example.com#fragment)');
      
      // Check that invalid links were fixed
      expect(result).toContain('[Another Section](#another-section)');
      
      // Check output message
      expect(output).toContain('Fixed');
      expect(output).toContain('link fragments');
    });
  });

  describe('command line usage', () => {
    it('should process multiple files', () => {
      const file1Content = `
# File 1
## Section
[Section](#sec)
`;
      const file2Content = `
# File 2
## Another
[Another](#ano)
`;

      const file1 = join(tempDir, 'file1.md');
      const file2 = join(tempDir, 'file2.md');
      
      writeFileSync(file1, file1Content);
      writeFileSync(file2, file2Content);

      // Run on multiple files
      execSync(`node ${join(__dirname, '../../fix-markdown-links.js')} ${file1} ${file2}`, {
        stdio: 'pipe'
      });

      const result1 = readFileSync(file1, 'utf8');
      const result2 = readFileSync(file2, 'utf8');

      expect(result1).toContain('[Section](#section)');
      expect(result2).toContain('[Another](#another)');
    });

    it('should handle non-existent files gracefully', () => {
      const nonExistent = join(tempDir, 'does-not-exist.md');
      
      let error;
      try {
        execSync(`node ${join(__dirname, '../../fix-markdown-links.js')} ${nonExistent}`, {
          stdio: 'pipe'
        });
      } catch (e) {
        error = e;
      }

      expect(error).toBeTruthy();
      expect(error.status).toBe(1);
    });
  });

  describe('performance with large files', () => {
    it('should handle files with many headings and links efficiently', () => {
      let content = '# Large Document\n\n';
      
      // Create 100 sections
      for (let i = 1; i <= 100; i++) {
        content += `## Section ${i}\n\n`;
        content += `Content for section ${i}.\n\n`;
      }
      
      // Add 100 links (some broken)
      content += '## Links Section\n\n';
      for (let i = 1; i <= 100; i++) {
        if (i % 2 === 0) {
          // Broken link
          content += `- [Section ${i}](#sec-${i})\n`;
        } else {
          // Correct link
          content += `- [Section ${i}](#section-${i})\n`;
        }
      }

      const testFile = join(tempDir, 'large.md');
      writeFileSync(testFile, content);

      const start = Date.now();
      execSync(`node ${join(__dirname, '../../fix-markdown-links.js')} ${testFile}`, {
        stdio: 'pipe'
      });
      const duration = Date.now() - start;

      // Should complete in reasonable time
      expect(duration).toBeLessThan(1000); // 1 second

      const result = readFileSync(testFile, 'utf8');
      
      // Check that broken links were fixed
      expect(result).toContain('[Section 2](#section-2)');
      expect(result).toContain('[Section 100](#section-100)');
    });
  });
});