#!/bin/bash
# Migration script: Move .claude/agents to /.agents
# This simplifies multi-agent merges by keeping agent tooling at root level

set -e

echo "🚀 Migrating .claude/agents to /.agents"
echo "====================================="
echo ""
echo "This will:"
echo "  1. Move .claude/agents/ to /.agents/"
echo "  2. Update all script references"
echo "  3. Update .gitignore"
echo "  4. Commit the changes"
echo ""

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"
echo ""

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "❌ Error: You have uncommitted changes"
    echo "   Please commit or stash them first"
    exit 1
fi

read -p "Continue with migration? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 1
fi

echo ""
echo "📁 Moving directories..."

# Create backup
cp -r .claude .claude.backup.migration.$(date +%Y%m%d-%H%M%S)

# Move agents directory to root
if [ -d ".claude/agents" ]; then
    mv .claude/agents .agents
    echo "✅ Moved .claude/agents/ to /.agents/"
else
    echo "❌ .claude/agents directory not found"
    exit 1
fi

echo ""
echo "📝 Updating script references..."

# Update all references in the moved scripts
find .agents -name "*.sh" -type f -exec sed -i \
    -e 's|\.claude/agents/|.agents/|g' \
    -e 's|/\.claude/agents/|/.agents/|g' \
    -e 's|"\$BASE_DIR/prompts/|"$BASE_DIR/.agents/prompts/|g' \
    -e 's|"\.\./prompts/|"../.agents/prompts/|g' \
    {} \;

# Update references in .claude/tasks
find .claude/tasks -name "*.md" -type f -exec sed -i \
    -e 's|\.claude/agents/|.agents/|g' \
    {} \;

# Update setup.sh specifically for symlink creation
sed -i 's|ln -sf /workspaces/terroir-core/\.claude |ln -sf /workspaces/terroir-core/.claude |g' .agents/scripts/host/setup.sh

echo "✅ Updated script references"

echo ""
echo "📝 Updating .gitignore..."

# Check if /.agents is already in .gitignore
if ! grep -q "^/\.agents$" .gitignore; then
    # Add .agents to .gitignore if not present
    echo "" >> .gitignore
    echo "# Multi-agent tooling (shared across all branches)" >> .gitignore
    echo "# Note: We track this in all branches for consistency" >> .gitignore
    echo "# /.agents" >> .gitignore
    echo "✅ Added /.agents entry to .gitignore (commented out)"
else
    echo "✅ /.agents already in .gitignore"
fi

echo ""
echo "📝 Creating migration notes..."

cat > .agents/MIGRATION-NOTES.md << EOF
# Migration from .claude/agents to /.agents

## Date: $(date +%Y-%m-%d)

## Reason for Migration

Moving agent tooling from \`.claude/agents/\` to \`/.agents/\` simplifies the multi-agent merge process:

1. **Shared across all branches** - No merge conflicts for agent tooling
2. **No symlinks needed** - All branches have the same \`/.agents\` directory
3. **Simpler merges** - Only need to handle \`.devcontainer/devcontainer.json\` and \`.vscode/settings.json\`
4. **Cleaner separation** - \`.claude/\` for AI session data, \`/.agents/\` for tooling
5. **Standard pattern** - Follows convention like \`.github/\`, \`.vscode/\`, etc.

## What Changed

- \`.claude/agents/\` → \`/.agents/\`
- All script references updated
- Symlink creation simplified (only need \`.claude\`, not \`.claude/agents\`)

## Impact on Existing Setups

After pulling this change, existing agent worktrees need to:
1. Remove old symlinks: \`rm -f .claude\`
2. Re-run setup: \`/.agents/scripts/host/setup.sh\`

This will create the correct symlinks to the new structure.
EOF

echo "✅ Created migration notes"

echo ""
echo "📊 Summary of changes:"
git status --short

echo ""
echo "💾 Committing migration..."

git add -A
git commit -m "refactor: migrate agent tooling from .claude/agents to /.agents

- Move .claude/agents/ to /.agents/ for simpler multi-agent merges
- Update all script references to new location
- Keep .claude/ for AI session data only
- Simplify merge process by sharing agent tooling across all branches
- Follow standard hidden directory convention (.github, .vscode, etc)

This eliminates merge conflicts for agent tooling since /.agents will be
identical across all branches. Only .devcontainer/devcontainer.json and
.vscode/settings.json remain as agent-specific files.

Migration required for existing setups:
1. Remove old symlinks: rm -f .claude
2. Re-run setup: /.agents/scripts/host/setup.sh

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo ""
echo "✅ Migration complete!"
echo ""
echo "📋 Next steps:"
echo "1. Push this change to the repository"
echo "2. In each agent worktree:"
echo "   - Pull the latest changes"
echo "   - Remove old symlink: rm -f .claude"
echo "   - Re-run setup: /.agents/scripts/host/setup.sh"
echo ""
echo "The merge process is now much simpler!"