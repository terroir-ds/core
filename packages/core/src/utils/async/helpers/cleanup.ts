/**
 * @fileoverview Cleanup management utilities for async operations
 * @module @utils/async/helpers/cleanup
 */

import { logger } from '@utils/logger/index.js';

/**
 * Interface for managing cleanup operations
 */
export interface CleanupManager {
  /**
   * Add a cleanup function to be executed later
   * @param cleanup - The cleanup function to add
   */
  add(cleanup: () => void | Promise<void>): void;
  
  /**
   * Execute all cleanup functions and clear the list
   * @returns Promise that resolves when all cleanups are complete
   */
  execute(): Promise<void>;
  
  /**
   * Get the number of pending cleanup operations
   */
  readonly size: number;
}

/**
 * Creates a cleanup manager for handling multiple cleanup operations
 * @returns A new cleanup manager instance
 */
export function createCleanupManager(): CleanupManager {
  const cleanups = new Set<() => void | Promise<void>>();
  
  return {
    add(cleanup: () => void | Promise<void>): void {
      cleanups.add(cleanup);
    },
    
    async execute(): Promise<void> {
      // Create array to avoid modification during iteration
      const cleanupArray = Array.from(cleanups);
      cleanups.clear();
      
      // Execute all cleanups, handling both sync and async
      const results = await Promise.allSettled(
        cleanupArray.map(async (cleanup) => {
          await cleanup();
        })
      );
      
      // Log errors and count failures
      let errorCount = 0;
      for (const result of results) {
        if (result.status === 'rejected') {
          logger.error({ error: result.reason }, 'Cleanup error occurred');
          errorCount++;
        }
      }
      
      if (errorCount > 0) {
        logger.warn({ errorCount }, 'Multiple cleanup operations failed');
      }
    },
    
    get size(): number {
      return cleanups.size;
    }
  };
}

/**
 * Creates a cleanup manager that automatically executes on first error
 * @returns A cleanup manager with auto-execution on error
 */
export function createAutoCleanupManager(): CleanupManager & { wrap<T>(fn: () => T | Promise<T>): Promise<T> } {
  const manager = createCleanupManager();
  let hasExecuted = false;
  
  const executeOnce = async () => {
    if (!hasExecuted) {
      hasExecuted = true;
      await manager.execute();
    }
  };
  
  return {
    ...manager,
    
    async execute(): Promise<void> {
      if (!hasExecuted) {
        hasExecuted = true;
        await manager.execute();
      }
    },
    
    /**
     * Wrap a function to automatically execute cleanups on error
     * @param fn - The function to wrap
     * @returns The result of the function
     */
    async wrap<T>(fn: () => T | Promise<T>): Promise<T> {
      try {
        return await fn();
      } catch (error) {
        await executeOnce();
        throw error;
      }
    }
  };
}

/**
 * Combines multiple cleanup functions into one
 * @param cleanups - Array of cleanup functions
 * @returns A single cleanup function that executes all provided cleanups
 */
export function combineCleanups(...cleanups: Array<(() => void | Promise<void>) | undefined>): () => Promise<void> {
  const validCleanups = cleanups.filter((c): c is () => void | Promise<void> => c !== undefined);
  
  return async () => {
    await Promise.allSettled(
      validCleanups.map(async (cleanup) => {
        try {
          await cleanup();
        } catch (error) {
          logger.error({ error }, 'Cleanup error in combineCleanups');
        }
      })
    );
  };
}

/**
 * Creates a cleanup function for removing event listeners
 * @param target - The event target
 * @param event - The event name
 * @param handler - The event handler
 * @param options - Event listener options
 * @returns A cleanup function
 */
export function createEventCleanup(
  target: EventTarget,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
): () => void {
  target.addEventListener(event, handler, options);
  return () => target.removeEventListener(event, handler, options);
}

/**
 * Creates a cleanup function for clearing a timeout
 * @param timeoutId - The timeout ID to clear
 * @returns A cleanup function
 */
export function createTimeoutCleanup(timeoutId: NodeJS.Timeout): () => void {
  return () => clearTimeout(timeoutId);
}

/**
 * Creates a cleanup function for clearing an interval
 * @param intervalId - The interval ID to clear
 * @returns A cleanup function
 */
export function createIntervalCleanup(intervalId: NodeJS.Timeout): () => void {
  return () => clearInterval(intervalId);
}