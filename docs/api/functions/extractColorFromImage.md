[**Terroir Core Design System v0.1.0**](../README.md)

***

[Terroir Core Design System](../globals.md) / extractColorFromImage

# Function: extractColorFromImage()

> **extractColorFromImage**(`_image`): `Promise`\<`string`\>

Defined in: [colors/generator.ts:357](https://github.com/terroir-ds/core/blob/0096649176492a6e21b16e854cb30ade347b1bac/packages/core/src/colors/generator.ts#L357)

**`Experimental`**

Extract the dominant color from an image file.

Analyzes an image to find its most prominent color, useful for generating
color systems based on brand imagery or photography.

## Parameters

### \_image

`string` | `Buffer`\<`ArrayBufferLike`\>

## Returns

`Promise`\<`string`\>

Promise resolving to the dominant color in hex format

## Throws

Currently not implemented - will be added in a future release

## Example

```bash
import { extractColorFromImage, generateColorSystem } from '@terroir/core';

// Extract color from brand logo
const brandColor = await extractColorFromImage('./logo.png');

// Generate color system from extracted color
const colors = await generateColorSystem(brandColor);
```

## Todo

Implement using sharp or similar image processing library

## Todo

Support multiple image formats (PNG, JPEG, WebP, SVG)

## Todo

Add options for extraction algorithm (dominant, vibrant, average)

 This API is not yet implemented

## Since

0.2.0
