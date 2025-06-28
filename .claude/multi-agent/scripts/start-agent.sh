#!/bin/bash
# Universal start script for any agent
# Usage: ./start-agent.sh [1|2|3]

AGENT_NUM=$1

if [[ -z "$AGENT_NUM" || ! "$AGENT_NUM" =~ ^[1-3]$ ]]; then
    echo "Usage: $0 [1|2|3]"
    echo "  1 - Utilities Agent (green)"
    echo "  2 - Infrastructure Agent (blue)"
    echo "  3 - Documentation Agent (purple)"
    exit 1
fi

# Set agent-specific variables
case $AGENT_NUM in
    1)
        AGENT_NAME="Utilities"
        AGENT_FILE="utilities-agent.md"
        COLOR="🟢"
        BRANCH="feat/utilities"
        ;;
    2)
        AGENT_NAME="Infrastructure"
        AGENT_FILE="infrastructure-agent.md"
        COLOR="🔵"
        BRANCH="feat/infrastructure"
        ;;
    3)
        AGENT_NAME="Documentation"
        AGENT_FILE="documentation-agent.md"
        COLOR="🟣"
        BRANCH="feat/documentation"
        ;;
esac

echo "$COLOR Preparing Agent $AGENT_NUM ($AGENT_NAME) prompt..."

# Generate combined prompt
PROMPT_FILE="/tmp/agent${AGENT_NUM}-claude-prompt.txt"
cat /workspaces/terroir-core/.claude/agent-prompts/base/base-prompt.md \
    /workspaces/terroir-core/.claude/agent-prompts/agents/$AGENT_FILE \
    > "$PROMPT_FILE"

# Add recovery context
echo -e "\n\n---\n\nI'm starting a fresh session. Please check the current state of $AGENT_NAME development and any pending tasks." >> "$PROMPT_FILE"

# Since we're in a container without clipboard tools, provide instructions
echo ""
echo "✅ Prompt file created: $PROMPT_FILE"
echo ""
echo "📋 Quick copy command:"
echo "   cat $PROMPT_FILE"
echo ""
echo "📋 Or open in VS Code:"
echo "   code $PROMPT_FILE"
echo ""
echo "Then:"
echo "   1. Select all (Ctrl+A) and copy (Ctrl+C)"
echo "   2. Start a new Claude session"
echo "   3. Paste as your first message"
echo "   4. Agent $AGENT_NUM will initialize"
echo ""
echo "$COLOR Agent $AGENT_NUM ($AGENT_NAME) - Branch: $BRANCH"

# Optional: Open the file in VS Code automatically
if [[ -n "$VSCODE_IPC_HOOK_CLI" ]]; then
    echo ""
    echo "Opening prompt file in VS Code..."
    code "$PROMPT_FILE"
fi