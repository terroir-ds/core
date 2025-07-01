# Task: Reorganize .claude/tasks Structure

<!-- AUTO-MANAGED: Do not edit below this line -->
**After Completion**: merge to develop
**Next Action**: continue to task 002
<!-- END AUTO-MANAGED -->

## Objective
Reorganize the `.claude/tasks` directory to implement the new simplified structure with auto-managed embedded state.

## Current State Analysis

### Existing Structure Issues
1. Complex nested directories (active/sprint-1/agent-X)
2. Specifications directory with 22 files that are really just tasks
3. Multiple competing organizational patterns
4. Unclear task prioritization

### Files to Migrate
- 3 agent-specific tasks already in correct location
- 4 tasks in sprint-1 subdirectories 
- 22 specifications that need to become tasks
- 5 backlog items

## Implementation Plan

### Phase 1: Create New Structure
```
.claude/tasks/
├── agent-0/
├── agent-1/  
├── agent-2/
├── agent-3/
├── backlog/
└── README.md
```

### Phase 2: Migration Mapping

#### Agent 0 Tasks (Integration & Planning)
1. 001-reorganize-task-structure.md (this task)
2. 002-quality-gates-setup.md
3. 003-sprint-planning.md
4. 004-codeowners-setup.md (from specifications)
5. 005-github-actions-ci-cd.md (from specifications)
6. 006-markdown-fixes-improvements.md (existing)
7. 007-bash-script-security-framework.md (existing)

#### Agent 1 Tasks (Utilities)
1. 001-string-formatting-utilities.md (from sprint-1 + spec)
2. 002-case-conversion-utilities.md
3. 003-security-utilities.md (from spec)
4. 004-guard-utilities.md (from spec)
5. 005-environment-utilities.md (from spec)
6. 006-performance-utilities.md (from spec)
7. 007-timing-utilities.md (from spec)
8. 008-data-transform-utilities.md (from spec)
9. 009-testing-utilities.md (from spec)

#### Agent 2 Tasks (Infrastructure)
1. 001-token-system-setup.md (from sprint-1)
2. 002-material-color-integration.md
3. 003-security-scanning-implementation.md (existing + spec)
4. 004-bundle-size-monitoring.md (from spec)
5. 005-code-coverage-setup.md (from spec)
6. 006-dependency-management.md (from spec)
7. 007-package-exports-config.md (from spec)
8. 008-turbo-remote-caching.md (from spec)
9. 009-vscode-configuration.md (from spec)
10. 010-dev-debug-tooling.md (from spec)
11. 011-error-tracking-setup.md (from spec)

#### Agent 3 Tasks (Components)
1. 001-component-architecture.md (from sprint-1)
2. 002-button-component.md
3. 003-card-component.md
4. 004-input-component.md
5. 005-theme-provider.md

#### Backlog (Unassigned)
- i18n-migration-plan.md
- i18n-todo-list.md
- infrastructure-overview.md
- infrastructure-roadmap.md
- refactoring-backlog.md
- error-patterns.md (from spec, could go to Agent 1)
- stack-trace-utilities.md (from spec, could go to Agent 1)
- environment-validation.md (from spec, could go to Agent 2)

### Phase 3: Execute Migration

1. Create directory structure
2. Move existing agent tasks with new numbering
3. Convert specifications to tasks with proper numbering
4. Update task content to include objectives from specs
5. Clean up old directories
6. Create new README.md with simplified instructions

### Phase 4: Create Auto-Management Script

Create `scripts/manage-agent-tasks.js` with:
- Auto-embedded state management
- Git hook integration
- Manual trigger via pnpm command

## Success Criteria

- [x] Backup created (DONE: .claude-backup-20250630-045811)
- [x] New directory structure in place
- [x] All tasks migrated with proper numbering
- [x] Specifications directory removed
- [x] Auto-management script created
- [x] Git hook configured
- [x] README updated with new process

## Task Status: IN PROGRESS

### What Was Accomplished
1. Created new simplified directory structure
2. Migrated existing tasks with proper numbering
3. Converted key specifications to tasks
4. Created `scripts/manage-agent-tasks.js` for auto-management
5. Added `pnpm tasks:update` and `pnpm tasks:status` commands
6. Integrated with git pre-commit hook
7. Updated README with new process

### Still TODO: Deep Review of Backup
Need to thoroughly review `.claude-backup-20250630-045811/tasks/` to extract ALL valuable task ideas, especially:
- Decompose tasks for Agent 1
- Hidden tasks in various documents
- Sprint plans with specific work items
- Any other valuable threads

The backup should be treated as READ-ONLY.

**UPDATE**: Created task 002-extract-all-tasks-from-backup.md as the next priority to ensure this critical work isn't lost.

## Rollback Plan

If issues arise:
```bash
# Remove botched migration
rm -rf .claude

# Restore from backup
cp -r .claude-backup-20250630-045811 .claude
```

## Notes

- Being extra cautious since .claude is not in version control
- Each specification will be reviewed before converting to ensure proper agent assignment
- Task numbering will reflect realistic priority order
- Some specs may be split into multiple tasks if too large

## Patterns Extracted
- [safe-migration-strategy.md](../../patterns/safe-migration-strategy.md): Phased migration with backup and rollback plan