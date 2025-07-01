# Docker Agent System

Lightweight Docker containers for multi-agent development on Terroir Core. Each agent runs in its own container with a dedicated git worktree, enabling parallel development without resource overhead.

## Quick Start

```bash
# Start an agent
./agent-manager.sh start 1

# Connect to the agent
./agent-manager.sh connect 1

# Generate Claude prompt
./agent-manager.sh prompt 1
```

## Architecture

The Docker agent system provides:

- **Lightweight containers** (~50MB each) with full development tools
- **Git worktree isolation** for conflict-free parallel development
- **Shared pnpm store** across all agents for efficiency
- **Full terminal color support** with xterm-256color
- **Persistent state** between container restarts

## Components

### agent-manager.sh

The main control script for all Docker operations:

```bash
Commands:
  start [agent]    - Start agent container (reuses existing if available)
  stop [agent]     - Stop agent container (preserves state)
  restart [agent]  - Restart agent container
  connect [agent]  - Connect to running agent
  status           - Show status of all agents
  rebuild [agent]  - Force rebuild of agent container
  clean [agent]    - Remove agent container (loses state)
  logs [agent]     - Show agent logs
  prompt [agent]   - Generate Claude prompt and copy to clipboard
```

### Dockerfile.agent

Optimized container image based on Node.js 22 with:

- Development tools (git, zsh, tmux, vim, nano)
- Modern CLI utilities (ripgrep, fd, bat, exa, httpie)
- Playwright browser dependencies
- 1Password CLI for secure credential management
- Oh-my-zsh with custom agent prompt

### scripts/init-container.sh

Container initialization script that:

- Sets up shared directories via symlinks
- Configures git safe directories
- Verifies worktree configuration
- Enables color output for all tools

## Configuration

Agents are configured in `../config/agent-mapping.conf`:

```bash
# Format: number:purpose:branch:color
1:utilities:feat/utilities:green
2:infrastructure:feat/infrastructure:blue
3:documentation:feat/docs:purple
```

## Resource Usage

- **Memory**: ~500MB per container (vs 2-3GB per VS Code instance)
- **CPU**: Minimal when idle
- **Disk**: Shared pnpm store reduces duplication

## Security

- Containers run with minimal privileges (CAP_DROP=ALL)
- Only essential capabilities added (CHOWN, SETUID, SETGID)
- No new privileges flag enabled
- Isolated network per agent

## Troubleshooting

### Colors not working

The system automatically configures xterm-256color support. If colors aren't working:

1. Ensure your terminal supports 256 colors
2. Try reconnecting to the agent
3. Check TERM environment: `echo $TERM` (should show xterm-256color)

### Container won't start

1. Check Docker is running: `docker info`
2. View logs: `./agent-manager.sh logs 1`
3. Clean and rebuild: `./agent-manager.sh clean 1 && ./agent-manager.sh start 1`

### Permission issues

The containers run as the `node` user (UID 1000). Ensure your host files are accessible to this user.

## Best Practices

1. **One agent per feature** - Keep concerns separated
2. **Regular commits** - Each agent should commit to its own branch
3. **Use agent-manager.sh** - Don't use docker commands directly
4. **Keep containers running** - They use minimal resources when idle

## Advanced Usage

### Custom environment variables

Add to agent-manager.sh in the docker run command:

```bash
-e MY_CUSTOM_VAR="${MY_CUSTOM_VAR:-default}"
```

### Different volume mounts

Modify the volume paths in agent-manager.sh:

```bash
-v "${HOME}/my/path:/workspaces/custom"
```

### Resource limits

Adjust memory and CPU in agent-manager.sh:

```bash
--memory="8g" \
--cpus="4.0" \
```

## Integration with VS Code

While agents run in Docker, you can still use VS Code for the core agent:

- Agent 0 (Core): Use VS Code locally
- Agents 1-3: Use Docker containers
- All agents share the same git repository via worktrees

This hybrid approach gives you the best of both worlds: a full IDE for complex work and lightweight containers for parallel tasks.
