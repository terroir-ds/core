# Advanced Design System Testing & Color Generation

## Part 1: Additional Testing & Visual Assets

### 1. **Typography Testing**

```javascript
// Test font loading and metrics
async function testTypography() {
  const fonts = tokens.typography.families;

  // Font loading test
  await Promise.all(
    fonts.map(async (font) => {
      const loaded = await document.fonts.load(font);
      assert(loaded.length > 0, `Font ${font} failed to load`);
    })
  );

  // Line height readability
  tokens.typography.sizes.forEach((size) => {
    const lineHeightRatio = size.lineHeight / size.fontSize;
    assert(lineHeightRatio >= 1.2, `Line height too tight for ${size.name}`);
  });
}
```

### 2. **Spacing Consistency Testing**

```javascript
// Validate spacing scale follows consistent ratios
function testSpacingScale() {
  const spacings = Object.values(tokens.spacing);
  const baseUnit = spacings[0];

  spacings.forEach((space, i) => {
    if (i > 0) {
      const ratio = space / spacings[i - 1];
      // Check if follows a consistent scale (e.g., 1.5x)
      assert(ratio >= 1.25 && ratio <= 2, `Inconsistent spacing scale`);
    }
  });
}
```

### 3. **Animation Performance Testing**

```javascript
// Test animation tokens for performance
function testAnimations() {
  tokens.motion.transitions.forEach((transition) => {
    // Ensure animations aren't too long
    assert(transition.duration <= 1000, `Animation too long: ${transition.name}`);

    // Prefer transform/opacity for performance
    if (transition.properties.includes('width') || transition.properties.includes('height')) {
      console.warn(`Performance warning: ${transition.name} animates layout properties`);
    }
  });
}
```

### 4. **Icon Consistency Testing**

```javascript
// Validate SVG icons follow design guidelines
async function testIcons() {
  const icons = await glob('assets/icons/*.svg');

  for (const iconPath of icons) {
    const svg = await fs.readFile(iconPath, 'utf-8');
    const $ = cheerio.load(svg);

    // Check viewBox is consistent (24x24 or 48x48)
    const viewBox = $('svg').attr('viewBox');
    assert(
      viewBox === '0 0 24 24' || viewBox === '0 0 48 48',
      `Non-standard viewBox in ${iconPath}`
    );

    // Ensure no hardcoded colors (should use currentColor)
    assert(
      !svg.includes('fill="#') || svg.includes('fill="currentColor"'),
      `Hardcoded color in ${iconPath}`
    );
  }
}
```

### 5. **Focus Indicator Testing**

```javascript
// Ensure all interactive elements have visible focus states
async function testFocusIndicators(page) {
  const interactiveElements = ['button', 'a', 'input', 'select', 'textarea'];

  for (const selector of interactiveElements) {
    await page.focus(selector);
    const focusStyle = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      const styles = getComputedStyle(el);
      return {
        outline: styles.outline,
        boxShadow: styles.boxShadow,
        border: styles.border,
      };
    }, selector);

    // Ensure some visual focus indicator exists
    assert(
      focusStyle.outline !== 'none' ||
        focusStyle.boxShadow !== 'none' ||
        focusStyle.border !== 'none',
      `No focus indicator for ${selector}`
    );
  }
}
```

## Part 2: Advanced Color Generation (Best-in-Class Approach)

### Material Color Utilities (Recommended for 2024)

Google's Material Color Utilities (MCU) provides the most sophisticated color generation system available:

