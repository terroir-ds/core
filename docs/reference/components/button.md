# Button

A versatile button component that provides consistent interaction patterns and accessibility features across the design system.

## Overview

The Button component is the primary way for users to trigger actions in your application. It comes with built-in accessibility features, multiple visual variants, and automatic theme integration. Buttons are designed to be flexible while maintaining consistency across different contexts and use cases.

Terroir Core buttons automatically handle color contrast, focus management, and keyboard interactions, ensuring your interface is accessible to all users without additional configuration.

## Examples

### Basic Usage

The simplest way to use a button with default styling:

````tsx
import { Button } from '@terroir/react';

function Example() {
  return (
    <Button onClick={() => alert('Clicked!')}>
      Click me
    </Button>
  );
}
```text
### Common Patterns

#### Primary Actions
Use the primary variant for the main action on a page or form:

```tsx
<Button variant="primary" onClick={handleSubmit}>
  Submit Form
</Button>
```text
#### Secondary Actions
Use secondary variant for alternative or less important actions:

```tsx
<Button variant="secondary" onClick={handleCancel}>
  Cancel
</Button>
```text
#### Destructive Actions
Use the destructive variant for actions that delete or remove data:

```tsx
<Button variant="destructive" onClick={handleDelete}>
  Delete Item
</Button>
```text
## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'destructive' \| 'ghost'` | `'primary'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `disabled` | `boolean` | `false` | Disables the button |
| `loading` | `boolean` | `false` | Shows loading state |
| `fullWidth` | `boolean` | `false` | Makes button full width |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |
| `className?` | `string` | - | Additional CSS classes |
| `children` | `React.ReactNode` | - | Button content |
| `onClick?` | `(event: MouseEvent) => void` | - | Click handler |
| `href?` | `string` | - | Renders as link if provided |
| `target?` | `'_blank' \| '_self' \| '_parent' \| '_top'` | - | Link target (when href is used) |

### Variants

#### Primary (default)
High-emphasis button for primary actions like submitting forms or confirming choices.

```tsx
<Button variant="primary">Save Changes</Button>
```text
#### Secondary
Medium-emphasis button for secondary actions like canceling or going back.

```tsx
<Button variant="secondary">Cancel</Button>
```text
#### Destructive
High-emphasis button for dangerous actions that require user attention.

```tsx
<Button variant="destructive">Delete Account</Button>
```text
#### Ghost
Low-emphasis button for tertiary actions or subtle interactions.

```tsx
<Button variant="ghost">Learn More</Button>
```yaml
### Sizes

- **Small (`sm`)**: Use in compact interfaces, toolbars, or alongside text
- **Medium (`md`)**: Default size suitable for most interfaces
- **Large (`lg`)**: Use for primary calls-to-action or touch-optimized interfaces

```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```text
## Styling

### CSS Custom Properties

Customize button appearance using these CSS variables:

```css
.terroir-button {
  --button-height: var(--size-md);
  --button-padding-x: var(--space-lg);
  --button-font-size: var(--font-size-md);
  --button-font-weight: var(--font-weight-semibold);
  --button-border-radius: var(--radius-md);

  /* Variant-specific */
  --button-background: var(--color-primary-60);
  --button-text: var(--color-primary-10);
  --button-border: transparent;

  /* States */
  --button-hover-background: var(--color-primary-70);
  --button-active-background: var(--color-primary-50);
  --button-focus-ring: var(--color-primary-60);
}
```text
### Theming

Buttons automatically adapt to light and dark themes:

```tsx
// Automatically uses appropriate colors for the theme
<ThemeProvider theme="light">
  <Button>Light Theme</Button>
</ThemeProvider>

<ThemeProvider theme="dark">
  <Button>Dark Theme</Button>
</ThemeProvider>
```text
## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move focus to/from button |
| `Enter` | Activate button |
| `Space` | Activate button |

### Screen Reader Support

- Uses semantic `<button>` element (or `<a>` when `href` is provided)
- Loading state announced via `aria-busy`
- Disabled state properly communicated
- Focus visible for keyboard navigation

### ARIA Attributes

```tsx
<Button
  aria-label="Save document"
  aria-describedby="save-help-text"
  aria-pressed={isActive}
  disabled={isDisabled}
