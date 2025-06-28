#!/bin/bash
# check-agent-state.sh - Verify agent branch is in correct state
# Usage: ./check-agent-state.sh [--fix]

set -e

FIX_MODE=false
if [ "$1" == "--fix" ]; then
    FIX_MODE=true
fi

echo "🔍 Agent Branch State Checker"
echo "============================"
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Determine if this is an agent branch
IS_AGENT_BRANCH=false
AGENT_NAME=""

case "$CURRENT_BRANCH" in
    feat/utilities)
        IS_AGENT_BRANCH=true
        AGENT_NAME="Utilities (Agent 1)"
        ;;
    feat/infrastructure)
        IS_AGENT_BRANCH=true
        AGENT_NAME="Infrastructure (Agent 2)"
        ;;
    feat/documentation)
        IS_AGENT_BRANCH=true
        AGENT_NAME="Documentation (Agent 3)"
        ;;
    main|feat/initial-setup)
        echo "ℹ️  This is a core branch, not an agent branch"
        echo "   No agent-specific checks needed"
        exit 0
        ;;
esac

if [ "$IS_AGENT_BRANCH" == false ]; then
    echo "⚠️  Unknown branch type"
    echo "   Expected: feat/utilities, feat/infrastructure, feat/documentation"
    echo "   Or core: main, feat/initial-setup"
    exit 1
fi

echo "🤖 Agent: $AGENT_NAME"
echo ""

# Initialize status
ALL_GOOD=true

# Check 1: .claude directory should not be tracked
echo "Checking .claude directory..."
if git ls-files .claude/ --error-unmatch >/dev/null 2>&1; then
    echo "  ❌ .claude/ files are tracked in git (should use symlink)"
    ALL_GOOD=false
    if [ "$FIX_MODE" == true ]; then
        echo "     🔧 Removing from git..."
        git rm -r --cached .claude/ 2>/dev/null || true
    fi
else
    echo "  ✅ .claude/ not tracked"
fi

# Check if .claude is a symlink
if [ -L ".claude" ]; then
    echo "  ✅ .claude is a symlink"
    TARGET=$(readlink .claude)
    echo "     → $TARGET"
elif [ -d ".claude" ]; then
    echo "  ❌ .claude is a directory (should be symlink)"
    ALL_GOOD=false
else
    echo "  ❌ .claude is missing"
    ALL_GOOD=false
    if [ "$FIX_MODE" == true ]; then
        echo "     🔧 Creating symlink..."
        ln -sf /workspaces/terroir-core/.claude .claude
    fi
fi

echo ""

# Check 2: .devcontainer/devcontainer.json should not be tracked
echo "Checking .devcontainer/devcontainer.json..."
if git ls-files --error-unmatch .devcontainer/devcontainer.json >/dev/null 2>&1; then
    echo "  ❌ File is tracked in git (should be agent-specific)"
    ALL_GOOD=false
    if [ "$FIX_MODE" == true ]; then
        echo "     🔧 Removing from git index..."
        git rm --cached .devcontainer/devcontainer.json 2>/dev/null || true
    fi
else
    echo "  ✅ Not tracked in git"
fi

# Check if it exists and is different from core
if [ -f ".devcontainer/devcontainer.json" ]; then
    if [ -f "/workspaces/terroir-core/.agents/templates/devcontainer.json" ]; then
        if ! diff -q .devcontainer/devcontainer.json /workspaces/terroir-core/.agents/templates/devcontainer.json >/dev/null; then
            echo "  ✅ Using agent-specific version"
        else
            echo "  ⚠️  Using generic template (consider customizing)"
        fi
    fi
else
    echo "  ❌ File missing"
    ALL_GOOD=false
fi

echo ""

