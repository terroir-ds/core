#!/bin/bash
# open-all-agents.sh - Quick launcher for all agent folders

set -e

# Get the parent directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MAIN_REPO="$(cd "$SCRIPT_DIR/../../.." && pwd)"
PARENT_DIR="$(dirname "$MAIN_REPO")"

echo "🚀 Opening All Terroir Agent Folders"
echo "===================================="

# Check if agent directories exist
if [ ! -d "$PARENT_DIR/terroir-agent1" ]; then
    echo "❌ Agent directories not found. Run scripts/host-setup.sh first!"
    exit 1
fi

# Open all agent folders with delays to prevent overwhelming the system
echo "Opening Main repository..."
code "$MAIN_REPO" &
sleep 2

echo "Opening Agent 1 (Utilities - Green)..."
code "$PARENT_DIR/terroir-agent1" &
sleep 2

echo "Opening Agent 2 (Infrastructure - Blue)..."
code "$PARENT_DIR/terroir-agent2" &
sleep 2

echo "Opening Agent 3 (Documentation - Purple)..."
code "$PARENT_DIR/terroir-agent3" &

echo -e "\n✅ All agent folders launched!"
echo "Each will prompt to 'Reopen in Container' - click yes for each."
echo ""
echo "Window Layout:"
echo "  🎯 Main - Integration & Monitoring"
echo "  🟢 Agent 1 - Utilities"
echo "  🔵 Agent 2 - Infrastructure"
echo "  🟣 Agent 3 - Documentation"
echo ""
echo "Note: Agent-specific colors and settings will load automatically"
echo "when each container starts."