/**
 * @module test/lib/utils/async/helpers/abort
 * 
 * Unit tests for abort signal helper functions
 * 
 * Tests abort signal utilities including:
 * - checkAborted for verifying signal state
 * - createAbortError for creating consistent abort errors
 * - isAbortError for error type detection
 * - createTimeoutAbortController with auto-abort
 * - combineAbortSignals for merging multiple signals
 * - Native AbortSignal.any compatibility
 * - Timeout cleanup on early abort
 * - Edge cases (undefined signals, empty arrays)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkAborted,
  createAbortError,
  isAbortError,
  createTimeoutAbortController,
  combineAbortSignals,
} from '@utils/async/helpers/abort';

describe('abort helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkAborted', () => {
    it('should not throw if signal is not aborted', () => {
      const controller = new AbortController();
      expect(() => checkAborted(controller.signal)).not.toThrow();
    });

    it('should not throw if signal is undefined', () => {
      expect(() => checkAborted(undefined)).not.toThrow();
    });

    it('should throw if signal is aborted', () => {
      const controller = new AbortController();
      controller.abort();
      expect(() => checkAborted(controller.signal)).toThrow(DOMException);
      expect(() => checkAborted(controller.signal)).toThrow('Operation aborted');
    });
  });

  describe('createAbortError', () => {
    it('should create a DOMException with default message', () => {
      const error = createAbortError();
      expect(error).toBeInstanceOf(DOMException);
      expect(error.name).toBe('AbortError');
      expect(error.message).toBe('Operation aborted');
    });

    it('should create a DOMException with custom message', () => {
      const error = createAbortError('Custom abort message');
      expect(error).toBeInstanceOf(DOMException);
      expect(error.name).toBe('AbortError');
      expect(error.message).toBe('Custom abort message');
    });
  });

  describe('isAbortError', () => {
    it('should return true for abort errors', () => {
      const abortError = new DOMException('Aborted', 'AbortError');
      expect(isAbortError(abortError)).toBe(true);
    });

    it('should return false for other DOMExceptions', () => {
      const otherError = new DOMException('Network error', 'NetworkError');
      expect(isAbortError(otherError)).toBe(false);
    });

    it('should return false for regular errors', () => {
      const regularError = new Error('Regular error');
      expect(isAbortError(regularError)).toBe(false);
    });

    it('should return false for non-error values', () => {
      expect(isAbortError(null)).toBe(false);
      expect(isAbortError(undefined)).toBe(false);
      expect(isAbortError('string')).toBe(false);
      expect(isAbortError(123)).toBe(false);
    });
  });

  describe('createTimeoutAbortController', () => {
    it('should create an abort controller that aborts after timeout', () => {
      const controller = createTimeoutAbortController(1000);
      expect(controller.signal.aborted).toBe(false);
      
      vi.advanceTimersByTime(999);
      expect(controller.signal.aborted).toBe(false);
      
      vi.advanceTimersByTime(1);
      expect(controller.signal.aborted).toBe(true);
    });

    it('should clear timeout if aborted early', () => {
      const controller = createTimeoutAbortController(1000);
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
      
      controller.abort();
      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(controller.signal.aborted).toBe(true);
      
      // Advance time to verify timeout was cleared
      vi.advanceTimersByTime(1000);
      // No additional abort should occur
    });
  });

  describe('combineAbortSignals', () => {
    it('should return undefined for empty array', () => {
      expect(combineAbortSignals([])).toBeUndefined();
    });

    it('should return undefined for array of undefined', () => {
      expect(combineAbortSignals([undefined, undefined])).toBeUndefined();
    });

    it('should return single signal if only one provided', () => {
      const controller = new AbortController();
      const result = combineAbortSignals([controller.signal]);
      expect(result).toBe(controller.signal);
    });

    it('should return already aborted signal immediately', () => {
      const controller1 = new AbortController();
      const controller2 = new AbortController();
      controller2.abort();
      
      const result = combineAbortSignals([controller1.signal, controller2.signal]);
      expect(result).toBe(controller2.signal);
      expect(result?.aborted).toBe(true);
    });

    it('should combine multiple signals', () => {
      const controller1 = new AbortController();
      const controller2 = new AbortController();
      const controller3 = new AbortController();
      
      const combined = combineAbortSignals([
        controller1.signal,
        controller2.signal,
        controller3.signal,
      ]);
      
      expect(combined?.aborted).toBe(false);
      
      // Aborting any controller should abort the combined signal
      controller2.abort();
      
      // For the fallback implementation
      if (!('any' in AbortSignal)) {
        expect(combined?.aborted).toBe(true);
      }
    });

    it('should filter out undefined signals', () => {
      const controller = new AbortController();
      const result = combineAbortSignals([undefined, controller.signal, undefined]);
      expect(result).toBe(controller.signal);
    });

    it('should handle AbortSignal.any if available', () => {
      // Save original
      const originalAny = (AbortSignal as unknown as { any?: unknown }).any;
      
      try {
        // Mock AbortSignal.any
        const mockAny = vi.fn((_signals: AbortSignal[]) => {
          const controller = new AbortController();
          return controller.signal;
        });
        (AbortSignal as unknown as { any: unknown }).any = mockAny;
        
        const controller1 = new AbortController();
        const controller2 = new AbortController();
        
        combineAbortSignals([controller1.signal, controller2.signal]);
        
        expect(mockAny).toHaveBeenCalledWith([controller1.signal, controller2.signal]);
      } finally {
        // Restore original
        if (originalAny !== undefined) {
          (AbortSignal as unknown as { any: unknown }).any = originalAny;
        } else {
          delete (AbortSignal as unknown as { any?: unknown }).any;
        }
      }
    });
  });
});