# Multi-Agent Development System

This directory contains the complete multi-agent development tooling for Terroir Core.

## Directory Structure

```text
.agents/
├── docs/              # All documentation
├── prompts/           # Agent prompt templates
├── scripts/           # Automation scripts
│   ├── host/         # Run from host machine
│   └── container/    # Run inside containers
└── templates/        # Configuration templates
```

## Quick Start

See [docs/quick-start.md](docs/quick-start.md) for the fastest way to get started.

## Documentation

All documentation is in the [docs/](docs/) directory:

- Quick start guides
- Usage instructions
- Technical details
- Troubleshooting

## Scripts Organization

Scripts are organized by where they should be run:

## 📁 host/ - Run from Host Machine

These scripts should be run from your host machine (outside containers):

- **`host-setup.sh`** - Initial multi-agent setup (run once)
- **`start-agents.sh`** - Launch all agent VS Code windows at start of day
- **`stop-agents.sh`** - Stop all agent environments
- **`open-all-agents.sh`** - Open VS Code windows for all agents
- **`migrate-from-shared.sh`** - One-time migration from old setup

### Usage

```bash
# From main repo on host:
./.claude/multi-agent/scripts/host/host-setup.sh
./.claude/multi-agent/scripts/host/start-agents.sh
```

## 📁 container/ - Run Inside Agent Containers

These scripts run inside the agent containers and are accessible via `.claude` symlink:

- **`generate-agent-prompt.sh [1|2|3]`** - Generate Claude prompt for specific agent
- **`generate-agent-prompt-1.sh`** - Generate prompt for Agent 1 (Utilities)
- **`generate-agent-prompt-2.sh`** - Generate prompt for Agent 2 (Infrastructure)
- **`generate-agent-prompt-3.sh`** - Generate prompt for Agent 3 (Documentation)
- **`sync-agents.sh`** - Synchronize work between agents
- **`check-conflicts.sh`** - Check for merge conflicts
- **`apply-extension-fixes.sh`** - Apply VS Code extension fixes
- **`diagnose-extension-crash.sh`** - Diagnose VS Code issues

### Usage

```bash
# From inside any agent container:
.claude/multi-agent/scripts/container/generate-agent-prompt.sh 1
.claude/multi-agent/scripts/container/sync-agents.sh
```

## Quick Reference

### Starting Your Day (Host)

```bash
cd ~/terroir-core
./.claude/multi-agent/scripts/host/start-agents.sh
```

### Starting Claude Session (Container)

```bash
# In Agent 1 container:
.claude/multi-agent/scripts/container/generate-agent-prompt.sh 1
# Copy output and paste as first message to Claude
```

### Syncing Work (Container)

```bash
.claude/multi-agent/scripts/container/sync-agents.sh
```

## Why This Organization?

- **Clarity**: No confusion about where to run scripts
- **Safety**: Container scripts can't accidentally modify host system
- **Access**: Container scripts are available via `.claude` symlink
- **Separation**: Host setup scripts aren't cluttering agent workspaces
