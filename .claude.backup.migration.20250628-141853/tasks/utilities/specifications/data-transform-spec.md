# Data Transformation Utilities Specification

## Overview
Extract data transformation and manipulation utilities from various modules for consistent data handling across the Terroir Core Design System.

## Module Structure
```
lib/utils/data/
├── index.ts              # Main exports
├── clone.ts             # Deep cloning utilities
├── transform.ts         # Object transformation
├── flatten.ts           # Flattening/unflattening
├── merge.ts             # Deep merging utilities
├── access.ts            # Safe property access
├── compare.ts           # Deep comparison utilities
└── __tests__/
    ├── clone.test.ts
    ├── transform.test.ts
    ├── flatten.test.ts
    ├── merge.test.ts
    ├── access.test.ts
    └── compare.test.ts
```

## Detailed Specifications

### 1. Deep Cloning (`clone.ts`)

```typescript
export interface CloneOptions {
  depth?: number;
  includeNonEnumerable?: boolean;
  includeSymbols?: boolean;
  customClone?: (value: unknown, key?: string | symbol) => unknown | undefined;
  circularValue?: unknown | ((ref: unknown) => unknown);
}

/**
 * Deep clone with circular reference handling
 */
export function deepClone<T>(
  value: T,
  options?: CloneOptions
): T;

/**
 * Structured clone (using native API if available)
 */
export function structuredClone<T>(
  value: T,
  options?: { transfer?: ArrayBuffer[] }
): T;

/**
 * Clone with custom handlers for specific types
 */
export function cloneWith<T>(
  value: T,
  customizer: (value: unknown, key?: string | symbol) => unknown | undefined
): T;

/**
 * Fast shallow clone
 */
export function shallowClone<T>(value: T): T;

/**
 * Clone only specific paths
 */
export function clonePaths<T>(
  value: T,
  paths: string[],
  options?: CloneOptions
): Partial<T>;

/**
 * Type-specific cloners
 */
export const TypeCloners = {
  date: (date: Date) => Date;
  regexp: (regexp: RegExp) => RegExp;
  map: <K, V>(map: Map<K, V>) => Map<K, V>;
  set: <T>(set: Set<T>) => Set<T>;
  buffer: (buffer: Buffer) => Buffer;
  error: (error: Error) => Error;
};

/**
 * Detect circular references
 */
export function hasCircularReference(obj: unknown): boolean;

/**
 * Map circular references
 */
export function mapCircularReferences(
  obj: unknown
): Map<unknown, string[]>;
```

### 2. Object Transformation (`transform.ts`)

```typescript
export interface TransformOptions {
  deep?: boolean;
  mutate?: boolean;
  skipNull?: boolean;
  skipUndefined?: boolean;
}

/**
 * Transform object keys
 */
export function transformKeys<T extends object>(
  obj: T,
  transformer: (key: string, value: unknown, path: string[]) => string,
  options?: TransformOptions
): T;

/**
 * Transform object values
 */
export function transformValues<T extends object>(
  obj: T,
  transformer: (value: unknown, key: string, path: string[]) => unknown,
  options?: TransformOptions
): T;

/**
 * Map object to new structure
 */
export function mapObject<T extends object, R extends object>(
  obj: T,
  mapper: (key: string, value: unknown) => [string, unknown] | null,
  options?: TransformOptions
): R;

/**
 * Filter object properties
 */
export function filterObject<T extends object>(
  obj: T,
  predicate: (key: string, value: unknown) => boolean,
  options?: TransformOptions
): Partial<T>;

/**
 * Pick properties from object
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K>;

/**
 * Omit properties from object
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K>;

/**
 * Rename object keys
 */
export function renameKeys<T extends object>(
  obj: T,
  keyMap: Record<string, string>,
  options?: TransformOptions
): T;

/**
 * Compact object (remove null/undefined)
 */
export function compact<T extends object>(
  obj: T,
  options?: {
    removeNull?: boolean;
    removeUndefined?: boolean;
    removeEmpty?: boolean;
    removeFalsy?: boolean;
  }
): T;
```

