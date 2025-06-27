#!/bin/bash
# open-all-workspaces.sh - Quick launcher for all 4 workspaces

set -e

# Get the parent directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MAIN_REPO="$(cd "$SCRIPT_DIR/../../.." && pwd)"
PARENT_DIR="$(dirname "$MAIN_REPO")"

echo "🚀 Opening All Terroir Workspaces"
echo "================================="

# Check if workspace files exist
if [ ! -f "$PARENT_DIR/terroir-main.code-workspace" ]; then
    echo "❌ Workspace files not found. Run host-setup.sh first!"
    exit 1
fi

# Open all workspaces with delays to prevent overwhelming the system
echo "Opening Main workspace..."
code "$PARENT_DIR/terroir-main.code-workspace" &
sleep 2

echo "Opening Agent 1 (Utilities - Green)..."
code "$PARENT_DIR/terroir-agent1.code-workspace" &
sleep 2

echo "Opening Agent 2 (Infrastructure - Blue)..."
code "$PARENT_DIR/terroir-agent2.code-workspace" &
sleep 2

echo "Opening Agent 3 (Documentation - Purple)..."
code "$PARENT_DIR/terroir-agent3.code-workspace" &

echo -e "\n✅ All workspaces launched!"
echo "Each will prompt to 'Reopen in Container' - click yes for each."
echo ""
echo "Window Layout:"
echo "  🎯 Main - Integration & Monitoring"
echo "  🟢 Agent 1 - Utilities"
echo "  🔵 Agent 2 - Infrastructure"
echo "  🟣 Agent 3 - Documentation"