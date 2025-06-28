# Testing Utilities Specification

## Overview
Extract testing utilities from error and logger test files to create a comprehensive testing toolkit for the Terroir Core Design System.

## Module Structure
```
lib/utils/testing/
├── index.ts              # Main exports
├── suppress.ts          # Warning and error suppression
├── mocks.ts             # Mock factories and utilities
├── generators.ts        # Test data generators
├── assertions.ts        # Custom test assertions
├── benchmarks.ts        # Performance testing utilities
├── fixtures.ts          # Test fixture management
└── __tests__/
    ├── suppress.test.ts
    ├── mocks.test.ts
    ├── generators.test.ts
    ├── assertions.test.ts
    ├── benchmarks.test.ts
    └── fixtures.test.ts
```

## Detailed Specifications

### 1. Warning & Error Suppression (`suppress.ts`)

```typescript
export interface SuppressOptions {
  patterns?: RegExp[];
  types?: string[];
  console?: boolean;
  process?: boolean;
  restore?: boolean;
}

/**
 * Suppress warnings in test environment
 */
export function suppressWarnings(options?: SuppressOptions): {
  restore: () => void;
  getSupressed: () => unknown[];
};

/**
 * Suppress specific process events
 */
export function suppressProcessEvents(
  events: string[],
  options?: {
    capture?: boolean;
    handler?: (event: string, ...args: unknown[]) => void;
  }
): {
  restore: () => void;
  getCaptured: () => Array<{ event: string; args: unknown[] }>;
};

/**
 * Suppress console methods
 */
export function suppressConsole(
  methods: Array<keyof Console> = ['log', 'warn', 'error'],
  options?: {
    capture?: boolean;
    filter?: (method: string, ...args: unknown[]) => boolean;
  }
): {
  restore: () => void;
  getCalls: () => Array<{ method: string; args: unknown[] }>;
};

/**
 * Auto-suppress in test blocks
 */
export function withSuppression<T>(
  fn: () => T | Promise<T>,
  options?: SuppressOptions
): Promise<T>;

/**
 * Vitest/Jest integration
 */
export function setupTestSuppression(options?: {
  warnings?: boolean;
  unhandledRejections?: boolean;
  console?: boolean;
}): void;

/**
 * Expect warnings/errors
 */
export function expectWarning(
  fn: () => void | Promise<void>,
  pattern?: string | RegExp
): Promise<void>;

export function expectNoWarnings(
  fn: () => void | Promise<void>
): Promise<void>;
```

### 2. Mock Factories (`mocks.ts`)

```typescript
export interface MockOptions {
  partial?: boolean;
  deep?: boolean;
  enumerable?: boolean;
}

/**
 * Create type-safe mock
 */
export function createMock<T>(
  base?: Partial<T>,
  options?: MockOptions
): T & {
  _isMock: true;
  _getMockCalls: (method: keyof T) => unknown[][];
  _resetMock: () => void;
};

/**
 * Mock factory builder
 */
export function createMockFactory<T>(
  defaults: Partial<T>,
  options?: MockOptions
): {
  create: (overrides?: Partial<T>) => T;
  createMany: (count: number, overrides?: Partial<T>[]) => T[];
  reset: () => void;
};

/**
 * Common mock implementations
 */
export const CommonMocks = {
  /**
   * Mock logger
   */
  logger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn().mockReturnThis(),
  }),
  
  /**
   * Mock HTTP response
   */
  response: (overrides?: Partial<Response>) => Response,
  
  /**
   * Mock error with cause
   */
  error: (message: string, options?: ErrorOptions) => Error,
  
  /**
   * Mock async function
   */
  asyncFn: <T>(result: T, delay?: number) => () => Promise<T>,
  
  /**
   * Mock event emitter
   */
  eventEmitter: () => EventEmitter,
  
  /**
   * Mock timer functions
   */
  timers: () => {
    setTimeout: vi.fn(),
    clearTimeout: vi.fn(),
    setInterval: vi.fn(),
    clearInterval: vi.fn(),
  },
};

/**
 * Spy on object methods
 */
export function spyOn<T extends object>(
  obj: T,
  methods?: Array<keyof T>
): T & {
  _getSpyCalls: (method: keyof T) => unknown[][];
  _resetSpies: () => void;
};

/**
 * Mock module with auto-restore
 */
export function mockModule(
  modulePath: string,
  implementation: Record<string, unknown>
): {
  restore: () => void;
  getMock: () => unknown;
};
```

### 3. Test Data Generators (`generators.ts`)

