# Quick Start

Build your first component with Terroir Core in 5 minutes! This guide shows you the essential steps to get started.

## What You'll Build

- ✅ A Material Design 3 color system from your brand color
- ✅ A fully accessible button component
- ✅ Automatic WCAG compliance testing
- ✅ Working demo with multiple variants

## Install

```bash
npm install @terroir/core
```

## Generate Colors

```typescript
import { generateColorSystem, validateColorContrast } from '@terroir/core/colors';

// Generate a complete color system
const colors = await generateColorSystem({
  source: '#0066cc', // Your brand color
  contrastLevel: 0.5, // Enhanced accessibility
  variant: 'tonalSpot', // Material You balanced
});

// Validate accessibility
const validation = validateColorContrast(colors);
console.log(`✅ ${validation.passed.length} accessible color pairs`);
```

## Create Component

```typescript
// Use generated colors in your component
function createButton(label: string) {
  const button = document.createElement('button');

  // Apply colors from your generated system
  button.style.backgroundColor = colors.palettes.primary.tones[40].hex;
  button.style.color = colors.palettes.primary.tones[100].hex;
  button.style.padding = '12px 24px';
  button.style.borderRadius = '8px';
  button.style.border = 'none';
  button.style.minHeight = '44px'; // Accessibility compliance
  button.style.cursor = 'pointer';

  button.textContent = label;
  return button;
}

// Create and use your button
const myButton = createButton('Click me!');
document.body.appendChild(myButton);
```

## Test Results

Your button automatically includes:

- **Accessible colors**: Tested contrast ratios (4.5+ for WCAG AA)
- **Touch-friendly size**: 44px minimum height
- **Consistent theming**: Generated from your brand color
- **Material Design**: Based on Google's color science

## What You Get

```typescript
// Access your complete color system
colors.palettes.primary; // Your brand color variations
colors.palettes.secondary; // Complementary colors
colors.palettes.neutral; // Text and background colors
colors.themes.light; // Light theme tokens
colors.themes.dark; // Dark theme tokens

// Example tones available (0-100 scale)
colors.palettes.primary.tones[10]; // Very light
colors.palettes.primary.tones[40]; // Medium (great for buttons)
colors.palettes.primary.tones[90]; // Very dark (great for text)
```

## Ready for More?

### Complete Tutorial

Want to build a production-ready component? Follow our [Complete Tutorial](./complete-tutorial.md) with:

- Full TypeScript setup
- Multiple component variants
- Interactive demo page
- Production considerations

### Framework Integration

- **React**: [React Components Guide](../guides/react/README.md)
- **Vue**: [Vue Components Guide](../guides/vue/README.md)
- **Angular**: [Angular Integration](../guides/angular/README.md)

### Advanced Features

- **[Color System Deep Dive](../foundations/color-system.md)** - Understanding the science
- **[Accessibility Guide](../foundations/accessibility.md)** - Ensuring inclusive design
- **[API Reference](../api/README.md)** - Complete function documentation

## Need Help?

- 🐛 **Issues**: [GitHub Issues](https://github.com/terroir-ds/core/issues)
- 💬 **Questions**: [GitHub Discussions](https://github.com/terroir-ds/core/discussions)
- 📖 **Docs**: [Full Documentation](../README.md)

---

**Time to first component: ~5 minutes** ⚡
