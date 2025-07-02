#!/usr/bin/env node

/**
 * @fileoverview Runs tests in batches to avoid memory/listener issues
 * 
 * This script is a workaround for Vitest crashes when running all tests at once.
 * It groups test files and runs them in smaller batches.
 */

import { execSync } from 'child_process';
import { readdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TEST_PATTERNS = [
  'packages/core/src/utils/async/__tests__/*.test.ts',
  'packages/core/src/utils/async/helpers/__tests__/*.test.ts',
  'packages/core/src/utils/errors/__tests__/*.test.ts',
  'packages/core/src/utils/guards/__tests__/*.test.ts',
  'packages/core/src/utils/logger/__tests__/*.test.ts',
  'packages/core/src/utils/security/__tests__/*.test.ts',
  'packages/core/src/utils/string/__tests__/*.test.ts',
  'packages/core/src/utils/shared/__tests__/*.test.ts',
];

async function runTestBatch(pattern, batchName) {
  console.log(`\n🧪 Running ${batchName} tests...`);
  try {
    // For simplicity, just run vitest with the pattern
    execSync(`pnpm vitest run '${pattern}'`, {
      stdio: 'inherit',
      cwd: dirname(__dirname)
    });
    
    console.log(`  ✅ ${batchName} tests passed`);
    return true;
  } catch (error) {
    console.error(`  ❌ ${batchName} tests failed`);
    return false;
  }
}

async function main() {
  console.log('🚀 Running tests in batches to avoid memory issues...\n');
  
  const results = [];
  
  // Run each test group separately
  results.push(await runTestBatch(TEST_PATTERNS[0], 'Async'));
  results.push(await runTestBatch(TEST_PATTERNS[1], 'Async Helpers'));
  results.push(await runTestBatch(TEST_PATTERNS[2], 'Errors'));
  results.push(await runTestBatch(TEST_PATTERNS[3], 'Guards'));
  results.push(await runTestBatch(TEST_PATTERNS[4], 'Logger'));
  results.push(await runTestBatch(TEST_PATTERNS[5], 'Security'));
  results.push(await runTestBatch(TEST_PATTERNS[6], 'String'));
  results.push(await runTestBatch(TEST_PATTERNS[7], 'Shared'));
  
  const failed = results.filter(r => !r).length;
  const passed = results.filter(r => r).length;
  
  console.log('\n📊 Summary:');
  console.log(`  ✅ Passed: ${passed} batches`);
  console.log(`  ❌ Failed: ${failed} batches`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(console.error);