#!/usr/bin/env bash
# Quick status check for current agent and coordination state

echo "🔍 Agent Status Report - $(date +%H:%M:%S)"
echo "========================================"

# Current agent info
echo -e "\n📍 Current Agent:"
pwd
git branch --show-current
echo "Uncommitted: $(git status --porcelain | wc -l) files"

# Check locks
echo -e "\n🔒 Active Locks:"
if [ -d "/workspaces/terroir-core/.agent-coordination/locks" ]; then
    ls /workspaces/terroir-core/.agent-coordination/locks/ 2>/dev/null | grep -v "^$" || echo "  None"
else
    echo "  Lock directory not found"
fi

# Check blocks
echo -e "\n🚧 Active Blocks:"
if [ -d "/workspaces/terroir-core/.agent-coordination/blocks" ]; then
    ls /workspaces/terroir-core/.agent-coordination/blocks/ 2>/dev/null | grep -v "^$" || echo "  None"
else
    echo "  Block directory not found"
fi

# Recent activity
echo -e "\n📝 Recent Commits:"
git log --oneline -5 2>/dev/null || echo "  No commits yet"

# Check for conflicts
echo -e "\n⚠️  Potential Conflicts:"
git status | grep -E "(both modified|deleted by us|deleted by them)" || echo "  None detected"

echo -e "\n✅ Status check complete"