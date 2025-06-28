#!/bin/bash
# sync-agents.sh - Synchronize work from all agents

set -e

echo "🔄 Terroir Agent Synchronization"
echo "================================"
echo "Time: $(date)"
echo ""

# Get paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MAIN_REPO="$(cd "$SCRIPT_DIR/../../.." && pwd)"
PARENT_DIR="$(dirname "$MAIN_REPO")"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Function to check if branch has changes
has_changes() {
    local dir=$1
    cd "$dir"
    git status --porcelain | grep -q . || return 1
}

# Function to commit changes
commit_changes() {
    local agent_id=$1
    local dir=$2
    
    cd "$dir"
    if has_changes "$dir"; then
        echo "📝 Agent $agent_id has uncommitted changes, committing..."
        git add -A
        git commit -m "chore(agent$agent_id): sync checkpoint - $TIMESTAMP" || true
    fi
}

# Step 1: Ensure all agents commit their work
echo "📌 Step 1: Committing agent work..."
for i in 1 2 3; do
    commit_changes $i "$PARENT_DIR/terroir-agent$i"
done

# Step 2: Push all branches
echo -e "\n📤 Step 2: Pushing agent branches..."
for i in 1 2 3; do
    cd "$PARENT_DIR/terroir-agent$i"
    BRANCH=$(git branch --show-current)
    echo "Pushing Agent $i ($BRANCH)..."
    git push origin "$BRANCH" || true
done

# Step 3: Create integration branch in main repo
echo -e "\n🔀 Step 3: Creating integration branch..."
cd "$MAIN_REPO"
git fetch --all

# Create new integration branch from main
INTEGRATION_BRANCH="integration/$TIMESTAMP"
git checkout main
git pull origin main
git checkout -b "$INTEGRATION_BRANCH"

# Step 4: Merge all agent branches
echo -e "\n🔗 Step 4: Merging agent work..."
MERGE_CONFLICTS=false

for i in 1 2 3; do
    cd "$PARENT_DIR/terroir-agent$i"
    BRANCH=$(git branch --show-current)
    
    echo "Merging $BRANCH (Agent $i)..."
    cd "$MAIN_REPO"
    
    if ! git merge "origin/$BRANCH" --no-ff -m "merge: integrate agent $i work - $TIMESTAMP"; then
        echo "⚠️  Merge conflict detected with Agent $i!"
        MERGE_CONFLICTS=true
        
        # Document conflict
        cat >> "$PARENT_DIR/terroir-shared/.agent-coordination/CONFLICTS-$TIMESTAMP.md" << EOF
## Conflict with Agent $i

Branch: $BRANCH
Time: $(date)

Files in conflict:
$(git diff --name-only --diff-filter=U)

To resolve:
1. Open the main repo
2. Resolve conflicts in listed files
3. Run: git add . && git commit
EOF
    fi
done

# Step 5: Run tests if no conflicts
if [ "$MERGE_CONFLICTS" = false ]; then
    echo -e "\n🧪 Step 5: Running integration tests..."
    
    # Install dependencies if needed
    if [ -f "pnpm-lock.yaml" ]; then
        pnpm install
    fi
    
    # Run tests
    if pnpm test && pnpm build; then
        echo "✅ All tests passed!"
        
        # Step 6: Update agent branches
        echo -e "\n🔄 Step 6: Updating agent branches..."
        
        for i in 1 2 3; do
            cd "$PARENT_DIR/terroir-agent$i"
            BRANCH=$(git branch --show-current)
            
            echo "Updating Agent $i..."
            git fetch origin
            git rebase "$INTEGRATION_BRANCH"
        done
        
        # Step 7: Optionally push integration branch
        echo -e "\n💾 Step 7: Saving integration branch..."
        cd "$MAIN_REPO"
        git push origin "$INTEGRATION_BRANCH"
        
        echo -e "\n✅ Synchronization complete!"
        echo "Integration branch: $INTEGRATION_BRANCH"
        
    else
        echo "❌ Tests failed! Agents should pull latest main and fix issues."
        
        # Document test failure
        cat > "$PARENT_DIR/terroir-shared/.agent-coordination/TEST-FAILURE-$TIMESTAMP.md" << EOF
# Test Failure Report

Time: $(date)
Integration Branch: $INTEGRATION_BRANCH

## Next Steps
1. Check test output above
2. Agents coordinate to fix issues
3. Re-run sync after fixes
EOF
    fi
else
    echo -e "\n⚠️  Conflicts detected! Manual resolution required."
    echo "See: $PARENT_DIR/terroir-shared/.agent-coordination/CONFLICTS-$TIMESTAMP.md"
    
    # Create resolution script
    cat > "$PARENT_DIR/resolve-conflicts-$TIMESTAMP.sh" << EOF
#!/bin/bash
# Quick script to help resolve conflicts

cd "$MAIN_REPO"
echo "Current conflicts:"
git diff --name-only --diff-filter=U

echo -e "\nTo resolve:"
echo "1. Edit conflicted files"
echo "2. Run: git add ."
echo "3. Run: git commit"
echo "4. Run: $SCRIPT_DIR/sync-agents.sh"
EOF
    
    chmod +x "$PARENT_DIR/resolve-conflicts-$TIMESTAMP.sh"
    echo -e "\nHelper script: $PARENT_DIR/resolve-conflicts-$TIMESTAMP.sh"
fi

# Step 8: Update coordination files
echo -e "\n📋 Updating coordination status..."
cat >> "$PARENT_DIR/terroir-shared/.agent-coordination/sync-log.md" << EOF

## Sync: $TIMESTAMP
- Conflicts: $([ "$MERGE_CONFLICTS" = true ] && echo "Yes" || echo "No")
- Tests: $([ "$MERGE_CONFLICTS" = false ] && echo "Passed" || echo "Skipped")
- Integration Branch: $INTEGRATION_BRANCH

### Agent Status
$(cd "$PARENT_DIR" && ./agent-status.sh)

---
EOF

# Show summary
echo -e "\n📊 Sync Summary:"
echo "- Timestamp: $TIMESTAMP"
echo "- Conflicts: $([ "$MERGE_CONFLICTS" = true ] && echo "⚠️  Yes" || echo "✅ No")"
echo "- Tests: $([ "$MERGE_CONFLICTS" = false ] && echo "✅ Passed" || echo "⏭️  Skipped")"
echo "- Integration Branch: $INTEGRATION_BRANCH"

# Show next sync time
CURRENT_HOUR=$(date +%H)
if [ $CURRENT_HOUR -lt 10 ]; then
    NEXT_SYNC="10:00 AM"
elif [ $CURRENT_HOUR -lt 14 ]; then
    NEXT_SYNC="2:00 PM"
elif [ $CURRENT_HOUR -lt 18 ]; then
    NEXT_SYNC="6:00 PM"
else
    NEXT_SYNC="10:00 AM tomorrow"
fi

echo -e "\n⏰ Next sync: $NEXT_SYNC"