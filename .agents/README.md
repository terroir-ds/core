# Multi-Agent Development System

A Docker-based multi-agent development system for Terroir Core that enables parallel development across different features.

## Quick Start

````bash
# 1. Navigate to the Docker directory
cd .agents/docker

# 2. Build and start an agent
./agent-manager.sh start 1

# 3. Connect to the agent
./agent-manager.sh connect 1

# 4. Generate a Claude prompt
./agent-manager.sh prompt 1    # From host (recommended)
```

### macOS Note
If you encounter errors about "invalid option" or "declare -A", run the scripts with zsh:
```bash
zsh ./agent-manager.sh prompt 1
````

macOS ships with bash 3.x which lacks modern features. The scripts are compatible with both bash 4+ and zsh 5+.

## Architecture

````text
.agents/
├── config/           # Agent configuration
│   └── agent-mapping.conf    # Maps numbers to purposes
├── docker/          # Docker setup
│   ├── docker-compose.yml    # Container definitions
│   ├── Dockerfile.agent      # Agent container image
│   └── agent-manager.sh      # Container management
├── prompts/         # Agent prompt templates
├── scripts/         # Shared scripts (work in both contexts)
└── docs/            # Documentation
```bash
## Key Components

### 1. Agent Configuration (`config/agent-mapping.conf`)

Maps agent numbers to their current purposes:
- Agent 0: Core (VS Code)
- Agent 1: Utilities
- Agent 2: Infrastructure
- Agent 3: Documentation

### 2. Docker Setup (`docker/`)

- **docker-compose.yml**: Defines agent containers with git worktrees
- **Dockerfile.agent**: Lightweight Node.js environment (~50MB per agent)
- **agent-manager.sh**: Single entry point for all Docker operations
- **init-container.sh**: Automatic container initialization

### 3. Container Management

```bash
# Start/stop agents
./agent-manager.sh start 1       # Start by number
./agent-manager.sh start utilities   # Start by purpose
./agent-manager.sh stop 1

# Connect to running agent
./agent-manager.sh connect 1

# Check all agents status
./agent-manager.sh status

# Generate prompt (copies to clipboard)
./agent-manager.sh prompt 1

# View logs
./agent-manager.sh logs 1

# Rebuild when Dockerfile changes
./agent-manager.sh rebuild 1
```bash
### 4. Scripts (`scripts/`)

Available in both host and container contexts:

- **load-agent-config.sh**: Configuration loader (used by other scripts)
- **prompt.sh**: Generate Claude prompts
- **session.sh**: Save/restore session continuity
- **status.sh**: Quick agent status check

## Agent Purposes

Agent purposes can evolve over time. To change:

1. Edit `config/agent-mapping.conf`
2. Update the purpose name
3. Everything automatically uses the new name

Example:

```bash
# Change agent 1 from utilities to color-management
1:color-mgmt:feat/color-management:green
````

## Key Benefits

### Resource Efficiency

- **VS Code + 3 Docker agents**: ~2.5GB total memory
- **4 VS Code instances**: ~8-10GB memory
- **Savings**: ~70% memory reduction

### Developer Productivity

- **Parallel Development**: Work on multiple features simultaneously
- **No Context Switching**: Each agent maintains its own focus
- **Git Worktrees**: No merge conflicts during development
- **Fast Iteration**: 2-second container restarts vs 30-60s for VS Code

### Stability

- **Isolated Environments**: No VS Code extension conflicts
- **Clean Separation**: Each agent has its own process space
- **Persistent State**: Work survives container restarts

## Documentation

- **[Getting Started](docs/getting-started.md)** - Quick introduction and daily workflows
- **[Setup Guide](docs/setup-guide.md)** - Complete installation instructions
- **[Architecture](docs/architecture.md)** - Technical design and trade-offs

## The Mental Model

Think of it as having a small development team:

- **You (Core Agent)**: Tech lead in VS Code, doing architecture and integration
- **Agent 1-3**: Junior developers in Docker containers, handling specific tasks
- **Git Worktrees**: Each developer on their own branch, no conflicts
- **Shared Tools**: Everyone uses the same scripts and configurations
