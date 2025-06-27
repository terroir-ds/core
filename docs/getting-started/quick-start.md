# Quick Start

Build your first component with Terroir Core in just 5 minutes! This guide will walk you through creating a themed button component.

## What You'll Build

By the end of this guide, you'll have:

- ✅ A fully-themed button component
- ✅ Automatic accessibility features
- ✅ Color system integration
- ✅ Responsive design tokens

## Step 1: Import Terroir Core

First, import the tokens and utilities you'll need:

````typescript
import { tokens } from '@terroir/core';
import { generateColorSystem } from '@terroir/core/colors';
```text
## Step 2: Generate Your Color System

Create a color system based on your brand color:

```typescript
// Generate colors from your brand color
const colors = await generateColorSystem({
  source: '#0066cc', // Your brand blue
  contrastLevel: 0.5  // AA accessibility compliance
});

console.log('Generated colors:', colors);
// Output: { primary: {...}, secondary: {...}, neutral: {...} }
```text
## Step 3: Create Your Component

### HTML + CSS Version

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .button {
      /* Use generated color tokens */
      background-color: var(--color-primary-60);
      color: var(--color-primary-10);

      /* Use spacing tokens */
      padding: var(--space-md) var(--space-lg);

      /* Use typography tokens */
      font-family: var(--font-family-base);
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-semibold);

      /* Built-in accessibility */
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      min-height: 44px; /* Touch target size */

      /* Smooth interactions */
      transition: all 200ms ease;
    }

    .button:hover {
      background-color: var(--color-primary-70);
      transform: translateY(-1px);
    }

    .button:focus {
      outline: 2px solid var(--color-primary-60);
      outline-offset: 2px;
    }

    .button:active {
      transform: translateY(0);
      background-color: var(--color-primary-50);
    }
  </style>
</head>
<body>
  <button class="button">
    Click me!
  </button>
</body>
</html>
```text
### React Version

```tsx
import React from 'react';
import { useTheme } from '@terroir/react';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick
}: ButtonProps) {
  const theme = useTheme();

  const styles = {
    // Color system integration
    backgroundColor: theme.colors.primary.tone(60),
    color: theme.colors.primary.tone(10),

    // Spacing system
    padding: `${theme.space.md} ${theme.space.lg}`,

    // Typography system
    fontFamily: theme.fonts.base,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,

    // Accessibility built-in
    border: 'none',
    borderRadius: theme.radii.md,
    cursor: 'pointer',
    minHeight: '44px',

    // Smooth interactions
    transition: 'all 200ms ease',
  };

  return (
    <button
      style={styles}
      onClick={onClick}
      // Accessibility attributes automatically included
    >
      {children}
    </button>
  );
}
```text
### Vue Version

```vue
<template>
  <button
    class="terroir-button"
    :class="[`terroir-button--${variant}`, `terroir-button--${size}`]"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from '@terroir/vue';

interface Props {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md'
});

const theme = useTheme();

const buttonStyles = computed(() => ({
  '--button-bg': theme.colors.primary.tone(60),
  '--button-text': theme.colors.primary.tone(10),
  '--button-padding': `${theme.space.md} ${theme.space.lg}`,
}));
</script>

<style scoped>
.terroir-button {
  background-color: var(--button-bg);
  color: var(--button-text);
  padding: var(--button-padding);

  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  min-height: 44px;

  font-family: var(--font-family-base);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);

  transition: all 200ms ease;
}

.terroir-button:hover {
  transform: translateY(-1px);
  filter: brightness(1.1);
}

.terroir-button:focus {
  outline: 2px solid var(--color-primary-60);
  outline-offset: 2px;
}
</style>
```yaml
## Step 4: Test Your Component

### Accessibility Testing

Your component automatically includes:
- ✅ **WCAG-compliant colors** (tested contrast ratios)
- ✅ **Touch-friendly size** (44px minimum)
- ✅ **Keyboard navigation** (focus indicators)
- ✅ **Screen reader support** (semantic HTML)

Test with:
```bash
# Run accessibility tests
pnpm test:a11y

# Test keyboard navigation
# Tab to button, press Enter/Space to activate
```text
### Visual Testing

```bash
# See your component in Storybook
pnpm storybook:dev

# Run visual regression tests
pnpm test:visual
```text
## Step 5: Customize and Extend

### Add Variants

```typescript
// Create secondary button variant
const secondaryButton = {
  backgroundColor: colors.secondary.tone(20),
  color: colors.secondary.tone(90),
  border: `1px solid ${colors.secondary.tone(40)}`
};

// Create size variants
const sizes = {
  sm: { padding: `${tokens.space.sm} ${tokens.space.md}` },
  md: { padding: `${tokens.space.md} ${tokens.space.lg}` },
  lg: { padding: `${tokens.space.lg} ${tokens.space.xl}` }
};
```text
### Add States

```typescript
// Interactive states with automatic contrast
const buttonStates = {
  default: colors.primary.tone(60),
  hover: colors.primary.tone(70),
  active: colors.primary.tone(50),
  disabled: colors.neutral.tone(90)
};
````

## What You've Learned

🎉 **Congratulations!** You've just built your first Terroir Core component. You now know how to:

- Generate accessible color systems from brand colors
- Use design tokens for consistent spacing and typography
- Create components with built-in accessibility features
- Test your components for quality assurance

## Next Steps

Ready to dive deeper?

1. **[Examples](./examples.md)** - See more complete implementations
2. **[Color System](../foundations/color-system.md)** - Understand the science behind our colors
3. **[Component Patterns](../guides/component-design/README.md)** - Learn advanced component design
4. **[Testing Guide](../guides/testing/README.md)** - Ensure your components are bulletproof

## Need Help?

- **Can't generate colors?** Check the [color system guide](../foundations/color-system.md)
- **Accessibility issues?** See our [accessibility guide](../foundations/accessibility.md)
- **Framework problems?** Check [framework integration guides](../guides/framework-integration/README.md)
- **Still stuck?** Ask in [GitHub Discussions](https://github.com/terroir-ds/core/discussions)
