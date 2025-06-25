# Terroir Core Design System

## Project Overview

A comprehensive, open-source design system built with modern web standards, featuring:

- Material Color Utilities for perceptually uniform color generation
- Continuous tone scales (0-100) for precise control
- SVGO-based token replacement in SVG assets
- Automated WCAG compliance testing
- Multi-format asset generation (SVG, PNG, WebP)
- Storybook documentation
- Framework-agnostic with React components

## Architecture

```
terroir-core/
├── tokens/                    # Design token definitions
│   ├── base/                 # Core tokens (colors, spacing, etc.)
│   ├── themes/               # Theme variations (light, dark)
│   └── brands/               # Multi-brand support
├── assets/                   # Visual assets
│   ├── icons/                # SVG icon templates with token placeholders
│   ├── fonts/                # Web font files
│   └── images/               # Brand images
├── packages/                 # Published packages
│   ├── core/                 # Core tokens and utilities
│   ├── react/                # React component library
│   └── web-components/       # Framework-agnostic components
├── scripts/                  # Build and automation scripts
├── docs/                     # Documentation and Storybook
└── tests/                    # Visual regression and unit tests
```

## Technology Stack

### Core Technologies

- **Style Dictionary**: Token management and transformation
- **Material Color Utilities**: Advanced color system generation
- **SVGO**: SVG optimization and token replacement
- **Sharp**: High-performance image processing
- **TypeScript**: Type safety throughout

### Documentation & Testing

- **Storybook**: Component documentation and playground
- **Playwright**: Visual regression and accessibility testing
- **Axe-core**: Automated accessibility validation
- **Pixelmatch**: Visual diff detection

### Build Tools

- **npm workspaces**: Monorepo management
- **Rollup**: Package bundling
- **Chokidar**: File watching for development

## Key Features

### 1. **Color System Generation**

Uses Google's Material Color Utilities for scientifically-derived color palettes:

```javascript
import { MaterialColorSystemGenerator } from './scripts/color-generator';

const generator = new MaterialColorSystemGenerator('#0066cc', {
  contrastLevel: 0.5, // Increased contrast for accessibility
  variant: 'tonalSpot', // Material You variant
});

const colors = generator.generateSystem();
// Generates primary, secondary, tertiary, neutral, and error palettes
// Each with continuous tone access (0-100)
```

### 2. **Token Architecture**

Three-tier token system for maximum flexibility:

1. **Primitives**: Raw values (color.blue.500)
2. **Semantic**: Meaningful aliases (color.primary)
3. **Component**: Specific use cases (button.background.hover)

### 3. **SVG Token Replacement**

Custom SVGO plugin for dynamic theming:

```xml
<!-- Source SVG -->
<svg>
  <circle fill="{color.primary}" stroke="{color.border}"/>
</svg>

<!-- After processing -->
<svg>
  <circle fill="#0066cc" stroke="#e0e0e0"/>
</svg>
```

### 4. **Automated Testing**

- **WCAG Contrast**: Every color combination tested
- **Focus Indicators**: Automated visibility checks
- **Touch Targets**: Size validation (44x44 minimum)
- **Motion Safety**: Respects prefers-reduced-motion

### 5. **Performance Optimization**

- **Critical CSS**: Extraction for above-the-fold content
- **Font Subsetting**: Only load needed characters
- **Tree Shaking**: Eliminate unused tokens
- **Asset Optimization**: Automatic compression

## Development Workflow

### Initial Setup

```bash
pnpm install
pnpm setup           # Install dependencies, generate initial tokens
```

### Token Development

```bash
pnpm tokens:watch    # Watch mode for token changes
pnpm tokens:build    # Build all token formats
pnpm tokens:lint     # Validate token structure
```

### Asset Generation

```bash
pnpm assets:icons    # Process SVG icons with tokens
pnpm assets:images   # Generate PNG/WebP variants
pnpm assets:fonts    # Optimize web fonts
```

### Testing

```bash
pnpm test           # All tests
pnpm test:contrast  # WCAG contrast validation
pnpm test:visual    # Visual regression tests
pnpm test:a11y      # Accessibility tests
```

