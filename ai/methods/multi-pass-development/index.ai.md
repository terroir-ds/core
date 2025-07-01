# Multi-Pass Development Method

## Quick Context
- **Purpose**: Systematic feature development through focused phases
- **Phases**: 5 core phases + optional tech debt phase
- **Time Split**: 30% / 20% / 20% / 20% / 10%

## Phase Loading Strategy
Only load the phase guide you're currently working on:

```markdown
<!-- In your task file -->
**Current Phase**: Phase 3 - Make it Safe
**Phase Guide**: /ai/methods/multi-pass-development/phase-3-make-safe.ai.md
```

## Phase Overview

| Phase | Name | Focus | Time |
|-------|------|-------|------|
| 1 | Make it Work | Basic functionality | 30% |
| 2 | Make it Right | Code quality | 20% |
| 3 | Make it Safe | Edge cases & security | 20% |
| 4 | Make it Tested | Test coverage | 20% |
| 5 | Make it Documented | Docs & standards | 10% |
| 6 | Tech Debt Review | Apply standards (TOCK only) | Varies |

## When to Use This Method
- General feature development
- Utility functions
- System components
- API endpoints
- Most coding tasks

## When NOT to Use This Method
- Quick bug fixes (use rapid-fix method)
- Pure documentation (use docs-only method)
- Component stories (use storybook-component method)

## Phase Transition Protocol
See [@method:multi-pass-development/phase-transitions] for detailed protocol.

Key steps:
1. Summarize current phase results
2. Get user confirmation
3. Update task file with new phase
4. Commit work atomically
5. Clean context window

## See Also
- [@method:multi-pass-development/phase-transitions] for transition details
- [@pattern:progressive-disclosure] for context management
- [@standard:phase-tracking] for task file updates