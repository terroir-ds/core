# AI Agent Contributing Guide

## Overview

This guide helps AI agents effectively contribute to the Terroir Core design system. Follow these patterns for consistent, high-quality contributions.

## Quick Start Checklist

```bash
- [ ] Read CLAUDE.md for project context
- [ ] Check existing patterns in /docs/ai/patterns.md
- [ ] Review relevant .ai.md files for packages you'll modify
- [ ] Use TodoWrite to track your tasks
- [ ] Run `pnpm fix` before committing
```

## Common Agent Tasks

### 1. Adding New Components

```bash
# 1. Create component structure
mkdir -p packages/react/src/components/NewComponent
touch packages/react/src/components/NewComponent/{index.ts,NewComponent.tsx,NewComponent.test.tsx,NewComponent.stories.tsx}

# 2. Follow existing patterns
# Look at Button or Card components for reference

# 3. Create AI documentation
touch packages/react/src/components/NewComponent/NewComponent.ai.md
```

### 2. Updating Design Tokens

```bash
// 1. Modify token source
// tokens/base/color.json

// 2. Run token build
pnpm tokens:build

// 3. Verify contrast compliance
pnpm test:contrast

// 4. Update affected components
```

### 3. Implementing Utilities

```text
// 1. Add to appropriate module
// lib/utils/newUtility.ts

// 2. Export from index
// lib/utils/index.ts

// 3. Add tests
// lib/utils/__tests__/newUtility.test.ts

// 4. Document in .ai.md
// lib/utils/utilities.ai.md
```

## Code Generation Guidelines

### Import Statements

```bash
// ✅ Use path aliases
import { logger } from '@utils/logger';
import { ValidationError } from '@utils/errors';

// ❌ Avoid relative paths
import { logger } from '../../../utils/logger';
```

### Error Handling

```yaml
// ✅ Use typed errors with context
throw new ValidationError('Invalid color format', {
  value: input,
  expected: 'hex, rgb, or hsl',
  field: 'color'
});

// ❌ Never use generic errors
throw new Error('Invalid color');
```

### Logging

```text
// ✅ Use structured logger
logger.info({ component: 'Button', action: 'render' }, 'Rendering button');

// ❌ Never use console
console.log('Rendering button');
```

## Testing Requirements

### Test Co-location

```text
components/
└── Button/
    ├── Button.tsx
    └── __tests__/
        └── Button.test.tsx
```

### Test Coverage

- Unit tests for all utilities
- Component tests for all props
- Visual regression for components
- Accessibility tests for interactive elements

## Documentation Requirements

### During Development

1. **Update Human Docs**
   - JSDoc for public APIs
   - README.md for packages
   - Storybook for components

2. **Update AI Docs**
   - .ai.md for modified packages
   - /docs/ai/ for patterns
   - Metadata for token costs

### Documentation Template

```bash
# Component/Package Name

**Purpose**: One-line description
**Dependencies**: Key deps
**Patterns**: Design patterns used

## Quick Reference
| Task | Code | Example |
|------|------|---------|

## Common Tasks
### Task Name
```

// Example code

```bash
## AI Metadata
```

stability: stable
token_cost: 300
last_updated: 2025-06-29

```text
```

## Commit Guidelines

### Conventional Commits

```bash
# Format: type(scope): description

feat(tokens): add new color palette
fix(button): correct hover state
docs(ai): update patterns documentation
test(core): add validation tests
refactor(utils): simplify error handling
```

### Pre-commit Checklist

```bash
# 1. Run fixes
pnpm fix

# 2. Run tests
pnpm test

# 3. Build packages
pnpm build

# 4. Stage and commit
git add .
git commit -m "type(scope): description"
```

## Common Pitfalls

### ❌ Don't Do This

```text
// Creating files without need
// Using console.log
// Throwing generic errors
// Using relative imports
// Skipping tests
// Forgetting AI docs
```

### ✅ Do This Instead

```text
// Edit existing files when possible
// Use structured logger
// Use typed errors with context
// Use path aliases
// Write co-located tests
// Update .ai.md files
```

## Getting Help

### Project Understanding

- Architecture: `/docs/ai/architecture.md`
- Patterns: `/docs/ai/patterns.md`
- Domain concepts: `/docs/ai/domain-concepts.md`

### Standards

- AI docs: `/docs/resources/standards/ai-documentation.md`
- Testing: `/docs/resources/standards/testing.md`
- Code quality: `/docs/resources/standards/code-quality.md`

### Tools

- `pnpm fix` - Auto-fix code issues
- `pnpm test` - Run tests
- `pnpm build` - Build packages
- `pnpm docs:dev` - Preview documentation

## AI Metadata

```text
stability: stable
token_cost: 700
last_updated: 2025-06-29
```
