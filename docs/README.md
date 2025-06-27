# Terroir Core Documentation

Welcome to the Terroir Core Design System documentation. This documentation is organized to help you understand both the concepts behind Terroir Core and how to implement it effectively.

## Documentation Structure

Our documentation follows a clear information architecture:

### 🚀 [Getting Started](./getting-started/README.md)
Your entry point to Terroir Core - installation, quick start, and basic concepts.

### 🎯 [Foundations](./foundations/README.md)
Core principles, design systems, and the "why" behind our approach:
- [Design Principles](./foundations/design-principles.md) - Our fundamental beliefs and values
- [Color System](./foundations/color-system.md) - Scientific color generation with Material Color Utilities
- [Accessibility](./foundations/accessibility.md) - How we ensure inclusive design

### 📖 [Guides](./guides/README.md)
Practical tutorials and workflows for common tasks:
- [Contributing](./guides/contributing/README.md) - Development workflow and standards
- [Development](./guides/development/README.md) - Building with Terroir Core
- [Testing](./guides/testing/README.md) - Quality assurance and validation

### 📚 [Reference](./reference/README.md)
Technical specifications and API documentation:
- [API Reference](./reference/api/README.md) - Complete TypeScript API documentation
- [Tokens](./reference/tokens/README.md) - Design token specifications
- [Components](./reference/components/README.md) - Component APIs and props

### 🛠️ [Resources](./resources/README.md)
Additional materials, standards, and community resources:
- [Standards](./resources/standards/README.md) - Development standards and best practices
- [Architecture](./resources/architecture/README.md) - System architecture documentation

## Documentation Philosophy

We organize documentation around **user intent** rather than internal structure:

- **Conceptual docs** (why/what) help you understand the system
- **Reference docs** (how/where) help you implement specific features
- **Cross-references** connect related concepts across sections

## For AI Assistants (Claude)

When working on this project, always:

1. **Follow Standards** - Check `/docs/resources/standards/` for current practices
2. **Run Fixes** - Execute `pnpm fix` before commits
3. **Use Project Utilities** - Logger and error handlers, not console/Error
4. **Co-locate Tests** - Keep tests in `__tests__` next to source
5. **Update Docs** - Keep documentation in sync with code changes

## Contributing

See [Contributing Guide](./guides/contributing/README.md) for development workflow and contribution guidelines.

## Quick Navigation

### New to Terroir Core?
Start with [Getting Started](./getting-started/README.md) for installation and basic concepts.

### Looking for specific APIs?
Check the [Reference](./reference/README.md) section for technical specifications.

### Need implementation guidance?
Browse [Guides](./guides/README.md) for step-by-step tutorials.

### Want to understand our approach?
Explore [Foundations](./foundations/README.md) for design principles and concepts.
