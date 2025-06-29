# @terroir/core

Core utilities and color system for the Terroir Design System. Built with Material Design 3 principles and a focus on accessibility.

## Installation

```bash
npm install @terroir/core
# or
pnpm add @terroir/core
# or
yarn add @terroir/core
```bash
## Features

- 🎨 **Material Design 3 Color System** - Advanced color generation using Google's Material Color Utilities
- 🌈 **Dynamic Theming** - Generate complete color palettes from a single source color
- ♿ **Accessibility First** - Automatic WCAG contrast validation
- 🚀 **High Performance** - Optimized utilities with minimal overhead
- 📊 **Structured Logging** - Production-ready logging with Pino
- 🛡️ **Type Safety** - Full TypeScript support with comprehensive types
- 🔄 **Async Utilities** - Robust async operations with cancellation support
- ⚡ **Zero Dependencies** - Minimal bundle size (Material Color Utilities only)

## Quick Start

### Generate a Color System

```typescript
import { generateColorSystem } from '@terroir/core';

// Simple usage - generate from a hex color
const colors = await generateColorSystem('#0066cc');

// Access generated palettes
console.log(colors.primary[50]);     // Light primary tone
console.log(colors.primary[90]);     // Dark primary tone
console.log(colors.secondary[40]);   // Secondary color

// Advanced usage with options
const customColors = await generateColorSystem({
  source: '#0066cc',
  contrastLevel: 0.5,      // Higher contrast for accessibility
  variant: 'vibrant',      // Material You variant
  isDark: true            // Generate for dark theme
});
```bash
### Validate Accessibility

```typescript
import { generateColorSystem, validateColorContrast } from '@terroir/core';

const colors = await generateColorSystem('#0066cc');
const validation = validateColorContrast(colors);

if (validation.failed.length > 0) {
  console.warn('Accessibility issues found:');
  validation.failed.forEach(({ name, ratio }) => {
    console.warn(`${name}: ${ratio.toFixed(2)} (needs 4.5)`);
  });
}
```bash
### Use Logging Utilities

```typescript
import { createLogger } from '@terroir/core';

const logger = createLogger({ module: 'my-app' });

logger.info('Application started');
logger.error({ error }, 'Database connection failed');

// Performance tracking
const timer = logger.startTimer();
await processData();
timer.done({ operation: 'processData' }, 'Processing complete');
```bash
## API Overview

### Color Generation

#### `generateColorSystem(sourceOrOptions)`
Generate a complete Material Design 3 color system from a source color.

```typescript
const colors = await generateColorSystem({
  source: '#1976d2',          // Source color (hex or RGB)
  contrastLevel: 0,           // -1 to 1 (higher = more contrast)
  variant: 'tonalSpot',       // Color scheme variant
  tones: [0, 10, 20, ...],    // Custom tone values
  isDark: false               // Theme mode
});
```bash
Returns a `ColorSystem` with:
- Primary, secondary, tertiary, neutral, and error palettes
- Each palette contains tones from 0 (black) to 100 (white)
- Optional light/dark theme configurations

#### `generateTonalPalette(hexColor, tones?)`
Generate a single tonal palette for custom use cases.

```typescript
const palette = generateTonalPalette('#ff5722');
console.log(palette[50]); // Medium tone
```bash
#### `validateColorContrast(colorSystem, minContrast?)`
Validate color combinations for WCAG compliance.

```typescript
const validation = validateColorContrast(colors, 7.0); // AAA compliance
```bash
### Logging

#### `createLogger(options?)`
Create a structured logger instance.

```typescript
const logger = createLogger({ 
  module: 'auth',
  level: 'info' 
});
```bash
#### Performance Tracking
```typescript
// Method 1: Timer API
const timer = logger.startTimer();
// ... do work ...
timer.done({ userId: 123 }, 'Operation complete');

// Method 2: Measure function
const result = await measureTime(
  async () => await fetchData(),
  (duration) => logger.info({ duration }, 'Fetch complete')
);
```bash
### Utility Functions

The package includes comprehensive utilities for:
- **Async Operations** - Timeouts, delays, retries, cancellation
- **Error Handling** - Typed errors, retry logic, error boundaries
- **Type Guards** - Runtime type validation
- **Performance** - Measurement and optimization utilities

## Color System Details

### Material You Variants

- `tonalSpot` - Default, balanced colors (recommended)
- `vibrant` - More saturated, lively colors
- `expressive` - Unexpected color combinations
- `neutral` - Subtle, muted colors
- `monochrome` - Single color with tonal variations
- `fidelity` - Preserves source color character

### Tone Scale

The continuous 0-100 tone scale provides precise control:
- **0-10**: Near black, highest contrast
- **20-40**: Dark tones, good for text on light
- **50**: Medium tone, balanced
- **60-80**: Light tones, good for backgrounds
- **90-100**: Near white, lowest contrast

### Accessibility

All generated colors are designed for accessibility:
- Automatic WCAG AA compliance checking
- Pre-calculated contrast ratios
- Suggested color pairings
- Support for high contrast modes

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type { 
  ColorSystem, 
  ColorGeneratorOptions,
  TonalScale,
  ContrastValidationResult,
  Logger
} from '@terroir/core';
```

## Bundle Size

Optimized for production with tree-shaking support:

- Core utilities: ~5KB gzipped
- Color system: ~15KB gzipped (includes Material Color Utilities)
- Logger: ~8KB gzipped (optional, not included by default)

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Node.js 18+

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development setup and guidelines.

## License

MIT © Terroir Design System Contributors

## Links

- [Documentation](https://terroir-ds.github.io/core/)
- [API Reference](https://terroir-ds.github.io/core/api/)
- [GitHub Repository](https://github.com/terroir-ds/core)
- [npm Package](https://www.npmjs.com/package/@terroir/core)
- [Material Design 3](https://m3.material.io/)
