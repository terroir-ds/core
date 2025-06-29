# Documentation Standards

## Overview

Keep documentation close to code, comprehensive, and up-to-date. This standard applies to the Terroir Core monorepo structure with packages organized under `/packages/*`.

## Monorepo Documentation Structure

### Package Organization

```markdown
terroir-core/
├── docs/                      # Global project documentation
│   ├── getting-started/      # Setup and installation guides
│   ├── guides/               # Development guides
│   ├── foundations/          # Core concepts (color, typography, etc.)
│   └── resources/            # Standards and references
├── packages/
│   ├── core/                 # Core utilities package
│   │   ├── README.md         # Package overview
│   │   └── src/
│   │       └── utils/*/README.md  # Module-specific docs
│   ├── docs-site/            # Documentation website
│   │   └── README.md         # Site setup guide
│   └── react/                # React components (future)
│       └── README.md         # Component library docs
```

### Import Path Documentation

Always document both npm package imports and path aliases:

```typescript
// NPM package import (for external consumers)
import { logger } from '@terroir/core/utils/logger';

// Path alias import (for internal development)
import { logger } from '@utils/logger';
```

## Documentation Structure

### Keep Docs Close to Code

```markdown
packages/core/src/utils/logger/
├── index.ts                  # Implementation
├── __tests__/                # Co-located tests
│   ├── logger.test.ts       # Unit tests
│   ├── logger.integration.test.ts
│   └── logger.edge-cases.test.ts
├── __mocks__/               # Mock implementations
│   └── logger.mock.ts
└── README.md                # Module documentation
```

### Documentation Hierarchy

1. **Inline Comments** - For complex logic
2. **JSDoc** - For public APIs (see [JSDoc Standards](./jsdoc-standards.md))
3. **README.md** - Module overview in each directory
4. **Package docs** - Package-level documentation in `/packages/*/README.md`
5. **Global docs** - Project-wide guides in `/docs/`

## JSDoc Standards

See [JSDoc Standards](./jsdoc-standards.md) for comprehensive documentation guidelines.

### Quick Reference

```typescript
/**
 * Validates an email address format per RFC 5321
 *
 * @category Utils
 * @param email - The email address to validate
 * @returns True if valid, false otherwise
 * @throws {ValidationError} If email is null or undefined
 *
 * @example
 * ```typescript
 * if (isValidEmail('user@example.com')) {
 *   // Process valid email
 * }
 * ```
 *
 * @since 1.0.0
 */
export function isValidEmail(email: string): boolean {
  if (!email) {
    throw new ValidationError('Email is required');
  }
  return EMAIL_REGEX.test(email);
}
```

### Don't Document the Obvious

```yaml
// ❌ DON'T over-document
/**
 * Gets the user ID
 * @returns The user ID
 */
getUserId(): string {
  return this.userId;
}

// ✅ DO document non-obvious behavior
/**
 * Gets the user ID, generating one if not yet assigned.
 * Generated IDs use the format: `user_${timestamp}_${random}`
 */
getUserId(): string {
  if (!this.userId) {
    this.userId = generateUserId();
  }
  return this.userId;
}
```

## README Files

### Module README Template

```bash
# Module Name

Brief description of what this module does.

## Features

- Feature 1
- Feature 2

## Installation

\```typescript
import { feature } from '@terroir/core/utils/module';
// or with path aliases
import { feature } from '@utils/module';
\```

## Quick Start

\```typescript
// Example usage
const result = feature(options);
\```

## API Reference

See [API Documentation](./docs/api.md) for detailed reference.

## Examples

See [examples](./examples/) for more use cases.
```

## Detailed Documentation

### Package-Level Documentation

Each package should have:

1. **Package README.md** - Overview, installation, basic usage
2. **Module READMEs** - In each major module directory
3. **API Documentation** - Generated from JSDoc/TypeDoc
4. **Migration Guides** - For breaking changes

