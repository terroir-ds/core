# Using Changesets

The Terroir Core Design System uses [Changesets](https://github.com/changesets/changesets) to manage versioning and changelog generation.

## What are Changesets?

Changesets are markdown files that describe changes made in a pull request. They help us:

- Generate meaningful changelogs automatically
- Version packages correctly according to semver
- Create release notes for each version
- Track which changes are included in each release

## When to Add a Changeset

You should add a changeset when you:

- Add a new feature
- Fix a bug
- Make breaking changes
- Update documentation significantly
- Improve performance
- Change public APIs

You typically **don't** need a changeset for:

- Internal refactoring (no user-facing changes)
- Test additions/updates
- Development tooling updates
- Typo fixes in comments

## How to Add a Changeset

1. **Run the changeset command**:

   ```bash
   pnpm changeset:add
   # or simply
   pnpm changeset
   ```

2. **Select the type of change**:
   - **patch**: Bug fixes and small changes (0.0.X)
   - **minor**: New features, non-breaking changes (0.X.0)
   - **major**: Breaking changes (X.0.0)

3. **Write a summary**:
   - Use clear, user-focused language
   - Start with a verb (Add, Fix, Update, Remove)
   - Explain the "what" and "why"

## Changeset Examples

### Good Examples

```markdown
---
'@terroir/core': minor
---

Add color contrast validation utilities

- Implement WCAG AA/AAA contrast checking
- Add automatic color adjustment for accessibility
- Include detailed validation reports

This helps developers ensure their color combinations meet accessibility standards.
```

```text
---
'@terroir/core': patch
---

Fix memory leak in logger child instances

Child loggers were not being properly cleaned up when their parent was destroyed, causing memory leaks in long-running applications.
```

### Poor Examples

```text
---
'@terroir/core': patch
---

Updated stuff
```

```text
---
'@terroir/core': minor
---

Refactored code
```

## Changeset Workflow

1. Make your changes in a feature branch
2. Add a changeset describing your changes
3. Commit the changeset file along with your code
4. Create a pull request
5. The CI will verify a changeset exists
6. When merged to main, a "Release PR" is automatically created
7. Merging the Release PR publishes new versions

## Checking Changeset Status

To see what changes are pending release:

```bash
pnpm changeset:status
```

## Manual Changeset Files

You can also create changeset files manually in `.changeset/`:

```text
---
'@terroir/core': patch
'@terroir/react': patch
---

Fix theme switching in React components

The theme context wasn't properly updating when the theme changed, causing components to retain the old theme values.
```

The filename should be descriptive, like `fix-theme-switching.md`.

## Multiple Package Changes

In a monorepo, you can update multiple packages:

```text
---
'@terroir/core': minor
'@terroir/react': minor
'@terroir/web-components': minor
---

Add dark mode support across all packages
```

## Pre-releases

For alpha/beta releases, changesets supports pre-release modes:

```bash
pnpm changeset pre enter beta
pnpm changeset
pnpm changeset version
pnpm changeset publish
pnpm changeset pre exit
```

## Tips

1. **Be specific**: Describe what changed from the user's perspective
2. **Group related changes**: One changeset can describe multiple related changes
3. **Use conventional language**: Start with verbs like Add, Fix, Update, Remove
4. **Include breaking changes**: Clearly mark and explain any breaking changes
5. **Reference issues**: Mention issue numbers when fixing bugs

## Common Commands

```bash
# Add a new changeset
pnpm changeset:add

# Check status of pending changes
pnpm changeset:status

# Version packages (usually done by CI)
pnpm changeset:version

# Publish packages (usually done by CI)
pnpm changeset:publish
```

```
