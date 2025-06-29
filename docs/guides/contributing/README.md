# Contributing to Terroir Core

Welcome to the Terroir Core contributing guide! This section covers everything you need to know about contributing to the project, from setting up your development environment to submitting your first pull request.

## Quick Start for Contributors

1. **[Workflow](./git-workflow.md)** - Our Git workflow and branch strategy
2. **[Changesets](./changesets.md)** - How we manage releases
3. **[Branch Protection](./github-branch-protection.md)** - GitHub branch protection rules

## Development Process

### Setting Up Your Environment

````bash
# Clone the repository
git clone https://github.com/terroir-ds/core.git
cd terroir-core

# Install dependencies (uses pnpm)
pnpm install

# Run initial setup
pnpm setup

# Start development mode
pnpm dev
```bash
### Making Changes

1. **Create a feature branch** from `main`
2. **Make your changes** following our code standards
3. **Run quality checks** with `pnpm fix`
4. **Write tests** for new functionality
5. **Update documentation** as needed
6. **Submit a pull request** with a clear description

### Quality Requirements

All contributions must:
- ✅ Pass all automated tests (`pnpm test`)
- ✅ Meet accessibility standards (WCAG AA minimum)
- ✅ Include appropriate documentation
- ✅ Follow our coding conventions
- ✅ Have no linting errors (`pnpm lint`)

## Types of Contributions

### 🐛 Bug Reports
Help us improve by reporting issues you encounter. Include:
- Steps to reproduce the problem
- Expected vs actual behavior
- Environment details (browser, Node.js version, etc.)
- Minimal example if possible

### 💡 Feature Requests
Suggest new features or improvements:
- Describe the problem you're trying to solve
- Explain how your suggestion would help
- Consider alternative solutions
- Think about implementation challenges

### 📝 Documentation
Documentation improvements are always welcome:
- Fix typos or unclear explanations
- Add examples or use cases
- Improve organization or navigation
- Translate content (future)

### 🔧 Code Contributions
Direct code contributions:
- Bug fixes
- New components or utilities
- Performance improvements
- Test coverage improvements

## Review Process

### Pull Request Requirements
- **Clear title** describing the change
- **Detailed description** explaining why and how
- **Related issues** linked when applicable
- **Breaking changes** clearly marked
- **Documentation updates** included

### Review Criteria
We review contributions for:
- **Functionality**: Does it work as intended?
- **Quality**: Is the code well-written and maintainable?
- **Performance**: Does it impact bundle size or runtime performance?
- **Accessibility**: Does it maintain or improve accessibility?
- **Documentation**: Is it properly documented?

### Timeline
- **Initial review**: Within 48 hours
- **Feedback cycles**: 24-48 hours between rounds
- **Merge**: After approval and CI passes

## Community Guidelines

### Code of Conduct
We follow a simple principle: **Be kind and professional**. This means:
- Respectful communication in all interactions
- Constructive feedback that helps others improve
- Welcoming newcomers and helping them get started
- Focusing on what's best for the project and community

### Getting Help
- **GitHub Discussions** for questions and ideas
- **GitHub Issues** for bug reports and feature requests
- **Discord** for real-time chat (link in README)

## Recognition

Contributors are recognized through:
- **Commit attribution** using Co-authored-by
- **Contributors section** in README
- **Changelog entries** for significant contributions
- **Maintainer status** for consistent contributors

## Development Resources

### Essential Reading
- [Design Principles](../../foundations/design-principles.md) - Understand our philosophy
- [Architecture Overview](../../resources/architecture/) - Technical architecture
- [Testing Guide](../testing/README.md) - Testing approaches and standards

### Tools and Scripts
- `pnpm dev` - Start development server with file watching
- `pnpm test` - Run all tests (lint, unit, visual, accessibility)
- `pnpm fix` - Auto-fix formatting and linting issues
- `pnpm build` - Build all packages and documentation

### Useful Commands
```bash
# Quality checks (run before committing)
pnpm fix && pnpm test

# Test specific areas
pnpm test:unit         # Unit tests only
pnpm test:a11y         # Accessibility tests
pnpm test:visual       # Visual regression tests

# Development helpers
pnpm tokens:watch      # Watch token changes
pnpm storybook:dev     # Component documentation
pnpm docs:dev          # Documentation site
````

## Questions?

Don't hesitate to ask! We're here to help:

- Open a GitHub Discussion for general questions
- Check existing issues for similar problems
- Tag maintainers if you need direct help

Thank you for contributing to Terroir Core! 🎉
