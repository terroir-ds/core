/**
 * @fileoverview Progress tracking utilities for async operations
 * @module @utils/async/helpers/progress
 */

/**
 * Progress information for an operation
 */
export interface ProgressInfo {
  /**
   * Number of completed items
   */
  completed: number;
  
  /**
   * Total number of items
   */
  total: number;
  
  /**
   * Percentage complete (0-100)
   */
  percentage: number;
  
  /**
   * Estimated time remaining in milliseconds
   */
  estimatedTimeRemaining?: number;
  
  /**
   * Items per second processing rate
   */
  rate?: number;
}

/**
 * Callback for progress updates
 */
export type ProgressCallback = (progress: ProgressInfo) => void;

/**
 * Options for creating a progress tracker
 */
export interface ProgressTrackerOptions {
  /**
   * Initial completed count
   */
  initialCompleted?: number;
  
  /**
   * Whether to track timing information
   */
  trackTiming?: boolean;
  
  /**
   * Minimum interval between callbacks in milliseconds
   */
  throttleMs?: number;
}

/**
 * A progress tracker for monitoring async operations
 */
export class ProgressTracker {
  private completed: number;
  private readonly total: number;
  private readonly callback?: ProgressCallback;
  private readonly startTime: number;
  private lastCallbackTime: number = 0;
  private readonly throttleMs: number;
  private readonly trackTiming: boolean;
  private readonly completionTimes: number[] = [];
  
  constructor(
    total: number,
    callback?: ProgressCallback,
    options: ProgressTrackerOptions = {}
  ) {
    const {
      initialCompleted = 0,
      trackTiming = true,
      throttleMs = 0
    } = options;
    
    this.total = total;
    this.completed = initialCompleted;
    this.callback = callback;
    this.startTime = Date.now();
    this.throttleMs = throttleMs;
    this.trackTiming = trackTiming;
    
    // Report initial progress if we have a callback
    if (this.callback && initialCompleted > 0) {
      this.reportProgress();
    }
  }
  
  /**
   * Increment the completed count
   * @param count - Number to increment by (default: 1)
   */
  increment(count: number = 1): void {
    this.completed = Math.min(this.completed + count, this.total);
    
    if (this.trackTiming) {
      for (let i = 0; i < count; i++) {
        this.completionTimes.push(Date.now());
      }
      
      // Keep only recent completion times for rate calculation
      const cutoffTime = Date.now() - 5000; // 5 seconds
      this.completionTimes.splice(
        0,
        this.completionTimes.findIndex(time => time > cutoffTime)
      );
    }
    
    this.reportProgress();
  }
  
  /**
   * Set the completed count directly
   * @param completed - The new completed count
   */
  setCompleted(completed: number): void {
    const oldCompleted = this.completed;
    this.completed = Math.min(Math.max(0, completed), this.total);
    
    if (this.trackTiming && this.completed > oldCompleted) {
      const count = this.completed - oldCompleted;
      for (let i = 0; i < count; i++) {
        this.completionTimes.push(Date.now());
      }
    }
    
    this.reportProgress();
  }
  
  /**
   * Get current progress information
   */
  getProgress(): ProgressInfo {
    const percentage = this.total > 0 ? (this.completed / this.total) * 100 : 0;
    const info: ProgressInfo = {
      completed: this.completed,
      total: this.total,
      percentage: Math.round(percentage * 100) / 100 // Round to 2 decimal places
    };
    
    if (this.trackTiming) {
      if (this.completed > 0) {
        const elapsedMs = Date.now() - this.startTime;
        
        // Calculate rate based on recent completions
        if (this.completionTimes.length >= 2) {
          const firstTime = this.completionTimes[0];
          const lastTime = this.completionTimes[this.completionTimes.length - 1];
          if (firstTime !== undefined && lastTime !== undefined) {
            const recentTimeSpan = lastTime - firstTime;
            const recentCount = this.completionTimes.length;
            info.rate = recentTimeSpan > 0 ? (recentCount / recentTimeSpan) * 1000 : 0;
          } else {
            info.rate = 0;
          }
        } else {
          // Fallback to overall rate
          info.rate = (this.completed / elapsedMs) * 1000;
        }
        
        // Estimate remaining time
        if (info.rate > 0 && this.completed < this.total) {
          const remaining = this.total - this.completed;
          info.estimatedTimeRemaining = remaining / info.rate * 1000;
        }
      } else {
        // No items completed yet
        info.rate = 0;
      }
    }
    
    return info;
  }
  
  /**
   * Check if the operation is complete
   */
  isComplete(): boolean {
    return this.completed >= this.total;
  }
  
  /**
   * Reset the tracker
   */
  reset(): void {
    this.completed = 0;
    this.completionTimes.length = 0;
    this.lastCallbackTime = 0;
    this.reportProgress();
  }
  
  /**
   * Report progress to callback with throttling
   */
  private reportProgress(): void {
    if (!this.callback) return;
    
    const now = Date.now();
    const timeSinceLastCallback = now - this.lastCallbackTime;
    
    // Always report on completion or if enough time has passed
    if (this.isComplete() || timeSinceLastCallback >= this.throttleMs) {
      this.lastCallbackTime = now;
      this.callback(this.getProgress());
    }
  }
}

/**
 * Creates a simple progress tracker without timing
 * @param total - Total number of items
 * @param callback - Progress callback
 * @returns A simplified progress tracker
 */
export function createSimpleProgressTracker(
  total: number,
  callback?: (completed: number, total: number) => void
): Pick<ProgressTracker, 'increment' | 'isComplete' | 'getProgress'> {
  const simpleCallback = callback
    ? (info: ProgressInfo) => callback(info.completed, info.total)
    : undefined;
  
  const tracker = new ProgressTracker(total, simpleCallback, {
    trackTiming: false
  });
  
  return {
    increment: tracker.increment.bind(tracker),
    isComplete: tracker.isComplete.bind(tracker),
    getProgress: tracker.getProgress.bind(tracker)
  };
}

/**
 * Creates a progress bar string
 * @param progress - Progress percentage (0-100)
 * @param width - Width of the progress bar
 * @param options - Display options
 * @returns A string representation of the progress bar
 */
export function createProgressBar(
  progress: number,
  width: number = 20,
  options: {
    complete?: string;
    incomplete?: string;
    head?: string;
  } = {}
): string {
  const {
    complete = '█',
    incomplete = '░',
    head = ''
  } = options;
  
  const percentage = Math.max(0, Math.min(100, progress));
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  
  let bar = '';
  if (head && filled > 0 && filled < width) {
    bar = complete.repeat(filled - 1) + head + incomplete.repeat(empty);
  } else {
    bar = complete.repeat(filled) + incomplete.repeat(empty);
  }
  
  return `[${bar}] ${percentage.toFixed(1)}%`;
}