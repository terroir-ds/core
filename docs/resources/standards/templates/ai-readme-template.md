# AI-First Module Documentation Template

## Overview

This template shows how to write module documentation optimized for AI agents using npm packages.

---

# @terroir/[package-name]

**Install**: `pnpm add @terroir/[package-name]`
**Import**: `import { feature } from '@terroir/[package-name]';`

## 🎯 Common Tasks

| I need to... | Use this | Example |
|--------------|----------|---------|
| Convert kebab to camel | `camelCase()` | `camelCase("hello-world") // "helloWorld"` |
| Shorten long text | `truncate()` | `truncate("long text", 8) // "long..."` |
| Format as currency | `formatCurrency()` | `formatCurrency(42.5) // "$42.50"` |

## 🚀 Quick Start

```typescript
// Most common usage pattern
import { camelCase, truncate } from '@terroir/core/utils';

const formatted = camelCase("my-component-name");
const preview = truncate(longDescription, 100);
```

## 📦 All Exports

<details>
<summary>String utilities (click to expand)</summary>

| Function | Type | Description |
|----------|------|-------------|
| `camelCase` | `(str: string) => string` | Convert to camelCase |
| `kebabCase` | `(str: string) => string` | Convert to kebab-case |
| `truncate` | `(str: string, max: number) => string` | Truncate with ellipsis |

</details>

<details>
<summary>CSS utilities (click to expand)</summary>

| Function | Type | Description |
|----------|------|-------------|
| `cssVar` | `(name: string) => string` | Create CSS variable |
| `spacing` | `(n: number) => string` | Get spacing value |

</details>

## ⚡ Performance Notes

- All functions are tree-shakeable
- Zero runtime dependencies
- Average function size: <1KB

## 🔧 Common Patterns

### Pattern 1: Transform and validate

```typescript
const slug = pipe(
  kebabCase,
  truncate(50),
  validateSlug
)(userInput);
```

### Pattern 2: Batch processing

```typescript
const formatted = items.map(item => ({
  ...item,
  label: truncate(camelCase(item.name), 30)
}));
```

## ❌ Common Mistakes

```typescript
// ❌ Wrong - importing entire package
import * as utils from '@terroir/core/utils';

// ✅ Right - import only what you need
import { camelCase } from '@terroir/core/utils';
```

## 🤝 Works Well With

- `@terroir/core/guards` - For validation
- `@terroir/react` - For component props
- `@terroir/tokens` - For design tokens

---

## 📊 Metadata for AI

```yaml
token_cost: 850  # Approximate tokens for full doc
quick_ref_tokens: 200  # Just the common tasks table
update_frequency: monthly
stability: stable
```
