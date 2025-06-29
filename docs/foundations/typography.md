# Typography

Typography forms the foundation of clear communication in digital interfaces. Terroir Core's typography system balances readability, accessibility, and aesthetic harmony across all platforms.

## Core Principles

### 1. Readability First

Every typographic decision prioritizes legibility and comprehension:

- **Optimal line lengths** (45-75 characters)
- **Appropriate line heights** for comfortable reading
- **Clear hierarchy** through size and weight
- **Sufficient contrast** for all text

### 2. System Fonts

We use system font stacks for optimal performance and native feel:

```yaml
--font-family-base: system-ui, -apple-system, BlinkMacSystemFont, 
                    "Segoe UI", Roboto, "Helvetica Neue", Arial, 
                    sans-serif, "Apple Color Emoji", "Segoe UI Emoji";

--font-family-mono: ui-monospace, "SF Mono", "Cascadia Code", 
                    "Roboto Mono", Consolas, "Courier New", monospace;
```

### 3. Responsive Scaling

Typography adapts to viewport and user preferences:

- **Fluid type scaling** using CSS clamp()
- **Respects user font size** preferences
- **Maintains readability** across devices

## Type Scale

Our modular type scale uses a 1.25 ratio (Major Third) for harmonious progression:

### Scale Values

| Token | Size | Line Height | Usage |
|-------|------|-------------|--------|
| `font-size-xs` | 0.75rem (12px) | 1.5 | Small labels, captions |
| `font-size-sm` | 0.875rem (14px) | 1.5 | Secondary text, metadata |
| `font-size-base` | 1rem (16px) | 1.5 | Body text, default |
| `font-size-md` | 1.125rem (18px) | 1.5 | Emphasized body text |
| `font-size-lg` | 1.25rem (20px) | 1.4 | Section headings |
| `font-size-xl` | 1.5rem (24px) | 1.3 | Page headings |
| `font-size-2xl` | 1.875rem (30px) | 1.2 | Large headings |
| `font-size-3xl` | 2.25rem (36px) | 1.1 | Display text |
| `font-size-4xl` | 3rem (48px) | 1 | Hero text |

### Responsive Implementation

```yaml
/* Fluid typography with clamp() */
.heading-1 {
  font-size: clamp(
    var(--font-size-2xl),  /* minimum */
    4vw,                   /* preferred */
    var(--font-size-4xl)   /* maximum */
  );
}
```

## Font Weights

Carefully selected weights provide clear hierarchy without overwhelming:

| Token | Weight | Usage |
|-------|--------|--------|
| `font-weight-normal` | 400 | Body text, default |
| `font-weight-medium` | 500 | Subtle emphasis |
| `font-weight-semibold` | 600 | Headings, buttons |
| `font-weight-bold` | 700 | Strong emphasis |

## Line Height

Optimized for readability across different contexts:

| Token | Value | Usage |
|-------|-------|--------|
| `line-height-tight` | 1.2 | Large headings |
| `line-height-snug` | 1.35 | Small headings |
| `line-height-normal` | 1.5 | Body text |
| `line-height-relaxed` | 1.65 | Long-form reading |
| `line-height-loose` | 2 | Sparse layouts |

## Letter Spacing

Fine-tuned tracking for optimal legibility:

| Token | Value | Usage |
|-------|-------|--------|
| `letter-spacing-tight` | -0.02em | Display text |
| `letter-spacing-normal` | 0 | Body text |
| `letter-spacing-wide` | 0.02em | Uppercase text |
| `letter-spacing-wider` | 0.05em | Small caps |

## Semantic Styles

Pre-composed styles for common text patterns:

### Headings

```yaml
.heading-1 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
}

.heading-2 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
}

.heading-3 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
}
```

### Body Text

```yaml
.body-large {
  font-size: var(--font-size-md);
  line-height: var(--line-height-relaxed);
}

.body-default {
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
}

.body-small {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
}
```

### Special Purpose

