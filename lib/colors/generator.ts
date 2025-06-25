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
import { createLogger } from '../utils/logger.js';
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
 * Generate a complete color system from a source color
 * 
 * @param sourceOrOptions - Hex color or options object
 * @returns Generated color system with palettes and themes
 * 
 * @example
 * // Simple usage with hex color
 * const colors = await generateColorSystem('#1976d2');
 * 
 * @example
 * // Advanced usage with options
 * const colors = await generateColorSystem({
 *   source: '#1976d2',
 *   contrastLevel: 0.5,
 *   variant: 'vibrant'
 * });
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
 * Generate a single tonal palette from a hex color
 * 
 * @param hexColor - Source hex color
 * @param tones - Tone values to generate
 * @returns Tonal palette with specified tones
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
 * Extract dominant color from an image
 * (Placeholder - will be implemented with image processing)
 * 
 * @param _image - Image path or buffer
 * @returns Dominant color as hex
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
 * Validate color system against WCAG contrast requirements
 * 
 * @param colorSystem - Generated color system
 * @param minContrast - Minimum contrast ratio (4.5 for AA, 7 for AAA)
 * @returns Validation results with passing/failing combinations
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