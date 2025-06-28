# Timing and Backoff Utilities Specification

## Overview
Extract timing, backoff, and performance measurement utilities for use across the Terroir Core Design System.

## Module Structure
```
lib/utils/timing/
├── index.ts              # Main exports
├── backoff.ts           # Backoff strategies
├── jitter.ts            # Jitter algorithms
├── throttle.ts          # Throttling/debouncing
├── performance.ts       # Performance measurement
├── scheduler.ts         # Task scheduling utilities
└── __tests__/
    ├── backoff.test.ts
    ├── jitter.test.ts
    ├── throttle.test.ts
    ├── performance.test.ts
    └── scheduler.test.ts
```

## Detailed Specifications

### 1. Backoff Strategies (`backoff.ts`)

```typescript
export interface BackoffOptions {
  initialDelay: number;
  maxDelay: number;
  factor: number;
  jitter?: boolean | JitterOptions;
}

export interface BackoffResult {
  delay: number;
  attempt: number;
  nextDelay: number;
}

/**
 * Calculate exponential backoff delay
 */
export function exponentialBackoff(
  attempt: number,
  options?: Partial<BackoffOptions>
): number;

/**
 * Calculate linear backoff delay
 */
export function linearBackoff(
  attempt: number,
  increment: number = 1000,
  maxDelay?: number
): number;

/**
 * Calculate fibonacci backoff delay
 */
export function fibonacciBackoff(
  attempt: number,
  baseDelay: number = 100,
  maxDelay?: number
): number;

/**
 * Custom backoff strategy
 */
export function customBackoff(
  attempt: number,
  calculator: (attempt: number) => number,
  options?: {
    maxDelay?: number;
    jitter?: boolean;
  }
): number;

/**
 * Create a backoff iterator
 */
export function* backoffIterator(
  options: BackoffOptions
): Generator<BackoffResult, void, unknown>;

/**
 * Backoff with deadline
 */
export function backoffWithDeadline(
  options: BackoffOptions & {
    deadline: number | Date;
    onDeadline?: () => void;
  }
): {
  getDelay: (attempt: number) => number | null;
  timeRemaining: () => number;
  isExpired: () => boolean;
};
```

**Testing Requirements:**
- ✅ Test exponential growth
- ✅ Test linear progression
- ✅ Test fibonacci sequence
- ✅ Test max delay capping
- ✅ Test jitter application
- ✅ Test iterator functionality
- ✅ Test deadline handling
- ✅ Mathematical accuracy tests

### 2. Jitter Algorithms (`jitter.ts`)

```typescript
export interface JitterOptions {
  type: 'full' | 'equal' | 'decorrelated';
  factor?: number; // 0-1, default 0.25
  random?: () => number; // For testing
}

/**
 * Apply full jitter (0 to delay)
 */
export function fullJitter(
  delay: number,
  random: () => number = Math.random
): number;

/**
 * Apply equal jitter (±factor)
 */
export function equalJitter(
  delay: number,
  factor: number = 0.25,
  random: () => number = Math.random
): number;

/**
 * Apply decorrelated jitter (AWS best practice)
 */
export function decorrelatedJitter(
  delay: number,
  previousDelay: number,
  baseDelay: number,
  random: () => number = Math.random
): number;

/**
 * Create jitter function
 */
export function createJitter(
  options: JitterOptions
): (delay: number, previousDelay?: number) => number;

/**
 * Analyze jitter distribution
 */
export function analyzeJitterDistribution(
  jitterFn: (delay: number) => number,
  delay: number,
  samples: number = 1000
): {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  distribution: Map<number, number>;
};
```

**Testing Requirements:**
- ✅ Test jitter ranges
- ✅ Test distribution uniformity
- ✅ Test decorrelated progression
- ✅ Test custom random functions
- ✅ Test edge cases (0 delay)
- ✅ Statistical analysis
- ✅ Performance benchmarks

### 3. Throttle/Debounce (`throttle.ts`)

```typescript
export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  options?: ThrottleOptions
): T & {
  cancel: () => void;
  flush: () => ReturnType<T> | undefined;
  pending: () => boolean;
};

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  options?: {
    leading?: boolean;
    maxWait?: number;
  }
): T & {
  cancel: () => void;
  flush: () => ReturnType<T> | undefined;
  pending: () => boolean;
};

/**
 * Rate limit function calls
 */
export function rateLimit<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    maxCalls: number;
    perMs: number;
    queueExcess?: boolean;
  }
): T & {
  reset: () => void;
  getStats: () => { calls: number; rejected: number };
};

/**
 * Async throttle with queue
 */
export function asyncThrottle<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    maxConcurrent: number;
    maxQueued?: number;
  }
): T & {
  queue: () => number;
  clear: () => void;
};
```

**Testing Requirements:**
- ✅ Test throttle timing
- ✅ Test debounce behavior
- ✅ Test leading/trailing options
- ✅ Test maxWait functionality
- ✅ Test cancellation
- ✅ Test rate limiting
- ✅ Test async queuing
- ✅ Test memory cleanup

### 4. Performance Measurement (`performance.ts`)

