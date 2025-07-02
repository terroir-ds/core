# Phase 1: Make it Work

## Quick Context

- **Goal**: Get basic functionality working
- **Time Budget**: 30% of total task time
- **Focus**: Core feature, happy path only

## Checklist

- [ ] Implement core functionality
- [ ] Handle basic happy path
- [ ] Create minimal test to verify it works
- [ ] Ensure no blocking errors

## What TO Do

- Write the simplest code that works
- Focus on primary use case
- Get something running end-to-end
- Use existing patterns from codebase

## What NOT to Do

❌ Don't optimize performance yet
❌ Don't handle edge cases
❌ Don't write comprehensive tests
❌ Don't refactor for beauty
❌ Don't add extra features

## Example Approach

```typescript
// GOOD: Simple, works, testable
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

// BAD: Too much for Phase 1
export function truncate(str: string, options: TruncateOptions): string {
  // Don't add options yet!
  // Don't handle unicode yet!
  // Don't optimize yet!
}
```

## Success Criteria

✅ Feature works for main use case
✅ Basic test passes
✅ No crashes or exceptions
✅ Ready to refactor

## Phase Transition

When complete:

1. Summarize what works
2. Note any limitations
3. Update task: `**Current Phase**: Phase 2 - Make it Right`
4. Clean context before Phase 2

## Common Phase 1 Patterns

- Use hardcoded values if needed (refactor later)
- Copy-paste similar code (DRY comes in Phase 2)  
- Skip error handling (add in Phase 3)
- One simple test is enough

## Time Management

If 30% time is up and it's not working:

- Identify blockers
- Get help or guidance
- Don't proceed until basic functionality works
