# Quick Start Guide for Restarting Agents

## Immediate Recovery (After Crash/Reboot)

### 1. Identify Your Agent
```bash
# Check which agent directory you're in
pwd
# Should show: /workspaces/terroir-agent[1-3]

# Check your branch
git branch --show-current
```

### 2. Generate Your Prompt

#### Quick Method (Recommended):
```bash
# Run from any agent directory (scripts available via .claude symlink):
.claude/multi-agent/scripts/container/generate-agent-prompt.sh [1|2|3]

# Or use agent-specific scripts:
.claude/multi-agent/scripts/container/generate-agent-prompt-1.sh  # For utilities
.claude/multi-agent/scripts/container/generate-agent-prompt-2.sh  # For infrastructure
.claude/multi-agent/scripts/container/generate-agent-prompt-3.sh  # For documentation
```

This will:
- Generate the combined prompt
- Save it to `/tmp/agentN-claude-prompt.txt`
- Open it in VS Code (if available)
- Show you how to copy it

#### Manual Method:
```bash
# For Agent 1:
cat /workspaces/terroir-core/.claude/agent-prompts/base/base-prompt.md \
    /workspaces/terroir-core/.claude/agent-prompts/agents/utilities-agent.md \
    > /tmp/agent-prompt.md
```

### 3. Add Current Context (Optional)

If you need to add specific context about what you were working on:

```bash
# Copy the context template
cp /workspaces/terroir-core/.claude/agent-prompts/base/context-template.md /tmp/context.md

# Edit it with current information
code /tmp/context.md

# Append to your prompt
cat /tmp/context.md >> /tmp/agent-prompt.md
```

### 4. Start Claude with the Prompt

**CRITICAL**: Do NOT ask Claude to "read" these files!

1. Copy the ENTIRE contents of `/tmp/agent-prompt.md`
2. Paste it AS YOUR FIRST MESSAGE to Claude
3. The prompt IS the instruction - paste it directly
4. After pasting, you can add context on the next line like:
   - "I just restarted after a crash"
   - "Continue working on [specific task]"
   - "Check status and resume work"

**Example First Message:**
```
[PASTE ALL PROMPT CONTENT HERE]

I'm restarting after a system reboot. Please check current tasks and continue.
```

## Quick Status Check Commands

```bash
# Check your recent commits
git log --oneline -5

# Check modified files
git status

# Check shared tasks
ls -la /workspaces/terroir-core/.agent-coordination/tasks/

# Check your agent status
cat /workspaces/terroir-core/.agent-coordination/agent-status.md

# Run tests to verify state
pnpm test

# Check for build issues
pnpm build
```

## Common Recovery Scenarios

### Scenario 1: Mid-Task Crash
1. Use the quick start above
2. Tell Claude: "I was working on [task]. Please check the current state and continue."

### Scenario 2: System Reboot
1. Use the quick start above
2. Tell Claude: "System rebooted. Please check agent-status.md and current tasks, then continue where we left off."

### Scenario 3: Unknown State
1. Use the quick start above
2. Tell Claude: "Please review recent commits, check current tasks, and give me a status summary before continuing."

## Tips for Smooth Recovery

1. **Always commit frequently** - Makes recovery easier
2. **Update agent-status.md** - Before stopping work
3. **Use descriptive commits** - Helps understand state
4. **Check shared tasks** - Stay coordinated with other agents
5. **Run tests first** - Verify system state

## Emergency Commands

If things seem broken:

```bash
# Reset to clean state (careful!)
git reset --hard HEAD

# Reinstall dependencies
pnpm install

# Clean build artifacts
pnpm clean

# Rebuild everything
pnpm build

# Check symbolic links
ls -la /workspaces/terroir-agent*/
```

## Contact for Help

If an agent is severely broken or confused:
1. Check the main `.claude/multi-agent/` documentation
2. Coordinate with other agents through `.agent-coordination/`
3. Consider a full restart with fresh context