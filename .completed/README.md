# Completed Work Index

This directory contains the version-controlled history of completed work on the Terroir Core Design System.

## Structure

```markdown
.completed/
├── tasks/             # Completed tasks organized by date
│   ├── 2025-06-29/   # Tasks completed on June 29, 2025
│   │   ├── agent-0-reorganize-task-structure.md
│   │   └── agent-1-string-formatting-utilities.md
│   ├── 2025-06-30/   # Tasks completed on June 30, 2025
│   │   └── agent-0-extract-all-tasks-from-backup.md
│   └── YYYY-MM-DD/   # Standard date format for sorting
└── patterns/          # Reusable patterns discovered during development
    ├── error-handling.md
    ├── test-structure.md
    └── api-design.md
```

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

## Pattern Library

Patterns are extracted from completed work and stored for reuse:

1. **[Error Handling](./patterns/error-handling.md)** - Typed errors with context
2. **[Test Structure](./patterns/test-structure.md)** - Co-located test organization
3. **[API Design](./patterns/api-design.md)** - Consistent function signatures
4. **[Script Error Handling](./patterns/script-error-handling.md)** - Bash script safety patterns

### Pattern Format
Patterns should be optimized for AI consumption with:
- Quick reference tables
- Minimal prose
- Code-first examples
- Cross-references to detailed docs in `/docs/ai/` or `/docs/resources/`
- Task references using format: `YYYY-MM-DD agent-N-task-name`

Example pattern with task references:
```markdown
# Pattern: Typed Error Handling

## Quick Reference
| Error Type | Usage | Context Required |
|------------|-------|------------------|
| ValidationError | Input validation | field, value |
| ConfigError | Configuration issues | key, expected |

## Implementation
\`\`\`typescript
throw new ValidationError('Invalid email', { 
  field: 'email', 
  value: input 
});
\`\`\`

## Tasks Using This Pattern
- `2025-06-30 agent-0-extract-all-tasks-from-backup`: Enhanced pattern with context
- `2025-06-29 agent-1-string-formatting-utilities`: Initial implementation
```

## How to Use

### Completing a Task

```bash
# 1. Create today's folder if it doesn't exist
mkdir -p .completed/tasks/$(date +%Y-%m-%d)

# 2. MOVE (not copy) completed task with proper naming
mv .claude/tasks/agent-0/002-task-name.md \
   .completed/tasks/$(date +%Y-%m-%d)/agent-0-task-name.md
# NOTE: This removes the task from the active directory

# 3. Extract patterns (IMPORTANT)
# - Review task for reusable patterns
# - Check if similar pattern exists in .completed/patterns/
# - Update existing pattern OR create new one
# - Add task reference to pattern: "2025-06-30 agent-0-task-name"

# 4. Commit the completion
git add .completed/
git commit -m "feat: complete agent-0 task-name

- [Brief summary of what was accomplished]
- Patterns: [list any patterns created/updated]
"
```

### Archiving Old Tasks

Tasks older than 2 weeks are moved to year folders:

```bash
# Archive tasks older than 14 days
.completed/tasks/2025-06-15/ → .completed/tasks/2025/2025-06-15/

# Directory structure after archiving:
.completed/tasks/
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
ls -la .completed/tasks/

# Find tasks by agent
find .completed/tasks -name "agent-1-*.md"

# Search for specific patterns
grep -r "pattern-name" .completed/patterns/

# View recent completions
ls -la .completed/tasks/$(date +%Y-%m-%d)/
```

## Metrics and Reporting

Track progress with simple commands:

```bash
# Count tasks per agent
find .completed/tasks -name "agent-*" | cut -d'-' -f2 | sort | uniq -c

# Tasks completed per day
for dir in .completed/tasks/*/; do
  echo "$(basename $dir): $(ls -1 $dir | wc -l) tasks"
done

# Pattern usage frequency
grep -r "Pattern:" .completed/tasks/ | cut -d':' -f3 | sort | uniq -c
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
