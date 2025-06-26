/**
 * Error handling utilities and helpers
 * 
 * Features:
 * - Global error handlers
 * - Promise rejection handling
 * - Error formatting
 * - Error recovery strategies
 */

import { isBaseError, wrapError, ErrorSeverity } from './base-error.js';
import { logger } from '../logger.js';
import type { LogContext } from '../types/logger.types.js';

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
 * Register a global error handler
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
 * Handle error with all registered handlers
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
 * Try to recover from an error
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
 * Create a function that handles its own errors
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
 * Setup global error handlers for Node.js
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
 * Format error for display
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