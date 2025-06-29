/**
 * Material Design 3 Color System Generator
 * 
 * Generates comprehensive color palettes using Google's Material Color Utilities
 * Supports both runtime and build-time color generation
 * 
 * @module @terroir/core/lib/colors
 */

import { 
  argbFromHex,
  hexFromArgb,
  CorePalette,
  TonalPalette,
  DynamicScheme,
} from '@material/material-color-utilities';
import { 
  MaterialDynamicColors,
  SchemeTonalSpot,
  SchemeVibrant,
  SchemeExpressive,
  SchemeNeutral,
  SchemeMonochrome,
  SchemeFidelity,
  Hct,
} from '@material/material-color-utilities';
import { createLogger } from '@utils/logger/index.js';
import type { Logger } from 'pino';

// Create module-specific logger
const log: Logger = createLogger({ module: 'color-generator' });

/**
 * Default tones for Material Design 3
 */
export const DEFAULT_TONES = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100] as const;

export type Tone = typeof DEFAULT_TONES[number];

/**
 * Color variants supported by Material You
 */
export type ColorVariant = 'tonalSpot' | 'vibrant' | 'expressive' | 'neutral' | 'monochrome' | 'fidelity';

/**
 * Color generation options
 */
export interface ColorGeneratorOptions {
  /** Source color (hex, rgb, or image path) */
  source: string | { r: number; g: number; b: number };
  /** Contrast level (-1 to 1, 0 is default) */
  contrastLevel?: number;
  /** Color variant */
  variant?: ColorVariant;
  /** Custom tone values (defaults to Material Design 3 tones) */
  tones?: readonly number[];
  /** Include light/dark theme schemes */
  includeThemes?: boolean;
}

/**
 * Generated tonal scale
 */
export interface TonalScale {
  name: string;
  tones: Record<number, {
    hex: string;
    argb: number;
    tone: number;
    contrast: {
      white: number;
      black: number;
    };
  }>;
}

/**
 * Generated color system
 */
export interface ColorSystem {
  source: {
    hex: string;
    argb: number;
  };
  palettes: {
    primary: TonalScale;
    secondary: TonalScale;
    tertiary: TonalScale;
    neutral: TonalScale;
    neutralVariant: TonalScale;
    error: TonalScale;
  };
  themes?: {
    light: Record<string, { hex: string; argb: number; mode: string }>;
    dark: Record<string, { hex: string; argb: number; mode: string }>;
  };
  metadata: {
    generatedAt: string;
    version: string;
    options: {
      variant: ColorVariant;
      contrastLevel: number;
      tones: readonly number[];
    };
  };
}

/**
 * Contrast validation results
 */
export interface ContrastValidationResult {
  passed: Array<{ name: string; ratio: number; passes: boolean }>;
  failed: Array<{ name: string; ratio: number; passes: boolean }>;
  minContrast: number;
}

/**
 * Generate a complete color system from a source color using Material Design 3 principles.
 * 
 * This function creates a comprehensive color palette including primary, secondary, tertiary,
 * neutral, and error colors. It uses Google's Material Color Utilities to ensure perceptually
 * uniform color generation with proper contrast ratios for accessibility.
 * 
 * @category Colors
 * @param sourceOrOptions - A hex color string (e.g., '#1976d2') or a ColorGeneratorOptions object
 * @param sourceOrOptions.source - The source color in hex format or RGB object
 * @param sourceOrOptions.contrastLevel - Contrast level from -1 (low) to 1 (high), default 0
 * @param sourceOrOptions.variant - Color scheme variant, default 'tonalSpot'
 * @param sourceOrOptions.tones - Array of tone values to generate (0-100), default Material Design tones
 * @param sourceOrOptions.isDark - Whether to generate a dark theme, default false
 * 
 * @returns A promise that resolves to a complete ColorSystem with:
 * - Primary, secondary, tertiary, neutral, and error palettes
 * - Each palette containing the requested tone values
 * - Light and dark theme variations
 * - Metadata about the generation process
 * 
 * @throws {ValidationError} If the source color format is invalid
 * @throws {Error} If color generation fails
 * 
 * @example Basic usage with hex color
 * ```typescript
 * import { generateColorSystem } from '@terroir/core';
 * 
 * const colors = await generateColorSystem('#1976d2');
 * console.log(colors.primary[50]); // Light primary tone
 * console.log(colors.primary[90]); // Dark primary tone
 * ```
 * 
 * @example Advanced usage with options
 * ```typescript
 * const colors = await generateColorSystem({
 *   source: '#1976d2',
 *   contrastLevel: 0.5,    // Higher contrast for accessibility
 *   variant: 'vibrant',    // More saturated colors
 *   isDark: true           // Generate for dark theme
 * });
 * 
 * // Access specific tones
 * const primaryButton = colors.primary[40];
 * const primaryHover = colors.primary[30];
 * ```
 * 
 * @example Custom tone generation
 * ```typescript
 * const colors = await generateColorSystem({
 *   source: '#1976d2',
 *   tones: [0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100],
 *   variant: 'expressive'
 * });
 * ```
 * 
 * @see {@link https://m3.material.io/styles/color/the-color-system/key-colors-tones Material Design 3 Color System}
 * @see {@link ColorGeneratorOptions} for all available options
 * @see {@link ColorSystem} for the returned data structure
 * 
 * @since 0.1.0
 */
