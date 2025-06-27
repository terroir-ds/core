/**
 * @module test/lib/utils/errors/base-error
 * 
 * Unit tests for base error classes and utilities
 * 
 * Tests error functionality including:
 * - BaseError construction with severity and category
 * - Error chaining and root cause analysis
 * - Error serialization (JSON, public JSON, log context)
 * - Specific error types (Validation, Network, Permission, etc.)
 * - MultiError for aggregating multiple errors
 * - Type guards (isError, isBaseError, isRetryableError)
 * - Error wrapping utilities
 * - HTTP response error creation
 * - Error context and metadata handling
 * - Stack trace capture and formatting
 */

import { describe, it, expect } from 'vitest';
import {
  BaseError,
  ValidationError,
  ConfigurationError,
  NetworkError,
  PermissionError,
  ResourceError,
  BusinessLogicError,
  IntegrationError,
  MultiError,
  ErrorSeverity,
  ErrorCategory,
  isError,
  isBaseError,
  isRetryableError,
  wrapError,
  createErrorFromResponse,
} from '../base-error.js';

describe('BaseError', () => {
  describe('Error Construction', () => {
    it('should create error with default values', () => {
      class TestError extends BaseError {}
      const error = new TestError('Test message');
      
      expect(error.message).toBe('Test message');
      expect(error.name).toBe('TestError');
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.category).toBe(ErrorCategory.UNKNOWN);
      expect(error.retryable).toBe(false);
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.errorId).toMatch(/^[a-f0-9-]{36}$/);
      expect(error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should create error with custom options', () => {
      class TestError extends BaseError {}
      const cause = new Error('Cause error');
      const context = { userId: 'user123', operation: 'test' };
      
      const error = new TestError('Test message', {
        cause,
        context,
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.NETWORK,
        retryable: true,
        statusCode: 503,
        code: 'TEST_ERROR',
      });
      
      expect(error.cause).toBe(cause);
      expect(error.context).toMatchObject(context);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.retryable).toBe(true);
      expect(error.statusCode).toBe(503);
      expect(error.code).toBe('TEST_ERROR');
    });

    it('should capture stack trace', () => {
      class TestError extends BaseError {}
      const error = new TestError('Test message');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('TestError: Test message');
      expect(error.stack).toContain('base-error.test.ts');
    });
  });

  describe('Error Chaining', () => {
    it('should get root cause of error chain', () => {
      const rootCause = new Error('Root cause');
      const middleError = new Error('Middle error', { cause: rootCause });
      const topError = new ValidationError('Top error', { cause: middleError });
      
      expect(topError.getRootCause()).toBe(rootCause);
    });

    it('should get all errors in chain', () => {
      const rootCause = new Error('Root cause');
      const middleError = new Error('Middle error', { cause: rootCause });
      const topError = new ValidationError('Top error', { cause: middleError });
      
      const chain = topError.getErrorChain();
      expect(chain).toHaveLength(3);
      expect(chain[0]).toBe(topError);
      expect(chain[1]).toBe(middleError);
      expect(chain[2]).toBe(rootCause);
    });

    it('should check if error chain contains specific type', () => {
      const netError = new NetworkError('Network failed');
      const validError = new ValidationError('Validation failed', { cause: netError });
      
      expect(validError.hasErrorType(NetworkError as new (...args: unknown[]) => NetworkError)).toBe(true);
      expect(validError.hasErrorType(ConfigurationError as new (...args: unknown[]) => ConfigurationError)).toBe(false);
    });

    it('should handle non-Error causes', () => {
      const error = new ValidationError('Test', { cause: 'string cause' });
      
      expect(error.getRootCause()).toBe('string cause');
      expect(error.getErrorChain()).toHaveLength(2);
    });
  });

  describe('Error Serialization', () => {
    it('should serialize to JSON with all properties', () => {
      const cause = new Error('Cause');
      const error = new ValidationError('Test error', {
        cause,
        context: { userId: 'user123' },
      });
      
      const json = error.toJSON();
      
      expect(json).toMatchObject({
        name: 'ValidationError',
        message: 'Test error',
        errorId: error.errorId,
        timestamp: error.timestamp,
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.VALIDATION,
        retryable: false,
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        context: {
          errorId: error.errorId,
          timestamp: error.timestamp,
          userId: 'user123',
        },
      });
      expect(json['stack']).toBeDefined();
      expect(json['cause']).toMatchObject({
        name: 'Error',
        message: 'Cause',
      });
    });

    it('should create safe public JSON without sensitive data', () => {
      const error = new ValidationError('Test error', {
        context: { 
          userId: 'user123',
          password: 'secret',
          apiKey: 'key123',
        },
      });
      
      const publicJson = error.toPublicJSON();
      
      expect(publicJson).toMatchObject({
        errorId: error.errorId,
        timestamp: error.timestamp,
        code: 'VALIDATION_ERROR',
        message: 'Test error',
        statusCode: 400,
        retryable: false,
      });
      expect(publicJson['stack']).toBeUndefined();
      expect(publicJson['context']).toBeUndefined();
    });

    it('should format for logging with context', () => {
      const error = new ValidationError('Test error', {
        context: { operation: 'validate' },
      });
      
      const logContext = error.toLogContext();
      
      expect(logContext).toMatchObject({
        err: error,
        errorId: error.errorId,
        errorCode: 'VALIDATION_ERROR',
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.VALIDATION,
        retryable: false,
        operation: 'validate',
      });
    });
  });

  describe('Specific Error Classes', () => {
    it('should create ValidationError with correct defaults', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.retryable).toBe(false);
    });

    it('should create ConfigurationError with correct defaults', () => {
      const error = new ConfigurationError('Bad config');
      
      expect(error.category).toBe(ErrorCategory.CONFIGURATION);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('CONFIG_ERROR');
      expect(error.retryable).toBe(false);
    });

    it('should create NetworkError with correct defaults', () => {
      const error = new NetworkError('Connection failed');
      
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.statusCode).toBe(503);
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.retryable).toBe(true);
    });

    it('should create PermissionError with correct defaults', () => {
      const error = new PermissionError('Access denied');
      
      expect(error.category).toBe(ErrorCategory.PERMISSION);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('PERMISSION_ERROR');
      expect(error.retryable).toBe(false);
    });

    it('should create ResourceError with correct defaults', () => {
      const error = new ResourceError('Not found');
      
      expect(error.category).toBe(ErrorCategory.RESOURCE);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('RESOURCE_ERROR');
      expect(error.retryable).toBe(false);
    });

    it('should create BusinessLogicError with correct defaults', () => {
      const error = new BusinessLogicError('Invalid operation');
      
      expect(error.category).toBe(ErrorCategory.BUSINESS_LOGIC);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.statusCode).toBe(422);
      expect(error.code).toBe('BUSINESS_ERROR');
      expect(error.retryable).toBe(false);
    });

    it('should create IntegrationError with correct defaults', () => {
      const error = new IntegrationError('External service failed');
      
      expect(error.category).toBe(ErrorCategory.INTEGRATION);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.statusCode).toBe(502);
      expect(error.code).toBe('INTEGRATION_ERROR');
      expect(error.retryable).toBe(true);
    });
  });

  describe('MultiError (AggregateError)', () => {
    it('should aggregate multiple errors', () => {
      const errors = [
        new ValidationError('Error 1'),
        new NetworkError('Error 2'),
        new Error('Error 3'),
      ];
      
      const multiError = new MultiError(errors, 'Multiple errors occurred');
      
      expect(multiError.message).toBe('Multiple errors occurred');
      expect(multiError.errors).toHaveLength(3);
      expect(multiError.errorId).toMatch(/^[a-f0-9-]{36}$/);
      expect(multiError.context['errorCount']).toBe(3);
    });

    it('should get unique error types', () => {
      const errors = [
        new ValidationError('Error 1'),
        new ValidationError('Error 2'),
        new NetworkError('Error 3'),
      ];
      
      const multiError = new MultiError(errors, 'Multiple errors');
      const types = multiError.getErrorTypes();
      
      expect(types).toContain('ValidationError');
      expect(types).toContain('NetworkError');
      expect(types).toHaveLength(2);
    });

    it('should filter errors by type', () => {
      const errors = [
        new ValidationError('Error 1'),
        new ValidationError('Error 2'),
        new NetworkError('Error 3'),
      ];
      
      const multiError = new MultiError(errors, 'Multiple errors');
      const validationErrors = multiError.getErrorsByType(ValidationError as new (...args: unknown[]) => ValidationError);
      
      expect(validationErrors).toHaveLength(2);
      expect(validationErrors[0]).toBeInstanceOf(ValidationError);
    });

    it('should check if contains error type', () => {
      const errors = [
        new ValidationError('Error 1'),
        new NetworkError('Error 2'),
      ];
      
      const multiError = new MultiError(errors, 'Multiple errors');
      
      expect(multiError.hasErrorType(ValidationError as new (...args: unknown[]) => ValidationError)).toBe(true);
      expect(multiError.hasErrorType(ConfigurationError as new (...args: unknown[]) => ConfigurationError)).toBe(false);
    });

    it('should serialize to JSON', () => {
      const errors = [
        new ValidationError('Error 1'),
        new Error('Error 2'),
      ];
      
      const multiError = new MultiError(errors, 'Multiple errors');
      const json = multiError.toJSON();
      
      expect(json).toMatchObject({
        name: 'MultiError',
        message: 'Multiple errors',
        errorId: multiError.errorId,
        timestamp: multiError.timestamp,
      });
      expect(json['errors']).toHaveLength(2);
      expect((json['errors'] as unknown[])[0]).toMatchObject({
        name: 'ValidationError',
        message: 'Error 1',
      });
    });
  });

  describe('Type Guards', () => {
    it('should identify Error instances', () => {
      expect(isError(new Error())).toBe(true);
      expect(isError(new ValidationError('test'))).toBe(true);
      expect(isError('not an error')).toBe(false);
      expect(isError(null)).toBe(false);
      expect(isError(undefined)).toBe(false);
    });

    it('should identify BaseError instances', () => {
      expect(isBaseError(new ValidationError('test'))).toBe(true);
      expect(isBaseError(new NetworkError('test'))).toBe(true);
      expect(isBaseError(new Error('test'))).toBe(false);
      expect(isBaseError('not an error')).toBe(false);
    });

    it('should identify retryable errors', () => {
      expect(isRetryableError(new NetworkError('test'))).toBe(true);
      expect(isRetryableError(new IntegrationError('test'))).toBe(true);
      expect(isRetryableError(new ValidationError('test'))).toBe(false);
      
      // Check network error patterns
      expect(isRetryableError(new Error('ECONNREFUSED'))).toBe(true);
      expect(isRetryableError(new Error('ETIMEDOUT'))).toBe(true);
      expect(isRetryableError(new Error('fetch failed'))).toBe(true);
      expect(isRetryableError(new Error('Other error'))).toBe(false);
    });
  });

  describe('Error Wrapping', () => {
    it('should wrap non-BaseError in BaseError', () => {
      const originalError = new Error('Original');
      const wrapped = wrapError(originalError, 'Wrapped message');
      
      expect(wrapped).toBeInstanceOf(BaseError);
      expect(wrapped.message).toBe('Wrapped message');
      expect(wrapped.cause).toBe(originalError);
      expect(wrapped.code).toBe('WRAPPED_ERROR');
    });

    it('should return BaseError as-is', () => {
      const error = new ValidationError('Test');
      const wrapped = wrapError(error);
      
      expect(wrapped).toBe(error);
    });

    it('should wrap non-Error values', () => {
      const wrapped = wrapError('string error', 'Wrapped');
      
      expect(wrapped).toBeInstanceOf(BaseError);
      expect(wrapped.message).toBe('Wrapped');
      expect(wrapped.cause).toBeInstanceOf(Error);
      expect((wrapped.cause as Error).message).toBe('string error');
    });

    it('should use custom options when wrapping', () => {
      const wrapped = wrapError('error', 'Wrapped', {
        code: 'CUSTOM_CODE',
        severity: ErrorSeverity.HIGH,
        context: { custom: true },
      });
      
      expect(wrapped.code).toBe('CUSTOM_CODE');
      expect(wrapped.severity).toBe(ErrorSeverity.HIGH);
      expect(wrapped.context['custom']).toBe(true);
    });
  });

  describe('HTTP Response Errors', () => {
    it('should create ValidationError for 400', async () => {
      const response = new Response('Bad Request', {
        status: 400,
        statusText: 'Bad Request',
      });
      
      const error = await createErrorFromResponse(response);
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('HTTP 400: Bad Request - Bad Request');
      expect(error.statusCode).toBe(400);
    });

    it('should create PermissionError for 401/403', async () => {
      const response401 = new Response('Unauthorized', {
        status: 401,
        statusText: 'Unauthorized',
      });
      
      const error401 = await createErrorFromResponse(response401);
      expect(error401).toBeInstanceOf(PermissionError);
      
      const response403 = new Response('Forbidden', {
        status: 403,
        statusText: 'Forbidden',
      });
      
      const error403 = await createErrorFromResponse(response403);
      expect(error403).toBeInstanceOf(PermissionError);
    });

    it('should create ResourceError for 404', async () => {
      const response = new Response('Not Found', {
        status: 404,
        statusText: 'Not Found',
      });
      
      const error = await createErrorFromResponse(response);
      
      expect(error).toBeInstanceOf(ResourceError);
      expect(error.statusCode).toBe(404);
    });

    it('should create BusinessLogicError for 422', async () => {
      const response = new Response('Unprocessable Entity', {
        status: 422,
        statusText: 'Unprocessable Entity',
      });
      
      const error = await createErrorFromResponse(response);
      
      expect(error).toBeInstanceOf(BusinessLogicError);
      expect(error.statusCode).toBe(422);
    });

    it('should create NetworkError for 502/503/504', async () => {
      const statuses = [502, 503, 504];
      
      for (const status of statuses) {
        const response = new Response('Error', { status });
        const error = await createErrorFromResponse(response);
        
        expect(error).toBeInstanceOf(NetworkError);
        expect(error.statusCode).toBe(status);
      }
    });

    it('should parse JSON error response', async () => {
      const errorData = {
        message: 'Custom error message',
        code: 'CUSTOM_ERROR',
        details: { field: 'value' },
      };
      
      const response = new Response(JSON.stringify(errorData), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
      
      const error = await createErrorFromResponse(response);
      
      expect(error.message).toBe('Custom error message');
      expect(error.context['details']).toEqual({ field: 'value' });
    });

    it('should handle non-JSON responses', async () => {
      const response = new Response('Plain text error', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
      
      const error = await createErrorFromResponse(response);
      
      expect(error.message).toContain('Plain text error');
    });

    it('should include response context', async () => {
      const response = new Response('Error', {
        status: 500,
        headers: { 'X-Request-ID': 'req-123' },
      });
      
      const context = { userId: 'user123' };
      const error = await createErrorFromResponse(response, context);
      
      expect(error.context['userId']).toBe('user123');
      expect(error.context['url']).toBeDefined();
      expect(error.context['status']).toBe(500);
      expect(error.context['headers']).toMatchObject({
        'x-request-id': 'req-123',
      });
    });
  });
});