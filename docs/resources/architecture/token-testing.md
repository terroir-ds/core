# Design Token Testing Strategy

## WCAG Color Contrast Testing

### 1. Token Naming Convention for Relationships

Define color relationships through naming conventions:

```json
{
  "color": {
    "surface": {
      "primary": { "value": "#0066cc" },
      "primary-subtle": { "value": "#e6f0ff" }
    },
    "content": {
      "on-primary": { "value": "#ffffff" },
      "on-primary-subtle": { "value": "#0066cc" }
    }
  }
}
```text
**Naming Pattern**: `on-{background}` indicates text/content color for that background

### 2. Contrast Testing Implementation

```javascript
// design-system/scripts/test-contrast.js
import { getContrast } from 'color-contrast-checker';
import tokens from '../dist/tokens.json';

const WCAG_STANDARDS = {
  'AA-normal': 4.5,
  'AA-large': 3,
  'AAA-normal': 7,
  'AAA-large': 4.5,
};

function findColorPairs(tokens) {
  const pairs = [];

  // Find all background colors
  Object.entries(tokens.color.surface).forEach(([name, token]) => {
    // Look for corresponding content colors
    const contentKey = `on-${name}`;
    const contentColor = tokens.color.content[contentKey];

    if (contentColor) {
      pairs.push({
        background: { name, value: token.value },
        foreground: { name: contentKey, value: contentColor.value },
        contexts: token.contexts || ['normal', 'large'],
      });
    }
  });

  return pairs;
}

function testContrast(pairs) {
  const results = [];
  const failures = [];

  pairs.forEach((pair) => {
    const ratio = getContrast(pair.background.value, pair.foreground.value);

    const tests = {
      'AA-normal': ratio >= WCAG_STANDARDS['AA-normal'],
      'AA-large': ratio >= WCAG_STANDARDS['AA-large'],
      'AAA-normal': ratio >= WCAG_STANDARDS['AAA-normal'],
      'AAA-large': ratio >= WCAG_STANDARDS['AAA-large'],
    };

    const result = {
      ...pair,
      ratio,
      tests,
      passes: pair.contexts.every(
        (ctx) => tests[`AA-${ctx}`] // Minimum AA compliance
      ),
    };

    results.push(result);

    if (!result.passes) {
      failures.push(result);
    }
  });

  return { results, failures };
}
```text
### 3. Token Metadata for Testing

Enhance tokens with accessibility metadata:

```json
{
  "color": {
    "surface": {
      "primary": {
        "value": "#0066cc",
        "contexts": ["normal", "large"],
        "contrast": {
          "requires": ["AA"],
          "with": ["on-primary", "on-primary-subtle"]
        }
      }
    },
    "content": {
      "on-primary": {
        "value": "#ffffff",
        "type": "text",
        "contexts": ["normal", "large"],
        "contrast": {
          "against": "surface.primary",
          "standard": "AA"
        }
      }
    }
  }
}
```text
### 4. Build-time Testing

```javascript
// design-system/scripts/build-assets.js
import { testColorContrast } from './test-contrast.js';

async function buildAssets() {
  // 1. Build tokens
  await buildTokens();

  // 2. Test contrast
  const { failures } = await testColorContrast();

  if (failures.length > 0) {
    console.error('❌ WCAG Contrast Failures:');
    failures.forEach((f) => {
      console.error(`  ${f.background.name} + ${f.foreground.name}: ${f.ratio.toFixed(2)}`);
    });

    if (process.env.CI || process.env.STRICT_CONTRAST) {
      process.exit(1);
    }
  }

  // 3. Continue with asset generation...
}
```text
### 5. Git Hook Integration

```javascript
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Test contrast if token files changed
if git diff --cached --name-only | grep -E "tokens/.*\.json$"; then
  echo "🎨 Testing WCAG color contrast..."
  npm run design:test:contrast || {
    echo "❌ Contrast test failed. Fix accessibility issues before committing."
    exit 1
  }
fi
```text
### 6. Visual Regression Testing