Example package structure:

```markdown
packages/core/
├── README.md                 # Package overview
├── CHANGELOG.md             # Version history
├── src/
│   ├── utils/
│   │   ├── README.md        # Utils overview
│   │   ├── logger/
│   │   │   └── README.md    # Logger module docs
│   │   └── errors/
│   │       ├── README.md    # Error handling guide
│   │       └── docs/        # Detailed error docs
│   └── colors/
│       └── README.md        # Color system docs
```

### When to Create docs/ Subdirectory

Create detailed guides when:

- Complex setup required
- Multiple use cases
- Architecture decisions
- Integration guides
- API references exceed README scope

### Documentation Files

```markdown
docs/
├── getting-started.md    # Quick start guide
├── api/                  # API reference
│   ├── classes.md
│   └── functions.md
├── examples/             # Code examples
├── architecture.md       # Design decisions
└── troubleshooting.md    # Common issues
```

## Code Examples

### Always Include Working Examples

```typescript
// ❌ DON'T show incomplete examples
// Configure the logger
logger.setLevel(level);

// ✅ DO show complete, runnable examples
import { logger } from '@terroir/core/utils/logger';
// or for internal code:
// import { logger } from '@utils/logger';

// Set log level for development
logger.level = 'debug';

// Log with context
logger.info({ userId: '123' }, 'User action performed');
```

### Test Your Examples

- Examples should be executable
- Include necessary imports
- Show expected output

## Markdown Standards

### Use Consistent Formatting

```bash
# Main Title

## Section Title

### Subsection

**Bold** for emphasis
`code` for inline code
[links](url) with descriptive text

\```typescript
// Code blocks with language
\```
```

### Include Table of Contents

For long documents:

```bash
## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
```

## Cross-Package Documentation

### Linking Between Packages

Use relative paths for cross-package links:

```bash
<!-- From packages/core/README.md -->

See the [documentation site](../docs-site/README.md) for interactive examples.

<!-- From global docs -->

See [@terroir/core](../packages/core/README.md) for utility functions.
```

### Shared Documentation

Place shared concepts in `/docs/`:

- Architecture decisions
- Design principles
- Development standards
- API patterns

## Keeping Docs Updated

### Update Docs With Code

When changing code:

1. Update inline comments
2. Update JSDoc annotations
3. Update module README if API changes
4. Update package README if exports change
5. Update global docs if patterns change
6. Test all code examples
7. Run `pnpm lint:md` to check formatting

### Documentation Review

- Include docs in PR reviews
- Test code examples
- Check for broken links
- Verify accuracy

## Best Practices

1. **Write for Your Audience**
   - Assume TypeScript knowledge
   - Don't assume domain knowledge

2. **Show, Don't Just Tell**
   - Include examples
   - Demonstrate edge cases

3. **Be Concise**
   - Get to the point
   - Use bullet points

4. **Stay Current**
   - Update with breaking changes
   - Remove deprecated content

5. **Cross-Reference**
   - Link to related docs
   - Reference source code

## TypeScript Path Aliases

Document available path aliases for internal development:

```typescript
// Available aliases (defined in tsconfig.json)
import { logger } from '@utils/logger'; // -> packages/core/src/utils/*
import { colors } from '@colors/generator'; // -> packages/core/src/colors/*
import { env } from '@config/env'; // -> packages/core/src/config/*
import { BaseError } from '@terroir/core'; // -> packages/core/src/index.ts
```

### When to Use Each Import Style

1. **In Package Source Code**: Use path aliases (`@utils/*`)
2. **In Documentation Examples**: Show both styles
3. **In External Projects**: Use package imports (`@terroir/core`)

## Tools

- **TypeDoc** - Generate API docs from TypeScript
- **Markdownlint** - Ensure consistent markdown
- **Link Checker** - Verify links work
- **pnpm workspace** - Manage monorepo dependencies
