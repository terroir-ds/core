---
id: index-file-convention
title: Index File Convention Standard
tags: [documentation, file-organization, standards, conventions]
domains: [all]
complexity: beginner
when-to-apply: [creating-directories, organizing-docs, ai-documentation]
related: [documentation-standards, ai-documentation]
---

# Index File Convention Standard

## Quick Context

Use `index.md` or `index.ai.md` as the main entry point for directories instead of `README.md`, providing better organization and progressive disclosure for both humans and AI.

## The Standard

### File Naming Convention

```text
directory/
├── index.md         # Main entry point for humans
├── index.ai.md      # Main entry point for AI (if different from human docs)
├── topic-1.md       # Specific topic documentation
├── topic-2.md       # Another topic
└── examples/        # Subdirectory
    └── index.md     # Entry point for examples
```

### When to Use Each

**Use `index.md`:**

- Main entry point for any documentation directory
- When content serves both humans and AI equally
- For web-based documentation systems
- In component directories (replaces README.md)

**Use `index.ai.md`:**

- When AI needs different content structure than humans
- For progressive disclosure optimization
- When human docs are verbose but AI needs concise info
- In `/ai/` directory structures

**Keep `README.md`:**

- Repository root (GitHub expects it)
- Package directories (`packages/*/README.md` - npm expects it)
- When required by external tools (e.g., changesets)
- Legacy systems that expect README

### Implementation Examples

#### Before (Scattered READMEs)

```text
packages/
├── core/
│   └── README.md
├── react/
│   └── README.md
└── tokens/
    └── README.md
```

#### After (Organized Indexes)

```text
packages/
├── core/
│   ├── index.md      # Main documentation
│   └── index.ai.md   # AI-optimized version
├── react/
│   ├── index.md
│   └── components/
│       └── index.md  # Component overview
└── tokens/
    └── index.md
```

### Benefits

1. **Better Organization**: Clear entry points for each directory
2. **Progressive Disclosure**: Load only the index, then specific topics
3. **Web-Friendly**: `index.md` works like `index.html`
4. **AI Optimization**: Separate AI docs without cluttering human docs
5. **Consistency**: Same pattern across all directories

### Migration Strategy

```bash
# Find all README.md files (except root)
find . -name "README.md" -not -path "./README.md" | while read file; do
  dir=$(dirname "$file")
  # Rename to index.md
  mv "$file" "$dir/index.md"
  echo "Renamed $file to $dir/index.md"
done

# Find all README.ai.md files
find . -name "README.ai.md" | while read file; do
  dir=$(dirname "$file")
  # Rename to index.ai.md
  mv "$file" "$dir/index.ai.md"
  echo "Renamed $file to $dir/index.ai.md"
done
```

## Common Pitfalls

### 1. Forgetting Root README

**Problem**: Removing repository root README.md
**Solution**: Always keep root README.md for GitHub

### 2. Duplicating Content

**Problem**: Same content in index.md and index.ai.md
**Solution**: Only create index.ai.md when content differs

### 3. Deep Nesting

**Problem**: index.md files too deep in hierarchy
**Solution**: Only add indexes where navigation needed

## Related Standards

- Documentation Standards
- AI Documentation Standards

## Related Patterns  

- [@pattern:progressive-disclosure]
