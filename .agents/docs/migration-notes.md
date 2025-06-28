# Migration from .claude/agents to /.agents

## Date: 2025-06-28

## Reason for Migration

Moving agent tooling from `.claude/agents/` to `/.agents/` simplifies the multi-agent merge process:

1. **Shared across all branches** - No merge conflicts for agent tooling
2. **No symlinks needed** - All branches have the same `/.agents` directory
3. **Simpler merges** - Only need to handle `.devcontainer/devcontainer.json` and `.vscode/settings.json`
4. **Cleaner separation** - `.claude/` for AI session data, `/.agents/` for tooling
5. **Standard pattern** - Follows convention like `.github/`, `.vscode/`, etc.

## What Changed

- `.claude/agents/` → `/.agents/`
- All script references updated
- Symlink creation simplified (only need `.claude`, not `.claude/agents`)

## Impact on Existing Setups

After pulling this change, existing agent worktrees need to:
1. Remove old symlinks: `rm -f .claude`
2. Re-run setup: `/.agents/scripts/host/setup.sh`

This will create the correct symlinks to the new structure.
