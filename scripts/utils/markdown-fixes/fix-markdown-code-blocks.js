#!/usr/bin/env node

/**
 * @module scripts/utils/markdown-fixes/fix-markdown-code-blocks
 * 
 * Unified script to fix all markdown code block issues:
 * - Adds language identifiers to opening backticks
 * - Removes language identifiers from closing backticks
 * - Ensures blank line before opening backticks
 * - Ensures blank line after closing backticks
 * - Removes blank lines inside code blocks
 * - Handles quadruple backticks correctly
 * 
 * @example
 * ```bash
 * node scripts/utils/markdown-fixes/fix-markdown-code-blocks.js
 * ```
 */

/* eslint-disable no-console */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Detect language from code content using heuristics.
 * Analyzes code patterns, keywords, and file context to determine
 * the most appropriate language identifier.
 * 
 * @param {string} code - The code block content to analyze
 * @param {string} filePath - Path to the file containing the code block
 * @returns {string} Detected language identifier (e.g., 'javascript', 'bash', 'json')
 * 
 * @example
 * detectLanguage('const x = 42;', 'test.md') // returns 'javascript'
 * detectLanguage('#!/bin/bash\necho "hi"', 'test.md') // returns 'bash'
 */
function detectLanguage(code, filePath) {
  const trimmed = code.trim();
  const firstLine = trimmed.split('\n')[0] || '';
  
  // Shell/Bash detection
  if (trimmed.startsWith('#!') || 
      trimmed.match(/^(pnpm|npm|yarn|node|bash|sh|git|cd|mkdir|rm|cp|mv|ls|echo|export|source)\s/) ||
      trimmed.includes('#!/bin/bash') ||
      trimmed.match(/\$\s*\w+/) ||
      firstLine.startsWith('#') && firstLine.includes(' ')) {
    return 'bash';
  }
  
  // JavaScript/TypeScript detection
  if (trimmed.match(/^(import|export|const|let|var|function|class|interface|type|enum)\b/) ||
      trimmed.includes('=>') ||
      trimmed.match(/\.(ts|tsx|js|jsx)['"]/) ||
      trimmed.includes('console.log') ||
      trimmed.includes('require(') ||
      trimmed.includes('module.exports')) {
    
    // Check for TypeScript specific syntax
    if (trimmed.match(/:\s*(string|number|boolean|any|void|unknown|never)\b/) ||
        trimmed.match(/interface\s+\w+/) ||
        trimmed.match(/type\s+\w+\s*=/) ||
        trimmed.match(/<\w+>/) ||
        trimmed.includes('.tsx') ||
        trimmed.includes('.ts') ||
        trimmed.match(/from\s+['"]@\w+/)) { // TypeScript imports from @scoped packages
      return 'typescript';
    }
    
    // Check for JSX
    if (trimmed.match(/<[A-Z]\w*/) || trimmed.includes('.jsx')) {
      return 'jsx';
    }
    
    return 'javascript';
  }
  
  // JSON detection
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      trimmed.match(/^\s*"[\w-]+"\s*:/) ||
      filePath.includes('package.json') ||
      filePath.includes('.json')) {
    return 'json';
  }
  
  // YAML detection
  if (trimmed.match(/^[\w-]+:\s*/) ||
      trimmed.includes('---') ||
      filePath.endsWith('.yml') ||
      filePath.endsWith('.yaml')) {
    return 'yaml';
  }
  
  // Markdown detection (for nested examples)
  if (trimmed.match(/^#{1,6}\s/) ||
      trimmed.match(/^\*\s+/) ||
      trimmed.match(/^-\s+/) ||
      trimmed.match(/^\d+\.\s+/) ||
      trimmed.includes('```')) {
    return 'markdown';
  }
  
  // CSS detection
  if (trimmed.match(/\{[\s\S]*[a-z-]+\s*:[\s\S]*\}/) ||
      trimmed.match(/\.[a-zA-Z][\w-]*\s*\{/) ||
      trimmed.match(/#[a-zA-Z][\w-]*\s*\{/)) {
    return 'css';
  }
  
  // HTML detection
  if (trimmed.match(/<[a-z]+[\s>]/) ||
      trimmed.includes('<!DOCTYPE') ||
      trimmed.match(/<\/[a-z]+>/)) {
    return 'html';
  }
  
  // XML detection
  if (trimmed.match(/<\?xml/) ||
      trimmed.match(/<[A-Z][\w:]*[\s>]/)) {
    return 'xml';
  }
  
  // Plain text for directory structures
  if (trimmed.match(/^[├─│└]+\s*\w+/) ||
      trimmed.match(/^\w+\/$/m) ||
      trimmed.match(/^\s*\w+\.(js|ts|json|md|txt)\s*$/m)) {
    return 'text';
  }
  
  // Dockerfile
  if (trimmed.match(/^FROM\s+\w+/) ||
      trimmed.match(/^(RUN|CMD|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR)\s+/m)) {
    return 'dockerfile';
  }
  
  // Default to text if no language detected
  return 'text';
}

/**
 * Find markdown files recursively in a directory.
 * Skips common ignore patterns like node_modules.
 * 
 * @param {string} dir - Directory to search
 * @param {string[]} [files=[]] - Accumulator for found files
 * @returns {string[]} Array of absolute paths to markdown files
 * 
 * @example
 * const files = findMarkdownFiles(process.cwd());
 * // Returns: ['/path/to/README.md', '/path/to/docs/guide.md', ...]
 */
function findMarkdownFiles(dir, files = []) {
  const ignorePatterns = ['node_modules', '.claude', 'dist', 'build', 'coverage'];
  
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      
      // Skip ignored directories
      if (ignorePatterns.some(pattern => fullPath.includes(pattern))) {
        continue;
      }
      
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        findMarkdownFiles(fullPath, files);
      } else if (stat.isFile() && (entry.endsWith('.md') || entry.endsWith('.markdown'))) {
        files.push(fullPath);
      }
    }
  } catch {
    // Skip directories we can't read
  }
  
  return files;
}

/**
 * @typedef {Object} ProcessedBlock
 * @property {string[]} lines - Modified lines array
 * @property {string[]} fixes - Applied fix types
 * @property {number} newEndIdx - Updated ending index after modifications
 */

/**
 * Process a single code block to apply all necessary fixes.
 * Handles language detection, fence cleanup, and blank line management.
 * 
 * @param {string[]} lines - All lines in the file
 * @param {number} startIdx - Index of opening fence
 * @param {number} endIdx - Index of closing fence
 * @param {string} openFence - The opening fence string
 * @param {string} filePath - Path to the file
 * @returns {ProcessedBlock} Processed block information
 */
function processCodeBlock(lines, startIdx, endIdx, openFence, filePath) {
  const fixes = [];
  const processedLines = [...lines];
  
  // Extract fence info
  const fenceMatch = openFence.match(/^(\s*)(````*)(.*?)$/);
  if (!fenceMatch) return { lines: processedLines, fixes };
  
  const [, indent, backticks, langInfo] = fenceMatch;
  const backtickCount = backticks.length;
  const trimmedLang = langInfo.trim();
  
  // Fix 1: Add language identifier if missing (only for triple backticks)
  if (backtickCount === 3 && !trimmedLang) {
    // Extract code content
    const codeLines = [];
    for (let i = startIdx + 1; i < endIdx; i++) {
      codeLines.push(lines[i]);
    }
    const codeContent = codeLines.join('\n');
    const detectedLang = detectLanguage(codeContent, filePath);
    
    processedLines[startIdx] = indent + backticks + detectedLang;
    fixes.push('added-language');
  }
  
  // Fix 2: Remove language from closing fence
  const closeFence = lines[endIdx];
  const closeFenceMatch = closeFence.match(/^(\s*)(````*)(.*)$/);
  if (closeFenceMatch && closeFenceMatch[3].trim()) {
    processedLines[endIdx] = closeFenceMatch[1] + closeFenceMatch[2];
    fixes.push('removed-closing-language');
  }
  
  // Fix 3: Remove blank lines inside code block
  let i = startIdx + 1;
  while (i < endIdx) {
    // Remove blank line immediately after opening fence
    if (i === startIdx + 1 && processedLines[i].trim() === '') {
      processedLines.splice(i, 1);
      endIdx--;
      fixes.push('removed-blank-after-open');
      continue;
    }
    
    // Remove blank line immediately before closing fence
    if (i === endIdx - 1 && processedLines[i].trim() === '') {
      processedLines.splice(i, 1);
      endIdx--;
      fixes.push('removed-blank-before-close');
      continue;
    }
    
    i++;
  }
  
  return { lines: processedLines, fixes, newEndIdx: endIdx };
}

/**
 * @typedef {Object} FixStatistics
 * @property {number} total - Total number of fixes applied
 * @property {number} addedLanguages - Number of language identifiers added
 * @property {number} removedClosingLanguages - Number of closing fence languages removed
 * @property {number} addedBlankBefore - Number of blank lines added before blocks
 * @property {number} addedBlankAfter - Number of blank lines added after blocks
 * @property {number} removedBlankInside - Number of blank lines removed from inside blocks
 * @property {Array} details - Detailed fix information
 */

/**
 * Fix all code block issues in a file.
 * Applies multiple fixes: language detection, fence cleanup, blank line normalization.
 * 
 * @param {string} filePath - Path to the markdown file to fix
 * @returns {FixStatistics} Statistics about applied fixes
 * 
 * @example
 * const stats = fixCodeBlocks('/path/to/README.md');
 * console.log(`Fixed ${stats.total} issues`);
 */
function fixCodeBlocks(filePath) {
  const content = readFileSync(filePath, 'utf8');
  let lines = content.split('\n');
  const fixes = {
    total: 0,
    addedLanguages: 0,
    removedClosingLanguages: 0,
    addedBlankBefore: 0,
    addedBlankAfter: 0,
    removedBlankInside: 0,
    details: []
  };
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const fenceMatch = line.match(/^(\s*)(````*)(.*?)$/);
    
    if (fenceMatch) {
      const [, , backticks] = fenceMatch;
      const backtickCount = backticks.length;
      
      // Find matching closing fence
      let j = i + 1;
      let closingIdx = -1;
      
      while (j < lines.length) {
        const closeLine = lines[j];
        const closeMatch = closeLine.match(/^(\s*)(````*)(.*)$/);
        
        if (closeMatch && closeMatch[2].length >= backtickCount) {
          closingIdx = j;
          break;
        }
        j++;
      }
      
      if (closingIdx !== -1) {
        // Process the code block
        const result = processCodeBlock(lines, i, closingIdx, line, filePath);
        lines = result.lines;
        closingIdx = result.newEndIdx;
        
        // Count specific fixes
        result.fixes.forEach(fix => {
          if (fix === 'added-language') fixes.addedLanguages++;
          if (fix === 'removed-closing-language') fixes.removedClosingLanguages++;
          if (fix.startsWith('removed-blank')) fixes.removedBlankInside++;
        });
        
        // Fix 4: Ensure blank line before opening fence
        if (i > 0 && lines[i - 1].trim() !== '') {
          lines.splice(i, 0, '');
          i++;
          closingIdx++;
          fixes.addedBlankBefore++;
        }
        
        // Fix 5: Ensure blank line after closing fence
        if (closingIdx < lines.length - 1 && lines[closingIdx + 1].trim() !== '') {
          lines.splice(closingIdx + 1, 0, '');
          fixes.addedBlankAfter++;
        }
        
        // Move past this code block
        i = closingIdx + 1;
      } else {
        // No matching closing fence found
        i++;
      }
    } else {
      i++;
    }
  }
  
  // Calculate total fixes
  fixes.total = fixes.addedLanguages + fixes.removedClosingLanguages + 
                fixes.addedBlankBefore + fixes.addedBlankAfter + fixes.removedBlankInside;
  
  if (fixes.total > 0) {
    // Join lines and ensure single newline at end
    let newContent = lines.join('\n');
    newContent = newContent.replace(/\n*$/, '\n');
    writeFileSync(filePath, newContent);
  }
  
  return fixes;
}

/**
 * Main execution function.
 * Finds all markdown files and applies code block fixes.
 * 
 * @async
 * @param {string} [targetDirectory] - Directory to process (defaults to current working directory)
 * @returns {Promise<Object>} Summary of fixes applied
 * @throws {Error} If file operations fail
 */
async function main(targetDirectory = process.cwd()) {
  console.log('🔧 Fixing all markdown code block issues...\n');
  
  const files = findMarkdownFiles(targetDirectory);
  const totalFixes = {
    files: 0,
    addedLanguages: 0,
    removedClosingLanguages: 0,
    addedBlankBefore: 0,
    addedBlankAfter: 0,
    removedBlankInside: 0
  };
  
  for (const file of files) {
    const fixes = fixCodeBlocks(file);
    
    if (fixes.total > 0) {
      const details = [];
      if (fixes.addedLanguages) details.push(`${fixes.addedLanguages} languages added`);
      if (fixes.removedClosingLanguages) details.push(`${fixes.removedClosingLanguages} closing languages removed`);
      if (fixes.addedBlankBefore) details.push(`${fixes.addedBlankBefore} blank lines added before`);
      if (fixes.addedBlankAfter) details.push(`${fixes.addedBlankAfter} blank lines added after`);
      if (fixes.removedBlankInside) details.push(`${fixes.removedBlankInside} blank lines removed inside`);
      
      console.log(`Fixed ${file}: ${details.join(', ')}`);
      
      totalFixes.files++;
      totalFixes.addedLanguages += fixes.addedLanguages;
      totalFixes.removedClosingLanguages += fixes.removedClosingLanguages;
      totalFixes.addedBlankBefore += fixes.addedBlankBefore;
      totalFixes.addedBlankAfter += fixes.addedBlankAfter;
      totalFixes.removedBlankInside += fixes.removedBlankInside;
    }
  }
  
  console.log(`\n✅ Summary:`);
  console.log(`   Fixed ${totalFixes.files} files`);
  console.log(`   Added ${totalFixes.addedLanguages} language identifiers`);
  console.log(`   Removed ${totalFixes.removedClosingLanguages} closing fence languages`);
  console.log(`   Added ${totalFixes.addedBlankBefore} blank lines before code blocks`);
  console.log(`   Added ${totalFixes.addedBlankAfter} blank lines after code blocks`);
  console.log(`   Removed ${totalFixes.removedBlankInside} blank lines inside code blocks`);
  console.log(`   Checked ${files.length} total files`);
  
  return totalFixes;
}

// Export functions for testing
export { detectLanguage, processCodeBlock, main as fixMarkdownCodeBlocks };

// Run the script if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Accept directory as command line argument
  const targetDirectory = process.argv[2];
  
  main(targetDirectory).catch((error) => {
    console.error('❌ Failed to fix code blocks:', error);
    process.exit(1);
  });
}