### Documentation

```bash
pnpm storybook:dev  # Development server
pnpm storybook:build # Static documentation
pnpm docs:generate  # API documentation
```

## Design Principles

### 1. **Accessibility First**

- Every color tested for WCAG compliance
- Focus indicators on all interactive elements
- Semantic HTML structure
- ARIA attributes where needed

### 2. **Performance Focused**

- Minimal runtime overhead
- Build-time token resolution
- Optimized asset delivery
- Progressive enhancement

### 3. **Developer Experience**

- TypeScript definitions for all tokens
- Comprehensive documentation
- Visual regression testing
- Automated releases

### 4. **Flexibility**

- Framework agnostic core
- Multiple output formats
- Themeable architecture
- Extensible components

## Token Categories

### Color Tokens

- Generated via Material Color Utilities
- Continuous tone scale (0-100)
- Automatic contrast compliance
- Theme variations (light/dark/high-contrast)

### Typography Tokens

- System font stacks
- Variable font support
- Responsive sizing
- Optimal line heights

### Spacing Tokens

- Consistent scale (4px base)
- Responsive spacing
- Component-specific overrides

### Motion Tokens

- Duration scales
- Easing functions
- Spring animations
- Reduced motion support

### Elevation Tokens

- Shadow definitions
- Layering system
- Focus rings
- Depth hierarchy

## Component Architecture

### Core Components (Planned)

- Button
- Card
- Input
- Select
- Checkbox/Radio
- Dialog
- Toast
- Tabs
- Navigation

### Component Features

- Full keyboard navigation
- ARIA compliance
- Touch-friendly targets
- Theme support
- Size variants
- State management

## Build Pipeline

### Token Processing

1. Source tokens (JSON) → Style Dictionary
2. Platform transforms (CSS, JS, Swift, Android)
3. Theme generation (light, dark, high-contrast)
4. Documentation generation

### Asset Processing

1. SVG templates → Token replacement
2. SVGO optimization
3. Sharp rasterization
4. Format generation (PNG, WebP, ICO)

### Quality Checks

1. Token linting
2. Contrast validation
3. Visual regression
4. Bundle size analysis

## Release Process

### Versioning

- Semantic versioning (major.minor.patch)
- Automated changelog generation
- Breaking change detection
- Migration guides

### Publishing

- NPM packages for each workspace
- GitHub releases with assets
- Documentation deployment
- CDN distribution

## Contributing

### Development Guidelines

1. All tokens must have descriptions
2. Colors must pass WCAG AA
3. Components need Storybook stories
4. Changes require visual regression tests

### PR Requirements

- Token linting passes
- Contrast tests pass
- Visual tests pass
- Documentation updated

## Node.js Compatibility

### Development Environment

- **Local Development**: Node.js 22 (latest features, best DX)
- **CI/CD Testing**: Matrix testing against Node.js 18, 20, and 22
- **Minimum Support**: Node.js 18+ (current LTS)

### Compatibility Guidelines

When adding dependencies or features, ensure compatibility with Node.js 18+:

1. **Check before adding dependencies**:
   - Review the dependency's engines field
   - Test in CI against all Node versions
   - Prefer dependencies with broad Node.js support

2. **Avoid Node.js 20+ exclusive features**:
   - `fs.cp()` - use `fs-extra` or manual copying for Node 18
   - Stable test runner - use external test frameworks
   - Permission model APIs

3. **Safe to use features (Node.js 18+)**:
   - `Error.cause` property
   - Native `fetch` and `AbortController`
   - `fs.promises` API
   - `structuredClone()`
   - ES modules and CommonJS interop
   - `AggregateError` for multiple errors

4. **Dependency compatibility checks**:

   ```bash
   # Check a dependency's Node.js requirements
   npm view [package-name] engines

   # Run CI locally against different Node versions
   nvm use 18 && pnpm test
   nvm use 20 && pnpm test
   ```

5. **If polyfills are needed**:
   - Document in package README
   - Add to build process, not runtime
   - Consider alternatives first

## Current Status

### ✅ Completed Planning

