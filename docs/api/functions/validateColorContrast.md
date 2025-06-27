[**Terroir Core Design System v0.1.0**](../README.md)

---

[Terroir Core Design System](../globals.md) / validateColorContrast

# Function: validateColorContrast()

> **validateColorContrast**(`colorSystem`, `minContrast`): [`ContrastValidationResult`](../interfaces/ContrastValidationResult.md)

Defined in: [colors/generator.ts:404](https://github.com/terroir-ds/core/blob/9691713b8c512b7d2abe808c4f7084bdfab798bf/lib/colors/generator.ts#L404)

Validate color system against WCAG contrast requirements

## Parameters

### colorSystem

[`ColorSystem`](../interfaces/ColorSystem.md)

Generated color system

### minContrast

`number` = `4.5`

Minimum contrast ratio (4.5 for AA, 7 for AAA)

## Returns

[`ContrastValidationResult`](../interfaces/ContrastValidationResult.md)

Validation results with passing/failing combinations
