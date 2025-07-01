# AI-First Documentation

This directory contains documentation optimized for AI agents working on the Terroir Core Design System.

## Structure

```
/ai/
├── index.ai.md       # This file (main entry point)
├── methods/          # Development methodologies (multi-pass, system-documentation)
├── patterns/         # Reusable code patterns with scoring
├── standards/        # Coding standards and conventions
└── guides/           # Core documentation and guides
    ├── architecture.ai.md     # System architecture overview
    ├── contributing.ai.md     # How to contribute patterns/standards
    ├── domain-concepts.ai.md  # Domain-specific terminology
    └── legacy-patterns.ai.md  # Pre-pattern-system examples
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

## What's New

### Pattern & Standard Scoring System
- All patterns and standards now use quality scoring (1-5)
- Only examples scored 4+ are included in documentation
- See [@pattern:pattern-quality-scoring] and [@pattern:standard-quality-scoring]

### JSDoc Reference Tags
- Mark pattern/standard usage in code with JSDoc tags
- Enables automated reference tracking
- See [@standard:jsdoc-pattern-tags]

### Reference Files (.ref.md)
- Each pattern/standard has a companion .ref.md file
- Tracks WHERE (code locations) and WHEN (task usage)
- Automatically updated by reference scanner

## Quick Start

1. **For Development Tasks**: Start with [@method:multi-pass-development]
2. **For Documentation**: Use [@method:system-documentation]
3. **For Pattern Usage**: Check patterns/index.ai.md
4. **For Standards**: Check standards/index.ai.md

## For Human Readers

While optimized for AI, these documents are also valuable for humans who want:
- Quick reference guides
- Focused documentation
- Clear examples without excessive explanation

For comprehensive human documentation, see `/docs/`.