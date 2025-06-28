# Package.json Exports Field Specification

## Overview

This specification defines how to properly configure the `exports` field in package.json files for the Terroir Core Design System packages. This ensures proper module resolution in Node.js 12.7+ and modern bundlers while maintaining backward compatibility.

## Goals

1. **Modern Module Resolution**: Support ESM and CJS properly
2. **Tree Shaking**: Enable optimal bundle sizes
3. **TypeScript Support**: Proper type resolution
4. **Backward Compatibility**: Work with older tools
5. **Conditional Exports**: Environment-specific builds

## Package Structure

### Expected File Layout
```
packages/core/
├── package.json
├── dist/
│   ├── index.js          # CJS main entry
│   ├── index.mjs         # ESM main entry
│   ├── index.d.ts        # TypeScript definitions
│   ├── utils/
│   │   ├── index.js      # CJS utils entry
│   │   ├── index.mjs     # ESM utils entry
│   │   └── index.d.ts    # Utils types
│   └── [other-modules]/
├── src/                  # Source files
└── README.md
```

## Exports Configuration

### Complete Example
```json
{
  "name": "@terroir/core",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "default": "./dist/index.mjs"
    },
    "./utils": {
      "types": "./dist/utils/index.d.ts",
      "import": "./dist/utils/index.mjs",
      "require": "./dist/utils/index.js",
      "default": "./dist/utils/index.mjs"
    },
    "./utils/*": {
      "types": "./dist/utils/*/index.d.ts",
      "import": "./dist/utils/*/index.mjs",
      "require": "./dist/utils/*/index.js",
      "default": "./dist/utils/*/index.mjs"
    },
    "./colors": {
      "types": "./dist/colors/index.d.ts",
      "import": "./dist/colors/index.mjs",
      "require": "./dist/colors/index.js",
      "default": "./dist/colors/index.mjs"
    },
    "./package.json": "./package.json"
  },
  "sideEffects": false,
  "files": [
    "dist",
    "README.md",
    "CHANGELOG.md"
  ]
}
```

## Export Patterns

### 1. Main Entry Point
```json
{
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.mjs",
    "require": "./dist/index.js",
    "default": "./dist/index.mjs"
  }
}
```

**Usage**:
```typescript
// ESM
import { something } from '@terroir/core';

// CJS
const { something } = require('@terroir/core');
```

### 2. Subpath Exports
```json
{
  "./utils": {
    "types": "./dist/utils/index.d.ts",
    "import": "./dist/utils/index.mjs",
    "require": "./dist/utils/index.js",
    "default": "./dist/utils/index.mjs"
  }
}
```

**Usage**:
```typescript
// Direct subpath import
import { debounce } from '@terroir/core/utils';
```

### 3. Wildcard Exports
```json
{
  "./utils/*": {
    "types": "./dist/utils/*/index.d.ts",
    "import": "./dist/utils/*/index.mjs",
    "require": "./dist/utils/*/index.js",
    "default": "./dist/utils/*/index.mjs"
  }
}
```

**Usage**:
```typescript
// Deep import
import { withTimeout } from '@terroir/core/utils/async';
```

### 4. Conditional Exports
```json
{
  ".": {
    "types": "./dist/index.d.ts",
    "node": {
      "import": "./dist/index.node.mjs",
      "require": "./dist/index.node.js"
    },
    "browser": {
      "import": "./dist/index.browser.mjs",
      "require": "./dist/index.browser.js"
    },
    "default": "./dist/index.mjs"
  }
}
```

### 5. Development vs Production
```json
{
  ".": {
    "types": "./dist/index.d.ts",
    "development": {
      "import": "./dist/index.dev.mjs",
      "require": "./dist/index.dev.js"
    },
    "production": {
      "import": "./dist/index.prod.mjs",
      "require": "./dist/index.prod.js"
    },
    "default": "./dist/index.mjs"
  }
}
```

## TypeScript Configuration

### Package tsconfig.json
```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "declarationDir": "./dist",
    "rootDir": "./src",
    "outDir": "./dist"
  }
}
```

