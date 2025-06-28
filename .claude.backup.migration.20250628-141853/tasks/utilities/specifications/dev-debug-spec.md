# Development & Debug Utilities Specification

## Overview
Extract development and debugging utilities from logger and error implementations for enhanced developer experience across the Terroir Core Design System.

## Module Structure
```
lib/utils/dev/
├── index.ts              # Main exports
├── console.ts           # Enhanced console utilities
├── colors.ts            # ANSI color utilities
├── inspector.ts         # Object inspection utilities
├── debug.ts             # Debug helpers and contexts
├── pretty-print.ts      # Pretty printing utilities
├── diff.ts              # Difference visualization
└── __tests__/
    ├── console.test.ts
    ├── colors.test.ts
    ├── inspector.test.ts
    ├── debug.test.ts
    ├── pretty-print.test.ts
    └── diff.test.ts
```

## Detailed Specifications

### 1. Console Utilities (`console.ts`)

```typescript
export interface ConsoleOptions {
  prefix?: string;
  timestamp?: boolean;
  colors?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  mute?: boolean;
}

/**
 * Create enhanced console
 */
export function createConsole(options?: ConsoleOptions): {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  group: (label?: string) => void;
  groupEnd: () => void;
  table: (data: unknown, columns?: string[]) => void;
  time: (label: string) => void;
  timeEnd: (label: string) => void;
  clear: () => void;
};

/**
 * Conditional console
 */
export function createConditionalConsole(
  condition: boolean | (() => boolean),
  options?: ConsoleOptions
): ReturnType<typeof createConsole>;

/**
 * Console with context
 */
export function createContextConsole(
  context: Record<string, unknown>,
  options?: ConsoleOptions
): ReturnType<typeof createConsole>;

/**
 * Progress indicator for console
 */
export class ConsoleProgress {
  constructor(options?: {
    total?: number;
    width?: number;
    format?: string;
    stream?: NodeJS.WriteStream;
  });
  
  update(current: number, message?: string): void;
  increment(amount?: number, message?: string): void;
  done(message?: string): void;
}

/**
 * Spinner for console
 */
export class ConsoleSpinner {
  constructor(options?: {
    text?: string;
    spinner?: string[];
    interval?: number;
    stream?: NodeJS.WriteStream;
  });
  
  start(text?: string): void;
  update(text: string): void;
  succeed(text?: string): void;
  fail(text?: string): void;
  warn(text?: string): void;
  info(text?: string): void;
  stop(): void;
}

/**
 * Console sections
 */
export function section(
  title: string,
  content: () => void,
  options?: {
    border?: 'single' | 'double' | 'rounded';
    padding?: number;
    width?: number;
  }
): void;
```

### 2. ANSI Color Utilities (`colors.ts`)

```typescript
export interface ColorOptions {
  enabled?: boolean;
  level?: 0 | 1 | 2 | 3; // Color support level
  theme?: ColorTheme;
}

export interface ColorTheme {
  // Base colors
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  gray: string;
  
  // Semantic colors
  error: string;
  warning: string;
  info: string;
  success: string;
  debug: string;
  
  // Syntax highlighting
  keyword: string;
  string: string;
  number: string;
  boolean: string;
  null: string;
  undefined: string;
  function: string;
  comment: string;
}

/**
 * ANSI color functions
 */
export const colors: {
  // Styles
  reset: (str: string) => string;
  bold: (str: string) => string;
  dim: (str: string) => string;
  italic: (str: string) => string;
  underline: (str: string) => string;
  inverse: (str: string) => string;
  hidden: (str: string) => string;
  strikethrough: (str: string) => string;
  
  // Colors
  black: (str: string) => string;
  red: (str: string) => string;
  green: (str: string) => string;
  yellow: (str: string) => string;
  blue: (str: string) => string;
  magenta: (str: string) => string;
  cyan: (str: string) => string;
  white: (str: string) => string;
  gray: (str: string) => string;
  
  // Background colors
  bgBlack: (str: string) => string;
  bgRed: (str: string) => string;
  bgGreen: (str: string) => string;
  bgYellow: (str: string) => string;
  bgBlue: (str: string) => string;
  bgMagenta: (str: string) => string;
  bgCyan: (str: string) => string;
  bgWhite: (str: string) => string;
};

/**
 * Strip ANSI codes
 */
export function stripAnsi(str: string): string;

/**
 * Check if terminal supports color
 */
export function supportsColor(): {
  level: 0 | 1 | 2 | 3;
  hasBasic: boolean;
  has256: boolean;
  has16m: boolean;
};

/**
 * Create themed colors
 */
export function createColors(
  theme: Partial<ColorTheme>,
  options?: ColorOptions
): typeof colors & {
  theme: <K extends keyof ColorTheme>(
    key: K,
    str: string
  ) => string;
};

/**
 * Gradient text
 */
export function gradient(
  text: string,
  colors: string[],
  options?: {
    interpolation?: 'rgb' | 'hsl';
  }
): string;

/**
 * Rainbow text
 */
export function rainbow(text: string): string;
```

