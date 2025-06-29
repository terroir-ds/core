[**Terroir Core Design System v0.1.0**](../README.md)

***

[Terroir Core Design System](../globals.md) / ColorGeneratorOptions

# Interface: ColorGeneratorOptions

Defined in: [colors/generator.ts:48](https://github.com/terroir-ds/core/blob/0096649176492a6e21b16e854cb30ade347b1bac/packages/core/src/colors/generator.ts#L48)

Color generation options

## Properties

### contrastLevel?

> `optional` **contrastLevel**: `number`

Defined in: [colors/generator.ts:52](https://github.com/terroir-ds/core/blob/0096649176492a6e21b16e854cb30ade347b1bac/packages/core/src/colors/generator.ts#L52)

Contrast level (-1 to 1, 0 is default)

***

### includeThemes?

> `optional` **includeThemes**: `boolean`

Defined in: [colors/generator.ts:58](https://github.com/terroir-ds/core/blob/0096649176492a6e21b16e854cb30ade347b1bac/packages/core/src/colors/generator.ts#L58)

Include light/dark theme schemes

***

### source

> **source**: `string` \| \{ `b`: `number`; `g`: `number`; `r`: `number`; \}

Defined in: [colors/generator.ts:50](https://github.com/terroir-ds/core/blob/0096649176492a6e21b16e854cb30ade347b1bac/packages/core/src/colors/generator.ts#L50)

Source color (hex, rgb, or image path)

***

### tones?

> `optional` **tones**: readonly `number`[]

Defined in: [colors/generator.ts:56](https://github.com/terroir-ds/core/blob/0096649176492a6e21b16e854cb30ade347b1bac/packages/core/src/colors/generator.ts#L56)

Custom tone values (defaults to Material Design 3 tones)

***

### variant?

> `optional` **variant**: [`ColorVariant`](../type-aliases/ColorVariant.md)

Defined in: [colors/generator.ts:54](https://github.com/terroir-ds/core/blob/0096649176492a6e21b16e854cb30ade347b1bac/packages/core/src/colors/generator.ts#L54)

Color variant
