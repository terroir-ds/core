#!/usr/bin/env node
/* eslint-env node */

/**
 * Generate Material Design 3 color palettes from brand colors
 * Uses Material Color Utilities to create scientifically-derived color systems
 */

import { argbFromHex, themeFromSourceColor, hexFromArgb } from '@material/material-color-utilities';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import pino from 'pino';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Initialize logger
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
});

/**
 * Load brand colors from token file
 */
async function loadBrandColors() {
  const tokenPath = join(projectRoot, 'tokens/base/color.jsonc');
  logger.info({ path: tokenPath }, 'Loading brand colors');
  
  try {
    const content = await readFile(tokenPath, 'utf-8');
    // Remove JSONC comments
    const jsonContent = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const tokens = JSON.parse(jsonContent);
    
    return {
      primary: tokens.color.brand.primary.$value,
      secondary: tokens.color.brand.secondary.$value,
      tertiary: tokens.color.brand.tertiary.$value,
      error: tokens.color.semantic.error.$value,
      warning: tokens.color.semantic.warning.$value,
      success: tokens.color.semantic.success.$value,
      info: tokens.color.semantic.info.$value,
    };
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to load brand colors');
    throw error;
  }
}

/**
 * Generate tonal palette for a color
 * Returns values for tones 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100
 */
function generateTonalPalette(hexColor) {
  const argb = argbFromHex(hexColor);
  const theme = themeFromSourceColor(argb);
  
  // Get the tonal palette
  const palette = theme.palettes.primary;
  
  // Standard Material Design 3 tone values
  const tones = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100];
  const tonalPalette = {};
  
  for (const tone of tones) {
    tonalPalette[tone] = hexFromArgb(palette.tone(tone));
  }
  
  return tonalPalette;
}

/**
 * Generate complete Material Design 3 theme
 */
function generateMaterialTheme(brandColors) {
  const argb = argbFromHex(brandColors.primary);
  // themeFromSourceColor doesn't accept custom colors in v0.3.0
  // We'll generate the theme from primary and get individual palettes
  const theme = themeFromSourceColor(argb);
  
  // Extract all color schemes
  const schemes = {
    light: theme.schemes.light,
    dark: theme.schemes.dark,
  };
  
  // Convert ARGB values to hex
  const convertedSchemes = {};
  
  for (const [schemeName, scheme] of Object.entries(schemes)) {
    convertedSchemes[schemeName] = {};
    for (const [key, value] of Object.entries(scheme.toJSON())) {
      convertedSchemes[schemeName][key] = hexFromArgb(value);
    }
  }
  
  return {
    palettes: {
      primary: generateTonalPalette(brandColors.primary),
      secondary: generateTonalPalette(brandColors.secondary),
      tertiary: generateTonalPalette(brandColors.tertiary),
      error: generateTonalPalette(brandColors.error),
      success: generateTonalPalette(brandColors.success),
      warning: generateTonalPalette(brandColors.warning),
      info: generateTonalPalette(brandColors.info),
      neutral: generateTonalPalette('#6e6e6e'), // Neutral palette
      neutralVariant: generateTonalPalette('#6e6e6e'), // Neutral variant
    },
    schemes: convertedSchemes,
  };
}

/**
 * Generate Material color tokens file
 */
async function generateMaterialColorTokens(theme) {
  const outputPath = join(projectRoot, 'tokens/generated/material-colors.jsonc');
  
  const tokens = {
    $description: 'Material Design 3 color tokens generated from brand colors',
    color: {
      material: {
        $description: 'Material Design 3 color system',
        
        // Tonal palettes
        palettes: {
          $description: 'Tonal palettes for each color role',
          ...Object.entries(theme.palettes).reduce((acc, [name, palette]) => {
            acc[name] = {
              $description: `${name} color tonal palette`,
              ...Object.entries(palette).reduce((toneAcc, [tone, value]) => {
                toneAcc[tone] = {
                  $value: value,
                  $type: 'color',
                  $description: `${name} tone ${tone}`,
                };
                return toneAcc;
              }, {}),
            };
            return acc;
          }, {}),
        },
        
        // Light and dark schemes
        schemes: {
          $description: 'Complete color schemes for light and dark themes',
          light: {
            $description: 'Light theme color scheme',
            ...Object.entries(theme.schemes.light).reduce((acc, [key, value]) => {
              acc[key] = {
                $value: value,
                $type: 'color',
                $description: `Light theme ${key}`,
              };
              return acc;
            }, {}),
          },
          dark: {
            $description: 'Dark theme color scheme',
            ...Object.entries(theme.schemes.dark).reduce((acc, [key, value]) => {
              acc[key] = {
                $value: value,
                $type: 'color',
                $description: `Dark theme ${key}`,
              };
              return acc;
            }, {}),
          },
        },
      },
    },
  };
  
  // Ensure output directory exists
  await mkdir(dirname(outputPath), { recursive: true });
  
  // Write tokens file with nice formatting
  const content = JSON.stringify(tokens, null, 2);
  await writeFile(outputPath, content, 'utf-8');
  
  logger.info({ path: outputPath }, 'Generated Material color tokens');
}

/**
 * Main execution
 */
async function main() {
  try {
    logger.info('Starting Material color generation');
    
    // Load brand colors
    const brandColors = await loadBrandColors();
    logger.info({ colors: brandColors }, 'Loaded brand colors');
    
    // Generate Material theme
    const theme = generateMaterialTheme(brandColors);
    logger.info('Generated Material Design 3 theme');
    
    // Write tokens file
    await generateMaterialColorTokens(theme);
    
    logger.info('Material color generation complete');
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Failed to generate Material colors');
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}