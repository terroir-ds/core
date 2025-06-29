# Complete Tutorial: Build Your First Component

This comprehensive tutorial walks you through building a real button component using Terroir Core's color system. You'll learn the core concepts while creating something you can use in production.

## Prerequisites

- Node.js 18+ installed
- Basic knowledge of TypeScript/JavaScript
- A text editor or IDE

## Step 1: Project Setup

Create a new project and install Terroir Core:

```bash
# Create project directory
mkdir my-terroir-app
cd my-terroir-app

# Initialize package.json
npm init -y

# Install Terroir Core
npm install @terroir/core

# Install development dependencies
npm install -D typescript @types/node vite
```

Create a basic TypeScript configuration:

```yaml
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## Step 2: Generate Your Color System

Create a file to generate and test your color system:

```typescript
// src/color-system.ts
import { generateColorSystem, validateColorContrast, type ColorSystem } from '@terroir/core/colors';

/**
 * Generate a brand-specific color system
 */
export async function createBrandColors(): Promise<ColorSystem> {
  console.log('🎨 Generating color system from brand color...');

  // Generate colors using Material Design 3 principles
  const colorSystem = await generateColorSystem({
    source: '#0066cc', // Your brand blue
    contrastLevel: 0.5, // Enhanced contrast for accessibility
    variant: 'tonalSpot', // Material You balanced variant
    includeThemes: true, // Generate both light and dark themes
  });

  // Validate accessibility compliance
  console.log('🔍 Validating color accessibility...');
  const validation = validateColorContrast(colorSystem, 4.5); // WCAG AA

  if (validation.failed.length > 0) {
    console.warn('⚠️  Accessibility issues found:');
    validation.failed.forEach(({ name, ratio }) => {
      console.warn(`  ${name}: ${ratio.toFixed(2)} (needs 4.5+)`);
    });
  } else {
    console.log('✅ All color combinations meet WCAG AA standards!');
  }

  // Log some examples
  console.log('📊 Generated color palettes:');
  console.log(`  Primary 40 (button): ${colorSystem.palettes.primary.tones[40]?.hex}`);
  console.log(`  Primary 90 (text): ${colorSystem.palettes.primary.tones[90]?.hex}`);
  console.log(`  Neutral 10 (background): ${colorSystem.palettes.neutral.tones[10]?.hex}`);

  return colorSystem;
}

/**
 * Test the color system generation
 */
export async function testColorSystem(): Promise<void> {
  try {
    const colors = await createBrandColors();

    console.log('\n🎯 Available tones for primary palette:');
    Object.entries(colors.palettes.primary.tones).forEach(([tone, color]) => {
      console.log(`  Tone ${tone}: ${color.hex} (contrast vs white: ${color.contrast.white})`);
    });

    if (colors.themes) {
      console.log('\n🌙 Theme variations generated:');
      console.log('  Light theme primary:', colors.themes.light.primary?.hex);
      console.log('  Dark theme primary:', colors.themes.dark.primary?.hex);
    }
  } catch (error) {
    console.error('❌ Error generating color system:', error);
  }
}

// Export the color system for use in components
export let brandColors: ColorSystem | null = null;

// Initialize colors when module loads
createBrandColors().then((colors) => {
  brandColors = colors;
  console.log('🚀 Brand colors ready for use!');
});
```

## Step 3: Create Your First Component

Now let's build a button component using the generated colors:

```bash
// src/components/Button.ts
import { brandColors } from '../color-system.js';

export interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
}

export interface ButtonStyles {
  backgroundColor: string;
  color: string;
  border: string;
  borderRadius: string;
  padding: string;
  fontSize: string;
  fontWeight: string;
  minHeight: string;
  cursor: string;
  transition: string;
  opacity?: string;
}

/**
 * Generate button styles using Terroir color system
 */
