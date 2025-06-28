# Color System Guide

This guide explains how the Terroir Core Design System generates and manages colors using Material Color Utilities (MCU) for perceptually uniform, accessible color palettes.

## Overview

Our color system provides:
- **Perceptually uniform colors** using HCT color space
- **Continuous tone scales** (0-100) for precise control
- **Automatic accessibility** with pre-calculated contrast ratios
- **Dynamic theming** with Material You principles
- **Multi-brand support** through configurable source colors

## Material Color Utilities (MCU)

### Why MCU?

Material Color Utilities provides scientifically-derived color systems that:
- Use HCT (Hue, Chroma, Tone) color space for perceptual uniformity
- Generate harmonious color relationships automatically
- Ensure accessibility through tone-based contrast
- Support dynamic color extraction from images

### HCT Color Space

HCT improves upon other color spaces:
- **Better than HSL**: Perceptually uniform lightness
- **Better than LAB**: More intuitive for designers
- **Better than LCH**: Smoother gradients and better gamut mapping

```typescript
// HCT components
{
  hue: 0-360,      // Color wheel position
  chroma: 0-150+,  // Color intensity (unbounded)
  tone: 0-100      // Perceptual lightness
}
```

## Color Generation

### Source Color Configuration

Define your brand through source colors:

```typescript
// lib/colors/config.ts
export const colorConfig = {
  sourceColor: '#0066cc',     // Primary brand color
  contrastLevel: 0,           // -1 to 1 (0 = standard, 0.5 = medium, 1 = high)
  variant: 'tonalSpot',       // Color scheme variant
  isDark: false              // Theme mode
};
```

### Color Scheme Variants

MCU offers several harmonious variants:

- **Tonal Spot** (default): Calm, neutral with color accents
- **Vibrant**: More colorful, expressive palette  
- **Expressive**: Maximum color with unexpected combinations
- **Neutral**: Grayscale focus with minimal color
- **Monochrome**: Single color with tonal variations
- **Fidelity**: Preserves source color accuracy

### Generated Color Roles

From a single source color, MCU generates:

```typescript
interface ColorScheme {
  // Primary color roles
  primary: TonalPalette;       // Main brand color
  onPrimary: Color;           // Text on primary
  primaryContainer: Color;     // Lighter primary variant
  onPrimaryContainer: Color;   // Text on primary container

  // Secondary color roles  
  secondary: TonalPalette;     // Complementary color
  onSecondary: Color;
  secondaryContainer: Color;
  onSecondaryContainer: Color;

  // Tertiary color roles
  tertiary: TonalPalette;      // Accent color
  onTertiary: Color;
  tertiaryContainer: Color;
  onTertiaryContainer: Color;

  // Neutral roles
  surface: Color;              // Background surfaces
  onSurface: Color;           // Text on surfaces
  surfaceVariant: Color;       // Alternative surface
  onSurfaceVariant: Color;
  outline: Color;              // Borders and dividers
  outlineVariant: Color;       // Subtle borders

  // Semantic roles
  error: TonalPalette;         // Error states
  onError: Color;
  errorContainer: Color;
  onErrorContainer: Color;

  // Additional
  shadow: Color;               // Shadow color
  inverseSurface: Color;       // Inverted UI elements
  inverseOnSurface: Color;
  inversePrimary: Color;
}
```

## Tone Scale System

### Understanding Tones

Each color has a full tonal palette (0-100):

```typescript
// Tone scale for any color
const tones = {
  0: '#000000',    // Black
  10: '#1a1a1a',   // Very dark
  20: '#333333',   // Dark
  30: '#4d4d4d',   // Medium dark
  40: '#666666',   // Medium
  50: '#808080',   // Neutral
  60: '#999999',   // Medium light
  70: '#b3b3b3',   // Light
  80: '#cccccc',   // Very light
  90: '#e6e6e6',   // Near white
  95: '#f2f2f2',   // Off white
  99: '#fcfcfc',   // Almost white
  100: '#ffffff'   // White
};
```

### Accessing Tones

```typescript
// Get specific tone
const primary40 = colorScheme.primary.tone(40);

// Get all standard tones
const primaryPalette = {
  0: colorScheme.primary.tone(0),
  10: colorScheme.primary.tone(10),
  20: colorScheme.primary.tone(20),
  // ... etc
};
```

### Tone Usage Guidelines

