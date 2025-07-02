# Phase 3: Make it Safe

## Quick Context

- **Goal**: Handle edge cases and ensure reliability
- **Time Budget**: 20% of total task time
- **Focus**: Security, validation, performance, edge cases

## Checklist

- [ ] Add input validation
- [ ] Handle all edge cases
- [ ] Consider security implications
- [ ] Optimize critical paths
- [ ] Add error recovery
- [ ] Handle resource cleanup
- [ ] Check memory usage

## What TO Do

- Validate all inputs thoroughly
- Handle null/undefined/empty cases
- Add proper error handling
- Consider unicode/encoding issues
- Prevent resource leaks
- Add defensive programming
- Check performance bottlenecks

## What NOT to Do

❌ Don't skip edge cases
❌ Don't assume happy path
❌ Don't ignore security
❌ Don't forget cleanup
❌ Don't trust external input

## Example Approach

```typescript
// Phase 2 code (clean but not safe)
export function truncate(
  str: string, 
  options: TruncateOptions | number
): string {
  const opts = normalizeOptions(options);
  if (str.length <= opts.length) return str;
  return str.slice(0, opts.length) + opts.ellipsis;
}

// Phase 3 additions (safe and robust)
export function truncate(
  str: unknown,
  options: TruncateOptions | number
): string {
  // Input validation
  if (!isString(str)) {
    throw new ValidationError('Input must be a string', {
      code: 'INVALID_INPUT',
      context: { type: typeof str }
    });
  }
  
  const opts = normalizeOptions(options);
  
  // Edge case: negative length
  if (opts.length < 0) {
    throw new ValidationError('Length must be non-negative', {
      code: 'INVALID_LENGTH',
      context: { length: opts.length }
    });
  }
  
  // Edge case: empty string
  if (str.length === 0 || opts.length === 0) {
    return '';
  }
  
  if (str.length <= opts.length) {
    return str;
  }
  
  // Unicode-safe truncation
  const truncated = truncateUnicodeSafe(str, opts.length);
  return truncated + opts.ellipsis;
}

function truncateUnicodeSafe(str: string, length: number): string {
  // Handle surrogate pairs, combining characters, etc.
  const chars = Array.from(str);
  return chars.slice(0, length).join('');
}
```

## Common Edge Cases

- Null/undefined inputs
- Empty strings/arrays
- Negative numbers
- Very large inputs
- Unicode characters
- Circular references
- Resource exhaustion

## Security Checklist

- [ ] Validate all external input
- [ ] Prevent injection attacks
- [ ] Check for buffer overflows
- [ ] Sanitize user data
- [ ] Use safe defaults

## Performance Checks

- [ ] No unnecessary loops
- [ ] Efficient algorithms
- [ ] Proper memoization
- [ ] Resource pooling if needed

## Success Criteria

✅ All edge cases handled
✅ Input validation complete
✅ No security vulnerabilities
✅ Performance acceptable
✅ Error handling robust

## Phase Transition

When complete:

1. List all edge cases handled
2. Note security measures added
3. Update task: `**Current Phase**: Phase 4 - Make it Tested`
4. Clean context before Phase 4
