# Git Workflow Standards

## Overview

Consistent Git practices for collaboration and clean history.

## Branch Strategy

### Branch Naming

```bash
# Features
feat/user-authentication
feat/color-system

# Fixes
fix/button-hover-state
fix/type-errors

# Documentation
docs/api-reference
docs/testing-guide

# Refactoring
refactor/error-handling
refactor/logger-optimization

# Tests
test/color-utils
test/integration-suite
```

### Main Branches

- `main` - Production-ready code
- `develop` - Integration branch (optional)
- Feature branches - Short-lived, specific purpose

## Commit Standards

### Conventional Commits

```bash
# Format
type(scope): description

# Examples
feat(colors): add Material You color generation
fix(logger): handle undefined context properly
docs(errors): add retry pattern examples
test(utils): increase coverage to 90%
refactor(api): simplify response handling
build(deps): upgrade to TypeScript 5.3
chore(lint): fix ESLint warnings
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, not CSS)
- `refactor`: Code change without feature/fix
- `test`: Adding/updating tests
- `build`: Build system changes
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

### Commit Message Guidelines

1. **Subject line**: 50 chars max, imperative mood
2. **Body**: Wrap at 72 chars, explain why not what
3. **Footer**: Reference issues, breaking changes

```yaml
feat(auth): add OAuth2 integration

Implement OAuth2 flow for third-party authentication.
This allows users to sign in with Google/GitHub.

- Add OAuth provider configuration
- Implement callback handling
- Add token refresh logic

Closes #123
```

## Pull Request Standards

### PR Title

Follow commit conventions:

```text
feat(component): add dark mode support
```

### PR Description Template

```bash
## Summary
Brief description of changes

## Changes
- [ ] Change 1
- [ ] Change 2

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing done

## Screenshots
(if applicable)

## Breaking Changes
(if any)
```

## Git Commands

### Daily Workflow

```bash
# Start feature
git checkout main
git pull origin main
git checkout -b feat/new-feature

# Work and commit
pnpm fix  # Always before commit
git add -p  # Review changes
git commit -m "feat(scope): description"

# Update branch
git fetch origin
git rebase origin/main

# Push and create PR
git push -u origin feat/new-feature
```

### Useful Commands

```bash
# Interactive rebase (clean history)
git rebase -i HEAD~3

# Amend last commit
git commit --amend

# Cherry-pick specific commit
git cherry-pick <commit-hash>

# Stash changes
git stash save "WIP: feature description"
git stash pop

# View pretty log
git log --oneline --graph --all
```

## Best Practices

1. **Commit Often**: Small, logical commits
2. **Pull Before Push**: Stay updated with main
3. **No Force Push**: On shared branches
4. **Clean History**: Squash WIP commits
5. **Review Changes**: Use `git diff` before committing

## Protected Branches

`main` branch protections:

- Require PR reviews
- Pass CI/CD checks
- No direct pushes
- No force pushes
- Require up-to-date branch

## Handling Conflicts

```bash
# During rebase
git rebase origin/main
# Fix conflicts in editor
git add .
git rebase --continue

# Or abort if needed
git rebase --abort
```

## Git Hooks

Pre-commit hooks run automatically:

- Lint checks
- Type checks
- Test runs

Skip if necessary:

```bash
git commit --no-verify -m "emergency fix"
```
