# Reference Scanner Pattern References

## Task Usage (WHEN)

- 2025-07-01: task-001-five-pass-development-guide - Created during Phase 2 system documentation
  - Pattern Score: 4/5 (Good implementation)
  - Scoring breakdown:
    - Clarity: 5/5 - Clear implementation steps
    - Completeness: 4/5 - Core functionality covered, could add caching
    - Context: 5/5 - Good problem/solution explanation
    - Outcomes: 4/5 - Benefits clear, metrics would help
    - Teachability: 4/5 - Good examples, could use full script
  - Hash: current
  - Notes: Solid foundation for reference automation

## Implementation Locations (WHERE)
<!-- AUTO-GENERATED -->
<!-- To be populated when implemented -->
<!-- END AUTO-GENERATED -->

## Manual References

### Planned Implementations

- `scripts/scan-references.ts` - Main scanner implementation
- `scripts/utils/ast-helpers.ts` - AST parsing utilities
- `.github/workflows/update-references.yml` - CI integration

## Insights

- AST parsing provides robust tag extraction
- Deterministic updates prevent unnecessary churn
- Performance optimization crucial for large codebases
- Could extend to other languages beyond JS/TS

## Audit Notes

- [ ] Build working prototype
- [ ] Add caching for performance
- [ ] Create incremental scanning (git diff)
- [ ] Add validation for tag names
