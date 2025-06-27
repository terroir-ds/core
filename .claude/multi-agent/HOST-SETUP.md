# Host Machine Setup for Multi-Agent Development

## Prerequisites

1. **Git Branches**: Ensure all worktrees will be on branches that have `feat/initial-setup` merged (or are based on it). This branch contains critical fixes for:
   - Settings file merging
   - Direct folder opening (no workspace files needed)
   - Environment variable handling
   - Git exclusion configurations

2. **Host Machine Access**: You'll need to work on your host machine (not inside a container) to set up the worktrees and directory structure.

## Step 1: Exit Current Container

First, you'll need to work on your host machine:
1. Close the current VS Code window (or keep it open, but open a new terminal on your host)
2. Open a terminal on your host machine
3. Navigate to your Terroir Core repository

## Step 2: Run the Host Setup Script

The `scripts/host-setup.sh` script automates the entire setup process:

```bash
# Navigate to your repository
cd ~/path/to/terroir-core

# Run the setup script
./.claude/multi-agent/scripts/host-setup.sh
```

This script will:
1. Create feature branches (based on current branch)
2. Set up git worktrees for each agent
3. Create shared coordination directory
4. Prepare for container coordination
5. Copy necessary files (.devcontainer, scripts, .env)
6. Set up git exclusions
7. Create agent-specific VS Code settings

## Step 3: Understanding What the Script Did

The host setup script performed these operations:

### Directory Structure Created
```
parent-directory/
├── terroir-core/          # Your main repository (source of truth)
│   ├── .claude/           # Task coordination
│   └── .agent-coordination/ # Locks, claims, blocks
├── terroir-agent1/        # Worktree for utilities (feat/utilities)
├── terroir-agent2/        # Worktree for infrastructure (feat/infrastructure)
└── terroir-agent3/        # Worktree for documentation (feat/documentation)
```

### Coordination Setup
Agent containers automatically link to terroir-core's directories:
- `.claude` → `/workspaces/terroir-core/.claude`
- `.agent-coordination` → `/workspaces/terroir-core/.agent-coordination`

These symbolic links are created by the post-create script when agent containers start, using terroir-core as the source of truth.

### Files Copied to Each Agent
- `.devcontainer/` - Container configuration
- `scripts/` - Build and development scripts
- `.env` - Environment variables
- `.vscode/settings.json` - Agent-specific settings (with color theme)

### Git Exclusions
Each worktree excludes:
- `.vscode/settings.json` - Agent-specific settings
- `.env` - Local environment
- `.devcontainer/` - Container config
- `scripts/` - Local scripts

## Step 4: Open Agent Folders in VS Code

**Important**: You don't need workspace files! Just open the folders directly:

```bash
# Open each agent folder - VS Code will handle the rest
code ../terroir-agent1
code ../terroir-agent2  
code ../terroir-agent3
```

When each window opens:
1. VS Code will detect the `.devcontainer` configuration
2. It will prompt to "Reopen in Container"
3. Click "Reopen in Container" for each window
4. Each container will start with:
   - Merged settings (shared + agent-specific)
   - Proper git access (via mounted terroir-core)
   - Working environment variables
   - Agent-specific color theme

## Final Structure

You'll end up with:
- **3 VS Code windows** (one per agent)
- **3 Dev Containers** (one per worktree)
- **3 Git Worktrees** (separate branches)
- **1 Shared Coordination** (via symbolic links)

## Important Notes

### About Worktrees
- Worktrees share the same `.git` directory but have separate working directories
- Each worktree can be on a different branch
- Changes in one worktree don't affect others until merged
- More efficient than multiple clones

### About Dev Containers
- Each container is isolated but uses the same image/configuration
- They can't interfere with each other
- Each agent mounts its own worktree plus terroir-core for coordination
- The `.claude` and `.agent-coordination` directories in terroir-core enable coordination

### Container Resources
- Each container will use separate resources
- Make sure your machine can handle 3 containers
- Typical usage: ~1-2GB RAM per container
- Consider closing unused applications

## Verification

After setup, verify:
1. Each VS Code window shows a different branch in the status bar
2. Each window title shows the agent color (green/blue/purple)
3. The `.claude` directory is accessible in each container
4. You can create a file in one agent's `.claude` and see it in others
5. Running `git status` works properly in each container
6. Environment variables are loaded (check with `echo $NODE_ENV`)
7. The pnpm commands work correctly

## Manual Setup (If Script Fails)

If the host setup script fails, you can set up manually:

1. **Create worktrees**:
   ```bash
   git worktree add ../terroir-agent1 feat/utilities
   git worktree add ../terroir-agent2 feat/infrastructure
   git worktree add ../terroir-agent3 feat/documentation
   ```

2. **Create coordination directories** (in main repo):
   ```bash
   mkdir -p .agent-coordination/{locks,claims,blocks}
   ```

3. **Prepare agent directories** (for each agent):
   ```bash
   # Remove any existing directories that would conflict
   rm -rf .claude .agent-coordination
   # Symbolic links will be created automatically inside containers
   ```

4. **Copy files** (for each agent):
   ```bash
   cp -r .devcontainer scripts .env ../terroir-agentN/
   ```

5. **Configure git exclusions** (for each agent):
   ```bash
   echo -e ".vscode/settings.json\n.env\n.devcontainer/\nscripts/" >> .git/info/exclude
   ```

## Next Steps

Once all three containers are running:
1. In each VS Code terminal, verify the environment is working
2. Start the Claude agent in each window
3. Have each agent read their specific instructions from `.claude/multi-agent/`
4. Begin coordinated development!

The key improvements in the current implementation:
- No workspace files needed - just open folders directly
- Settings automatically merge (shared + agent-specific)
- Git access works properly via devcontainer mounts
- Environment variables load correctly
- Each agent maintains independence while sharing coordination