export function getButtonStyles(props: ButtonProps): ButtonStyles {
  if (!brandColors) {
    throw new Error('Color system not initialized. Make sure to await createBrandColors()');
  }

  const { variant = 'primary', size = 'medium', disabled = false } = props;

  // Get base styles from color system
  let backgroundColor: string;
  let textColor: string;
  let borderColor: string;

  switch (variant) {
    case 'primary':
      backgroundColor = brandColors.palettes.primary.tones[40]?.hex || '#0066cc';
      textColor = brandColors.palettes.primary.tones[100]?.hex || '#ffffff';
      borderColor = 'transparent';
      break;
    case 'secondary':
      backgroundColor = brandColors.palettes.secondary.tones[90]?.hex || '#f5f5f5';
      textColor = brandColors.palettes.secondary.tones[10]?.hex || '#1a1a1a';
      borderColor = brandColors.palettes.secondary.tones[40]?.hex || '#666666';
      break;
    case 'tertiary':
      backgroundColor = 'transparent';
      textColor = brandColors.palettes.tertiary.tones[40]?.hex || '#0066cc';
      borderColor = brandColors.palettes.tertiary.tones[40]?.hex || '#0066cc';
      break;
    default:
      backgroundColor = brandColors.palettes.primary.tones[40]?.hex || '#0066cc';
      textColor = brandColors.palettes.primary.tones[100]?.hex || '#ffffff';
      borderColor = 'transparent';
  }

  // Size variations
  const sizeStyles = {
    small: { padding: '8px 16px', fontSize: '14px', minHeight: '32px' },
    medium: { padding: '12px 24px', fontSize: '16px', minHeight: '44px' },
    large: { padding: '16px 32px', fontSize: '18px', minHeight: '52px' },
  };

  const currentSize = sizeStyles[size];

  return {
    backgroundColor,
    color: textColor,
    border: borderColor === 'transparent' ? 'none' : `1px solid ${borderColor}`,
    borderRadius: '8px',
    padding: currentSize.padding,
    fontSize: currentSize.fontSize,
    fontWeight: '600',
    minHeight: currentSize.minHeight,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    ...(disabled && { opacity: '0.6' }),
  };
}

/**
 * Create a button element with Terroir styling
 */
export function createButton(props: ButtonProps): HTMLButtonElement {
  const button = document.createElement('button');
  const styles = getButtonStyles(props);

  // Apply text content
  button.textContent = props.label;
  button.disabled = props.disabled || false;

  // Apply styles
  Object.assign(button.style, styles);

  // Add click handler
  if (props.onClick) {
    button.addEventListener('click', props.onClick);
  }

  // Add hover effects
  button.addEventListener('mouseenter', () => {
    if (!props.disabled) {
      button.style.transform = 'translateY(-1px)';
      button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    }
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = 'none';
  });

  // Add focus styles for accessibility
  button.addEventListener('focus', () => {
    button.style.outline = `2px solid ${styles.backgroundColor}`;
    button.style.outlineOffset = '2px';
  });

  button.addEventListener('blur', () => {
    button.style.outline = 'none';
  });

  return button;
}
```

## Step 4: Test Your Component

Create a test page to see your component in action:

```yaml
<!-- public/index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Terroir Core Button Demo</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
        line-height: 1.6;
      }

      .demo-section {
        margin: 2rem 0;
        padding: 1rem;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
      }

      .button-group {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        margin: 1rem 0;
      }

      .logs {
        background: #f5f5f5;
        padding: 1rem;
        border-radius: 4px;
        font-family: monospace;
        white-space: pre-line;
        max-height: 300px;
        overflow-y: auto;
      }
    </style>
  </head>
  <body>
    <h1>🎨 Terroir Core Button Demo</h1>

    <div class="demo-section">
      <h2>1. Color System Generation</h2>
      <p>Watch the console as we generate your color system:</p>
      <div id="logs" class="logs">Initializing color system...</div>
    </div>

    <div class="demo-section">
      <h2>2. Button Variants</h2>
      <div id="variant-buttons" class="button-group"></div>
    </div>

    <div class="demo-section">
      <h2>3. Button Sizes</h2>
      <div id="size-buttons" class="button-group"></div>
    </div>

    <div class="demo-section">
      <h2>4. Interactive States</h2>
      <div id="state-buttons" class="button-group"></div>
    </div>

    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

