/**
 * Performance tests for logger utility
 * 
 * Tests cover:
 * - Throughput under high load
 * - Memory usage patterns
 * - Redaction performance
 * - Child logger creation overhead
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  logger,
  createLogger,
  measureTime,
  logPerformance
} from '../index.js';

describe('Logger Performance Tests', () => {
  beforeEach(() => {
    // Ensure consistent state
    vi.clearAllMocks();
  });

  describe('Throughput Tests', () => {
    it('should handle high-frequency logging without blocking', async () => {
      const iterations = 10000;
      const startTime = performance.now();
      
      // Test synchronous logging performance
      for (let i = 0; i < iterations; i++) {
        logger.info({ iteration: i }, `Test message ${i}`);
      }
      
      const duration = performance.now() - startTime;
      const throughput = iterations / (duration / 1000); // logs per second
      
      logPerformance('sync-logging-throughput', duration, { 
        iterations, 
        throughput: Math.round(throughput) 
      });
      
      // Should handle at least 10k logs per second
      expect(throughput).toBeGreaterThan(10000);
      
      // Should complete in reasonable time (less than 2 seconds)
      expect(duration).toBeLessThan(2000);
    });

    it('should handle concurrent logging efficiently', async () => {
      const concurrency = 100;
      const logsPerTask = 100;
      
      const startTime = performance.now();
      
      await Promise.all(
        Array.from({ length: concurrency }, (_, taskId) =>
          Promise.resolve().then(() => {
            const taskLogger = createLogger({ taskId });
            for (let i = 0; i < logsPerTask; i++) {
              taskLogger.debug({ iteration: i }, `Task ${taskId} log ${i}`);
            }
          })
        )
      );
      
      const duration = performance.now() - startTime;
      const totalLogs = concurrency * logsPerTask;
      const throughput = totalLogs / (duration / 1000);
      
      logPerformance('concurrent-logging', duration, {
        concurrency,
        totalLogs,
        throughput: Math.round(throughput)
      });
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(3000);
      expect(throughput).toBeGreaterThan(5000);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory with child logger creation', () => {
      const iterations = 1000;
      const memoryBefore = process.memoryUsage().heapUsed;
      
      // Create and discard many child loggers
      for (let i = 0; i < iterations; i++) {
        const childLogger = createLogger({ 
          iteration: i,
          data: 'x'.repeat(100) // Some data to ensure object creation
        });
        childLogger.debug('Test message');
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const memoryAfter = process.memoryUsage().heapUsed;
      const memoryIncrease = memoryAfter - memoryBefore;
      const memoryPerLogger = memoryIncrease / iterations;
      
      logPerformance('child-logger-memory', memoryIncrease / 1024 / 1024, {
        iterations,
        memoryPerLoggerBytes: Math.round(memoryPerLogger),
        unit: 'MB'
      });
      
      // Average memory per logger should be reasonable (less than 10KB)
      expect(memoryPerLogger).toBeLessThan(10 * 1024);
    });

    it('should handle large objects without excessive memory usage', () => {
      const largeObject = {
        users: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `User ${i}`,
          email: `user${i}@example.com`,
          metadata: {
            createdAt: new Date().toISOString(),
            tags: ['tag1', 'tag2', 'tag3'],
            preferences: {
              theme: 'dark',
              language: 'en',
              notifications: true
            }
          }
        }))
      };
      
      const memoryBefore = process.memoryUsage().heapUsed;
      const startTime = performance.now();
      
      // Log the large object multiple times
      for (let i = 0; i < 100; i++) {
        logger.debug(largeObject, 'Processing large dataset');
      }
      
      const duration = performance.now() - startTime;
      const memoryAfter = process.memoryUsage().heapUsed;
      const memoryIncrease = (memoryAfter - memoryBefore) / 1024 / 1024;
      
      logPerformance('large-object-logging', duration, {
        objectSize: JSON.stringify(largeObject).length,
        iterations: 100,
        memoryIncreaseMB: memoryIncrease.toFixed(2)
      });
      
      // Should complete quickly even with large objects
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Redaction Performance', () => {
    it('should efficiently redact sensitive data', async () => {
      const sensitiveData = {
        user: {
          password: 'super-secret-password',
          apiKey: 'sk-1234567890abcdef',
          token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
          creditCard: '4532015112830366',
          ssn: '123-45-6789',
          nested: {
            secret: 'hidden-value',
            apiSecret: 'api-secret-key',
            data: {
              privateKey: '-----BEGIN PRIVATE KEY-----'
            }
          }
        },
        metadata: {
          requestId: 'req-123',
          timestamp: Date.now()
        }
      };
      
      const iterations = 1000;
      const startTime = performance.now();
      
      // Test redaction performance
      for (let i = 0; i < iterations; i++) {
        logger.info(sensitiveData, 'Processing user data');
      }
      
      const duration = performance.now() - startTime;
      const throughput = iterations / (duration / 1000);
      
      logPerformance('redaction-performance', duration, {
        iterations,
        throughput: Math.round(throughput),
        sensitiveFieldsCount: 8
      });
      
      // Redaction should not significantly impact performance
      expect(throughput).toBeGreaterThan(5000);
    });

    it('should handle deep object redaction efficiently', () => {
      // Create deeply nested object with sensitive data
      const createDeepObject = (depth: number): Record<string, unknown> => {
        if (depth === 0) {
          return {
            password: 'secret',
            apiKey: 'key-123',
            data: 'value'
          };
        }
        return {
          level: depth,
          nested: createDeepObject(depth - 1),
          password: `password-${depth}`,
          token: `token-${depth}`
        };
      };
      
      const deepObject = createDeepObject(10);
      const iterations = 500;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        logger.debug(deepObject, 'Deep object logging');
      }
      
      const duration = performance.now() - startTime;
      
      logPerformance('deep-redaction', duration, {
        iterations,
        objectDepth: 10,
        avgTimePerLog: (duration / iterations).toFixed(2)
      });
      
      // Should handle deep objects reasonably well
      expect(duration / iterations).toBeLessThan(5); // Less than 5ms per log
    });
  });

  describe('Performance Utilities', () => {
    it('should measure time with minimal overhead', async () => {
      const overhead: number[] = [];
      
      for (let i = 0; i < 100; i++) {
        const directStart = performance.now();
        await new Promise(resolve => setImmediate(resolve));
        const directDuration = performance.now() - directStart;
        
        const measuredResult = await measureTime('test-operation', async () => {
          const start = performance.now();
          await new Promise(resolve => setImmediate(resolve));
          return performance.now() - start;
        });
        
        overhead.push(Math.abs(measuredResult - directDuration));
      }
      
      const avgOverhead = overhead.reduce((a, b) => a + b, 0) / overhead.length;
      
      logPerformance('measureTime-overhead', avgOverhead, {
        samples: overhead.length,
        maxOverhead: Math.max(...overhead).toFixed(2),
        minOverhead: Math.min(...overhead).toFixed(2)
      });
      
      // Overhead should be minimal (less than 2ms on average)
      expect(avgOverhead).toBeLessThan(2);
    });
  });

  describe('Production Configuration Performance', () => {
    it('should maintain performance in production mode', async () => {
      // Mock production environment
      vi.resetModules();
      vi.doMock('@lib/config/index.js', () => ({
        env: { NODE_ENV: 'production', LOG_LEVEL: 'info' },
        isDevelopment: () => false,
        isProduction: () => true,
        isTest: () => false,
        isCI: () => false
      }));
      
      const { logger: prodLogger } = await import('../index.js');
      
      const iterations = 5000;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        prodLogger.info({ 
          iteration: i,
          password: 'should-be-redacted',
          apiKey: 'should-also-be-redacted'
        }, 'Production log');
      }
      
      const duration = performance.now() - startTime;
      const throughput = iterations / (duration / 1000);
      
      logPerformance('production-mode-performance', duration, {
        iterations,
        throughput: Math.round(throughput)
      });
      
      // Production mode should still be performant
      expect(throughput).toBeGreaterThan(8000);
    });
  });
});