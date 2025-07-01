# AI-First Documentation

This directory contains documentation optimized for AI agents working on the Terroir Core Design System.

## Structure

```
/ai/
├── methods/           # Development methodologies (5-pass, rapid-fix, etc.)
├── patterns/          # Reusable code patterns
├── standards/         # Coding standards and conventions
└── README.md         # This file
```

## Key Principles

### 1. Progressive Disclosure
- Start with minimal context
- Load documentation only as needed
- Use references like [@pattern:name] that can be loaded on demand

### 2. Context Efficiency
- Keep documents focused and concise
- Use tables and lists over prose
- Provide quick reference sections

### 3. Task-Oriented
- Structure around what agents need to do
- Include checklists and success criteria
- Provide clear examples

## Usage in Tasks

When working on a task, you'll see references like:

```markdown
**Method**: Multi-Pass Development with 5 Phases
**Phase Guide**: /ai/methods/multi-pass-development/phase-3-make-safe.md
```

Only load the specific phase guide you need, not the entire method documentation.

## Cross-References

Documents use lightweight references:
- `[@method:multi-pass-development]` - Development methodology
- `[@pattern:progressive-disclosure]` - Code pattern
- `[@standard:error-handling]` - Coding standard

Only load these when directly relevant to your current work.

## For Human Readers

While optimized for AI, these documents are also valuable for humans who want:
- Quick reference guides
- Focused documentation
- Clear examples without excessive explanation

For comprehensive human documentation, see `/docs/`.