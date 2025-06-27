#!/bin/bash
# host-setup.sh - Run this on your HOST MACHINE, not in the container

set -e

echo "🚀 Multi-Agent Host Setup"
echo "========================"
echo "This script must be run on your HOST machine, not inside a container."
echo ""

# Get the repository directory
if [ -d ".git" ]; then
    REPO_DIR=$(pwd)
elif [ -d "terroir-core/.git" ]; then
    REPO_DIR=$(pwd)/terroir-core
else
    echo "❌ Error: Run this from your terroir-core repository or its parent directory"
    exit 1
fi

PARENT_DIR=$(dirname "$REPO_DIR")
cd "$REPO_DIR"

echo "📁 Repository: $REPO_DIR"
echo "📁 Parent directory: $PARENT_DIR"
echo ""

# Check if branches exist, create if not
echo "🌿 Creating feature branches..."
git branch feat/utilities 2>/dev/null || echo "  feat/utilities already exists"
git branch feat/infrastructure 2>/dev/null || echo "  feat/infrastructure already exists"
git branch feat/documentation 2>/dev/null || echo "  feat/documentation already exists"

# Create worktrees
echo -e "\n📂 Creating worktrees..."
if [ ! -d "$PARENT_DIR/terroir-agent1" ]; then
    git worktree add "$PARENT_DIR/terroir-agent1" feat/utilities
    echo "✅ Created terroir-agent1 (utilities)"
else
    echo "  terroir-agent1 already exists"
fi

if [ ! -d "$PARENT_DIR/terroir-agent2" ]; then
    git worktree add "$PARENT_DIR/terroir-agent2" feat/infrastructure
    echo "✅ Created terroir-agent2 (infrastructure)"
else
    echo "  terroir-agent2 already exists"
fi

if [ ! -d "$PARENT_DIR/terroir-agent3" ]; then
    git worktree add "$PARENT_DIR/terroir-agent3" feat/documentation
    echo "✅ Created terroir-agent3 (documentation)"
else
    echo "  terroir-agent3 already exists"
fi

# Create shared directory
echo -e "\n📁 Creating shared coordination directory..."
mkdir -p "$PARENT_DIR/terroir-shared/.claude"
mkdir -p "$PARENT_DIR/terroir-shared/.agent-coordination/locks"
mkdir -p "$PARENT_DIR/terroir-shared/.agent-coordination/claims"
mkdir -p "$PARENT_DIR/terroir-shared/.agent-coordination/blocks"

# Copy .claude contents if they exist
if [ -d "$REPO_DIR/.claude" ]; then
    cp -r "$REPO_DIR/.claude/"* "$PARENT_DIR/terroir-shared/.claude/" 2>/dev/null || true
    echo "✅ Copied .claude contents to shared location"
fi

# Create symbolic links and workspace-specific settings
echo -e "\n🔗 Creating symbolic links and agent-specific VS Code settings..."
for i in 1 2 3; do
    AGENT_DIR="$PARENT_DIR/terroir-agent$i"
    cd "$AGENT_DIR"
    
    # Remove existing directories/links and any nested devcontainer copies
    rm -rf .claude .agent-coordination 2>/dev/null || true
    rm -rf .devcontainer/.devcontainer 2>/dev/null || true
    
    # Create symbolic links
    ln -s ../terroir-shared/.claude .claude
    ln -s ../terroir-shared/.agent-coordination .agent-coordination
    
    # Copy .env file if it exists in main repo (needed for devcontainer)
    if [ -f "../terroir-core/.env" ]; then
        cp "../terroir-core/.env" .env
        echo "✅ Copied .env file for devcontainer"
    fi
    
    # Always copy latest .devcontainer from main repo to ensure updates
    if [ -d "../terroir-core/.devcontainer" ]; then
        rm -rf .devcontainer
        cp -r "../terroir-core/.devcontainer" .devcontainer
        echo "✅ Copied latest devcontainer config for Agent $i"
    fi
    
    # Fix git worktree path for container environment
    # The parent directory gets mounted at /workspaces in the container
    # Main repo is at /workspaces/terroir-core (not /workspaces/core)
    if [ -f ".git" ]; then
        # Update .git file to point to container path (using full folder name)
        echo "gitdir: /workspaces/terroir-core/.git/worktrees/terroir-agent$i" > .git
        echo "✅ Fixed git worktree path for container"
    fi
    
    # Create .vscode directory and agent-specific override settings
    mkdir -p .vscode
    
    # Add agent-specific files to local git exclusion
    # This prevents these agent-specific overrides from being committed
    # For worktrees, use the host path to the git directory
    if [ -d ".git" ]; then
        # Regular git repo
        mkdir -p .git/info
        echo ".vscode/settings.json" >> .git/info/exclude
        echo ".env" >> .git/info/exclude
    elif [ -f ".git" ]; then
        # Git worktree - use host path to real git dir
        HOST_GIT_DIR="../terroir-core/.git/worktrees/terroir-agent$i"
        if [ -d "$HOST_GIT_DIR" ]; then
            mkdir -p "$HOST_GIT_DIR/info"
            # Check if already excluded to avoid duplicates
            if ! grep -q "^\.vscode/settings\.json$" "$HOST_GIT_DIR/info/exclude" 2>/dev/null; then
                echo ".vscode/settings.json" >> "$HOST_GIT_DIR/info/exclude"
            fi
            if ! grep -q "^\.env$" "$HOST_GIT_DIR/info/exclude" 2>/dev/null; then
                echo ".env" >> "$HOST_GIT_DIR/info/exclude"
            fi
            echo "✅ Added git exclusions for agent-specific files"
        else
            echo "⚠️  Git directory not found: $HOST_GIT_DIR"
        fi
    fi
    
    # Create agent-specific settings that override the shared repo settings
    case $i in
        1) # Agent 1 - Green theme (Utilities)
            cat > .vscode/settings.json << 'SETTINGS_EOF'
{
  "workbench.colorCustomizations": {
    "titleBar.activeBackground": "#1a4d1a",
    "titleBar.activeForeground": "#ffffff",
    "statusBar.background": "#1a4d1a",
    "statusBar.foreground": "#ffffff"
  },
  "window.title": "🟢 Agent 1 - Utilities - ${folderName}",
  "terminal.integrated.env.linux": {
    "AGENT_ROLE": "agent1",
    "AGENT_FOCUS": "utilities",
    "SETTINGS_TEST": "agent-specific"
  },
  "// TEST": "If shared settings work, formatting and extensions from main repo should still apply"
}
SETTINGS_EOF
            ;;
        2) # Agent 2 - Blue theme (Infrastructure)
            cat > .vscode/settings.json << 'SETTINGS_EOF'
{
  "workbench.colorCustomizations": {
    "titleBar.activeBackground": "#1a2d4d",
    "titleBar.activeForeground": "#ffffff",
    "statusBar.background": "#1a2d4d",
    "statusBar.foreground": "#ffffff"
  },
  "window.title": "🔵 Agent 2 - Infrastructure - ${folderName}",
  "terminal.integrated.env.linux": {
    "AGENT_ROLE": "agent2",
    "AGENT_FOCUS": "infrastructure"
  }
}
SETTINGS_EOF
            ;;
        3) # Agent 3 - Purple theme (Documentation)
            cat > .vscode/settings.json << 'SETTINGS_EOF'
{
  "workbench.colorCustomizations": {
    "titleBar.activeBackground": "#3d1a4d",
    "titleBar.activeForeground": "#ffffff",
    "statusBar.background": "#3d1a4d",
    "statusBar.foreground": "#ffffff"
  },
  "window.title": "🟣 Agent 3 - Documentation - ${folderName}",
  "terminal.integrated.env.linux": {
    "AGENT_ROLE": "agent3",
    "AGENT_FOCUS": "documentation"
  }
}
SETTINGS_EOF
            ;;
    esac
    
    echo "✅ Linked shared directories and configured Agent $i theme"
