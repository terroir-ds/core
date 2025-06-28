# Performance Utilities Specification

## Overview
Extract performance monitoring and optimization utilities from the logger for use across the Terroir Core Design System.

## Module Structure
```
lib/utils/performance/
├── index.ts              # Main exports
├── memory.ts            # Memory monitoring utilities
├── timing.ts            # Enhanced timing utilities
├── rate-limiter.ts      # Rate limiting implementation
├── object-pool.ts       # Object pooling for performance
├── metrics.ts           # Performance metrics collection
└── __tests__/
    ├── memory.test.ts
    ├── timing.test.ts
    ├── rate-limiter.test.ts
    ├── object-pool.test.ts
    └── metrics.test.ts
```

## Detailed Specifications

### 1. Memory Monitoring (`memory.ts`)

```typescript
export interface MemoryStats {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
  // Calculated values
  heapPercentage: number;
  totalMemory: number;
  availableMemory: number;
}

export interface MemorySnapshot {
  timestamp: number;
  stats: MemoryStats;
  delta?: MemoryStats;
  context?: Record<string, unknown>;
}

/**
 * Get current memory statistics
 */
export function getMemoryStats(): MemoryStats;

/**
 * Calculate memory delta between two snapshots
 */
export function calculateMemoryDelta(
  before: MemoryStats,
  after: MemoryStats
): MemoryStats;

/**
 * Monitor memory usage over time
 */
export class MemoryMonitor {
  constructor(options?: {
    interval?: number;
    maxSnapshots?: number;
    thresholds?: {
      heapUsed?: number;
      rss?: number;
      percentage?: number;
    };
    onThreshold?: (stats: MemoryStats, threshold: string) => void;
  });
  
  start(): void;
  stop(): void;
  snapshot(context?: Record<string, unknown>): MemorySnapshot;
  getHistory(): MemorySnapshot[];
  getStats(): {
    current: MemoryStats;
    average: MemoryStats;
    peak: MemoryStats;
    trend: 'stable' | 'increasing' | 'decreasing';
  };
  reset(): void;
}

/**
 * Track memory usage of async operations
 */
export async function trackMemory<T>(
  fn: () => T | Promise<T>,
  options?: {
    label?: string;
    threshold?: number;
    onComplete?: (delta: MemoryStats) => void;
  }
): Promise<{ result: T; memory: MemoryStats }>;

/**
 * Memory leak detector
 */
export class MemoryLeakDetector {
  constructor(options?: {
    growthThreshold?: number; // percentage
    sampleInterval?: number;
    sampleCount?: number;
  });
  
  start(): void;
  stop(): void;
  check(): {
    hasLeak: boolean;
    confidence: number;
    growthRate: number;
    samples: MemorySnapshot[];
  };
}
```

### 2. Enhanced Timing Utilities (`timing.ts`)

```typescript
export interface TimingResult<T> {
  result: T;
  duration: number;
  startTime: number;
  endTime: number;
  metadata?: Record<string, unknown>;
}

export interface TimingOptions {
  label?: string;
  metadata?: Record<string, unknown>;
  includeMemory?: boolean;
  timeout?: number;
  onSlow?: (duration: number) => void;
  slowThreshold?: number;
}

/**
 * Enhanced time measurement with metadata
 */
export async function measureTime<T>(
  fn: () => T | Promise<T>,
  options?: TimingOptions
): Promise<TimingResult<T>>;

/**
 * Create a performance timer
 */
export class PerformanceTimer {
  constructor(label?: string);
  
  start(operation?: string): void;
  mark(label: string, metadata?: Record<string, unknown>): void;
  measure(startMark: string, endMark: string): number;
  lap(label?: string): number;
  stop(): TimingResult<void>;
  getMarks(): Array<{ label: string; time: number; metadata?: Record<string, unknown> }>;
  getMeasurements(): Array<{ name: string; duration: number }>;
}

/**
 * Benchmark utility for comparing implementations
 */
export async function benchmark<T>(
  implementations: Record<string, () => T | Promise<T>>,
  options?: {
    iterations?: number;
    warmup?: number;
    concurrent?: boolean;
  }
): Promise<{
  results: Record<string, {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
    ops: number;
  }>;
  fastest: string;
  slowest: string;
  summary: string;
}>;

/**
 * Create auto-instrumented function
 */
export function instrument<T extends (...args: any[]) => any>(
  fn: T,
  options?: {
    name?: string;
    logger?: (timing: TimingResult<unknown>) => void;
    includeArgs?: boolean;
  }
): T;
```

### 3. Rate Limiter (`rate-limiter.ts`)

```typescript
export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (...args: any[]) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimit?: (key: string) => void;
}

/**
 * Token bucket rate limiter
 */
export class TokenBucketRateLimiter {
  constructor(options: {
    capacity: number;
    refillRate: number; // tokens per second
    initialTokens?: number;
  });
  
  tryConsume(tokens?: number): boolean;
  consume(tokens?: number): Promise<void>;
  getAvailableTokens(): number;
  reset(): void;
}

/**
 * Sliding window rate limiter
 */
export class SlidingWindowRateLimiter {
  constructor(options: RateLimiterOptions);
  
  tryConsume(key?: string): boolean;
  consume(key?: string): Promise<void>;
  reset(key?: string): void;
  getStats(key?: string): {
    requests: number;
    remaining: number;
    resetAt: Date;
  };
}

/**
 * Create rate-limited function
 */
export function rateLimit<T extends (...args: any[]) => any>(
  fn: T,
  options: RateLimiterOptions & {
    strategy?: 'sliding-window' | 'token-bucket';
  }
): T & {
  reset: (key?: string) => void;
  getStats: (key?: string) => unknown;
};

/**
 * Distributed rate limiter interface
 */
export interface DistributedRateLimiter {
  tryConsume(key: string, tokens?: number): Promise<boolean>;
  reset(key: string): Promise<void>;
  getStats(key: string): Promise<unknown>;
}
```

