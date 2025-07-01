---
id: contextual-scoring-pattern
title: Contextual Scoring Pattern
tags: [quality-control, scoring, meta-pattern, standards]
domains: [all]
complexity: intermediate
when-to-use: [scoring-artifacts, quality-assessment, standard-compliance]
related: [pattern-quality-scoring, standard-quality-scoring]
---

# Contextual Scoring Pattern

## Quick Context
Apply consistent scoring criteria (1-5) across different artifact types by interpreting the criteria contextually rather than literally, maintaining simplicity while ensuring relevance.

## The Pattern

### Universal Scoring Criteria

All artifacts are scored on these 5 criteria, but their interpretation varies by context:

1. **Correctness (30%)** - Is it right for its purpose?
2. **Completeness (20%)** - Does it cover what's needed?
3. **Quality (20%)** - Is it well-crafted?
4. **Validation (15%)** - Can we verify it works?
5. **Impact (15%)** - Does it achieve goals efficiently?

### Contextual Interpretations

#### For Code Standards
```markdown
- **Correctness**: Does the code follow the standard correctly?
- **Completeness**: Are all edge cases handled?
- **Quality**: Is the code clean and maintainable?
- **Validation**: Are there tests proving it works?
- **Impact**: Is it performant and secure?
```

#### For Documentation Standards
```markdown
- **Correctness**: Is the information accurate?
- **Completeness**: Are all topics covered?
- **Quality**: Is it clear and well-organized?
- **Validation**: Are there examples demonstrating usage?
- **Impact**: Does it enable understanding and adoption?
```

#### For Configuration Standards
```markdown
- **Correctness**: Are settings properly configured?
- **Completeness**: Are all required options set?
- **Quality**: Is it well-structured and commented?
- **Validation**: Can we verify it works as intended?
- **Impact**: Does it achieve security/performance goals?
```

#### For Process Standards
```markdown
- **Correctness**: Does the process achieve its goals?
- **Completeness**: Are all steps defined?
- **Quality**: Is it clear and efficient?
- **Validation**: Are there metrics to measure success?
- **Impact**: Does it improve outcomes?
```

### Implementation Example

```typescript
function scoreArtifact(artifact: Artifact, type: ArtifactType): Score {
  const criteria = getContextualCriteria(type);
  
  return {
    correctness: evaluateCorrectness(artifact, criteria.correctness),
    completeness: evaluateCompleteness(artifact, criteria.completeness),
    quality: evaluateQuality(artifact, criteria.quality),
    validation: evaluateValidation(artifact, criteria.validation),
    impact: evaluateImpact(artifact, criteria.impact),
    
    // Weighted average
    total: calculateWeightedScore({
      correctness: 0.30,
      completeness: 0.20,
      quality: 0.20,
      validation: 0.15,
      impact: 0.15
    })
  };
}
```

### Scoring Documentation Example

When scoring the index-file-convention standard:

```markdown
## Scoring: index-file-convention (Documentation Standard)

**Correctness (5/5)**: Convention is logically sound and follows web standards
**Completeness (4/5)**: Covers main cases, could add more edge cases  
**Quality (5/5)**: Clear, well-organized with good examples
**Validation (4/5)**: Has migration script, could add validation tool
**Impact (5/5)**: Significantly improves navigation and organization

**Total**: 4.6/5 → 5/5 (Rounds to exemplary)
```

### Benefits

1. **Consistency**: Same criteria across all artifacts
2. **Flexibility**: Context-aware interpretation
3. **Simplicity**: Only one scoring system to learn
4. **Comparability**: Can compare scores across types
5. **Evolution**: Easy to add new artifact types

## Common Pitfalls

### 1. Literal Interpretation
**Problem**: Trying to find "tests" for documentation
**Solution**: Interpret "validation" as "examples" or "clarity checks"

### 2. Forcing Bad Fits
**Problem**: Some criteria seem irrelevant
**Solution**: Every artifact has correctness, completeness, quality, validation, and impact - just different forms

### 3. Over-Specialization
**Problem**: Creating too many specific rubrics
**Solution**: Stick to universal criteria with contextual interpretation

## When to Use Which Scoring Pattern

### Decision Tree
```
What are you scoring?
├── A pattern instance? → Use [@pattern:pattern-quality-scoring]
├── A code implementation? → Use [@pattern:standard-quality-scoring]
└── Anything else? → Use this pattern (contextual-scoring)
    ├── Documentation standard
    ├── Configuration file
    ├── Process definition
    ├── Architecture decision
    └── Any other artifact
```

### Hierarchy
```
contextual-scoring-pattern (Universal - use for anything)
├── pattern-quality-scoring (Specialized for patterns)
└── standard-quality-scoring (Specialized for code)
```

The specialized patterns provide more specific criteria while this pattern provides the universal fallback.

## Related Patterns
- Pattern Quality Scoring (specialized variant for patterns)
- Standard Quality Scoring (specialized variant for code standards)