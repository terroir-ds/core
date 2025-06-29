# Development Standards

This directory contains the standard operating procedures for the Terroir Core Design System. These standards ensure consistency, quality, and maintainability across the codebase.

## Core Standards

### 1. [Error Handling](./error-handling.md)

Always use the project's error handling utilities for consistent error management.

### 2. [Logging](./logging.md)

Use structured logging with the Pino-based logger - never use console.log.

### 3. [Code Quality](./code-quality.md)

Run automated fixes before commits and follow linting standards.

### 4. [Testing](./testing.md)

Co-locate tests with source code and maintain comprehensive coverage.

### 5. [Documentation](./documentation.md)

Keep documentation close to code and follow consistent patterns.

### 6. [Import Conventions](./import-conventions.md)

Use path aliases for clean, maintainable imports.

### 7. [CLAUDE.md Maintenance](./claude-md-maintenance.md)

Keep AI instruction files focused and efficient.

### 8. [Node.js Compatibility](./nodejs-compatibility.md)

Ensure broad Node.js version support.

### 9. [Git Workflow](./git-workflow.md)

Consistent Git practices and conventions.

### 10. [Security](./security.md)

Security best practices and vulnerability prevention.

### 11. [Performance](./performance.md)

Build and runtime performance optimization.

### 12. [Accessibility](./accessibility.md)

WCAG compliance and inclusive design.

### 13. [API Design](./api-design.md)

Consistent, intuitive API design principles.

### 14. [Dependencies](./dependencies.md)

Dependency evaluation and management.

### 15. [String Handling](./string-handling.md)

Consistent string manipulation using utility functions.

### 16. [Utility Development](./utility-development.md)

Standards for creating and maintaining utility modules.

## Planned Standards (TODO)

These standards will be created as they become relevant:

- [ ] **Documentation Architecture** - Organization of manual/generated docs, versioning, deployment
  - Documentation site structure (Docusaurus, VitePress, etc.)
  - Manual vs generated documentation organization
  - API reference generation (TypeDoc, etc.)
  - Documentation versioning strategy
  - Public vs internal documentation
  - Documentation deployment pipeline
  - Search functionality
  - Keeping docs in sync with code
  - Multi-format output (web, PDF, etc.)
- [ ] **Monitoring & Observability** - Metrics, logging, tracing standards
- [ ] **Deployment** - CI/CD, environments, rollback procedures
- [ ] **Database/Storage** - Schema design, migrations, data patterns
- [ ] **Component Patterns** - Reusable UI component guidelines
- [ ] **State Management** - Global state patterns (Redux/Zustand/Context)
- [ ] **Internationalization** - i18n/l10n guidelines and tooling
- [ ] **Browser Support** - Compatibility matrix and polyfill strategy
- [ ] **Release Process** - Versioning, changelogs, release automation
- [ ] **Code Review** - PR review checklist and standards
- [ ] **Architecture Decisions** - ADR format and documentation
- [ ] **API Versioning** - Breaking changes and deprecation policy
- [ ] **Caching Strategy** - Client and server caching patterns
- [ ] **Feature Flags** - Feature toggle implementation
- [ ] **Monitoring & Analytics** - User tracking and privacy
- [ ] **Disaster Recovery** - Backup and recovery procedures

## Quick Reference

### Before Every Commit

````bash
# ALWAYS run before committing
pnpm fix
git diff  # Review changes
pnpm test
```bash
### Error Handling

```typescript
// ❌ Don't throw generic errors
throw new Error('Something went wrong');

// ✅ Use typed errors with context
import { ValidationError } from '@utils/errors';
throw new ValidationError('Invalid email format', {
  code: 'INVALID_EMAIL',
  context: { email: value }
});
```bash
### Logging

```typescript
// ❌ Never use console
console.log('Processing...');

// ✅ Use structured logger
import { logger } from '@utils/logger';
logger.info({ count: 5 }, 'Processing items');
````

## Adding New Standards

When adding new standards:

1. Create a new markdown file in this directory
2. Add it to the table of contents above
3. Update CLAUDE.md with a reference to this directory
4. Include examples of both correct and incorrect usage

## Enforcement

These standards are enforced through:

- ESLint rules
- TypeScript types
- Pre-commit hooks (validation only)
- Code review guidelines
- Automated fixes (`pnpm fix`)
