# Docker Agent System - AI Documentation

## Quick Reference

| Task                   | Command                        |
| ---------------------- | ------------------------------ |
| Start agent 1          | `./agent-manager.sh start 1`   |
| Connect to agent       | `./agent-manager.sh connect 1` |
| Generate Claude prompt | `./agent-manager.sh prompt 1`  |
| Check all agents       | `./agent-manager.sh status`    |
| View agent logs        | `./agent-manager.sh logs 1`    |
| Rebuild agent image    | `./agent-manager.sh rebuild 1` |
| Stop agent             | `./agent-manager.sh stop 1`    |
| Remove agent           | `./agent-manager.sh clean 1`   |

## System Overview

```text
.agents/docker/
├── agent-manager.sh      # Main control script
├── Dockerfile.agent      # Container image definition
├── scripts/
│   └── init-container.sh # Container startup script
└── docker-compose.yml.reference  # Reference config (not used)
```

## Key Concepts

1. **No docker-compose dependency** - Uses pure Docker commands
2. **Persistent containers** - State survives restarts
3. **Shared image** - All agents use the same base image
4. **Git worktrees** - Each agent has its own branch
5. **Color support** - Full xterm-256color enabled

## Common Tasks

### Starting a New Agent

```bash
# Agent automatically created on first start
./agent-manager.sh start 2

# Connect to it
./agent-manager.sh connect 2

# Inside container:
git checkout -b feat/my-feature
pnpm install
```

### Generating Claude Prompts

```bash
# From host (recommended)
./agent-manager.sh prompt 1

# Prompt is automatically copied to clipboard
# Just paste into Claude.ai
```

### Debugging Issues

```bash
# Check if agent is running
./agent-manager.sh status

# View container logs
./agent-manager.sh logs 1

# Force rebuild if needed
./agent-manager.sh rebuild 1
```

## Configuration Details

### Environment Variables

Each container gets:

- `TERM=xterm-256color` - Full color support
- `NODE_OPTIONS=--max-old-space-size=3072` - 3GB heap
- `AGENT_NUMBER` - Agent identifier (1, 2, 3)
- `AGENT_ROLE` - From agent-mapping.conf
- `AGENT_COLOR` - Terminal prompt color

### Volume Mounts

```bash
# Core repository (shared by all)
${HOME}/Development/Design/terroir-core:/workspaces/terroir-core

# Agent-specific worktree
${HOME}/Development/Design/terroir-agent${N}:/workspaces/terroir-agent${N}
```

### Resource Limits

- Memory: 4GB max, 1GB reserved
- CPU: 2.0 cores max
- Security: Minimal privileges (CAP_DROP=ALL)

## Implementation Notes

### Docker Run Command

The system uses `docker run` with these key flags:

- `-d` - Detached mode
- `-it` - Interactive terminal
- `--restart=no` - Don't auto-restart
- Volume mounts for code access
- Environment variables for color support
- Resource and security constraints

### Image Building

- Built on first use
- Based on `node:22-bookworm`
- Includes all development tools
- Single image for all agents (~50MB)

### Container Lifecycle

1. **Create**: `docker run` creates container
2. **Start**: `docker start` resumes existing
3. **Stop**: `docker stop` preserves state
4. **Remove**: `docker rm` deletes container

## Troubleshooting Patterns

### Pattern: Colors Not Working

```bash
# Fix 1: Reconnect with proper TERM
./agent-manager.sh connect 1

# Fix 2: Check in container
echo $TERM  # Should be xterm-256color

# Fix 3: Force rebuild
./agent-manager.sh rebuild 1
```

### Pattern: Container Won't Start

```bash
# Step 1: Check Docker
docker info

# Step 2: Check logs
docker logs terroir-agent1

# Step 3: Clean start
./agent-manager.sh clean 1
./agent-manager.sh start 1
```

### Pattern: Permission Errors

```bash
# Container runs as node user (UID 1000)
# Check file ownership on host
ls -la ~/Development/Design/terroir-agent1

# Fix permissions if needed
sudo chown -R $(id -u):$(id -g) ~/Development/Design/terroir-agent1
```

## Advanced Patterns

### Adding New Tools

Edit Dockerfile.agent to add packages:

```dockerfile
RUN apt-get update && apt-get install -y \
    your-new-tool \
  && apt-get clean -y && rm -rf /var/lib/apt/lists/*
```

### Custom Agent Configuration

Modify agent-manager.sh docker run:

```bash
# Add custom environment
-e CUSTOM_VAR="value" \

# Add custom volume
-v "/host/path:/container/path" \

# Adjust resources
--memory="8g" \
--cpus="4.0" \
```

### Debugging Inside Container

```bash
# Process monitoring
htop

# Network debugging
curl -I https://example.com
httpie GET example.com

# File watching
entr -c pnpm test < file-list.txt

# Git visualization
tig

# Disk usage
ncdu
duf
```

## Performance Considerations

- Containers share the host's kernel (no VM overhead)
- Shared pnpm store reduces disk usage
- Idle containers use ~50MB RAM
- Fast startup (~2 seconds)

## Security Model

- No root access in containers
- Minimal Linux capabilities
- Isolated network per agent
- No privileged operations

## Integration Points

### With Git Worktrees

Each agent maps to a worktree:

- `/workspaces/terroir-core` - Main repository
- `/workspaces/terroir-agent1` - Agent 1 worktree
- Shared `.git` directory for efficiency

### With VS Code

- Core agent (0) uses VS Code
- Docker agents (1-3) use terminal
- Can open agent directories in VS Code if needed

### With Claude.ai

- `./agent-manager.sh prompt` generates context
- Automatically copies to clipboard
- Includes git status and recent changes

## Metadata

- **Complexity**: Medium
- **Dependencies**: Docker, bash/zsh
- **Token Cost**: ~1,500 tokens for full context
- **Stability**: High (pure Docker commands)
