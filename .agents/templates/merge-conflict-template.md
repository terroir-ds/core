# Merge Tracking: feat/[BRANCH] -> develop

Date: [DATE]
Status: In Progress

## Pre-Merge Analysis

### Incoming Changes Summary

```bash
# Stats: X files changed, Y insertions(+), Z deletions(-)
```

### Predicted Conflict Areas

- [ ] File group 1: [description]
- [ ] File group 2: [description]

## Conflicts Encountered

### ❗ Critical Conflicts (Require careful review)

### ⚠️ Complex Conflicts (Multiple features intersecting)

### ℹ️ Simple Conflicts (Straightforward resolution)

---

## Conflict: [FILE-PATH]

**Type**: [Simple|Complex|Critical]
**Lines**: [line-range]

### Our Version (develop)

```typescript
[code block]
```

### Their Version (feat/[branch])

```typescript
[code block]
```

### Analysis

- **Our version adds**: [what unique value it provides]
- **Their version adds**: [what unique value it provides]
- **Overlap**: [what they both try to achieve]

### Resolution Strategy

- [x] Initially accepted: theirs
- [ ] Enhancements needed:
  - [ ] Bring back: [specific feature from ours]
  - [ ] Improve: [specific aspect]
- [ ] Testing focus: [what to verify]

### Final Resolution

- [ ] Enhanced
- [ ] Tested
- [ ] Committed as: [commit-hash]

---

## Post-Merge Checklist

### Validation

- [ ] `pnpm test` - All unit tests passing
- [ ] `pnpm test:type` - TypeScript compilation clean
- [ ] `pnpm test:lint` - No linting errors
- [ ] `pnpm build` - Build successful
- [ ] Manual testing of affected features

### Enhancement Commits

1. [ ] [commit-hash] - enhance(scope): [description]
2. [ ] [commit-hash] - enhance(scope): [description]

## Summary

### Statistics

- Total conflicts: X
- Simple (auto-resolved): X
- Enhanced: X
- Complex resolutions: X

### Key Decisions

1. **Decision**: [what and why]
2. **Decision**: [what and why]

### Lessons Learned

- [What patterns could help avoid future conflicts]
- [What worked well in this merge]

## Next Steps

- [ ] Push merged branch
- [ ] Notify agents to pull updates
- [ ] Document any breaking changes
- [ ] Update agent coordination notes