```yaml
.caption {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-normal);
  color: var(--color-neutral-60);
}

.overline {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-wider);
  text-transform: uppercase;
}

.code {
  font-family: var(--font-family-mono);
  font-size: 0.875em;
  background: var(--color-neutral-95);
  padding: 0.125em 0.25em;
  border-radius: var(--radius-sm);
}
```

## Accessibility Considerations

### Minimum Sizes

- **Body text**: Never smaller than 16px (1rem)
- **Interactive text**: Minimum 14px (0.875rem)
- **Legal text**: Can use 12px (0.75rem) sparingly

### Contrast Requirements

All text meets WCAG contrast requirements:

- **Normal text**: 4.5:1 minimum contrast
- **Large text** (18px+): 3:1 minimum contrast
- **Non-text elements**: 3:1 minimum contrast

### Reading Experience

- **Line length**: 45-75 characters for optimal reading
- **Paragraph spacing**: 1.5x line height
- **Text alignment**: Left-aligned for LTR languages
- **Avoid justification**: Can create uneven spacing

## Implementation Examples

### React Component

```typescript
import { Text } from '@terroir/react';

function Article() {
  return (
    <>
      <Text as="h1" variant="heading-1">
        Article Title
      </Text>
      <Text as="p" variant="body-large" color="neutral-60">
        Article summary that provides context...
      </Text>
      <Text as="p">
        Main article content with default styling...
      </Text>
    </>
  );
}
```

### CSS Classes

```text
<article>
  <h1 class="heading-1">Article Title</h1>
  <p class="body-large text-neutral-60">
    Article summary that provides context...
  </p>
  <p class="body-default">
    Main article content with default styling...
  </p>
</article>
```

### Design Tokens

```typescript
import { tokens } from '@terroir/core';

const styles = {
  fontSize: tokens.fontSize.lg,
  fontWeight: tokens.fontWeight.semibold,
  lineHeight: tokens.lineHeight.snug,
};
```

## Variable Fonts

For projects requiring more typographic control, we support variable fonts:

```yaml
@font-face {
  font-family: 'Inter var';
  src: url('/fonts/Inter.var.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-display: swap;
}

/* Use with custom properties */
.custom-weight {
  font-family: 'Inter var', var(--font-family-base);
  font-variation-settings: 'wght' var(--font-weight-custom, 400);
}
```

## Performance Optimization

### Font Loading Strategy

```yaml
<!-- Preload critical fonts -->
<link rel="preload" href="/fonts/Inter-Regular.woff2" as="font" type="font/woff2" crossorigin>

<!-- Font-display: swap for non-critical fonts -->
<style>
  @font-face {
    font-family: 'Brand Font';
    src: url('/fonts/brand.woff2') format('woff2');
    font-display: swap;
  }
</style>
```

### Subsetting

Reduce font file sizes by subsetting to required characters:

```yaml
/* Latin subset for body text */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, 
                 U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, 
                 U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215;
}
```

## Platform Considerations

### iOS/macOS

- Respects Dynamic Type settings
- Uses SF Pro Display for headings
- Falls back to system fonts gracefully

### Android

- Supports Material Design typography
- Scales with system font size
- Maintains readability in all languages

### Web

- Progressive enhancement approach
- Fallback fonts for older browsers
- Print stylesheet optimizations

## Best Practices

### Do's

- ✅ Use semantic HTML elements (h1-h6, p, etc.)
- ✅ Maintain consistent hierarchy
- ✅ Test with real content
- ✅ Respect user preferences
- ✅ Optimize for readability

### Don'ts

- ❌ Don't use more than 2-3 font families
- ❌ Don't set line-height with unitless values < 1.2
- ❌ Don't use font sizes smaller than 14px for interactive elements
- ❌ Don't rely solely on font weight for hierarchy
- ❌ Don't forget to test with different languages

## Related Resources

- [Design Principles](./design-principles.md) - Core principles behind our typography
- [Accessibility](./accessibility.md) - Detailed accessibility guidelines
- [Color System](./color-system.md) - How typography and color work together
- [Token System](../guides/token-system.md) - Using typography tokens
