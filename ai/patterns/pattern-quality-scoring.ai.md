---
id: pattern-quality-scoring
title: Pattern Quality Scoring Pattern
tags: [documentation, quality-control, automation, meta-pattern]
domains: [all]
complexity: beginner
when-to-use: [phase-transitions, pattern-extraction, pattern-selection]
related: [pattern-extraction, reference-management]
---

# Pattern Quality Scoring Pattern

## Quick Context

When extracting patterns or standards during phase transitions, score each pattern instance's quality (1-5) to enable automatic selection of the best implementations for documentation.

**Note**: This is a specialized scoring pattern for pattern instances. For other artifact types, see [@pattern:contextual-scoring-pattern].

## The Pattern

### When to Apply

- During phase transitions when extracting patterns/standards
- When adding new pattern instances to existing patterns
- During automated documentation updates
- When reviewing old pattern implementations for relevance

### Implementation

#### 1. Scoring Structure

```typescript
interface ExampleScore {
  score: 1 | 2 | 3 | 4 | 5;
  breakdown: {
    clarity: 1-5;      // How clear is the implementation?
    completeness: 1-5; // Does it demonstrate the full pattern?
    context: 1-5;      // Is problem/solution well explained?
    outcomes: 1-5;     // Are results measurable?
    teachability: 1-5; // Can others learn from this?
  };
  metadata: {
    scoredDate: string;    // ISO date
    scoredBy: string;      // agent-N or username
    codebaseHash: string;  // git commit SHA
    reasoning: string;     // brief explanation
  };
}
```

#### 2. Scoring Rubric

**5 - Exemplary** (Conference talk quality)

- Crystal clear implementation
- Shows complete pattern with edge cases
- Rich context: problem → solution → result
- Quantifiable outcomes documented
- Teaches best practices

**4 - Good** (Documentation quality)

- Clear, understandable code
- Demonstrates core pattern well
- Good context provided
- Some outcomes noted
- Others can learn from it

**3 - Adequate** (Functional but not ideal)

- Basic implementation works
- Pattern is visible but not highlighted
- Minimal context
- Results mentioned but not measured
- Requires effort to understand

**2 - Poor** (Needs improvement)

- Unclear or convoluted implementation
- Pattern obscured by other concerns
- Missing important context
- No outcomes documented
- Hard to learn from

**1 - Unsuitable** (Do not use)

- Anti-pattern or wrong approach
- Misleading or incorrect
- No context provided
- Failed implementation
- Would teach bad habits

#### 3. Scoring Process

```markdown
## Phase Transition Scoring Checklist

When extracting a pattern/standard example:

1. **Assess Clarity** (1-5)
   - Can you understand the code without deep context?
   - Is the pattern implementation obvious?
   - Are variable/function names self-documenting?

2. **Evaluate Completeness** (1-5)
   - Does it show the entire pattern?
   - Are edge cases handled?
   - Is error handling included?

3. **Review Context** (1-5)
   - Is the problem clearly stated?
   - Is the solution approach explained?
   - Are alternatives mentioned?

4. **Check Outcomes** (1-5)
   - Are results measurable?
   - Is improvement quantified?
   - Are trade-offs documented?

5. **Judge Teachability** (1-5)
   - Would a new developer understand?
   - Does it follow best practices?
   - Could it be used as training material?

**Final Score** = Round(Average of all scores)
```

#### 4. Integration in References

```markdown
<!-- In pattern.ref.md -->
## Task Applications
- 2025-07-01: task-001-token-validation 
  - Score: 5/5 (Crystal clear validation with context)
  - Hash: a3f2c1d
- 2025-07-02: task-003-color-processing
  - Score: 3/5 (Works but lacks outcome metrics)
  - Hash: b4e5f2a
- 2025-07-03: task-005-error-handling
  - Score: 4/5 (Good example, minor context gaps)
  - Hash: c5f6g3b
```

### Automation Rules

Only examples scored **4 or higher** are automatically included in pattern documentation.

```javascript
// Example selection for auto-generation
function selectExamplesForPattern(references) {
  return references
    .filter(ref => ref.score >= 4)
    .sort((a, b) => {
      // Prefer higher scores
      if (a.score !== b.score) return b.score - a.score;
      // Then prefer newer
      return new Date(b.date) - new Date(a.date);
    })
    .slice(0, 5); // Keep top 5
}
```

### Example Aging

Examples older than 3 months or from different codebases should be rescored:

```javascript
function needsRescoring(example, currentHash) {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  return new Date(example.scoredDate) < threeMonthsAgo ||
         example.codebaseHash !== currentHash;
}
```

## Common Pitfalls

### 1. Grade Inflation

**Problem**: Scoring everything as 4-5
**Solution**: Reserve 5 for truly exceptional examples. Most should be 3-4.

### 2. Missing Context

**Problem**: High code quality but no explanation
**Solution**: Even perfect code needs context to score above 3

### 3. Outdated Examples

**Problem**: High-scored examples that no longer apply
**Solution**: Automated rescoring based on age and code changes

## Benefits

- **Quality Control**: Only good examples in documentation
- **Automatic Curation**: Best examples bubble up naturally
- **Living Documentation**: Examples stay fresh and relevant
- **Reduced Maintenance**: System self-maintains
- **Learning Optimization**: Developers see only the best examples

## Related Patterns

- Pattern Extraction at Phase Boundaries
- Reference Management System
- Automated Documentation Generation
