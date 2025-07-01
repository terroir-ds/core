---
id: standard-quality-scoring
title: Standard Quality Scoring Pattern
tags: [standards, quality-control, automation, meta-pattern, security, testing]
domains: [all]
complexity: intermediate
when-to-use: [phase-transitions, standard-validation, code-review, compliance-checking]
related: [pattern-quality-scoring, standard-enforcement, code-quality]
---

# Standard Quality Scoring Pattern

## Quick Context
When evaluating how well a standard is implemented during phase transitions or code reviews, score each implementation's quality (1-5) to track compliance and identify exemplary code that demonstrates best practices.

## The Pattern

### When to Apply
- During phase transitions when standards are applied
- When reviewing code for standard compliance
- During tech debt review (Phase 6) to assess existing code
- When creating standard reference examples
- During security or quality audits

### Implementation

#### 1. Scoring Structure
```typescript
interface StandardScore {
  score: 1 | 2 | 3 | 4 | 5;
  breakdown: {
    correctness: 1-5;     // Does it follow the standard correctly?
    completeness: 1-5;    // Are all aspects of the standard implemented?
    codeQuality: 1-5;     // Is the code clean, readable, maintainable?
    testing: 1-5;         // How well is it tested?
    security: 1-5;        // Are security considerations addressed?
    performance: 1-5;     // Is it efficiently implemented?
  };
  metadata: {
    scoredDate: string;      // ISO date
    scoredBy: string;        // agent-N or username
    codebaseHash: string;    // git commit SHA
    standardVersion: string; // Version of the standard applied
    notes: string;          // Specific observations
  };
}
```

#### 2. Scoring Rubric

**5 - Exemplary** (Gold standard implementation)
- Perfect adherence to the standard
- All edge cases handled elegantly
- Exceptional code quality and readability
- Comprehensive test coverage (>95%)
- Security best practices applied
- Performance optimized

**4 - Good** (Solid implementation)
- Correctly follows the standard
- Most edge cases handled
- Clean, maintainable code
- Good test coverage (>80%)
- Security considerations addressed
- Reasonable performance

**3 - Adequate** (Meets minimum requirements)
- Basic standard compliance
- Core functionality correct
- Acceptable code quality
- Basic tests present (>60%)
- No obvious security issues
- Acceptable performance

**2 - Poor** (Needs improvement)
- Partial standard compliance
- Some aspects missing or wrong
- Code quality issues
- Minimal testing (<60%)
- Security gaps present
- Performance concerns

**1 - Non-Compliant** (Fails standard)
- Does not follow the standard
- Major implementation errors
- Poor code quality
- No meaningful tests
- Security vulnerabilities
- Performance problems

#### 3. Scoring Process

```markdown
## Standard Implementation Scoring Checklist

When evaluating a standard implementation:

1. **Assess Correctness** (1-5)
   - Does it follow the standard's specification exactly?
   - Are the required patterns/structures in place?
   - Is the intent of the standard fulfilled?

2. **Evaluate Completeness** (1-5)
   - Are all required aspects implemented?
   - Are edge cases handled per the standard?
   - Is error handling comprehensive?

3. **Review Code Quality** (1-5)
   - Is the code readable and self-documenting?
   - Does it follow project conventions?
   - Is it maintainable and extensible?

4. **Check Testing** (1-5)
   - Unit test coverage percentage?
   - Are edge cases tested?
   - Integration tests present?
   - Tests follow testing standards?

5. **Verify Security** (1-5)
   - Input validation implemented?
   - No sensitive data exposed?
   - Security best practices followed?
   - Potential vulnerabilities addressed?

6. **Measure Performance** (1-5)
   - Efficient algorithms used?
   - No unnecessary operations?
   - Resource usage appropriate?
   - Scales reasonably?

**Final Score** = Weighted average:
- Correctness: 30%
- Completeness: 20%
- Code Quality: 20%
- Testing: 15%
- Security: 10%
- Performance: 5%

**Note**: For non-code standards (documentation, configuration, process), 
use [@pattern:contextual-scoring-pattern] for appropriate interpretation of criteria.
```

#### 4. Integration in References

```markdown
<!-- In standard.ref.md -->
## Implementation Locations (WHERE)
### Core Library
- `processColorSystem` in lib/colors/generator.ts
  - Score: 5/5 (Exemplary - perfect error handling)
  - Hash: a3f2c1d
  - Notes: Comprehensive validation, great tests

- `validateTokens` in lib/tokens/validator.ts
  - Score: 4/5 (Good - minor edge case missing)
  - Hash: b4e5f2a
  - Notes: Solid implementation, needs perf optimization

### Scripts
- `build-tokens` in scripts/build-tokens.mjs
  - Score: 3/5 (Adequate - basic compliance)
  - Hash: c5f6g3b
  - Notes: Works but needs better error messages
```

### Automation Rules

Only implementations scored **4 or higher** should be referenced as good examples in documentation.

```javascript
// Example filtering for documentation
function selectStandardExamples(implementations) {
  return implementations
    .filter(impl => impl.score >= 4)
    .sort((a, b) => {
      // Prefer higher scores
      if (a.score !== b.score) return b.score - a.score;
      // Then prefer better test coverage
      return b.breakdown.testing - a.breakdown.testing;
    })
    .slice(0, 3); // Keep top 3 examples
}
```

### Compliance Tracking

```javascript
function calculateStandardCompliance(implementations) {
  const scores = implementations.map(i => i.score);
  return {
    average: scores.reduce((a, b) => a + b, 0) / scores.length,
    compliant: scores.filter(s => s >= 3).length,
    exemplary: scores.filter(s => s >= 5).length,
    needsWork: scores.filter(s => s < 3).length,
    coverage: (scores.filter(s => s >= 3).length / scores.length) * 100
  };
}
```

## Common Pitfalls

### 1. Focusing Only on Correctness
**Problem**: High correctness score but poor code quality
**Solution**: Use weighted scoring to balance all aspects

### 2. Ignoring Security
**Problem**: Functional code with security vulnerabilities
**Solution**: Security must be explicitly evaluated, even for internal tools

### 3. Test Coverage vs Test Quality
**Problem**: High coverage with poor quality tests
**Solution**: Evaluate test meaningfulness, not just percentages

### 4. Performance Over-Optimization
**Problem**: Premature optimization hurting readability
**Solution**: Balance performance with maintainability

## Benefits

- **Compliance Tracking**: Quantify how well standards are adopted
- **Quality Benchmarking**: Identify exemplary implementations
- **Continuous Improvement**: Track progress over time
- **Risk Assessment**: Quickly identify non-compliant code
- **Learning Resources**: High-scored examples teach best practices

## Related Patterns
- Pattern Quality Scoring (for pattern instances)
- Standard Enforcement
- Code Quality Metrics
- Security Review Pattern