>
  Save
</Button>
```text
### Best Practices

- ✅ Always provide clear, actionable button text
- ✅ Use appropriate variants to communicate importance
- ✅ Ensure sufficient color contrast (handled automatically)
- ✅ Test keyboard navigation flow

## Guidelines

### Do's

- ✅ **Do** use descriptive, action-oriented labels ("Save Changes" not "OK")
- ✅ **Do** place primary actions prominently
- ✅ **Do** use consistent button sizes within a context
- ✅ **Do** disable buttons during form submission

### Don'ts

- ❌ **Don't** use buttons for navigation (use links instead)
- ❌ **Don't** rely only on color to convey meaning
- ❌ **Don't** make buttons too small on touch devices
- ❌ **Don't** use more than one primary button per section

### Content Guidelines

- Start with a verb ("Save", "Delete", "Continue")
- Keep labels concise (2-3 words ideal)
- Use sentence case, not CAPS
- Be specific about the action outcome

## Patterns & Recipes

### With Icons

```tsx
import { Button } from '@terroir/react';
import { SaveIcon } from '@terroir/icons';

function SaveButton() {
  return (
    <Button>
      <SaveIcon aria-hidden="true" />
      Save Document
    </Button>
  );
}
```text
### Loading States

```tsx
function SubmitButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    await submitForm();
    setIsLoading(false);
  };

  return (
    <Button
      onClick={handleSubmit}
      loading={isLoading}
      disabled={isLoading}
    >
      {isLoading ? 'Submitting...' : 'Submit Form'}
    </Button>
  );
}
```text
### Button Groups

```tsx
import { ButtonGroup, Button } from '@terroir/react';

function ActionBar() {
  return (
    <ButtonGroup>
      <Button variant="secondary">Cancel</Button>
      <Button variant="primary">Save</Button>
    </ButtonGroup>
  );
}
```text
### As Link

```tsx
// Renders as <a> element with button styling
<Button href="/dashboard" target="_self">
  Go to Dashboard
</Button>

// External link with icon
<Button
  href="https://example.com"
  target="_blank"
  rel="noopener noreferrer"
>
  Visit Site
  <ExternalIcon aria-label="Opens in new window" />
</Button>
```text
## Migration Guide

### From v1.x to v2.x

```tsx
// v1.x (old)
<Button type="primary" small />

// v2.x (new)
<Button variant="primary" size="sm" />
````

### Breaking Changes

- Renamed `type` prop to `variant` for clarity
- Replaced boolean size props (`small`, `large`) with `size` prop
- Removed `color` prop in favor of variants
- Changed default type from `'submit'` to `'button'`

## Troubleshooting

### Common Issues

#### Button not clickable

**Problem**: Button appears but doesn't respond to clicks
**Solution**: Check if button is disabled or if a parent element is intercepting clicks

#### Custom styles not applying

**Problem**: CSS overrides aren't working
**Solution**: Use CSS custom properties or increase specificity with `className`

#### TypeScript errors with onClick

**Problem**: Type errors when passing click handlers
**Solution**: Ensure handler signature matches `(event: MouseEvent<HTMLButtonElement>) => void`

### FAQs

**Q: How do I make a button look like a link?**
A: Use the `ghost` variant or the `Link` component for navigation

**Q: Can I use custom colors?**
A: Use CSS custom properties to override theme colors while maintaining accessibility

**Q: How do I track button clicks?**
A: Add analytics in your onClick handler or use a wrapper component

## Related Components

- [IconButton](./icon-button.md) - Button with only an icon
- [ButtonGroup](./button-group.md) - Group related buttons together
- [Link Component](./link.md) - For navigation instead of actions
- [ToggleButton](./toggle-button.md) - For on/off states

## Resources

- [Design Specs](https://figma.com/terroir-core/button) - Figma design files
- [GitHub Source](https://github.com/terroir-ds/core/tree/main/packages/react/src/Button) - Component source code
- [Storybook](https://storybook.terroir-core.dev/?path=/story/button) - Interactive examples
- [CodeSandbox](https://codesandbox.io/s/terroir-button-examples) - Live playground

---

### Last updated: December 2024
