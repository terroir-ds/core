# Multi-Agent Documentation

Streamlined documentation for the Docker-based multi-agent development system.

## Documentation Structure

We've consolidated from 11 documents down to 4 focused guides:

1. **[Getting Started](getting-started.md)** - Daily workflows, session management, and git merging
2. **[Setup Guide](setup-guide.md)** - Complete installation and configuration
3. **[Architecture](architecture.md)** - Technical design, benefits, and trade-offs

## What is Multi-Agent Development?

A system that enables one developer to coordinate multiple parallel development tasks:

- **1 Core Agent**: You in VS Code (primary development environment)
- **N Assistant Agents**: Lightweight Docker containers (parallel task execution)
- **Git Worktrees**: Each agent on its own branch without conflicts
- **Shared Tooling**: Common scripts and configurations across all agents

## Key Benefits

### 🚀 Resource Efficiency

- Traditional: 4 VS Code instances = ~8-10GB RAM
- Our approach: VS Code + 3 Docker agents = ~2.5GB RAM
- **Result: 70% memory savings**

### 💡 Developer Productivity

- Work on multiple features simultaneously
- No context switching between tasks
- Fast 2-second container restarts
- Persistent state between sessions

### 🛡️ Stability

- No VS Code extension conflicts
- Clean process isolation
- Predictable resource usage
- Simple recovery from crashes

## The Mental Model

Think of yourself as a **tech lead** with a small team:

```bash
You (Core Agent)          = Tech Lead in VS Code
├── Agent 1 (Docker)      = Junior dev working on utilities
├── Agent 2 (Docker)      = Junior dev working on infrastructure
└── Agent 3 (Docker)      = Junior dev working on components

Each on their own git branch, all coordinating through shared tools.
```

## Quick Start

```bash
# 1. Start an agent
cd .agents/docker
./agent-manager.sh start 1

# 2. Connect to it
./agent-manager.sh connect 1

# 3. Generate Claude prompt
./agent-manager.sh prompt 1

# 4. Work in parallel!
```

## Implementation Details

### Simplified Structure

- **4 documentation files** (down from 11)
- **Single entry point** for Docker operations (`agent-manager.sh`)
- **Context-aware scripts** that work in both host and container
- **No redundant templates** or obsolete configurations

### Recent Improvements

- Removed complex .gitignore rules for devcontainer.json and settings.json
- Consolidated all Docker operations into agent-manager.sh
- Flattened script structure (no more container/host/common subdirectories)
- Integrated session management and merge workflows into Getting Started

## For Developers

This system is ideal if you:

- Need to work on multiple features simultaneously
- Have limited system resources
- Value stability over cutting-edge features
- Are comfortable with terminal-based development

It's particularly effective for:

- Large refactoring projects
- Parallel feature development
- Testing while developing
- Documentation alongside code changes
