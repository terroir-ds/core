# Linting Guide

This project uses automated linting to maintain code quality and consistency. We've set up tools to automatically fix many common issues.

## Quick Start

To automatically fix all linting issues that can be fixed:

```bash
pnpm fix
# or
pnpm fix:all
```

This will:

- Fix TypeScript/JavaScript issues with ESLint
- Fix Markdown formatting issues
- Format JSON, YAML files with Prettier
- Sort package.json fields

## Available Commands

### Check for Issues (without fixing)

```bash
# Run all linters
pnpm lint

# Individual linters
pnpm lint:ts       # TypeScript/JavaScript
pnpm lint:md       # Markdown
pnpm lint:prettier # JSON/YAML formatting
```

### Fix Issues Automatically

```bash
# Fix all issues
pnpm fix:all

# Fix specific types
pnpm lint:ts:fix        # Fix TypeScript/JavaScript
pnpm lint:md:fix        # Fix Markdown
pnpm lint:md:fix-blocks # Fix code block language specifiers
pnpm lint:prettier:fix  # Fix JSON/YAML formatting
```

## What Gets Fixed Automatically

### TypeScript/JavaScript (ESLint)

- Unused imports removal
- Consistent quotes and semicolons
- Object shorthand notation
- Arrow function conversions
- Template literal conversions
- Const vs let usage
- And many more...

### Markdown (markdownlint)

- Heading levels and spacing
- List formatting
- Trailing spaces
- Line breaks
- Code block formatting
- Link formatting
- Code block language specifiers (via custom fixer)

### JSON/YAML (Prettier)

- Consistent indentation
- Trailing commas
- Quote style
- Line width

## What Requires Manual Fixing

Some issues cannot be fixed automatically and require manual intervention:

### TypeScript/JavaScript

- Logic errors
- Type errors
- Unused variables (needs confirmation on what to do)
- Complex refactoring
- `console.log` statements (should use logger)

### Markdown

- Content issues
- Broken links
- Missing alt text on images
- Some complex formatting issues

## Pre-commit Hooks

Our pre-commit hooks automatically run the fixers on staged files. This ensures:

- You don't commit linting errors
- Code style is consistent
- Common issues are fixed before commit

## IDE Integration

### VS Code

Install these extensions for real-time linting:

- ESLint
- markdownlint
- Prettier

Add to your VS Code settings:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.fixAll.markdownlint": true
  },
  "[markdown]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Configuration Files

- **ESLint**: `eslint.config.js` - TypeScript/JavaScript rules
- **Markdownlint**: `.markdownlint-cli2.jsonc` - Markdown rules
- **Prettier**: `.prettierrc` (if exists) or default config
- **Prettier Ignore**: `.prettierignore` - Files to skip

## Troubleshooting

### Fix command fails

If `pnpm fix` fails, try running individual fixers to identify the issue:

```bash
pnpm lint:ts:fix
pnpm lint:md:fix
pnpm lint:prettier:fix
```

### ESLint parsing errors

Check that your code is syntactically valid. ESLint can't fix syntax errors.

### Markdown issues persist

Some markdown rules conflict with each other. Check `.markdownlint-cli2.jsonc` for disabled rules.

### Performance issues

For large codebases, run fixers on specific directories:

```bash
# Fix only lib directory
eslint lib --fix
markdownlint-cli2 'lib/**/*.md' --fix
```

## Best Practices

1. **Run fixes before committing**: Let the tools handle formatting
2. **Don't fight the linter**: If a rule is problematic, discuss changing it
3. **Fix incrementally**: On large changes, fix one type of issue at a time
4. **Use IDE integration**: Real-time feedback prevents issues
5. **Keep tools updated**: Regular updates bring better fixes

## Adding New Rules

To add or modify linting rules:

1. **ESLint**: Edit `eslint.config.js`
2. **Markdownlint**: Edit `.markdownlint-cli2.jsonc`
3. **Test the changes**: Run `pnpm lint` to see effects
4. **Document significant changes**: Update this guide if needed
