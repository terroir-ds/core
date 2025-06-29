# Complete Visual Pipeline Architecture

## 1. Web Fonts & Icon System

### Google Fonts Integration

```typescript
// design-system/config/typography.js
export const fontConfig = {
  families: {
    sans: {
      name: 'Inter',
      weights: [400, 500, 600, 700],
      variable: true,
      fallbacks: ['system-ui', '-apple-system', 'sans-serif'],
    },
    mono: {
      name: 'JetBrains Mono',
      weights: [400, 600],
      fallbacks: ['Consolas', 'Monaco', 'monospace'],
    },
  },
};
```

### Material Symbols Integration

```typescript
// design-system/config/icons.js
export const iconConfig = {
  library: '@material-symbols/web',
  variant: 'outlined', // or 'rounded', 'sharp'

  // Material Symbols variable font axes
  defaults: {
    opsz: 24,    // Optical size (20, 24, 40, 48)
    wght: 400,   // Weight (100-700)
    GRAD: 0,     // Grade (-25 to 200)
    FILL: 0      // Fill (0 or 1)
  },

  // Token-based configurations
  sizes: {
    small: { opsz: 20, wght: 400 },
    medium: { opsz: 24, wght: 400 },
    large: { opsz: 40, wght: 300 }
  },

  // State variations
  states: {
    hover: { FILL: 1 },
    active: { GRAD: 200 },
    disabled: { wght: 300 }
  }
};

// Usage in CSS
.icon {
  font-variation-settings:
    'opsz' var(--icon-opsz, 24),
    'wght' var(--icon-wght, 400),
    'GRAD' var(--icon-grad, 0),
    'FILL' var(--icon-fill, 0);
}
```

## 2. Motion & Animation Tokens

### Motion Token Structure

```yaml
// tokens/motion.json
{
  "motion": {
    "duration": {
      "instant": { "value": "100ms" },
      "fast": { "value": "200ms" },
      "normal": { "value": "300ms" },
      "slow": { "value": "500ms" },
      "deliberate": { "value": "700ms" }
    },
    "easing": {
      "standard": {
        "value": "cubic-bezier(0.4, 0, 0.2, 1)",
        "description": "Material standard easing"
      },
      "accelerate": { "value": "cubic-bezier(0.4, 0, 1, 1)" },
      "decelerate": { "value": "cubic-bezier(0, 0, 0.2, 1)" },
      "sharp": { "value": "cubic-bezier(0.4, 0, 0.6, 1)" }
    },
    "spring": {
      "default": { "value": "spring(1, 100, 10, 0)" },
      "bouncy": { "value": "spring(1, 150, 12, 0)" },
      "smooth": { "value": "spring(1, 80, 8, 0)" }
    }
  }
}
```

### Animated Loading Spinner Example

```typescript
// design-system/components/animated-spinner.js
export const spinnerAnimation = {
  svg: `
    <svg viewBox="0 0 24 24" class="spinner">
      <circle 
        cx="12" cy="12" r="10" 
        fill="none" 
        stroke="{color.primary.500}"
        stroke-width="3"
        stroke-linecap="round"
        stroke-dasharray="31.4"
        stroke-dashoffset="31.4"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="31.4;0"
          dur="{motion.duration.slow}"
          repeatCount="indefinite"
        />
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 12 12;360 12 12"
          dur="{motion.duration.deliberate}"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  `,

  // CSS alternative
  css: `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    @keyframes dash {
      to { stroke-dashoffset: 0; }
    }
    
    .spinner {
      animation: 
        spin var(--motion-duration-deliberate) linear infinite,
        dash var(--motion-duration-slow) var(--motion-easing-standard) infinite;
    }
  `,
};
```

## 3. Critical CSS Extraction

### Implementation

