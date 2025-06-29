#!/usr/bin/env node

/**
 * @module scripts/utils/markdown-fixes/index
 * @description Main entry point for markdown fixes. Orchestrates individual fix scripts
 * in the correct order to avoid conflicts between different types of fixes.
 * 
 * @example
 * ```bash
 * # Run all markdown fixes
 * node scripts/utils/markdown-fixes/index.js
 * 
 * # Or use npm script
 * pnpm fix:markdown
 * ```
 * 
 * @since 1.0.0
 * @requires node:child_process
 * @requires node:path
 * @requires node:url
 */

/* eslint-disable no-console */

import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @typedef {Object} FixConfig
 * @property {string} name - Script filename
 * @property {string} description - Human-readable description
 * @property {number} order - Execution order (lower runs first)
 */

/**
 * Fix configuration with order and description.
 * Order is important to prevent conflicts between fixes.
 * @type {FixConfig[]}
 */
const fixes = [
  {
    name: 'fix-markdown-code-blocks.js',
    description: 'Fix all code block issues (languages, blank lines, formatting)',
    order: 1
  },
  {
    name: 'fix-markdown-links.js',
    description: 'Fix broken internal link fragments',
    order: 2
  }
];

/**
 * @typedef {Object} FixResult
 * @property {boolean} success - Whether the fix completed successfully
 * @property {string} [output] - Script output if successful
 * @property {Error} [error] - Error object if failed
 */

/**
 * Run a fix script and capture results
 * @param {FixConfig} fix - Fix configuration object
 * @returns {FixResult} Results of running the fix
 */
function runFix(fix) {
  const scriptPath = join(__dirname, fix.name);
  console.log(`\n🔧 ${fix.description}...`);
  
  try {
    const output = execSync(`node ${scriptPath}`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    // Parse the output to get statistics
    const lines = output.split('\n');
    const summaryLine = lines.find(line => line.includes('Fixed') && line.includes('files'));
    
    if (summaryLine) {
      console.log(`   ${summaryLine.trim()}`);
    } else {
      console.log(output);
    }
    
    return { success: true, output };
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return { success: false, error };
  }
}

/**
 * Main orchestration function.
 * Runs all markdown fixes in order and reports results.
 * @async
 * @returns {Promise<void>}
 * @throws {Error} If any critical errors occur
 */
async function main() {
  console.log('🎯 Running all markdown fixes in order...\n');
  console.log('This ensures fixes are applied correctly without conflicts.');
  
  // Sort fixes by order
  const sortedFixes = fixes.sort((a, b) => a.order - b.order);
  
  const results = {
    total: sortedFixes.length,
    successful: 0,
    failed: 0
  };
  
  // Run each fix in order
  for (const fix of sortedFixes) {
    const result = runFix(fix);
    if (result.success) {
      results.successful++;
    } else {
      results.failed++;
    }
  }
  
  // Summary
  console.log(`\n${  '='.repeat(60)}`);
  console.log('📊 Summary:');
  console.log(`   Total fixes run: ${results.total}`);
  console.log(`   ✅ Successful: ${results.successful}`);
  if (results.failed > 0) {
    console.log(`   ❌ Failed: ${results.failed}`);
  }
  
  if (results.failed === 0) {
    console.log('\n✨ All markdown fixes completed successfully!');
  } else {
    console.log('\n⚠️  Some fixes failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('❌ Failed to run markdown fixes:', error);
  process.exit(1);
});