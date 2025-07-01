# Markdown Fix Utilities

A collection of scripts to automatically fix common markdown formatting issues, ensuring consistency and compliance with markdown best practices.

## Overview

These utilities help maintain clean, consistent markdown documentation by:

- Adding language identifiers to code blocks
- Ensuring proper blank line spacing around code blocks
- Fixing broken internal link fragments
- Removing incorrect formatting

## Scripts

### 1. `fix-markdown-code-blocks.js`

Fixes all code block-related issues:

- Adds appropriate language identifiers to opening backticks
- Removes language identifiers from closing backticks
- Ensures blank lines before code blocks
- Ensures blank lines after code blocks
- Removes blank lines inside code blocks
- Handles quadruple backticks correctly

**Usage:**

```bash
node scripts/utils/markdown-fixes/fix-markdown-code-blocks.js
```

### 2. `fix-markdown-links.js`

Fixes broken internal link fragments:

- Validates all internal link fragments match actual headings
- Converts heading text to proper fragment IDs
- Preserves link text while fixing fragments

**Usage:**

```bash
node scripts/utils/markdown-fixes/fix-markdown-links.js
```

### 3. `index.js` (Orchestrator)

Runs all markdown fixes in the correct order to avoid conflicts:

1. Code block fixes (first, as they may affect headings)
2. Link fixes (after code blocks are corrected)

**Usage:**

```bash
# Run all fixes
node scripts/utils/markdown-fixes/

# Or explicitly
node scripts/utils/markdown-fixes/index.js
```

## Code Block Rules

Based on CommonMark and GitHub Flavored Markdown standards:

1. **Opening backticks**:
   - Must have a language identifier (e.g., ` ```javascript`)
   - Must have a blank line before (unless at start of file)
   - No blank line after

2. **Closing backticks**:
   - No language identifier
   - Must have a blank line after (unless at end of file)
   - No blank line before

3. **Quadruple backticks**:
   - Used for nested code blocks
   - No language identifier added automatically

## Language Detection

The code block fixer automatically detects languages based on content:

- **Bash**: Shell commands, scripts starting with `#!`
- **JavaScript**: `const`, `let`, `var`, `console.log`, `require`
- **TypeScript**: Type annotations, interfaces, `.ts` imports
- **JSON**: Objects/arrays with proper JSON structure
- **YAML**: YAML structure with colons and indentation
- **Python**: `import`, `def`, `class`, Python-specific syntax
- **Markdown**: Headers starting with `#`
- **HTML**: HTML tags
- **CSS**: CSS selectors and properties

## Testing

Comprehensive test suite covering:

- Unit tests for individual functions
- Integration tests for full pipeline
- Performance tests for large files
- Regression tests for previously fixed bugs

Run tests:

```bash
pnpm vitest run scripts/utils/markdown-fixes/__tests__/
```

## Architecture

```text
markdown-fixes/
├── fix-markdown-code-blocks.js    # Code block fixes
├── fix-markdown-links.js          # Link fragment fixes
├── index.js                       # Orchestrator
├── README.md                      # This file
└── __tests__/                     # Test suite
    ├── code-blocks/              # Code block tests
    ├── links/                    # Link tests
    ├── orchestrator/             # Integration tests
    └── shared/                   # Common test utilities
```

## Development

When adding new fixes:

1. Create a new script file
2. Export necessary functions for testing
3. Add to orchestrator with appropriate order
4. Write comprehensive tests
5. Update this README

## Notes

- Scripts process all `.md` files recursively from current directory
- Original files are modified in-place (ensure files are backed up)
- Scripts are idempotent - running multiple times is safe
- Exit codes: 0 for success, 1 for errors
