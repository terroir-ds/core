# @terroir/docs

**Purpose**: Documentation site for Terroir Core Design System
**Dependencies**: astro, @astrojs/starlight, @terroir/core
**Patterns**: Static site generation, Markdown-based, AI-friendly

## Quick Reference

| Task              | Command              | Description                         |
| ----------------- | -------------------- | ----------------------------------- |
| Start dev server  | `pnpm dev`           | Local development at localhost:4321 |
| Build site        | `pnpm build`         | Generate static site                |
| Generate llms.txt | `pnpm llms:generate` | Create AI documentation index       |
| Preview build     | `pnpm preview`       | Preview production build            |

## Common Tasks

### Adding Documentation

```bash
# Create new guide
touch src/content/docs/guides/new-guide.md

# Create new reference doc
touch src/content/docs/reference/new-api.md
```

### Documentation Structure

```markdown
---
title: Page Title
description: Brief description
---

# Page Title

Content goes here...
```

### Customizing Theme

Edit `astro.config.mjs`:

```bash
export default defineConfig({
  integrations: [
    starlight({
      title: 'Your Title',
      social: [
        { icon: 'github', label: 'GitHub', href: 'your-repo' }
      ],
      customCss: ['./src/styles/custom.css']
    })
  ]
});
```

### Generating AI Documentation

The site automatically generates `llms.txt` on build:

```bash
# Manual generation
pnpm llms:generate

# Automatic on build
pnpm build  # Includes llms:generate
```

## File Structure

```text
src/
├── content/
│   └── docs/
│       ├── guides/
│       └── reference/
├── styles/
│   └── custom.css
└── assets/
```

## Deployment

Site deploys to GitHub Pages via workflow:

- Push to main branch
- Workflow builds and deploys
- Available at: <https://terroir-ds.github.io/core>

## AI Metadata

```text
stability: stable
token_cost: 300
last_updated: 2025-06-29
```
