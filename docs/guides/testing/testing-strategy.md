# Testing Strategy

## Overview

This project follows modern testing best practices with a focus on meaningful tests over arbitrary coverage metrics. We maintain simple, progressive coverage thresholds that improve as the codebase matures.

## Test Commands

### Development Testing

```bash
# Run tests in watch mode (no coverage)
pnpm test:dev

# Run specific test suites
pnpm test:unit:logger

# Run all unit tests
pnpm test:unit
```text
### Coverage Testing

```bash
# Run tests with coverage
pnpm test:coverage

# Run tests with coverage in watch mode
pnpm test:coverage:watch

# View HTML coverage report
open coverage/index.html
```yaml
## Coverage Philosophy

### Simple, Progressive Thresholds

We use a single set of coverage thresholds for the entire project:

- **Current Target**: 60% lines, 60% functions, 50% branches, 60% statements
- **CI/Production**: 70% lines, 70% functions, 60% branches, 70% statements
- **Future Goal**: 80%+ as the codebase matures

### Quality Over Quantity

We prioritize:

- Testing critical user paths and business logic
- Edge cases and error scenarios
- Integration between components
- Actual bugs found vs coverage percentage

## Modern Testing Principles

1. **Keep It Simple**: One configuration, clear thresholds, no complex rules
2. **Developer Experience**: Fast feedback in development, thorough checks in CI
3. **Meaningful Tests**: Focus on tests that catch real bugs, not coverage numbers
4. **Progressive Improvement**: Start conservative, increase thresholds gradually

## CI/CD Integration

In CI/CD pipelines, use:

```bash
# Strict coverage checking
pnpm test:coverage:all
```text
For local development, use:

```bash
# Fast feedback without coverage
pnpm test:dev
```

## Viewing Coverage Reports

After running coverage tests, view detailed reports:

- HTML Report: `coverage/index.html`
- Summary: Console output
- LCOV: For IDE integration
