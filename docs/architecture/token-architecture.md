# Design Token Architecture

## Token Organization Strategy

### 1. **Multi-Tier Token Structure** (Best Practice)

We use a three-tier token system that's compatible with Style Dictionary, Figma Tokens plugin, and WCAG standards:

```
tokens/
├── tier-1-primitives/      # Raw values (colors, numbers)
│   ├── colors.json         # Raw color palette
│   ├── dimensions.json     # Raw spacing/sizing values
│   └── typography.json     # Raw font values
├── tier-2-semantic/        # Semantic aliases
│   ├── colors.json         # semantic.color.primary, etc.
│   ├── spacing.json        # semantic.spacing.page-margin
│   └── typography.json     # semantic.font.heading
└── tier-3-component/       # Component-specific
    ├── button.json         # component.button.background
    └── card.json           # component.card.shadow
```

### 2. **Token Naming Convention**

Use dot notation with clear hierarchy:

```json
{
  "color": {
    "primitive": {
      "blue": {
        "50": { "value": "#eff6ff" },
        "500": { "value": "#3b82f6" },
        "900": { "value": "#1e3a8a" }
      }
    }
  },
  "semantic": {
    "color": {
      "primary": { "value": "{color.primitive.blue.500}" },
      "primary-hover": { "value": "{color.primitive.blue.600}" }
    }
  }
}
```

### 3. **File Format Strategy**

```javascript
// config/tokens.config.js
module.exports = {
  // Use JSON for maximum compatibility
  format: 'json',

  // But support JSON5 comments in source files
  parsers: [
    {
      pattern: /\.json5$/,
      parse: ({ contents }) => JSON5.parse(contents),
    },
  ],

  // Transform to standard formats
  platforms: {
    css: {
      transformGroup: 'css',
      files: [
        {
          format: 'css/variables',
          destination: 'variables.css',
        },
      ],
    },
    js: {
      transformGroup: 'js',
      files: [
        {
          format: 'javascript/es6',
          destination: 'tokens.js',
        },
      ],
    },
    figma: {
      transformGroup: 'figma',
      files: [
        {
          format: 'json/flat', // Figma Tokens plugin format
          destination: 'figma-tokens.json',
        },
      ],
    },
  },
};
```

### 4. **WCAG Compliance Structure**

Organize tokens to support WCAG contrast checking:

```json
{
  "color": {
    "text": {
      "primary": {
        "value": "{color.primitive.gray.900}",
        "onBackground": "light", // WCAG metadata
        "contrastRatio": {
          "light": "13.5:1",
          "dark": "1.2:1"
        }
      }
    }
  }
}
```

### 5. **Theme Organization**

```
tokens/
├── global/           # Shared across all themes
│   ├── spacing.json
│   ├── typography.json
│   └── shadows.json
├── themes/
│   ├── light/
│   │   └── colors.json
│   └── dark/
│       └── colors.json
└── brands/          # Multi-brand support
    ├── default/
    └── enterprise/
```

### 6. **Tooling Compatibility Matrix**

| Tool              | Format     | Structure      | Notes                    |
| ----------------- | ---------- | -------------- | ------------------------ |
| Style Dictionary  | JSON/JSON5 | Nested objects | Native support           |
| Figma Tokens      | JSON       | Flat or nested | Use `$` prefix for Figma |
| Tokens Studio     | JSON       | W3C Draft spec | New standard emerging    |
| Theo (Salesforce) | JSON/YAML  | Custom         | Transform needed         |

### 7. **Conversion Strategy**

```javascript
// scripts/transform-tokens.js
const transforms = {
  // Style Dictionary → Figma Tokens
  toFigma: (tokens) => {
    return flattenTokens(tokens, '$');
  },

  // Figma Tokens → Style Dictionary
  fromFigma: (tokens) => {
    return nestTokens(tokens, '.');
  },

  // Support W3C Design Tokens spec (future)
  toW3C: (tokens) => {
    return {
      $schema: 'https://design-tokens.w3c.org/draft-1',
      tokens: tokens,
    };
  },
};
```