- Token architecture
- Color generation system
- SVG processing pipeline
- Testing strategy
- Documentation approach

### 🚧 Next Steps

1. Implement Material Color Utilities integration
2. Set up Style Dictionary configuration
3. Create SVGO token replacement plugin
4. Build Storybook framework
5. Implement core components

### 🎯 Roadmap

- v0.1.0: Core tokens and color system
- v0.2.0: Icon system and assets
- v0.3.0: Basic React components
- v0.4.0: Full documentation
- v1.0.0: Production ready

## Configuration

### Environment Variables

```bash
# Build configuration
NODE_ENV=development
DESIGN_SYSTEM_VERSION=0.1.0

# Asset optimization
OPTIMIZE_IMAGES=true
GENERATE_WEBP=true

# Testing
STRICT_CONTRAST=true
VISUAL_REGRESSION_THRESHOLD=0.1
```

### Token Configuration

See `tokens/config.js` for:

- Brand colors
- Theme variants
- Contrast levels
- Output formats

## Useful Commands

```bash
# Development
pnpm dev            # Start all watchers
pnpm build          # Production build
pnpm clean          # Clean all outputs

# Testing
pnpm test:watch     # Test in watch mode
pnpm test:coverage  # Coverage report
pnpm test:ci        # CI test suite

# Releases
pnpm release:patch  # Patch release
pnpm release:minor  # Minor release
pnpm release:major  # Major release

# Utilities
pnpm analyze        # Bundle analysis
pnpm lint:fix       # Auto-fix issues
pnpm upgrade:deps   # Update dependencies
```

## Resources

### Documentation

- [Token Architecture](./docs/token-architecture.md)
- [Color System](./docs/color-system.md)
- [Testing Strategy](./docs/testing.md)
- [Contributing Guide](./CONTRIBUTING.md)

### External Links

- [Material Color Utilities](https://github.com/material-foundation/material-color-utilities)
- [Style Dictionary](https://amzn.github.io/style-dictionary/)
- [SVGO](https://github.com/svg/svgo)
- [Sharp](https://sharp.pixelplumbing.com/)

## License

MIT - Feel free to use in your own projects!

## Contact

- GitHub: [your-username/terroir-core]
- Issues: [Report bugs or request features]
- Discussions: [Ask questions or share ideas]

---

## Claude AI Development Workflow

### Task-Commit Workflow

Follow this workflow for consistent, high-quality development:

1. **Start Task**

   ```bash
   # Create task plan in .claude/tasks/
   # Define scope, success criteria, and tests
   ```

2. **Implement Feature**
   - Write code/configuration
   - Follow existing patterns
   - Ensure type safety

3. **Test Implementation**
   - Run relevant tests locally
   - Verify no regressions
   - Check performance impact

4. **Commit Changes**

   ```bash
   # After completing each logical task
   git add .
   git commit -m "type(scope): description

   - Implementation details
   - Tests added
   - Closes #issue"
   ```

5. **Move to Next Task**
   - Update task list
   - Repeat process

### Working Directory Structure

```
.claude/                  # AI session working directory (gitignored)
├── tasks/               # Task planning and tracking
├── sessions/            # Session context and notes
└── README.md           # Directory documentation
```

### Definition of Done

A task is complete when:

- ✅ All code implemented
- ✅ Tests written and passing
- ✅ Documentation updated
- ✅ No linting/type errors
- ✅ Performance verified
- ✅ Committed with conventional message

### Testing Requirements

For each feature, ensure:

**Code Testing**

- Unit tests for logic
- Integration tests for interactions
- Visual tests for UI changes
- Performance tests for critical paths

**Documentation Testing**

- API docs accurate
- Examples working
- Migration guides complete

**Manual Verification**

- Works in development
- Works in container
- No console errors
- Accessibility verified

### Quick Commands

```bash
# Start new task
mkdir -p .claude/tasks && echo "# Task: [Name]" > .claude/tasks/current-task.md

# Run all checks before commit
pnpm test:lint && pnpm test && pnpm build

# Commit with conventional format
git commit -m "feat(tokens): add new color system"
```

---

Built with ❤️ for the open-source community
