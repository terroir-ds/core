/**
 * @module test/lib/utils/async/helpers/messages
 * 
 * Unit tests for async error message utilities
 * 
 * Tests message generation including:
 * - AsyncErrorMessages for error conditions
 * - AsyncWarnings for warning conditions
 * - AsyncDebugMessages for debug information
 * - getErrorMessage helper for dynamic messages
 * - Parameter validation messages
 * - Type error messages
 * - Rate limiting messages
 * - Message consistency and formatting
 * - Dynamic message generation with parameters
 */

import { describe, it, expect } from 'vitest';
import {
  AsyncErrorMessages,
  AsyncWarnings,
  AsyncDebugMessages,
  getErrorMessage,
} from '@utils/async/helpers/messages';

describe('messages helpers', () => {
  describe('AsyncErrorMessages', () => {
    it('should provide static messages', () => {
      expect(AsyncErrorMessages.ABORTED).toBe('Operation aborted');
      expect(AsyncErrorMessages.NO_PROMISES).toBe('No promises provided');
      expect(AsyncErrorMessages.INVALID_DELAY).toBe('Delay must be a non-negative number');
      expect(AsyncErrorMessages.EMPTY_ARRAY).toBe('Array must not be empty');
    });

    it('should provide dynamic messages with parameters', () => {
      expect(AsyncErrorMessages.TIMEOUT(1000)).toBe('Operation timed out after 1000ms');
      expect(AsyncErrorMessages.TIMEOUT(500)).toBe('Operation timed out after 500ms');
      
      expect(AsyncErrorMessages.ABORTED_WITH_REASON('User cancelled'))
        .toBe('Operation aborted: User cancelled');
      
      expect(AsyncErrorMessages.INVALID_DELAY_VALUE('abc'))
        .toBe('Invalid delay value: abc');
      
      expect(AsyncErrorMessages.RETRY_LIMIT_EXCEEDED(3))
        .toBe('Retry limit exceeded after 3 attempts');
    });

    it('should provide parameter validation messages', () => {
      expect(AsyncErrorMessages.INVALID_PARAMETER('timeout', 'positive number'))
        .toBe('Invalid parameter "timeout": expected positive number');
      
      expect(AsyncErrorMessages.REQUIRED_PARAMETER('callback'))
        .toBe('Required parameter "callback" is missing');
    });

    it('should provide type error messages', () => {
      expect(AsyncErrorMessages.INVALID_FUNCTION).toBe('Expected a function');
      expect(AsyncErrorMessages.INVALID_PROMISE).toBe('Expected a Promise');
      expect(AsyncErrorMessages.INVALID_ARRAY).toBe('Expected an array');
      expect(AsyncErrorMessages.INVALID_NUMBER).toBe('Expected a number');
    });

    it('should provide rate limiting messages', () => {
      expect(AsyncErrorMessages.RATE_LIMIT_EXCEEDED).toBe('Rate limit exceeded');
      expect(AsyncErrorMessages.TOKEN_COUNT_INVALID).toBe('Token count must be positive');
      expect(AsyncErrorMessages.MAX_TOKENS_INVALID).toBe('Maximum tokens must be positive');
      expect(AsyncErrorMessages.REFILL_RATE_INVALID).toBe('Refill rate must be positive');
    });
  });

  describe('getErrorMessage', () => {
    it('should return static messages', () => {
      expect(getErrorMessage('ABORTED')).toBe('Operation aborted');
      expect(getErrorMessage('NO_PROMISES')).toBe('No promises provided');
    });

    it('should return dynamic messages with arguments', () => {
      expect(getErrorMessage('TIMEOUT', 2000)).toBe('Operation timed out after 2000ms');
      expect(getErrorMessage('RETRY_LIMIT_EXCEEDED', 5))
        .toBe('Retry limit exceeded after 5 attempts');
    });

    it('should handle multiple arguments', () => {
      expect(getErrorMessage('INVALID_PARAMETER', 'limit', 'number between 1 and 100'))
        .toBe('Invalid parameter "limit": expected number between 1 and 100');
    });
  });

  describe('AsyncWarnings', () => {
    it('should provide warning messages', () => {
      expect(AsyncWarnings.CLEANUP_FAILED(3)).toBe('3 cleanup operations failed');
      
      expect(AsyncWarnings.PARTIAL_BATCH_FAILURE(5, 10))
        .toBe('5 of 10 batch operations failed');
      
      expect(AsyncWarnings.SLOW_OPERATION('fetchData', 5000))
        .toBe('Operation "fetchData" is taking longer than expected (5000ms)');
      
      expect(AsyncWarnings.MEMORY_PRESSURE)
        .toBe('High memory usage detected in async operation');
    });
  });

  describe('AsyncDebugMessages', () => {
    it('should provide debug messages', () => {
      expect(AsyncDebugMessages.OPERATION_START('batchProcess'))
        .toBe('Starting async operation: batchProcess');
      
      expect(AsyncDebugMessages.OPERATION_COMPLETE('fetchData', 250))
        .toBe('Completed async operation: fetchData in 250ms');
      
      expect(AsyncDebugMessages.RETRY_ATTEMPT(2, 5))
        .toBe('Retry attempt 2 of 5');
      
      expect(AsyncDebugMessages.RATE_LIMIT_WAIT(500))
        .toBe('Waiting 500ms due to rate limit');
      
      expect(AsyncDebugMessages.SIGNAL_RECEIVED('abort'))
        .toBe('Received signal: abort');
    });
  });

  describe('message consistency', () => {
    it('should have consistent formatting', () => {
      // Check that all timeout-related messages use 'ms' suffix
      expect(AsyncErrorMessages.TIMEOUT(100)).toContain('ms');
      expect(AsyncWarnings.SLOW_OPERATION('test', 100)).toContain('ms');
      expect(AsyncDebugMessages.OPERATION_COMPLETE('test', 100)).toContain('ms');
      expect(AsyncDebugMessages.RATE_LIMIT_WAIT(100)).toContain('ms');
    });

    it('should use consistent terminology', () => {
      // Check that abort-related messages use consistent terms
      expect(AsyncErrorMessages.ABORTED).toContain('aborted');
      expect(AsyncErrorMessages.ABORTED_WITH_REASON('test')).toContain('aborted');
      
      // Check that invalid parameter messages are consistent
      expect(AsyncErrorMessages.INVALID_DELAY).toContain('must be');
      expect(AsyncErrorMessages.INVALID_CHUNK_SIZE).toContain('must be');
      expect(AsyncErrorMessages.INVALID_CONCURRENCY).toContain('must be');
    });
  });
});