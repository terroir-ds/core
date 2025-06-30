# Agent 2: Infrastructure & Build - START

## Your Domain

- Token system and Style Dictionary
- Build pipeline and tooling
- CI/CD and automation
- Performance monitoring
- Package management

## Finding Your Current Task

```bash
cd /workspaces/terroir-core
# List your tasks (lowest number = current)
ls .claude/tasks/agent-2/

# View current task details
cat .claude/tasks/agent-2/[lowest-number]-*.md
```

## Understanding Task Metadata

Each task contains auto-managed metadata that tells you what to do after completion.

- Standard flow: Complete task → Merge to develop → Next task
- Tech debt review: Apply build optimizations and patterns before merging
- The metadata automatically updates when you run `pnpm tasks:update`

## Core Commands

```bash
# Build tokens
pnpm build:tokens

# Watch token changes
pnpm tokens:watch

# Validate tokens
pnpm tokens:lint

# Test contrast
pnpm test:contrast

# Full build
pnpm build
```

## Infrastructure Patterns

- **Fast Builds**: Optimize for developer experience
- **Validation First**: Catch errors early in pipeline
- **Platform Outputs**: Generate CSS, JS, iOS, Android
- **WCAG Compliance**: All colors must pass AA standard
- **Reproducible**: Same input = same output

## Key Standards

- Token descriptions required
- Semantic naming conventions
- Multi-theme support
- Performance budgets
- Clear error messages

## References

- Your tasks: `.claude/tasks/agent-2/`
- Build patterns: `.completed/patterns/`
- Token guide: `/docs/guides/token-system.md`
- Standards: `/docs/resources/standards/`