# Check 3: .vscode/settings.json should not be tracked
echo "Checking .vscode/settings.json..."
if git ls-files --error-unmatch .vscode/settings.json >/dev/null 2>&1; then
    echo "  ❌ File is tracked in git (should be agent-specific)"
    ALL_GOOD=false
    if [ "$FIX_MODE" == true ]; then
        echo "     🔧 Removing from git index..."
        git rm --cached .vscode/settings.json 2>/dev/null || true
    fi
else
    echo "  ✅ Not tracked in git"
fi

# Check if it has agent-specific colors
if [ -f ".vscode/settings.json" ]; then
    case "$CURRENT_BRANCH" in
        feat/utilities)
            if grep -q "#1a4d1a" .vscode/settings.json; then
                echo "  ✅ Has green theme for Utilities agent"
            else
                echo "  ⚠️  Missing agent-specific color theme"
            fi
            ;;
        feat/infrastructure)
            if grep -q "#1a2d4d" .vscode/settings.json; then
                echo "  ✅ Has blue theme for Infrastructure agent"
            else
                echo "  ⚠️  Missing agent-specific color theme"
            fi
            ;;
        feat/documentation)
            if grep -q "#3d1a4d" .vscode/settings.json; then
                echo "  ✅ Has purple theme for Documentation agent"
            else
                echo "  ⚠️  Missing agent-specific color theme"
            fi
            ;;
    esac
else
    echo "  ❌ File missing"
    ALL_GOOD=false
fi

echo ""

# Check 4: Git exclusions
echo "Checking git exclusions..."
WORKTREE_NAME=$(basename $(pwd))
EXCLUDE_FILE="../terroir-core/.git/worktrees/$WORKTREE_NAME/info/exclude"

if [ -f "$EXCLUDE_FILE" ]; then
    MISSING_EXCLUDES=()
    for pattern in ".vscode/settings.json" ".env" ".devcontainer/" "scripts/" ".claude" ".agent-coordination"; do
        if ! grep -q "^$pattern\$" "$EXCLUDE_FILE" 2>/dev/null; then
            MISSING_EXCLUDES+=("$pattern")
        fi
    done
    
    if [ ${#MISSING_EXCLUDES[@]} -eq 0 ]; then
        echo "  ✅ All exclusions present"
    else
        echo "  ❌ Missing exclusions: ${MISSING_EXCLUDES[*]}"
        ALL_GOOD=false
        if [ "$FIX_MODE" == true ]; then
            echo "     🔧 Adding missing exclusions..."
            for pattern in "${MISSING_EXCLUDES[@]}"; do
                echo "$pattern" >> "$EXCLUDE_FILE"
            done
        fi
    fi
else
    echo "  ❌ Exclude file not found: $EXCLUDE_FILE"
    ALL_GOOD=false
fi

echo ""

# Check 5: No uncommitted agent-specific files
echo "Checking for uncommitted agent-specific files..."
UNWANTED_CHANGES=$(git status --porcelain | grep -E "^(M |A |\?\? ).*(\.claude/|devcontainer\.json|settings\.json)" || true)
if [ -z "$UNWANTED_CHANGES" ]; then
    echo "  ✅ No problematic uncommitted files"
else
    echo "  ⚠️  Found uncommitted agent-specific files:"
    echo "$UNWANTED_CHANGES" | sed 's/^/     /'
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$ALL_GOOD" == true ]; then
    echo "✅ Agent branch is properly configured!"
else
    echo "❌ Issues found with agent branch configuration"
    if [ "$FIX_MODE" == false ]; then
        echo ""
        echo "Run with --fix to attempt automatic fixes:"
        echo "  $0 --fix"
    else
        echo ""
        echo "🔧 Attempted fixes. Please review and commit if needed."
    fi
fi

# Final recommendations
echo ""
echo "📝 Remember:"
echo "  - Never commit .claude/, devcontainer.json, or settings.json in agent branches"
echo "  - Use merge-from-core.sh when pulling updates from core"
echo "  - Use merge-to-core.sh when pushing changes to core"