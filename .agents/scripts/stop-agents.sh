#!/bin/bash

# Stop and remove all agent containers

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛑 Stopping Multi-Agent Environment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Find all agent containers
AGENTS=$(docker ps -a --filter "name=-agent" --format "{{.Names}}")

if [ -z "$AGENTS" ]; then
    echo -e "${YELLOW}No agent containers found.${NC}"
    exit 0
fi

# Stop and remove each agent
for agent in $AGENTS; do
    echo -e "${RED}Stopping ${agent}...${NC}"
    docker stop ${agent} > /dev/null 2>&1
    docker rm ${agent} > /dev/null 2>&1
    echo -e "${GREEN}✓ ${agent} removed${NC}"
done

echo -e "\n${GREEN}✓ All agents stopped and removed${NC}"