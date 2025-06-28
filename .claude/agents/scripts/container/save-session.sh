#!/bin/bash
# Save current agent session context for easy recovery

# Determine agent number from current directory
AGENT_NUM=$(pwd | grep -oE 'agent[0-9]' | grep -oE '[0-9]')
if [ -z "$AGENT_NUM" ]; then
    echo "❌ Could not determine agent number from path: $(pwd)"
    exit 1
fi

# Create sessions directory
mkdir -p ../../prompts/sessions

# Generate session file
SESSION_FILE="../../prompts/sessions/agent${AGENT_NUM}-session-$(date +%Y%m%d-%H%M%S).md"

cat > "$SESSION_FILE" << EOF
# Agent $AGENT_NUM Session Context
**Saved**: $(date '+%Y-%m-%d %H:%M:%S')
**Directory**: $(pwd)
**Branch**: $(git branch --show-current)

## Current Working State

### Git Status
\`\`\`
$(git status --short)
\`\`\`

### Recent Commits (Last 10)
\`\`\`
$(git log --oneline -10 2>/dev/null || echo "No commits yet")
\`\`\`

### Active Files Being Edited
$(git status --porcelain | grep '^.M' | awk '{print "- " $2}' || echo "- None")

### Current Tasks
$(if [ -f /workspaces/terroir-core/.claude/tasks/AGENT-REGISTRY.md ]; then
    grep -A5 "Agent $AGENT_NUM" /workspaces/terroir-core/.claude/tasks/AGENT-REGISTRY.md 2>/dev/null || echo "No tasks found in registry"
else
    echo "Task registry not found"
fi)

## Session Notes
<!-- Add any important context for resuming work -->
- Working on: [FILL IN]
- Next steps: [FILL IN]
- Blockers: [FILL IN]

## Recovery Instructions
To resume this session:
1. Run: \`.claude/multi-agent/scripts/container/generate-agent-prompt.sh $AGENT_NUM\`
2. Add this context after the base prompt
3. Continue with the work described above
EOF

echo "✅ Session saved to: $SESSION_FILE"
echo ""
echo "To view: cat $SESSION_FILE"
echo "To edit: code $SESSION_FILE"

# Also save a "latest" symlink for easy access
ln -sf "$SESSION_FILE" "../../prompts/sessions/agent${AGENT_NUM}-latest.md"
echo ""
echo "Quick access: cat .claude/sessions/agent${AGENT_NUM}-latest.md"