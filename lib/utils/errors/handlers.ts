/**
 * @module @utils/errors/handlers
 * 
 * Error handling utilities and recovery strategies for the Terroir Core Design System.
 * 
 * Provides comprehensive error handling infrastructure including global handlers,
 * recovery strategies, error boundaries, and graceful shutdown. Integrates with
 * the structured logging system to ensure all errors are properly tracked and
 * can be recovered from when possible.
 * 
 * Features:
 * - Global error handler registry
 * - Promise rejection handling
 * - Error recovery strategies
 * - Error boundaries for async operations
 * - Graceful shutdown handling
 * - Error formatting and extraction
 * - Assertion utilities
 * 
 * @example Global error handlers
 * ```typescript
 * import { setupGlobalErrorHandlers, registerErrorHandler } from '@utils/errors/handlers';
 * 
 * // Set up default handlers
 * setupGlobalErrorHandlers();
 * 
 * // Register custom handler
 * registerErrorHandler('metrics', async (error) => {
 *   await sendErrorMetrics(error);
 * });
 * ```
 * 
 * @example Error recovery
 * ```typescript
 * import { registerRecoveryStrategy, tryRecover } from '@utils/errors/handlers';
 * 
 * // Register recovery strategy
 * registerRecoveryStrategy('NETWORK_ERROR', async (error) => {
 *   await reconnectNetwork();
 *   return { recovered: true };
 * });
 * 
 * // Use recovery
 * try {
 *   await fetchData();
 * } catch (error) {
 *   const result = await tryRecover(error, defaultData);
 *   return result;
 * }
 * ```
 * 
 * @example Error boundaries
 * ```typescript
 * import { errorBoundary } from '@utils/errors/handlers';
 * 
 * const data = await errorBoundary(
 *   async () => fetchUserData(userId),
 *   {
 *     fallback: () => getCachedData(userId),
 *     onError: (error) => logger.warn('Using cached data', { error }),
 *     context: { userId }
 *   }
 * );
 * ```
 * 
 * @example Assertions
 * ```typescript
 * import { assert, assertDefined } from '@utils/errors/handlers';
 * 
 * function processUser(user: User | undefined) {
 *   assertDefined(user, 'User is required');
 *   assert(user.id > 0, 'Invalid user ID', 'INVALID_USER_ID');
 *   
 *   // user is now guaranteed to be defined with valid ID
 * }
 * ```
 */

import { isBaseError, wrapError, ErrorSeverity } from './base-error.js';
import { logger } from '../logger/index.js';
import type { LogContext } from '@utils/types/logger.types.js';

/**
 * Error handler function type
 */
export type ErrorHandler = (error: Error, context?: LogContext) => void | Promise<void>;

/**
 * Recovery strategy function type
 */
export type RecoveryStrategy<T = void> = (error: Error) => T | Promise<T>;

/**
 * Global error handlers registry
 */
const errorHandlers = new Map<string, ErrorHandler>();
const recoveryStrategies = new Map<string, RecoveryStrategy>();

/**
 * Registers a global error handler that will be called for all errors.
 * 
 * Error handlers are useful for centralized error processing like sending
 * metrics, alerting, or custom logging. Multiple handlers can be registered
 * and they will all be called concurrently when an error occurs.
 * 
 * @param name - Unique name for the handler
 * @param handler - Function to handle errors
 * 
 * @example
 * ```typescript
 * registerErrorHandler('metrics', async (error, context) => {
 *   await sendToMetricsService({
 *     errorId: error.errorId,
 *     severity: error.severity,
 *     ...context
 *   });
 * });
 * ```
 * 
 * @public
 */
export function registerErrorHandler(name: string, handler: ErrorHandler): void {
  errorHandlers.set(name, handler);
  logger.debug({ handlerName: name }, 'Registered error handler');
}

/**
 * Unregister a global error handler
 */
export function unregisterErrorHandler(name: string): void {
  errorHandlers.delete(name);
  logger.debug({ handlerName: name }, 'Unregistered error handler');
}

/**
 * Register a recovery strategy
 */
export function registerRecoveryStrategy(errorCode: string, strategy: RecoveryStrategy): void {
  recoveryStrategies.set(errorCode, strategy);
  logger.debug({ errorCode }, 'Registered recovery strategy');
}

/**
 * Handles an error by logging it and calling all registered error handlers.
 * 
 * Automatically wraps non-BaseError instances, logs based on severity,
 * and executes all registered handlers concurrently. Handlers that fail
 * won't prevent other handlers from running.
 * 
 * @param error - The error to handle
 * @param context - Additional context for logging
 * 
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   await handleError(error, { operation: 'riskyOperation', userId });
 * }
 * ```
 * 
 * @public
 */
