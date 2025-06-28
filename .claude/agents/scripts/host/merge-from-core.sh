#!/bin/bash
# merge-from-core.sh - Safely merge core branch changes into agent branch
# Usage: ./merge-from-core.sh [core-branch]
# Example: ./merge-from-core.sh feat/initial-setup

set -e

echo "🔄 Agent Merge Helper - Merging FROM Core"
echo "========================================"

# Determine core branch
CORE_BRANCH="${1:-feat/initial-setup}"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Check if we're on an agent branch
if [[ "$CURRENT_BRANCH" == "main" ]] || [[ "$CURRENT_BRANCH" == "feat/initial-setup" ]]; then
    echo "❌ Error: You appear to be on the core branch ($CURRENT_BRANCH)"
    echo "   This script should be run from an agent branch (feat/utilities, etc.)"
    exit 1
fi

echo "📍 Current branch: $CURRENT_BRANCH"
echo "📥 Merging from: $CORE_BRANCH"
echo ""

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "❌ Error: You have uncommitted changes"
    echo "   Please commit or stash them first"
    exit 1
fi

# Files to exclude from merge (agent-specific)
EXCLUDE_FILES=(
    ".devcontainer/devcontainer.json"
    ".vscode/settings.json"
)

# Directories to exclude from merge
EXCLUDE_DIRS=(
    ".claude"
)

echo "🔍 Fetching latest changes..."
git fetch origin

echo ""
echo "📊 Changes to be merged:"
git log --oneline "$CURRENT_BRANCH".."$CORE_BRANCH" | head -10
echo ""

read -p "Continue with merge? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Merge cancelled"
    exit 1
fi

echo ""
echo "🔀 Starting merge..."

# Start the merge but don't commit
if ! git merge "$CORE_BRANCH" --no-commit --no-ff; then
    echo ""
    echo "⚠️  Merge conflicts detected!"
    echo ""
    echo "🛠️  Applying agent-specific exclusions..."
    
    # Reset excluded directories
    for dir in "${EXCLUDE_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            echo "   Excluding directory: $dir/"
            git reset HEAD "$dir/" 2>/dev/null || true
            git checkout HEAD -- "$dir/" 2>/dev/null || true
            rm -rf "$dir" 2>/dev/null || true
        fi
    done
    
    # Reset excluded files
    for file in "${EXCLUDE_FILES[@]}"; do
        if git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
            echo "   Preserving agent version: $file"
            git reset HEAD "$file" 2>/dev/null || true
            git checkout HEAD -- "$file" 2>/dev/null || true
        fi
    done
    
    echo ""
    echo "📝 Remaining conflicts to resolve manually:"
    git diff --name-only --diff-filter=U
    echo ""
    echo "After resolving conflicts:"
    echo "  1. git add <resolved-files>"
    echo "  2. git commit"
    echo ""
    echo "Or to abort: git merge --abort"
    exit 1
fi

# Merge succeeded without conflicts, apply exclusions
echo "✅ Merge successful, applying agent-specific exclusions..."

# Reset excluded directories
for dir in "${EXCLUDE_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "   Excluding directory: $dir/"
        git reset HEAD "$dir/" 2>/dev/null || true
        git checkout HEAD -- "$dir/" 2>/dev/null || true
        rm -rf "$dir" 2>/dev/null || true
    fi
done

# Reset excluded files
for file in "${EXCLUDE_FILES[@]}"; do
    if git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
        echo "   Preserving agent version: $file"
        git reset HEAD "$file" 2>/dev/null || true
        git checkout HEAD -- "$file" 2>/dev/null || true
    fi
done

echo ""
echo "📊 Changes staged for commit:"
git status --short

echo ""
echo "✨ Ready to commit!"
echo ""
echo "Suggested commit message:"
echo "  git commit -m \"merge: integrate changes from $CORE_BRANCH"
echo ""
echo "              Excluded agent-specific files:"
echo "              - .claude/ directory"
echo "              - .devcontainer/devcontainer.json"
echo "              - .vscode/settings.json\""
echo ""
echo "Or customize: git commit -e"