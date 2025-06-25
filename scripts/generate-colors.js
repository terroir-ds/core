#!/usr/bin/env node

import { 
  argbFromHex,
  hexFromArgb,
  TonalPalette,
  CorePalette,
  Contrast,
  themeFromSourceColor
} from '@material/material-color-utilities';
import fs from 'fs/promises';
import path from 'path';

// Read brand color from tokens
async function getBrandColor() {
  const colorTokens = await fs.readFile(
    path.join(process.cwd(), 'tokens/base/color.json'),
    'utf-8'
  );
  const tokens = JSON.parse(colorTokens);
  return tokens.color.brand.primary.value;
}

// Generate color system
async function generateColors() {
  console.log('🎨 Generating color system...');
  
  const brandColor = await getBrandColor();
  const sourceColor = argbFromHex(brandColor);
  
  // Generate palettes
  const palette = CorePalette.of(sourceColor);
  const theme = themeFromSourceColor(sourceColor);
  
  // Create token structure
  const colorTokens = {
    color: {
      // Primary palette
      primary: generateTonalScale(palette.a1, 'Primary color family'),
      
      // Secondary palette
      secondary: generateTonalScale(palette.a2, 'Secondary color family'),
      
      // Tertiary palette
      tertiary: generateTonalScale(palette.a3, 'Tertiary color family'),
      
      // Neutral palette
      neutral: generateTonalScale(palette.n1, 'Neutral color family'),
      
      // Neutral variant palette
      neutralVariant: generateTonalScale(palette.n2, 'Neutral variant color family'),
      
      // Error palette
      error: generateTonalScale(palette.error, 'Error color family'),
      
      // Surface colors (from theme)
      surface: {
        default: {
          value: hexFromArgb(theme.schemes.light.surface),
          description: 'Default surface color',
          type: 'color'
        },
        variant: {
          value: hexFromArgb(theme.schemes.light.surfaceVariant),
          description: 'Surface variant color',
          type: 'color'
        },
        inverse: {
          value: hexFromArgb(theme.schemes.light.inverseSurface),
          description: 'Inverse surface color',
          type: 'color'
        }
      }
    }
  };
  
  // Write generated colors
  await fs.writeFile(
    path.join(process.cwd(), 'tokens/generated/colors.json'),
    JSON.stringify(colorTokens, null, 2)
  );
  
  console.log('✅ Color system generated successfully!');
}

// Generate tonal scale for a palette
function generateTonalScale(tonalPalette, description) {
  const scale = {};
  const tones = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100];
  
  tones.forEach(tone => {
    scale[tone] = {
      value: hexFromArgb(tonalPalette.tone(tone)),
      description: `${description} - Tone ${tone}`,
      type: 'color',
      attributes: {
        tone,
        contrastOnWhite: Contrast.ratio(tonalPalette.tone(tone), 0xFFFFFFFF),
        contrastOnBlack: Contrast.ratio(tonalPalette.tone(tone), 0xFF000000)
      }
    };
  });
  
  return scale;
}

// Ensure output directory exists
async function ensureOutputDir() {
  const dir = path.join(process.cwd(), 'tokens/generated');
  await fs.mkdir(dir, { recursive: true });
}

// Run generation
ensureOutputDir()
  .then(() => generateColors())
  .catch(console.error);