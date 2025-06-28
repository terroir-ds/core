#!/usr/bin/env bash
# session.sh - Manage agent session files
# Usage: session.sh [save|clear|show] [agent]

# Source configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$BASE_DIR/scripts/common/load-agent-config.sh"

ACTION=$1
AGENT_INPUT=$2

# If no agent provided, try to detect from path or environment
if [ -z "$AGENT_INPUT" ]; then
    if [ -n "$AGENT_NUMBER" ]; then
        # Use environment variable from container
        AGENT_NUM="$AGENT_NUMBER"
    else
        # Try to detect from path
        AGENT_NUM=$(pwd | grep -oE 'agent[0-9]' | grep -oE '[0-9]')
        if [ -z "$AGENT_NUM" ]; then
            # Check if we're in core
            if [[ "$(pwd)" == "/workspaces/terroir-core" ]]; then
                AGENT_NUM="0"
            fi
        fi
    fi
else
    # Resolve input to number
    AGENT_NUM=$(resolve_agent_number "$AGENT_INPUT")
fi

if [ -z "$AGENT_NUM" ]; then
    echo "❌ Could not determine agent"
    echo "Usage: $0 [save|clear|show] [agent]"
    exit 1
fi

# Get agent info
if [ "$AGENT_NUM" = "0" ]; then
    AGENT_NAME="Core"
    AGENT_DESC="Core Integration"
else
    AGENT_NAME="Agent $AGENT_NUM"
    AGENT_DESC="${AGENT_PURPOSE[$AGENT_NUM]}"
fi

SESSION_DIR="/workspaces/terroir-core/.claude/sessions"
SESSION_FILE="$SESSION_DIR/agent${AGENT_NUM}-latest.md"

case "$ACTION" in
    save)
        echo "💾 Saving session for Agent $AGENT_NUM..."
        
        # Create session directory if needed
        mkdir -p "$SESSION_DIR"
        
        # Generate session content
        cat > "$SESSION_FILE" << EOF
# $AGENT_NAME Session Context
**Agent**: $AGENT_NAME ($AGENT_DESC)
**Saved**: $(date '+%Y-%m-%d %H:%M:%S')
**Directory**: $(pwd)
**Branch**: $(git branch --show-current 2>/dev/null || echo "unknown")

## Current Working State

### Git Status
\`\`\`
$(git status --short 2>/dev/null || echo "Not in git repository")
\`\`\`

### Recent Commits (Last 5)
\`\`\`
$(git log --oneline -5 2>/dev/null || echo "No commits yet")
\`\`\`

### Active Files Being Edited
$(git status --porcelain 2>/dev/null | grep '^.M' | awk '{print "- " $2}' || echo "- None")

### Current Tasks from AGENT-REGISTRY
$(if [ -f "/workspaces/terroir-core/.claude/tasks/AGENT-REGISTRY.md" ]; then
    if [ "$AGENT_NUM" = "core" ]; then
        grep -A5 "Main.*Integration" /workspaces/terroir-core/.claude/tasks/AGENT-REGISTRY.md 2>/dev/null || echo "No tasks found"
    else
        grep -A5 "Agent $AGENT_NUM" /workspaces/terroir-core/.claude/tasks/AGENT-REGISTRY.md 2>/dev/null || echo "No tasks found"
    fi
else
    echo "Task registry not found"
fi)

## Session Notes
<!-- Agent should fill these in when saving -->
- Working on: [TASK DESCRIPTION]
- Progress: [WHAT WAS COMPLETED]
- Next steps: [WHAT REMAINS]
- Blockers: [ANY ISSUES]

## Important Context
<!-- Any special context needed to resume -->
[ADD IMPORTANT DETAILS HERE]
EOF
        
        echo "✅ Session saved to: $SESSION_FILE"
        echo ""
        echo "📝 Please edit to add specific context:"
        echo "   code $SESSION_FILE"
        ;;
        
    clear|delete|rm)
        if [ -f "$SESSION_FILE" ]; then
            rm "$SESSION_FILE"
            echo "✅ Cleared session for Agent $AGENT_NUM"
            
            # Also remove any timestamped sessions for this agent
            rm -f "$SESSION_DIR/agent${AGENT_NUM}-session-"*.md 2>/dev/null
        else
            echo "ℹ️  No session found for Agent $AGENT_NUM"
        fi
        ;;
        
    show|cat)
        if [ -f "$SESSION_FILE" ]; then
            echo "📋 Session for Agent $AGENT_NUM:"
            echo "=================================="
            cat "$SESSION_FILE"
        else
            echo "ℹ️  No session found for Agent $AGENT_NUM"
        fi
        ;;
        
    *)
        echo "Usage: $0 [save|clear|show] [agent]"
        echo ""
        echo "Commands:"
        echo "  save   - Save current session context"
        echo "  clear  - Clear saved session (task complete)"
        echo "  show   - Display saved session"
        echo ""
        echo "Examples:"
        echo "  $0 save              # Auto-detect agent"
        echo "  $0 save 1            # Save session for agent 1"
        echo "  $0 save utilities    # Save session for utilities agent"
        echo "  $0 clear             # Clear current agent session"
        echo "  $0 show core         # Show core agent session"
        echo ""
        echo "Available agents:"
        for num in "${!AGENT_PURPOSE[@]}"; do
            echo "  $num: ${AGENT_PURPOSE[$num]}"
        done | sort -n
        ;;
esac