# String & Formatting Utilities Specification

## Overview
Extract string manipulation and formatting utilities from error and logger implementations for use across the Terroir Core Design System.

## Module Structure
```
lib/utils/string/
├── index.ts              # Main exports
├── truncate.ts          # Truncation utilities
├── case.ts              # Case conversion utilities
├── template.ts          # Template string utilities
├── format.ts            # General formatting utilities
├── indent.ts            # Indentation helpers
├── wrap.ts              # Word wrapping utilities
└── __tests__/
    ├── truncate.test.ts
    ├── case.test.ts
    ├── template.test.ts
    ├── format.test.ts
    ├── indent.test.ts
    └── wrap.test.ts
```

## Detailed Specifications

### 1. Truncation Utilities (`truncate.ts`)

```typescript
export interface TruncateOptions {
  length: number;
  suffix?: string;
  preserveWords?: boolean;
  position?: 'end' | 'middle' | 'start';
  boundary?: RegExp; // Word boundary pattern
}

/**
 * Truncate string with various strategies
 */
export function truncate(
  str: string,
  options: TruncateOptions | number
): string;

/**
 * Truncate with word preservation
 */
export function truncateWords(
  str: string,
  maxLength: number,
  suffix?: string
): string;

/**
 * Truncate from middle (keep start/end)
 */
export function truncateMiddle(
  str: string,
  maxLength: number,
  separator?: string
): string;

/**
 * Truncate lines with continuation indicator
 */
export function truncateLines(
  text: string,
  maxLines: number,
  continuationText?: string
): string;

/**
 * Smart truncate with important content detection
 */
export function smartTruncate(
  str: string,
  maxLength: number,
  options?: {
    preservePatterns?: RegExp[];
    priorityStart?: number;
    priorityEnd?: number;
  }
): string;

/**
 * Truncate array of strings to fit total length
 */
export function truncateArray(
  items: string[],
  totalLength: number,
  options?: {
    separator?: string;
    minimumItemLength?: number;
    strategy?: 'equal' | 'proportional' | 'important-first';
  }
): string[];
```

### 2. Case Conversion (`case.ts`)

```typescript
/**
 * Convert to camelCase
 */
export function camelCase(str: string): string;

/**
 * Convert to PascalCase
 */
export function pascalCase(str: string): string;

/**
 * Convert to snake_case
 */
export function snakeCase(str: string): string;

/**
 * Convert to kebab-case
 */
export function kebabCase(str: string): string;

/**
 * Convert to CONSTANT_CASE
 */
export function constantCase(str: string): string;

/**
 * Convert to Title Case
 */
export function titleCase(str: string): string;

/**
 * Convert to sentence case
 */
export function sentenceCase(str: string): string;

/**
 * Convert to dot.case
 */
export function dotCase(str: string): string;

/**
 * Convert to path/case
 */
export function pathCase(str: string): string;

/**
 * Detect current case
 */
export function detectCase(
  str: string
): 'camel' | 'pascal' | 'snake' | 'kebab' | 'constant' | 'mixed' | 'unknown';

/**
 * Create custom case converter
 */
export function createCaseConverter(options: {
  wordSeparator?: string;
  wordTransform?: (word: string, index: number) => string;
  joinWith?: string;
}): (str: string) => string;
```

### 3. Template Utilities (`template.ts`)

```typescript
export interface TemplateOptions {
  delimiters?: [string, string]; // Default: ['{', '}']
  escape?: boolean;
  strict?: boolean; // Throw on missing values
  transform?: (value: unknown, key: string) => string;
}

/**
 * Simple template interpolation
 */
export function template(
  str: string,
  data: Record<string, unknown>,
  options?: TemplateOptions
): string;

/**
 * Create reusable template function
 */
export function createTemplate(
  templateStr: string,
  options?: TemplateOptions
): (data: Record<string, unknown>) => string;

/**
 * Template with nested property access
 */
export function templateDeep(
  str: string,
  data: unknown,
  options?: TemplateOptions & {
    separator?: string; // Default: '.'
  }
): string;

/**
 * Extract template variables
 */
export function extractTemplateVars(
  templateStr: string,
  options?: Pick<TemplateOptions, 'delimiters'>
): string[];

/**
 * Validate template against schema
 */
export function validateTemplate(
  templateStr: string,
  schema: Record<string, unknown>,
  options?: TemplateOptions
): {
  valid: boolean;
  missing?: string[];
  extra?: string[];
};

/**
 * Safe template with fallbacks
 */
export function safeTemplate(
  str: string,
  data: Record<string, unknown>,
  fallbacks: Record<string, unknown>,
  options?: TemplateOptions
): string;
```

### 4. General Formatting (`format.ts`)

