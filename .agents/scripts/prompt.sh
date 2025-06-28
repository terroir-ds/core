#!/bin/bash
# Unified prompt generation script
# Usage: prompt.sh [core|1|2|3|<purpose-name>]

AGENT=$1
PRINT_MODE=${2:-}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Source the agent configuration
source "$BASE_DIR/scripts/load-agent-config.sh"

# Resolve agent from input
AGENT_NUM=$(resolve_agent_number "$AGENT")

if [ -z "$AGENT_NUM" ]; then
    # Special handling for legacy core/main
    if [[ "$AGENT" == "core" ]] || [[ "$AGENT" == "main" ]]; then
        AGENT_NUM="0"
    else
        echo "Error: Unknown agent '$AGENT'"
        echo ""
        echo "Available agents:"
        for num in "${!AGENT_PURPOSE[@]}"; do
            echo "  $num | ${AGENT_PURPOSE[$num]}"
        done | sort -n
        exit 1
    fi
fi

# Get agent details
AGENT_PURPOSE="${AGENT_PURPOSE[$AGENT_NUM]}"
AGENT_BRANCH="${AGENT_BRANCH[$AGENT_NUM]}"
AGENT_COLOR_NAME="${AGENT_COLOR[$AGENT_NUM]}"

# Special handling for core agent
if [[ "$AGENT_NUM" == "0" ]] || [[ "$AGENT_PURPOSE" == "core" ]]; then
    AGENT_NAME="Core Integration"
    AGENT_FILE="core.md"
    COLOR="🏠"
    BRANCH="main"
else
    # Map color names to emojis
    case $AGENT_COLOR_NAME in
        green) COLOR="🟢" ;;
        blue) COLOR="🔵" ;;
        purple) COLOR="🟣" ;;
        yellow) COLOR="🟡" ;;
        red) COLOR="🔴" ;;
        white) COLOR="⚪" ;;
        *) COLOR="⚪" ;;
    esac
    
    # Set names
    AGENT_NAME="${AGENT_PURPOSE^}" # Capitalize first letter
    AGENT_FILE="${AGENT_PURPOSE}.md"
    BRANCH="$AGENT_BRANCH"
fi

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

# If print mode, just output the prompt and exit
if [[ "$PRINT_MODE" == "print" ]]; then
    cat "$PROMPT_FILE"
    exit 0
fi

# Try to copy to clipboard if xclip is available
if command -v xclip >/dev/null 2>&1; then
    cat "$PROMPT_FILE" | xclip -selection clipboard
    CLIPBOARD_STATUS="✅ Copied to clipboard!"
else
    CLIPBOARD_STATUS="⚠️  xclip not found - manual copy needed"
fi

# Display instructions
echo ""
echo "✅ Prompt file created: $PROMPT_FILE"
echo "$CLIPBOARD_STATUS"
echo ""
echo "$COLOR $AGENT_NAME Agent - Branch: $BRANCH"
echo ""
echo "Next steps:"
if command -v xclip >/dev/null 2>&1; then
    echo "   1. Open claude.ai in your browser"
    echo "   2. Start a new conversation"
    echo "   3. Paste (Ctrl+V) - the prompt is already in your clipboard!"
else
    echo "   1. Copy the prompt: cat $PROMPT_FILE | xclip -selection clipboard"
    echo "   2. Open claude.ai in your browser"
    echo "   3. Start a new conversation and paste"
fi
echo ""
echo "Alternative commands:"
echo "   📋 View prompt: cat $PROMPT_FILE"
echo "   📋 Copy manually: cat $PROMPT_FILE | xclip -selection clipboard"

# Optional: Open in VS Code if available and user wants it
if [[ -n "$VSCODE_IPC_HOOK_CLI" ]] && [[ "${OPEN_IN_VSCODE:-}" == "true" ]]; then
    echo ""
    echo "Opening prompt file in VS Code..."
    code "$PROMPT_FILE"
fi
