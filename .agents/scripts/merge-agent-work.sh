#!/usr/bin/env bash
# Merge agent work into develop with systematic conflict resolution

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the branch to merge
BRANCH="${1:-}"
if [ -z "$BRANCH" ]; then
    echo -e "${RED}Error: Please specify the branch to merge${NC}"
    echo "Usage: $0 <branch-name>"
    echo "Example: $0 feat/utilities"
    exit 1
fi

# Create tracking document
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H-%M-%S)
MERGE_DOC=".claude/tasks/merge-${DATE}-${TIME}-${BRANCH#feat/}.md"
mkdir -p .claude/tasks

echo -e "${BLUE}📝 Creating merge tracking document: $MERGE_DOC${NC}"

# Initialize tracking document
cat > "$MERGE_DOC" << EOF
# Merge Tracking: $BRANCH -> develop
Date: $(date)
Status: In Progress

## Pre-Merge Analysis

### Incoming Changes Summary
\`\`\`bash
$(git diff develop...$BRANCH --stat)
\`\`\`

### Recent Commits
\`\`\`bash
$(git log develop..$BRANCH --oneline | head -10)
\`\`\`

## Conflicts Encountered

EOF

# Show what's coming
echo -e "${BLUE}📊 Analyzing incoming changes...${NC}"
echo "Files changed: $(git diff develop...$BRANCH --name-only | wc -l)"
echo "Commits to merge: $(git rev-list --count develop..$BRANCH)"

# Attempt the merge
echo -e "${YELLOW}🔀 Attempting merge of $BRANCH...${NC}"
if git merge $BRANCH --no-commit --no-ff; then
    echo -e "${GREEN}✅ Merge completed without conflicts!${NC}"
    git commit -m "merge: integrate changes from $BRANCH

- No conflicts encountered
- All changes integrated successfully

Co-Authored-By: Claude <noreply@anthropic.com>"
    echo "Status: Completed - No Conflicts" >> "$MERGE_DOC"
else
    echo -e "${RED}❌ Conflicts detected!${NC}"
    
    # Document conflicts
    echo -e "${YELLOW}📋 Documenting conflicts...${NC}"
    
    # Get list of conflicted files
    CONFLICTS=$(git diff --name-only --diff-filter=U)
    echo "$CONFLICTS" | while read -r file; do
        if [ -n "$file" ]; then
            echo -e "${YELLOW}  - $file${NC}"
            cat >> "$MERGE_DOC" << EOF

---

## Conflict: $file

**Type**: [To be determined]
**Lines**: [To be determined]

### Our Version (develop)
\`\`\`$(basename "$file" | sed 's/.*\.//')
$(git show :2:"$file" 2>/dev/null | head -50 || echo "[Content not available]")
\`\`\`

### Their Version ($BRANCH)
\`\`\`$(basename "$file" | sed 's/.*\.//')
$(git show :3:"$file" 2>/dev/null | head -50 || echo "[Content not available]")
\`\`\`

### Resolution Strategy
- [ ] Initially accepted: [ours/theirs]
- [ ] Enhancements needed: [describe]
- [ ] Testing focus: [what to verify]

### Final Resolution
- [ ] Enhanced
- [ ] Tested
- [ ] Committed

EOF
        fi
    done
    
    echo -e "${BLUE}📄 Conflict documentation written to: $MERGE_DOC${NC}"
    echo -e "${YELLOW}⚠️  Please resolve conflicts manually:${NC}"
    echo "1. Open $MERGE_DOC"
    echo "2. For each conflict, decide on resolution strategy"
    echo "3. After resolving, run validation:"
    echo "   pnpm test && pnpm test:type && pnpm test:lint"
    echo "4. Commit with descriptive message"
fi

# Add helper commands to the document
cat >> "$MERGE_DOC" << 'EOF'

## Helper Commands

```bash
# Show conflict markers
git diff --check

# Show common ancestor version
git show :1:filename

# Accept their version
git checkout --theirs filename

# Accept our version  
git checkout --ours filename

# After resolving
git add filename
git commit

# Validate changes
pnpm fix
pnpm test
pnpm test:type
pnpm test:lint
pnpm build
```
EOF

echo -e "${GREEN}✅ Merge tracking document created: $MERGE_DOC${NC}"