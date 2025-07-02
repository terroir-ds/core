# Phase 2: Make it Right

## Quick Context

- **Goal**: Refactor for clarity and maintainability
- **Time Budget**: 20% of total task time
- **Focus**: Code quality, patterns, readability

## Checklist

- [ ] Apply appropriate design patterns
- [ ] Extract common logic
- [ ] Improve naming throughout
- [ ] Add proper TypeScript types
- [ ] Reduce code complexity
- [ ] Follow project conventions

## What TO Do

- Refactor duplicated code (DRY)
- Create clean interfaces/types
- Extract helper functions
- Improve variable/function names
- Apply SOLID principles where relevant
- Match existing codebase patterns

## What NOT to Do

❌ Don't add new features
❌ Don't optimize performance yet
❌ Don't handle edge cases yet
❌ Don't write all tests yet
❌ Don't over-engineer

## Example Approach

```typescript
// Phase 1 code (works but messy)
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

// Phase 2 refactor (clean structure)
export interface TruncateOptions {
  length: number;
  ellipsis?: string;
}

export function truncate(
  str: string, 
  options: TruncateOptions | number
): string {
  const opts = normalizeOptions(options);
  
  if (str.length <= opts.length) {
    return str;
  }
  
  return str.slice(0, opts.length) + opts.ellipsis;
}

function normalizeOptions(options: TruncateOptions | number): Required<TruncateOptions> {
  if (typeof options === 'number') {
    return { length: options, ellipsis: '...' };
  }
  return { ellipsis: '...', ...options };
}
```

## Refactoring Patterns

- **Extract Method**: Pull out complex logic
- **Introduce Parameter Object**: Group related parameters
- **Replace Magic Numbers**: Use named constants
- **Simplify Conditionals**: Make logic clearer

## Success Criteria

✅ Code is clean and readable
✅ Follows project patterns
✅ No code duplication
✅ Types are well-defined
✅ Still passes Phase 1 tests

## Phase Transition

When complete:

1. Summarize refactoring done
2. Note any patterns applied
3. Update task: `**Current Phase**: Phase 3 - Make it Safe`
4. Clean context before Phase 3

## Time Management

- Don't perfect everything
- Focus on biggest improvements
- Leave minor issues for later
- Stop when time is up
