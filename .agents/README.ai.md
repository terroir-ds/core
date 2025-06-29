# Multi-Agent Development System - AI Documentation

## Quick Reference

| Component      | Location                    | Purpose                     |
| -------------- | --------------------------- | --------------------------- |
| Docker System  | `docker/`                   | Container management        |
| Agent Config   | `config/agent-mapping.conf` | Agent-to-purpose mapping    |
| Shared Scripts | `scripts/`                  | Cross-environment utilities |
| Prompts        | `prompts/`                  | Claude.ai templates         |

## System Design

```text
Core Agent (0)     = VS Code (You)
├── Agent 1        = Docker Container (feat/utilities)
├── Agent 2        = Docker Container (feat/infrastructure)
└── Agent 3        = Docker Container (feat/documentation)
```

## Key Concepts

1. **Git Worktrees** - Each agent has isolated branch
2. **Docker Containers** - Lightweight, persistent environments
3. **Shared Scripts** - Work in both host and container
4. **Dynamic Mapping** - Agent purposes can change

## Common Workflows

### Starting Fresh

```bash
cd .agents/docker
./agent-manager.sh start 1
./agent-manager.sh connect 1
```

### Generating Prompts

```bash
# Best practice: Run from host
cd .agents/docker
./agent-manager.sh prompt 1
# Paste into Claude.ai
```

### Checking Status

```bash
cd .agents/docker
./agent-manager.sh status
```

## Configuration

### agent-mapping.conf Format

```bash
number:purpose:branch:color
0:core:main:cyan
1:utilities:feat/utilities:green
2:infrastructure:feat/infrastructure:blue
3:documentation:feat/docs:purple
```

### Changing Agent Purpose

1. Edit `config/agent-mapping.conf`
2. Update purpose and branch
3. No restart needed - scripts read dynamically

## Integration Points

- **VS Code**: Core agent for complex work
- **Docker**: Agents 1-3 for parallel tasks
- **Git**: Worktrees prevent conflicts
- **Claude.ai**: Prompts include context

## Resource Model

- Core (VS Code): ~2-3GB RAM
- Each Docker agent: ~500MB RAM
- Shared pnpm store: No duplication
- Total system: ~2.5GB vs ~10GB for 4 VS Code instances

## Troubleshooting

See [Docker README](docker/README.ai.md) for container-specific issues.

### Script Compatibility

```bash
# macOS with old bash
zsh ./script.sh

# Linux/modern bash
./script.sh
```

### Finding Scripts

- Container management: `docker/agent-manager.sh`
- Prompt generation: `scripts/prompt.sh`
- Session management: `scripts/session.sh`

## Metadata

- **Complexity**: Low (once set up)
- **Dependencies**: Docker, Git, Bash/Zsh
- **Token Cost**: ~500 tokens for overview
- **Stability**: High
