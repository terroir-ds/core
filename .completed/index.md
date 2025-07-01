# Completed Work Index

This directory contains the version-controlled history of completed work on the Terroir Core Design System.

## Structure

```markdown
.completed/
├── 2025-06-29/       # Tasks completed on June 29, 2025
│   ├── agent-0-reorganize-task-structure.md
│   └── agent-1-string-formatting-utilities.md
├── 2025-06-30/       # Tasks completed on June 30, 2025
│   └── agent-0-extract-all-tasks-from-backup.md
└── YYYY-MM-DD/       # Standard date format for sorting
```

**Note**: Patterns have been moved to `/ai/patterns/` for better organization and AI-first access.

## Task Organization

### Date-Based Structure
- Each day's completed work goes in a folder named `YYYY-MM-DD`
- Tasks are renamed to `agent-{id}-{task-title}.md` when moved
- This provides natural chronological sorting and workload visibility

### Benefits
- **No sprint overhead**: Agents work at their own pace
- **Clear daily progress**: See what was accomplished each day
- **Workload balance**: Easily spot if one agent is over/under-utilized
- **Fluid releases**: Merge to develop as tasks complete
- **Natural history**: Chronological record of project evolution


## How to Use

### Completing a Task

```bash
# 1. Create today's folder if it doesn't exist
mkdir -p .completed/$(date +%Y-%m-%d)

# 2. MOVE (not copy) completed task with proper naming
mv .claude/tasks/agent-0/002-task-name.md \
   .completed/$(date +%Y-%m-%d)/agent-0-task-name.md
# NOTE: This removes the task from the active directory

# 3. Review for task-specific insights
# - Most patterns were already extracted in Phase 5
# - Only add truly task-specific discoveries here
# - Reference main patterns: [@pattern:name] in /ai/patterns/

# 4. Commit the completion
git add .completed/
git commit -m "feat: complete agent-0 task-name

- [Brief summary of what was accomplished]
- Patterns: [list any patterns created/updated in /ai/patterns/]
- Insights: [task-specific discoveries if any]
"
```

### Archiving Old Tasks

Tasks older than 2 weeks are moved to year folders:

```bash
# Archive tasks older than 14 days
.completed/2025-06-15/ → .completed/2025/2025-06-15/

# Directory structure after archiving:
.completed/
├── 2025-06-30/        # Recent (today)
├── 2025-06-29/        # Recent (yesterday)
├── 2025/              # Archived 2025 tasks
│   ├── 2025-06-01/
│   └── 2025-06-15/
└── 2026/              # Future year archive
```

### Finding Completed Work

```bash
# List all completed tasks by date
ls -la .completed/

# Find tasks by agent
find .completed -name "agent-1-*.md"

# Search for patterns in AI docs
grep -r "pattern-name" /ai/patterns/

# View recent completions
ls -la .completed/$(date +%Y-%m-%d)/
```

## Metrics and Reporting

Track progress with simple commands:

```bash
# Count tasks per agent
find .completed -name "agent-*" | cut -d'-' -f2 | sort | uniq -c

# Tasks completed per day
for dir in .completed/*/; do
  echo "$(basename $dir): $(ls -1 $dir | wc -l) tasks"
done

# Pattern usage frequency
grep -r "@pattern:" /ai/patterns/ | cut -d':' -f2 | sort | uniq -c
```

## Pattern Extraction Workflow

When completing a task:

1. **Review for patterns**: Look for reusable solutions, abstractions, or approaches
2. **Check existing patterns**: `ls .completed/patterns/` to see if similar exists
3. **Update or create**:
   - If exists: Add new insights and task reference
   - If new: Create pattern file with clear examples
4. **Add task reference**: Use format `YYYY-MM-DD agent-N-task-name`
5. **Keep patterns focused**: One concept per file, AI-optimized format

## Best Practices

1. **Complete tasks fully** before moving to `.completed/`
2. **Extract patterns immediately** while context is fresh
3. **Use consistent naming** for easy searching and metrics
4. **Document decisions** in the task file for future reference
5. **Reference patterns** in task: "Patterns Extracted: [error-handling.md]"
6. **Archive regularly** to keep recent tasks easily accessible

---

Last Updated: 2025-06-30
