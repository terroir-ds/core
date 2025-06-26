/**
 * @fileoverview Concurrent queue implementation for async operations
 * @module @utils/async/helpers/queue
 */

import { checkAborted } from './abort';
import { createCleanupManager } from './cleanup';
import { ProgressTracker } from './progress';
import { AsyncErrorMessages } from './messages';

/**
 * Result of processing a queue item
 */
export interface QueueResult<T, R> {
  /**
   * The original item
   */
  item: T;
  
  /**
   * The result if successful
   */
  result?: R;
  
  /**
   * The error if failed
   */
  error?: Error;
  
  /**
   * Whether the processing succeeded
   */
  success: boolean;
  
  /**
   * Processing time in milliseconds
   */
  duration: number;
}

/**
 * Options for concurrent queue
 */
export interface QueueOptions {
  /**
   * Maximum concurrent workers (default: 5)
   */
  concurrency?: number;
  
  /**
   * Whether to stop on first error (default: false)
   */
  stopOnError?: boolean;
  
  /**
   * Progress callback
   */
  onProgress?: (completed: number, total: number) => void;
  
  /**
   * Abort signal
   */
  signal?: AbortSignal;
  
  /**
   * Whether to preserve order (default: false)
   */
  preserveOrder?: boolean;
}

/**
 * A concurrent queue for processing items in parallel
 */
export class ConcurrentQueue<T, R> {
  private readonly processor: (item: T) => Promise<R>;
  private readonly concurrency: number;
  private readonly stopOnError: boolean;
  private readonly preserveOrder: boolean;
  private queue: T[] = [];
  private running = 0;
  private results: Map<T, QueueResult<T, R>> = new Map();
  private progressTracker?: ProgressTracker;
  private aborted = false;
  private cleanup = createCleanupManager();
  
  /**
   * Creates a new concurrent queue
   * @param processor - Function to process each item
   * @param options - Queue options
   */
  constructor(
    processor: (item: T) => Promise<R>,
    options: QueueOptions = {}
  ) {
    const {
      concurrency = 5,
      stopOnError = false,
      onProgress,
      signal,
      preserveOrder = false
    } = options;
    
    if (concurrency <= 0) {
      throw new Error(AsyncErrorMessages.INVALID_CONCURRENCY);
    }
    
    this.processor = processor;
    this.concurrency = concurrency;
    this.stopOnError = stopOnError;
    this.preserveOrder = preserveOrder;
    
    if (onProgress) {
      this.progressTracker = new ProgressTracker(0, ({ completed, total }) => {
        onProgress(completed, total);
      });
    }
    
    if (signal) {
      checkAborted(signal);
      const handleAbort = () => {
        this.aborted = true;
      };
      signal.addEventListener('abort', handleAbort);
      this.cleanup.add(() => signal.removeEventListener('abort', handleAbort));
    }
  }
  
  /**
   * Process a batch of items
   * @param items - Items to process
   * @returns Map of results
   */
  async process(items: T[]): Promise<Map<T, QueueResult<T, R>>> {
    if (items.length === 0) {
      return new Map();
    }
    
    this.queue = [...items];
    this.results.clear();
    this.running = 0;
    this.aborted = false;
    
    if (this.progressTracker) {
      this.progressTracker.reset();
      this.progressTracker = new ProgressTracker(
        items.length,
        this.progressTracker.callback
      );
    }
    
    try {
      // Start workers up to concurrency limit
      const workerCount = Math.min(this.concurrency, items.length);
      const workers = Array(workerCount)
        .fill(null)
        .map(() => this.worker());
      
      await Promise.all(workers);
      
      // If preserving order, sort results
      if (this.preserveOrder) {
        const sortedResults = new Map<T, QueueResult<T, R>>();
        for (const item of items) {
          const result = this.results.get(item);
          if (result) {
            sortedResults.set(item, result);
          }
        }
        return sortedResults;
      }
      
      return this.results;
    } finally {
      await this.cleanup.execute();
    }
  }
  
  /**
   * Worker function that processes items from the queue
   */
  private async worker(): Promise<void> {
    while (this.queue.length > 0 && !this.aborted) {
      const item = this.queue.shift();
      if (item === undefined) break;
      
      this.running++;
      const startTime = Date.now();
      
      try {
        if (this.aborted) {
          throw new Error(AsyncErrorMessages.ABORTED);
        }
        
        const result = await this.processor(item);
        
        this.results.set(item, {
          item,
          result,
          success: true,
          duration: Date.now() - startTime
        });
        
        this.progressTracker?.increment();
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        
        this.results.set(item, {
          item,
          error: errorObj,
          success: false,
          duration: Date.now() - startTime
        });
        
        this.progressTracker?.increment();
        
        if (this.stopOnError) {
          this.aborted = true;
          this.queue.length = 0; // Clear remaining items
        }
      } finally {
        this.running--;
      }
    }
  }
  
  /**
   * Get current queue status
   */
  getStatus(): {
    pending: number;
    running: number;
    completed: number;
    failed: number;
  } {
    const completed = Array.from(this.results.values());
    const succeeded = completed.filter(r => r.success).length;
    const failed = completed.filter(r => !r.success).length;
    
    return {
      pending: this.queue.length,
      running: this.running,
      completed: succeeded,
      failed
    };
  }
}

/**
 * Process items in batches with a simple API
 * @param items - Items to process
 * @param processor - Function to process each item
 * @param options - Processing options
 * @returns Array of results
 */
