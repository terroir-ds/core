/**
 * Tests for signal utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  combineSignals,
  timeoutSignal,
  eventSignal,
  isAbortError,
  waitForAbort,
  manualSignal
} from '../signals.js';
import { expectRejection } from '@test/helpers/error-handling.js';

describe('signal utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('combineSignals', () => {
    it('should return never-aborting signal for empty array', () => {
      const signal = combineSignals([]);
      expect(signal.aborted).toBe(false);
    });

    it('should filter out null and undefined signals', () => {
      const controller = new AbortController();
      const signal = combineSignals([null, controller.signal, undefined]);
      
      expect(signal.aborted).toBe(false);
      controller.abort();
      
      // The combined signal should abort when the valid signal aborts
      // This may not work synchronously in the fallback implementation
      if ('any' in AbortSignal) {
        expect(signal.aborted).toBe(true);
      }
    });

    it('should return single signal if only one provided', () => {
      const controller = new AbortController();
      const signal = combineSignals([controller.signal]);
      
      expect(signal).toBe(controller.signal);
    });

    it('should return already aborted signal if any input is aborted', () => {
      const controller1 = new AbortController();
      const controller2 = new AbortController();
      controller1.abort('reason 1');
      
      const signal = combineSignals([controller1.signal, controller2.signal]);
      expect(signal.aborted).toBe(true);
      expect(signal.reason).toBe('reason 1');
    });

    it('should abort when any input signal aborts', async () => {
      const controller1 = new AbortController();
      const controller2 = new AbortController();
      const controller3 = new AbortController();
      
      const signal = combineSignals([
        controller1.signal,
        controller2.signal,
        controller3.signal
      ]);
      
      const abortPromise = new Promise<void>((resolve) => {
        signal.addEventListener('abort', () => resolve(), { once: true });
      });
      
      expect(signal.aborted).toBe(false);
      
      controller2.abort('reason 2');
      
      await abortPromise;
      expect(signal.aborted).toBe(true);
      expect(signal.reason).toBe('reason 2');
    });

    it('should clean up listeners after abort', async () => {
      const controller1 = new AbortController();
      const controller2 = new AbortController();
      
      const removeEventListenerSpy1 = vi.spyOn(controller1.signal, 'removeEventListener');
      const removeEventListenerSpy2 = vi.spyOn(controller2.signal, 'removeEventListener');
      
      const signal = combineSignals([controller1.signal, controller2.signal]);
      
      // Only test cleanup in fallback implementation
      if (!('any' in AbortSignal)) {
        const abortPromise = new Promise<void>((resolve) => {
          signal.addEventListener('abort', () => resolve(), { once: true });
        });
        
        controller1.abort();
        await abortPromise;
        
        expect(removeEventListenerSpy1).toHaveBeenCalled();
        expect(removeEventListenerSpy2).toHaveBeenCalled();
      }
    });
  });

  describe('timeoutSignal', () => {
    it('should abort after specified timeout', async () => {
      const signal = timeoutSignal(100);
      const abortPromise = new Promise<void>((resolve) => {
        signal.addEventListener('abort', () => resolve(), { once: true });
      });
      
      expect(signal.aborted).toBe(false);
      
      vi.advanceTimersByTime(100);
      
      await abortPromise;
      expect(signal.aborted).toBe(true);
    });

    it('should use custom reason', async () => {
      const signal = timeoutSignal(100, 'Custom timeout');
      const abortPromise = new Promise<void>((resolve) => {
        signal.addEventListener('abort', () => resolve(), { once: true });
      });
      
      vi.advanceTimersByTime(100);
      
      await abortPromise;
      
      // Native implementation may not preserve custom reason
      if (!('timeout' in AbortSignal)) {
        expect(signal.reason).toBe('Custom timeout');
      }
    });
  });

  describe('eventSignal', () => {
    it('should abort when event occurs', async () => {
      const target = new EventTarget();
      const signal = eventSignal(target, ['custom']);
      
      const abortPromise = new Promise<void>((resolve) => {
        signal.addEventListener('abort', () => resolve(), { once: true });
      });
      
      expect(signal.aborted).toBe(false);
      
      target.dispatchEvent(new Event('custom'));
      
      await abortPromise;
      expect(signal.aborted).toBe(true);
      expect(signal.reason).toBe('Event: custom');
    });

    it('should handle multiple events', async () => {
      const target = new EventTarget();
      const signal = eventSignal(target, ['event1', 'event2', 'event3']);
      
      const abortPromise = new Promise<void>((resolve) => {
        signal.addEventListener('abort', () => resolve(), { once: true });
      });
      
      target.dispatchEvent(new Event('event2'));
      
      await abortPromise;
      expect(signal.reason).toBe('Event: event2');
    });

    it('should cleanup listeners after abort', async () => {
      const target = new EventTarget();
      const removeEventListenerSpy = vi.spyOn(target, 'removeEventListener');
      
      const signal = eventSignal(target, ['event1', 'event2']);
      
      const abortPromise = new Promise<void>((resolve) => {
        signal.addEventListener('abort', () => resolve(), { once: true });
      });
      
      target.dispatchEvent(new Event('event1'));
      
      await abortPromise;
      
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('isAbortError', () => {
    it('should identify DOMException abort errors', () => {
      const error = new DOMException('Aborted', 'AbortError');
      expect(isAbortError(error)).toBe(true);
    });

    it('should identify Node.js abort errors', () => {
      const error = { code: 'ABORT_ERR' };
      expect(isAbortError(error)).toBe(true);
    });

    it('should identify custom abort errors', () => {
      const error = { name: 'AbortError' };
      expect(isAbortError(error)).toBe(true);
    });

    it('should return false for non-abort errors', () => {
      expect(isAbortError(new Error('Regular error'))).toBe(false);
      expect(isAbortError({ name: 'TypeError' })).toBe(false);
      expect(isAbortError('string error')).toBe(false);
      expect(isAbortError(null)).toBe(false);
      expect(isAbortError(undefined)).toBe(false);
      expect(isAbortError(123)).toBe(false);
    });
  });

  describe('waitForAbort', () => {
    it('should reject immediately if signal already aborted', async () => {
      const controller = new AbortController();
      controller.abort();
      
      await expectRejection(
        waitForAbort(controller.signal),
        'Already aborted'
      );
    });

    it('should reject when signal aborts', async () => {
      const controller = new AbortController();
      
      const waitPromise = waitForAbort(controller.signal);
      
      controller.abort();
      
      await expectRejection(waitPromise, 'Operation aborted');
    });

    it('should handle abort with reason', async () => {
      const controller = new AbortController();
      
      const waitPromise = waitForAbort(controller.signal);
      
      controller.abort('Custom reason');
      
      await expectRejection(waitPromise, 'Operation aborted');
    });
  });

  describe('manualSignal', () => {
    it('should create signal and abort function', () => {
      const { signal, abort } = manualSignal();
      
      expect(signal.aborted).toBe(false);
      expect(typeof abort).toBe('function');
    });

    it('should abort signal when abort is called', async () => {
      const { signal, abort } = manualSignal();
      
      const abortPromise = new Promise<void>((resolve) => {
        signal.addEventListener('abort', () => resolve(), { once: true });
      });
      
      abort();
      
      await abortPromise;
      expect(signal.aborted).toBe(true);
    });

    it('should pass reason to abort', async () => {
      const { signal, abort } = manualSignal();
      
      const abortPromise = new Promise<void>((resolve) => {
        signal.addEventListener('abort', () => resolve(), { once: true });
      });
      
      abort('Custom abort reason');
      
      await abortPromise;
      expect(signal.reason).toBe('Custom abort reason');
    });
  });

  describe('integration', () => {
    it('should work with combined signals and timeout', async () => {
      const controller = new AbortController();
      const timeout = timeoutSignal(200);
      
      const combined = combineSignals([controller.signal, timeout]);
      
      const abortPromise = new Promise<void>((resolve) => {
        combined.addEventListener('abort', () => resolve(), { once: true });
      });
      
      expect(combined.aborted).toBe(false);
      
      // Abort manually before timeout
      controller.abort('Manual abort');
      
      await abortPromise;
      expect(combined.aborted).toBe(true);
      expect(combined.reason).toBe('Manual abort');
    });
  });
});