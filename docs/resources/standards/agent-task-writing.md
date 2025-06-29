# Agent Task Writing Standards

## Purpose

Optimize task specifications for AI agents with limited context windows while maintaining clarity and completeness.

## Core Principles

### 1. Progressive Disclosure

```markdown
# Task: Component Architecture ← One line summary

## Quick Start (20 lines max)

Essential info only

<details>
<summary>Full Specifications</summary>
Detailed requirements here
</details>
```

### 2. Front-Load Critical Information

```bash
# BAD: Burying the lead
After considering various options and researching...
we need to implement a Button component.

# GOOD: Lead with action

IMPLEMENT: Button component with variants
PATH: packages/react/src/components/Button/
TEST: pnpm test:watch button
```

### 3. Use Structured Formats

#### Task Template

```bash
# Task: [One Line Summary]

**Agent**: [0-3]
**Sprint**: [1-N]
**Effort**: [N hours]
**Dependencies**: [None | Task-ID]

## Success Criteria (Checklist)
- [ ] Specific, measurable outcome
- [ ] Test coverage > 95%
- [ ] Types exported
- [ ] Docs updated

## Quick Implementation
```

# Copy-paste commands

mkdir -p [path]
pnpm test:watch [module]

```bash
## Examples
```

// Minimal working example
export function example(): string {
  return "pattern to follow";
}

```text
```

### 4. Token-Optimized Formatting

#### Use Tables for Dense Info

```text
| Input | Output | Note |
|-------|--------|------|
| "hello-world" | "helloWorld" | kebab→camel |
| "HelloWorld" | "helloWorld" | pascal→camel |
```

#### Use Code Blocks for Examples

Instead of prose descriptions, show code:

```typescript
// Instead of: "The function should accept a string and return..."
type StringTransform = (input: string) => string;
```

### 5. Context-Aware Sections

#### Always Include

1. **Task** (1 line)
2. **Location** (exact path)
3. **Test Command** (copy-paste ready)
4. **Success Criteria** (checklist)

#### Include When Relevant

- Dependencies (only if blocked)
- Examples (only if complex)
- Background (only if critical)

### 6. Avoid Context Bloat

#### ❌ Don't Include

- Project history
- Alternative approaches considered
- Philosophical discussions
- Redundant explanations

#### ✅ Do Include

- Exact file paths
- Specific commands
- Clear success metrics
- Minimal examples

## Task Size Guidelines

### Optimal Task Sizes

- **Atomic**: 1-2 hour tasks when possible
- **Grouped**: 4-6 hours for related items
- **Maximum**: 8 hours (1 day) chunks

### Task Breakdown Example

```bash
# BAD: Implement string utilities (20 hours)

# GOOD: Break into atomic tasks
- Task 1: Case converters (camel, kebab, pascal) - 4h
- Task 2: Text formatters (truncate, wrap, pad) - 4h
- Task 3: Template functions (interpolate) - 3h
```

## AI-Specific Optimizations

### 1. Include Type Signatures

```typescript
// Always show expected types
export function camelCase(input: string): string;
export function truncate(text: string, length: number): string;
```

### 2. Provide Test Patterns

```text
// Show test structure
describe('camelCase', () => {
  it.each([
    ['hello-world', 'helloWorld'],
    ['hello_world', 'helloWorld'],
  ])('converts %s to %s', (input, expected) => {
    expect(camelCase(input)).toBe(expected);
  });
});
```

### 3. Reference Existing Patterns

```bash
## Pattern
Follow existing utils structure:
- See: `packages/core/src/utils/guards/` for examples
- Export from: `packages/core/src/utils/index.ts`
```

## Metadata for Agents

### Task Metadata Block

```markdown
---
agent: 1
sprint: 1
effort_hours: 4
dependencies: []
skills: [typescript, testing, strings]
context_tokens: 500  # Estimated
---
```

## Quick Reference Card

### Task Writing Checklist

- [ ] One line summary
- [ ] Exact file paths
- [ ] Copy-paste commands
- [ ] Success checklist
- [ ] Type signatures
- [ ] Test examples
- [ ] Under 100 lines
- [ ] No philosophy
- [ ] No history
- [ ] Progressive disclosure

## Examples

### Good Task Example

```bash
# Task: Implement truncate utility

**Location**: `packages/core/src/utils/strings/truncate.ts`
**Test**: `pnpm test:watch strings/truncate`

## Implementation
```

export function truncate(text: string, maxLength: number): string {
  // "hello world" → "hello..."
}

```bash
## Success
- [ ] Handles unicode correctly
- [ ] Configurable ellipsis
- [ ] 100% test coverage
```

### Bad Task Example

```bash
# String Utilities Enhancement

After our last meeting, we discussed the need for better string
manipulation utilities. Considering our users' needs and looking
at other popular libraries like lodash and ramda, we've decided
to implement our own string utilities. This will give us more
control over the implementation and allow us to optimize for our
specific use cases...

[200 more lines of context]
```

```

## Summary

Write tasks like you're paying per token:

1. **Front-load** critical info
2. **Show** don't tell (use code)
3. **Structure** over prose
4. **Examples** over explanations
5. **Checklists** over paragraphs

This approach ensures agents can understand and execute tasks using minimal context.
