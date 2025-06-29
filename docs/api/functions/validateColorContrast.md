[**Terroir Core Design System v0.1.0**](../README.md)

***

[Terroir Core Design System](../globals.md) / validateColorContrast

# Function: validateColorContrast()

> **validateColorContrast**(`colorSystem`, `minContrast`): [`ContrastValidationResult`](../interfaces/ContrastValidationResult.md)

Defined in: [colors/generator.ts:537](https://github.com/terroir-ds/core/blob/0096649176492a6e21b16e854cb30ade347b1bac/packages/core/src/colors/generator.ts#L537)

Validate a color system against WCAG contrast requirements.

Tests all text/background color combinations in the generated themes
to ensure they meet accessibility standards. This is critical for
ensuring your design system is usable by people with visual impairments.

## Parameters

### colorSystem

[`ColorSystem`](../interfaces/ColorSystem.md)

The generated color system to validate

### minContrast

`number` = `4.5`

Minimum contrast ratio required:

- 4.5 for WCAG AA compliance (default)
- 7.0 for WCAG AAA compliance
- 3.0 for large text (18pt+ or 14pt+ bold)

## Returns

[`ContrastValidationResult`](../interfaces/ContrastValidationResult.md)

Validation results containing:

- `passed`: Array of color combinations that meet the minimum contrast
- `failed`: Array of color combinations that fail to meet minimum contrast
- `minContrast`: The minimum contrast ratio used for validation

## Examples

```typescript
import { generateColorSystem, validateColorContrast } from '@terroir/core';

const colors = await generateColorSystem('#1976d2');
const validation = validateColorContrast(colors);

if (validation.failed.length > 0) {
  console.warn('Accessibility issues found:');
  validation.failed.forEach(({ name, ratio }) => {
    console.warn(`${name}: ${ratio.toFixed(2)} (needs 4.5)`);
  });
}
```typescript
```typescript
const strictValidation = validateColorContrast(colors, 7.0);

console.log(`AAA compliant combinations: ${strictValidation.passed.length}`);
console.log(`Failed combinations: ${strictValidation.failed.length}`);
```

## See

- [WCAG Contrast Requirements](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [ContrastValidationResult](../interfaces/ContrastValidationResult.md) for the returned data structure

## Since

0.1.0
