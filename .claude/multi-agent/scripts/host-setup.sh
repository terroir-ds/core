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

# Check for old terroir-shared setup
if [ -d "$PARENT_DIR/terroir-shared" ]; then
    echo "⚠️  Found existing terroir-shared directory from old setup."
    echo "   You should run the migration script first:"
    echo ""
    echo "   $REPO_DIR/.claude/multi-agent/scripts/migrate-from-shared.sh"
    echo ""
    echo "   This will migrate your coordination files to terroir-core."
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled. Please run migration first."
        exit 1
    fi
fi

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

# Create coordination directories in main repo (source of truth)
echo -e "\n📁 Creating coordination directories in terroir-core..."
mkdir -p "$REPO_DIR/.agent-coordination/locks"
mkdir -p "$REPO_DIR/.agent-coordination/claims"
mkdir -p "$REPO_DIR/.agent-coordination/blocks"
echo "✅ Created .agent-coordination structure in terroir-core"

# Configure agent-specific settings
echo -e "\n⚙️ Configuring agent-specific VS Code settings..."
for i in 1 2 3; do
    AGENT_DIR="$PARENT_DIR/terroir-agent$i"
    cd "$AGENT_DIR"
    
    # Remove existing directories/links and any nested devcontainer copies
    rm -rf .claude .agent-coordination 2>/dev/null || true
    rm -rf .devcontainer/.devcontainer 2>/dev/null || true
    
    # Note: Symbolic links to terroir-core directories will be created inside the container
    # by post-create.sh to ensure they use the correct container paths
    
    # Copy .env file if it exists in main repo (needed for devcontainer)
    if [ -f "../terroir-core/.env" ]; then
        cp "../terroir-core/.env" .env
        echo "✅ Copied .env file for devcontainer"
    fi
    
    # Copy .devcontainer from main repo and use agent-specific config
    if [ -d "../terroir-core/.devcontainer" ]; then
        rm -rf .devcontainer
        cp -r "../terroir-core/.devcontainer" .devcontainer
        
        # Use agent-specific devcontainer.json if template exists
        if [ -f "../terroir-core/.claude/multi-agent/templates/agent-devcontainer.json" ]; then
            cp "../terroir-core/.claude/multi-agent/templates/agent-devcontainer.json" .devcontainer/devcontainer.json
            echo "✅ Copied agent-specific devcontainer config for Agent $i"
        else
            echo "✅ Copied devcontainer config for Agent $i"
        fi
    fi
    
    # Copy latest scripts to ensure agents have updated post-create.sh
    if [ -d "../terroir-core/scripts" ]; then
        rm -rf scripts
        cp -r "../terroir-core/scripts" scripts
        echo "✅ Copied latest scripts for Agent $i"
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
        echo ".devcontainer/" >> .git/info/exclude
        echo "scripts/" >> .git/info/exclude
        echo ".claude" >> .git/info/exclude
        echo ".agent-coordination" >> .git/info/exclude
    elif [ -f ".git" ]; then
        # Git worktree - use host path to real git dir
        HOST_GIT_DIR="../terroir-core/.git/worktrees/terroir-agent$i"
        if [ -d "$HOST_GIT_DIR" ]; then
            mkdir -p "$HOST_GIT_DIR/info"
            
            # Clean up any duplicate entries first
            if [ -f "$HOST_GIT_DIR/info/exclude" ]; then
                # Create a temporary file with unique entries
                sort -u "$HOST_GIT_DIR/info/exclude" > "$HOST_GIT_DIR/info/exclude.tmp"
                mv "$HOST_GIT_DIR/info/exclude.tmp" "$HOST_GIT_DIR/info/exclude"
                echo "✅ Cleaned up duplicate entries in git exclude file"
            fi
            
            # Add exclusions if not already present
            EXCLUSIONS=(
                ".vscode/settings.json"
                ".env"
                ".devcontainer/"
                "scripts/"
                ".claude"
                ".agent-coordination"
            )
            
            for exclusion in "${EXCLUSIONS[@]}"; do
                if ! grep -q "^${exclusion}$" "$HOST_GIT_DIR/info/exclude" 2>/dev/null; then
                    echo "$exclusion" >> "$HOST_GIT_DIR/info/exclude"
                fi
            done
            
            echo "✅ Added git exclusions for agent-specific files"
        else
            echo "⚠️  Git directory not found: $HOST_GIT_DIR"
        fi
    fi
    
    # Always recreate agent-specific settings (even after merges)
    # This ensures agents maintain their custom settings
    mkdir -p .vscode
    
    # Start with shared settings if they exist
    if [ -f "../terroir-core/.vscode/settings.json" ]; then
        cp "../terroir-core/.vscode/settings.json" .vscode/settings.json
    else
        echo '{}' > .vscode/settings.json
    fi
    
    # Create a temporary file with agent-specific overrides
    case $i in
        1) # Agent 1 - Green theme (Utilities)
            cat > .vscode/agent-overrides.json << 'SETTINGS_EOF'
{
  "workbench.colorCustomizations": {
    "titleBar.activeBackground": "#1a4d1a",
    "titleBar.activeForeground": "#ffffff",
    "titleBar.inactiveBackground": "#0d260d",
    "titleBar.inactiveForeground": "#cccccc",
    "statusBar.background": "#1a4d1a",
    "statusBar.foreground": "#ffffff",
    "activityBar.background": "#1a4d1a",
    "activityBar.foreground": "#ffffff",
    "activityBar.inactiveForeground": "#cccccc"
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
            cat > .vscode/agent-overrides.json << 'SETTINGS_EOF'
{
  "workbench.colorCustomizations": {
    "titleBar.activeBackground": "#1a2d4d",
    "titleBar.activeForeground": "#ffffff",
    "titleBar.inactiveBackground": "#0d1626",
    "titleBar.inactiveForeground": "#cccccc",
    "statusBar.background": "#1a2d4d",
    "statusBar.foreground": "#ffffff",
    "activityBar.background": "#1a2d4d",
    "activityBar.foreground": "#ffffff",
    "activityBar.inactiveForeground": "#cccccc"
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
            cat > .vscode/agent-overrides.json << 'SETTINGS_EOF'
{
  "workbench.colorCustomizations": {
    "titleBar.activeBackground": "#3d1a4d",
    "titleBar.activeForeground": "#ffffff",
    "titleBar.inactiveBackground": "#1f0d26",
    "titleBar.inactiveForeground": "#cccccc",
    "statusBar.background": "#3d1a4d",
    "statusBar.foreground": "#ffffff",
    "activityBar.background": "#3d1a4d",
    "activityBar.foreground": "#ffffff",
    "activityBar.inactiveForeground": "#cccccc"
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
    
    # Merge shared settings with agent overrides
    # Using node/jq if available, otherwise simple replacement
    if command -v node >/dev/null 2>&1; then
        # Use node to merge JSON files
        node -e "
            const fs = require('fs');
            const shared = JSON.parse(fs.readFileSync('.vscode/settings.json', 'utf8'));
            const overrides = JSON.parse(fs.readFileSync('.vscode/agent-overrides.json', 'utf8'));
            const merged = { ...shared, ...overrides };
            // Deep merge for nested objects like workbench.colorCustomizations
            for (const key in overrides) {
                if (typeof overrides[key] === 'object' && typeof shared[key] === 'object') {
                    merged[key] = { ...shared[key], ...overrides[key] };
                }
            }
            fs.writeFileSync('.vscode/settings.json', JSON.stringify(merged, null, 2));
        "
    else
        # Fallback: just use agent overrides (less ideal but works)
        cp .vscode/agent-overrides.json .vscode/settings.json
    fi
    
    # Clean up temporary file
    rm -f .vscode/agent-overrides.json
    
    echo "✅ Configured Agent $i theme and settings"
done

# No need for workspace files - using direct folder opening with settings overrides
echo "✅ Agent-specific VS Code configurations complete"

# Create initial agent registry file if it doesn't exist
if [ ! -f "$REPO_DIR/.claude/tasks/AGENT-REGISTRY.md" ]; then
    echo -e "\n📄 Creating initial agent registry..."
    mkdir -p "$REPO_DIR/.claude/tasks"
    cat > "$REPO_DIR/.claude/tasks/AGENT-REGISTRY.md" << 'EOF'
# Agent Task Registry

Last Updated: $(date)

## Active Agents

| Agent | Branch | Focus Area | Current Task |
|-------|--------|------------|--------------|
| Main | main | Integration & Orchestration | Coordinating multi-agent development |
| Agent 1 | feat/utilities | Utility Development | Awaiting assignment |
| Agent 2 | feat/infrastructure | Infrastructure & DevOps | Awaiting assignment |
| Agent 3 | feat/documentation | Documentation | Awaiting assignment |

## Task Assignments

### In Progress
- [ ] Initial setup and coordination (Main)

### Queued
- [ ] Extract utility functions from logger (@utils/security)
- [ ] Set up GitHub Actions CI/CD
- [ ] Create TypeDoc configuration

### Completed
- [x] Multi-agent development environment setup
EOF
    echo "✅ Created agent registry"
fi

# Summary
echo -e "\n✅ Setup Complete!"
echo -e "\n📂 Directory Structure:"
echo "   $PARENT_DIR/"
echo "   ├── terroir-core/        (main - source of truth)"
echo "   ├── terroir-agent1/      (utilities worktree)"
echo "   ├── terroir-agent2/      (infrastructure worktree)"
echo "   └── terroir-agent3/      (documentation worktree)"

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
echo "📝 Note about VS Code settings and devcontainer:"
echo "   - .vscode/settings.json and .devcontainer/devcontainer.json are in .gitignore"
echo "   - This preserves agent-specific configurations through merges"
echo "   - To update shared configs: edit in main repo, then re-run this script"
echo "   - Agents should NOT edit these files directly"
echo ""
echo "Happy parallel developing! 🎉"