# Git Workflow & Commit Guidelines

## Overview

This project uses a balanced git workflow that enables rapid development while maintaining code quality:

- **Fast commits**: Minimal blocking, auto-fix what we can
- **Protected main**: Comprehensive validation before pushing
- **Flexible features**: Light checks on feature branches
- **Conventional commits**: Structured messages for automation

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear history and automation:

```text
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, missing semicolons, etc)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Changes to build system or dependencies
- `ci`: CI/CD configuration changes
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

### Examples

```bash
# Feature with scope
git commit -m "feat(tokens): add material color utilities integration"

# Bug fix
git commit -m "fix: correct contrast ratio calculation for WCAG AA"

# Docs update
git commit -m "docs: update README with new token architecture"

# Breaking change (use footer)
git commit -m "feat(api): change token naming convention

BREAKING CHANGE: Renamed all color tokens from camelCase to kebab-case"
```

## Git Hooks Behavior

### Pre-commit (Permissive)

- Runs `lint-staged` to auto-fix formatting issues
- **Never blocks commits** - warnings only
- Fixes what it can, warns about the rest

### Commit-msg (Informative)

- Validates conventional commit format
- **Never blocks commits** - shows format guidance
- Helps maintain consistent history

### Pre-push (Branch-aware)

When pushing to `main`:

- ✅ Runs full lint suite
- ✅ Runs all tests
- ✅ Builds the project
- ❌ **Blocks push if any fail**

When pushing to other branches:

- 📋 Runs quick lint check
- ⚠️ Shows warnings only
- ✅ **Never blocks push**

## Recommended Workflow

### Daily Development

```bash
# Make small, frequent commits
git add .
git commit -m "feat: work in progress on color system"

# Push to feature branch anytime
git push origin feature/color-system
```

### Before Merging to Main

```bash
# Run full validation locally
pnpm lint
pnpm test
pnpm build

# Fix any issues, then push
git push origin main
```

### Quick Fixes

```bash
# Bypass hooks if needed (use sparingly)
git commit --no-verify -m "fix: emergency hotfix"
```

## Branch Strategy

### Protected Branches

- `main`: Production-ready code, full validation required
- `release/*`: Release candidates, full validation required

### Development Branches

- `feature/*`: New features, permissive validation
- `fix/*`: Bug fixes, permissive validation
- `docs/*`: Documentation, permissive validation
- `experiment/*`: Experiments, minimal validation

## Additional Tools

### Running Checks Manually

```bash
# Lint all files
pnpm lint

# Run specific linters
pnpm eslint .
pnpm prettier --check .
pnpm stylelint "**/*.css"

# Run all tests
pnpm test

# Run specific test suites
pnpm test:unit
pnpm test:visual
pnpm test:a11y
```

### Commit History

```bash
# View conventional commits
git log --oneline --pretty=format:"%C(auto)%h %s"

# Filter by type
git log --grep="^feat"
git log --grep="^fix"
```

## CI/CD Integration

The CI pipeline enforces the same standards as pre-push hooks:

1. **On Pull Request**: Runs linting and tests
2. **On Merge to Main**: Full validation + deployment
3. **On Release Tags**: Full validation + npm publish

## Troubleshooting

### Hooks Not Running

```bash
# Reinstall hooks
pnpm exec husky install
```

### Bypass Hooks (Emergency Only)

```bash
# Skip all hooks
git commit --no-verify
git push --no-verify
```

### Fix Commit Message

```bash
# Amend last commit message
git commit --amend
```

## Best Practices

1. **Commit Often**: Small, focused commits are easier to review
2. **Use Conventional Format**: Enables automation and clarity
3. **Run Tests Before Push**: Catch issues early
4. **Fix Warnings**: Address linter warnings before they accumulate
5. **Document Breaking Changes**: Use BREAKING CHANGE footer

## Questions?

See [CONTRIBUTING.md](../CONTRIBUTING.md) for more details on our development process.