```bash
// src/main.ts
import { testColorSystem, brandColors } from './color-system.js';
import { createButton, type ButtonProps } from './components/Button.js';

// Capture console output for display
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;
const logsElement = document.getElementById('logs');

function addLog(message: string, type: 'log' | 'warn' | 'error' = 'log') {
  if (logsElement) {
    const prefix = type === 'warn' ? '⚠️ ' : type === 'error' ? '❌ ' : '';
    logsElement.textContent += prefix + message + '\n';
    logsElement.scrollTop = logsElement.scrollHeight;
  }
}

console.log = (...args) => {
  originalLog(...args);
  addLog(args.join(' '), 'log');
};

console.warn = (...args) => {
  originalWarn(...args);
  addLog(args.join(' '), 'warn');
};

console.error = (...args) => {
  originalError(...args);
  addLog(args.join(' '), 'error');
};

async function initializeDemo() {
  // Test color system generation
  await testColorSystem();

  // Wait a moment for colors to be ready
  setTimeout(() => {
    if (!brandColors) {
      console.error('Color system failed to initialize');
      return;
    }

    createButtonDemos();
  }, 1000);
}

function createButtonDemos() {
  // Button variants demo
  const variantContainer = document.getElementById('variant-buttons');
  if (variantContainer) {
    const variants: Array<{ variant: ButtonProps['variant']; label: string }> = [
      { variant: 'primary', label: 'Primary Button' },
      { variant: 'secondary', label: 'Secondary Button' },
      { variant: 'tertiary', label: 'Tertiary Button' },
    ];

    variants.forEach(({ variant, label }) => {
      const button = createButton({
        label,
        variant,
        onClick: () => console.log(`${label} clicked!`),
      });
      variantContainer.appendChild(button);
    });
  }

  // Button sizes demo
  const sizeContainer = document.getElementById('size-buttons');
  if (sizeContainer) {
    const sizes: Array<{ size: ButtonProps['size']; label: string }> = [
      { size: 'small', label: 'Small' },
      { size: 'medium', label: 'Medium' },
      { size: 'large', label: 'Large' },
    ];

    sizes.forEach(({ size, label }) => {
      const button = createButton({
        label: `${label} Button`,
        size,
        onClick: () => console.log(`${label} button clicked!`),
      });
      sizeContainer.appendChild(button);
    });
  }

  // Interactive states demo
  const stateContainer = document.getElementById('state-buttons');
  if (stateContainer) {
    // Normal button
    stateContainer.appendChild(
      createButton({
        label: 'Normal State',
        onClick: () => console.log('Normal button clicked!'),
      })
    );

    // Disabled button
    stateContainer.appendChild(
      createButton({
        label: 'Disabled State',
        disabled: true,
        onClick: () => console.log('This should not fire'),
      })
    );

    // Loading simulation button
    const loadingButton = createButton({
      label: 'Click to Load',
      onClick: () => {
        loadingButton.textContent = 'Loading...';
        loadingButton.disabled = true;

        setTimeout(() => {
          loadingButton.textContent = 'Loaded!';
          setTimeout(() => {
            loadingButton.textContent = 'Click to Load';
            loadingButton.disabled = false;
          }, 1000);
        }, 2000);
      },
    });
    stateContainer.appendChild(loadingButton);
  }

  console.log('✨ Demo buttons created successfully!');
}

// Initialize the demo
initializeDemo();
```

## Step 5: Run Your Demo

Add a build script to your package.json:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

Now run your demo:

```bash
# Start development server
npm run dev

# Open your browser to the displayed URL (usually http://localhost:5173)
```

## Step 6: Understanding What You Built

### Color System Features

Your button component now has:

1. **Scientific Color Generation**: Uses Material Design 3's HCT color space for perceptually uniform colors
2. **Automatic Accessibility**: All color combinations are tested for WCAG compliance
3. **Theme Support**: Ready for light/dark mode with generated theme tokens
4. **Consistent Contrast**: Every tone has pre-calculated contrast ratios

### Component Features

Your button includes:

1. **Accessible Design**: 44px minimum touch target, focus indicators, proper contrast
2. **Interactive States**: Hover, focus, active, and disabled states
3. **Responsive Sizing**: Small, medium, and large variants
4. **Type Safety**: Full TypeScript support with proper interfaces

## Step 7: Next Steps

### Extend Your Component

```typescript
// Add more button variants
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success';

// Add icon support
export interface ButtonProps {
  icon?: string;
  iconPosition?: 'left' | 'right';
  // ... other props
}

// Add loading state
export interface ButtonProps {
  loading?: boolean;
  loadingText?: string;
  // ... other props
}
```

### Create More Components

Use the same pattern to create:

- Cards with consistent spacing and colors
- Forms with accessible validation
- Navigation with proper contrast
- Data tables with readable typography

### Production Considerations

For production use:

1. Add proper build tooling (Webpack, Rollup, etc.)
2. Implement CSS-in-JS or CSS modules for better performance
3. Add comprehensive testing (unit, integration, accessibility)
4. Consider framework-specific implementations (React, Vue, Angular)

## Troubleshooting

### Common Issues

**Colors not generating**: Check that you have Material Color Utilities installed and your source color is valid hex format.

**TypeScript errors**: Ensure you have proper type definitions and your tsconfig.json is configured correctly.

**Accessibility warnings**: Use the `validateColorContrast` function to identify and fix contrast issues.

**Performance issues**: Consider caching color generation results and using CSS custom properties for runtime theme switching.

## Resources

- [API Documentation](../api/README.md) - Complete function reference
- [Color System Guide](../foundations/color-system.md) - Deep dive into color theory
- [Accessibility Guide](../foundations/accessibility.md) - Ensure your components work for everyone
- [Examples Repository](https://github.com/terroir-core/examples) - More complete examples

## What's Next?

You've successfully created your first Terroir Core component! Continue learning:

1. **[Advanced Components](../guides/components/README.md)** - Build complex UI patterns
2. **[Theming Guide](../guides/theming/README.md)** - Create custom themes
3. **[Testing Strategy](../guides/testing/README.md)** - Ensure component quality
4. **[Performance Optimization](../guides/performance/README.md)** - Optimize for production
