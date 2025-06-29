/**
 * @fileoverview Abort signal handling utilities
 * @module @utils/async/helpers/abort
 */

import { getMessage } from '@utils/errors/messages.js';

/**
 * Checks if an AbortSignal is aborted and throws if it is
 * @param signal - The abort signal to check
 * @throws {DOMException} If the signal is aborted
 */
export function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw createAbortError();
  }
}

/**
 * Creates a standardized abort error
 * @param message - Optional custom error message
 * @returns A DOMException with AbortError name
 */
export function createAbortError(message: string = getMessage('OPERATION_ABORTED')): DOMException {
  return new DOMException(message, 'AbortError');
}

/**
 * Type guard to check if an error is an abort error
 * @param error - The error to check
 * @returns True if the error is an abort error
 */
export function isAbortError(error: unknown): error is DOMException {
  return error instanceof DOMException && error.name === 'AbortError';
}

/**
 * Creates an abort controller that will abort after a timeout
 * @param ms - Milliseconds before aborting
 * @returns An AbortController that will abort after the timeout
 */
export function createTimeoutAbortController(ms: number): AbortController {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  
  // Clean up timeout if aborted early
  controller.signal.addEventListener('abort', () => clearTimeout(timeoutId), { once: true });
  
  return controller;
}

/**
 * Combines multiple abort signals into one
 * @param signals - Array of abort signals to combine
 * @returns A combined abort signal that aborts when any input signal aborts
 */
export function combineAbortSignals(signals: (AbortSignal | undefined)[]): AbortSignal | undefined {
  const validSignals = signals.filter((s): s is AbortSignal => s !== undefined);
  
  if (validSignals.length === 0) {
    return undefined;
  }
  
  if (validSignals.length === 1) {
    return validSignals[0];
  }
  
  // Check if any are already aborted
  const abortedSignal = validSignals.find(s => s.aborted);
  if (abortedSignal) {
    return abortedSignal;
  }
  
  // Use AbortSignal.any if available (Node.js 20+)
  if ('any' in AbortSignal && typeof AbortSignal.any === 'function') {
    return AbortSignal.any(validSignals);
  }
  
  // Fallback for older environments
  const controller = new AbortController();
  
  const cleanup = () => {
    validSignals.forEach(signal => {
      signal.removeEventListener('abort', handleAbort);
    });
  };
  
  const handleAbort = () => {
    controller.abort();
    cleanup();
  };
  
  validSignals.forEach(signal => {
    signal.addEventListener('abort', handleAbort);
  });
  
  return controller.signal;
}