# Design System Repository Architecture

## Splitting into a Separate Repository

### Benefits of a Separate Design System Repo

1. **Reusability**: Use the same design system across multiple projects
2. **Independent Versioning**: Design system can evolve separately
3. **Team Separation**: Designers can work without affecting app code
4. **Clean Dependencies**: Apps only import what they need
5. **Open Source Potential**: Could share the design system publicly

### Repository Structure

```
stoic-design-system/                 (Separate Repository)
├── .github/
│   └── workflows/
│       ├── release.yml              # Automated npm publishing
│       └── visual-regression.yml    # Screenshot tests
├── tokens/
│   ├── base/                        # Base token definitions
│   ├── themes/                      # Theme variations
│   └── brands/                      # Multi-brand support
├── assets/
│   ├── icons/                       # SVG templates
│   ├── fonts/                       # Web fonts
│   └── images/                      # Brand assets
├── packages/                        # Monorepo structure
│   ├── core/                        # Core tokens & utilities
│   ├── react/                       # React components
│   ├── vue/                         # Vue components (future)
│   └── web-components/              # Framework agnostic
├── scripts/                         # Build scripts
├── docs/                           # Storybook & documentation
└── package.json

employment-pipeline/                 (Main Repository)
├── design-system/                   # Git submodule
├── frontend/
├── backend/
└── extension/
```

### Option 1: Git Submodule Approach

```bash
# Initial setup
cd employment-pipeline
git submodule add https://github.com/yourusername/stoic-design-system design-system
git submodule update --init --recursive

# .gitmodules
[submodule "design-system"]
    path = design-system
    url = https://github.com/yourusername/stoic-design-system
    branch = main

# Update to latest
git submodule update --remote design-system

# Lock to specific version
cd design-system
git checkout v1.2.3
cd ..
git add design-system
git commit -m "Lock design system to v1.2.3"
```

#### Pros:

- Version locking per project
- Code is local for development
- Can make temporary modifications

#### Cons:

- Submodules can be confusing
- Need to remember to update
- Cloning requires --recursive

### Option 2: NPM Package Approach (Recommended)

```json
// stoic-design-system/package.json
{
  "name": "@stoic/design-system",
  "version": "1.0.0",
  "exports": {
    "./tokens": "./dist/tokens/index.js",
    "./tokens/css": "./dist/css/tokens.css",
    "./react": "./dist/react/index.js",
    "./icons": "./dist/icons/index.js",
    "./fonts": "./dist/fonts/fonts.css"
  },
  "files": [
    "dist",
    "tokens",
    "README.md"
  ]
}

// employment-pipeline/package.json
{
  "dependencies": {
    "@stoic/design-system": "^1.0.0"
  }
}
```

#### Usage in Projects:

```javascript
// Import tokens
import { colors, spacing } from '@stoic/design-system/tokens';

// Import CSS
import '@stoic/design-system/tokens/css';

// Import React components
import { Button, Card } from '@stoic/design-system/react';

// Import icons
import { SearchIcon } from '@stoic/design-system/icons';
```

### Option 3: Hybrid Approach (Best of Both)

Use NPM for production, git submodule for development:

```json
// employment-pipeline/package.json
{
  "dependencies": {
    "@stoic/design-system": "file:./design-system" // During development
    // "@stoic/design-system": "^1.0.0"           // For production
  }
}
```

### Development Workflow

```bash
# Development setup script
#!/bin/bash
if [ ! -d "design-system" ]; then
  git submodule add https://github.com/yourusername/stoic-design-system design-system
fi

# Link for local development
cd design-system && npm link
cd .. && npm link @stoic/design-system
```

### CI/CD Integration

```yaml
# .github/workflows/design-system-integration.yml
name: Design System Integration
on:
  schedule:
    - cron: '0 8 * * 1' # Weekly on Mondays
  workflow_dispatch:

jobs:
  update-design-system:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true

      - name: Update Design System
        run: |
          git submodule update --remote design-system
          cd design-system
          VERSION=$(git describe --tags --abbrev=0)
          cd ..

      - name: Run Visual Regression Tests
        run: npm run test:visual

      - name: Create PR if Changes
        uses: peter-evans/create-pull-request@v5
        with:
          title: 'chore: Update design system to ${{ env.VERSION }}'
          branch: update-design-system
```

### Publishing Workflow

```javascript
// stoic-design-system/scripts/release.js
import { execSync } from 'child_process';

async function release() {
  // 1. Build all packages
  execSync('npm run build:all');

  // 2. Run tests
  execSync('npm test');

  // 3. Generate changelog
  execSync('npm run changelog');

  // 4. Version bump
  execSync('npm version minor');

  // 5. Publish to NPM
  execSync('npm publish --access public');

  // 6. Create GitHub release
  execSync('gh release create');

  // 7. Deploy docs
  execSync('npm run deploy:docs');
}
```

### Multi-Project Benefits

```
stoic-studio/
├── employment-pipeline/
│   └── uses @stoic/design-system@^1.0.0
├── analytics-dashboard/
│   └── uses @stoic/design-system@^1.0.0
├── marketing-site/
│   └── uses @stoic/design-system@^1.0.0
└── stoic-design-system/
    └── source repository
```

### Migration Strategy

1. **Phase 1**: Create design system repo, copy existing tokens
2. **Phase 2**: Set up build pipeline and publishing
3. **Phase 3**: Add as submodule to employment-pipeline
4. **Phase 4**: Gradually migrate imports
5. **Phase 5**: Remove local design files
6. **Phase 6**: Switch to NPM package for production

### Package Structure

```javascript
// @stoic/design-system exports
export {
  // Tokens
  tokens,
  colors,
  spacing,
  typography,

  // Utilities
  generateColorSystem,
  validateContrast,

  // Components (if included)
  Button,
  Card,
  Input,

  // Icons
  icons,
  Icon,

  // Hooks (if React)
  useTheme,
  useDesignTokens,
};
```

## Recommendation

**Start with the Hybrid Approach**:

1. Create separate repo
2. Add as git submodule for development
3. Publish to NPM when stable
4. Other projects can consume via NPM
5. Keep submodule for employment-pipeline active development

This gives you the flexibility of local development with the distribution benefits of NPM packages!