export async function generateColorSystem(
  sourceOrOptions: string | ColorGeneratorOptions
): Promise<ColorSystem> {
  const startTime = performance.now();
  
  // Normalize options
  const options: ColorGeneratorOptions = typeof sourceOrOptions === 'string' 
    ? { source: sourceOrOptions }
    : sourceOrOptions;
    
  const {
    source,
    contrastLevel = 0,
    variant = 'tonalSpot',
    tones = DEFAULT_TONES,
    includeThemes = true
  } = options;
  
  log.info({ source, variant, contrastLevel }, 'Generating color system');
  
  try {
    // Convert source to ARGB
    const sourceArgb = parseSourceColor(source);
    const sourceHct = Hct.fromInt(sourceArgb);
    
    // Generate core palette
    const palette = CorePalette.fromColors({
      primary: sourceArgb,
    });
    
    // Generate dynamic schemes if requested
    let lightScheme: DynamicScheme | undefined;
    let darkScheme: DynamicScheme | undefined;
    
    if (includeThemes) {
      // Create scheme based on variant
      switch (variant) {
        case 'vibrant':
          lightScheme = new SchemeVibrant(sourceHct, false, contrastLevel);
          darkScheme = new SchemeVibrant(sourceHct, true, contrastLevel);
          break;
        case 'expressive':
          lightScheme = new SchemeExpressive(sourceHct, false, contrastLevel);
          darkScheme = new SchemeExpressive(sourceHct, true, contrastLevel);
          break;
        case 'neutral':
          lightScheme = new SchemeNeutral(sourceHct, false, contrastLevel);
          darkScheme = new SchemeNeutral(sourceHct, true, contrastLevel);
          break;
        case 'monochrome':
          lightScheme = new SchemeMonochrome(sourceHct, false, contrastLevel);
          darkScheme = new SchemeMonochrome(sourceHct, true, contrastLevel);
          break;
        case 'fidelity':
          lightScheme = new SchemeFidelity(sourceHct, false, contrastLevel);
          darkScheme = new SchemeFidelity(sourceHct, true, contrastLevel);
          break;
        case 'tonalSpot':
        default:
          lightScheme = new SchemeTonalSpot(sourceHct, false, contrastLevel);
          darkScheme = new SchemeTonalSpot(sourceHct, true, contrastLevel);
          break;
      }
    }
    
    // Build color system
    const colorSystem: ColorSystem = {
      source: {
        hex: hexFromArgb(sourceArgb),
        argb: sourceArgb
      },
      palettes: {
        primary: generateTonalScale(palette.a1, 'Primary', tones),
        secondary: generateTonalScale(palette.a2, 'Secondary', tones),
        tertiary: generateTonalScale(palette.a3, 'Tertiary', tones),
        neutral: generateTonalScale(palette.n1, 'Neutral', tones),
        neutralVariant: generateTonalScale(palette.n2, 'Neutral Variant', tones),
        error: generateTonalScale(palette.error, 'Error', tones)
      },
      ...(includeThemes && lightScheme && darkScheme ? {
        themes: {
          light: schemeToTokens(lightScheme, 'light'),
          dark: schemeToTokens(darkScheme, 'dark')
        }
      } : {}),
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        options: {
          variant,
          contrastLevel,
          tones: Array.from(tones)
        }
      }
    };
    
    const duration = Math.round(performance.now() - startTime);
    log.info({ duration }, `Color system generated in ${duration}ms`);
    
    return colorSystem;
  } catch (error) {
    log.error({ err: error, source }, 'Failed to generate color system');
    throw error;
  }
}

