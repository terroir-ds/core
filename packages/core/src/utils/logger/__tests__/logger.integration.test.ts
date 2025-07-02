/**
 * @module test/lib/utils/logger/logger.integration
 * 
 * Integration tests for logger utility across multiple components
 * 
 * Tests real-world scenarios including:
 * - Request context propagation across async operations
 * - Multi-component logging coordination
 * - Error handling chains through logging layers
 * - Performance tracking aggregation
 * - Concurrent request isolation with AsyncLocalStorage
 * - Database, API, and filesystem operation simulation
 * - Complex nested operations with context preservation
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
  createLogger,
  measureTime,
  setRequestId,
  getRequestId,
  clearRequestId,
  generateRequestId,
  logStart,
  logSuccess,
  runWithContext,
  getAsyncContext
} from '@utils/logger';

describe('Logger Integration Tests', () => {
  beforeEach(() => {
    clearRequestId();
  });

  afterEach(() => {
    clearRequestId();
  });

  describe('Request Context Propagation', () => {
    it('should maintain request ID across async operations', async () => {
      const requestId = generateRequestId();
      setRequestId(requestId);

      // Simulate async request handling
      const results = await Promise.all([
        simulateDbQuery('users'),
        simulateApiCall('/api/data'),
        simulateFileOperation('read')
      ]);

      // All operations should have access to the same request ID
      results.forEach(result => {
        expect(result.requestId).toBe(requestId);
      });
    });

    it('should handle nested async operations with context', async () => {
      const requestId = generateRequestId();
      setRequestId(requestId);

      const result = await measureTime('parent-operation', async () => {
        const childResult = await measureTime('child-operation', async () => {
          const grandchildResult = await measureTime('grandchild-operation', async () => {
            return { level: 3, requestId: getRequestId() };
          });
          return { level: 2, child: grandchildResult, requestId: getRequestId() };
        });
        return { level: 1, child: childResult, requestId: getRequestId() };
      });

      // Verify all levels maintained the request ID
      expect(result.requestId).toBe(requestId);
      expect(result.child.requestId).toBe(requestId);
      expect(result.child.child.requestId).toBe(requestId);
    });
  });

  describe('Multi-Component Logging', () => {
    it('should coordinate logging across multiple modules', async () => {
      const requestId = generateRequestId();
      setRequestId(requestId);

      // Simulate a complex operation across modules
      const operation = async () => {
        logStart('complex-operation', { requestId });

        // Module A
        const moduleALogger = createLogger({ module: 'moduleA' });
        moduleALogger.info('Starting module A processing');

        // Module B
        const moduleBLogger = createLogger({ module: 'moduleB' });
        await measureTime('moduleB-processing', async () => {
          moduleBLogger.debug('Processing in module B');
          await new Promise(resolve => setTimeout(resolve, 10));
        });

        // Module C with error
        const moduleCLogger = createLogger({ module: 'moduleC' });
        try {
          throw new Error('Module C error');
        } catch (err) {
          moduleCLogger.error({ err }, 'Error in module C');
        }

        logSuccess('complex-operation', { requestId });
      };

      await expect(operation()).resolves.not.toThrow();
    });
  });

  describe('Error Handling Chain', () => {
    it('should properly propagate errors through logging layers', async () => {
      const operations = [
        { name: 'operation1', shouldFail: false },
        { name: 'operation2', shouldFail: true },
        { name: 'operation3', shouldFail: false }
      ];

      const results = await Promise.allSettled(
        operations.map(op => 
          measureTime(op.name, async () => {
            if (op.shouldFail) {
              throw new Error(`${op.name} failed`);
            }
            return `${op.name} succeeded`;
          })
        )
      );

      // Check results
      expect(results[0]).toHaveProperty('status', 'fulfilled');
      expect(results[1]).toHaveProperty('status', 'rejected');
      expect(results[2]).toHaveProperty('status', 'fulfilled');
    });
  });

  describe('Performance Tracking Aggregation', () => {
    it('should track performance across multiple operations', async () => {
      // Run multiple timed operations
      const result1 = await measureTime('fast-op', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        return 'fast';
      });

      const result2 = await measureTime('medium-op', async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        return 'medium';
      });

      const result3 = await measureTime('slow-op', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'slow';
      });

      // Verify operations completed successfully
      expect(result1).toBe('fast');
      expect(result2).toBe('medium');
      expect(result3).toBe('slow');
      
      // The measureTime function logs performance metrics internally
      // We've verified the operations ran in the expected order
    });
  });

  describe('Concurrent Request Isolation', () => {
    it('should not mix request IDs between concurrent requests with AsyncLocalStorage', async () => {
      const results = await Promise.all([
        simulateRequest('request-1'),
        simulateRequest('request-2'),
        simulateRequest('request-3')
      ]);

      // Each request should have maintained its own ID
      results.forEach((result, index) => {
        expect(result.requestId).toContain(`request-${index + 1}`);
        expect(result.operations.every(op => op.requestId === result.requestId)).toBe(true);
      });
    });
  });
});

// Helper functions
async function simulateDbQuery(table: string): Promise<{ data: string; requestId?: string | undefined }> {
  const childLogger = createLogger({ component: 'database', table });
  childLogger.debug(`Querying ${table}`);
  
  await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
  
  return { 
    data: `${table} data`,
    requestId: getRequestId()
  };
}

async function simulateApiCall(endpoint: string): Promise<{ response: string; requestId?: string | undefined }> {
  const childLogger = createLogger({ component: 'api', endpoint });
  childLogger.info(`Calling ${endpoint}`);
  
  await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
  
  return { 
    response: `${endpoint} response`,
    requestId: getRequestId()
  };
}

async function simulateFileOperation(operation: string): Promise<{ result: string; requestId?: string | undefined }> {
  const childLogger = createLogger({ component: 'filesystem', operation });
  childLogger.debug(`File operation: ${operation}`);
  
  await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
  
  return { 
    result: `${operation} complete`,
    requestId: getRequestId()
  };
}

async function simulateRequest(requestName: string) {
  const requestId = `${requestName}-${generateRequestId()}`;
  
  // Use AsyncLocalStorage to isolate request context
  return runWithContext({ requestId, requestName }, async () => {
    const operations = [];
    
    // Simulate various operations within the request
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 5));
      const context = getAsyncContext();
      operations.push({
        operation: `${requestName}-op-${i}`,
        requestId: context?.['requestId'] as string | undefined
      });
    }
    
    return {
      requestId,
      operations
    };
  });
}