[**Terroir Core Design System v0.1.0**](../README.md)

***

[Terroir Core Design System](../globals.md) / generateColorSystem

# Function: generateColorSystem()

> **generateColorSystem**(`sourceOrOptions`): `Promise`\<[`ColorSystem`](../interfaces/ColorSystem.md)\>

Defined in: [colors/generator.ts:179](https://github.com/terroir-ds/core/blob/0096649176492a6e21b16e854cb30ade347b1bac/packages/core/src/colors/generator.ts#L179)

Generate a complete color system from a source color using Material Design 3 principles.

This function creates a comprehensive color palette including primary, secondary, tertiary,
neutral, and error colors. It uses Google's Material Color Utilities to ensure perceptually
uniform color generation with proper contrast ratios for accessibility.

## Parameters

### sourceOrOptions

A hex color string (e.g., '#1976d2') or a ColorGeneratorOptions object

`string` | [`ColorGeneratorOptions`](../interfaces/ColorGeneratorOptions.md)

## Returns

`Promise`\<[`ColorSystem`](../interfaces/ColorSystem.md)\>

A promise that resolves to a complete ColorSystem with:

- Primary, secondary, tertiary, neutral, and error palettes
- Each palette containing the requested tone values
- Light and dark theme variations
- Metadata about the generation process

## Throws

If the source color format is invalid

## Throws

If color generation fails

## Examples

```typescript
import { generateColorSystem } from '@terroir/core';

const colors = await generateColorSystem('#1976d2');
console.log(colors.primary[50]); // Light primary tone
console.log(colors.primary[90]); // Dark primary tone
```

```typescript
const colors = await generateColorSystem({
  source: '#1976d2',
  contrastLevel: 0.5,    // Higher contrast for accessibility
  variant: 'vibrant',    // More saturated colors
  isDark: true           // Generate for dark theme
});

// Access specific tones
const primaryButton = colors.primary[40];
const primaryHover = colors.primary[30];
```

```typescript
const colors = await generateColorSystem({
  source: '#1976d2',
  tones: [0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100],
  variant: 'expressive'
});
```

## See

- [Material Design 3 Color System](https://m3.material.io/styles/color/the-color-system/key-colors-tones)
- [ColorGeneratorOptions](../interfaces/ColorGeneratorOptions.md) for all available options
- [ColorSystem](../interfaces/ColorSystem.md) for the returned data structure

## Since

0.1.0
