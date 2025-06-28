# Stack Trace Utilities Specification

## Overview
Extract stack trace parsing and manipulation utilities from the error system for enhanced debugging capabilities across the Terroir Core Design System.

## Module Structure
```
lib/utils/stack-trace/
├── index.ts              # Main exports
├── parser.ts            # Stack trace parsing
├── filter.ts            # Frame filtering utilities
├── formatter.ts         # Stack formatting
├── source-map.ts        # Source map support
├── analyzer.ts          # Stack analysis utilities
└── __tests__/
    ├── parser.test.ts
    ├── filter.test.ts
    ├── formatter.test.ts
    ├── source-map.test.ts
    └── analyzer.test.ts
```

## Detailed Specifications

### 1. Stack Trace Parser (`parser.ts`)

```typescript
export interface StackFrame {
  file?: string;
  line?: number;
  column?: number;
  function?: string;
  method?: string;
  type?: string;
  native?: boolean;
  eval?: boolean;
  async?: boolean;
  anonymous?: boolean;
  raw: string;
}

export interface ParseOptions {
  maxFrames?: number;
  skipFrames?: number;
  nodeInternals?: boolean;
}

/**
 * Parse stack trace string into frames
 */
export function parseStackTrace(
  stack: string,
  options?: ParseOptions
): StackFrame[];

/**
 * Parse V8 stack trace format
 */
export function parseV8Stack(stack: string): StackFrame[];

/**
 * Parse single stack frame
 */
export function parseStackFrame(line: string): StackFrame | null;

/**
 * Extract stack from error
 */
export function extractStack(
  error: Error | unknown,
  options?: ParseOptions
): StackFrame[];

/**
 * Capture current stack
 */
export function captureStackTrace(
  skipFrames?: number
): StackFrame[];

/**
 * Parse error with cause chain
 */
export function parseErrorChain(
  error: Error,
  options?: ParseOptions & {
    includeCauses?: boolean;
    maxDepth?: number;
  }
): {
  main: StackFrame[];
  causes: Array<{
    error: Error;
    frames: StackFrame[];
  }>;
};
```

### 2. Stack Filtering (`filter.ts`)

```typescript
export interface FilterOptions {
  nodeInternals?: boolean;
  nodeModules?: boolean;
  native?: boolean;
  eval?: boolean;
  anonymous?: boolean;
  patterns?: RegExp[];
  inverse?: boolean; // Invert filter
}

/**
 * Filter stack frames
 */
export function filterFrames(
  frames: StackFrame[],
  options?: FilterOptions
): StackFrame[];

/**
 * Remove node internal frames
 */
export function removeNodeInternals(frames: StackFrame[]): StackFrame[];

/**
 * Remove node_modules frames
 */
export function removeNodeModules(
  frames: StackFrame[],
  options?: {
    except?: string[]; // Package names to keep
  }
): StackFrame[];

/**
 * Keep only app frames
 */
export function keepAppFrames(
  frames: StackFrame[],
  options?: {
    appPath?: string;
    includePatterns?: RegExp[];
  }
): StackFrame[];

/**
 * Create custom frame filter
 */
export function createFrameFilter(
  predicate: (frame: StackFrame) => boolean
): (frames: StackFrame[]) => StackFrame[];

/**
 * Find first app frame
 */
export function findFirstAppFrame(
  frames: StackFrame[],
  options?: {
    appPath?: string;
  }
): StackFrame | undefined;

/**
 * Group consecutive frames
 */
export function groupFrames(
  frames: StackFrame[],
  groupBy: (frame: StackFrame) => string | undefined
): Array<{
  key: string;
  frames: StackFrame[];
  collapsed?: boolean;
}>;
```

### 3. Stack Formatter (`formatter.ts`)

```typescript
export interface FormatOptions {
  indent?: string;
  prefix?: string;
  colors?: boolean;
  relativePaths?: boolean;
  basePath?: string;
  maxFrames?: number;
  frameFormat?: (frame: StackFrame, index: number) => string;
}

/**
 * Format stack frames to string
 */
export function formatStackTrace(
  frames: StackFrame[],
  options?: FormatOptions
): string;

/**
 * Format single frame
 */
export function formatFrame(
  frame: StackFrame,
  options?: FormatOptions
): string;

/**
 * Format with highlighting
 */
export function formatWithHighlight(
  frames: StackFrame[],
  highlightFrame: number | ((frame: StackFrame) => boolean),
  options?: FormatOptions
): string;

/**
 * Format as table
 */
export function formatAsTable(
  frames: StackFrame[],
  options?: {
    columns?: ('function' | 'file' | 'line' | 'column')[];
    headers?: boolean;
    borders?: boolean;
  }
): string;

/**
 * Format for terminal with colors
 */
export function formatForTerminal(
  frames: StackFrame[],
  options?: FormatOptions & {
    theme?: 'light' | 'dark';
  }
): string;

/**
 * Format as JSON
 */
export function formatAsJson(
  frames: StackFrame[],
  options?: {
    pretty?: boolean;
    includeRaw?: boolean;
  }
): string;

/**
 * Create custom formatter
 */
export function createFormatter(
  options: FormatOptions
): (frames: StackFrame[]) => string;
```

### 4. Source Map Support (`source-map.ts`)

