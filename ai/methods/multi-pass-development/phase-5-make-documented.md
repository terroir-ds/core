# Phase 5: Make it Documented

## Quick Context
- **Goal**: Complete documentation and extract standards
- **Time Budget**: 10% of total task time
- **Focus**: JSDoc, examples, patterns, standards extraction

## Checklist
- [ ] Write comprehensive JSDoc
- [ ] Add usage examples
- [ ] Document edge cases
- [ ] Extract reusable patterns
- [ ] Create migration guides
- [ ] Update AI documentation
- [ ] Add to relevant indexes

## What TO Do
- Document every public API
- Include code examples
- Explain when to use (and not use)
- Identify patterns to standardize
- Create enforcement rules
- Link to related docs
- Update CLAUDE.md if needed

## What NOT to Do
❌ Don't write novels
❌ Don't skip examples
❌ Don't forget migration paths
❌ Don't ignore pattern extraction
❌ Don't duplicate existing docs

## JSDoc Template
```typescript
/**
 * Truncates a string to a specified length with customizable options.
 * 
 * @category String
 * @since 1.0.0
 * @standard Use this instead of manual substring for all text truncation
 * @migration Search: `\.substring\(0,` → Replace with truncate()
 * 
 * @param str - The string to truncate
 * @param options - Truncation options or maximum length
 * @returns The truncated string with ellipsis
 * 
 * @throws {ValidationError} When input is not a string
 * @throws {ValidationError} When length is negative
 * 
 * @example Basic usage
 * ```typescript
 * truncate('Hello World', 5); // "Hello..."
 * ```
 * 
 * @example With options
 * ```typescript
 * truncate('Hello World', {
 *   length: 5,
 *   ellipsis: '…'
 * }); // "Hello…"
 * ```
 * 
 * @example Migration from substring
 * ```diff
 * - const preview = text.substring(0, 100) + '...';
 * + const preview = truncate(text, 100);
 * ```
 * 
 * @see {@link TruncateOptions} for available options
 */
```

## Pattern Extraction
When you identify a reusable pattern:

1. **Create Pattern Doc**: `/ai/patterns/[pattern-name].md`
2. **Add Standard**: Document in `/ai/standards/`
3. **Create Enforcement**: ESLint rule or pre-commit
4. **Update Indexes**: Add to pattern/standard registries

Example pattern extraction:
```markdown
# Pattern: Safe String Truncation

## Problem
Manual substring operations can break unicode characters and don't handle edge cases.

## Solution
Use the truncate utility for all string shortening needs.

## Implementation
```typescript
import { truncate } from '@utils/string';
truncate(text, 100);
```

## Enforcement
- ESLint: `no-unsafe-substring`
- Pre-commit: Check for `.substring(0,`
```

## Documentation Outputs
1. **API Docs**: Complete JSDoc in code
2. **Usage Guide**: When and how to use
3. **Migration Guide**: Update existing code
4. **Pattern Doc**: If new pattern discovered
5. **AI Doc**: Update relevant AI guides

## Success Criteria
✅ All public APIs documented
✅ Examples for common use cases
✅ Edge cases explained
✅ Patterns extracted
✅ Standards documented
✅ Migration path clear

## Phase Transition
When complete:
1. List documentation created
2. List patterns extracted
3. Check task for "tech debt review"
4. If TICK: Mark task complete
5. If TOCK: Continue to Phase 6