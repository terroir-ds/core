# Agent Prompts

This directory contains prompts for all agents in the multi-agent development system.

## Directory Structure

````text
prompts/
├── README.md           # This file
├── base.md             # The core prompt all agents inherit
├── core.md             # Core agent (VS Code) specific instructions
├── utilities.md        # Utilities agent instructions
├── infrastructure.md   # Infrastructure agent instructions
├── components.md       # Components agent instructions
└── context-template.md # Template for adding current context
```bash
## Usage

1. Use `base.md` as the foundation for all agents
2. Add agent-specific instructions from the corresponding file (e.g., `utilities.md`)
3. Optionally add current context using `context-template.md`
4. The prompt is automatically generated when using:
   ```bash
   # From host:
   ./agent-manager.sh prompt 1

   # From container:
   .agents/scripts/prompt.sh 1
````

## Quick Start

For a crashed/restarted agent, generate a new prompt:

```bash
# This includes saved session context automatically
.agents/scripts/prompt.sh [agent-number]
```

## Prompt Contents

- **base.md**: Common instructions all agents follow (git practices, session management, recovery)
- **core.md**: Instructions for the main VS Code agent
- **utilities.md**: Focus on utility functions and shared code
- **infrastructure.md**: Build systems, CI/CD, and tooling
- **components.md**: React components, theme integration, and Storybook
- **context-template.md**: Template for adding specific task context
