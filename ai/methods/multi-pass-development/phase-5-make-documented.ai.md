# Phase 5: Make it Documented

## Quick Context

- **Goal**: Complete documentation for both human and AI audiences
- **Time Budget**: 10% of total task time
- **Focus**: JSDoc, context docs, examples, pattern finalization
- **Note**: Pattern extraction happens throughout at phase boundaries

## Checklist

- [ ] Write comprehensive JSDoc for APIs
- [ ] Create human docs (README.md, /docs/)
- [ ] Create AI docs (.ai.md, /ai/)
- [ ] Add usage examples and rationale
- [ ] Review patterns extracted in previous phases
- [ ] Document any final patterns from this phase
- [ ] Update relevant indexes

## Documentation Strategy

### Human Documentation (README.md, /docs/)

- **Purpose**: Discovery, learning, troubleshooting
- **Content**: Why it exists, when to use, integration guides
- **Location**: Co-located READMEs + /docs/ for guides

### AI Documentation (.ai.md, /ai/)

- **Purpose**: Context, patterns, task execution
- **Content**: Implementation rationale, patterns, quick reference
- **Location**: Co-located .ai.md + /ai/ for methods

## What Goes Where

### Co-located Human Docs (README.md)

```markdown
# Component Name
Why this exists, when to use it, integration examples
```

### Co-located AI Docs (.ai.md)  

```markdown
# Component AI Context
Implementation rationale, patterns, quick reference tables
```

### JSDoc (in code)

```typescript
/**
 * API documentation, parameters, examples, throws
 * @standard Link to pattern if applicable
 * @migration How to update existing code
 */
```

## Documentation Outputs

1. **Human**: JSDoc + README + /docs/ guides + migration paths
2. **AI**: .ai.md context + /ai/ patterns + quick references
3. **Both**: Examples, edge cases, rationale

## Success Criteria

✅ All public APIs have JSDoc
✅ Human docs explain "why" and "when"
✅ AI docs provide context and patterns
✅ Migration paths clear for both audiences

## Pattern Review

Since patterns are extracted at each phase boundary:

1. **Review Previous Patterns**: Check patterns from Phases 1-4
2. **Document Pattern Usage**: Show patterns in documentation examples
3. **Final Pattern Extraction**: Any patterns unique to documentation phase
4. **Score All Examples**: Ensure all have quality scores (1-5)

## Phase Transition

When complete, follow standard transition protocol:

1. Extract any final patterns from documentation work
2. Score examples using [@pattern:pattern-quality-scoring]
3. Update pattern .ref.md files
4. List all documentation created
5. Summarize patterns extracted throughout task
6. Check task for "tech debt review"
7. If TICK: Proceed to task completion
8. If TOCK: Continue to Phase 6