```javascript
// design-system/tests/visual-regression.test.js
import { test } from '@playwright/test';
import tokens from '../dist/tokens.json';

// Generate test cases from tokens
const colorPairs = findColorPairs(tokens);

colorPairs.forEach((pair) => {
  test(`Contrast: ${pair.background.name} + ${pair.foreground.name}`, async ({ page }) => {
    await page.goto('/design-system/contrast-test');

    await page.evaluate(
      ({ bg, fg }) => {
        document.body.style.backgroundColor = bg;
        document.body.style.color = fg;
      },
      { bg: pair.background.value, fg: pair.foreground.value }
    );

    await expect(page).toHaveScreenshot(`contrast-${pair.background.name}.png`);
  });
});
```text
### 7. Continuous Monitoring

```javascript
// design-system/scripts/contrast-report.js
import { generateContrastReport } from './test-contrast.js';

async function generateReport() {
  const report = await generateContrastReport();

  // Generate HTML report
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>WCAG Contrast Report</title>
      <style>
        .pass { background: #d4edda; }
        .fail { background: #f8d7da; }
        .sample { padding: 20px; margin: 10px; }
      </style>
    </head>
    <body>
      <h1>Color Contrast Report</h1>
      ${report.results
        .map(
          (r) => `
        <div class="sample ${r.passes ? 'pass' : 'fail'}" 
             style="background: ${r.background.value}; color: ${r.foreground.value}">
          <h2>${r.background.name} + ${r.foreground.name}</h2>
          <p>Contrast Ratio: ${r.ratio.toFixed(2)}</p>
          <p>AA Normal: ${r.tests['AA-normal'] ? '✅' : '❌'}</p>
          <p>AAA Normal: ${r.tests['AAA-normal'] ? '✅' : '❌'}</p>
        </div>
      `
        )
        .join('')}
    </body>
    </html>
  `;

  await fs.writeFile('dist/contrast-report.html', html);
}
```text
### 8. Integration with Style Dictionary

```javascript
// style-dictionary.config.js
module.exports = {
  hooks: {
    parsers: {
      'contrast-validation': {
        pattern: /\.json$/,
        parse: ({ contents, filePath }) => {
          const tokens = JSON.parse(contents);
          // Validate contrast relationships during parsing
          validateContrastPairs(tokens);
          return tokens;
        },
      },
    },
    formats: {
      'wcag-report': function ({ dictionary }) {
        // Generate WCAG compliance report
        return generateWCAGReport(dictionary.tokens);
      },
    },
  },
  platforms: {
    wcag: {
      files: [
        {
          destination: 'wcag-compliance.json',
          format: 'wcag-report',
        },
      ],
    },
  },
};
```text
### 9. Testing Commands

```json
{
  "scripts": {
    "design:test": "npm run design:test:contrast && npm run design:test:visual",
    "design:test:contrast": "node design-system/scripts/test-contrast.js",
    "design:test:visual": "playwright test design-system/tests",
    "design:test:watch": "nodemon -w tokens -x 'npm run design:test:contrast'",
    "design:report": "node design-system/scripts/contrast-report.js"
  }
}
```text
### 10. CI/CD Integration

```yaml
# .github/workflows/design-system.yml
name: Design System Testing
on:
  pull_request:
    paths:
      - 'tokens/**'
      - 'design-system/**'

jobs:
  test-accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - run: npm ci
      - run: npm run design:build

      # Test contrast
      - run: npm run design:test:contrast
        env:
          STRICT_CONTRAST: true

      # Generate report
      - run: npm run design:report

      # Upload report
      - uses: actions/upload-artifact@v3
        with:
          name: contrast-report
          path: dist/contrast-report.html

      # Comment on PR
      - uses: actions/github-script@v6
        if: failure()
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '❌ WCAG contrast tests failed. See artifacts for detailed report.'
            })
```

## Benefits

This testing approach provides:

1. **Automated compliance checking** at build time
2. **Git hook protection** against bad commits
3. **Visual regression testing** for UI consistency
4. **Continuous monitoring** with reports
5. **CI/CD integration** for PR validation
6. **Clear naming conventions** for color relationships
7. **Flexible standards** (AA vs AAA, normal vs large text)
8. **Developer feedback** during development

The system catches accessibility issues early, maintaining WCAG compliance throughout the design system lifecycle.
