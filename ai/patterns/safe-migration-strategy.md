# Safe Migration Strategy Pattern

## Quick Context

Perform irreversible structural changes with confidence through backups, mapping, and phased execution. Critical for directory reorganizations and format conversions.

**When to use**: Directory restructuring, file format migrations, consolidating scattered content, any change that would be difficult to undo manually.

## Implementation

```bash
# 1. Timestamped backup for rollback
BACKUP_DIR=".claude-backup-$(date +%Y%m%d-%H%M%S)"
cp -r .claude "$BACKUP_DIR"

# 2. Create target structure first
mkdir -p new-structure/{dir1,dir2,dir3}

# 3. Phased migration with verification
for category in "${categories[@]}"; do
  migrate_category "$category"
  verify_migration "$category"
done

# 4. One-command rollback if needed
if [[ $ERRORS -gt 0 ]]; then
  rm -rf .claude
  cp -r "$BACKUP_DIR" .claude
fi
```

### Migration Mapping Template

```markdown
### Phase 2: Migration Mapping

#### Category A
1. old-file-1.md → new-location/001-new-name.md
2. old-file-2.md → new-location/002-new-name.md

#### Category B  
1. spec-file.md → tasks/001-task-name.md (convert format)
```

## Anti-Pattern

```bash
# ❌ No backup before destructive operations
rm -rf old-structure
mkdir new-structure

# ❌ All-at-once migration
mv old/* new/  # What if it fails halfway?

# ❌ No mapping documentation
rename 's/old/new/' *  # How to verify completeness?
```

## Best Practice

1. **Backup first**: Always create timestamped backups
2. **Map everything**: Document old→new paths before execution
3. **Phase by category**: Migrate logical groups together
4. **Verify each phase**: Check success before proceeding
5. **Simple rollback**: One command to restore original state

## Task References

- `2025-06-30 agent-0-reorganize-task-structure`: Full .claude/tasks reorganization with phased migration
- `2025-06-30 agent-0-agent-prompt-system-updates`: Prompt backup and archive strategy

---
*Pattern stability: High | Last validated: 2025-06-30*