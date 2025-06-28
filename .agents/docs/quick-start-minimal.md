# Quick Start: Minimal Multi-Agent Setup

## Overview

This guide helps you quickly set up a minimal multi-agent environment with just Core + Agent 1, reducing resource usage by ~50% compared to the full 4-agent setup.

## Prerequisites

- VS Code installed with `code` command in PATH
- Docker Desktop running
- 16GB+ RAM recommended

## Setup Steps

### 1. Run the Minimal Setup Script

From your **host machine** (not inside a container):

````bash
cd /path/to/terroir-core
./.claude/multi-agent/scripts/host/start-minimal-agents.sh
```yaml
This will:

- Open Core workspace (main development)
- Open Agent 1 workspace (auxiliary tasks)
- Create necessary directories
- Configure devcontainers

### 2. Wait for Containers to Start

Each VS Code window will:

1. Build/start its devcontainer
2. Install dependencies
3. Configure extensions

This takes 2-3 minutes per container on first run.

### 3. Verify Setup

You should have 2 VS Code windows:

- **Core**: Main terroir-core workspace
- **Agent 1**: Auxiliary workspace at `.claude/multi-agent/workspaces/agent-1`

## Usage Guidelines

### Core Workspace

- Primary development
- Main git operations
- Running tests
- Building the project

### Agent 1 Workspace

- Documentation tasks
- Testing features
- Exploring code
- Parallel investigations

## Resource Monitoring

Monitor resource usage with your OS tools:

- **macOS**: Activity Monitor
- **Linux**: htop or System Monitor
- **Windows**: Task Manager

## Common Tasks

### Adding More Agents

If you need more agents temporarily:

```bash
# Run the full setup
./.claude/multi-agent/scripts/host/start-all-agents.sh
```text
### Stopping Agents

Simply close the VS Code windows. Containers will stop automatically.

### Cleaning Up

```bash
# Stop all containers
docker stop $(docker ps -q)

# Remove containers
docker container prune

# Clean workspace
rm -rf .claude/multi-agent/workspaces/*
````

## Tips

1. **Start with Core only** - Open Agent 1 when needed
2. **Close idle agents** - Free resources when done
3. **Monitor resources** - Use OS tools to track memory
4. **Restart weekly** - Prevent memory leaks

## Troubleshooting

### VS Code won't open

- Check Docker is running
- Verify `code` command works
- Check file permissions

### High memory usage

- Close unused agents
- Restart TypeScript servers
- Reduce extensions

### Slow performance

- Use SSD storage
- Increase Docker resources
- Close other applications

## Next Steps

- Read [Resource Optimization Guide](./resource-optimization.md)
- Configure [VS Code settings](../templates/settings.json)
- Customize [devcontainer](../templates/agent-devcontainer.json)
