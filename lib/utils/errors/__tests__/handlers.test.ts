/**
 * @module test/lib/utils/errors/handlers
 * 
 * Unit tests for error handling and recovery utilities
 * 
 * Tests error handling functionality including:
 * - Error handler registration and execution
 * - Recovery strategy registration and execution
 * - handleError with severity-based logging
 * - tryRecover with fallback values
 * - withErrorHandling decorator function
 * - errorBoundary for safe execution
 * - Global error handlers (uncaught exceptions, rejections)
 * - Error formatting and detail extraction
 * - Assertion utilities (assert, assertDefined)
 * - Context propagation through error handling
 * - Graceful shutdown signal handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  registerErrorHandler,
  unregisterErrorHandler,
  registerRecoveryStrategy,
  handleError,
  tryRecover,
  withErrorHandling,
  errorBoundary,
  setupGlobalErrorHandlers,
  formatError,
  extractErrorDetails,
  assert,
  assertDefined,
} from '../handlers.js';
import { ValidationError, ErrorSeverity } from '../base-error.js';
import { logger } from '../../logger/index.js';
import { expectRejection } from '@test/helpers/error-handling.js';

// Mock the logger
vi.mock('../../logger/index.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  },
}));

describe('Error Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });


  describe('Error Handler Registry', () => {
    it('should register and call error handlers', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      registerErrorHandler('handler1', handler1);
      registerErrorHandler('handler2', handler2);
      
      const error = new ValidationError('Test error');
      await handleError(error);
      
      expect(handler1).toHaveBeenCalledWith(error, undefined);
      expect(handler2).toHaveBeenCalledWith(error, undefined);
    });

    it('should unregister error handlers', async () => {
      const handler = vi.fn();
      
      registerErrorHandler('handler', handler);
      unregisterErrorHandler('handler');
      
      await handleError(new Error('Test'));
      
      expect(handler).not.toHaveBeenCalled();
    });

    it('should pass context to handlers', async () => {
      const handler = vi.fn();
      registerErrorHandler('handler', handler);
      
      const error = new ValidationError('Test');
      const context = { userId: 'user123' };
      
      await handleError(error, context);
      
      expect(handler).toHaveBeenCalledWith(error, context);
    });

    it('should handle handler errors gracefully', async () => {
      const goodHandler = vi.fn();
      const badHandler = vi.fn().mockRejectedValue(new Error('Handler failed'));
      
      registerErrorHandler('good', goodHandler);
      registerErrorHandler('bad', badHandler);
      
      // Should not throw even if handler fails
      await expect(handleError(new Error('Test'))).resolves.toBeUndefined();
      
      expect(goodHandler).toHaveBeenCalled();
      expect(badHandler).toHaveBeenCalled();
    });
  });

  describe('handleError()', () => {
    it('should log based on error severity', async () => {
      const criticalError = new ValidationError('Critical', {
        severity: ErrorSeverity.CRITICAL,
      });
      await handleError(criticalError);
      expect(logger.fatal).toHaveBeenCalled();
      
      const highError = new ValidationError('High', {
        severity: ErrorSeverity.HIGH,
      });
      await handleError(highError);
      expect(logger.error).toHaveBeenCalled();
      
      const mediumError = new ValidationError('Medium', {
        severity: ErrorSeverity.MEDIUM,
      });
      await handleError(mediumError);
      expect(logger.warn).toHaveBeenCalled();
      
      const lowError = new ValidationError('Low', {
        severity: ErrorSeverity.LOW,
      });
      await handleError(lowError);
      expect(logger.info).toHaveBeenCalled();
    });

    it('should wrap non-BaseError instances', async () => {
      const plainError = new Error('Plain error');
      await handleError(plainError);
      
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'WRAPPED_ERROR',
        }),
        expect.any(String)
      );
    });

    it('should include context in logs', async () => {
      const error = new ValidationError('Test', {
        context: { operation: 'test' },
      });
      const additionalContext = { requestId: 'req-123' };
      
      await handleError(error, additionalContext);
      
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'test',
          requestId: 'req-123',
          errorId: error.errorId,
        }),
        expect.any(String)
      );
    });
  });

  describe('Recovery Strategies', () => {
    it('should register and execute recovery strategies', async () => {
      const recoveryValue = { recovered: true };
      const strategy = vi.fn().mockResolvedValue(recoveryValue);
      
      registerRecoveryStrategy('TEST_ERROR', strategy);
      
      const error = new ValidationError('Test', { code: 'TEST_ERROR' });
      const result = await tryRecover(error);
      
      expect(strategy).toHaveBeenCalledWith(error);
      expect(result).toBe(recoveryValue);
    });

    it('should return default value if no strategy', async () => {
      const error = new ValidationError('Test', { code: 'NO_STRATEGY' });
      const defaultValue = { default: true };
      
      const result = await tryRecover(error, defaultValue);
      
      expect(result).toBe(defaultValue);
    });

    it('should handle recovery strategy errors', async () => {
      const strategy = vi.fn().mockRejectedValue(new Error('Recovery failed'));
      registerRecoveryStrategy('FAIL_RECOVERY', strategy);
      
      const error = new ValidationError('Test', { code: 'FAIL_RECOVERY' });
      const result = await tryRecover(error);
      
      expect(result).toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          originalError: expect.any(Object),
          recoveryError: expect.any(Error),
        }),
        'Error recovery failed'
      );
    });
  });

  describe('withErrorHandling()', () => {
    it('should handle function errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Function failed'));
      const wrapped = withErrorHandling(fn);
      
      const result = await wrapped();
      
      expect(result).toBeUndefined();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should return default value on error', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Failed'));
      const defaultValue = 'default';
      const wrapped = withErrorHandling(fn, { defaultValue });
      
      const result = await wrapped();
      
      expect(result).toBe('default');
    });

    it('should rethrow if configured', async () => {
      const error = new Error('Failed');
      const fn = vi.fn().mockRejectedValue(error);
      const wrapped = withErrorHandling(fn, { rethrow: true });
      
      await expectRejection(wrapped(), 'Failed');
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should pass context to error handler', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Failed'));
      const context = { operation: 'test' };
      const wrapped = withErrorHandling(fn, { context });
      
      await wrapped();
      
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'test',
        }),
        expect.any(String)
      );
    });

    it('should preserve function arguments', async () => {
      const fn = vi.fn().mockResolvedValue('result');
      const wrapped = withErrorHandling(fn);
      
      const result = await wrapped('arg1', 'arg2');
      
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result).toBe('result');
    });
  });

  describe('errorBoundary()', () => {
    it('should execute operation successfully', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await errorBoundary(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
    });

    it('should use fallback on error', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failed'));
      const fallback = 'fallback value';
      
      const result = await errorBoundary(operation, { fallback });
      
      expect(result).toBe('fallback value');
    });

    it('should call fallback function', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failed'));
      const fallback = vi.fn().mockResolvedValue('computed fallback');
      
      const result = await errorBoundary(operation, { fallback });
      
      expect(fallback).toHaveBeenCalled();
      expect(result).toBe('computed fallback');
    });

    it('should call custom error handler', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failed'));
      const onError = vi.fn();
      
      await errorBoundary(operation, { onError, fallback: null });
      
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(logger.warn).not.toHaveBeenCalled(); // Custom handler replaces default
    });

    it('should try recovery before fallback', async () => {
      const operation = vi.fn().mockRejectedValue(
        new ValidationError('Failed', { code: 'RECOVERABLE' })
      );
      const recoveryValue = 'recovered';
      const fallback = 'fallback';
      
      registerRecoveryStrategy('RECOVERABLE', () => recoveryValue as unknown as void);
      
      const result = await errorBoundary(operation, { fallback });
      
      expect(result).toBe('recovered');
    });

    it('should rethrow if no fallback', async () => {
      const error = new ValidationError('Failed');
      const operation = vi.fn().mockRejectedValue(error);
      
      await expectRejection(errorBoundary(operation), 'Failed');
    });

    it('should include context in error handling', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failed'));
      const context = { userId: 'user123' };
      
      await errorBoundary(operation, { 
        fallback: null,
        context,
      });
      
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
        }),
        expect.any(String)
      );
    });
  });

  describe('Global Error Handlers', () => {
    let processListeners: Record<string | symbol, Function[]>;

    beforeEach(() => {
      processListeners = {};
      vi.spyOn(process, 'on').mockImplementation((event, handler) => {
        if (!processListeners[event]) {
          processListeners[event] = [];
        }
        processListeners[event].push(handler);
        return process;
      });
      vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('Process exit');
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should setup all global handlers', () => {
      setupGlobalErrorHandlers();
      
      expect(process.on).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
      expect(process.on).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
      expect(process.on).toHaveBeenCalledWith('warning', expect.any(Function));
      expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
      expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    });

    it('should handle uncaught exceptions', () => {
      setupGlobalErrorHandlers();
      vi.useFakeTimers();
      
      const error = new Error('Uncaught error');
      const handler = processListeners['uncaughtException']?.[0];
      
      expect(() => {
        handler?.(error);
        vi.advanceTimersByTime(1000);
      }).toThrow('Process exit');
      
      expect(logger.fatal).toHaveBeenCalledWith(
        expect.objectContaining({
          err: error,
          type: 'uncaughtException',
        }),
        'Uncaught exception'
      );
      
      vi.useRealTimers();
    });

    it('should handle unhandled rejections', () => {
      setupGlobalErrorHandlers();
      
      const reason = new Error('Rejected');
      // Create a promise but immediately catch it to prevent actual unhandled rejection
      const promise = Promise.reject(reason);
      promise.catch(() => {}); // Suppress the actual rejection
      
      const handler = processListeners['unhandledRejection']?.[0];
      
      handler?.(reason, promise);
      
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: reason,
          type: 'unhandledRejection',
          promise,
        }),
        'Unhandled promise rejection'
      );
    });

    it('should handle warnings', () => {
      setupGlobalErrorHandlers();
      
      const warning = new Error('Warning');
      warning.name = 'Warning';
      const handler = processListeners['warning']?.[0];
      
      handler?.(warning);
      
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          err: warning,
          type: 'warning',
        }),
        'Node.js warning'
      );
    });

    it('should handle shutdown signals', async () => {
      setupGlobalErrorHandlers();
      
      const handler = processListeners['SIGTERM']?.[0];
      expect(handler).toBeDefined();
      
      // Mock process.exit to prevent actual exit
      const originalExit = process.exit;
      const mockExit = vi.fn();
      process.exit = mockExit as unknown as typeof process.exit;
      
      try {
        // Call the handler
        handler?.();
        
        // Use setImmediate to wait for promises to resolve
        await new Promise(resolve => setImmediate(resolve));
        
        expect(logger.info).toHaveBeenCalledWith(
          { signal: 'SIGTERM' },
          'Received shutdown signal'
        );
        expect(logger.info).toHaveBeenCalledWith('Graceful shutdown complete');
        expect(mockExit).toHaveBeenCalledWith(0);
        // Wait a bit more for all logs
        await new Promise(resolve => setTimeout(resolve, 10));
      } finally {
        process.exit = originalExit;
      }
    });
  });

  describe('formatError()', () => {
    it('should format BaseError with all details', () => {
      const cause = new Error('Cause error');
      const error = new ValidationError('Validation failed', {
        cause,
        context: { field: 'email', value: 'invalid' },
      });
      
      const formatted = formatError(error);
      
      expect(formatted).toContain('ValidationError: Validation failed');
      expect(formatted).toContain(`Error ID: ${error.errorId}`);
      expect(formatted).toContain('Code: VALIDATION_ERROR');
      expect(formatted).toContain('Severity: low');
      expect(formatted).toContain('Category: validation');
      expect(formatted).toContain('Context:');
      expect(formatted).toContain('field: "email"');
      expect(formatted).toContain('value: "invalid"');
      expect(formatted).toContain('Caused by:');
      expect(formatted).toContain('Error: Cause error');
      expect(formatted).toContain('Stack:');
    });

    it('should format with selective options', () => {
      const error = new ValidationError('Test', {
        context: { field: 'test' },
      });
      
      const formatted = formatError(error, {
        stack: false,
        cause: false,
        context: false,
      });
      
      expect(formatted).toContain('ValidationError: Test');
      expect(formatted).not.toContain('Context:');
      expect(formatted).not.toContain('Stack:');
      expect(formatted).not.toContain('Caused by:');
    });

    it('should format plain Error', () => {
      const error = new Error('Plain error');
      const formatted = formatError(error);
      
      expect(formatted).toContain('Plain error');
      expect(formatted).toContain('at '); // Stack trace
    });

    it('should format non-Error values', () => {
      expect(formatError('string error')).toBe('string error');
      expect(formatError(123)).toBe('123');
      expect(formatError(null)).toBe('null');
    });
  });

  describe('extractErrorDetails()', () => {
    it('should extract BaseError details', () => {
      const error = new ValidationError('Test', {
        context: { field: 'test' },
      });
      
      const details = extractErrorDetails(error);
      
      expect(details).toMatchObject({
        name: 'ValidationError',
        message: 'Test',
        errorId: error.errorId,
        code: 'VALIDATION_ERROR',
        context: expect.objectContaining({ field: 'test' }),
      });
    });

    it('should extract plain Error details', () => {
      const error = new Error('Test error');
      const details = extractErrorDetails(error);
      
      expect(details).toMatchObject({
        name: 'Error',
        message: 'Test error',
        stack: expect.any(String),
      });
    });

    it('should handle circular references', () => {
      interface CircularObj {
        a: number;
        circular?: CircularObj;
      }
      const obj: CircularObj = { a: 1 };
      obj.circular = obj;
      
      const details = extractErrorDetails(obj);
      
      expect(details).toMatchObject({ error: '[object Object]' });
    });

    it('should handle null and undefined', () => {
      expect(extractErrorDetails(null)).toEqual({ error: 'No error provided' });
      expect(extractErrorDetails(undefined)).toEqual({ error: 'No error provided' });
    });

    it('should handle primitive values', () => {
      expect(extractErrorDetails('string')).toEqual({ error: 'string' });
      expect(extractErrorDetails(123)).toEqual({ error: '123' });
    });
  });

  describe('Assertions', () => {
    it('should not throw when condition is true', () => {
      expect(() => assert(true, 'Should not throw')).not.toThrow();
      expect(() => assert(1, 'Should not throw')).not.toThrow();
      expect(() => assert('string', 'Should not throw')).not.toThrow();
    });

    it('should throw when condition is false', () => {
      expect(() => assert(false, 'Failed')).toThrow('Failed');
      expect(() => assert(0, 'Failed')).toThrow('Failed');
      expect(() => assert('', 'Failed')).toThrow('Failed');
      expect(() => assert(null, 'Failed')).toThrow('Failed');
    });

    it('should throw with custom error code', () => {
      try {
        assert(false, 'Custom message', 'CUSTOM_CODE');
      } catch (error) {
        expect((error as Error).message).toBe('Custom message');
        expect((error as Error & { code: string }).code).toBe('CUSTOM_CODE');
      }
    });

    it('should assert defined values', () => {
      expect(() => assertDefined('value', 'Should not throw')).not.toThrow();
      expect(() => assertDefined(0, 'Should not throw')).not.toThrow();
      expect(() => assertDefined(false, 'Should not throw')).not.toThrow();
      expect(() => assertDefined('', 'Should not throw')).not.toThrow();
    });

    it('should throw for null or undefined', () => {
      expect(() => assertDefined(null, 'Is null')).toThrow('Is null');
      expect(() => assertDefined(undefined, 'Is undefined')).toThrow('Is undefined');
      
      try {
        assertDefined(null, 'Value required');
      } catch (error) {
        const typedError = error as Error & { code: string; context: { value: unknown } };
        expect(typedError.code).toBe('VALUE_UNDEFINED');
        expect(typedError.context.value).toBeNull();
      }
    });
  });
});