export async function handleError(error: unknown, context?: LogContext): Promise<void> {
  const wrappedError = isBaseError(error) ? error : wrapError(error);
  
  // Log based on severity
  const logContext = {
    ...context,
    ...wrappedError.toLogContext(),
  };
  
  switch (wrappedError.severity) {
    case ErrorSeverity.CRITICAL:
      logger.fatal(logContext, wrappedError.message);
      break;
    case ErrorSeverity.HIGH:
      logger.error(logContext, wrappedError.message);
      break;
    case ErrorSeverity.MEDIUM:
      logger.warn(logContext, wrappedError.message);
      break;
    case ErrorSeverity.LOW:
      logger.info(logContext, wrappedError.message);
      break;
  }
  
  // Run all handlers
  const handlers = Array.from(errorHandlers.values());
  await Promise.allSettled(
    handlers.map(handler => handler(wrappedError, context))
  );
}

/**
 * Attempts to recover from an error using registered recovery strategies.
 * 
 * Looks up a recovery strategy based on the error code and executes it.
 * If recovery succeeds, returns the recovered value. If recovery fails
 * or no strategy exists, returns the default value.
 * 
 * @param error - The error to recover from
 * @param defaultValue - Value to return if recovery fails
 * @returns The recovered value or default
 * 
 * @example
 * ```typescript
 * // Register strategy
 * registerRecoveryStrategy('DB_CONNECTION_LOST', async () => {
 *   await reconnectDatabase();
 *   return true;
 * });
 * 
 * // Use recovery
 * const result = await tryRecover(error, cachedData);
 * ```
 * 
 * @public
 */
export async function tryRecover<T>(error: unknown, defaultValue?: T): Promise<T | undefined> {
  const wrappedError = isBaseError(error) ? error : wrapError(error);
  const strategy = recoveryStrategies.get(wrappedError.code);
  
  if (strategy) {
    try {
      logger.info(
        { errorCode: wrappedError.code },
        'Attempting error recovery'
      );
      const result = await strategy(wrappedError);
      logger.info(
        { errorCode: wrappedError.code },
        'Error recovery successful'
      );
      return result as T;
    } catch (recoveryError) {
      logger.error(
        {
          originalError: wrappedError.toLogContext(),
          recoveryError,
        },
        'Error recovery failed'
      );
    }
  }
  
  return defaultValue;
}

/**
 * Wraps a function to automatically handle its errors.
 * 
 * Creates a new function that catches and handles any errors thrown by
 * the original function. Useful for adding consistent error handling
 * to multiple functions.
 * 
 * @param fn - Function to wrap
 * @param options - Error handling options
 * @param options.defaultValue - Value to return on error
 * @param options.context - Additional logging context
 * @param options.rethrow - Whether to rethrow after handling
 * @returns Wrapped function with same signature
 * 
 * @example
 * ```typescript
 * const safeGetUser = withErrorHandling(
 *   async (id: string) => getUserById(id),
 *   {
 *     defaultValue: null,
 *     context: { service: 'user-service' }
 *   }
 * );
 * 
 * const user = await safeGetUser('123'); // Returns null on error
 * ```
 * 
 * @public
 */
export function withErrorHandling<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options?: {
    defaultValue?: ReturnType<T>;
    context?: LogContext;
    rethrow?: boolean;
  }
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      await handleError(error, options?.context);
      
      if (options?.rethrow) {
        throw error;
      }
      
      return options?.defaultValue;
    }
  }) as T;
}

/**
 * Create an error boundary for async operations
 */
export async function errorBoundary<T>(
  operation: () => Promise<T>,
  options?: {
    fallback?: T | (() => T | Promise<T>);
    onError?: (error: Error) => void | Promise<void>;
    context?: LogContext;
    retry?: boolean;
  }
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const wrappedError = isBaseError(error) ? error : wrapError(error);
    
    // Call error handler
    if (options?.onError) {
      await options.onError(wrappedError);
    } else {
      await handleError(wrappedError, options?.context);
    }
    
    // Try recovery
    const recovered = await tryRecover<T>(wrappedError);
    if (recovered !== undefined) {
      return recovered;
    }
    
    // Use fallback
    if (options?.fallback !== undefined) {
      return typeof options.fallback === 'function'
        ? await (options.fallback as () => T | Promise<T>)()
        : options.fallback;
    }
    
    // Re-throw if no fallback
    throw wrappedError;
  }
}

/**
 * Sets up global error handlers for Node.js process events.
 * 
 * Installs handlers for:
 * - Uncaught exceptions (logs and exits)
 * - Unhandled promise rejections (logs)
 * - Node.js warnings (logs)
 * - SIGTERM/SIGINT signals (graceful shutdown)
 * 
 * Should be called once at application startup.
 * 
 * @example
 * ```typescript
 * // In your main entry point
 * import { setupGlobalErrorHandlers } from '@utils/errors/handlers';
 * 
 * setupGlobalErrorHandlers();
 * ```
 * 
 * @public
 */
