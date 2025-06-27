#!/bin/bash
# start-agents.sh - Launch all agent environments

set -e

echo "🚀 Starting Terroir Multi-Agent Orchestra"
echo "========================================"

# Get paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MAIN_REPO="$(cd "$SCRIPT_DIR/../../.." && pwd)"
PARENT_DIR="$(dirname "$MAIN_REPO")"

# Check if setup has been run
if [ ! -d "$PARENT_DIR/terroir-agent1" ]; then
    echo "❌ Setup not complete. Running setup first..."
    "$SCRIPT_DIR/setup-multi-agent.sh"
fi

# Initialize daily coordination
echo -e "\n📅 Initializing daily coordination..."
DATE=$(date +%Y-%m-%d)
cat > "$PARENT_DIR/terroir-shared/.agent-coordination/daily-plan-$DATE.md" << EOF
# Daily Plan - $DATE

## Morning Sync ⏰ 10:00 AM
- [ ] All agents pull latest changes
- [ ] Review task assignments  
- [ ] Clear any stale locks
- [ ] Plan day's work

## Midday Check ⏰ 2:00 PM
- [ ] Quick sync of progress
- [ ] Resolve any conflicts
- [ ] Adjust plans if needed

## Evening Merge ⏰ 6:00 PM
- [ ] Full integration test
- [ ] Merge all work
- [ ] Plan tomorrow

## Agent Focus Areas

### Agent 1 - Utilities
- Primary: Utility extraction and implementation
- Today: Check AGENT-REGISTRY.md for assignments

### Agent 2 - Infrastructure  
- Primary: CI/CD, build, security
- Today: Check AGENT-REGISTRY.md for assignments

### Agent 3 - Documentation
- Primary: Docs, API refs, guides
- Today: Check AGENT-REGISTRY.md for assignments

## Notes
- Check for blocks every 30 minutes
- Commit every 30-60 minutes
- Communicate changes to shared files
EOF

# Clear old locks
echo -e "\n🧹 Clearing old locks..."
rm -f "$PARENT_DIR/terroir-shared/.agent-coordination/locks/"*.lock
rm -f "$PARENT_DIR/terroir-shared/.agent-coordination/claims/"*

# Update each agent's branch
echo -e "\n🔄 Updating agent branches..."
cd "$MAIN_REPO"
git fetch origin

for i in 1 2 3; do
    echo "Updating Agent $i..."
    cd "$PARENT_DIR/terroir-agent$i"
    git pull origin main --rebase || true
    
    # Install dependencies if needed
    if [ -f "pnpm-lock.yaml" ]; then
        echo "Installing dependencies for Agent $i..."
        pnpm install
    fi
done

# Start Docker containers if using Docker
if [ -f "$PARENT_DIR/docker-compose.agents.yml" ]; then
    echo -e "\n🐳 Starting Docker containers..."
    cd "$PARENT_DIR"
    docker-compose -f docker-compose.agents.yml up -d
    
    # Wait for containers to be ready
    sleep 5
    
    echo -e "\n📦 Container status:"
    docker ps --filter "name=terroir-agent" --format "table {{.Names}}\t{{.Status}}"
fi

# Open VS Code windows
echo -e "\n💻 Opening VS Code windows..."

# Function to open VS Code with retry
open_vscode() {
    local workspace=$1
    local attempt=1
    
    while [ $attempt -le 3 ]; do
        if code "$workspace" 2>/dev/null; then
            return 0
        fi
        echo "Retry $attempt for $workspace..."
        sleep 2
        ((attempt++))
    done
    
    echo "❌ Failed to open $workspace"
    return 1
}

# Open each agent workspace
open_vscode "$PARENT_DIR/terroir-agent1.code-workspace" &
sleep 2
open_vscode "$PARENT_DIR/terroir-agent2.code-workspace" &
sleep 2
open_vscode "$PARENT_DIR/terroir-agent3.code-workspace" &

# Create quick status script
cat > "$PARENT_DIR/agent-status.sh" << 'EOF'
#!/bin/bash
echo "🤖 Agent Status Report"
echo "===================="
echo ""

# Check git status for each agent
for i in 1 2 3; do
    echo "Agent $i:"
    cd "$(dirname "$0")/terroir-agent$i"
    echo "  Branch: $(git branch --show-current)"
    echo "  Status: $(git status --porcelain | wc -l) uncommitted changes"
    echo ""
done

# Check for locks
echo "🔒 Active Locks:"
ls -la "$(dirname "$0")/terroir-shared/.agent-coordination/locks/" 2>/dev/null || echo "  None"
echo ""

# Check for claims
echo "📋 Active Claims:"
ls -la "$(dirname "$0")/terroir-shared/.agent-coordination/claims/" 2>/dev/null || echo "  None"
echo ""

# Check for blocks
echo "🚧 Active Blocks:"
ls -la "$(dirname "$0")/terroir-shared/.agent-coordination/blocks/" 2>/dev/null || echo "  None"
EOF

chmod +x "$PARENT_DIR/agent-status.sh"

echo -e "\n✅ All agents started successfully!"
echo -e "\n📊 Quick commands:"
echo "  - Status: $PARENT_DIR/agent-status.sh"
echo "  - Sync: $SCRIPT_DIR/sync-agents.sh"
echo "  - Stop: $SCRIPT_DIR/stop-agents.sh"
echo -e "\n🎯 Next steps:"
echo "1. Switch to each VS Code window"
echo "2. Start Claude in each terminal"
echo "3. Assign tasks from the shared todo list"
echo "4. Happy parallel developing! 🚀"

# Show initial status
echo -e "\n📊 Initial Status:"
"$PARENT_DIR/agent-status.sh"