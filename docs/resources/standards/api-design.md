# API Design Standards

## Overview

Consistent, intuitive API design for the Terroir Core Design System.

## Naming Conventions

### Functions

```typescript
// ✅ GOOD: Verb + Noun, descriptive
export function generateColorPalette(source: string): ColorPalette;
export function validateContrast(fg: string, bg: string): boolean;
export function parseHexColor(hex: string): RGB;

// ❌ BAD: Unclear, abbreviated
export function genPal(s: string): any;
export function check(a: string, b: string): boolean;
```

### Boolean Returns

```typescript
// Use is/has/can prefixes
export function isValidColor(color: string): boolean;
export function hasAlpha(color: Color): boolean;
export function canGeneratePalette(source: unknown): boolean;
```

### Async Functions

```typescript
// Clear async indication
export async function fetchTheme(id: string): Promise<Theme>;
export async function loadFonts(urls: string[]): Promise<Font[]>;

// Or with Async suffix for clarity
export async function generatePaletteAsync(source: string): Promise<Palette>;
```

## Parameter Design

### Options Objects

```typescript
// ❌ BAD: Too many parameters
function createTheme(
  name: string,
  primary: string,
  secondary: string,
  background: string,
  surface: string,
  isDark: boolean,
  contrastLevel: number
) {}

// ✅ GOOD: Options object with defaults
interface ThemeOptions {
  name: string;
  colors: {
    primary: string;
    secondary?: string;
    background?: string;
    surface?: string;
  };
  mode?: 'light' | 'dark';
  contrastLevel?: number;
}

function createTheme(options: ThemeOptions): Theme {
  const defaults = {
    mode: 'light',
    contrastLevel: 0,
    colors: {
      secondary: derivedFromPrimary,
      background: '#ffffff',
      surface: '#fafafa'
    }
  };

  const config = { ...defaults, ...options };
}
```

### Destructuring with Defaults

```typescript
export function generateColors({
  source,
  variant = 'tonalSpot',
  contrast = 0,
  isDark = false
}: ColorOptions): ColorScheme {
  // Implementation
}
```

## Return Values

### Consistent Types

```typescript
// ✅ GOOD: Predictable returns
export function findColor(name: string): Color | null;
export function getColors(): Color[];
export function parseColor(input: string): Result<Color, ParseError>;

// ❌ BAD: Inconsistent returns
export function findColor(name: string): Color | undefined | null;
export function getColors(): Color[] | null;
```

### Result Pattern

```typescript
// For operations that can fail
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export function parseColorString(input: string): Result<Color> {
  try {
    const color = parse(input);
    return { success: true, data: color };
  } catch (error) {
    return { success: false, error };
  }
}

// Usage
const result = parseColorString('#ff0000');
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

## Error Handling

### Throw Meaningful Errors

```typescript
export function validateHex(hex: string): void {
  if (!hex.startsWith('#')) {
    throw new ValidationError('Hex color must start with #', {
      code: 'INVALID_HEX_FORMAT',
      context: { value: hex }
    });
  }
}
```

### Never Throw Strings

```text
// ❌ BAD
throw 'Invalid color';

// ✅ GOOD
throw new ValidationError('Invalid color format');
```

## Versioning & Deprecation

### Deprecation Warnings

```typescript
/**
 * @deprecated Use `generateColorPalette` instead. Will be removed in v2.0.
 */
export function generatePalette(source: string): Palette {
  console.warn(
    'generatePalette is deprecated. Use generateColorPalette instead.'
  );
  return generateColorPalette(source);
}
```

### Version Compatibility

```typescript
// Support multiple API versions
export function createColor(input: string | ColorOptions): Color {
  // Handle both old string API and new options API
  if (typeof input === 'string') {
    console.warn('String input is deprecated. Use options object.');
    return new Color({ value: input });
  }
  return new Color(input);
}
```

## TypeScript Integration

### Generics Where Helpful

```typescript
export function memoize<T extends (...args: any[]) => any>(
  fn: T
): T {
  const cache = new Map();
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) {
      cache.set(key, fn(...args));
    }
    return cache.get(key);
  }) as T;
}
```

### Type Guards

```typescript
export function isColor(value: unknown): value is Color {
  return value instanceof Color ||
    (typeof value === 'object' &&
     value !== null &&
     'r' in value &&
     'g' in value &&
     'b' in value);
}

// Usage
if (isColor(value)) {
  // TypeScript knows value is Color here
  console.log(value.r);
}
```

## Documentation

### JSDoc Everything Public

```typescript
/**
 * Generates a color palette from a source color
 *
 * @param source - The source color in any supported format
 * @param options - Palette generation options
 * @returns A complete color palette with tonal variations
 *
 * @example
 * ```typescript
 * const palette = generateColorPalette('#0066cc', {
 *   variant: 'vibrant',
 *   size: 'extended'
 * });
 * ```
 *
 * @throws {ValidationError} If source color is invalid
 * @since 1.0.0
 */
export function generateColorPalette(
  source: string,
  options?: PaletteOptions
): ColorPalette {
  // Implementation
}
```

## Best Practices

1. **One Thing Well**: Each function should do one thing
2. **Predictable**: Similar functions should work similarly
3. **Composable**: Small functions that work together
4. **Immutable**: Don't modify inputs, return new values
5. **Type-Safe**: Leverage TypeScript fully

## Examples

### Good API Design

```typescript
// Color manipulation API
export const color = {
  parse: (input: string): Color => { /* ... */ },
  format: (color: Color, format: ColorFormat): string => { /* ... */ },
  mix: (a: Color, b: Color, amount?: number): Color => { /* ... */ },
  lighten: (color: Color, amount: number): Color => { /* ... */ },
  darken: (color: Color, amount: number): Color => { /* ... */ },
  contrast: (fg: Color, bg: Color): number => { /* ... */ }
};

// Usage
const primary = color.parse('#0066cc');
const lighter = color.lighten(primary, 0.2);
const formatted = color.format(lighter, 'hsl');
```
