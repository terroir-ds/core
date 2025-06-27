# Contributing to Terroir Core

First off, thank you for considering contributing to Terroir Core! It's people like you that make Terroir Core such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@terroir-ds.dev.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and expected**
- **Include screenshots if relevant**
- **Include your environment details** (OS, Node.js version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Provide specific examples to demonstrate the enhancement**
- **Describe the current behavior and expected behavior**
- **Explain why this enhancement would be useful**

### Your First Code Contribution

Unsure where to begin contributing? You can start by looking through these issues:

- Issues labeled `good first issue` - issues which should only require a few lines of code
- Issues labeled `help wanted` - issues which need extra attention
- Issues labeled `documentation` - issues related to improving documentation

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Development Process

### Setting Up Your Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/terroir-core.git
   cd terroir-core
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Development Workflow

1. **Make your changes**
   - Write meaningful commit messages following Conventional Commits
   - Keep commits atomic and focused
   - Add tests for new functionality
   - Update documentation as needed

2. **Run quality checks**
   ```bash
   # Run all checks before committing
   pnpm fix        # Auto-fix formatting issues
   pnpm test       # Run tests
   pnpm typecheck  # Check TypeScript types
   pnpm build      # Ensure build works
   ```

3. **Create a changeset**
   ```bash
   pnpm changeset
   ```
   Follow the prompts to describe your changes.

### Coding Standards

- **TypeScript**: Use TypeScript for all new code
- **Formatting**: Code is formatted with Prettier (run `pnpm fix`)
- **Linting**: Follow ESLint rules (run `pnpm lint`)
- **Testing**: Write tests for new functionality
- **Documentation**: Update docs for API changes

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer(s)]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `build`: Changes to build system or dependencies
- `ci`: Changes to CI configuration
- `chore`: Other changes that don't modify src or test files

Examples:
```
feat(colors): add Material You color generation
fix(logger): prevent memory leak in async context
docs(readme): update installation instructions
```

### Git Operations for Special Directories

**Multi-Agent Coordination Files**: The `.claude` directory is listed in `.gitignore` to support agent development workflows. When modifying files in `.claude/multi-agent/`, you must use the force flag:

```bash
# Adding or modifying multi-agent coordination files
git add -f .claude/multi-agent/your-file.md

# Or for multiple files
git add -f .claude/multi-agent/*.md
```

This ensures that multi-agent coordination files remain in version control while allowing agents to use symbolic links without conflicts.

### Testing

- Write unit tests for all new functionality
- Place tests in `__tests__` directories next to the code
- Use descriptive test names that explain what is being tested
- Test both success and error cases
- Run tests with `pnpm test`

### Documentation

- Update JSDoc comments for public APIs
- Update README files when adding new features
- Add examples for complex functionality
- Keep documentation close to code

## Project Structure

```
terroir-core/
├── packages/           # Monorepo packages
│   ├── core/          # Core utilities and tokens
│   ├── docs-site/     # Documentation website
│   └── ...            # Future packages
├── docs/              # Project documentation
├── scripts/           # Build and utility scripts
└── .github/           # GitHub configuration
```

## Style Guide

### TypeScript

```typescript
// Use explicit types for public APIs
export function calculateContrast(color1: string, color2: string): number {
  // Implementation
}

// Use interfaces for object types
interface ColorOptions {
  source: string;
  variant?: ColorVariant;
}

// Prefer const assertions for literals
const COLORS = ['primary', 'secondary', 'tertiary'] as const;
```

### File Organization

- One component/module per file
- Group related functionality
- Use index files for clean exports
- Co-locate tests with source code

### Naming Conventions

- **Files**: kebab-case (e.g., `color-generator.ts`)
- **Classes**: PascalCase (e.g., `ColorGenerator`)
- **Functions/Variables**: camelCase (e.g., `generateColors`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_ITERATIONS`)
- **Types/Interfaces**: PascalCase (e.g., `ColorScheme`)

## Questions?

Feel free to:
- Open a GitHub Discussion for general questions
- Join our community chat (coming soon)
- Check existing issues and discussions

## Recognition

Contributors will be recognized in:
- The project README
- Release notes
- The contributors page on our documentation site

Thank you for contributing to Terroir Core! 🎨