/**
 * Test helpers for event handling and EventTarget testing
 * Provides utilities for testing event-based APIs
 */

/// <reference lib="dom" />
import { vi, type MockInstance } from 'vitest';

/**
 * Create a mock EventTarget for testing
 * Provides full event handling capabilities with inspection
 */
export function createMockEventTarget(): EventTarget & {
  getListeners: (type: string) => EventListener[];
  dispatchAndWait: (event: Event) => Promise<void>;
  hasListener: (type: string, listener?: EventListener) => boolean;
} {
  const listeners = new Map<string, Set<EventListener>>();

  const target = {
    addEventListener(
      type: string,
      listener: EventListener | null,
      options?: boolean | AddEventListenerOptions
    ): void {
      if (!listener) return;
      
      if (!listeners.has(type)) {
        listeners.set(type, new Set());
      }
      
      const set = listeners.get(type);
      if (!set) return;
      
      if (options && typeof options === 'object' && options.once) {
        const onceListener: EventListener = (event) => {
          listener(event);
          set.delete(onceListener);
        };
        if (set) {
          set.add(onceListener);
        }
      } else {
        if (set) {
          set.add(listener);
        }
      }
    },

    removeEventListener(
      type: string,
      listener: EventListener | null,
      _options?: boolean | EventListenerOptions
    ): void {
      if (!listener) return;
      
      const set = listeners.get(type);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          listeners.delete(type);
        }
      }
    },

    dispatchEvent(event: Event): boolean {
      const set = listeners.get(event.type);
      if (!set) return true;

      // Make a copy to handle once listeners
      const listenersArray = Array.from(set);
      
      for (const listener of listenersArray) {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      }
      
      return !event.defaultPrevented;
    },

    getListeners(type: string): EventListener[] {
      const set = listeners.get(type);
      return set ? Array.from(set) : [];
    },

    async dispatchAndWait(event: Event): Promise<void> {
      this.dispatchEvent(event);
      // Wait for any async handlers
      await new Promise(resolve => setImmediate ? setImmediate(resolve) : setTimeout(resolve, 0));
    },

    hasListener(type: string, listener?: EventListener): boolean {
      const set = listeners.get(type);
      if (!set) return false;
      return listener ? set.has(listener) : set.size > 0;
    },
  };

  return target as EventTarget & typeof target;
}

/**
 * Spy on EventTarget methods
 * Returns spies for addEventListener and removeEventListener
 */
export function spyOnEventListeners(
  target: EventTarget
): {
  addSpy: MockInstance;
  removeSpy: MockInstance;
  getCallsForType: (type: string) => Array<{ method: 'add' | 'remove'; listener: EventListener }>;
  restore: () => void;
} {
  const calls: Array<{
    method: 'add' | 'remove';
    type: string;
    listener: EventListener;
  }> = [];

  const addSpy = vi.spyOn(target, 'addEventListener').mockImplementation(
    function (this: EventTarget, type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) {
      if (listener && typeof listener === 'function') {
        calls.push({ method: 'add', type, listener });
      }
      return EventTarget.prototype.addEventListener.call(this, type, listener, options);
    }
  );

  const removeSpy = vi.spyOn(target, 'removeEventListener').mockImplementation(
    function (this: EventTarget, type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions) {
      if (listener && typeof listener === 'function') {
        calls.push({ method: 'remove', type, listener });
      }
      return EventTarget.prototype.removeEventListener.call(this, type, listener, options);
    }
  );

  return {
    addSpy,
    removeSpy,
    getCallsForType: (type: string) => {
      return calls
        .filter(call => call.type === type)
        .map(({ method, listener }) => ({ method, listener }));
    },
    restore: () => {
      addSpy.mockRestore();
      removeSpy.mockRestore();
    },
  };
}

/**
 * Create a custom event with proper typing
 */
export function createCustomEvent<T>(
  type: string,
  detail: T,
  options?: EventInit
): CustomEvent<T> {
  return new CustomEvent(type, {
    ...options,
    detail,
  });
}

/**
 * Wait for an event to be dispatched
 * @param target - EventTarget to listen on
 * @param type - Event type to wait for
 * @param timeout - Maximum time to wait (ms)
 */
export async function waitForEvent(
  target: EventTarget,
  type: string,
  timeout: number = 1000
): Promise<Event> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      target.removeEventListener(type, handler);
      reject(new Error(`Timeout waiting for event: ${type}`));
    }, timeout);

    const handler = (event: Event) => {
      clearTimeout(timeoutId);
      resolve(event);
    };

    target.addEventListener(type, handler, { once: true });
  });
}

/**
 * Create an AbortController with event tracking
 */
export function createTrackedAbortController(): AbortController & {
  getListenerCount: () => number;
  getAbortCount: () => number;
} {
  const controller = new AbortController();
  let abortCount = 0;
  let listenerCount = 0;

  const originalAddEventListener = controller.signal.addEventListener;
  const originalRemoveEventListener = controller.signal.removeEventListener;
  const originalAbort = controller.abort;

  controller.signal.addEventListener = function(
    type: string, 
    listener: EventListenerOrEventListenerObject | null, 
    options?: boolean | AddEventListenerOptions
  ) {
    if (type === 'abort' && listener) {
      listenerCount++;
    }
    return originalAddEventListener.call(this, type, listener as EventListenerOrEventListenerObject, options);
  };

  controller.signal.removeEventListener = function(
    type: string, 
    listener: EventListenerOrEventListenerObject | null, 
    options?: boolean | EventListenerOptions
  ) {
    if (type === 'abort' && listener) {
      listenerCount = Math.max(0, listenerCount - 1);
    }
    return originalRemoveEventListener.call(this, type, listener as EventListenerOrEventListenerObject, options);
  };

  (controller as { abort: (reason?: unknown) => void }).abort = function(reason?: unknown) {
    abortCount++;
    return originalAbort.call(this, reason);
  };

  return Object.assign(controller, {
    getListenerCount: () => listenerCount,
    getAbortCount: () => abortCount,
  });
}

/**
 * Assert that event listeners are cleaned up properly
 * @param setup - Function that sets up event listeners
 * @param cleanup - Function that should clean them up
 */
export async function assertEventListenersCleanedUp(
  target: EventTarget,
  setup: () => void | Promise<void>,
  cleanup: () => void | Promise<void>
): Promise<void> {
  const { addSpy, removeSpy } = spyOnEventListeners(target);

  await setup();
  
  const addedListeners = new Map<string, Set<EventListener>>();
  
  // Track what was added
  addSpy.mock.calls.forEach(([type, listener]) => {
    if (!addedListeners.has(type)) {
      addedListeners.set(type, new Set());
    }
    const set = addedListeners.get(type);
    if (set && typeof listener === 'function') {
      set.add(listener);
    }
  });

  await cleanup();

  // Check what was removed
  removeSpy.mock.calls.forEach(([type, listener]) => {
    const set = addedListeners.get(type);
    if (set) {
      set.delete(listener);
      if (set.size === 0) {
        addedListeners.delete(type);
      }
    }
  });

  // Assert all listeners were removed
  const remainingTypes = Array.from(addedListeners.keys());
  if (remainingTypes.length > 0) {
    const uncleaned = remainingTypes.map(type => {
      const listeners = addedListeners.get(type);
      return `${type} (${listeners?.size ?? 0} listeners)`;
    }).join(', ');
    throw new Error(`Event listeners not cleaned up for types: ${uncleaned}`);
  }

  addSpy.mockRestore();
  removeSpy.mockRestore();
}