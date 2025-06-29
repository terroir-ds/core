# Color System

> **📚 This is the conceptual overview.** For practical implementation details, see the [Color System Implementation Guide](../guides/color-system.md).

Terroir Core's color system is built on Google's Material Color Utilities, providing scientifically-derived color palettes that ensure accessibility and visual harmony.

## Why This Approach?

Traditional design systems often struggle with color because they rely on visual intuition rather than scientific understanding of human color perception. Our approach leverages decades of research in color science to create:

- **Perceptually uniform color scales** that feel consistent to human eyes
- **Automatic accessibility compliance** through mathematical contrast calculations
- **Dynamic theming capabilities** that generate complete palettes from a single brand color
- **Cross-platform consistency** across web, iOS, and Android

## The HCT Color Space

At the core of our system is the HCT (Hue, Chroma, Tone) color space, which corresponds more closely to human color perception than traditional RGB or HSL.

### What Each Dimension Represents

- **Hue**: The color family (red, blue, green, etc.) - measured in degrees (0-360)
- **Chroma**: The colorfulness or saturation - higher values are more vivid
- **Tone**: The lightness - 0 is black, 100 is white

### Why HCT Matters

Unlike HSL, where changing lightness can dramatically alter perceived hue, HCT maintains perceptual consistency:

```text
// In HSL, these feel like different colors
hsl(240, 100%, 20%) // Very dark blue
hsl(240, 100%, 80%) // Light blue that looks purple

// In HCT, these maintain consistent hue perception
hct(240, 80, 20) // Dark blue
hct(240, 80, 80) // Light blue (same blue family)
```

## Palette Generation

Our color system generates five coordinated palettes from a single source color:

### Primary Palette

Generated directly from your brand color, this palette provides the main accent colors for your interface.

### Secondary Palette

Complementary colors that work harmoniously with your primary palette, ideal for secondary actions and accents.

### Tertiary Palette

Additional accent colors for more complex interfaces, derived mathematically to ensure harmony.

### Neutral Palette

Grayscale colors that coordinate with your brand colors, used for text, backgrounds, and surfaces.

### Error Palette

Red-family colors for error states, warnings, and destructive actions, optimized for accessibility.

## Continuous Tone Scale

Unlike traditional design systems with fixed color stops (50, 100, 200, etc.), Terroir Core provides access to any tone value from 0-100:

```typescript
import { generateColorSystem } from '@terroir/core';

const colors = await generateColorSystem({
  source: '#0066cc',
  contrastLevel: 0.5
});

// Access any tone value
const darkBlue = colors.primary.tone(20);
const mediumBlue = colors.primary.tone(60);
const lightBlue = colors.primary.tone(90);
```

This continuous access enables:

- **Precise contrast control** for accessibility requirements
- **Smooth color transitions** in animations and gradients
- **Fine-tuning** for specific use cases

## Accessibility Integration

Every generated color is automatically tested for WCAG compliance:

### Automatic Contrast Validation

The system calculates optimal text colors for every background, ensuring AA or AAA compliance based on your contrast level setting.

### Focus and State Colors

Interactive states (hover, focus, active) are generated with guaranteed contrast ratios, eliminating guesswork.

### High Contrast Support

Contrast level can be adjusted from 0 (standard) to 1.0 (maximum contrast) to support users with visual impairments.

## Theme Variants

The system generates multiple theme variants automatically:

### Light Theme

Optimized for bright environments with dark text on light backgrounds.

### Dark Theme

Coordinated dark mode colors that maintain the same semantic relationships as the light theme.

### High Contrast Themes

Enhanced contrast versions of both light and dark themes for improved accessibility.

## Token Architecture

Colors flow through our three-tier token system:

### Primitive Tokens

Raw HCT values and tone specifications:

```json
{
  "color.primary.hue": 240,
  "color.primary.chroma": 80,
  "color.primary.20": "#1a237e"
}
```

### Semantic Tokens

Purpose-driven color assignments:

```json
{
  "color.accent": "{color.primary.60}",
  "color.on-accent": "{color.primary.10}"
}
```

### Component Tokens

Component-specific color usage:

```json
{
  "button.primary.background": "{color.accent}",
  "button.primary.text": "{color.on-accent}"
}
```

## Implementation Examples

### CSS Custom Properties

```yaml
:root {
  --color-primary-60: #3f51b5;
  --color-on-primary-60: #ffffff;
}

.button-primary {
  background-color: var(--color-primary-60);
  color: var(--color-on-primary-60);
}
```

### React Components

```typescript
import { useTheme } from '@terroir/core/react';

function Button() {
  const theme = useTheme();
  return (
    <button
      style={{
        backgroundColor: theme.colors.primary.tone(60),
        color: theme.colors.primary.tone(10)
      }}
    >
      Click me
    </button>
  );
}
```

## Related Concepts

- **[Design Principles](./design-principles.md)** - The principles behind our color approach
- **[Accessibility](./accessibility.md)** - How we ensure color accessibility
- **[API Reference](../reference/api/functions/generateColorSystem.md)** - Technical color generation API
