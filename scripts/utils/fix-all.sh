#!/usr/bin/env bash
# Fix all linting issues automatically

set -e

# Get the root directory of the project
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "🔧 Running automated lint fixes..."
echo ""

# TypeScript/JavaScript fixes
echo "📝 Fixing TypeScript/JavaScript issues..."
if pnpm lint:ts:fix; then
  echo "✅ TypeScript/JavaScript fixes complete"
else
  echo "⚠️  Some TypeScript/JavaScript issues could not be fixed automatically"
fi
echo ""

# Run all markdown fixes first (before prettier/markdownlint)
echo "📄 Fixing Markdown code blocks and formatting..."
if node scripts/utils/markdown-fixes/index.js; then
  echo "✅ Markdown code block fixes complete"
else
  echo "⚠️  Some markdown fixes failed"
fi
echo ""

# Markdown linting fixes (after our custom fixes)
echo "📄 Fixing other Markdown issues with markdownlint..."
if pnpm lint:md:fix; then
  echo "✅ Markdown lint fixes complete"
else
  echo "⚠️  Some Markdown issues could not be fixed automatically"
fi
echo ""

# Prettier formatting
echo "🎨 Formatting with Prettier..."
if pnpm lint:prettier:fix; then
  echo "✅ Prettier formatting complete"
else
  echo "⚠️  Some formatting issues could not be fixed automatically"
fi
echo ""

# Sort package.json
echo "📦 Sorting package.json..."
if pnpm exec sort-package-json; then
  echo "✅ package.json sorted"
else
  echo "⚠️  Failed to sort package.json"
fi
echo ""

# Check what issues remain
echo "🔍 Checking for remaining issues..."
if pnpm lint; then
  echo ""
  echo "✨ All linting issues have been fixed!"
else
  echo ""
  echo "⚠️  Some issues could not be fixed automatically."
  echo "Please review the errors above and fix them manually."
fi