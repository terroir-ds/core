#!/bin/bash
# Start script for Agent 1 (Utilities Development)

echo "🟢 Preparing Agent 1 (Utilities) prompt..."

# Generate combined prompt
PROMPT_FILE="/tmp/agent1-claude-prompt.txt"
cat /workspaces/terroir-core/.claude/agent-prompts/base/base-prompt.md \
    /workspaces/terroir-core/.claude/agent-prompts/agents/utilities-agent.md \
    > "$PROMPT_FILE"

# Add recovery context
echo -e "\n\n---\n\nI'm starting a fresh session. Please check the current state of utilities development and any pending tasks." >> "$PROMPT_FILE"

# Copy to clipboard (cross-platform)
if command -v pbcopy &> /dev/null; then
    # macOS
    cat "$PROMPT_FILE" | pbcopy
    echo "✅ Prompt copied to clipboard (macOS)"
elif command -v xclip &> /dev/null; then
    # Linux with xclip
    cat "$PROMPT_FILE" | xclip -selection clipboard
    echo "✅ Prompt copied to clipboard (Linux/xclip)"
elif command -v xsel &> /dev/null; then
    # Linux with xsel
    cat "$PROMPT_FILE" | xsel --clipboard --input
    echo "✅ Prompt copied to clipboard (Linux/xsel)"
elif command -v clip.exe &> /dev/null; then
    # WSL/Windows
    cat "$PROMPT_FILE" | clip.exe
    echo "✅ Prompt copied to clipboard (Windows)"
else
    echo "⚠️  No clipboard tool found. Prompt saved to: $PROMPT_FILE"
    echo "   Open this file and copy manually."
fi

echo ""
echo "📋 Next steps:"
echo "   1. Start a new Claude session"
echo "   2. Paste (Ctrl+V) as your first message"
echo "   3. Agent 1 will initialize and check current state"
echo ""
echo "🟢 Agent 1 (Utilities) - Branch: feat/utilities"

# Optional: try to start Claude CLI if available
if command -v claude &> /dev/null; then
    echo ""
    echo "Starting Claude CLI..."
    claude
else
    echo ""
    echo "💡 Tip: Install Claude CLI for automatic launch"
fi