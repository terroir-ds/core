# Task: Five-Pass Development Guide

<!-- AUTO-MANAGED: Do not edit below this line -->
**Method**: System Documentation
**Next Action**: continue to phase 2
<!-- END AUTO-MANAGED -->

<!-- AGENT-MANAGED: Update when transitioning phases -->
**Current Phase**: System Documentation - phase 1
**Phase Guide**: This is a documentation task, not code development
**Started**: 2025-07-01 04:35
<!-- END AGENT-MANAGED -->

## Phase Progress

### ✅ Phase 1: Core Documentation - COMPLETED

**What We Built:**

1. **Chose `/ai/` as peer directory** (not `/docs/ai/`) for AI-first documentation
2. **Created complete multi-pass method documentation**:
   - `/ai/methods/multi-pass-development/` with all 6 phases
   - Each phase has focused guide (30-100 lines)
   - Progressive disclosure implemented
   - Phase 6 for tech debt review on TOCK tasks

3. **Enhanced task management system**:
   - Updated `manage-agent-tasks.js` to support methods
   - Tasks now show method and phase count
   - Smart "Next Action" based on current phase
   - Supports multiple methods (multi-pass, rapid-fix, docs-only)

4. **Migrated patterns to AI-first format**:
   - Moved from `.completed/patterns/` to `/ai/patterns/`
   - Consistent format with Quick Context, Implementation, etc.
   - Created pattern index for discovery

5. **Simplified .completed structure**:
   - Removed nested `tasks/` directory  
   - Patterns now in `/ai/patterns/`
   - Updated all references in docs and prompts

6. **Created task 001 for AI-first standards**:
   - Comprehensive plan for `/ai/standards/` organization
   - Emphasis on progressive disclosure and small files
   - Will be foundation for all phase references

**Key Decisions Made:**

- AI docs deserve peer status to human docs
- Progressive disclosure is critical for context efficiency  
- Patterns extracted in Phase 5, not after task completion
- Small focused files (30-50 lines) over large comprehensive ones
- Method flexibility for different types of work
- Adopted .ai.md extension for all AI documentation (trendsetting!)
- Phase 5 updated to require both human and AI documentation
- Simplified system-documentation to 2 phases (less overhead)
- Made tick/tock pattern optional (only for coding tasks)

## Objective

Create comprehensive documentation for the 5-pass development methodology, including detailed guidance for each pass, examples, and integration with existing standards.

## Implementation Requirements

### Phase 1: Core Documentation (2 hours)

#### 1. Create Main Guide

Create `docs/development/five-pass-methodology.md`:

```markdown
# Five-Pass Development Methodology

## Overview
The 5-pass system ensures consistent quality by breaking feature development into focused phases, each with specific goals and deliverables.

## The Five Passes

### Pass 1: Make it Work (30% of effort)
**Goal**: Get basic functionality working
**Focus**: Core feature implementation
**Deliverable**: Working code that passes basic tests

#### What to Do
- Implement the happy path
- Basic error handling
- Minimal viable functionality
- Simple tests to verify it works

#### What NOT to Do
- Don't optimize prematurely
- Don't handle every edge case
- Don't write comprehensive tests
- Don't focus on code beauty

#### Example
```

// Pass 1: Basic truncate function
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

```bash
### Pass 2: Make it Right (20% of effort)
**Goal**: Refactor for clarity and maintainability
**Focus**: Code quality, patterns, readability
**Deliverable**: Clean, well-structured code

#### What to Do
- Apply design patterns
- Extract common logic
- Improve naming
- Add proper types
- Reduce complexity

#### What NOT to Do
- Don't add new features
- Don't optimize performance yet
- Don't write all tests yet

#### Example
```

// Pass 2: Refactored with options and better structure
export interface TruncateOptions {
  length: number;
  ellipsis?: string;
  wordBoundary?: boolean;
}

export function truncate(
  str: string,
  options: TruncateOptions | number
): string {
  const opts = normalizeOptions(options);
  
  if (str.length <= opts.length) return str;
  
  const truncated = opts.wordBoundary
    ? truncateAtWordBoundary(str, opts.length)
    : str.slice(0, opts.length);

  return truncated + opts.ellipsis;
}

```bash
### Pass 3: Make it Safe (20% of effort)
**Goal**: Handle edge cases and optimize performance
**Focus**: Security, performance, reliability
**Deliverable**: Production-ready code

#### What to Do
- Handle all edge cases
- Add input validation
- Optimize hot paths
- Consider security implications
- Add error recovery

#### What NOT to Do
- Don't skip edge cases
- Don't ignore performance
- Don't assume happy path

#### Example
```

