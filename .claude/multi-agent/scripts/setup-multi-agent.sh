#!/bin/bash
# setup-multi-agent.sh - One-time setup for multi-agent development

set -e

echo "🚀 Terroir Multi-Agent Development Setup"
echo "========================================"

# Get the absolute path of the main repo
MAIN_REPO=$(cd "$(dirname "$0")/../../.." && pwd)
PARENT_DIR=$(dirname "$MAIN_REPO")
SHARED_DIR="$PARENT_DIR/terroir-shared"

echo "📁 Main repository: $MAIN_REPO"
echo "📁 Parent directory: $PARENT_DIR"

# Create git worktrees for each agent
echo -e "\n📌 Creating git worktrees..."
cd "$MAIN_REPO"

# Create feature branches if they don't exist
git branch feat/utilities 2>/dev/null || true
git branch feat/infrastructure 2>/dev/null || true  
git branch feat/documentation 2>/dev/null || true

# Create worktrees
if [ ! -d "$PARENT_DIR/terroir-agent1" ]; then
    git worktree add "$PARENT_DIR/terroir-agent1" feat/utilities
    echo "✅ Created worktree for Agent 1 (utilities)"
fi

if [ ! -d "$PARENT_DIR/terroir-agent2" ]; then
    git worktree add "$PARENT_DIR/terroir-agent2" feat/infrastructure
    echo "✅ Created worktree for Agent 2 (infrastructure)"
fi

if [ ! -d "$PARENT_DIR/terroir-agent3" ]; then
    git worktree add "$PARENT_DIR/terroir-agent3" feat/documentation
    echo "✅ Created worktree for Agent 3 (documentation)"
fi

# Create shared coordination directory
echo -e "\n📁 Creating shared coordination directory..."
mkdir -p "$SHARED_DIR/.claude"
mkdir -p "$SHARED_DIR/.agent-coordination/locks"
mkdir -p "$SHARED_DIR/.agent-coordination/claims"
mkdir -p "$SHARED_DIR/.agent-coordination/blocks"

# Create symlinks to shared directories
echo -e "\n🔗 Creating symbolic links..."
for i in 1 2 3; do
    AGENT_DIR="$PARENT_DIR/terroir-agent$i"
    
    # Remove existing .claude if it exists
    rm -rf "$AGENT_DIR/.claude"
    
    # Link to shared .claude
    ln -s "$SHARED_DIR/.claude" "$AGENT_DIR/.claude"
    
    # Link to agent coordination
    ln -s "$SHARED_DIR/.agent-coordination" "$AGENT_DIR/.agent-coordination"
    
    echo "✅ Linked shared directories for Agent $i"
done

# Copy main repo's .claude contents to shared
echo -e "\n📋 Copying coordination files..."
cp -r "$MAIN_REPO/.claude/"* "$SHARED_DIR/.claude/" 2>/dev/null || true

# Create VS Code workspace files
echo -e "\n💻 Creating VS Code workspace files..."

# Agent 1 workspace
cat > "$PARENT_DIR/terroir-agent1.code-workspace" << 'EOF'
{
  "folders": [{
    "path": "terroir-agent1"
  }],
  "settings": {
    "terminal.integrated.env.linux": {
      "AGENT_ID": "1",
      "AGENT_FOCUS": "utilities"
    },
    "workbench.colorCustomizations": {
      "activityBar.background": "#1a4d1a",
      "titleBar.activeBackground": "#1a4d1a",
      "statusBar.background": "#1a4d1a"
    },
    "window.title": "Agent 1 - Utilities - ${folderName}"
  }
}
EOF

# Agent 2 workspace
cat > "$PARENT_DIR/terroir-agent2.code-workspace" << 'EOF'
{
  "folders": [{
    "path": "terroir-agent2"
  }],
  "settings": {
    "terminal.integrated.env.linux": {
      "AGENT_ID": "2",
      "AGENT_FOCUS": "infrastructure"
    },
    "workbench.colorCustomizations": {
      "activityBar.background": "#1a2d4d",
      "titleBar.activeBackground": "#1a2d4d",
      "statusBar.background": "#1a2d4d"
    },
    "window.title": "Agent 2 - Infrastructure - ${folderName}"
  }
}
EOF

# Agent 3 workspace
cat > "$PARENT_DIR/terroir-agent3.code-workspace" << 'EOF'
{
  "folders": [{
    "path": "terroir-agent3"
  }],
  "settings": {
    "terminal.integrated.env.linux": {
      "AGENT_ID": "3",
      "AGENT_FOCUS": "documentation"
    },
    "workbench.colorCustomizations": {
      "activityBar.background": "#3d1a4d",
      "titleBar.activeBackground": "#3d1a4d",
      "statusBar.background": "#3d1a4d"
    },
    "window.title": "Agent 3 - Documentation - ${folderName}"
  }
}
EOF

# Create initial coordination files
echo -e "\n📄 Creating coordination files..."

cat > "$SHARED_DIR/.claude/tasks/AGENT-REGISTRY.md" << 'EOF'
# Agent Registry

