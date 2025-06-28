# Multi-Agent Stabilization Tasks

Last Updated: 2025-06-28

## Current Status
- ✅ Fixed symbolic links on all agent branches
- ✅ Disabled IDE integration in Claude settings
- ✅ Cleaned up VS Code extensions (removed resource-heavy ones)
- ✅ Created watcher exclusion settings (in settings-watcher-fix.json)
- 🔄 VS Code restart in progress

## Completed Actions
1. Updated host-setup.sh to create symbolic links directly
2. Reduced extensions to minimal set (ESLint, Prettier, Markdownlint, Spell Checker)
3. Added problematic extensions to unwantedRecommendations
4. Created settings-watcher-fix.json with file watcher exclusions

## Next Steps After VS Code Restart

### 1. Verify Agent Environment
```bash
# In each agent terminal, verify:
ls -la | grep -E "^l.*(.claude|.agent-coordination)"
echo "Agent: $AGENT_ROLE, Focus: $AGENT_FOCUS"
```

### 2. Apply Watcher Settings Fix
```bash
# Merge watcher exclusions into main settings
node -e "
const fs = require('fs');
const current = JSON.parse(fs.readFileSync('.vscode/settings.json', 'utf8'));
const fixes = JSON.parse(fs.readFileSync('.vscode/settings-watcher-fix.json', 'utf8'));
const merged = { ...current, ...fixes };
fs.writeFileSync('.vscode/settings.json', JSON.stringify(merged, null, 2));
"

# Clean up temporary file
rm .vscode/settings-watcher-fix.json
```

### 3. Update Host-Setup Script
- Already updated to create symbolic links
- Need to test it works correctly for new setups

### 4. Commit Stabilization Changes
```bash
git add -A
git commit -m "fix(multi-agent): stabilize VS Code environment for multi-agent setup

- Reduce extensions to essential set only
- Add file watcher exclusions for node_modules and build dirs
- Fix symbolic link creation in host-setup
- Disable IDE integration to prevent conflicts"
```

### 5. Monitor Agent Work
- Check recent commits on agent branches
- Watch for coordination files in .agent-coordination/
- Be ready to help with merge conflicts

## Agent Status Summary

### Agent 1 (Utilities) - feat/utilities
- Ready to work on utility extraction
- No commits yet

### Agent 2 (Infrastructure) - feat/infrastructure  
- ✅ Already made commit: "fix(ci): standardize pnpm version"
- Working on GitHub Actions setup

### Agent 3 (Documentation) - feat/documentation
- Ready to work on documentation
- No commits yet

## Troubleshooting Notes

If extension host crashes persist:
1. Check memory usage: `free -h`
2. Increase file watchers on host: `echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf`
3. Consider disabling GitHub Copilot temporarily
4. Ensure no duplicate node_modules watchers

## Files Created During Stabilization
- `.vscode/settings-watcher-fix.json` - Temporary, merge then delete
- `.vscode/extensions-cleanup.json` - Reference, can delete
- `.claude/multi-agent/scripts/diagnose-extension-crash.sh` - Keep for future debugging
- `.claude/multi-agent/scripts/apply-extension-fixes.sh` - Keep for future use
- `.claude/multi-agent/scripts/fix-agent-symlinks.sh` - Can delete (functionality moved to host-setup)

---

Resume here after VS Code restart!