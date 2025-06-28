#!/bin/bash

# Docker-based multi-agent launcher
# Starts lightweight containers for secondary agents

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
YELLOW='\033[0;33m'
NC='\033[0m'

# Configuration
WORKSPACE_DIR=$(pwd)
NODE_IMAGE="node:20-alpine"

echo -e "${BLUE}🚀 Starting Multi-Agent Environment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Function to start an agent
start_agent() {
    local name=$1
    local role=$2
    local color=$3
    local prompt_color=$4
    
    # Check if container already exists
    if docker ps -a --format '{{.Names}}' | grep -q "^${name}$"; then
        echo -e "${YELLOW}⚠️  Removing existing ${name}...${NC}"
        docker rm -f ${name} > /dev/null 2>&1
    fi
    
    echo -e "${color}Starting ${role}...${NC}"
    
    docker run -d \
        --name ${name} \
        -v ${WORKSPACE_DIR}:/workspace \
        -w /workspace \
        -e AGENT_ROLE="${role}" \
        -e TERM=xterm-256color \
        -e PS1="[${prompt_color}${role}\\033[0m] \\w $ " \
        ${NODE_IMAGE} \
        sh -c "apk add --no-cache git && tail -f /dev/null" > /dev/null
    
    echo -e "${GREEN}✓ ${role} started${NC}"
}

# Start agents
start_agent "test-agent" "TEST" "${GREEN}" "\\033[32m"
start_agent "docs-agent" "DOCS" "${PURPLE}" "\\033[35m"
start_agent "build-agent" "BUILD" "${YELLOW}" "\\033[33m"

echo -e "\n${BLUE}📋 Active Agents:${NC}"
docker ps --filter "name=-agent" --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"

echo -e "\n${BLUE}🔗 Connect to agents:${NC}"
echo -e "  ${GREEN}docker exec -it test-agent sh${NC}    # Test runner"
echo -e "  ${PURPLE}docker exec -it docs-agent sh${NC}    # Documentation"
echo -e "  ${YELLOW}docker exec -it build-agent sh${NC}   # Build tasks"

echo -e "\n${BLUE}💡 Tips:${NC}"
echo "  • Use ./connect-agent.sh [test|docs|build] for quick access"
echo "  • Agents share the current directory as /workspace"
echo "  • Run ./stop-agents.sh to clean up"