export function setupGlobalErrorHandlers(): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.fatal(
      {
        err: error,
        type: 'uncaughtException',
      },
      'Uncaught exception'
    );
    
    // Give logger time to flush
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger.error(
      {
        err: error,
        type: 'unhandledRejection',
        promise,
      },
      'Unhandled promise rejection'
    );
  });
  
  // Handle warnings
  process.on('warning', (warning: Error) => {
    logger.warn(
      {
        err: warning,
        type: 'warning',
      },
      'Node.js warning'
    );
  });
  
  // Handle SIGTERM/SIGINT for graceful shutdown
  const signals = ['SIGTERM', 'SIGINT'] as const;
  for (const signal of signals) {
    process.on(signal, () => {
      logger.info({ signal }, 'Received shutdown signal');
      
      // Perform cleanup
      gracefulShutdown()
        .then(() => {
          logger.info('Graceful shutdown complete');
          process.exit(0);
        })
        .catch((error) => {
          logger.error({ err: error }, 'Graceful shutdown failed');
          process.exit(1);
        });
    });
  }
  
  logger.info('Global error handlers initialized');
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(): Promise<void> {
  const shutdownTasks: Array<() => Promise<void>> = [];
  
  // Add your shutdown tasks here
  // For example: close database connections, finish pending requests, etc.
  
  // Execute all shutdown tasks with timeout
  const timeout = 30000; // 30 seconds
  const shutdownPromise = Promise.all(
    shutdownTasks.map(task => 
      task().catch(error => 
        logger.error({ err: error }, 'Shutdown task failed')
      )
    )
  );
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Shutdown timeout')), timeout);
  });
  
  try {
    await Promise.race([shutdownPromise, timeoutPromise]);
  } catch (error) {
    logger.error({ err: error }, 'Shutdown error');
    throw error;
  }
}

/**
 * Formats an error for human-readable display.
 * 
 * Creates a detailed string representation of an error including its
 * properties, context, cause chain, and stack trace. Useful for logging
 * or displaying errors in development.
 * 
 * @param error - Error to format
 * @param options - Formatting options
 * @param options.stack - Include stack trace (default: true)
 * @param options.cause - Include cause chain (default: true)
 * @param options.context - Include error context (default: true)
 * @returns Formatted error string
 * 
 * @example
 * ```typescript
 * catch (error) {
 *   console.error(formatError(error, { stack: false }));
 *   // Output:
 *   // ValidationError: Invalid email format
 *   //   Error ID: 123e4567-e89b-12d3-a456-426614174000
 *   //   Code: INVALID_EMAIL
 *   //   Severity: LOW
 *   //   Category: VALIDATION
 *   //   Context:
 *   //     email: "not-an-email"
 *   //     field: "email"
 * }
 * ```
 * 
 * @public
 */
export function formatError(error: unknown, options?: {
  stack?: boolean;
  cause?: boolean;
  context?: boolean;
}): string {
  const opts = {
    stack: true,
    cause: true,
    context: true,
    ...options,
  };
  
  if (!isBaseError(error)) {
    if (error instanceof Error) {
      return opts.stack && error.stack ? error.stack : error.message;
    }
    return String(error);
  }
  
  const parts: string[] = [
    `${error.name}: ${error.message}`,
    `  Error ID: ${error.errorId}`,
    `  Code: ${error.code}`,
    `  Severity: ${error.severity}`,
    `  Category: ${error.category}`,
  ];
  
  if (opts.context && Object.keys(error.context).length > 0) {
    parts.push('  Context:');
    for (const [key, value] of Object.entries(error.context)) {
      if (key !== 'errorId' && key !== 'timestamp') {
        parts.push(`    ${key}: ${JSON.stringify(value)}`);
      }
    }
  }
  
  if (opts.cause && error.cause) {
    parts.push('  Caused by:');
    const causeStr = formatError(error.cause, { ...opts, context: false });
    parts.push(...causeStr.split('\n').map(line => '    ' + line));
  }
  
  if (opts.stack && error.stack) {
    parts.push('  Stack:');
    parts.push(...error.stack.split('\n').slice(1).map(line => '  ' + line));
  }
  
  return parts.join('\n');
}

/**
 * Extract error details for debugging
 */
export function extractErrorDetails(error: unknown): Record<string, unknown> {
  if (!error) {
    return { error: 'No error provided' };
  }
  
  if (isBaseError(error)) {
    return error.toJSON();
  }
  
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause ? extractErrorDetails(error.cause) : undefined,
    };
  }
  
  if (typeof error === 'object') {
    try {
      // Try to safely extract properties
      return JSON.parse(JSON.stringify(error));
    } catch {
      return { error: String(error) };
    }
  }
  
  return { error: String(error) };
}

/**
 * Assert condition and throw error if false
 */
export function assert(
  condition: unknown,
  message: string,
  code: string = 'ASSERTION_FAILED'
): asserts condition {
  if (!condition) {
    throw wrapError(new Error(message), message, { code });
  }
}

/**
 * Assert value is defined (not null or undefined)
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw wrapError(new Error(message), message, {
      code: 'VALUE_UNDEFINED',
      context: { value },
    });
  }
}