```javascript
// design-system/scripts/color-generator.js
import {
  argbFromHex,
  hexFromArgb,
  TonalPalette,
  CorePalette,
  Contrast,
  themeFromSourceColor,
  DynamicScheme,
  MaterialDynamicColors,
  Blend,
} from '@material/material-color-utilities';

class MaterialColorSystemGenerator {
  constructor(brandColor, options = {}) {
    this.sourceColor = argbFromHex(brandColor);
    this.contrastLevel = options.contrastLevel || 0; // -1 to 1
    this.variant = options.variant || 'tonalSpot'; // tonalSpot, content, monochrome, etc
  }

  /**
   * Generate a complete color system using Material Color Utilities
   * Provides continuous tone access (0-100) for maximum flexibility
   */
  generateSystem() {
    const palette = CorePalette.of(this.sourceColor);
    const theme = themeFromSourceColor(this.sourceColor, {
      variant: this.variant,
      contrastLevel: this.contrastLevel,
    });

    return {
      // Core palettes with continuous tone access
      palettes: {
        primary: this.extractTonalPalette(palette.a1),
        secondary: this.extractTonalPalette(palette.a2),
        tertiary: this.extractTonalPalette(palette.a3),
        neutral: this.extractTonalPalette(palette.n1),
        neutralVariant: this.extractTonalPalette(palette.n2),
        error: this.extractTonalPalette(palette.error),
      },

      // Pre-calculated schemes with guaranteed accessibility
      schemes: {
        light: this.extractSchemeTokens(theme.schemes.light),
        dark: this.extractSchemeTokens(theme.schemes.dark),
      },

      // Custom tones for specific needs
      custom: this.generateCustomTones(palette),
    };
  }

  /**
   * Extract tonal palette with both standard and continuous access
   */
  extractTonalPalette(tonalPalette) {
    const palette = {
      // Standard Material tones
      tones: {},
      // Mapped to traditional scale
      scale: {},
      // Direct tone access function
      tone: (value) => hexFromArgb(tonalPalette.tone(value)),
    };

    // Material standard tones
    const materialTones = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100];
    materialTones.forEach((tone) => {
      palette.tones[tone] = hexFromArgb(tonalPalette.tone(tone));
    });

    // Map to traditional naming (50-900)
    const scaleMapping = {
      50: 95, // Lightest
      100: 90,
      200: 80,
      300: 70,
      400: 60,
      500: 40, // Primary tone
      600: 30,
      700: 20,
      800: 10,
      900: 0, // Darkest
    };

    Object.entries(scaleMapping).forEach(([scale, tone]) => {
      palette.scale[scale] = {
        value: hexFromArgb(tonalPalette.tone(tone)),
        tone: tone,
        // Include WCAG contrast info
        contrast: {
          onLight: Contrast.ratio(tonalPalette.tone(tone), tonalPalette.tone(100)),
          onDark: Contrast.ratio(tonalPalette.tone(tone), tonalPalette.tone(0)),
        },
      };
    });

    return palette;
  }

  /**
   * Extract scheme tokens with semantic naming
   */
  extractSchemeTokens(scheme) {
    return {
      // Background colors
      background: hexFromArgb(scheme.background),
      surface: hexFromArgb(scheme.surface),
      surfaceVariant: hexFromArgb(scheme.surfaceVariant),
      surfaceTint: hexFromArgb(scheme.surfaceTint),

      // Primary colors
      primary: hexFromArgb(scheme.primary),
      primaryContainer: hexFromArgb(scheme.primaryContainer),
      onPrimary: hexFromArgb(scheme.onPrimary),
      onPrimaryContainer: hexFromArgb(scheme.onPrimaryContainer),

      // Secondary colors
      secondary: hexFromArgb(scheme.secondary),
      secondaryContainer: hexFromArgb(scheme.secondaryContainer),
      onSecondary: hexFromArgb(scheme.onSecondary),
      onSecondaryContainer: hexFromArgb(scheme.onSecondaryContainer),

      // Tertiary colors
      tertiary: hexFromArgb(scheme.tertiary),
      tertiaryContainer: hexFromArgb(scheme.tertiaryContainer),
      onTertiary: hexFromArgb(scheme.onTertiary),
      onTertiaryContainer: hexFromArgb(scheme.onTertiaryContainer),

      // Semantic colors
      error: hexFromArgb(scheme.error),
      errorContainer: hexFromArgb(scheme.errorContainer),
      onError: hexFromArgb(scheme.onError),
      onErrorContainer: hexFromArgb(scheme.onErrorContainer),

      // Surface colors
      onBackground: hexFromArgb(scheme.onBackground),
      onSurface: hexFromArgb(scheme.onSurface),
      onSurfaceVariant: hexFromArgb(scheme.onSurfaceVariant),

      // Other
      outline: hexFromArgb(scheme.outline),
      outlineVariant: hexFromArgb(scheme.outlineVariant),
      shadow: hexFromArgb(scheme.shadow),
      scrim: hexFromArgb(scheme.scrim),
      inverseSurface: hexFromArgb(scheme.inverseSurface),
      inverseOnSurface: hexFromArgb(scheme.inverseOnSurface),
      inversePrimary: hexFromArgb(scheme.inversePrimary),
    };
  }

  /**
   * Generate custom tones for specific design needs
   */
  generateCustomTones(palette) {
    return {
      // Example: Find exact tone for AA compliance on white
      primaryOnWhite: this.findAccessibleTone(palette.a1, 0xffffffff, 4.5),

      // Example: Brand color variations
      brand: {
        subtle: palette.a1.tone(95),
        light: palette.a1.tone(87),
        DEFAULT: palette.a1.tone(47), // Custom mid-tone
        dark: palette.a1.tone(23),
        intense: palette.a1.tone(15),
      },

      // Example: Status colors with custom tones
      status: {
        success: {
          light: palette.a2.tone(92),
          DEFAULT: palette.a2.tone(45),
          dark: palette.a2.tone(25),
        },
        warning: {
          light: palette.a3.tone(93),
          DEFAULT: palette.a3.tone(50),
          dark: palette.a3.tone(30),
        },
      },
    };
  }

  /**
   * Find the exact tone that meets a target contrast ratio
   */
  findAccessibleTone(tonalPalette, background, targetRatio) {
    let bestTone = 0;
    let bestDiff = Infinity;

    // Binary search for efficiency
    for (let tone = 0; tone <= 100; tone++) {
      const ratio = Contrast.ratio(tonalPalette.tone(tone), background);
      const diff = Math.abs(ratio - targetRatio);

      if (diff < bestDiff) {
        bestDiff = diff;
        bestTone = tone;
      }

      // Close enough
      if (diff < 0.1) break;
    }

    return {
      tone: bestTone,
      hex: hexFromArgb(tonalPalette.tone(bestTone)),
      ratio: Contrast.ratio(tonalPalette.tone(bestTone), background),
    };
  }
}

// Usage
const brandColor = '#0066cc';
const generator = new MaterialColorSystemGenerator(brandColor, {
  contrastLevel: 0.5, // Increase contrast for accessibility
  variant: 'tonalSpot', // Material You variant
});

const colorSystem = generator.generateSystem();

// Access any tone (0-100)
console.log(colorSystem.palettes.primary.tone(47)); // Custom tone
console.log(colorSystem.palettes.primary.tone(23.5)); // Rounds to nearest

// Export as Style Dictionary tokens
export function generateColorTokens(brandColor, options = {}) {
  const generator = new MaterialColorSystemGenerator(brandColor, options);
  const system = generator.generateSystem();

  return {
    color: {
      // Use the pre-calculated schemes for consistency
      ...system.schemes.light,

      // Add palette access for flexibility
      palette: {
        primary: system.palettes.primary.scale,
        secondary: system.palettes.secondary.scale,
        tertiary: system.palettes.tertiary.scale,
        neutral: system.palettes.neutral.scale,
        error: system.palettes.error.scale,
      },

      // Custom tokens
      custom: system.custom,
    },
  };
}
```

