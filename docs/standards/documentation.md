# Documentation Standards

## Overview

Keep documentation close to code, comprehensive, and up-to-date.

## Documentation Structure

### Keep Docs Close to Code

````text
lib/utils/
├── logger.ts                 # Implementation
├── __tests__/
│   └── logger.test.ts       # Tests
├── docs/
│   └── logging.md           # Detailed guide
└── README.md                # Overview
```text
### Documentation Hierarchy

1. **Inline Comments** - For complex logic
2. **JSDoc** - For public APIs
3. **README.md** - Module overview
4. **docs/** - Detailed guides

## JSDoc Standards

### Document All Public APIs

```typescript
/**
 * Validates an email address format
 *
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
 */
export function isValidEmail(email: string): boolean {
  if (!email) {
    throw new ValidationError('Email is required');
  }
  return EMAIL_REGEX.test(email);
}
```text
### Don't Document the Obvious

```typescript
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
```text
## README Files

### Module README Template

```markdown
# Module Name

Brief description of what this module does.

## Features

- Feature 1
- Feature 2

## Installation

\```typescript
import { feature } from '@terroir/core/lib/module';
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
```text
## Detailed Documentation

### When to Create docs/ Subdirectory

Create detailed guides when:
- Complex setup required
- Multiple use cases
- Architecture decisions
- Integration guides

### Documentation Files

```text
docs/
├── getting-started.md    # Quick start guide
├── api/                  # API reference
│   ├── classes.md
│   └── functions.md
├── examples/             # Code examples
├── architecture.md       # Design decisions
└── troubleshooting.md    # Common issues
```text
## Code Examples

### Always Include Working Examples

```typescript
// ❌ DON'T show incomplete examples
// Configure the logger
logger.setLevel(level);

// ✅ DO show complete, runnable examples
import { logger } from '@utils/logger';

// Set log level for development
logger.level = 'debug';

// Log with context
logger.info({ userId: '123' }, 'User action performed');
```text
### Test Your Examples

- Examples should be executable
- Include necessary imports
- Show expected output

## Markdown Standards

### Use Consistent Formatting

```markdown
# Main Title

## Section Title

### Subsection

**Bold** for emphasis
`code` for inline code
[links](url) with descriptive text

\```typescript
// Code blocks with language
\```
```text
### Include Table of Contents

For long documents:

```markdown
## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
````

## Keeping Docs Updated

### Update Docs With Code

When changing code:

1. Update inline comments
2. Update JSDoc
3. Update README if needed
4. Update detailed guides
5. Update examples

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

## Tools

- **TypeDoc** - Generate API docs from TypeScript
- **Markdownlint** - Ensure consistent markdown
- **Link Checker** - Verify links work