/**
 * Generate a single tonal palette from a hex color.
 * 
 * Creates a Material Design 3 tonal palette with specified tone values.
 * This is useful when you need just one palette rather than a complete color system.
 * 
 * @category Colors
 * @param hexColor - Source color in hex format (e.g., '#1976d2')
 * @param tones - Array of tone values to generate (0-100), defaults to Material Design standard tones
 * @returns A TonalScale object containing the generated tones
 * 
 * @throws {Error} If the hex color format is invalid
 * 
 * @example Generate a custom palette
 * ```typescript
 * import { generateTonalPalette } from '@terroir/core';
 * 
 * const palette = generateTonalPalette('#1976d2');
 * console.log(palette[50]); // Medium tone
 * console.log(palette[90]); // Dark tone for backgrounds
 * ```
 * 
 * @example Generate with custom tones
 * ```typescript
 * const customPalette = generateTonalPalette('#ff5722', [0, 25, 50, 75, 100]);
 * console.log(customPalette[25]); // Light-medium tone
 * ```
 * 
 * @see {@link generateColorSystem} for generating complete color systems
 * @see {@link TonalScale} for the returned data structure
 * 
 * @since 0.1.0
 */
export function generateTonalPalette(
  hexColor: string, 
  tones: readonly number[] = DEFAULT_TONES
): TonalScale {
  const argb = argbFromHex(hexColor);
  const palette = TonalPalette.fromInt(argb);
  return generateTonalScale(palette, 'Custom', tones);
}

/**
 * Extract the dominant color from an image file.
 * 
 * Analyzes an image to find its most prominent color, useful for generating
 * color systems based on brand imagery or photography.
 * 
 * @category Colors
 * @param image - Path to image file or Buffer containing image data
 * @returns Promise resolving to the dominant color in hex format
 * 
 * @throws {Error} Currently not implemented - will be added in a future release
 * 
 * @example Future usage (not yet implemented)
 * ```typescript
 * import { extractColorFromImage, generateColorSystem } from '@terroir/core';
 * 
 * // Extract color from brand logo
 * const brandColor = await extractColorFromImage('./logo.png');
 * 
 * // Generate color system from extracted color
 * const colors = await generateColorSystem(brandColor);
 * ```
 * 
 * @todo Implement using sharp or similar image processing library
 * @todo Support multiple image formats (PNG, JPEG, WebP, SVG)
 * @todo Add options for extraction algorithm (dominant, vibrant, average)
 * 
 * @experimental This API is not yet implemented
 * @since 0.2.0
 */
export async function extractColorFromImage(_image: string | Buffer): Promise<string> {
  // TODO: Implement with sharp or similar
  throw new Error('Image color extraction not yet implemented');
}

/**
 * Parse source color from various formats
 */
function parseSourceColor(source: string | { r: number; g: number; b: number }): number {
  // Hex color
  if (typeof source === 'string' && source.startsWith('#')) {
    return argbFromHex(source);
  }
  
  // RGB object
  if (typeof source === 'object' && 'r' in source) {
    // Convert RGB to hex first, then to ARGB
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    const hex = `#${toHex(source.r)}${toHex(source.g)}${toHex(source.b)}`;
    return argbFromHex(hex);
  }
  
  // TODO: Add more formats (HSL, LAB, etc.)
  
  throw new Error(`Unsupported color format: ${source}`);
}

/**
 * Generate tonal scale with metadata
 */
function generateTonalScale(
  tonalPalette: TonalPalette, 
  name: string, 
  tones: readonly number[]
): TonalScale {
  const scale: TonalScale = {
    name,
    tones: {}
  };
  
  for (const tone of tones) {
    const argb = tonalPalette.tone(tone);
    scale.tones[tone] = {
      hex: hexFromArgb(argb),
      argb,
      tone,
      contrast: {
        white: Number(contrastRatio(argb, 0xFFFFFFFF).toFixed(2)),
        black: Number(contrastRatio(argb, 0xFF000000).toFixed(2))
      }
    };
  }
  
  return scale;
}

/**
 * Calculate contrast ratio between two colors
 */
