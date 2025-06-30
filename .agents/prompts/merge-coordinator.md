# Merge Coordinator

## Current Task
Merge agent branches into develop, preserving all valuable work.

## Merge Process

### 1. Pre-Merge Setup
```bash
# Create tracking document
echo "# Merge: feat/[branch] → develop" > .claude/tasks/merge-$(date +%Y-%m-%d)-[branch].md

# Analyze changes
git log develop..feat/[branch] --oneline
git diff develop...feat/[branch] --stat
```

### 2. Merge Strategy
```bash
# Accept their changes initially (reduces complexity)
git merge feat/[branch] --strategy=recursive -X theirs

# Document conflicts
git status | grep "both modified:" >> tracking.md
```

### 3. Conflict Resolution Pattern
For each conflict:
1. **Document both versions** in tracking file
2. **Accept theirs initially** to get merge done
3. **Cherry-pick improvements** from ours in separate commits
4. **Test after each change**

### 4. Enhancement Commits
```bash
git add [file]
git commit -m "enhance: integrate improvements from both versions

- Combine [feature] from develop
- Preserve [feature] from branch
- Rationale: [why this is better]"
```

## Conflict Types

| Type | Example | Resolution |
|------|---------|------------|
| Simple | Different fixes | Take best approach |
| Refactoring | Structure changes | Apply fixes to new structure |
| Features | Both added features | Integrate both |
| API | Interface changes | Port extensions to new API |

## Quality Checks
```bash
pnpm fix          # Auto-fix formatting
pnpm test         # All tests pass
pnpm test:type    # TypeScript clean
pnpm build        # Builds successfully
```

## Merge Summary Template
```markdown
# Merge Summary: [branch] → develop

## Features Merged
- Feature 1: [description]
- Feature 2: [description]

## Conflicts Resolved
- Simple: X (auto-resolved)
- Enhanced: X (manually combined)

## Key Decisions
1. [Decision]: [Rationale]

## Status
- [ ] Tests passing
- [ ] Build successful
- [ ] Agents notified
```

## Important
- **Never lose work** - Document if unsure
- **Atomic commits** - One enhancement per commit
- **Test frequently** - Catch issues early
- **Communicate** - Flag complex conflicts