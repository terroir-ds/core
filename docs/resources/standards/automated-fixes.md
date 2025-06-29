# Automated Code Fixes

This project includes comprehensive automated fixing for common code quality issues.

## Quick Fix Command

Run this single command to automatically fix most linting issues:

```bash
pnpm fix
```

This command will:

1. Fix TypeScript/JavaScript issues (ESLint)
2. Add language specifiers to code blocks
3. Fix Markdown formatting issues
4. Format JSON/YAML files (Prettier)
5. Sort package.json fields

## What Gets Fixed Automatically

### TypeScript/JavaScript (ESLint)

- Unused imports removal
- Quote consistency (`'` vs `"`)
- Semicolon consistency
- Object shorthand notation (`{ foo: foo }` → `{ foo }`)
- Arrow function conversion
- Template literal conversion
- `const` vs `let` usage
- Indentation and spacing

### Markdown

- Code block language specifiers (custom script)
- Heading formatting
- List formatting
- Trailing spaces
- Line breaks
- Link formatting

### JSON/YAML (Prettier)

- Consistent indentation (2 spaces)
- Trailing commas
- Quote style consistency
- Line width formatting

### Package.json

- Alphabetical sorting of fields
- Consistent formatting

## Individual Fix Commands

If you need to fix specific types of issues:

```bash
# TypeScript/JavaScript only
pnpm lint:ts:fix

# Markdown only
pnpm lint:md:fix

# Code blocks only
pnpm lint:md:fix-blocks

# JSON/YAML only
pnpm lint:prettier:fix
```

## Pre-commit Hooks

The project uses Husky and lint-staged to automatically fix issues before commit:

- Staged files are automatically fixed
- If fixes fail, the commit is blocked
- This ensures consistent code quality

## Configuration

### ESLint Configuration

- Location: `eslint.config.js`
- Uses @typescript-eslint for TypeScript support
- Custom rules for project conventions

### Markdownlint Configuration

- Location: `.markdownlint-cli2.jsonc`
- Disabled rules:
  - MD013: Line length (for flexibility)
  - MD033: Inline HTML (needed for some docs)
  - MD041: First line heading (not always needed)
  - MD024: Duplicate headings (API docs need this)
  - MD029: Ordered list prefix (custom numbering)
  - MD051: Link fragments (false positives)

### Prettier Configuration

- Location: `.prettierrc.json`
- Standard formatting rules
- Ignore patterns in `.prettierignore`

## Custom Scripts

### Code Block Language Fixer

- Location: `scripts/utils/fix-markdown-code-blocks.js`
- Automatically detects and adds language specifiers
- Uses content analysis and file context
- Handles: bash, typescript, json, yaml, text

### Fix-All Script

- Location: `scripts/utils/fix-all.sh`
- Orchestrates all fixing tools
- Provides clear progress feedback
- Reports what couldn't be fixed

## Troubleshooting

### Fix Command Fails

Try running individual fixers to identify the issue:

```bash
pnpm lint:ts:fix
pnpm lint:md:fix
pnpm lint:prettier:fix
```

### Some Issues Can't Be Fixed

These require manual intervention:

- Logic errors
- Type errors
- Missing content
- Complex refactoring
- Security issues

### Performance

For large codebases, fix specific directories:

```text
eslint lib --fix
markdownlint-cli2 'docs/**/*.md' --fix
```

## Best Practices

1. **Run `pnpm fix` before commits** - Let tools handle formatting
2. **Don't disable rules lightly** - Fix the code instead
3. **Keep tools updated** - Better fixes in newer versions
4. **Use IDE integration** - Real-time fixes prevent issues
5. **Document exceptions** - Explain any disabled rules
