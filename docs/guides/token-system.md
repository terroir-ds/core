# Token System Guide

This guide explains how to work with design tokens in the Terroir Core Design System, covering best practices for flexibility, tool integration, and standards compliance.

## Overview

The Terroir token system provides a flexible, tool-agnostic foundation for design consistency across platforms. Our approach emphasizes:

- **Universal applicability** through standard formats
- **Tool compatibility** with Figma, Style Dictionary, and emerging W3C standards
- **Accessibility-first** design with built-in WCAG compliance
- **Future-proof architecture** ready for evolving standards

## Token Architecture

### Three-Tier System

Our token architecture follows a three-tier hierarchy for maximum flexibility:

```text
┌─────────────────────────┐
│   Tier 3: Component     │  component.button.background
├─────────────────────────┤
│   Tier 2: Semantic      │  semantic.color.primary
├─────────────────────────┤
│   Tier 1: Primitives    │  color.primitive.blue.500
└─────────────────────────┘
```text
#### Tier 1: Primitives
Raw values that form the foundation. These are never used directly in components.

```json
{
  "color": {
    "primitive": {
      "blue": {
        "500": {
          "value": "#0066cc",
          "type": "color",
          "description": "Core brand blue at 500 tone"
        }
      }
    }
  }
}
```text
#### Tier 2: Semantic
Meaningful aliases that abstract the purpose from the value.

```json
{
  "semantic": {
    "color": {
      "primary": {
        "value": "{color.primitive.blue.500}",
        "type": "color",
        "description": "Primary brand color for interactive elements"
      }
    }
  }
}
```text
#### Tier 3: Component
Specific use cases tied to components, always reference semantic tokens.

```json
{
  "component": {
    "button": {
      "background": {
        "value": "{semantic.color.primary}",
        "type": "color",
        "description": "Default background color for buttons"
      }
    }
  }
}
```text
## Token Format Standards

### Current Format: Style Dictionary

We use Style Dictionary v3 format as our source of truth:

```json
{
  "token-name": {
    "value": "token-value",
    "type": "color|dimension|fontFamily|...",
    "description": "Human-readable description",
    "metadata": {
      "deprecated": false,
      "wcag": "AA"
    }
  }
}
```text
### Future Format: W3C Design Tokens

We're prepared for the W3C Design Tokens Community Group format:

```json
{
  "token-name": {
    "$value": "token-value",
    "$type": "color|dimension|fontFamily|...",
    "$description": "Human-readable description",
    "$extensions": {
      "com.terroir": {
        "wcag": "AA"
      }
    }
  }
}
```text
### Format Transformation

Our build system automatically handles format conversions:

```javascript
// Input: Style Dictionary format
// Output: Multiple formats for different tools
{
  "source": ["tokens/**/*.json"],
  "platforms": {
    "css": { /* CSS custom properties */ },
    "js": { /* ES6 modules */ },
    "figma": { /* Figma Tokens plugin */ },
    "w3c": { /* W3C DTCG format */ }
  }
}
```text
## Token Types and Naming

### Naming Convention

We follow a dot notation with clear hierarchy:

```text
[category].[tier].[group].[property].[variant].[state]
```text
Examples:
- `color.primitive.blue.500`
- `semantic.spacing.component.padding`
- `component.button.background.hover`

### Supported Token Types

#### Color Tokens
Generated using Material Color Utilities with continuous tone scale (0-100):

```json
{
  "color": {
    "primitive": {
      "blue": {
        "0": { "value": "#000000" },    // Pure black
        "10": { "value": "#001a33" },   // Very dark
        "50": { "value": "#0066cc" },   // Medium
        "90": { "value": "#cce0ff" },   // Very light
        "100": { "value": "#ffffff" }   // Pure white
      }
    }
  }
}
```text
#### Spacing Tokens
Based on 4px unit system:

```json
{
  "spacing": {
    "primitive": {
      "0": { "value": "0", "type": "dimension" },
      "1": { "value": "4px", "type": "dimension" },
      "2": { "value": "8px", "type": "dimension" },
      "4": { "value": "16px", "type": "dimension" }
    }
  }
}
```text
#### Typography Tokens
Composite tokens for complete type styles:

```json
{
  "typography": {
    "heading": {
      "large": {
        "value": {
          "fontFamily": "{font.family.display}",
          "fontSize": "{font.size.xl}",
          "fontWeight": "{font.weight.bold}",
          "lineHeight": "{font.lineHeight.tight}",
          "letterSpacing": "{font.letterSpacing.tight}"
        },
        "type": "typography"
      }
    }
  }
}
```text
#### Motion Tokens
For consistent animations:

```json
{
  "motion": {
    "duration": {
      "fast": { "value": "150ms", "type": "duration" },
      "normal": { "value": "300ms", "type": "duration" }
    },
    "easing": {
      "standard": { "value": "cubic-bezier(0.4, 0, 0.2, 1)", "type": "cubicBezier" }
    }
  }
}
```text
## Tool Integration

### Figma Integration

#### Figma Tokens Plugin
Export tokens in flat format with proper naming:

```javascript
// Transform nested to flat for Figma
{
  "color-primary": "#0066cc",
  "spacing-small": "8px"
}
```text
#### Figma Variables (Native)
Support for Figma's native variable system:

```javascript
// Export as Figma-compatible JSON
{
  "collections": [{
    "name": "Terroir Core",
    "modes": ["light", "dark"],
    "variables": [...]
  }]
}
```text
### Development Tool Integration

#### VS Code
IntelliSense support through generated TypeScript definitions:

```typescript
// Generated from tokens
export interface DesignTokens {
  color: {
    primary: string;
    secondary: string;
  };
  spacing: {
    small: string;
    medium: string;
  };
}
```text
#### Browser DevTools
CSS custom properties for easy debugging:

```css
:root {
  --color-primary: #0066cc;
  --spacing-small: 8px;
}
```text
## Accessibility and WCAG Compliance

### Built-in Contrast Validation

Tokens include accessibility metadata:

```json
{
  "color": {
    "text": {
      "on-primary": {
        "value": "#ffffff",
        "type": "color",
        "metadata": {
          "contrastRatio": {
            "primary": "13.5:1"
          },
          "wcagLevel": "AAA"
        }
      }
    }
  }
}
```text
### Naming Convention for Contrast

Use `on-{background}` pattern for text colors:

```json
{
  "on-primary": "Color for text on primary background",
  "on-surface": "Color for text on surface background",
  "on-error": "Color for text on error background"
}
```text
### Automated Testing

Build-time validation ensures compliance:

```bash
pnpm tokens:validate
# ✓ All color combinations meet WCAG AA
# ✓ Focus indicators have 3:1 contrast
# ✓ Touch targets meet 44x44px minimum
```text
## Theme Support

### Theme Structure

```text
tokens/
├── global/           # Theme-agnostic tokens
├── themes/
│   ├── light/       # Light theme overrides
│   ├── dark/        # Dark theme overrides
│   └── high-contrast/ # Accessibility theme
└── brands/          # Multi-brand support
    ├── default/
    └── custom/
```text
### Theme Token Example

```json
// global/semantic.json
{
  "semantic": {
    "color": {
      "background": {
        "value": "{color.neutral.10}"
      }
    }
  }
}

// themes/dark/semantic.json
{
  "semantic": {
    "color": {
      "background": {
        "value": "{color.neutral.90}"  // Override for dark theme
      }
    }
  }
}
```text
## Working with Tokens

### Development Workflow

1. **Define tokens** in JSON source files
2. **Build tokens** to generate platform outputs
3. **Use tokens** in components and styles
4. **Test tokens** for accessibility and visual consistency

