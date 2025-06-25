/**
 * Structured logging utility for Terroir Core Design System
 * 
 * Features:
 * - Environment-aware configuration
 * - Consistent log formatting
 * - Performance optimized with pino
 * - TypeScript-friendly API
 * - Security: No sensitive data logging
 * - Follows OpenTelemetry conventions
 */

import pino from 'pino';
import type { Logger, LoggerOptions, TransportTargetOptions } from 'pino';
import path from 'node:path';

// Type definitions
type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
type Environment = 'development' | 'production' | 'test';

interface LogContext {
  [key: string]: unknown;
}

interface PerformanceMetrics {
  operation: string;
  duration: number;
  durationUnit: 'ms';
}

// Environment detection
const NODE_ENV = (process.env['NODE_ENV'] || 'development') as Environment;
const LOG_LEVEL = (process.env['LOG_LEVEL'] || (NODE_ENV === 'production' ? 'info' : 'debug')) as LogLevel;
const IS_CI = process.env['CI'] === 'true';
const IS_TEST = process.env['NODE_ENV'] === 'test' || process.argv.includes('--test');

// Get script name for context
const getScriptName = (): string => {
  try {
    const scriptPath = process.argv[1];
    if (scriptPath) {
      return path.basename(scriptPath, path.extname(scriptPath));
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
};

// Custom serializers
const serializers: LoggerOptions['serializers'] = {
  err: pino.stdSerializers.err,
  error: pino.stdSerializers.err,
  // Custom serializer to redact sensitive fields
  config: (config: Record<string, unknown>) => {
    const safe = { ...config };
    // Redact sensitive fields
    const sensitiveFields = ['token', 'password', 'secret', 'key', 'auth'];
    for (const field of sensitiveFields) {
      if (safe[field]) {
        safe[field] = '[REDACTED]';
      }
    }
    return safe;
  }
};

// Base configuration
const baseConfig: LoggerOptions = {
  level: LOG_LEVEL,
  // Base context for all logs
  base: {
    pid: process.pid,
    hostname: undefined, // Remove hostname for security
    script: getScriptName(),
    env: NODE_ENV,
  },
  // Consistent timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,
  // Error serialization
  serializers,
  // Custom error hook for additional error context
  hooks: {
    logMethod(inputArgs: unknown[], method) {
      // Add stack trace for errors in development
      if (NODE_ENV === 'development' && inputArgs[0] instanceof Error) {
        inputArgs[0] = {
          ...inputArgs[0],
          stack: inputArgs[0].stack
        };
      }
      return method.apply(this, inputArgs as Parameters<typeof method>);
    }
  }
};

// Development configuration with pretty printing
const devTransport: TransportTargetOptions = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    ignore: 'pid,hostname',
    translateTime: 'HH:MM:ss.l',
    messageFormat: '{script} | {msg}',
    errorLikeObjectKeys: ['err', 'error'],
    levelFirst: true,
    hideObject: false,
    singleLine: false,
  }
};

// Production configuration - structured JSON
const prodConfig: LoggerOptions = {
  ...baseConfig,
  // Add request ID support for tracing
  mixin() {
    return {
      requestId: (globalThis as any).__requestId,
      version: process.env['npm_package_version']
    };
  },
  // Redact sensitive paths
  redact: {
    paths: ['*.password', '*.token', '*.secret', '*.key', '*.auth', '*.email'],
    remove: true
  }
};

// Test configuration - minimal output
const testConfig: LoggerOptions = {
  ...baseConfig,
  level: 'error', // Only errors in tests
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: false,
      ignore: 'time,pid,hostname,script',
      messageFormat: '{msg}',
      singleLine: true,
    }
  }
};

// Create logger instance based on environment
let logger: Logger;

if (IS_TEST) {
  logger = pino(testConfig);
} else if (NODE_ENV === 'development' && !IS_CI) {
  logger = pino({
    ...baseConfig,
    transport: devTransport
  });
} else {
  logger = pino(prodConfig);
}

// Utility functions for common logging patterns

/**
 * Log the start of a process or script
 */
export const logStart = (processName: string, context: LogContext = {}): void => {
  logger.info({ ...context, phase: 'start' }, `Starting ${processName}`);
};

/**
 * Log successful completion
 */
export const logSuccess = (processName: string, context: LogContext = {}): void => {
  logger.info({ ...context, phase: 'complete', status: 'success' }, `✓ ${processName} completed successfully`);
};

/**
 * Log performance metrics
 */
export const logPerformance = (operation: string, duration: number, context: LogContext = {}): void => {
  logger.info({
    ...context,
    performance: {
      operation,
      duration,
      durationUnit: 'ms'
    } as PerformanceMetrics
  }, `${operation} took ${duration}ms`);
};

/**
 * Create a child logger with additional context
 */
export const createLogger = (context: LogContext): Logger => {
  return logger.child(context);
};

/**
 * Measure and log execution time
 */
export const measureTime = async <T>(
  operation: string, 
  fn: () => Promise<T>, 
  context: LogContext = {}
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = Math.round(performance.now() - start);
    logPerformance(operation, duration, { ...context, status: 'success' });
    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    logger.error({ 
      ...context, 
      err: error,
      performance: { operation, duration, durationUnit: 'ms' } as PerformanceMetrics,
      status: 'failed'
    }, `${operation} failed after ${duration}ms`);
    throw error;
  }
};

// Export logger instance and utility functions
export default logger;
export { logger };
export type { Logger, LogContext, PerformanceMetrics };