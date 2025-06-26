# CLAUDE.md Maintenance Standards

## Overview

CLAUDE.md is the primary instruction file for AI assistants. It must remain focused, efficient, and actionable.

## Size Guidelines

- **Target length**: < 700 lines
- **Hard limit**: 1000 lines
- **Review threshold**: If exceeding 800 lines, refactor content

## What Belongs in CLAUDE.md

### ✅ SHOULD Include

1. **Project Overview** (brief)
   - Core purpose
   - Key technologies
   - Architecture diagram

2. **Critical Workflows**
   - Task-commit workflow
   - Definition of done
   - Quick commands

3. **AI-Specific Instructions**
   - Package manager (pnpm)
   - Standard practices summary
   - Common pitfalls

4. **Quick References**
   - Links to detailed standards
   - Essential examples
   - Path aliases

### ❌ SHOULD NOT Include

1. **Detailed How-Tos**
   - Move to `/docs/standards/`
   - Keep only quick reminders

2. **Comprehensive Lists**
   - Full linting rules → `code-quality.md`
   - All error types → `error-handling.md`
   - Complete API docs → module docs

3. **Redundant Information**
   - If it's in standards, just link to it
   - Don't duplicate content

## Refactoring Process

When CLAUDE.md grows too large:

1. **Identify Removable Sections**

   ```bash
   # Find large sections
   grep -n "^###" CLAUDE.md | awk -F: '{print $2}' | sort | uniq -c
   ```

2. **Create New Standard Docs**

   ```bash
   # Move detailed content
   docs/standards/new-standard.md
   ```

3. **Replace with Link**

   ```markdown
   ### Topic Name

   See [Topic Standards](./docs/standards/topic.md) for detailed guidelines.

   **Quick reminder**: One-line summary of key point.
   ```

## Examples of Good Refactoring

### Before (Too Detailed)

````markdown
### Logging Standards

[50+ lines of examples and explanations]

````text
### After (Concise)
```markdown
### Logging

See [Logging Standards](./docs/standards/logging.md) for structured logging practices.

**Quick reminder**: Never use `console.log` - always use the structured logger from `@utils/logger`.
````
````

## Review Checklist

When updating CLAUDE.md:

- [ ] Is this AI-critical information?
- [ ] Can details move to standards docs?
- [ ] Are we duplicating existing docs?
- [ ] Is the quick reminder sufficient?
- [ ] Will this help AI make better decisions?

## Maintenance Schedule

- **Weekly**: Quick review for redundancy
- **Monthly**: Full audit and refactor
- **On PR**: Check if additions are necessary

Remember: CLAUDE.md should be a **roadmap**, not an **encyclopedia**.
