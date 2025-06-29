# AI Documentation Standards

## Overview

This document defines standards for creating and maintaining AI-focused documentation alongside human documentation in the Terroir Core project. All agents and developers should follow these guidelines when documenting code, features, and systems.

## Documentation Types

### 1. Co-located AI Documentation (`.ai.md` suffix)

**When to use**: Package-level, module-level, or component-level documentation that provides AI-optimized context for specific code.

**Location**: Same directory as the human documentation, with `.ai.md` suffix.

**Examples**:

- `packages/core/README.ai.md` - AI-optimized package overview
- `packages/react/components/Button/Button.ai.md` - Component context for AI

**Structure**:

```markdown
# Component/Package Name

**Purpose**: One-line description for AI context
**Dependencies**: List of key dependencies
**Patterns**: Key patterns used in this code

## Quick Reference

| Task | Function/Method | Example |
|------|----------------|---------|
| ... | ... | ... |

## Key Concepts

Brief explanations of domain-specific concepts

## Common Tasks

Task-oriented examples with code snippets

## AI Metadata

```yaml
stability: stable|beta|experimental
token_cost: estimated_tokens
last_updated: YYYY-MM-DD
```text
```text
### 2. Project-level AI Documentation (`/docs/ai/`)

**When to use**: Cross-cutting concerns, architectural decisions, AI-specific guides that apply project-wide.

**Location**: `/docs/ai/` directory

**Structure**:
```text
docs/
└── ai/
    ├── architecture.md      # System design for AI context
    ├── contributing.md      # AI contribution guidelines
    ├── patterns.md         # Common patterns across the codebase
    └── domain-concepts.md  # Domain-specific terminology
```typescript
### 3. AI Configuration Files (Root level)

**Files**:
- `CLAUDE.md` - Claude-specific project instructions
- `.cursorrules` - Cursor AI configuration (if needed)
- `llms.txt` - Standard AI documentation index (auto-generated)

## Content Guidelines

### For `.ai.md` Files

1. **Focus on "How to use" over "How it works"**
   - Provide task-oriented examples
   - Include common use cases
   - Show integration patterns

2. **Structured Data**
   - Use tables for quick reference
   - Include TypeScript type definitions
   - Provide import examples

3. **Conciseness**
   - Target 200-500 tokens for component docs
   - Target 500-1500 tokens for package docs
   - Use collapsible sections for detailed content

4. **Metadata**
   - Always include AI metadata section
   - Track token costs for optimization
   - Note stability level

### Token Optimization Strategies

1. **Progressive Disclosure**
   ```markdown
   ## Quick Start (50 tokens)
   Essential imports and basic usage
   
   <details>
   <summary>Advanced Usage (200 tokens)</summary>
   Complex patterns and edge cases
   </details>
   ```

2. **Cross-References Instead of Duplication**

   ```markdown
   For error handling patterns, see [Error Handling Architecture](/docs/ai/architecture#error-handling)
   ```

3. **Code Snippets with Context**

   ```typescript
   // ✅ Good: Shows context and usage
   import { validateEmail } from '@terroir/core';
   const result = validateEmail(userInput);
   if (!result.valid) handleError(result.error);
   
   // ❌ Bad: Just the function signature
   function validateEmail(email: string): ValidationResult
   ```

### Context Building Strategies

1. **Hierarchical Documentation**
   - Package level: Overview and common patterns
   - Module level: Specific functionality
   - Component level: Implementation details

2. **Semantic Linking**

   ```markdown
   **Related Concepts**: [Color System](../color-system.ai.md), [Theme Tokens](../themes.ai.md)
   **Depends On**: [@terroir/tokens](../../tokens/README.ai.md)
   **Used By**: [Button Component](../components/Button.ai.md)
   ```

3. **Domain Vocabulary**
   Define terms once in `/docs/ai/domain-concepts.md`:

   ```markdown
   ## Glossary
   - **Tonal Palette**: 13-step gradation from light to dark
   - **Token**: Named design decision (color, spacing, etc.)
   ```

### AI-Specific Formatting

1. **Structured Headers for Easy Parsing**

   ```markdown
   ## MODULE: Color Generation
   ## FUNCTION: generateColorSystem
   ## PATTERN: Material Design 3
   ```

2. **Task Mapping Tables**

   ```markdown
   | User Intent | Function | Import Path | Example |
   |-------------|----------|-------------|---------|
   | "validate user input" | `validateEmail` | `@terroir/core` | `validateEmail(input)` |
   ```

3. **Decision Trees**

   ```markdown
   ## When to Use This Component
   - Need a clickable action? → Button
   - Need to show/hide content? → Accordion
   - Need navigation? → Link
   ```

### For `/docs/ai/` Files

1. **Architecture Documentation**
   - High-level system design
   - Key architectural decisions
   - Integration points

2. **Pattern Documentation**
   - Cross-cutting patterns
   - Best practices
   - Anti-patterns to avoid

3. **Domain Documentation**
   - Business logic explanations
   - Domain-specific terminology
   - Conceptual models

## When to Create AI Documentation

### Create `.ai.md` files when

- Publishing a new package
- Creating complex components
- Implementing domain-specific logic
- Building reusable utilities

### Create `/docs/ai/` files when

- Defining architectural patterns
- Documenting cross-package concepts
- Explaining domain models
- Creating AI-specific guides

