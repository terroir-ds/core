# Safe Migration Strategy Pattern References

## Task Usage (WHEN)

- 2025-07-01: task-001-five-pass-development-guide - Documented from previous work
  - Pattern Score: 5/5 (Exemplary pattern instance)
  - Scoring breakdown (using pattern-quality-scoring):
    - Clarity: 5/5 - Very clear step-by-step approach
    - Completeness: 5/5 - Includes backup, migration, verification, rollback
    - Context: 5/5 - Excellent use case explanation
    - Outcomes: 5/5 - Prevents data loss, enables confidence
    - Teachability: 5/5 - Immediately usable script template
  - Hash: current
  - Notes: Critical pattern for safe refactoring

## Implementation Locations (WHERE)
<!-- AUTO-GENERATED -->
<!-- To be populated by reference scanner -->
<!-- END AUTO-GENERATED -->

## Manual References

### Potential Applications

- README.md to index.md migration
- Pattern file reorganization
- Multi-workspace migrations
- Asset restructuring

## Insights

- Timestamped backups prevent collision and enable multiple attempts
- Phased approach allows early error detection
- One-command rollback critical for confidence
- Verification step often reveals edge cases

## Audit Notes

- [ ] Create reusable migration script template
- [ ] Add dry-run capability
- [ ] Include migration progress tracking
- [ ] Document common verification checks