```bash
# Watch mode during development
pnpm tokens:watch

# Build all token formats
pnpm tokens:build

# Validate accessibility
pnpm tokens:validate

# Generate documentation
pnpm tokens:docs
```text
### Token Usage Examples

#### In CSS
```css
.button {
  background-color: var(--color-primary);
  padding: var(--spacing-small) var(--spacing-medium);
  transition-duration: var(--motion-duration-fast);
}
```text
#### In JavaScript/React
```jsx
import { tokens } from '@terroir/core';

const Button = styled.button`
  background-color: ${tokens.color.primary};
  padding: ${tokens.spacing.small} ${tokens.spacing.medium};
`;
```text
#### In Figma
Tokens are automatically synced and available in Figma's asset panel.

## Platform-Specific Outputs

### Web (CSS)
```css
/* Generated CSS custom properties */
:root {
  --color-primary: #0066cc;
  --spacing-unit: 4px;
  --font-size-base: 16px;
}
```text
### JavaScript/TypeScript
```javascript
// Generated ES modules
export const color = {
  primary: '#0066cc',
  secondary: '#6b46c1'
};
```text
### iOS (Swift)
```swift
// Generated Swift extensions
extension UIColor {
  static let primaryColor = UIColor(hex: "#0066cc")
}
```text
### Android (Kotlin)
```kotlin
// Generated Android resources
<color name="color_primary">#0066cc</color>
```text
## Best Practices

### 1. **Always Use Semantic Tokens**
Never reference primitive tokens directly in components.

```javascript
// ❌ Bad
background: tokens.color.primitive.blue.500

// ✅ Good
background: tokens.semantic.color.primary
```text
### 2. **Document Token Purpose**
Every token must have a clear description.

```json
{
  "description": "Primary action color for buttons and links"
}
```text
### 3. **Maintain Token Relationships**
Use references to maintain consistency.

```json
{
  "hover": {
    "value": "{color.primary}",
    "modify": [{ "type": "darken", "amount": 0.1 }]
  }
}
```text
### 4. **Version Token Changes**
Follow semantic versioning for token updates.

```json
{
  "metadata": {
    "deprecated": true,
    "replacement": "semantic.color.action.primary",
    "version": "2.0.0"
  }
}
```text
### 5. **Test Across Themes**
Ensure tokens work in all theme contexts.

```bash
pnpm test:tokens --theme=light
pnpm test:tokens --theme=dark
pnpm test:tokens --theme=high-contrast
```text
## Migration and Compatibility

### Supporting Multiple Formats

Our transformation layer handles:
- Style Dictionary → W3C DTCG
- Nested → Flat (for Figma)
- JSON → Platform-specific

### Backward Compatibility

Deprecated tokens remain available with warnings:

```json
{
  "color-primary": {
    "value": "{semantic.color.primary}",
    "deprecated": true,
    "message": "Use semantic.color.primary instead"
  }
}
```

## Future Considerations

### W3C Design Tokens Spec

We're tracking the evolving standard and will provide:

- Automatic migration tools
- Dual format support during transition
- Documentation updates

### AI-Driven Token Generation

Exploring integration with:

- Automated accessibility optimization
- Context-aware token suggestions
- Cross-platform consistency checking

### Advanced Token Features

Planning support for:

- Conditional tokens (responsive, user preference)
- Composite tokens (shadows, gradients)
- Animation sequences
- Mathematical relationships

## Resources

- [Token Architecture Documentation](../resources/architecture/token-architecture.md)
- [Material Color Utilities Guide](./color-system.md)
- [Style Dictionary Documentation](https://amzn.github.io/style-dictionary/)
- [W3C Design Tokens Community Group](https://www.w3.org/community/design-tokens/)
- [Figma Tokens Plugin](https://www.figma.com/community/plugin/843461159747178978)

## Next Steps

1. Review the [Color System Guide](./color-system.md) for color token specifics
2. See [Theming Guide](./theming.md) for multi-theme implementation
3. Check [Component Documentation](../reference/components/) for token usage in components
