#!/bin/bash
# Unified prompt generation script
# Usage: prompt.sh [core|1|2|3|utilities|infrastructure|documentation]

AGENT=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Map agent names/numbers to files
case $AGENT in
    core|main)
        AGENT_NAME="Core Integration"
        AGENT_FILE="core.md"
        COLOR="🏠"
        BRANCH="main"
        ;;
    1|utilities)
        AGENT_NAME="Utilities"
        AGENT_FILE="utilities.md"
        COLOR="🟢"
        BRANCH="feat/utilities"
        ;;
    2|infrastructure)
        AGENT_NAME="Infrastructure"
        AGENT_FILE="infrastructure.md"
        COLOR="🔵"
        BRANCH="feat/infrastructure"
        ;;
    3|documentation)
        AGENT_NAME="Documentation"
        AGENT_FILE="documentation.md"
        COLOR="🟣"
        BRANCH="feat/documentation"
        ;;
    *)
        echo "Usage: $0 [core|1|2|3|utilities|infrastructure|documentation]"
        exit 1
        ;;
esac

echo "$COLOR Preparing $AGENT_NAME Agent prompt..."

# Generate combined prompt
PROMPT_FILE="/tmp/${AGENT}-claude-prompt.txt"
cat "$BASE_DIR/prompts/base.md" \
    "$BASE_DIR/prompts/$AGENT_FILE" \
    > "$PROMPT_FILE"

# Add recovery context
echo -e "\n\n---\n\nI'm starting a fresh session. Please check the current state of $AGENT_NAME development and any pending tasks." >> "$PROMPT_FILE"

# Check for saved session and append if exists
AGENT_NUM=""
case $AGENT in
    1|utilities) AGENT_NUM="1" ;;
    2|infrastructure) AGENT_NUM="2" ;;
    3|documentation) AGENT_NUM="3" ;;
    core|main) AGENT_NUM="core" ;;
esac

if [ -n "$AGENT_NUM" ]; then
    SESSION_FILE="/workspaces/terroir-core/.claude/sessions/agent${AGENT_NUM}-latest.md"
    if [ -f "$SESSION_FILE" ]; then
        echo "" >> "$PROMPT_FILE"
        echo "---" >> "$PROMPT_FILE"
        echo "" >> "$PROMPT_FILE"
        echo "## Previous Session Context" >> "$PROMPT_FILE"
        echo "" >> "$PROMPT_FILE"
        cat "$SESSION_FILE" >> "$PROMPT_FILE"
        
        echo ""
        echo "📋 Found saved session - included in prompt"
        echo "   Session file: $SESSION_FILE"
        echo "   Remember to:"
        echo "   - Delete session when task is complete: rm $SESSION_FILE"
        echo "   - Update task files in .claude/tasks/"
    fi
fi

# Display instructions
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
echo ""
echo "$COLOR $AGENT_NAME Agent - Branch: $BRANCH"

# Optional: Open in VS Code
if [[ -n "$VSCODE_IPC_HOOK_CLI" ]]; then
    echo ""
    echo "Opening prompt file in VS Code..."
    code "$PROMPT_FILE"
fi
