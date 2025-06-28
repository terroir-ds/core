#!/bin/bash
# merge-to-core.sh - Safely merge agent branch changes into core branch
# Usage: ./merge-to-core.sh [agent-branch]
# Example: ./merge-to-core.sh feat/utilities

set -e

echo "🔄 Core Merge Helper - Merging FROM Agent"
echo "========================================"

# Determine agent branch
AGENT_BRANCH="${1}"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Check if we're on a core branch
if [[ "$CURRENT_BRANCH" != "main" ]] && [[ "$CURRENT_BRANCH" != "feat/initial-setup" ]]; then
    echo "❌ Error: You don't appear to be on a core branch ($CURRENT_BRANCH)"
    echo "   This script should be run from main or feat/initial-setup"
    echo ""
    echo "   Switch to core branch first:"
    echo "   git checkout feat/initial-setup"
    exit 1
fi

# If no agent branch specified, show options
if [ -z "$AGENT_BRANCH" ]; then
    echo "❌ Error: No agent branch specified"
    echo ""
    echo "Usage: $0 <agent-branch>"
    echo ""
    echo "Available agent branches:"
    git branch -a | grep -E "feat/(utilities|infrastructure|documentation)" | sed 's/^[* ]*/  /'
    exit 1
fi

echo "📍 Current branch: $CURRENT_BRANCH (core)"
echo "📥 Merging from: $AGENT_BRANCH (agent)"
echo ""

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "❌ Error: You have uncommitted changes"
    echo "   Please commit or stash them first"
    exit 1
fi

echo "🔍 Fetching latest changes..."
git fetch origin

# Check if agent branch exists
if ! git show-ref --verify --quiet "refs/heads/$AGENT_BRANCH"; then
    if git show-ref --verify --quiet "refs/remotes/origin/$AGENT_BRANCH"; then
        echo "📥 Creating local tracking branch for $AGENT_BRANCH"
        git checkout -b "$AGENT_BRANCH" "origin/$AGENT_BRANCH"
        git checkout "$CURRENT_BRANCH"
    else
        echo "❌ Error: Branch $AGENT_BRANCH not found"
        exit 1
    fi
fi

echo ""
echo "📊 Changes to be merged:"
git log --oneline "$CURRENT_BRANCH".."$AGENT_BRANCH" | head -10
echo ""

# Check for problematic files in agent branch
echo "🔍 Checking for files that shouldn't exist in agent branch..."
PROBLEMATIC_FILES=$(git diff --name-only "$CURRENT_BRANCH".."$AGENT_BRANCH" | grep -E "^\.claude/|^\.devcontainer/devcontainer\.json$|^\.vscode/settings\.json$" || true)

if [ -n "$PROBLEMATIC_FILES" ]; then
    echo "⚠️  WARNING: Agent branch contains files that should be core-only:"
    echo "$PROBLEMATIC_FILES" | sed 's/^/    /'
    echo ""
    echo "These files will be excluded from the merge."
    echo ""
fi

read -p "Continue with merge? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Merge cancelled"
    exit 1
fi

echo ""
echo "🔀 Starting merge..."

# Start the merge but don't commit
if ! git merge "$AGENT_BRANCH" --no-commit --no-ff; then
    echo ""
    echo "⚠️  Merge conflicts detected!"
    echo ""
    
    # If there are conflicts in files that shouldn't be in agent branch, resolve them
    if [ -n "$PROBLEMATIC_FILES" ]; then
        echo "🛠️  Auto-resolving conflicts in core-only files..."
        for file in $PROBLEMATIC_FILES; do
            if [ -f "$file" ]; then
                echo "   Keeping core version: $file"
                git checkout HEAD -- "$file" 2>/dev/null || true
            fi
        done
    fi
    
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

# Merge succeeded without conflicts
echo "✅ Merge successful!"

# If there were problematic files, make sure we're using core versions
if [ -n "$PROBLEMATIC_FILES" ]; then
    echo ""
    echo "🛠️  Ensuring core versions of protected files..."
    for file in $PROBLEMATIC_FILES; do
        if [ -f "$file" ]; then
            echo "   Reverting to core version: $file"
            git checkout HEAD -- "$file" 2>/dev/null || true
        fi
    done
fi

echo ""
echo "📊 Changes staged for commit:"
git status --short | grep -v "^D " | head -20
if [ $(git status --short | wc -l) -gt 20 ]; then
    echo "   ... and $(( $(git status --short | wc -l) - 20 )) more files"
fi

echo ""
echo "✨ Ready to commit!"
echo ""
echo "Suggested commit message:"
echo "  git commit -m \"merge: integrate $AGENT_BRANCH changes"
echo ""
echo "              Merged agent-specific developments"
echo "              Preserved core-only configurations\""
echo ""
echo "Or customize: git commit -e"

# Quick sanity check
echo ""
echo "🔍 Quick sanity check:"
echo -n "   .claude/ directory: "
[ -d ".claude" ] && echo "✅ Present" || echo "❌ Missing!"
echo -n "   .devcontainer/devcontainer.json: "
[ -f ".devcontainer/devcontainer.json" ] && echo "✅ Present" || echo "❌ Missing!"
echo -n "   .vscode/settings.json: "
[ -f ".vscode/settings.json" ] && echo "✅ Present" || echo "❌ Missing!"