# Pattern: Progressive Disclosure

## Quick Context

- **Problem**: AI context windows fill up with unnecessary documentation
- **Solution**: Load information only when needed
- **Benefit**: 50-70% context savings

## Implementation

### In Documentation

```markdown
For error handling, see [@standard:error-handling]
<!-- Don't inline the entire standard -->
```

### In Task Files

```markdown
**Current Phase**: Phase 3 - Make it Safe
**Phase Guide**: /ai/methods/multi-pass-development/phase-3-make-safe.md
<!-- Agent loads only Phase 3 guide -->
```

### In Code

```typescript
/**
 * @see {@link TruncateOptions} for options
 * @standard safe-string-truncation
 */
// Don't duplicate documentation
```

## Anti-Pattern

```markdown
<!-- BAD: Loading everything upfront -->
1. Read all method documentation
2. Read all patterns
3. Read all standards
4. Start work
```

## Best Practice

```markdown
<!-- GOOD: Load as needed -->
1. Read task file
2. Load current phase guide only
3. Load specific patterns when implementing
4. Reference standards when relevant
```

## Enforcement

- Keep task files under 200 lines
- Use references instead of inline docs
- Load rate: <20% context for documentation
