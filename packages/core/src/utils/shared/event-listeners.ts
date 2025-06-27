/**
 * @module utils/shared/event-listeners
 * 
 * Shared utilities for managing Node.js event listeners.
 * Provides consistent patterns for avoiding MaxListenersExceededWarning.
 */

/**
 * Increases the max listeners for a target to prevent warnings.
 * Commonly needed in test environments or when creating many listeners.
 * 
 * @param target - EventEmitter target (usually process)
 * @param increment - Number to increase by (default: 50)
 * @returns Cleanup function to restore original value
 * 
 * @example
 * ```typescript
 * // In test setup
 * const cleanup = increaseMaxListeners(process, 100);
 * 
 * // In cleanup/afterAll
 * cleanup();
 * ```
 */
export function increaseMaxListeners(
  target: NodeJS.EventEmitter = process,
  increment: number = 50
): () => void {
  const original = target.getMaxListeners();
  target.setMaxListeners(original + increment);
  
  return () => {
    target.setMaxListeners(original);
  };
}

/**
 * Sets max listeners to a specific value with automatic restoration.
 * 
 * @param target - EventEmitter target
 * @param value - New max listeners value
 * @returns Cleanup function to restore original value
 * 
 * @example
 * ```typescript
 * const restore = withMaxListeners(process, 100);
 * // Do work that creates many listeners
 * restore();
 * ```
 */
export function withMaxListeners(
  target: NodeJS.EventEmitter = process,
  value: number
): () => void {
  const original = target.getMaxListeners();
  target.setMaxListeners(value);
  
  return () => {
    target.setMaxListeners(original);
  };
}

/**
 * Temporarily suppresses MaxListenersExceededWarning for a specific operation.
 * Useful for operations that legitimately create many listeners temporarily.
 * 
 * @param operation - Async operation to run
 * @param target - EventEmitter target
 * @returns Result of the operation
 * 
 * @example
 * ```typescript
 * const result = await suppressMaxListenersWarning(async () => {
 *   // Create many listeners temporarily
 *   return await complexOperation();
 * });
 * ```
 */
export async function suppressMaxListenersWarning<T>(
  operation: () => T | Promise<T>,
  target: NodeJS.EventEmitter = process
): Promise<T> {
  const restore = increaseMaxListeners(target, 100);
  
  try {
    return await operation();
  } finally {
    restore();
  }
}

/**
 * Checks if we're in a test environment where MaxListeners warnings
 * are expected and should be suppressed.
 * 
 * @returns True if in test environment
 */
export function isTestEnvironment(): boolean {
  return process.env['NODE_ENV'] === 'test' || 
         process.env['VITEST'] === 'true' ||
         process.env['JEST_WORKER_ID'] !== undefined;
}

/**
 * Apply test-friendly max listeners configuration.
 * Should be called early in test setup.
 * 
 * @param target - EventEmitter target
 * @returns Cleanup function
 * 
 * @example
 * ```typescript
 * // In test setup
 * const cleanup = configureTestMaxListeners();
 * 
 * // In afterAll
 * cleanup();
 * ```
 */
export function configureTestMaxListeners(
  target: NodeJS.EventEmitter = process
): () => void {
  if (!isTestEnvironment()) {
    return () => {}; // No-op in non-test environments
  }
  
  // Set a high limit for tests
  return withMaxListeners(target, 100);
}