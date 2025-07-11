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

# Always run from the docker directory to ensure relative paths work
cd "$SCRIPT_DIR"

# Source the agent configuration
source "$BASE_DIR/scripts/load-agent-config.sh"

# Helper function to get agent properties by number
get_agent_property() {
    local agent_num="$1"
    local property="$2"
    
    # Access associative arrays directly by agent number
    case "$property" in
        purpose) echo "${AGENT_PURPOSE[$agent_num]:-}" ;;
        branch) echo "${AGENT_BRANCH[$agent_num]:-}" ;;
        color) echo "${AGENT_COLOR[$agent_num]:-}" ;;
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
    # Get array keys in a way that works for both bash and zsh
    local keys
    if [ -n "${BASH_VERSION:-}" ]; then
        keys="${!AGENT_PURPOSE[@]}"
    elif [ -n "${ZSH_VERSION:-}" ]; then
        keys="${(k)AGENT_PURPOSE[@]}"
    else
        keys="0 1 2 3"
    fi
    
    # Iterate over agent numbers
    for num in $keys; do
        if [ -n "${AGENT_PURPOSE[$num]:-}" ] && [ "$num" != "0" ]; then
            local purpose="${AGENT_PURPOSE[$num]}"
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
    
    if [ -z "$num" ] || [ "$num" = "0" ]; then
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
    local agent_purpose=$(get_agent_property "$agent_num" "purpose")
    local agent_branch=$(get_agent_property "$agent_num" "branch")
    local agent_color=$(get_agent_property "$agent_num" "color")
    
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
        
        # Build image if it doesn't exist
        if ! docker images | grep -q "terroir-agent"; then
            echo -e "${YELLOW}Building agent image...${NC}"
            docker build -t terroir-agent:latest -f Dockerfile.agent .
        fi
        
        # Create and start container
        docker run -d \
            --name "terroir-agent${agent_num}" \
            --hostname "agent${agent_num}" \
            -it \
            --restart=no \
            -e TERM=xterm-256color \
            -e COLORTERM=truecolor \
            -e FORCE_COLOR=1 \
            -e CLICOLOR=1 \
            -e CLICOLOR_FORCE=1 \
            -e GIT_PAGER="less -R" \
            -e NODE_ENV=development \
            -e NODE_OPTIONS="--max-old-space-size=3072" \
            -e AGENT_NUMBER="${agent_num}" \
            -e AGENT_ROLE="${agent_purpose}" \
            -e AGENT_COLOR="${agent_color}" \
            -e OP_SERVICE_ACCOUNT_TOKEN="${OP_SERVICE_ACCOUNT_TOKEN:-}" \
            -e GIT_CONFIG_ITEM="${GIT_CONFIG_ITEM:-}" \
            -e GIT_SIGNING_KEY_ITEM="${GIT_SIGNING_KEY_ITEM:-}" \
            -v "${HOME}/Development/Design/terroir-core:/workspaces/terroir-core" \
            -v "${HOME}/Development/Design/terroir-agent${agent_num}:/workspaces/terroir-agent${agent_num}" \
            -w "/workspaces/terroir-agent${agent_num}" \
            --memory="4g" \
            --memory-reservation="1g" \
            --cpus="2.0" \
            --security-opt no-new-privileges:true \
            --cap-drop=ALL \
            --cap-add=CHOWN \
            --cap-add=SETUID \
            --cap-add=SETGID \
            terroir-agent:latest
        
        echo -e "${GREEN}Agent ${agent_num} created and started${NC}"
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
        # Pass TERM environment for proper color support
        docker exec -it -e TERM=xterm-256color "terroir-agent${agent_num}" /bin/zsh
    else
        echo -e "${RED}Agent ${agent_num} is not running. Start it first with: $0 start ${agent}${NC}"
        exit 1
    fi
}

# Show status
show_status() {
    echo -e "${BLUE}Agent Status:${NC}"
    echo ""
    
    # Get array keys in a way that works for both bash and zsh
    local keys
    if [ -n "${BASH_VERSION:-}" ]; then
        # Bash
        keys="${!AGENT_PURPOSE[@]}"
    elif [ -n "${ZSH_VERSION:-}" ]; then
        # Zsh
        keys="${(k)AGENT_PURPOSE[@]}"
    else
        # Fallback - just check known agent numbers
        keys="0 1 2 3"
    fi
    
    # Show agents in numerical order
    for num in $(echo "$keys" | tr ' ' '\n' | sort -n); do
        # Skip if no purpose defined for this number
        if [ -z "${AGENT_PURPOSE[$num]:-}" ]; then
            continue
        fi
        
        if [ "$num" = "0" ]; then
            echo -e "  Core (0): ${GREEN}VS Code${NC} (via devcontainer)"
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
    local agent_purpose=$(get_agent_property "$agent_num" "purpose")
    
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
    
    # Force rebuild the image
    echo -e "${GREEN}Building new agent image...${NC}"
    docker build --no-cache -t terroir-agent:latest -f Dockerfile.agent .
    
    # Start the agent (which will create new container)
    start_agent "$agent"
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
    if [ "$agent_num" = "0" ]; then
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
    local prompt_content=$(docker exec -e TERM=xterm-256color ${container_name} bash -c "cd /workspaces/terroir-core/.agents/scripts && ./prompt.sh $agent 2>&1 | tail -n +2")
    
    # Extract the temp file path from the output
    local prompt_file=$(echo "$prompt_content" | grep "Prompt file created:" | sed 's/.*Prompt file created: //')
    
    if [ -z "$prompt_file" ]; then
        echo -e "${RED}❌ Failed to generate prompt${NC}"
        echo "$prompt_content"
        exit 1
    fi
    
    # Get the actual prompt content from the container
    local prompt_text=$(docker exec -e TERM=xterm-256color ${container_name} cat "$prompt_file")
    
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