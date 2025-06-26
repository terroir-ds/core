/**
 * @fileoverview Rate limiting utilities using token bucket algorithm
 * @module @utils/async/helpers/rate-limit
 */

import { createManagedTimer } from './timers';
import { checkAborted } from './abort';

/**
 * Token bucket for rate limiting
 */
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;
  
  /**
   * Creates a new token bucket
   * @param maxTokens - Maximum number of tokens the bucket can hold
   * @param refillRate - Number of tokens to add per second
   */
  constructor(maxTokens: number, refillRate: number) {
    if (maxTokens <= 0) {
      throw new Error('maxTokens must be positive');
    }
    if (refillRate <= 0) {
      throw new Error('refillRate must be positive');
    }
    
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }
  
  /**
   * Acquire tokens from the bucket
   * @param count - Number of tokens to acquire (default: 1)
   * @param options - Acquire options
   * @returns Promise that resolves when tokens are acquired
   */
  async acquire(
    count: number = 1,
    options?: { signal?: AbortSignal; maxWaitMs?: number }
  ): Promise<void> {
    if (count <= 0) {
      throw new Error('Token count must be positive');
    }
    if (count > this.maxTokens) {
      throw new Error(`Cannot acquire ${count} tokens, max is ${this.maxTokens}`);
    }
    
    checkAborted(options?.signal);
    
    const startTime = Date.now();
    
    while (true) {
      this.refill();
      
      if (this.tokens >= count) {
        this.tokens -= count;
        return;
      }
      
      // Check timeout
      if (options?.maxWaitMs !== undefined) {
        const elapsed = Date.now() - startTime;
        if (elapsed >= options.maxWaitMs) {
          throw new Error(`Timeout waiting for ${count} tokens after ${elapsed}ms`);
        }
      }
      
      // Calculate wait time
      const tokensNeeded = count - this.tokens;
      const waitMs = Math.ceil((tokensNeeded / this.refillRate) * 1000);
      
      // Wait for tokens to become available
      const timer = createManagedTimer(Math.min(waitMs, 100), { signal: options?.signal });
      await timer.promise;
    }
  }
  
  /**
   * Try to acquire tokens without waiting
   * @param count - Number of tokens to acquire
   * @returns True if tokens were acquired, false otherwise
   */
  tryAcquire(count: number = 1): boolean {
    if (count <= 0) {
      throw new Error('Token count must be positive');
    }
    
    this.refill();
    
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    
    return false;
  }
  
  /**
   * Get the current number of available tokens
   */
  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
  
  /**
   * Get the time until the specified number of tokens will be available
   * @param count - Number of tokens needed
   * @returns Milliseconds until tokens are available, or 0 if already available
   */
  getWaitTime(count: number = 1): number {
    if (count <= 0) {
      throw new Error('Token count must be positive');
    }
    
    this.refill();
    
    if (this.tokens >= count) {
      return 0;
    }
    
    const tokensNeeded = count - this.tokens;
    return Math.ceil((tokensNeeded / this.refillRate) * 1000);
  }
  
  /**
   * Reset the bucket to full capacity
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }
  
  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const refillAmount = (elapsed / 1000) * this.refillRate;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + refillAmount);
    this.lastRefill = now;
  }
}

/**
 * Rate limiter that limits calls per time window
 */
export class RateLimiter {
  private readonly bucket: TokenBucket;
  
  /**
   * Creates a new rate limiter
   * @param callsPerSecond - Maximum number of calls per second
   * @param options - Rate limiter options
   */
  constructor(
    callsPerSecond: number,
    options?: {
      /**
       * Maximum burst size (default: callsPerSecond)
       */
      burstSize?: number;
      
      /**
       * Whether to throw on rate limit (default: false, will wait instead)
       */
      throwOnLimit?: boolean;
    }
  ) {
    const { burstSize = callsPerSecond, throwOnLimit = false } = options || {};
    
    this.bucket = new TokenBucket(burstSize, callsPerSecond);
    this.throwOnLimit = throwOnLimit;
  }
  