// Pass 3: Safe with validation and edge cases
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
  
  // Edge cases
  if (opts.length < 0) {
    throw new ValidationError('Length must be non-negative', {
      code: 'INVALID_LENGTH',
      context: { length: opts.length }
    });
  }
  
  if (str.length <= opts.length) return str;
  
  // Unicode-aware truncation
  const truncated = opts.wordBoundary
    ? truncateAtWordBoundary(str, opts.length)
    : truncateUnicodeSafe(str, opts.length);

  return truncated + opts.ellipsis;
}

```bash
### Pass 4: Make it Tested (20% of effort)
**Goal**: Comprehensive test coverage
**Focus**: Unit tests, edge cases, integration
**Deliverable**: 90%+ test coverage

#### What to Do
- Test all code paths
- Test edge cases
- Test error conditions
- Add performance tests
- Add integration tests

#### What NOT to Do
- Don't skip edge case tests
- Don't ignore error paths
- Don't test implementation details

#### Example
```

describe('truncate', () => {
  // Happy path
  it('truncates long strings', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...');
  });
  
  // Edge cases
  it('handles empty strings', () => {
    expect(truncate('', 10)).toBe('');
  });
  
  it('handles unicode correctly', () => {
    expect(truncate('👨‍👩‍👧‍👦🏳️‍🌈', 5)).toBe('👨‍👩‍👧‍👦...');
  });
  
  // Error cases
  it('throws on invalid input', () => {
    expect(() => truncate(null, 5)).toThrow(ValidationError);
  });
  
  // Performance
  it('performs well with large strings', () => {
    const large = 'x'.repeat(10000);
    const start = performance.now();
    truncate(large, 100);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(1);
  });
});

```bash
### Pass 5: Make it Documented (10% of effort)
**Goal**: Complete documentation and standards extraction
**Focus**: JSDoc, examples, guides, standards
**Deliverable**: Fully documented feature + new standards

#### What to Do
- Write comprehensive JSDoc with @standard tags
- Add usage examples for common patterns
- Document edge cases and migration paths
- Extract patterns as enforceable standards
- Update AI documentation and CLAUDE.md
- Create ESLint rules for new standards

#### What NOT to Do
- Don't skip examples
- Don't forget edge cases
- Don't ignore standards extraction
- Don't leave old patterns undocumented

#### Complete Pass 5 Checklist
1. **API Documentation**
   - JSDoc with parameters, returns, throws
   - @example blocks for common usage
   - @standard tag for new patterns
   - @migration tag for updating old code

2. **Standards Documentation**
   ```

   /**
    *@standard Use this instead of string.substring() for all truncation
    * @migration grep -r "\.substring(0," --include="*.ts" | update to truncate()
    * @eslint-rule no-manual-truncation
    */

   ```markdown
3. **Usage Examples**
   ```

   // Basic usage
   const title = truncate(longTitle, 50);

   // With options
   const preview = truncate(article, 200, {
     ellipsis: '... Read more',
     preserveWords: true
   });

   // Component usage
   <Card title={truncate(product.name, 30)} />

   ```markdown
4. **Migration Guide**
   ```

## Migrating to truncate()

### Find instances

   ```bash
   rg "\.substring\(0,.*\)" --type ts
   rg "\.slice\(0,.*\).*\+" --type ts
   ```

### Update patterns

   ```diff
   - const preview = text.substring(0, 100) + '...';
   + const preview = truncate(text, 100);
   ```

   ```markdown
5. **Standards Extraction**
   - Identify what old pattern this replaces
   - Document where it should be used
   - Create enforcement via linting
   - Add to STANDARDS.md

6. **Update Global Documentation**
   - Add to CLAUDE.md development workflow
   - Export types with documentation
   - Update team standards

#### Time Allocation (30-45 minutes)
1. **API Documentation** (10 min)
   - JSDoc comments
   - Type exports
   - Basic examples

2. **Standards Extraction** (15 min)
   - Identify patterns
   - Write standards
   - Create enforcement

3. **Migration Guide** (10 min)
   - Search patterns
   - Update examples
   - Script if needed

4. **Integration** (10 min)
   - Update STANDARDS.md
   - Update CLAUDE.md
   - Create lint rules

#### Example Complete Documentation
```

