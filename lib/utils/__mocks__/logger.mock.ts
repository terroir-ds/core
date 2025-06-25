/**
 * Mock implementations for logger module
 * Used for testing components that use logging
 */

import { vi } from 'vitest';
import type { Logger } from 'pino';
import type { LogContext } from '@utils/logger.js';

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
    logSuccess: vi.fn((processName: string, context?: LogContext) => {
      mockLogger.info({ ...context, phase: 'complete', status: 'success' }, `✓ ${processName} completed successfully`);
    }),
    logPerformance: vi.fn((operation: string, duration: number, context?: LogContext) => {
      mockLogger.info({ ...context, performance: { operation, duration, durationUnit: 'ms' } }, `${operation} took ${duration}ms`);
    }),
    createLogger: vi.fn((context: LogContext) => mockLogger),
    measureTime: vi.fn(async <T>(operation: string, fn: () => Promise<T>): Promise<T> => {
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