#!/usr/bin/env node

/**
 * @fileoverview Standardizes package.json scripts across all workspace packages
 * 
 * Ensures all packages have a consistent set of scripts for:
 * - Building
 * - Testing
 * - Linting
 * - Type checking
 * - Development
 * 
 * This makes the monorepo easier to maintain and ensures developers
 * can use the same commands in any package.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '../..');

// Simple logger for scripts (console is allowed in scripts)
const logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  warn: (msg) => process.stdout.write(`⚠️  ${msg}\n`),
  success: (msg) => process.stdout.write(`✅ ${msg}\n`),
  skip: (msg) => process.stdout.write(`⏭️  ${msg}\n`),
};

/**
 * Standard scripts that should be present in all packages
 * Some may be overridden based on package type
 */
const STANDARD_SCRIPTS = {
  // Build scripts
  build: {
    default: 'pnpm clean && tsc',
    'docs-site': 'astro build',
  },
  clean: {
    default: 'del dist',
    'docs-site': 'del dist .astro',
  },
  
  // Development scripts
  dev: {
    default: 'tsc --watch',
    'docs-site': 'astro dev',
  },
  
  // Linting scripts
  lint: {
    default: 'eslint . --ext .ts,.tsx,.js,.jsx',
  },
  'lint:fix': {
    default: 'pnpm fix',
  },
  fix: {
    default: 'eslint . --ext .ts,.tsx,.js,.jsx --fix',
  },
  
  // Testing scripts
  test: {
    default: 'vitest run',
    'docs-site': 'pnpm test:type', // Docs site only does type checking
    react: 'vitest run',
    'web-components': 'vitest run',
  },
  'test:watch': {
    default: 'vitest watch',
    'docs-site': undefined, // No watch mode for docs
  },
  'test:coverage': {
    default: 'vitest run --coverage',
    'docs-site': undefined, // No coverage for docs
  },
  'test:type': {
    default: 'tsc --noEmit',
    'docs-site': 'astro check && tsc --noEmit',
  },
  
  // Type checking alias for consistency
  typecheck: {
    default: 'pnpm test:type',
  },
};

/**
 * Get the appropriate script for a package
 */
function getScriptForPackage(scriptName, packageName) {
  const script = STANDARD_SCRIPTS[scriptName];
  if (!script) return undefined;
  
  // Check if there's a package-specific override
  if (script[packageName] !== undefined) {
    return script[packageName];
  }
  
  return script.default;
}

/**
 * Update package.json with standard scripts
 */
function updatePackageScripts(packagePath) {
  const packageJsonPath = join(packagePath, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    logger.skip(`Skipping ${packagePath} (no package.json)`);
    return;
  }
  
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const packageName = packageJson.name?.split('/')[1] || 'unknown';
  
  logger.info(`\n📦 Processing ${packageJson.name}...`);
  
  // Initialize scripts if not present
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  const existingScripts = { ...packageJson.scripts };
  const updates = [];
  
  // Add standard scripts
  for (const [scriptName] of Object.entries(STANDARD_SCRIPTS)) {
    const newScript = getScriptForPackage(scriptName, packageName);
    
    // Skip if script should not exist for this package
    if (newScript === undefined) continue;
    
    // Check if script is missing or different
    if (!existingScripts[scriptName]) {
      packageJson.scripts[scriptName] = newScript;
      updates.push(`  ✅ Added: ${scriptName}`);
    } else if (existingScripts[scriptName] !== newScript && !scriptName.includes('build')) {
      // Don't override build scripts as they may be customized
      logger.info(`  ℹ️  Keeping existing: ${scriptName} (differs from standard)`);
    }
  }
  
  // Sort scripts alphabetically for consistency
  const sortedScripts = Object.keys(packageJson.scripts)
    .sort()
    .reduce((acc, key) => {
      acc[key] = packageJson.scripts[key];
      return acc;
    }, {});
  
  packageJson.scripts = sortedScripts;
  
  // Write updates
  if (updates.length > 0) {
    writeFileSync(
      packageJsonPath,
      `${JSON.stringify(packageJson, null, 2)  }\n`
    );
    logger.info('Updated scripts:');
    updates.forEach(update => logger.info(update));
  } else {
    logger.success('  All standard scripts already present');
  }
}

/**
 * Main function
 */
function main() {
  logger.info('🔧 Standardizing package scripts...\n');
  
  const packages = [
    join(rootDir, 'packages/core'),
    join(rootDir, 'packages/docs-site'),
    join(rootDir, 'packages/react'),
    join(rootDir, 'packages/web-components'),
  ];
  
  packages.forEach(updatePackageScripts);
  
  logger.success('\nScript standardization complete!');
  logger.info('\nNote: Some scripts may need manual adjustment based on package specifics.');
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}