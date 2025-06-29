[**Terroir Core Design System v0.1.0**](../README.md)

***

[Terroir Core Design System](../globals.md) / generateTonalPalette

# Function: generateTonalPalette()

> **generateTonalPalette**(`hexColor`, `tones`): [`TonalScale`](../interfaces/TonalScale.md)

Defined in: [colors/generator.ts:318](https://github.com/terroir-ds/core/blob/0096649176492a6e21b16e854cb30ade347b1bac/packages/core/src/colors/generator.ts#L318)

Generate a single tonal palette from a hex color.

Creates a Material Design 3 tonal palette with specified tone values.
This is useful when you need just one palette rather than a complete color system.

## Parameters

### hexColor

`string`

Source color in hex format (e.g., '#1976d2')

### tones

readonly `number`[] = `DEFAULT_TONES`

Array of tone values to generate (0-100), defaults to Material Design standard tones

## Returns

[`TonalScale`](../interfaces/TonalScale.md)

A TonalScale object containing the generated tones

## Throws

If the hex color format is invalid

## Examples

```typescript
import { generateTonalPalette } from '@terroir/core';

const palette = generateTonalPalette('#1976d2');
console.log(palette[50]); // Medium tone
console.log(palette[90]); // Dark tone for backgrounds
```typescript
```typescript
const customPalette = generateTonalPalette('#ff5722', [0, 25, 50, 75, 100]);
console.log(customPalette[25]); // Light-medium tone
```

## See

- [generateColorSystem](generateColorSystem.md) for generating complete color systems
- [TonalScale](../interfaces/TonalScale.md) for the returned data structure

## Since

0.1.0
