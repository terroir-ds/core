# Test Environment Compatibility Standards

## Overview

This document establishes standards for writing tests that are compatible with modern test runners and worker environments, ensuring tests can run reliably in CI/CD pipelines and development environments.

## Core Principles

1. **Worker Thread Compatibility**: Tests must work in worker thread environments
2. **Process Independence**: Tests should not modify global process state
3. **Isolation**: Each test should be self-contained and not affect others
4. **Portability**: Tests should work across different operating systems

## Prohibited Patterns

### ❌ NEVER Use process.chdir()

```typescript
// ❌ WRONG - Not supported in worker threads
describe('file operations', () => {
  it('should process files in directory', () => {
    process.chdir('/some/directory');  // FAILS in workers
    // ... test logic
  });
});
```

**Why this fails:**
- Vitest runs tests in worker threads by default
- `process.chdir()` is not available in worker threads
- Causes immediate test failure with "not supported in workers"

### ❌ NEVER Modify Global Process State

```typescript
// ❌ WRONG - Affects other tests
beforeEach(() => {
  process.env.NODE_ENV = 'test';
  process.cwd = jest.fn().mockReturnValue('/fake/path');
});
```

### ❌ NEVER Rely on External Working Directory

```typescript
// ❌ WRONG - Brittle and environment-dependent
it('should read config file', () => {
  const config = readFileSync('./config.json');  // Depends on cwd
});
```

## Recommended Patterns

### ✅ Pass Paths as Parameters

```typescript
// ✅ CORRECT - Explicit path handling
function processMarkdownFiles(targetDirectory: string) {
  const files = readdirSync(targetDirectory);
  // ... process files
}

it('should process markdown files', () => {
  const tempDir = createTempDirectory();
  processMarkdownFiles(tempDir);  // Explicit directory
  cleanup(tempDir);
});
```

### ✅ Use Absolute Paths

```typescript
// ✅ CORRECT - Absolute paths are reliable
it('should process files', () => {
  const testDir = path.join(__dirname, 'fixtures');
  const result = processFiles(testDir);
  expect(result).toBeDefined();
});
```

### ✅ Create Temporary Directories

```typescript
// ✅ CORRECT - Isolated test environment
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('file processing', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should process files in isolated directory', () => {
    const testFile = join(tempDir, 'test.md');
    writeFileSync(testFile, 'content');
    
    const result = processFile(testFile);  // Pass explicit path
    expect(result).toBe('expected');
  });
});
```

### ✅ Mock External Commands with Explicit Paths

```typescript
// ✅ CORRECT - Test the function directly instead of via external process
it('should fix markdown code blocks', () => {
  const input = '```\ncode\n```';
  const expected = '```javascript\ncode\n```';
  
  const result = fixCodeBlocks(input);  // Direct function call
  expect(result).toBe(expected);
});
```

### ✅ Use execSync with Explicit Working Directory

```typescript
// ✅ CORRECT - Specify cwd in options instead of changing process
it('should run external command', () => {
  const tempDir = createTempDirectory();
  
  const result = execSync('node script.js', {
    cwd: tempDir,  // Explicit working directory
    encoding: 'utf8'
  });
  
  expect(result).toBeDefined();
});
```

## Migration Strategy

When converting existing tests that use `process.chdir()`:

1. **Identify the Intent**: What directory operation is needed?
2. **Extract Path Logic**: Make paths explicit parameters
3. **Update Function Signatures**: Add directory parameters where needed
4. **Use execSync Options**: Pass `cwd` option instead of changing process
5. **Test Isolation**: Ensure each test creates its own temporary space

### Example Migration

```typescript
// ❌ BEFORE - Uses process.chdir()
it('should run markdown fixes', () => {
  const tempDir = createTempDir();
  writeFileSync(join(tempDir, 'test.md'), input);
  
  process.chdir(tempDir);  // ❌ Not supported in workers
  execSync('node fix-script.js');
  
  const result = readFileSync(join(tempDir, 'test.md'));
  expect(result).toBe(expected);
});

// ✅ AFTER - Worker-compatible
it('should run markdown fixes', () => {
  const tempDir = createTempDir();
  const testFile = join(tempDir, 'test.md');
  writeFileSync(testFile, input);
  
  // Option 1: Direct function call (preferred)
  const result = fixMarkdownFile(testFile);
  expect(result).toBe(expected);
  
  // Option 2: External script with explicit cwd
  execSync('node fix-script.js', { 
    cwd: tempDir,  // ✅ Explicit working directory
    encoding: 'utf8' 
  });
  const result = readFileSync(testFile);
  expect(result).toBe(expected);
});
```

## Implementation Guidelines

### Function Design

When writing functions that operate on files:

```typescript
// ✅ GOOD - Explicit paths
function processMarkdownFiles(directory: string): void {
  const files = readdirSync(directory);
  files.forEach(file => {
    const fullPath = join(directory, file);
    processFile(fullPath);
  });
}

// ❌ BAD - Relies on current working directory
function processMarkdownFiles(): void {
  const files = readdirSync('.');  // Implicit current directory
  // ...
}
```

### Script Design

When writing CLI scripts:

```typescript
// ✅ GOOD - Accept directory as argument
#!/usr/bin/env node
import { argv } from 'process';

const targetDir = argv[2] || process.cwd();
processDirectory(targetDir);

// ❌ BAD - Always use current directory
#!/usr/bin/env node
processDirectory(process.cwd());
```

## Testing External Scripts

For scripts that must run as external processes:

```typescript
// ✅ CORRECT - Test both ways
describe('markdown fix script', () => {
  it('should fix code blocks (direct)', () => {
    // Test the core function directly
    const result = fixCodeBlocks(input);
    expect(result).toBe(expected);
  });

  it('should fix code blocks (CLI)', () => {
    // Test the CLI wrapper
    const tempDir = createTempDir();
    const scriptPath = path.join(__dirname, '../../fix-script.js');
    
    writeFileSync(join(tempDir, 'test.md'), input);
    
    execSync(`node ${scriptPath}`, {
      cwd: tempDir,  // Explicit working directory
      encoding: 'utf8'
    });
    
    const result = readFileSync(join(tempDir, 'test.md'));
    expect(result).toBe(expected);
  });
});
```

## Benefits

Following these standards provides:

1. **Worker Compatibility**: Tests run in modern test environments
2. **Reliability**: No race conditions from shared global state
3. **Isolation**: Tests don't interfere with each other
4. **Portability**: Works across different systems and CI environments
5. **Debugging**: Clearer failure modes and easier troubleshooting

## AI Agent Instructions

When writing or reviewing tests:

1. **Always check** for `process.chdir()` usage
2. **Flag any** global process state modifications
3. **Suggest** explicit path parameters instead
4. **Recommend** temporary directories for file operations
5. **Ensure** tests work in worker thread environments

## Enforcement

- ESLint rule to detect `process.chdir()` in test files
- Pre-commit hooks to catch violations
- CI checks for worker thread compatibility
- Code review checklist includes environment compatibility

## Quick Reference

| ❌ Don't | ✅ Do |
|---------|-------|
| `process.chdir(dir)` | `execSync(cmd, { cwd: dir })` |
| `fs.readFileSync('./file')` | `fs.readFileSync(path.join(dir, 'file'))` |
| Global process mutations | Isolated test environments |
| Implicit working directory | Explicit path parameters |
| Single test environment | Temporary directories per test |

---

**Remember**: The goal is tests that are reliable, isolated, and compatible with modern JavaScript runtime environments.