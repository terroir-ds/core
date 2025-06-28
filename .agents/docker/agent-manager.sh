#!/usr/bin/env bash
# Agent container management script

set -euo pipefail

# Script directory (works with both bash and zsh)
if [ -n "${BASH_SOURCE[0]:-}" ]; then
    # Bash
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
else
    # Zsh
    SCRIPT_DIR="$(cd "$(dirname "${0:a}")" && pwd)"
fi
BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source the agent configuration
source "$BASE_DIR/scripts/load-agent-config.sh"

# Helper function to get agent properties by number
get_agent_property() {
    local agent_num="$1"
    local property="$2"
    
    local idx=$(find_agent_index "$agent_num")
    if [ -z "$idx" ]; then
        return 1
    fi
    
    case "$property" in
        purpose) echo "${AGENT_PURPOSE[$idx]}" ;;
        branch) echo "${AGENT_BRANCH[$idx]}" ;;
        color) echo "${AGENT_COLOR[$idx]}" ;;
        *) return 1 ;;
    esac
}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Help function
show_help() {
    echo "Agent Container Manager"
    echo ""
    echo "Usage: $0 <command> [agent]"
    echo ""
    echo "Commands:"
    echo "  start [agent]    - Start agent container (reuses existing if available)"
    echo "  stop [agent]     - Stop agent container (preserves state)"
    echo "  restart [agent]  - Restart agent container"
    echo "  connect [agent]  - Connect to running agent"
    echo "  status           - Show status of all agents"
    echo "  rebuild [agent]  - Force rebuild of agent container"
    echo "  clean [agent]    - Remove agent container (loses state)"
    echo "  logs [agent]     - Show agent logs"
    echo "  prompt [agent]   - Generate Claude prompt and copy to clipboard"
    echo ""
    echo "Agents:"
    local i
    for i in "${!AGENT_NUMS[@]}"; do
        local num="${AGENT_NUMS[$i]}"
        local purpose="${AGENT_PURPOSE[$i]}"
        if [ "$num" != "0" ]; then
            echo "  $num or $purpose"
        fi
    done
    echo ""
    echo "Examples:"
    echo "  $0 start 1               # Start agent 1"
    echo "  $0 connect utilities     # Connect to utilities agent"
    echo "  $0 status                # Show all agents status"
}

# Resolve agent input to number
get_agent_number() {
    local input=$1
    local num=$(resolve_agent_number "$input")
    
    if [ -z "$num" ] || [ "$num" == "0" ]; then
        echo "Error: Invalid agent '$input'. Core agent (0) doesn't run in Docker." >&2
        return 1
    fi
    
    echo "$num"
}

# Check if agent exists
agent_exists() {
    local agent=$1
    local agent_num=$(get_agent_number "$agent") || return 1
    docker ps -a --format "table {{.Names}}" | grep -q "^terroir-agent${agent_num}$"
}

# Check if agent is running
agent_running() {
    local agent=$1
    local agent_num=$(get_agent_number "$agent") || return 1
    docker ps --format "table {{.Names}}" | grep -q "^terroir-agent${agent_num}$"
}

# Start agent
start_agent() {
    local agent=${1:-1}
    local agent_num=$(get_agent_number "$agent") || return 1
    local agent_purpose="${AGENT_PURPOSE[$agent_num]}"
    
    echo -e "${BLUE}Starting agent ${agent_num} (${agent_purpose})...${NC}"
    
    # Check if container exists
    if agent_exists "$agent"; then
        if agent_running "$agent"; then
            echo -e "${YELLOW}Agent ${agent_num} is already running${NC}"
        else
            echo -e "${GREEN}Starting existing agent ${agent_num} container...${NC}"
            docker start "terroir-agent${agent_num}"
        fi
    else
        echo -e "${GREEN}Creating new agent ${agent_num} container...${NC}"
        docker-compose up -d "agent${agent_num}"
    fi
}

# Stop agent
stop_agent() {
    local agent=${1:-1}
    local agent_num=$(get_agent_number "$agent") || return 1
    local agent_purpose="${AGENT_PURPOSE[$agent_num]}"
    
    echo -e "${BLUE}Stopping agent ${agent_num} (${agent_purpose})...${NC}"
    
    if agent_running "$agent"; then
        docker stop "terroir-agent${agent_num}"
        echo -e "${GREEN}Agent ${agent_num} stopped (state preserved)${NC}"
    else
        echo -e "${YELLOW}Agent ${agent_num} is not running${NC}"
    fi
}

# Connect to agent
connect_agent() {
    local agent=${1:-1}
    local agent_num=$(get_agent_number "$agent") || return 1
    local agent_purpose="${AGENT_PURPOSE[$agent_num]}"
    
    if agent_running "$agent"; then
        echo -e "${GREEN}Connecting to agent ${agent_num} (${agent_purpose})...${NC}"
        docker exec -it "terroir-agent${agent_num}" /bin/zsh
    else
        echo -e "${RED}Agent ${agent_num} is not running. Start it first with: $0 start ${agent}${NC}"
        exit 1
    fi
}

# Show status
show_status() {
    echo -e "${BLUE}Agent Status:${NC}"
    echo ""
    
    # Show agents in numerical order
    for num in $(echo "${!AGENT_PURPOSE[@]}" | tr ' ' '\n' | sort -n); do
        if [ "$num" == "0" ]; then
            echo -e "  Core (0): ${GREEN}VS Code${NC} (not dockerized)"
            continue
        fi
        
        local purpose="${AGENT_PURPOSE[$num]}"
        if agent_exists "$num"; then
            if agent_running "$num"; then
                echo -e "  Agent $num ($purpose): ${GREEN}Running${NC}"
            else
                echo -e "  Agent $num ($purpose): ${YELLOW}Stopped${NC} (container exists)"
            fi
        else
            echo -e "  Agent $num ($purpose): ${RED}Not created${NC}"
        fi
    done
}