### 3. Flattening/Unflattening (`flatten.ts`)

```typescript
export interface FlattenOptions {
  delimiter?: string;
  maxDepth?: number;
  safe?: boolean; // Prevent prototype pollution
  arrays?: boolean; // Flatten arrays
  transformKey?: (key: string, value: unknown) => string;
}

/**
 * Flatten nested object
 */
export function flatten(
  obj: object,
  options?: FlattenOptions
): Record<string, unknown>;

/**
 * Unflatten to nested object
 */
export function unflatten(
  obj: Record<string, unknown>,
  options?: Pick<FlattenOptions, 'delimiter' | 'safe'>
): object;

/**
 * Flatten with custom path builder
 */
export function flattenCustom(
  obj: object,
  pathBuilder: (path: string[], value: unknown) => string,
  options?: Omit<FlattenOptions, 'delimiter'>
): Record<string, unknown>;

/**
 * Get all paths in object
 */
export function getPaths(
  obj: object,
  options?: {
    arrays?: boolean;
    leaves?: boolean; // Only leaf nodes
  }
): string[];

/**
 * Flatten arrays specifically
 */
export function flattenArrays<T>(
  arr: unknown[],
  depth?: number
): T[];

/**
 * Create path map
 */
export function createPathMap(
  obj: object
): Map<string, {
  value: unknown;
  parent: object;
  key: string;
  path: string[];
}>;
```

### 4. Deep Merging (`merge.ts`)

```typescript
export interface MergeOptions {
  deep?: boolean;
  arrays?: 'replace' | 'concat' | 'unique' | 'merge';
  customMerge?: (target: unknown, source: unknown, key: string) => unknown;
  isMergeable?: (value: unknown) => boolean;
  clone?: boolean;
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends object>(
  target: T,
  ...sources: Partial<T>[]
): T;

/**
 * Merge with options
 */
export function mergeWith<T extends object>(
  target: T,
  sources: Partial<T>[],
  options: MergeOptions
): T;

/**
 * Merge all objects in array
 */
export function mergeAll<T extends object>(
  objects: T[],
  options?: MergeOptions
): T;

/**
 * Safe merge (no prototype pollution)
 */
export function safeMerge<T extends object>(
  target: T,
  ...sources: Partial<T>[]
): T;

/**
 * Merge strategies
 */
export const MergeStrategies = {
  // Array strategies
  replaceArray: <T>(target: T[], source: T[]) => T[];
  concatArray: <T>(target: T[], source: T[]) => T[];
  uniqueArray: <T>(target: T[], source: T[]) => T[];
  mergeArray: <T>(target: T[], source: T[]) => T[];
  
  // Value strategies
  preferSource: (target: unknown, source: unknown) => unknown;
  preferTarget: (target: unknown, source: unknown) => unknown;
  customMerge: (
    merger: (target: unknown, source: unknown) => unknown
  ) => (target: unknown, source: unknown) => unknown;
};

/**
 * Create custom merger
 */
export function createMerger(
  options: MergeOptions
): <T extends object>(...objects: Partial<T>[]) => T;
```

### 5. Safe Property Access (`access.ts`)

```typescript
export interface AccessOptions {
  defaultValue?: unknown;
  separator?: string;
  throwOnMissing?: boolean;
}

/**
 * Get nested property safely
 */
export function get<T = unknown>(
  obj: unknown,
  path: string | string[],
  defaultValue?: T
): T;

/**
 * Set nested property safely
 */
export function set<T extends object>(
  obj: T,
  path: string | string[],
  value: unknown,
  options?: AccessOptions
): T;

/**
 * Check if path exists
 */
export function has(
  obj: unknown,
  path: string | string[]
): boolean;

/**
 * Delete nested property
 */
export function unset<T extends object>(
  obj: T,
  path: string | string[]
): T;

/**
 * Get multiple paths
 */
export function getMany<T extends object>(
  obj: T,
  paths: Record<string, string>
): Record<string, unknown>;

/**
 * Set multiple paths
 */
export function setMany<T extends object>(
  obj: T,
  values: Record<string, unknown>,
  options?: AccessOptions
): T;

/**
 * Create property accessor
 */
export function createAccessor<T extends object>(
  obj: T,
  options?: AccessOptions
): {
  get: (path: string) => unknown;
  set: (path: string, value: unknown) => void;
  has: (path: string) => boolean;
  unset: (path: string) => void;
};

/**
 * Ensure path exists
 */
export function ensurePath<T extends object>(
  obj: T,
  path: string | string[],
  defaultValue?: unknown
): T;
```

