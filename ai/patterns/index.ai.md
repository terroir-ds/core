# Pattern Index

## Available Patterns

| Pattern | Purpose | When to Use |
|---------|---------|-------------|
| [@pattern:pattern-quality-scoring] | Score pattern instances 1-5 for quality control | Phase transitions, pattern extraction, documentation |
| [@pattern:standard-quality-scoring] | Score standard implementations 1-5 for compliance | Phase transitions, code review, tech debt, audits |
| [@pattern:contextual-scoring-pattern] | Apply universal criteria with context-aware interpretation | Scoring any artifact type consistently |
| [@pattern:reference-scanner-pattern] | Extract pattern/standard references from code | Building scanners, parsing code, extracting metadata |
| [@pattern:methodical-file-processing] | Process large sets of files systematically | Batch operations, migrations, refactoring |
| [@pattern:progressive-disclosure] | Minimize AI context usage | Documentation loading, task management |
| [@pattern:safe-migration-strategy] | Perform irreversible changes safely | File moves, structural changes, schema updates |
| [@pattern:script-error-handling] | Robust error handling in scripts | CLI tools, automation scripts, build tools |

## Pattern Categories

### Documentation & Quality
- pattern-quality-scoring
- standard-quality-scoring

### File Operations
- methodical-file-processing
- safe-migration-strategy

### AI Optimization
- progressive-disclosure
- pattern-quality-scoring

### Error Handling
- script-error-handling

### Meta-Patterns
- pattern-quality-scoring
- standard-quality-scoring
- reference-scanner-pattern

### Standards & Compliance
- standard-quality-scoring

### Automation & Tooling
- reference-scanner-pattern
- methodical-file-processing

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