```typescript
export interface GeneratorOptions {
  seed?: number;
  locale?: string;
  deterministic?: boolean;
}

/**
 * Create data generator
 */
export function createGenerator(options?: GeneratorOptions): {
  // Primitives
  boolean: (probability?: number) => boolean;
  integer: (min?: number, max?: number) => number;
  float: (min?: number, max?: number, precision?: number) => number;
  string: (length?: number, charset?: string) => string;
  
  // Common types
  uuid: () => string;
  email: (domain?: string) => string;
  url: (options?: { protocol?: string; domain?: string }) => string;
  ipAddress: (v6?: boolean) => string;
  hexColor: () => string;
  
  // Dates
  date: (start?: Date, end?: Date) => Date;
  pastDate: (years?: number) => Date;
  futureDate: (years?: number) => Date;
  
  // Arrays
  array: <T>(generator: () => T, length?: number) => T[];
  oneOf: <T>(choices: T[]) => T;
  subset: <T>(choices: T[], count?: number) => T[];
  
  // Objects
  object: <T>(schema: { [K in keyof T]: () => T[K] }) => T;
  partial: <T>(schema: { [K in keyof T]: () => T[K] }, probability?: number) => Partial<T>;
  
  // Text
  word: () => string;
  sentence: (words?: number) => string;
  paragraph: (sentences?: number) => string;
  
  // Names
  firstName: () => string;
  lastName: () => string;
  fullName: () => string;
  username: () => string;
  
  // Files
  fileName: (extension?: string) => string;
  filePath: (depth?: number) => string;
  mimeType: () => string;
};

/**
 * Generate test matrix
 */
export function generateTestMatrix<T extends Record<string, unknown>>(
  dimensions: {
    [K in keyof T]: T[K][];
  }
): T[];

/**
 * Property-based testing
 */
export function forAll<T>(
  generator: () => T,
  predicate: (value: T) => boolean,
  options?: {
    runs?: number;
    seed?: number;
    onFailure?: (value: T, error: unknown) => void;
  }
): void;

/**
 * Snapshot data generator
 */
export function generateSnapshot(
  name: string,
  generator: () => unknown,
  options?: {
    update?: boolean;
    format?: (value: unknown) => string;
  }
): void;
```

### 4. Custom Assertions (`assertions.ts`)

```typescript
/**
 * Async assertions
 */
export async function assertRejects(
  fn: () => Promise<unknown>,
  expected?: string | RegExp | ErrorConstructor
): Promise<void>;

export async function assertResolves<T>(
  fn: () => Promise<T>,
  expected?: T | ((value: T) => boolean)
): Promise<T>;

/**
 * Error assertions
 */
export function assertError(
  error: unknown,
  options?: {
    message?: string | RegExp;
    code?: string;
    type?: ErrorConstructor;
    cause?: unknown;
  }
): asserts error is Error;

export function assertErrorChain(
  error: unknown,
  chain: Array<{
    type?: ErrorConstructor;
    message?: string | RegExp;
  }>
): void;

/**
 * Type assertions
 */
export function assertType<T>(
  value: unknown,
  type: string,
  message?: string
): asserts value is T;

export function assertShape<T>(
  value: unknown,
  shape: { [K in keyof T]: (value: unknown) => boolean },
  message?: string
): asserts value is T;

/**
 * Performance assertions
 */
export async function assertPerformance(
  fn: () => void | Promise<void>,
  maxMs: number,
  options?: {
    runs?: number;
    warmup?: number;
  }
): Promise<void>;

export function assertMemoryUsage(
  fn: () => void,
  maxBytes: number,
  options?: {
    iterations?: number;
  }
): void;

/**
 * Snapshot assertions
 */
export function assertSnapshot(
  actual: unknown,
  name: string,
  options?: {
    update?: boolean;
    serializer?: (value: unknown) => string;
  }
): void;

/**
 * Eventually assertions (for async behavior)
 */
export async function assertEventually(
  condition: () => boolean | Promise<boolean>,
  options?: {
    timeout?: number;
    interval?: number;
    message?: string;
  }
): Promise<void>;
```

### 5. Performance Benchmarks (`benchmarks.ts`)