### Consumer tsconfig.json
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "resolvePackageJsonExports": true,
    "resolvePackageJsonImports": true
  }
}
```

## Build Configuration

### Rollup Example
```javascript
export default [
  // ESM build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.mjs',
      format: 'es',
      sourcemap: true
    },
    external: [/* dependencies */],
    plugins: [/* plugins */]
  },
  // CJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    external: [/* dependencies */],
    plugins: [/* plugins */]
  }
];
```

## Migration Strategy

### Phase 1: Add Exports Field
```json
{
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  }
}
```

### Phase 2: Add Subpaths
```json
{
  "exports": {
    ".": "...",
    "./utils": "./dist/utils/index.js",
    "./colors": "./dist/colors/index.js"
  }
}
```

### Phase 3: Full Configuration
Complete exports with all conditions and wildcards.

## Common Patterns

### 1. Prevent Internal Access
```json
{
  "exports": {
    ".": "./dist/index.js",
    "./utils": "./dist/utils/index.js",
    "./internal/*": null
  }
}
```

### 2. CSS/Asset Exports
```json
{
  "exports": {
    "./styles": "./dist/styles.css",
    "./styles/*": "./dist/styles/*.css"
  }
}
```

### 3. Dual Package Hazard Prevention
```json
{
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  }
}
```

## Validation

### Testing Exports
```bash
# Test Node.js resolution
node -e "require('@terroir/core')"
node -e "import('@terroir/core')"

# Test subpath
node -e "require('@terroir/core/utils')"
node -e "import('@terroir/core/utils')"
```

### Automated Validation
```javascript
// scripts/validate-exports.js
import { readPackageJson } from './utils';

function validateExports(pkg) {
  const errors = [];
  
  // Check main exports
  if (!pkg.exports['.']) {
    errors.push('Missing main export');
  }
  
  // Check types first
  for (const [key, value] of Object.entries(pkg.exports)) {
    if (typeof value === 'object' && !value.types) {
      errors.push(`Missing types for ${key}`);
    }
  }
  
  return errors;
}
```

## Best Practices

### 1. Order Matters
Always put conditions in this order:
1. `types` - TypeScript needs this first
2. `import` - ESM format
3. `require` - CommonJS format
4. `default` - Fallback

### 2. Be Explicit
Don't rely on automatic resolution:
```json
// ❌ Bad
"./utils": "./dist/utils"

// ✅ Good
"./utils": {
  "types": "./dist/utils/index.d.ts",
  "import": "./dist/utils/index.mjs",
  "require": "./dist/utils/index.js"
}
```

### 3. Prevent Breaking Changes
```json
{
  "exports": {
    ".": "...",
    "./utils": "...",
    // Maintain compatibility
    "./lib/utils": "./dist/utils/index.js",
    "./dist/utils": "./dist/utils/index.js"
  }
}
```

## Troubleshooting

### Common Issues

1. **"Cannot find module"**
   - Check if path exists in exports
   - Verify file actually exists
   - Check Node.js version (12.7+)

2. **TypeScript can't find types**
   - Ensure `types` condition is first
   - Check `moduleResolution` in tsconfig

3. **Dual package hazard**
   - Use wrapper modules
   - Ensure singleton patterns

### Debug Commands
```bash
# Check what Node.js resolves
node --input-type=module -e "import.meta.resolve('@terroir/core')"

# Check package exports
npm view @terroir/core exports
```

## Implementation Checklist

- [ ] Update build process to generate ESM and CJS
- [ ] Add exports field to package.json
- [ ] Include types condition for all exports
- [ ] Test with Node.js 18, 20, and 22
- [ ] Verify TypeScript resolution
- [ ] Test with major bundlers (webpack, vite, rollup)
- [ ] Update documentation
- [ ] Add migration guide for consumers
- [ ] Set up automated validation
- [ ] Monitor for issues after release

## References

- [Node.js Package Exports](https://nodejs.org/api/packages.html#exports)
- [TypeScript 4.7 Exports](https://www.typescriptlang.org/docs/handbook/modules/reference.html#packagejson-exports)
- [Dual Package Hazard](https://nodejs.org/api/packages.html#dual-package-hazard)