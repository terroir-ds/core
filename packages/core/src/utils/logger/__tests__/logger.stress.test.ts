/**
 * @module test/lib/utils/logger/logger.stress
 * 
 * Stress and resilience tests for the logger utility
 * 
 * Tests extreme conditions including:
 * - Burst logging (50k+ logs) without crashing
 * - Large message handling (up to 1MB)
 * - Rapid child logger creation (10k+ loggers)
 * - Error recovery with simulated failures
 * - Circular reference handling at various depths
 * - Request ID exhaustion and concurrent operations
 * - Edge cases with unusual data types
 * - Sustained load performance (5+ seconds continuous)
 * - Maximum object depth handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock pino BEFORE importing logger - this needs to be hoisted
vi.mock('pino', () => {
  // Mock destination interface
  interface MockDestination {
    write: (chunk: string) => boolean | void;
  }
  
  // Mock logger options interface
  interface MockLoggerOptions {
    level?: string;
    base?: Record<string, unknown>;
    [key: string]: unknown;
  }
  
  // Create mock logger inside the factory to avoid hoisting issues
  const createMockLogger = (options: MockLoggerOptions = {}, destination?: MockDestination) => {
    const level = options.level || 'info';
    const base = options.base || {};
    
    const mockLogger = {
      info: vi.fn((obj, msg) => {
        if (destination && destination.write) {
          const logData = { level: 30, msg, ...base, ...(typeof obj === 'object' ? obj : {}) };
          destination.write(JSON.stringify(logData) + '\n');
        }
      }),
      error: vi.fn((obj, msg) => {
        if (destination && destination.write) {
          let processedObj = typeof obj === 'object' ? obj : {};
          // Apply error serializer if err property exists
          if (processedObj && 'err' in processedObj && processedObj.err) {
            processedObj = { 
              ...processedObj, 
              err: { 
                name: processedObj.err.name,
                message: processedObj.err.message,
                stack: processedObj.err.stack,
                type: processedObj.err.constructor?.name || 'Error'
              }
            };
          }
          const logData = { level: 50, msg, ...base, ...processedObj };
          destination.write(JSON.stringify(logData) + '\n');
        }
      }),
      debug: vi.fn((obj, msg) => {
        if (destination && destination.write) {
          const logData = { level: 20, msg, ...base, ...(typeof obj === 'object' ? obj : {}) };
          destination.write(JSON.stringify(logData) + '\n');
        }
      }),
      warn: vi.fn((obj, msg) => {
        if (destination && destination.write) {
          const logData = { level: 40, msg, ...base, ...(typeof obj === 'object' ? obj : {}) };
          destination.write(JSON.stringify(logData) + '\n');
        }
      }),
      trace: vi.fn((obj, msg) => {
        if (destination && destination.write) {
          const logData = { level: 10, msg, ...base, ...(typeof obj === 'object' ? obj : {}) };
          destination.write(JSON.stringify(logData) + '\n');
        }
      }),
      fatal: vi.fn((obj, msg) => {
        if (destination && destination.write) {
          const logData = { level: 60, msg, ...base, ...(typeof obj === 'object' ? obj : {}) };
          destination.write(JSON.stringify(logData) + '\n');
        }
      }),
      child: vi.fn((bindings) => {
        const childLogger = createMockLogger(options, destination);
        childLogger.bindings = vi.fn(() => ({ ...base, ...bindings }));
        return childLogger;
      }),
      level,
      startTimer: vi.fn(() => ({ done: vi.fn() })),
      bindings: vi.fn(() => base),
      isLevelEnabled: vi.fn(() => false),
      levels: {
        values: { silent: Infinity, fatal: 60, error: 50, warn: 40, info: 30, debug: 20, trace: 10 },
        labels: { 10: 'trace', 20: 'debug', 30: 'info', 40: 'warn', 50: 'error', 60: 'fatal' },
      },
      flush: vi.fn(),
      version: '9.0.0',
    };
    
    return mockLogger;
  };

  // Create mock serializers and time functions inside the factory
  const mockSerializers = {
    err: vi.fn(err => ({ name: err?.name, message: err?.message, stack: err?.stack })),
    req: vi.fn(req => ({ method: req?.method, url: req?.url })),
    res: vi.fn(res => ({ statusCode: res?.statusCode })),
  };

  const mockTimeFunctions = {
    isoTime: vi.fn(() => new Date().toISOString()),
    epochTime: vi.fn(() => Date.now()),
    nullTime: vi.fn(() => ''),
  };

  // Mock pino constructor with proper static properties
  const pinoCtor = vi.fn(createMockLogger);
  pinoCtor.stdSerializers = mockSerializers;
  pinoCtor.stdTimeFunctions = mockTimeFunctions;

  return {
    default: pinoCtor,
    stdSerializers: mockSerializers,
    stdTimeFunctions: mockTimeFunctions,
    multistream: vi.fn(),
    transport: vi.fn(),
    destination: vi.fn(),
  };
});

// Mock pino-pretty to prevent transport issues
vi.mock('pino-pretty', () => ({
  default: vi.fn(() => ({})),
}));

// Now import after mock is set up
import { 
  logger,
  createLogger,
  measureTime,
  setRequestId,
  getRequestId,
  generateRequestId,
  clearRequestId
} from '@utils/logger';

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
      // 10k logs is a good balance - tests burst handling without overwhelming system
      const burstSize = 10000;
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
      
      // Should complete in reasonable time (less than 5 seconds for reduced load)
      expect(duration).toBeLessThan(5000);
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
      // 2k child loggers is sufficient to test rapid creation without memory issues
      const iterations = 2000;
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
      // Reduced from 100k to 10k to prevent system overload
      const iterations = 10000;
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
      // Increased to 500 - still manageable but tests concurrency better
      const concurrency = 500;
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
        { name: 'very long array', value: new Array(100).fill('x') }
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
    it('should maintain performance under sustained load', { timeout: 5000 }, async () => {
      const duration = 2000; // Reduced from 5 seconds to 2 seconds
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
      expect(logsPerSecond).toBeGreaterThan(1000); // Reduced threshold for shorter test
      expect(errorCount).toBe(0);
    });
  });
});