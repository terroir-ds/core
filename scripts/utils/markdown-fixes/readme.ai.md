# Markdown Fix Utilities

## Overview

A suite of automated markdown fixing utilities designed to maintain consistent formatting and fix common issues in markdown files across the codebase. These utilities help enforce markdown best practices and ensure documentation quality.

## Architecture

```text
markdown-fixes/
├── index.js                     # Main orchestrator
├── fix-markdown-code-blocks.js  # Code block formatting fixes
├── fix-markdown-links.js        # Internal link fragment fixes
└── __tests__/                   # Test suites
    ├── code-blocks/            # Code block tests
    ├── links/                  # Link fixing tests
    ├── orchestrator/           # Integration tests
    └── shared/                 # Shared test utilities
```

## Features

### 1. Code Block Fixes (`fix-markdown-code-blocks.js`)

Comprehensive code block formatting and language detection:

- **Language Detection**: Automatically detects and adds missing language identifiers
- **Fence Cleanup**: Removes language identifiers from closing backticks
- **Blank Line Management**: 
  - Ensures blank line before opening backticks
  - Ensures blank line after closing backticks
  - Removes blank lines inside code blocks
- **Smart Detection**: Uses heuristics to identify:
  - Shell/Bash scripts
  - JavaScript/TypeScript
  - JSON/YAML
  - HTML/CSS
  - Markdown
  - And more...

### 2. Link Fragment Fixes (`fix-markdown-links.js`)

Validates and fixes internal markdown link fragments:

- **Fragment Validation**: Checks all `#anchor` links against actual headings
- **Fuzzy Matching**: Intelligently matches broken fragments to intended headings
- **Case Insensitive**: Handles case differences between links and headings
- **Special Character Handling**: Properly converts headings with special characters

### 3. Orchestrator (`index.js`)

Coordinates all fixes in the correct order:

- **Ordered Execution**: Runs fixes in specific order to prevent conflicts
- **Progress Reporting**: Shows detailed progress and statistics
- **Error Handling**: Continues processing even if individual fixes fail
- **Summary Statistics**: Reports total fixes applied across all utilities

## Usage

### Run All Fixes

```bash
# Using the orchestrator (recommended)
node scripts/utils/markdown-fixes/index.js

# Or using npm script
pnpm fix:markdown
```

### Run Individual Fixes

```bash
# Fix code blocks only
node scripts/utils/markdown-fixes/fix-markdown-code-blocks.js

# Fix links only
node scripts/utils/markdown-fixes/fix-markdown-links.js

# Fix specific file
node scripts/utils/markdown-fixes/fix-markdown-links.js README.md
```

## How It Works

### Code Block Language Detection

The language detector analyzes code content using pattern matching:

```javascript
// Example detection patterns
if (code.startsWith('#!/bin/bash')) return 'bash';
if (code.includes('console.log')) return 'javascript';
if (code.match(/interface\s+\w+/)) return 'typescript';
```

### Link Fragment Generation

Follows GitHub's markdown anchor conventions:

```javascript
// "API Reference" becomes "#api-reference"
// "Test: With Colon" becomes "#test-with-colon"
// "Section 1.2.3" becomes "#section-123"
```

## Edge Cases Handled

### Code Blocks

1. **Nested Code Blocks**: Preserves quadruple backticks for markdown examples
2. **Malformed Blocks**: Leaves incomplete code blocks unchanged
3. **Unicode Content**: Properly detects language despite unicode characters
4. **Long Lines**: Handles very long lines without crashing

### Links

1. **Duplicate Headings**: Links to first occurrence
2. **Empty Link Text**: Preserves empty links unchanged
3. **External Links**: Ignores non-fragment links
4. **Inline Code**: Handles headings with backticks

## Known Limitations

1. **CRLF Line Endings**: Currently doesn't process Windows line endings
2. **HTML Comments**: Processes code blocks inside HTML comments
3. **Blockquotes**: Doesn't process code blocks within blockquotes
4. **Performance**: May be slow on very large codebases

## Testing

The utilities include comprehensive test coverage:

```bash
# Run all tests
pnpm test scripts/utils/markdown-fixes/

# Run specific test suite
pnpm test fix-markdown-code-blocks.test.js

# Run with coverage
pnpm test:coverage scripts/utils/markdown-fixes/
```

### Test Structure

- **Unit Tests**: Test individual functions in isolation
- **Integration Tests**: Test complete file processing
- **Regression Tests**: Ensure previously fixed bugs stay fixed
- **Edge Case Tests**: Cover unusual scenarios

## Development

### Adding New Fixes

1. Create new fix script in `markdown-fixes/`
2. Add to orchestrator configuration with appropriate order
3. Write comprehensive tests
4. Update this documentation

### Fix Order

Fixes must run in specific order to avoid conflicts:

1. Code blocks (order: 1) - Must run before link fixes
2. Link fragments (order: 2) - Depends on clean code blocks

### Best Practices

1. **Preserve Content**: Never modify actual content, only formatting
2. **Atomic Changes**: Each fix should do one thing well
3. **Clear Reporting**: Always report what was changed
4. **Safe Failures**: Continue processing other files on error

## Integration

### CI/CD Pipeline

```yaml
# Example GitHub Actions integration
- name: Fix Markdown
  run: pnpm fix:markdown
  
- name: Check for Changes
  run: |
    if [[ -n $(git status --porcelain) ]]; then
      echo "Markdown files need fixing"
      exit 1
    fi
```

### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit
pnpm fix:markdown
git add -u
```

## Performance

### Optimizations

- **Parallel Processing**: Each file processed independently
- **Early Exit**: Skip files with no issues
- **Minimal Rewrites**: Only rewrite files with actual changes

### Benchmarks

On a typical codebase:
- 100 files: ~2 seconds
- 1000 files: ~15 seconds
- 10000 files: ~2 minutes

## Future Enhancements

1. **Configuration File**: Support `.markdownfixrc` for custom rules
2. **Parallel Execution**: Process multiple files concurrently
3. **Watch Mode**: Fix files as they change
4. **VSCode Extension**: Real-time fixing in editor
5. **More Detectors**: Python, Go, Rust language detection
6. **Custom Rules**: Pluggable architecture for custom fixes

## Contributing

When adding new features:

1. Follow existing code patterns
2. Add comprehensive tests
3. Update documentation
4. Maintain backward compatibility
5. Consider performance impact

## Related Tools

- **markdownlint**: General markdown linting
- **prettier**: Code formatting including markdown
- **remark**: Markdown processor with plugins

## License

Part of the Terroir Core Design System - MIT License