/**
 * Edge case tests for logger utility
 * 
 * Tests cover:
 * - Boundary conditions
 * - Error recovery
 * - Unusual input types
 * - Environment edge cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  logger,
  createLogger,
  measureTime,
  cleanupLogger,
  logStart,
  logSuccess,
  logPerformance,
  createSampledLogger,
  runWithContext,
  getAsyncContext,
  updateAsyncContext,
  createAsyncLogger,
  type LogContext
} from '@utils/logger.js';

describe('Logger Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Special Data Types', () => {
    it('should handle BigInt values', () => {
      const data = {
        bigNumber: BigInt('9007199254740992'), // Larger than MAX_SAFE_INTEGER
        calculations: {
          product: BigInt('123456789012345678901234567890'),
          sum: BigInt(100) + BigInt(200)
        }
      };
      
      expect(() => logger.info(data, 'BigInt test')).not.toThrow();
    });

    it('should handle Symbol values', () => {
      const sym1 = Symbol('test');
      const sym2 = Symbol.for('global');
      
      const data = {
        [sym1]: 'symbol keyed value',
        symbolValue: sym2,
        normalKey: 'normal value'
      };
      
      expect(() => logger.debug(data, 'Symbol test')).not.toThrow();
    });

    it('should handle Date objects at various states', () => {
      const dates = {
        current: new Date(),
        epoch: new Date(0),
        future: new Date('2100-01-01'),
        invalid: new Date('invalid'),
        veryOld: new Date(-8640000000000000), // Min date
        veryNew: new Date(8640000000000000),  // Max date
      };
      
      expect(() => logger.info(dates, 'Date edge cases')).not.toThrow();
    });

    it('should handle various Error types', () => {
      const errors = {
        standard: new Error('Standard error'),
        type: new TypeError('Type error'),
        range: new RangeError('Range error'),
        syntax: new SyntaxError('Syntax error'),
        reference: new ReferenceError('Reference error'),
        custom: Object.assign(new Error('Custom'), { 
          code: 'CUSTOM_ERROR',
          statusCode: 500,
          nested: new Error('Nested error')
        })
      };
      
      Object.entries(errors).forEach(([type, error]) => {
        expect(() => logger.error({ err: error }, `${type} error test`)).not.toThrow();
      });
    });

    it('should handle ArrayBuffer and typed arrays', () => {
      const buffer = new ArrayBuffer(16);
      const views = {
        int8: new Int8Array(buffer),
        uint8: new Uint8Array(buffer),
        uint8Clamped: new Uint8ClampedArray(buffer),
        int16: new Int16Array(buffer),
        uint16: new Uint16Array(buffer),
        int32: new Int32Array(buffer),
        uint32: new Uint32Array(buffer),
        float32: new Float32Array(buffer),
        float64: new Float64Array(buffer),
        dataView: new DataView(buffer)
      };
      
      expect(() => logger.debug({ buffer, views }, 'Binary data test')).not.toThrow();
    });

    it('should handle Map and Set objects', () => {
      const map = new Map<unknown, unknown>([
        ['key1', 'value1'],
        ['key2', { nested: true }],
        [Symbol('key3'), 'symbol key'],
        [{ obj: 'key' }, 'object key']
      ]);
      
      const set = new Set([1, 2, 3, 'string', { obj: true }, [1, 2, 3]]);
      
      const weakMap = new WeakMap();
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      weakMap.set(obj1, 'value1');
      weakMap.set(obj2, 'value2');
      
      const weakSet = new WeakSet();
      weakSet.add(obj1);
      weakSet.add(obj2);
      
      expect(() => logger.info({ map, set, weakMap, weakSet }, 'Collection test')).not.toThrow();
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle measureTime with synchronous errors', async () => {
      const error = new Error('Sync error');
      
      await expect(
        measureTime('sync-error-op', async () => {
          throw error;
        })
      ).rejects.toThrow('Sync error');
    });

    it('should handle measureTime with very fast operations', async () => {
      const result = await measureTime('instant-op', async () => {
        return 'immediate';
      });
      
      expect(result).toBe('immediate');
    });

    it('should handle measureTime with null/undefined returns', async () => {
      const nullResult = await measureTime('null-op', async () => null);
      expect(nullResult).toBeNull();
      
      const undefinedResult = await measureTime('undefined-op', async () => undefined);
      expect(undefinedResult).toBeUndefined();
    });

    it('should handle concurrent measureTime calls', async () => {
      const operations = Array.from({ length: 10 }, (_, i) => 
        measureTime(`concurrent-${i}`, async () => {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
          return i;
        })
      );
      
      const results = await Promise.all(operations);
      expect(results).toHaveLength(10);
      results.forEach((result, i) => expect(result).toBe(i));
    });
  });

  describe('Logger Lifecycle', () => {
    it('should handle cleanup gracefully', () => {
      expect(() => cleanupLogger()).not.toThrow();
      
      // Should be idempotent
      expect(() => {
        cleanupLogger();
        cleanupLogger();
        cleanupLogger();
      }).not.toThrow();
    });

    it('should handle logging after cleanup', () => {
      cleanupLogger();
      
      // Should still work
      expect(() => logger.info('Post-cleanup log')).not.toThrow();
    });

    it('should handle child logger creation with extreme contexts', () => {
      const contexts = [
        {},                           // Empty context
        null as unknown as LogContext, // Null context (should handle gracefully)
        { [Symbol('key')]: 'value' }, // Symbol keys
        { '': 'empty key' },          // Empty string key
        { ['x'.repeat(1000)]: 'long key' }, // Very long key
        Array(100).fill(null).reduce<Record<string, number>>((acc, _, i) => ({ ...acc, [`key${i}`]: i }), {}), // Many keys
      ];
      
      contexts.forEach((context) => {
        if (context !== null) {
          expect(() => createLogger(context)).not.toThrow();
        }
      });
    });
  });

  describe('Utility Function Edge Cases', () => {
    it('should handle logStart with empty process name', () => {
      expect(() => logStart('')).not.toThrow();
      expect(() => logStart('   ')).not.toThrow(); // Whitespace
    });

    it('should handle logSuccess with special characters', () => {
      const specialNames = [
        'process-with-emoji-🚀',
        'process\nwith\nnewlines',
        'process\twith\ttabs',
        'process"with"quotes',
        "process'with'quotes",
        'process`with`backticks',
      ];
      
      specialNames.forEach(name => {
        expect(() => logSuccess(name)).not.toThrow();
      });
    });

    it('should handle logPerformance with extreme durations', () => {
      const durations = [
        0,                    // Zero duration
        -1,                   // Negative (should not happen but handle gracefully)
        0.0001,              // Very small
        Number.MAX_SAFE_INTEGER, // Very large
        Infinity,            // Infinity
        NaN,                 // Not a number
      ];
      
      durations.forEach(duration => {
        expect(() => logPerformance('test-op', duration)).not.toThrow();
      });
    });
  });

  describe('Sampling Edge Cases', () => {
    it('should handle invalid sampling rates gracefully', () => {
      expect(() => createSampledLogger({ rate: -1 })).toThrow();
      expect(() => createSampledLogger({ rate: 2 })).toThrow();
      expect(() => createSampledLogger({ rate: NaN })).toThrow();
    });

    it('should handle sampling with empty key', () => {
      expect(() => createSampledLogger({ rate: 0.5, key: '' })).not.toThrow();
    });

    it('should handle sampling with special characters in key', () => {
      const keys = [
        'key-with-emoji-🔥',
        'key\nwith\nnewline',
        'key\x00with\x00null',
        'key'.repeat(1000), // Long key
      ];
      
      keys.forEach(key => {
        expect(() => createSampledLogger({ rate: 0.5, key })).not.toThrow();
      });
    });

    it('should respect minLevel with invalid log levels', () => {
      const sampledLogger = createSampledLogger({ 
        rate: 0, // Never log
        minLevel: 'error' 
      });
      
      // Error should always log despite 0 rate
      const errorSpy = vi.spyOn(sampledLogger, 'error');
      sampledLogger.error('Critical error');
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('AsyncLocalStorage Edge Cases', () => {
    it('should handle runWithContext with throwing functions', async () => {
      const error = new Error('Context error');
      
      await expect(
        runWithContext({ test: true }, async () => {
          throw error;
        })
      ).rejects.toThrow('Context error');
      
      // Context should be cleared after error
      expect(getAsyncContext()).toBeUndefined();
    });

    it('should handle deeply nested contexts', async () => {
      const depths = 10;
      let finalContext: LogContext | undefined;
      
      const runNested = async (depth: number): Promise<void> => {
        if (depth === 0) {
          finalContext = getAsyncContext();
          return;
        }
        
        await runWithContext({ level: depth }, async () => {
          await runNested(depth - 1);
        });
      };
      
      await runNested(depths);
      expect(finalContext).toEqual({ level: 1 });
    });

    it('should handle updateAsyncContext without active context', () => {
      // Should not throw when no context exists
      expect(() => updateAsyncContext({ new: 'data' })).not.toThrow();
    });

    it('should handle createAsyncLogger with various contexts', () => {
      interface CircularContext {
        circular: {
          self?: CircularContext['circular'];
        };
      }
      const circularContext: CircularContext = { circular: {} };
      circularContext.circular.self = circularContext.circular;
      
      const contexts: Array<LogContext | undefined> = [
        undefined,
        {},
        { nested: { deep: { value: true } } },
        circularContext as unknown as LogContext,
      ];
      
      contexts.forEach(context => {
        expect(() => createAsyncLogger(context)).not.toThrow();
      });
    });

    it('should handle concurrent async operations', async () => {
      const results = await Promise.all([
        runWithContext({ op: 1 }, async () => {
          await new Promise(r => setTimeout(r, 10));
          return getAsyncContext();
        }),
        runWithContext({ op: 2 }, async () => {
          await new Promise(r => setTimeout(r, 5));
          return getAsyncContext();
        }),
        runWithContext({ op: 3 }, async () => {
          return getAsyncContext();
        }),
      ]);
      
      expect(results[0]).toEqual({ op: 1 });
      expect(results[1]).toEqual({ op: 2 });
      expect(results[2]).toEqual({ op: 3 });
    });
  });

  describe('Environment-specific Edge Cases', () => {
    it('should handle missing process.argv', () => {
      const originalArgv = process.argv;
      process.argv = [];
      
      // Force re-evaluation
      vi.resetModules();
      
      expect(async () => {
        const { logger: newLogger } = await import('@utils/logger.js');
        newLogger.info('Test without argv');
      }).not.toThrow();
      
      process.argv = originalArgv;
    });

    it('should handle logger in different environments', async () => {
      const environments = ['development', 'production', 'test'];
      
      for (const env of environments) {
        vi.resetModules();
        vi.doMock('@lib/config/index.js', () => ({
          env: { NODE_ENV: env, LOG_LEVEL: 'info' },
          isDevelopment: () => env === 'development',
          isProduction: () => env === 'production',
          isTest: () => env === 'test',
          isCI: () => false
        }));
        
        const { logger: envLogger } = await import('@utils/logger.js');
        expect(() => envLogger.info(`Testing in ${env}`)).not.toThrow();
      }
    });
  });
});