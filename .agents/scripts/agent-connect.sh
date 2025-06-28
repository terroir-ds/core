#!/bin/bash
# Quick connect script for agents with tmux integration

set -euo pipefail

AGENT="${1:-}"
MANAGER_SCRIPT="$(dirname "$0")/agent-manager.sh"

# Colors
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
NC='\033[0m'

# Show available agents if none specified
if [ -z "$AGENT" ]; then
    echo -e "${CYAN}Quick Agent Connect${NC}"
    echo ""
    echo "Usage: $0 <agent>"
    echo ""
    echo "Available agents:"
    echo "  test     - Testing and test coverage"
    echo "  docs     - Documentation generation"
    echo "  build    - Build processes"
    echo "  refactor - Code refactoring"
    echo "  perf     - Performance testing"
    echo ""
    echo -e "${YELLOW}Tip: You can also use shortcuts:${NC}"
    echo "  t -> test"
    echo "  d -> docs"
    echo "  b -> build"
    echo "  r -> refactor"
    echo "  p -> perf"
    exit 0
fi

# Handle shortcuts
case "$AGENT" in
    t) AGENT="test" ;;
    d) AGENT="docs" ;;
    b) AGENT="build" ;;
    r) AGENT="refactor" ;;
    p) AGENT="perf" ;;
esac

# Connect to agent
exec "$MANAGER_SCRIPT" connect "$AGENT"