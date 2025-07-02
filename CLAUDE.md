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

````text
terroir-core/
├── lib/                       # Core library code (TypeScript)
│   ├── colors/               # Color generation utilities
│   ├── utils/                # Shared utilities (logger, etc.)
│   └── index.ts             # Main entry point
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
│   └── utils/                # Reusable script utilities
├── docs/                     # Documentation and Storybook
└── tests/                    # Visual regression and unit tests

```bash
## Technology Stack

### Core Technologies

- **Style Dictionary**: Token management and transformation
- **Material Color Utilities**: Advanced color system generation
- **SVGO**: SVG optimization and token replacement
- **Sharp**: High-performance image processing
- **TypeScript**: Type safety throughout
- **Pino**: High-performance structured logging

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
```

import { generateColorSystem } from '@terroir/core/lib/colors';

const colors = await generateColorSystem({
  source: '#0066cc',
  contrastLevel: 0.5, // Increased contrast for accessibility
  variant: 'tonalSpot', // Material You variant
});
// Generates primary, secondary, tertiary, neutral, and error palettes
// Each with continuous tone access (0-100)

```bash
### 2. **Token Architecture**

Three-tier token system for maximum flexibility:

1. **Primitives**: Raw values (color.blue.500)
2. **Semantic**: Meaningful aliases (color.primary)
3. **Component**: Specific use cases (button.background.hover)

### 3. **SVG Token Replacement**

Custom SVGO plugin for dynamic theming:
```

<!-- Source SVG -->
<svg>
  <circle fill="{color.primary}" stroke="{color.border}"/>
</svg>

<!-- After processing -->
<svg>
  <circle fill="#0066cc" stroke="#e0e0e0"/>
</svg>

```bash
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
```

pnpm install
pnpm setup           # Install dependencies, generate initial tokens

```bash
### Token Development
```

pnpm tokens:watch    # Watch mode for token changes
pnpm tokens:build    # Build all token formats
pnpm tokens:lint     # Validate token structure

```bash
### Asset Generation
```

pnpm assets:icons    # Process SVG icons with tokens
pnpm assets:images   # Generate PNG/WebP variants
pnpm assets:fonts    # Optimize web fonts

```bash
### Testing
```

pnpm test           # All tests
pnpm test:contrast  # WCAG contrast validation
pnpm test:visual    # Visual regression tests
pnpm test:a11y      # Accessibility tests

```bash
### Documentation
```

pnpm storybook:dev  # Development server
pnpm storybook:build # Static documentation
pnpm docs:generate  # API documentation

```bash
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

See [Node.js Compatibility Standards](./docs/standards/nodejs-compatibility.md) for version support guidelines.

**Quick reminder**: Minimum Node.js 18+, test against 18/20/22 in CI.

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
```

# Build configuration
NODE_ENV=development
DESIGN_SYSTEM_VERSION=0.1.0

# Asset optimization
OPTIMIZE_IMAGES=true
GENERATE_WEBP=true

# Testing
STRICT_CONTRAST=true
VISUAL_REGRESSION_THRESHOLD=0.1

```bash
### Token Configuration

See `tokens/config.js` for:

- Brand colors
- Theme variants
- Contrast levels
- Output formats

## Useful Commands
```

# Development
pnpm dev            # Start all watchers
pnpm build          # Production build
pnpm clean          # Clean all outputs

# Testing
pnpm test:lint      # Run ESLint
pnpm test:type      # TypeScript type checking
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

```bash
## Resources

### Project Documentation

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

### Critical: Always Check Current Documentation

**Before performing any structural action, ALWAYS check the current documentation:**

```bash
# Before phase transitions
cat /ai/methods/multi-pass-development/phase-transitions.ai.md

# Before completing tasks
cat .completed/index.md

# Before following patterns
cat /ai/patterns/[pattern-name].ai.md

# Before applying standards
cat /ai/standards/[standard-name].ai.md
```

**Why this matters:**
- The AI knowledge management system is evolving rapidly
- Cached/remembered patterns may be outdated
- Documentation is the single source of truth
- Prevents errors like wrong directory structures

**Key actions requiring documentation check:**
- ✅ Phase transitions
- ✅ Task completion
- ✅ Pattern application
- ✅ Standard implementation
- ✅ Directory structure operations
- ✅ Naming conventions

### Important: Package Manager

**This project uses pnpm, not npm!**

Always use pnpm for package management:
```

# ✅ Correct - use pnpm
pnpm install
pnpm add package-name
pnpm add -D dev-package
pnpm remove package-name
pnpm test
pnpm build

# ❌ Incorrect - don't use npm
npm install
npm install package-name

```text
If you need to add to workspace root:
```

pnpm add -w package-name
pnpm add -w -D dev-package

```bash
### Task-Commit Workflow

Follow this workflow for consistent, high-quality development:

1. **Start Task**
   ```

   # Create task plan in .claude/tasks/
   # Define scope, success criteria, and tests