export async function processQueue<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options?: QueueOptions
): Promise<QueueResult<T, R>[]> {
  const queue = new ConcurrentQueue(processor, options);
  const results = await queue.process(items);
  return Array.from(results.values());
}

/**
 * A priority queue for processing items based on priority
 */
export class PriorityQueue<T, R> {
  private readonly processor: (item: T) => Promise<R>;
  private readonly getPriority: (item: T) => number;
  private readonly concurrency: number;
  private items: Array<{ item: T; priority: number }> = [];
  private running = 0;
  private results: Map<T, QueueResult<T, R>> = new Map();
  private resolvers: Array<() => void> = [];
  
  /**
   * Creates a priority queue
   * @param processor - Function to process each item
   * @param getPriority - Function to get item priority (higher = more important)
   * @param concurrency - Maximum concurrent workers
   */
  constructor(
    processor: (item: T) => Promise<R>,
    getPriority: (item: T) => number,
    concurrency: number = 5
  ) {
    if (concurrency <= 0) {
      throw new Error(AsyncErrorMessages.INVALID_CONCURRENCY);
    }
    
    this.processor = processor;
    this.getPriority = getPriority;
    this.concurrency = concurrency;
  }
  
  /**
   * Add an item to the queue
   * @param item - Item to add
   */
  add(item: T): void {
    const priority = this.getPriority(item);
    
    // Insert in priority order (higher priority first)
    const index = this.items.findIndex(i => i.priority < priority);
    if (index === -1) {
      this.items.push({ item, priority });
    } else {
      this.items.splice(index, 0, { item, priority });
    }
    
    this.tryStartWorker();
  }
  
  /**
   * Add multiple items to the queue
   * @param items - Items to add
   */
  addAll(items: T[]): void {
    for (const item of items) {
      this.add(item);
    }
  }
  
  /**
   * Wait for all items to be processed
   * @returns Map of results
   */
  async waitForAll(): Promise<Map<T, QueueResult<T, R>>> {
    // Wait for queue to be empty and no workers running
    while (this.items.length > 0 || this.running > 0) {
      await new Promise<void>(resolve => {
        this.resolvers.push(resolve);
      });
    }
    
    return this.results;
  }
  
  /**
   * Clear the queue
   */
  clear(): void {
    this.items.length = 0;
    this.notifyResolvers();
  }
  
  /**
   * Get current queue size
   */
  size(): number {
    return this.items.length;
  }
  
  /**
   * Try to start a new worker if under concurrency limit
   */
  private tryStartWorker(): void {
    if (this.running < this.concurrency && this.items.length > 0) {
      this.worker();
    }
  }
  
  /**
   * Worker function
   */
  private async worker(): Promise<void> {
    this.running++;
    
    try {
      while (this.items.length > 0) {
        const entry = this.items.shift();
        if (!entry) break;
        
        const { item } = entry;
        const startTime = Date.now();
        
        try {
          const result = await this.processor(item);
          
          this.results.set(item, {
            item,
            result,
            success: true,
            duration: Date.now() - startTime
          });
        } catch (error) {
          const errorObj = error instanceof Error ? error : new Error(String(error));
          
          this.results.set(item, {
            item,
            error: errorObj,
            success: false,
            duration: Date.now() - startTime
          });
        }
      }
    } finally {
      this.running--;
      this.notifyResolvers();
      
      // Try to start another worker if there are items
      if (this.items.length > 0) {
        this.tryStartWorker();
      }
    }
  }
  
  /**
   * Notify waiting resolvers
   */
  private notifyResolvers(): void {
    if (this.items.length === 0 && this.running === 0) {
      const resolvers = this.resolvers.splice(0);
      resolvers.forEach(resolve => resolve());
    }
  }
}

/**
 * Create a simple work queue that processes items as they come
 * @param processor - Function to process items
 * @param concurrency - Maximum concurrent workers
 * @returns Queue control object
 */
export function createWorkQueue<T, R>(
  processor: (item: T) => Promise<R>,
  concurrency: number = 5
): {
  add: (item: T) => Promise<R>;
  addBatch: (items: T[]) => Promise<R[]>;
  size: () => number;
  pause: () => void;
  resume: () => void;
  clear: () => void;
} {
  interface QueueItem {
    item: T;
    resolve: (value: R) => void;
    reject: (error: unknown) => void;
  }
  
  const queue: QueueItem[] = [];
  let running = 0;
  let paused = false;
  
  const tryProcess = async () => {
    if (paused || running >= concurrency || queue.length === 0) {
      return;
    }
    
    const entry = queue.shift();
    if (!entry) return;
    
    running++;
    
    try {
      const result = await processor(entry.item);
      entry.resolve(result);
    } catch (error) {
      entry.reject(error);
    } finally {
      running--;
      tryProcess(); // Try to process next item
    }
  };
  
  return {
    add: (item: T): Promise<R> => {
      return new Promise((resolve, reject) => {
        queue.push({ item, resolve, reject });
        tryProcess();
      });
    },
    
    addBatch: (items: T[]): Promise<R[]> => {
      return Promise.all(items.map(item => 
        new Promise<R>((resolve, reject) => {
          queue.push({ item, resolve, reject });
          tryProcess();
        })
      ));
    },
    
    size: () => queue.length,
    
    pause: () => {
      paused = true;
    },
    
    resume: () => {
      paused = false;
      // Start processing again
      for (let i = 0; i < concurrency; i++) {
        tryProcess();
      }
    },
    
    clear: () => {
      const cleared = queue.splice(0);
      cleared.forEach(entry => 
        entry.reject(new Error('Queue cleared'))
      );
    }
  };
}