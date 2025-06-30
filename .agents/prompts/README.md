# Agent Prompts

This directory contains prompts for all agents in the multi-agent development system.

## Directory Structure

```markdown
prompts/
├── README.md              # This file
├── base.md                # Core instructions all agents inherit
├── core.md                # Agent 0: Core integration
├── utilities.md           # Agent 1: Utility libraries
├── infrastructure.md      # Agent 2: Infrastructure & build
├── components.md          # Agent 3: Component library
└── merge-coordinator.md   # Special prompt for merge operations
```

## Usage

The prompt system uses progressive disclosure:

1. **Base prompt** (`base.md`) - Common rules and workflows
2. **Agent-specific prompt** - Domain-specific instructions
3. **START file** (`.agents/start/`) - Static orientation guide

Prompts are automatically combined when using:

```bash
# From host:
./agent-manager.sh prompt 1

# From container:
.agents/scripts/prompt.sh 1
```

## Prompt Philosophy

- **Concise**: All prompts under 100 lines (most under 60)
- **Action-oriented**: Focus on what to do, not theory
- **Progressive**: Reference details only when needed
- **Static**: Prompts rarely change

## Content Overview

- **base.md**: Core rules, 5-pass development, quality checklist
- **core.md**: Integration focus, standards enforcement
- **utilities.md**: Zero-dependency utilities, TDD approach
- **infrastructure.md**: Build systems, token management
- **components.md**: React components, accessibility first
- **merge-coordinator.md**: Conflict resolution patterns

## Related Resources

- **START files**: `.agents/start/` - Agent orientation guides
- **Tasks**: `.claude/tasks/` - Current work items
- **Standards**: `/docs/resources/standards/` - Detailed patterns
- **Patterns**: `.completed/patterns/` - Reusable solutions