### 8. **Best Practices**

1. **Source of Truth**: Keep Style Dictionary format as source
2. **Build Pipeline**: Transform to other formats as needed
3. **Validation**: JSON Schema for token structure
4. **Documentation**: Auto-generate from token descriptions
5. **Version Control**: Semantic versioning for token changes

### 9. **Migration Path**

When standards evolve:

- Keep transformation layer separate
- Version your token schema
- Maintain backwards compatibility
- Use feature flags for new formats

This approach ensures:

- ✅ Style Dictionary native support
- ✅ Figma Tokens plugin compatibility
- ✅ WCAG compliance tracking
- ✅ Future W3C spec readiness
- ✅ Multi-theme/brand support
- ✅ Easy plugin integration

## Asset Generation Pipeline

### Image Processing Stack

For converting SVG templates to raster formats, we use:

```javascript
// design-system/build/images.js
const pipeline = {
  // SVGO for optimization and token replacement
  process: svgo,

  // Sharp for rasterization (4-5x faster than ImageMagick)
  rasterize: sharp,

  // Optional: Puppeteer for complex SVGs with filters/gradients
  complexRender: puppeteer,

  // Post-process compression
  compress: imagemin,
};
```

### SVG Token Replacement with SVGO

```javascript
// design-system/scripts/svg-token-plugin.js
export const tokenReplacerPlugin = {
  name: 'replaceDesignTokens',
  type: 'visitor',
  params: {
    tokens: {},
  },
  fn: (ast, params) => {
    return {
      element: {
        enter: (node) => {
          // Replace tokens in all relevant attributes
          const tokenAttributes = ['fill', 'stroke', 'stop-color', 'flood-color'];

          tokenAttributes.forEach((attr) => {
            if (node.attributes[attr]?.includes('{')) {
              const tokenMatch = node.attributes[attr].match(/{([^}]+)}/);
              if (tokenMatch) {
                const tokenPath = tokenMatch[1];
                const value = getTokenValue(params.tokens, tokenPath);
                if (value) {
                  node.attributes[attr] = value;
                }
              }
            }
          });

          // Handle style attribute tokens
          if (node.attributes.style?.includes('{')) {
            node.attributes.style = node.attributes.style.replace(
              /{([^}]+)}/g,
              (match, tokenPath) => getTokenValue(params.tokens, tokenPath) || match
            );
          }
        },
      },
    };
  },
};

// Helper to resolve nested token paths
function getTokenValue(tokens, path) {
  return path.split('.').reduce((obj, key) => obj?.[key], tokens);
}
```

#### Why Sharp over ImageMagick?

- **Performance**: 4-5x faster processing
- **Memory efficient**: Streams images, uses less RAM
- **Native Node.js**: No system dependencies
- **Smaller footprint**: ~30MB vs ~200MB
- **Better web format support**: Excellent WebP, AVIF handling

### Build Tool Recommendation

**Use npm scripts with Node.js instead of Gulp** for the following reasons:

1. **Simpler maintenance**: No additional abstraction layer
2. **Better debugging**: Direct Node.js execution
3. **Faster**: No Gulp overhead
4. **Modern approach**: Gulp is less common in 2024

#### Recommended Build Structure

```javascript
// design-system/scripts/build-assets.js
import { StyleDictionary } from 'style-dictionary';
import sharp from 'sharp';
import { optimize } from 'svgo';
import fg from 'fast-glob';
import chokidar from 'chokidar';

// Build pipeline
async function buildAssets() {
  // 1. Build design tokens
  await buildTokens();

  // 2. Generate SVG variants with tokens
  await generateSVGVariants();

  // 3. Rasterize to multiple formats
  await rasterizeAssets();

  // 4. Optimize final outputs
  await optimizeAssets();
}

// Watch mode for development
function watch() {
  chokidar.watch(['tokens/**/*.json', 'assets/**/*.svg']).on('change', buildAssets);
}

// CLI
if (process.argv.includes('--watch')) {
  watch();
} else {
  buildAssets();
}
```

