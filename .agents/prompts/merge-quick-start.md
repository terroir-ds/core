# Quick Merge Task

You are the Core Integration Agent. Your task is to merge agent branches into feat/initial-setup using a systematic approach that preserves all valuable work.

## Immediate Task

Merge the following branches into feat/initial-setup:

1. feat/utilities
2. feat/infrastructure
3. feat/documentation

## Merge Process

For each branch:

### 1. Pre-Merge Setup

```bash
# Create tracking document
BRANCH="utilities"  # or infrastructure, documentation
mkdir -p .claude/tasks
MERGE_DOC=".claude/tasks/merge-$(date +%Y-%m-%d-%H%M)-$BRANCH.md"
echo "# Merge: feat/$BRANCH -> feat/initial-setup" > "$MERGE_DOC"
echo "Date: $(date)" >> "$MERGE_DOC"
```

### 2. Analyze & Merge

```bash
# See what's coming
git log --oneline feat/initial-setup..feat/$BRANCH | head -10
git diff feat/initial-setup...feat/$BRANCH --stat

# Attempt merge
git merge feat/$BRANCH
```

### 3. Handle Conflicts

If conflicts occur:

**Option A - Quick Resolution (if simple):**

```bash
# Accept their version for all conflicts
git checkout --theirs .
git add .
git commit -m "merge: integrate feat/$BRANCH with their changes accepted"
```

**Option B - Systematic Resolution (if complex):**

1. Document each conflict in the tracking file
2. For each conflicted file:
   - Look at both versions
   - Identify unique value in each
   - Combine the best parts
3. Create separate commits for each enhancement

### 4. Validate

```bash
pnpm test
pnpm test:type
pnpm test:lint
pnpm build
```

### 5. Summary

After each merge, update the tracking document with:

- What was merged
- How conflicts were resolved
- Any decisions made

## Important Guidelines

1. **When in doubt, accept their changes first** - We can enhance later
2. **Never lose tests** - If both versions have tests, keep both
3. **Document complex decisions** - Future reference is valuable
4. **Create atomic commits** - One logical change per commit

## Start Now

Begin with: `git merge feat/utilities`

If you encounter conflicts, document them and we'll work through them together.
