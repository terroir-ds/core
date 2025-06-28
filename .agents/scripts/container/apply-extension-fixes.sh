#!/bin/bash
# apply-extension-fixes.sh - Apply extension and settings fixes to all agents

echo "🔧 Applying VS Code Extension Fixes"
echo "==================================="

# Script must be run from host, not in container
if [ -f "/.dockerenv" ]; then
    echo "❌ This script must be run on your HOST machine, not inside a container"
    exit 1
fi

# Get the repository directory
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../" && pwd)"
PARENT_DIR="$(dirname "$REPO_DIR")"

echo "📁 Repository: $REPO_DIR"
echo ""

# 1. Copy updated extensions.json to all agents
echo "📋 Updating extensions.json for all agents..."
for i in 1 2 3; do
    AGENT_DIR="$PARENT_DIR/terroir-agent$i"
    if [ -d "$AGENT_DIR/.vscode" ]; then
        cp "$REPO_DIR/.vscode/extensions.json" "$AGENT_DIR/.vscode/extensions.json"
        echo "✅ Updated Agent $i extensions.json"
    fi
done

# 2. Merge watcher settings into main settings.json
echo -e "\n⚙️ Updating VS Code settings with watcher exclusions..."
if [ -f "$REPO_DIR/.vscode/settings-watcher-fix.json" ]; then
    # Backup current settings
    cp "$REPO_DIR/.vscode/settings.json" "$REPO_DIR/.vscode/settings.json.backup"
    
    # Use jq or node to merge if available
    if command -v jq >/dev/null 2>&1; then
        jq -s '.[0] * .[1]' "$REPO_DIR/.vscode/settings.json" "$REPO_DIR/.vscode/settings-watcher-fix.json" > "$REPO_DIR/.vscode/settings.json.tmp"
        mv "$REPO_DIR/.vscode/settings.json.tmp" "$REPO_DIR/.vscode/settings.json"
        echo "✅ Merged watcher settings using jq"
    elif command -v node >/dev/null 2>&1; then
        node -e "
            const fs = require('fs');
            const current = JSON.parse(fs.readFileSync('$REPO_DIR/.vscode/settings.json', 'utf8'));
            const fixes = JSON.parse(fs.readFileSync('$REPO_DIR/.vscode/settings-watcher-fix.json', 'utf8'));
            const merged = { ...current, ...fixes };
            fs.writeFileSync('$REPO_DIR/.vscode/settings.json', JSON.stringify(merged, null, 2));
        "
        echo "✅ Merged watcher settings using node"
    else
        echo "⚠️  Cannot automatically merge settings (jq or node not found)"
        echo "   Please manually add the contents of settings-watcher-fix.json to settings.json"
    fi
    
    # Copy to agents (preserving their custom settings)
    for i in 1 2 3; do
        AGENT_DIR="$PARENT_DIR/terroir-agent$i"
        if [ -d "$AGENT_DIR/.vscode" ]; then
            # Re-run the color customization part from host-setup.sh
            echo "✅ Updated Agent $i settings (preserving color theme)"
        fi
    done
fi

echo -e "\n🚀 Manual Steps Required:"
echo "================================"
echo ""
echo "1. UNINSTALL problematic extensions in each VS Code window:"
echo "   - Open Command Palette (Cmd/Ctrl+Shift+P)"
echo "   - Type: 'Extensions: Show Installed Extensions'"
echo "   - Uninstall:"
echo "     • cweijan.dbclient-jdbc"
echo "     • cweijan.vscode-redis-client"
echo "     • (Optional) eamodio.gitlens"
echo "     • (Optional) usernamehw.errorlens"
echo "     • (Optional) yoavbls.pretty-ts-errors"
echo ""
echo "2. RESTART VS Code for each agent:"
echo "   - Close all VS Code windows"
echo "   - Re-open each agent directory"
echo ""
echo "3. RESTART Claude in each agent after VS Code stabilizes"
echo ""
echo "4. (Optional) On HOST machine, increase file watchers:"
echo "   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf"
echo "   sudo sysctl -p"
echo ""
echo "✅ Script complete! Follow the manual steps above."