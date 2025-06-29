# Multi-Agent Architecture

## Overview

The multi-agent system enables a single developer to coordinate multiple parallel development tasks using:

- **1 Core Agent**: Full VS Code devcontainer environment (primary development)
- **N Assistant Agents**: Lightweight Docker containers (parallel tasks)

````text
┌─────────────────────┐
│   VS Code Instance  │
│  (Core Agent Only)  │
└──────────┬──────────┘
           │
┌──────────▼──────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Core Agent         │     │  Agent 1         │     │  Agent 2         │
│  Container          │     │  Container       │     │  Container       │
│  (VS Code attached) │     │  (docker exec)   │     │  (docker exec)   │
└─────────────────────┘     └──────────────────┘     └──────────────────┘
           │                          │                          │
           └──────────────────────────┴──────────────────────────┘
                              Shared Git Repository
                                 (via worktrees)
```text
## Why Docker Exec?

We evaluated several approaches:

1. **Multiple VS Code Instances**: Too resource-intensive (~2GB per instance)
2. **VS Code Workspaces**: Still heavy, complex window management
3. **Terminal Multiplexers**: No container isolation
4. **Docker Exec**: Optimal balance of isolation and efficiency ✅

## Benefits

### 1. Resource Efficiency

| Approach | Memory Usage | CPU Usage |
|----------|-------------|-----------|
| 3 VS Code instances | ~6-8GB | 30-40% |
| VS Code + 2 Docker agents | ~2.5GB | 10-15% |
| **Savings** | **~70%** | **~65%** |

### 2. Stability

- **No VS Code conflicts**: Extensions don't interfere across agents
- **Clean isolation**: Each container has its own process space
- **No file watchers**: Reduced filesystem contention
- **Simpler debugging**: Fewer moving parts

### 3. Speed

- **Container startup**: ~2 seconds
- **VS Code devcontainer**: 30-60 seconds
- **Quick agent switching**: Just change terminal tabs

### 4. Simplicity

- **No devcontainer.json** for agents
- **No extension management** for agents
- **Direct shell access** via docker exec
- **Standard Docker tools** for management

## Trade-offs

### What You Lose

1. **No GUI tools** in agent containers (terminal only)
2. **No VS Code features** like IntelliSense in agents
3. **Manual coordination** between agents
4. **Learning curve** for Docker commands

### What You Gain

1. **Parallel development** without resource constraints
2. **Stable environment** that doesn't crash
3. **Fast iteration** with quick container restarts
4. **Clear separation** of concerns

## Implementation Details

### Container Configuration

Each agent container includes:
- Node.js 22 with development tools
- Git with worktree support
- Essential CLI tools (ripgrep, fd, bat, exa)
- Shared volume mounts for code access
- Persistent home directories

### Git Worktrees

Each agent operates on its own git worktree:
```text
~/Development/Design/
├── terroir-core/          # Main repository (Core agent)
├── terroir-agent1/        # Worktree for Agent 1
├── terroir-agent2/        # Worktree for Agent 2
└── terroir-agent3/        # Worktree for Agent 3
````

This provides:

- Independent branch checkouts
- No merge conflicts during development
- Shared git history
- Easy integration via standard git commands

### Coordination Mechanisms

Agents coordinate through:

- **Shared directories**: `.claude/` for sessions, `.agent-coordination/` for locks
- **Git branches**: Each agent on its own feature branch
- **Docker networking**: Agents can communicate if needed
- **Host filesystem**: Shared volume mounts

## Best Use Cases

### Ideal For

- **Parallel feature development**: Multiple features at once
- **Large refactoring**: Split work across agents
- **Testing + development**: One agent tests while another codes
- **Documentation + code**: Simultaneous updates

### Not Ideal For

- **GUI-heavy development**: Agents are terminal-only
- **Complex debugging**: Better in VS Code
- **Pair programming**: Agents work independently

## Comparison with Alternatives

| Feature         | Multiple VS Code | Our Approach          |
| --------------- | ---------------- | --------------------- |
| Memory usage    | High (~2GB each) | Low (~50MB per agent) |
| Startup time    | Slow (30-60s)    | Fast (2s)             |
| Complexity      | High             | Medium                |
| Stability       | Variable         | High                  |
| Features        | Full IDE         | Terminal only         |
| Resource limits | Hard to enforce  | Easy via Docker       |

## Conclusion

This architecture optimizes for:

1. **Resource efficiency** over full IDE features
2. **Stability** over cutting-edge tooling
3. **Simplicity** over complex integrations
4. **Speed** over comprehensive functionality

It's particularly effective for developers who:

- Are comfortable with terminal-based development
- Need to work on multiple features simultaneously
- Have limited system resources
- Value stability and predictability
