# Getting Started with Multi-Agent Development

## Overview

This system enables a single developer to work like a tech lead with 2-4 parallel agents:

- **1 Core Agent**: Running in VS Code devcontainer (your main environment)
- **N Assistant Agents**: Lightweight Docker containers for parallel tasks

Each agent uses its own git worktree and branch to avoid conflicts.

## 🚀 Quick Start

### Starting Your First Agent

```bash
# From terroir-core root:
cd .agents/docker
./agent-manager.sh start 1    # Start agent 1 (utilities)
./agent-manager.sh connect 1  # Connect to the container
```

### Generating a Claude Prompt

**From the host (recommended - copies to clipboard):**

```bash
./agent-manager.sh prompt 1
```

**From inside a container:**

```bash
cd /workspaces/terroir-core/.agents/scripts
./prompt.sh 1
```

## 📊 Resource Benefits

| Setup | Memory Usage | Use Case |
|-------|-------------|----------|
| VS Code (Core) | ~2-3GB | Main development |
| Each Docker Agent | ~50-100MB | Parallel tasks |
| VS Code + 2 Agents | ~2.5GB total | Most workflows |

Compare to running 4 VS Code instances: ~8-10GB!

## ⚠️ Critical: How to Use Prompts

**These prompts are NOT for Claude to read and summarize!**

They are **instructions for Claude to follow**. You must:

1. Generate the prompt using the commands above
2. Copy the ENTIRE prompt content
3. Start a NEW Claude session
4. **PASTE the prompt as your first message**

❌ **WRONG**: "Claude, please read this prompt file..."
✅ **RIGHT**: [Paste entire prompt content directly]

## 💡 Daily Workflow

### Morning

```bash
cd .agents/docker
./agent-manager.sh status         # See what's running
./agent-manager.sh start 1        # Start utilities agent
./agent-manager.sh start 2        # Start infrastructure agent
```

### During Development

- **Core (VS Code)**: Main development, testing, integration
- **Agent 1**: Utilities and helper functions
- **Agent 2**: Infrastructure and build tasks
- **Agent 3**: Component development

### Switching Between Agents

```bash
# Generate prompt for current work
./agent-manager.sh prompt 1

# Start new Claude conversation with the prompt
# When done, save session for continuity:
./session.sh save
```

### Evening

```bash
./agent-manager.sh stop all       # Stop all agents
```

## 🎯 Pro Tips

1. **Start small**: Begin with just one assistant agent
2. **Save sessions**: Use `./session.sh save` before stopping work
3. **Check status**: `./status.sh` shows current agent state
4. **Avoid conflicts**: Each agent should work on different files

## Session Management

The system automatically maintains continuity between Claude sessions:

### How It Works

- Sessions are saved to `.claude/sessions/agent{N}-latest.md`
- The prompt generator automatically includes saved sessions
- Use `./session.sh` to manage sessions

### Saving Work Before Stopping

```bash
# Inside container, before stopping work
./session.sh save

# This captures:
# - Current git status
# - Recent commits
# - Working context
# - Any notes you add
```

### Resuming Work

```bash
# Generate new prompt - session is automatically included
./prompt.sh 1

# Or clear old session and start fresh
./session.sh clear
```

This ensures agents never lose context, even after crashes or restarts.

## Git Workflow & Merging

### The Challenge

Each agent uses a git worktree with its own branch, but some directories must remain symlinked:

- `.claude/` - Session management
- `.agent-coordination/` - Lock files

### Merging Updates FROM Core

```bash
# On agent branch, get latest core changes
git merge main --no-commit
git reset HEAD .claude/ .agent-coordination/
git commit -m "merge: update from core"
```

### Merging Work TO Core

```bash
# On core branch, integrate agent work
git merge feat/utilities --no-commit
# Review - agents shouldn't have .claude files
git commit -m "merge: integrate utilities work"
```

### Fixing Common Issues

**If agent accidentally commits .claude files:**

```bash
git rm -r --cached .claude/
git commit -m "fix: remove .claude from tracking"
```

**If symlinks break:**

```text
rm -rf .claude .agent-coordination
ln -sf /workspaces/terroir-core/.claude .claude
ln -sf /workspaces/terroir-core/.agent-coordination .agent-coordination
```

## Next Steps

- [Setup Guide](setup-guide.md) - Full installation instructions
- [Architecture](architecture.md) - Technical design details
