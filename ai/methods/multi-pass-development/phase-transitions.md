# Phase Transition Protocol

## Quick Context
- **Purpose**: Ensure clean transitions between development phases
- **When**: Before moving to next phase
- **Time**: 5-10 minutes per transition

## Transition Checklist

### Before ANY Transition
1. **Summarize Current Phase**
   ```markdown
   ## Phase [N] Summary
   - What was accomplished: [list key items]
   - Key decisions: [important choices made]
   - Patterns identified: [reusable solutions found]
   ```

2. **Get User Confirmation**
   ```
   "Phase [N] complete. Summary:
   [brief summary]
   Ready to proceed to Phase [N+1]?"
   ```

3. **Update Task File**
   ```markdown
   **Current Phase**: Phase [N+1] - [Phase Name]
   **Phase Guide**: /ai/methods/multi-pass-development/phase-[N+1]-[name].md
   **Started**: [timestamp]
   ```

4. **Commit Current Work**
   ```bash
   git add .
   git commit -m "feat: complete phase [N] - [brief summary]
   
   - [key accomplishment 1]
   - [key accomplishment 2]"
   ```

5. **Clean Context Window**
   - User: "Let's clean the context before Phase [N+1]"
   - Start fresh with task file + next phase guide only

## Specific Transition Requirements

### Pass 1 → Pass 2
✅ Basic functionality works
✅ At least one test passes
✅ No blocking errors
❌ Don't need all features yet

### Pass 2 → Pass 3  
✅ Code is clean and organized
✅ Patterns properly applied
✅ Types well-defined
❌ Don't need performance yet

### Pass 3 → Pass 4
✅ All edge cases handled
✅ Input validation complete
✅ Security considered
❌ Don't need full test coverage yet

### Pass 4 → Pass 5
✅ Test coverage >90%
✅ All tests passing
✅ Performance acceptable
❌ Don't need documentation yet

### Pass 5 → Done (or Pass 6)
✅ Documentation complete
✅ Patterns extracted to `/ai/patterns/`
✅ Standards documented
✅ Check for "tech debt review" in task

### Pass 6 → Done (TOCK only)
✅ Recent standards applied
✅ Related code updated
✅ Tech debt addressed
✅ All tests still passing

## Example Transition

```
Agent: "Phase 2 complete. Summary:
- Refactored truncate function with options interface  
- Extracted normalizeOptions helper
- Applied TypeScript best practices

Ready to proceed to Phase 3 (Make it Safe)?"

User: "Yes, looks good. Please proceed."

Agent: [Updates task file, commits, requests context clean]
```

## Common Mistakes
❌ Moving to next phase without user confirmation
❌ Not updating task file metadata
❌ Carrying too much context forward
❌ Skipping the commit
❌ Not summarizing accomplishments