#!/usr/bin/env node

/**
 * @module scripts/utils/fix-markdown-code-blocks
 * 
 * Markdown code block language detection and fixing utility.
 * 
 * Automatically detects and adds appropriate language specifiers to code blocks
 * in markdown files that are missing them. Uses content analysis and file context
 * to determine the most likely language for each code block.
 * 
 * @example Run code block fixer
 * ```bash
 * node scripts/utils/fix-markdown-code-blocks.js
 * ```
 * 
 * Features:
 * - Recursively finds all markdown files
 * - Detects language from code content patterns
 * - Uses file context for better language hints
 * - Preserves existing code blocks with languages
 * - Reports number of fixes per file
 * 
 * Language detection:
 * - Shell/Bash: Commands starting with $, npm/pnpm commands
 * - JSON: Valid JSON structures
 * - TypeScript/JavaScript: import/export/const/function/class keywords
 * - YAML: Key-value pairs with indentation
 * - Text: Directory structures, fallback for unknown
 * 
 * Exit codes:
 * - 0: Success (with or without fixes)
 * - 1: Error during processing
 */

/* eslint-disable no-console */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

// Map file patterns to likely languages
const contextToLanguage = {
  'pull_request_template': 'markdown',
  'architecture': 'text',
  'git-workflow': 'bash',
  'branch-protection': 'yaml',
  'release-strategy': 'bash',
  'api/': 'typescript',
  'README': 'bash',
};

// Detect language from code content
function detectLanguage(code) {
  const trimmed = code.trim();
  
  // Shell/bash patterns
  if (trimmed.startsWith('$') || trimmed.startsWith('#!') || trimmed.includes('npm ') || trimmed.includes('pnpm ')) {
    return 'bash';
  }
  
  // JSON patterns
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // Not valid JSON
    }
  }
  
  // TypeScript/JavaScript patterns
  if (trimmed.includes('import ') || trimmed.includes('export ') || trimmed.includes('const ') || 
      trimmed.includes('function ') || trimmed.includes('class ')) {
    return 'typescript';
  }
  
  // YAML patterns
  if (trimmed.includes(': ') && (trimmed.includes('\n  ') || trimmed.includes('\n- '))) {
    return 'yaml';
  }
  
  // Directory structure patterns
  if (trimmed.includes('├──') || trimmed.includes('└──') || trimmed.includes('│')) {
    return 'text';
  }
  
  // Default to text for unknown
  return 'text';
}

// Get language from file context
function getLanguageFromContext(filePath) {
  for (const [pattern, lang] of Object.entries(contextToLanguage)) {
    if (filePath.includes(pattern)) {
      return lang;
    }
  }
  return null;
}

// Find markdown files recursively
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

async function fixCodeBlocks() {
  // Find all markdown files
  const files = findMarkdownFiles('.');
  
  let totalFixed = 0;
  
  for (const file of files) {
    const filePath = resolve(file);
    const content = readFileSync(filePath, 'utf8');
    
    // Find code blocks without language
    const codeBlockRegex = /^```\s*$/gm;
    const matches = [...content.matchAll(codeBlockRegex)];
    
    if (matches.length === 0) continue;
    
    let newContent = content;
    let fileFixed = 0;
    
    // Process matches in reverse to maintain positions
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      const startPos = match.index;
      
      // Find the closing ```
      const afterStart = content.substring(startPos + match[0].length);
      const endMatch = afterStart.match(/^(.*?)\n```/s);
      
      if (!endMatch) continue;
      
      const codeContent = endMatch[1];
      
      // Try to detect language
      const language = getLanguageFromContext(filePath) || detectLanguage(codeContent);
      
      // Replace the opening ``` with ```language
      newContent = `${newContent.substring(0, startPos)  
                  }\`\`\`${language}${  
                  newContent.substring(startPos + match[0].length)}`;
      
      fileFixed++;
    }
    
    if (fileFixed > 0) {
      writeFileSync(filePath, newContent);
      console.log(`Fixed ${fileFixed} code blocks in ${file}`);
      totalFixed += fileFixed;
    }
  }
  
  console.log(`\nTotal: Fixed ${totalFixed} code blocks across ${files.length} files`);
}

// Run the fixer
fixCodeBlocks().catch((error) => {
  console.error('Failed to fix markdown code blocks:', error);
  process.exit(1);
});