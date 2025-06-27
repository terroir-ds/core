# Multi-Agent Development System

## Overview

This system enables parallel development using multiple Claude agents working simultaneously on different aspects of the Terroir Core Design System. Each agent operates in its own VS Code window and container, coordinating through shared task management.

## Prerequisites

**Important**: All git worktrees must be on `feat/initial-setup` branch (or have it merged) to include the latest multi-agent fixes:
- Settings merge functionality
- Direct folder opening support
- Environment variable handling
- Git exclusion configurations

## Quick Start

```bash
# 1. Run host setup script (one time, from host machine)
cd ~/path/to/terroir-core
./.claude/multi-agent/scripts/host-setup.sh

# 2. Open each agent folder directly in VS Code
# No workspace files needed - just open the folders:
code ../terroir-agent1
code ../terroir-agent2  
code ../terroir-agent3

# 3. Each VS Code window will:
# - Detect .devcontainer and prompt to reopen in container
# - Load merged settings (shared + agent-specific)
# - Show agent color in title bar
# - Have working git, pnpm, and environment

# 4. At sync times (10am, 2pm, 6pm), run:
./.claude/multi-agent/scripts/sync-agents.sh
```

## Architecture

```
Your Machine
├── terroir-core (main repo - source of truth)
│   ├── .claude/ (coordination & tasks)
│   ├── .agent-coordination/ (locks, claims, blocks)
│   └── Branch: main
├── terroir-agent1 (utilities focus)
│   ├── VS Code Window 1
│   ├── Dev Container 1
│   └── Branch: feat/utilities
├── terroir-agent2 (infrastructure focus)
│   ├── VS Code Window 2
│   ├── Dev Container 2
│   └── Branch: feat/infrastructure
└── terroir-agent3 (documentation focus)
    ├── VS Code Window 3
    ├── Dev Container 3
    └── Branch: feat/documentation
```

## Agent Responsibilities

### Agent 1: Utilities Development
- **Focus**: `/packages/core/src/utils/`
- **Tasks**: Extract and implement utility functions
- **Branch**: `feat/utilities`
- **Color**: Green theme

### Agent 2: Infrastructure & DevOps
- **Focus**: `/.github/`, `/scripts/`, build configs
- **Tasks**: CI/CD, security, build optimization
- **Branch**: `feat/infrastructure`
- **Color**: Blue theme

### Agent 3: Documentation & API
- **Focus**: `/docs/`, API documentation, README files
- **Tasks**: TypeDoc, Storybook, guides
- **Branch**: `feat/documentation`
- **Color**: Purple theme

## Coordination Protocol

### Task Management
1. All agents share `.claude/tasks/` directory from terroir-core
2. Agents claim tasks by updating `AGENT-REGISTRY.md` in terroir-core
3. Lock files in `.agent-coordination/` prevent conflicts on shared resources

### Sync Schedule
- **10:00 AM**: Morning sync and planning
- **2:00 PM**: Midday integration check
- **6:00 PM**: End of day merge

### Communication
- Async: Through shared files in `.claude/`
- Sync: At designated merge windows
- Emergency: Via `ALERT.md` for blockers

## File Ownership

### Exclusive Ownership
- **Agent 1**: `/packages/core/src/utils/**`
- **Agent 2**: `/.github/**`, `/scripts/**`
- **Agent 3**: `/docs/**`, `**/*.md`

### Shared Resources (Require Coordination)
- `package.json` - All agents
- `tsconfig.json` - Agents 1 & 2
- `pnpm-workspace.yaml` - Agent 2 primary

## Conflict Prevention

1. **Lock Files**: Agents create locks before editing shared files
2. **Clear Boundaries**: Each agent has primary ownership areas
3. **Regular Integration**: Frequent merges catch conflicts early
4. **Communication**: Proactive notification of major changes

## Daily Workflow

### Morning (Start of Day)
1. Run `start-agents.sh` to launch all environments
2. Each agent pulls latest changes
3. Review task assignments in `AGENT-REGISTRY.md`
4. Begin focused work

### During Work
- Commit frequently (every 30-60 minutes)
- Check for alerts before major changes
- Update task status in real-time
- Leave notes for other agents as needed

### Sync Windows
1. All agents commit current work
2. Run `sync-agents.sh`
3. Resolve any conflicts together
4. Continue with refreshed codebase

### End of Day
1. Final sync at 6 PM
2. Update tomorrow's plan
3. Clean up lock files
4. Shut down environments

## Troubleshooting

### Common Issues

**"OP_SERVICE_ACCOUNT_TOKEN not set" Warning**
- **Cause**: .env file not found or not loaded
- **Solution**: Ensure .env exists in agent directory, run host-setup.sh again
- **Verification**: `ls -la .env` in agent directory

