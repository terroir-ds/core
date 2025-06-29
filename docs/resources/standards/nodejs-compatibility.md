# Node.js Compatibility Standards

## Overview

Ensure broad Node.js compatibility while leveraging modern features responsibly.

## Version Support

- **Development**: Node.js 22 (latest features, best DX)
- **CI/CD**: Test against Node.js 18, 20, and 22
- **Minimum**: Node.js 18+ (current LTS)

## Compatibility Guidelines

### 1. Check Dependencies

Before adding any dependency:

```bash
# Check engines field
npm view [package-name] engines

# Verify in package.json
"engines": {
  "node": ">=18.0.0"
}
```

### 2. Avoid Node.js 20+ Exclusive Features

| Feature | Alternative |
|---------|-------------|
| `fs.cp()` | Use `fs-extra` or manual copying |
| Stable test runner | Use Vitest or Jest |
| Permission model APIs | Use traditional approaches |
| `--env-file` flag | Use dotenv |

### 3. Safe Node.js 18+ Features

These can be used freely:

- ✅ `Error.cause` property
- ✅ Native `fetch` and `AbortController`
- ✅ `fs.promises` API
- ✅ `structuredClone()`
- ✅ ES modules and CommonJS interop
- ✅ `AggregateError` for multiple errors
- ✅ `AbortSignal.timeout()`
- ✅ `Blob` and `File` APIs
- ✅ Web Streams API

### 4. Testing Compatibility

```bash
# Test locally with different versions
nvm use 18 && pnpm test
nvm use 20 && pnpm test
nvm use 22 && pnpm test

# Or use CI matrix
```

### 5. Handling Polyfills

If polyfills are needed:

1. **Prefer alternatives** - Find Node 18 compatible approach
2. **Build-time only** - Add to build process, not runtime
3. **Document clearly** - Note in package README
4. **Test thoroughly** - Verify on all Node versions

## Feature Detection

```text
// Check for feature availability
if (typeof structuredClone === 'function') {
  return structuredClone(obj);
} else {
  return JSON.parse(JSON.stringify(obj)); // fallback
}
```

## CI Configuration

```bash
# .github/workflows/test.yml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]
```

## Common Compatibility Issues

### 1. Module Resolution

```bash
{
  "type": "module",  // Be explicit
  "exports": {
    ".": {
      "import": "./lib/index.js",
      "require": "./lib/index.cjs"
    }
  }
}
```

### 2. Global APIs

Some globals added in newer versions:

- `crypto` global (Node 19+)
- `navigator` global (Node 21+)

Always import explicitly:

```typescript
import { webcrypto } from 'node:crypto';
```

### 3. TypeScript Configuration

```yaml
{
  "compilerOptions": {
    "lib": ["ES2022"],  // Node 18 supports ES2022
    "target": "ES2022",
    "module": "NodeNext"
  }
}
```

## Best Practices

1. **Test on oldest supported version first**
2. **Use feature detection over version detection**
3. **Document minimum requirements clearly**
4. **Keep CI matrix up to date**
5. **Review breaking changes in Node.js releases**
