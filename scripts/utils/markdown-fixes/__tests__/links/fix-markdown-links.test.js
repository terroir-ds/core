import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Import the functions we want to test
import { headingToFragment, fixLinkFragments } from '@scripts/utils/markdown-fixes/fix-markdown-links.js';

describe('fix-markdown-links', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'markdown-links-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('headingToFragment', () => {
    it('should convert simple headings to fragments', () => {
      expect(headingToFragment('Simple Heading')).toBe('simple-heading');
      expect(headingToFragment('Another Test')).toBe('another-test');
    });

    it('should handle special characters', () => {
      expect(headingToFragment('Test: With Colon')).toBe('test-with-colon');
      expect(headingToFragment('Test (with parentheses)')).toBe('test-with-parentheses');
      expect(headingToFragment('Test & Ampersand')).toBe('test-ampersand');
      expect(headingToFragment('Test @ Symbol')).toBe('test-symbol');
    });

    it('should handle multiple spaces', () => {
      expect(headingToFragment('Test   Multiple   Spaces')).toBe('test-multiple-spaces');
      expect(headingToFragment('  Leading Spaces')).toBe('leading-spaces');
      expect(headingToFragment('Trailing Spaces  ')).toBe('trailing-spaces');
    });

    it('should handle numbers', () => {
      expect(headingToFragment('Test 123')).toBe('test-123');
      expect(headingToFragment('1. First Item')).toBe('1-first-item');
    });

    it('should handle edge cases', () => {
      expect(headingToFragment('')).toBe('');
      expect(headingToFragment('---')).toBe('');
      expect(headingToFragment('!!!')).toBe('');
    });

    it('should handle unicode characters', () => {
      expect(headingToFragment('Test émoji 🚀')).toBe('test-moji');
      expect(headingToFragment('Café Test')).toBe('caf-test');
    });

    it('should trim hyphens', () => {
      expect(headingToFragment('-Leading Hyphen')).toBe('leading-hyphen');
      expect(headingToFragment('Trailing Hyphen-')).toBe('trailing-hyphen');
      expect(headingToFragment('--Multiple--Hyphens--')).toBe('multiple--hyphens');
    });
  });

  describe('fixLinkFragments', () => {
    it('should fix simple broken links', () => {
      const input = `
# Test Document

## First Section

See [First Section](#first-section-wrong)

## Second Section

Link to [Second Section](#second)
`;

      const expected = `
# Test Document

## First Section

See [First Section](#first-section)

## Second Section

Link to [Second Section](#second-section)
`;

      const testFile = join(tempDir, 'simple.md');
      writeFileSync(testFile, input);
      
      const fixedCount = fixLinkFragments(testFile);
      expect(fixedCount).toBe(2);
      
      const result = readFileSync(testFile, 'utf8');
      expect(result).toBe(expected);
    });

    it('should preserve correct links', () => {
      const input = `
# Test

## Correct Section

Link to [Correct Section](#correct-section) should not change.
`;

      const testFile = join(tempDir, 'correct.md');
      writeFileSync(testFile, input);
      
      const fixedCount = fixLinkFragments(testFile);
      expect(fixedCount).toBe(0);
      
      const result = readFileSync(testFile, 'utf8');
      expect(result).toBe(input);
    });

    it('should handle links with different text', () => {
      const input = `
# Document

## API Reference

See the [API Reference](#api) for more info.
Also check [reference section](#reference-section).

## Reference Section

Details here.
`;

      const expected = `
# Document

## API Reference

See the [API Reference](#api-reference) for more info.
Also check [reference section](#reference-section).

## Reference Section

Details here.
`;

      const testFile = join(tempDir, 'different-text.md');
      writeFileSync(testFile, input);
      
      const fixedCount = fixLinkFragments(testFile);
      expect(fixedCount).toBe(1);
      
      const result = readFileSync(testFile, 'utf8');
      expect(result).toBe(expected);
    });

    it('should handle special characters in headings', () => {
      const input = `
# Guide

## Test: With Colon

Link to [Test: With Colon](#test-colon)

## API & Documentation

See [API & Documentation](#api-docs)
`;

      const expected = `
# Guide

## Test: With Colon

Link to [Test: With Colon](#test-with-colon)

## API & Documentation

See [API & Documentation](#api-documentation)
`;

      const testFile = join(tempDir, 'special-chars.md');
      writeFileSync(testFile, input);
      
      const fixedCount = fixLinkFragments(testFile);
      expect(fixedCount).toBe(2);
      
      const result = readFileSync(testFile, 'utf8');
      expect(result).toBe(expected);
    });

    it('should handle nested headings', () => {
      const input = `
# Main

## Section A

### Subsection A1

Link to [Subsection A1](#subsection-a)

#### Deep Section

Link to [Deep Section](#deep)
`;

      const expected = `
# Main

## Section A

### Subsection A1

Link to [Subsection A1](#subsection-a1)

#### Deep Section

Link to [Deep Section](#deep-section)
`;

      const testFile = join(tempDir, 'nested.md');
      writeFileSync(testFile, input);
      
      const fixedCount = fixLinkFragments(testFile);
      expect(fixedCount).toBe(2);
      
      const result = readFileSync(testFile, 'utf8');
      expect(result).toBe(expected);
    });

    it('should warn about truly broken links', () => {
      const input = `
# Document

## Available Section

Link to [Non-existent Section](#completely-broken)
`;

      const testFile = join(tempDir, 'broken.md');
      writeFileSync(testFile, input);
      
      // Capture console output
      const warnings = [];
      // eslint-disable-next-line no-console
      const originalWarn = console.warn;
      // eslint-disable-next-line no-console
      console.warn = (msg) => warnings.push(msg);
      
      const fixedCount = fixLinkFragments(testFile);
      expect(fixedCount).toBe(0);
      
      // eslint-disable-next-line no-console
      console.warn = originalWarn;
      
      expect(warnings.length).toBe(1);
      expect(warnings[0]).toContain('No matching heading found');
      expect(warnings[0]).toContain('#completely-broken');
    });

    it('should handle multiple links to same heading', () => {
      const input = `
# Doc

## Target Section

Link 1: [Target Section](#target)
Link 2: [See Target](#target)
Link 3: [Target](#target-section)
`;

      const expected = `
# Doc

## Target Section

Link 1: [Target Section](#target-section)
Link 2: [See Target](#target)
Link 3: [Target](#target-section)
`;

      const testFile = join(tempDir, 'multiple.md');
      writeFileSync(testFile, input);
      
      const fixedCount = fixLinkFragments(testFile);
      expect(fixedCount).toBe(1);
      
      const result = readFileSync(testFile, 'utf8');
      expect(result).toBe(expected);
    });

    it('should handle empty link text', () => {
      const input = `
# Doc

## Section Name

Link: [](#section)
`;

      // Current implementation doesn't fix empty link text
      const expected = input;

      const testFile = join(tempDir, 'empty-text.md');
      writeFileSync(testFile, input);
      
      const fixedCount = fixLinkFragments(testFile);
      expect(fixedCount).toBe(0);
      
      const result = readFileSync(testFile, 'utf8');
      expect(result).toBe(expected);
    });

    it('should handle duplicate headings', () => {
      const input = `
# Document

## Installation

First installation section.

## Installation

Second installation section (duplicate).

Link to [Installation](#installation)
`;

      // Should link to first occurrence
      const testFile = join(tempDir, 'duplicates.md');
      writeFileSync(testFile, input);
      
      const fixedCount = fixLinkFragments(testFile);
      expect(fixedCount).toBe(0); // Already correct
      
      const result = readFileSync(testFile, 'utf8');
      expect(result).toBe(input);
    });

    it('should handle inline code in headings', () => {
      const input = `
# API

## The \`processData()\` Function

Link to [The processData() Function](#processdata)
`;

      const expected = `
# API

## The \`processData()\` Function

Link to [The processData() Function](#the-processdata-function)
`;

      const testFile = join(tempDir, 'inline-code.md');
      writeFileSync(testFile, input);
      
      const fixedCount = fixLinkFragments(testFile);
      expect(fixedCount).toBe(1);
      
      const result = readFileSync(testFile, 'utf8');
      expect(result).toBe(expected);
    });

    it('should handle external links', () => {
      const input = `
# Doc

## Section

External: [Link](https://example.com#fragment)
Should not change.
`;

      const testFile = join(tempDir, 'external.md');
      writeFileSync(testFile, input);
      
      const fixedCount = fixLinkFragments(testFile);
      expect(fixedCount).toBe(0);
      
      const result = readFileSync(testFile, 'utf8');
      expect(result).toBe(input);
    });

    it('should handle case-insensitive matching', () => {
      const input = `
# Document

## API Reference

Link: [API reference](#API-REFERENCE)
`;

      const expected = `
# Document

## API Reference

Link: [API reference](#api-reference)
`;

      const testFile = join(tempDir, 'case.md');
      writeFileSync(testFile, input);
      
      const fixedCount = fixLinkFragments(testFile);
      expect(fixedCount).toBe(1);
      
      const result = readFileSync(testFile, 'utf8');
      expect(result).toBe(expected);
    });

    it('should handle adjacent links', () => {
      const input = `
# Doc

## First
## Second

Links: [First](#f) [Second](#s)
`;

      const expected = `
# Doc

## First
## Second

Links: [First](#first) [Second](#second)
`;

      const testFile = join(tempDir, 'adjacent.md');
      writeFileSync(testFile, input);
      
      const fixedCount = fixLinkFragments(testFile);
      expect(fixedCount).toBe(2);
      
      const result = readFileSync(testFile, 'utf8');
      expect(result).toBe(expected);
    });
  });

  describe('edge cases', () => {
    it('should handle empty files', () => {
      const testFile = join(tempDir, 'empty.md');
      writeFileSync(testFile, '');
      
      const fixedCount = fixLinkFragments(testFile);
      expect(fixedCount).toBe(0);
    });

    it('should handle files with no headings', () => {
      const input = 'Just text with a [broken link](#nowhere).';
      const testFile = join(tempDir, 'no-headings.md');
      writeFileSync(testFile, input);
      
      const fixedCount = fixLinkFragments(testFile);
      expect(fixedCount).toBe(0);
      
      const result = readFileSync(testFile, 'utf8');
      expect(result).toBe(input);
    });

    it('should handle files with no links', () => {
      const input = `
# Heading 1
## Heading 2
Just text, no links.
`;
      const testFile = join(tempDir, 'no-links.md');
      writeFileSync(testFile, input);
      
      const fixedCount = fixLinkFragments(testFile);
      expect(fixedCount).toBe(0);
      
      const result = readFileSync(testFile, 'utf8');
      expect(result).toBe(input);
    });

    it('should handle malformed links', () => {
      const input = `
# Test

## Section

Malformed: [Text](#incomplete
Not a link: [Text] (#fragment)
Also not: [Text](# fragment)
`;

      const testFile = join(tempDir, 'malformed.md');
      writeFileSync(testFile, input);
      
      const fixedCount = fixLinkFragments(testFile);
      expect(fixedCount).toBe(0);
      
      const result = readFileSync(testFile, 'utf8');
      expect(result).toBe(input);
    });
  });
});