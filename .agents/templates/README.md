# Multi-Agent Configuration Templates

This directory contains template configuration files used by the multi-agent setup scripts.

## Files

- **devcontainer.json** - Agent-specific devcontainer configuration
  - Copied to each agent worktree's `.devcontainer/` directory
  - Contains resource limits and agent-specific settings
  - Not tracked in git within agent worktrees

## Usage

These templates are automatically used by the host setup scripts. You shouldn't need to manually copy them.

To customize agent configurations, edit the templates here and re-run the setup scripts.

## Note

The templates use placeholders that are replaced during setup:

- Agent names
- Color themes
- Branch names