done

# No need for workspace files - using direct folder opening with settings overrides
echo "✅ Agent-specific VS Code configurations complete"

# Create initial coordination files
echo -e "\n📄 Creating initial coordination files..."

# Copy the comprehensive README if it exists
if [ -f "$REPO_DIR/.claude/multi-agent/templates/TERROIR-SHARED-README.md" ]; then
    cp "$REPO_DIR/.claude/multi-agent/templates/TERROIR-SHARED-README.md" "$PARENT_DIR/terroir-shared/README.md"
    echo "✅ Copied comprehensive README to terroir-shared"
else
    # Fallback to simple README
    cat > "$PARENT_DIR/terroir-shared/README.md" << 'EOF'
# Terroir Shared Coordination Directory

This directory enables coordination between multiple development agents.
See .claude/multi-agent/README.md in the main repo for full documentation.

## Quick Status Check
```bash
ls -la .agent-coordination/locks/     # Active file locks
ls -la .agent-coordination/claims/    # File ownership claims  
ls -la .agent-coordination/blocks/    # Current blockers
```

## Agent Workspaces
- terroir-core (main) - Integration & monitoring
- terroir-agent1 - Utilities development
- terroir-agent2 - Infrastructure & DevOps
- terroir-agent3 - Documentation

## Sync Schedule
- 10:00 AM - Morning sync
- 2:00 PM - Midday check
- 6:00 PM - End of day merge
EOF
fi

# Summary
echo -e "\n✅ Setup Complete!"
echo -e "\n📂 Directory Structure:"
echo "   $PARENT_DIR/"
echo "   ├── terroir-core/        (original)"
echo "   ├── terroir-agent1/      (utilities)"
echo "   ├── terroir-agent2/      (infrastructure)"
echo "   ├── terroir-agent3/      (documentation)"
echo "   └── terroir-shared/      (coordination)"

echo -e "\n🚀 Next Steps:"
echo "1. Open VS Code windows directly (each will have agent-specific colors):"
echo "   code $PARENT_DIR/terroir-core        # Main - Integration/Monitoring"
echo "   code $PARENT_DIR/terroir-agent1      # Agent 1 - Utilities (🟢 Green)"
echo "   code $PARENT_DIR/terroir-agent2      # Agent 2 - Infrastructure (🔵 Blue)"
echo "   code $PARENT_DIR/terroir-agent3      # Agent 3 - Documentation (🟣 Purple)"
echo ""
echo "2. Each VS Code window will:"
echo "   - Detect the devcontainer and prompt 'Reopen in Container'"
echo "   - Apply agent-specific colors (title bar and status bar)"
echo "   - Set AGENT_ROLE and AGENT_FOCUS environment variables"
echo ""
echo "3. Click 'Reopen in Container' for each window"
echo ""
echo "4. Each agent will have:"
echo "   - Shared settings from the main repo (.vscode/settings.json)"
echo "   - Agent-specific color overrides (not committed to git)"
echo "   - Environment variables for easy agent identification"
echo ""
echo "Happy parallel developing! 🎉"