### 3. Object Inspector (`inspector.ts`)

```typescript
export interface InspectOptions {
  depth?: number | null;
  colors?: boolean;
  showHidden?: boolean;
  showProxy?: boolean;
  maxArrayLength?: number;
  maxStringLength?: number;
  breakLength?: number;
  compact?: boolean | number;
  sorted?: boolean | ((a: string, b: string) => number);
  getters?: boolean | 'get' | 'set';
  numericSeparator?: boolean;
}

/**
 * Inspect object with syntax highlighting
 */
export function inspect(
  obj: unknown,
  options?: InspectOptions
): string;

/**
 * Inspect with custom formatter
 */
export function inspectCustom(
  obj: unknown,
  formatter: (value: unknown, depth: number) => string | null,
  options?: InspectOptions
): string;

/**
 * Create type-specific inspector
 */
export function createInspector<T>(
  typePredicate: (value: unknown) => value is T,
  formatter: (value: T, options: InspectOptions) => string
): (value: unknown, options?: InspectOptions) => string;

/**
 * Inspect diff between objects
 */
export function inspectDiff(
  actual: unknown,
  expected: unknown,
  options?: InspectOptions & {
    showEqual?: boolean;
  }
): string;

/**
 * Get object type
 */
export function getType(obj: unknown): string;

/**
 * Get object size
 */
export function getSize(obj: unknown): {
  bytes: number;
  formatted: string;
};

/**
 * Circular reference detection
 */
export function findCircularRefs(
  obj: unknown
): Array<{ path: string; target: unknown }>;
```

### 4. Debug Helpers (`debug.ts`)

```typescript
export interface DebugOptions {
  namespace: string;
  enabled?: boolean | string | RegExp;
  useColors?: boolean;
  stream?: NodeJS.WriteStream;
  formatter?: (namespace: string, ...args: unknown[]) => string;
}

/**
 * Create debug function
 */
export function createDebug(
  namespace: string,
  options?: Partial<DebugOptions>
): {
  (...args: unknown[]): void;
  enabled: boolean;
  namespace: string;
  extend: (namespace: string) => ReturnType<typeof createDebug>;
};

/**
 * Debug context manager
 */
export class DebugContext {
  constructor(name: string);
  
  enter<T>(fn: () => T): T;
  leave(): void;
  checkpoint(label: string): void;
  measure(label: string, fn: () => void): void;
  
  getTimeline(): Array<{
    type: 'enter' | 'leave' | 'checkpoint' | 'measure';
    label: string;
    timestamp: number;
    duration?: number;
  }>;
}

/**
 * Conditional debugging
 */
export function debugIf(
  condition: boolean | (() => boolean),
  namespace: string
): ReturnType<typeof createDebug>;

/**
 * Debug with timing
 */
export function debugTimed(
  namespace: string
): {
  (...args: unknown[]): void;
  time: (label: string) => void;
  timeEnd: (label: string) => void;
};

/**
 * Memory debugging
 */
export function debugMemory(
  namespace: string
): {
  snapshot: (label: string) => void;
  compare: (label1: string, label2: string) => void;
  report: () => void;
};

/**
 * Global debug state
 */
export const debugState: {
  enable: (namespaces: string | RegExp) => void;
  disable: () => void;
  enabled: (namespace: string) => boolean;
  namespaces: () => string[];
};
```

### 5. Pretty Print (`pretty-print.ts`)

