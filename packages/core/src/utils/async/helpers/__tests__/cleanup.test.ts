/**
 * @module test/lib/utils/async/helpers/cleanup
 * 
 * Unit tests for cleanup management utilities
 * 
 * Tests cleanup functionality including:
 * - createCleanupManager for tracking cleanup operations
 * - createAutoCleanupManager with automatic error handling
 * - combineCleanups for merging multiple cleanup functions
 * - createEventCleanup for event listener cleanup
 * - createTimeoutCleanup for timeout cleanup
 * - createIntervalCleanup for interval cleanup
 * - Error handling and logging during cleanup
 * - Preventing duplicate cleanup execution
 * - Filtering undefined cleanup functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createCleanupManager,
  createAutoCleanupManager,
  combineCleanups,
  createEventCleanup,
  createTimeoutCleanup,
  createIntervalCleanup,
} from '../cleanup';

// Mock the logger module
vi.mock('@utils/logger/index.js', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }
}));

describe('cleanup helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createCleanupManager', () => {
    it('should create a cleanup manager', () => {
      const manager = createCleanupManager();
      expect(manager).toHaveProperty('add');
      expect(manager).toHaveProperty('execute');
      expect(manager).toHaveProperty('size');
    });

    it('should track cleanup functions', () => {
      const manager = createCleanupManager();
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();
      
      expect(manager.size).toBe(0);
      
      manager.add(cleanup1);
      expect(manager.size).toBe(1);
      
      manager.add(cleanup2);
      expect(manager.size).toBe(2);
    });

    it('should execute all cleanup functions', async () => {
      const manager = createCleanupManager();
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();
      const cleanup3 = vi.fn().mockResolvedValue(undefined);
      
      manager.add(cleanup1);
      manager.add(cleanup2);
      manager.add(cleanup3);
      
      await manager.execute();
      
      expect(cleanup1).toHaveBeenCalledOnce();
      expect(cleanup2).toHaveBeenCalledOnce();
      expect(cleanup3).toHaveBeenCalledOnce();
      expect(manager.size).toBe(0);
    });

    it('should handle cleanup errors gracefully', async () => {
      const manager = createCleanupManager();
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn().mockRejectedValue(new Error('Cleanup failed'));
      const cleanup3 = vi.fn();
      
      manager.add(cleanup1);
      manager.add(cleanup2);
      manager.add(cleanup3);
      
      await manager.execute();
      
      expect(cleanup1).toHaveBeenCalledOnce();
      expect(cleanup2).toHaveBeenCalledOnce();
      expect(cleanup3).toHaveBeenCalledOnce();
      const { logger } = await import('@utils/logger/index.js');
      expect(logger.error).toHaveBeenCalledWith({ error: expect.any(Error) }, 'Cleanup error occurred');
      expect(logger.warn).toHaveBeenCalledWith({ errorCount: 1 }, 'Multiple cleanup operations failed');
    });

    it('should clear cleanups after execution', async () => {
      const manager = createCleanupManager();
      const cleanup = vi.fn();
      
      manager.add(cleanup);
      expect(manager.size).toBe(1);
      
      await manager.execute();
      expect(manager.size).toBe(0);
      
      // Execute again should not call cleanup
      await manager.execute();
      expect(cleanup).toHaveBeenCalledTimes(1);
    });
  });

  describe('createAutoCleanupManager', () => {
    it('should create an auto cleanup manager', () => {
      const manager = createAutoCleanupManager();
      expect(manager).toHaveProperty('add');
      expect(manager).toHaveProperty('execute');
      expect(manager).toHaveProperty('size');
      expect(manager).toHaveProperty('wrap');
    });

    it('should execute cleanups on wrapped function error', async () => {
      const manager = createAutoCleanupManager();
      const cleanup = vi.fn();
      
      manager.add(cleanup);
      
      await expect(
        manager.wrap(async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
      
      expect(cleanup).toHaveBeenCalledOnce();
    });

    it('should not execute cleanups on wrapped function success', async () => {
      const manager = createAutoCleanupManager();
      const cleanup = vi.fn();
      
      manager.add(cleanup);
      
      const result = await manager.wrap(async () => 'success');
      
      expect(result).toBe('success');
      expect(cleanup).not.toHaveBeenCalled();
    });

    it('should only execute cleanups once', async () => {
      const manager = createAutoCleanupManager();
      const cleanup = vi.fn();
      
      manager.add(cleanup);
      
      await manager.execute();
      await manager.execute();
      
      expect(cleanup).toHaveBeenCalledTimes(1);
    });
  });

  describe('combineCleanups', () => {
    it('should combine multiple cleanup functions', async () => {
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();
      const cleanup3 = vi.fn().mockResolvedValue(undefined);
      
      const combined = combineCleanups(cleanup1, cleanup2, cleanup3);
      
      await combined();
      
      expect(cleanup1).toHaveBeenCalledOnce();
      expect(cleanup2).toHaveBeenCalledOnce();
      expect(cleanup3).toHaveBeenCalledOnce();
    });

    it('should filter out undefined cleanups', async () => {
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();
      
      const combined = combineCleanups(cleanup1, undefined, cleanup2, undefined);
      
      await combined();
      
      expect(cleanup1).toHaveBeenCalledOnce();
      expect(cleanup2).toHaveBeenCalledOnce();
    });

    it('should handle cleanup errors gracefully', async () => {
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn().mockRejectedValue(new Error('Failed'));
      const cleanup3 = vi.fn();
      
      const combined = combineCleanups(cleanup1, cleanup2, cleanup3);
      
      await combined();
      
      expect(cleanup1).toHaveBeenCalledOnce();
      expect(cleanup2).toHaveBeenCalledOnce();
      expect(cleanup3).toHaveBeenCalledOnce();
      const { logger } = await import('@utils/logger/index.js');
      expect(logger.error).toHaveBeenCalledWith({ error: expect.any(Error) }, 'Cleanup error in combineCleanups');
    });
  });

  describe('createEventCleanup', () => {
    it('should create cleanup for event listener', () => {
      const target = new EventTarget();
      const handler = vi.fn();
      const addSpy = vi.spyOn(target, 'addEventListener');
      const removeSpy = vi.spyOn(target, 'removeEventListener');
      
      const cleanup = createEventCleanup(target, 'test', handler);
      
      expect(addSpy).toHaveBeenCalledWith('test', handler, undefined);
      
      cleanup();
      
      expect(removeSpy).toHaveBeenCalledWith('test', handler, undefined);
    });

    it('should pass options to addEventListener and removeEventListener', () => {
      const target = new EventTarget();
      const handler = vi.fn();
      const options = { once: true, capture: true };
      const addSpy = vi.spyOn(target, 'addEventListener');
      const removeSpy = vi.spyOn(target, 'removeEventListener');
      
      const cleanup = createEventCleanup(target, 'test', handler, options);
      
      expect(addSpy).toHaveBeenCalledWith('test', handler, options);
      
      cleanup();
      
      expect(removeSpy).toHaveBeenCalledWith('test', handler, options);
    });
  });

  describe('createTimeoutCleanup', () => {
    it('should create cleanup for timeout', () => {
      const timeoutId = setTimeout(() => {}, 1000);
      const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
      
      const cleanup = createTimeoutCleanup(timeoutId);
      cleanup();
      
      expect(clearSpy).toHaveBeenCalledWith(timeoutId);
    });
  });

  describe('createIntervalCleanup', () => {
    it('should create cleanup for interval', () => {
      const intervalId = setInterval(() => {}, 1000);
      const clearSpy = vi.spyOn(globalThis, 'clearInterval');
      
      const cleanup = createIntervalCleanup(intervalId);
      cleanup();
      
      expect(clearSpy).toHaveBeenCalledWith(intervalId);
    });
  });
});