/**

- Truncates a string to a specified length with customizable options.
-
- @category String
- @since 1.0.0
- @standard Use this instead of string.substring() for all truncation
- @migration grep -r "\.substring(0," --include="*.ts" | update to truncate()
-
- @param str - The string to truncate
- @param options - Truncation options or maximum length
- @returns The truncated string with ellipsis
-
- @throws {ValidationError} When input is not a string
- @throws {ValidationError} When length is negative
-
- @example Basic usage

- ```typescript
- truncate('Hello World', 5); // "Hello..."

- ```
-
- @example With options

- ```typescript
- truncate('Hello World', {
- length: 5,
- ellipsis: '…',
- wordBoundary: true
- }); // "Hello…"

- ```
-
- @example Migrating from substring

- ```typescript
- // Before
- const preview = text.substring(0, 100) + '...';
-
- // After
- const preview = truncate(text, 100);

- ```
-
- @see {@link TruncateOptions} for available options
- @see {@link truncateWords} for word-based truncation
 */

```bash
## Pass Transitions

### From Pass 1 to Pass 2
✓ Basic functionality works
✓ Simple tests pass
✓ No major blockers

### From Pass 2 to Pass 3
✓ Code is clean and readable
✓ Patterns are applied
✓ Structure is sound

### From Pass 3 to Pass 4
✓ All edge cases handled
✓ Performance acceptable
✓ Security considered

### From Pass 4 to Pass 5
✓ Test coverage >90%
✓ All tests passing
✓ No flaky tests

### Definition of Done
✓ All 5 passes complete
✓ Code review passed
✓ CI/CD green
✓ Documentation complete
✓ Standards extracted

## Time Management

### Effort Distribution
- Pass 1: 30% - Get it working
- Pass 2: 20% - Clean it up
- Pass 3: 20% - Make it robust
- Pass 4: 20% - Test thoroughly
- Pass 5: 10% - Document fully

### Example: 8-hour Feature
- Pass 1: 2.4 hours (morning)
- Pass 2: 1.6 hours (before lunch)
- Pass 3: 1.6 hours (after lunch)
- Pass 4: 1.6 hours (afternoon)
- Pass 5: 0.8 hours (end of day)

## Standards Integration

### Before Starting
1. Review relevant standards in `/docs/resources/standards/`
2. Note patterns to follow
3. Identify potential new patterns

### During Development
- Pass 1-3: Follow existing standards
- Pass 4: Ensure standards compliance in tests
- Pass 5: Extract new standards

### Standards to Extract
- New design patterns
- Performance optimizations
- Security patterns
- Testing strategies
- Documentation templates
```

#### 2. Create Quick Reference

Create `docs/development/five-pass-quick-ref.md`:

```markdown
# 5-Pass Quick Reference

## Pass Checklist

### ✅ Pass 1: Make it Work (30%)
- [ ] Core functionality implemented
- [ ] Basic happy path works
- [ ] Simple test verifies functionality
- [ ] No crashes or blocking errors

### ✅ Pass 2: Make it Right (20%)
- [ ] Code refactored for clarity
- [ ] Proper patterns applied
- [ ] Good naming throughout
- [ ] Complexity reduced

### ✅ Pass 3: Make it Safe (20%)
- [ ] All edge cases handled
- [ ] Input validation complete
- [ ] Performance optimized
- [ ] Security considered

### ✅ Pass 4: Make it Tested (20%)
- [ ] 90%+ code coverage
- [ ] Edge cases tested
- [ ] Error paths tested
- [ ] Performance benchmarked

### ✅ Pass 5: Make it Documented (10%)
- [ ] JSDoc complete with examples
- [ ] Edge cases documented
- [ ] Standards extracted
- [ ] AI docs updated

## Time Boxing

| Feature Size | Total Time | P1 | P2 | P3 | P4 | P5 |
|-------------|------------|----|----|----|----|-----|
| Tiny | 2 hours | 36m | 24m | 24m | 24m | 12m |
| Small | 4 hours | 72m | 48m | 48m | 48m | 24m |
| Medium | 8 hours | 2.4h | 1.6h | 1.6h | 1.6h | 48m |
| Large | 16 hours | 4.8h | 3.2h | 3.2h | 3.2h | 1.6h |

## Common Mistakes

### Pass 1 Mistakes
❌ Trying to handle every edge case
❌ Premature optimization
❌ Over-engineering
✅ Focus on making it work!

### Pass 2 Mistakes
❌ Adding new features
❌ Changing requirements
❌ Performance optimization
✅ Focus on code quality!

### Pass 3 Mistakes
❌ Skipping edge cases
❌ Ignoring performance
❌ Assuming happy path
✅ Focus on robustness!

### Pass 4 Mistakes
❌ Testing implementation details
❌ Skipping edge case tests
❌ No performance tests
✅ Focus on coverage!

### Pass 5 Mistakes
❌ Minimal documentation
❌ No examples
❌ Forgetting standards
✅ Focus on clarity!
```