```typescript
export interface PrettyPrintOptions {
  indent?: number | string;
  maxDepth?: number;
  colors?: boolean;
  theme?: ColorTheme;
  compact?: boolean;
  sortKeys?: boolean;
  transformers?: Array<{
    test: (value: unknown) => boolean;
    print: (value: unknown, indent: number) => string;
  }>;
}

/**
 * Pretty print any value
 */
export function prettyPrint(
  value: unknown,
  options?: PrettyPrintOptions
): string;

/**
 * Pretty print JSON
 */
export function prettyJson(
  value: unknown,
  options?: PrettyPrintOptions & {
    jsonOptions?: Parameters<typeof JSON.stringify>[2];
  }
): string;

/**
 * Pretty print error
 */
export function prettyError(
  error: Error,
  options?: PrettyPrintOptions & {
    stack?: boolean;
    cause?: boolean;
    properties?: boolean;
  }
): string;

/**
 * Pretty print table
 */
export function prettyTable(
  data: unknown[],
  options?: {
    columns?: string[];
    headers?: boolean;
    borders?: boolean;
    colors?: boolean;
    maxWidth?: number;
  }
): string;

/**
 * Pretty print tree
 */
export function prettyTree(
  data: TreeNode,
  options?: {
    indent?: string;
    markers?: {
      branch: string;
      leaf: string;
      trunk: string;
    };
    colors?: boolean;
  }
): string;

interface TreeNode {
  label: string;
  children?: TreeNode[];
  expanded?: boolean;
}

/**
 * Pretty print code
 */
export function prettyCode(
  code: string,
  language: string,
  options?: {
    theme?: 'github' | 'monokai' | 'solarized';
    lineNumbers?: boolean;
    highlight?: number[];
  }
): string;
```

### 6. Difference Visualization (`diff.ts`)

```typescript
export interface DiffOptions {
  context?: number;
  colors?: boolean;
  format?: 'unified' | 'split' | 'inline';
  ignoreWhitespace?: boolean;
  ignoreCase?: boolean;
}

/**
 * Create text diff
 */
export function diffText(
  oldText: string,
  newText: string,
  options?: DiffOptions
): string;

/**
 * Create object diff
 */
export function diffObjects(
  oldObj: unknown,
  newObj: unknown,
  options?: DiffOptions & {
    depth?: number;
    showEqual?: boolean;
  }
): string;

/**
 * Create array diff
 */
export function diffArrays<T>(
  oldArr: T[],
  newArr: T[],
  options?: DiffOptions & {
    compareFn?: (a: T, b: T) => boolean;
  }
): string;

/**
 * Diff with custom formatter
 */
export function diffCustom<T>(
  old: T,
  new: T,
  formatter: (value: T) => string,
  options?: DiffOptions
): string;

/**
 * Apply diff patch
 */
export function applyDiff(
  original: string,
  diff: string
): string;

/**
 * Create visual diff
 */
export function visualDiff(
  old: string,
  new: string,
  options?: {
    type?: 'character' | 'word' | 'line';
    colors?: boolean;
    inline?: boolean;
  }
): string;
```

## Integration Examples

### Enhanced Error Display
```typescript
import { prettyError, colors, section } from '@utils/dev';

export function displayError(error: Error): void {
  section('Error Details', () => {
    console.log(prettyError(error, {
      stack: true,
      cause: true,
      colors: true
    }));
  }, { border: 'double' });
}
```

### Debug Logging
```typescript
import { createDebug, debugTimed } from '@utils/dev';

const debug = debugTimed('app:database');

export async function queryDatabase(sql: string): Promise<Result> {
  debug('Executing query', sql);
  debug.time('query');
  
  try {
    const result = await db.query(sql);
    debug.timeEnd('query');
    return result;
  } catch (error) {
    debug('Query failed', error);
    throw error;
  }
}
```

### Development Console
```typescript
import { createConsole, ConsoleSpinner, colors } from '@utils/dev';

const console = createConsole({
  prefix: '[DEV]',
  timestamp: true,
  colors: true
});

export async function buildProject(): Promise<void> {
  const spinner = new ConsoleSpinner({ text: 'Building...' });
  spinner.start();
  
  try {
    await compile();
    spinner.succeed(colors.green('Build completed!'));
  } catch (error) {
    spinner.fail(colors.red('Build failed!'));
    console.error(error);
  }
}
```

## Performance Considerations

1. **Production Stripping**: Remove debug code in production builds
2. **Lazy Evaluation**: Defer expensive operations
3. **Stream Support**: Use streams for large outputs
4. **Color Detection**: Cache terminal capability checks
5. **Memory Leaks**: Clear debug contexts and timers

## Success Metrics

- ✅ Improved debugging experience
- ✅ Consistent console output
- ✅ Better error visibility
- ✅ Reduced debugging time
- ✅ Production-safe code