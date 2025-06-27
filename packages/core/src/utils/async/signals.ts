/**
 * @module @utils/async/signals
 * 
 * AbortSignal utilities for async operation cancellation.
 * 
 * Provides comprehensive utilities for working with AbortSignal and AbortController,
 * including signal combination, timeout signals, event-based signals, and error
 * handling. Supports both modern (Node.js 18+) and legacy environments with
 * appropriate fallbacks.
 * 
 * @example Combining multiple signals
 * ```typescript
 * import { combineSignals } from '@utils/async/signals';
 * 
 * const timeoutController = new AbortController();
 * const userController = new AbortController();
 * 
 * const combined = combineSignals([
 *   timeoutController.signal,
 *   userController.signal
 * ]);
 * 
 * // Aborts when either signal aborts
 * fetch(url, { signal: combined });
 * ```
 * 
 * @example Creating timeout signals
 * ```typescript
 * import { timeoutSignal } from '@utils/async/signals';
 * 
 * const signal = timeoutSignal(5000, 'Operation timed out');
 * 
 * try {
 *   await fetch(url, { signal });
 * } catch (error) {
 *   if (isAbortError(error)) {
 *     console.log('Request was cancelled');
 *   }
 * }
 * ```
 * 
 * @example Event-based cancellation
 * ```typescript
 * import { eventSignal } from '@utils/async/signals';
 * 
 * // Cancel on window close
 * const signal = eventSignal(window, 'beforeunload');
 * 
 * // Cancel on custom event
 * const emitter = new EventEmitter();
 * const signal2 = eventSignal(emitter, 'cancel');
 * ```
 */

import { isAbortError as isAbortErrorBase } from '@utils/types/async.types.js';
import { combineAbortSignals, createTimeoutAbortController, createAbortError } from './helpers/abort.js';
import { createEventCleanup } from './helpers/cleanup.js';

/**
 * Combine multiple abort signals into one
 * Uses native AbortSignal.any when available (Node.js 20+)
 * Falls back to manual implementation for older versions
 */
export function combineSignals(
  signals: (AbortSignal | undefined | null)[]
): AbortSignal {
  // Filter out null values to match helper signature
  const filteredSignals = signals.filter((s): s is AbortSignal | undefined => s !== null);
  
  // Use the helper which handles all edge cases
  const combined = combineAbortSignals(filteredSignals);
  
  // If no valid signals, return a never-aborting signal
  if (!combined) {
    return new AbortController().signal;
  }
  
  return combined;
}

/**
 * Create a signal that aborts after timeout
 */
export function timeoutSignal(
  ms: number,
  reason?: string
): AbortSignal {
  // Use native AbortSignal.timeout if available (Node.js 18+)
  if ('timeout' in AbortSignal && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }

  // Use helper for fallback implementation
  const controller = createTimeoutAbortController(ms);
  
  // If custom reason provided, override the default abort
  if (reason) {
    const originalSignal = controller.signal;
    const customController = new AbortController();
    originalSignal.addEventListener('abort', () => {
      customController.abort(reason);
    }, { once: true });
    return customController.signal;
  }
  
  return controller.signal;
}

/**
 * Create a signal that aborts when any of the events occur
 */
export function eventSignal(
  target: EventTarget,
  events: string[]
): AbortSignal {
  const controller = new AbortController();
  const cleanups: (() => void)[] = [];

  const handleEvent = (event: Event) => {
    cleanups.forEach(fn => fn());
    controller.abort(`Event: ${event.type}`);
  };

  events.forEach(eventName => {
    const cleanup = createEventCleanup(target, eventName, handleEvent, { once: true });
    cleanups.push(cleanup);
  });

  // Cleanup if signal is garbage collected
  if ('WeakRef' in globalThis) {
    const weakController = new WeakRef(controller);
    const interval = setInterval(() => {
      if (!weakController.deref()) {
        cleanups.forEach(fn => fn());
        clearInterval(interval);
      }
    }, 60000); // Check every minute
  }

  return controller.signal;
}

/**
 * Check if an error was caused by signal abortion
 * Re-exports the shared implementation with backward compatibility
 */
export const isAbortError = isAbortErrorBase;

/**
 * Wait for a signal to abort
 */
export function waitForAbort(signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return Promise.reject(createAbortError('Already aborted'));
  }

  return new Promise((_, reject) => {
    const handleAbort = () => {
      reject(createAbortError());
    };
    signal.addEventListener('abort', handleAbort, { once: true });
  });
}

/**
 * Create a signal that can be manually aborted
 */
export function manualSignal(): {
  signal: AbortSignal;
  abort: (reason?: unknown) => void;
} {
  const controller = new AbortController();
  
  return {
    signal: controller.signal,
    abort: (reason?: unknown) => controller.abort(reason)
  };
}