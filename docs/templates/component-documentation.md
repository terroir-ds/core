# Component Documentation Template

This template provides a consistent structure for documenting components in the Terroir Core design system. Copy this template when creating new component documentation.

---

## [Component Name]

[One-sentence description of what this component is and its primary purpose]

## Overview

[2-3 paragraph overview explaining:]

- What problem this component solves
- When to use this component
- Key features and benefits

## Examples

### Basic Usage

[Show the simplest possible usage example]

```typescript
import { ComponentName } from '@terroir/react';

function Example() {
  return (
    <ComponentName>
      Basic example content
    </ComponentName>
  );
}
```

### Common Patterns

[Show 2-3 common usage patterns with explanations]

#### Pattern 1: [Name]

[Brief explanation of when/why to use this pattern]

```text
// Code example
```

#### Pattern 2: [Name]

[Brief explanation of when/why to use this pattern]

```text
// Code example
```

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `propName` | `string` | `'default'` | Description of what this prop does |
| `required` | `number` | - | Required prop description (no default) |
| `optional?` | `boolean` | `false` | Optional prop description |
| `variant` | `'primary' \| 'secondary'` | `'primary'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Component size |
| `className?` | `string` | - | Additional CSS classes |
| `children` | `React.ReactNode` | - | Component content |
| `onClick?` | `() => void` | - | Click handler |

### Variants

#### Primary (default)

[Description and use case for primary variant]

```text
<ComponentName variant="primary">Primary content</ComponentName>
```

#### Secondary

[Description and use case for secondary variant]

```text
<ComponentName variant="secondary">Secondary content</ComponentName>
```

### Sizes

[If applicable, show size variations with visual examples or descriptions]

- **Small (`sm`)**: Use for compact interfaces or secondary actions
- **Medium (`md`)**: Default size for most use cases
- **Large (`lg`)**: Use for emphasis or primary actions

## Styling

### CSS Custom Properties

The component exposes these CSS custom properties for customization:

```yaml
.component-name {
  --component-background: var(--color-primary-60);
  --component-text: var(--color-primary-10);
  --component-border: var(--color-primary-40);
  --component-spacing: var(--space-md);
}
```

### Theming

[Explain how the component responds to theme changes]

```text
// Light theme
<ThemeProvider theme="light">
  <ComponentName />
</ThemeProvider>

// Dark theme
<ThemeProvider theme="dark">
  <ComponentName />
</ThemeProvider>
```

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move focus to/from component |
| `Enter` | Activate primary action |
| `Space` | Activate primary action (buttons) |
| `Escape` | Close/cancel (if applicable) |
| `Arrow Keys` | Navigate between items (if applicable) |

### Screen Reader Support

- Component uses semantic HTML (`<button>`, `<nav>`, etc.)
- All interactive elements have accessible labels
- State changes are announced via `aria-live` regions
- Focus management follows WCAG guidelines

### ARIA Attributes

```text
<ComponentName
  aria-label="Descriptive label"
  aria-describedby="helper-text-id"
  aria-expanded={isExpanded}
  role="button"
/>
```

### Best Practices

- ✅ Always provide meaningful labels for screen readers
- ✅ Ensure color contrast meets WCAG AA standards
- ✅ Test with keyboard navigation
- ✅ Verify with screen reader software

## Guidelines

### Do's

- ✅ **Do** use this component for [specific use case]
- ✅ **Do** provide clear, actionable labels
- ✅ **Do** maintain consistent spacing with other components
- ✅ **Do** follow the established interaction patterns

### Don'ts

- ❌ **Don't** use this component for [inappropriate use case]
- ❌ **Don't** override built-in accessibility features
- ❌ **Don't** nest interactive elements inside each other
- ❌ **Don't** remove focus indicators

### Content Guidelines

- Keep labels concise and action-oriented
- Use sentence case for all text content
- Avoid technical jargon in user-facing text
- Be consistent with terminology across your application

## Patterns & Recipes

### With Form Validation

```typescript
function FormExample() {
  const [error, setError] = useState<string>();

  return (
    <ComponentName
      aria-invalid={!!error}
      aria-describedby={error ? 'error-message' : undefined}
    >
      <input type="text" />
      {error && (
        <span id="error-message" role="alert">
          {error}
        </span>
      )}
    </ComponentName>
  );
}
```

### Loading States

```typescript
function LoadingExample() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <ComponentName
      disabled={isLoading}
      aria-busy={isLoading}
    >
      {isLoading ? 'Loading...' : 'Submit'}
    </ComponentName>
  );
}
```

### Responsive Behavior

```yaml
// Responsive size based on viewport
<ComponentName
  size={{
    base: 'sm',    // Mobile
    md: 'md',      // Tablet
    lg: 'lg'       // Desktop
  }}
>
  Responsive content
</ComponentName>
```

## Migration Guide

### From v1.x to v2.x

[If applicable, provide migration instructions]

```text
// v1.x (old)
<ComponentName type="primary" />

// v2.x (new)
<ComponentName variant="primary" />
```

### Breaking Changes

- Renamed `type` prop to `variant` for consistency
- Removed deprecated `color` prop (use `variant` instead)
- Changed default size from `'small'` to `'md'`

## Troubleshooting

### Common Issues

#### Component not rendering

**Problem**: Component appears blank or doesn't render
**Solution**: Ensure you've imported the component correctly and wrapped your app with `ThemeProvider`

#### Styling not applied

**Problem**: Component appears unstyled
**Solution**: Check that CSS is imported: `import '@terroir/react/styles.css'`

#### TypeScript errors

**Problem**: Type errors when using the component
**Solution**: Update `@terroir/react` to the latest version

### FAQs

**Q: Can I use this component with [Framework]?**
A: Yes, see our [framework integration guide](../guides/framework-integration/README.md)

**Q: How do I customize the colors?**
A: Use CSS custom properties or the `variant` prop. See [Theming](#theming) section.

**Q: Is this component accessible?**
A: Yes, all Terroir Core components meet WCAG 2.1 AA standards. See [Accessibility](#accessibility).

## Related Components

- [RelatedComponent1](./related-component-1.md) - Use for [specific use case]
- [RelatedComponent2](./related-component-2.md) - Alternative for [different use case]
- [RelatedComponent3](./related-component-3.md) - Often used together

## Resources

- [Design Specs](https://figma.com/terroir-core/component-name) - Figma design files
- [GitHub Source](https://github.com/terroir-ds/core/tree/main/packages/react/src/ComponentName) - Component source code
- [Storybook](https://storybook.terroir-core.dev/?path=/story/component-name) - Interactive examples
- [CodeSandbox](https://codesandbox.io/s/terroir-component-name) - Live playground

---

_Last updated: [Date]_