# Rebuild agent
rebuild_agent() {
    local agent=${1:-1}
    local agent_num=$(get_agent_number "$agent") || return 1
    local agent_purpose="${AGENT_PURPOSE[$agent_num]}"
    
    echo -e "${BLUE}Rebuilding agent ${agent_num} (${agent_purpose})...${NC}"
    
    # Stop if running
    if agent_running "$agent"; then
        echo -e "${YELLOW}Stopping agent ${agent_num}...${NC}"
        docker stop "terroir-agent${agent_num}"
    fi
    
    # Remove container
    if agent_exists "$agent"; then
        echo -e "${YELLOW}Removing old agent ${agent_num} container...${NC}"
        docker rm "terroir-agent${agent_num}"
    fi
    
    # Rebuild and start
    echo -e "${GREEN}Building new agent ${agent_num} container...${NC}"
    docker-compose build "agent${agent_num}"
    docker-compose up -d "agent${agent_num}"
}

# Clean agent
clean_agent() {
    local agent=${1:-1}
    local agent_num=$(get_agent_number "$agent") || return 1
    local agent_purpose="${AGENT_PURPOSE[$agent_num]}"
    
    echo -e "${BLUE}Cleaning agent ${agent_num} (${agent_purpose})...${NC}"
    
    # Stop if running
    if agent_running "$agent"; then
        docker stop "terroir-agent${agent_num}"
    fi
    
    # Remove container
    if agent_exists "$agent"; then
        docker rm "terroir-agent${agent_num}"
        echo -e "${GREEN}Agent ${agent_num} removed${NC}"
    else
        echo -e "${YELLOW}Agent ${agent_num} doesn't exist${NC}"
    fi
}

# Show logs
show_logs() {
    local agent=${1:-1}
    local agent_num=$(get_agent_number "$agent") || return 1
    
    if agent_exists "$agent"; then
        docker logs -f "terroir-agent${agent_num}"
    else
        echo -e "${RED}Agent ${agent_num} doesn't exist${NC}"
        exit 1
    fi
}

# Generate prompt and copy to clipboard
generate_prompt() {
    local agent=${1:-1}
    local agent_num=$(get_agent_number "$agent") || return 1
    
    # Special handling for core
    if [ "$agent_num" == "0" ]; then
        # Core runs locally, not in container
        echo -e "${GREEN}🏠 Generating Core agent prompt...${NC}"
        cd "$BASE_DIR/scripts"
        ./prompt.sh core
        return
    fi
    
    # Check if container is running
    local container_name="terroir-agent${agent_num}"
    if ! docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        echo -e "${RED}❌ Agent ${agent_num} is not running${NC}"
        echo "   Start it with: $0 start ${agent}"
        exit 1
    fi
    
    # Generate prompt inside container and output to stdout
    echo -e "${GREEN}📝 Generating prompt for Agent ${agent_num}...${NC}"
    local prompt_content=$(docker exec ${container_name} bash -c "cd /workspaces/terroir-core/.agents/scripts && ./prompt.sh $agent 2>&1 | tail -n +2")
    
    # Extract the temp file path from the output
    local prompt_file=$(echo "$prompt_content" | grep "Prompt file created:" | sed 's/.*Prompt file created: //')
    
    if [ -z "$prompt_file" ]; then
        echo -e "${RED}❌ Failed to generate prompt${NC}"
        echo "$prompt_content"
        exit 1
    fi
    
    # Get the actual prompt content from the container
    local prompt_text=$(docker exec ${container_name} cat "$prompt_file")
    
    # Copy to host clipboard
    if command -v xclip >/dev/null 2>&1; then
        echo "$prompt_text" | xclip -selection clipboard
        echo -e "${GREEN}✅ Prompt copied to host clipboard!${NC}"
    elif command -v pbcopy >/dev/null 2>&1; then
        echo "$prompt_text" | pbcopy
        echo -e "${GREEN}✅ Prompt copied to host clipboard!${NC}"
    else
        # Fallback: save to host temp file
        local host_prompt_file="/tmp/${agent}-claude-prompt.txt"
        echo "$prompt_text" > "$host_prompt_file"
        echo -e "${YELLOW}📋 Prompt saved to: $host_prompt_file${NC}"
        echo "   Copy with: cat $host_prompt_file | xclip -selection clipboard"
    fi
    
    # Show the same info as the container script
    echo "$prompt_content" | grep -E "(Agent -|Next steps:|Alternative|📋)" | grep -v "xclip"
    echo ""
    echo "Next steps:"
    echo "   1. Open claude.ai in your browser"
    echo "   2. Start a new conversation"
    echo "   3. Paste (Ctrl+V) - the prompt is already in your clipboard!"
}

# Main command handler
case "${1:-help}" in
    start)
        start_agent "${2:-}"
        ;;
    stop)
        stop_agent "${2:-}"
        ;;
    restart)
        stop_agent "${2:-}"
        sleep 1
        start_agent "${2:-}"
        ;;
    connect)
        connect_agent "${2:-}"
        ;;
    status)
        show_status
        ;;
    rebuild)
        rebuild_agent "${2:-}"
        ;;
    clean)
        clean_agent "${2:-}"
        ;;
    logs)
        show_logs "${2:-}"
        ;;
    prompt)
        generate_prompt "${2:-}"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac