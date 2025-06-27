# Testing Guide

This guide covers testing strategies, tools, and best practices for ensuring quality in Terroir Core components and applications.

## Testing Philosophy

Our testing approach is built on these principles:

1. **Accessibility First** - Every component tested for WCAG compliance
2. **User-Centric** - Test behavior, not implementation details
3. **Automated Quality** - Prevent regressions through comprehensive automation
4. **Fast Feedback** - Quick test cycles to support rapid development

## Testing Stack

### Core Testing Tools

- **[Vitest](https://vitest.dev/)** - Fast unit testing with TypeScript support
- **[Playwright](https://playwright.dev/)** - End-to-end and visual regression testing
- **[axe-core](https://github.com/dequelabs/axe-core)** - Automated accessibility testing
- **[Testing Library](https://testing-library.com/)** - User-focused testing utilities

### Quality Assurance

- **ESLint** - Code quality and consistency
- **TypeScript** - Type safety and documentation
- **Markdownlint** - Documentation quality
- **Prettier** - Code formatting

## Test Categories

### 1. Unit Tests

Test individual functions and utilities in isolation.

**Location**: Co-located with source code in `__tests__` directories
**Tools**: Vitest, Testing Library
**Coverage**: Aim for 80%+ coverage on critical paths

````typescript
// lib/utils/__tests__/colors.test.ts
import { describe, it, expect } from 'vitest';
import { generateColorSystem } from '../colors';

describe('generateColorSystem', () => {
  it('should generate accessible color palettes', async () => {
    const colors = await generateColorSystem({
      source: '#0066cc',
      contrastLevel: 0.5
    });

    expect(colors.primary).toBeDefined();
    expect(colors.primary.tone(60)).toMatch(/^#[0-9a-f]{6}$/);

    // Test contrast compliance
    const bg = colors.primary.tone(60);
    const text = colors.primary.tone(10);
    const contrast = calculateContrast(bg, text);
    expect(contrast).toBeGreaterThan(4.5); // WCAG AA
  });
});
```bash
### 2. Component Tests
Test React components with user interactions and accessibility.

```typescript
// packages/react/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '../Button';

expect.extend(toHaveNoViolations);

describe('Button', () => {
  it('should render with accessible markup', async () => {
    const { container } = render(
      <Button onClick={() => {}}>Click me</Button>
    );

    // Accessibility testing
    const results = await axe(container);
    expect(results).toHaveNoViolations();

    // User interaction testing
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
  });

  it('should handle keyboard navigation', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button');

    // Test keyboard activation
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(button, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });
});
```bash
### 3. Visual Regression Tests
Ensure UI consistency across changes using Playwright.

```typescript
// tests/visual/button.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Button Visual Tests', () => {
  test('should match visual snapshot', async ({ page }) => {
    await page.goto('/storybook/?path=/story/button--default');

    const button = page.locator('[data-testid="button"]');
    await expect(button).toHaveScreenshot('button-default.png');
  });

  test('should show focus indicator', async ({ page }) => {
    await page.goto('/storybook/?path=/story/button--default');

    const button = page.locator('[data-testid="button"]');
    await button.focus();

    await expect(button).toHaveScreenshot('button-focused.png');
  });
});
```bash
### 4. Accessibility Tests
Comprehensive accessibility validation using multiple tools.

```typescript
// tests/accessibility/components.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Component Accessibility', () => {
  test('Button should be accessible', async ({ page }) => {
    await page.goto('/storybook/?path=/story/button--all-variants');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/storybook/?path=/story/button--interactive');

    // Test tab order
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText('Primary Button');

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText('Secondary Button');
  });
});
```bash
### 5. Contrast Validation
Automated WCAG contrast compliance testing.

```typescript
// scripts/test-contrast.js
import { generateColorSystem } from '../lib/colors/index.js';
import { calculateContrast } from '../lib/utils/contrast.js';
import { logger } from '../lib/utils/logger.js';

async function validateContrast() {
  const colors = await generateColorSystem({
    source: '#0066cc',
    contrastLevel: 0.5
  });

  const testCases = [
    { bg: colors.primary.tone(60), text: colors.primary.tone(10) },
    { bg: colors.secondary.tone(90), text: colors.secondary.tone(20) },
    { bg: colors.neutral.tone(95), text: colors.neutral.tone(10) }
  ];

  let failureCount = 0;

  for (const { bg, text } of testCases) {
    const contrast = calculateContrast(bg, text);
    const isCompliant = contrast >= 4.5; // WCAG AA

    if (!isCompliant) {
      logger.error({ bg, text, contrast }, 'Contrast failure');
      failureCount++;
    } else {
      logger.info({ bg, text, contrast }, 'Contrast passed');
    }
  }

  if (failureCount > 0) {
    process.exit(1);
  }

  logger.info('All contrast tests passed! 🎉');
}

validateContrast().catch(console.error);
```bash
## Running Tests

### Local Development
```bash
# Run all tests
pnpm test

# Run specific test types
pnpm test:unit          # Unit tests only
pnpm test:visual        # Visual regression tests
pnpm test:a11y          # Accessibility tests
pnpm test:contrast      # Color contrast validation

# Development mode
pnpm test:watch         # Watch mode for unit tests
pnpm test:dev           # Interactive test runner
```bash
### Continuous Integration
```bash
# Full CI test suite
pnpm test:ci

# With coverage reporting
pnpm test:coverage:ci

# Performance testing
pnpm test:performance
```bash
## Test Organization

### Directory Structure
```text
lib/
├── utils/
│   ├── __tests__/       # Unit tests
│   │   ├── colors.test.ts
│   │   └── logger.test.ts
│   ├── colors.ts
│   └── logger.ts
├── components/
│   ├── __tests__/       # Component tests
│   │   └── Button.test.tsx
│   └── Button.tsx
tests/
├── visual/              # Visual regression tests
├── accessibility/       # A11y tests
└── performance/         # Performance tests
```bash
### Test Naming Conventions
- **Unit tests**: `*.test.ts` or `*.test.tsx`
- **Integration tests**: `*.integration.test.ts`
- **Visual tests**: `*.visual.spec.ts`
- **Accessibility tests**: `*.a11y.spec.ts`

## Best Practices

### Writing Good Tests

#### 1. Test User Behavior, Not Implementation
```typescript
// ✅ Good - tests user behavior
test('should submit form when Enter is pressed', () => {
  render(<ContactForm />);

  const emailInput = screen.getByLabelText('Email');
  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.keyDown(emailInput, { key: 'Enter' });

  expect(screen.getByText('Form submitted!')).toBeInTheDocument();
});

// ❌ Bad - tests implementation details
test('should call handleSubmit when Enter is pressed', () => {
  const handleSubmit = vi.fn();
  render(<ContactForm onSubmit={handleSubmit} />);

  const emailInput = screen.getByLabelText('Email');
  fireEvent.keyDown(emailInput, { key: 'Enter' });

  expect(handleSubmit).toHaveBeenCalled();
});
```bash
#### 2. Use Descriptive Test Names
```typescript
// ✅ Good - clear what's being tested
test('should show error message when email is invalid', () => {});
test('should disable submit button while form is submitting', () => {});

// ❌ Bad - unclear test purpose
test('should work correctly', () => {});
test('test email validation', () => {});
```bash
#### 3. Test Accessibility by Default
```typescript
test('Button component', async () => {
  const { container } = render(<Button>Click me</Button>);

  // Always include accessibility testing
  const results = await axe(container);
  expect(results).toHaveNoViolations();

  // Test keyboard navigation
  const button = screen.getByRole('button');
  expect(button).toHaveAttribute('type', 'button');

  // Test focus management
  button.focus();
  expect(button).toHaveFocus();
});
```bash
### Performance Testing

#### Bundle Size Testing
```typescript
// tests/performance/bundle-size.test.ts
import { describe, it, expect } from 'vitest';
import { analyzeBundleSize } from '../utils/bundle-analyzer';

describe('Bundle Size', () => {
  it('should not exceed size limits', async () => {
    const analysis = await analyzeBundleSize();

    expect(analysis.core).toBeLessThan(50 * 1024); // 50KB limit
    expect(analysis.react).toBeLessThan(20 * 1024); // 20KB limit
  });
});
```bash
#### Runtime Performance
```typescript
// tests/performance/color-generation.test.ts
import { performance } from 'perf_hooks';
import { generateColorSystem } from '../../lib/colors';

test('color generation should be fast', async () => {
  const start = performance.now();

  await generateColorSystem({
    source: '#0066cc',
    contrastLevel: 0.5
  });

  const duration = performance.now() - start;
  expect(duration).toBeLessThan(100); // Should complete in <100ms
});
```bash
## Debugging Tests

### Common Issues

#### 1. Accessibility Violations
```bash
# Run accessibility tests with detailed output
pnpm test:a11y --reporter=verbose

# Debug specific violations
npx axe-core --browser=chrome --url=http://localhost:3000
```bash
#### 2. Visual Regression Failures
```bash
# Update visual snapshots
pnpm test:visual --update-snapshots

# Debug visual differences
npx playwright show-trace test-results/trace.zip
```bash
#### 3. Flaky Tests
- Use `waitFor` for async operations
- Mock time-dependent functions
- Ensure proper cleanup between tests

```typescript
// ✅ Good - wait for async operations
test('should load data', async () => {
  render(<DataComponent />);

  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
````

## Related Resources

- **[Testing Strategy](./testing-strategy.md)** - Overall testing approach and goals
- **[Standards](../../resources/standards/testing.md)** - Testing standards and requirements
- **[CI/CD](../../resources/architecture/ci-cd.md)** - Continuous integration setup
- **[Performance](../../resources/performance/README.md)** - Performance optimization guide
