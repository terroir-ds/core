# Script Error Handling Pattern References

## Task Usage (WHEN)

- 2025-07-01: task-001-five-pass-development-guide - Documented from previous work
  - Pattern Score: 4/5 (Good pattern instance)
  - Scoring breakdown (using pattern-quality-scoring):
    - Clarity: 5/5 - Very clear implementation with module structure
    - Completeness: 4/5 - Covers main cases, could add retry logic
    - Context: 4/5 - Good problem explanation, test vs prod
    - Outcomes: 4/5 - Prevents crashes, improves reliability
    - Teachability: 4/5 - Good examples, could add integration guide
  - Hash: current
  - Notes: Essential for robust automation scripts

## Implementation Locations (WHERE)
<!-- AUTO-GENERATED -->
<!-- To be populated by reference scanner -->
<!-- END AUTO-GENERATED -->

## Manual References

### Potential Applications

- manage-agent-tasks.js script
- Pattern scanning scripts
- Migration utilities
- Build and deployment scripts

## Insights

- Test environment suppression prevents noise
- Centralized handler ensures consistency
- Process event handlers catch all error types
- Environment-aware behavior critical for CI/CD

## Audit Notes

- [ ] Add retry logic examples
- [ ] Include logging integration
- [ ] Add error categorization
- [ ] Create testing guide for error scenarios
