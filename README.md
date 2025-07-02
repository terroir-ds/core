# Terroir Core Design System

A comprehensive design system built with Style Dictionary, featuring Material Color Utilities integration, automated accessibility testing, and multi-platform support.

## Features

- **Token-Based Architecture**: Three-tier token system (primitives → semantic → component)
- **Material Color Utilities**: Advanced color generation with HCT color space
- **Accessibility First**: Automated WCAG compliance testing
- **Multi-Platform**: Generate tokens for CSS, JS, iOS, Android, and more
- **SVG Asset Pipeline**: Dynamic icon theming with SVGO optimization
- **Type Safety**: Full TypeScript support throughout

## 2025 Roadmap

Based on comprehensive research of the current design system landscape, Terroir Core is adopting a next-generation architecture that combines the best of modern approaches:

### Strategic Direction

- **Open-Code Distribution**: Adopting shadcn/ui's revolutionary approach where users get full control over component source code
- **AI-Native Design**: Built for seamless integration with AI generation tools like V0
- **Scientific Color Foundation**: Material Color Utilities provide perceptually uniform colors
- **Performance-First**: Zero runtime overhead through build-time optimization

### Implementation Phases

**Phase 1 - Core Foundation (v0.1.0)** ✅ Current
- Material Color Utilities integration
- Design token architecture with Style Dictionary
- TailwindCSS configuration system
- Basic build pipeline

**Phase 2 - Component CLI (v0.2.0)** 🚧 Next
- Component installation CLI tool (like shadcn/ui)
- Basic component templates (Button, Card, Input, Select)
- Headless UI primitives integration
- Component registry system

**Phase 3 - AI Integration (v0.3.0)**
- V0 template compatibility
- AI-friendly component APIs
- Automated component documentation
- LLM-optimized code patterns

**Phase 4 - Enterprise Features (v1.0.0)**
- Multi-brand theming system
- Advanced component variants
- Performance optimization tools
- Complete component library

### Why This Approach?

1. **AI Readiness**: Open-code components work seamlessly with AI generation tools
2. **Developer Control**: Full customization without library constraints
3. **Performance**: No runtime overhead from traditional component libraries
4. **Future-Proof**: Architecture adapts to new frameworks and tools
5. **Scientific Foundation**: Material Color Utilities provide proven color science

This positions Terroir Core as a bridge between AI-generated components and scientific design principles, making it highly relevant for modern development workflows.

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
├── tokens/ # Design token source files
│ └── base/ # Base token definitions
├── scripts/ # Build and generation scripts
├── packages/ # Platform-specific packages
│ ├── core/ # Core tokens package
│ ├── react/ # React components
│ └── web-components/ # Web Components
├── assets/ # Visual assets (icons, images)
├── docs/ # Documentation
└── tests/ # Test suites
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

See [.agents/index.md](.agents/index.md) for complete documentation on this accelerated development approach.

## Contributing

1. Fork the repository
2. Create your feature branch (or use multi-agent workflow for complex features)
3. Commit changes (hooks ensure quality)
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details