```typescript
// design-system/scripts/critical-css.js
import { generate } from 'critical';

async function extractCriticalCSS() {
  // Extract critical CSS for each route
  const routes = [
    { path: '/', name: 'home' },
    { path: '/dashboard', name: 'dashboard' },
    { path: '/profile', name: 'profile' }
  ];

  for (const route of routes) {
    await generate({
      base: 'dist/',
      src: `${route.path}/index.html`,
      target: {
        css: `critical/${route.name}-critical.css`,
        uncritical: `css/${route.name}-async.css`
      },

      // Viewport dimensions for above-the-fold
      dimensions: [
        { width: 375, height: 812 },   // Mobile
        { width: 768, height: 1024 },  // Tablet
        { width: 1440, height: 900 }   // Desktop
      ],

      // Include font-face declarations
      fonts: true,

      // Extract for CSS custom properties
      extract: true,

      // Inline critical CSS in HTML
      inline: true
    });
  }
}

// Usage in HTML
<head>
  <!-- Critical CSS inlined -->
  <style>{{{ critical-css }}}</style>

  <!-- Non-critical CSS loaded async -->
  <link rel="preload" href="/css/main-async.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
</head>
```

## 4. Visual Documentation Generator (with Storybook)

### Storybook Integration

```bash
// .storybook/main.js
export default {
  stories: ['../design-system/stories/**/*.stories.js', '../design-system/docs/**/*.mdx'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    'storybook-design-token',
    '@storybook/addon-measure',
    '@storybook/addon-outline',
  ],
};

// design-system/scripts/generate-stories.js
import { generateColorStory, generateTypographyStory } from './story-generators';

export async function generateTokenStories(tokens) {
  // Auto-generate color swatches
  await generateColorStory({
    title: 'Design Tokens/Colors',
    tokens: tokens.color,
    template: 'color-grid',
  });

  // Generate typography specimens
  await generateTypographyStory({
    title: 'Design Tokens/Typography',
    tokens: tokens.typography,
    template: 'type-specimen',
  });

  // Generate spacing visualizations
  await generateSpacingStory({
    title: 'Design Tokens/Spacing',
    tokens: tokens.spacing,
    template: 'spacing-blocks',
  });

  // Interactive theme switcher
  await generateThemeStory({
    title: 'Themes/Theme Switcher',
    themes: ['light', 'dark', 'high-contrast'],
  });
}
```

### Static Documentation

```typescript
// design-system/scripts/generate-visual-docs.js
export async function generateDocs() {
  const pages = {
    // Color palette with WCAG annotations
    colors: generateColorPage(tokens.color, {
      showContrast: true,
      showHex: true,
      showRGB: true,
      showHSL: true,
    }),

    // Typography with font loading metrics
    typography: generateTypePage(tokens.typography, {
      showMetrics: true,
      showLoadTime: true,
      specimens: ['alphabet', 'paragraph', 'headings'],
    }),

    // Motion gallery with previews
    motion: generateMotionPage(tokens.motion, {
      showCurves: true,
      interactive: true,
    }),
  };

  // Generate static HTML/PDF
  await generateStaticSite(pages, 'dist/docs');
}
```

## 5. Accessibility Testing Tools

### Visual Accessibility Tests

```typescript
// design-system/scripts/a11y-visual-tests.js
import { injectAxe, checkA11y } from '@axe-core/playwright';
import { test } from '@playwright/test';

// Focus order visualization
test('focus order', async ({ page }) => {
  await page.goto('/');

  // Inject focus order visualization
  await page.evaluate(() => {
    let order = 1;
    document.addEventListener(
      'focus',
      (e) => {
        const badge = document.createElement('div');
        badge.className = 'focus-order-badge';
        badge.textContent = order++;
        e.target.appendChild(badge);
      },
      true
    );
  });

  // Tab through page
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
  }

  await page.screenshot({ path: 'a11y/focus-order.png' });
});

// Color blind simulations
test('color blind modes', async ({ page }) => {
  const modes = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];

  for (const mode of modes) {
    await page.goto('/');
    await page.evaluate((m) => {
      document.documentElement.style.filter = getColorBlindFilter(m);
    }, mode);

    await page.screenshot({ path: `a11y/colorblind-${mode}.png` });
  }
});

// Touch target sizes
test('touch targets', async ({ page }) => {
  await page.goto('/');

  // Highlight small touch targets
  await page.evaluate(() => {
    const minSize = 44; // WCAG minimum
    const elements = document.querySelectorAll('a, button, [role="button"]');

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width < minSize || rect.height < minSize) {
        el.style.outline = '2px solid red';
        el.setAttribute('data-size', `${rect.width}x${rect.height}`);
      }
    });
  });

  await page.screenshot({ path: 'a11y/touch-targets.png' });
});
```