```typescript
/**
 * Format bytes to human readable
 */
export function formatBytes(
  bytes: number,
  options?: {
    precision?: number;
    binary?: boolean; // Use 1024 vs 1000
    locale?: string;
  }
): string;

/**
 * Format duration to human readable
 */
export function formatDuration(
  ms: number,
  options?: {
    units?: ('ms' | 's' | 'm' | 'h' | 'd')[];
    precision?: number;
    verbose?: boolean;
    locale?: string;
  }
): string;

/**
 * Format number with separators
 */
export function formatNumber(
  num: number,
  options?: {
    precision?: number;
    thousandsSeparator?: string;
    decimalSeparator?: string;
    locale?: string;
  }
): string;

/**
 * Format percentage
 */
export function formatPercent(
  value: number,
  options?: {
    precision?: number;
    includeSign?: boolean;
    locale?: string;
  }
): string;

/**
 * Format list with proper grammar
 */
export function formatList(
  items: string[],
  options?: {
    separator?: string;
    lastSeparator?: string; // "and" or "or"
    oxford?: boolean; // Oxford comma
    locale?: string;
  }
): string;

/**
 * Format key-value pairs
 */
export function formatKeyValue(
  data: Record<string, unknown>,
  options?: {
    separator?: string;
    keyValueSeparator?: string;
    keyTransform?: (key: string) => string;
    valueTransform?: (value: unknown) => string;
    sort?: boolean;
  }
): string;
```

### 5. Indentation Utilities (`indent.ts`)

```typescript
export interface IndentOptions {
  size?: number;
  char?: string; // Space or tab
  includeEmptyLines?: boolean;
  skipFirst?: boolean;
}

/**
 * Indent text
 */
export function indent(
  text: string,
  sizeOrOptions?: number | IndentOptions
): string;

/**
 * Dedent text (remove common leading whitespace)
 */
export function dedent(
  text: string,
  options?: {
    preserveIndent?: number;
  }
): string;

/**
 * Detect indentation
 */
export function detectIndent(
  text: string
): {
  type: 'space' | 'tab' | 'mixed' | 'none';
  size: number;
  char: string;
};

/**
 * Re-indent with different style
 */
export function reindent(
  text: string,
  from: IndentOptions,
  to: IndentOptions
): string;

/**
 * Indent with levels
 */
export function indentLevels(
  lines: string[],
  levels: number[],
  options?: IndentOptions
): string[];

/**
 * Create hanging indent
 */
export function hangingIndent(
  text: string,
  firstLineIndent: number,
  restIndent: number,
  options?: IndentOptions
): string;
```

### 6. Word Wrapping (`wrap.ts`)

```typescript
export interface WrapOptions {
  width: number;
  indent?: string;
  newline?: string;
  escape?: boolean;
  wordBreak?: boolean;
  preserveWhitespace?: boolean;
}

/**
 * Wrap text to specified width
 */
export function wrap(
  text: string,
  options: WrapOptions | number
): string;

/**
 * Wrap with hanging indent
 */
export function wrapIndent(
  text: string,
  width: number,
  indent: string | number
): string;

/**
 * Wrap preserving ANSI codes
 */
export function wrapAnsi(
  text: string,
  width: number,
  options?: Omit<WrapOptions, 'width'>
): string;

/**
 * Calculate visible width (excluding ANSI)
 */
export function stringWidth(text: string): number;

/**
 * Split text into lines respecting width
 */
export function splitLines(
  text: string,
  width: number,
  options?: {
    breakWord?: boolean;
    preserveWords?: boolean;
  }
): string[];

/**
 * Create text column
 */
export function column(
  lines: string[],
  width: number,
  options?: {
    align?: 'left' | 'right' | 'center';
    padding?: string;
  }
): string[];
```

## Integration Examples

### Error Message Formatting
```typescript
import { truncate, indent, wrap } from '@utils/string';

export function formatError(error: Error): string {
  const message = wrap(error.message, 80);
  const stack = error.stack 
    ? indent(truncate(error.stack, 1000), 2)
    : '';
  
  return `${message}\n${stack}`;
}
```

### Configuration Display
```typescript
import { formatKeyValue, camelCase, truncateMiddle } from '@utils/string';

export function displayConfig(config: Record<string, unknown>): string {
  return formatKeyValue(config, {
    keyTransform: (key) => camelCase(key),
    valueTransform: (value) => {
      const str = String(value);
      return str.length > 50 ? truncateMiddle(str, 50) : str;
    },
    sort: true
  });
}
```

### Template Usage
```typescript
import { createTemplate, formatDuration, formatBytes } from '@utils/string';

const logTemplate = createTemplate(
  'Operation {operation} completed in {duration} ({bytes} processed)'
);

export function logOperation(data: OperationResult): string {
  return logTemplate({
    operation: data.name,
    duration: formatDuration(data.timeMs),
    bytes: formatBytes(data.bytesProcessed)
  });
}
```

## Performance Considerations

1. **String Building**: Use array join for multiple concatenations
2. **Regex Caching**: Pre-compile frequently used patterns
3. **Memory**: Avoid unnecessary string copies
4. **Unicode**: Handle multi-byte characters correctly
5. **Streaming**: Support streaming for large text

## Success Metrics

- ✅ Consistent string handling across codebase
- ✅ Reduced string manipulation bugs
- ✅ Better unicode support
- ✅ Improved readability
- ✅ Performance optimization