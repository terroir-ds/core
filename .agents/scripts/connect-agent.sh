#!/bin/bash

# Quick connect to running agents
# Usage: ./connect-agent.sh [agent-name]

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
YELLOW='\033[0;33m'
NC='\033[0m'

AGENT=$1

case $AGENT in
    test)
        echo -e "${GREEN}🧪 Connecting to Test Runner...${NC}"
        docker exec -it test-agent sh
        ;;
    docs)
        echo -e "${PURPLE}📚 Connecting to Docs Writer...${NC}"
        docker exec -it docs-agent sh
        ;;
    build)
        echo -e "${YELLOW}🔨 Connecting to Build Agent...${NC}"
        docker exec -it build-agent sh
        ;;
    list)
        echo -e "${BLUE}📋 Available agents:${NC}"
        docker ps --filter "name=-agent" --format "table {{.Names}}\t{{.Status}}"
        ;;
    *)
        echo -e "${RED}Usage: $0 [test|docs|build|list]${NC}"
        echo ""
        echo "Available agents:"
        echo "  test  - Test runner agent"
        echo "  docs  - Documentation agent"
        echo "  build - Build automation agent"
        echo "  list  - Show running agents"
        exit 1
        ;;
esac