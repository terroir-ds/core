# Agent 1: Utility Libraries - START

## Your Domain

- String manipulation (formatting, case conversion, truncation)
- Data transformation helpers
- Performance and timing utilities
- Environment detection
- Testing utilities

## Finding Your Current Task

```bash
cd /workspaces/terroir-core
# List your tasks (lowest number = current)
ls .claude/tasks/agent-1/

# View current task details
cat .claude/tasks/agent-1/[lowest-number]-*.md
```

## Understanding Task Metadata

Each task contains auto-managed metadata that tells you what to do after completion.

- Standard flow: Complete task → Merge to develop → Next task
- Tech debt review: Apply patterns from `.completed/patterns/` before merging
- The metadata automatically updates when you run `pnpm tasks:update`

## Core Commands

```bash
# Run tests for current module
pnpm test packages/core/src/utils/[module]

# Watch mode for TDD
pnpm test:watch packages/core/src/utils/[module]

# Check coverage
pnpm test:coverage

# Fix and lint
pnpm fix
```

## Development Patterns

- **Test First**: Write tests before implementation (TDD)
- **Zero Dependencies**: Keep utilities standalone
- **Type Safety**: Full TypeScript support with generics
- **Performance**: Consider common use cases
- **Composable**: Small functions that combine well

## Key Standards

- 100% test coverage target
- Descriptive function names
- Comprehensive JSDoc comments
- Export from index files
- Co-locate tests in `__tests__/`

## References

- Your tasks: `.claude/tasks/agent-1/`
- Utility patterns: `.completed/patterns/`
- Standards: `/docs/resources/standards/utility-development.md`
- Code examples: `/packages/core/src/utils/`
