/**
 * @module @utils/logger/__mocks__/logger.mock
 * 
 * Mock implementations for the logger module in the Terroir Core Design System.
 * 
 * Provides comprehensive mock utilities for testing components that use logging
 * without producing actual log output. These mocks capture all logging calls
 * for assertion in tests while maintaining the same API as the real logger.
 * 
 * @example Basic mock usage
 * ```typescript
 * import { createMockLogger } from '@utils/logger/__mocks__/logger.mock';
 * 
 * it('should log errors', () => {
 *   const mockLogger = createMockLogger();
 *   
 *   processWithLogging(mockLogger);
 *   
 *   expect(mockLogger.error).toHaveBeenCalledWith(
 *     { code: 'PROCESS_ERROR' },
 *     'Process failed'
 *   );
 * });
 * ```
 * 
 * @example Mocking the entire module
 * ```typescript
 * import { mockLoggerModule } from '@utils/logger/__mocks__/logger.mock';
 * 
 * beforeEach(() => {
 *   mockLoggerModule();
 * });
 * 
 * it('should use mocked logger', async () => {
 *   const { logger } = await import('@utils/logger');
 *   
 *   logger.info('test');
 *   expect(logger.info).toHaveBeenCalledWith('test');
 * });
 * ```
 * 
 * @example Capturing log output
 * ```typescript
 * import { createTestLogStream } from '@utils/logger/__mocks__/logger.mock';
 * 
 * it('should capture structured logs', () => {
 *   const { stream, output } = createTestLogStream();
 *   
 *   stream.write(JSON.stringify({ level: 30, msg: 'test' }));
 *   
 *   expect(output[0]).toMatchObject({
 *     level: 30,
 *     msg: 'test'
 *   });
 * });
 * ```
 * 
 * Mock implementations for logger module
 * Used for testing components that use logging
 */

import { vi } from 'vitest';
import type { Logger } from 'pino';
import type { LogContext } from '@utils/logger/index.js';

/**
 * Create a mock logger instance
 */
export function createMockLogger(): Logger {
  return {
    fatal: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    silent: vi.fn(),
    child: vi.fn(() => createMockLogger()),
    bindings: vi.fn(() => ({})),
    level: 'info',
    isLevelEnabled: vi.fn(() => true),
    levels: {},
    flush: vi.fn(),
  } as unknown as Logger;
}

/**
 * Create a mock for logger utility functions
 */
export function createLoggerUtilsMock() {
  const mockLogger = createMockLogger();
  
  return {
    logger: mockLogger,
    default: mockLogger,
    logStart: vi.fn((processName: string, _context?: LogContext) => {
      mockLogger.info({ phase: 'start' }, `Starting ${processName}`);
    }),
    logSuccess: vi.fn((processName: string, _context?: LogContext) => {
      mockLogger.info({ phase: 'complete', status: 'success' }, `✓ ${processName} completed successfully`);
    }),
    logPerformance: vi.fn((operation: string, duration: number, _context?: LogContext) => {
      mockLogger.info({ performance: { operation, duration, durationUnit: 'ms' } }, `${operation} took ${duration}ms`);
    }),
    createLogger: vi.fn((_context: LogContext) => mockLogger),
    measureTime: vi.fn(async <T>(_operation: string, fn: () => Promise<T>): Promise<T> => {
      const result = await fn();
      return result;
    }),
    generateRequestId: vi.fn(() => 'test-request-id'),
    setRequestId: vi.fn(),
    getRequestId: vi.fn(() => 'test-request-id'),
    clearRequestId: vi.fn(),
  };
}

/**
 * Mock the entire @utils/logger module
 */
export function mockLoggerModule() {
  vi.doMock('@utils/logger.js', () => createLoggerUtilsMock());
}

/**
 * Create a test stream for capturing logger output
 */
export function createTestLogStream() {
  const output: Array<Record<string, unknown>> = [];
  
  return {
    output,
    stream: {
      write: (data: string) => {
        try {
          output.push(JSON.parse(data));
        } catch {
          // If not JSON, store as-is
          output.push({ raw: data });
        }
      }
    }
  };
}