#### Package.json Scripts

```json
{
  "scripts": {
    "design:build": "node design-system/scripts/build-assets.js",
    "design:watch": "node design-system/scripts/build-assets.js --watch",
    "design:tokens": "style-dictionary build",
    "design:clean": "rimraf dist/design-system",
    "prebuild": "npm run design:build"
  }
}
```

#### Complete SVG Processing Pipeline

```javascript
// design-system/scripts/build-svg-assets.js
import { optimize } from 'svgo';
import sharp from 'sharp';
import { tokenReplacerPlugin } from './svg-token-plugin.js';
import * as tokens from '../dist/tokens.json';

async function generateThemedAssets(iconName, theme) {
  const template = await fs.readFile(`assets/icons/${iconName}.svg`, 'utf8');

  // 1. Process with SVGO + token replacement
  const result = optimize(template, {
    plugins: [
      'preset-default',
      {
        name: 'removeAttrs',
        params: { attrs: '(fill|stroke)' }, // Remove hardcoded colors
      },
      {
        ...tokenReplacerPlugin,
        params: {
          tokens: tokens[theme],
        },
      },
    ],
  });

  // 2. Save optimized SVG
  await fs.writeFile(`dist/icons/${iconName}-${theme}.svg`, result.data);

  // 3. Generate raster formats with Sharp
  const sizes = [16, 24, 32, 48, 64, 128];

  for (const size of sizes) {
    // PNG for maximum compatibility
    await sharp(Buffer.from(result.data))
      .resize(size, size)
      .png()
      .toFile(`dist/icons/${iconName}-${theme}-${size}.png`);

    // WebP for modern browsers
    await sharp(Buffer.from(result.data))
      .resize(size, size)
      .webp({ quality: 90 })
      .toFile(`dist/icons/${iconName}-${theme}-${size}.webp`);
  }

  // 4. Generate favicon variants
  if (iconName === 'logo') {
    await sharp(Buffer.from(result.data)).resize(32, 32).toFile(`dist/favicon-${theme}.ico`);
  }
}
```

#### SVG Template Example

```xml
<!-- assets/icons/search.svg -->
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <!-- Use design tokens for all colors -->
  <circle
    cx="11"
    cy="11"
    r="8"
    fill="none"
    stroke="{color.content.onSurface}"
    stroke-width="2"
  />
  <path
    d="M21 21l-4.35-4.35"
    stroke="{color.content.onSurface}"
    stroke-width="2"
    stroke-linecap="round"
  />
</svg>
```

### Alternative Build Tools

If you prefer a task runner:

| Tool            | Pros                     | Cons                      | Recommendation     |
| --------------- | ------------------------ | ------------------------- | ------------------ |
| **npm scripts** | Simple, no deps, fast    | Limited task composition  | ✅ **Recommended** |
| **Gulp**        | Mature, plugins, streams | Declining usage, overhead | ⚠️ Legacy projects |
| **Webpack**     | Great for bundling       | Overkill for assets       | ❌ Too complex     |
| **Turbo**       | Fast, caching, monorepo  | Learning curve            | ✅ Large projects  |
| **Nx**          | Full monorepo solution   | Heavy framework           | ✅ Enterprise      |

### Integration with CI/CD

```yaml
# .github/workflows/design-system.yml
name: Build Design System
on:
  push:
    paths:
      - 'design-system/**'
      - 'tokens/**'

jobs:
  build:
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run design:build
      - uses: actions/upload-artifact@v3
        with:
          name: design-assets
          path: dist/design-system/
```

## Testing Strategy

See [Token Testing Documentation](./token-testing.md) for comprehensive testing approach including:

- WCAG color contrast validation
- Automated accessibility testing
- Git hook integration
- Visual regression testing
- CI/CD compliance checks
