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
- [ ] Review recent patterns in `/ai/patterns/`
- [ ] Review recent standards in `/ai/standards/`
- [ ] Check `.completed/patterns/` for new discoveries
- [ ] Apply relevant patterns to current code
- [ ] Update old code in related files
- [ ] Run new linting rules
- [ ] Update documentation

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
1. **Recent Patterns**: Check last 5-10 completed tasks
   ```bash
   ls -la .completed/patterns/ | tail -10
   ```

2. **New Standards**: Check recently added
   ```bash
   ls -la /ai/standards/ | tail -10
   ```

3. **Linting Rules**: Run with auto-fix
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

## Task Completion
After Phase 6:
1. Summarize improvements made
2. List standards applied
3. Commit tech debt changes
4. Mark task complete
5. Move to `.completed/`

## Time Management
- Box time to 20% of original task
- Focus on highest value improvements
- Leave minor issues for future TOCK
- Document what wasn't addressed