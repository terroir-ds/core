# Phase 6: Tech Debt Review (TOCK Tasks Only)

## Quick Context

- **Goal**: Apply accumulated standards and patterns
- **Time Budget**: Varies (typically 10-20% additional)
- **Focus**: Retroactive improvements using new standards

## When This Phase Appears

- Every 3-5 tasks (configured in task manager)
- Task shows: `**Method**: Multi-Pass Development with 6 Phases`
- After Phase 5 completion

## Checklist

- [ ] Review ALL recent patterns in `/ai/patterns/`
- [ ] Review ALL recent standards in `/ai/standards/`
- [ ] Identify patterns relevant to current code domain
- [ ] Apply relevant patterns to current code
- [ ] Update old code in related files
- [ ] Run new linting rules
- [ ] Update documentation
- [ ] Extract any new patterns discovered during tech debt work

## What TO Do

- Load recently created standards
- Search for old patterns to replace
- Apply new utilities where applicable
- Update related code for consistency
- Fix new linting violations
- Improve based on lessons learned

## What NOT to Do

❌ Don't refactor unrelated code
❌ Don't apply every possible pattern
❌ Don't spend excessive time
❌ Don't break existing functionality
❌ Don't skip tests after changes

## Example Tech Debt Review

```typescript
// Recent standard: Use truncate() instead of substring
// Search for old patterns:
// rg "\.substring\(0," --type ts

// Found in related files:
src/components/Card.tsx:  title.substring(0, 50) + '...'
src/utils/format.ts:      text.substring(0, 100) + '...'

// Update to use new standard:
import { truncate } from '@utils/string';

// src/components/Card.tsx
- title.substring(0, 50) + '...'
+ truncate(title, 50)

// src/utils/format.ts  
- text.substring(0, 100) + '...'
+ truncate(text, 100)
```

## Review Sources

1. **Global Pattern Library**: Review ALL patterns for relevance

   ```bash
   # Review pattern index
   cat /ai/patterns/index.ai.md
   
   # Check patterns by domain/tag relevant to current work
   grep -l "tags:.*backend" /ai/patterns/*.ai.md
   ```

2. **Recent Additions**: Focus on newest patterns/standards

   ```bash
   # Last 10 patterns added
   ls -lt /ai/patterns/*.ai.md | head -10
   
   # Last 10 standards added  
   ls -lt /ai/standards/*.ai.md | head -10
   ```

3. **Completed Tasks**: Check patterns from recent work

   ```bash
   # Recent completed tasks for inspiration
   ls -la .completed/ | tail -10
   ```

4. **Linting Rules**: Run with auto-fix

   ```bash
   pnpm fix
   ```

## Scope Guidelines

- Focus on files touched in current task
- Include closely related files
- Don't refactor the entire codebase
- Prioritize high-impact improvements

## Success Criteria

✅ New standards applied
✅ Related code updated
✅ Tests still passing
✅ Linting violations fixed
✅ Consistency improved

## Phase Transition

When complete, follow standard transition protocol:

1. Extract any patterns discovered during tech debt work
2. Score examples using [@pattern:pattern-quality-scoring]
3. Update pattern .ref.md files
4. Summarize improvements made
5. List standards applied
6. Commit tech debt changes
7. Proceed to task completion

## Time Management

- Box time to 20% of original task
- Focus on highest value improvements
- Leave minor issues for future TOCK
- Document what wasn't addressed
