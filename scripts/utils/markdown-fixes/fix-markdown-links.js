#!/usr/bin/env node

/**
 * @module scripts/utils/fix-markdown-links
 * 
 * Markdown link fragment validation and fixing utility.
 * 
 * Validates and fixes internal markdown link fragments (#anchor-links) to ensure
 * they match actual headings in the document. Automatically corrects broken
 * fragment identifiers using fuzzy matching to find the intended heading.
 * 
 * @example Run link fragment fixer
 * ```bash
 * node scripts/utils/fix-markdown-links.js [file.md]
 * ```
 * 
 * Features:
 * - Validates all internal link fragments
 * - Converts headings to proper fragment IDs
 * - Fuzzy matches broken links to likely headings
 * - Preserves link text while fixing fragments
 * - Reports all fixes made
 * 
 * Fragment ID rules:
 * - Convert to lowercase
 * - Remove special characters
 * - Replace spaces with hyphens
 * - Trim hyphens from start/end
 * 
 * Exit codes:
 * - 0: Success (with or without fixes)
 * - 1: File not found or read error
 */

/* eslint-disable no-console */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';

/**
 * Convert heading text to a valid fragment ID following GitHub's conventions.
 * This follows the same rules GitHub uses for generating heading anchors.
 * 
 * @param {string} heading - The heading text to convert
 * @returns {string} Valid fragment identifier
 * 
 * @example
 * headingToFragment('API Reference') // returns 'api-reference'
 * headingToFragment('Test: With Colon') // returns 'test-with-colon'
 * headingToFragment('Section 1.2.3') // returns 'section-123'
 */
function headingToFragment(heading) {
  return heading
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/^-+|-+$/g, '');  // Trim hyphens from start/end
}

/**
 * Fix broken link fragments in a markdown file.
 * Scans for internal links (#anchor) and fixes broken fragments by matching
 * them to actual headings in the document.
 * 
 * @param {string} filePath - Path to the markdown file to fix
 * @returns {number} Number of link fragments fixed
 * 
 * @example
 * const fixedCount = fixLinkFragments('/path/to/README.md');
 * console.log(`Fixed ${fixedCount} broken links`);
 */
function fixLinkFragments(filePath) {
  const content = readFileSync(filePath, 'utf8');
  
  // Find all headings
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings = new Map();
  
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const fragment = headingToFragment(text);
    headings.set(fragment, { level, text, originalLine: match[0] });
  }
  
  // Find all link fragments
  const linkFragmentRegex = /\[([^\]]+)\]\(#([^)]+)\)/g;
  let newContent = content;
  let fixedCount = 0;
  
  // Process matches in reverse to maintain positions
  const matches = [...content.matchAll(linkFragmentRegex)];
  
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    if (!match || match.index === undefined) continue;
    const linkText = match[1];
    const fragment = match[2];
    const startPos = match.index;
    const endPos = startPos + match[0].length;
    
    // Check if fragment exists
    if (!headings.has(fragment)) {
      // Try to find a close match
      const normalizedFragment = linkText ? headingToFragment(linkText) : '';
      
      if (headings.has(normalizedFragment)) {
        // Fix the link
        newContent = `${newContent.substring(0, startPos)  
                    }[${linkText || ''}](#${normalizedFragment})${  
                    newContent.substring(endPos)}`;
        fixedCount++;
      } else {
        // Try to find by partial match
        let found = false;
        for (const [headingFragment, data] of headings) {
          if (data && data.text && data.text.toLowerCase() === linkText.toLowerCase()) {
            newContent = `${newContent.substring(0, startPos)  
                        }[${linkText || ''}](#${headingFragment})${  
                        newContent.substring(endPos)}`;
            fixedCount++;
            found = true;
            break;
          }
        }
        
        if (!found) {
          console.warn(`Warning: No matching heading found for link fragment: #${fragment} (${linkText})`);
        }
      }
    }
  }
  
  if (fixedCount > 0) {
    writeFileSync(filePath, newContent);
    console.log(`Fixed ${fixedCount} link fragments in ${filePath}`);
  }
  
  return fixedCount;
}

/**
 * Find all markdown files recursively.
 * @param {string} dir - Directory to search
 * @returns {string[]} Array of markdown file paths
 */
function findMarkdownFiles(dir) {
  const results = [];
  const items = readdirSync(dir);
  
  for (const item of items) {
    if (item.startsWith('.') || item === 'node_modules') continue;
    
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      results.push(...findMarkdownFiles(fullPath));
    } else if (stat.isFile() && extname(fullPath) === '.md') {
      results.push(fullPath);
    }
  }
  
  return results;
}

/**
 * Main execution function.
 * Finds all markdown files and fixes link fragments.
 * 
 * @async
 * @param {string} [targetDirectory] - Directory to process (defaults to current working directory)
 * @returns {Promise<Object>} Summary of fixes applied
 * @throws {Error} If file operations fail
 */
async function main(targetDirectory = process.cwd()) {
  console.log('🔗 Fixing markdown link fragments...\n');
  
  const files = findMarkdownFiles(targetDirectory);
  
  let totalFixed = 0;
  let hasErrors = false;
  
  for (const file of files) {
    try {
      const filePath = resolve(file);
      
      // Check if file exists
      try {
        statSync(filePath);
      } catch {
        console.error(`Error: File not found: ${filePath}`);
        hasErrors = true;
        continue;
      }
      
      const fixed = fixLinkFragments(filePath);
      if (fixed > 0) {
        totalFixed += fixed;
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error instanceof Error ? error.message : String(error));
      hasErrors = true;
    }
  }

  console.log(`\nTotal: Fixed ${totalFixed} link fragments`);
  
  if (hasErrors) {
    process.exit(1);
  }
  
  return { totalFixed, hasErrors };
}

// Export functions for testing
export { headingToFragment, fixLinkFragments, main as fixMarkdownLinks };

// Run the script if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Accept directory as command line argument
  const targetDirectory = process.argv[2];
  
  main(targetDirectory).catch((error) => {
    console.error('❌ Failed to fix link fragments:', error);
    process.exit(1);
  });
}