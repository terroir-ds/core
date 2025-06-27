[**Terroir Core Design System v0.1.0**](../README.md)

---

[Terroir Core Design System](../globals.md) / ColorSystem

# Interface: ColorSystem

Defined in: [colors/generator.ts:80](https://github.com/terroir-ds/core/blob/9691713b8c512b7d2abe808c4f7084bdfab798bf/lib/colors/generator.ts#L80)

Generated color system

## Properties

### metadata

> **metadata**: `object`

Defined in: [colors/generator.ts:97](https://github.com/terroir-ds/core/blob/9691713b8c512b7d2abe808c4f7084bdfab798bf/lib/colors/generator.ts#L97)

#### generatedAt

> **generatedAt**: `string`

#### options

> **options**: `object`

##### options.contrastLevel

> **contrastLevel**: `number`

##### options.tones

> **tones**: readonly `number`[]

##### options.variant

> **variant**: [`ColorVariant`](../type-aliases/ColorVariant.md)

#### version

> **version**: `string`

---

### palettes

> **palettes**: `object`

Defined in: [colors/generator.ts:85](https://github.com/terroir-ds/core/blob/9691713b8c512b7d2abe808c4f7084bdfab798bf/lib/colors/generator.ts#L85)

#### error

> **error**: [`TonalScale`](TonalScale.md)

#### neutral

> **neutral**: [`TonalScale`](TonalScale.md)

#### neutralVariant

> **neutralVariant**: [`TonalScale`](TonalScale.md)

#### primary

> **primary**: [`TonalScale`](TonalScale.md)

#### secondary

> **secondary**: [`TonalScale`](TonalScale.md)

#### tertiary

> **tertiary**: [`TonalScale`](TonalScale.md)

---

### source

> **source**: `object`

Defined in: [colors/generator.ts:81](https://github.com/terroir-ds/core/blob/9691713b8c512b7d2abe808c4f7084bdfab798bf/lib/colors/generator.ts#L81)

#### argb

> **argb**: `number`

#### hex

> **hex**: `string`

---

### themes?

> `optional` **themes**: `object`

Defined in: [colors/generator.ts:93](https://github.com/terroir-ds/core/blob/9691713b8c512b7d2abe808c4f7084bdfab798bf/lib/colors/generator.ts#L93)

#### dark

> **dark**: `Record`\<`string`, \{ `argb`: `number`; `hex`: `string`; `mode`: `string`; \}\>

#### light

> **light**: `Record`\<`string`, \{ `argb`: `number`; `hex`: `string`; `mode`: `string`; \}\>
