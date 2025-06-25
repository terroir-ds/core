/**
 * @module @terroir/core/lib/colors
 * 
 * Material Design 3 color system generation utilities
 * 
 * @example
 * import { generateColorSystem } from '@terroir/core/lib/colors';
 * 
 * // Generate from hex color
 * const colors = await generateColorSystem('#1976d2');
 * 
 * // Generate with options
 * const colors = await generateColorSystem({
 *   source: '#1976d2',
 *   contrastLevel: 0.5,
 *   variant: 'vibrant'
 * });
 */

export {
  generateColorSystem,
  generateTonalPalette,
  extractColorFromImage,
  validateColorContrast,
  DEFAULT_TONES,
} from './generator.js';

export type {
  ColorGeneratorOptions,
  ColorSystem,
  TonalScale,
  ColorVariant,
  Tone,
  ContrastValidationResult,
} from './generator.js';

// Re-export useful Material Color Utilities for consumers
export { 
  hexFromArgb,
  argbFromHex,
  rgbaFromArgb,
} from '@material/material-color-utilities';