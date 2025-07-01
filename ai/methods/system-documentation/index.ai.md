# System Documentation Method

## Quick Context

A streamlined 2-phase approach for creating AI-optimized documentation that gets documentation done efficiently without excessive process.

## When to Use

- Creating new task documentation in `.completed/tasks/`
- Documenting new patterns in `.completed/patterns/`
- Creating method guides in `/ai/methods/`
- Backfilling documentation for existing systems
- Updating `.agents/` prompt documentation

## Phase Structure

### Phase 1: Plan & Write (80%)
Research, structure, and write the documentation in one focused effort.

### Phase 2: Review & Polish (20%)
Quick review to ensure clarity and add any missing examples.

## Key Principles

1. **AI-First Writing**: Optimize for AI agents to quickly understand and apply
2. **Concrete Examples**: Always include real code/command examples
3. **Clear Structure**: Use consistent formatting and organization
4. **Version Tracking**: Document when patterns/methods were introduced
5. **Cross-References**: Link related documentation and patterns

## Documentation Types

| Type | Location | Purpose |
|------|----------|---------|
| Task Documentation | `.completed/tasks/` | Specific task implementations |
| Pattern Documentation | `.completed/patterns/` | Reusable approaches |
| Method Guides | `/ai/methods/` | Structured workflows |
| Agent Prompts | `.agents/prompts/` | Agent-specific context |

## Quick Start

```bash
# Start documentation task
cd /workspaces/terroir-core/ai

# For new method documentation
mkdir -p methods/new-method
touch methods/new-method/index.ai.md
touch methods/new-method/phase-1-plan-write.ai.md
touch methods/new-method/phase-2-review-polish.ai.md

# For task/pattern documentation
touch .completed/tasks/task-name.md
# or
touch .completed/patterns/pattern-name.md
```

## Phase Transition

No formal gates needed - simply update your task tracker when moving from Phase 1 to Phase 2. The goal is to get good documentation done efficiently, not to follow a rigid process.