### 4. Object Pool (`object-pool.ts`)

```typescript
export interface PoolOptions<T> {
  create: () => T;
  reset?: (obj: T) => void;
  destroy?: (obj: T) => void;
  validate?: (obj: T) => boolean;
  max?: number;
  min?: number;
  idleTimeout?: number;
}

/**
 * Generic object pool for performance
 */
export class ObjectPool<T> {
  constructor(options: PoolOptions<T>);
  
  acquire(): T;
  release(obj: T): void;
  drain(): void;
  getStats(): {
    size: number;
    available: number;
    borrowed: number;
    created: number;
    destroyed: number;
  };
}

/**
 * Create pooled factory function
 */
export function createPooledFactory<T>(
  factory: () => T,
  options?: Partial<PoolOptions<T>>
): {
  create: () => T;
  release: (obj: T) => void;
  stats: () => unknown;
};

/**
 * Common pools
 */
export const CommonPools = {
  /**
   * Buffer pool for I/O operations
   */
  buffer: (size: number) => ObjectPool<Buffer>;
  
  /**
   * Array pool for temporary arrays
   */
  array: <T>() => ObjectPool<T[]>;
  
  /**
   * Map pool for temporary lookups
   */
  map: <K, V>() => ObjectPool<Map<K, V>>;
};
```

### 5. Performance Metrics (`metrics.ts`)

```typescript
export interface MetricOptions {
  name: string;
  unit?: string;
  description?: string;
  labels?: Record<string, string>;
}

/**
 * Performance metric types
 */
export class Counter {
  constructor(options: MetricOptions);
  increment(value?: number, labels?: Record<string, string>): void;
  reset(): void;
  get(): number;
}

export class Gauge {
  constructor(options: MetricOptions);
  set(value: number, labels?: Record<string, string>): void;
  increment(value?: number): void;
  decrement(value?: number): void;
  get(): number;
}

export class Histogram {
  constructor(options: MetricOptions & {
    buckets?: number[];
  });
  observe(value: number, labels?: Record<string, string>): void;
  reset(): void;
  getStats(): {
    count: number;
    sum: number;
    mean: number;
    min: number;
    max: number;
    percentiles: Record<number, number>;
  };
}

/**
 * Metrics registry
 */
export class MetricsRegistry {
  counter(name: string, options?: Partial<MetricOptions>): Counter;
  gauge(name: string, options?: Partial<MetricOptions>): Gauge;
  histogram(name: string, options?: Partial<MetricOptions>): Histogram;
  
  collect(): Array<{
    name: string;
    type: string;
    value: unknown;
    labels?: Record<string, string>;
  }>;
  
  reset(): void;
}

/**
 * Auto-collect system metrics
 */
export function collectSystemMetrics(
  registry: MetricsRegistry,
  options?: {
    cpu?: boolean;
    memory?: boolean;
    eventLoop?: boolean;
    gc?: boolean;
  }
): () => void;
```

## Integration Examples

### Enhanced Logger Performance
```typescript
import { measureTime, MemoryMonitor } from '@utils/performance';

// Track logger performance
const memoryMonitor = new MemoryMonitor({
  thresholds: { heapUsed: 100 * 1024 * 1024 }, // 100MB
  onThreshold: (stats) => {
    console.warn('High memory usage detected', stats);
  }
});

export async function writeLog(entry: LogEntry): Promise<void> {
  const result = await measureTime(
    () => transport.write(entry),
    {
      label: 'log-write',
      slowThreshold: 50,
      onSlow: (duration) => {
        metrics.histogram('log_write_duration').observe(duration);
      }
    }
  );
  
  return result.result;
}
```

### API Endpoint Protection
```typescript
import { rateLimit, TokenBucketRateLimiter } from '@utils/performance';

// Rate limit API endpoints
const apiLimiter = new TokenBucketRateLimiter({
  capacity: 100,
  refillRate: 10 // 10 requests per second
});

export const protectedEndpoint = rateLimit(
  async (req: Request) => {
    // Endpoint logic
  },
  {
    windowMs: 60000,
    maxRequests: 100,
    keyGenerator: (req) => req.ip
  }
);
```

### Resource Pooling
```typescript
import { ObjectPool, CommonPools } from '@utils/performance';

// Pool expensive objects
const parserPool = new ObjectPool({
  create: () => new HeavyParser(),
  reset: (parser) => parser.clear(),
  max: 10
});

export function parseData(data: string): ParseResult {
  const parser = parserPool.acquire();
  try {
    return parser.parse(data);
  } finally {
    parserPool.release(parser);
  }
}
```

## Performance Considerations

1. **Overhead**: Keep measurement overhead minimal
2. **Memory**: Pool objects to reduce GC pressure
3. **Accuracy**: Use high-resolution timers
4. **Sampling**: Support sampling for high-frequency operations
5. **Async**: Handle async operations correctly

## Migration Strategy

### Phase 1: Core Extraction
1. Extract memory monitoring from logger
2. Extract timing utilities
3. Create comprehensive tests

### Phase 2: Enhancement
1. Add object pooling
2. Implement rate limiters
3. Add metrics collection

### Phase 3: Integration
1. Update logger to use utilities
2. Add to critical paths
3. Create performance dashboard

## Success Metrics

- ✅ <1% measurement overhead
- ✅ Accurate memory tracking
- ✅ Effective rate limiting
- ✅ Reduced GC pressure via pooling
- ✅ Actionable performance insights