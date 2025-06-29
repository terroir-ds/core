# String Handling Standards

## Overview

This document establishes standards for consistent string manipulation across the Terroir Core Design System. With the introduction of comprehensive string utilities, all string operations should use these utilities rather than manual manipulation.

**Created**: 2025-06-29  
**Last Updated**: 2025-06-29  
**Based on**: Phase 3 String Utilities Implementation

## Core Principles

1. **Use utilities over manual manipulation** - Utilities handle edge cases
2. **Consider Unicode** - Proper handling of international characters
3. **Performance matters** - Use optimized utilities in hot paths
4. **Consistency** - Same operation should use same utility everywhere

## Standards

### String Truncation

**Standard**: Always use `truncate()` for string truncation

**Old Pattern**:

````typescript
// ❌ Manual truncation
const preview = text.substring(0, 100) + '...';
const title = text.length > 50 ? text.substring(0, 50) + '...' : text;
const excerpt = text.slice(0, 200) + (text.length > 200 ? '...' : '');
```text
**New Pattern**:
```typescript
// ✅ Use truncate utility
import { truncate } from '@utils/string';

const preview = truncate(text, 100);
const title = truncate(text, 50);
const excerpt = truncate(text, 200, { ellipsis: '...' });
```yaml
**Where to Apply**:
- UI text that might overflow
- Preview text in cards/lists
- Meta descriptions
- Log messages
- API response strings

**Enforcement**: ESLint rule pending

### Case Conversion

**Standard**: Use case conversion utilities for all case transformations

**Old Pattern**:
```typescript
// ❌ Manual case conversion
const camel = str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const kebab = str.replace(/([A-Z])/g, '-$1').toLowerCase();
const pascal = str.charAt(0).toUpperCase() + str.slice(1);
```text
**New Pattern**:
```typescript
// ✅ Use case utilities
import { camelCase, kebabCase, pascalCase } from '@utils/string';

const camel = camelCase(str);
const kebab = kebabCase(str);
const pascal = pascalCase(str);
```typescript
**Where to Apply**:
- CSS class name generation
- API property transformation
- File naming
- Component naming
- Variable naming from user input

### URL-Safe Strings

**Standard**: Use `slugify()` for all URL-safe string generation

**Old Pattern**:
```typescript
// ❌ Manual slugification
const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');
```text
**New Pattern**:
```typescript
// ✅ Use slugify utility
import { slugify } from '@utils/string';

const slug = slugify(title);
const filename = slugify(name, { separator: '_' });
```yaml
**Where to Apply**:
- URL generation
- File naming
- ID generation from text
- SEO-friendly paths
- Cache keys from text

### String Formatting

**Standard**: Use formatting utilities for consistent output

**Old Pattern**:
```typescript
// ❌ Manual formatting
const size = bytes < 1024 ? bytes + ' B' :
            bytes < 1048576 ? (bytes / 1024).toFixed(1) + ' KB' :
            (bytes / 1048576).toFixed(1) + ' MB';

const time = ms < 1000 ? ms + 'ms' :
            ms < 60000 ? (ms / 1000).toFixed(1) + 's' :
            (ms / 60000).toFixed(1) + 'm';
```text
**New Pattern**:
```typescript
// ✅ Use formatting utilities
import { formatBytes, formatDuration } from '@utils/string';

const size = formatBytes(bytes);
const time = formatDuration(ms);
```text
**Where to Apply**:
- File size display
- Download sizes
- Duration display
- Performance metrics
- Upload progress

## Migration Guide

### Finding Violations

```bash
# Find manual truncation patterns
rg "\.substring\(0,.*\)\s*\+" --type ts
rg "\.slice\(0,.*\)\s*\+" --type ts
rg "length\s*>\s*\d+\s*\?" --type ts

# Find manual case conversion
rg "replace\(.*[A-Z].*toLowerCase" --type ts
rg "charAt\(0\)\.toUpperCase" --type ts

# Find manual slugification
rg "toLowerCase\(\).*replace.*[^a-z0-9]" --type ts

# Find manual byte formatting
rg "bytes.*1024|KB|MB|GB" --type ts
```text
### Migration Script

```typescript
// scripts/migrate-string-utils.ts
import { glob } from 'glob';
import { readFile, writeFile } from 'fs/promises';

async function migrateStringUtils() {
  const files = await glob('**/*.{ts,tsx}', {
    ignore: ['node_modules/**', 'dist/**']
  });

  for (const file of files) {
    let content = await readFile(file, 'utf-8');
    let modified = false;

    // Detect and replace patterns
    // ... migration logic

    if (modified) {
      await writeFile(file, content);
      console.log(`Updated: ${file}`);
    }
  }
}
```text
## Enforcement

### ESLint Rules (To Be Added)

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.property.name="substring"]',
        message: 'Use truncate() from @utils/string instead of substring()'
      },
      {
        selector: 'MemberExpression[property.name="toLowerCase"][parent.callee.property.name="replace"]',
        message: 'Use case conversion utilities from @utils/string'
      }
    ]
  }
};
```bash
### Pre-commit Hook

The `pnpm fix` command will eventually auto-fix some of these patterns.

## Performance Considerations

### Hot Path Optimizations

The string utilities are optimized for performance:
- Cached regex patterns
- Minimal object allocation
- Efficient algorithms

Use them confidently in hot paths.

### Bundle Size

All string utilities are tree-shakeable. Import only what you need:

```typescript
// ✅ Good - only imports needed functions
import { truncate, slugify } from '@utils/string';

// ❌ Bad - imports entire module
import * as stringUtils from '@utils/string';
```text
## Testing Standards

When using string utilities in tests:

```typescript
describe('ProductCard', () => {
  it('truncates long product names', () => {
    const longName = 'Very Long Product Name That Exceeds Display Limit';
    const { getByText } = render(<ProductCard name={longName} />);

    // Test expects the truncated output
    expect(getByText(truncate(longName, 30))).toBeInTheDocument();
  });
});
````

## Future Enhancements

As we add more string utilities, this document will be updated with:

- Template string utilities
- Internationalization helpers
- Advanced formatting options
- Performance benchmarks

---

**Remember**: Consistency is key. When in doubt, check if a string utility exists before implementing manually.
