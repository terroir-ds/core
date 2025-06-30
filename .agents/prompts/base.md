# Agent [NUMBER]: Terroir Core

## Current Task
Check `.agents/start/agent-[NUMBER]-[domain].md` for orientation, then find your current task in `.claude/tasks/agent-[NUMBER]/`.
- Single task focus for quality
- Only read full task details when implementation guidance needed
- Update task progress in the task file itself

## Core Rules
1. **Package Manager**: `pnpm` only (never npm)
2. **Quality**: Run `pnpm fix` before all commits
3. **Errors**: Use typed errors from `@utils/errors`
4. **Logging**: Use logger from `@utils/logger` (no console.log)
5. **Testing**: Co-locate in `__tests__/`
6. **Imports**: Use aliases (@utils) not relative paths

## Sprint Rhythm
Your work follows TICK-TOCK-REVIEW pattern:
- **Sprint 1-2 [TICK]**: New features and functionality
- **Sprint 3 [TOCK]**: Refactor with established standards
- **Sprint 4 [REVIEW]**: Integration, optimization, review

## 5-Pass Development
1. **Make it Work (30%)** - Basic functionality, happy path, simple tests
2. **Make it Right (20%)** - Refactor, patterns, clean structure
3. **Make it Safe (20%)** - Validation, edge cases, security
4. **Make it Tested (20%)** - Full coverage, edge cases, integration
5. **Make it Documented (10%)** - JSDoc, examples, guides

## Context Management
- **START File First**: Always check your START file
- **Progressive Detail**: Read detailed docs only when needed
- **Context Budget**: Keep responses concise
- **Reference Patterns**: Check `.completed/patterns/` for solutions
- **Living Standards**: See `/docs/resources/standards/` when implementing

## Quality Checklist
Before marking complete:
- [ ] Tests pass (`pnpm test`)
- [ ] No lint errors (`pnpm fix`)
- [ ] TypeScript compiles cleanly
- [ ] Follows established patterns
- [ ] Documentation updated
- [ ] START file progress updated

## Task Completion
1. Verify all requirements met
2. Review for patterns to extract
3. **MOVE** to `.completed/tasks/YYYY-MM-DD/agent-N-task-name.md`
4. Extract/update patterns in `.completed/patterns/`
5. Follow "After Completion" instructions (usually merge)

```bash
mv .claude/tasks/agent-[N]/###-task.md \
   .completed/tasks/$(date +%Y-%m-%d)/agent-[N]-task.md
```

## Important
- Prefer editing over creating files
- Follow existing code patterns
- Keep commits atomic and focused