| Tone Range | Light Theme | Dark Theme | Use Case |
|------------|-------------|------------|-----------|
| 0-20 | Text, icons | - | High emphasis content |
| 30-40 | Secondary text | Surfaces | Medium emphasis |
| 50-60 | Disabled states | Text | Neutral elements |
| 70-80 | Borders | Secondary text | Subtle elements |
| 90-100 | Backgrounds | - | Surface colors |

## Accessibility

### Automatic Contrast Compliance

MCU ensures WCAG compliance through tone relationships:

```typescript
// Light theme
primary: tone(40)        // 7.5:1 contrast with white
onPrimary: tone(100)     // White text

// Dark theme  
primary: tone(80)        // 9.7:1 contrast with black
onPrimary: tone(20)      // Dark text
```

### Contrast Levels

Configure global contrast for accessibility needs:

```typescript
// Standard contrast (WCAG AA)
contrastLevel: 0

// Medium contrast (between AA and AAA)
contrastLevel: 0.5

// High contrast (WCAG AAA)
contrastLevel: 1

// Custom contrast
contrastLevel: 0.73
```

### Testing Contrast

```typescript
import { ContrastChecker } from '@terroir/core/lib/colors';

// Check specific combination
const result = ContrastChecker.check({
  foreground: '#000000',
  background: '#ffffff',
  fontSize: 16,
  fontWeight: 400
});

// Result
{
  ratio: 21,
  wcagAA: true,
  wcagAAA: true,
  wcagLargeAA: true,
  wcagLargeAAA: true
}
```

## Implementation

### Basic Color Generation

```typescript
import { generateColorSystem } from '@terroir/core/lib/colors';

// Generate from brand color
const colors = await generateColorSystem({
  source: '#0066cc',
  contrastLevel: 0.5,
  variant: 'tonalSpot'
});
```

### Advanced Configuration

```typescript
// Multi-brand setup
const brandColors = {
  default: await generateColorSystem({
    source: '#0066cc',
    variant: 'tonalSpot'
  }),
  
  premium: await generateColorSystem({
    source: '#FFD700',
    variant: 'vibrant',
    contrastLevel: 0.3
  }),
  
  minimal: await generateColorSystem({
    source: '#000000',
    variant: 'neutral'
  })
};
```

### Theme Generation

```typescript
// Generate light and dark themes
const themes = {
  light: await generateColorSystem({
    source: '#0066cc',
    isDark: false,
    contrastLevel: 0
  }),
  
  dark: await generateColorSystem({
    source: '#0066cc',
    isDark: true,
    contrastLevel: 0.2  // Slightly higher for dark
  }),
  
  highContrast: await generateColorSystem({
    source: '#0066cc',
    isDark: false,
    contrastLevel: 1    // Maximum contrast
  })
};
```

## Token Structure

### Color Token Organization

```json
{
  "color": {
    "primitive": {
      "primary": {
        "0": { "value": "#000000" },
        "10": { "value": "#001a40" },
        "20": { "value": "#003066" },
        "30": { "value": "#00468c" },
        "40": { "value": "#005cb2" },
        "50": { "value": "#0073d9" },
        "60": { "value": "#2d8fff" },
        "70": { "value": "#5cabff" },
        "80": { "value": "#8bc7ff" },
        "90": { "value": "#c4e3ff" },
        "95": { "value": "#e2f1ff" },
        "99": { "value": "#fcfcff" },
        "100": { "value": "#ffffff" }
      }
    },
    "semantic": {
      "primary": { "value": "{color.primitive.primary.40}" },
      "on-primary": { "value": "{color.primitive.primary.100}" },
      "primary-container": { "value": "{color.primitive.primary.90}" },
      "on-primary-container": { "value": "{color.primitive.primary.10}" }
    }
  }
}
```

### Surface Colors

Special handling for surfaces and backgrounds:

```typescript
// Surface color calculation
const surfaces = {
  // Neutral surfaces at different elevations
  surface: neutral.tone(99),           // Base surface
  surfaceDim: neutral.tone(87),        // Dimmed surface
  surfaceBright: neutral.tone(98),     // Bright surface
  
  // Colored surfaces
  surfaceContainerLowest: neutral.tone(100),
  surfaceContainerLow: neutral.tone(96),
  surfaceContainer: neutral.tone(94),
  surfaceContainerHigh: neutral.tone(92),
  surfaceContainerHighest: neutral.tone(90)
};
```

## Dynamic Color

### Image-Based Themes

Extract colors from images:

```typescript
import { extractColors } from '@terroir/core/lib/colors';

// Extract dominant color
const sourceColor = await extractColors({
  imagePath: '/path/to/brand-image.jpg',
  extractionMethod: 'vibrant'  // or 'dominant'
});

// Generate scheme from extracted color
const dynamicColors = await generateColorSystem({
  source: sourceColor,
  variant: 'fidelity'  // Preserves extracted color
});
```

