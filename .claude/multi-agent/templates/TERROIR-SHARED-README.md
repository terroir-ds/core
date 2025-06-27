# Terroir Shared Coordination Directory

This directory enables coordination between multiple development agents working on the Terroir Core Design System.

## Purpose

This is the central hub for multi-agent development coordination. All agents (separate VS Code windows/containers) share this directory through symbolic links, allowing them to:

- Track tasks and progress
- Coordinate file access
- Communicate asynchronously
- Prevent conflicts

## Directory Structure

```
terroir-shared/
├── .claude/                    # Task management (from main repo)
│   ├── tasks/                  # Task lists and specifications
│   ├── multi-agent/           # Multi-agent system docs
│   └── ...                    # Other planning documents
└── .agent-coordination/       # Real-time coordination
    ├── README.md              # This file
    ├── locks/                 # Active file locks
    ├── claims/                # File ownership claims
    ├── blocks/                # Blocker reports
    ├── daily-plan-*.md        # Daily planning docs
    ├── sync-log.md           # Sync history
    └── ALERT-*.md            # Conflict alerts
```

## How It Works

### Symbolic Links
Each agent workspace has symbolic links pointing here:
```bash
terroir-agent1/.claude → ../terroir-shared/.claude
terroir-agent1/.agent-coordination → ../terroir-shared/.agent-coordination
# Same for agent2 and agent3
```

### File Locking
Before editing a shared file:
```bash
# Create lock
touch .agent-coordination/locks/package.json.agent1.lock

# Edit the file...

# Remove lock
rm .agent-coordination/locks/package.json.agent1.lock
```

### File Claims
For extended ownership:
```bash
echo "Agent 2 - Adding build dependencies" > .agent-coordination/claims/package.json.agent2
```

### Blocker Reports
When stuck:
```bash
echo "Need security utility for JWT validation" > .agent-coordination/blocks/agent3-$(date +%s).md
```

## Agent Roles

| Agent | Focus | Branch | Owns |
|-------|-------|--------|------|
| Main | Integration/Monitoring | main | Integration testing |
| Agent 1 | Utilities | feat/utilities | `/packages/core/src/utils/**` |
| Agent 2 | Infrastructure | feat/infrastructure | `/.github/**`, `/scripts/**` |
| Agent 3 | Documentation | feat/documentation | `/docs/**`, `**/*.md` |

## Sync Schedule

Daily sync windows for merging work:
- **10:00 AM** - Morning planning & sync
- **2:00 PM** - Midday progress check
- **6:00 PM** - End of day integration

## Common Commands

### Check Coordination Status
```bash
# See active locks
ls -la .agent-coordination/locks/

# See file claims
ls -la .agent-coordination/claims/

# Check for blockers
ls -la .agent-coordination/blocks/

# View today's plan
cat .agent-coordination/daily-plan-$(date +%Y-%m-%d).md
```

### Quick Scripts
From the main repository:
```bash
# Check for conflicts
./.claude/multi-agent/scripts/check-conflicts.sh

# Sync all agents
./.claude/multi-agent/scripts/sync-agents.sh

# View agent status
./agent-status.sh
```

## Important Files

### AGENT-REGISTRY.md
Central registry of who's working on what:
```markdown
| Agent | Focus Area | Current Task | Branch | Status |
|-------|------------|--------------|--------|--------|
| 1 | Utilities | Extract security utils | feat/utilities | Active |
```

### Daily Plan
Created each morning with focus areas and sync times.

### Sync Log
History of all synchronization attempts, conflicts, and resolutions.

## Best Practices

1. **Check Before Claiming**: Look for existing claims/locks
2. **Communicate Changes**: Update registry when switching tasks
3. **Respect Boundaries**: Stay within your assigned directories
4. **Sync Regularly**: Don't skip the merge windows
5. **Clean Up**: Remove locks/claims when done

## Troubleshooting

### Stale Locks
If you find locks older than 2 hours:
```bash
find .agent-coordination/locks -name "*.lock" -mmin +120 -delete
```

### Merge Conflicts
Check for CONFLICTS-*.md files after sync failures.

### Can't Find Task
Check `.claude/tasks/AGENT-REGISTRY.md` for current assignments.

## DO NOT

- Don't edit files directly in terroir-shared
- Don't delete coordination files without checking
- Don't skip sync windows without notification
- Don't work outside your assigned areas without coordination

---

This directory is the heart of multi-agent coordination. Treat it with care!