## Active Agents

| Agent | Focus Area | Current Task | Branch | Status | Last Update |
|-------|------------|--------------|--------|--------|-------------|
| 1 | Utilities | Not assigned | feat/utilities | Ready | $(date) |
| 2 | Infrastructure | Not assigned | feat/infrastructure | Ready | $(date) |
| 3 | Documentation | Not assigned | feat/documentation | Ready | $(date) |

## Task Claims

When claiming a task:
1. Update this table with your current task
2. Move the task to "in_progress" in the todo list
3. Create a lock file if editing shared resources

## Ownership Map

### Exclusive Ownership
- **Agent 1**: `/packages/core/src/utils/**`
- **Agent 2**: `/.github/**`, `/scripts/**`, `*.config.js`
- **Agent 3**: `/docs/**`, `**/*.md` (except in packages/core/src)

### Shared Resources (Coordinate First!)
- `package.json` - All agents (create claim file)
- `tsconfig.json` - Agents 1 & 2 (create claim file)
- `pnpm-workspace.yaml` - Agent 2 primary, others request
EOF

cat > "$SHARED_DIR/.agent-coordination/merge-schedule.md" << 'EOF'
# Merge Schedule

## Daily Sync Windows
- **10:00 AM** - Morning sync and planning
- **2:00 PM** - Midday integration check  
- **6:00 PM** - End of day merge

## Merge Protocol

1. All agents commit and push current work
2. Run sync-agents.sh script
3. Resolve any conflicts in integration branch
4. Rebase agent branches
5. Continue development

## Integration Branch Naming
`integration/YYYYMMDD-HHMM`

## Conflict Resolution
- Agent with file ownership has priority
- Shared files: discuss in CONFLICTS.md
- When in doubt, preserve all changes and refactor
EOF

cat > "$SHARED_DIR/.agent-coordination/README.md" << 'EOF'
# Agent Coordination

## Communication Protocol

### Async Communication (Default)
- Update task status in AGENT-REGISTRY.md
- Use lock files for shared resources
- Leave notes in daily-log.md

### Sync Points  
- Morning: Review tasks and plan
- Midday: Quick integration check
- Evening: Full merge and next day prep

### Creating Lock Files
```bash
# Before editing a shared file
touch .agent-coordination/locks/package.json.agent2.lock

# After completing edit
rm .agent-coordination/locks/package.json.agent2.lock
```

### Claiming Shared Resources
```bash
# Claim a file for extended editing
echo "Agent 2 - Editing for: adding new dependencies" > .agent-coordination/claims/package.json.agent2

# Release claim when done
rm .agent-coordination/claims/package.json.agent2
```

## Emergency Protocol

If blocked:
1. Create `.agent-coordination/blocks/blocker-$(date +%s).md`
2. Describe the issue and what you need
3. Other agents check blocks/ every 30 min

## Best Practices
- Commit every 30-60 minutes
- Push to branch frequently  
- Check for alerts before major changes
- Respect ownership boundaries
- Communicate proactively
EOF

# Create docker-compose file for agents
echo -e "\n🐳 Creating docker-compose configuration..."
cat > "$PARENT_DIR/docker-compose.agents.yml" << 'EOF'
version: '3.8'

x-agent-base: &agent-base
  build:
    context: ./terroir-agent1
    dockerfile: .devcontainer/Dockerfile
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
    - ${HOME}/.ssh:/home/vscode/.ssh:ro
  environment:
    - TZ=UTC
  command: /bin/sh -c "while sleep 1000; do :; done"

services:
  agent1:
    <<: *agent-base
    container_name: terroir-agent1
    volumes:
      - ./terroir-agent1:/workspaces/core
      - ./terroir-shared/.claude:/workspaces/core/.claude
      - ./terroir-shared/.agent-coordination:/workspaces/core/.agent-coordination
    environment:
      - AGENT_ID=1
      - AGENT_FOCUS=utilities

  agent2:
    <<: *agent-base  
    container_name: terroir-agent2
    volumes:
      - ./terroir-agent2:/workspaces/core
      - ./terroir-shared/.claude:/workspaces/core/.claude
      - ./terroir-shared/.agent-coordination:/workspaces/core/.agent-coordination
    environment:
      - AGENT_ID=2
      - AGENT_FOCUS=infrastructure

  agent3:
    <<: *agent-base
    container_name: terroir-agent3
    volumes:
      - ./terroir-agent3:/workspaces/core
      - ./terroir-shared/.claude:/workspaces/core/.claude
      - ./terroir-shared/.agent-coordination:/workspaces/core/.agent-coordination
    environment:
      - AGENT_ID=3
      - AGENT_FOCUS=documentation
EOF

echo -e "\n✨ Setup complete!"
echo -e "\nNext steps:"
echo "1. Run: ./.claude/multi-agent/scripts/start-agents.sh"
echo "2. Open the 3 VS Code windows that appear"
echo "3. Each agent will be ready to work in their focus area"
echo -e "\nHappy parallel developing! 🚀"