# Multi-Agent Development System

## Overview

This system enables parallel development using multiple Claude agents working simultaneously on different aspects of the Terroir Core Design System. Each agent operates in its own VS Code window and container, coordinating through shared task management.

## Quick Start

```bash
# 1. Run setup (one time)
./.claude/multi-agent/scripts/setup-multi-agent.sh

# 2. Start all agents
./.claude/multi-agent/scripts/start-agents.sh

# 3. Open the 3 VS Code windows that appear
# Each will have an agent ready to work on their focus area

# 4. At sync times (10am, 2pm, 6pm), run:
./.claude/multi-agent/scripts/sync-agents.sh
```

## Architecture

```
Your Machine
├── terroir-core (main repo)
│   └── .claude/ (shared coordination)
├── terroir-agent1 (utilities focus)
│   ├── VS Code Window 1
│   ├── Dev Container 1
│   └── Branch: feat/utilities
├── terroir-agent2 (infrastructure focus)
│   ├── VS Code Window 2
│   ├── Dev Container 2
│   └── Branch: feat/infrastructure
└── terroir-agent3 (documentation focus)
    ├── VS Code Window 3
    ├── Dev Container 3
    └── Branch: feat/documentation
```

## Agent Responsibilities

### Agent 1: Utilities Development
- **Focus**: `/packages/core/src/utils/`
- **Tasks**: Extract and implement utility functions
- **Branch**: `feat/utilities`
- **Color**: Green theme

### Agent 2: Infrastructure & DevOps
- **Focus**: `/.github/`, `/scripts/`, build configs
- **Tasks**: CI/CD, security, build optimization
- **Branch**: `feat/infrastructure`
- **Color**: Blue theme

### Agent 3: Documentation & API
- **Focus**: `/docs/`, API documentation, README files
- **Tasks**: TypeDoc, Storybook, guides
- **Branch**: `feat/documentation`
- **Color**: Purple theme

## Coordination Protocol

### Task Management
1. All agents share `.claude/tasks/` directory
2. Agents claim tasks by updating `AGENT-REGISTRY.md`
3. Lock files prevent conflicts on shared resources

### Sync Schedule
- **10:00 AM**: Morning sync and planning
- **2:00 PM**: Midday integration check
- **6:00 PM**: End of day merge

### Communication
- Async: Through shared files in `.claude/`
- Sync: At designated merge windows
- Emergency: Via `ALERT.md` for blockers

## File Ownership

### Exclusive Ownership
- **Agent 1**: `/packages/core/src/utils/**`
- **Agent 2**: `/.github/**`, `/scripts/**`
- **Agent 3**: `/docs/**`, `**/*.md`

### Shared Resources (Require Coordination)
- `package.json` - All agents
- `tsconfig.json` - Agents 1 & 2
- `pnpm-workspace.yaml` - Agent 2 primary

## Conflict Prevention

1. **Lock Files**: Agents create locks before editing shared files
2. **Clear Boundaries**: Each agent has primary ownership areas
3. **Regular Integration**: Frequent merges catch conflicts early
4. **Communication**: Proactive notification of major changes

## Daily Workflow

### Morning (Start of Day)
1. Run `start-agents.sh` to launch all environments
2. Each agent pulls latest changes
3. Review task assignments in `AGENT-REGISTRY.md`
4. Begin focused work

### During Work
- Commit frequently (every 30-60 minutes)
- Check for alerts before major changes
- Update task status in real-time
- Leave notes for other agents as needed

### Sync Windows
1. All agents commit current work
2. Run `sync-agents.sh`
3. Resolve any conflicts together
4. Continue with refreshed codebase

### End of Day
1. Final sync at 6 PM
2. Update tomorrow's plan
3. Clean up lock files
4. Shut down environments

## Troubleshooting

### Common Issues

**Merge Conflicts**
- Run `check-conflicts.sh` to identify issues
- Coordinate through `CONFLICTS.md`
- Use integration branch for resolution

**Agent Blocked**
- Create blocker file in `.agent-coordination/blocks/`
- Other agents check every 30 minutes
- Collaborate on resolution

**Resource Contention**
- Check lock files before editing
- Respect ownership boundaries
- Communicate in advance for shared resources

## Scripts

- `setup-multi-agent.sh` - Initial setup (run once)
- `start-agents.sh` - Launch all agent environments
- `sync-agents.sh` - Synchronize agent work
- `check-conflicts.sh` - Detect potential issues
- `stop-agents.sh` - Clean shutdown

## Best Practices

1. **Commit Often**: Every 30-60 minutes
2. **Clear Messages**: Include agent ID in commits
3. **Stay in Lane**: Respect ownership boundaries
4. **Communicate**: Use coordination files liberally
5. **Test Locally**: Before pushing changes
6. **Sync Regularly**: Don't skip merge windows

## Metrics

Track effectiveness through:
- Tasks completed per day
- Conflict frequency
- Integration success rate
- Time saved vs sequential work

## Next Steps

1. Run setup script
2. Start your first multi-agent session
3. Monitor effectiveness
4. Adjust boundaries as needed

Ready to 3x your development speed? Let's go! 🚀