```typescript
export interface BenchmarkOptions {
  runs?: number;
  warmup?: number;
  async?: boolean;
  timeout?: number;
}

export interface BenchmarkResult {
  name: string;
  runs: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  ops: number; // Operations per second
  percentiles: {
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

/**
 * Run benchmark
 */
export async function benchmark(
  name: string,
  fn: () => void | Promise<void>,
  options?: BenchmarkOptions
): Promise<BenchmarkResult>;

/**
 * Compare benchmarks
 */
export async function compareBenchmarks(
  implementations: Record<string, () => void | Promise<void>>,
  options?: BenchmarkOptions
): Promise<{
  results: Record<string, BenchmarkResult>;
  fastest: string;
  slowest: string;
  rankings: Array<{ name: string; relative: number }>;
}>;

/**
 * Memory benchmark
 */
export async function benchmarkMemory(
  name: string,
  fn: () => void | Promise<void>,
  options?: {
    iterations?: number;
    gcBetween?: boolean;
  }
): Promise<{
  name: string;
  iterations: number;
  heapUsed: {
    before: number;
    after: number;
    delta: number;
    perIteration: number;
  };
  external: {
    before: number;
    after: number;
    delta: number;
  };
}>;

/**
 * Create benchmark suite
 */
export class BenchmarkSuite {
  constructor(name: string, options?: BenchmarkOptions);
  
  add(name: string, fn: () => void | Promise<void>): this;
  addBaseline(name: string, fn: () => void | Promise<void>): this;
  
  run(): Promise<{
    suite: string;
    results: BenchmarkResult[];
    comparisons: Array<{
      name: string;
      vsBaseline: number; // Percentage
    }>;
  }>;
  
  exportResults(format: 'json' | 'csv' | 'markdown'): string;
}
```

### 6. Test Fixtures (`fixtures.ts`)

```typescript
export interface FixtureOptions {
  path?: string;
  format?: 'json' | 'yaml' | 'js';
  cache?: boolean;
}

/**
 * Load test fixture
 */
export async function loadFixture<T>(
  name: string,
  options?: FixtureOptions
): Promise<T>;

/**
 * Save test fixture
 */
export async function saveFixture(
  name: string,
  data: unknown,
  options?: FixtureOptions
): Promise<void>;

/**
 * Fixture manager
 */
export class FixtureManager {
  constructor(basePath: string, options?: FixtureOptions);
  
  load<T>(name: string): Promise<T>;
  save(name: string, data: unknown): Promise<void>;
  exists(name: string): Promise<boolean>;
  list(pattern?: string): Promise<string[]>;
  clear(pattern?: string): Promise<void>;
  
  // Temporary fixtures
  createTemp<T>(data: T): Promise<{ path: string; cleanup: () => Promise<void> }>;
}

/**
 * Database fixtures
 */
export function createDatabaseFixture(options: {
  setup: () => Promise<void>;
  teardown: () => Promise<void>;
  data?: Record<string, unknown[]>;
}): {
  load: () => Promise<void>;
  reset: () => Promise<void>;
  cleanup: () => Promise<void>;
};

/**
 * File system fixtures
 */
export function createFileFixture(
  structure: Record<string, string | Buffer>
): Promise<{
  path: string;
  cleanup: () => Promise<void>;
  update: (path: string, content: string | Buffer) => Promise<void>;
}>;
```

## Integration Examples

### Test Setup with Suppression
```typescript
import { setupTestSuppression, suppressWarnings } from '@utils/testing';

// Global setup
setupTestSuppression({
  warnings: true,
  unhandledRejections: true
});

// Per-test suppression
test('handles expected errors', async () => {
  const { restore } = suppressWarnings({
    patterns: [/DeprecationWarning/]
  });
  
  try {
    await someDeprecatedFunction();
  } finally {
    restore();
  }
});
```

### Mock Usage
```typescript
import { createMockFactory, CommonMocks } from '@utils/testing';

const userFactory = createMockFactory<User>({
  id: '123',
  name: 'Test User',
  email: 'test@example.com'
});

test('user service', async () => {
  const logger = CommonMocks.logger();
  const user = userFactory.create({ name: 'John' });
  
  const service = new UserService(logger);
  await service.updateUser(user);
  
  expect(logger.info).toHaveBeenCalledWith('User updated', { userId: user.id });
});
```

### Performance Testing
```typescript
import { compareBenchmarks, BenchmarkSuite } from '@utils/testing';

const suite = new BenchmarkSuite('String Operations');

suite
  .addBaseline('concat', () => 'hello' + 'world')
  .add('template', () => `${'hello'}${'world'}`)
  .add('join', () => ['hello', 'world'].join(''));

const results = await suite.run();
console.log(suite.exportResults('markdown'));
```

## Performance Considerations

1. **Test Isolation**: Clean up all mocks and fixtures
2. **Memory Leaks**: Clear event listeners and timers
3. **Parallel Testing**: Make fixtures thread-safe
4. **Deterministic**: Use seeded random for reproducibility
5. **Fast Feedback**: Optimize for quick test runs

## Success Metrics

- ✅ Reduced test boilerplate
- ✅ Better test reliability
- ✅ Improved test performance
- ✅ Easier test debugging
- ✅ Consistent test patterns