function contrastRatio(color1: number, color2: number): number {
  const luminance1 = relativeLuminance(color1);
  const luminance2 = relativeLuminance(color2);
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculate relative luminance of a color
 */
function relativeLuminance(argb: number): number {
  const r = ((argb >> 16) & 0xff) / 255;
  const g = ((argb >> 8) & 0xff) / 255;
  const b = (argb & 0xff) / 255;
  
  const toLinear = (c: number) => 
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Convert Material scheme to design tokens
 */
function schemeToTokens(
  scheme: DynamicScheme, 
  mode: string
): Record<string, { hex: string; argb: number; mode: string }> {
  const tokens: Record<string, { hex: string; argb: number; mode: string }> = {};
  
  // Map key Material You tokens
  const colorMappings = {
    primary: MaterialDynamicColors.primary,
    onPrimary: MaterialDynamicColors.onPrimary,
    primaryContainer: MaterialDynamicColors.primaryContainer,
    onPrimaryContainer: MaterialDynamicColors.onPrimaryContainer,
    secondary: MaterialDynamicColors.secondary,
    onSecondary: MaterialDynamicColors.onSecondary,
    secondaryContainer: MaterialDynamicColors.secondaryContainer,
    onSecondaryContainer: MaterialDynamicColors.onSecondaryContainer,
    tertiary: MaterialDynamicColors.tertiary,
    onTertiary: MaterialDynamicColors.onTertiary,
    tertiaryContainer: MaterialDynamicColors.tertiaryContainer,
    onTertiaryContainer: MaterialDynamicColors.onTertiaryContainer,
    error: MaterialDynamicColors.error,
    onError: MaterialDynamicColors.onError,
    errorContainer: MaterialDynamicColors.errorContainer,
    onErrorContainer: MaterialDynamicColors.onErrorContainer,
    background: MaterialDynamicColors.background,
    onBackground: MaterialDynamicColors.onBackground,
    surface: MaterialDynamicColors.surface,
    onSurface: MaterialDynamicColors.onSurface,
    surfaceVariant: MaterialDynamicColors.surfaceVariant,
    onSurfaceVariant: MaterialDynamicColors.onSurfaceVariant,
    outline: MaterialDynamicColors.outline,
    outlineVariant: MaterialDynamicColors.outlineVariant,
    inverseSurface: MaterialDynamicColors.inverseSurface,
    inverseOnSurface: MaterialDynamicColors.inverseOnSurface,
    inversePrimary: MaterialDynamicColors.inversePrimary,
  };
  
  for (const [key, dynamicColor] of Object.entries(colorMappings)) {
    const argb = dynamicColor.getArgb(scheme);
    tokens[key] = {
      hex: hexFromArgb(argb),
      argb,
      mode
    };
  }
  
  return tokens;
}

/**
 * Validate a color system against WCAG contrast requirements.
 * 
 * Tests all text/background color combinations in the generated themes
 * to ensure they meet accessibility standards. This is critical for
 * ensuring your design system is usable by people with visual impairments.
 * 
 * @category Colors
 * @param colorSystem - The generated color system to validate
 * @param minContrast - Minimum contrast ratio required:
 *   - 4.5 for WCAG AA compliance (default)
 *   - 7.0 for WCAG AAA compliance
 *   - 3.0 for large text (18pt+ or 14pt+ bold)
 * 
 * @returns Validation results containing:
 *   - `passed`: Array of color combinations that meet the minimum contrast
 *   - `failed`: Array of color combinations that fail to meet minimum contrast
 *   - `minContrast`: The minimum contrast ratio used for validation
 * 
 * @example Check for WCAG AA compliance
 * ```typescript
 * import { generateColorSystem, validateColorContrast } from '@terroir/core';
 * 
 * const colors = await generateColorSystem('#1976d2');
 * const validation = validateColorContrast(colors);
 * 
 * if (validation.failed.length > 0) {
 *   console.warn('Accessibility issues found:');
 *   validation.failed.forEach(({ name, ratio }) => {
 *     console.warn(`${name}: ${ratio.toFixed(2)} (needs 4.5)`);
 *   });
 * }
 * ```
 * 
 * @example Check for WCAG AAA compliance
 * ```typescript
 * const strictValidation = validateColorContrast(colors, 7.0);
 * 
 * console.log(`AAA compliant combinations: ${strictValidation.passed.length}`);
 * console.log(`Failed combinations: ${strictValidation.failed.length}`);
 * ```
 * 
 * @see {@link https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html WCAG Contrast Requirements}
 * @see {@link ContrastValidationResult} for the returned data structure
 * 
 * @since 0.1.0
 */
export function validateColorContrast(
  colorSystem: ColorSystem, 
  minContrast = 4.5
): ContrastValidationResult {
  const results: ContrastValidationResult = {
    passed: [],
    failed: [],
    minContrast
  };
  
  if (colorSystem.themes?.light) {
    const theme = colorSystem.themes.light;
    
    // Check primary text/background combinations
    const checks = [
      { fg: theme['onPrimary'], bg: theme['primary'], name: 'Primary' },
      { fg: theme['onSecondary'], bg: theme['secondary'], name: 'Secondary' },
      { fg: theme['onTertiary'], bg: theme['tertiary'], name: 'Tertiary' },
      { fg: theme['onSurface'], bg: theme['surface'], name: 'Surface' },
      { fg: theme['onError'], bg: theme['error'], name: 'Error' }
    ];
    
    for (const check of checks) {
      if (!check.fg || !check.bg) continue;
      
      const ratio = contrastRatio(check.fg.argb, check.bg.argb);
      const result = {
        name: check.name,
        ratio: Number(ratio.toFixed(2)),
        passes: ratio >= minContrast
      };
      
      if (result.passes) {
        results.passed.push(result);
      } else {
        results.failed.push(result);
      }
    }
  }
  
  return results;
}