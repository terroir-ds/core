# Docker-Based Multi-Agent Solution

## Overview

Run multiple agents with minimal overhead:

- **Core Agent**: VS Code + devcontainer (normal setup)
- **Secondary Agents**: Pure Docker containers accessed via `docker exec`

## Benefits

1. **Reduced Memory Usage**: No VS Code overhead for secondary agents
2. **Better Stability**: Fewer processes competing for resources
3. **Simpler Setup**: Secondary agents don't need devcontainer.json
4. **Clear Separation**: Each agent in its own terminal

## Architecture

```text
┌─────────────────────┐
│   VS Code Instance  │
│  (Core Agent Only)  │
└──────────┬──────────┘
           │
┌──────────▼──────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Core Agent         │     │  Agent 2         │     │  Agent 3         │
│  Container          │     │  Container       │     │  Container       │
│  (VS Code attached) │     │  (docker exec)   │     │  (docker exec)   │
└─────────────────────┘     └──────────────────┘     └──────────────────┘
           │                          │                          │
           └──────────────────────────┴──────────────────────────┘
                                      │
                            Shared Volume Mount
```

## Implementation

### 1. Start Core Agent (VS Code)

```bash
# Normal VS Code devcontainer
code .
```

### 2. Start Secondary Agents (Terminal)

```bash
# Agent 2 (in new terminal)
docker run -d \
  --name agent2 \
  -v $(pwd):/workspace \
  -e AGENT_ROLE="test-runner" \
  node:20-alpine tail -f /dev/null

docker exec -it agent2 /bin/sh

# Agent 3 (in another terminal)
docker run -d \
  --name agent3 \
  -v $(pwd):/workspace \
  -e AGENT_ROLE="docs-writer" \
  node:20-alpine tail -f /dev/null

docker exec -it agent3 /bin/sh
```

### 3. Terminal Colorization

#### iTerm2 Profile Colors

Create profiles for each agent with distinct colors:

- **Core Agent**: Blue theme
- **Test Runner**: Green theme
- **Docs Writer**: Purple theme

#### Using iTerm2 Badges

```bash
# In each container's startup
echo -e "\033]1337;SetBadgeFormat=%{Agent: $AGENT_ROLE}\a"
```

#### Alternative: Colored Prompts

```bash
# Agent 2
export PS1='\[\033[32m\][TEST] \w $ \[\033[0m\]'

# Agent 3
export PS1='\[\033[35m\][DOCS] \w $ \[\033[0m\]'
```

## Simplified Agent Scripts

### start-agents.sh

```bash
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Start test runner
echo -e "${GREEN}Starting Test Runner Agent...${NC}"
docker run -d \
  --name test-agent \
  -v $(pwd):/workspace \
  -w /workspace \
  -e AGENT_ROLE="test-runner" \
  -e PS1='\[\033[32m\][TEST] \w $ \[\033[0m\]' \
  node:20-alpine tail -f /dev/null

# Start docs writer
echo -e "${PURPLE}Starting Docs Writer Agent...${NC}"
docker run -d \
  --name docs-agent \
  -v $(pwd):/workspace \
  -w /workspace \
  -e AGENT_ROLE="docs-writer" \
  -e PS1='\[\033[35m\][DOCS] \w $ \[\033[0m\]' \
  node:20-alpine tail -f /dev/null

echo -e "${BLUE}Agents started. Connect with:${NC}"
echo "  docker exec -it test-agent /bin/sh"
echo "  docker exec -it docs-agent /bin/sh"
```

### connect-agent.sh

```bash
#!/bin/bash

AGENT=$1

case $AGENT in
  test)
    echo "Connecting to Test Runner..."
    docker exec -it test-agent /bin/sh
    ;;
  docs)
    echo "Connecting to Docs Writer..."
    docker exec -it docs-agent /bin/sh
    ;;
  *)
    echo "Usage: ./connect-agent.sh [test|docs]"
    ;;
esac
```

## Advantages Over VS Code Multi-Instance

1. **Memory Efficiency**
   - VS Code: ~500MB+ per instance
   - Docker exec: ~50MB per container

2. **CPU Usage**
   - No extension overhead
   - No language server duplication
   - No file watcher conflicts

3. **Stability**
   - Fewer IPC issues
   - No devcontainer rebuild conflicts
   - Simpler process management

4. **Setup Simplicity**
   - No .devcontainer configs for secondary agents
   - No VS Code settings conflicts
   - Easy to add/remove agents

## Terminal Setup for iTerm2

### Create Agent Profiles

1. **Test Runner Profile**
   - Background: Dark green (#0D2818)
   - Text: Bright green (#39FF14)
   - Badge: "TEST RUNNER"

2. **Docs Writer Profile**
   - Background: Dark purple (#2D1B69)
   - Text: Light purple (#E0B0FF)
   - Badge: "DOCS WRITER"

### Auto-Profile Selection

```bash
# In .zshrc or .bashrc
if [ "$AGENT_ROLE" = "test-runner" ]; then
  echo -e "\033]50;SetProfile=Test Runner\a"
elif [ "$AGENT_ROLE" = "docs-writer" ]; then
  echo -e "\033]50;SetProfile=Docs Writer\a"
fi
```

## Quick Start

```bash
# 1. Start secondary agents
./start-agents.sh

# 2. Open new iTerm tabs/windows
# 3. Connect to agents
./connect-agent.sh test  # Green terminal
./connect-agent.sh docs  # Purple terminal

# 4. Work normally in VS Code for core development
```

## Cleanup

```bash
# Stop and remove all agents
docker stop test-agent docs-agent
docker rm test-agent docs-agent
```

## Future Enhancements

1. **tmux Integration**: Auto-layout multiple agents
2. **Status Dashboard**: Show all active agents
3. **Log Aggregation**: Unified view of all agent logs
4. **Resource Monitoring**: Track memory/CPU per agent
