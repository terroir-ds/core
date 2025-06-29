#!/usr/bin/env bash
# Enhance merged code by combining best parts from both versions

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Find the most recent merge doc
MERGE_DOC=$(ls -t .claude/tasks/merge-*.md 2>/dev/null | head -1)

if [ -z "$MERGE_DOC" ]; then
    echo -e "${YELLOW}No merge tracking document found.${NC}"
    echo "Looking for merge conflicts in current state..."
    
    # Check for current conflicts
    if git diff --check | grep -q "conflict"; then
        echo -e "${RED}Active conflicts found! Please resolve them first.${NC}"
        git diff --name-only --diff-filter=U
        exit 1
    else
        echo -e "${GREEN}No active conflicts found.${NC}"
        exit 0
    fi
fi

echo -e "${BLUE}📄 Using merge document: $MERGE_DOC${NC}"

# Extract files that need enhancement
echo -e "${YELLOW}🔍 Checking for enhancements needed...${NC}"

# This is a placeholder - in practice, you'd parse the markdown
# For now, we'll provide interactive guidance

echo -e "${BLUE}Enhancement Workflow:${NC}"
echo "1. Review each conflict in: $MERGE_DOC"
echo "2. For each file marked for enhancement:"
echo "   a. Open both versions side by side"
echo "   b. Identify valuable features from rejected version"
echo "   c. Manually integrate those features"
echo "   d. Create atomic commit with clear message"
echo ""
echo -e "${YELLOW}Example enhancement commit:${NC}"
cat << 'EOF'
git add <enhanced-file>
git commit -m "enhance(<scope>): integrate <feature> from both versions

- Preserve <feature1> from original implementation
- Adopt <feature2> from merged branch
- Combine approaches for better <benefit>

Resolved conflict from merge of feat/<branch>"
EOF

echo ""
echo -e "${BLUE}After each enhancement:${NC}"
echo "1. Run tests: pnpm test"
echo "2. Check types: pnpm test:type"
echo "3. Fix linting: pnpm fix"
echo "4. Update tracking document with resolution"

# Provide validation command
echo ""
echo -e "${GREEN}Full validation command:${NC}"
echo "pnpm fix && pnpm test && pnpm test:type && pnpm test:lint && pnpm build"

# Check current state
echo ""
echo -e "${BLUE}Current repository state:${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}Uncommitted changes found:${NC}"
    git status --short
else
    echo -e "${GREEN}Working directory clean${NC}"
fi