**"fatal: not a git repository" Error**
- **Cause**: Git worktree paths incorrect or branches outdated
- **Solution**: Merge feat/initial-setup into agent branches:
  ```bash
  git merge feat/initial-setup
  ```

**Agent Settings/Colors Missing After Merge**
- **Cause**: Git merge overwrites settings.json
- **Solution**: Run host-setup.sh again - it recreates merged settings
- **Note**: Host setup now preserves shared settings while adding agent overrides

**Empty /workspaces/core Directory**
- **Cause**: Docker mount artifact from earlier PATH configuration
- **Solution**: Harmless, can be ignored
- **Fixed in**: Latest devcontainer.json uses ${localWorkspaceFolderBasename}

**VS Code Not Detecting Devcontainer**
- **Cause**: Using workspace files or outdated configuration
- **Solution**: Open folders directly: `code ../terroir-agent1`
- **Note**: Workspace files are no longer needed or created

**Changes Showing as Modified in Git**
- **Cause**: Copied files from main repo differ from agent branch versions
- **Solution 1**: Merge latest changes from feat/initial-setup
- **Solution 2**: Git exclusions will hide .vscode/settings.json, .env, etc.

**Merge Conflicts During Sync**
- Run `check-conflicts.sh` to identify issues
- Coordinate through `CONFLICTS.md`
- Use integration branch for resolution

**Agent Blocked**
- Create blocker file in `.agent-coordination/blocks/`
- Other agents check every 30 minutes
- Collaborate on resolution

## Scripts

- `scripts/host-setup.sh` - Complete host machine setup (run once from main repo)
  - Creates git worktrees on specified branches
  - Sets up coordination directories in terroir-core
  - Copies devcontainer, scripts, and environment files
  - Configures git to exclude agent-specific files
  - Creates agent-specific VS Code settings
- `sync-agents.sh` - Synchronize agent work at scheduled times
- `check-conflicts.sh` - Detect potential merge issues
- `stop-agents.sh` - Clean shutdown of environments

## Best Practices

1. **Commit Often**: Every 30-60 minutes
2. **Clear Messages**: Include agent ID in commits
3. **Stay in Lane**: Respect ownership boundaries
4. **Communicate**: Use coordination files liberally
5. **Test Locally**: Before pushing changes
6. **Sync Regularly**: Don't skip merge windows

## Technical Implementation Details

### Settings Merge Strategy
The host setup script implements smart settings management:
1. Copies shared settings.json from main repo
2. Creates agent-specific overrides (colors, env vars)
3. Merges them using Node.js for deep object merging
4. Falls back to simple replacement if Node.js unavailable
5. Recreates on every run to handle post-merge scenarios

### Git Exclusions
Each agent worktree excludes locally-modified files:
- `.vscode/settings.json` - Agent-specific VS Code settings
- `.env` - Local environment variables
- `.devcontainer/` - Container configuration
- `scripts/` - Development scripts

These exclusions prevent git from showing modifications after setup.

### Container Mounts
Each agent container mounts:
- **Agent workspace**: `/workspaces/terroir-agentN` (primary workspace)
- **Main repo**: `/workspaces/terroir-core` (for git worktree access)
- **Dynamic PATH**: `/workspaces/${localWorkspaceFolderBasename}/node_modules/.bin`

### Environment Loading
The post-create.sh script:
1. Searches for .env in working directory first
2. No hardcoded project paths for portability
3. Loads 1Password tokens for SSH key management
4. Configures git signing with loaded SSH keys

## Metrics

Track effectiveness through:
- Tasks completed per day
- Conflict frequency
- Integration success rate
- Time saved vs sequential work

## Key Implementation Details

### Settings Management
- Each agent has two settings files:
  - `terroir-shared/.vscode/settings.json` - Shared settings
  - `terroir-agentN/.vscode/settings.json` - Agent-specific overrides
- VS Code automatically merges these (agent settings take precedence)

### Git Configuration
- Each worktree excludes:
  - `.vscode/settings.json` (agent-specific)
  - `.env` (local environment)
  - `.devcontainer/` (agent configuration)
  - `scripts/` (agent scripts)
- Main repository (terroir-core) mounted read-only for git operations

### Container Setup
- No workspace files needed - open folders directly
- Devcontainer uses dynamic paths with `${localWorkspaceFolderBasename}`
- Post-create script properly loads environment variables
- Each container isolated but shares coordination via symlinks

## Next Steps

1. Ensure all worktrees are on `feat/initial-setup` or have it merged
2. Run host setup script from main repository
3. Open agent folders directly (no workspace files)
4. Start coordinated development

Ready to 3x your development speed? Let's go! 🚀