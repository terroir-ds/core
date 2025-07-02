---
id: reference-scanner-pattern
title: Reference Scanner Pattern
tags: [automation, tooling, documentation, meta-pattern]
domains: [tooling, automation]
complexity: intermediate
when-to-use: [building-scanners, parsing-code, extracting-metadata]
related: [pattern-quality-scoring, standard-quality-scoring]
---

# Reference Scanner Pattern

## Quick Context

Build automated scanners that extract pattern and standard references from code using JSDoc tags and comments, maintaining up-to-date .ref.md files.

## The Pattern

### Core Structure

```typescript
interface Scanner {
  // Parse source files
  parseFiles(patterns: string[]): Promise<SourceFile[]>;
  
  // Extract references
  extractReferences(files: SourceFile[]): ReferenceMap;
  
  // Update reference files
  updateReferences(references: ReferenceMap): Promise<void>;
}
```

### Implementation Steps

#### 1. File Discovery

```typescript
async function discoverFiles(rootDir: string): Promise<string[]> {
  return glob('**/*.{ts,tsx,js,jsx}', {
    cwd: rootDir,
    ignore: ['node_modules/**', 'dist/**', '.git/**']
  });
}
```

#### 2. AST Parsing

```typescript
import { parse } from '@typescript-eslint/parser';

function parseFile(filePath: string, content: string): SourceFile {
  const ast = parse(content, {
    sourceType: 'module',
    ecmaVersion: 'latest',
    ecmaFeatures: { jsx: true }
  });
  
  return {
    path: filePath,
    ast,
    content
  };
}
```

#### 3. Tag Extraction

```typescript
function extractJSDocTags(node: any): Tag[] {
  const tags: Tag[] = [];
  
  if (node.leadingComments) {
    for (const comment of node.leadingComments) {
      if (comment.type === 'Block' && comment.value.startsWith('*')) {
        const jsdoc = parseJSDoc(comment.value);
        
        // Extract pattern/standard tags
        const patternTags = jsdoc.tags.filter(t => 
          t.tag === 'implements-pattern' || 
          t.tag === 'pattern-instance'
        );
        
        const standardTags = jsdoc.tags.filter(t =>
          t.tag === 'implements-standard' ||
          t.tag === 'standard-compliance'
        );
        
        tags.push(...patternTags, ...standardTags);
      }
    }
  }
  
  return tags;
}
```

#### 4. Reference Building

```typescript
interface Reference {
  type: 'pattern' | 'standard';
  name: string;
  file: string;
  line: number;
  identifier: string; // function/class name
  score?: number;
  notes?: string;
  commit: string;
}

function buildReferences(files: SourceFile[]): Map<string, Reference[]> {
  const references = new Map<string, Reference[]>();
  
  for (const file of files) {
    walkAST(file.ast, (node, ancestors) => {
      const tags = extractJSDocTags(node);
      
      for (const tag of tags) {
        const ref = createReference(tag, node, file, ancestors);
        const key = `${ref.type}:${ref.name}`;
        
        if (!references.has(key)) {
          references.set(key, []);
        }
        
        references.get(key)!.push(ref);
      }
    });
  }
  
  return references;
}
```

#### 5. Score Extraction

```typescript
function extractScore(tags: Tag[]): number | undefined {
  const scoreTag = tags.find(t => 
    t.tag === 'pattern-score' || 
    t.tag === 'compliance-score'
  );
  
  if (scoreTag) {
    const score = parseInt(scoreTag.value, 10);
    if (score >= 1 && score <= 5) {
      return score;
    }
  }
  
  return undefined;
}
```

#### 6. Reference File Updates

```typescript
async function updateReferenceFile(
  type: 'pattern' | 'standard',
  name: string,
  references: Reference[]
): Promise<void> {
  const filePath = `ai/${type}s/${name}.ref.md`;
  
  if (!await fileExists(filePath)) {
    // Create new reference file
    await writeFile(filePath, createReferenceTemplate(type, name));
  }
  
  const content = await readFile(filePath);
  const updated = updateReferenceSection(content, references);
  
  await writeFile(filePath, updated);
}

function updateReferenceSection(content: string, refs: Reference[]): string {
  // Find AUTO-GENERATED section
  const startMarker = '<!-- AUTO-GENERATED -->';
  const endMarker = '<!-- END AUTO-GENERATED -->';
  
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);
  
  if (start === -1 || end === -1) {
    // Add section if missing
    return content + '\n\n' + generateReferenceSection(refs);
  }
  
  // Replace existing section
  return content.substring(0, start + startMarker.length) +
         '\n' + formatReferences(refs) + '\n' +
         content.substring(end);
}
```

### Complete Example Scanner

```typescript
// scripts/scan-references.ts
import { glob } from 'glob';
import { readFile, writeFile } from 'fs/promises';
import { parse } from '@typescript-eslint/parser';
import { execSync } from 'child_process';

class ReferenceScanner {
  private rootDir: string;
  
  constructor(rootDir: string) {
    this.rootDir = rootDir;
  }
  
  async scan(): Promise<void> {
    console.log('🔍 Scanning for pattern and standard references...');
    
    // Discover files
    const files = await this.discoverFiles();
    console.log(`Found ${files.length} source files`);
    
    // Parse files
    const sourceFiles = await this.parseFiles(files);
    
    // Extract references
    const references = this.extractReferences(sourceFiles);
    console.log(`Found ${references.size} unique patterns/standards`);
    
    // Update reference files
    await this.updateReferences(references);
    console.log('✅ Reference files updated');
  }
  
  private getCurrentCommit(): string {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  }
  
  // ... implementation methods
}

// Run scanner
const scanner = new ReferenceScanner(process.cwd());
scanner.scan().catch(console.error);
```

## Common Pitfalls

### 1. Performance Issues

**Problem**: Scanning large codebases is slow
**Solution**:

- Cache parsed ASTs
- Process files in parallel
- Skip unchanged files (git diff)

### 2. Invalid References

**Problem**: Tags reference non-existent patterns
**Solution**:

- Validate against existing patterns/standards
- Report warnings for invalid references
- Suggest similar names

### 3. Merge Conflicts

**Problem**: AUTO-GENERATED sections cause conflicts
**Solution**:

- Use deterministic sorting
- Include minimal information
- Consider separate files for auto-generated content

## Benefits

- **Always Up-to-Date**: References stay current with code
- **No Manual Maintenance**: Automated scanning
- **Enables Auditing**: Track pattern/standard adoption
- **Supports Refactoring**: Update references automatically
- **Improves Discovery**: Find all uses of a pattern

## Related Patterns

- Pattern Quality Scoring
- Standard Quality Scoring
- Automated Documentation Generation
