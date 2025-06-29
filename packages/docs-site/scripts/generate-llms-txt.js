#!/usr/bin/env node

/**
 * @module generate-llms-txt
 * 
 * Generates llms.txt file from AI documentation for LLM consumption.
 * Following the llms.txt standard: https://llmstxt.org/
 * 
 * Collects:
 * - All .ai.md files from packages
 * - AI documentation from /docs/ai/
 * - Package metadata
 * - Generates a structured index for AI assistants
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');
const outputPath = path.join(__dirname, '../public/llms.txt');

/**
 * Extract metadata from markdown file
 */
async function extractMetadata(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const { data, content: markdownContent } = matter(content);
  
  return {
    path: path.relative(rootDir, filePath),
    title: markdownContent.match(/^#\s+(.+)$/m)?.[1] || path.basename(filePath, '.md'),
    metadata: data,
    content: markdownContent
  };
}

/**
 * Generate package section
 */
async function generatePackageSection() {
  const packagesDir = path.join(rootDir, 'packages');
  const packages = await fs.readdir(packagesDir);
  
  const sections = [];
  
  for (const pkg of packages) {
    const aiDocPath = path.join(packagesDir, pkg, 'README.ai.md');
    
    try {
      const { content } = await extractMetadata(aiDocPath);
      const packageJson = JSON.parse(
        await fs.readFile(path.join(packagesDir, pkg, 'package.json'), 'utf8')
      );
      
      // Extract quick reference section
      const quickRefMatch = content.match(/## Quick Reference[\s\S]*?(?=##|$)/);
      const quickRef = quickRefMatch ? quickRefMatch[0].trim() : '';
      
      sections.push({
        name: packageJson.name,
        description: packageJson.description,
        version: packageJson.version,
        quickRef,
        path: `/packages/${pkg}`
      });
    } catch (err) {
      // Package might not have AI docs yet
      // Silent skip - no console output in production scripts
    }
  }
  
  return sections;
}

/**
 * Generate AI docs section
 */
async function generateAiDocsSection() {
  const aiDocsDir = path.join(rootDir, 'docs/ai');
  const files = await glob('*.md', { cwd: aiDocsDir });
  
  const sections = [];
  
  for (const file of files) {
    const filePath = path.join(aiDocsDir, file);
    const { title, metadata } = await extractMetadata(filePath);
    
    sections.push({
      title,
      path: `/docs/ai/${file}`,
      description: metadata.description || ''
    });
  }
  
  return sections;
}

/**
 * Generate llms.txt content
 */
async function generateLlmsTxt() {
  const packages = await generatePackageSection();
  const aiDocs = await generateAiDocsSection();
  
  const content = `# Terroir Core Design System

> A comprehensive, open-source design system built with modern web standards.
> Features Material Color Utilities, automated WCAG compliance, and multi-format asset generation.

## Quick Start

Install a package:
\`\`\`bash
pnpm add @terroir/core
\`\`\`

Import and use:
\`\`\`typescript
import { logger, guards, errors } from '@terroir/core';
\`\`\`

## Packages

${packages.map(pkg => `### ${pkg.name} v${pkg.version}

${pkg.description}

${pkg.quickRef}

Documentation: ${pkg.path}/README.ai.md
`).join('\n')}

## Architecture & Patterns

${aiDocs.map(doc => `- [${doc.title}](${doc.path}): ${doc.description}`).join('\n')}

## Key Features

- **Material Color Utilities**: Perceptually uniform color generation
- **Token System**: Three-tier architecture (primitive, semantic, component)
- **WCAG Compliance**: Automated contrast testing
- **Multi-format**: SVG, PNG, WebP asset generation
- **TypeScript First**: Full type safety
- **Tree-shakeable**: Optimized bundles

## Common Tasks

For detailed task-oriented documentation, see the package-specific .ai.md files above.

## Contributing

See [AI Contributing Guide](/docs/ai/contributing.md) for agent-specific contribution guidelines.

---
Generated: ${new Date().toISOString()}
Source: https://github.com/terroir-ds/core
`;

  return content;
}

/**
 * Main execution
 */
async function main() {
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });
    
    // Generate content
    const content = await generateLlmsTxt();
    
    // Write file
    await fs.writeFile(outputPath, content, 'utf8');
    
    // Use process.stdout for production logging
    process.stdout.write(`Generated llms.txt (${Buffer.byteLength(content, 'utf8')} bytes)\n`);
    
  } catch (error) {
    process.stderr.write(`Failed to generate llms.txt: ${error.message}\n`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}