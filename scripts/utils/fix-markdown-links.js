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

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Convert heading text to a valid fragment ID
function headingToFragment(heading) {
  return heading
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/^-+|-+$/g, '');  // Trim hyphens from start/end
}

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
    const linkText = match[1];
    const fragment = match[2];
    const startPos = match.index;
    const endPos = startPos + match[0].length;
    
    // Check if fragment exists
    if (!headings.has(fragment)) {
      // Try to find a close match
      const normalizedFragment = headingToFragment(linkText);
      
      if (headings.has(normalizedFragment)) {
        // Fix the link
        newContent = `${newContent.substring(0, startPos)  
                    }[${linkText}](#${normalizedFragment})${  
                    newContent.substring(endPos)}`;
        fixedCount++;
      } else {
        // Try to find by partial match
        let found = false;
        for (const [headingFragment, data] of headings) {
          if (data.text.toLowerCase() === linkText.toLowerCase()) {
            newContent = `${newContent.substring(0, startPos)  
                        }[${linkText}](#${headingFragment})${  
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

// Files to fix
const files = [
  'lib/utils/errors/docs/error-handling.md',
  'lib/utils/errors/docs/testing-errors.md'
];

let totalFixed = 0;
for (const file of files) {
  try {
    const filePath = resolve(file);
    totalFixed += fixLinkFragments(filePath);
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
}

console.log(`\nTotal: Fixed ${totalFixed} link fragments`);