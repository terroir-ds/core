# Import Conventions

## Overview

Use path aliases for clean, maintainable imports throughout the codebase.

## Import Rules

### Always Use Path Aliases

````typescript
// ❌ DON'T use relative imports
import { logger } from '../../../lib/utils/logger';
import { generateColors } from './colors/generator';

// ✅ DO use path aliases
import { logger } from '@utils/logger';
import { generateColors } from '@colors/generator';
import { Button } from '@packages/react/src/Button';
```typescript
## Available Aliases

| Alias | Points To | Usage |
|-------|-----------|-------|
| `@terroir/core` | `lib/index.ts` | Main library entry |
| `@lib/*` | `lib/*` | Library modules |
| `@utils/*` | `lib/utils/*` | Utility modules |
| `@colors/*` | `lib/colors/*` | Color modules |
| `@scripts/*` | `scripts/*` | Build scripts |
| `@packages/*` | `packages/*` | Package sources |
| `@test/*` | `test/*` | Test utilities |

## Benefits

1. **Readability**: Clear where imports come from
2. **Refactoring**: Move files without updating imports
3. **Consistency**: Same import style everywhere
4. **Searchability**: Easy to find all usages

## Configuration

Path aliases are configured in:
- `tsconfig.json` - TypeScript resolution
- `vitest.config.ts` - Test resolution
- Package bundler configs

## Import Order

Organize imports in this order:

```typescript
// 1. Node built-ins
import { readFile } from 'node:fs/promises';

// 2. External packages
import { describe, it, expect } from 'vitest';
import React from 'react';

// 3. Internal packages (with aliases)
import { logger } from '@utils/logger';
import { Button } from '@packages/react';

// 4. Relative imports (if absolutely necessary)
import { helper } from './helper';
```text
## ESLint Enforcement

ESLint will warn about relative imports that could use aliases:

```json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": ["../*", "./*"]
    }]
  }
}
````
