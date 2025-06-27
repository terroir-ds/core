# Dependency Management Standards

## Overview

Guidelines for managing dependencies responsibly and securely.

## Adding Dependencies

### Evaluation Criteria

Before adding any dependency, consider:

1. **Necessity**: Is it truly needed?
2. **Size**: Check bundle impact
3. **Maintenance**: Is it actively maintained?
4. **Security**: Any known vulnerabilities?
5. **License**: Compatible with MIT?
6. **Alternatives**: Can we build it simply?

### Checklist

````bash
# Check package info
npm view [package]

# Check size
npm view [package] dist.size
npx bundlephobia [package]

# Check dependencies
npm view [package] dependencies

# Check maintenance
# - Last publish date
# - Open issues/PRs
# - Download trends
```text
## Dependency Types

### Production Dependencies

```bash
# Only truly required at runtime
pnpm add package-name
```text
Examples:
- Framework code (React, Vue)
- Runtime utilities
- Polyfills (if needed)

### Dev Dependencies

```bash
# Build/development only
pnpm add -D package-name
```text
Examples:
- Build tools (Vite, Webpack)
- Test frameworks
- Linters
- Type definitions

### Peer Dependencies

```json
{
  "peerDependencies": {
    "react": ">=16.8.0 <19.0.0"
  }
}
```text
Use for:
- Framework requirements
- Plugin systems
- Shared instances

## Version Management

### Pinning Strategy

```json
{
  "dependencies": {
    // Exact for critical/unstable packages
    "critical-package": "1.2.3",

    // Caret for stable packages
    "stable-package": "^2.1.0",

    // Tilde for careful updates
    "careful-package": "~3.0.1"
  }
}
```text
### Update Strategy

```bash
# Check outdated packages
pnpm outdated

# Update within ranges
pnpm update

# Update to latest (careful!)
pnpm update package-name --latest

# Interactive update
pnpm upgrade --interactive
```text
## Security

### Regular Audits

```bash
# Run weekly
pnpm audit

# Fix automatically (careful)
pnpm audit --fix

# Check specific package
pnpm why package-name
```text
### Security Policy

1. **Critical**: Fix immediately
2. **High**: Fix within 24 hours
3. **Medium**: Fix within 1 week
4. **Low**: Fix in next release

### Dealing with Vulnerabilities

```bash
# If direct dependency
pnpm update vulnerable-package

# If transitive dependency
pnpm overrides  # in package.json

# Or use resolutions
"resolutions": {
  "vulnerable-package": "^2.0.0"
}
```text
## Bundle Size

### Size Budgets

```javascript
// bundlesize.config.js
module.exports = {
  files: [
    {
      path: 'dist/index.js',
      maxSize: '50kb'
    },
    {
      path: 'dist/index.css',
      maxSize: '10kb'
    }
  ]
};
```text
### Alternatives to Heavy Packages

| Heavy Package | Lightweight Alternative |
|--------------|------------------------|
| moment | date-fns, dayjs |
| lodash | lodash-es, native methods |
| axios | native fetch |
| uuid | crypto.randomUUID() |

### Tree Shaking

```typescript
// ❌ Imports entire library
import _ from 'lodash';

// ✅ Imports only what's needed
import debounce from 'lodash-es/debounce';

// ✅ Or use native
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};
```text
## Monorepo Dependencies

### Workspace Protocol

```json
{
  "dependencies": {
    "@terroir/core": "workspace:*",
    "@terroir/react": "workspace:^1.0.0"
  }
}
```text
### Shared Dependencies

Root `package.json`:
```json
{
  "devDependencies": {
    // Shared dev tools
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "eslint": "^8.50.0"
  }
}
```text
## Lock File Management

### Never Ignore Lock Files

```bash
# Commit pnpm-lock.yaml
git add pnpm-lock.yaml
git commit -m "chore(deps): update lock file"
```text
### Resolving Conflicts

```bash
# Delete and regenerate
rm pnpm-lock.yaml
pnpm install

# Or use pnpm's resolution
pnpm install --force
```text
## Documentation

### Document Unusual Dependencies

```typescript
// In code
/**
 * Using 'obscure-package' because:
 * - Only solution for X problem
 * - Native API not available in Node 18
 * - Will remove when Y is implemented
 */
import { feature } from 'obscure-package';
```text
### In README

```markdown
## Dependencies

### Production
- **react**: UI framework
- **special-lib**: Used for X feature (see docs/why-special-lib.md)

### Development
- **build-tool**: Custom build for Y reason
```yaml
## Best Practices

1. **Audit before adding**: Research thoroughly
2. **Prefer popular**: Better maintenance/security
3. **Check licenses**: Must be compatible
4. **Monitor size**: Use bundlephobia
5. **Update regularly**: But test thoroughly
6. **Document decisions**: Why each dependency

## Red Flags

Avoid packages with:
- ❌ No recent updates (>2 years)
- ❌ No tests
- ❌ Huge dependency trees
- ❌ Poor documentation
- ❌ License incompatibility
- ❌ Security warnings
- ❌ Single maintainer (bus factor)

## Removal Process

```bash
# Check usage first
pnpm why package-name

# Remove if unused
pnpm remove package-name

# Clean up
pnpm prune
````
