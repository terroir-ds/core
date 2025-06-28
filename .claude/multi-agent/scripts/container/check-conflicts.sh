#!/bin/bash
# check-conflicts.sh - Proactively detect potential conflicts between agents

set -e

echo "🔍 Conflict Detection Report"
echo "==========================="
echo "Time: $(date)"
echo ""

# Get paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PARENT_DIR="$(dirname "$(cd "$SCRIPT_DIR/../../.." && pwd)")"
COORDINATION_DIR="$PARENT_DIR/terroir-shared/.agent-coordination"

# Initialize conflict tracking
CONFLICTS=()
WARNINGS=()

# Function to check file claims
check_multiple_claims() {
    local file=$1
    local claims=()
    
    for claim in "$COORDINATION_DIR/claims/"*; do
        if [ -f "$claim" ]; then
            claim_file=$(basename "$claim" | sed 's/\.agent[0-9]$//')
            if [ "$claim_file" = "$file" ]; then
                claims+=("$(basename "$claim")")
            fi
        fi
    done
    
    if [ ${#claims[@]} -gt 1 ]; then
        CONFLICTS+=("Multiple agents claiming $file: ${claims[*]}")
    fi
}

# Check 1: Multiple agents editing same file
echo "🔒 Checking for file conflicts..."
if [ -d "$COORDINATION_DIR/claims" ]; then
    # Get unique filenames being claimed
    claimed_files=$(ls "$COORDINATION_DIR/claims" 2>/dev/null | sed 's/\.agent[0-9]$//' | sort -u)
    
    for file in $claimed_files; do
        check_multiple_claims "$file"
    done
fi

# Check 2: Uncommitted changes in shared files
echo "📝 Checking uncommitted changes in shared files..."
SHARED_FILES=("package.json" "tsconfig.json" "pnpm-workspace.yaml" ".github/workflows/*")

for i in 1 2 3; do
    cd "$PARENT_DIR/terroir-agent$i"
    
    for pattern in "${SHARED_FILES[@]}"; do
        if git status --porcelain | grep -q "$pattern"; then
            WARNINGS+=("Agent $i has uncommitted changes to shared file: $pattern")
        fi
    done
done

# Check 3: Divergent branches
echo "🌿 Checking branch divergence..."
cd "$PARENT_DIR/terroir-agent1"  # Use any agent dir
git fetch --all --quiet

for i in 1 2 3; do
    cd "$PARENT_DIR/terroir-agent$i"
    BRANCH=$(git branch --show-current)
    
    # Check how far behind/ahead of origin
    BEHIND=$(git rev-list --count HEAD..origin/$BRANCH 2>/dev/null || echo 0)
    AHEAD=$(git rev-list --count origin/$BRANCH..HEAD 2>/dev/null || echo 0)
    
    if [ $BEHIND -gt 10 ]; then
        WARNINGS+=("Agent $i is $BEHIND commits behind origin/$BRANCH")
    fi
    
    if [ $AHEAD -gt 20 ]; then
        WARNINGS+=("Agent $i is $AHEAD commits ahead - consider pushing")
    fi
done

# Check 4: Lock file age (stale locks)
echo "⏰ Checking for stale locks..."
if [ -d "$COORDINATION_DIR/locks" ]; then
    find "$COORDINATION_DIR/locks" -name "*.lock" -mmin +120 | while read lock; do
        WARNINGS+=("Stale lock (>2 hours): $(basename "$lock")")
    done
fi

# Check 5: Check for blocking issues
echo "🚧 Checking for blockers..."
if [ -d "$COORDINATION_DIR/blocks" ]; then
    block_count=$(ls "$COORDINATION_DIR/blocks" 2>/dev/null | wc -l)
    if [ $block_count -gt 0 ]; then
        CONFLICTS+=("$block_count blocking issues need attention!")
        
        # List blockers
        for blocker in "$COORDINATION_DIR/blocks"/*; do
            if [ -f "$blocker" ]; then
                echo "  - $(basename "$blocker"): $(head -n 1 "$blocker" 2>/dev/null)"
            fi
        done
    fi
fi

# Check 6: Overlapping work areas
echo "🔀 Checking for overlapping work..."
for i in 1 2 3; do
    cd "$PARENT_DIR/terroir-agent$i"
    
    # Get list of modified files
    MODIFIED_FILES=$(git diff --name-only origin/main...HEAD 2>/dev/null || true)
    
    # Check if agent is working outside their area
    case $i in
        1)  # Utilities agent
            if echo "$MODIFIED_FILES" | grep -E "^\.(github|docs)/"; then
                WARNINGS+=("Agent 1 modifying files outside utilities area")
            fi
            ;;
        2)  # Infrastructure agent
            if echo "$MODIFIED_FILES" | grep -E "^packages/core/src/utils/"; then
                WARNINGS+=("Agent 2 modifying files in utilities area")
            fi
            ;;
        3)  # Documentation agent
            if echo "$MODIFIED_FILES" | grep -E "^\.(github|scripts)/"; then
                WARNINGS+=("Agent 3 modifying infrastructure files")
            fi
            ;;
    esac
done

# Generate report
echo -e "\n📊 Conflict Report"
echo "=================="

if [ ${#CONFLICTS[@]} -eq 0 ] && [ ${#WARNINGS[@]} -eq 0 ]; then
    echo "✅ No conflicts or warnings detected!"
else
    if [ ${#CONFLICTS[@]} -gt 0 ]; then
        echo -e "\n❌ CONFLICTS (Require immediate attention):"
        for conflict in "${CONFLICTS[@]}"; do
            echo "  - $conflict"
        done
    fi
    
    if [ ${#WARNINGS[@]} -gt 0 ]; then
        echo -e "\n⚠️  WARNINGS (Should be addressed):"
        for warning in "${WARNINGS[@]}"; do
            echo "  - $warning"
        done
    fi
    
    # Write to alert file
    cat > "$COORDINATION_DIR/ALERT-$(date +%Y%m%d-%H%M%S).md" << EOF
# Conflict Detection Alert

Generated: $(date)

## Conflicts
$(printf '%s\n' "${CONFLICTS[@]}" | sed 's/^/- /')

## Warnings  
$(printf '%s\n' "${WARNINGS[@]}" | sed 's/^/- /')

## Recommended Actions
1. Resolve file claim conflicts immediately
2. Commit or stash uncommitted changes to shared files
3. Clear stale locks
4. Address any blocking issues
5. Ensure agents stay in their designated areas
EOF

    echo -e "\n📄 Full report saved to: $COORDINATION_DIR/ALERT-$(date +%Y%m%d-%H%M%S).md"
fi

# Quick recommendations
echo -e "\n💡 Quick Actions:"
echo "1. Run 'sync-agents.sh' if no conflicts"
echo "2. Coordinate with other agents if conflicts exist"
echo "3. Check and clear stale locks"
echo "4. Review any blocking issues"

# Show agent activity summary
echo -e "\n📈 Agent Activity Summary:"
for i in 1 2 3; do
    cd "$PARENT_DIR/terroir-agent$i"
    COMMITS_TODAY=$(git log --since="00:00" --oneline 2>/dev/null | wc -l)
    FILES_CHANGED=$(git diff --name-only origin/main...HEAD 2>/dev/null | wc -l)
    echo "  Agent $i: $COMMITS_TODAY commits today, $FILES_CHANGED files changed"
done