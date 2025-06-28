#!/bin/bash
# start-minimal-agents.sh - Start only Core + Agent 1 for reduced resource usage

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

echo -e "${GREEN}Starting Minimal Multi-Agent Setup (Core + Agent 1)${NC}"
echo -e "${YELLOW}This setup uses ~50% less resources than the full 4-agent configuration${NC}"
echo

# Check if we're in a devcontainer
if [ -f /.dockerenv ]; then
    echo -e "${RED}Error: This script should be run from your host machine, not inside a container${NC}"
    exit 1
fi

# Check if VS Code CLI is available
if ! command -v code &> /dev/null; then
    echo -e "${RED}Error: VS Code CLI 'code' command not found${NC}"
    echo "Please ensure VS Code is installed and the 'code' command is in your PATH"
    exit 1
fi

# Create workspace directories if they don't exist
echo "Setting up workspace directories..."
mkdir -p "$PROJECT_ROOT/.agents/workspaces/core"
mkdir -p "$PROJECT_ROOT/.agents/workspaces/agent-1"

# Open Core workspace
echo -e "${GREEN}Opening Core workspace...${NC}"
code "$PROJECT_ROOT" --folder-uri "vscode-remote://dev-container+$(printf '%s' "$PROJECT_ROOT" | xxd -p | tr -d '\n')/workspaces/terroir-core" --new-window

# Wait a moment for the first window to start
echo "Waiting for Core workspace to initialize..."
sleep 5

# Open Agent 1 workspace
echo -e "${GREEN}Opening Agent 1 workspace...${NC}"
# Create agent-specific devcontainer if needed
AGENT_1_DEVCONTAINER="$PROJECT_ROOT/.agents/workspaces/agent-1/.devcontainer"
if [ ! -f "$AGENT_1_DEVCONTAINER/devcontainer.json" ]; then
    echo "Creating Agent 1 devcontainer configuration..."
    mkdir -p "$AGENT_1_DEVCONTAINER"
    cp "$PROJECT_ROOT/.agents/templates/devcontainer.json" "$AGENT_1_DEVCONTAINER/devcontainer.json"
fi

# Open Agent 1 with its own devcontainer
code "$PROJECT_ROOT/.agents/workspaces/agent-1" --folder-uri "vscode-remote://dev-container+$(printf '%s' "$PROJECT_ROOT/.agents/workspaces/agent-1" | xxd -p | tr -d '\n')/workspaces/terroir-core" --new-window

echo
echo -e "${GREEN}✅ Minimal multi-agent setup started!${NC}"
echo
echo "You now have 2 VS Code windows open:"
echo "  • Core: Main development workspace"
echo "  • Agent 1: Auxiliary workspace for parallel tasks"
echo
echo -e "${YELLOW}Tips for efficient development:${NC}"
echo "  • Use Core for primary development"
echo "  • Use Agent 1 for testing, documentation, or auxiliary tasks"
echo "  • Use OS tools (Activity Monitor, htop) to track resource usage"
echo "  • Close Agent 1 when not needed to free resources"
echo
echo -e "${GREEN}Happy coding! 🚀${NC}"