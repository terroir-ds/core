# Five-Pass Development Methodology

## Overview

The Five-Pass Development Methodology is a systematic approach to feature development that ensures consistent quality by breaking work into focused phases. Each pass has a specific goal, preventing common pitfalls like premature optimization or incomplete testing.

## Why Five Passes?

Traditional development often mixes concerns - trying to write perfect code, handle edge cases, optimize performance, and document everything simultaneously. This leads to:

- Analysis paralysis
- Incomplete features
- Inconsistent quality
- Unpredictable timelines

The Five-Pass system separates these concerns, allowing focused work in each phase.

## The Five Passes

### Pass 1: Make it Work (30% of time)

**Goal**: Get basic functionality working

Focus on the happy path. Write the simplest code that demonstrates the feature works. Don't worry about edge cases, performance, or beautiful code - just make it work.

**Example**: A basic string truncation function that handles the simple case.

### Pass 2: Make it Right (20% of time)

**Goal**: Refactor for clarity and maintainability

Now that it works, make it clean. Apply design patterns, improve naming, extract helpers, and organize the code properly. Still don't add features or optimize.

**Example**: Refactor to use proper types, extract configuration options, improve structure.

### Pass 3: Make it Safe (20% of time)

**Goal**: Handle edge cases and ensure reliability

Add input validation, handle errors, consider security, and address edge cases. Make the code production-ready. This is where you handle null inputs, empty strings, etc.

**Example**: Add validation, unicode support, bounds checking.

### Pass 4: Make it Tested (20% of time)

**Goal**: Comprehensive test coverage

Write tests for all code paths, edge cases, and error conditions. Aim for >90% coverage. Include performance tests if relevant.

**Example**: Unit tests for happy path, edge cases, errors, and performance.

### Pass 5: Make it Documented (10% of time)

**Goal**: Complete documentation and standards extraction

Write comprehensive JSDoc, usage examples, and migration guides. Extract any new patterns as standards. This ensures future developers can use and maintain your code.

**Example**: Full API documentation with examples, standard annotations, migration guides.

## Optional Pass 6: Tech Debt Review (TOCK tasks only)

Every few tasks (configured as "TOCK" tasks), there's an additional phase to apply recently discovered standards and patterns retroactively. This prevents technical debt accumulation.

## Time Management

The percentages (30/20/20/20/10) help allocate time effectively:

- **2-hour feature**: 36min / 24min / 24min / 24min / 12min
- **8-hour feature**: 2.4hr / 1.6hr / 1.6hr / 1.6hr / 48min
- **16-hour feature**: 4.8hr / 3.2hr / 3.2hr / 3.2hr / 1.6hr

## Phase Transitions

Between each phase:

1. Summarize what was accomplished
2. Get confirmation before proceeding
3. Update task tracking
4. Commit work atomically
5. Clean context (for AI agents)

## Common Mistakes to Avoid

### In Pass 1

- ❌ Trying to handle every edge case
- ❌ Premature optimization
- ❌ Over-engineering

### In Pass 2

- ❌ Adding new features
- ❌ Performance optimization
- ❌ Changing requirements

### In Pass 3

- ❌ Skipping edge cases
- ❌ Ignoring security
- ❌ Assuming happy path only

### In Pass 4

- ❌ Testing implementation details
- ❌ Skipping error tests
- ❌ No performance validation

### In Pass 5

- ❌ Minimal documentation
- ❌ No usage examples
- ❌ Forgetting to extract patterns

## Integration with AI Development

This methodology is designed for both human and AI developers:

- **Task files** track current phase and progress
- **Phase guides** in `/ai/methods/` provide focused instructions
- **Progressive disclosure** prevents context overload
- **Clear transitions** ensure quality gates are met

## Benefits

1. **Predictable Progress**: Know exactly where you are and what's next
2. **Consistent Quality**: Every feature goes through the same quality gates
3. **Focused Work**: Do one thing at a time, do it well
4. **Technical Debt Prevention**: Regular pattern extraction and reviews
5. **Clear Handoffs**: Easy to pause/resume or hand off work

## Getting Started

1. When assigned a task, check its method (usually "Multi Pass Development")
2. Start with Pass 1 - just make it work
3. Follow the phase guides for each pass
4. Transition cleanly between phases
5. Extract patterns in Pass 5 for future reuse

## See Also

- AI phase guides: `/ai/methods/multi-pass-development/` (*.ai.md files)
- Pattern library: `/ai/patterns/`
- Standards: `/ai/standards/` (coming soon)
- Task management: `/.claude/tasks/`
