# Multi-Agent Merge Quick Reference

## 🚀 Quick Commands

### From Agent Branch (e.g., feat/utilities)

````bash
# Get latest from core
.agents/scripts/host/merge-from-core.sh

# Check agent state
.agents/scripts/host/check-agent-state.sh

# Fix issues
.agents/scripts/host/check-agent-state.sh --fix
```text
### From Core Branch (main/feat/initial-setup)

```bash
# Merge agent work
.agents/scripts/host/merge-to-core.sh feat/utilities
```text
## ⚠️ Golden Rules

1. **NEVER** commit these in agent branches:
   - `.claude/` directory
   - `.devcontainer/devcontainer.json`
   - `.vscode/settings.json`

2. **ALWAYS** use merge scripts, not plain `git merge`

3. **CHECK** agent state before pushing

## 🔧 Common Issues

### "Files that should be core-only"

```bash
# From agent branch
git rm --cached .claude/
git rm --cached .devcontainer/devcontainer.json
git rm --cached .vscode/settings.json
git commit -m "fix: remove core-only files from agent branch"
```text
### Symlink broken

```bash
# Recreate symlink
rm -rf .claude
ln -sf /workspaces/terroir-core/.claude .claude
```text
### After accidental merge

```bash
# Reset to before merge
git reset --hard HEAD~1

# Use the proper script
.agents/scripts/host/merge-from-core.sh
````

## 📋 Merge Checklist

- [ ] Commit all changes first
- [ ] Run appropriate merge script
- [ ] Review staged changes
- [ ] Check no core-only files included
- [ ] Test build still works
- [ ] Commit with descriptive message

## 📝 Note: Migration Complete

Agent tooling has been moved from `.claude/agents/` to `/.agents/` for simpler merges!

## 🎯 Best Practices

1. **Merge frequently** to avoid conflicts
2. **Small, focused commits** in agent branches
3. **Descriptive branch names** for features
4. **Test before merging** to core
5. **Coordinate with other agents** during sync windows