## 6. Build Artifacts & Reports

### Visual Pipeline Report

```typescript
// design-system/scripts/build-report.js
export async function generateBuildReport() {
  const report = {
    timestamp: new Date().toISOString(),

    // Token usage statistics
    tokens: {
      total: countTokens(tokens),
      used: await findUsedTokens(),
      unused: await findUnusedTokens(),
      coverage: calculateCoverage(),
    },

    // Asset metrics
    assets: {
      svgCount: countFiles('dist/icons/*.svg'),
      totalSize: getTotalSize('dist/'),
      optimization: {
        before: getSizeBeforeOptimization(),
        after: getSizeAfterOptimization(),
        saved: calculateSavings(),
      },
    },

    // Accessibility scores
    accessibility: {
      colorContrast: await testAllColorCombos(),
      focusIndicators: await testFocusVisibility(),
      motionSafety: await testReducedMotion(),
    },

    // Performance budgets
    performance: {
      criticalCSS: measureCriticalSize(),
      fontLoading: await measureFontMetrics(),
      firstPaint: estimateFirstPaint(),
    },
  };

  // Generate HTML report
  await generateHTMLReport(report, 'dist/reports/build-report.html');

  // Check budgets
  if (report.assets.totalSize > BUDGET_LIMIT) {
    console.warn('⚠️ Asset size exceeds budget!');
  }

  return report;
}
```

## 7. Version Control for Visual Changes

### Visual Diff System

```bash
// design-system/scripts/visual-versioning.js
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

export async function trackVisualChanges(v1, v2) {
  const changes = {
    colors: diffColorTokens(v1.color, v2.color),
    typography: diffTypographyTokens(v1.typography, v2.typography),
    spacing: diffSpacingTokens(v1.spacing, v2.spacing),
    screenshots: await diffScreenshots(v1.version, v2.version)
  };

  // Generate visual changelog
  const changelog = {
    version: v2.version,
    date: new Date().toISOString(),
    breaking: changes.breaking.length > 0,

    // Visual diff images
    diffs: changes.screenshots.map(s => ({
      name: s.name,
      similarity: s.similarity,
      diffImage: s.diffPath
    })),

    // Token changes
    tokens: {
      added: changes.added,
      modified: changes.modified,
      removed: changes.removed
    }
  };

  // Generate migration guide if breaking
  if (changelog.breaking) {
    await generateMigrationGuide(changes, 'MIGRATION.md');
  }

  return changelog;
}

// Git hooks integration
// .husky/pre-commit
#!/bin/sh
if git diff --cached --name-only | grep -E "tokens/.*\.json$"; then
  npm run design:snapshot
  git add design-system/snapshots/
fi
```

## Complete Pipeline Scripts

```bash
{
  "scripts": {
    // Core building
    "design:tokens": "style-dictionary build",
    "design:colors": "node design-system/scripts/generate-colors.js",
    "design:assets": "node design-system/scripts/build-svg-assets.js",

    // Fonts & Typography
    "design:fonts": "node design-system/scripts/optimize-fonts.js",

    // Documentation
    "design:docs": "npm run design:storybook && npm run design:docs:static",
    "design:storybook": "storybook build",
    "design:docs:static": "node design-system/scripts/generate-visual-docs.js",

    // Testing
    "design:test": "npm run design:test:contrast && npm run design:test:a11y",
    "design:test:contrast": "node design-system/scripts/test-contrast.js",
    "design:test:a11y": "playwright test design-system/tests/a11y",

    // Optimization
    "design:critical": "node design-system/scripts/critical-css.js",
    "design:optimize": "npm run design:critical && npm run design:fonts",

    // Reporting
    "design:report": "node design-system/scripts/build-report.js",
    "design:diff": "node design-system/scripts/visual-diff.js",

    // Version management
    "design:snapshot": "node design-system/scripts/create-snapshot.js",
    "design:changelog": "node design-system/scripts/generate-changelog.js",

    // Main commands
    "design:build": "npm run design:tokens && npm run design:colors && npm run design:assets && npm run design:optimize",
    "design:watch": "nodemon -w tokens -w assets -x 'npm run design:build'",
    "design:all": "npm run design:build && npm run design:test && npm run design:docs && npm run design:report"
  }
}
```