### User Preference Themes

Support system and user preferences:

```typescript
// Detect system preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

// Generate appropriate theme
const userTheme = await generateColorSystem({
  source: '#0066cc',
  isDark: prefersDark,
  contrastLevel: prefersHighContrast ? 1 : 0
});
```

## Color Harmony

### Analogous Colors

Generate harmonious color sets:

```typescript
// Create analogous palette
const analogous = {
  primary: await generateFromHue(210),      // Blue
  secondary: await generateFromHue(180),    // Cyan
  tertiary: await generateFromHue(240)      // Blue-violet
};
```

### Complementary Colors

```typescript
// Calculate complementary
const primaryHue = 210;
const complementaryHue = (primaryHue + 180) % 360;

const complementary = {
  primary: await generateFromHue(primaryHue),
  accent: await generateFromHue(complementaryHue)
};
```

### Custom Relationships

```typescript
// Define custom color relationships
const customScheme = {
  primary: '#0066cc',
  secondary: rotateHue(primary, 60),    // Triadic
  tertiary: rotateHue(primary, 120),    // Triadic
  accent: rotateHue(primary, 180)       // Complementary
};
```

## Performance Optimization

### Color Caching

```typescript
// Cache generated palettes
const colorCache = new Map();

function getCachedPalette(config) {
  const key = JSON.stringify(config);
  
  if (!colorCache.has(key)) {
    colorCache.set(key, generateColorSystem(config));
  }
  
  return colorCache.get(key);
}
```

### Lazy Tone Generation

```typescript
// Generate tones on demand
class LazyTonalPalette {
  constructor(keyColor) {
    this.keyColor = keyColor;
    this.cache = new Map();
  }
  
  tone(value) {
    if (!this.cache.has(value)) {
      this.cache.set(value, generateTone(this.keyColor, value));
    }
    return this.cache.get(value);
  }
}
```

## Migration Guide

### From Static Colors

```typescript
// Before: Static color palette
const colors = {
  primary: '#0066cc',
  primaryLight: '#3385ff',
  primaryDark: '#004499'
};

// After: Dynamic MCU palette
const colors = await generateColorSystem({
  source: '#0066cc'
});

// Access equivalents
const primary = colors.primary.tone(40);
const primaryLight = colors.primary.tone(60);
const primaryDark = colors.primary.tone(30);
```

### From Other Color Systems

```typescript
// Convert from HSL
import { hslToHct } from '@terroir/core/lib/colors';

const hctColor = hslToHct({ h: 210, s: 100, l: 40 });

// Convert from RGB
import { hexToHct } from '@terroir/core/lib/colors';

const hctColor = hexToHct('#0066cc');
```

## Best Practices

### 1. **Use Semantic Roles**
Reference color roles, not specific tones:

```css
/* ❌ Avoid */
background: var(--color-primary-40);

/* ✅ Prefer */
background: var(--color-primary);
```

### 2. **Consider All Themes**
Test colors across light, dark, and high-contrast:

```typescript
const themes = ['light', 'dark', 'highContrast'];
themes.forEach(theme => {
  testColorContrast(theme);
});
```

### 3. **Respect User Preferences**
Honor system settings:

```typescript
const theme = getUserPreference() || 
  getSystemPreference() || 
  'light';
```

### 4. **Document Color Decisions**
Explain color choices:

```json
{
  "semantic": {
    "success": {
      "value": "{color.green.40}",
      "description": "Positive actions and success states. Green chosen for universal recognition."
    }
  }
}
```

### 5. **Validate Accessibility**
Always verify contrast:

```bash
pnpm test:contrast --all-combinations
```

## Tools and Resources

### Development Tools

- **MCU Playground**: Test color generation interactively
- **Contrast Checker**: Validate accessibility in real-time
- **Theme Preview**: See colors applied to components
- **Figma Plugin**: Sync MCU colors to design tools

### References

- [Material Color Utilities Documentation](https://github.com/material-foundation/material-color-utilities)
- [HCT Color Space Research](https://material.io/blog/science-of-color-design)
- [WCAG Color Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Material Design Color System](https://m3.material.io/styles/color/overview)

## Next Steps

1. Explore the [Token System Guide](./token-system.md) for broader token architecture
2. See [Theming Guide](./theming.md) for implementing multiple themes
3. Check [Accessibility Guide](./accessibility.md) for comprehensive a11y practices