### 6. Deep Comparison (`compare.ts`)

```typescript
export interface CompareOptions {
  strict?: boolean;
  depth?: number;
  customCompare?: (a: unknown, b: unknown, key?: string) => boolean | undefined;
  ignoreKeys?: string[];
}

/**
 * Deep equality check
 */
export function deepEqual(
  a: unknown,
  b: unknown,
  options?: CompareOptions
): boolean;

/**
 * Find differences between objects
 */
export function diff<T extends object>(
  from: T,
  to: T,
  options?: CompareOptions
): Array<{
  type: 'added' | 'removed' | 'changed';
  path: string[];
  value?: unknown;
  oldValue?: unknown;
}>;

/**
 * Check if object contains another
 */
export function contains<T extends object>(
  obj: T,
  subset: Partial<T>,
  options?: CompareOptions
): boolean;

/**
 * Find common properties
 */
export function intersection<T extends object>(
  ...objects: T[]
): Partial<T>;

/**
 * Find different properties
 */
export function difference<T extends object>(
  base: T,
  ...others: T[]
): Partial<T>;

/**
 * Sort objects for comparison
 */
export function sortObject<T extends object>(
  obj: T,
  options?: {
    deep?: boolean;
    compareFn?: (a: string, b: string) => number;
  }
): T;

/**
 * Create custom comparator
 */
export function createComparator(
  options: CompareOptions
): (a: unknown, b: unknown) => boolean;
```

## Integration Examples

### Safe Data Manipulation
```typescript
import { deepClone, set, get } from '@utils/data';

// Clone and modify safely
export function updateUserProfile(user: User, updates: Partial<User>): User {
  const cloned = deepClone(user);
  
  Object.entries(updates).forEach(([path, value]) => {
    set(cloned, path, value);
  });
  
  return cloned;
}

// Safe nested access
export function getConfigValue(path: string, defaultValue?: unknown) {
  return get(globalConfig, path, defaultValue);
}
```

### Data Transformation Pipeline
```typescript
import { flatten, transformKeys, filterObject, compact } from '@utils/data';

export function normalizeApiResponse(response: unknown): NormalizedData {
  return pipe(
    response,
    // Remove null values
    (data) => compact(data, { removeNull: true }),
    // Convert to camelCase
    (data) => transformKeys(data, (key) => camelCase(key)),
    // Filter sensitive fields
    (data) => filterObject(data, (key) => !key.includes('password')),
    // Flatten for storage
    (data) => flatten(data, { delimiter: '.' })
  );
}
```

### Object Comparison
```typescript
import { diff, deepEqual, contains } from '@utils/data';

export function trackConfigChanges(oldConfig: Config, newConfig: Config) {
  if (deepEqual(oldConfig, newConfig)) {
    return null;
  }
  
  const changes = diff(oldConfig, newConfig);
  
  // Log significant changes
  const significant = changes.filter(change => 
    !change.path.includes('timestamp') &&
    !change.path.includes('version')
  );
  
  return {
    hasChanges: significant.length > 0,
    changes: significant
  };
}
```

## Performance Considerations

1. **Circular References**: Use WeakMap for visited tracking
2. **Large Objects**: Implement streaming transforms
3. **Memory Usage**: Clear references after use
4. **Type Checking**: Optimize hot paths
5. **Cloning**: Use structured clone when available

## Success Metrics

- ✅ Safer data manipulation
- ✅ Reduced mutation bugs
- ✅ Better type safety
- ✅ Consistent transformations
- ✅ Improved debugging