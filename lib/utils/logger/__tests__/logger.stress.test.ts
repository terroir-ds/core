/**
 * Stress tests for logger utility
 * 
 * Tests cover:
 * - Extreme load conditions
 * - Error recovery
 * - Resource exhaustion scenarios
 * - Edge cases and boundary conditions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  logger,
  createLogger,
  measureTime,
  setRequestId,
  getRequestId,
  generateRequestId,
  clearRequestId
} from '../index.js';

describe('Logger Stress Tests', () => {
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    clearRequestId();
    // Suppress console errors during stress tests
    originalConsoleError = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    clearRequestId();
  });

  describe('Extreme Load Conditions', () => {
    it('should handle burst logging without crashing', async () => {
      const burstSize = 50000;
      const startTime = performance.now();
      let errorCount = 0;
      
      // Generate burst of logs
      const promises = Array.from({ length: burstSize }, (_, i) => 
        Promise.resolve().then(() => {
          try {
            logger.info({ 
              burstIndex: i,
              timestamp: Date.now(),
              data: Math.random()
            }, `Burst log ${i}`);
          } catch {
            errorCount++;
          }
        })
      );
      
      await Promise.all(promises);
      
      const duration = performance.now() - startTime;
      
      logger.info({
        testType: 'burst-logging',
        burstSize,
        duration: Math.round(duration),
        errorsEncountered: errorCount,
        logsPerSecond: Math.round(burstSize / (duration / 1000))
      }, 'Burst logging test completed');
      
      // Should handle burst without errors
      expect(errorCount).toBe(0);
      
      // Should complete in reasonable time (less than 10 seconds)
      expect(duration).toBeLessThan(10000);
    });

    it('should handle extremely large log messages', () => {
      const testCases = [
        { size: 1024, name: '1KB' },           // 1 KB
        { size: 10240, name: '10KB' },         // 10 KB (at limit)
        { size: 102400, name: '100KB' },       // 100 KB (over limit)
        { size: 1048576, name: '1MB' }         // 1 MB
      ];
      
      testCases.forEach(({ size, name }) => {
        const largeString = 'x'.repeat(size);
        const startTime = performance.now();
        
        // Should not throw
        expect(() => {
          logger.info({ 
            largeData: largeString,
            size: name 
          }, `Large message test: ${name}`);
        }).not.toThrow();
        
        const duration = performance.now() - startTime;
        
        // Should handle large messages quickly (less than 50ms)
        expect(duration).toBeLessThan(50);
      });
    });

    it('should handle rapid child logger creation', () => {
      const iterations = 10000;
      const startTime = performance.now();
      const loggers: Array<ReturnType<typeof createLogger>> = [];
      
      // Create many child loggers rapidly
      for (let i = 0; i < iterations; i++) {
        const childLogger = createLogger({
          childId: i,
          timestamp: Date.now(),
          metadata: {
            level: i % 5,
            category: `cat-${i % 10}`
          }
        });
        loggers.push(childLogger);
        
        // Use the logger
        if (i % 100 === 0) {
          childLogger.debug(`Child logger ${i} message`);
        }
      }
      
      const duration = performance.now() - startTime;
      
      logger.info({
        testType: 'rapid-child-creation',
        iterations,
        duration: Math.round(duration),
        loggersPerSecond: Math.round(iterations / (duration / 1000))
      }, 'Child logger creation test completed');
      
      // Should complete quickly (less than 2 seconds)
      expect(duration).toBeLessThan(2000);
      
      // All loggers should be functional
      expect(loggers.every(l => typeof l.info === 'function')).toBe(true);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from logging errors gracefully', async () => {
      let successCount = 0;
      let errorCount = 0;
      
      // Create logger that might fail
      const flakyLogger = createLogger({ component: 'flaky' });
      
      // Override info method to occasionally fail
      const originalInfo = flakyLogger.info.bind(flakyLogger);
      flakyLogger.info = vi.fn((obj: Record<string, unknown>, msg?: string) => {
        if (Math.random() < 0.1) { // 10% failure rate
          throw new Error('Simulated logging failure');
        }
        return originalInfo(obj, msg);
      }) as unknown as typeof flakyLogger.info;
      
      // Attempt many logs
      for (let i = 0; i < 1000; i++) {
        try {
          flakyLogger.info({ index: i }, 'Test message');
          successCount++;
        } catch {
          errorCount++;
        }
      }
      
      // Should handle failures gracefully
      expect(successCount).toBeGreaterThan(800); // ~90% success
      expect(errorCount).toBeGreaterThan(50);    // Some failures
      expect(successCount + errorCount).toBe(1000);
    });

    it('should handle circular references without crashing', () => {
      interface CircularObj {
        id: number;
        name: string;
        self?: CircularObj;
        parent?: CircularObj;
        children?: CircularObj[];
      }
      
      // Create circular reference
      const obj1: CircularObj = { id: 1, name: 'Object 1' };
      const obj2: CircularObj = { id: 2, name: 'Object 2' };
      const obj3: CircularObj = { id: 3, name: 'Object 3' };
      
      obj1.self = obj1;
      obj1.children = [obj2, obj3];
      obj2.parent = obj1;
      obj2.self = obj2;
      obj3.parent = obj1;
      obj3.children = [obj1]; // Circular!
      
      // Should handle circular references
      expect(() => {
        logger.info({ circular: obj1 }, 'Circular reference test');
      }).not.toThrow();
      
      // Test with deeply circular structure
      interface CircularNode {
        level: number;
        child?: CircularNode;
        parent?: CircularNode;
        self?: CircularNode;
      }
      
      const createDeepCircular = (depth: number): CircularNode => {
        const obj: CircularNode = { level: depth };
        if (depth > 0) {
          obj.child = createDeepCircular(depth - 1);
          obj.child.parent = obj; // Circular reference
        }
        obj.self = obj; // Self reference
        return obj;
      };
      
      const deepCircular = createDeepCircular(10);
      
      expect(() => {
        logger.debug({ deepCircular }, 'Deep circular reference test');
      }).not.toThrow();
    });
  });

  describe('Resource Exhaustion', () => {
    it('should handle request ID exhaustion', async () => {
      const iterations = 100000;
      const requestIds = new Set<string>();
      
      // Generate many request IDs rapidly
      for (let i = 0; i < iterations; i++) {
        const id = generateRequestId();
        requestIds.add(id);
      }
      
      // All IDs should be unique
      expect(requestIds.size).toBe(iterations);
      
      // Should maintain performance
      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        generateRequestId();
      }
      const duration = performance.now() - startTime;
      
      expect(duration).toBeLessThan(100); // Less than 100ms for 1000 IDs
    });

    it('should handle concurrent request ID operations', async () => {
      const concurrency = 1000;
      const results: string[] = [];
      
      // Simulate concurrent requests setting/getting IDs
      await Promise.all(
        Array.from({ length: concurrency }, async (_, i) => {
          const requestId = `concurrent-${i}-${generateRequestId()}`;
          
          // Random operations
          const operations = Array.from({ length: 10 }, () => 
            Math.random() < 0.5 ? 'set' : 'get'
          );
          
          for (const op of operations) {
            if (op === 'set') {
              setRequestId(requestId);
            } else {
              const id = getRequestId();
              if (id) results.push(id);
            }
            
            // Small delay to increase contention
            await new Promise(resolve => setImmediate(resolve));
          }
        })
      );
      
      // Should have collected some IDs without errors
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(id => typeof id === 'string')).toBe(true);
    });
  });

  describe('Edge Cases and Boundaries', () => {
    it('should handle various data types and edge cases', () => {
      const edgeCases = [
        { name: 'undefined', value: undefined },
        { name: 'null', value: null },
        { name: 'empty string', value: '' },
        { name: 'zero', value: 0 },
        { name: 'negative', value: -1 },
        { name: 'infinity', value: Infinity },
        { name: 'NaN', value: NaN },
        { name: 'bigint', value: BigInt(9007199254740991) },
        { name: 'symbol', value: Symbol('test') },
        { name: 'function', value: () => 'test' },
        { name: 'date', value: new Date() },
        { name: 'regex', value: /test/gi },
        { name: 'error', value: new Error('test error') },
        { name: 'array', value: [1, 2, 3] },
        { name: 'nested nulls', value: { a: null, b: { c: null } } },
        { name: 'special chars', value: 'test\n\r\t\0\x08\x1b' },
        { name: 'unicode', value: '🚀🔥✨ Test émojis café' },
        { name: 'very long array', value: new Array(1000).fill('x') }
      ];
      
      edgeCases.forEach(({ name, value }) => {
        expect(() => {
          logger.info({ testCase: name, data: value }, `Edge case: ${name}`);
        }).not.toThrow();
      });
    });

    it('should handle maximum depth objects', () => {
      // Create object at maximum depth (5 levels)
      const maxDepthObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  data: 'at max depth',
                  password: 'should-be-redacted',
                  metadata: { id: 123 }
                }
              }
            }
          }
        }
      };
      
      expect(() => {
        logger.info(maxDepthObject, 'Max depth object test');
      }).not.toThrow();
      
      // Create object beyond maximum depth
      const beyondMaxDepth = {
        l1: { l2: { l3: { l4: { l5: { l6: { l7: { 
          data: 'beyond max depth' 
        } } } } } } }
      };
      
      expect(() => {
        logger.debug(beyondMaxDepth, 'Beyond max depth test');
      }).not.toThrow();
    });

    it('should handle rapid configuration changes', async () => {
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        // Alternate between different configurations
        const requestId = generateRequestId();
        setRequestId(requestId);
        
        const contextLogger = createLogger({ 
          iteration: i,
          config: i % 2 === 0 ? 'even' : 'odd'
        });
        
        contextLogger.info({ index: i }, 'Config change test');
        
        clearRequestId();
      }
      
      // Should handle rapid changes without issues
      expect(getRequestId()).toBeUndefined();
    });
  });

  describe('Performance Under Stress', () => {
    it('should maintain performance under sustained load', { timeout: 10000 }, async () => {
      const duration = 5000; // 5 seconds
      const startTime = performance.now();
      let logCount = 0;
      let errorCount = 0;
      
      // Log continuously for duration
      while (performance.now() - startTime < duration) {
        try {
          logger.debug({ 
            count: logCount,
            elapsed: performance.now() - startTime
          }, 'Sustained load test');
          logCount++;
          
          // Occasionally create child loggers
          if (logCount % 100 === 0) {
            const child = createLogger({ batch: Math.floor(logCount / 100) });
            child.info('Child logger under load');
          }
          
          // Add some variety
          if (logCount % 500 === 0) {
            await measureTime('stress-operation', async () => {
              await new Promise(resolve => setImmediate(resolve));
            });
          }
        } catch {
          errorCount++;
        }
      }
      
      const actualDuration = performance.now() - startTime;
      const logsPerSecond = logCount / (actualDuration / 1000);
      
      logger.info({
        testType: 'sustained-load',
        duration: Math.round(actualDuration),
        totalLogs: logCount,
        errors: errorCount,
        logsPerSecond: Math.round(logsPerSecond)
      }, 'Sustained load test completed');
      
      // Should maintain good performance
      expect(logsPerSecond).toBeGreaterThan(5000);
      expect(errorCount).toBe(0);
    });
  });
});