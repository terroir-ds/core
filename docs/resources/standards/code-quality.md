# Code Quality Standards

## Overview

Maintain high code quality through automated tooling and consistent practices.

## Pre-Commit Standards

### Always Run Fixes Before Committing

````bash
# STANDARD: Run this before EVERY commit
pnpm fix
git diff    # Review automated changes
pnpm test   # Ensure tests still pass
```text
### Commit Even If Fixes Fail

```bash
# If fixes cause issues, you can still commit:
git commit --no-verify

# The goal is to catch low-hanging fruit, not block progress
```text
## Linting Standards

### TypeScript/JavaScript

```typescript
// ❌ DON'T ignore linting errors
// @ts-ignore
const foo = bar as any;

// ✅ DO fix the underlying issue
const foo = bar as SpecificType;
```text
### Import Organization

```typescript
// ❌ DON'T use relative imports
import { logger } from '../../../utils/logger';

// ✅ DO use path aliases
import { logger } from '@utils/logger';
```text
### Markdown

All markdown files should:
- Have language specifiers on code blocks
- Use consistent heading levels
- Include blank lines around lists
- Follow markdownlint rules

## Code Style

### Consistent Patterns

```typescript
// ❌ DON'T mix patterns
const processItem = (item) => {
  return transform(item)
}

function handleError(err: any) {
  console.log(err);
}

// ✅ DO use consistent patterns
export const processItem = (item: Item): ProcessedItem => {
  return transform(item);
};

export const handleError = (error: Error): void => {
  logger.error({ err: error }, 'Error occurred');
};
```text
### Type Safety

```typescript
// ❌ DON'T use 'any' or miss types
function process(data: any) {
  return data.map(item => item.value);
}

// ✅ DO use proper types
interface DataItem {
  value: string;
}

function process(data: DataItem[]): string[] {
  return data.map(item => item.value);
}
```bash
## Automated Tools

### What Gets Fixed Automatically

1. **ESLint** (`pnpm lint:ts:fix`)
   - Unused imports
   - Quote consistency
   - Semicolons
   - Object shorthand
   - Arrow functions
   - Template literals

2. **Markdownlint** (`pnpm lint:md:fix`)
   - Heading formatting
   - List formatting
   - Trailing spaces
   - Line breaks

3. **Prettier** (`pnpm lint:prettier:fix`)
   - JSON/YAML formatting
   - Consistent indentation
   - Quote styles

4. **Custom Fixers**
   - Code block language detection
   - Package.json field sorting

### Manual Review Required

Some issues require human judgment:
- Logic errors
- Type errors
- Unused variables (decide whether to remove or use)
- Complex refactoring
- Security issues

## Configuration Files

- **ESLint**: `eslint.config.js`
- **TypeScript**: `tsconfig.json`
- **Markdownlint**: `.markdownlint-cli2.jsonc`
- **Prettier**: `.prettierrc.json` (if exists)

## Best Practices

1. **Fix Early**: Run `pnpm fix` frequently during development
2. **Don't Fight Tools**: If a rule is problematic, discuss changing it
3. **Review Changes**: Always review what automated fixes changed
4. **Keep Tools Updated**: Newer versions have better fixes

## IDE Integration

### VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.fixAll.markdownlint": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint"
  },
  "[markdown]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
````

This provides real-time feedback and automatic fixing on save.