```typescript
export interface SourceMapOptions {
  sourceMapPath?: string;
  inline?: boolean;
  cache?: boolean;
}

export interface MappedFrame extends StackFrame {
  original?: {
    file: string;
    line: number;
    column: number;
    function?: string;
  };
  sourceMap?: string;
}

/**
 * Apply source maps to frames
 */
export async function applySourceMaps(
  frames: StackFrame[],
  options?: SourceMapOptions
): Promise<MappedFrame[]>;

/**
 * Load source map for file
 */
export async function loadSourceMap(
  file: string,
  options?: SourceMapOptions
): Promise<SourceMap | null>;

/**
 * Map single position
 */
export function mapPosition(
  sourceMap: SourceMap,
  line: number,
  column: number
): {
  source: string;
  line: number;
  column: number;
  name?: string;
} | null;

/**
 * Extract inline source map
 */
export function extractInlineSourceMap(
  content: string
): string | null;

/**
 * Create source map cache
 */
export function createSourceMapCache(options?: {
  maxSize?: number;
  ttl?: number;
}): {
  get: (file: string) => SourceMap | undefined;
  set: (file: string, map: SourceMap) => void;
  clear: () => void;
};
```

### 5. Stack Analyzer (`analyzer.ts`)

```typescript
export interface AnalysisResult {
  errorLocation?: StackFrame;
  appFrames: StackFrame[];
  libraryFrames: StackFrame[];
  nodeFrames: StackFrame[];
  recursion?: {
    detected: boolean;
    frames?: StackFrame[];
    depth?: number;
  };
  asyncBoundaries: number[];
  depth: number;
}

/**
 * Analyze stack trace
 */
export function analyzeStack(
  frames: StackFrame[],
  options?: {
    appPath?: string;
    detectRecursion?: boolean;
  }
): AnalysisResult;

/**
 * Detect recursion in stack
 */
export function detectRecursion(
  frames: StackFrame[],
  options?: {
    minDepth?: number;
    similarityThreshold?: number;
  }
): {
  detected: boolean;
  pattern?: StackFrame[];
  depth?: number;
};

/**
 * Find common frames between stacks
 */
export function findCommonFrames(
  stack1: StackFrame[],
  stack2: StackFrame[]
): StackFrame[];

/**
 * Calculate stack similarity
 */
export function calculateSimilarity(
  stack1: StackFrame[],
  stack2: StackFrame[]
): number; // 0-1

/**
 * Extract error context
 */
export function extractContext(
  frames: StackFrame[],
  targetFrame: number,
  contextSize: number = 2
): {
  before: StackFrame[];
  target: StackFrame;
  after: StackFrame[];
};

/**
 * Deduplicate similar errors
 */
export function deduplicateErrors(
  errors: Array<{ error: Error; stack: StackFrame[] }>,
  threshold: number = 0.8
): Array<{
  representative: Error;
  count: number;
  similar: Error[];
}>;
```

## Integration Examples

### Error Reporting
```typescript
import { parseStackTrace, filterFrames, formatStackTrace } from '@utils/stack-trace';

export function reportError(error: Error): ErrorReport {
  const frames = parseStackTrace(error.stack || '');
  const appFrames = filterFrames(frames, {
    nodeModules: false,
    nodeInternals: false
  });
  
  return {
    message: error.message,
    location: appFrames[0],
    stack: formatStackTrace(appFrames, {
      relativePaths: true,
      maxFrames: 10
    })
  };
}
```

### Development Debugging
```typescript
import { analyzeStack, formatWithHighlight } from '@utils/stack-trace';

export function debugError(error: Error): void {
  const frames = parseStackTrace(error.stack || '');
  const analysis = analyzeStack(frames);
  
  console.log(formatWithHighlight(
    frames,
    (frame) => analysis.appFrames.includes(frame),
    { colors: true }
  ));
  
  if (analysis.recursion?.detected) {
    console.warn(`Recursion detected (depth: ${analysis.recursion.depth})`);
  }
}
```

### Production Error Aggregation
```typescript
import { parseErrorChain, deduplicateErrors, applySourceMaps } from '@utils/stack-trace';

export async function aggregateErrors(
  errors: Error[],
  sourceMapPath: string
): Promise<ErrorGroup[]> {
  const parsed = await Promise.all(
    errors.map(async (error) => {
      const { main } = parseErrorChain(error);
      const mapped = await applySourceMaps(main, { sourceMapPath });
      return { error, stack: mapped };
    })
  );
  
  return deduplicateErrors(parsed, 0.9);
}
```

## Performance Considerations

1. **Parsing Cache**: Cache parsed frames for repeated errors
2. **Source Map Cache**: Cache loaded source maps
3. **Lazy Loading**: Load source maps only when needed
4. **Frame Limits**: Limit frames to prevent memory issues
5. **Regex Optimization**: Pre-compile parsing patterns

## Browser Compatibility

```typescript
// Browser-specific parsing
export function parseBrowserStack(
  stack: string,
  browser: 'chrome' | 'firefox' | 'safari'
): StackFrame[];

// Universal parser
export function parseUniversalStack(
  stack: string,
  options?: { platform?: 'node' | 'browser' }
): StackFrame[];
```

## Success Metrics

- ✅ Accurate stack parsing across platforms
- ✅ Effective frame filtering
- ✅ Source map support
- ✅ Improved error debugging
- ✅ Better error aggregation