# Multi-Agent Quick Reference

## Setup Commands

```bash
# One-time setup (from host machine, in main repo)
./.claude/multi-agent/scripts/host-setup.sh

# Open agent folders (no workspace files needed)
code ../terroir-agent1
code ../terroir-agent2
code ../terroir-agent3

# Sync work (10 AM, 2 PM, 6 PM) - from any agent container
./.claude/multi-agent/scripts/sync-agents.sh

# Check for conflicts
./.claude/multi-agent/scripts/check-conflicts.sh

# End of day shutdown
./.claude/multi-agent/scripts/stop-agents.sh
```

## Agent Assignments

| Agent | Focus | Branch | Color | Key Files |
|-------|-------|--------|-------|-----------|
| 1 | Utilities | feat/utilities | Green | `/packages/core/src/utils/**` |
| 2 | Infrastructure | feat/infrastructure | Blue | `/.github/**`, `/scripts/**` |
| 3 | Documentation | feat/documentation | Purple | `/docs/**`, `**/*.md` |

## Coordination Files

```bash
# Task tracking
.claude/tasks/AGENT-REGISTRY.md      # Who's doing what
.claude/tasks/TODO.md                # Master task list

# Coordination
.agent-coordination/daily-plan-*.md  # Today's plan
.agent-coordination/locks/           # File locks
.agent-coordination/claims/          # File claims
.agent-coordination/blocks/          # Blockers
```

## Common Tasks

### Claim a shared file
```bash
echo "Agent 2 - Adding CI dependencies" > .agent-coordination/claims/package.json.agent2
```

### Create a lock
```bash
touch .agent-coordination/locks/tsconfig.json.agent1.lock
# Edit file
rm .agent-coordination/locks/tsconfig.json.agent1.lock
```

### Report a blocker
```bash
echo "Blocked: Need security utility for API tokens" > .agent-coordination/blocks/agent3-$(date +%s).md
```

## Commit Format

```bash
# Format: type(agentN): description
git commit -m "feat(agent1): add debounce utility"
git commit -m "ci(agent2): configure GitHub Actions"
git commit -m "docs(agent3): add API reference"
```

## Sync Schedule

- **10:00 AM** - Morning sync & planning
- **2:00 PM** - Midday progress check
- **6:00 PM** - End of day integration

## Quick Status Check

```bash
# Check git status (from within any agent container)
git status

# Verify environment
echo $NODE_ENV
echo $CLAUDE_AGENT_ID

# Check shared coordination
ls -la .claude/
ls -la .agent-coordination/
```

## Emergency Procedures

### Merge Conflict
1. Run sync-agents.sh - it will detect conflicts
2. Check CONFLICTS-*.md file created
3. Coordinate with other agents
4. Resolve in main repo
5. Re-run sync

### Agent Blocked
1. Create blocker file
2. Other agents check every 30 min
3. Help resolve if possible
4. Update when unblocked

### CI Failure
1. Agent 2 investigates
2. If related to code, coordinate fix
3. Push fix and re-run

## Best Practices

1. **Commit Often**: Every 30-60 minutes
2. **Stay in Lane**: Respect file ownership
3. **Communicate**: Use coordination files
4. **Test Locally**: Before pushing
5. **Sync on Time**: Don't skip merge windows

## File Ownership

### Exclusive
- Agent 1: `/packages/core/src/utils/**`
- Agent 2: `/.github/**`, `/scripts/**`  
- Agent 3: `/docs/**`

### Shared (need coordination)
- All: `package.json`
- 1&2: `tsconfig.json`
- All: Root config files

## Help & Key Points

### Documentation
- Instructions: `.claude/multi-agent/README.md`
- Agent 1: `.claude/multi-agent/agent1-utilities-instructions.md`
- Agent 2: `.claude/multi-agent/agent2-infrastructure-instructions.md`
- Agent 3: `.claude/multi-agent/agent3-documentation-instructions.md`

### Key Implementation Details
- **No workspace files needed** - Open folders directly
- **Settings merge automatically** - Shared + agent-specific
- **Git works via mounts** - terroir-core mounted for git access
- **Environment loads properly** - Post-create script handles .env
- **Branches must include fixes** - Base on feat/initial-setup or later