## Documentation During Development

### Phase 5: Documentation Requirements

When completing a feature (Phase 5 of development), ensure:

1. **Human Documentation**
   - JSDoc comments for all public APIs
   - README.md updates for new features
   - Storybook stories for components
   - Architecture Decision Records (ADRs) if needed

2. **AI Documentation**
   - Create/update `.ai.md` for modified packages
   - Update `/docs/ai/` for architectural changes
   - Ensure examples are task-focused
   - Verify metadata is current

## Publishing and Distribution

### llms.txt Generation

The `docs-site` package automatically generates `llms.txt` from:

- All `.ai.md` files
- Selected `/docs/ai/` content
- Package metadata

Format:

```markdown
# Terroir Core Design System
> Open-source design system with Material Color Utilities

## Packages
- [@terroir/core](/packages/core): Core utilities and types
- [@terroir/react](/packages/react): React component library

## Guides
- [Architecture](/docs/ai/architecture): System design
- [Patterns](/docs/ai/patterns): Common patterns
```bash
### Documentation Build Process

1. **Local Development**
   ```bash
   pnpm docs:dev    # Includes AI docs
   pnpm docs:build  # Generates llms.txt
   ```

2. **CI/CD Integration**
   - AI docs validated on PR
   - llms.txt generated on build
   - Published to `/llms.txt` route

## Examples

### Good `.ai.md` Example

```markdown
# @terroir/core

**Purpose**: Core utilities for type safety, error handling, and logging
**Dependencies**: pino (logging only)
**Patterns**: Functional, tree-shakeable, TypeScript-first

## Quick Reference

| Task | Import | Example |
|------|--------|---------|
| Validate string | `isString` | `if (isString(val)) { }` |
| Handle errors | `ValidationError` | `throw new ValidationError("Invalid", context)` |
| Log structured | `logger` | `logger.info({ userId }, "Action")` |

## Common Tasks

### Input Validation
```typescript
import { assertDefined, isString, ValidationError } from '@terroir/core';

function processUser(data: unknown) {
  assertDefined(data, 'User data required');
  if (!isString(data.email)) {
    throw new ValidationError('Invalid email', { field: 'email' });
  }
}
```text
## AI Metadata
```yaml
stability: stable
token_cost: 400
last_updated: 2025-06-29
```text
```text
### Good `/docs/ai/` Example

```markdown
# Error Handling Architecture

## Overview

Terroir Core uses typed errors with structured context for better debugging and AI understanding.

## Error Hierarchy

```text
BaseError
├── ValidationError    # Input validation failures
├── NetworkError      # API/network failures
├── ConfigError       # Configuration issues
└── InternalError     # System errors
```text
## Patterns

### Creating Errors
Always include context:
```typescript
throw new ValidationError('Invalid email', {
  field: 'email',
  value: input,
  expected: 'email format'
});
```text
### Handling Errors
Use type guards:
```typescript
try {
  await operation();
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation
  } else if (isRetryableError(error)) {
    // Retry logic
  }
}
```text
```text
## Migration Guide

For existing documentation:

1. Identify AI-relevant content in existing docs
2. Extract to `.ai.md` files with task focus
3. Create `/docs/ai/` content for patterns
4. Add metadata sections
5. Update build configuration

## Validation

AI documentation must:
- Pass markdown linting
- Include required metadata
- Follow naming conventions
- Build without errors

## Best Practices from Research

### 1. **Memory-Efficient Documentation**

Based on emerging patterns from tools like RepoAgent and ai-context:

- Use markdown as the universal format
- Implement incremental documentation updates
- Cache frequently accessed documentation
- Generate context on-demand rather than maintaining everything

### 2. **Multi-Agent Compatibility**

Support multiple AI assistants by:
- Using standard markdown format
- Avoiding tool-specific syntax
- Providing tool-agnostic examples
- Including metadata for different AI systems

### 3. **Documentation Freshness**

Keep AI docs current:
- Include `last_updated` in metadata
- Use git hooks for auto-updates
- Flag stale documentation
- Link to source code with line numbers

### 4. **Context Window Management**

For limited context windows:
- Create summary files for large modules
- Use progressive detail levels
- Implement smart chunking strategies
- Provide "context packages" for specific tasks

Example context package:
```markdown
## Context Package: Add Authentication

### Required Context
- [Auth Module](../auth/README.ai.md) - 300 tokens
- [User Model](../models/user.ai.md) - 200 tokens
- [Security Patterns](../../ai/patterns.md#security) - 150 tokens
Total: ~650 tokens
```

## Documentation Testing

### Automated Validation

1. **Token Count Validation**

   ```bash
   pnpm test:ai-docs
   # Validates token counts stay within limits
   # Checks metadata completeness
   # Verifies cross-references
   ```

2. **AI Readability Testing**
   - Test with multiple AI models
   - Validate task completion rates
   - Measure context efficiency

3. **Freshness Checks**
   - Compare with source code changes
   - Flag outdated examples
   - Verify import paths

## Related Standards

- [Documentation Standards](./documentation.md) - General documentation guidelines
- [Testing Standards](./testing.md) - Test documentation requirements
- [Code Quality Standards](./code-quality.md) - Code documentation requirements
- [Import Conventions](./import-conventions.md) - Path alias usage
