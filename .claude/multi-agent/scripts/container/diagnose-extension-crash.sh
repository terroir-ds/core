#!/bin/bash
# diagnose-extension-crash.sh - Diagnose VS Code extension host crashes

echo "🔍 VS Code Extension Host Diagnostic"
echo "===================================="

# Check system resources
echo -e "\n📊 System Resources:"
free -h | grep -E "^Mem:|^Swap:"
echo ""
echo "File descriptor limits:"
ulimit -n

# Check for large directories that might overwhelm file watchers
echo -e "\n📁 Large directories (potential file watching issues):"
find /workspaces/terroir-core -type d -name "node_modules" -o -name ".git" -o -name "dist" -o -name "coverage" | while read dir; do
    count=$(find "$dir" -type f 2>/dev/null | wc -l)
    echo "  $dir: $count files"
done

# Check VS Code logs
echo -e "\n📋 Recent VS Code errors (if accessible):"
if [ -d "$HOME/.config/Code/logs" ]; then
    find "$HOME/.config/Code/logs" -name "*.log" -mmin -10 -exec tail -20 {} \; 2>/dev/null | grep -i -E "error|crash|terminate" | head -10
else
    echo "  VS Code logs not found in expected location"
fi

# Check for problematic extensions
echo -e "\n⚠️  Potentially problematic extensions:"
echo "  - cweijan.dbclient-jdbc (database client - memory intensive)"
echo "  - cweijan.vscode-redis-client (redis client - connection issues)"
echo "  - eamodio.gitlens (can be resource intensive on large repos)"
echo "  - github.vscode-pull-request-github (API rate limits)"

echo -e "\n💡 Recommendations:"
echo "1. Disable non-essential extensions temporarily:"
echo "   - Database/Redis clients (not needed for this project)"
echo "   - GitHub PR extension (if not actively using)"
echo ""
echo "2. Add to VS Code settings.json to reduce file watching:"
echo '   "files.watcherExclude": {'
echo '     "**/node_modules/**": true,'
echo '     "**/.git/objects/**": true,'
echo '     "**/.git/subtree-cache/**": true,'
echo '     "**/dist/**": true,'
echo '     "**/coverage/**": true'
echo '   }'
echo ""
echo "3. Increase file watcher limit (run on host):"
echo "   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf"
echo "   sudo sysctl -p"