```typescript
export interface PerformanceMark {
  name: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceMetrics {
  duration: number;
  startTime: number;
  endTime: number;
  marks: PerformanceMark[];
  memory?: {
    before: NodeJS.MemoryUsage;
    after: NodeJS.MemoryUsage;
    delta: NodeJS.MemoryUsage;
  };
}

/**
 * Measure function execution time
 */
export async function measureTime<T>(
  fn: () => T | Promise<T>,
  options?: {
    name?: string;
    includeMemory?: boolean;
    onComplete?: (metrics: PerformanceMetrics) => void;
  }
): Promise<T>;

/**
 * Create performance timer
 */
export function createTimer(name?: string): {
  mark: (label: string, metadata?: Record<string, unknown>) => void;
  measure: (startMark: string, endMark: string) => number;
  getMetrics: () => PerformanceMetrics;
  reset: () => void;
};

/**
 * Profile function performance
 */
export function profile<T extends (...args: any[]) => any>(
  fn: T,
  options?: {
    name?: string;
    sampleRate?: number; // 0-1
    slowThreshold?: number; // ms
    onSlow?: (metrics: PerformanceMetrics) => void;
  }
): T;

/**
 * Benchmark function
 */
export async function benchmark(
  fn: () => void | Promise<void>,
  options?: {
    iterations?: number;
    warmup?: number;
    async?: boolean;
  }
): Promise<{
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  ops: number; // Operations per second
}>;

/**
 * Track performance over time
 */
export class PerformanceTracker {
  constructor(options?: {
    maxSamples?: number;
    bucketSize?: number; // ms
  });
  
  record(name: string, duration: number): void;
  getStats(name: string): {
    count: number;
    mean: number;
    p50: number;
    p95: number;
    p99: number;
  };
  
  reset(name?: string): void;
}
```

**Testing Requirements:**
- ✅ Test timing accuracy
- ✅ Test memory measurement
- ✅ Test marking functionality
- ✅ Test profiling sampling
- ✅ Test slow detection
- ✅ Test benchmarking
- ✅ Test statistical calculations
- ✅ Test tracker limits

### 5. Task Scheduler (`scheduler.ts`)

```typescript
export interface ScheduleOptions {
  delay?: number;
  interval?: number;
  times?: number;
  cron?: string;
  timezone?: string;
}

/**
 * Schedule task execution
 */
export function schedule(
  task: () => void | Promise<void>,
  options: ScheduleOptions
): {
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  getNextRun: () => Date | null;
  getStats: () => {
    runs: number;
    failures: number;
    lastRun?: Date;
    nextRun?: Date;
  };
};

/**
 * Batch scheduler for multiple tasks
 */
export class TaskScheduler {
  constructor(options?: {
    maxConcurrent?: number;
    defaultRetry?: number;
  });
  
  add(
    id: string,
    task: () => void | Promise<void>,
    schedule: ScheduleOptions
  ): void;
  
  remove(id: string): void;
  start(): void;
  stop(): void;
  getTask(id: string): ScheduledTask | undefined;
  listTasks(): ScheduledTask[];
}

/**
 * Execute tasks with priority
 */
export class PriorityQueue<T> {
  constructor(compareFn?: (a: T, b: T) => number);
  
  enqueue(item: T, priority: number): void;
  dequeue(): T | undefined;
  peek(): T | undefined;
  size(): number;
  clear(): void;
}
```

## Integration Examples

### Retry Enhancement
```typescript
import { exponentialBackoff, decorrelatedJitter } from '@utils/timing';

// Enhanced retry with sophisticated backoff
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const backoff = backoffIterator({
    initialDelay: options.initialDelay,
    maxDelay: options.maxDelay,
    factor: options.backoffFactor,
    jitter: { type: 'decorrelated' }
  });
  
  for (const { delay, attempt } of backoff) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= options.maxAttempts) throw error;
      await sleep(delay);
    }
  }
}
```

### Logger Performance Tracking
```typescript
import { measureTime, PerformanceTracker } from '@utils/timing';

const perfTracker = new PerformanceTracker({ maxSamples: 1000 });

// Track log write performance
export async function writeLog(entry: LogEntry): Promise<void> {
  const result = await measureTime(
    () => transport.write(entry),
    {
      name: 'log-write',
      onComplete: (metrics) => {
        perfTracker.record('log-write', metrics.duration);
        
        if (metrics.duration > 100) {
          logger.warn('Slow log write detected', { metrics });
        }
      }
    }
  );
  
  return result;
}

// Get performance stats
export function getLogPerformance() {
  return perfTracker.getStats('log-write');
}
```

### API Rate Limiting
```typescript
import { rateLimit, throttle } from '@utils/timing';

// Rate limit API calls
const rateLimitedFetch = rateLimit(
  fetch,
  {
    maxCalls: 100,
    perMs: 60000, // 100 calls per minute
    queueExcess: true
  }
);

// Throttle expensive operations
const throttledProcess = throttle(
  processData,
  1000,
  { leading: true, trailing: false }
);
```

## Performance Considerations

1. **Timer Precision**: Use `performance.now()` for sub-millisecond accuracy
2. **Memory Management**: Clear timers and callbacks
3. **Clock Drift**: Handle system time changes
4. **Queue Limits**: Prevent unbounded growth
5. **Statistical Accuracy**: Use appropriate sample sizes

## Success Metrics

- ✅ Sub-millisecond timing accuracy
- ✅ Predictable backoff patterns
- ✅ Efficient memory usage
- ✅ Accurate performance metrics
- ✅ Reliable scheduling