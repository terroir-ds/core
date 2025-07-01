# Phase Transition Protocol

## Quick Context
- **Purpose**: Ensure clean transitions between development phases
- **When**: Before moving to next phase
- **Time**: 5-10 minutes per transition

## Transition Checklist

### Before ANY Transition
1. **Extract Patterns & Standards**
   - Identify reusable patterns from phase work
   - Document new standards discovered
   - Score each pattern instance using [@pattern:pattern-quality-scoring]
   - Create/update pattern files in `/ai/patterns/`
   - Add references to `.ref.md` files with scores

2. **Summarize Current Phase**
   ```markdown
   ## Phase [N] Summary
   - What was accomplished: [list key items]
   - Key decisions: [important choices made]
   - Patterns extracted: [patterns with scores]
   - Standards identified: [new standards found]
   ```

3. **Pattern Extraction Process**
   ```markdown
   For each pattern identified:
   a) Create pattern file if new (or update existing)
   b) Score using appropriate pattern:
      - Pattern instances: [@pattern:pattern-quality-scoring]
      - Code standards: [@pattern:standard-quality-scoring]
      - Other standards: [@pattern:contextual-scoring-pattern]
   c) Add to .ref.md with score and commit hash
   d) Only examples scored 4+ will auto-populate docs
   ```

4. **Get User Confirmation**
   ```
   "Phase [N] complete. Summary:
   [brief summary]
   Patterns extracted: [list with scores]
   Ready to proceed to Phase [N+1]?"
   ```

5. **Update Task File**
   ```markdown
   **Current Phase**: Phase [N+1] - [Phase Name]
   **Phase Guide**: /ai/methods/multi-pass-development/phase-[N+1]-[name].md
   **Started**: [timestamp]
   
   ## Phase [N] Patterns
   - pattern-name (score: 5/5) - exceptional example
   - other-pattern (score: 4/5) - good documentation example
   ```

6. **Commit Current Work**
   ```bash
   git add .
   git commit -m "feat: complete phase [N] - [brief summary]
   
   - [key accomplishment 1]
   - [key accomplishment 2]
   - Extracted patterns: [pattern names with scores]"
   ```

7. **Clean Context Window**
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
✅ Final pattern extraction performed
✅ All patterns scored and documented
✅ Standards documented
✅ Check for "tech debt review" in task
Note: Still follow full transition protocol!

### Pass 6 → Done (TOCK only)
✅ Recent standards applied
✅ Related code updated
✅ Tech debt addressed
✅ All tests still passing
✅ Final pattern review completed
Note: Still follow full transition protocol!

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

## Final Transition (Phase 5/6 → Complete)

The transition from the last phase to task completion follows the same protocol:

1. **Extract Final Patterns** - Last chance to capture patterns
2. **Score All Pattern Instances** - Ensure quality ratings are complete  
3. **Update All References** - Final .ref.md updates
4. **Summarize Entire Task** - Overall accomplishments
5. **Commit Final Work** - Including pattern extractions
6. **Mark Task Complete** - Update task status

### Example Final Transition
```
Agent: "Phase 5 complete. Summary:
- Documentation completed for human and AI audiences
- Final patterns extracted:
  - async-pipeline-pattern (score: 5/5)
  - validation-pattern (score: 4/5)
- All public APIs documented
- Migration guide created

This completes the entire task. Ready to mark as complete?"

User: "Yes, great work!"

Agent: [Updates task file to completed status, final commit]
```

## Common Mistakes
❌ Moving to next phase without user confirmation
❌ Not updating task file metadata
❌ Carrying too much context forward
❌ Skipping the commit
❌ Not summarizing accomplishments
❌ Skipping pattern extraction on final phase