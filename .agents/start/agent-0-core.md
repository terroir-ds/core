# Agent 0: Core Integration - START

## Your Domain

- Guards system (type guards, assertions, validation)
- Logger and error handling systems
- Cross-cutting integrations
- Sprint planning and coordination
- Quality gates and standards

## Finding Your Current Task

```bash
cd /workspaces/terroir-core
# List your tasks (lowest number = current)
ls .claude/tasks/agent-0/

# View current task details
cat .claude/tasks/agent-0/[lowest-number]-*.md
```

## Understanding Task Metadata

Each task contains auto-managed metadata:

```markdown
**After Completion**: [action]
**Next Action**: [what to do next]
```

### Common Patterns

- `merge to develop` - Standard completion, merge and continue
- `tech debt review, then merge to develop` - TOCK phase: Apply new standards before merging
- `continue to task XXX` - Move to next task after merge

### Sprint Rhythm

- **TICK tasks**: Focus on new features (passes 1-5)
- **TOCK tasks**: When you see "tech debt review", check `.completed/patterns/` and `/docs/resources/standards/` for new patterns to apply before merging

## Core Commands

```bash
# Run tests
pnpm test

# Fix linting
pnpm fix

# Update task metadata
pnpm tasks:update

# Check all tasks status
pnpm tasks:status
```

## Key Patterns

- **Integration First**: Ensure modules work together
- **Standards Extraction**: Document patterns as you find them
- **Light Workload**: Time reserved for planning/coordination
- **Quality Gates**: Enforce standards across all agents

## References

- Your tasks: `.claude/tasks/agent-0/`
- Standards to enforce: `/docs/resources/standards/`
- Patterns library: `.completed/patterns/`
- Other agents' work: `.claude/tasks/agent-[1-3]/`
