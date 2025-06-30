# Pattern: Methodical File Processing

## Quick Reference

| Step | Action | Purpose |
|------|--------|---------|
| 1. Track | Rename to `REVIEWED-*` | Visual progress indicator |
| 2. Process | One file at a time | Maintain focus, avoid mistakes |
| 3. Update | Progress tracking inline | Resume from any context |
| 4. Verify | Check before marking done | Ensure completeness |

## Implementation

```bash
# Process files with clear tracking
for file in directory/*; do
  # 1. Read and process
  content=$(cat "$file")
  
  # 2. Extract/transform content
  process_file "$content"
  
  # 3. Mark as processed ONLY after verification
  mv "$file" "${file%/*}/REVIEWED-${file##*/}"
  
  # 4. Update progress tracker
  echo "- [x] $file → Processed ✓"
done
```

## Progress Tracking Format

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

## Key Principles

1. **Never Rush**: Thoroughness over speed
2. **One at a Time**: Complete extraction before moving on
3. **Track Everything**: Progress should be resumable from any point
4. **Verify Completeness**: Check all content extracted before marking done
5. **Handle Overlaps**: Consolidate duplicate information

## When to Use
- Processing backup directories
- Migrating large sets of files
- Extracting information from multiple sources
- Any bulk file operation requiring accuracy

## Tasks Using This Pattern
- `2025-06-30 agent-0-extract-all-tasks-from-backup`: Extracted 80 files with 100% completion
- `2025-06-30 agent-0-agent-prompt-system-updates`: Moved START files from .claude/ to .agents/start/ systematically