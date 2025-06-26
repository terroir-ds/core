/**
 * Retry logic and resilience patterns
 * 
 * Features:
 * - Exponential backoff with jitter
 * - Circuit breaker pattern
 * - Timeout handling
 * - Cancellation support
 * - Resource cleanup
 */

// Note: delay package imported but not used - we use custom delayWithSignal instead
import { NetworkError } from './base-error.js';
import { logger } from '../logger.js';
import { getMessage } from './messages.js';
import type {
  RetryOptions,
  CircuitBreakerOptions,
} from '../types/error.types.js';

// Re-export for backward compatibility
export type {
  RetryOptions,
  CircuitBreakerOptions,
} from '../types/error.types.js';
export type { BatchRetryResult } from '../types/error.types.js';

/**
 * Custom delay function that preserves abort reasons
 */
async function delayWithSignal(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    throw new Error(
      signal.reason instanceof Error ? signal.reason.message : String(signal.reason) || 'Operation cancelled'
    );
  }
  
  return new Promise<void>((resolve, reject) => {
    const timer = globalThis.setTimeout(resolve, ms);
    
    if (signal) {
      const abortHandler = () => {
        globalThis.clearTimeout(timer);
        const reason = signal.reason instanceof Error 
          ? signal.reason.message 
          : String(signal.reason) || 'Operation cancelled';
        reject(new Error(reason));
      };
      
      signal.addEventListener('abort', abortHandler, { once: true });
    }
  });
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'signal' | 'shouldRetry' | 'onRetry' | 'context'>> = {
  maxAttempts: 3,
  initialDelay: 100,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: true,
  timeout: 30000,
};

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  backoffFactor: number,
  maxDelay: number,
  jitter: boolean
): number {
  let delay = initialDelay * Math.pow(backoffFactor, attempt - 1);
  delay = Math.min(delay, maxDelay);
  
  if (jitter) {
    // Add random jitter ±25%
    const jitterAmount = delay * 0.25;
    delay += (Math.random() * 2 - 1) * jitterAmount;
  }
  
  return Math.max(0, Math.floor(delay));
}

/**
 * Execute a function with retry logic
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const startTime = Date.now();
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      // Check if cancelled
      if (opts.signal?.aborted) {
        throw new Error(getMessage('OPERATION_CANCELLED'), { cause: opts.signal.reason });
      }
      
      // Execute with timeout
      const result = await withTimeout(fn(), opts.timeout, opts.signal);
      
      // Success - log if this was a retry
      if (attempt > 1) {
        logger.info({
          ...opts.context,
          attempt,
          duration: Date.now() - startTime,
        }, 'Operation succeeded after retry');
      }
      
      return result;
    } catch (error) {
      const isLastAttempt = attempt === opts.maxAttempts;
      
      // Check if we should retry
      const shouldRetry = opts.shouldRetry 
        ? opts.shouldRetry(error, attempt)
        : true; // Default to retrying all errors
      
      if (!shouldRetry || isLastAttempt) {
        // No retry - wrap and throw
        const finalError = new NetworkError(
          getMessage('OPERATION_FAILED', attempt),
          {
            cause: error,
            context: {
              ...opts.context,
              attempts: attempt,
              duration: Date.now() - startTime,
            },
          }
        );
        
        logger.error(finalError.toLogContext(), 'Retry failed');
        throw finalError;
      }
      
      // Calculate delay for next attempt
      const delayMs = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.backoffFactor,
        opts.maxDelay,
        opts.jitter
      );
      
      // Log retry attempt
      logger.warn({
        ...opts.context,
        err: error,
        attempt,
        nextDelay: delayMs,
        maxAttempts: opts.maxAttempts,
      }, 'Operation failed, retrying');
      
      // Call retry callback if provided
      opts.onRetry?.(error, attempt, delayMs);
      
      // Wait before retrying
      await delayWithSignal(delayMs, opts.signal);
    }
  }
  
  // This should never be reached
  throw new Error('Retry logic error');
}

/**
 * Execute a function with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<T> {
  // Create timeout controller
  const timeoutController = new AbortController();
  const timeoutId = globalThis.setTimeout(() => {
    timeoutController.abort(new Error(getMessage('OPERATION_TIMEOUT', timeoutMs)));
  }, timeoutMs);
  
  try {
    // Combine user signal with timeout signal
    const combinedSignal = signal 
      ? combineSignals([signal, timeoutController.signal])
      : timeoutController.signal;
    
    // Race promise against combined signal
    const result = await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        combinedSignal.addEventListener('abort', () => {
          const reason = combinedSignal.reason instanceof Error 
            ? combinedSignal.reason.message 
            : String(combinedSignal.reason) || 'Operation aborted';
          reject(new Error(reason));
        });
      }),
    ]);
    
    return result;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

/**
 * Combine multiple abort signals into one
 * Useful for timeout + user cancellation scenarios
 */