### Phase 2: Integration with Existing Systems (1 hour)

#### 1. Update Sprint Planning Template

Enhance `.claude/templates/sprint-plan.md` with detailed pass breakdowns

#### 2. Create Pass Transition Checklist

Create `.claude/templates/pass-transition-checklist.md`:

```markdown
# Pass Transition Checklist

## Pass 1 → Pass 2
- [ ] Feature works end-to-end
- [ ] No blocking bugs
- [ ] Basic test passes
- [ ] Ready for refactoring

## Pass 2 → Pass 3
- [ ] Code is clean and clear
- [ ] Patterns properly applied
- [ ] Complexity minimized
- [ ] Ready for hardening

## Pass 3 → Pass 4
- [ ] All edge cases handled
- [ ] Performance acceptable
- [ ] Security reviewed
- [ ] Ready for testing

## Pass 4 → Pass 5
- [ ] Coverage >90%
- [ ] All tests green
- [ ] Performance verified
- [ ] Ready for documentation

## Pass 5 → Done
- [ ] JSDoc complete
- [ ] Examples provided
- [ ] Standards extracted
- [ ] Ready for review
```

#### 3. Create Status Reporting Template

Create `.claude/templates/pass-status.md`:

```markdown
# Feature: [Name]
Status: Pass [N] of 5

## Progress
- Pass 1: ✅ Complete (2.4h)
- Pass 2: ✅ Complete (1.6h)
- Pass 3: 🔄 In Progress (0.8h of 1.6h)
- Pass 4: ⏸️ Queued
- Pass 5: ⏸️ Queued

## Current Focus
[What you're working on in current pass]

## Blockers
[Any issues preventing progress]

## Notes
[Observations for future standards]
```

### Phase 2.5: Pass 5 Documentation Templates (30 min)

#### Standards Entry Template

Create `.claude/templates/standards-entry.md`:

```markdown
## [Feature Name] Standards

### Standard: [Brief description]
**Added**: [Date]
**Author**: Agent [N]

**Old Pattern**:
```

// What we're replacing

```text
**New Pattern**:
```

// What to use instead

```text
**Where to Use**:
- [Scenario 1]
- [Scenario 2]

**Migration**:
```

# How to find old patterns

# How to update them

```text
**Enforcement**:
- ESLint: [rule name]
- Pre-commit: [check name]
- CI: [validation]

**Benefits**:
- [Why this is better]
- [Problems it prevents]
```

#### Documentation Output Structure

Create `.claude/templates/documentation-structure.md`:

```text
feature-name/
├── README.md           # Overview and quick start
├── API.md             # Detailed API documentation
├── STANDARDS.md       # New standards to adopt
├── MIGRATION.md       # How to migrate existing code
└── examples/          # Working examples
```

#### Pass 5 Success Metrics

```markdown
✅ **Good Pass 5**:
- Future developers know when to use your utility
- Old patterns can be found and replaced
- Standards are enforceable via linting
- Migration path is clear
- Examples cover common use cases
- Edge cases documented

❌ **Insufficient Pass 5**:
- Only basic JSDoc comments
- No guidance on when to use
- No migration from old patterns
- Standards not documented
- No enforcement mechanism
- Missing examples
```

### Phase 3: Training Materials (1 hour)

#### 1. Create Examples Directory

Create `docs/development/five-pass-examples/`:

- `example-utility.md` - Step-by-step utility development
- `example-component.md` - Component through 5 passes
- `example-infrastructure.md` - Infrastructure feature example

#### 2. Create Video Script

Create `docs/development/five-pass-training-script.md` for future video creation

## Success Criteria

- [ ] Comprehensive methodology guide created
- [ ] Quick reference for daily use
- [ ] Templates for all pass transitions
- [ ] Integration with sprint planning
- [ ] Real-world examples provided
- [ ] Standards extraction documented
- [ ] Team training materials ready
- [ ] Methodology adopted project-wide

## Notes

