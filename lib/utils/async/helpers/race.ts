/**
 * @fileoverview Promise racing utilities for async operations
 * @module @utils/async/helpers/race
 */

import { createCleanupManager } from './cleanup';
import { AsyncErrorMessages } from './messages';
import { logger } from '@utils/logger/index.js';
import { AsyncValidationError, AsyncTimeoutError } from '../errors.js';

/**
 * Result of a race operation
 */
export interface RaceResult<T> {
  /**
   * The value of the winning promise
   */
  value: T;
  
  /**
   * The index of the winning promise
   */
  index: number;
  
  /**
   * Time taken in milliseconds
   */
  elapsed: number;
}

/**
 * Creates a promise that rejects after a timeout
 * @param ms - Milliseconds before timing out
 * @param errorFactory - Function to create the error
 * @returns A promise that rejects with the error
 */
export function createTimeoutPromise<T = never>(
  ms: number,
  errorFactory?: (ms: number) => Error
): Promise<T> {
  return new Promise<T>((_, reject) => {
    setTimeout(() => {
      const error = errorFactory 
        ? errorFactory(ms) 
        : new AsyncTimeoutError(AsyncErrorMessages.TIMEOUT(ms), {
            context: { timeout: ms }
          });
      reject(error);
    }, ms);
  });
}

/**
 * Race promises with automatic cleanup
 * @param promises - Array of promises to race
 * @param cleanup - Optional cleanup function
 * @returns The result of the first promise to settle
 */
export async function raceWithCleanup<T>(
  promises: Promise<T>[],
  cleanup?: () => void | Promise<void>
): Promise<T> {
  try {
    return await Promise.race(promises);
  } finally {
    if (cleanup) {
      try {
        await cleanup();
      } catch (error) {
        logger.error({ error }, 'Cleanup error in race');
      }
    }
  }
}

/**
 * Race promises and return the winner with metadata
 * @param promises - Array of promises to race
 * @returns Result with value, index, and timing
 */
export async function raceWithIndex<T>(
  promises: Promise<T>[]
): Promise<RaceResult<T>> {
  if (promises.length === 0) {
    throw new AsyncValidationError(AsyncErrorMessages.NO_PROMISES);
  }
  
  const startTime = Date.now();
  
  // Create promises that include their index
  const indexedPromises = promises.map((promise, index) =>
    promise.then(value => ({ value, index }))
  );
  
  const result = await Promise.race(indexedPromises);
  
  return {
    ...result,
    elapsed: Date.now() - startTime
  };
}

/**
 * Race promises with individual timeouts
 * @param operations - Array of operations with their own timeouts
 * @returns The first successful result
 */
export async function raceWithTimeouts<T>(
  operations: Array<{
    promise: Promise<T>;
    timeout?: number;
    name?: string;
  }>
): Promise<T> {
  if (operations.length === 0) {
    throw new AsyncValidationError(AsyncErrorMessages.NO_PROMISES);
  }
  
  const cleanup = createCleanupManager();
  const controller = new AbortController();
  
  // Add global cleanup
  cleanup.add(() => controller.abort());
  
  try {
    const racers = operations.map(({ promise, timeout, name }) => {
      if (timeout === undefined) {
        return promise;
      }
      
      // Create a timeout promise for this operation
      const timeoutPromise = createTimeoutPromise<T>(
        timeout,
        (ms) => new Error(
          name 
            ? `Operation "${name}" timed out after ${ms}ms`
            : AsyncErrorMessages.TIMEOUT(ms)
        )
      );
      
      // Race the operation against its timeout
      return Promise.race([promise, timeoutPromise]);
    });
    
    return await Promise.race(racers);
  } finally {
    await cleanup.execute();
  }
}

/**
 * Race to find the first promise that passes a condition
 * @param promises - Array of promises
 * @param condition - Function to test each result
 * @param options - Race options
 * @returns The first result that passes the condition
 */
