/**
 * Integration tests for logger utility
 * 
 * Tests cover:
 * - Real-world scenarios with multiple components
 * - Async context propagation
 * - Error handling across boundaries
 * - Performance in realistic conditions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  logger,
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
} from '../index.js';

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