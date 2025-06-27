# Host Machine Setup for Multi-Agent Development

## Prerequisites

Before running the multi-agent system, you need to set up the worktrees and directory structure on your **host machine** (not inside the container).

## Step 1: Exit Current Container

First, you'll need to work on your host machine:
1. Close the current VS Code window (or keep it open, but open a new terminal on your host)
2. Open a terminal on your host machine
3. Navigate to your Terroir Core repository

## Step 2: Create Git Worktrees

On your host machine, run:

```bash
# Navigate to your repository
cd ~/path/to/terroir-core

# Create feature branches if they don't exist
git branch feat/utilities 2>/dev/null || true
git branch feat/infrastructure 2>/dev/null || true
git branch feat/documentation 2>/dev/null || true

# Create worktrees (these are like separate clones that share .git)
git worktree add ../terroir-agent1 feat/utilities
git worktree add ../terroir-agent2 feat/infrastructure
git worktree add ../terroir-agent3 feat/documentation
```

## Step 3: Create Shared Coordination Directory

```bash
# From your repository parent directory
cd ..
mkdir -p terroir-shared/.claude
mkdir -p terroir-shared/.agent-coordination/{locks,claims,blocks}

# Copy current .claude contents to shared location
cp -r terroir-core/.claude/* terroir-shared/.claude/
```

## Step 4: Set Up Symbolic Links

```bash
# For each agent directory, link to shared coordination
for agent in terroir-agent1 terroir-agent2 terroir-agent3; do
    cd $agent
    rm -rf .claude  # Remove any existing .claude
    ln -s ../terroir-shared/.claude .claude
    ln -s ../terroir-shared/.agent-coordination .agent-coordination
    cd ..
done
```

## Step 5: Create VS Code Workspace Files

Create three workspace files in the parent directory:

**terroir-agent1.code-workspace:**
```json
{
  "folders": [{"path": "terroir-agent1"}],
  "settings": {
    "workbench.colorCustomizations": {
      "titleBar.activeBackground": "#1a4d1a"
    }
  }
}
```

**terroir-agent2.code-workspace:**
```json
{
  "folders": [{"path": "terroir-agent2"}],
  "settings": {
    "workbench.colorCustomizations": {
      "titleBar.activeBackground": "#1a2d4d"
    }
  }
}
```

**terroir-agent3.code-workspace:**
```json
{
  "folders": [{"path": "terroir-agent3"}],
  "settings": {
    "workbench.colorCustomizations": {
      "titleBar.activeBackground": "#3d1a4d"
    }
  }
}
```

## Step 6: Open Dev Containers

Now you'll open 3 separate VS Code windows, each with its own dev container:

```bash
# Open each workspace - each will start its own container
code terroir-agent1.code-workspace
code terroir-agent2.code-workspace  
code terroir-agent3.code-workspace
```

When each window opens:
1. VS Code will detect the `.devcontainer` configuration
2. It will prompt to "Reopen in Container"
3. Click yes for each window
4. Each will build/start its own container instance

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
- Each mounts only its specific worktree
- The shared `.claude` directory enables coordination

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

## Next Steps

Once all three containers are running:
1. In each VS Code terminal, start the Claude agent
2. Have each agent read their specific instructions
3. Begin coordinated development!

The key insight is that the git worktrees and directory structure must be created on the host, then each gets its own VS Code window and container.