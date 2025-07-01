# Standards Index

## Available Standards

| Standard | Purpose | Domain |
|----------|---------|---------|
| [@standard:jsdoc-pattern-tags] | Mark pattern/standard usage in code with JSDoc tags | Documentation, Automation |
| [@standard:index-file-convention] | Use index.md/index.ai.md as directory entry points | Documentation, Organization |

## Standard Categories

### Documentation Standards
- jsdoc-pattern-tags - Automated reference tracking via JSDoc
- index-file-convention - Directory entry point naming

### Code Quality Standards
*(Standards to be migrated from /docs/resources/standards/)*

### Testing Standards
*(Standards to be migrated from /docs/resources/standards/)*

### Security Standards
*(Standards to be migrated from /docs/resources/standards/)*

## Usage

Reference standards in code using JSDoc tags:
```typescript
/**
 * @implements-standard jsdoc-pattern-tags
 */
```

Or in documentation:
```markdown
Follow [@standard:jsdoc-pattern-tags] for marking pattern usage.
```

## Migration Plan

The following standards from `/docs/resources/standards/` will be migrated to AI-first format:
- error-handling.md → error-handling.ai.md
- logging.md → structured-logging.ai.md
- testing.md → testing-practices.ai.md
- And more...

## Contributing

When adding new standards:
1. Create `standard-name.ai.md` with implementation details
2. Create `standard-name.ref.md` for tracking usage
3. Update this index
4. Score initial implementations

---
*Note: This is the beginning of AI-first standards. More standards will be migrated and added.*