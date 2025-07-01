# Pattern Index

## Available Patterns

| Pattern | Purpose | When to Use |
|---------|---------|-------------|
| [@pattern:methodical-file-processing] | Process large sets of files systematically | Batch operations, migrations, refactoring |
| [@pattern:progressive-disclosure] | Minimize AI context usage | Documentation loading, task management |
| [@pattern:safe-migration-strategy] | Perform irreversible changes safely | File moves, structural changes, schema updates |
| [@pattern:script-error-handling] | Robust error handling in scripts | CLI tools, automation scripts, build tools |

## Pattern Categories

### File Operations
- methodical-file-processing
- safe-migration-strategy

### AI Optimization
- progressive-disclosure

### Error Handling
- script-error-handling

## Usage

Only load patterns when implementing related functionality:

```markdown
<!-- In your code -->
// Implementing file processing - see [@pattern:methodical-file-processing]
```

## Contributing

New patterns should follow the standard format:
1. Quick Context
2. Implementation
3. Anti-Pattern
4. Best Practice
5. Task References

See any existing pattern for the template.