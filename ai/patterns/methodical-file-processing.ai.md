# Methodical File Processing Pattern

## Quick Context

Process large sets of files with tracking and resumability. Essential for bulk operations that require accuracy and progress monitoring.

**When to use**: Backup processing, migrations, bulk extractions, any operation where missing files would be critical.

## Implementation

```bash
# Track progress by renaming processed files
for file in directory/*; do
  # Process file
  content=$(cat "$file")
  process_file "$content"
  
  # Mark processed ONLY after verification
  mv "$file" "${file%/*}/REVIEWED-${file##*/}"
  
  # Update tracker
  echo "- [x] $file → Processed ✓"
done
```

### Progress Tracking Template

```markdown
## Progress Status
- **Total Files**: 80
- **Files Processed**: 45/80 (56%)
- **Last Processed**: filename.md
- **Next to Process**: next-file.md

### Directory Progress
- specifications/: 22/22 (100%) ✅
- active/: 15/20 (75%)
- completed/: 8/20 (40%)
```

## Anti-Pattern

```bash
# ❌ Processing without tracking
for file in *.md; do
  process_file "$file"  # No way to resume if interrupted
done

# ❌ Marking complete before verification
mv "$file" "DONE-$file"  # What if process_file failed?
process_file "$file"
```

## Best Practice

1. **One at a time**: Complete each file before moving on
2. **Visual tracking**: Use file renaming for instant progress visibility  
3. **Resumable state**: Progress should survive interruptions
4. **Verify first**: Only mark complete after confirming success
5. **Handle duplicates**: Consolidate overlapping information

## Task References

- `2025-06-30 agent-0-extract-all-tasks-from-backup`: 80 files with 100% completion tracking
- `2025-06-30 agent-0-agent-prompt-system-updates`: Systematic START file migration

---
*Pattern stability: High | Last validated: 2025-06-30*