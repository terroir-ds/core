# Terroir Core Documentation

Welcome to the Terroir Core Design System documentation.

## Quick Links

### 📚 Guides

- [Getting Started](./getting-started.md)
- [Linting Guide](./linting.md)
- [Automated Fixes](./automated-fixes.md)

### 🎯 Development Standards

- **[All Standards](./standards/)** - Comprehensive development standards
  - [Error Handling](./standards/error-handling.md) - Use typed errors
  - [Logging](./standards/logging.md) - Structured logging practices
  - [Code Quality](./standards/code-quality.md) - Linting and formatting
  - [Testing](./standards/testing.md) - Test organization and coverage
  - [Documentation](./standards/documentation.md) - Documentation patterns

### 🔧 Component Documentation

- [Error System](../lib/utils/errors/docs/error-handling.md)
- [Logger](../lib/utils/README.md)

### 🏗️ Architecture

- Token Architecture (coming soon)
- Color System (coming soon)
- Component Architecture (coming soon)

## For AI Assistants (Claude)

When working on this project, always:

1. **Follow Standards** - Check `/docs/standards/` for current practices
2. **Run Fixes** - Execute `pnpm fix` before commits
3. **Use Project Utilities** - Logger and error handlers, not console/Error
4. **Co-locate Tests** - Keep tests in `__tests__` next to source
5. **Update Docs** - Keep documentation in sync with code changes

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

## Project Structure

```text
docs/
├── README.md              # This file
├── standards/             # Development standards
│   ├── error-handling.md
│   ├── logging.md
│   ├── code-quality.md
│   ├── testing.md
│   └── documentation.md
├── guides/                # How-to guides
├── api/                   # API references
└── architecture/          # Design documents
```
