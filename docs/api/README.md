**Terroir Core Design System v0.1.0**

***

# Terroir Core Design System

A comprehensive design system built with Style Dictionary, featuring Material Color Utilities integration, automated accessibility testing, and multi-platform support.

## Features

- **Token-Based Architecture**: Three-tier token system (primitives → semantic → component)
- **Material Color Utilities**: Advanced color generation with HCT color space
- **Accessibility First**: Automated WCAG compliance testing
- **Multi-Platform**: Generate tokens for CSS, JS, iOS, Android, and more
- **SVG Asset Pipeline**: Dynamic icon theming with SVGO optimization
- **Type Safety**: Full TypeScript support throughout

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all tokens
pnpm build

# Development mode with watch
pnpm dev

# Run tests
pnpm test
```

## Project Structure

```markdown
terroir-core/
├── tokens/              # Design token source files
│   └── base/           # Base token definitions
├── scripts/            # Build and generation scripts
├── packages/           # Platform-specific packages
│   ├── core/          # Core tokens package
│   ├── react/         # React components
│   └── web-components/ # Web Components
├── assets/            # Visual assets (icons, images)
├── docs/              # Documentation
└── tests/             # Test suites
```

## Token Architecture

### Three-Tier System

1. **Primitive Tokens**: Raw values (colors, sizes, durations)
2. **Semantic Tokens**: Purpose-driven tokens (primary, secondary, error)
3. **Component Tokens**: Component-specific tokens (button.padding, card.shadow)

### Naming Convention

- **Colors**: `on-{background}` pattern for accessibility relationships
- **Spacing**: T-shirt sizes (xs, sm, md, lg, xl) with numerical scale
- **Typography**: Semantic names (heading, body, caption) with variants

## Color System

Powered by Google's Material Color Utilities:

- **HCT Color Space**: Perceptually uniform color generation
- **Continuous Tone Scale**: 0-100 scale for precise control
- **Dynamic Theming**: Generate complete themes from a single brand color
- **Accessibility**: Pre-calculated contrast ratios for WCAG compliance

## Development

### Adding New Tokens

1. Add token definitions to `tokens/base/`
2. Run `pnpm build` to generate outputs
3. Tokens automatically validated for accessibility

### Creating Icons

1. Add SVG files to `assets/icons/`
2. Use token references: `fill="{color.primary}"`
3. Build process replaces with CSS variables

### Testing

```bash
# Run all tests
pnpm test

# Accessibility tests only
pnpm test:a11y

# Visual regression tests
pnpm test:visual
```

## Integration

### As NPM Package

```bash
pnpm add @terroir/core
```

```typescript
import { tokens } from '@terroir/core';
import { Button } from '@terroir/core/react';
```

### As Git Submodule

```bash
git submodule add https://github.com/your-org/terroir-core design-system
```

## Advanced Development: Multi-Agent Workflow

This project includes an innovative multi-agent development system that enables parallel development with 70% less memory usage than traditional approaches.

### What is it?

A Docker-based system that lets one developer coordinate multiple parallel tasks:

- **1 Core Agent**: Your main VS Code environment
- **N Assistant Agents**: Lightweight Docker containers for parallel work
- **Git Worktrees**: Each agent on its own branch, no conflicts

### Quick Start

```bash
# Start an assistant agent
cd .agents/docker
./agent-manager.sh start 1

# Generate Claude AI prompt for the agent
./agent-manager.sh prompt 1
```

### Learn More

See [.agents/README.md](_media/README.md) for complete documentation on this accelerated development approach.

## Contributing

1. Fork the repository
2. Create your feature branch (or use multi-agent workflow for complex features)
3. Commit changes (hooks ensure quality)
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details
