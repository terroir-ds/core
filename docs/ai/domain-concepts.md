# Domain Concepts

## Design System Terminology

### Core Concepts

**Design Token**
A named design decision (color, spacing, typography) that can be reused across platforms and frameworks.

**Token Tier**

- **Primitive**: Raw values (`color.blue.500`)
- **Semantic**: Meaningful names (`color.primary`)
- **Component**: Specific usage (`button.background`)

**Theme**
A complete set of design tokens that define the visual appearance. Common themes: light, dark, high-contrast.

### Color System

**Material Color Utilities**
Google's algorithm for generating perceptually uniform color palettes from a source color.

**Tonal Palette**
A 13-step gradation from light to dark for a single hue, with tones: 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100.

**Color Roles**

- **Primary**: Main brand color
- **Secondary**: Supporting brand color
- **Tertiary**: Accent color
- **Error**: Error states
- **Neutral**: Grays and backgrounds

**Contrast Level**
Adjustment for WCAG compliance (-1.0 to 1.0, where 0 is default, positive increases contrast).

### Typography

**Type Scale**
Hierarchical sizing system for text (display, headline, title, body, label).

**System Font Stack**
Fallback chain of fonts optimized for each platform.

**Variable Fonts**
Fonts with adjustable weight, width, and other properties.

### Layout & Spacing

**Spacing Scale**
Consistent measurements based on a base unit (typically 4px or 8px).

**Breakpoints**
Screen size thresholds for responsive design (mobile, tablet, desktop).

**Grid System**
Column-based layout structure with gutters and margins.

### Component Architecture

**Compound Component**
Components composed of multiple sub-components (e.g., Card with CardHeader, CardBody).

**Controlled Component**
Component whose state is managed by its parent.

**Polymorphic Component**
Component that can render as different HTML elements.

### Build & Tooling

**Style Dictionary**
Amazon's build system for transforming design tokens to various platforms.

**Token Transformation**
Converting tokens from one format to another (JSON → CSS, iOS, Android).

**SVGO**
SVG Optimizer for reducing file size and applying transformations.

**Sharp**
High-performance image processing library for Node.js.

### Testing & Quality

**Visual Regression**
Detecting unintended visual changes by comparing screenshots.

**WCAG**
Web Content Accessibility Guidelines for ensuring accessibility.

**Contrast Ratio**
Mathematical relationship between foreground and background colors (AA: 4.5:1, AAA: 7:1).

**Touch Target**
Minimum interactive area size (44x44px for mobile).

### Performance

**Tree Shaking**
Removing unused code during bundling.

**Critical CSS**
Styles needed for above-the-fold content.

**Code Splitting**
Breaking bundles into smaller chunks loaded on demand.

### Patterns & Practices

**Atomic Design**
Methodology for creating design systems (atoms → molecules → organisms).

**BEM**
Block Element Modifier naming convention for CSS.

**CSS-in-JS**
Writing styles in JavaScript for component encapsulation.

**Design-Development Handoff**
Process of translating designs into code using tokens.

## AI Metadata

```text
stability: stable
token_cost: 600
last_updated: 2025-06-29
```