## 8. Design Token Linting

### Token Validation Rules

```bash
// design-system/.tokenlintrc.js
module.exports = {
  rules: {
    // Naming conventions
    'token-naming-convention': [
      'error',
      {
        pattern: '^[a-z]+(-[a-z]+)*$',
        message: 'Tokens must use kebab-case',
      },
    ],

    // Required metadata
    'token-description-required': [
      'warn',
      {
        minLength: 10,
        exclude: ['private.*'],
      },
    ],

    // Deprecation handling
    'no-deprecated-tokens': 'error',
    'deprecation-warning-format': [
      'error',
      {
        format: '@deprecated {version} - {reason}. Use {alternative} instead.',
      },
    ],

    // Value constraints
    'color-format': [
      'error',
      {
        format: 'hex',
        allowFormats: ['hex', 'rgb', 'hsl'],
      },
    ],

    // Contrast validation
    'color-contrast-pairs': [
      'error',
      {
        pattern: /^on-(.+)$/,
        requiresContrast: 4.5,
      },
    ],

    // Token relationships
    'reference-validation': 'error',
    'circular-reference-detection': 'error',

    // Documentation
    'category-description': 'warn',
    'example-required': [
      'warn',
      {
        for: ['component.*', 'semantic.*'],
      },
    ],
  },
};

// design-system/scripts/lint-tokens.js
import { TokenLinter } from './token-linter';

const linter = new TokenLinter({
  configFile: '.tokenlintrc.js',
  throwOnError: process.env.CI === 'true',
});

async function lintTokens() {
  const results = await linter.lint('tokens/**/*.json');

  if (results.errors.length > 0) {
    console.error('❌ Token linting errors:');
    results.errors.forEach((error) => {
      console.error(`  ${error.file}:${error.line} - ${error.message}`);
    });

    if (linter.config.throwOnError) {
      process.exit(1);
    }
  }

  if (results.warnings.length > 0) {
    console.warn('⚠️  Token linting warnings:');
    results.warnings.forEach((warning) => {
      console.warn(`  ${warning.file}:${warning.line} - ${warning.message}`);
    });
  }

  console.log('✅ Token linting complete');
}
```

### Custom Validation Rules

```typescript
// design-system/scripts/custom-token-rules.js
export const customRules = {
  // Ensure all interactive colors have focus states
  'interactive-focus-states': {
    test: (token, allTokens) => {
      if (token.category === 'interactive' && token.type === 'color') {
        const focusToken = allTokens.find((t) => t.name === `${token.name}-focus`);
        return !!focusToken;
      }
      return true;
    },
    message: 'Interactive colors must have corresponding focus states',
  },

  // Validate motion tokens have reasonable durations
  'motion-duration-range': {
    test: (token) => {
      if (token.type === 'duration') {
        const ms = parseInt(token.value);
        return ms >= 100 && ms <= 1000;
      }
      return true;
    },
    message: 'Animation durations should be between 100ms and 1000ms',
  },

  // Ensure proper token versioning
  'version-format': {
    test: (token) => {
      if (token.version) {
        return /^\d+\.\d+\.\d+$/.test(token.version);
      }
      return true;
    },
    message: 'Version must follow semver format (x.y.z)',
  },
};
```

### Integration with Build Pipeline

```bash
{
  "scripts": {
    "design:lint": "node design-system/scripts/lint-tokens.js",
    "design:lint:fix": "node design-system/scripts/lint-tokens.js --fix",
    "design:validate": "npm run design:lint && npm run design:test"
  },
  "husky": {
    "hooks": {
      "pre-commit": "npm run design:lint"
    }
  }
}
```

## Summary

This pipeline now covers:

- ✅ Material Symbols with variable font features
- ✅ Motion tokens with animated components
- ✅ Critical CSS for performance
- ✅ Storybook + static documentation
- ✅ Comprehensive accessibility testing
- ✅ Build metrics and reporting
- ✅ Visual version control
- ✅ Design token linting and validation

This is a world-class design system pipeline that rivals major enterprise systems! 🎯
