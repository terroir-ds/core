# Pattern: Safe Migration Strategy

## Quick Reference

| Phase | Action | Purpose |
|-------|--------|---------|
| 1. Backup | Create timestamped backup | Enable rollback |
| 2. Plan | Map old → new structure | Clear migration path |
| 3. Execute | Phased migration | Minimize disruption |
| 4. Verify | Check completeness | Ensure nothing lost |
| 5. Cleanup | Remove old structure | Finalize migration |

## Implementation

```bash
# 1. Create timestamped backup
BACKUP_DIR=".claude-backup-$(date +%Y%m%d-%H%M%S)"
cp -r .claude "$BACKUP_DIR"

# 2. Create new structure first
mkdir -p new-structure/{dir1,dir2,dir3}

# 3. Migrate in phases
for category in "${categories[@]}"; do
  migrate_category "$category"
  verify_migration "$category"
done

# 4. Rollback if needed
if [[ $ERRORS -gt 0 ]]; then
  rm -rf .claude
  cp -r "$BACKUP_DIR" .claude
fi
```

## Migration Mapping Template

```markdown
### Phase 2: Migration Mapping

#### Category A
1. old-file-1.md → new-location/001-new-name.md
2. old-file-2.md → new-location/002-new-name.md

#### Category B
1. spec-file.md → tasks/001-task-name.md (convert format)
```

## Key Principles

1. **Always Backup First**: Timestamped for easy identification
2. **Map Everything**: Document old→new before moving
3. **Phased Approach**: Migrate logical groups together
4. **Verify Each Phase**: Check before proceeding
5. **Keep Rollback Simple**: One command to restore

## When to Use
- Reorganizing directory structures
- Converting file formats/naming
- Merging scattered content
- Any irreversible structural change

## Rollback Template

```bash
# Clean rollback plan
rm -rf [target-directory]
cp -r [backup-directory] [target-directory]
```

## Tasks Using This Pattern
- `2025-06-30 agent-0-reorganize-task-structure`: Reorganized .claude/tasks with full backup and phased migration
- `2025-06-30 agent-0-agent-prompt-system-updates`: Backed up prompts before updating and archived ephemeral files