- Start with the comprehensive guide
- Make quick reference printable
- Include time management tips
- Emphasize standards extraction in Pass 5
- Create visual diagrams if possible

## Remaining Items to Complete

### 1. Create Human-Focused Summary Doc ✅

- [x] Create `/docs/development/five-pass-methodology.md`
- [x] Explain the system for human developers
- [x] Include examples and rationale

### 2. Create Documentation Method ✅

- [x] Created `/ai/methods/system-documentation/` with 2-phase approach
- [x] Phase 1: Plan & Write (80%), Phase 2: Review & Polish (20%)
- [x] Updated task manager to support method with optional tick/tock
- [x] Made tick/tock only apply to coding tasks that accumulate tech debt

### 3. Examples Strategy ✅

- [x] Decided: real-world examples with quality scoring
- [x] Examples build naturally from work, scored 1-5
- [x] Only 4+ scores included in documentation

### 4. Organize /ai Root Files ✅

- [x] Moved docs to guides/ subdirectory
- [x] Renamed README.ai.md to index.ai.md
- [x] Removed outdated contributing.ai.md and legacy-patterns.ai.md

### 5. Review Agent Sessions ✅

- [x] Check `.claude/sessions/` for saved agent states
- [x] Merge session info with appropriate tasks
- [x] Ensure each agent has clear task 001
- [x] Possibly reorder tasks for priority
- [x] Created session-summary-2025-01-29.md with comprehensive status

### 6. Standardize index.md Convention ✅

- [x] Define when to use README.md vs index.md vs index.ai.md
- [x] Find all README.md files that should be index.md
- [x] Find all README.ai.md files that should be index.ai.md
- [x] Create migration script if many files need updating (done manually)
- [x] Document the standard for future use (created index-file-convention standard)

## Source

- Extracted from: agent-registry.md and reorganization-plan-2025-06-29.md (5-pass system details)

## Phase 2 Progress

### Pattern Reference System Design ✅

- Decided to keep "tasks" vs "stories" for methodology flexibility
- Designed .ref.md companion files for patterns and standards
- Created JSDoc tag system for robust code references
- Planned automated reference maintenance via CI/CD

### AIKMS Discovery ✅

During the reference system design discussion, we identified a significant product opportunity:

- Building an "AI-focused Knowledge Management System" (AIKMS)
- Essentially an AI second brain / knowledge graph for pattern extraction
- Market research revealed significant gaps in current solutions
- No unified pattern extraction and management system exists
- Unique positioning at intersection of dev workflows, pattern extraction, knowledge graphs, and multi-domain applicability

Key findings:

- Current tools are fragmented (code analysis ≠ pattern extraction ≠ knowledge management)
- No bidirectional linking between patterns/standards and code implementations
- Missing automatic pattern evolution and lineage tracking
- Domain silos prevent cross-pollination of patterns

Product concept documented in: `.claude/projects/aikms/`

### Pattern Quality Scoring System ✅

Created comprehensive scoring system for patterns and standards:

- Created pattern-quality-scoring for pattern instances (5 criteria: clarity, completeness, context, outcomes, teachability)
- Created standard-quality-scoring for code implementations (weighted: correctness 30%, completeness 20%, etc.)
- Created contextual-scoring-pattern as universal fallback with context-aware interpretation
- Established decision tree for which scoring pattern to use
- Scored all existing patterns and standards with appropriate rubrics

### Reference Management Implementation ✅

- Created .ref.md files for all patterns and standards
- Established bidirectional linking structure
- Added scoring breakdowns to all reference files
- Created jsdoc-pattern-tags standard for code references
- Designed reference-scanner-pattern for automation

### Index.md Convention Migration ✅

Successfully migrated all internal documentation:

- Migrated all internal directories to use index.md instead of README.md
- Kept README.md for external-facing files (root, packages/*)
- Updated all references throughout the codebase
- Created and applied index-file-convention standard
- Updated .gitignore to allow .vscode/index.md and .vscode/index.ai.md

Total files migrated: ~40 README.md → index.md conversions

## Task Status

### Phase 1: Core Documentation ✅ COMPLETED

All documentation created, patterns migrated, .ai.md extension adopted.

### Phase 2: System Documentation ✅ COMPLETED

All remaining items from the task have been completed:

- Pattern Quality Scoring System implemented
- Reference Management System created (.ref.md files)
- Index.md Convention established and applied
- Agent Sessions reviewed and documented

This task is now fully complete!
