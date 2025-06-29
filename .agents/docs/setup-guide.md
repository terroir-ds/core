# Multi-Agent Setup Guide

Complete guide for setting up and configuring the multi-agent development system.

## Prerequisites

Before starting, ensure you have:

- Docker and Docker Compose installed
- At least 8GB RAM (16GB recommended)
- Git configured with SSH access to your repository
- Basic familiarity with Docker and git

## Initial Setup

### 1. Create Git Worktrees

First, set up the worktrees that agents will use:

````bash
# From your main development directory
cd ~/Development/Design/terroir-core

# Create worktrees for each agent
git worktree add ../terroir-agent1 -b feat/utilities
git worktree add ../terroir-agent2 -b feat/infrastructure
git worktree add ../terroir-agent3 -b feat/documentation

```bash
### 2. Configure Environment

Create a `.env` file in the Docker directory:
```

cd .agents/docker
cat > .env << EOF
# Path to your development directory
HOME=/home/$(whoami)

# Optional: 1Password configuration
OP_SERVICE_ACCOUNT_TOKEN=your-token-here
GIT_CONFIG_ITEM=your-item-name
GIT_SIGNING_KEY_ITEM=your-key-item
EOF

```bash
### 3. Build and Start Agents
```

# Build the Docker image
docker-compose build agent1

# Start your first agent
./agent-manager.sh start 1

# Connect to the agent
./agent-manager.sh connect 1

```bash
### 4. Initialize the Agent Environment

When you first connect, the container will automatically:
- Set up symlinks to `.claude/` and `.agent-coordination/`
- Configure git safe directories
- Run the common post-create script
- Set up SSH keys (if configured)

## Agent Configuration

### Understanding agent-mapping.conf

All agents are configured in `.agents/config/agent-mapping.conf`:
```

# Format: NUMBER:PURPOSE:BRANCH:COLOR
0:core:main:white
1:utilities:feat/utilities:green
2:infrastructure:feat/infrastructure:blue
3:documentation:feat/documentation:purple

```bash
### Customizing Agent Purposes

As your project evolves, agent purposes can change:
```

# Edit the configuration
vim .agents/config/agent-mapping.conf

# Example: Change agent 1 from utilities to color management
# Before: 1:utilities:feat/utilities:green
# After:  1:color-mgmt:feat/color-management:green

# Create the new branch in the worktree
cd ~/Development/Design/terroir-agent1
git checkout -b feat/color-management

```bash
### Adding More Agents

To add a fourth agent:

1. Create a new worktree:
   ```

   git worktree add ../terroir-agent4 -b feat/testing

```markdown
2. Add to agent-mapping.conf:
   ```

   4:testing:feat/testing:yellow

   ```markdown
3. Add to docker-compose.yml (copy an existing agent section)

## Daily Workflow

### Morning Startup
```

cd .agents/docker

# Check what's running
./agent-manager.sh status

# Start the agents you need
./agent-manager.sh start 1
./agent-manager.sh start 2

# Generate prompts for Claude
./agent-manager.sh prompt 1

```bash
### Working with Agents

Each agent has access to these commands:
```

# Inside an agent container
./prompt.sh          # Generate Claude prompt
./session.sh save    # Save current session
./status.sh          # Check agent status

```bash
### Stopping Agents
```

# Stop individual agent
./agent-manager.sh stop 1

# Stop all agents
./agent-manager.sh stop all

```bash
## SSH and Git Configuration

### Automatic SSH Setup

If you use 1Password, the containers will automatically:
1. Detect 1Password CLI availability
2. Configure Git with your signing key
3. Set up SSH agent forwarding

### Manual SSH Setup

For other password managers or manual setup:

1. Mount your SSH directory in docker-compose.yml:
   ```

   volumes:
     - ${HOME}/.ssh:/home/node/.ssh:ro

```markdown
2. Or use SSH agent forwarding:
   ```

   # On host, add key to agent
   ssh-add ~/.ssh/id_rsa

   # Containers will use the forwarded agent

   ```bash
## Resource Management

### Container Limits

Each agent container is limited to:

- 2 CPU cores (burst)
- 4GB memory (max)
- 0.5 CPU cores (reserved)
- 1GB memory (reserved)

### Monitoring Resources
```

# Check container stats
docker stats

# View agent logs
./agent-manager.sh logs 1

```bash
## Troubleshooting

### Container Won't Start
```

# Check logs
docker-compose logs agent1

# Rebuild if needed
./agent-manager.sh rebuild 1

```bash
### Permission Issues
```

# Inside container, ensure git safe directory
git config --global --add safe.directory /workspaces/terroir-agent1

```bash
### Broken Symlinks
```

# Recreate symlinks
rm -rf .claude .agent-coordination
ln -sf /workspaces/terroir-core/.claude .claude
ln -sf /workspaces/terroir-core/.agent-coordination .agent-coordination

```bash
### Can't Generate Prompts
```

# Ensure you're in the right directory
cd /workspaces/terroir-core/.agents/scripts
./prompt.sh 1

```

## Best Practices

1. **Start Small**: Begin with just one agent until comfortable
2. **Regular Commits**: Commit often in agent branches
3. **Clear Purpose**: Each agent should have a focused task
4. **Session Management**: Save sessions before stopping work
5. **Resource Awareness**: Monitor memory usage with many agents

## Next Steps

- Read [Getting Started](getting-started.md) for usage examples
- Review [Architecture](architecture.md) to understand the design
- Check [Merge Strategy](merge-strategy.md) for git workflows
