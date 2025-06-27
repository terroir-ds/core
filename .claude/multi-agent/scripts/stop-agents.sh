#!/bin/bash
# stop-agents.sh - Gracefully stop all agent environments

set -e

echo "🛑 Stopping Terroir Multi-Agent Orchestra"
echo "========================================"

# Get paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PARENT_DIR="$(dirname "$(cd "$SCRIPT_DIR/../../.." && pwd)")"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Function to check and commit changes
check_and_commit() {
    local agent_id=$1
    local dir=$2
    
    if [ -d "$dir" ]; then
        cd "$dir"
        if git status --porcelain | grep -q .; then
            echo "💾 Agent $agent_id has uncommitted changes, saving..."
            git add -A
            git commit -m "chore(agent$agent_id): auto-save before shutdown - $TIMESTAMP" || true
            git push origin "$(git branch --show-current)" || true
        fi
    fi
}

# Step 1: Save any uncommitted work
echo "📝 Saving uncommitted work..."
for i in 1 2 3; do
    check_and_commit $i "$PARENT_DIR/terroir-agent$i"
done

# Step 2: Clear locks and claims
echo -e "\n🧹 Cleaning up locks and claims..."
rm -f "$PARENT_DIR/terroir-shared/.agent-coordination/locks/"*.lock
rm -f "$PARENT_DIR/terroir-shared/.agent-coordination/claims/"*

# Step 3: Stop Docker containers if running
if [ -f "$PARENT_DIR/docker-compose.agents.yml" ]; then
    echo -e "\n🐳 Stopping Docker containers..."
    cd "$PARENT_DIR"
    docker-compose -f docker-compose.agents.yml down
fi

# Step 4: Create end-of-day summary
echo -e "\n📊 Creating end-of-day summary..."
cat > "$PARENT_DIR/terroir-shared/.agent-coordination/daily-summary-$TIMESTAMP.md" << EOF
# Daily Summary - $(date +%Y-%m-%d)

## Agent Activity

EOF

for i in 1 2 3; do
    if [ -d "$PARENT_DIR/terroir-agent$i" ]; then
        cd "$PARENT_DIR/terroir-agent$i"
        BRANCH=$(git branch --show-current)
        COMMITS=$(git log --since="00:00" --oneline 2>/dev/null | wc -l)
        FILES=$(git diff --name-only origin/main...HEAD 2>/dev/null | wc -l)
        
        cat >> "$PARENT_DIR/terroir-shared/.agent-coordination/daily-summary-$TIMESTAMP.md" << EOF
### Agent $i
- Branch: $BRANCH
- Commits today: $COMMITS
- Files modified: $FILES
- Last commit: $(git log -1 --pretty=format:"%h - %s" 2>/dev/null || echo "none")

EOF
    fi
done

# Add todo status
if [ -f "$PARENT_DIR/terroir-shared/.claude/tasks/TODO.md" ]; then
    echo "## Todo Status" >> "$PARENT_DIR/terroir-shared/.agent-coordination/daily-summary-$TIMESTAMP.md"
    echo "$(grep -c '\- \[x\]' "$PARENT_DIR/terroir-shared/.claude/tasks/TODO.md" || echo 0) tasks completed" >> "$PARENT_DIR/terroir-shared/.agent-coordination/daily-summary-$TIMESTAMP.md"
    echo "$(grep -c '\- \[ \]' "$PARENT_DIR/terroir-shared/.claude/tasks/TODO.md" || echo 0) tasks remaining" >> "$PARENT_DIR/terroir-shared/.agent-coordination/daily-summary-$TIMESTAMP.md"
fi

# Step 5: Close VS Code windows (optional - commented out for safety)
# echo -e "\n💻 Closing VS Code windows..."
# pkill -f "code.*terroir-agent" || true

echo -e "\n✅ All agents stopped successfully!"
echo -e "\n📄 Daily summary saved to:"
echo "$PARENT_DIR/terroir-shared/.agent-coordination/daily-summary-$TIMESTAMP.md"
echo -e "\n👋 See you tomorrow!"

# Show final status
echo -e "\n📊 Final Status:"
"$PARENT_DIR/agent-status.sh" 2>/dev/null || echo "Status script not found"