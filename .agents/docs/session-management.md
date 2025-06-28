# Agent Session Management

## Overview

The session management system helps agents maintain continuity across restarts, crashes, or context switches. It automatically integrates saved sessions into agent prompts, ensuring no work is lost.

## How It Works

1. **Session Files**: Stored in `.claude/sessions/agent{N}-latest.md`
2. **Automatic Loading**: The prompt generator checks for and includes saved sessions
3. **Manual Management**: Agents use `session.sh` to save/clear sessions

## Workflow

### Starting a Complex Task

```bash
# 1. Agent saves session at start
.agents/scripts/container/session.sh save

# 2. Agent edits the session file to add context
code /workspaces/terroir-core/.claude/sessions/agent1-latest.md

# 3. If agent crashes/restarts, run prompt generator
.agents/scripts/container/prompt.sh 1
# Session context is automatically included!
```

### Completing a Task

```bash
# 1. Clear the session
.agents/scripts/container/session.sh clear

# 2. Update task registry
code /workspaces/terroir-core/.claude/tasks/AGENT-REGISTRY.md

# 3. Commit changes
git add -A && git commit -m "feat: complete task X"
```

## Session File Format

```markdown
# Agent 1 Session Context
**Saved**: 2025-06-28 14:30:00
**Directory**: /workspaces/terroir-agent1
**Branch**: feat/utilities

## Current Working State

### Git Status

```text
M lib/utils/logger.ts
A lib/utils/security.ts
```

### Recent Commits

```text
abc123 feat: add security utilities
def456 refactor: improve logger performance
```

### Current Tasks from AGENT-REGISTRY

| Agent | Branch | Focus Area | Current Task |
|-------|--------|------------|--------------|
| Agent 1 | feat/utilities | Utility Development | Implementing security utilities |

## Session Notes

- Working on: Security utility functions for input validation
- Progress: Completed sanitizeHtml and escapeString functions
- Next steps: Add validateEmail and validateUrl functions
- Blockers: Need to coordinate with Agent 2 on types

## Important Context

The security utilities need to integrate with the error handling
system. Using the ValidationError class from @utils/errors.

## Best Practices

1. **Save Early**: Save session when starting any multi-step task
2. **Be Specific**: Include exact function names, file paths, decisions made
3. **Update Regularly**: Keep session current as you work
4. **Clear on Completion**: Remove session when task is done
5. **Include Blockers**: Note any dependencies or coordination needed

## Commands Reference

```bash
# Save current session (auto-detects agent)
.agents/scripts/container/session.sh save

# Save for specific agent
.agents/scripts/container/session.sh save 2

# View current session
.agents/scripts/container/session.sh show

# Clear session (task complete)
.agents/scripts/container/session.sh clear

# Generate prompt with session
.agents/scripts/container/prompt.sh 1
```

## Integration with Task Management

Sessions complement the task registry:

- **Task Registry** (`.claude/tasks/AGENT-REGISTRY.md`): High-level task assignments
- **Session Files** (`.claude/sessions/`): Detailed work-in-progress state

## Troubleshooting

### Session Not Loading

- Check file exists: `ls -la .claude/sessions/`
- Verify agent number matches
- Run prompt generator with correct agent number

### Session File Corrupted

- Delete and recreate: `rm .claude/sessions/agent1-latest.md`
- Save new session: `.agents/scripts/container/session.sh save`

### Multiple Sessions

- System only uses `agent{N}-latest.md`
- Old timestamped sessions are kept for history
- Clear old sessions: `rm .claude/sessions/agent1-session-*.md`
