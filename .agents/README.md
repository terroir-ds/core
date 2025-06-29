# Multi-Agent Development System

A Docker-based multi-agent development system for Terroir Core that enables parallel development across different features.

## Quick Start

```bash
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
```

macOS ships with bash 3.x which lacks modern features. The scripts are compatible with both bash 4+ and zsh 5+.

## Architecture

```text
.agents/
├── config/                 # Agent configuration
│   └── agent-mapping.conf  # Maps numbers to purposes
├── docker/                 # Docker container system
│   ├── agent-manager.sh    # Container management
│   ├── Dockerfile.agent    # Container image
│   ├── scripts/            # Container-specific scripts
│   └── README.md           # Docker documentation
├── prompts/                # Agent prompt templates
├── scripts/                # Shared scripts
└── docs/                   # System documentation
```

## Key Components

### 1. Agent Configuration (`config/agent-mapping.conf`)

Maps agent numbers to their current purposes. Easy to update as needs change.

### 2. Docker System (`docker/`)

See [Docker README](docker/README.md) for complete details on:

- Container management with agent-manager.sh
- Resource-efficient architecture
- Full terminal color support
- Persistent development environments

### 3. Shared Scripts (`scripts/`)

Cross-platform utilities that work in both host and container contexts:

- **prompt.sh**: Generate Claude prompts with context
- **session.sh**: Save/restore conversation continuity
- **status.sh**: Quick agent status overview
- **load-agent-config.sh**: Configuration parser

## Agent Purposes

Agent purposes can evolve over time. To change:

1. Edit `config/agent-mapping.conf`
2. Update the purpose name
3. Everything automatically uses the new name

Example:

```bash
# Change agent 1 from utilities to color-management
1:color-mgmt:feat/color-management:green
```

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

- **[Docker System](docker/README.md)** - Container setup and management
- **[Getting Started](docs/getting-started.md)** - Quick introduction and daily workflows
- **[Setup Guide](docs/setup-guide.md)** - Complete installation instructions
- **[Architecture](docs/architecture.md)** - Technical design and trade-offs

## The Mental Model

Think of it as having a small development team:

- **You (Core Agent)**: Tech lead in VS Code, doing architecture and integration
- **Agent 1-3**: Junior developers in Docker containers, handling specific tasks
- **Git Worktrees**: Each developer on their own branch, no conflicts
- **Shared Tools**: Everyone uses the same scripts and configurations
