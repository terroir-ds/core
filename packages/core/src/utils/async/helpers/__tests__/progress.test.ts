/**
 * @module test/lib/utils/async/helpers/progress
 * 
 * Unit tests for progress tracking utilities
 * 
 * Tests progress tracking including:
 * - ProgressTracker class with rate calculation
 * - createSimpleProgressTracker for basic tracking
 * - createProgressBar for visual progress display
 * - Completion percentage calculation
 * - Rate and time estimation based on recent completions
 * - Callback throttling for performance
 * - Handling edge cases (zero total, overflow)
 * - Progress reset functionality
 * - Custom progress bar characters and width
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ProgressTracker,
  createSimpleProgressTracker,
  createProgressBar,
} from '../progress';

describe('progress helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ProgressTracker', () => {
    it('should track basic progress', () => {
      const callback = vi.fn();
      const tracker = new ProgressTracker(10, callback);
      
      expect(tracker.getProgress()).toEqual({
        completed: 0,
        total: 10,
        percentage: 0,
        rate: 0
      });
      
      tracker.increment();
      expect(tracker.getProgress().completed).toBe(1);
      expect(tracker.getProgress().percentage).toBe(10);
      
      tracker.increment(3);
      expect(tracker.getProgress().completed).toBe(4);
      expect(tracker.getProgress().percentage).toBe(40);
      
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should handle initial completed count', () => {
      const callback = vi.fn();
      const tracker = new ProgressTracker(10, callback, { initialCompleted: 5 });
      
      expect(tracker.getProgress().completed).toBe(5);
      expect(tracker.getProgress().percentage).toBe(50);
      expect(callback).toHaveBeenCalledOnce();
    });

    it('should not exceed total', () => {
      const tracker = new ProgressTracker(5);
      
      tracker.increment(10);
      expect(tracker.getProgress().completed).toBe(5);
      expect(tracker.getProgress().percentage).toBe(100);
    });

    it('should handle setCompleted', () => {
      const tracker = new ProgressTracker(10);
      
      tracker.setCompleted(5);
      expect(tracker.getProgress().completed).toBe(5);
      
      tracker.setCompleted(-1);
      expect(tracker.getProgress().completed).toBe(0);
      
      tracker.setCompleted(15);
      expect(tracker.getProgress().completed).toBe(10);
    });

    it('should calculate rate and estimated time', () => {
      const tracker = new ProgressTracker(100);
      
      // Complete 10 items over 1 second
      for (let i = 0; i < 10; i++) {
        tracker.increment();
        vi.advanceTimersByTime(100);
      }
      
      const progress = tracker.getProgress();
      expect(progress.rate).toBeCloseTo(11.11, 1); // ~11.11 items/second (10 items / 0.9 seconds)
      expect(progress.estimatedTimeRemaining).toBeCloseTo(8100, -2); // ~8.1 seconds (90 items / 11.11 items/sec)
    });

    it('should calculate rate based on recent completions', () => {
      const tracker = new ProgressTracker(100);
      
      // Complete 10 items quickly
      for (let i = 0; i < 10; i++) {
        tracker.increment();
        vi.advanceTimersByTime(100);
      }
      
      // Wait 5 seconds
      vi.advanceTimersByTime(5000);
      
      // Complete 5 more items quickly
      for (let i = 0; i < 5; i++) {
        tracker.increment();
        vi.advanceTimersByTime(100);
      }
      
      const progress = tracker.getProgress();
      // Rate should be based on recent completions, not overall
      expect(progress.rate).toBeGreaterThan(5); // Recent rate is higher
    });

    it('should throttle callbacks', () => {
      const callback = vi.fn();
      const tracker = new ProgressTracker(10, callback, { throttleMs: 100 });
      
      // Multiple increments within throttle period
      tracker.increment();
      tracker.increment();
      tracker.increment();
      
      expect(callback).toHaveBeenCalledOnce();
      
      // After throttle period
      vi.advanceTimersByTime(100);
      tracker.increment();
      
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should always report on completion regardless of throttle', () => {
      const callback = vi.fn();
      const tracker = new ProgressTracker(5, callback, { throttleMs: 1000 });
      
      tracker.increment(4);
      expect(callback).toHaveBeenCalledOnce();
      
      // Complete the tracker within throttle period
      tracker.increment();
      expect(callback).toHaveBeenCalledTimes(2); // Called despite throttle
    });

    it('should check completion status', () => {
      const tracker = new ProgressTracker(5);
      
      expect(tracker.isComplete()).toBe(false);
      
      tracker.increment(5);
      expect(tracker.isComplete()).toBe(true);
    });

    it('should reset tracker', () => {
      const callback = vi.fn();
      const tracker = new ProgressTracker(10, callback);
      
      tracker.increment(5);
      expect(tracker.getProgress().completed).toBe(5);
      
      tracker.reset();
      expect(tracker.getProgress().completed).toBe(0);
      expect(tracker.isComplete()).toBe(false);
      
      // Reset should trigger callback
      expect(callback).toHaveBeenLastCalledWith(
        expect.objectContaining({ completed: 0, total: 10 })
      );
    });

    it('should handle zero total', () => {
      const tracker = new ProgressTracker(0);
      
      expect(tracker.getProgress()).toEqual({
        completed: 0,
        total: 0,
        percentage: 0,
        rate: 0
      });
      
      tracker.increment();
      expect(tracker.getProgress().completed).toBe(0);
    });

    it('should work without timing', () => {
      const tracker = new ProgressTracker(10, undefined, { trackTiming: false });
      
      tracker.increment(5);
      const progress = tracker.getProgress();
      
      expect(progress.completed).toBe(5);
      expect(progress.rate).toBeUndefined();
      expect(progress.estimatedTimeRemaining).toBeUndefined();
    });
  });

  describe('createSimpleProgressTracker', () => {
    it('should create a simplified tracker', () => {
      const callback = vi.fn();
      const tracker = createSimpleProgressTracker(10, callback);
      
      tracker.increment();
      expect(callback).toHaveBeenCalledWith(1, 10);
      
      tracker.increment(3);
      expect(callback).toHaveBeenCalledWith(4, 10);
      
      expect(tracker.isComplete()).toBe(false);
      
      tracker.increment(6);
      expect(tracker.isComplete()).toBe(true);
    });

    it('should work without callback', () => {
      const tracker = createSimpleProgressTracker(5);
      
      tracker.increment(2);
      expect(tracker.getProgress().completed).toBe(2);
      
      tracker.increment(3);
      expect(tracker.isComplete()).toBe(true);
    });
  });

  describe('createProgressBar', () => {
    it('should create a progress bar', () => {
      expect(createProgressBar(0)).toBe('[░░░░░░░░░░░░░░░░░░░░] 0.0%');
      expect(createProgressBar(50)).toBe('[██████████░░░░░░░░░░] 50.0%');
      expect(createProgressBar(100)).toBe('[████████████████████] 100.0%');
    });

    it('should handle custom width', () => {
      expect(createProgressBar(50, 10)).toBe('[█████░░░░░] 50.0%');
      expect(createProgressBar(33.33, 6)).toBe('[██░░░░] 33.3%');
    });

    it('should handle custom characters', () => {
      const options = {
        complete: '=',
        incomplete: '-',
        head: '>'
      };
      
      expect(createProgressBar(0, 10, options)).toBe('[----------] 0.0%');
      expect(createProgressBar(50, 10, options)).toBe('[====>-----] 50.0%');
      expect(createProgressBar(100, 10, options)).toBe('[==========] 100.0%');
    });

    it('should handle edge cases', () => {
      expect(createProgressBar(-10)).toBe('[░░░░░░░░░░░░░░░░░░░░] 0.0%');
      expect(createProgressBar(150)).toBe('[████████████████████] 100.0%');
      
      // Very small progress
      expect(createProgressBar(1, 10)).toBe('[░░░░░░░░░░] 1.0%');
      
      // With head character
      expect(createProgressBar(10, 10, { head: '>' })).toBe('[>░░░░░░░░░] 10.0%');
      expect(createProgressBar(90, 10, { head: '>' })).toBe('[████████>░] 90.0%');
    });

    it('should handle precision correctly', () => {
      expect(createProgressBar(33.333)).toContain('33.3%');
      expect(createProgressBar(66.666)).toContain('66.7%');
      expect(createProgressBar(99.999)).toContain('100.0%');
    });
  });
});