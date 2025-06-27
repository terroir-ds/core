# Foundations

This section covers the core principles, concepts, and systems that form the foundation of Terroir Core. Understanding these concepts will help you make informed decisions when building with the design system.

## Core Concepts

### [Design Principles](./design-principles.md)

The fundamental beliefs and values that guide every decision in Terroir Core.

### [Color System](./color-system.md)

How we generate scientifically-based color palettes using Material Color Utilities and the HCT color space.

### [Typography](./typography.md)

Our approach to readable, accessible, and harmonious text across all platforms.

### [Accessibility](./accessibility.md)

How we ensure WCAG compliance and inclusive design practices throughout the system.

## Design Philosophy

Terroir Core is built on four core principles:

1. **Accessibility First** - Every design decision prioritizes inclusive access
2. **Performance Focused** - Optimize for speed without sacrificing functionality
3. **Developer Experience** - Make the right thing the easy thing
4. **Scientific Approach** - Base decisions on research and data, not trends

## Token Architecture

Our three-tier token system provides flexibility while maintaining consistency:

- **Primitive Tokens**: Raw values (colors, sizes, durations)
- **Semantic Tokens**: Purpose-driven tokens (primary, secondary, error)
- **Component Tokens**: Component-specific tokens (button.padding, card.shadow)

This architecture allows for systematic theming while preserving the ability to customize individual components when needed.

## Material Design Integration

Terroir Core leverages Google's Material Color Utilities to provide:

- **Perceptually uniform color generation** based on human vision research
- **Dynamic theming** that generates complete palettes from a single brand color
- **Accessibility-first contrast** calculations for WCAG compliance
- **Cross-platform consistency** across web, iOS, and Android

## Related Sections

- **[Getting Started](../getting-started/README.md)** - Learn how to install and use these foundations
- **[Guides](../guides/README.md)** - Practical tutorials for implementing foundation concepts
- **[Reference](../reference/README.md)** - Technical specifications and API documentation