### Key Benefits of Material Color Utilities

1. **HCT Color Space**: Google's proprietary space provides better perceptual uniformity than even LCH
2. **Continuous Tone Scale (0-100)**: Access any tone value, not just fixed steps
3. **Guaranteed Accessibility**: Pre-calculated contrast ratios and accessible color pairs
4. **Automatic Harmony**: Secondary and tertiary colors mathematically complement the primary
5. **Battle-tested**: Powers billions of Android devices through Material You
6. **Dynamic Theming**: Supports user preference adaptation and wallpaper extraction
7. **Variant Support**: Multiple schemes (TonalSpot, Vibrant, Expressive, etc.)

### Continuous Tone Access Examples

```javascript
// Access any tone from 0 (black) to 100 (white)
const palette = colorSystem.palettes.primary;

// Standard tones
console.log(palette.tone(40)); // Primary brand color
console.log(palette.tone(90)); // Light variant

// Custom tones for specific needs
console.log(palette.tone(47)); // Custom mid-tone
console.log(palette.tone(23.5)); // Precise tone (rounds to 24)
console.log(palette.tone(87)); // In-between shade

// Find exact tone for contrast requirement
const accessibleTone = findAccessibleTone(palette, backgroundArgb, 4.5);
console.log(`Use tone ${accessibleTone.tone} for AA compliance`);
```

### Implementation Strategy

```javascript
// design-system/config/color-config.js
export default {
  // Define only brand colors
  sources: {
    brand: '#0066cc',
    // MCU will generate harmonious secondary/tertiary
  },

  // Generation rules
  generation: {
    method: 'material-color-utilities',
    options: {
      variant: 'tonalSpot', // or 'vibrant', 'expressive', 'content', 'monochrome'
      contrastLevel: 0.5, // -1 (less) to 1 (more) contrast
    },
    customTones: {
      // Define any custom tone needs
      brand: [47, 87], // Additional brand tones
      subtle: [92, 95, 98], // Very light tones
    },
  },

  // Override specific generated colors if needed
  overrides: {
    'primary.500': '#0066cc',
    'custom.brand.DEFAULT': { tone: 47 },
  },
};
```

### Build Integration

```json
{
  "scripts": {
    "design:generate": "node design-system/scripts/generate-colors.js",
    "design:test:colors": "node design-system/scripts/test-color-generation.js",
    "design:preview": "node design-system/scripts/preview-server.js"
  }
}
```

### Why MCU is Best-in-Class

1. **Google Scale Testing**: Validated across billions of devices and applications
2. **Mathematical Harmony**: Colors are calculated to work together, not just "look nice"
3. **Accessibility First**: Every color pair is tested for contrast compliance
4. **Continuous Scale**: Any tone from 0-100, not limited to 10 steps
5. **Future Evolution**: Google actively improves the algorithms based on user research
6. **Cross-Platform**: Same system works for web, mobile, and even print

### Integration with Design Tools

```javascript
// Export for Figma Tokens plugin
function exportForFigma(colorSystem) {
  const figmaTokens = {};

  Object.entries(colorSystem.palettes).forEach(([name, palette]) => {
    figmaTokens[name] = {};

    // Export specific tones Figma designers need
    [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100].forEach((tone) => {
      figmaTokens[name][tone] = {
        value: palette.tone(tone),
        type: 'color',
      };
    });
  });

  return figmaTokens;
}
```

This approach gives you:

- A complete color system from minimal input
- Guaranteed accessibility with continuous tone adjustment
- Consistent visual relationships based on color science
- Modern HCT color space (better than LCH)
- Automatic dark mode with proper contrast
- Flexibility to use any tone value (0-100) for precise needs
