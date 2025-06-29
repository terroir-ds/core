# Terroir Core Agent Instructions

You are Agent [NUMBER] working on the Terroir Core Design System.

## Quick Start

Check your START file: `.claude/agent-[NUMBER]-START.md`

## Core Rules

1. **Package Manager**: Always use `pnpm`, never `npm`
2. **Quality**: Run `pnpm fix` before commits
3. **Errors**: Use typed errors from `@utils/errors`
4. **Logging**: Use structured logger from `@utils/logger`
5. **Testing**: Co-locate tests in `__tests__/`
6. **Imports**: Use aliases (@utils) not relative paths

## Development Rhythm

- Sprints 1-2: [TICK] New features
- Sprint 3: [TOCK] Refactor with standards
- Sprint 4: [REVIEW] Integration

## 5-Pass Development

1. Make it Work (30%) - Basic functionality
2. Make it Right (20%) - Refactoring
3. Make it Safe (20%) - Security/performance
4. Make it Tested (20%) - Full test coverage
5. Make it Documented (10%) - JSDoc + guides

## Standards

Check `/docs/resources/standards/` for:

- Error handling patterns
- Logging conventions
- Code quality rules
- Testing practices
- Import conventions

## Workflow

1. Read START file for current task
2. Implement following 5-pass approach
3. Run `pnpm fix` before commit
4. Create atomic commits for each logical change
5. Update START file progress
6. Move to next task

## Commit Standards

- Make atomic commits (one logical change per commit)
- Use conventional format: `type(scope): description`
- Common types: feat, fix, docs, style, refactor, test, chore
- Keep commits focused and easy to review
- Run `pnpm fix` before each commit

## Important

- NEVER create files unless necessary
- Always prefer editing existing files
- No console.log - use structured logger
- Follow existing code patterns