export function combineSignals(signals: (AbortSignal | undefined)[]): AbortSignal {
  // Filter out undefined signals
  const validSignals = signals.filter((s): s is AbortSignal => s !== undefined);
  
  // If no signals provided, return never-aborted signal
  if (validSignals.length === 0) {
    return new AbortController().signal;
  }
  
  // If only one signal, return it directly
  if (validSignals.length === 1) {
    return validSignals[0];
  }
  
  // Use native AbortSignal.any if available (Node.js 20+)
  if ('any' in AbortSignal && typeof AbortSignal.any === 'function') {
    return AbortSignal.any(validSignals);
  }
  
  // Fallback for older Node.js versions
  const controller = new AbortController();
  
  // Check if any signal is already aborted
  for (const signal of validSignals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
  }
  
  // Listen for abort events on all signals
  for (const signal of validSignals) {
    signal.addEventListener('abort', () => {
      if (!controller.signal.aborted) {
        controller.abort(signal.reason);
      }
    }, { once: true });
  }
  
  return controller.signal;
}

/**
 * Circuit breaker state
 */
enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open',
}


/**
 * Circuit breaker implementation
 */
export class CircuitBreaker<T> {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number[] = [];
  private successes: number = 0;
  private lastFailureTime: number = 0;
  private readonly options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      successThreshold: options.successThreshold ?? 2,
      timeWindow: options.timeWindow ?? 60000, // 1 minute
      cooldownPeriod: options.cooldownPeriod ?? 30000, // 30 seconds
      name: options.name ?? 'CircuitBreaker',
    };
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute(fn: () => Promise<T>): Promise<T> {
    // Check circuit state
    if (this.state === CircuitState.OPEN) {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure < this.options.cooldownPeriod) {
        throw new NetworkError(getMessage('CIRCUIT_OPEN'), {
          code: 'CIRCUIT_OPEN',
          context: {
            circuitName: this.options.name,
            state: this.state,
            cooldownRemaining: this.options.cooldownPeriod - timeSinceFailure,
          },
        });
      }
      // Move to half-open state
      this.state = CircuitState.HALF_OPEN;
      this.successes = 0;
      logger.info({
        circuit: this.options.name,
        state: this.state,
      }, 'Circuit breaker half-open');
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Record successful execution
   */
  private recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failures = [];
        logger.info({
          circuit: this.options.name,
          state: this.state,
        }, 'Circuit breaker closed');
      }
    }
  }

  /**
   * Record failed execution
   */
  private recordFailure(): void {
    const now = Date.now();
    this.lastFailureTime = now;

    if (this.state === CircuitState.HALF_OPEN) {
      // Immediately open on failure in half-open state
      this.state = CircuitState.OPEN;
      logger.warn({
        circuit: this.options.name,
        state: this.state,
      }, 'Circuit breaker opened from half-open');
      return;
    }

    // Add failure to window
    this.failures.push(now);
    
    // Remove old failures outside time window
    const cutoff = now - this.options.timeWindow;
    this.failures = this.failures.filter(time => time > cutoff);

    // Check if we should open the circuit
    if (this.failures.length >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      logger.warn({
        circuit: this.options.name,
        state: this.state,
        failures: this.failures.length,
        threshold: this.options.failureThreshold,
      }, 'Circuit breaker opened');
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit statistics
   */
  getStats(): Record<string, unknown> {
    return {
      name: this.options.name,
      state: this.state,
      failures: this.failures.length,
      lastFailureTime: this.lastFailureTime,
      timeWindow: this.options.timeWindow,
      failureThreshold: this.options.failureThreshold,
    };
  }

  /**
   * Reset circuit to closed state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = [];
    this.successes = 0;
    this.lastFailureTime = 0;
    logger.info({
      circuit: this.options.name,
    }, 'Circuit breaker reset');
  }
}

/**
 * Retry with circuit breaker
 */
export async function retryWithCircuitBreaker<T>(
  fn: () => Promise<T>,
  circuitBreaker: CircuitBreaker<T>,
  retryOptions?: RetryOptions
): Promise<T> {
  return circuitBreaker.execute(() => retry(fn, retryOptions));
}

/**
 * Batch operations with retry
 */
export async function batchRetry<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  options: RetryOptions & { concurrency?: number } = {}
): Promise<Array<{ item: T; result?: R; error?: Error }>> {
  const concurrency = options.concurrency ?? 5;
  const results: Array<{ item: T; result?: R; error?: Error }> = [];
  
  // Process in batches
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(async (item) => {
        try {
          const result = await retry(() => fn(item), options);
          return { item, result };
        } catch (error) {
          return { item, error: error as Error };
        }
      })
    );
    
    // Collect results
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }
  }
  
  return results;
}

/**
 * Create a retryable function
 */
export function makeRetryable<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  defaultOptions?: RetryOptions
): T {
  return (async (...args: Parameters<T>) => {
    return retry(() => fn(...args), defaultOptions);
  }) as T;
}