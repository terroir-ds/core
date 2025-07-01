# Phase 1: Plan & Write (80%)

## Objective
Research, structure, and write the documentation in one focused effort.

## Quick Steps

### 1. Identify What to Document
```bash
# Quick scope check
- What specific task/pattern/method am I documenting?
- Who will use this? (AI agents implementing similar tasks)
- What's the core problem it solves?
```

### 2. Gather Context (5-10 min)
```bash
# Find related examples
rg "pattern-name" .completed/
rg "similar-task" ai/

# Check implementation
git log --oneline -n 10 path/to/implementation
```

### 3. Write Documentation
Start with this template and fill it out:

```markdown
# [Task/Pattern/Method Name]

## Quick Context
[2-3 sentences explaining what this is and why it matters]

## When to Use
- [Specific scenario 1]
- [Specific scenario 2]
- [Specific scenario 3]

## Implementation
[Step-by-step guide with actual commands/code]

## Example
[One concrete, working example]

## Common Issues
- **Problem**: [What might go wrong]
  **Solution**: [How to fix it]

## Related
- [Link to similar pattern]
- [Link to prerequisite knowledge]
```

## Writing Tips
- Lead with the most important info
- Include real file paths and commands
- Test your examples as you write
- Keep it practical and actionable

## Time Check
Aim to complete Phase 1 in 30-45 minutes. If it's taking longer, ship what you have and iterate later.