export async function raceUntil<T>(
  promises: Promise<T>[],
  condition: (value: T) => boolean,
  options?: {
    /**
     * Timeout in milliseconds
     */
    timeout?: number;
    
    /**
     * What to do with results that don't match
     */
    rejectNonMatching?: boolean;
  }
): Promise<T> {
  if (promises.length === 0) {
    throw new AsyncValidationError(AsyncErrorMessages.NO_PROMISES);
  }
  
  const { timeout, rejectNonMatching = false } = options || {};
  const results: Array<{ value: T; index: number }> = [];
  const errors: Array<{ error: unknown; index: number }> = [];
  let pendingCount = promises.length;
  
  return new Promise<T>((resolve, reject) => {
    let timeoutId: NodeJS.Timeout | undefined;
    
    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    
    const checkComplete = () => {
      pendingCount--;
      
      if (pendingCount === 0) {
        cleanup();
        
        // All promises settled, none matched
        if (results.length > 0) {
          reject(new Error(
            `No results matched the condition. Received ${results.length} results.`
          ));
        } else {
          reject(new Error(
            `All ${promises.length} promises failed.`
          ));
        }
      }
    };
    
    // Set up timeout if specified
    if (timeout) {
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(AsyncErrorMessages.TIMEOUT(timeout)));
      }, timeout);
    }
    
    // Process each promise
    promises.forEach((promise, index) => {
      promise
        .then(value => {
          if (condition(value)) {
            cleanup();
            resolve(value);
          } else {
            results.push({ value, index });
            
            if (rejectNonMatching) {
              cleanup();
              reject(new Error(
                `Promise at index ${index} did not match condition`
              ));
            } else {
              checkComplete();
            }
          }
        })
        .catch(error => {
          errors.push({ error, index });
          checkComplete();
        });
    });
  });
}

/**
 * Race promises but cancel losers
 * @param operations - Array of operations that can be cancelled
 * @returns The winning result
 */
export async function raceWithCancellation<T>(
  operations: Array<{
    start: (signal: AbortSignal) => Promise<T>;
    name?: string;
  }>
): Promise<T> {
  if (operations.length === 0) {
    throw new AsyncValidationError(AsyncErrorMessages.NO_PROMISES);
  }
  
  const controllers = operations.map(() => new AbortController());
  const cleanup = createCleanupManager();
  
  // Add cleanup to abort all operations
  cleanup.add(() => {
    controllers.forEach(c => c.abort());
  });
  
  try {
    const promises = operations.map((op, index) => 
      op.start(controllers[index].signal)
        .then(value => {
          // Cancel all other operations
          controllers.forEach((c, i) => {
            if (i !== index) c.abort();
          });
          return value;
        })
    );
    
    return await Promise.race(promises);
  } catch (error) {
    // Make sure all operations are cancelled on error
    await cleanup.execute();
    throw error;
  }
}

/**
 * Get the first N results from racing promises
 * @param promises - Array of promises
 * @param count - Number of results to get
 * @returns Array of the first N results in order of completion
 */
export async function raceFirstN<T>(
  promises: Promise<T>[],
  count: number
): Promise<T[]> {
  if (promises.length === 0) {
    throw new AsyncValidationError(AsyncErrorMessages.NO_PROMISES);
  }
  
  if (count <= 0) {
    throw new AsyncValidationError('Count must be positive', {
      context: { count }
    });
  }
  
  if (count >= promises.length) {
    // Just return all results
    return Promise.all(promises);
  }
  
  const results: T[] = [];
  const settled = new Set<number>();
  
  return new Promise<T[]>((resolve, reject) => {
    promises.forEach((promise, index) => {
      promise
        .then(value => {
          if (!settled.has(index)) {
            settled.add(index);
            results.push(value);
            
            if (results.length === count) {
              resolve(results);
            }
          }
        })
        .catch(_error => {
          if (!settled.has(index)) {
            settled.add(index);
            
            // If we can't possibly get enough results, reject
            const remaining = promises.length - settled.size;
            const needed = count - results.length;
            
            if (remaining < needed) {
              reject(new Error(
                `Cannot get ${count} results. Only ${results.length} succeeded.`
              ));
            }
          }
        });
    });
  });
}