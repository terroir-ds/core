#!/usr/bin/env node

/**
 * @module scripts/generate-colors
 * 
 * Color token generation script for the Terroir Core Design System.
 * 
 * Generates a complete color system from brand colors using Material Color
 * Utilities. Creates perceptually uniform color palettes with continuous
 * tone scales (0-100) and validates WCAG contrast requirements. The output
 * is formatted for Style Dictionary consumption.
 * 
 * @example Run color generation
 * ```bash
 * pnpm generate:colors
 * # or
 * node scripts/generate-colors.js
 * ```
 * 
 * Features:
 * - Reads brand color from tokens/base/color.json
 * - Generates primary, secondary, tertiary, neutral, and error palettes
 * - Creates light and dark theme schemes
 * - Validates WCAG AA contrast ratios
 * - Outputs Style Dictionary formatted tokens
 * 
 * Output:
 * - tokens/generated/colors.json - Generated color tokens
 * 
 * Exit codes:
 * - 0: Success
 * - 1: Generation failed
 */

import { generateColorSystem } from '@colors/index.js';
import { logger, logStart, logSuccess, measureTime } from '@utils/logger/index.js';
import fs from 'fs/promises';
import path from 'path';

/** @typedef {import('@colors/index.js').ColorSystem} ColorSystem */

// Read brand color from tokens
async function getBrandColor() {
  try {
    const colorTokens = await fs.readFile(
      path.join(process.cwd(), 'tokens/base/color.json'),
      'utf-8'
    );
    const tokens = JSON.parse(colorTokens);
    return tokens.color.brand.primary.value;
  } catch {
    logger.warn('No brand color found in tokens, using default #1976d2');
    return '#1976d2';
  }
}

/**
 * Convert color system to Style Dictionary format
 * @param {ColorSystem} colorSystem - Generated color system
 * @returns {Object} Style Dictionary formatted tokens
 */
function toStyleDictionaryFormat(colorSystem) {
  /** @type {any} */
  const tokens = {
    color: {
      // Convert palettes to token format
      primary: {},
      secondary: {},
      tertiary: {},
      neutral: {},
      neutralVariant: {},
      error: {}
    }
  };
  
  // Process each palette
  for (const [paletteName, palette] of Object.entries(colorSystem.palettes)) {
    const tokenKey = paletteName === 'neutralVariant' ? 'neutralVariant' : paletteName;
    
    for (const [tone, data] of Object.entries(palette.tones)) {
      // @ts-ignore - dynamic key access
      tokens.color[tokenKey][tone] = {
        value: data.hex,
        type: 'color',
        description: `${palette.name} - Tone ${tone}`,
        attributes: {
          tone: parseInt(tone),
          contrastWhite: data.contrast.white,
          contrastBlack: data.contrast.black
        }
      };
    }
  }
  
  // Add theme tokens if available
  if (colorSystem.themes) {
    tokens.schemes = {
      light: {},
      dark: {}
    };
    
    for (const [mode, theme] of Object.entries(colorSystem.themes)) {
      for (const [key, data] of Object.entries(theme)) {
        tokens.schemes[mode][key] = {
          value: data.hex,
          type: 'color',
          description: `${mode} theme - ${key}`
        };
      }
    }
  }
  
  return tokens;
}

// Main generation function
async function main() {
  await measureTime(
    'color generation pipeline',
    async () => {
      logStart('color token generation');
      
      // Get brand color
      const brandColor = await getBrandColor();
      logger.info({ brandColor }, 'Using brand color');
      
      // Generate color system
      const colorSystem = await generateColorSystem({
        source: brandColor,
        contrastLevel: 0.5, // Slightly higher contrast for accessibility
        variant: 'tonalSpot'
      });
      
      // Convert to Style Dictionary format
      const tokens = toStyleDictionaryFormat(colorSystem);
      
      // Ensure output directory exists
      const outputDir = path.join(process.cwd(), 'tokens/generated');
      await fs.mkdir(outputDir, { recursive: true });
      
      // Write tokens
      const outputPath = path.join(outputDir, 'colors.json');
      await fs.writeFile(
        outputPath,
        JSON.stringify(tokens, null, 2)
      );
      
      logger.info({ outputPath }, 'Wrote color tokens');
      
      // Validate contrast ratios
      const { validateColorContrast } = await import('@colors/index.js');
      const validation = validateColorContrast(colorSystem);
      
      if (validation.failed.length > 0) {
        logger.warn(
          { failed: validation.failed },
          `${validation.failed.length} color combinations failed WCAG AA contrast requirements`
        );
      } else {
        logger.info('All color combinations pass WCAG AA contrast requirements');
      }
      
      logSuccess('color token generation');
    }
  );
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error({ err: error }, 'Failed to generate color tokens');
    process.exit(1);
  });
}