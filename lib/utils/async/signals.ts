/**
 * AbortSignal utilities for async operations
 * Provides helpers for signal management and combination
 */

import { isAbortError as isAbortErrorBase } from '@utils/types/async.types.js';

/**
 * Combine multiple abort signals into one
 * Uses native AbortSignal.any when available (Node.js 20+)
 * Falls back to manual implementation for older versions
 */
export function combineSignals(
  signals: (AbortSignal | undefined | null)[]
): AbortSignal {
  // Filter out null/undefined signals
  const validSignals = signals.filter((s): s is AbortSignal => s != null);

  // If no valid signals, return a never-aborting signal
  if (validSignals.length === 0) {
    return new AbortController().signal;
  }

  // If only one signal, return it
  if (validSignals.length === 1) {
    const signal = validSignals[0];
    if (!signal) {
      throw new Error('Unexpected undefined signal after filtering');
    }
    return signal;
  }

  // Check if any signal is already aborted
  const aborted = validSignals.find(s => s.aborted);
  if (aborted) {
    const controller = new AbortController();
    controller.abort(aborted.reason);
    return controller.signal;
  }

  // Use native AbortSignal.any if available (Node.js 20+)
  if ('any' in AbortSignal && typeof AbortSignal.any === 'function') {
    return AbortSignal.any(validSignals);
  }

  // Fallback implementation for older Node.js versions
  const controller = new AbortController();
  const cleanup: (() => void)[] = [];

  const handleAbort = (reason?: unknown) => {
    // Cleanup all listeners
    cleanup.forEach(fn => fn());
    controller.abort(reason);
  };

  // Listen to all signals
  validSignals.forEach(signal => {
    const listener = () => handleAbort(signal.reason);
    signal.addEventListener('abort', listener, { once: true });
    cleanup.push(() => signal.removeEventListener('abort', listener));
  });

  return controller.signal;
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

  // Fallback implementation
  const controller = new AbortController();
  setTimeout(() => {
    controller.abort(reason ?? `Timed out after ${ms}ms`);
  }, ms);
  
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
  const cleanup: (() => void)[] = [];

  const handleEvent = (event: Event) => {
    cleanup.forEach(fn => fn());
    controller.abort(`Event: ${event.type}`);
  };

  events.forEach(eventName => {
    target.addEventListener(eventName, handleEvent, { once: true });
    cleanup.push(() => target.removeEventListener(eventName, handleEvent));
  });

  // Cleanup if signal is garbage collected
  if ('WeakRef' in globalThis) {
    const weakController = new WeakRef(controller);
    const interval = setInterval(() => {
      if (!weakController.deref()) {
        cleanup.forEach(fn => fn());
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
    return Promise.reject(new DOMException('Already aborted', 'AbortError'));
  }

  return new Promise((_, reject) => {
    const handleAbort = () => {
      reject(new DOMException('Operation aborted', 'AbortError'));
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