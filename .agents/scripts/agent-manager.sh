#!/bin/bash
# Multi-agent container management script
# Provides unified interface for starting, stopping, and connecting to agents

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="${COMPOSE_FILE:-$(dirname "$0")/../docker/docker-compose.yml}"
PROJECT_NAME="terroir-agents"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if docker and docker-compose are available
check_dependencies() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
}

# Start all agents
start_agents() {
    local agents="${1:-all}"
    
    log_info "Starting agents..."
    
    if [ "$agents" = "all" ]; then
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d
    else
        # Start specific agents
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d $agents
    fi
    
    if [ $? -eq 0 ]; then
        log_success "Agents started successfully"
        list_agents
    else
        log_error "Failed to start agents"
        exit 1
    fi
}

# Stop agents
stop_agents() {
    local agents="${1:-all}"
    
    log_info "Stopping agents..."
    
    if [ "$agents" = "all" ]; then
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down
    else
        # Stop specific agents
        for agent in $agents; do
            docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" stop "$agent"
            docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" rm -f "$agent"
        done
    fi
    
    if [ $? -eq 0 ]; then
        log_success "Agents stopped successfully"
    else
        log_error "Failed to stop agents"
        exit 1
    fi
}

# List running agents
list_agents() {
    echo -e "\n${CYAN}Running Agents:${NC}"
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"
}

# Connect to an agent
connect_agent() {
    local agent="${1:-}"
    
    if [ -z "$agent" ]; then
        log_error "Please specify an agent to connect to"
        echo "Available agents: test, docs, build, refactor, perf"
        exit 1
    fi
    
    local container_name="terroir-${agent}-agent"
    
    # Check if container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        log_error "Agent '$agent' is not running"
        echo "Start it with: $0 start $agent-agent"
        exit 1
    fi
    
    # Connect with appropriate color prompt
    log_info "Connecting to $agent agent..."
    echo -e "${YELLOW}Tip: Use 'exit' to disconnect${NC}\n"
    
    docker exec -it "$container_name" /bin/zsh
}

# Show agent logs
show_logs() {
    local agent="${1:-}"
    local follow="${2:-}"
    
    local flags=""
    if [ "$follow" = "-f" ] || [ "$follow" = "--follow" ]; then
        flags="-f"
    fi
    
    if [ -z "$agent" ]; then
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs $flags
    else
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs $flags "${agent}-agent"
    fi
}

# Execute command in agent
exec_in_agent() {
    local agent="$1"
    shift
    local cmd="$@"
    
    if [ -z "$agent" ] || [ -z "$cmd" ]; then
        log_error "Usage: $0 exec <agent> <command>"
        exit 1
    fi
    
    local container_name="terroir-${agent}-agent"
    
    # Check if container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        log_error "Agent '$agent' is not running"
        exit 1
    fi
    
    docker exec -it "$container_name" $cmd
}

# Restart agents
restart_agents() {
    local agents="${1:-all}"
    
    stop_agents "$agents"
    sleep 2
    start_agents "$agents"
}

# Show agent resource usage
show_stats() {
    echo -e "\n${CYAN}Agent Resource Usage:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" \
        $(docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps -q)
}

# Build agent images
build_agents() {
    log_info "Building agent images..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" build
    
    if [ $? -eq 0 ]; then
        log_success "Agent images built successfully"
    else
        log_error "Failed to build agent images"
        exit 1
    fi
}

# Clean up all agents and volumes
cleanup() {
    log_warning "This will remove all agents and their volumes. Continue? (y/N)"
    read -r response
    
    if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down -v
        log_success "Cleanup completed"
    else
        log_info "Cleanup cancelled"
    fi
}

# Main script logic
main() {
    check_dependencies
    
    case "${1:-help}" in
        start)
            start_agents "${2:-all}"
            ;;
        stop)
            stop_agents "${2:-all}"
            ;;
        restart)
            restart_agents "${2:-all}"
            ;;
        connect|ssh)
            connect_agent "$2"
            ;;
        list|ls|ps)
            list_agents
            ;;
        logs)
            show_logs "$2" "$3"
            ;;
        exec)
            shift
            exec_in_agent "$@"
            ;;
        stats)
            show_stats
            ;;
        build)
            build_agents
            ;;
        cleanup|clean)
            cleanup
            ;;
        help|--help|-h)
            cat << EOF
${CYAN}Terroir Multi-Agent Manager${NC}

Usage: $0 <command> [options]

Commands:
  start [agent]     Start all agents or specific agent(s)
  stop [agent]      Stop all agents or specific agent(s)
  restart [agent]   Restart all agents or specific agent(s)
  connect <agent>   Connect to a specific agent's shell
  list              List all running agents
  logs [agent] [-f] Show logs for all agents or specific agent
  exec <agent> cmd  Execute command in specific agent
  stats             Show resource usage statistics
  build             Build agent Docker images
  cleanup           Remove all agents and volumes

Available agents:
  test      Testing and test coverage
  docs      Documentation generation
  build     Build processes and optimization
  refactor  Code refactoring and improvements
  perf      Performance testing (optional profile)

Examples:
  $0 start                    # Start all agents
  $0 start test-agent         # Start only test agent
  $0 connect test             # Connect to test agent
  $0 exec build pnpm build    # Run build in build agent
  $0 logs docs -f             # Follow docs agent logs
  $0 stats                    # Show resource usage

Environment Variables:
  COMPOSE_FILE    Path to docker-compose.yml (default: .agents/docker/docker-compose.yml)
  PROJECT_NAME    Docker Compose project name (default: terroir-agents)

EOF
            ;;
        *)
            log_error "Unknown command: $1"
            echo "Run '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"