# Phase 4: Make it Tested

## Quick Context

- **Goal**: Comprehensive test coverage
- **Time Budget**: 20% of total task time
- **Focus**: Unit tests, edge cases, integration

## Checklist

- [ ] Test all happy paths
- [ ] Test all edge cases from Phase 3
- [ ] Test error conditions
- [ ] Add performance benchmarks
- [ ] Test integration points
- [ ] Achieve >90% coverage
- [ ] No flaky tests

## What TO Do

- Write focused unit tests
- Test each edge case separately
- Mock external dependencies
- Use descriptive test names
- Group related tests
- Add performance tests if critical
- Test error messages

## What NOT to Do

❌ Don't test implementation details
❌ Don't write brittle tests
❌ Don't skip edge cases
❌ Don't ignore error paths
❌ Don't over-mock

## Example Test Structure

```typescript
describe('truncate', () => {
  // Happy path tests
  describe('basic functionality', () => {
    it('truncates long strings', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
    });
    
    it('returns unchanged when shorter than limit', () => {
      expect(truncate('Hi', 10)).toBe('Hi');
    });
    
    it('handles exact length match', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });
  });
  
  // Edge cases from Phase 3
  describe('edge cases', () => {
    it('handles empty strings', () => {
      expect(truncate('', 10)).toBe('');
    });
    
    it('handles zero length', () => {
      expect(truncate('Hello', 0)).toBe('...');
    });
    
    it('handles unicode correctly', () => {
      expect(truncate('👨‍👩‍👧‍👦🏳️‍🌈', 1)).toBe('👨‍👩‍👧‍👦...');
    });
  });
  
  // Error cases
  describe('error handling', () => {
    it('throws on non-string input', () => {
      expect(() => truncate(null as any, 5))
        .toThrow(ValidationError);
    });
    
    it('throws on negative length', () => {
      expect(() => truncate('Hello', -1))
        .toThrow('Length must be non-negative');
    });
  });
  
  // Options testing
  describe('options', () => {
    it('accepts custom ellipsis', () => {
      const result = truncate('Hello World', {
        length: 5,
        ellipsis: '…'
      });
      expect(result).toBe('Hello…');
    });
  });
  
  // Performance (if critical)
  describe('performance', () => {
    it('handles large strings efficiently', () => {
      const large = 'x'.repeat(10000);
      const start = performance.now();
      truncate(large, 100);
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1); // <1ms
    });
  });
});
```

## Test Patterns

- **Arrange-Act-Assert**: Clear test structure
- **One Assertion Per Test**: Focused tests
- **Test Descriptions**: Should read like requirements
- **Test Data Builders**: For complex objects
- **Parameterized Tests**: For similar scenarios

## Coverage Guidelines

```bash
# Check coverage
pnpm test:coverage

# Aim for:
- Statements: >90%
- Branches: >85%
- Functions: >90%
- Lines: >90%
```

## Success Criteria

✅ All code paths tested
✅ All edge cases covered
✅ Error scenarios tested
✅ Tests are maintainable
✅ Coverage targets met
✅ Tests run fast

## Phase Transition

When complete:

1. Show coverage report
2. List test categories added
3. Update task: `**Current Phase**: Phase 5 - Make it Documented`
4. Clean context before Phase 5
