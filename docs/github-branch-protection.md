# GitHub Branch Protection Rules

This document outlines the recommended branch protection rules for the Terroir Core Design System repository.

## Main Branch Protection

Navigate to **Settings → Branches** and add a rule for `main`:

### 1. Require Pull Request Reviews

- ✅ **Require a pull request before merging**
  - ✅ Require approvals: **1**
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from CODEOWNERS
  - ❌ Restrict who can dismiss pull request reviews

### 2. Status Checks

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging

Required status checks:

- `lint`
- `test`
- `build`
- `size-limit`
- `visual-regression`
- `coverage`

### 3. Conversation Resolution

- ✅ **Require conversation resolution before merging**

### 4. Signed Commits

- ✅ **Require signed commits** (optional but recommended)

### 5. Linear History

- ✅ **Require linear history** (enforces rebase/squash merge)

### 6. Push Restrictions

- ✅ **Include administrators** in restrictions
- ❌ Allow force pushes (never on main)
- ❌ Allow deletions

### 7. Other Settings

- ✅ **Lock branch** (prevents any pushes)
  - Only enable temporarily during releases

## Release Branch Protection

For `release/*` branches:

### Similar to Main, with exceptions:

- Require approvals: **2** (more strict)
- ✅ **Restrict who can push** to release team only
- Additional required checks:
  - `semantic-release-dry-run`
  - `e2e-tests`

## Development Branch Guidelines

For feature branches (`feature/*`, `fix/*`, `docs/*`):

- No protection rules
- Encourage frequent commits
- Allow force pushes for cleanup
- Delete after merge

## Setting Up CODEOWNERS

Create `.github/CODEOWNERS`:

```
# Global owners
* @your-username @team-lead

# Design tokens
/tokens/ @design-team @your-username

# Core packages
/packages/core/ @core-team
/packages/react/ @react-team
/packages/web-components/ @web-team

# Documentation
/docs/ @docs-team
*.md @docs-team

# Build and CI
/.github/ @devops-team
/scripts/ @devops-team
*.config.* @devops-team

# Dependencies
package.json @your-username @team-lead
pnpm-lock.yaml @your-username @team-lead
```

## Automation Rules

### Auto-merge for Dependabot

1. Enable Dependabot for security updates
2. Set up auto-merge for patch updates:
   - Only for dev dependencies
   - Must pass all checks
   - Must be patch or minor version

### Stale PR Management

Add `.github/stale.yml`:

```yaml
daysUntilStale: 30
daysUntilClose: 7
exemptLabels:
  - pinned
  - security
  - work-in-progress
staleLabel: stale
markComment: >
  This PR has been automatically marked as stale because it has not had
  recent activity. It will be closed if no further activity occurs.
closeComment: >
  This PR has been closed due to inactivity. Feel free to reopen if needed.
```

## GitHub Actions Permissions

In **Settings → Actions → General**:

1. **Actions permissions**: Allow all actions
2. **Fork pull request workflows**:
   - ✅ Require approval for first-time contributors
3. **Workflow permissions**:
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve PRs

## Merge Strategies

### For Main Branch

Configure in **Settings → General → Pull Requests**:

- ✅ Allow squash merging
  - Default message: "Pull request title and description"
- ❌ Allow merge commits (keep history clean)
- ✅ Allow rebase merging
- ✅ Automatically delete head branches

### Merge Guidelines

1. **Feature branches**: Squash and merge
2. **Release branches**: Rebase and merge
3. **Hotfix branches**: Squash and merge
4. **Dependency updates**: Squash and merge

## Security Policies

### Dependency Scanning

1. Enable Dependabot security updates
2. Enable secret scanning
3. Enable code scanning with CodeQL

### Security Policy

Create `SECURITY.md`:

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

Email: security@your-domain.com
Response time: 48 hours
```

## Branch Naming Conventions

Enforce with branch protection patterns:

- `main` - Production branch
- `develop` - Development branch (optional)
- `release/*` - Release candidates
- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Emergency fixes
- `docs/*` - Documentation updates
- `chore/*` - Maintenance tasks
- `experiment/*` - Experimental features

## Implementation Checklist

- [ ] Configure main branch protection
- [ ] Set up CODEOWNERS file
- [ ] Configure release branch protection
- [ ] Enable Dependabot
- [ ] Set up stale PR automation
- [ ] Configure merge strategies
- [ ] Enable security features
- [ ] Document team responsibilities
- [ ] Train team on workflow
- [ ] Set up branch cleanup automation