  private readonly throwOnLimit: boolean;
  
  /**
   * Execute a function with rate limiting
   * @param fn - Function to execute
   * @param options - Execution options
   * @returns Result of the function
   */
  async execute<T>(
    fn: () => T | Promise<T>,
    options?: { signal?: AbortSignal }
  ): Promise<T> {
    if (this.throwOnLimit && !this.bucket.tryAcquire()) {
      throw new Error('Rate limit exceeded');
    } else {
      await this.bucket.acquire(1, options);
    }
    
    return fn();
  }
  
  /**
   * Create a rate-limited version of a function
   * @param fn - Function to wrap
   * @returns Rate-limited version of the function
   */
  wrap<T extends (...args: unknown[]) => unknown>(fn: T): T {
    return (async (...args: Parameters<T>) => {
      await this.execute(() => {});
      return fn(...args);
    }) as T;
  }
  
  /**
   * Check if a call would be rate limited
   * @returns True if the next call would be rate limited
   */
  wouldLimit(): boolean {
    return this.bucket.getAvailableTokens() < 1;
  }
  
  /**
   * Get the time until the next call can be made
   * @returns Milliseconds until next call, or 0 if ready
   */
  getWaitTime(): number {
    return this.bucket.getWaitTime(1);
  }
  
  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.bucket.reset();
  }
}

/**
 * Create a simple rate limiter function
 * @param callsPerSecond - Maximum calls per second
 * @returns A function that enforces the rate limit
 */
export function createRateLimiter(
  callsPerSecond: number
): <T>(fn: () => T | Promise<T>) => Promise<T> {
  const limiter = new RateLimiter(callsPerSecond);
  return (fn) => limiter.execute(fn);
}

/**
 * Sliding window rate limiter for more precise control
 */
export class SlidingWindowRateLimiter {
  private readonly windowMs: number;
  private readonly maxCalls: number;
  private readonly calls: number[] = [];
  
  /**
   * Creates a sliding window rate limiter
   * @param maxCalls - Maximum calls allowed in the window
   * @param windowMs - Time window in milliseconds
   */
  constructor(maxCalls: number, windowMs: number) {
    if (maxCalls <= 0) {
      throw new Error('maxCalls must be positive');
    }
    if (windowMs <= 0) {
      throw new Error('windowMs must be positive');
    }
    
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
  }
  
  /**
   * Check if a call is allowed
   * @returns True if the call is allowed
   */
  tryCall(): boolean {
    const now = Date.now();
    this.cleanup(now);
    
    if (this.calls.length >= this.maxCalls) {
      return false;
    }
    
    this.calls.push(now);
    return true;
  }
  
  /**
   * Wait until a call is allowed
   * @param signal - Abort signal
   * @returns Promise that resolves when call is allowed
   */
  async waitForCall(signal?: AbortSignal): Promise<void> {
    while (true) {
      checkAborted(signal);
      
      const now = Date.now();
      this.cleanup(now);
      
      if (this.calls.length < this.maxCalls) {
        this.calls.push(now);
        return;
      }
      
      // Wait until the oldest call expires
      const oldestCall = this.calls[0];
      const waitMs = oldestCall + this.windowMs - now;
      
      if (waitMs > 0) {
        const timer = createManagedTimer(Math.min(waitMs + 1, 100), { signal });
        await timer.promise;
      }
    }
  }
  
  /**
   * Get the number of calls in the current window
   */
  getCurrentCalls(): number {
    this.cleanup(Date.now());
    return this.calls.length;
  }
  
  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.calls.length = 0;
  }
  
  /**
   * Remove calls outside the current window
   */
  private cleanup(now: number): void {
    const cutoff = now - this.windowMs;
    let i = 0;
    while (i < this.calls.length && this.calls[i] < cutoff) {
      i++;
    }
    if (i > 0) {
      this.calls.splice(0, i);
    }
  }
}