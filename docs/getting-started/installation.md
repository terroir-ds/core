# Installation

Get Terroir Core up and running in your project with these simple installation steps.

## Prerequisites

Before installing Terroir Core, ensure you have:

- **Node.js 18+** (check with `node --version`)
- **pnpm 8+** (we recommend pnpm over npm for better performance)

### Installing pnpm

If you don't have pnpm installed:

````bash
# Install pnpm globally
npm install -g pnpm

# Or using Node.js Corepack (recommended)
corepack enable
corepack prepare pnpm@latest --activate
```text
## Quick Installation

### Option 1: NPM Package (Recommended)

```bash
# Install the core package
pnpm add @terroir/core

# Install React components (if using React)
pnpm add @terroir/react

# Install development dependencies for token generation
pnpm add -D @terroir/build-tools
```text
### Option 2: Git Submodule

For projects that want to customize tokens directly:

```bash
# Add as submodule
git submodule add https://github.com/terroir-ds/core design-system
cd design-system

# Install dependencies
pnpm install

# Build tokens
pnpm build
```text
## Framework-Specific Setup

### React Projects

```bash
# Install React components
pnpm add @terroir/core @terroir/react

# Install CSS processing tools
pnpm add -D postcss autoprefixer
```text
### Vue Projects

```bash
# Install core tokens
pnpm add @terroir/core

# CSS processing
pnpm add -D postcss autoprefixer
```text
### Vanilla JavaScript

```bash
# Core tokens only
pnpm add @terroir/core
```text
## Verification

Verify your installation works:

```javascript
// Test import
import { tokens } from '@terroir/core';
import { generateColorSystem } from '@terroir/core/colors';

console.log('✅ Terroir Core installed successfully!');
console.log('Available tokens:', Object.keys(tokens));
````

## Next Steps

Now that Terroir Core is installed:

1. **[Quick Start](./quick-start.md)** - Build your first component
2. **[Examples](./examples.md)** - See real implementations
3. **[API Reference](../api/README.md)** - Learn about the API

## Troubleshooting

### Common Issues

**`Cannot resolve @terroir/core`**

- Ensure you're using the correct package name
- Check that the package was installed in your dependencies

**`Module not found: 'pnpm'`**

- Install pnpm globally: `npm install -g pnpm`
- Or use npx: `npx pnpm install`

#### TypeScript errors

- Ensure you have `@types/node` installed
- Check that your tsconfig.json includes proper module resolution

### Getting Help

If you encounter issues:

1. Check the project documentation
2. Search [existing issues](https://github.com/terroir-ds/core/issues)
3. Ask in [GitHub Discussions](https://github.com/terroir-ds/core/discussions)

## Platform Support

### Browsers

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Node.js

- Node.js 18+ (LTS recommended)
- NPM 8+ or pnpm 8+

### Frameworks

- React 17+
- Vue 3+
- Angular 12+
- Vanilla JavaScript (ES2020+)
