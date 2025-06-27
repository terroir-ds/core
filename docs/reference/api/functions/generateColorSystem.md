[**Terroir Core Design System v0.1.0**](../README.md)

---

[Terroir Core Design System](../globals.md) / generateColorSystem

# Function: generateColorSystem()

> **generateColorSystem**(`sourceOrOptions`): `Promise`\<[`ColorSystem`](../interfaces/ColorSystem.md)\>

Defined in: [colors/generator.ts:135](https://github.com/terroir-ds/core/blob/a3f3cd156fc544ddf3040641fcdb94420bfa9e60/lib/colors/generator.ts#L135)

Generate a complete color system from a source color

## Parameters

### sourceOrOptions

Hex color or options object

`string` | [`ColorGeneratorOptions`](../interfaces/ColorGeneratorOptions.md)

## Returns

`Promise`\<[`ColorSystem`](../interfaces/ColorSystem.md)\>

Generated color system with palettes and themes

## Examples

````ts
// Simple usage with hex color
const colors = await generateColorSystem('#1976d2');
```typescript
```ts
// Advanced usage with options
const colors = await generateColorSystem({
  source: '#1976d2',
  contrastLevel: 0.5,
  variant: 'vibrant'
});
````