```markdown
2. **Implement Feature**
   - Write code/configuration
   - Follow existing patterns
   - Ensure type safety

3. **Test Implementation**
   - Run relevant tests locally
   - Verify no regressions
   - Check performance impact

4. **Fix and Commit Changes**
   ```

   # After completing each logical task

   # STANDARD: Always attempt fixes before commit
   pnpm fix

   # Review the automated fixes
   git diff

   # Stage and commit
   git add .
   git commit -m "type(scope): description

   - Implementation details
   - Tests added
   - Closes #issue"

   # Note: If pnpm fix fails or causes issues, you can still commit:
   # git add . && git commit -m "..." --no-verify

   ```markdown
5. **Move to Next Task**
   - Update task list
   - Repeat process

### Working Directory Structure
```

.claude/                  # AI session working directory (gitignored)
├── tasks/               # Task planning and tracking
├── sessions/            # Session context and notes
└── README.md           # Directory documentation

```bash
### Definition of Done

A task is complete when:

- ✅ All code implemented
- ✅ Tests written and passing
- ✅ Documentation updated (both human and AI docs)
- ✅ No linting/type errors (run `pnpm fix` before commit)
- ✅ Performance verified
- ✅ Committed with conventional message
- ✅ Uses structured logging (no console.log)
- ✅ Uses standard error handling (typed errors with context)
- ✅ AI documentation updated (.ai.md files)

### Development Standards

**IMPORTANT**: Follow the project's development standards documented in `/docs/resources/standards/`:

- **[Error Handling](./docs/resources/standards/error-handling.md)** - Always use typed errors with context
- **[Logging](./docs/resources/standards/logging.md)** - Use structured logger, never console
- **[Code Quality](./docs/resources/standards/code-quality.md)** - Run `pnpm fix` before commits
- **[Testing](./docs/resources/standards/testing.md)** - Co-locate tests with source
- **[Documentation](./docs/resources/standards/documentation.md)** - Keep docs close to code
- **[AI Documentation](./docs/resources/standards/ai-documentation.md)** - Create .ai.md files for AI agents

Quick examples:
```

// ✅ Error handling
import { ValidationError } from '@utils/errors';
throw new ValidationError('Invalid input', { code: 'INVALID_INPUT', context: { value } });

// ✅ Logging
import { logger } from '@utils/logger';
logger.info({ userId }, 'Processing user');

// ❌ Never use
throw new Error('Something failed');
console.log('Debug info');

```bash
### Test Organization

See [Testing Standards](./docs/resources/standards/testing.md) for comprehensive testing guidelines.

**Key principle**: Co-locate tests with source code in `__tests__` subdirectories.

### Quick Commands
```

# Start new task
mkdir -p .claude/tasks && echo "# Task: [Name]" > .claude/tasks/current-task.md

# STANDARD: Run fixes and checks before commit
pnpm fix && pnpm test:lint && pnpm test:type && pnpm test && pnpm build

# Commit with conventional format
git commit -m "feat(tokens): add new color system"

```bash
### Code Quality

See [Code Quality Standards](./docs/resources/standards/code-quality.md) for comprehensive linting and fixing guidelines.

**Quick reminder**: Always run `pnpm fix` before commits to automatically fix formatting issues.

### Logging

See [Logging Standards](./docs/resources/standards/logging.md) for structured logging practices.

**Quick reminder**: Never use `console.log` - always use the structured logger from `@utils/logger`.

### File Organization

See [Documentation Standards](./docs/resources/standards/documentation.md) and [Testing Standards](./docs/resources/standards/testing.md) for detailed patterns.

**Quick reminders**:
- Co-locate tests in `__tests__` subdirectories
- Keep documentation close to code
- Use consistent naming patterns

### AI Documentation

See [AI Documentation Standards](./docs/resources/standards/ai-documentation.md) for AI-first documentation practices.

**Quick reminders**:
- Create `.ai.md` files alongside human documentation
- Include task-oriented examples and quick reference tables
- Add AI metadata with token costs and stability
- Update `/docs/ai/` for cross-cutting patterns

**Documentation Structure**:
```

packages/core/
├── README.md          # Human documentation
├── README.ai.md       # AI-optimized documentation
docs/
├── ai/                # AI-specific guides
│   ├── architecture.md
│   ├── patterns.md
│   └── contributing.md

```bash
### Import Conventions

See [Import Conventions](./docs/resources/standards/import-conventions.md) for path alias usage.

**Quick reminder**: Always use path aliases (`@utils/logger`) instead of relative imports (`../../../lib/utils/logger`).

### Tracking Improvements

See [Refactoring Opportunities](./docs/development/refactoring-opportunities.md) for tracking potential code improvements.

**Quick reminder**: When you identify reusable code that could be extracted, add it to the refactoring opportunities document rather than refactoring prematurely.

---

Built with ❤️ for the open-source community
```
````
